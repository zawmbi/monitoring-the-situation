/**
 * Commodities & Supply Shocks Service
 * Sources: Financial Modeling Prep (FMP) for commodity prices (requires API key)
 *          Google News RSS for supply disruption news
 *
 * dataSource: "Financial Modeling Prep (FMP)" for all commodity price data
 */

import { cacheService } from './cache.service.js';
import config from '../config/index.js';
import Parser from 'rss-parser';

const parser = new Parser({ timeout: 10000 });
const CACHE_KEY = 'commodities:combined';
const CACHE_TTL = 300; // 5 minutes

const DATA_SOURCE = 'Financial Modeling Prep (FMP)';

// ── Get the FMP API key ──
function getFmpKey() {
  return config.fmp?.key || process.env.VITE_FMP_API_KEY || '';
}

// FMP commodity symbols (FMP uses its own symbol format for commodities)
const COMMODITY_TICKERS = [
  { symbol: 'CLUSD', name: 'Crude Oil (WTI)', category: 'energy', unit: '$/bbl' },
  { symbol: 'BZUSD', name: 'Brent Crude', category: 'energy', unit: '$/bbl' },
  { symbol: 'NGUSD', name: 'Natural Gas', category: 'energy', unit: '$/MMBtu' },
  { symbol: 'GCUSD', name: 'Gold', category: 'metals', unit: '$/oz' },
  { symbol: 'SIUSD', name: 'Silver', category: 'metals', unit: '$/oz' },
  { symbol: 'HGUSD', name: 'Copper', category: 'metals', unit: '$/lb' },
  { symbol: 'PLUSD', name: 'Platinum', category: 'metals', unit: '$/oz' },
  { symbol: 'ZWUSD', name: 'Wheat', category: 'agriculture', unit: '$/bu' },
  { symbol: 'ZCUSD', name: 'Corn', category: 'agriculture', unit: '$/bu' },
  { symbol: 'ZSUSD', name: 'Soybeans', category: 'agriculture', unit: '$/bu' },
  { symbol: 'KCUSD', name: 'Coffee', category: 'agriculture', unit: '$/lb' },
  { symbol: 'CTUSD', name: 'Cotton', category: 'agriculture', unit: '$/lb' },
  { symbol: 'SBUSD', name: 'Sugar', category: 'agriculture', unit: '$/lb' },
  { symbol: 'LBSUSD', name: 'Lumber', category: 'materials', unit: '$/mbf' },
];

async function fetchFmpCommodity(symbol) {
  const apiKey = getFmpKey();
  if (!apiKey) return null;

  try {
    const url = `https://financialmodelingprep.com/api/v3/quote/${encodeURIComponent(symbol)}?apikey=${apiKey}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    const json = await res.json();
    const q = Array.isArray(json) ? json[0] : json;
    if (!q || q.price == null) return null;

    const prevClose = q.previousClose ?? null;
    const change = q.changesPercentage ?? (q.price && prevClose ? ((q.price - prevClose) / prevClose) * 100 : null);

    return {
      price: q.price,
      prevClose,
      change: change != null ? parseFloat(change.toFixed(2)) : null,
      currency: q.currency || 'USD',
      dayHigh: q.dayHigh ?? null,
      dayLow: q.dayLow ?? null,
      open: q.open ?? null,
      volume: q.volume ?? null,
    };
  } catch (err) {
    return null;
  }
}

async function fetchCommodityPrices() {
  const apiKey = getFmpKey();
  if (!apiKey) return [];

  const results = [];
  // Fetch in batches to avoid rate limiting
  for (let i = 0; i < COMMODITY_TICKERS.length; i += 5) {
    const batch = COMMODITY_TICKERS.slice(i, i + 5);
    const batchResults = await Promise.allSettled(
      batch.map(async (ticker) => {
        const data = await fetchFmpCommodity(ticker.symbol);
        return { ...ticker, ...data, dataSource: DATA_SOURCE };
      })
    );
    batchResults.forEach(r => {
      if (r.status === 'fulfilled' && r.value.price) {
        results.push(r.value);
      }
    });
  }
  return results;
}

async function fetchSupplyNews() {
  try {
    const url = 'https://news.google.com/rss/search?q=%22supply+chain%22+disruption+OR+shortage+OR+%22shipping+crisis%22+OR+%22commodity+prices%22&hl=en-US&gl=US&ceid=US:en';
    const feed = await parser.parseURL(url);
    return (feed.items || []).slice(0, 15).map(item => ({
      title: item.title,
      link: item.link,
      date: item.pubDate || item.isoDate,
      source: 'Google News',
    }));
  } catch (err) {
    console.error('[Commodities] News fetch error:', err.message);
    return [];
  }
}

export const commoditiesService = {
  async getCombinedData() {
    const cached = await cacheService.get(CACHE_KEY);
    if (cached) return cached;

    const [prices, news] = await Promise.allSettled([
      fetchCommodityPrices(),
      fetchSupplyNews(),
    ]);

    const commodities = prices.status === 'fulfilled' ? prices.value : [];

    const result = {
      commodities,
      supplyNews: news.status === 'fulfilled' ? news.value : [],
      summary: {
        totalTracked: commodities.length,
        gainers: commodities.filter(c => c.change > 0).length,
        losers: commodities.filter(c => c.change < 0).length,
        bigMovers: commodities.filter(c => Math.abs(c.change) > 3).length,
      },
      dataSource: DATA_SOURCE,
    };

    await cacheService.set(CACHE_KEY, result, CACHE_TTL);
    return result;
  },
};
