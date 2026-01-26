/**
 * API Routes
 * REST endpoints for news aggregation platform
 */

import { Router } from 'express';
import { aggregationService } from '../services/aggregation.service.js';
import { newsService } from '../services/news.service.js';
import { socialService } from '../services/social.service.js';
import { feedService } from '../services/feed.service.js';
import { cacheService } from '../services/cache.service.js';
import { wsHandler } from '../services/websocket.service.js';
import { stocksService } from '../services/stocks.service.js';

const router = Router();

// ===========================================
// HEALTH & STATUS
// ===========================================

router.get('/health', async (req, res) => {
  const redisHealth = await cacheService.health();
  
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      redis: redisHealth,
      websocket: wsHandler.getStats(),
    },
  });
});

router.get('/stats', async (req, res) => {
  try {
    const stats = await aggregationService.getStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/stocks
 * Returns top movers and a padded list up to 100 tickers with market status
 */
router.get('/stocks', async (req, res) => {
  try {
    const data = await stocksService.getTopStocks(100);
    res.json({ success: true, data });
  } catch (error) {
    const statusCode = error.code === 'NO_API_KEY' ? 400 : 502;
    res.status(statusCode).json({ success: false, error: error.message });
  }
});

// ===========================================
// COMBINED FEED (Main endpoint)
// ===========================================

/**
 * GET /api/feed
 * Get combined feed from all sources
 * 
 * Query params:
 * - limit: number of items (default 50)
 * - types: comma-separated content types (article,tweet,reddit_post)
 * - sources: comma-separated source names
 * - refresh: force refresh cache
 */
router.get('/feed', async (req, res) => {
  try {
    const { limit = 50, types, sources, refresh } = req.query;

    const items = await aggregationService.getCombinedFeed({
      limit: parseInt(limit, 10),
      types: types ? types.split(',') : undefined,
      sources: sources ? sources.split(',') : undefined,
      refresh: refresh === 'true',
    });

    res.json({
      success: true,
      count: items.length,
      data: items,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] Feed error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch feed' });
  }
});

// ===========================================
// NEWS ARTICLES
// ===========================================

/**
 * GET /api/news
 * Get news articles from NewsAPI
 */
router.get('/news', async (req, res) => {
  try {
    const { category, country = 'us', limit = 20 } = req.query;

    let articles;
    if (category) {
      articles = await newsService.getByCategory(category, country, parseInt(limit, 10));
    } else {
      articles = await newsService.getTopHeadlines(country, parseInt(limit, 10));
    }

    res.json({
      success: true,
      count: articles.length,
      data: articles,
    });
  } catch (error) {
    console.error('[API] News error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch news' });
  }
});

/**
 * GET /api/news/search
 * Search news articles
 */
router.get('/news/search', async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;

    if (!q) {
      return res.status(400).json({ success: false, error: 'Query parameter "q" is required' });
    }

    const articles = await newsService.search(q, parseInt(limit, 10));

    res.json({
      success: true,
      count: articles.length,
      query: q,
      data: articles,
    });
  } catch (error) {
    console.error('[API] Search error:', error);
    res.status(500).json({ success: false, error: 'Failed to search news' });
  }
});

// ===========================================
// SOCIAL MEDIA (Twitter & Reddit)
// ===========================================

/**
 * GET /api/tweets
 * Get tweets from configured accounts
 */
router.get('/tweets', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const tweets = await socialService.getTweets();

    res.json({
      success: true,
      count: Math.min(tweets.length, parseInt(limit, 10)),
      data: tweets.slice(0, parseInt(limit, 10)),
    });
  } catch (error) {
    console.error('[API] Tweets error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch tweets' });
  }
});

/**
 * GET /api/reddit
 * Get posts from configured subreddits
 */
router.get('/reddit', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const posts = await socialService.getRedditPosts();

    res.json({
      success: true,
      count: Math.min(posts.length, parseInt(limit, 10)),
      data: posts.slice(0, parseInt(limit, 10)),
    });
  } catch (error) {
    console.error('[API] Reddit error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch reddit posts' });
  }
});

// ===========================================
// RSS FEEDS
// ===========================================

/**
 * GET /api/rss
 * Get content from RSS feeds
 */
router.get('/rss', async (req, res) => {
  try {
    const { source, limit = 30 } = req.query;

    let items;
    if (source) {
      items = await feedService.getFeedBySource(source);
    } else {
      items = await feedService.getAllFeeds();
    }

    res.json({
      success: true,
      count: Math.min(items.length, parseInt(limit, 10)),
      data: items.slice(0, parseInt(limit, 10)),
    });
  } catch (error) {
    console.error('[API] RSS error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch RSS feeds' });
  }
});

/**
 * GET /api/rss/sources
 * Get list of configured RSS sources
 */
router.get('/rss/sources', (req, res) => {
  const sources = feedService.getConfiguredFeeds();
  res.json({
    success: true,
    count: sources.length,
    data: sources,
  });
});

// ===========================================
// SEARCH (across all sources)
// ===========================================

/**
 * GET /api/search
 * Search across all content types
 */
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;

    if (!q) {
      return res.status(400).json({ success: false, error: 'Query parameter "q" is required' });
    }

    const results = await aggregationService.search(q, parseInt(limit, 10));

    res.json({
      success: true,
      count: results.length,
      query: q,
      data: results,
    });
  } catch (error) {
    console.error('[API] Search error:', error);
    res.status(500).json({ success: false, error: 'Search failed' });
  }
});

export default router;
