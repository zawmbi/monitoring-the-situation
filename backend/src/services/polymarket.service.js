/**
 * Polymarket Service
 * Fetches prediction markets from Polymarket Gamma API (free, no auth)
 * Uses in-memory fallback cache when Redis is unavailable
 */

import { cacheService } from './cache.service.js';

const CACHE_KEY_PREFIX = 'polymarket:markets';
const CACHE_TTL = 300; // 5 minutes
const POLYMARKET_API_BASE = 'https://gamma-api.polymarket.com';
const MIN_VOLUME = 5000; // $5k minimum volume

const STOPWORDS = new Set(['of', 'the', 'and', 'or', 'for', 'in', 'on', 'to', 'a', 'an']);
const COMMON_PREFIXES = [
  'republic of ', 'democratic republic of ', 'federal republic of ',
  'kingdom of ', 'state of ', 'states of ', 'federated states of ',
  'islamic republic of ', 'people s republic of ', 'plurinational state of ',
  'bolivarian republic of ', 'united republic of ', 'arab republic of ',
  'sultanate of ', 'emirate of ', 'emirates of ',
];

const COUNTRY_ALIASES = {
  'united states of america': ['united states', 'usa', 'u.s.', 'u.s.a', 'us', 'america', 'american'],
  'united states': ['usa', 'u.s.', 'u.s.a', 'us', 'america', 'american'],
  'united kingdom': ['uk', 'u.k.', 'britain', 'great britain', 'british', 'england', 'scotland', 'wales', 'northern ireland'],
  'russia': ['russian federation', 'russian'],
  'iran': ['islamic republic of iran', 'iranian'],
  'syria': ['syrian arab republic', 'syrian'],
  'cote d ivoire': ["cote d'ivoire", 'ivory coast'],
  'czechia': ['czech republic', 'czech'],
  'vietnam': ['viet nam', 'vietnamese'],
  'laos': ['lao', 'lao pdr', 'lao peoples democratic republic'],
  'bolivia': ['plurinational state of bolivia', 'bolivian'],
  'venezuela': ['bolivarian republic of venezuela', 'venezuelan'],
  'tanzania': ['united republic of tanzania', 'tanzanian'],
  'moldova': ['republic of moldova', 'moldovan'],
  'north korea': ['dprk', 'democratic people s republic of korea', 'north korean'],
  'south korea': ['republic of korea', 'rok', 'south korean', 'korean'],
  'china': ['prc', 'people s republic of china', 'chinese', 'mainland china'],
  'hong kong': ['hong kong sar', 'hongkong'],
  'taiwan': ['republic of china', 'roc', 'taiwanese'],
  'united arab emirates': ['uae', 'u.a.e.', 'emirates', 'emirati'],
  'saudi arabia': ['ksa', 'kingdom of saudi arabia', 'saudi'],
  'cabo verde': ['cape verde', 'cape verdean'],
  'north macedonia': ['macedonia', 'republic of macedonia', 'macedonian'],
  'myanmar': ['burma', 'burmese'],
  'eswatini': ['swaziland', 'swazi'],
  'republic of the congo': ['congo-brazzaville', 'congo'],
  'democratic republic of the congo': ['dr congo', 'drc', 'congo-kinshasa'],
};

