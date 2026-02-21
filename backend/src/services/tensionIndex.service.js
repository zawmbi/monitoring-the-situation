/**
 * Global Tension Index Service
 * Pure data passthrough — returns raw data from upstream APIs:
 *   - UCDP (Uppsala Conflict Data Program) for conflict events and casualties
 *   - Stability service for protest and military activity counts
 *   - GDELT Project for real-time article counts on conflict keywords
 *
 * No composite scores, no weighted averages, no 0-100 indices, no risk levels.
 * Static metadata (names, parties, coordinates) is kept as reference data.
 */

import { cacheService } from './cache.service.js';
import { ucdpService } from './ucdp.service.js';
import { stabilityService } from './stability.service.js';
import { fetchGDELTRaw } from './gdelt.client.js';

const CACHE_KEY = 'tension:index';
const CACHE_TTL = 900; // 15 minutes

const GDELT_DOC_URL = 'https://api.gdeltproject.org/api/v2/doc/doc';

// ---------------------------------------------------------------------------
// Reference data: conflict metadata
// ---------------------------------------------------------------------------

const CONFLICT_METADATA = [
  {
    id: 'ukraine-russia',
    name: 'Russia-Ukraine War',
    type: 'interstate',
    region: 'Europe',
    parties: ['Russia', 'Ukraine'],
    since: '2022-02-24',
    ucdpKeywords: ['Ukraine', 'Russia'],
    ucdpCountries: ['Ukraine', 'Russia (Soviet Union)'],
    gdeltQuery: 'Ukraine war OR Ukraine conflict OR Ukraine Russia battle OR Ukraine Starlink Telegram OR Ukraine offensive advance',
    stabilityCountries: ['UA', 'RU'],
    lat: 48.38,
    lon: 31.17,
  },
  {
    id: 'israel-palestine',
    name: 'Israel-Palestine Conflict',
    type: 'asymmetric',
    region: 'Middle East',
    parties: ['Israel', 'Hamas', 'Hezbollah'],
    since: '2023-10-07',
    ucdpKeywords: ['Israel', 'Palestine', 'Gaza'],
    ucdpCountries: ['Israel'],
    gdeltQuery: 'Israel Gaza war OR Israel Hamas OR Israel Palestine conflict',
    stabilityCountries: ['IL', 'PS'],
    lat: 31.05,
    lon: 34.85,
  },
  {
    id: 'sudan-civil',
    name: 'Sudan Civil War',
    type: 'civil',
    region: 'East Africa',
    parties: ['SAF', 'RSF'],
    since: '2023-04-15',
    ucdpKeywords: ['Sudan'],
    ucdpCountries: ['Sudan'],
    gdeltQuery: 'Sudan civil war OR Sudan RSF OR Sudan SAF conflict',
    stabilityCountries: ['SD'],
    lat: 12.86,
    lon: 30.22,
  },
  {
    id: 'myanmar-civil',
    name: 'Myanmar Civil War',
    type: 'civil',
    region: 'Southeast Asia',
    parties: ['Military Junta', 'NUG/PDF'],
    since: '2021-02-01',
    ucdpKeywords: ['Myanmar'],
    ucdpCountries: ['Myanmar (Burma)'],
    gdeltQuery: 'Myanmar civil war OR Myanmar junta OR Myanmar resistance',
    stabilityCountries: ['MM'],
    lat: 21.91,
    lon: 95.96,
  },
  {
    id: 'ethiopia-internal',
    name: 'Ethiopia Internal Conflicts',
    type: 'civil',
    region: 'Horn of Africa',
    parties: ['Federal Gov', 'Various militia'],
    since: '2020-11-04',
    ucdpKeywords: ['Ethiopia'],
    ucdpCountries: ['Ethiopia'],
    gdeltQuery: 'Ethiopia conflict OR Ethiopia militia OR Ethiopia Amhara',
    stabilityCountries: ['ET'],
    lat: 9.15,
    lon: 40.49,
  },
  {
    id: 'sahel-insurgency',
    name: 'Sahel Insurgency',
    type: 'insurgency',
    region: 'West Africa',
    parties: ['JNIM', 'ISGS', 'Mali/BF/Niger'],
    since: '2012-01-01',
    ucdpKeywords: ['Mali', 'Burkina Faso', 'Niger'],
    ucdpCountries: ['Mali', 'Burkina Faso', 'Niger'],
    gdeltQuery: 'Sahel insurgency OR Mali jihadist OR Burkina Faso attack OR Niger militant',
    stabilityCountries: ['ML', 'BF', 'NE'],
    lat: 14.0,
    lon: 0.0,
  },
  {
    id: 'drc-m23',
    name: 'DRC - M23 Conflict',
    type: 'civil',
    region: 'Central Africa',
    parties: ['DRC Army', 'M23/Rwanda'],
    since: '2022-03-01',
    ucdpKeywords: ['Congo', 'DRC', 'M23'],
    ucdpCountries: ['DR Congo (Zaire)'],
    gdeltQuery: 'DRC M23 OR Congo conflict OR DRC Rwanda',
    stabilityCountries: ['CD'],
    lat: -4.04,
    lon: 21.76,
  },
  {
    id: 'somalia-alshabaab',
    name: 'Somalia - Al-Shabaab',
    type: 'insurgency',
    region: 'Horn of Africa',
    parties: ['Somalia/AMISOM', 'Al-Shabaab'],
    since: '2006-01-01',
    ucdpKeywords: ['Somalia', 'Shabaab'],
    ucdpCountries: ['Somalia'],
    gdeltQuery: 'Somalia Al-Shabaab OR Somalia conflict OR Somalia insurgency',
    stabilityCountries: ['SO'],
    lat: 5.15,
    lon: 46.20,
  },
  {
    id: 'houthi-red-sea',
    name: 'Houthi Red Sea Campaign',
    type: 'asymmetric',
    region: 'Middle East',
    parties: ['Houthis', 'US/UK Coalition'],
    since: '2023-11-19',
    ucdpKeywords: ['Yemen', 'Houthi'],
    ucdpCountries: ['Yemen (North Yemen)'],
    gdeltQuery: 'Houthi Red Sea OR Yemen Houthi attack OR Red Sea shipping attack',
    stabilityCountries: ['YE'],
    lat: 15.55,
    lon: 48.52,
  },
  {
    id: 'iran-israel',
    name: 'Iran-Israel War',
    type: 'interstate',
    region: 'Middle East',
    parties: ['Israel', 'Iran', 'United States'],
    since: '2025-06-13',
    ucdpKeywords: ['Iran', 'Israel'],
    ucdpCountries: ['Iran (Persia)', 'Israel'],
    gdeltQuery: 'Iran Israel war OR Iran Israel strike OR Iran nuclear attack OR Iran protests uprising OR US military Iran buildup OR US Navy Iran Persian Gulf',
    stabilityCountries: ['IR', 'IL'],
    lat: 32.43,
    lon: 53.69,
  },
  {
    id: 'india-pakistan',
    name: 'India-Pakistan Crisis',
    type: 'interstate',
    region: 'South Asia',
    parties: ['India', 'Pakistan'],
    since: '2025-05-07',
    ucdpKeywords: ['India', 'Pakistan', 'Kashmir'],
    ucdpCountries: ['India', 'Pakistan'],
    gdeltQuery: 'India Pakistan military OR India Pakistan strike OR Kashmir conflict OR Operation Sindoor',
    stabilityCountries: ['IN', 'PK'],
    lat: 34.08,
    lon: 74.79,
  },
  {
    id: 'haiti-gangs',
    name: 'Haiti Gang Violence',
    type: 'civil',
    region: 'Americas',
    parties: ['Gangs', 'MPTN'],
    since: '2021-07-07',
    ucdpKeywords: ['Haiti'],
    ucdpCountries: ['Haiti'],
    gdeltQuery: 'Haiti gang violence OR Haiti crisis OR Haiti armed groups',
    stabilityCountries: ['HT'],
    lat: 18.97,
    lon: -72.29,
  },
];

