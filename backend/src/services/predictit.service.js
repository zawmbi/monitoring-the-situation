/**
 * PredictIt Service
 * Fetches prediction markets from PredictIt (free, no auth needed)
 * Single endpoint returns ALL active markets — very simple API
 * Rate limit: ~1 request/minute recommended
 */

import { cacheService } from './cache.service.js';

const CACHE_KEY_PREFIX = 'predictit:markets';
const CACHE_TTL = 300; // 5 minutes
const PREDICTIT_API_URL = 'https://www.predictit.org/api/marketdata/all/';
const MIN_VOLUME = 0; // PredictIt doesn't expose volume, show all

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

class PredictItService {
  constructor() {
    this._memCache = null;
    this._memCacheTime = 0;
  }

  async fetchAllMarkets() {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(PREDICTIT_API_URL, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'MonitoringTheSituation/1.0',
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) throw new Error(`PredictIt API ${response.status}`);

      const data = await response.json();
      return data.markets || [];
    } catch (error) {
      clearTimeout(timeout);
      console.error('[PredictIt] Fetch failed:', error.message);
      throw error;
    }
  }

  normalizeMarkets(rawMarkets) {
    return rawMarkets
      .filter(m => m.status === 'Open')
      .map((market, idx) => {
        const contracts = market.contracts || [];

        const outcomes = contracts
          .filter(c => c.status === 'Open')
          .slice(0, 8)
          .map(c => ({
            name: c.name || c.shortName || 'Unknown',
            price: c.lastTradePrice ?? c.bestBuyYesCost ?? null,
          }));

        // Estimate volume from contract trade counts (PredictIt doesn't give dollar volume)
        const estimatedVolume = contracts.reduce((sum, c) => {
          // Each trade ~$1 avg on PredictIt
          return sum + (c.totalSharesTraded || 0);
        }, 0);

        const searchParts = [
          market.name, market.shortName,
          ...contracts.map(c => c.name || c.shortName || ''),
        ].filter(Boolean);

        return {
          id: `predictit-${market.id || idx}`,
          question: market.name || 'Untitled Market',
          description: market.shortName || '',
          volume: estimatedVolume,
          liquidity: 0,
          outcomes,
          category: 'Politics',
          active: true,
          closed: false,
          endDate: market.dateEnd || null,
          url: market.url || `https://www.predictit.org/markets/detail/${market.id}`,
          source: 'predictit',
          searchText: normalizeText(searchParts.join(' ')),
          rawSearchText: searchParts.join(' '),
        };
      })
      .filter(m => m.outcomes.length > 0);
  }

  scoreMarket(market, requiredKeywords, boostKeywords = [], matchAll = false) {
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
    if (matchAll && reqMatches.length < requiredKeywords.length) return 0;

    let score = 0;
    for (const k of reqMatches) score += matchesTitle(normalizeText(k)) ? 3 : 2;
    for (const k of boostKeywords) {
      if (matches(normalizeText(k))) score += matchesTitle(normalizeText(k)) ? 1.5 : 1;
    }
    return score;
  }

  filterByTopic(markets, requiredKeywords, boostKeywords = [], matchAll = false) {
    if (!requiredKeywords?.length) return [];
    return markets
      .map(m => ({ ...m, _score: this.scoreMarket(m, requiredKeywords, boostKeywords, matchAll) }))
      .filter(m => m._score > 0)
      .sort((a, b) => b._score - a._score || b.volume - a.volume)
      .map(({ _score, ...m }) => m);
  }

  async getAllMarkets() {
    const cacheKey = `${CACHE_KEY_PREFIX}:all`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    // Memory fallback
    if (this._memCache && (Date.now() - this._memCacheTime) < 30 * 60 * 1000) {
      return this._memCache;
    }

    try {
      const raw = await this.fetchAllMarkets();
      const normalized = this.normalizeMarkets(raw);

      if (normalized.length > 0) {
        await cacheService.set(cacheKey, normalized, CACHE_TTL);
        this._memCache = normalized;
        this._memCacheTime = Date.now();
      }

      return normalized;
    } catch (error) {
      if (this._memCache) {
        console.warn('[PredictIt] Using stale cache');
        return this._memCache;
      }
      return [];
    }
  }

  async getMarketsByTopic(requiredKeywords, boostKeywords = [], matchAll = false) {
    const allMarkets = await this.getAllMarkets();
    return this.filterByTopic(allMarkets, requiredKeywords, boostKeywords, matchAll);
  }

  async getTopMarkets(limit = 50) {
    const markets = await this.getAllMarkets();
    return markets.slice(0, limit);
  }
}

export const predictitService = new PredictItService();
export default predictitService;
