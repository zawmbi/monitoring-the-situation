/**
 * Sanctions & Compliance Monitoring Service
 * Sources: GDELT Doc API for sanctions-related news
 *          Static sanctioned regimes reference data
 */

import { cacheService } from './cache.service.js';
import { fetchGDELT } from './gdelt.client.js';

const CACHE_KEY = 'sanctions:combined';
const CACHE_TTL = 900; // 15 minutes

// Sanctioned country profiles with key details
const SANCTIONED_REGIMES = [
  { country: 'Russia', code: 'RU', programs: ['UKRAINE-EO13661', 'RUSSIA-EO14024'], level: 'comprehensive', sectors: ['energy', 'finance', 'tech', 'defense'], lat: 55.75, lon: 37.62 },
  { country: 'Iran', code: 'IR', programs: ['IRAN', 'IRAN-HR'], level: 'comprehensive', sectors: ['energy', 'finance', 'nuclear', 'metals'], lat: 35.69, lon: 51.39 },
  { country: 'North Korea', code: 'KP', programs: ['DPRK', 'DPRK2', 'DPRK3'], level: 'comprehensive', sectors: ['all'], lat: 39.04, lon: 125.76 },
  { country: 'Syria', code: 'SY', programs: ['SYRIA'], level: 'comprehensive', sectors: ['energy', 'finance', 'defense'], lat: 33.51, lon: 36.31 },
  { country: 'Cuba', code: 'CU', programs: ['CUBA'], level: 'comprehensive', sectors: ['all'], lat: 23.11, lon: -82.37 },
  { country: 'Venezuela', code: 'VE', programs: ['VENEZUELA-EO13692'], level: 'targeted', sectors: ['energy', 'finance', 'mining'], lat: 10.49, lon: -66.88 },
  { country: 'Myanmar', code: 'MM', programs: ['BURMA-EO14014'], level: 'targeted', sectors: ['defense', 'mining'], lat: 16.87, lon: 96.2 },
  { country: 'Belarus', code: 'BY', programs: ['BELARUS-EO14038'], level: 'targeted', sectors: ['energy', 'finance', 'potash'], lat: 53.9, lon: 27.57 },
  { country: 'China', code: 'CN', programs: ['CHINA-EO13959', 'CMIC'], level: 'targeted', sectors: ['tech', 'defense', 'surveillance'], lat: 39.9, lon: 116.41 },
  { country: 'Yemen (Houthis)', code: 'YE', programs: ['YEMEN'], level: 'targeted', sectors: ['defense', 'maritime'], lat: 15.37, lon: 44.21 },
];

const SANCTIONS_QUERIES = [
  'sanctions imposed OR "new sanctions" OR "sanctions package"',
  'OFAC OR "sanctions evasion" OR "sanctions compliance"',
];

async function fetchSanctionsArticles() {
  const allArticles = [];

  const results = await Promise.allSettled(
    SANCTIONS_QUERIES.map(query =>
      fetchGDELT(query, { maxRecords: 30, timespan: '7d', caller: 'Sanctions' })
    )
  );

  results.forEach(r => {
    if (r.status === 'fulfilled') allArticles.push(...r.value);
  });

  // Deduplicate by URL
  const seen = new Set();
  return allArticles
    .filter(article => {
      if (seen.has(article.url)) return false;
      seen.add(article.url);
      return true;
    })
    .slice(0, 40);
}

export const sanctionsService = {
  async getCombinedData() {
    const cached = await cacheService.get(CACHE_KEY);
    if (cached) return cached;

    const articles = await fetchSanctionsArticles();

    const result = {
      regimes: SANCTIONED_REGIMES,
      articles,
      summary: {
        totalRegimes: SANCTIONED_REGIMES.length,
        totalArticles: articles.length,
      },
      dataSource: {
        regimes: 'Static reference data (OFAC/EU programs)',
        articles: 'GDELT Doc API',
      },
      lastUpdated: new Date().toISOString(),
    };

    await cacheService.set(CACHE_KEY, result, CACHE_TTL);
    return result;
  },
};
