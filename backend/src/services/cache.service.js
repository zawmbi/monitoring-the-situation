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
      });

      this.subscriber = new Redis(config.redis.url);
      this.publisher = new Redis(config.redis.url);

      this.client.on('connect', () => {
        console.log('[Cache] Connected to Redis');
        this.isConnected = true;
      });

      this.client.on('error', (err) => {
        console.error('[Cache] Redis error:', err.message);
        this.isConnected = false;
      });

      await this.client.ping();
      return true;
    } catch (error) {
      console.error('[Cache] Failed to connect:', error.message);
      return false;
    }
  }

  async get(key) {
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('[Cache] Get error:', error.message);
      return null;
    }
  }

  async set(key, value, ttlSeconds = 60) {
    try {
      await this.client.setex(key, ttlSeconds, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('[Cache] Set error:', error.message);
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
