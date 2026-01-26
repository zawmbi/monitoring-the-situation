/**
 * Configuration management
 * Centralizes all environment variables and config
 */

import { config as dotenvConfig } from 'dotenv';
dotenvConfig();

export const config = {
  // Server
  port: parseInt(process.env.PORT || '4000', 10),
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
    bearerToken: process.env.TWITTER_BEARER_TOKEN || '',
    apiKey: process.env.TWITTER_API_KEY || '',
    apiSecret: process.env.TWITTER_API_SECRET || '',
    accounts: (process.env.TWITTER_ACCOUNTS || 'Reuters,AP,BBCBreaking').split(','),
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
};

export default config;
