/**
 * Economic Data Service
 * Fetches live economic indicators — tries backend first (Redis-cached, pre-warmed),
 * then falls back to direct World Bank API calls, then to static baseline data.
 *
 * Backend indicators (7 total):
 *   inflation, gdpGrowth, unemployment, debtToGdp, population, tradePercGdp, currentAccount
 *
 * Direct World Bank fallback (3 indicators):
 *   FP.CPI.TOTL.ZG  — Inflation (CPI, annual %)
 *   NY.GDP.MKTP.KD.ZG — GDP growth (annual %)
 *   SL.UEM.TOTL.ZS  — Unemployment (% of labor force)
 *
 * Cache: 24 hours (this data is annual so it won't change often)
 */

import { getEconomicData } from '../features/country/economicData';
import api from './api';

const WB_BASE = 'https://api.worldbank.org/v2/country';
const INDICATORS = {
  inflation: 'FP.CPI.TOTL.ZG',
  gdpGrowth: 'NY.GDP.MKTP.KD.ZG',
  unemployment: 'SL.UEM.TOTL.ZS',
};

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const cache = new Map();

/**
 * Try fetching from the backend service first (has Redis caching + more indicators).
 */
async function fetchFromBackend(cca2) {
  if (!cca2) return null;
  try {
    const res = await api.getEconomicData(cca2);
    if (res.success && res.data) {
      return res.data;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Fetch a single World Bank indicator for a country code.
 * Returns { value, date } or null.
 */
async function fetchWBIndicator(cca2, indicatorCode) {
  const url =
    `${WB_BASE}/${cca2}/indicator/${indicatorCode}` +
    `?format=json&per_page=5&date=2018:2026&mrv=1`;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;

    const json = await res.json();
    // World Bank returns [metadata, data[]]
    const data = json?.[1];
    if (!Array.isArray(data) || data.length === 0) return null;

    // Find most recent non-null value
    for (const entry of data) {
      if (entry.value != null) {
        return {
          value: Math.round(entry.value * 10) / 10,
          date: entry.date,
        };
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Fetch live economic data for a country from World Bank directly.
 * Returns an object with updated indicator values, or null.
 */
async function fetchWBDataDirect(cca2) {
  if (!cca2) return null;

  const key = `wb_${cca2}`;
  const cached = cache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.data;
  }

  try {
    const [inflation, gdpGrowth, unemployment] = await Promise.all([
      fetchWBIndicator(cca2, INDICATORS.inflation),
      fetchWBIndicator(cca2, INDICATORS.gdpGrowth),
      fetchWBIndicator(cca2, INDICATORS.unemployment),
    ]);

    const result = {};
    if (inflation) {
      result.inflation = inflation.value;
      result.inflationDate = inflation.date;
    }
    if (gdpGrowth) {
      result.gdpGrowth = gdpGrowth.value;
      result.gdpDate = gdpGrowth.date;
    }
    if (unemployment) {
      result.unemployment = unemployment.value;
      result.unemploymentDate = unemployment.date;
    }

    const hasData = Object.keys(result).length > 0;
    if (hasData) {
      cache.set(key, { data: result, ts: Date.now() });
    }
    return hasData ? result : null;
  } catch {
    return null;
  }
}

/**
 * Merge live data into the static baseline, preferring newer data.
 */
function mergeWithStatic(staticData, liveData) {
  const result = { ...(staticData || {}) };

  if (!liveData) return result;

  // Override with live data where available (only if it's newer)
  const pairs = [
    ['inflation', 'inflationDate'],
    ['gdpGrowth', 'gdpDate'],
    ['unemployment', 'unemploymentDate'],
    ['debtToGdp', 'debtToGdpDate'],
  ];

  for (const [valKey, dateKey] of pairs) {
    if (liveData[valKey] != null) {
      const liveYear = parseInt(liveData[dateKey]) || 9999;
      const staticYear = parseInt(result[dateKey]) || 0;
      if (liveYear >= staticYear) {
        result[valKey] = liveData[valKey];
        result[dateKey] = liveData[dateKey];
      }
    }
  }

  // Population from World Bank (always prefer live)
  if (liveData.population != null) {
    result.populationWB = liveData.population;
    result.populationDate = liveData.populationDate;
  }

  // Additional indicators from backend
  if (liveData.tradePercGdp != null) {
    result.tradePercGdp = liveData.tradePercGdp;
    result.tradePercGdpDate = liveData.tradePercGdpDate;
  }
  if (liveData.currentAccount != null) {
    result.currentAccount = liveData.currentAccount;
    result.currentAccountDate = liveData.currentAccountDate;
  }

  result.liveSource = liveData.source || 'worldbank';
  result.lastUpdated = liveData.fetchedAt || new Date().toISOString();

  return result;
}

/**
 * Get economic data for a country. Tries:
 * 1. Backend (Redis-cached, pre-warmed, 7 indicators)
 * 2. Direct World Bank API (3 indicators)
 * 3. Static baseline from economicData.js
 *
 * Returns the merged result.
 */
export async function fetchEconomicProfile(countryName, cca2) {
  const staticData = getEconomicData(countryName);
  const effectiveCca2 = cca2 || staticData?.cca2 || null;

  // Try backend first (has more indicators + Redis caching)
  let liveData = await fetchFromBackend(effectiveCca2);

  // Fall back to direct World Bank calls if backend is unreachable
  if (!liveData) {
    liveData = await fetchWBDataDirect(effectiveCca2);
  }

  if (!staticData && !liveData) return null;

  return mergeWithStatic(staticData, liveData);
}
