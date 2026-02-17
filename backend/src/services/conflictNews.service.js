/**
 * Conflict News Service
 * Fetches live news via Google News RSS for each tracked conflict.
 * Provides per-conflict news feeds that can be consumed by the frontend.
 */

import Parser from 'rss-parser';
import { cacheService } from './cache.service.js';

const CACHE_TTL = 900; // 15 minutes

/**
 * Per-conflict search queries — each conflict gets multiple Google News RSS queries
 * to maximise coverage and relevance.
 */
const CONFLICT_FEEDS = {
  'israel-gaza': {
    label: 'Israel–Gaza Post-War',
    queries: [
      'Gaza ceasefire reconstruction',
      'Gaza post-war humanitarian aid',
      'Israel Gaza peace agreement',
    ],
  },
  sudan: {
    label: 'Sudan Civil War',
    queries: [
      'Sudan civil war SAF RSF Khartoum',
      'Sudan Darfur genocide El Fasher',
      'Sudan famine humanitarian crisis',
    ],
  },
  myanmar: {
    label: 'Myanmar Civil War',
    queries: [
      'Myanmar civil war resistance junta',
      'Myanmar Arakan Army Rakhine',
      'Myanmar PDF revolution',
    ],
  },
  yemen: {
    label: 'Yemen War & STC Crisis',
    queries: [
      'Yemen Houthi ceasefire Red Sea',
      'Yemen STC Saudi Arabia government',
      'Yemen cabinet Aden Riyadh crisis',
    ],
  },
  ethiopia: {
    label: 'Ethiopia Conflicts',
    queries: [
      'Ethiopia Amhara Fano conflict',
      'Ethiopia Oromia OLA',
      'Ethiopia Tigray recovery',
    ],
  },
  drc: {
    label: 'Eastern Congo / DRC',
    queries: [
      'Congo M23 Goma Bukavu DRC',
      'DRC Rwanda M23 ceasefire',
      'Eastern Congo humanitarian crisis',
    ],
  },
  'iran-israel': {
    label: 'Iran–Israel War',
    queries: [
      'Iran Israel war nuclear strikes aftermath',
      'Iran protests uprising regime crisis 2026',
      'Iran Israel ceasefire nuclear program',
    ],
  },
  'india-pakistan': {
    label: 'India–Pakistan Crisis',
    queries: [
      'India Pakistan Operation Sindoor Kashmir',
      'India Pakistan military tension 2026',
      'Kashmir conflict India Pakistan nuclear',
    ],
  },
  sahel: {
    label: 'Sahel Insurgency',
    queries: [
      'Sahel JNIM Mali Burkina Faso insurgency',
      'Mali jihadist Bamako blockade Wagner',
      'Burkina Faso Niger terrorism Sahel crisis',
    ],
  },
};

class ConflictNewsService {
  constructor() {
    this.rssParser = new Parser({
      timeout: 15000,
      headers: { 'User-Agent': 'Monitored/1.0 (conflict-monitor)' },
    });
  }

  /**
   * Get news for a specific conflict by ID.
   * Returns { items, conflictId, label, fetchedAt }
   */
  async getNewsByConflict(conflictId, limit = 20) {
    const cacheKey = `conflict-news:${conflictId}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return { ...cached, items: cached.items.slice(0, limit) };

    const config = CONFLICT_FEEDS[conflictId];
    if (!config) return { items: [], conflictId, label: 'Unknown', fetchedAt: new Date().toISOString() };

    console.log(`[ConflictNews] Fetching news for ${config.label}...`);

    const allItems = [];
    const feedUrls = config.queries.map(
      (q) => `https://news.google.com/rss/search?q=${encodeURIComponent(q)}+when:7d&hl=en-US&gl=US&ceid=US:en`
    );

    const results = await Promise.allSettled(
      feedUrls.map(async (url, i) => {
        try {
          const parsed = await this.rssParser.parseURL(url);
          return (parsed.items || []).slice(0, 15).map((item) => ({
            id: this.hashString(item.link || item.guid || item.title),
            title: item.title,
            link: item.link,
            summary: this.stripHtml(item.contentSnippet || item.content || item.summary || '').substring(0, 300),
            publishedAt: item.pubDate || item.isoDate || new Date().toISOString(),
            source: this.extractSource(item.title),
            query: config.queries[i],
          }));
        } catch (err) {
          console.error(`[ConflictNews] RSS error (${config.queries[i]}):`, err.message);
          return [];
        }
      })
    );

    results.forEach((r) => {
      if (r.status === 'fulfilled') allItems.push(...r.value);
    });

    // Sort by date, deduplicate by link
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
      conflictId,
      label: config.label,
      fetchedAt: new Date().toISOString(),
    };

    await cacheService.set(cacheKey, result, CACHE_TTL);
    console.log(`[ConflictNews] ${config.label}: ${unique.length} articles fetched`);

    return { ...result, items: result.items.slice(0, limit) };
  }

  /**
   * Get news for ALL conflicts in one call.
   */
  async getAllConflictNews(limitPerConflict = 10) {
    const conflictIds = Object.keys(CONFLICT_FEEDS);
    const results = await Promise.allSettled(
      conflictIds.map((id) => this.getNewsByConflict(id, limitPerConflict))
    );

    const data = {};
    results.forEach((r, i) => {
      if (r.status === 'fulfilled') {
        data[conflictIds[i]] = r.value;
      }
    });

    return {
      conflicts: data,
      totalConflicts: conflictIds.length,
      fetchedAt: new Date().toISOString(),
    };
  }

  /**
   * List available conflict IDs
   */
  getAvailableConflicts() {
    return Object.entries(CONFLICT_FEEDS).map(([id, cfg]) => ({
      id,
      label: cfg.label,
      queryCount: cfg.queries.length,
    }));
  }

  // ─── Utilities ───

  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  extractSource(title) {
    // Google News titles often end with " - Source Name"
    const match = title?.match(/ - ([^-]+)$/);
    return match ? match[1].trim() : 'Google News';
  }

  hashString(str) {
    let hash = 0;
    for (let i = 0; i < (str || '').length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return `cn-${Math.abs(hash).toString(36)}`;
  }
}

export const conflictNewsService = new ConflictNewsService();
export default conflictNewsService;
