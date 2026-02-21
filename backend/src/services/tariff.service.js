/**
 * Tariff Service
 * Fetches live US tariff news and updates via GDELT Doc API.
 *
 * Sources:
 *   - GDELT Doc API (tariff/trade keywords)
 *
 * Provides a live feed of tariff-related articles that the frontend can merge
 * with its static baseline tariff data.
 */

import { cacheService } from './cache.service.js';
import { fetchGDELT } from './gdelt.client.js';

const CACHE_KEYS = {
  tariffNews: 'tariff:news',
  tariffUpdates: 'tariff:updates',
};

const CACHE_TTL = {
  tariffNews: 600,      // 10 min — news updates frequently
  tariffUpdates: 1800,  // 30 min — rate overrides change less often
};

const TARIFF_QUERIES = [
  'US tariffs trade',
  'trump tariffs',
  'tariffs site:reuters.com OR site:apnews.com',
];

/**
 * Known tariff rate overrides.
 * These represent the latest confirmed tariff changes that may differ
 * from the static baseline in tariffData.js.
 * The backend periodically refreshes these from news analysis.
 */
const RATE_OVERRIDES = {
  // Format: countryName -> { universal, goods: { sector: rate }, effectiveDate, source }
  // Populated at runtime from parsed news / executive orders
};

class TariffService {
  constructor() {
    this.rateOverrides = { ...RATE_OVERRIDES };
  }

  // ─── Tariff News (GDELT) ───

  /**
   * Fetch latest tariff-related articles from GDELT
   */
  async getTariffNews(limit = 30) {
    const cached = await cacheService.get(CACHE_KEYS.tariffNews);
    if (cached) return { ...cached, articles: cached.articles.slice(0, limit) };

    console.log('[Tariff] Fetching tariff news from GDELT...');

    const allArticles = [];

    const results = await Promise.allSettled(
      TARIFF_QUERIES.map(query =>
        fetchGDELT(query, { maxRecords: 25, timespan: '7d', caller: 'Tariff' })
      )
    );

    results.forEach(r => {
      if (r.status === 'fulfilled') allArticles.push(...r.value);
    });

    // Deduplicate by URL
    const seen = new Set();
    const unique = allArticles.filter(article => {
      if (seen.has(article.url)) return false;
      seen.add(article.url);
      return true;
    });

    const result = {
      articles: unique,
      totalQueries: TARIFF_QUERIES.length,
      fetchedAt: new Date().toISOString(),
      dataSource: 'GDELT Doc API',
    };

    await cacheService.set(CACHE_KEYS.tariffNews, result, CACHE_TTL.tariffNews);
    console.log(`[Tariff] Tariff news fetched: ${unique.length} articles`);

    return { ...result, articles: result.articles.slice(0, limit) };
  }

  // ─── Rate Overrides ───

  /**
   * Get any live tariff rate overrides.
   * These are changes detected since the static baseline was compiled.
   */
  async getRateOverrides() {
    const cached = await cacheService.get(CACHE_KEYS.tariffUpdates);
    if (cached) return cached;

    // Return current in-memory overrides
    const result = {
      overrides: this.rateOverrides,
      lastChecked: new Date().toISOString(),
    };

    await cacheService.set(CACHE_KEYS.tariffUpdates, result, CACHE_TTL.tariffUpdates);
    return result;
  }

  /**
   * Apply a tariff rate override (called when new tariff changes are detected)
   */
  applyOverride(country, { universal, goods, effectiveDate, source }) {
    this.rateOverrides[country] = {
      ...(this.rateOverrides[country] || {}),
      ...(universal != null ? { universal } : {}),
      goods: {
        ...(this.rateOverrides[country]?.goods || {}),
        ...(goods || {}),
      },
      effectiveDate: effectiveDate || new Date().toISOString(),
      source: source || 'manual',
      updatedAt: new Date().toISOString(),
    };
    // Bust cache so next request picks up the change
    cacheService.del(CACHE_KEYS.tariffUpdates).catch(() => {});
  }

  // ─── Combined endpoint ───

  /**
   * Get all live tariff data in one call
   */
  async getLiveData() {
    const [news, overrides] = await Promise.all([
      this.getTariffNews(20),
      this.getRateOverrides(),
    ]);

    return {
      articles: news?.articles || [],
      newsFetchedAt: news?.fetchedAt || null,
      overrides: overrides?.overrides || {},
      lastChecked: overrides?.lastChecked || null,
      dataSource: 'GDELT Doc API',
      fetchedAt: new Date().toISOString(),
    };
  }
}

export const tariffService = new TariffService();
export default tariffService;
