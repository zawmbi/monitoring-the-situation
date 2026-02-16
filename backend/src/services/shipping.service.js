/**
 * Trade Flows & Shipping Disruptions Service
 * Sources: Google News RSS for shipping/trade disruptions
 *          Freightos Baltic Index (via news)
 *          Major chokepoint monitoring
 */

import { cacheService } from './cache.service.js';
import Parser from 'rss-parser';

const parser = new Parser({ timeout: 10000 });
const CACHE_KEY = 'shipping:combined';
const CACHE_TTL = 900; // 15 minutes

// Major maritime chokepoints
const CHOKEPOINTS = [
  { id: 'suez', name: 'Suez Canal', lat: 30.46, lon: 32.34, traffic: '12-15% global trade', status: 'operational', risk: 'elevated', notes: 'Houthi attacks in Red Sea causing diversions' },
  { id: 'hormuz', name: 'Strait of Hormuz', lat: 26.57, lon: 56.25, traffic: '20% global oil', status: 'operational', risk: 'high', notes: 'Iran tensions affect oil transit' },
  { id: 'malacca', name: 'Strait of Malacca', lat: 2.5, lon: 101.5, traffic: '25% global trade', status: 'operational', risk: 'low', notes: 'Critical for China-Europe trade' },
  { id: 'panama', name: 'Panama Canal', lat: 9.08, lon: -79.68, traffic: '5% global trade', status: 'restricted', risk: 'moderate', notes: 'Drought-related transit restrictions' },
  { id: 'bosporus', name: 'Turkish Straits', lat: 41.12, lon: 29.07, traffic: '3% global oil', status: 'operational', risk: 'moderate', notes: 'Ukraine grain exports corridor' },
  { id: 'bab', name: 'Bab el-Mandeb', lat: 12.58, lon: 43.33, traffic: '10% global trade', status: 'disrupted', risk: 'critical', notes: 'Houthi missile/drone attacks on shipping' },
  { id: 'dover', name: 'Dover Strait', lat: 51.0, lon: 1.5, traffic: '500+ ships/day', status: 'operational', risk: 'low', notes: 'Busiest shipping lane globally' },
  { id: 'gibraltar', name: 'Strait of Gibraltar', lat: 35.96, lon: -5.35, traffic: 'Med-Atlantic gateway', status: 'operational', risk: 'low', notes: 'Critical for Mediterranean access' },
  { id: 'taiwan', name: 'Taiwan Strait', lat: 24.5, lon: 119.5, traffic: '~50% container ships', status: 'operational', risk: 'elevated', notes: 'Geopolitical tensions' },
  { id: 'cape', name: 'Cape of Good Hope', lat: -34.36, lon: 18.49, traffic: 'Alternative to Suez', status: 'operational', risk: 'low', notes: 'Increased traffic due to Red Sea diversions' },
];

async function fetchShippingNews() {
  const allItems = [];
  const sources = [
    { url: 'https://news.google.com/rss/search?q=shipping+disruption+OR+%22supply+chain%22+OR+%22port+congestion%22+OR+%22freight+rates%22&hl=en-US&gl=US&ceid=US:en', name: 'Shipping News' },
    { url: 'https://news.google.com/rss/search?q=%22Red+Sea%22+shipping+OR+%22Suez+Canal%22+OR+%22Panama+Canal%22+drought&hl=en-US&gl=US&ceid=US:en', name: 'Chokepoint News' },
    { url: 'https://news.google.com/rss/search?q=%22trade+war%22+OR+%22trade+dispute%22+OR+%22export+ban%22+OR+%22import+restriction%22&hl=en-US&gl=US&ceid=US:en', name: 'Trade Disputes' },
  ];

  for (const source of sources) {
    try {
      const feed = await parser.parseURL(source.url);
      (feed.items || []).forEach(item => {
        allItems.push({
          title: item.title,
          link: item.link,
          date: item.pubDate || item.isoDate,
          source: source.name,
          snippet: item.contentSnippet?.slice(0, 200) || '',
        });
      });
    } catch (err) {
      console.error(`[Shipping] RSS error for ${source.name}:`, err.message);
    }
  }

  const seen = new Set();
  return allItems.filter(item => {
    const key = item.title?.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 40);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 30);
}

export const shippingService = {
  async getCombinedData() {
    const cached = await cacheService.get(CACHE_KEY);
    if (cached) return cached;

    const news = await fetchShippingNews();

    const result = {
      chokepoints: CHOKEPOINTS,
      tradeNews: news,
      summary: {
        totalChokepoints: CHOKEPOINTS.length,
        disrupted: CHOKEPOINTS.filter(c => c.status === 'disrupted').length,
        restricted: CHOKEPOINTS.filter(c => c.status === 'restricted').length,
        criticalRisk: CHOKEPOINTS.filter(c => c.risk === 'critical').length,
        highRisk: CHOKEPOINTS.filter(c => c.risk === 'high').length,
      },
    };

    await cacheService.set(CACHE_KEY, result, CACHE_TTL);
    return result;
  },
};
