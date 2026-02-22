/**
 * Stability Service
 * Aggregates global protest/unrest, military movement, and political instability data
 * Sources: GDELT Project (free, no API key)
 */

import { cacheService } from './cache.service.js';
import { fetchGDELT as gdeltFetch } from './gdelt.client.js';

const CACHE_TTL = 600; // 10 minutes

// ─── Country → lat/lon centroid lookup (ISO alpha-2) ───
const COUNTRY_COORDS = {
  AF: [33.93, 67.71], AL: [41.15, 20.17], DZ: [28.03, 1.66], AR: [-38.42, -63.62],
  AM: [40.07, 45.04], AU: [-25.27, 133.78], AT: [47.52, 14.55], AZ: [40.14, 47.58],
  BD: [23.68, 90.36], BY: [53.71, 27.95], BE: [50.50, 4.47], BO: [-16.29, -63.59],
  BA: [43.92, 17.68], BR: [-14.24, -51.93], BG: [42.73, 25.49], MM: [21.91, 95.96],
  KH: [12.57, 104.99], CM: [7.37, 12.35], CA: [56.13, -106.35], CF: [6.61, 20.94],
  TD: [15.45, 18.73], CL: [-35.68, -71.54], CN: [35.86, 104.20], CO: [4.57, -74.30],
  CD: [-4.04, 21.76], CG: [-0.23, 15.83], CR: [9.75, -83.75], HR: [45.10, 15.20],
  CU: [21.52, -77.78], CZ: [49.82, 15.47], DK: [56.26, 9.50], EC: [-1.83, -78.18],
  EG: [26.82, 30.80], SV: [13.79, -88.90], ER: [15.18, 39.78], EE: [58.60, 25.01],
  ET: [9.15, 40.49], FI: [61.92, 25.75], FR: [46.23, 2.21], GE: [42.32, 43.36],
  DE: [51.17, 10.45], GR: [39.07, 21.82], GT: [15.78, -90.23], GN: [9.95, -9.70],
  HT: [18.97, -72.29], HN: [15.20, -86.24], HU: [47.16, 19.50], IN: [20.59, 78.96],
  ID: [-0.79, 113.92], IR: [32.43, 53.69], IQ: [33.22, 43.68], IE: [53.41, -8.24],
  IL: [31.05, 34.85], IT: [41.87, 12.57], JM: [18.11, -77.30], JP: [36.20, 138.25],
  JO: [30.59, 36.24], KZ: [48.02, 66.92], KE: [-0.02, 37.91], KP: [40.34, 127.51],
  KR: [35.91, 127.77], KW: [29.31, 47.48], KG: [41.20, 74.77], LA: [19.86, 102.50],
  LV: [56.88, 24.60], LB: [33.85, 35.86], LY: [26.34, 17.23], LT: [55.17, 23.88],
  MG: [-18.77, 46.87], MW: [-13.25, 34.30], MY: [4.21, 101.98], ML: [17.57, -4.00],
  MX: [23.63, -102.55], MD: [47.41, 28.37], MN: [46.86, 103.85], MA: [31.79, -7.09],
  MZ: [-18.67, 35.53], NP: [28.39, 84.12], NL: [52.13, 5.29], NZ: [-40.90, 174.89],
  NI: [12.87, -85.21], NE: [17.61, 8.08], NG: [9.08, 8.68], NO: [60.47, 8.47],
  PK: [30.38, 69.35], PS: [31.95, 35.23], PA: [8.54, -80.78], PY: [-23.44, -58.44],
  PE: [-9.19, -75.02], PH: [12.88, 121.77], PL: [51.92, 19.15], PT: [39.40, -8.22],
  RO: [45.94, 24.97], RU: [61.52, 105.32], RW: [-1.94, 29.87], SA: [23.89, 45.08],
  SN: [14.50, -14.45], RS: [44.02, 21.01], SL: [8.46, -11.78], SG: [1.35, 103.82],
  SK: [48.67, 19.70], SI: [46.15, 14.99], SO: [5.15, 46.20], ZA: [-30.56, 22.94],
  SS: [6.88, 31.31], ES: [40.46, -3.75], LK: [7.87, 80.77], SD: [12.86, 30.22],
  SE: [60.13, 18.64], CH: [46.82, 8.23], SY: [34.80, 38.99], TW: [23.70, 120.96],
  TJ: [38.86, 71.28], TZ: [-6.37, 34.89], TH: [15.87, 100.99], TN: [33.89, 9.54],
  TR: [38.96, 35.24], TM: [38.97, 59.56], UA: [48.38, 31.17], AE: [23.42, 53.85],
  GB: [55.38, -3.44], US: [37.09, -95.71], UY: [-32.52, -55.77], UZ: [41.38, 64.59],
  VE: [6.42, -66.59], VN: [14.06, 108.28], YE: [15.55, 48.52], ZM: [-13.13, 27.85],
  ZW: [-19.02, 29.15],
};

