/**
 * Trade Flows & Shipping Disruptions Service
 * Sources: GDELT Doc API for shipping/trade disruption articles
 *          Static chokepoint reference data (locations, trade percentages)
 */

import { cacheService } from './cache.service.js';
import { fetchGDELT } from './gdelt.client.js';

const CACHE_KEY = 'shipping:combined';
const CACHE_TTL = 900; // 15 minutes

// Major maritime chokepoints (factual reference data)
const CHOKEPOINTS = [
  { id: 'suez', name: 'Suez Canal', lat: 30.46, lon: 32.34, traffic: '12-15% global trade' },
  { id: 'hormuz', name: 'Strait of Hormuz', lat: 26.57, lon: 56.25, traffic: '20% global oil' },
  { id: 'malacca', name: 'Strait of Malacca', lat: 2.5, lon: 101.5, traffic: '25% global trade' },
  { id: 'panama', name: 'Panama Canal', lat: 9.08, lon: -79.68, traffic: '5% global trade' },
  { id: 'bosporus', name: 'Turkish Straits', lat: 41.12, lon: 29.07, traffic: '3% global oil' },
  { id: 'bab', name: 'Bab el-Mandeb', lat: 12.58, lon: 43.33, traffic: '10% global trade' },
  { id: 'dover', name: 'Dover Strait', lat: 51.0, lon: 1.5, traffic: '500+ ships/day' },
  { id: 'gibraltar', name: 'Strait of Gibraltar', lat: 35.96, lon: -5.35, traffic: 'Med-Atlantic gateway' },
  { id: 'taiwan', name: 'Taiwan Strait', lat: 24.5, lon: 119.5, traffic: '~50% container ships' },
  { id: 'cape', name: 'Cape of Good Hope', lat: -34.36, lon: 18.49, traffic: 'Alternative to Suez' },
];

const SHIPPING_QUERIES = [
  'shipping disruption OR "supply chain" OR "port congestion" OR "freight rates"',
  '"Red Sea" shipping OR "Suez Canal" OR "Panama Canal" drought',
  '"trade war" OR "trade dispute" OR "export ban" OR "import restriction"',
];

async function fetchShippingArticles() {
  const allArticles = [];

  const results = await Promise.allSettled(
    SHIPPING_QUERIES.map(query =>
      fetchGDELT(query, { maxRecords: 25, timespan: '7d', caller: 'Shipping' })
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
    .slice(0, 50);
}

export const shippingService = {
  async getCombinedData() {
    const cached = await cacheService.get(CACHE_KEY);
    if (cached) return cached;

    const articles = await fetchShippingArticles();

    const result = {
      chokepoints: CHOKEPOINTS,
      articles,
      summary: {
        totalChokepoints: CHOKEPOINTS.length,
        totalArticles: articles.length,
      },
      dataSource: {
        chokepoints: 'Static reference data (maritime geography)',
        articles: 'GDELT Doc API',
      },
      lastUpdated: new Date().toISOString(),
    };

    await cacheService.set(CACHE_KEY, result, CACHE_TTL);
    return result;
  },
};
