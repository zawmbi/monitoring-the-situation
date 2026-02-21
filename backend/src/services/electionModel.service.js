/**
 * Election Model Service — Raw Data Aggregation (v3)
 *
 * Collects and returns raw data from clean upstream sources.
 * No ensemble model, no logistic functions, no PVI-to-probability conversion,
 * no signal weights, no confidence scores, no rating derivation.
 *
 * Returns separate raw sections:
 *   - markets:     Prediction market odds from Polymarket, Kalshi, PredictIt
 *   - polls:       FiveThirtyEight poll data via pollingAggregator (raw margins, no derived probabilities)
 *   - fundraising: FEC candidate receipts (raw dollar amounts, not converted to probability)
 *   - forecasts:   Metaculus community predictions (raw probability)
 *
 * All data is attributed to its source. No custom scoring is applied.
 *
 * Sources (all free, keyless or DEMO_KEY):
 *   - Polymarket API (polymarket.com)
 *   - Kalshi API (kalshi.com)
 *   - PredictIt API (predictit.org)
 *   - FiveThirtyEight CSV (CC BY 4.0)
 *   - OpenFEC API (api.open.fec.gov)
 *   - Metaculus API (metaculus.com)
 */

import { cacheService } from './cache.service.js';
import { polymarketService } from './polymarket.service.js';
import { kalshiService } from './kalshi.service.js';
import { predictitService } from './predictit.service.js';
import { metaculusService } from './metaculus.service.js';
import { pollingAggregatorService } from './pollingAggregator.service.js';
import { fecService } from './fec.service.js';

// ── Constants ────────────────────────────────────────────────────────────

const CACHE_KEY = 'election-model:v3';
const CACHE_TTL = 600; // 10 minutes

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