// ─── GDELT Doc API fetch (via shared rate-limited client) ───
async function fetchGDELT(query, maxRecords = 75, timespan = '7d') {
  return gdeltFetch(query, { maxRecords, timespan, caller: 'Stability' });
}

// ─── Resolve country code from GDELT sourcecountry field ───
function resolveCountryCode(sourcecountry) {
  if (!sourcecountry) return null;
  const sc = sourcecountry.trim().toUpperCase();
  // GDELT uses FIPS codes; map common ones to ISO alpha-2
  const FIPS_TO_ISO = {
    US: 'US', UK: 'GB', FR: 'FR', GM: 'DE', RS: 'RU', CH: 'CN', IN: 'IN',
    JA: 'JP', KS: 'KR', KN: 'KP', BR: 'BR', AU: 'AU', CA: 'CA', IS: 'IL',
    IR: 'IR', IZ: 'IQ', TU: 'TR', PK: 'PK', EG: 'EG', SF: 'ZA', NI: 'NG',
    BM: 'MM', SU: 'SD', ET: 'ET', SO: 'SO', HA: 'HT', CU: 'CU', VE: 'VE',
    MX: 'MX', CO: 'CO', PE: 'PE', AR: 'AR', UP: 'UA', LY: 'LY', SY: 'SY',
    YM: 'YE', AF: 'AF', CE: 'LK', TH: 'TH', VM: 'VN', RP: 'PH', ID: 'ID',
    MY: 'MY', BG: 'BD', NP: 'NP', KE: 'KE', TZ: 'TZ', UG: 'UG', CG: 'CD',
    CF: 'CF', CM: 'CM', IV: 'CI', GH: 'GH', SN: 'SN', ML: 'ML', NG: 'NE',
    PO: 'PL', HU: 'HU', RO: 'RO', BU: 'BG', EN: 'EE', LG: 'LV', LH: 'LT',
    GG: 'GE', AM: 'AM', AJ: 'AZ', KZ: 'KZ', TI: 'TJ', TX: 'TM', UZ: 'UZ',
    KG: 'KG',
  };
  return FIPS_TO_ISO[sc] || (sc.length === 2 && COUNTRY_COORDS[sc] ? sc : null);
}

// ─── Build protest / unrest data ───
async function fetchProtestData() {
  const articles = await fetchGDELT('protest OR unrest OR demonstration OR riot OR strike action', 100, '14d');

  // Aggregate by country from GDELT
  const countryHeat = {};
  for (const article of articles) {
    const code = resolveCountryCode(article.sourcecountry);
    if (!code || !COUNTRY_COORDS[code]) continue;
    if (!countryHeat[code]) {
      countryHeat[code] = { count: 0, articles: [] };
    }
    countryHeat[code].count++;
    if (countryHeat[code].articles.length < 5) {
      countryHeat[code].articles.push({
        title: article.title,
        url: article.url,
        date: article.date,
        source: article.source,
      });
    }
  }

  // Convert to heatmap points with raw counts (no intensity scoring)
  const heatmapPoints = Object.entries(countryHeat).map(([code, data]) => {
    const [lat, lon] = COUNTRY_COORDS[code];
    return {
      id: `protest-${code}`,
      countryCode: code,
      lat,
      lon,
      count: data.count,
      articles: data.articles,
    };
  });

  return {
    heatmapPoints,
    totalArticles: articles.length,
    dataSource: 'GDELT Doc API',
    lastUpdated: new Date().toISOString(),
  };
}

// ─── Build military movement data ───
async function fetchMilitaryData() {
  const articles = await fetchGDELT('military deployment OR troop movement OR naval exercise OR military buildup OR military drill', 100, '14d');

  const countryMil = {};
  for (const article of articles) {
    const code = resolveCountryCode(article.sourcecountry);
    if (!code || !COUNTRY_COORDS[code]) continue;
    if (!countryMil[code]) {
      countryMil[code] = { count: 0, articles: [] };
    }
    countryMil[code].count++;
    if (countryMil[code].articles.length < 5) {
      countryMil[code].articles.push({
        title: article.title,
        url: article.url,
        date: article.date,
        source: article.source,
      });
    }
  }

  const indicators = Object.entries(countryMil).map(([code, data]) => {
    const [lat, lon] = COUNTRY_COORDS[code];
    return {
      id: `mil-${code}`,
      countryCode: code,
      lat,
      lon,
      count: data.count,
      articles: data.articles,
    };
  });

  return {
    indicators,
    totalArticles: articles.length,
    dataSource: 'GDELT Doc API',
    lastUpdated: new Date().toISOString(),
  };
}

