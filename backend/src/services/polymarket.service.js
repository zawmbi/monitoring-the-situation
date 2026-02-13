/**
 * Polymarket Service
 * Fetches prediction markets from Polymarket API
 */

import { cacheService } from './cache.service.js';

const CACHE_KEY_PREFIX = 'polymarket:markets';
const CACHE_TTL = 300; // 5 minutes
const POLYMARKET_API_BASE = 'https://gamma-api.polymarket.com';
const MIN_VOLUME = 100000; // $100k minimum volume

// For debugging: temporarily lower threshold
const DEBUG_MODE = true;
const DEBUG_MIN_VOLUME = DEBUG_MODE ? 1000 : MIN_VOLUME; // $1k for testing

const STOPWORDS = new Set(['of', 'the', 'and', 'or', 'for', 'in', 'on', 'to', 'a', 'an']);
const COMMON_PREFIXES = [
  'republic of ',
  'democratic republic of ',
  'federal republic of ',
  'kingdom of ',
  'state of ',
  'states of ',
  'federated states of ',
  'islamic republic of ',
  'people s republic of ',
  'plurinational state of ',
  'bolivarian republic of ',
  'united republic of ',
  'arab republic of ',
  'sultanate of ',
  'emirate of ',
  'emirates of ',
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
  return value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
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

    if (tokensNoStop.length > 1) {
      variants.add(tokensNoStop.join(' '));
    }
    if (tokensNoStop.length === 1) {
      variants.add(tokensNoStop[0]);
    }

    if (tokensNoStop.length >= 2) {
      const acronym = tokensNoStop.map((token) => token[0]).join('');
      if (acronym.length >= 2 && acronym.length <= 4) {
        acronyms.add(acronym.toUpperCase());
      }
    }
  }

  const aliasKey = normalizedName;
  const aliases = COUNTRY_ALIASES[aliasKey] || [];
  aliases.forEach((alias) => {
    const normalizedAlias = normalizeText(alias);
    if (normalizedAlias) {
      variants.add(normalizedAlias);
      const aliasTokens = normalizedAlias.split(' ').filter(Boolean);
      if (aliasTokens.length >= 2) {
        const acronym = aliasTokens.map((token) => token[0]).join('');
        if (acronym.length >= 2 && acronym.length <= 4) {
          acronyms.add(acronym.toUpperCase());
        }
      }
    }
  });

  const termRegexes = Array.from(variants)
    .filter((term) => term.length >= 3)
    .map((term) => new RegExp(`\\b${escapeRegex(term)}\\b`, 'i'));

  const acronymRegexes = Array.from(acronyms).map((acronym) => {
    const dotted = acronym.split('').join('\\.?');
    return new RegExp(`\\b${dotted}\\b`);
  });

  return {
    terms: Array.from(variants),
    termRegexes,
    acronymRegexes,
  };
}

class PolymarketService {
  constructor() {
    this.baseUrl = POLYMARKET_API_BASE;
  }

  /**
   * Fetch markets from Polymarket Gamma API
   */
  async fetchMarkets() {
    try {
      // Use events endpoint which is more stable
      const url = `${this.baseUrl}/events?limit=100&active=true&closed=false&order=volume&ascending=false`;
      console.log('[Polymarket] Fetching from:', url);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'MonitoringTheSituation/1.0',
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      console.log('[Polymarket] Response status:', response.status);

      if (!response.ok) {
        const text = await response.text();
        console.error('[Polymarket] Error response:', text);
        throw new Error(`Polymarket API returned ${response.status}: ${text}`);
      }

      const data = await response.json();
      console.log('[Polymarket] Response type:', typeof data);

      if (Array.isArray(data)) {
        console.log('[Polymarket] Received', data.length, 'events (direct array)');
        if (data[0]) {
          console.log('[Polymarket] First event keys:', Object.keys(data[0]));
          console.log('[Polymarket] First event sample:', JSON.stringify(data[0]).substring(0, 500));
        }
        return data;
      }

      // Check for wrapped response
      if (data && typeof data === 'object') {
        console.log('[Polymarket] Response keys:', Object.keys(data));
        if (Array.isArray(data.data)) {
          console.log('[Polymarket] Received', data.data.length, 'events from data field');
          return data.data;
        }
        if (Array.isArray(data.events)) {
          console.log('[Polymarket] Received', data.events.length, 'events from events field');
          return data.events;
        }
      }

      console.warn('[Polymarket] Unexpected response format');
      return [];
    } catch (error) {
      console.error('[Polymarket] Error fetching markets:', error.message);
      throw error;
    }
  }

