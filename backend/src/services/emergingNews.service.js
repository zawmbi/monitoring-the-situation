/**
 * Emerging News Capture Service
 *
 * Monitors cross-cutting emerging developments that static per-conflict queries
 * may miss. Uses broad, situation-aware search queries to detect:
 *   - Military buildups and deployments (naval, air, ground)
 *   - Communications/infrastructure warfare (Starlink, Telegram, internet shutdowns)
 *   - Escalation signals (troop movements, carrier groups, no-fly zones)
 *   - Breakthrough offensives or sudden territorial changes
 *
 * Each "watch" is tied to one or more existing conflict IDs so the frontend can
 * cross-reference emerging stories with their parent situation.
 *
 * Data source: Google News RSS (7-day rolling window)
 */

import Parser from 'rss-parser';
import { cacheService } from './cache.service.js';

const CACHE_KEY = 'emerging:news';
const CACHE_TTL = 600; // 10 minutes

/**
 * Emerging watches — each targets a specific developing situation that
 * standard conflict queries are unlikely to surface.
 *
 * Fields:
 *   id          — unique watch identifier
 *   label       — human-readable name
 *   conflictIds — parent conflict(s) this watch relates to
 *   category    — classification tag
 *   queries     — Google News search strings (7-day window)
 *   priority    — higher = more important (used for sorting)
 */
const EMERGING_WATCHES = [
  // ─── Iran / Persian Gulf military buildup ───
  {
    id: 'iran-us-buildup',
    label: 'US Military Buildup Near Iran',
    conflictIds: ['iran-israel'],
    category: 'military-deployment',
    queries: [
      'US military buildup Iran Persian Gulf 2026',
      'US Navy carrier strike group Iran Strait of Hormuz',
      'US forces Middle East deployment Iran escalation',
      'Pentagon Iran military posture CENTCOM',
    ],
    priority: 10,
  },
  {
    id: 'iran-naval-tensions',
    label: 'Persian Gulf Naval Tensions',
    conflictIds: ['iran-israel', 'houthi-red-sea'],
    category: 'naval-activity',
    queries: [
      'Persian Gulf naval confrontation Iran US',
      'Strait of Hormuz military ships Iran',
      'Iran IRGC Navy fast boats US warship',
    ],
    priority: 9,
  },
  {
    id: 'iran-internal-escalation',
    label: 'Iran Internal Crisis & Regime Response',
    conflictIds: ['iran-israel'],
    category: 'internal-crisis',
    queries: [
      'Iran regime crackdown protests military',
      'Iran IRGC martial law internal security',
      'Iran government collapse opposition',
    ],
    priority: 8,
  },

  // ─── Ukraine communications / tech warfare ───
  {
    id: 'ukraine-comms-warfare',
    label: 'Ukraine Communications Warfare',
    conflictIds: ['russia-ukraine'],
    category: 'tech-warfare',
    queries: [
      'Ukraine Starlink disruption Russia electronic warfare',
      'Telegram shutdown Ukraine Russia war',
      'Ukraine internet communications blackout frontline',
      'Starlink SpaceX Ukraine military access',
    ],
    priority: 10,
  },
  {
    id: 'ukraine-offensive-breakthrough',
    label: 'Ukrainian Offensive Breakthrough',
    conflictIds: ['russia-ukraine'],
    category: 'offensive-operations',
    queries: [
      'Ukraine major offensive advance breakthrough 2026',
      'Ukraine counterattack Russia retreat frontline',
      'Ukrainian forces liberate territory advance',
      'Russia retreat collapse frontline Ukraine',
    ],
    priority: 10,
  },
  {
    id: 'ukraine-tech-advantage',
    label: 'Ukraine Technology & Drone Warfare',
    conflictIds: ['russia-ukraine'],
    category: 'tech-warfare',
    queries: [
      'Ukraine drone warfare new technology advantage',
      'Ukraine electronic warfare jamming Russia',
      'Ukraine satellite intelligence ISR battlefield',
    ],
    priority: 7,
  },

  // ─── Cross-cutting escalation signals ───
  {
    id: 'us-global-military-posture',
    label: 'US Global Military Deployments',
    conflictIds: [],
    category: 'military-deployment',
    queries: [
      'US military deployment carrier group 2026',
      'Pentagon troop deployment Middle East Europe Asia',
      'US aircraft carrier deployment combat operations',
    ],
    priority: 6,
  },
  {
    id: 'nuclear-escalation-signals',
    label: 'Nuclear Escalation Signals',
    conflictIds: ['iran-israel', 'russia-ukraine', 'india-pakistan'],
    category: 'nuclear-risk',
    queries: [
      'nuclear threat escalation warning 2026',
      'nuclear weapons alert DEFCON',
      'tactical nuclear weapon deployment threat',
    ],
    priority: 9,
  },
  {
    id: 'communications-infrastructure-attacks',
    label: 'Communications Infrastructure Attacks',
    conflictIds: [],
    category: 'infrastructure-attack',
    queries: [
      'undersea cable sabotage cut internet',
      'satellite communications disruption military',
      'internet shutdown government censorship wartime',
      'GPS jamming spoofing military operations',
    ],
    priority: 7,
  },
  {
    id: 'sanctions-escalation',
    label: 'New Sanctions & Economic Warfare',
    conflictIds: ['iran-israel', 'russia-ukraine'],
    category: 'economic-warfare',
    queries: [
      'new sanctions Iran Russia 2026 escalation',
      'SWIFT ban economic warfare oil embargo',
      'secondary sanctions enforcement allies',
    ],
    priority: 5,
  },
];