// ─── Build instability alerts ───
async function fetchInstabilityData() {
  const articles = await fetchGDELT('assassination OR coup OR regime change OR political crisis OR martial law OR political instability', 100, '14d');

  const countryAlerts = {};
  for (const article of articles) {
    const code = resolveCountryCode(article.sourcecountry);
    if (!code || !COUNTRY_COORDS[code]) continue;
    if (!countryAlerts[code]) {
      countryAlerts[code] = { count: 0, articles: [] };
    }
    countryAlerts[code].count++;
    if (countryAlerts[code].articles.length < 5) {
      countryAlerts[code].articles.push({
        title: article.title,
        url: article.url,
        date: article.date,
        source: article.source,
      });
    }
  }

  const alerts = Object.entries(countryAlerts).map(([code, data]) => {
    const [lat, lon] = COUNTRY_COORDS[code];
    return {
      id: `alert-${code}`,
      countryCode: code,
      lat,
      lon,
      count: data.count,
      articles: data.articles,
    };
  });

  // Sort by count descending
  alerts.sort((a, b) => b.count - a.count);

  return {
    alerts,
    totalArticles: articles.length,
    dataSource: 'GDELT Doc API',
    lastUpdated: new Date().toISOString(),
  };
}

// ─── Region coordinates for fleet position matching ───
const FLEET_REGIONS = {
  'mediterranean': { lat: 35.00, lon: 18.00 },
  'persian gulf': { lat: 26.00, lon: 52.00 },
  'arabian gulf': { lat: 26.00, lon: 52.00 },
  'arabian sea': { lat: 18.00, lon: 64.00 },
  'red sea': { lat: 20.00, lon: 38.50 },
  'south china sea': { lat: 14.00, lon: 114.00 },
  'western pacific': { lat: 25.00, lon: 140.00 },
  'west pacific': { lat: 25.00, lon: 140.00 },
  'indian ocean': { lat: -5.00, lon: 73.00 },
  'atlantic': { lat: 35.00, lon: -40.00 },
  'pacific ocean': { lat: 20.00, lon: -150.00 },
  'gulf of aden': { lat: 12.50, lon: 45.00 },
  'east china sea': { lat: 28.00, lon: 125.00 },
  'sea of japan': { lat: 40.00, lon: 135.00 },
  'philippine sea': { lat: 18.00, lon: 132.00 },
  'baltic': { lat: 58.00, lon: 19.00 },
  'north sea': { lat: 57.00, lon: 3.00 },
  'arctic': { lat: 72.00, lon: 10.00 },
  'strait of hormuz': { lat: 26.50, lon: 56.30 },
  'taiwan strait': { lat: 24.50, lon: 119.50 },
  'black sea': { lat: 43.00, lon: 35.00 },
  'suez': { lat: 30.50, lon: 32.30 },
  'horn of africa': { lat: 11.00, lon: 49.00 },
  'bab el-mandeb': { lat: 12.60, lon: 43.30 },
  'north atlantic': { lat: 50.00, lon: -30.00 },
  'coral sea': { lat: -18.00, lon: 155.00 },
  'yellow sea': { lat: 35.00, lon: 124.00 },
  'norfolk': { lat: 36.95, lon: -76.33 },
  'san diego': { lat: 32.68, lon: -117.23 },
  'yokosuka': { lat: 35.28, lon: 139.67 },
  'hawaii': { lat: 21.35, lon: -157.97 },
  'guam': { lat: 13.45, lon: 144.65 },
  'bahrain': { lat: 26.23, lon: 50.62 },
};

