/**
 * Feed Service
 * Handles RSS/Atom feed parsing and aggregation
 */

import Parser from 'rss-parser';
import config from '../config/index.js';
import { cacheService } from './cache.service.js';

const CACHE_KEYS = {
  allFeeds: 'feeds:all',
  byUrl: (url) => `feeds:${Buffer.from(url).toString('base64').substring(0, 32)}`,
};

// Default feeds if none configured
const DEFAULT_FEEDS = [
  { name: 'BBC News', url: 'https://feeds.bbci.co.uk/news/rss.xml' },
  { name: 'Reuters', url: 'https://www.reutersagency.com/feed/' },
  { name: 'NY Times', url: 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml' },
  { name: 'TechCrunch', url: 'https://techcrunch.com/feed/' },
  { name: 'Hacker News', url: 'https://hnrss.org/frontpage' },
  { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml' },
  { name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index' },
];

class FeedService {
  constructor() {
    this.parser = new Parser({
      timeout: 10000,
      headers: {
        'User-Agent': 'NewsAggregator/1.0',
      },
    });
    
    // Use configured feeds or defaults
    this.feeds = config.rssFeeds.length > 0
      ? config.rssFeeds.map(url => ({ name: this.extractDomain(url), url }))
      : DEFAULT_FEEDS;
  }

  extractDomain(url) {
    try {
      return new URL(url).hostname.replace('www.', '').replace('feeds.', '');
    } catch {
      return url;
    }
  }

  /**
   * Parse a single RSS feed
   */
  async parseFeed(feedUrl, feedName) {
    try {
      const feed = await this.parser.parseURL(feedUrl);
      return (feed.items || []).slice(0, 10).map(item => 
        this.normalizeItem(item, feedName || feed.title, feedUrl)
      );
    } catch (error) {
      console.error(`[Feed] Error parsing ${feedUrl}:`, error.message);
      return [];
    }
  }

  /**
   * Normalize RSS item to common format
   */
  normalizeItem(item, sourceName, sourceUrl) {
    // Extract image from various possible locations
    let imageUrl = null;
    if (item.enclosure?.url) {
      imageUrl = item.enclosure.url;
    } else if (item['media:content']?.$.url) {
      imageUrl = item['media:content'].$.url;
    } else if (item.content) {
      const imgMatch = item.content.match(/<img[^>]+src="([^">]+)"/);
      if (imgMatch) imageUrl = imgMatch[1];
    }

    return {
      id: this.generateId(item.link || item.guid || item.title),
      contentType: 'article',
      source: 'rss',
      sourceName: sourceName,
      sourceUrl: sourceUrl,
      title: item.title,
      content: this.stripHtml(item.contentSnippet || item.content || item.summary || ''),
      summary: this.stripHtml(item.contentSnippet || item.summary || '').substring(0, 200),
      url: item.link,
      imageUrl: imageUrl,
      author: item.creator || item.author || item['dc:creator'],
      publishedAt: item.pubDate || item.isoDate || new Date().toISOString(),
      categories: item.categories || [],
      fetchedAt: new Date().toISOString(),
    };
  }

  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  generateId(input) {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `feed-${Math.abs(hash).toString(36)}`;
  }

  /**
   * Get all RSS feed content
   */
  async getAllFeeds() {
    const cacheKey = CACHE_KEYS.allFeeds;
    
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    console.log(`[Feed] Fetching ${this.feeds.length} RSS feeds...`);
    
    const allItems = [];
    const results = await Promise.allSettled(
      this.feeds.map(feed => this.parseFeed(feed.url, feed.name))
    );

    results.forEach((result, i) => {
      if (result.status === 'fulfilled') {
        allItems.push(...result.value);
      } else {
        console.error(`[Feed] Failed: ${this.feeds[i].name}`);
      }
    });

    // Sort by date and deduplicate
    const seen = new Set();
    const uniqueItems = allItems
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
      .filter(item => {
        if (seen.has(item.url)) return false;
        seen.add(item.url);
        return true;
      });

    await cacheService.set(cacheKey, uniqueItems, config.cache.feeds);
    console.log(`[Feed] Cached ${uniqueItems.length} unique items`);
    
    return uniqueItems;
  }

  /**
   * Get feed by source name
   */
  async getFeedBySource(sourceName) {
    const allFeeds = await this.getAllFeeds();
    return allFeeds.filter(item => 
      item.sourceName.toLowerCase().includes(sourceName.toLowerCase())
    );
  }

  /**
   * Search across all feeds
   */
  async search(query) {
    const allFeeds = await this.getAllFeeds();
    const queryLower = query.toLowerCase();
    
    return allFeeds.filter(item =>
      item.title?.toLowerCase().includes(queryLower) ||
      item.content?.toLowerCase().includes(queryLower)
    );
  }

  /**
   * Get list of configured feeds
   */
  getConfiguredFeeds() {
    return this.feeds;
  }
}

export const feedService = new FeedService();
export default feedService;
