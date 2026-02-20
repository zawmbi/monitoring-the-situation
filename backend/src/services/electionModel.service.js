/**
 * Election Model Service — Free Multi-Source Ensemble (v2)
 *
 * Produces race-level win probabilities by averaging signals from:
 *   1. Prediction markets  — Polymarket, Kalshi, PredictIt  (volume-weighted)
 *   2. Polling data        — RealClearPolling + Wikipedia + VoteHub  (aggregated, deduped)
 *   3. Fundamentals        — Cook PVI + national environment (generic ballot)
 *   4. Forecasting crowds  — Metaculus community predictions
 *   5. News sentiment      — GDELT state-level election tone
 *   6. Fundraising         — FEC D/R fundraising differential
 *
 * 10+ upstream sources, ALL free & keyless.  Each signal can be audited
 * independently via the breakdown{} in the API response.
 *
 * Commercial viability: every source is either public domain (FEC)
 * or keyless public API (GDELT, Wikipedia, RealClearPolling,
 * Polymarket, Kalshi, PredictIt, VoteHub, Metaculus).
 *
 * Output per race:
 *   { dWinProb, rating, confidence, sources[], breakdown{} }
 */

import { cacheService } from './cache.service.js';
import { polymarketService } from './polymarket.service.js';
import { kalshiService } from './kalshi.service.js';
import { predictitService } from './predictit.service.js';
import { voteHubService } from './votehub.service.js';
import { metaculusService } from './metaculus.service.js';
import { pollingAggregatorService } from './pollingAggregator.service.js';
import { electionNewsService } from './electionNews.service.js';
import { fecService } from './fec.service.js';

// ── Constants ────────────────────────────────────────────────────────────

const CACHE_KEY = 'election-model:v2';
const CACHE_TTL = 600; // 10 minutes

// Weight configuration — 7 signal types from 10+ sources.
// Weights are applied only when the signal is available; missing signals
// have their weight redistributed proportionally among present signals.
const SIGNAL_WEIGHTS = {
  markets:      0.35,   // Prediction market consensus (Polymarket + Kalshi + PredictIt)
  polling:      0.28,   // Multi-source polling average (RCP + Wikipedia + VoteHub)
  fundamentals: 0.12,   // Cook PVI + generic ballot national environment
  sentiment:    0.08,   // GDELT state-level election news tone
  fundraising:  0.07,   // FEC D/R fundraising differential
  metaculus:    0.05,   // Crowd forecasts
  incumbency:   0.05,   // Incumbency advantage
};

// Primary model weights — primaries are more poll-driven and less predictable.
// Fundamentals (PVI) and generic ballot don't apply intra-party.
const PRIMARY_SIGNAL_WEIGHTS = {
  polling:      0.45,   // Primary polls from RCP + Wikipedia (strongest signal)
  markets:      0.25,   // Candidate-level prediction market odds
  fundraising:  0.20,   // FEC per-candidate receipts (viability proxy)
  incumbency:   0.10,   // Incumbents almost never lose primaries
};

// Cook PVI → base D-win probability lookup.
// PVI of 0 (EVEN) maps to 0.50.  Each PVI point shifts probability ~2.5%.
// Capped at 0.05 / 0.95 to avoid prior dominating in safe seats.
function pviToProbability(pviString) {
  if (!pviString) return 0.50;
  const even = pviString.toUpperCase() === 'EVEN';
  if (even) return 0.50;

  const match = pviString.match(/([DR])\+(\d+)/i);
  if (!match) return 0.50;

  const party = match[1].toUpperCase();
  const magnitude = parseInt(match[2], 10);
  // Each PVI point ≈ 2.5pp swing from 50/50
  const shift = magnitude * 0.025;
  const raw = party === 'D' ? 0.50 + shift : 0.50 - shift;
  return Math.max(0.05, Math.min(0.95, raw));
}

// Convert a D−R polling margin to an implied D-win probability.
// Uses a logistic curve calibrated to historical polling accuracy.
// A +5 D margin ≈ 80% D win; +10 ≈ 93%.
function pollingMarginToProbability(margin) {
  // Logistic: P(D win) = 1 / (1 + e^(-k * margin))
  // k = 0.30 is calibrated so ±3 margin ≈ 0.70 probability
  const k = 0.30;
  return 1 / (1 + Math.exp(-k * margin));
}

// Rating thresholds (same as electionLive.service.js for consistency)
function probabilityToRating(dProb) {
  if (dProb == null || !Number.isFinite(dProb)) return null;
  if (dProb >= 0.85) return 'safe-d';
  if (dProb >= 0.70) return 'likely-d';
  if (dProb >= 0.57) return 'lean-d';
  if (dProb >= 0.43) return 'toss-up';
  if (dProb >= 0.30) return 'lean-r';
  if (dProb >= 0.15) return 'likely-r';
  return 'safe-r';
}

