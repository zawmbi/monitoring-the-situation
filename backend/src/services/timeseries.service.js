/**
 * Time Series Service
 * Stores rolling snapshots of key metrics for historical trend analysis.
 * Uses Redis sorted sets for lightweight time-series storage.
 *
 * Captures: tension index, risk scores, conflict intensities, market data
 * Retention: 90 days
 */

import { cacheService } from './cache.service.js';

const RETENTION_MS = 90 * 24 * 60 * 60 * 1000; // 90 days

class TimeseriesService {
  /**
   * Record a metric value at the current timestamp.
   */
  async record(metric, value) {
    const key = `ts:${metric}`;
    const timestamp = Date.now();
    const entry = JSON.stringify({ v: value, t: timestamp });

    try {
      const client = cacheService.getClient?.();
      if (client && typeof client.zadd === 'function') {
        // Use Redis sorted set with timestamp as score
        await client.zadd(key, timestamp, entry);
        // Trim old entries beyond retention
        const cutoff = timestamp - RETENTION_MS;
        await client.zremrangebyscore(key, 0, cutoff);
      } else {
        // Fallback to in-memory cache
        const existing = await cacheService.get(key) || [];
        existing.push({ v: value, t: timestamp });
        // Keep last 8640 entries (~90 days at 15min intervals)
        const trimmed = existing.slice(-8640);
        await cacheService.set(key, trimmed, RETENTION_MS / 1000);
      }
    } catch (err) {
      console.error(`[Timeseries] Record error for ${metric}:`, err.message);
    }
  }

  /**
   * Get historical data for a metric within a time range.
   * @param {string} metric - Metric name
   * @param {string} range - Time range: '7d', '30d', '90d'
   * @returns {Array<{value: number, timestamp: number}>}
   */
  async getHistory(metric, range = '30d') {
    const key = `ts:${metric}`;
    const now = Date.now();
    const rangeMs = {
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000,
    }[range] || 30 * 24 * 60 * 60 * 1000;

    const since = now - rangeMs;

    try {
      const client = cacheService.getClient?.();
      if (client && typeof client.zrangebyscore === 'function') {
        const entries = await client.zrangebyscore(key, since, now);
        return entries.map(e => {
          const parsed = JSON.parse(e);
          return { value: parsed.v, timestamp: parsed.t };
        });
      } else {
        const entries = await cacheService.get(key) || [];
        return entries
          .filter(e => e.t >= since)
          .map(e => ({ value: e.v, timestamp: e.t }));
      }
    } catch (err) {
      console.error(`[Timeseries] Read error for ${metric}:`, err.message);
      return [];
    }
  }

  /**
   * Record snapshots from multiple services at once.
   * Called periodically from the background refresh cycle.
   */
  async snapshot(data) {
    const promises = [];

    if (data.tensionIndex != null) {
      promises.push(this.record('tension-index', data.tensionIndex));
    }

    if (data.activeConflictCount != null) {
      promises.push(this.record('active-conflicts', data.activeConflictCount));
    }

    if (data.disasterCount != null) {
      promises.push(this.record('disaster-count', data.disasterCount));
    }

    if (data.cyberThreats != null) {
      promises.push(this.record('cyber-threats', data.cyberThreats));
    }

    if (data.conflictIntensities) {
      for (const [id, intensity] of Object.entries(data.conflictIntensities)) {
        promises.push(this.record(`conflict:${id}`, intensity));
      }
    }

    await Promise.allSettled(promises);
  }
}

export const timeseriesService = new TimeseriesService();
export default timeseriesService;
