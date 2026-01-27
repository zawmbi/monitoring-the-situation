/**
 * Cache Service using Redis
 * Handles caching, pub/sub, and rate limiting
 */

import Redis from 'ioredis';
import config from '../config/index.js';

class CacheService {
  constructor() {
    this.client = null;
    this.subscriber = null;
    this.publisher = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      this.client = new Redis(config.redis.url, {
        retryStrategy: (times) => Math.min(times * 50, 2000),
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });

      this.subscriber = new Redis(config.redis.url, { lazyConnect: true });
      this.publisher = new Redis(config.redis.url, { lazyConnect: true });

      // Suppress unhandled error event listeners
      this.client.on('error', () => {}); // Silently ignore connection errors
      this.subscriber.on('error', () => {});
      this.publisher.on('error', () => {});

      this.client.on('connect', () => {
        console.log('[Cache] Connected to Redis');
        this.isConnected = true;
      });

      try {
        await this.client.ping();
        this.isConnected = true;
        return true;
      } catch {
        console.log('[Cache] Redis unavailable - caching disabled (app will still work)');
        this.isConnected = false;
        return false;
      }
    } catch (error) {
      console.log('[Cache] Redis unavailable - caching disabled (app will still work)');
      return false;
    }
  }

  async get(key) {
    if (!this.isConnected) return null;
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      return null;
    }
  }

  async set(key, value, ttlSeconds = 60) {
    if (!this.isConnected) return false;
    try {
      await this.client.setex(key, ttlSeconds, JSON.stringify(value));
      return true;
    } catch (error) {
      return false;
    }
  }

  async delete(key) {
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('[Cache] Delete error:', error.message);
      return false;
    }
  }

  async publish(channel, message) {
    try {
      await this.publisher.publish(channel, JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('[Cache] Publish error:', error.message);
      return false;
    }
  }

  async subscribe(channel, callback) {
    try {
      await this.subscriber.subscribe(channel);
      this.subscriber.on('message', (ch, message) => {
        if (ch === channel) {
          callback(JSON.parse(message));
        }
      });
      return true;
    } catch (error) {
      console.error('[Cache] Subscribe error:', error.message);
      return false;
    }
  }

  async health() {
    try {
      await this.client.ping();
      return { status: 'healthy', connected: true };
    } catch (error) {
      return { status: 'unhealthy', connected: false, error: error.message };
    }
  }

  async disconnect() {
    if (this.client) await this.client.quit();
    if (this.subscriber) await this.subscriber.quit();
    if (this.publisher) await this.publisher.quit();
  }
}

export const cacheService = new CacheService();
export default cacheService;
