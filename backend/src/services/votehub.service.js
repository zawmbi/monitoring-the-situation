/**
 * VoteHub Polling API Service
 * Fetches generic ballot polls and approval ratings from VoteHub.
 * Free, no auth required, CC BY 4.0 license.
 * API docs: https://votehub.com/polls/api/
 */

import { cacheService } from './cache.service.js';

const VOTEHUB_BASE = 'https://votehub.com/polls/api';
const CACHE_PREFIX = 'votehub:';
const CACHE_TTL = 1800; // 30 minutes
const FETCH_TIMEOUT = 10000;

class VoteHubService {
  constructor() {
    this._mem = {};
    this._memTime = {};
  }

  async _fetch(endpoint, params = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    const url = new URL(`${VOTEHUB_BASE}${endpoint}`);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

    try {
      const resp = await fetch(url.toString(), {
        headers: { Accept: 'application/json', 'User-Agent': 'MonitoringTheSituation/1.0' },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!resp.ok) throw new Error(`VoteHub ${resp.status}`);
      return await resp.json();
    } catch (err) {
      clearTimeout(timeout);
      throw err;
    }
  }

  _avg(polls) {
    if (!polls || polls.length === 0) return null;
    const totals = {};
    const counts = {};
    for (const p of polls) {
      for (const a of (p.answers || [])) {
        if (!totals[a.choice]) { totals[a.choice] = 0; counts[a.choice] = 0; }
        totals[a.choice] += a.pct;
        counts[a.choice]++;
      }
    }
    const result = {};
    for (const [k, v] of Object.entries(totals)) {
      result[k] = Math.round((v / counts[k]) * 10) / 10;
    }
    return result;
  }

  _normPolls(rawData) {
    const polls = Array.isArray(rawData) ? rawData : (rawData?.polls || rawData?.results || []);
    return polls
      .filter(p => p.answers && p.answers.length > 0)
      .sort((a, b) => new Date(b.end_date || b.created_at || 0) - new Date(a.end_date || a.created_at || 0));
  }

  /**
   * Fetch 2026 generic ballot polls (D vs R).
   */
  async getGenericBallot() {
    const key = `${CACHE_PREFIX}generic-ballot`;
    const cached = await cacheService.get(key);
    if (cached) return cached;
    if (this._mem.gb && (Date.now() - (this._memTime.gb || 0)) < 1800000) return this._mem.gb;

    try {
      const raw = await this._fetch('/polls', { subject: '2026', poll_type: 'generic-ballot' });
      const sorted = this._normPolls(raw);

      const result = {
        polls: sorted.slice(0, 15).map(p => ({
          pollster: p.pollster || 'Unknown',
          date: p.end_date || p.created_at || '',
          sampleSize: p.sample_size || null,
          population: p.population || '',
          answers: (p.answers || []).map(a => ({ choice: a.choice, pct: a.pct })),
        })),
        average: this._avg(sorted.slice(0, 5)),
        fetchedAt: new Date().toISOString(),
      };

      await cacheService.set(key, result, CACHE_TTL);
      this._mem.gb = result;
      this._memTime.gb = Date.now();
      return result;
    } catch (err) {
      console.warn('[VoteHub] Generic ballot fetch failed:', err.message);
      if (this._mem.gb) return this._mem.gb;
      return { polls: [], average: null, fetchedAt: new Date().toISOString() };
    }
  }

  /**
   * Fetch presidential approval ratings.
   */
  async getApproval() {
    const key = `${CACHE_PREFIX}approval`;
    const cached = await cacheService.get(key);
    if (cached) return cached;
    if (this._mem.ap && (Date.now() - (this._memTime.ap || 0)) < 1800000) return this._mem.ap;

    try {
      const raw = await this._fetch('/polls', { subject: 'donald-trump', poll_type: 'approval' });
      const sorted = this._normPolls(raw);

      const result = {
        polls: sorted.slice(0, 10).map(p => ({
          pollster: p.pollster || 'Unknown',
          date: p.end_date || p.created_at || '',
          answers: (p.answers || []).map(a => ({ choice: a.choice, pct: a.pct })),
        })),
        average: this._avg(sorted.slice(0, 5)),
        fetchedAt: new Date().toISOString(),
      };

      await cacheService.set(key, result, CACHE_TTL);
      this._mem.ap = result;
      this._memTime.ap = Date.now();
      return result;
    } catch (err) {
      console.warn('[VoteHub] Approval fetch failed:', err.message);
      if (this._mem.ap) return this._mem.ap;
      return { polls: [], average: null, fetchedAt: new Date().toISOString() };
    }
  }
}

export const voteHubService = new VoteHubService();
export default voteHubService;
