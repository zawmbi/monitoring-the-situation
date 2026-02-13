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
import { polymarketService } from '../services/polymarket.service.js';
import { conflictService } from '../services/conflict.service.js';
import { tariffService } from '../services/tariff.service.js';
import { worldBankService } from '../services/worldbank.service.js';
import { wikidataService } from '../services/wikidata.service.js';
import { ucdpService } from '../services/ucdp.service.js';
import { marketsService } from '../services/markets.service.js';
import { kalshiService } from '../services/kalshi.service.js';

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

/**
 * GET /api/polymarket
 * Returns Polymarket prediction markets with >100k volume
 * Query params:
 * - country: filter by country name
 * - limit: number of markets to return (default 50)
 */
router.get('/polymarket', async (req, res) => {
  try {
    const { country, limit = 50 } = req.query;

    console.log(`[API] Polymarket request: country=${country || 'all'}, limit=${limit}`);

    let markets;
    if (country) {
      markets = await polymarketService.getMarketsByCountry(country);
      console.log(`[API] Found ${markets.length} markets for ${country}`);
    } else {
      markets = await polymarketService.getTopMarkets(parseInt(limit, 10));
      console.log(`[API] Returning ${markets.length} top markets`);
    }

    res.json({
      success: true,
      count: markets.length,
      data: markets,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[API] Polymarket error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Polymarket data',
      details: error.message
    });
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

// ===========================================
// CONFLICT DATA (Russia-Ukraine live stats)
// ===========================================

/**
 * GET /api/conflict
 * Get combined live conflict data (latest losses + news)
 */
router.get('/conflict', async (req, res) => {
  try {
    const data = await conflictService.getLiveData();
    res.json({ success: true, data, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('[API] Conflict error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch conflict data' });
  }
});

/**
 * GET /api/conflict/losses
 * Get latest Russian losses (UA MOD daily report)
 */
router.get('/conflict/losses', async (req, res) => {
  try {
    const data = await conflictService.getLatestLosses();
    if (!data) {
      return res.status(503).json({ success: false, error: 'Loss data temporarily unavailable' });
    }
    res.json({ success: true, data, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('[API] Conflict losses error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch loss data' });
  }
});

/**
 * GET /api/conflict/losses/history
 * Get recent loss history for trend analysis
 * Query params:
 *   - days: number of days (default 30, max 90)
 */
router.get('/conflict/losses/history', async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days || '30', 10), 90);
    const data = await conflictService.getLossesHistory(days);
    if (!data) {
      return res.status(503).json({ success: false, error: 'History data temporarily unavailable' });
    }
    res.json({ success: true, data, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('[API] Conflict history error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch loss history' });
  }
});

/**
 * GET /api/conflict/news
 * Get latest war news from RSS feeds
 * Query params:
 *   - limit: number of articles (default 30)
 */
router.get('/conflict/news', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '30', 10), 100);
    const data = await conflictService.getWarNews(limit);
    res.json({
      success: true,
      count: data.items.length,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] Conflict news error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch war news' });
  }
});

// ===========================================
// TARIFF DATA (US trade policy live stats)
// ===========================================

/**
 * GET /api/tariffs
 * Get combined live tariff data (news + rate overrides)
 */
router.get('/tariffs', async (req, res) => {
  try {
    const data = await tariffService.getLiveData();
    res.json({ success: true, data, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('[API] Tariff error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch tariff data' });
  }
});

/**
 * GET /api/tariffs/news
 * Get latest tariff-related news from RSS feeds
 * Query params:
 *   - limit: number of articles (default 30)
 */
router.get('/tariffs/news', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '30', 10), 100);
    const data = await tariffService.getTariffNews(limit);
    res.json({
      success: true,
      count: data.items.length,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] Tariff news error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch tariff news' });
  }
});

// ===========================================
// ECONOMIC DATA (World Bank live indicators)
// ===========================================

/**
 * GET /api/economic/:cca2
 * Get live economic indicators for a country (ISO 3166-1 alpha-2 code)
 * Source: World Bank Indicators API (CC BY 4.0)
 */
