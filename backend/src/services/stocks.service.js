/**
 * Stocks Service
 * Uses Alpha Vantage free API to surface top movers and market status
 */

import config from '../config/index.js';
import { cacheService } from './cache.service.js';

const CACHE_KEYS = {
  movers: 'stocks:movers',
  markets: 'stocks:markets',
  listings: 'stocks:listings',
};

const EXCHANGE_REGION_MAP = {
  NASDAQ: 'United States',
  NYSE: 'United States',
  'NYSE ARCA': 'United States',
  AMEX: 'United States',
  BATS: 'United States',
  TSX: 'Canada',
  TSXV: 'Canada',
  TSE: 'Japan',
  JPX: 'Japan',
  SSE: 'China',
  SZSE: 'China',
  HKEX: 'Hong Kong',
  HKSE: 'Hong Kong',
  LSE: 'United Kingdom',
  XLON: 'United Kingdom',
  XETRA: 'Germany',
  FWB: 'Germany',
  ASX: 'Australia',
  NSE: 'India',
  BSE: 'India',
  EURONEXT: 'Europe',
};

function parseNumber(value) {
  if (value === null || value === undefined) return null;
  const normalized = String(value).replace(/[%,$]/g, '').replace(/,/g, '');
  const num = parseFloat(normalized);
  return Number.isFinite(num) ? num : null;
}

function inferRegion(exchange = '') {
  const cleaned = exchange.trim().toUpperCase();
  if (cleaned in EXCHANGE_REGION_MAP) return EXCHANGE_REGION_MAP[cleaned];
  const match = Object.keys(EXCHANGE_REGION_MAP).find(key => cleaned.includes(key));
  return match ? EXCHANGE_REGION_MAP[match] : 'Global';
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  const headers = lines.shift().split(',').map(h => h.trim());
  return lines.map((line) => {
    const cells = line.match(/(".*?"|[^,]+)/g)?.map(cell => cell.replace(/^"|"$/g, '')) || [];
    const obj = {};
    headers.forEach((header, idx) => {
      obj[header] = cells[idx];
    });
    return obj;
  });
}

class StocksService {
  constructor() {
    this.apiKey = config.alphaVantage.key;
    this.baseUrl = config.alphaVantage.baseUrl;
  }

  requireApiKey() {
    if (!this.apiKey) {
      const err = new Error('Alpha Vantage API key not configured. Set ALPHA_VANTAGE_API_KEY.');
      err.code = 'NO_API_KEY';
      throw err;
    }
  }

  buildUrl(params = {}) {
    const url = new URL(this.baseUrl);
    Object.entries({ ...params, apikey: this.apiKey }).forEach(([key, value]) => url.searchParams.set(key, value));
    return url.toString();
  }

  async fetchJson(params = {}) {
    this.requireApiKey();
    const res = await fetch(this.buildUrl(params));
    if (!res.ok) {
      throw new Error(`Alpha Vantage request failed (${res.status})`);
    }
    const payload = await res.json();
    if (payload?.Note || payload?.Information || payload?.['Error Message']) {
      const err = new Error(payload.Note || payload.Information || payload['Error Message']);
      err.code = 'ALPHAVANTAGE_LIMIT';
      throw err;
    }
    return payload;
  }

  async fetchText(params = {}) {
    this.requireApiKey();
    const res = await fetch(this.buildUrl(params));
    if (!res.ok) {
      throw new Error(`Alpha Vantage request failed (${res.status})`);
    }
    const payload = await res.text();
    if (payload.includes('Thank you for using Alpha Vantage')) {
      const err = new Error('Alpha Vantage rate limit reached');
      err.code = 'ALPHAVANTAGE_LIMIT';
      throw err;
    }
    return payload;
  }

  async getTopMovers() {
    const cacheKey = CACHE_KEYS.movers;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const data = await this.fetchJson({ function: 'TOP_GAINERS_LOSERS' });
    const buckets = [
      ['top_gainers', 'gainer'],
      ['top_losers', 'loser'],
      ['most_actively_traded', 'active'],
    ];

    const normalized = [];
    buckets.forEach(([key, source]) => {
      (data?.[key] || []).forEach((entry, idx) => {
        normalized.push({
          symbol: entry.ticker,
          name: null,
          exchange: null,
          region: 'United States',
          price: parseNumber(entry.price),
          change: parseNumber(entry.change_amount),
          changePercent: parseNumber(entry.change_percentage),
          volume: parseNumber(entry.volume),
          source,
          rank: idx + 1,
        });
      });
    });

    await cacheService.set(cacheKey, normalized, config.alphaVantage.refreshIntervals.movers);
    return normalized;
  }

  async getMarketStatus() {
    const cacheKey = CACHE_KEYS.markets;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const payload = await this.fetchJson({ function: 'MARKET_STATUS' });
    const markets = (payload?.markets || []).map((market) => ({
      marketType: market.market_type,
      region: market.region,
      primaryExchanges: market.primary_exchanges,
      localOpen: market.local_open,
      localClose: market.local_close,
      status: market.current_status,
      notes: market.notes,
      timezone: market.timezone,
    }));

    await cacheService.set(cacheKey, markets, config.alphaVantage.refreshIntervals.markets);
    return markets;
  }

  async getListings(limit = 400) {
    const cacheKey = CACHE_KEYS.listings;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const text = await this.fetchText({ function: 'LISTING_STATUS' });
    const rows = parseCsv(text).filter(row => (row.status || '').toLowerCase() === 'active');

    const listings = rows.slice(0, limit).map((row) => ({
      symbol: row.symbol,
      name: row.name,
      exchange: row.exchange,
      region: inferRegion(row.exchange || ''),
      ipoDate: row.ipoDate,
    }));

    await cacheService.set(cacheKey, listings, config.alphaVantage.refreshIntervals.listings);
    return listings;
  }

  async getTopStocks(limit = 100) {
    const [movers, listings, markets] = await Promise.all([
      this.getTopMovers().catch((err) => {
        throw err;
      }),
      this.getListings(limit * 3).catch(() => []),
      this.getMarketStatus().catch(() => []),
    ]);

    const listingsBySymbol = new Map();
    listings.forEach((item) => listingsBySymbol.set(item.symbol, item));

    const seen = new Set();
    const combined = [];

    movers.forEach((stock) => {
      if (!stock.symbol || seen.has(stock.symbol)) return;
      const listing = listingsBySymbol.get(stock.symbol);
      const enriched = {
        ...stock,
        name: listing?.name || stock.name,
        exchange: listing?.exchange || stock.exchange,
        region: listing?.region || inferRegion(stock.exchange || ''),
      };
      combined.push(enriched);
      seen.add(stock.symbol);
    });

    for (const listing of listings) {
      if (combined.length >= limit) break;
      if (seen.has(listing.symbol)) continue;
      combined.push({
        symbol: listing.symbol,
        name: listing.name,
        exchange: listing.exchange,
        region: listing.region,
        price: null,
        change: null,
        changePercent: null,
        volume: null,
        source: 'listing',
        rank: combined.length + 1,
      });
      seen.add(listing.symbol);
    }

    return {
      items: combined.slice(0, limit),
      markets,
      lastUpdated: new Date().toISOString(),
      refreshIntervalSeconds: config.alphaVantage.refreshIntervals.movers,
    };
  }
}

export const stocksService = new StocksService();
export default stocksService;
