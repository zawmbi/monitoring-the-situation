/**
 * Regime Stability Data Service
 * Pure data passthrough — returns raw data from upstream APIs per country:
 *   - GDELT articles about regime change/coups
 *   - World Bank governance/economic indicators
 *   - Static regime metadata (type, leadership tenure, succession, military role)
 *
 * No coup risk scores, no risk levels, no weighted formulas,
 * no composite indices, no severity classifications.
 *
 * Sources:
 *   GDELT Project API v2  — https://api.gdeltproject.org (free, no key)
 *   World Bank Indicators  — via worldBankService
 *
 * Cache: 30 minutes
 */

import { cacheService } from './cache.service.js';
import { worldBankService } from './worldbank.service.js';
import { fetchGDELT as gdeltFetchArticles } from './gdelt.client.js';

const CACHE_TTL = 1800; // 30 minutes
const CACHE_KEY_COMBINED = 'regime:combined';
const CACHE_KEY_PROFILES = 'regime:profiles';

// -- Country name lookup by ISO alpha-2 --
const ISO_TO_NAME = {
  AF: 'Afghanistan', AL: 'Albania', DZ: 'Algeria', AO: 'Angola', AR: 'Argentina',
  AM: 'Armenia', AU: 'Australia', AT: 'Austria', AZ: 'Azerbaijan', BH: 'Bahrain',
  BD: 'Bangladesh', BY: 'Belarus', BE: 'Belgium', BJ: 'Benin', BO: 'Bolivia',
  BA: 'Bosnia and Herzegovina', BW: 'Botswana', BR: 'Brazil', BN: 'Brunei',
  BG: 'Bulgaria', BF: 'Burkina Faso', BI: 'Burundi', KH: 'Cambodia', CM: 'Cameroon',
  CA: 'Canada', CF: 'Central African Republic', TD: 'Chad', CL: 'Chile', CN: 'China',
  CO: 'Colombia', CD: 'DR Congo', CG: 'Republic of Congo', CR: 'Costa Rica',
  CI: 'Ivory Coast', HR: 'Croatia', CU: 'Cuba', CZ: 'Czech Republic', DK: 'Denmark',
  DJ: 'Djibouti', DO: 'Dominican Republic', EC: 'Ecuador', EG: 'Egypt',
  SV: 'El Salvador', GQ: 'Equatorial Guinea', ER: 'Eritrea', EE: 'Estonia',
  SZ: 'Eswatini', ET: 'Ethiopia', FI: 'Finland', FR: 'France', GA: 'Gabon',
  GE: 'Georgia', DE: 'Germany', GH: 'Ghana', GR: 'Greece', GT: 'Guatemala',
  GN: 'Guinea', GW: 'Guinea-Bissau', HT: 'Haiti', HN: 'Honduras', HU: 'Hungary',
  IN: 'India', ID: 'Indonesia', IR: 'Iran', IQ: 'Iraq', IE: 'Ireland',
  IL: 'Israel', IT: 'Italy', JP: 'Japan', JO: 'Jordan', KZ: 'Kazakhstan',
  KE: 'Kenya', KP: 'North Korea', KR: 'South Korea', KW: 'Kuwait', KG: 'Kyrgyzstan',
  LA: 'Laos', LV: 'Latvia', LB: 'Lebanon', LY: 'Libya', LT: 'Lithuania',
  MG: 'Madagascar', MW: 'Malawi', MY: 'Malaysia', ML: 'Mali', MR: 'Mauritania',
  MX: 'Mexico', MD: 'Moldova', MN: 'Mongolia', MA: 'Morocco', MZ: 'Mozambique',
  MM: 'Myanmar', NA: 'Namibia', NP: 'Nepal', NL: 'Netherlands', NZ: 'New Zealand',
  NI: 'Nicaragua', NE: 'Niger', NG: 'Nigeria', NO: 'Norway', OM: 'Oman',
  PK: 'Pakistan', PS: 'Palestine', PA: 'Panama', PY: 'Paraguay', PE: 'Peru',
  PH: 'Philippines', PL: 'Poland', PT: 'Portugal', QA: 'Qatar', RO: 'Romania',
  RU: 'Russia', RW: 'Rwanda', SA: 'Saudi Arabia', SN: 'Senegal', RS: 'Serbia',
  SL: 'Sierra Leone', SG: 'Singapore', SK: 'Slovakia', SI: 'Slovenia', SO: 'Somalia',
  ZA: 'South Africa', SS: 'South Sudan', ES: 'Spain', LK: 'Sri Lanka', SD: 'Sudan',
  SE: 'Sweden', CH: 'Switzerland', SY: 'Syria', TW: 'Taiwan', TJ: 'Tajikistan',
  TZ: 'Tanzania', TH: 'Thailand', TG: 'Togo', TN: 'Tunisia', TR: 'Turkey',
  TM: 'Turkmenistan', UG: 'Uganda', UA: 'Ukraine', AE: 'United Arab Emirates',
  GB: 'United Kingdom', US: 'United States', UY: 'Uruguay', UZ: 'Uzbekistan',
  VE: 'Venezuela', VN: 'Vietnam', YE: 'Yemen', ZM: 'Zambia', ZW: 'Zimbabwe',
};

