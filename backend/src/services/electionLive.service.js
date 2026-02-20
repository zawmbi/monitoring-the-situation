/**
 * Election Live Service
 * Aggregates live election data from multiple free sources:
 * 1. Prediction markets (Polymarket + Kalshi) → derive race ratings & win probabilities
 * 2. FEC API → candidate lists & fundraising (Senate/House only)
 *
 * Refreshes every 15 minutes via background interval.
 * Frontend merges this with static fallback data.
 */

import { cacheService } from './cache.service.js';
import { polymarketService } from './polymarket.service.js';
import { kalshiService } from './kalshi.service.js';
import { predictitService } from './predictit.service.js';
import { fecService } from './fec.service.js';
import { googleCivicService } from './googleCivic.service.js';
import { wikipediaPollsService } from './wikipedia-polls.service.js';
import { voteHubService } from './votehub.service.js';
import { electionModelService } from './electionModel.service.js';

const CACHE_KEY = 'elections:live:v3'; // v3: integrated ensemble model
const CACHE_TTL = 900; // 15 minutes

// States with Senate races in 2026 (Class 2 + specials)
const SENATE_STATES = [
  'Alabama', 'Alaska', 'Arkansas', 'Colorado', 'Delaware', 'Florida', 'Georgia',
  'Idaho', 'Illinois', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine',
  'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Montana', 'Nebraska',
  'New Hampshire', 'New Jersey', 'New Mexico', 'North Carolina', 'Ohio', 'Oklahoma',
  'Oregon', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas',
  'Virginia', 'West Virginia', 'Wyoming',
];

// Special elections use different Wikipedia article naming
const SPECIAL_ELECTION_STATES = ['Florida'];

// States with Governor races in 2026
const GOVERNOR_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
  'Connecticut', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Iowa',
  'Kansas', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota',
  'Nebraska', 'Nevada', 'New Hampshire', 'New Mexico', 'New York', 'Ohio',
  'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina',
  'South Dakota', 'Tennessee', 'Texas', 'Vermont', 'Wisconsin', 'Wyoming',
];

// Competitive House districts to track in live markets
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

/**
 * Convert a D-win probability (0–1) to a rating string.
 * Thresholds tuned to match Cook Political Report scale.
 */
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

class ElectionLiveService {
  constructor() {
    this._memCache = null;
    this._memCacheTime = 0;
  }

  /**
   * Fetch all election-related markets from Polymarket + Kalshi in one shot.
   * Broadly search for "2026" with election-related boost keywords.
   */
  async _fetchAllElectionMarkets() {
    const required = ['2026'];
    const boost = ['senate', 'governor', 'election', 'midterm', 'congress', 'house', 'democrat', 'republican'];

    const [polyResults, kalshiResults, predictitResults] = await Promise.allSettled([
      polymarketService.getMarketsByTopic(required, boost, false),
      kalshiService.getMarketsByTopic(required, boost, false),
      predictitService.getMarketsByTopic(required, boost, false),
    ]);

    const polyMarkets = polyResults.status === 'fulfilled' ? polyResults.value : [];
    const kalshiMarkets = kalshiResults.status === 'fulfilled' ? kalshiResults.value : [];
    const predictitMarkets = predictitResults.status === 'fulfilled' ? predictitResults.value : [];

    return [...polyMarkets, ...kalshiMarkets, ...predictitMarkets];
  }

  /**
   * Try to match a market to a specific state + race type.
   * Returns a match score (0 = no match).
   */
  _matchMarketToRace(market, stateName, raceType, districtNum = null) {
    const text = normalizeText(`${market.question} ${market.description} ${market.rawSearchText || ''}`);

    // Must mention the state
    const stateNameLower = stateName.toLowerCase();
    const stateCode = (STATE_CODES[stateName] || '').toLowerCase();
    const hasState = text.includes(stateNameLower) ||
      (stateCode.length === 2 && new RegExp(`\\b${stateCode}\\b`).test(text));
    if (!hasState) return 0;

    // Must match race type
    const hasRaceType = raceType === 'senate'
      ? /\bsenat/.test(text)
      : raceType === 'governor'
        ? /\bgovern|\bgubern/.test(text)
        : /\bhouse\b|\bcongress|\bdistrict\b|\bcd\b/.test(text);
    if (!hasRaceType) return 0;

    // For House races, must mention the district number
    if (raceType === 'house' && districtNum != null) {
      const distStr = String(districtNum);
      const hasDistrict = text.includes(`district ${distStr}`) ||
        text.includes(`cd ${distStr}`) ||
        text.includes(`${stateCode} ${distStr}`) ||
        new RegExp(`\\b${stateCode} ?0?${distStr}\\b`).test(text);
      if (!hasDistrict) return 0;
    }

    // Filter out wrong years
    if (/202[0-4]|2028|2030|2032/.test(text) && !/2026/.test(text)) return 0;

    // Score: prefer higher volume and more specific matches
    let score = 1;
    if (/2026/.test(text)) score += 2;
    if (text.includes(stateNameLower)) score += 1; // Full state name > abbreviation
    if (districtNum != null && text.includes(`district ${String(districtNum)}`)) score += 1;
    score += Math.log10(Math.max(market.volume || 1, 1)); // Volume bonus

    return score;
  }

