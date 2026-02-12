/**
 * World Bank Economic Data Service
 * Fetches live economic indicators from the World Bank Indicators API (v2).
 *
 * API: https://api.worldbank.org/v2/  (no key required)
 * License: CC BY 4.0 — free for commercial use with attribution.
 *
 * Indicators fetched:
 *   FP.CPI.TOTL.ZG    — Inflation, consumer prices (annual %)
 *   NY.GDP.MKTP.KD.ZG  — GDP growth (annual %)
 *   SL.UEM.TOTL.ZS     — Unemployment (% of total labor force, ILO estimate)
 *   GC.DOD.TOTL.GD.ZS  — Central government debt (% of GDP)
 *   SP.POP.TOTL         — Total population
 *   NE.TRD.GNFS.ZS     — Trade (% of GDP)
 *   BN.CAB.XOKA.GD.ZS  — Current account balance (% of GDP)
 *
 * Cache: 24 hours (data is annual, rarely changes)
 */

import { cacheService } from './cache.service.js';

const WB_BASE = 'https://api.worldbank.org/v2/country';

const INDICATORS = {
  inflation:      'FP.CPI.TOTL.ZG',
  gdpGrowth:      'NY.GDP.MKTP.KD.ZG',
  unemployment:   'SL.UEM.TOTL.ZS',
  debtToGdp:      'GC.DOD.TOTL.GD.ZS',
  population:     'SP.POP.TOTL',
  tradePercGdp:   'NE.TRD.GNFS.ZS',
  currentAccount: 'BN.CAB.XOKA.GD.ZS',
};

const CACHE_TTL = 86400; // 24 hours
const CACHE_PREFIX = 'wb:economic';

class WorldBankService {
  /**
   * Fetch a single indicator's most recent value for a country.
   * Returns { value, date } or null.
   */
  async fetchIndicator(cca2, indicatorCode) {
    const url =
      `${WB_BASE}/${cca2}/indicator/${indicatorCode}` +
      `?format=json&per_page=5&date=2018:2026&mrv=1`;

    try {
      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) return null;

      const json = await res.json();
      const data = json?.[1];
      if (!Array.isArray(data) || data.length === 0) return null;

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
   * Fetch all economic indicators for a country code (ISO 3166-1 alpha-2).
   * Returns a merged object or null if nothing was found.
   */
  async getEconomicData(cca2) {
    if (!cca2 || cca2.length !== 2) return null;

    const cacheKey = `${CACHE_PREFIX}:${cca2.toUpperCase()}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    console.log(`[WorldBank] Fetching economic data for ${cca2}...`);

    try {
      const entries = Object.entries(INDICATORS);
      const results = await Promise.all(
        entries.map(([, code]) => this.fetchIndicator(cca2, code))
      );

      const data = { cca2: cca2.toUpperCase(), source: 'World Bank', fetchedAt: new Date().toISOString() };
      let hasAny = false;

      entries.forEach(([key], i) => {
        if (results[i]) {
          data[key] = results[i].value;
          data[`${key}Date`] = results[i].date;
          hasAny = true;
        }
      });

      if (!hasAny) return null;

      await cacheService.set(cacheKey, data, CACHE_TTL);
      console.log(`[WorldBank] Economic data cached for ${cca2}`);
      return data;
    } catch (error) {
      console.error(`[WorldBank] Error fetching data for ${cca2}:`, error.message);
      return null;
    }
  }

  /**
   * Batch-fetch economic data for multiple country codes.
   * Used for background pre-warming of the cache.
   */
  async preloadCountries(cca2List) {
    console.log(`[WorldBank] Pre-loading economic data for ${cca2List.length} countries...`);
    let loaded = 0;

    // Process in batches of 5 to avoid overwhelming the API
    for (let i = 0; i < cca2List.length; i += 5) {
      const batch = cca2List.slice(i, i + 5);
      const results = await Promise.all(
        batch.map(code => this.getEconomicData(code))
      );
      loaded += results.filter(Boolean).length;

      // Small delay between batches to be respectful
      if (i + 5 < cca2List.length) {
        await new Promise(r => setTimeout(r, 500));
      }
    }

    console.log(`[WorldBank] Pre-loaded ${loaded}/${cca2List.length} countries`);
    return loaded;
  }
}

// Major countries to pre-load on startup
export const PRELOAD_COUNTRIES = [
  'US', 'CA', 'MX', 'BR', 'AR', 'CO', 'CL', 'PE',
  'GB', 'FR', 'DE', 'IT', 'ES', 'PL', 'NL', 'SE', 'NO', 'CH', 'AT', 'GR', 'PT', 'IE',
  'RU', 'UA', 'TR',
  'CN', 'JP', 'KR', 'IN', 'ID', 'TH', 'VN', 'PH', 'MY', 'SG', 'TW',
  'AU', 'NZ',
  'SA', 'AE', 'IL', 'EG', 'QA',
  'ZA', 'NG', 'KE', 'ET',
];

export const worldBankService = new WorldBankService();
export default worldBankService;