const FLASHPOINT_METADATA = [
  {
    id: 'taiwan',
    name: 'Taiwan Strait',
    category: 'great-power',
    parties: ['China', 'Taiwan', 'USA'],
    nuclear: true,
    gdeltQuery: 'Taiwan strait tension OR China Taiwan military OR Taiwan invasion threat',
    stabilityCountries: ['TW', 'CN'],
    lat: 23.70,
    lon: 120.96,
  },
  {
    id: 'south-china-sea',
    name: 'South China Sea',
    category: 'territorial',
    parties: ['China', 'Philippines', 'Vietnam'],
    nuclear: false,
    gdeltQuery: 'South China Sea dispute OR Philippines China standoff OR South China Sea military',
    stabilityCountries: ['CN', 'PH', 'VN'],
    lat: 12.0,
    lon: 114.0,
  },
  {
    id: 'korea',
    name: 'Korean Peninsula',
    category: 'great-power',
    parties: ['North Korea', 'South Korea', 'USA'],
    nuclear: true,
    gdeltQuery: 'North Korea missile OR Korean peninsula tension OR North Korea nuclear',
    stabilityCountries: ['KP', 'KR'],
    lat: 38.0,
    lon: 127.0,
  },
  {
    id: 'nato-russia',
    name: 'NATO-Russia Frontier',
    category: 'great-power',
    parties: ['NATO', 'Russia'],
    nuclear: true,
    gdeltQuery: 'NATO Russia tension OR NATO Russia border OR Russia NATO escalation',
    stabilityCountries: ['RU', 'PL', 'EE', 'LV', 'LT'],
    lat: 55.0,
    lon: 25.0,
  },
  {
    id: 'india-china',
    name: 'India-China Border',
    category: 'territorial',
    parties: ['India', 'China'],
    nuclear: true,
    gdeltQuery: 'India China border OR LAC standoff OR India China military',
    stabilityCountries: ['IN', 'CN'],
    lat: 34.0,
    lon: 78.0,
  },
  {
    id: 'arctic',
    name: 'Arctic Sovereignty Dispute',
    category: 'great-power',
    parties: ['Russia', 'NATO', 'China', 'USA'],
    nuclear: false,
    gdeltQuery: 'Arctic military OR Greenland sovereignty OR Arctic Russia NATO OR Northern Sea Route',
    stabilityCountries: ['RU', 'NO', 'CA', 'GL', 'DK'],
    lat: 75.0,
    lon: 40.0,
  },
];

