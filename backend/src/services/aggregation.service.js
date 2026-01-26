/**
 * Aggregation Service
 * Combines content from all sources into unified feeds
 */

import { cacheService } from './cache.service.js';
import { newsService } from './news.service.js';
import { socialService } from './social.service.js';
import { feedService } from './feed.service.js';
import config from '../config/index.js';

const CACHE_KEYS = {
  combined: 'aggregated:all',
  byType: (type) => `aggregated:type:${type}`,
};

class AggregationService {
  /**
   * Get combined feed from all sources
   * This is the main endpoint for the frontend
   */
  async getCombinedFeed(options = {}) {
    const { 
      limit = 50, 
      types = ['article', 'tweet', 'reddit_post'],
      sources = [],
      refresh = false 
    } = options;

    const cacheKey = CACHE_KEYS.combined;
    
    // Check cache unless refresh requested
    if (!refresh) {
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return this.filterAndLimit(cached, { limit, types, sources });
      }
    }

    console.log('[Aggregation] Fetching from all sources...');

    // Fetch from all sources in parallel
    const [newsArticles, tweets, redditPosts, rssItems] = await Promise.all([
      newsService.getTopHeadlines().catch(err => {
        console.error('[Aggregation] News error:', err.message);
        return [];
      }),
      socialService.getTweets().catch(err => {
        console.error('[Aggregation] Twitter error:', err.message);
        return [];
      }),
      socialService.getRedditPosts().catch(err => {
        console.error('[Aggregation] Reddit error:', err.message);
        return [];
      }),
      feedService.getAllFeeds().catch(err => {
        console.error('[Aggregation] RSS error:', err.message);
        return [];
      }),
    ]);

    // Combine all items
    const allItems = [
      ...newsArticles,
      ...tweets,
      ...redditPosts,
      ...rssItems,
    ];

    // Sort by date (newest first)
    allItems.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

    // Deduplicate by URL
    const seen = new Set();
    const uniqueItems = allItems.filter(item => {
      const key = item.url || item.id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Cache combined results
    await cacheService.set(cacheKey, uniqueItems, config.cache.combined);

    console.log(`[Aggregation] Combined ${uniqueItems.length} unique items`);

    // Publish update for WebSocket clients
    await cacheService.publish('content:updates', {
      type: 'refresh',
      count: uniqueItems.length,
      timestamp: new Date().toISOString(),
    });

    return this.filterAndLimit(uniqueItems, { limit, types, sources });
  }

  /**
   * Filter and limit results
   */
  filterAndLimit(items, { limit, types, sources }) {
    let filtered = items;

    // Filter by content type
    if (types && types.length > 0) {
      filtered = filtered.filter(item => types.includes(item.contentType));
    }

    // Filter by source
    if (sources && sources.length > 0) {
      const sourcesLower = sources.map(s => s.toLowerCase());
      filtered = filtered.filter(item => 
        sourcesLower.some(s => 
          item.source?.toLowerCase().includes(s) ||
          item.sourceName?.toLowerCase().includes(s)
        )
      );
    }

    // Limit results
    return filtered.slice(0, limit);
  }

  /**
   * Get content by type only
   */
  async getByType(contentType, limit = 20) {
    const cacheKey = CACHE_KEYS.byType(contentType);
    
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached.slice(0, limit);

    let items = [];
    
    switch (contentType) {
      case 'article':
        const [news, rss] = await Promise.all([
          newsService.getTopHeadlines(),
          feedService.getAllFeeds(),
        ]);
        items = [...news, ...rss];
        break;
      case 'tweet':
        items = await socialService.getTweets();
        break;
      case 'reddit_post':
        items = await socialService.getRedditPosts();
        break;
      default:
        return [];
    }

    items.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    await cacheService.set(cacheKey, items, config.cache.combined);
    
    return items.slice(0, limit);
  }

  /**
   * Search across all content
   */
  async search(query, limit = 20) {
    const allItems = await this.getCombinedFeed({ limit: 500 });
    const queryLower = query.toLowerCase();
    
    return allItems
      .filter(item =>
        item.title?.toLowerCase().includes(queryLower) ||
        item.content?.toLowerCase().includes(queryLower) ||
        item.summary?.toLowerCase().includes(queryLower)
      )
      .slice(0, limit);
  }

  /**
   * Get stats about aggregated content
   */
  async getStats() {
    const allItems = await this.getCombinedFeed({ limit: 1000 });
    
    const byType = {};
    const bySource = {};
    
    allItems.forEach(item => {
      byType[item.contentType] = (byType[item.contentType] || 0) + 1;
      const source = item.sourceName || item.source;
      bySource[source] = (bySource[source] || 0) + 1;
    });

    return {
      totalItems: allItems.length,
      byType,
      bySource,
      lastUpdated: allItems[0]?.fetchedAt || null,
    };
  }
}

export const aggregationService = new AggregationService();
export default aggregationService;