function normalizeText(value) {
  if (!value) return '';
  return value.toString().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .toLowerCase().replace(/\s+/g, ' ').trim();
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildCountrySearchProfile(countryName) {
  const normalizedName = normalizeText(countryName);
  const variants = new Set();
  const acronyms = new Set();

  if (normalizedName) {
    variants.add(normalizedName);
    COMMON_PREFIXES.forEach((prefix) => {
      if (normalizedName.startsWith(prefix)) {
        const trimmed = normalizedName.slice(prefix.length).trim();
        if (trimmed.length >= 3) variants.add(trimmed);
      }
    });
    const tokens = normalizedName.split(' ').filter(Boolean);
    const tokensNoStop = tokens.filter((token) => !STOPWORDS.has(token));
    if (tokensNoStop.length > 1) variants.add(tokensNoStop.join(' '));
    if (tokensNoStop.length === 1) variants.add(tokensNoStop[0]);
    if (tokensNoStop.length >= 2) {
      const acronym = tokensNoStop.map((token) => token[0]).join('');
      if (acronym.length >= 2 && acronym.length <= 4) acronyms.add(acronym.toUpperCase());
    }
  }

  const aliases = COUNTRY_ALIASES[normalizedName] || [];
  aliases.forEach((alias) => {
    const normalizedAlias = normalizeText(alias);
    if (normalizedAlias) {
      variants.add(normalizedAlias);
      const aliasTokens = normalizedAlias.split(' ').filter(Boolean);
      if (aliasTokens.length >= 2) {
        const acronym = aliasTokens.map((token) => token[0]).join('');
        if (acronym.length >= 2 && acronym.length <= 4) acronyms.add(acronym.toUpperCase());
      }
    }
  });

  return {
    termRegexes: Array.from(variants).filter(t => t.length >= 3).map(t => new RegExp(`\\b${escapeRegex(t)}\\b`, 'i')),
    acronymRegexes: Array.from(acronyms).map(a => new RegExp(`\\b${a.split('').join('\\.?')}\\b`)),
  };
}

/**
 * Detect bracket/margin-of-victory style outcomes (e.g. "Talarico ≥ 10%",
 * "8% - 10%", "200-249 seats") that produce cluttered cards instead of
 * clean head-to-head displays.  Returns true when the market should be
 * excluded.
 */
function isBracketMarket(outcomes) {
  if (!outcomes || outcomes.length === 0) return false;
  const bracketPatterns = [
    /[≥≤><]\s*\d/,                // ≥ 10, < 5, etc.
    /\d+\.?\d*\s*%?\s*[-–—]\s*\d+\.?\d*\s*%/, // "8% - 10%", "5%-10%"
    /\d+\.?\d*\s*[-–—]\s*\d+\.?\d*\s*%/,       // "8 - 10%"
    /\bor more\b/i,
    /\bor fewer\b/i,
    /\bor less\b/i,
    /\bmargin\b/i,
  ];
  const bracketCount = outcomes.filter(o => {
    const name = (o.name || o || '').toString();
    return bracketPatterns.some(p => p.test(name));
  }).length;
  // If more than a third of outcomes look like brackets, skip this market
  return bracketCount >= Math.max(1, Math.ceil(outcomes.length / 3));
}

/**
 * Try to parse a JSON-ish string (e.g. "[\"0.85\",\"0.15\"]")
 */
function tryParseJSON(str) {
  if (!str) return null;
  try { return JSON.parse(str); } catch { return null; }
}

class PolymarketService {
  constructor() {
    this.baseUrl = POLYMARKET_API_BASE;
    // In-memory stale cache for when Redis is down or API fails
    this._memCache = null;
    this._memCacheTime = 0;
  }

  async fetchMarkets(limit = 200) {
    // Fetch multiple pages to get more than 100 events
    const allEvents = [];
    const pageSize = Math.min(limit, 100);
    const pages = Math.ceil(limit / pageSize);

    for (let page = 0; page < pages; page++) {
      const offset = page * pageSize;
      const url = `${this.baseUrl}/events?limit=${pageSize}&offset=${offset}&active=true&closed=false&order=volume&ascending=false`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      try {
        const response = await fetch(url, {
          headers: { 'Accept': 'application/json', 'User-Agent': 'MonitoringTheSituation/1.0' },
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!response.ok) throw new Error(`Polymarket API ${response.status}`);

        const data = await response.json();
        const events = Array.isArray(data) ? data
          : Array.isArray(data?.data) ? data.data
          : Array.isArray(data?.events) ? data.events
          : [];

        allEvents.push(...events);
        if (events.length < pageSize) break; // No more pages
      } catch (error) {
        clearTimeout(timeout);
        if (page === 0) {
          console.error('[Polymarket] Fetch failed:', error.message);
          throw error;
        }
        break; // Got some pages, stop here
      }
    }

    return allEvents;
  }

  /**
   * Fetch a specific event by slug (e.g. "texas-senate-election-winner").
   * Returns the raw event object or null.
   */
  async fetchEventBySlug(slug) {
    const url = `${this.baseUrl}/events?slug=${encodeURIComponent(slug)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json', 'User-Agent': 'MonitoringTheSituation/1.0' },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) return null;
      const data = await response.json();
      const events = Array.isArray(data) ? data : data?.data ? [data.data] : [data];
      return events.find(e => e && (e.slug || e.id)) || null;
    } catch {
      return null;
    }
  }

  /**
   * Fetch multiple events by slug in parallel batches.
   */
  async fetchEventsBySlugs(slugs, concurrency = 5) {
    const results = [];
    for (let i = 0; i < slugs.length; i += concurrency) {
      const batch = slugs.slice(i, i + concurrency);
      const batchResults = await Promise.allSettled(
        batch.map(slug => this.fetchEventBySlug(slug))
      );
      for (const r of batchResults) {
        if (r.status === 'fulfilled' && r.value) results.push(r.value);
      }
    }
    return results;
  }

  normalizeMarkets(rawEvents) {
    return rawEvents
      .map((event, idx) => {
        const tagLabels = Array.isArray(event.tags) ? event.tags.map(t => t?.label || t?.slug).filter(Boolean) : [];
        const tagSlugs = Array.isArray(event.tags) ? event.tags.map(t => t?.slug).filter(Boolean) : [];
        const seriesLabels = Array.isArray(event.series) ? event.series.map(s => s?.title || s?.slug).filter(Boolean) : [];

        // Parse volume
        const volume = parseFloat(event.volume || event.volume24hr || event.volumeNum || event.markets?.[0]?.volume || 0);

        // Parse outcomes with prices from nested sub-markets
        let outcomes = [];
        const subMarkets = Array.isArray(event.markets) ? event.markets : [];

        if (subMarkets.length === 1) {
          // Single yes/no market — parse outcome names & prices
          const m = subMarkets[0];
          const names = tryParseJSON(m.outcomes) || ['Yes', 'No'];
          const prices = tryParseJSON(m.outcomePrices);
          if (prices && prices.length >= 2) {
            outcomes = names.slice(0, 2).map((name, i) => ({
              name, price: parseFloat(prices[i]) || 0,
            }));
          } else {
            outcomes = names.map(name => ({ name, price: null }));
          }
        } else if (subMarkets.length > 1) {
          // Multi-market event — each sub-market is one outcome
          outcomes = subMarkets.slice(0, 6).map(m => {
            const prices = tryParseJSON(m.outcomePrices);
            const yesPrice = prices ? parseFloat(prices[0]) : null;
            return {
              name: m.groupItemTitle || m.question || m.title || 'Unknown',
              price: yesPrice,
            };
          });
        }

        const searchParts = [
          event.title, event.description, event.slug, event.ticker,
          tagLabels[0], ...tagLabels, ...tagSlugs, ...seriesLabels,
          ...subMarkets.map(m => m.question || m.title || '').filter(Boolean),
          event.groupItemTitle,
        ].filter(Boolean);

        return {
          id: event.id || event.slug || `poly-${idx}`,
          question: event.title || event.question || 'Untitled Market',
          description: event.description || event.subtitle || '',
          volume,
          liquidity: parseFloat(event.liquidity || 0),
          outcomes,
          image: event.image || event.icon || null,
          active: event.active !== false && event.closed !== true,
          closed: event.closed === true,
          endDate: event.endDate || event.end_date_iso || null,
          category: event.category || tagLabels[0] || 'Other',
          tags: tagLabels,
          url: event.url || `https://polymarket.com/event/${event.slug || event.id}`,
          source: 'polymarket',
          searchText: normalizeText(searchParts.join(' ')),
          rawSearchText: searchParts.join(' '),
        };
      })
      .filter(m => m.volume >= MIN_VOLUME && m.active && !m.closed && !isBracketMarket(m.outcomes))
      .sort((a, b) => b.volume - a.volume);
  }

  filterByCountry(markets, countryName) {
    if (!countryName) return markets;
    const profile = buildCountrySearchProfile(countryName);
    return markets.filter(market => {
      const normText = market.searchText;
      const rawText = market.rawSearchText;
      return profile.termRegexes.some(r => r.test(normText)) || profile.acronymRegexes.some(r => r.test(rawText));
    });
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
    // Try Redis cache first
    const cacheKey = `${CACHE_KEY_PREFIX}:all`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    try {
      const raw = await this.fetchMarkets(300); // 300 events to cover election markets
      const normalized = this.normalizeMarkets(raw);

      // Store in both Redis and memory
      if (normalized.length > 0) {
        await cacheService.set(cacheKey, normalized, CACHE_TTL);
        this._memCache = normalized;
        this._memCacheTime = Date.now();
      }

      return normalized;
    } catch (error) {
      // Return stale in-memory cache if API fails (up to 30 min stale)
      if (this._memCache && (Date.now() - this._memCacheTime) < 30 * 60 * 1000) {
        console.warn('[Polymarket] Using stale cache (' + Math.round((Date.now() - this._memCacheTime) / 60000) + 'm old)');
        return this._memCache;
      }
      return [];
    }
  }

  async getMarketsByCountry(countryName) {
    const allMarkets = await this.getAllMarkets();
    return this.filterByCountry(allMarkets, countryName);
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

export const polymarketService = new PolymarketService();
export default polymarketService;
