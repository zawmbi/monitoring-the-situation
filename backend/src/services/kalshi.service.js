/**
 * Kalshi Service
 * Fetches prediction markets from Kalshi public API
 * No authentication required for read-only market data
 */

import { cacheService } from './cache.service.js';

const CACHE_KEY_PREFIX = 'kalshi:markets';
const CACHE_TTL = 300; // 5 minutes
const KALSHI_API_BASE = 'https://api.elections.kalshi.com/trade-api/v2';
const MIN_VOLUME = 1000; // $1k minimum for now

function normalizeText(value) {
  if (!value) return '';
  return value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

class KalshiService {
  constructor() {
    this.baseUrl = KALSHI_API_BASE;
  }

  /**
   * Fetch open events from Kalshi API
   */
  async fetchEvents(limit = 200) {
    try {
      const url = `${this.baseUrl}/events?limit=${limit}&status=open&with_nested_markets=true`;
      console.log('[Kalshi] Fetching from:', url);

      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' },
      });

      if (!response.ok) {
        const text = await response.text();
        console.error('[Kalshi] Error response:', text);
        throw new Error(`Kalshi API returned ${response.status}: ${text}`);
      }

      const data = await response.json();
      const events = data.events || [];
      console.log('[Kalshi] Received', events.length, 'events');
      return events;
    } catch (error) {
      console.error('[Kalshi] Error fetching events:', error.message);
      throw error;
    }
  }

  /**
   * Normalize Kalshi events into a common market format
   */
  normalizeMarkets(events) {
    const normalized = [];

    for (const event of events) {
      const markets = event.markets || [];

      // Calculate total volume across all markets in the event
      const totalVolume = markets.reduce((sum, m) => sum + (m.volume || 0), 0);

      if (totalVolume < MIN_VOLUME) continue;

      // Build outcomes from nested markets
      const outcomes = markets
        .filter(m => m.status === 'open' || m.status === 'active')
        .slice(0, 6)
        .map(m => ({
          name: m.title || m.subtitle || m.ticker || 'Yes',
          price: m.last_price != null ? m.last_price / 100 : (m.yes_ask != null ? m.yes_ask / 100 : null),
        }));

      // For simple yes/no markets with a single sub-market
      if (markets.length === 1 && outcomes.length === 1) {
        const m = markets[0];
        const yesPrice = m.last_price != null ? m.last_price / 100 : (m.yes_ask != null ? m.yes_ask / 100 : 0.5);
        outcomes.length = 0;
        outcomes.push(
          { name: 'Yes', price: yesPrice },
          { name: 'No', price: 1 - yesPrice }
        );
      }

      const searchParts = [
        event.title,
        event.sub_title,
        event.category,
        event.series_ticker,
        ...(markets.map(m => m.title || m.subtitle || '')),
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
        endDate: event.close_date || markets[0]?.close_time || null,
        url: `https://kalshi.com/markets/${event.event_ticker}`,
        source: 'kalshi',
        searchText: normalizeText(searchParts.join(' ')),
        rawSearchText: searchParts.join(' '),
      });
    }

    return normalized.sort((a, b) => b.volume - a.volume);
  }

  /**
   * Score a market against keyword sets.
   * requiredKeywords: at least one must match or the market is excluded.
   * boostKeywords:    optional, each match adds relevance score.
   */
  scoreMarket(market, requiredKeywords, boostKeywords = []) {
    const text = market.searchText || normalizeText(`${market.question} ${market.description} ${market.category}`);
    const rawText = market.rawSearchText || `${market.question} ${market.description}`;
    const titleText = normalizeText(market.question || '');

    function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

    function matches(keyword) {
      const regex = new RegExp(`\\b${escapeRe(keyword)}\\b`, 'i');
      return regex.test(text) || regex.test(rawText);
    }

    function matchesTitle(keyword) {
      const regex = new RegExp(`\\b${escapeRe(keyword)}\\b`, 'i');
      return regex.test(titleText);
    }

    const reqMatches = requiredKeywords.filter(k => matches(normalizeText(k)));
    if (reqMatches.length === 0) return 0;

    let score = 0;
    for (const k of reqMatches) {
      score += matchesTitle(normalizeText(k)) ? 3 : 2;
    }
    for (const k of boostKeywords) {
      if (matches(normalizeText(k))) {
        score += matchesTitle(normalizeText(k)) ? 1.5 : 1;
      }
    }

    return score;
  }

  /**
   * Filter markets by required + boost keywords with scoring.
   */
  filterByTopic(markets, requiredKeywords, boostKeywords = []) {
    if (!requiredKeywords || requiredKeywords.length === 0) return [];

    return markets
      .map(market => ({
        ...market,
        _score: this.scoreMarket(market, requiredKeywords, boostKeywords),
      }))
      .filter(m => m._score > 0)
      .sort((a, b) => b._score - a._score || b.volume - a.volume)
      .map(({ _score, ...market }) => market);
  }

  /**
   * Get all active markets
   */
  async getAllMarkets() {
    const cacheKey = `${CACHE_KEY_PREFIX}:all`;
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      console.log(`[Kalshi] Returning ${cached.length} cached markets`);
      return cached;
    }

    try {
      const events = await this.fetchEvents();
      const normalized = this.normalizeMarkets(events);
      console.log(`[Kalshi] Normalized to ${normalized.length} markets`);

      if (normalized.length > 0) {
        await cacheService.set(cacheKey, normalized, CACHE_TTL);
      }

      return normalized;
    } catch (error) {
      console.error('[Kalshi] Failed to fetch markets:', error);
      return [];
    }
  }

  /**
   * Get markets filtered by topic keywords
   */
  async getMarketsByTopic(requiredKeywords, boostKeywords = []) {
    const allMarkets = await this.getAllMarkets();
    return this.filterByTopic(allMarkets, requiredKeywords, boostKeywords);
  }

  /**
   * Get top markets by volume
   */
  async getTopMarkets(limit = 50) {
    const markets = await this.getAllMarkets();
    return markets.slice(0, limit);
  }
}

export const kalshiService = new KalshiService();
export default kalshiService;