// ---------------------------------------------------------------------------
// GDELT fetcher: returns article count for a given query over a time span
// ---------------------------------------------------------------------------

async function fetchGdeltArticleCount(query, timespan = '14d') {
  try {
    const url =
      `${GDELT_DOC_URL}?query=${encodeURIComponent(query)}` +
      `&mode=ArtList&maxrecords=250&timespan=${timespan}&format=json`;

    const data = await fetchGDELTRaw(url, 'TensionIndex');
    if (!data) return 0;
    return (data.articles || []).length;
  } catch {
    return 0;
  }
}

// ---------------------------------------------------------------------------
// UCDP event matching helper
// ---------------------------------------------------------------------------

/**
 * Count UCDP events and aggregate casualties for a given conflict.
 * Matches events by country name keywords against the conflict's ucdpCountries
 * and ucdpKeywords arrays.
 */
function matchUcdpEventsToConflict(events, conflict) {
  if (!events || events.length === 0) return { eventCount: 0, totalDeaths: 0 };

  const keywords = (conflict.ucdpKeywords || []).map(k => k.toLowerCase());
  const countries = (conflict.ucdpCountries || []).map(c => c.toLowerCase());

  const matched = events.filter(ev => {
    const evCountry = (ev.country || '').toLowerCase();
    const evConflictName = (ev.conflictName || '').toLowerCase();
    const evLocation = (ev.location || '').toLowerCase();
    const evSideA = (ev.sideA || '').toLowerCase();
    const evSideB = (ev.sideB || '').toLowerCase();

    const haystack = `${evCountry} ${evConflictName} ${evLocation} ${evSideA} ${evSideB}`;

    const countryMatch = countries.some(c => evCountry.includes(c) || c.includes(evCountry));
    const keywordMatch = keywords.some(k => haystack.includes(k));

    return countryMatch || keywordMatch;
  });

  const totalDeaths = matched.reduce((sum, ev) => sum + (ev.deathsBest || 0), 0);

  return { eventCount: matched.length, totalDeaths };
}

// ---------------------------------------------------------------------------
// Stability data extraction helpers (raw counts, no scoring)
// ---------------------------------------------------------------------------

/**
 * Extract raw protest and military activity counts for a set of country codes.
 * Returns raw counts only -- no scoring or normalization.
 */
function extractStabilityCounts(stabilityData, countryCodes) {
  if (!stabilityData || !countryCodes || countryCodes.length === 0) {
    return { protestCount: 0, militaryActivityCount: 0 };
  }

  let protestCount = 0;
  let militaryActivityCount = 0;

  const protests = stabilityData.protests?.heatmapPoints || [];
  for (const pt of protests) {
    if (countryCodes.includes(pt.countryCode)) {
      protestCount += pt.count || 0;
    }
  }

  const military = stabilityData.military?.indicators || [];
  for (const ind of military) {
    if (countryCodes.includes(ind.countryCode)) {
      militaryActivityCount += ind.count || 0;
    }
  }

  return { protestCount, militaryActivityCount };
}

// ---------------------------------------------------------------------------
// Main service
// ---------------------------------------------------------------------------

