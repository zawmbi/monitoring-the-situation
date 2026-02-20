/**
 * Election Live Service — Prediction Markets Only
 *
 * Fetches live odds from Polymarket + Kalshi + PredictIt, matches them to
 * 2026 races, and derives win probabilities.  Refreshes every 2 minutes.
 *
 * No ensemble model, no polling aggregation, no FEC/GDELT/Metaculus.
 * Just real-time market prices.
 */

import { cacheService } from './cache.service.js';
import { polymarketService } from './polymarket.service.js';
import { kalshiService } from './kalshi.service.js';
import { predictitService } from './predictit.service.js';

const CACHE_KEY = 'elections:live:v6'; // v6: markets-only simplification
const CACHE_TTL = 120; // 2 minutes

// States with Senate races in 2026 (Class 2 + specials)
const SENATE_STATES = [
  'Alabama', 'Alaska', 'Arkansas', 'Colorado', 'Delaware', 'Florida', 'Georgia',
  'Idaho', 'Illinois', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine',
  'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Montana', 'Nebraska',
  'New Hampshire', 'New Jersey', 'New Mexico', 'North Carolina', 'Ohio', 'Oklahoma',
  'Oregon', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas',
  'Virginia', 'West Virginia', 'Wyoming',
];

// States with Governor races in 2026
const GOVERNOR_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
  'Connecticut', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Iowa',
  'Kansas', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota',
  'Nebraska', 'Nevada', 'New Hampshire', 'New Mexico', 'New York', 'Ohio',
  'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina',
  'South Dakota', 'Tennessee', 'Texas', 'Vermont', 'Wisconsin', 'Wyoming',
];

