/**
 * Kalshi Service
 * Fetches prediction markets from Kalshi public API (free, no auth)
 * Uses in-memory fallback cache when Redis is unavailable
 */

import { cacheService } from './cache.service.js';

const CACHE_KEY_PREFIX = 'kalshi:markets';
const CACHE_TTL = 300; // 5 minutes
const KALSHI_API_BASE = 'https://api.elections.kalshi.com/trade-api/v2';
const MIN_VOLUME = 1000; // $1k minimum

function normalizeText(value) {
  if (!value) return '';
  return value.toString().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .toLowerCase().replace(/\s+/g, ' ').trim();
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

class KalshiService {
  constructor() {
    this.baseUrl = KALSHI_API_BASE;
    this._memCache = null;
    this._memCacheTime = 0;
  }

  async fetchEvents(limit = 200) {
    const url = `${this.baseUrl}/events?limit=${limit}&status=open&with_nested_markets=true`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json', 'User-Agent': 'MonitoringTheSituation/1.0' },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) throw new Error(`Kalshi API ${response.status}`);

      const data = await response.json();
      return data.events || [];
    } catch (error) {
      clearTimeout(timeout);
      console.error('[Kalshi] Fetch failed:', error.message);
      throw error;
    }
  }

  normalizeMarkets(events) {
    const normalized = [];

    for (const event of events) {
      const markets = event.markets || [];
      const totalVolume = markets.reduce((sum, m) => sum + (m.volume || 0), 0);
      if (totalVolume < MIN_VOLUME) continue;

      function extractPrice(m) {
        if (m.last_price_dollars != null) return parseFloat(m.last_price_dollars);
        if (m.yes_ask_dollars != null) return parseFloat(m.yes_ask_dollars);
        if (m.last_price != null) return m.last_price / 100;
        if (m.yes_ask != null) return m.yes_ask / 100;
        return null;
      }

      let outcomes = markets
        .filter(m => m.status === 'open' || m.status === 'active')
        .slice(0, 6)
        .map(m => ({
          name: m.title || m.subtitle || m.ticker || 'Yes',
          price: extractPrice(m),
        }));

      // For simple yes/no with single sub-market
      if (markets.length === 1 && outcomes.length === 1) {
        const yesPrice = extractPrice(markets[0]) ?? 0.5;
        outcomes = [
          { name: 'Yes', price: yesPrice },
          { name: 'No', price: 1 - yesPrice },
        ];
      }

      const searchParts = [
        event.title, event.sub_title, event.category, event.series_ticker,
        ...markets.map(m => m.title || m.subtitle || ''),
      ].filter(Boolean);

      normalized.push({
        id: `kalshi-${event.event_ticker}`,
        question: event.title || 'Untitled Market',
        description: event.sub_title || '',
        volume: totalVolume,
        liquidity: markets.reduce((sum, m) => sum + (m.open_interest || 0), 0),
        outcomes,
        category: event.category || 'Other',
        active: true,
        closed: false,
        endDate: event.close_date || event.expected_expiration_time || markets[0]?.close_time || null,
        url: `https://kalshi.com/markets/${event.event_ticker}`,
        source: 'kalshi',
        searchText: normalizeText(searchParts.join(' ')),
        rawSearchText: searchParts.join(' '),
      });
    }

    return normalized.sort((a, b) => b.volume - a.volume);
  }

  scoreMarket(market, requiredKeywords, boostKeywords = []) {
    const text = market.searchText || normalizeText(`${market.question} ${market.description}`);
    const rawText = market.rawSearchText || `${market.question} ${market.description}`;
    const titleText = normalizeText(market.question || '');

    function matches(kw) {
      const regex = new RegExp(`\\b${escapeRegex(kw)}\\b`, 'i');
      return regex.test(text) || regex.test(rawText);
    }
    function matchesTitle(kw) {
      return new RegExp(`\\b${escapeRegex(kw)}\\b`, 'i').test(titleText);
    }

    const reqMatches = requiredKeywords.filter(k => matches(normalizeText(k)));
    if (reqMatches.length === 0) return 0;

    let score = 0;
    for (const k of reqMatches) score += matchesTitle(normalizeText(k)) ? 3 : 2;
    for (const k of boostKeywords) {
      if (matches(normalizeText(k))) score += matchesTitle(normalizeText(k)) ? 1.5 : 1;
    }
    return score;
  }

  filterByTopic(markets, requiredKeywords, boostKeywords = []) {
    if (!requiredKeywords?.length) return [];
    return markets
      .map(m => ({ ...m, _score: this.scoreMarket(m, requiredKeywords, boostKeywords) }))
      .filter(m => m._score > 0)
      .sort((a, b) => b._score - a._score || b.volume - a.volume)
      .map(({ _score, ...m }) => m);
  }

  async getAllMarkets() {
    const cacheKey = `${CACHE_KEY_PREFIX}:all`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    try {
      const events = await this.fetchEvents();
      const normalized = this.normalizeMarkets(events);

      if (normalized.length > 0) {
        await cacheService.set(cacheKey, normalized, CACHE_TTL);
        this._memCache = normalized;
        this._memCacheTime = Date.now();
      }

      return normalized;
    } catch (error) {
      // Return stale in-memory cache if API fails (up to 30 min)
      if (this._memCache && (Date.now() - this._memCacheTime) < 30 * 60 * 1000) {
        console.warn('[Kalshi] Using stale cache (' + Math.round((Date.now() - this._memCacheTime) / 60000) + 'm old)');
        return this._memCache;
      }
      return [];
    }
  }

  async getMarketsByTopic(requiredKeywords, boostKeywords = []) {
    const allMarkets = await this.getAllMarkets();
    return this.filterByTopic(allMarkets, requiredKeywords, boostKeywords);
  }

  async getTopMarkets(limit = 50) {
    const markets = await this.getAllMarkets();
    return markets.slice(0, limit);
  }
}

export const kalshiService = new KalshiService();
export default kalshiService;