// Fleet assets to track — name variants for GDELT search
const FLEET_SEARCH_TERMS = [
  { id: 'csg-cvn78', queries: ['"Gerald Ford" carrier', '"CVN-78"'] },
  { id: 'csg-cvn77', queries: ['"George H.W. Bush" carrier', '"CVN-77"'] },
  { id: 'csg-cvn75', queries: ['"Harry Truman" carrier', '"CVN-75"'] },
  { id: 'csg-cvn69', queries: ['"Eisenhower" carrier', '"CVN-69"'] },
  { id: 'csg-cvn72', queries: ['"Abraham Lincoln" carrier', '"CVN-72"'] },
  { id: 'csg-cvn71', queries: ['"Theodore Roosevelt" carrier', '"CVN-71"'] },
  { id: 'csg-cvn70', queries: ['"Carl Vinson" carrier', '"CVN-70"'] },
  { id: 'csg-cvn73', queries: ['"George Washington" carrier CVN', '"CVN-73"'] },
  { id: 'csg-cvn68', queries: ['"USS Nimitz" carrier', '"CVN-68"'] },
  { id: 'arg-lha6', queries: ['"USS America" amphibious', '"LHA-6"'] },
  { id: 'arg-lhd1', queries: ['"USS Wasp" amphibious', '"LHD-1"'] },
  { id: 'arg-lhd5', queries: ['"USS Bataan" amphibious', '"LHD-5"'] },
  { id: 'arg-lhd2', queries: ['"USS Essex" amphibious', '"LHD-2"'] },
  { id: 'arg-lhd8', queries: ['"Makin Island" amphibious', '"LHD-8"'] },
  { id: 'ssgn-727', queries: ['"USS Michigan" submarine', '"SSGN-727"'] },
];

// Extract the best matching region from article titles
function matchRegion(articles) {
  const text = articles.map((a) => a.title).join(' ').toLowerCase();
  let bestMatch = null;
  let bestIdx = Infinity;
  for (const [region, coords] of Object.entries(FLEET_REGIONS)) {
    const idx = text.indexOf(region);
    if (idx !== -1 && idx < bestIdx) {
      bestIdx = idx;
      bestMatch = { region, ...coords };
    }
  }
  return bestMatch;
}

// ─── Build fleet position data from GDELT ───
async function fetchFleetPositions() {
  const positions = {};

  // Query GDELT for each fleet asset (batch with concurrency limit)
  const batchSize = 5;
  for (let i = 0; i < FLEET_SEARCH_TERMS.length; i += batchSize) {
    const batch = FLEET_SEARCH_TERMS.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      batch.map(async (asset) => {
        const query = asset.queries.join(' OR ');
        const articles = await fetchGDELT(query, 15, '30d');
        if (articles.length === 0) return null;

        const regionMatch = matchRegion(articles);
        return {
          id: asset.id,
          articles: articles.slice(0, 5).map((a) => ({
            title: a.title,
            url: a.url,
            date: a.date,
            source: a.source,
          })),
          ...(regionMatch ? { lat: regionMatch.lat, lon: regionMatch.lon, region: regionMatch.region } : {}),
        };
      })
    );

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        positions[result.value.id] = result.value;
      }
    }
  }

  return {
    positions,
    dataSource: 'GDELT Doc API',
    lastUpdated: new Date().toISOString(),
  };
}

// ─── Public API ───

export const stabilityService = {
  async getProtestData() {
    const cacheKey = 'stability:protests';
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const data = await fetchProtestData();
    await cacheService.set(cacheKey, data, CACHE_TTL);
    return data;
  },

  async getMilitaryData() {
    const cacheKey = 'stability:military';
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const data = await fetchMilitaryData();
    await cacheService.set(cacheKey, data, CACHE_TTL);
    return data;
  },

  async getInstabilityData() {
    const cacheKey = 'stability:instability';
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const data = await fetchInstabilityData();
    await cacheService.set(cacheKey, data, CACHE_TTL);
    return data;
  },

  async getFleetPositions() {
    const cacheKey = 'stability:fleet';
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const data = await fetchFleetPositions();
    await cacheService.set(cacheKey, data, CACHE_TTL);
    return data;
  },

  async getCombinedData() {
    const cacheKey = 'stability:combined';
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const [protests, military, instability, fleet] = await Promise.allSettled([
      this.getProtestData(),
      this.getMilitaryData(),
      this.getInstabilityData(),
      this.getFleetPositions(),
    ]);

    const data = {
      protests: protests.status === 'fulfilled' ? protests.value : { heatmapPoints: [], totalArticles: 0 },
      military: military.status === 'fulfilled' ? military.value : { indicators: [], totalArticles: 0 },
      instability: instability.status === 'fulfilled' ? instability.value : { alerts: [], totalArticles: 0 },
      fleet: fleet.status === 'fulfilled' ? fleet.value : { positions: {} },
      dataSource: 'GDELT Doc API',
      lastUpdated: new Date().toISOString(),
    };

    await cacheService.set(cacheKey, data, CACHE_TTL);
    return data;
  },
};