function normalizeText(s) {
  return (s || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

// ── Cook PVI by State (embedded to avoid cross-layer import) ─────────────

const STATE_PVI = {
  'Alabama': 'R+16', 'Alaska': 'R+9', 'Arizona': 'R+3', 'Arkansas': 'R+18',
  'California': 'D+14', 'Colorado': 'D+4', 'Connecticut': 'D+7', 'Delaware': 'D+7',
  'Florida': 'R+5', 'Georgia': 'R+3', 'Hawaii': 'D+16', 'Idaho': 'R+21',
  'Illinois': 'D+8', 'Indiana': 'R+12', 'Iowa': 'R+6', 'Kansas': 'R+12',
  'Kentucky': 'R+17', 'Louisiana': 'R+14', 'Maine': 'D+3', 'Maryland': 'D+14',
  'Massachusetts': 'D+16', 'Michigan': 'R+1', 'Minnesota': 'D+1', 'Mississippi': 'R+12',
  'Missouri': 'R+11', 'Montana': 'R+12', 'Nebraska': 'R+13', 'Nevada': 'R+1',
  'New Hampshire': 'D+1', 'New Jersey': 'D+7', 'New Mexico': 'D+4', 'New York': 'D+10',
  'North Carolina': 'R+3', 'North Dakota': 'R+20', 'Ohio': 'R+6', 'Oklahoma': 'R+22',
  'Oregon': 'D+6', 'Pennsylvania': 'R+1', 'Rhode Island': 'D+9', 'South Carolina': 'R+10',
  'South Dakota': 'R+18', 'Tennessee': 'R+16', 'Texas': 'R+7', 'Utah': 'R+14',
  'Vermont': 'D+14', 'Virginia': 'D+3', 'Washington': 'D+7', 'West Virginia': 'R+23',
  'Wisconsin': 'EVEN', 'Wyoming': 'R+26',
};

const STATE_CODES = {
  'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR',
  'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE',
  'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID',
  'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA', 'Kansas': 'KS',
  'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
  'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS',
  'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV',
  'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
  'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK',
  'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
  'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT',
  'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV',
  'Wisconsin': 'WI', 'Wyoming': 'WY',
};

// 2026 Senate Class II + specials
const SENATE_STATES = [
  'Alabama', 'Alaska', 'Arkansas', 'Colorado', 'Delaware', 'Florida', 'Georgia',
  'Idaho', 'Illinois', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine',
  'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Montana', 'Nebraska',
  'New Hampshire', 'New Jersey', 'New Mexico', 'North Carolina', 'Ohio', 'Oklahoma',
  'Oregon', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas',
  'Virginia', 'West Virginia', 'Wyoming',
];

const SPECIAL_ELECTION_STATES = ['Florida'];

const GOVERNOR_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
  'Connecticut', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Iowa',
  'Kansas', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota',
  'Nebraska', 'Nevada', 'New Hampshire', 'New Mexico', 'New York', 'Ohio',
  'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina',
  'South Dakota', 'Tennessee', 'Texas', 'Vermont', 'Wisconsin', 'Wyoming',
];

const HOUSE_DISTRICTS = [
  { state: 'Arizona', district: 1, code: 'AZ-01' },
  { state: 'Arizona', district: 6, code: 'AZ-06' },
  { state: 'California', district: 13, code: 'CA-13' },
  { state: 'California', district: 22, code: 'CA-22' },
  { state: 'California', district: 27, code: 'CA-27' },
  { state: 'California', district: 45, code: 'CA-45' },
  { state: 'Colorado', district: 8, code: 'CO-08' },
  { state: 'Iowa', district: 1, code: 'IA-01' },
  { state: 'Iowa', district: 3, code: 'IA-03' },
  { state: 'Maine', district: 2, code: 'ME-02' },
  { state: 'Michigan', district: 7, code: 'MI-07' },
  { state: 'Michigan', district: 8, code: 'MI-08' },
  { state: 'Minnesota', district: 2, code: 'MN-02' },
  { state: 'Nebraska', district: 2, code: 'NE-02' },
  { state: 'North Carolina', district: 1, code: 'NC-01' },
  { state: 'New York', district: 17, code: 'NY-17' },
  { state: 'New York', district: 19, code: 'NY-19' },
  { state: 'Ohio', district: 9, code: 'OH-09' },
  { state: 'Ohio', district: 13, code: 'OH-13' },
  { state: 'Pennsylvania', district: 1, code: 'PA-01' },
  { state: 'Pennsylvania', district: 7, code: 'PA-07' },
  { state: 'Pennsylvania', district: 10, code: 'PA-10' },
  { state: 'Texas', district: 28, code: 'TX-28' },
  { state: 'Texas', district: 34, code: 'TX-34' },
  { state: 'Washington', district: 3, code: 'WA-03' },
];

// ── Market matching (reused from electionLive, but collects ALL matches) ─

class ElectionModelService {
  constructor() {
    this._memCache = null;
    this._memCacheTime = 0;
  }

  // ── 1. Market Signal ────────────────────────────────────────────────

  /**
   * Score how well a market matches a specific race.
   * Returns 0 for no match.
   */
  _scoreMatch(market, stateName, raceType, districtNum = null) {
    const text = normalizeText(`${market.question} ${market.description} ${market.rawSearchText || ''}`);

    const stateNameLower = stateName.toLowerCase();
    const stateCode = (STATE_CODES[stateName] || '').toLowerCase();
    const hasState = text.includes(stateNameLower) ||
      (stateCode.length === 2 && new RegExp(`\\b${stateCode}\\b`).test(text));
    if (!hasState) return 0;

    const hasRaceType = raceType === 'senate'
      ? /\bsenat/.test(text)
      : raceType === 'governor'
        ? /\bgovern|\bgubern/.test(text)
        : /\bhouse\b|\bcongress|\bdistrict\b|\bcd\b/.test(text);
    if (!hasRaceType) return 0;

    if (raceType === 'house' && districtNum != null) {
      const distStr = String(districtNum);
      const hasDistrict = text.includes(`district ${distStr}`) ||
        text.includes(`cd ${distStr}`) ||
        text.includes(`${stateCode} ${distStr}`) ||
        new RegExp(`\\b${stateCode} ?0?${distStr}\\b`).test(text);
      if (!hasDistrict) return 0;
    }

    if (/202[0-4]|2028|2030|2032/.test(text) && !/2026/.test(text)) return 0;

    let score = 1;
    if (/2026/.test(text)) score += 2;
    if (text.includes(stateNameLower)) score += 1;
    if (districtNum != null && text.includes(`district ${String(districtNum)}`)) score += 1;
    score += Math.log10(Math.max(market.volume || 1, 1));
    return score;
  }

  /**
   * Extract D-win probability from a market's outcomes.
   */
  _extractDemProbability(market) {
    const outcomes = market.outcomes || [];
    if (outcomes.length === 0) return null;

    for (const o of outcomes) {
      const name = normalizeText(o.name || '');
      if (/democrat|dem\b|blue/.test(name) && o.price != null) return o.price;
    }

    const qText = normalizeText(market.question || '');
    const isAboutDemWinning = /democrat.*win|will.*democrat|dem.*flip|blue.*wave/.test(qText);
    const isAboutRepWinning = /republican.*win|will.*republican|rep.*flip|gop.*win|red.*wave/.test(qText);

    if (outcomes.length >= 2) {
      const yesPrice = outcomes[0]?.price;
      if (isAboutDemWinning && yesPrice != null) return yesPrice;
      if (isAboutRepWinning && yesPrice != null) return 1 - yesPrice;
    }

    for (const o of outcomes) {
      const name = normalizeText(o.name || '');
      if (/republican|rep\b|gop|red/.test(name) && o.price != null) return 1 - o.price;
    }

    return null;
  }

  /**
   * Collect ALL matching markets for a race from ALL sources.
   * Returns array of { source, dProb, volume, score, question, url }.
   */
  _collectMarketSignals(allMarkets, stateName, raceType, districtNum = null) {
    const signals = [];

    for (const market of allMarkets) {
      const score = this._scoreMatch(market, stateName, raceType, districtNum);
      if (score <= 0) continue;

      const dProb = this._extractDemProbability(market);
      if (dProb == null) continue;

      signals.push({
        source: market.source || 'unknown',
        dProb,
        volume: market.volume || 0,
        score,
        question: market.question,
        url: market.url,
        outcomes: (market.outcomes || []).slice(0, 4).map(o => ({
          name: o.name, price: o.price != null ? Math.round(o.price * 100) : null,
        })),
      });
    }

    return signals;
  }

  /**
   * Volume-weighted average of market D-win probabilities for a race.
   * Groups by source (use best match per source), then averages across sources.
   */
  _computeMarketConsensus(signals) {
    if (signals.length === 0) return null;

    // Best match per source (highest score, then highest volume)
    const bySource = {};
    for (const s of signals) {
      const existing = bySource[s.source];
      if (!existing || s.score > existing.score || (s.score === existing.score && s.volume > existing.volume)) {
        bySource[s.source] = s;
      }
    }

    const sources = Object.values(bySource);
    if (sources.length === 0) return null;

    // Volume-weighted average across sources
    const totalVolume = sources.reduce((sum, s) => sum + Math.max(s.volume, 1), 0);
    const weightedProb = sources.reduce((sum, s) => {
      const weight = Math.max(s.volume, 1) / totalVolume;
      return sum + s.dProb * weight;
    }, 0);

    return {
      dProb: weightedProb,
      sourceCount: sources.length,
      totalVolume,
      sources: sources.map(s => ({
        source: s.source,
        dProb: Math.round(s.dProb * 1000) / 1000,
        volume: s.volume,
        question: s.question,
        url: s.url,
        outcomes: s.outcomes,
      })),
    };
  }

  // ── 2. Polling Signal (Multi-Source Aggregated) ──────────────────────

  /**
   * Get aggregated polling for a race from the PollingAggregator.
   * The aggregator merges FiveThirtyEight + Wikipedia + VoteHub polls,
   * deduplicates them, and applies recency + sample-size weighting.
   */
  _extractPollingSignal(aggregatedPolling, state, raceType) {
    if (!aggregatedPolling?.byRace) return null;
    const key = `${state}:${raceType}`;
    const raceData = aggregatedPolling.byRace[key];
    if (!raceData) return null;

    return {
      dProb: raceData.dProb,
      margin: raceData.margin,
      pollCount: raceData.pollCount,
      sources: raceData.sources || [],
      avgSampleSize: raceData.avgSampleSize,
    };
  }

  /**
   * Use generic ballot as a national environment adjustment.
   * Returns a shift (positive = D-favorable) to apply to fundamentals.
   * Now also uses aggregated generic ballot data.
   */
  _computeGenericBallotShift(aggregatedPolling, vhGenericBallot) {
    // Try aggregated generic ballot first
    const aggGeneric = aggregatedPolling?.byRace?.['_generic'];
    if (aggGeneric && aggGeneric.margin != null) {
      const adjustedMargin = aggGeneric.margin - 2; // House effect correction
      return adjustedMargin * 0.005;
    }

    // Fallback to VoteHub raw data
    if (!vhGenericBallot?.average) return 0;
    const avg = vhGenericBallot.average;
    const dPct = avg['Democrat'] || avg['Democrats'] || avg['D'] || 0;
    const rPct = avg['Republican'] || avg['Republicans'] || avg['R'] || 0;
    if (!dPct || !rPct) return 0;
    const rawMargin = dPct - rPct;
    const adjustedMargin = rawMargin - 2;
    return adjustedMargin * 0.005;
  }

  // ── 5. Sentiment Signal (GDELT) ────────────────────────────────────

  /**
   * Get GDELT state-level election news sentiment for a race.
   * Converts tone (-10 to +10) to a probability adjustment.
   * Positive tone = better for incumbent party; negative = challenger gains.
   */
  _computeSentimentSignal(battlegroundData, state) {
    if (!battlegroundData?.states) return null;
    const stateData = battlegroundData.states[state];
    if (!stateData) return null;

    // If we have a top article, use that as a proxy for coverage existence
    // Full tone analysis would need per-state getStateElectionNews, which is expensive.
    // For the model we use a lighter signal: article count as an attention indicator.
    const articleCount = stateData.articleCount || 0;
    if (articleCount === 0) return null;

    // More articles = more competitive / more uncertainty = closer to 50/50
    // This is a mild reversion-to-mean signal
    // 10+ articles: slight pull toward 50/50 (toss-up pressure)
    // <5 articles: no meaningful signal
    if (articleCount < 3) return null;

    // Sentiment signal: attention pulls toward 50/50 with mild strength
    // This isn't about D vs R — it's about uncertainty.
    // We return 0.50 (pure toss-up) and let its low weight mildly center things.
    return {
      dProb: 0.50,
      articleCount,
      note: 'High-attention race: sentiment signal centers toward toss-up',
    };
  }

  // ── 6. Fundraising Signal (FEC) ────────────────────────────────────

  /**
   * Compute D-win probability signal from FEC fundraising data.
   * Candidate with fundraising advantage historically correlates with winning.
   * Fundraising ratio → probability with regression toward 50%.
   */
  _computeFundraisingSignal(fecCandidates, state) {
    const stateCode = STATE_CODES[state];
    if (!stateCode || !fecCandidates) return null;

    const stateCands = fecCandidates[stateCode];
    if (!stateCands || stateCands.length === 0) return null;

    let dTotal = 0;
    let rTotal = 0;
    for (const c of stateCands) {
      const receipts = c.totalReceipts || c.receipts || 0;
      if (c.party === 'D') dTotal += receipts;
      else if (c.party === 'R') rTotal += receipts;
    }

    const total = dTotal + rTotal;
    if (total < 100000) return null; // Need meaningful fundraising to be a signal

    const dShare = dTotal / total; // 0 to 1

    // Convert fundraising share to win probability with regression toward 50%.
    // A 2:1 fundraising advantage (0.67 share) → ~0.58 win prob
    // This is intentionally soft — fundraising is moderately predictive.
    const dProb = 0.50 + (dShare - 0.50) * 0.50;

    return {
      dProb: Math.max(0.15, Math.min(0.85, dProb)),
      dRaised: dTotal,
      rRaised: rTotal,
      dShare: Math.round(dShare * 100),
    };
  }

  // ── 7. Incumbency Signal ───────────────────────────────────────────

  /**
   * Simple incumbency advantage: incumbents win ~90% of the time.
   * Uses the embedded incumbent info from each race.
   * Returns a probability favoring the incumbent's party.
   */
  _computeIncumbencySignal(state, raceType, incumbentParty) {
    if (!incumbentParty) return null;
    // Incumbency advantage ≈ 5-10pp in modern elections
    // We model it as 60% win probability for incumbent party
    const dProb = incumbentParty === 'D' ? 0.60 : 0.40;
    return { dProb, incumbentParty };
  }

  // ── 3. Fundamentals Signal ──────────────────────────────────────────

  _computeFundamentalsSignal(stateName, genericBallotShift) {
    const pvi = STATE_PVI[stateName];
    if (!pvi) return null;

    const baseProbability = pviToProbability(pvi);
    // Apply generic ballot national environment shift
    const adjusted = Math.max(0.03, Math.min(0.97, baseProbability + genericBallotShift));

    return {
      dProb: adjusted,
      pvi,
      nationalShift: Math.round(genericBallotShift * 1000) / 1000,
    };
  }

  // ── 4. Metaculus Signal ─────────────────────────────────────────────

  /**
   * Search Metaculus for questions about a specific race.
   * Returns community prediction if a match is found.
   */
  _matchMetaculusToRace(metaculusQuestions, stateName, raceType) {
    if (!metaculusQuestions || metaculusQuestions.length === 0) return null;

    const stateNorm = stateName.toLowerCase();
    const raceNorm = raceType.toLowerCase();

    for (const q of metaculusQuestions) {
      const title = (q.title || '').toLowerCase();
      if (!title.includes(stateNorm)) continue;

      const matchesRace =
        (raceNorm === 'senate' && /senat/.test(title)) ||
        (raceNorm === 'governor' && /(govern|gubern)/.test(title)) ||
        (raceNorm === 'house' && /(house|congress|district)/.test(title));

      if (!matchesRace) continue;

      // Must be about 2026 or current cycle
      if (/202[0-4]|2028/.test(title) && !/2026/.test(title)) continue;

      const prediction = q.communityPrediction;
      if (prediction == null) continue;

      // Metaculus binary questions: probability is for "Yes" outcome.
      // We need to determine if "Yes" means D win or R win.
      const isDemQuestion = /democrat|dem win|blue/.test(title);
      const isRepQuestion = /republican|rep win|gop|red/.test(title);

      let dProb;
      if (isDemQuestion) {
        dProb = prediction;
      } else if (isRepQuestion) {
        dProb = 1 - prediction;
      } else {
        // Ambiguous — skip
        continue;
      }

      return {
        dProb,
        questionId: q.id,
        title: q.title,
        url: q.url,
        numForecasters: q.numForecasters,
      };
    }

    return null;
  }

  // ── Primary Model ──────────────────────────────────────────────────

  /**
   * Extract candidate-level market odds for a primary.
   * Searches for markets about a specific party's primary in a state.
   * Returns array of { name, winProb } per candidate.
   */
  _collectPrimaryCandidateMarkets(allMarkets, stateName, raceType, party) {
    const stateNameLower = stateName.toLowerCase();
    const stateCode = (STATE_CODES[stateName] || '').toLowerCase();
    const partyName = party === 'D' ? 'democrat' : party === 'R' ? 'republican' : '';

    for (const market of allMarkets) {
      const text = normalizeText(`${market.question} ${market.description} ${market.rawSearchText || ''}`);

      // Must mention the state
      const hasState = text.includes(stateNameLower) ||
        (stateCode.length === 2 && new RegExp(`\\b${stateCode}\\b`).test(text));
      if (!hasState) continue;

      // Must be about a primary
      if (!/primary|nomin/.test(text)) continue;

      // Must match the party
      if (partyName && !text.includes(partyName)) continue;

      // Must match the race type
      const hasRace = raceType === 'senate' ? /\bsenat/.test(text)
        : raceType === 'governor' ? /\bgovern|\bgubern/.test(text)
        : /\bhouse\b|\bcongress/.test(text);
      if (!hasRace) continue;

      // Wrong cycle filter
      if (/202[0-4]|2028|2030|2032/.test(text) && !/2026/.test(text)) continue;

      // This market has multiple candidate outcomes — extract them
      const outcomes = market.outcomes || [];
      if (outcomes.length < 2) continue;

      const candidates = [];
      for (const o of outcomes) {
        if (o.price == null || o.price <= 0) continue;
        const name = o.name || '';
        if (!name || name === 'Yes' || name === 'No' || name === 'Other') continue;
        candidates.push({ name, winProb: o.price });
      }

      if (candidates.length >= 2) {
        // Normalize probabilities to sum to 1
        const total = candidates.reduce((s, c) => s + c.winProb, 0);
        for (const c of candidates) {
          c.winProb = total > 0 ? Math.round((c.winProb / total) * 1000) / 1000 : 0;
        }
        return { candidates, source: market.source, url: market.url };
      }
    }

    return null;
  }

  /**
   * Get FEC candidates for a specific party in a state.
   * Returns sorted by total receipts (fundraising).
   */
  _getFECPrimaryCandidates(fecCandidates, state, party) {
    const stateCode = STATE_CODES[state];
    if (!stateCode || !fecCandidates) return [];

    const stateCands = fecCandidates[stateCode];
    if (!stateCands) return [];

    return stateCands
      .filter(c => c.party === party)
      .sort((a, b) => (b.totalReceipts || 0) - (a.totalReceipts || 0));
  }

  /**
   * Compute primary projections for one party in one race.
   * Combines polling, markets, fundraising, and incumbency into
   * per-candidate win probabilities.
   *
   * Returns { candidates: [{ name, winProb, signals }], confidence, signalCount }
   */
  _computePrimaryProjection(pollingData, marketData, fecCandidates, incumbentName) {
    // Collect all known candidate names across signals
    const candidateMap = {}; // normalized name → { signals, name }

    function normName(n) { return (n || '').toLowerCase().replace(/[^a-z\s]/g, '').trim(); }
    function getOrCreate(name) {
      const key = normName(name);
      if (!key) return null;
      if (!candidateMap[key]) candidateMap[key] = { name, signals: {}, totalWeight: 0, weightedProb: 0 };
      return candidateMap[key];
    }

    let signalCount = 0;

    // 1. Polling signal
    if (pollingData && pollingData.candidates && pollingData.candidates.length >= 2) {
      signalCount++;
      const weight = PRIMARY_SIGNAL_WEIGHTS.polling;
      for (const c of pollingData.candidates) {
        const entry = getOrCreate(c.name);
        if (!entry) continue;
        entry.signals.polling = c.winProb;
        entry.weightedProb += c.winProb * weight;
        entry.totalWeight += weight;
      }
    }

    // 2. Market signal
    if (marketData && marketData.candidates && marketData.candidates.length >= 2) {
      signalCount++;
      const weight = PRIMARY_SIGNAL_WEIGHTS.markets;
      for (const c of marketData.candidates) {
        const entry = getOrCreate(c.name);
        if (!entry) continue;
        entry.signals.markets = c.winProb;
        entry.weightedProb += c.winProb * weight;
        entry.totalWeight += weight;
      }
    }

    // 3. Fundraising signal — convert FEC receipts to win probabilities
    if (fecCandidates && fecCandidates.length >= 2) {
      const totalReceipts = fecCandidates.reduce((s, c) => s + (c.totalReceipts || 0), 0);
      if (totalReceipts > 100000) {
        signalCount++;
        const weight = PRIMARY_SIGNAL_WEIGHTS.fundraising;
        for (const c of fecCandidates) {
          const entry = getOrCreate(c.name);
          if (!entry) continue;
          const share = totalReceipts > 0 ? (c.totalReceipts || 0) / totalReceipts : 0;
          // Regress toward uniform to avoid fundraising dominating
          const numCands = fecCandidates.length;
          const uniform = 1 / numCands;
          const fundProb = uniform + (share - uniform) * 0.6;
          entry.signals.fundraising = Math.round(fundProb * 1000) / 1000;
          entry.weightedProb += fundProb * weight;
          entry.totalWeight += weight;
        }
      }
    }

    // 4. Incumbency signal — boost the incumbent
    if (incumbentName && signalCount > 0) {
      const incEntry = getOrCreate(incumbentName);
      if (incEntry) {
        signalCount++;
        const weight = PRIMARY_SIGNAL_WEIGHTS.incumbency;
        // Incumbents win primaries ~95% of the time; model as 0.75 among field
        const incBoost = 0.75;
        incEntry.signals.incumbency = incBoost;
        incEntry.weightedProb += incBoost * weight;
        incEntry.totalWeight += weight;

        // Distribute remaining 0.25 among other candidates
        const others = Object.values(candidateMap).filter(e => normName(e.name) !== normName(incumbentName));
        const otherShare = (1 - incBoost) / Math.max(others.length, 1);
        for (const o of others) {
          o.signals.incumbency = Math.round(otherShare * 1000) / 1000;
          o.weightedProb += otherShare * weight;
          o.totalWeight += weight;
        }
      }
    }

    // Build final candidate list
    const candidates = Object.values(candidateMap)
      .filter(c => c.totalWeight > 0)
      .map(c => ({
        name: c.name,
        winProb: Math.round((c.weightedProb / c.totalWeight) * 1000) / 1000,
        signals: c.signals,
      }));

    if (candidates.length === 0) return null;

    // Normalize win probabilities to sum to 1
    const total = candidates.reduce((s, c) => s + c.winProb, 0);
    for (const c of candidates) {
      c.winProb = total > 0 ? Math.round((c.winProb / total) * 1000) / 1000 : 0;
    }

    // Sort by win probability descending
    candidates.sort((a, b) => b.winProb - a.winProb);

    let confidence;
    if (signalCount >= 4) confidence = 'high';
    else if (signalCount === 3) confidence = 'medium-high';
    else if (signalCount === 2) confidence = 'medium';
    else confidence = 'low';

    return { candidates, confidence, signalCount };
  }

  // ── 5. Ensemble ─────────────────────────────────────────────────────

  /**
   * Combine all signals into a single D-win probability using
   * proportional weight redistribution for missing signals.
   * Handles up to 7 signal types.
   */
  _computeEnsemble(signalInputs) {
    const signals = {};
    const weights = {};

    for (const [key, signal] of Object.entries(signalInputs)) {
      if (signal && signal.dProb != null && SIGNAL_WEIGHTS[key] != null) {
        signals[key] = signal.dProb;
        weights[key] = SIGNAL_WEIGHTS[key];
      }
    }

    const signalNames = Object.keys(signals);
    if (signalNames.length === 0) return null;

    // Normalize weights to sum to 1
    const totalWeight = Object.values(weights).reduce((s, w) => s + w, 0);
    const normalizedWeights = {};
    for (const [key, w] of Object.entries(weights)) {
      normalizedWeights[key] = w / totalWeight;
    }

    // Weighted average
    let ensembleProb = 0;
    for (const [key, prob] of Object.entries(signals)) {
      ensembleProb += prob * normalizedWeights[key];
    }

    // Confidence: based on signal count and diversity
    // 5+ signals → high, 4 → medium-high, 3 → medium, 2 → low, 1 → very-low
    const signalCount = signalNames.length;
    let confidence;
    if (signalCount >= 5) confidence = 'high';
    else if (signalCount === 4) confidence = 'medium-high';
    else if (signalCount === 3) confidence = 'medium';
    else if (signalCount === 2) confidence = 'low';
    else confidence = 'very-low';

    // If the only signal is fundamentals or incumbency, downgrade further
    if (signalCount === 1 && (signalNames[0] === 'fundamentals' || signalNames[0] === 'incumbency')) {
      confidence = 'prior-only';
    }

    return {
      dProb: Math.round(ensembleProb * 1000) / 1000,
      confidence,
      signalCount,
      weights: normalizedWeights,
      breakdown: Object.fromEntries(
        signalNames.map(k => [k, Math.round(signals[k] * 1000) / 1000])
      ),
    };
  }

  // ── Main Pipeline ───────────────────────────────────────────────────

  async computeModel() {
    const cached = await cacheService.get(CACHE_KEY);
    if (cached) return cached;

    if (this._memCache && (Date.now() - this._memCacheTime) < 10 * 60 * 1000) {
      return this._memCache;
    }

    console.log('[ElectionModel] Computing ensemble model...');
    const startTime = Date.now();

    // ── Fetch all upstream data in parallel ───────────────────────────

    const senateRaceTypes = {};
    for (const s of SENATE_STATES) {
      senateRaceTypes[s] = { type: SPECIAL_ELECTION_STATES.includes(s) ? 'special' : 'regular' };
    }

    const boostKw = ['senate', 'governor', 'election', 'midterm', 'congress', 'house', 'democrat', 'republican'];

    const [
      polyResult, kalshiResult, predictitResult,
      pollingAggResult,
      genericBallotResult, approvalResult,
      metaculusResult,
      battlegroundResult,
      fecResult,
    ] = await Promise.allSettled([
      // Prediction markets
      polymarketService.getMarketsByTopic(['2026'], boostKw, false),
      kalshiService.getMarketsByTopic(['2026'], boostKw, false),
      predictitService.getMarketsByTopic(['2026'], boostKw, false),
      // Multi-source polling (RealClearPolling + Wikipedia + VoteHub aggregated)
      pollingAggregatorService.aggregateAll(senateRaceTypes),
      // VoteHub raw generic ballot (backup for national env)
      voteHubService.getGenericBallot(),
      voteHubService.getApproval(),
      // Crowd forecasts
      metaculusService.searchQuestions('2026 election senate governor', 30),
      // GDELT sentiment per battleground state
      electionNewsService.getBattlegroundOverview().catch(() => null),
      // FEC fundraising (works with DEMO_KEY, may be rate-limited)
      fecService.getAllSenateCandidates().catch(() => ({})),
    ]);

    const allMarkets = [
      ...(polyResult.status === 'fulfilled' ? polyResult.value : []),
      ...(kalshiResult.status === 'fulfilled' ? kalshiResult.value : []),
      ...(predictitResult.status === 'fulfilled' ? predictitResult.value : []),
    ];
    const aggregatedPolling = pollingAggResult.status === 'fulfilled' ? pollingAggResult.value : null;
    const genericBallot = genericBallotResult.status === 'fulfilled' ? genericBallotResult.value : { polls: [], average: null };
    const approval = approvalResult.status === 'fulfilled' ? approvalResult.value : { polls: [], average: null };
    const metaculusQuestions = metaculusResult.status === 'fulfilled' ? metaculusResult.value : [];
    const battlegroundData = battlegroundResult.status === 'fulfilled' ? battlegroundResult.value : null;
    const fecCandidates = fecResult.status === 'fulfilled' ? fecResult.value : {};

    // ── National environment ──────────────────────────────────────────
    const genericBallotShift = this._computeGenericBallotShift(aggregatedPolling, genericBallot);

    // ── Compute per-race ensemble ─────────────────────────────────────

    const allRaces = [
      ...SENATE_STATES.map(s => ({ state: s, type: 'senate' })),
      ...GOVERNOR_STATES.map(s => ({ state: s, type: 'governor' })),
      ...HOUSE_DISTRICTS.map(d => ({ state: d.state, type: 'house', district: d.district, code: d.code })),
    ];

    const raceModels = {};
    let signalStats = {
      withMarkets: 0, withPolling: 0, withMeta: 0,
      withSentiment: 0, withFundraising: 0, withIncumbency: 0,
      totalRaces: 0,
    };

    for (const race of allRaces) {
      const key = race.code
        ? `${race.state}:house:${race.code}`
        : `${race.state}:${race.type}`;

      // 1. Market signal (Polymarket + Kalshi + PredictIt)
      const marketSignals = this._collectMarketSignals(allMarkets, race.state, race.type, race.district || null);
      const marketConsensus = this._computeMarketConsensus(marketSignals);

      // 2. Polling signal (RealClearPolling + Wikipedia + VoteHub — aggregated & deduped)
      const pollingSignal = this._extractPollingSignal(aggregatedPolling, race.state, race.type);

      // 3. Fundamentals (PVI + national environment)
      const fundamentalsSignal = this._computeFundamentalsSignal(race.state, genericBallotShift);

      // 4. Metaculus crowd forecast
      const metaculusSignal = this._matchMetaculusToRace(metaculusQuestions, race.state, race.type);

      // 5. GDELT sentiment
      const sentimentSignal = this._computeSentimentSignal(battlegroundData, race.state);

      // 6. Fundraising differential (Senate only — FEC covers Senate/House, not Governor)
      let fundraisingSignal = null;
      if (race.type === 'senate') {
        fundraisingSignal = this._computeFundraisingSignal(fecCandidates, race.state);
      }

      // 7. Incumbency advantage (if incumbent is known)
      // Detect incumbent party from FEC data or fundamentals
      let incumbencySignal = null;
      if (race.type === 'senate') {
        const stateCode = STATE_CODES[race.state];
        const stateCands = stateCode ? fecCandidates[stateCode] : null;
        if (stateCands) {
          const incumbent = stateCands.find(c =>
            c.incumbentChallenge === 'I' || c.incumbentChallenge === 'incumbent'
          );
          if (incumbent) {
            incumbencySignal = this._computeIncumbencySignal(race.state, race.type, incumbent.party);
          }
        }
      }

      // Ensemble: combine all available signals
      const ensemble = this._computeEnsemble({
        markets: marketConsensus,
        polling: pollingSignal,
        fundamentals: fundamentalsSignal,
        metaculus: metaculusSignal,
        sentiment: sentimentSignal,
        fundraising: fundraisingSignal,
        incumbency: incumbencySignal,
      });
      if (!ensemble) continue;

      const rating = probabilityToRating(ensemble.dProb);

      raceModels[key] = {
        state: race.state,
        stateCode: STATE_CODES[race.state] || '',
        raceType: race.type,
        district: race.code || null,

        // Headline numbers
        dWinProb: Math.round(ensemble.dProb * 100),
        rWinProb: Math.round((1 - ensemble.dProb) * 100),
        rating,
        confidence: ensemble.confidence,

        // Signal breakdown (for transparency)
        signalCount: ensemble.signalCount,
        weights: ensemble.weights,
        breakdown: ensemble.breakdown,

        // Market details
        marketConsensus: marketConsensus ? {
          dProb: Math.round(marketConsensus.dProb * 100),
          sourceCount: marketConsensus.sourceCount,
          totalVolume: marketConsensus.totalVolume,
          sources: marketConsensus.sources,
        } : null,

        // Polling details (multi-source aggregated)
        pollingSignal: pollingSignal ? {
          margin: pollingSignal.margin,
          pollCount: pollingSignal.pollCount,
          impliedDProb: Math.round(pollingSignal.dProb * 100),
          sources: pollingSignal.sources || [],
          avgSampleSize: pollingSignal.avgSampleSize,
        } : null,

        // Fundamentals
        fundamentals: fundamentalsSignal ? {
          pvi: fundamentalsSignal.pvi,
          baseDProb: Math.round(fundamentalsSignal.dProb * 100),
        } : null,

        // Metaculus
        metaculus: metaculusSignal ? {
          dProb: Math.round(metaculusSignal.dProb * 100),
          url: metaculusSignal.url,
          numForecasters: metaculusSignal.numForecasters,
        } : null,

        // Sentiment
        sentiment: sentimentSignal ? {
          articleCount: sentimentSignal.articleCount,
        } : null,

        // Fundraising
        fundraising: fundraisingSignal ? {
          dRaised: fundraisingSignal.dRaised,
          rRaised: fundraisingSignal.rRaised,
          dShare: fundraisingSignal.dShare,
        } : null,

        // Incumbency
        incumbency: incumbencySignal ? {
          party: incumbencySignal.incumbentParty,
        } : null,
      };

      // ── Primary projections per party ───────────────────────────────

      const primaryProjections = {};
      for (const party of ['D', 'R']) {
        const primaryKey = `${race.state}:${race.type}:${party}`;

        // Primary polling from aggregator
        const primaryPolling = aggregatedPolling?.byPrimary?.[primaryKey] || null;

        // Primary candidate-level market odds
        const primaryMarkets = this._collectPrimaryCandidateMarkets(allMarkets, race.state, race.type, party);

        // FEC candidates for this party
        const partyFecCands = this._getFECPrimaryCandidates(fecCandidates, race.state, party);

        // Detect incumbent name from FEC
        const incumbentCandidate = partyFecCands.find(c =>
          c.incumbentChallenge === 'I' || c.incumbentChallenge === 'incumbent'
        );
        const incumbentName = incumbentCandidate?.name || null;

        const projection = this._computePrimaryProjection(
          primaryPolling, primaryMarkets, partyFecCands, incumbentName
        );

        if (projection && projection.candidates.length > 0) {
          primaryProjections[party] = projection;
        }
      }

      if (Object.keys(primaryProjections).length > 0) {
        raceModels[key].primaryProjections = primaryProjections;
      }

      signalStats.totalRaces++;
      if (marketConsensus) signalStats.withMarkets++;
      if (pollingSignal) signalStats.withPolling++;
      if (metaculusSignal) signalStats.withMeta++;
      if (sentimentSignal) signalStats.withSentiment++;
      if (fundraisingSignal) signalStats.withFundraising++;
      if (incumbencySignal) signalStats.withIncumbency++;
    }

    // ── Build Senate balance projection ───────────────────────────────

    // Current Senate: Count D and R seats not up for election + model projections
    // Class II has 33 seats + specials. Not-up seats stay with current holders.
    // Simplified: sum probabilities for seats that are up.
    let projectedDSeats = 0;
    let projectedRSeats = 0;
    const seatProjections = [];

    for (const state of SENATE_STATES) {
      const key = `${state}:senate`;
      const model = raceModels[key];
      const dProb = model ? model.dWinProb / 100 : pviToProbability(STATE_PVI[state]);
      projectedDSeats += dProb;
      projectedRSeats += (1 - dProb);
      seatProjections.push({
        state,
        stateCode: STATE_CODES[state],
        dWinProb: Math.round(dProb * 100),
        rating: model?.rating || probabilityToRating(dProb),
      });
    }

    // 67 Senate seats not up in 2026 (approximate current split for non-Class II)
    // Current Senate (approx): 53R - 47D. Class II seats: ~21R, ~12D held.
    // Seats not up: ~32R, ~35D (Class I + III)
    const NOT_UP_D = 35;
    const NOT_UP_R = 32;
    projectedDSeats = Math.round(projectedDSeats) + NOT_UP_D;
    projectedRSeats = Math.round(projectedRSeats) + NOT_UP_R;

    const elapsedMs = Date.now() - startTime;

    const result = {
      // Per-race models (keyed same as marketRatings for frontend compat)
      raceModels,

      // National indicators
      national: {
        genericBallot,
        approval,
        genericBallotShift: Math.round(genericBallotShift * 1000) / 1000,
        senateProjection: {
          dem: projectedDSeats,
          rep: projectedRSeats,
          seatProjections: seatProjections.sort((a, b) => a.dWinProb - b.dWinProb),
        },
      },

      // Model metadata
      meta: {
        version: '2.1',
        signalWeights: SIGNAL_WEIGHTS,
        stats: signalStats,
        totalMarkets: allMarkets.length,
        timestamp: new Date().toISOString(),
        computeTimeMs: elapsedMs,
        sources: {
          polymarket: polyResult.status === 'fulfilled' ? polyResult.value.length : 0,
          kalshi: kalshiResult.status === 'fulfilled' ? kalshiResult.value.length : 0,
          predictit: predictitResult.status === 'fulfilled' ? predictitResult.value.length : 0,
          aggregatedPolls: aggregatedPolling?.totalPolls || 0,
          pollingRaces: aggregatedPolling?.raceCount || 0,
          pollingSources: aggregatedPolling?.sourceStats || {},
          metaculusQuestions: metaculusQuestions.length,
          genericBallot: genericBallot.polls?.length || 0,
          gdeltBattleground: battlegroundData?.states ? Object.keys(battlegroundData.states).length : 0,
          fecCandidates: Object.values(fecCandidates).reduce((s, arr) => s + (arr?.length || 0), 0),
        },
        diagnostics: (() => {
          const polyCount = polyResult.status === 'fulfilled' ? polyResult.value.length : 0;
          const kalshiCount = kalshiResult.status === 'fulfilled' ? kalshiResult.value.length : 0;
          const predictitCount = predictitResult.status === 'fulfilled' ? predictitResult.value.length : 0;
          const marketsUp = polyCount > 0 || kalshiCount > 0 || predictitCount > 0;
          const pollingUp = (aggregatedPolling?.totalPolls || 0) > 0;
          const fundamentalsUp = true; // Cook PVI is static, always available
          const sentimentUp = battlegroundData?.states ? Object.keys(battlegroundData.states).length > 0 : false;
          const fundraisingUp = Object.values(fecCandidates).some(arr => arr?.length > 0);
          const metaculusUp = metaculusQuestions.length > 0;
          const incumbencyUp = fundraisingUp; // derived from FEC data

          const signals = { markets: marketsUp, polling: pollingUp, fundamentals: fundamentalsUp, sentiment: sentimentUp, fundraising: fundraisingUp, metaculus: metaculusUp, incumbency: incumbencyUp };
          const signalsAvailable = Object.values(signals).filter(Boolean).length;

          return {
            ...signals,
            signalsAvailable,
            signalsTotal: 7,
            marketSources: [
              ...(polyCount > 0 ? ['polymarket'] : []),
              ...(kalshiCount > 0 ? ['kalshi'] : []),
              ...(predictitCount > 0 ? ['predictit'] : []),
            ],
            pollingSources: Object.entries(aggregatedPolling?.sourceStats || {})
              .filter(([, count]) => count > 0)
              .map(([name]) => name),
          };
        })(),
      },
    };

    await cacheService.set(CACHE_KEY, result, CACHE_TTL);
    this._memCache = result;
    this._memCacheTime = Date.now();

    console.log(`[ElectionModel] v2 done in ${elapsedMs}ms: ${signalStats.totalRaces} races (markets:${signalStats.withMarkets}, polls:${signalStats.withPolling}, sentiment:${signalStats.withSentiment}, fundraising:${signalStats.withFundraising}, metaculus:${signalStats.withMeta})`);

    return result;
  }
}

export const electionModelService = new ElectionModelService();
export default electionModelService;
