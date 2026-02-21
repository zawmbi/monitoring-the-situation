/**
 * Configuration management
 * Centralizes all environment variables and config
 */

import { config as dotenvConfig } from 'dotenv';
import path from 'path';
import { readFileSync } from 'fs';

// Load .env from multiple locations (first match wins per variable)
const envPaths = [
  path.resolve(process.cwd(), '.env'),                   // backend/.env
  path.resolve(process.cwd(), '..', '.env'),              // root .env
  path.resolve(process.cwd(), '..', 'frontend', '.env'),  // frontend/.env (fallback)
];

const loaded = [];
for (const envPath of envPaths) {
  const result = dotenvConfig({ path: envPath, override: false });
  if (!result.error) loaded.push(envPath);
}

// If keys are still missing, try multiple encodings as last resort
if (!process.env.FEC_API_KEY || !process.env.GOOGLE_CIVIC_API_KEY) {
  for (const envPath of envPaths) {
    for (const encoding of ['utf-8', 'utf16le', 'latin1']) {
      try {
        let raw = readFileSync(envPath, encoding);
        // Strip BOM
        raw = raw.replace(/^\uFEFF/, '');
        // Strip null bytes (UTF-16 read as UTF-8)
        raw = raw.replace(/\0/g, '');
        for (const line of raw.split(/\r?\n/)) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx < 0) continue;
          const key = trimmed.slice(0, eqIdx).trim();
          const val = trimmed.slice(eqIdx + 1).trim();
          if ((key === 'FEC_API_KEY' || key === 'GOOGLE_CIVIC_API_KEY') && val && !process.env[key]) {
            process.env[key] = val;
            console.log(`[Config] Found ${key} via manual parse (${encoding}) in ${envPath}`);
          }
        }
      } catch { /* file not found, skip */ }
    }
  }
  // Debug: dump last 300 bytes of each file to diagnose encoding
  if (!process.env.FEC_API_KEY) {
    for (const envPath of envPaths) {
      try {
        const buf = readFileSync(envPath);
        const tail = buf.slice(Math.max(0, buf.length - 300));
        console.log(`[Config] DEBUG tail of ${envPath}:`);
        console.log(`[Config] hex: ${tail.toString('hex').slice(-200)}`);
        console.log(`[Config] str: ${JSON.stringify(tail.toString('utf-8').slice(-150))}`);
      } catch { /* skip */ }
    }
  }
}

console.log(`[Config] Loaded env from: ${loaded.join(', ') || 'none'}`);
console.log(`[Config] FEC_API_KEY: ${process.env.FEC_API_KEY ? 'set (' + process.env.FEC_API_KEY.slice(0, 4) + '...)' : 'MISSING'}`);
console.log(`[Config] GOOGLE_CIVIC_API_KEY: ${process.env.GOOGLE_CIVIC_API_KEY ? 'set (' + process.env.GOOGLE_CIVIC_API_KEY.slice(0, 4) + '...)' : 'MISSING'}`);

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
    userAgent: process.env.REDDIT_USER_AGENT || 'monitr/1.0',
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

  /**
   * Validate critical configuration on startup.
   * Warns about missing optional keys; throws on broken values.
   */
  validate() {
    const warnings = [];
    const errors = [];

    // Port must be a valid number
    if (isNaN(this.port) || this.port < 1 || this.port > 65535) {
      errors.push(`PORT "${process.env.PORT}" is not a valid port number`);
    }

    // Polling intervals must be positive
    for (const [key, val] of Object.entries(this.polling)) {
      if (isNaN(val) || val < 1000) {
        errors.push(`Polling interval "${key}" resolved to ${val}ms — must be >= 1000ms`);
      }
    }

    // Cache TTLs must be positive
    for (const [key, val] of Object.entries(this.cache)) {
      if (isNaN(val) || val < 1) {
        errors.push(`Cache TTL "${key}" resolved to ${val} — must be >= 1`);
      }
    }

    // Warn about missing API keys (non-fatal — services degrade gracefully)
    if (!this.newsApi.key) warnings.push('NEWS_API_KEY not set — NewsAPI source disabled');
    if (!this.gnewsApi.key) warnings.push('GNEWS_API_KEY not set — GNews source disabled');
    if (!this.alphaVantage.key) warnings.push('ALPHA_VANTAGE_API_KEY not set — stock data disabled');
    if (this.cors.origin === '*' && !this.isDev) {
      warnings.push('CORS_ORIGIN is wildcard (*) in production — consider restricting');
    }

    // Print warnings
    for (const w of warnings) {
      console.warn(`[Config] WARN: ${w}`);
    }

    // Throw on errors
    if (errors.length > 0) {
      for (const e of errors) {
        console.error(`[Config] ERROR: ${e}`);
      }
      throw new Error(`Configuration validation failed:\n  ${errors.join('\n  ')}`);
    }

    console.log(`[Config] Validation passed (${warnings.length} warning${warnings.length !== 1 ? 's' : ''})`);
  },
};

export default config;