  /**
   * Filter and normalize markets
   */
  normalizeMarkets(markets) {
    console.log('[Polymarket] Normalizing', markets.length, 'markets');

    const normalized = markets
      .map((market, idx) => {
        const tagLabels = Array.isArray(market.tags)
          ? market.tags
              .map((tag) => tag?.label || tag?.slug)
              .filter(Boolean)
          : [];
        const tagSlugs = Array.isArray(market.tags)
          ? market.tags
              .map((tag) => tag?.slug)
              .filter(Boolean)
          : [];
        const seriesLabels = Array.isArray(market.series)
          ? market.series
              .map((series) => series?.title || series?.slug)
              .filter(Boolean)
          : [];
        const seriesSlugs = Array.isArray(market.series)
          ? market.series
              .map((series) => series?.slug)
              .filter(Boolean)
          : [];

        const marketQuestions = Array.isArray(market.markets)
          ? market.markets
              .map((item) => item?.question || item?.title || item?.slug || item?.groupItemTitle)
              .filter(Boolean)
          : [];

        // Parse outcomes from Gamma API events
        let outcomes = [];
        if (market.outcomes) {
          outcomes = Array.isArray(market.outcomes) ? market.outcomes : [market.outcomes];
        } else if (market.markets) {
          // Each event can have multiple markets
          outcomes = market.markets.map(m => m.question || m.outcome || 'Yes/No');
        }

        // Parse volume - try multiple field names
        const volume = parseFloat(
          market.volume ||
          market.volume24hr ||
          market.volumeNum ||
          market.markets?.[0]?.volume ||
          0
        );

        const result = {
          id: market.id || market.condition_id || market.slug || `market-${idx}`,
          question: market.title || market.question || market.description || 'Untitled Market',
          description: market.description || market.subtitle || '',
          volume,
          liquidity: parseFloat(market.liquidity || 0),
          outcomes,
          image: market.image || market.icon || null,
          icon: market.icon || market.image || null,
          active: market.active !== false && market.closed !== true,
          closed: market.closed === true,
          endDate: market.endDate || market.end_date_iso || market.endDateIso || null,
          category: market.category || tagLabels[0] || 'Other',
          tags: tagLabels,
          url: market.url || `https://polymarket.com/event/${market.slug || market.id}`,
          createdAt: market.createdAt || market.created_at || new Date().toISOString(),
          searchText: '',
          rawSearchText: '',
        };

        const searchParts = [
          result.question,
          result.description,
          market.slug,
          market.ticker,
          result.category,
          ...tagLabels,
          ...tagSlugs,
          ...seriesLabels,
          ...seriesSlugs,
          ...marketQuestions,
          market.groupItemTitle,
        ].filter(Boolean);

        const rawSearchText = searchParts.join(' ');
        result.rawSearchText = rawSearchText;
        result.searchText = normalizeText(rawSearchText);

        if (idx < 5) {
          console.log(`[Polymarket] Sample event ${idx}:`, {
            question: result.question,
            volume: result.volume,
            active: result.active,
            closed: result.closed,
            rawVolume: market.volume,
            hasMarkets: !!market.markets,
            marketCount: market.markets?.length || 0
          });
        }

        return result;
      })
      .filter(market => {
        // Filter by minimum volume (using debug threshold)
        const hasVolume = market.volume >= DEBUG_MIN_VOLUME;
        const isActive = market.active !== false && market.closed !== true;

        if (!hasVolume && market.volume > 0) {
          console.log('[Polymarket] Filtered out (low volume):', market.question, 'volume:', market.volume);
        }

        return hasVolume && isActive;
      })
      .sort((a, b) => b.volume - a.volume);

    console.log('[Polymarket] Filtered to', normalized.length, `markets with >$${DEBUG_MIN_VOLUME} volume`);

    return normalized;
  }

