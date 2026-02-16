/**
 * Commodities & Supply Shocks Service
 * Sources: Yahoo Finance for commodity prices (free, no auth)
 *          Google News RSS for supply disruption news
 */

import { cacheService } from './cache.service.js';
import Parser from 'rss-parser';

const parser = new Parser({ timeout: 10000 });
const CACHE_KEY = 'commodities:combined';
const CACHE_TTL = 300; // 5 minutes

// Yahoo Finance commodity tickers
const COMMODITY_TICKERS = [
  { symbol: 'CL=F', name: 'Crude Oil (WTI)', category: 'energy', unit: '$/bbl' },
  { symbol: 'BZ=F', name: 'Brent Crude', category: 'energy', unit: '$/bbl' },
  { symbol: 'NG=F', name: 'Natural Gas', category: 'energy', unit: '$/MMBtu' },
  { symbol: 'GC=F', name: 'Gold', category: 'metals', unit: '$/oz' },
  { symbol: 'SI=F', name: 'Silver', category: 'metals', unit: '$/oz' },
  { symbol: 'HG=F', name: 'Copper', category: 'metals', unit: '$/lb' },
  { symbol: 'PL=F', name: 'Platinum', category: 'metals', unit: '$/oz' },
  { symbol: 'ZW=F', name: 'Wheat', category: 'agriculture', unit: '¢/bu' },
  { symbol: 'ZC=F', name: 'Corn', category: 'agriculture', unit: '¢/bu' },
  { symbol: 'ZS=F', name: 'Soybeans', category: 'agriculture', unit: '¢/bu' },
  { symbol: 'KC=F', name: 'Coffee', category: 'agriculture', unit: '¢/lb' },
  { symbol: 'CT=F', name: 'Cotton', category: 'agriculture', unit: '¢/lb' },
  { symbol: 'SB=F', name: 'Sugar', category: 'agriculture', unit: '¢/lb' },
  { symbol: 'UX1!=F', name: 'Uranium', category: 'energy', unit: '$/lb' },
  { symbol: 'LBS=F', name: 'Lumber', category: 'materials', unit: '$/mbf' },
];

async function fetchYahooCommodity(symbol) {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=5d&interval=1d`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const meta = data.chart?.result?.[0]?.meta;
    if (!meta) return null;

    const closes = data.chart?.result?.[0]?.indicators?.quote?.[0]?.close || [];
    const prevClose = meta.chartPreviousClose || meta.previousClose;
    const price = meta.regularMarketPrice;
    const change = price && prevClose ? ((price - prevClose) / prevClose) * 100 : null;

    // Get 5-day trend
    const validCloses = closes.filter(c => c != null);

    return {
      price,
      prevClose,
      change: change ? parseFloat(change.toFixed(2)) : null,
      currency: meta.currency || 'USD',
      marketState: meta.marketState,
      trend: validCloses,
    };
  } catch (err) {
    return null;
  }
}

async function fetchCommodityPrices() {
  const results = [];
  // Fetch in batches to avoid rate limiting
  for (let i = 0; i < COMMODITY_TICKERS.length; i += 5) {
    const batch = COMMODITY_TICKERS.slice(i, i + 5);
    const batchResults = await Promise.allSettled(
      batch.map(async (ticker) => {
        const data = await fetchYahooCommodity(ticker.symbol);
        return { ...ticker, ...data };
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
    };

    await cacheService.set(CACHE_KEY, result, CACHE_TTL);
    return result;
  },
};