// Competitive House districts to track
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
   * Fetch all election markets from Polymarket + Kalshi + PredictIt.
   */
  async _fetchAllMarkets() {
    const required = ['2026'];
    const boost = ['senate', 'governor', 'election', 'midterm', 'congress', 'house', 'democrat', 'republican', 'primary'];

    const [polyResults, kalshiResults, predictitResults] = await Promise.allSettled([
      polymarketService.getMarketsByTopic(required, boost, false),
      kalshiService.getMarketsByTopic(required, boost, false),
      predictitService.getMarketsByTopic(required, boost, false),
    ]);

    return [
      ...(polyResults.status === 'fulfilled' ? polyResults.value : []),
      ...(kalshiResults.status === 'fulfilled' ? kalshiResults.value : []),
      ...(predictitResults.status === 'fulfilled' ? predictitResults.value : []),
    ];
  }

  /**
   * Score how well a market matches a specific race (0 = no match).
   * raceType can be: 'senate', 'governor', 'house',
   *   'senate-primary-r', 'senate-primary-d', 'governor-primary-r', 'governor-primary-d'
   */
  _scoreMatch(market, stateName, raceType, districtNum = null) {
    const text = normalizeText(`${market.question} ${market.description} ${market.rawSearchText || ''}`);

    const stateNameLower = stateName.toLowerCase();
    const stateCode = (STATE_CODES[stateName] || '').toLowerCase();
    const hasState = text.includes(stateNameLower) ||
      (stateCode.length === 2 && new RegExp(`\\b${stateCode}\\b`).test(text));
    if (!hasState) return 0;

    // Determine base office type and whether this is a primary race
    const isPrimary = raceType.includes('-primary-');
    const baseType = raceType.replace(/-primary-[rd]$/, '');
    const primaryParty = raceType.endsWith('-r') ? 'r' : raceType.endsWith('-d') ? 'd' : null;

    const hasOffice = baseType === 'senate'
      ? /\bsenat/.test(text)
      : baseType === 'governor'
        ? /\bgovern|\bgubern/.test(text)
        : /\bhouse\b|\bcongress|\bdistrict\b|\bcd\b/.test(text);
    if (!hasOffice) return 0;

    // Primary matching: must mention "primary" and the correct party
    if (isPrimary) {
      if (!/\bprimary\b/.test(text)) return 0;
      const hasParty = primaryParty === 'r'
        ? /\brepublican\b|\bgop\b|\brep\b/.test(text)
        : /\bdemocrat\b|\bdem\b|\bdfl\b/.test(text);
      if (!hasParty) return 0;
    } else {
      // General election markets should NOT be primary-specific
      // (skip markets that are clearly about a primary for general race matching)
      if (/\bprimary\b/.test(text) && (/\brepublican\b|\bdemocrat\b|\bgop\b/.test(text))) return 0;
    }

    if (baseType === 'house' && districtNum != null) {
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
    if (isPrimary && /\bprimary\b/.test(text)) score += 2;
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
   * Match markets to races. For each race, pick the best matching market
   * and extract win probabilities. Also matches primary markets.
   */
  _deriveRatings(allMarkets) {
    const results = {};
    const allRaces = [
      // General election races
      ...SENATE_STATES.map(s => ({ state: s, type: 'senate' })),
      ...GOVERNOR_STATES.map(s => ({ state: s, type: 'governor' })),
      ...HOUSE_DISTRICTS.map(d => ({ state: d.state, type: 'house', district: d.district, code: d.code })),
      // Primary races (R and D for each office)
      ...SENATE_STATES.map(s => ({ state: s, type: 'senate-primary-r' })),
      ...SENATE_STATES.map(s => ({ state: s, type: 'senate-primary-d' })),
      ...GOVERNOR_STATES.map(s => ({ state: s, type: 'governor-primary-r' })),
      ...GOVERNOR_STATES.map(s => ({ state: s, type: 'governor-primary-d' })),
    ];

    for (const race of allRaces) {
      const isPrimary = race.type.includes('-primary-');
      const scored = allMarkets
        .map(m => ({ market: m, score: this._scoreMatch(m, race.state, race.type, race.district || null) }))
        .filter(s => s.score > 0)
        .sort((a, b) => b.score - a.score);

      if (scored.length === 0) continue;
      const bestMatch = scored[0].market;

      if (isPrimary) {
        // Primary markets: pass through all candidate outcomes with prices
        const outcomes = (bestMatch.outcomes || [])
          .filter(o => o.name && o.price != null)
          .sort((a, b) => b.price - a.price)
          .slice(0, 10)
          .map(o => ({ name: o.name, pct: Math.round(o.price * 100) }));

        if (outcomes.length === 0) continue;

        const party = race.type.endsWith('-r') ? 'R' : 'D';
        const baseType = race.type.replace(/-primary-[rd]$/, '');
        const key = `${race.state}:${baseType}:primary:${party}`;
        results[key] = {
          state: race.state,
          raceType: race.type,
          party,
          candidates: outcomes,
          marketQuestion: bestMatch.question,
          marketUrl: bestMatch.url,
          marketSource: bestMatch.source,
          marketVolume: bestMatch.volume,
        };
      } else {
        // General election: extract D-win probability
        const dProb = this._extractDemProbability(bestMatch);
        if (dProb == null) continue;

        const key = race.code ? `${race.state}:house:${race.code}` : `${race.state}:${race.type}`;
        results[key] = {
          state: race.state,
          raceType: race.type,
          district: race.code || null,
          derivedRating: probabilityToRating(dProb),
          dWinProb: Math.round(dProb * 100),
          rWinProb: Math.round((1 - dProb) * 100),
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
    }

    return results;
  }

  /**
   * Main method: fetch prediction market odds for all 2026 races.
   */
  async getLiveData() {
    const cached = await cacheService.get(CACHE_KEY);
    if (cached) return cached;

    // Short-lived memory cache (5 min stale fallback)
    if (this._memCache && (Date.now() - this._memCacheTime) < 5 * 60 * 1000) {
      return this._memCache;
    }

    console.log('[ElectionLive] Fetching prediction market odds...');
    const startTime = Date.now();

    try {
      const allMarkets = await this._fetchAllMarkets();
      const marketRatings = this._deriveRatings(allMarkets);

      const elapsed = Date.now() - startTime;
      const ratingCount = Object.keys(marketRatings).length;
      console.log(`[ElectionLive] Done in ${elapsed}ms: ${ratingCount} races matched from ${allMarkets.length} markets`);

      const result = {
        marketRatings,
        marketCount: allMarkets.length,
        racesMatched: ratingCount,
        timestamp: new Date().toISOString(),
      };

      await cacheService.set(CACHE_KEY, result, CACHE_TTL);
      this._memCache = result;
      this._memCacheTime = Date.now();

      return result;
    } catch (error) {
      console.error('[ElectionLive] Error:', error.message);
      if (this._memCache) return this._memCache;
      return { marketRatings: {}, marketCount: 0, racesMatched: 0, timestamp: new Date().toISOString() };
    }
  }

  /**
   * Get live data for a single state.
   */
  async getStateData(stateName) {
    const all = await this.getLiveData();
    return {
      senate: all.marketRatings[`${stateName}:senate`] || null,
      governor: all.marketRatings[`${stateName}:governor`] || null,
      house: Object.fromEntries(
        Object.entries(all.marketRatings)
          .filter(([key]) => key.startsWith(`${stateName}:house:`))
          .map(([key, val]) => [val.district || key.split(':')[2], val])
      ),
      timestamp: all.timestamp,
    };
  }
}

export const electionLiveService = new ElectionLiveService();
export default electionLiveService;