  /**
   * Filter markets by country/region keyword
   */
  filterByCountry(markets, countryName) {
    if (!countryName) return markets;

    const searchProfile = buildCountrySearchProfile(countryName);
    console.log(`[Polymarket] Filtering ${markets.length} markets for country: ${countryName}`);

    const filtered = markets.filter((market) => {
      const normalizedText = market.searchText || normalizeText(`${market.question} ${market.description} ${market.category}`);
      const rawText = market.rawSearchText || `${market.question} ${market.description} ${market.category}`;

      const matchesTerm = searchProfile.termRegexes.some((regex) => regex.test(normalizedText));
      const matchesAcronym = searchProfile.acronymRegexes.some((regex) => regex.test(rawText));
      const matches = matchesTerm || matchesAcronym;

      if (matches) {
        console.log(`[Polymarket] Match found:`, market.question);
      }

      return matches;
    });

    console.log(`[Polymarket] Found ${filtered.length} markets for ${countryName}`);

    return filtered;
  }

  /**
   * Get all markets with volume > 100k
   */
  async getAllMarkets() {
    const cacheKey = `${CACHE_KEY_PREFIX}:all`;
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      console.log(`[Polymarket] Returning ${cached.length} cached markets`);
      return cached;
    }

    try {
      const rawMarkets = await this.fetchMarkets();
      console.log(`[Polymarket] Fetched ${rawMarkets.length} raw markets`);

      const normalized = this.normalizeMarkets(rawMarkets);
      console.log(`[Polymarket] Normalized to ${normalized.length} markets with >$100k volume`);

      if (normalized.length > 0) {
        await cacheService.set(cacheKey, normalized, CACHE_TTL);
      }

      return normalized;
    } catch (error) {
      console.error('[Polymarket] Failed to fetch markets:', error);
      // Return empty array instead of throwing to prevent UI breakage
      return [];
    }
  }

  /**
   * Get markets for a specific country
   */
  async getMarketsByCountry(countryName) {
    const cacheKey = `${CACHE_KEY_PREFIX}:country:${normalizeText(countryName) || countryName.toLowerCase()}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const allMarkets = await this.getAllMarkets();
    const filtered = this.filterByCountry(allMarkets, countryName);

    await cacheService.set(cacheKey, filtered, CACHE_TTL);
    return filtered;
  }

  /**
   * Score a market against keyword sets.
   * requiredKeywords: at least one must match or the market is excluded.
   * boostKeywords:    optional, each match adds relevance score.
   * Returns score > 0 if market qualifies, 0 if it doesn't.
   */
  scoreMarket(market, requiredKeywords, boostKeywords = []) {
    const text = market.searchText || normalizeText(`${market.question} ${market.description} ${market.category}`);
    const rawText = market.rawSearchText || `${market.question} ${market.description}`;
    const titleText = normalizeText(market.question || '');

    function matches(keyword) {
      const escaped = escapeRegex(keyword);
      const regex = new RegExp(`\\b${escaped}\\b`, 'i');
      return regex.test(text) || regex.test(rawText);
    }

    function matchesTitle(keyword) {
      const escaped = escapeRegex(keyword);
      const regex = new RegExp(`\\b${escaped}\\b`, 'i');
      return regex.test(titleText);
    }

    // Must match at least one required keyword
    const reqMatches = requiredKeywords.filter(k => matches(normalizeText(k)));
    if (reqMatches.length === 0) return 0;

    // Score: required matches in title worth 3, in body worth 2, boost matches worth 1
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
   * Returns markets sorted by relevance score (descending).
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
   * Get markets filtered by topic keywords
   */
  async getMarketsByTopic(requiredKeywords, boostKeywords = []) {
    const cacheKey = `${CACHE_KEY_PREFIX}:topic:${[...requiredKeywords].sort().join(',')}:${[...boostKeywords].sort().join(',')}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const allMarkets = await this.getAllMarkets();
    const filtered = this.filterByTopic(allMarkets, requiredKeywords, boostKeywords);

    await cacheService.set(cacheKey, filtered, CACHE_TTL);
    return filtered;
  }

  /**
   * Get top markets (by volume)
   */
  async getTopMarkets(limit = 50) {
    const markets = await this.getAllMarkets();
    return markets.slice(0, limit);
  }
}

export const polymarketService = new PolymarketService();
export default polymarketService;