// -- Static regime metadata for 55 countries --
const REGIME_DATA = {
  AF: { country: 'Afghanistan', iso2: 'AF', regimeType: 'authoritarian', leaderSince: 2021, succession: 'unclear', militaryRole: 'ruler' },
  MM: { country: 'Myanmar', iso2: 'MM', regimeType: 'military-junta', leaderSince: 2021, succession: 'contested', militaryRole: 'ruler' },
  SD: { country: 'Sudan', iso2: 'SD', regimeType: 'military-junta', leaderSince: 2021, succession: 'contested', militaryRole: 'ruler' },
  SS: { country: 'South Sudan', iso2: 'SS', regimeType: 'authoritarian', leaderSince: 2011, succession: 'unclear', militaryRole: 'praetorian' },
  SY: { country: 'Syria', iso2: 'SY', regimeType: 'authoritarian', leaderSince: 2000, succession: 'unclear', militaryRole: 'praetorian' },
  YE: { country: 'Yemen', iso2: 'YE', regimeType: 'authoritarian', leaderSince: 2012, succession: 'contested', militaryRole: 'praetorian' },
  LY: { country: 'Libya', iso2: 'LY', regimeType: 'hybrid', leaderSince: 2021, succession: 'contested', militaryRole: 'praetorian' },
  SO: { country: 'Somalia', iso2: 'SO', regimeType: 'hybrid', leaderSince: 2022, succession: 'unclear', militaryRole: 'moderate-influence' },
  IQ: { country: 'Iraq', iso2: 'IQ', regimeType: 'hybrid', leaderSince: 2022, succession: 'unclear', militaryRole: 'moderate-influence' },
  CF: { country: 'Central African Republic', iso2: 'CF', regimeType: 'authoritarian', leaderSince: 2016, succession: 'unclear', militaryRole: 'praetorian' },
  CD: { country: 'DR Congo', iso2: 'CD', regimeType: 'hybrid', leaderSince: 2019, succession: 'unclear', militaryRole: 'moderate-influence' },
  TD: { country: 'Chad', iso2: 'TD', regimeType: 'military-junta', leaderSince: 2021, succession: 'unclear', militaryRole: 'ruler' },
  ML: { country: 'Mali', iso2: 'ML', regimeType: 'military-junta', leaderSince: 2021, succession: 'contested', militaryRole: 'ruler' },
  BF: { country: 'Burkina Faso', iso2: 'BF', regimeType: 'military-junta', leaderSince: 2022, succession: 'contested', militaryRole: 'ruler' },
  NE: { country: 'Niger', iso2: 'NE', regimeType: 'military-junta', leaderSince: 2023, succession: 'contested', militaryRole: 'ruler' },
  GN: { country: 'Guinea', iso2: 'GN', regimeType: 'military-junta', leaderSince: 2021, succession: 'unclear', militaryRole: 'ruler' },
  GA: { country: 'Gabon', iso2: 'GA', regimeType: 'military-junta', leaderSince: 2023, succession: 'unclear', militaryRole: 'ruler' },
  RU: { country: 'Russia', iso2: 'RU', regimeType: 'authoritarian', leaderSince: 2000, succession: 'unclear', militaryRole: 'moderate-influence' },
  BY: { country: 'Belarus', iso2: 'BY', regimeType: 'authoritarian', leaderSince: 1994, succession: 'unclear', militaryRole: 'moderate-influence' },
  CN: { country: 'China', iso2: 'CN', regimeType: 'one-party', leaderSince: 2012, succession: 'unclear', militaryRole: 'moderate-influence' },
  KP: { country: 'North Korea', iso2: 'KP', regimeType: 'one-party', leaderSince: 2011, succession: 'unclear', militaryRole: 'praetorian' },
  CU: { country: 'Cuba', iso2: 'CU', regimeType: 'one-party', leaderSince: 2018, succession: 'clear', militaryRole: 'moderate-influence' },
  VN: { country: 'Vietnam', iso2: 'VN', regimeType: 'one-party', leaderSince: 2021, succession: 'clear', militaryRole: 'civilian-control' },
  LA: { country: 'Laos', iso2: 'LA', regimeType: 'one-party', leaderSince: 2021, succession: 'clear', militaryRole: 'moderate-influence' },
  IR: { country: 'Iran', iso2: 'IR', regimeType: 'theocracy', leaderSince: 1989, succession: 'unclear', militaryRole: 'praetorian' },
  SA: { country: 'Saudi Arabia', iso2: 'SA', regimeType: 'monarchy', leaderSince: 2015, succession: 'clear', militaryRole: 'civilian-control' },
  AE: { country: 'United Arab Emirates', iso2: 'AE', regimeType: 'monarchy', leaderSince: 2022, succession: 'clear', militaryRole: 'civilian-control' },
  JO: { country: 'Jordan', iso2: 'JO', regimeType: 'monarchy', leaderSince: 1999, succession: 'clear', militaryRole: 'civilian-control' },
  MA: { country: 'Morocco', iso2: 'MA', regimeType: 'monarchy', leaderSince: 1999, succession: 'clear', militaryRole: 'civilian-control' },
  BH: { country: 'Bahrain', iso2: 'BH', regimeType: 'monarchy', leaderSince: 2002, succession: 'clear', militaryRole: 'moderate-influence' },
  QA: { country: 'Qatar', iso2: 'QA', regimeType: 'monarchy', leaderSince: 2013, succession: 'clear', militaryRole: 'civilian-control' },
  KW: { country: 'Kuwait', iso2: 'KW', regimeType: 'monarchy', leaderSince: 2023, succession: 'clear', militaryRole: 'civilian-control' },
  OM: { country: 'Oman', iso2: 'OM', regimeType: 'monarchy', leaderSince: 2020, succession: 'clear', militaryRole: 'civilian-control' },
  SZ: { country: 'Eswatini', iso2: 'SZ', regimeType: 'monarchy', leaderSince: 1986, succession: 'unclear', militaryRole: 'moderate-influence' },
  EG: { country: 'Egypt', iso2: 'EG', regimeType: 'authoritarian', leaderSince: 2014, succession: 'unclear', militaryRole: 'praetorian' },
  TH: { country: 'Thailand', iso2: 'TH', regimeType: 'hybrid', leaderSince: 2023, succession: 'unclear', militaryRole: 'praetorian' },
  PK: { country: 'Pakistan', iso2: 'PK', regimeType: 'hybrid', leaderSince: 2024, succession: 'contested', militaryRole: 'praetorian' },
  TR: { country: 'Turkey', iso2: 'TR', regimeType: 'hybrid', leaderSince: 2014, succession: 'unclear', militaryRole: 'moderate-influence' },
  VE: { country: 'Venezuela', iso2: 'VE', regimeType: 'authoritarian', leaderSince: 2013, succession: 'contested', militaryRole: 'praetorian' },
  NI: { country: 'Nicaragua', iso2: 'NI', regimeType: 'authoritarian', leaderSince: 2007, succession: 'unclear', militaryRole: 'moderate-influence' },
  HT: { country: 'Haiti', iso2: 'HT', regimeType: 'hybrid', leaderSince: 2024, succession: 'contested', militaryRole: 'moderate-influence' },
  UA: { country: 'Ukraine', iso2: 'UA', regimeType: 'democracy', leaderSince: 2019, succession: 'clear', militaryRole: 'civilian-control' },
  GE: { country: 'Georgia', iso2: 'GE', regimeType: 'hybrid', leaderSince: 2024, succession: 'contested', militaryRole: 'civilian-control' },
  TN: { country: 'Tunisia', iso2: 'TN', regimeType: 'authoritarian', leaderSince: 2019, succession: 'unclear', militaryRole: 'civilian-control' },
  ET: { country: 'Ethiopia', iso2: 'ET', regimeType: 'hybrid', leaderSince: 2018, succession: 'unclear', militaryRole: 'moderate-influence' },
  ER: { country: 'Eritrea', iso2: 'ER', regimeType: 'authoritarian', leaderSince: 1993, succession: 'unclear', militaryRole: 'praetorian' },
  RW: { country: 'Rwanda', iso2: 'RW', regimeType: 'authoritarian', leaderSince: 2000, succession: 'unclear', militaryRole: 'moderate-influence' },
  UG: { country: 'Uganda', iso2: 'UG', regimeType: 'authoritarian', leaderSince: 1986, succession: 'unclear', militaryRole: 'praetorian' },
  BD: { country: 'Bangladesh', iso2: 'BD', regimeType: 'hybrid', leaderSince: 2024, succession: 'unclear', militaryRole: 'moderate-influence' },
  PH: { country: 'Philippines', iso2: 'PH', regimeType: 'democracy', leaderSince: 2022, succession: 'clear', militaryRole: 'moderate-influence' },
  KH: { country: 'Cambodia', iso2: 'KH', regimeType: 'authoritarian', leaderSince: 2023, succession: 'clear', militaryRole: 'moderate-influence' },
  MZ: { country: 'Mozambique', iso2: 'MZ', regimeType: 'hybrid', leaderSince: 2024, succession: 'contested', militaryRole: 'moderate-influence' },
  NG: { country: 'Nigeria', iso2: 'NG', regimeType: 'democracy', leaderSince: 2023, succession: 'clear', militaryRole: 'moderate-influence' },
  ZW: { country: 'Zimbabwe', iso2: 'ZW', regimeType: 'authoritarian', leaderSince: 2017, succession: 'unclear', militaryRole: 'praetorian' },
  TJ: { country: 'Tajikistan', iso2: 'TJ', regimeType: 'authoritarian', leaderSince: 1994, succession: 'unclear', militaryRole: 'moderate-influence' },
  TM: { country: 'Turkmenistan', iso2: 'TM', regimeType: 'authoritarian', leaderSince: 2022, succession: 'clear', militaryRole: 'moderate-influence' },
  UZ: { country: 'Uzbekistan', iso2: 'UZ', regimeType: 'authoritarian', leaderSince: 2016, succession: 'unclear', militaryRole: 'moderate-influence' },
  KZ: { country: 'Kazakhstan', iso2: 'KZ', regimeType: 'authoritarian', leaderSince: 2019, succession: 'unclear', militaryRole: 'civilian-control' },
  AZ: { country: 'Azerbaijan', iso2: 'AZ', regimeType: 'authoritarian', leaderSince: 2003, succession: 'unclear', militaryRole: 'moderate-influence' },
};

