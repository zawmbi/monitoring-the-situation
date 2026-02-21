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

const CACHE_KEY = 'elections:live:v8'; // v8: research-verified slug patterns + expanded districts
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

// Competitive House districts to track (confirmed across Polymarket + Kalshi + PredictIt)
const HOUSE_DISTRICTS = [
  { state: 'Alabama', district: 2, code: 'AL-02' },
  { state: 'Arizona', district: 1, code: 'AZ-01' },
  { state: 'Arizona', district: 2, code: 'AZ-02' },
  { state: 'Arizona', district: 4, code: 'AZ-04' },
  { state: 'Arizona', district: 6, code: 'AZ-06' },
  { state: 'Arkansas', district: 4, code: 'AR-04' },
  { state: 'California', district: 13, code: 'CA-13' },
  { state: 'California', district: 14, code: 'CA-14' },
  { state: 'California', district: 21, code: 'CA-21' },
  { state: 'California', district: 22, code: 'CA-22' },
  { state: 'California', district: 25, code: 'CA-25' },
  { state: 'California', district: 27, code: 'CA-27' },
  { state: 'California', district: 39, code: 'CA-39' },
  { state: 'California', district: 40, code: 'CA-40' },
  { state: 'California', district: 41, code: 'CA-41' },
  { state: 'California', district: 45, code: 'CA-45' },
  { state: 'California', district: 47, code: 'CA-47' },
  { state: 'California', district: 48, code: 'CA-48' },
  { state: 'California', district: 49, code: 'CA-49' },
  { state: 'Colorado', district: 3, code: 'CO-03' },
  { state: 'Colorado', district: 8, code: 'CO-08' },
  { state: 'Connecticut', district: 5, code: 'CT-05' },
  { state: 'Florida', district: 13, code: 'FL-13' },
  { state: 'Florida', district: 22, code: 'FL-22' },
  { state: 'Florida', district: 23, code: 'FL-23' },
  { state: 'Florida', district: 27, code: 'FL-27' },
  { state: 'Florida', district: 28, code: 'FL-28' },
  { state: 'Georgia', district: 6, code: 'GA-06' },
  { state: 'Georgia', district: 7, code: 'GA-07' },
  { state: 'Indiana', district: 5, code: 'IN-05' },
  { state: 'Iowa', district: 1, code: 'IA-01' },
  { state: 'Iowa', district: 2, code: 'IA-02' },
  { state: 'Iowa', district: 3, code: 'IA-03' },
  { state: 'Iowa', district: 4, code: 'IA-04' },
  { state: 'Kansas', district: 3, code: 'KS-03' },
  { state: 'Kentucky', district: 6, code: 'KY-06' },
  { state: 'Louisiana', district: 6, code: 'LA-06' },
  { state: 'Maine', district: 1, code: 'ME-01' },
  { state: 'Maine', district: 2, code: 'ME-02' },
  { state: 'Michigan', district: 3, code: 'MI-03' },
  { state: 'Michigan', district: 5, code: 'MI-05' },
  { state: 'Michigan', district: 6, code: 'MI-06' },
  { state: 'Michigan', district: 7, code: 'MI-07' },
  { state: 'Michigan', district: 8, code: 'MI-08' },
  { state: 'Michigan', district: 10, code: 'MI-10' },
  { state: 'Minnesota', district: 1, code: 'MN-01' },
  { state: 'Minnesota', district: 2, code: 'MN-02' },
  { state: 'Minnesota', district: 3, code: 'MN-03' },
  { state: 'Nebraska', district: 2, code: 'NE-02' },
  { state: 'Nevada', district: 3, code: 'NV-03' },
  { state: 'Nevada', district: 4, code: 'NV-04' },
  { state: 'New Hampshire', district: 1, code: 'NH-01' },
  { state: 'New Hampshire', district: 2, code: 'NH-02' },
  { state: 'New Jersey', district: 2, code: 'NJ-02' },
  { state: 'New Jersey', district: 5, code: 'NJ-05' },
  { state: 'New Jersey', district: 7, code: 'NJ-07' },
  { state: 'New Mexico', district: 2, code: 'NM-02' },
  { state: 'New York', district: 1, code: 'NY-01' },
  { state: 'New York', district: 2, code: 'NY-02' },
  { state: 'New York', district: 4, code: 'NY-04' },
  { state: 'New York', district: 11, code: 'NY-11' },
  { state: 'New York', district: 17, code: 'NY-17' },
  { state: 'New York', district: 18, code: 'NY-18' },
  { state: 'New York', district: 19, code: 'NY-19' },
  { state: 'New York', district: 22, code: 'NY-22' },
  { state: 'North Carolina', district: 1, code: 'NC-01' },
  { state: 'North Carolina', district: 7, code: 'NC-07' },
  { state: 'North Carolina', district: 9, code: 'NC-09' },
  { state: 'North Carolina', district: 13, code: 'NC-13' },
  { state: 'North Carolina', district: 14, code: 'NC-14' },
  { state: 'Ohio', district: 1, code: 'OH-01' },
  { state: 'Ohio', district: 9, code: 'OH-09' },
  { state: 'Ohio', district: 13, code: 'OH-13' },
  { state: 'Oregon', district: 4, code: 'OR-04' },
  { state: 'Oregon', district: 5, code: 'OR-05' },
  { state: 'Oregon', district: 6, code: 'OR-06' },
  { state: 'Pennsylvania', district: 1, code: 'PA-01' },
  { state: 'Pennsylvania', district: 4, code: 'PA-04' },
  { state: 'Pennsylvania', district: 5, code: 'PA-05' },
  { state: 'Pennsylvania', district: 7, code: 'PA-07' },
  { state: 'Pennsylvania', district: 8, code: 'PA-08' },
  { state: 'Pennsylvania', district: 10, code: 'PA-10' },
  { state: 'Pennsylvania', district: 17, code: 'PA-17' },
  { state: 'South Carolina', district: 1, code: 'SC-01' },
  { state: 'Texas', district: 15, code: 'TX-15' },
  { state: 'Texas', district: 23, code: 'TX-23' },
  { state: 'Texas', district: 24, code: 'TX-24' },
  { state: 'Texas', district: 28, code: 'TX-28' },
  { state: 'Texas', district: 32, code: 'TX-32' },
  { state: 'Texas', district: 34, code: 'TX-34' },
  { state: 'Virginia', district: 2, code: 'VA-02' },
  { state: 'Virginia', district: 7, code: 'VA-07' },
  { state: 'Washington', district: 3, code: 'WA-03' },
  { state: 'Washington', district: 8, code: 'WA-08' },
  { state: 'Wisconsin', district: 1, code: 'WI-01' },
  { state: 'Wisconsin', district: 3, code: 'WI-03' },
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
   * Generate Polymarket event slugs for all 2026 races.
   * Slug patterns confirmed via direct Gamma API testing.
   */
  _generatePolymarketSlugs() {
    const slugs = [];
    const toSlug = (s) => s.toLowerCase().replace(/\s+/g, '-');

    // Senate general election
    for (const state of SENATE_STATES) {
      const s = toSlug(state);
      slugs.push(`${s}-senate-election-winner`);
      slugs.push(`${s}-us-senate-election-winner`);
    }
    // Senate primaries (both parties)
    for (const state of SENATE_STATES) {
      const s = toSlug(state);
      slugs.push(`${s}-republican-senate-primary-winner`);
      slugs.push(`${s}-democratic-senate-primary-winner`);
    }
    // Michigan Republican Senate Primary has special suffix
    slugs.push('michigan-republican-senate-primary-winner-954');

    // Governor general election (confirmed pattern: {state}-governor-winner-2026)
    for (const state of GOVERNOR_STATES) {
      const s = toSlug(state);
      slugs.push(`${s}-governor-winner-2026`);
    }
    // California uses a different slug pattern
    slugs.push('california-governor-election-2026');

    // Governor primaries (confirmed pattern: {state}-governor-{party}-primary-winner)
    for (const state of GOVERNOR_STATES) {
      const s = toSlug(state);
      slugs.push(`${s}-governor-republican-primary-winner`);
      slugs.push(`${s}-governor-democratic-primary-winner`);
    }
    // Florida uses alternate governor primary slugs
    slugs.push('republican-nominee-for-florida-governor');
    slugs.push('democratic-nominee-for-florida-governor');
    // California jungle primary
    slugs.push('parties-advancing-from-the-california-governor-primary');

    // House districts (confirmed pattern: {xx}-{dd}-house-election-winner, zero-padded)
    for (const d of HOUSE_DISTRICTS) {
      const [st, dist] = d.code.split('-');
      const paddedDist = dist.padStart(2, '0');
      slugs.push(`${st.toLowerCase()}-${paddedDist}-house-election-winner`);
    }

    // Meta / control markets
    slugs.push(
      'which-party-will-win-the-senate-in-2026',
      'which-party-will-win-the-house-in-2026',
      'balance-of-power-2026-midterms',
      'republican-senate-seats-after-the-2026-midterm-elections-927',
      'republican-house-seats-after-the-2026-midterm-elections',
      'will-democrats-win-all-core-four-senate-races',
      'florida-us-senate-election-winner',
    );
    return slugs;
  }

  /**
   * Fetch all election markets from Polymarket + Kalshi + PredictIt.
   * Uses multiple search strategies to maximize coverage:
   * 1. Keyword search for "2026" (catches explicit year references)
   * 2. Keyword search for "senate" (catches state senate race markets)
   * 3. Keyword search for "governor" (catches governor race markets)
   * 4. Direct slug-based fetching for known Polymarket event patterns
   * 5. Standard Kalshi + PredictIt topic search
   */
  async _fetchAllMarkets() {
    const boost = ['senate', 'governor', 'election', 'midterm', 'congress', 'house', 'democrat', 'republican', 'primary', '2026'];

    // Multiple search strategies for Polymarket (many markets don't contain "2026" in text)
    const polySearches = [
      polymarketService.getMarketsByTopic(['2026'], boost, false),
      polymarketService.getMarketsByTopic(['senate'], ['2026', 'election', 'winner', 'primary', 'democrat', 'republican'], false),
      polymarketService.getMarketsByTopic(['governor'], ['2026', 'election', 'winner', 'primary'], false),
      polymarketService.getMarketsByTopic(['midterm'], ['2026', 'senate', 'governor', 'house'], false),
      polymarketService.getMarketsByTopic(['primary'], ['2026', 'senate', 'governor', 'republican', 'democrat'], false),
    ];

    // Kalshi + PredictIt — broader searches
    const kalshiSearches = [
      kalshiService.getMarketsByTopic(['2026'], boost, false),
      kalshiService.getMarketsByTopic(['senate'], ['2026', 'election', 'winner', 'primary'], false),
      kalshiService.getMarketsByTopic(['governor'], ['2026', 'election', 'winner', 'gubernatorial'], false),
      kalshiService.getMarketsByTopic(['house'], ['2026', 'election', 'district', 'winner'], false),
      kalshiService.getMarketsByTopic(['primary'], ['2026', 'senate', 'governor', 'republican', 'democrat', 'nominee'], false),
    ];
    const predictitSearches = [
      predictitService.getMarketsByTopic(['2026'], boost, false),
      predictitService.getMarketsByTopic(['senate'], ['2026', 'election', 'primary', 'nomination'], false),
      predictitService.getMarketsByTopic(['governor'], ['2026', 'gubernatorial', 'election'], false),
      predictitService.getMarketsByTopic(['house'], ['2026', 'election', 'district'], false),
    ];

    // Direct slug-based Polymarket fetching for guaranteed coverage
    const slugs = this._generatePolymarketSlugs();
    const slugFetch = polymarketService.fetchEventsBySlugs(slugs, 10)
      .then(events => polymarketService.normalizeMarkets(events))
      .catch(() => []);

    // Execute all in parallel
    const allResults = await Promise.allSettled([
      ...polySearches,
      ...kalshiSearches,
      ...predictitSearches,
      slugFetch,
    ]);

    // Merge and deduplicate by market ID
    const seen = new Set();
    const markets = [];
    for (const result of allResults) {
      if (result.status !== 'fulfilled' || !Array.isArray(result.value)) continue;
      for (const market of result.value) {
        const key = market.id || market.url || market.question;
        if (!seen.has(key)) {
          seen.add(key);
          markets.push(market);
        }
      }
    }

    return markets;
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
        ? /\brepublican|\bgop\b|\brep\b/.test(text)
        : /\bdemocrat|\bdem\b|\bdfl\b/.test(text);
      if (!hasParty) return 0;
    } else {
      // General election markets should NOT mention "primary" at all
      if (/\bprimary\b/.test(text)) return 0;
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
      if (/\brepublican|\brep\b|\bgop\b|\bred\b/.test(name) && o.price != null) return 1 - o.price;
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