router.get('/economic/:cca2', async (req, res) => {
  try {
    const { cca2 } = req.params;
    if (!cca2 || cca2.length !== 2) {
      return res.status(400).json({ success: false, error: 'Valid 2-letter country code required' });
    }
    const data = await worldBankService.getEconomicData(cca2.toUpperCase());
    if (!data) {
      return res.status(404).json({ success: false, error: `No economic data for ${cca2}` });
    }
    res.json({ success: true, data, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('[API] Economic error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch economic data' });
  }
});

// ===========================================
// WORLD LEADERS (Wikidata live data)
// ===========================================

/**
 * GET /api/leaders
 * Get all current world leaders
 * Source: Wikidata SPARQL (CC0 — public domain)
 */
router.get('/leaders', async (req, res) => {
  try {
    const data = await wikidataService.getWorldLeaders();
    if (!data) {
      return res.status(503).json({ success: false, error: 'Leader data temporarily unavailable' });
    }
    res.json({ success: true, data, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('[API] Leaders error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch world leaders' });
  }
});

/**
 * GET /api/leaders/:country
 * Get the current leader for a specific country
 */
router.get('/leaders/:country', async (req, res) => {
  try {
    const { country } = req.params;
    const leader = await wikidataService.getLeaderByCountry(decodeURIComponent(country));
    if (!leader) {
      return res.status(404).json({ success: false, error: `No leader data for ${country}` });
    }
    res.json({ success: true, data: leader, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('[API] Leader error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch leader data' });
  }
});

// ===========================================
// MARKETS (Stock indices & forex per country)
// ===========================================

/**
 * GET /api/markets/:countryCode
 * Get stock market indices and forex data for a country (ISO 3166-1 alpha-2)
 * Source: Yahoo Finance (indices), Frankfurter API (forex)
 */
router.get('/markets/:countryCode', async (req, res) => {
  try {
    const { countryCode } = req.params;
    if (!countryCode || countryCode.length < 2 || countryCode.length > 3) {
      return res.status(400).json({ success: false, error: 'Valid 2-letter country code required' });
    }
    const data = await marketsService.getMarketData(countryCode.toUpperCase());
    if (!data) {
      return res.status(404).json({ success: false, error: `No market data for ${countryCode}` });
    }
    res.json({ success: true, data, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('[API] Markets error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch market data' });
  }
});

// ===========================================
// KALSHI PREDICTION MARKETS
// ===========================================

/**
 * GET /api/kalshi
 * Returns Kalshi prediction markets
 * Query params:
 * - q: comma-separated keywords (at least one must match)
 * - boost: comma-separated keywords (improve relevance)
 * - limit: number of markets to return (default 50)
 */
router.get('/kalshi', async (req, res) => {
  try {
    const { q: requireParam, boost: boostParam, limit = 50 } = req.query;
    let markets;
    if (requireParam) {
      const required = requireParam.split(',').map(k => k.trim()).filter(Boolean);
      const boost = boostParam ? boostParam.split(',').map(k => k.trim()).filter(Boolean) : [];
      markets = await kalshiService.getMarketsByTopic(required, boost);
    } else {
      markets = await kalshiService.getTopMarkets(parseInt(limit, 10));
    }
    res.json({ success: true, count: markets.length, data: markets, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('[API] Kalshi error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch Kalshi data' });
  }
});

/**
 * GET /api/predictions
 * Combined prediction markets from Polymarket + Kalshi, filtered by topic
 * Query params:
 * - q: comma-separated required keywords (at least one MUST match)
 * - boost: comma-separated keywords (improve relevance score) — optional
 * - limit: max results per source (default 8)
 */
router.get('/predictions', async (req, res) => {
  try {
    const { q: requireParam, boost: boostParam, limit = 8, matchAll: matchAllParam } = req.query;
    if (!requireParam) {
      return res.status(400).json({ success: false, error: 'Query parameter "q" is required' });
    }

    const requiredKeywords = requireParam.split(',').map(k => k.trim()).filter(Boolean);
    const boostKeywords = boostParam ? boostParam.split(',').map(k => k.trim()).filter(Boolean) : [];
    const maxResults = parseInt(limit, 10);
    const matchAll = matchAllParam === 'true' || matchAllParam === '1';

    const [polymarketResults, kalshiResults] = await Promise.allSettled([
      polymarketService.getMarketsByTopic(requiredKeywords, boostKeywords, matchAll),
      kalshiService.getMarketsByTopic(requiredKeywords, boostKeywords, matchAll),
    ]);

    const polymarkets = polymarketResults.status === 'fulfilled'
      ? polymarketResults.value.slice(0, maxResults).map(m => ({ ...m, source: 'polymarket' }))
      : [];
    const kalshiMarkets = kalshiResults.status === 'fulfilled'
      ? kalshiResults.value.slice(0, maxResults).map(m => ({ ...m, source: 'kalshi' }))
      : [];

    // Merge both lists, sort by volume descending
    const combined = [...polymarkets, ...kalshiMarkets]
      .sort((a, b) => (b.volume || 0) - (a.volume || 0))
      .slice(0, maxResults * 2);

    res.json({
      success: true,
      count: combined.length,
      sources: {
        polymarket: polymarkets.length,
        kalshi: kalshiMarkets.length,
      },
      data: combined,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] Predictions error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch prediction markets' });
  }
});

// ===========================================
// UCDP CONFLICT EVENTS (Global conflict data)
// ===========================================

/**
 * GET /api/ucdp/events
 * Get recent conflict events from UCDP Georeferenced Event Dataset
 * Query params:
 *   - country: filter by country name
 *   - year: filter by year (default: current)
 *   - limit: max events (default 100)
 */
router.get('/ucdp/events', async (req, res) => {
  try {
    const { country, year, limit = 100 } = req.query;
    const data = await ucdpService.getRecentEvents({
      country: country || undefined,
      year: year ? parseInt(year, 10) : undefined,
      limit: Math.min(parseInt(limit, 10), 500),
    });
    if (!data) {
      return res.status(503).json({ success: false, error: 'UCDP data temporarily unavailable' });
    }
    res.json({ success: true, data, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('[API] UCDP events error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch conflict events' });
  }
});

/**
 * GET /api/ucdp/conflicts
 * Get active armed conflicts summary
 */
router.get('/ucdp/conflicts', async (req, res) => {
  try {
    const data = await ucdpService.getActiveConflicts();
    if (!data) {
      return res.status(503).json({ success: false, error: 'UCDP data temporarily unavailable' });
    }
    res.json({ success: true, data, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('[API] UCDP conflicts error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch active conflicts' });
  }
});

export default router;