// -- GDELT fetch helper (via shared rate-limited client) --
async function fetchGDELT(query, maxRecords = 50, timespan = '7d') {
  return gdeltFetchArticles(query, { maxRecords, timespan, caller: 'Regime' });
}

// -- Main service class --
class RegimeService {
  /**
   * Fetch raw GDELT articles about regime change/coups for a single country,
   * plus raw World Bank governance indicators.
   * No scoring, no risk levels.
   */
  async getCountryRegimeData(countryCode) {
    const cacheKey = `regime:data:${countryCode}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const regime = REGIME_DATA[countryCode];
    if (!regime) {
      return null;
    }

    const countryName = ISO_TO_NAME[countryCode] || regime.country;

    // Fetch GDELT articles and World Bank data in parallel
    let gdeltArticles = [];
    let economicData = null;

    const [gdeltResult, wbResult] = await Promise.allSettled([
      (async () => {
        const query = `"coup" OR "military takeover" OR "regime change" OR "political crisis" OR "power struggle" ${countryName}`;
        return fetchGDELT(query, 50, '14d');
      })(),
      worldBankService.getEconomicData(countryCode),
    ]);

    if (gdeltResult.status === 'fulfilled') {
      gdeltArticles = gdeltResult.value || [];
    }

    if (wbResult.status === 'fulfilled' && wbResult.value) {
      economicData = wbResult.value;
    }

    const result = {
      country: regime.country,
      iso2: regime.iso2,
      regimeType: regime.regimeType,
      leaderSince: regime.leaderSince,
      succession: regime.succession,
      militaryRole: regime.militaryRole,
      gdelt: {
        articleCount: gdeltArticles.length,
        articles: gdeltArticles.slice(0, 20).map(a => ({
          title: a.title,
          url: a.url,
          source: a.source,
          date: a.date,
          tone: a.tone ?? null,
        })),
      },
      worldBank: economicData ? {
        inflation: economicData.inflation ?? null,
        gdpGrowth: economicData.gdpGrowth ?? null,
        unemployment: economicData.unemployment ?? null,
        debtToGdp: economicData.debtToGdp ?? null,
        population: economicData.population ?? null,
      } : null,
      dataSources: [
        'GDELT Project — https://www.gdeltproject.org',
        'World Bank Indicators API — https://api.worldbank.org/v2/',
      ],
    };

    try {
      await cacheService.set(cacheKey, result, CACHE_TTL);
    } catch (err) {
      console.warn(`[RegimeService] Cache set failed for ${cacheKey}:`, err.message);
    }

    return result;
  }

  /**
   * Fetch GDELT articles related to regime instability for a specific country.
   * Returns raw article data, no scoring.
   */
  async getCountrySignals(countryCode, maxRecords = 10) {
    const cacheKey = `regime:signals:${countryCode}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const regime = REGIME_DATA[countryCode];
    if (!regime) return [];

    const countryName = ISO_TO_NAME[countryCode] || regime.country;
    const queries = [
      `"coup" OR "military takeover" ${countryName}`,
      `"political crisis" OR "power struggle" ${countryName}`,
      `"regime" OR "government collapse" ${countryName}`,
    ];

    const results = await Promise.allSettled(
      queries.map((q) => fetchGDELT(q, Math.ceil(maxRecords / 2), '14d'))
    );

    // Merge and deduplicate by URL
    const seenUrls = new Set();
    const merged = [];
    for (const result of results) {
      if (result.status !== 'fulfilled') continue;
      for (const article of result.value) {
        if (!seenUrls.has(article.url)) {
          seenUrls.add(article.url);
          merged.push(article);
        }
      }
    }

    // Sort by date descending and limit
    const sorted = merged
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      .slice(0, maxRecords);

    try {
      await cacheService.set(cacheKey, sorted, CACHE_TTL);
    } catch (err) {
      console.warn(`[RegimeService] Cache set failed for signals ${countryCode}:`, err.message);
    }

    return sorted;
  }