export const tensionIndexService = {
  async getGlobalTension() {
    // -- Check cache --
    const cached = await cacheService.get(CACHE_KEY);
    if (cached) return cached;

    console.log('[TensionIndex] Fetching raw data from live sources...');

    // -- Fetch all live data in parallel --
    const [ucdpEventsResult, ucdpConflictsResult, stabilityResult] = await Promise.allSettled([
      ucdpService.getRecentEvents({ limit: 500 }),
      ucdpService.getActiveConflicts(),
      stabilityService.getCombinedData(),
    ]);

    const ucdpEvents =
      ucdpEventsResult.status === 'fulfilled' && ucdpEventsResult.value
        ? ucdpEventsResult.value.events || []
        : [];

    const ucdpConflicts =
      ucdpConflictsResult.status === 'fulfilled' && ucdpConflictsResult.value
        ? ucdpConflictsResult.value.conflicts || []
        : [];

    const stabilityData =
      stabilityResult.status === 'fulfilled' ? stabilityResult.value : null;

    // -- Fetch GDELT article counts for every conflict and flashpoint in parallel --
    const allGdeltQueries = [
      ...CONFLICT_METADATA.map(c => c.gdeltQuery),
      ...FLASHPOINT_METADATA.map(f => f.gdeltQuery),
    ];

    const gdeltResults = await Promise.allSettled(
      allGdeltQueries.map(q => fetchGdeltArticleCount(q, '14d'))
    );

    const gdeltCounts = gdeltResults.map(r =>
      r.status === 'fulfilled' ? r.value : 0
    );

    const conflictGdeltCounts = gdeltCounts.slice(0, CONFLICT_METADATA.length);
    const flashpointGdeltCounts = gdeltCounts.slice(CONFLICT_METADATA.length);

    // -- Build raw conflict data objects --
    const activeConflicts = CONFLICT_METADATA.map((meta, idx) => {
      const { eventCount, totalDeaths } = matchUcdpEventsToConflict(ucdpEvents, meta);

      const ucdpMatch = ucdpConflicts.find(uc => {
        const ucName = (uc.name || '').toLowerCase();
        const ucLocation = (uc.location || '').toLowerCase();
        const ucSideA = (uc.sideA || '').toLowerCase();
        const ucSideB = (uc.sideB || '').toLowerCase();
        const hay = `${ucName} ${ucLocation} ${ucSideA} ${ucSideB}`;
        return meta.ucdpKeywords.some(k => hay.includes(k.toLowerCase()));
      });

      const { protestCount, militaryActivityCount } = extractStabilityCounts(stabilityData, meta.stabilityCountries);

      return {
        id: meta.id,
        name: meta.name,
        type: meta.type,
        region: meta.region,
        parties: meta.parties,
        since: meta.since,
        lat: meta.lat,
        lon: meta.lon,
        ucdp: {
          eventCount,
          totalDeaths,
          classification: ucdpMatch?.intensity || 'Unknown',
        },
        gdelt: {
          articleCount: conflictGdeltCounts[idx],
        },
        stability: {
          protestCount,
          militaryActivityCount,
        },
      };
    });

    // -- Build raw flashpoint data objects --
    const flashpoints = FLASHPOINT_METADATA.map((meta, idx) => {
      const { protestCount, militaryActivityCount } = extractStabilityCounts(stabilityData, meta.stabilityCountries);

      return {
        id: meta.id,
        name: meta.name,
        category: meta.category,
        parties: meta.parties,
        nuclear: meta.nuclear,
        lat: meta.lat,
        lon: meta.lon,
        gdelt: {
          articleCount: flashpointGdeltCounts[idx],
        },
        stability: {
          protestCount,
          militaryActivityCount,
        },
      };
    });

    // -- Global summary of raw data --
    const totalUcdpEvents = ucdpEvents.length;
    const totalUcdpFatalities = ucdpEvents.reduce((sum, ev) => sum + (ev.deathsBest || 0), 0);
    const activeUcdpConflicts = ucdpConflicts.length;

    const result = {
      ucdpSummary: {
        activeConflictCount: activeUcdpConflicts,
        totalEvents: totalUcdpEvents,
        totalFatalities: totalUcdpFatalities,
      },
      activeConflicts,
      flashpoints,
      dataAvailability: {
        ucdpEventsAvailable: ucdpEvents.length,
        ucdpConflictsAvailable: ucdpConflicts.length,
        stabilityAvailable: stabilityData !== null,
        gdeltQueriesSucceeded: gdeltCounts.filter(c => c > 0).length,
        gdeltQueriesTotal: allGdeltQueries.length,
      },
      dataSources: [
        'UCDP (Uppsala Conflict Data Program) — https://ucdp.uu.se',
        'GDELT Project — https://www.gdeltproject.org',
        'Stability service (GDELT + Google News RSS aggregation)',
      ],
      updatedAt: new Date().toISOString(),
    };

    await cacheService.set(CACHE_KEY, result, CACHE_TTL);
    console.log('[TensionIndex] Raw data assembled and cached.');
    return result;
  },
};
