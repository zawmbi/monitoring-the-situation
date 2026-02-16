/**
 * Sanctions & Compliance Monitoring Service
 * Sources: Google News RSS for sanctions updates
 *          OFAC SDN data (US Treasury - free)
 *          EU sanctions data
 */

import { cacheService } from './cache.service.js';
import Parser from 'rss-parser';

const parser = new Parser({ timeout: 10000 });
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

async function fetchSanctionsNews() {
  const allItems = [];
  const sources = [
    { url: 'https://news.google.com/rss/search?q=sanctions+imposed+OR+%22new+sanctions%22+OR+%22sanctions+package%22&hl=en-US&gl=US&ceid=US:en', name: 'Sanctions News' },
    { url: 'https://news.google.com/rss/search?q=OFAC+OR+%22sanctions+evasion%22+OR+%22sanctions+compliance%22&hl=en-US&gl=US&ceid=US:en', name: 'Compliance News' },
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
      console.error(`[Sanctions] RSS error for ${source.name}:`, err.message);
    }
  }

  // Dedup
  const seen = new Set();
  return allItems.filter(item => {
    const key = item.title?.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 40);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 25);
}

export const sanctionsService = {
  async getCombinedData() {
    const cached = await cacheService.get(CACHE_KEY);
    if (cached) return cached;

    const news = await fetchSanctionsNews();

    const result = {
      regimes: SANCTIONED_REGIMES,
      recentNews: news,
      summary: {
        totalRegimes: SANCTIONED_REGIMES.length,
        comprehensive: SANCTIONED_REGIMES.filter(r => r.level === 'comprehensive').length,
        targeted: SANCTIONED_REGIMES.filter(r => r.level === 'targeted').length,
      },
    };

    await cacheService.set(CACHE_KEY, result, CACHE_TTL);
    return result;
  },
};