  /**
   * Extract D-win probability from a matched market.
   * Handles various outcome naming conventions.
   */
  _extractDemProbability(market) {
    const outcomes = market.outcomes || [];
    if (outcomes.length === 0) return null;

    // Look for explicit party outcomes
    for (const o of outcomes) {
      const name = normalizeText(o.name || '');
      if (/democrat|dem\b|blue/.test(name) && o.price != null) {
        return o.price;
      }
    }

    // Binary Yes/No market — check if question implies D win
    const qText = normalizeText(market.question || '');
    const isAboutDemWinning = /democrat.*win|will.*democrat|dem.*flip|blue.*wave/.test(qText);
    const isAboutRepWinning = /republican.*win|will.*republican|rep.*flip|gop.*win|red.*wave/.test(qText);

    if (outcomes.length >= 2) {
      const yesPrice = outcomes[0]?.price;
      if (isAboutDemWinning && yesPrice != null) return yesPrice;
      if (isAboutRepWinning && yesPrice != null) return 1 - yesPrice;
    }

    // Multi-outcome market — look for R outcome and infer D
    for (const o of outcomes) {
      const name = normalizeText(o.name || '');
      if (/republican|rep\b|gop|red/.test(name) && o.price != null) {
        return 1 - o.price;
      }
    }

    // Candidate name heuristics — check for known party affiliations in outcome names
    // This is a fallback; won't always work
    return null;
  }

  /**
   * Match all election markets to specific races and derive ratings.
   */
  _deriveRatingsFromMarkets(allMarkets) {
    const results = {};

    const allRaces = [
      ...SENATE_STATES.map(s => ({ state: s, type: 'senate' })),
      ...GOVERNOR_STATES.map(s => ({ state: s, type: 'governor' })),
      ...HOUSE_DISTRICTS.map(d => ({ state: d.state, type: 'house', district: d.district, code: d.code })),
    ];

    for (const race of allRaces) {
      // Score all markets against this race
      const scored = allMarkets
        .map(m => ({ market: m, score: this._matchMarketToRace(m, race.state, race.type, race.district || null) }))
        .filter(s => s.score > 0)
        .sort((a, b) => b.score - a.score);

      if (scored.length === 0) continue;

      const bestMatch = scored[0].market;
      const dProb = this._extractDemProbability(bestMatch);
      const derivedRating = probabilityToRating(dProb);

      const key = race.code ? `${race.state}:house:${race.code}` : `${race.state}:${race.type}`;
      results[key] = {
        state: race.state,
        raceType: race.type,
        district: race.code || null,
        derivedRating,
        dWinProb: dProb != null ? Math.round(dProb * 100) : null,
        rWinProb: dProb != null ? Math.round((1 - dProb) * 100) : null,
        marketQuestion: bestMatch.question,
        marketUrl: bestMatch.url,
        marketSource: bestMatch.source,
        marketVolume: bestMatch.volume,
        outcomes: (bestMatch.outcomes || []).slice(0, 4).map(o => ({
          name: o.name,
          price: o.price != null ? Math.round(o.price * 100) : null,
        })),
      };
    }

    return results;
  }

