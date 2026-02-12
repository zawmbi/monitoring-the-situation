/**
 * Economic Data Service
 * Fetches live economic indicators from the World Bank API and merges
 * with static baseline data from economicData.js.
 *
 * World Bank indicators used:
 *   FP.CPI.TOTL.ZG  — Inflation (CPI, annual %)
 *   NY.GDP.MKTP.KD.ZG — GDP growth (annual %)
 *   SL.UEM.TOTL.ZS  — Unemployment (% of labor force)
 *
 * Cache: 24 hours (this data is annual so it won't change often)
 */

import { getEconomicData } from '../features/country/economicData';

const WB_BASE = 'https://api.worldbank.org/v2/country';
const INDICATORS = {
  inflation: 'FP.CPI.TOTL.ZG',
  gdpGrowth: 'NY.GDP.MKTP.KD.ZG',
  unemployment: 'SL.UEM.TOTL.ZS',
};

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const cache = new Map();

/**
 * Fetch a single World Bank indicator for a country code.
 * Returns { value, date } or null.
 */
async function fetchWBIndicator(cca2, indicatorCode) {
  const url =
    `${WB_BASE}/${cca2}/indicator/${indicatorCode}` +
    `?format=json&per_page=5&date=2020:2026&mrv=1`;

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
 * Fetch live economic data for a country from World Bank.
 * Returns an object with updated indicator values, or null.
 */
async function fetchWBData(cca2) {
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
 * Get economic data for a country. Merges static baseline with live World Bank data.
 * Returns the full object shape from economicData.js, with live values overriding
 * where available, plus a `source` and `lastUpdated` field.
 */
export async function fetchEconomicProfile(countryName, cca2) {
  const staticData = getEconomicData(countryName);
  const effectiveCca2 = cca2 || staticData?.cca2 || null;

  // Fetch live data in parallel
  const liveData = await fetchWBData(effectiveCca2);

  if (!staticData && !liveData) return null;

  const result = { ...(staticData || {}) };

  if (liveData) {
    // Override with live data where available (only if it's newer)
    if (liveData.inflation != null) {
      const liveYear = parseInt(liveData.inflationDate);
      const staticYear = parseInt(result.inflationDate) || 0;
      if (liveYear >= staticYear) {
        result.inflation = liveData.inflation;
        result.inflationDate = liveData.inflationDate;
      }
    }
    if (liveData.gdpGrowth != null) {
      const liveYear = parseInt(liveData.gdpDate);
      const staticYear = parseInt(result.gdpDate) || 0;
      if (liveYear >= staticYear) {
        result.gdpGrowth = liveData.gdpGrowth;
        result.gdpDate = liveData.gdpDate;
      }
    }
    if (liveData.unemployment != null) {
      const liveYear = parseInt(liveData.unemploymentDate);
      const staticYear = parseInt(result.unemploymentDate) || 0;
      if (liveYear >= staticYear) {
        result.unemployment = liveData.unemployment;
        result.unemploymentDate = liveData.unemploymentDate;
      }
    }
    result.liveSource = 'worldbank';
    result.lastUpdated = new Date().toISOString();
  }

  return result;
}
