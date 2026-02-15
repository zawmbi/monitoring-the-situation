/**
 * Tariff Service
 * Fetches live US tariff news and updates from external sources:
 *   1. Google News RSS — tariff-related headlines
 *   2. USTR RSS / trade policy news
 *
 * Provides a live feed of tariff changes that the frontend can merge
 * with its static baseline tariff data.
 */

import Parser from 'rss-parser';
import { cacheService } from './cache.service.js';

const CACHE_KEYS = {
  tariffNews: 'tariff:news',
  tariffUpdates: 'tariff:updates',
};

const CACHE_TTL = {
  tariffNews: 600,      // 10 min — news updates frequently
  tariffUpdates: 1800,  // 30 min — rate overrides change less often
};

const RSS_FEEDS = [
  {
    name: 'Google News (US Tariffs)',
    url: 'https://news.google.com/rss/search?q=US+tariffs+trade+when:3d&hl=en-US&gl=US&ceid=US:en',
    icon: 'google',
  },
  {
    name: 'Google News (Trump Tariffs)',
    url: 'https://news.google.com/rss/search?q=trump+tariffs+when:3d&hl=en-US&gl=US&ceid=US:en',
    icon: 'google',
  },
  {
    name: 'Reuters Trade',
    url: 'https://news.google.com/rss/search?q=site:reuters.com+tariffs+when:7d&hl=en-US&gl=US&ceid=US:en',
    icon: 'reuters',
  },
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
    this.rssParser = new Parser({
      timeout: 15000,
      headers: { 'User-Agent': 'Monitored/1.0 (tariff-monitor)' },
    });
    this.rateOverrides = { ...RATE_OVERRIDES };
  }

  // ─── Tariff News (RSS Feeds) ───

  /**
   * Fetch latest tariff-related news from multiple RSS sources
   */
  async getTariffNews(limit = 30) {
    const cached = await cacheService.get(CACHE_KEYS.tariffNews);
    if (cached) return { ...cached, items: cached.items.slice(0, limit) };

    console.log('[Tariff] Fetching tariff news from RSS feeds...');

    const allItems = [];

    const results = await Promise.allSettled(
      RSS_FEEDS.map(async (feed) => {
        try {
          const parsed = await this.rssParser.parseURL(feed.url);
          return (parsed.items || []).slice(0, 20).map((item) => ({
            id: this.hashString(item.link || item.guid || item.title),
            title: item.title,
            link: item.link,
            summary: this.stripHtml(item.contentSnippet || item.content || item.summary || '').substring(0, 300),
            publishedAt: item.pubDate || item.isoDate || new Date().toISOString(),
            source: feed.name,
            sourceIcon: feed.icon,
          }));
        } catch (err) {
          console.error(`[Tariff] RSS error (${feed.name}):`, err.message);
          return [];
        }
      })
    );

    results.forEach((r) => {
      if (r.status === 'fulfilled') allItems.push(...r.value);
    });

    // Sort by date (newest first) and deduplicate
    const seen = new Set();
    const unique = allItems
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
      .filter((item) => {
        if (seen.has(item.link)) return false;
        seen.add(item.link);
        return true;
      });

    const result = {
      items: unique,
      totalSources: RSS_FEEDS.length,
      fetchedAt: new Date().toISOString(),
    };

    await cacheService.set(CACHE_KEYS.tariffNews, result, CACHE_TTL.tariffNews);
    console.log(`[Tariff] Tariff news fetched: ${unique.length} articles`);

    return { ...result, items: result.items.slice(0, limit) };
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
      news: news?.items || [],
      newsFetchedAt: news?.fetchedAt || null,
      overrides: overrides?.overrides || {},
      lastChecked: overrides?.lastChecked || null,
      fetchedAt: new Date().toISOString(),
    };
  }

  // ─── Utilities ───

  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return `trf-${Math.abs(hash).toString(36)}`;
  }
}

export const tariffService = new TariffService();
export default tariffService;