  /**
   * Format FEC fundraising numbers for display
   */
  _formatMoney(num) {
    num = Number(num);
    if (!num || isNaN(num)) return null;
    if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(0)}k`;
    return `$${num.toFixed(0)}`;
  }

  /**
   * Main method: fetch and aggregate all live election data.
   */
  async getLiveData() {
    const cacheKey = CACHE_KEY;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    // Stale memory fallback
    if (this._memCache && (Date.now() - this._memCacheTime) < 30 * 60 * 1000) {
      return this._memCache;
    }

    console.log('[ElectionLive] Fetching live election data...');

    try {
      // Fetch market data, FEC data, and Google Civic elections in parallel
      // FEC works with DEMO_KEY but may get rate-limited quickly; still try it
      // Build race type map for Wikipedia polls
      const senateRaceTypes = {};
      for (const s of SENATE_STATES) {
        senateRaceTypes[s] = { type: SPECIAL_ELECTION_STATES.includes(s) ? 'special' : 'regular' };
      }

      const [allMarkets, fecData, civicElections, wikiPollsResult, genericBallotResult, approvalResult] = await Promise.allSettled([
        this._fetchAllElectionMarkets(),
        fecService.getAllSenateCandidates().catch(err => {
          if (!fecService.isConfigured) {
            if (!this._fecDemoWarned) {
              console.log('[ElectionLive] FEC using DEMO_KEY — set FEC_API_KEY for reliable data');
              this._fecDemoWarned = true;
            }
          }
          return {};
        }),
        googleCivicService.isConfigured ? googleCivicService.getUpcomingElections() : Promise.resolve([]),
        wikipediaPollsService.fetchAllSenatePolls(senateRaceTypes).catch(err => {
          console.warn('[ElectionLive] Wikipedia polls failed:', err.message);
          return {};
        }),
        voteHubService.getGenericBallot().catch(err => {
          console.warn('[ElectionLive] VoteHub generic ballot failed:', err.message);
          return { polls: [], average: null };
        }),
        voteHubService.getApproval().catch(err => {
          console.warn('[ElectionLive] VoteHub approval failed:', err.message);
          return { polls: [], average: null };
        }),
      ]);

      const markets = allMarkets.status === 'fulfilled' ? allMarkets.value : [];
      const fecCandidates = fecData.status === 'fulfilled' ? fecData.value : {};
      const upcomingElections = civicElections.status === 'fulfilled' ? civicElections.value : [];
      const wikiPolls = wikiPollsResult.status === 'fulfilled' ? wikiPollsResult.value : {};
      const genericBallot = genericBallotResult.status === 'fulfilled' ? genericBallotResult.value : { polls: [], average: null };
      const approval = approvalResult.status === 'fulfilled' ? approvalResult.value : { polls: [], average: null };

      // ── Ensemble model: replaces single-market-pick with multi-source average ──
      // The model averages Polymarket + Kalshi + PredictIt probabilities (volume-weighted),
      // blends in Wikipedia polling, Cook PVI fundamentals, and Metaculus forecasts.
      // Falls back to the old single-market approach if the model fails.
      let marketRatings;
      let modelOutput = null;
      try {
        modelOutput = await electionModelService.computeModel();
        // Convert model raceModels to the marketRatings format the frontend expects
        marketRatings = {};
        for (const [key, model] of Object.entries(modelOutput.raceModels || {})) {
          marketRatings[key] = {
            state: model.state,
            raceType: model.raceType,
            district: model.district,
            derivedRating: model.rating,
            dWinProb: model.dWinProb,
            rWinProb: model.rWinProb,
            confidence: model.confidence,
            signalCount: model.signalCount,
            breakdown: model.breakdown,
            // Preserve market display info from the best source
            marketQuestion: model.marketConsensus?.sources?.[0]?.question || null,
            marketUrl: model.marketConsensus?.sources?.[0]?.url || null,
            marketSource: model.marketConsensus?.sourceCount > 1
              ? `${model.marketConsensus.sourceCount} markets`
              : model.marketConsensus?.sources?.[0]?.source || null,
            marketVolume: model.marketConsensus?.totalVolume || null,
            outcomes: model.marketConsensus?.sources?.[0]?.outcomes || [],
            // Polling info for display
            pollingMargin: model.pollingSignal?.margin || null,
            pollCount: model.pollingSignal?.pollCount || 0,
            pollingSources: model.pollingSignal?.sources || [],
            // Fundamentals
            pvi: model.fundamentals?.pvi || null,
            // Primary projections (per-party candidate win probabilities)
            primaryProjections: model.primaryProjections || null,
          };
        }
        console.log(`[ElectionLive] Ensemble model: ${Object.keys(marketRatings).length} races modeled`);
      } catch (modelErr) {
        console.warn('[ElectionLive] Model failed, falling back to single-market ratings:', modelErr.message);
        marketRatings = this._deriveRatingsFromMarkets(markets);
      }

      // Build FEC fundraising summaries by state
      const fecSummaries = {};
      for (const [stateCode, candidates] of Object.entries(fecCandidates)) {
        const byParty = {};
        for (const c of candidates) {
          if (!byParty[c.party]) byParty[c.party] = { total: 0, cashOnHand: 0, topCandidate: null };
          byParty[c.party].total += c.totalReceipts;
          byParty[c.party].cashOnHand += c.cashOnHand;
          if (!byParty[c.party].topCandidate || c.totalReceipts > byParty[c.party].topCandidate.totalReceipts) {
            byParty[c.party].topCandidate = c;
          }
        }
        fecSummaries[stateCode] = {
          candidates: candidates.slice(0, 10),
          fundraisingByParty: Object.fromEntries(
            Object.entries(byParty).map(([party, data]) => [
              party,
              {
                totalRaised: this._formatMoney(data.total),
                cashOnHand: this._formatMoney(data.cashOnHand),
                topCandidate: data.topCandidate?.name || null,
              },
            ])
          ),
        };
      }

      // Fetch independent expenditures for key competitive Senate races
      const ieResults = {};
      const keyStates = ['GA', 'NC', 'MI', 'PA', 'OH', 'TX', 'AZ', 'NV', 'WI', 'NH', 'ME', 'CO', 'VA', 'IA', 'AK'];
      if (fecService.isConfigured) {
        const iePromises = keyStates.map(async (sc) => {
          try {
            const ie = await fecService.getRaceExpenditures(sc, 'S');
            if (ie && ie.expenditureCount > 0) ieResults[sc] = ie;
          } catch (e) { /* skip */ }
        });
        await Promise.allSettled(iePromises);
      }

      // Build per-state FEC candidate lists for live candidate data
      const fecCandidatesByState = {};
      for (const [stateCode, candidates] of Object.entries(fecCandidates)) {
        fecCandidatesByState[stateCode] = candidates
          .sort((a, b) => b.totalReceipts - a.totalReceipts)
          .slice(0, 12)
          .map(c => ({
            name: c.name,
            party: c.party,
            totalRaised: c.totalReceipts,
            totalRaisedFormatted: this._formatMoney(c.totalReceipts),
            cashOnHand: c.cashOnHand,
            cashOnHandFormatted: this._formatMoney(c.cashOnHand),
            disbursements: c.totalDisbursements,
            disbursementsFormatted: this._formatMoney(c.totalDisbursements),
            incumbentChallenge: c.incumbentChallenge,
            candidateId: c.candidateId,
          }));
      }

      // Build compact polling data by state (only include states with polls)
      const pollingByState = {};
      for (const [state, data] of Object.entries(wikiPolls)) {
        if (data.polls && data.polls.length > 0) {
          pollingByState[state] = {
            generalPolls: (data.generalPolls || []).slice(0, 10),
            primaryPolls: (data.primaryPolls || []).slice(0, 10),
            fetchedAt: data.fetchedAt,
          };
        }
      }

      const result = {
        marketRatings,
        fecData: fecSummaries,
        fecCandidates: fecCandidatesByState,
        independentExpenditures: ieResults,
        upcomingElections,
        pollingData: {
          byState: pollingByState,
          genericBallot,
          approval,
        },
        // Model metadata (for frontend transparency display)
        model: modelOutput ? {
          version: modelOutput.meta?.version,
          signalWeights: modelOutput.meta?.signalWeights,
          stats: modelOutput.meta?.stats,
          computeTimeMs: modelOutput.meta?.computeTimeMs,
          sources: modelOutput.meta?.sources,
          senateProjection: modelOutput.national?.senateProjection,
        } : null,
        marketCount: markets.length,
        fecConfigured: fecService.isConfigured,
        civicConfigured: googleCivicService.isConfigured,
        timestamp: new Date().toISOString(),
      };

      // Cache
      await cacheService.set(cacheKey, result, CACHE_TTL);
      this._memCache = result;
      this._memCacheTime = Date.now();

      const ratingCount = Object.keys(marketRatings).length;
      const fecStateCount = Object.keys(fecSummaries).length;
      const pollStates = Object.keys(pollingByState).length;
      console.log(`[ElectionLive] Done: ${ratingCount} market ratings, ${fecStateCount} FEC states, ${pollStates} states w/ polls, ${markets.length} total markets`);

      return result;
    } catch (error) {
      console.error('[ElectionLive] Error:', error.message);
      // Return stale cache if available
      if (this._memCache) return this._memCache;
      return { marketRatings: {}, fecData: {}, marketCount: 0, fecConfigured: false, timestamp: new Date().toISOString() };
    }
  }

  /**
   * Get live data for a single state
   */
  async getStateData(stateName) {
    const all = await this.getLiveData();
    const senateKey = `${stateName}:senate`;
    const governorKey = `${stateName}:governor`;
    const stateCode = STATE_CODES[stateName] || '';

    // Collect House district ratings for this state
    const houseRatings = {};
    for (const [key, val] of Object.entries(all.marketRatings)) {
      if (key.startsWith(`${stateName}:house:`)) {
        const distCode = val.district || key.split(':')[2];
        houseRatings[distCode] = val;
      }
    }

    return {
      senate: all.marketRatings[senateKey] || null,
      governor: all.marketRatings[governorKey] || null,
      house: houseRatings,
      fec: all.fecData[stateCode] || null,
      independentExpenditures: (all.independentExpenditures || {})[stateCode] || null,
      upcomingElections: all.upcomingElections || [],
      timestamp: all.timestamp,
    };
  }
}

export const electionLiveService = new ElectionLiveService();
export default electionLiveService;
