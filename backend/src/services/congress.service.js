/**
 * Congress.gov API Service
 * Free government API — 5,000 requests/hour (very generous)
 * Provides: bills, votes, members, committee actions
 * Docs: https://api.congress.gov/
 *
 * Used to track incumbent voting records, recent bills, and legislative activity
 * relevant to competitive 2026 races.
 */

import { cacheService } from './cache.service.js';

const CONGRESS_API_BASE = 'https://api.congress.gov/v3';
const CACHE_KEY_PREFIX = 'congress';
const CACHE_TTL = 3600; // 1 hour — legislation doesn't change that fast

// Current Congress number (2025-2027)
const CURRENT_CONGRESS = 119;

class CongressService {
  constructor() {
    this._memCache = {};
    this._memCacheTime = {};
  }

  get apiKey() {
    return process.env.CONGRESS_API_KEY || '';
  }

  get isConfigured() {
    return !!process.env.CONGRESS_API_KEY;
  }

  async _fetch(endpoint, params = {}) {
    if (!this.isConfigured) return null;

    params.api_key = this.apiKey;
    params.format = 'json';
    const qs = new URLSearchParams(params).toString();
    const url = `${CONGRESS_API_BASE}${endpoint}?${qs}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (response.status === 429) {
        console.warn('[Congress] Rate limited');
        return null;
      }
      if (!response.ok) {
        console.warn(`[Congress] API error ${response.status}`);
        return null;
      }
      return await response.json();
    } catch (error) {
      clearTimeout(timeout);
      if (error.name === 'AbortError') {
        console.warn('[Congress] Request timed out');
      } else {
        console.error('[Congress] Fetch failed:', error.message);
      }
      return null;
    }
  }

  /**
   * Get current Senate members for a state.
   * Returns voting history, committee assignments, party, etc.
   */
  async getStateSenators(stateCode) {
    if (!stateCode) return [];

    const cacheKey = `${CACHE_KEY_PREFIX}:senators:${stateCode}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    if (this._memCache[cacheKey] && (Date.now() - (this._memCacheTime[cacheKey] || 0)) < 60 * 60 * 1000) {
      return this._memCache[cacheKey];
    }

    const data = await this._fetch(`/member`, {
      currentMember: 'true',
      limit: 10,
    });

    if (!data || !data.members) return [];

    // Filter to state's senators
    const senators = data.members
      .filter(m =>
        m.state === stateCode &&
        m.terms?.item?.some(t => t.chamber === 'Senate')
      )
      .map(m => ({
        name: m.name || `${m.firstName} ${m.lastName}`,
        bioguideId: m.bioguideId,
        party: m.partyName || null,
        state: m.state,
        url: m.url || null,
        depiction: m.depiction?.imageUrl || null,
      }));

    if (senators.length > 0) {
      await cacheService.set(cacheKey, senators, CACHE_TTL);
      this._memCache[cacheKey] = senators;
      this._memCacheTime[cacheKey] = Date.now();
    }

    return senators;
  }

  /**
   * Get recent bills from the current Congress.
   * Filterable by subject for election-relevant topics.
   */
  async getRecentBills(subject = null, limit = 20) {
    const cacheKey = `${CACHE_KEY_PREFIX}:bills:${subject || 'all'}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    if (this._memCache[cacheKey] && (Date.now() - (this._memCacheTime[cacheKey] || 0)) < 60 * 60 * 1000) {
      return this._memCache[cacheKey];
    }

    const params = {
      limit: String(limit),
      sort: 'updateDate+desc',
    };

    const data = await this._fetch(`/bill/${CURRENT_CONGRESS}`, params);

    if (!data || !data.bills) return [];

    const bills = data.bills.map(b => ({
      number: b.number,
      type: b.type,
      title: b.title,
      latestAction: b.latestAction ? {
        date: b.latestAction.actionDate,
        text: b.latestAction.text,
      } : null,
      originChamber: b.originChamber || null,
      updateDate: b.updateDate || null,
      url: b.url || null,
      congress: b.congress,
    }));

    await cacheService.set(cacheKey, bills, CACHE_TTL);
    this._memCache[cacheKey] = bills;
    this._memCacheTime[cacheKey] = Date.now();

    return bills;
  }

  /**
   * Get recent Senate roll-call votes.
   * These are key for tracking incumbent voting records.
   */
  async getRecentVotes(chamber = 'senate', limit = 20) {
    const cacheKey = `${CACHE_KEY_PREFIX}:votes:${chamber}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    if (this._memCache[cacheKey] && (Date.now() - (this._memCacheTime[cacheKey] || 0)) < 60 * 60 * 1000) {
      return this._memCache[cacheKey];
    }

    const chamberCode = chamber === 'senate' ? 'senate' : 'house';
    const data = await this._fetch(`/vote/${CURRENT_CONGRESS}/${chamberCode}`, {
      limit: String(limit),
      sort: 'date+desc',
    });

    if (!data || !data.votes) return [];

    const votes = data.votes.map(v => ({
      rollNumber: v.rollNumber,
      date: v.date,
      question: v.question || null,
      result: v.result || null,
      description: v.description || null,
      url: v.url || null,
      yeas: v.yeas || null,
      nays: v.nays || null,
      congress: v.congress,
      session: v.session,
    }));

    await cacheService.set(cacheKey, votes, CACHE_TTL);
    this._memCache[cacheKey] = votes;
    this._memCacheTime[cacheKey] = Date.now();

    return votes;
  }

  /**
   * Get aggregated legislative overview for election context.
   * Combines recent bills + votes into a summary.
   */
  async getLegislativeOverview() {
    const cacheKey = `${CACHE_KEY_PREFIX}:overview`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    if (this._memCache[cacheKey] && (Date.now() - (this._memCacheTime[cacheKey] || 0)) < 60 * 60 * 1000) {
      return this._memCache[cacheKey];
    }

    const [billsResult, votesResult] = await Promise.allSettled([
      this.getRecentBills(null, 10),
      this.getRecentVotes('senate', 10),
    ]);

    const bills = billsResult.status === 'fulfilled' ? billsResult.value : [];
    const votes = votesResult.status === 'fulfilled' ? votesResult.value : [];

    const result = {
      recentBills: bills,
      recentVotes: votes,
      billCount: bills.length,
      voteCount: votes.length,
      congress: CURRENT_CONGRESS,
      configured: this.isConfigured,
      fetchedAt: new Date().toISOString(),
    };

    await cacheService.set(cacheKey, result, CACHE_TTL);
    this._memCache[cacheKey] = result;
    this._memCacheTime[cacheKey] = Date.now();

    return result;
  }
}

export const congressService = new CongressService();
export default congressService;