  /**
   * Get all regime profiles with raw upstream data.
   * Each profile includes static metadata + GDELT articles + World Bank data.
   * No scoring.
   */
  async getRegimeProfiles() {
    const cached = await cacheService.get(CACHE_KEY_PROFILES);
    if (cached) return cached;

    const countryCodes = Object.keys(REGIME_DATA);
    const profiles = [];

    // Process countries in batches of 8 to avoid overwhelming external APIs
    const batchSize = 8;
    for (let i = 0; i < countryCodes.length; i += batchSize) {
      const batch = countryCodes.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(
        batch.map(async (code) => {
          const [regimeData, recentEvents] = await Promise.allSettled([
            this.getCountryRegimeData(code),
            this.getCountrySignals(code, 5),
          ]);

          const data = regimeData.status === 'fulfilled' ? regimeData.value : null;
          const regime = REGIME_DATA[code];

          return {
            country: regime.country,
            iso2: regime.iso2,
            regimeType: regime.regimeType,
            leaderSince: regime.leaderSince,
            succession: regime.succession,
            militaryRole: regime.militaryRole,
            gdelt: data?.gdelt || { articleCount: 0, articles: [] },
            worldBank: data?.worldBank || null,
            recentEvents: recentEvents.status === 'fulfilled' ? recentEvents.value : [],
          };
        })
      );

      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          profiles.push(result.value);
        }
      }
    }

    try {
      await cacheService.set(CACHE_KEY_PROFILES, profiles, CACHE_TTL);
    } catch (err) {
      console.warn('[RegimeService] Cache set failed for profiles:', err.message);
    }

    return profiles;
  }

  /**
   * Main data method: returns combined regime data for the frontend.
   * Includes all profiles and summary statistics. No scoring.
   */
  async getCombinedData() {
    const cached = await cacheService.get(CACHE_KEY_COMBINED);
    if (cached) return cached;

    const profiles = await this.getRegimeProfiles();

    // Build summary statistics (raw counts only)
    const regimeTypeCounts = {};
    for (const profile of profiles) {
      regimeTypeCounts[profile.regimeType] = (regimeTypeCounts[profile.regimeType] || 0) + 1;
    }

    const summary = {
      total: profiles.length,
      byRegimeType: regimeTypeCounts,
      withGdeltArticles: profiles.filter(p => p.gdelt.articleCount > 0).length,
      withWorldBankData: profiles.filter(p => p.worldBank !== null).length,
    };

    const result = {
      profiles,
      summary,
      dataSources: [
        'GDELT Project — https://www.gdeltproject.org',
        'World Bank Indicators API — https://api.worldbank.org/v2/',
      ],
      updatedAt: new Date().toISOString(),
    };

    try {
      await cacheService.set(CACHE_KEY_COMBINED, result, CACHE_TTL);
    } catch (err) {
      console.warn('[RegimeService] Cache set failed for combined data:', err.message);
    }

    return result;
  }

  /**
   * Look up a single country's regime data by code.
   */
  async getCountryProfile(countryCode) {
    const code = (countryCode || '').toUpperCase();
    return this.getCountryRegimeData(code);
  }

  /**
   * Get static regime metadata (no dynamic computation).
   * Useful for quick lookups without API calls.
   */
  getStaticData(countryCode) {
    return REGIME_DATA[(countryCode || '').toUpperCase()] || null;
  }

  /**
   * Get all tracked country codes.
   */
  getTrackedCountries() {
    return Object.keys(REGIME_DATA);
  }

  /**
   * Invalidate all regime caches.
   */
  async invalidateCache() {
    try {
      const keys = [
        CACHE_KEY_COMBINED,
        CACHE_KEY_PROFILES,
        ...Object.keys(REGIME_DATA).map((c) => `regime:data:${c}`),
        ...Object.keys(REGIME_DATA).map((c) => `regime:signals:${c}`),
      ];
      await Promise.allSettled(keys.map((k) => cacheService.del(k)));
      console.info('[RegimeService] Cache invalidated');
    } catch (err) {
      console.warn('[RegimeService] Cache invalidation failed:', err.message);
    }
  }
}

export const regimeService = new RegimeService();
