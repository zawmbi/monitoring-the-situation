/**
 * Conflict Service
 * Fetches live Russia-Ukraine war data from external sources:
 *   1. russianwarship.rip — daily Russian equipment/personnel losses (UA MOD claims)
 *   2. Ukrinform RSS — latest Ukraine war news
 *   3. Google News RSS — aggregated Ukraine war coverage
 */

import Parser from 'rss-parser';
import { cacheService } from './cache.service.js';

const CACHE_KEYS = {
  losses: 'conflict:losses',
  lossesHistory: 'conflict:losses:history',
  warNews: 'conflict:news',
};

const CACHE_TTL = {
  losses: 3600,        // 1 hour — data updates once daily
  lossesHistory: 7200, // 2 hours — historical data rarely changes
  warNews: 900,        // 15 min — news updates frequently
};

const RSS_FEEDS = [
  {
    name: 'Ukrinform',
    url: 'https://www.ukrinform.net/rss/block-lastnews',
    icon: 'ukrinform',
  },
  {
    name: 'Google News (Ukraine War)',
    url: 'https://news.google.com/rss/search?q=ukraine+war+when:7d&hl=en-US&gl=US&ceid=US:en',
    icon: 'google',
  },
];

class ConflictService {
  constructor() {
    this.rssParser = new Parser({
      timeout: 15000,
      headers: { 'User-Agent': 'Monitored/1.0 (conflict-monitor)' },
    });
  }

  // ─── Russian Losses (russianwarship.rip API) ───

  /**
   * Fetch the latest daily Russian losses from UA MOD via russianwarship.rip
   * Returns: { date, day, stats, increase, fetchedAt }
   */
  async getLatestLosses() {
    const cached = await cacheService.get(CACHE_KEYS.losses);
    if (cached) return cached;

    console.log('[Conflict] Fetching latest Russian losses from russianwarship.rip...');

    try {
      const res = await fetch('https://russianwarship.rip/api/v2/statistics/latest', {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) throw new Error(`russianwarship.rip responded ${res.status}`);

      const json = await res.json();
      const raw = json.data;

      const result = {
        date: raw.date,
        day: raw.day,
        stats: {
          personnel: raw.stats.personnel_units,
          tanks: raw.stats.tanks,
          afv: raw.stats.armoured_fighting_vehicles,
          artillery: raw.stats.artillery_systems,
          mlrs: raw.stats.mlrs,
          antiAir: raw.stats.aa_warfare_systems,
          aircraft: raw.stats.planes,
          helicopters: raw.stats.helicopters,
          vehicles: raw.stats.vehicles_fuel_tanks,
          ships: raw.stats.warships_cutters,
          cruiseMissiles: raw.stats.cruise_missiles,
          uav: raw.stats.uav_systems,
          specialEquip: raw.stats.special_military_equip,
          atgmSrbm: raw.stats.atgm_srbm_systems,
          submarines: raw.stats.submarines,
        },
        increase: {
          personnel: raw.increase.personnel_units,
          tanks: raw.increase.tanks,
          afv: raw.increase.armoured_fighting_vehicles,
          artillery: raw.increase.artillery_systems,
          mlrs: raw.increase.mlrs,
          antiAir: raw.increase.aa_warfare_systems,
          aircraft: raw.increase.planes,
          helicopters: raw.increase.helicopters,
          vehicles: raw.increase.vehicles_fuel_tanks,
          ships: raw.increase.warships_cutters,
          cruiseMissiles: raw.increase.cruise_missiles,
          uav: raw.increase.uav_systems,
          specialEquip: raw.increase.special_military_equip,
          atgmSrbm: raw.increase.atgm_srbm_systems,
          submarines: raw.increase.submarines,
        },
        source: 'Ukrainian Armed Forces / russianwarship.rip',
        fetchedAt: new Date().toISOString(),
      };

      await cacheService.set(CACHE_KEYS.losses, result, CACHE_TTL.losses);
      console.log(`[Conflict] Latest losses fetched: Day ${result.day} (${result.date})`);
      return result;
    } catch (error) {
      console.error('[Conflict] Failed to fetch losses:', error.message);
      return null;
    }
  }

  /**
   * Fetch recent loss history (last N days) for trend charts
   */
  async getLossesHistory(days = 30) {
    const cacheKey = `${CACHE_KEYS.lossesHistory}:${days}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    console.log(`[Conflict] Fetching ${days}-day losses history...`);

    try {
      const res = await fetch(
        `https://russianwarship.rip/api/v2/statistics?offset=0&limit=${days}`,
        {
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(20000),
        }
      );

      if (!res.ok) throw new Error(`russianwarship.rip responded ${res.status}`);

      const json = await res.json();
      const records = (json.data.records || []).map((r) => ({
        date: r.date,
        day: r.day,
        personnel: r.stats.personnel_units,
        tanks: r.stats.tanks,
        afv: r.stats.armoured_fighting_vehicles,
        artillery: r.stats.artillery_systems,
        aircraft: r.stats.planes,
        helicopters: r.stats.helicopters,
        uav: r.stats.uav_systems,
        ships: r.stats.warships_cutters,
        dailyPersonnel: r.increase.personnel_units,
        dailyTanks: r.increase.tanks,
        dailyAfv: r.increase.armoured_fighting_vehicles,
        dailyArtillery: r.increase.artillery_systems,
      }));

      const result = {
        days,
        records,
        source: 'Ukrainian Armed Forces / russianwarship.rip',
        fetchedAt: new Date().toISOString(),
      };

      await cacheService.set(cacheKey, result, CACHE_TTL.lossesHistory);
      console.log(`[Conflict] History fetched: ${records.length} records`);
      return result;
    } catch (error) {
      console.error('[Conflict] Failed to fetch losses history:', error.message);
      return null;
    }
  }

  // ─── War News (RSS Feeds) ───

  /**
   * Fetch latest war news from multiple RSS sources
   */
  async getWarNews(limit = 30) {
    const cached = await cacheService.get(CACHE_KEYS.warNews);
    if (cached) return { ...cached, items: cached.items.slice(0, limit) };

    console.log('[Conflict] Fetching war news from RSS feeds...');

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
          console.error(`[Conflict] RSS error (${feed.name}):`, err.message);
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

    await cacheService.set(CACHE_KEYS.warNews, result, CACHE_TTL.warNews);
    console.log(`[Conflict] War news fetched: ${unique.length} articles`);

    return { ...result, items: result.items.slice(0, limit) };
  }

  // ─── Combined endpoint ───

  /**
   * Get all live conflict data in one call
   */
  async getLiveData() {
    const [losses, news] = await Promise.all([
      this.getLatestLosses(),
      this.getWarNews(15),
    ]);

    return {
      losses,
      news: news?.items || [],
      newsFetchedAt: news?.fetchedAt || null,
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
    return `cnf-${Math.abs(hash).toString(36)}`;
  }
}

export const conflictService = new ConflictService();
export default conflictService;