class EmergingNewsService {
  constructor() {
    this.rssParser = new Parser({
      timeout: 15000,
      headers: { 'User-Agent': 'monitr/1.0 (emerging-news)' },
    });
  }

  /**
   * Fetch all emerging news watches and return combined results.
   */
  async getCombinedData() {
    const cached = await cacheService.get(CACHE_KEY);
    if (cached) return cached;

    console.log('[EmergingNews] Scanning for emerging developments...');

    const watchResults = await Promise.allSettled(
      EMERGING_WATCHES.map((watch) => this.fetchWatch(watch))
    );

    const watches = [];
    watchResults.forEach((r, i) => {
      if (r.status === 'fulfilled' && r.value) {
        watches.push(r.value);
      } else {
        watches.push({
          ...EMERGING_WATCHES[i],
          items: [],
          totalArticles: 0,
          fetchedAt: new Date().toISOString(),
          error: r.reason?.message || 'Fetch failed',
        });
      }
    });

    // Sort by priority (descending), then by article count
    watches.sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return b.totalArticles - a.totalArticles;
    });

    // Identify "hot" watches — those with significant recent coverage
    const hotWatches = watches.filter((w) => w.totalArticles >= 3);

    // Build a flat feed of all emerging articles, sorted by date
    const allItems = [];
    watches.forEach((w) => {
      (w.items || []).forEach((item) => {
        allItems.push({
          ...item,
          watchId: w.id,
          watchLabel: w.label,
          category: w.category,
          conflictIds: w.conflictIds,
        });
      });
    });

    const seen = new Set();
    const uniqueItems = allItems
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
      .filter((item) => {
        if (seen.has(item.link)) return false;
        seen.add(item.link);
        return true;
      });

    const result = {
      watches,
      hotWatches: hotWatches.map((w) => ({
        id: w.id,
        label: w.label,
        category: w.category,
        conflictIds: w.conflictIds,
        totalArticles: w.totalArticles,
      })),
      feed: uniqueItems.slice(0, 50),
      summary: {
        totalWatches: watches.length,
        activeWatches: hotWatches.length,
        totalArticles: uniqueItems.length,
        categories: this.countByCategory(watches),
        conflictCoverage: this.countByConflict(watches),
      },
      fetchedAt: new Date().toISOString(),
    };

    await cacheService.set(CACHE_KEY, result, CACHE_TTL);
    console.log(
      `[EmergingNews] Scan complete: ${hotWatches.length}/${watches.length} active watches, ` +
      `${uniqueItems.length} articles`
    );
    return result;
  }

  /**
   * Fetch news for a single emerging watch.
   */
  async fetchWatch(watch) {
    const feedUrls = watch.queries.map(
      (q) =>
        `https://news.google.com/rss/search?q=${encodeURIComponent(q)}+when:7d&hl=en-US&gl=US&ceid=US:en`
    );

    const results = await Promise.allSettled(
      feedUrls.map(async (url, i) => {
        try {
          const parsed = await this.rssParser.parseURL(url);
          return (parsed.items || []).slice(0, 10).map((item) => ({
            id: this.hashString(item.link || item.guid || item.title),
            title: item.title,
            link: item.link,
            summary: this.stripHtml(
              item.contentSnippet || item.content || item.summary || ''
            ).substring(0, 300),
            publishedAt: item.pubDate || item.isoDate || new Date().toISOString(),
            source: this.extractSource(item.title),
            query: watch.queries[i],
          }));
        } catch (err) {
          console.error(
            `[EmergingNews] RSS error (${watch.id}/${watch.queries[i]}):`,
            err.message
          );
          return [];
        }
      })
    );

    const allItems = [];
    results.forEach((r) => {
      if (r.status === 'fulfilled') allItems.push(...r.value);
    });

    // Deduplicate
    const seen = new Set();
    const unique = allItems
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
      .filter((item) => {
        if (seen.has(item.link)) return false;
        seen.add(item.link);
        return true;
      });

    return {
      id: watch.id,
      label: watch.label,
      conflictIds: watch.conflictIds,
      category: watch.category,
      priority: watch.priority,
      items: unique,
      totalArticles: unique.length,
      fetchedAt: new Date().toISOString(),
    };
  }

  /**
   * Get emerging news filtered by conflict ID.
   */
  async getByConflict(conflictId) {
    const data = await this.getCombinedData();
    const relevantWatches = data.watches.filter((w) =>
      w.conflictIds.includes(conflictId)
    );
    const relevantFeed = data.feed.filter((item) =>
      item.conflictIds.includes(conflictId)
    );

    return {
      conflictId,
      watches: relevantWatches,
      feed: relevantFeed,
      totalArticles: relevantFeed.length,
      fetchedAt: data.fetchedAt,
    };
  }

  /**
   * Get emerging news filtered by category.
   */
  async getByCategory(category) {
    const data = await this.getCombinedData();
    const relevantWatches = data.watches.filter((w) => w.category === category);
    const relevantFeed = data.feed.filter((item) => item.category === category);

    return {
      category,
      watches: relevantWatches,
      feed: relevantFeed,
      totalArticles: relevantFeed.length,
      fetchedAt: data.fetchedAt,
    };
  }

  /**
   * List all available watches with metadata.
   */
  getAvailableWatches() {
    return EMERGING_WATCHES.map((w) => ({
      id: w.id,
      label: w.label,
      conflictIds: w.conflictIds,
      category: w.category,
      priority: w.priority,
      queryCount: w.queries.length,
    }));
  }

  // ─── Utilities ───

  countByCategory(watches) {
    const counts = {};
    watches.forEach((w) => {
      counts[w.category] = (counts[w.category] || 0) + w.totalArticles;
    });
    return counts;
  }

  countByConflict(watches) {
    const counts = {};
    watches.forEach((w) => {
      (w.conflictIds || []).forEach((cid) => {
        counts[cid] = (counts[cid] || 0) + w.totalArticles;
      });
    });
    return counts;
  }

  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  extractSource(title) {
    const match = title?.match(/ - ([^-]+)$/);
    return match ? match[1].trim() : 'Google News';
  }

  hashString(str) {
    let hash = 0;
    for (let i = 0; i < (str || '').length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return `em-${Math.abs(hash).toString(36)}`;
  }
}

export const emergingNewsService = new EmergingNewsService();
export default emergingNewsService;
