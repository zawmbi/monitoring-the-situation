/**
 * Configuration management
 * Centralizes all environment variables and config
 */

import { config as dotenvConfig } from 'dotenv';
import path from 'path';
dotenvConfig();
// Also load env from repository root if backend is launched from /backend
dotenvConfig({ path: path.resolve(process.cwd(), '..', '.env'), override: false });

export const config = {
  // Server
  port: parseInt(process.env.PORT || process.env.BACKEND_PORT || '4100', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: process.env.NODE_ENV !== 'production',

  // Redis
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  // PostgreSQL
  database: {
    url: process.env.DATABASE_URL || 'postgres://newsuser:newspass@localhost:5432/newsdb',
  },

  // News APIs
  newsApi: {
    key: process.env.NEWS_API_KEY || '',
    baseUrl: 'https://newsapi.org/v2',
  },
  gnewsApi: {
    key: process.env.GNEWS_API_KEY || '',
    baseUrl: 'https://gnews.io/api/v4',
  },

  // Twitter/X
  twitter: {
    enabled: (process.env.TWITTER_ENABLED || 'false').toLowerCase() === 'true',
    bearerToken: process.env.TWITTER_BEARER_TOKEN || '',
    apiKey: process.env.TWITTER_API_KEY || '',
    apiSecret: process.env.TWITTER_API_SECRET || '',
    accounts: (process.env.TWITTER_ACCOUNTS || 'Reuters,AP,BBCBreaking')
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean),
    customFeedPath: process.env.TWITTER_CUSTOM_FEED_PATH || '../data/twitter-feed.json',
  },

  // Reddit
  reddit: {
    clientId: process.env.REDDIT_CLIENT_ID || '',
    clientSecret: process.env.REDDIT_CLIENT_SECRET || '',
    userAgent: process.env.REDDIT_USER_AGENT || 'NewsAggregator/1.0',
    subreddits: (process.env.REDDIT_SUBREDDITS || 'news,worldnews,technology').split(','),
  },

  // RSS Feeds
  rssFeeds: (process.env.RSS_FEEDS || '').split(',').filter(Boolean),

  // Polling intervals (milliseconds)
  polling: {
    news: parseInt(process.env.NEWS_POLL_INTERVAL || '300', 10) * 1000,
    social: parseInt(process.env.SOCIAL_POLL_INTERVAL || '60', 10) * 1000,
    feeds: parseInt(process.env.FEED_POLL_INTERVAL || '600', 10) * 1000,
  },

  // Cache TTLs (seconds)
  cache: {
    news: parseInt(process.env.CACHE_NEWS_TTL || '300', 10),
    tweets: parseInt(process.env.CACHE_TWEETS_TTL || '60', 10),
    feeds: parseInt(process.env.CACHE_FEEDS_TTL || '600', 10),
    combined: 30,  // Combined feed cache
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  },

  // Alpha Vantage (stocks)
  alphaVantage: {
    key: process.env.ALPHA_VANTAGE_API_KEY || process.env.ALPHAADVANTAGE_API_KEY || '',
    baseUrl: process.env.ALPHA_VANTAGE_BASE_URL || 'https://www.alphavantage.co/query',
    refreshIntervals: {
      movers: parseInt(process.env.STOCKS_REFRESH_SECONDS || '300', 10), // 5 minutes
      markets: parseInt(process.env.STOCKS_MARKET_REFRESH_SECONDS || '600', 10), // 10 minutes
      listings: parseInt(process.env.STOCKS_LISTING_REFRESH_SECONDS || '21600', 10), // 6 hours
    },
  },
};

export default config;