function normalizeText(s) {
  return (s || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

// ── Market Matching ──────────────────────────────────────────────────────

/**
 * Find all markets that match a specific race. Returns raw market data
 * without computing any consensus or blended probability.
 */
function findMatchingMarkets(allMarkets, stateName, raceType, districtNum = null) {
  const stateNameLower = stateName.toLowerCase();
  const stateCode = (STATE_CODES[stateName] || '').toLowerCase();
  const matches = [];

  for (const market of allMarkets) {
    const text = normalizeText(`${market.question} ${market.description} ${market.rawSearchText || ''}`);

    const hasState = text.includes(stateNameLower) ||
      (stateCode.length === 2 && new RegExp(`\\b${stateCode}\\b`).test(text));
    if (!hasState) continue;

    const hasRaceType = raceType === 'senate'
      ? /\bsenat/.test(text)
      : raceType === 'governor'
        ? /\bgovern|\bgubern/.test(text)
        : /\bhouse\b|\bcongress|\bdistrict\b|\bcd\b/.test(text);
    if (!hasRaceType) continue;

    if (raceType === 'house' && districtNum != null) {
      const distStr = String(districtNum);
      const hasDistrict = text.includes(`district ${distStr}`) ||
        text.includes(`cd ${distStr}`) ||
        text.includes(`${stateCode} ${distStr}`) ||
        new RegExp(`\\b${stateCode} ?0?${distStr}\\b`).test(text);
      if (!hasDistrict) continue;
    }

    if (/202[0-4]|2028|2030|2032/.test(text) && !/2026/.test(text)) continue;

    matches.push({
      source: market.source || 'unknown',
      question: market.question,
      url: market.url,
      volume: market.volume || 0,
      outcomes: (market.outcomes || []).slice(0, 6).map(o => ({
        name: o.name,
        price: o.price != null ? Math.round(o.price * 1000) / 1000 : null,
      })),
      dataSource: market.source || 'unknown',
    });
  }

  return matches;
}

/**
 * Find Metaculus questions matching a specific race.
 * Returns the raw community prediction without any interpretation.
 */
function findMatchingForecasts(metaculusQuestions, stateName, raceType) {
  if (!metaculusQuestions || metaculusQuestions.length === 0) return [];

  const stateNorm = stateName.toLowerCase();
  const raceNorm = raceType.toLowerCase();
  const matches = [];

  for (const q of metaculusQuestions) {
    const title = (q.title || '').toLowerCase();
    if (!title.includes(stateNorm)) continue;

    const matchesRace =
      (raceNorm === 'senate' && /senat/.test(title)) ||
      (raceNorm === 'governor' && /(govern|gubern)/.test(title)) ||
      (raceNorm === 'house' && /(house|congress|district)/.test(title));
    if (!matchesRace) continue;

    if (/202[0-4]|2028/.test(title) && !/2026/.test(title)) continue;

    if (q.communityPrediction == null) continue;

    matches.push({
      questionId: q.id,
      title: q.title,
      url: q.url,
      communityPrediction: q.communityPrediction,
      numForecasters: q.numForecasters,
      dataSource: 'Metaculus',
    });
  }

  return matches;
}

// ── Main Service ─────────────────────────────────────────────────────────

class ElectionModelService {
  constructor() {
    this._memCache = null;
    this._memCacheTime = 0;
  }

  async computeModel() {
    const cached = await cacheService.get(CACHE_KEY);
    if (cached) return cached;

    if (this._memCache && (Date.now() - this._memCacheTime) < 10 * 60 * 1000) {
      return this._memCache;
    }

    console.log('[ElectionModel] Collecting raw upstream data...');
    const startTime = Date.now();

    // Build senate race types for polling aggregator
    const senateRaceTypes = {};
    for (const s of SENATE_STATES) {
      senateRaceTypes[s] = { type: SPECIAL_ELECTION_STATES.includes(s) ? 'special' : 'regular' };
    }

    const boostKw = ['senate', 'governor', 'election', 'midterm', 'congress', 'house', 'democrat', 'republican'];

    // Fetch all upstream data in parallel
    const [
      polyResult, kalshiResult, predictitResult,
      pollingAggResult,
      metaculusResult,
      fecResult,
    ] = await Promise.allSettled([
      polymarketService.getMarketsByTopic(['2026'], boostKw, false),
      kalshiService.getMarketsByTopic(['2026'], boostKw, false),
      predictitService.getMarketsByTopic(['2026'], boostKw, false),
      pollingAggregatorService.aggregateAll(senateRaceTypes),
      metaculusService.searchQuestions('2026 election senate governor', 30),
      fecService.getAllSenateCandidates().catch(() => ({})),
    ]);

    const allMarkets = [
      ...(polyResult.status === 'fulfilled' ? polyResult.value : []),
      ...(kalshiResult.status === 'fulfilled' ? kalshiResult.value : []),
      ...(predictitResult.status === 'fulfilled' ? predictitResult.value : []),
    ];
    const aggregatedPolling = pollingAggResult.status === 'fulfilled' ? pollingAggResult.value : null;
    const metaculusQuestions = metaculusResult.status === 'fulfilled' ? metaculusResult.value : [];
    const fecCandidates = fecResult.status === 'fulfilled' ? fecResult.value : {};

    // Build per-race raw data
    const allRaces = [
      ...SENATE_STATES.map(s => ({ state: s, type: 'senate' })),
      ...GOVERNOR_STATES.map(s => ({ state: s, type: 'governor' })),
      ...HOUSE_DISTRICTS.map(d => ({ state: d.state, type: 'house', district: d.district, code: d.code })),
    ];

    const raceModels = {};

    for (const race of allRaces) {
      const key = race.code
        ? `${race.state}:house:${race.code}`
        : `${race.state}:${race.type}`;

      // 1. Markets: raw market matches (no consensus calculation)
      const marketMatches = findMatchingMarkets(allMarkets, race.state, race.type, race.district || null);

      // 2. Polls: raw margin from FiveThirtyEight (no probability conversion)
      const raceKey = `${race.state}:${race.type}`;
      const pollingData = aggregatedPolling?.byRace?.[raceKey] || null;

      // 3. Fundraising: raw FEC receipts (Senate only, no probability conversion)
      let fundraisingData = null;
      if (race.type === 'senate') {
        const stateCode = STATE_CODES[race.state];
        const stateCands = stateCode ? fecCandidates[stateCode] : null;
        if (stateCands && stateCands.length > 0) {
          fundraisingData = {
            candidates: stateCands.map(c => ({
              name: c.name,
              party: c.party,
              totalReceipts: c.totalReceipts,
              totalDisbursements: c.totalDisbursements,
              cashOnHand: c.cashOnHand,
              incumbentChallenge: c.incumbentChallenge,
            })),
            dataSource: 'OpenFEC API (api.open.fec.gov)',
          };
        }
      }

      // 4. Forecasts: raw Metaculus community predictions
      const forecastMatches = findMatchingForecasts(metaculusQuestions, race.state, race.type);

      // Only include races that have at least some data
      const hasData = marketMatches.length > 0 || pollingData || fundraisingData || forecastMatches.length > 0;
      if (!hasData) continue;

      raceModels[key] = {
        state: race.state,
        stateCode: STATE_CODES[race.state] || '',
        raceType: race.type,
        district: race.code || null,

        markets: marketMatches.length > 0 ? {
          matches: marketMatches,
          matchCount: marketMatches.length,
          dataSource: 'Polymarket, Kalshi, PredictIt',
        } : null,

        polls: pollingData ? {
          margin: pollingData.margin,
          pollCount: pollingData.pollCount,
          avgSampleSize: pollingData.avgSampleSize,
          dataSource: 'FiveThirtyEight (CC BY 4.0)',
        } : null,

        fundraising: fundraisingData,

        forecasts: forecastMatches.length > 0 ? {
          questions: forecastMatches,
          questionCount: forecastMatches.length,
          dataSource: 'Metaculus',
        } : null,
      };
    }

    const elapsedMs = Date.now() - startTime;

    const result = {
      raceModels,

      meta: {
        version: '3.0',
        description: 'Raw data collection only. No ensemble model, no derived probabilities, no custom scoring.',
        timestamp: new Date().toISOString(),
        computeTimeMs: elapsedMs,
        sources: {
          polymarket: polyResult.status === 'fulfilled' ? polyResult.value.length : 0,
          kalshi: kalshiResult.status === 'fulfilled' ? kalshiResult.value.length : 0,
          predictit: predictitResult.status === 'fulfilled' ? predictitResult.value.length : 0,
          fiveThirtyEightPolls: aggregatedPolling?.totalPolls || 0,
          pollingRaces: aggregatedPolling?.raceCount || 0,
          metaculusQuestions: metaculusQuestions.length,
          fecCandidates: Object.values(fecCandidates).reduce((s, arr) => s + (arr?.length || 0), 0),
        },
        dataSource: {
          markets: 'Polymarket (polymarket.com), Kalshi (kalshi.com), PredictIt (predictit.org)',
          polls: 'FiveThirtyEight / ABC News (CC BY 4.0)',
          fundraising: 'OpenFEC API (api.open.fec.gov)',
          forecasts: 'Metaculus (metaculus.com)',
        },
      },
    };

    await cacheService.set(CACHE_KEY, result, CACHE_TTL);
    this._memCache = result;
    this._memCacheTime = Date.now();

    const raceCount = Object.keys(raceModels).length;
    console.log(`[ElectionModel] v3 raw data collected in ${elapsedMs}ms: ${raceCount} races with data`);

    return result;
  }
}

export const electionModelService = new ElectionModelService();
export default electionModelService;
