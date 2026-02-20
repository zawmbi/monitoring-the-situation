/**
 * Polling Aggregator Service
 *
 * Merges polls from multiple free sources into a single per-race polling signal.
 * Deduplicates identical polls that appear in multiple aggregators.
 * Weights by recency and sample size.
 *
 * Sources:
 *   1. FiveThirtyEight CSVs (CC BY 4.0)  — individual polls with methodology
 *   2. Wikipedia senate polls             — parsed from wikitables
 *   3. VoteHub                            — generic ballot + approval
 *
 * Output per race:
 *   { dProb, margin, pollCount, sources[], avgSampleSize }
 */

import { cacheService } from './cache.service.js';
import { fiveThirtyEightService } from './fiveThirtyEight.service.js';
import { wikipediaPollsService } from './wikipedia-polls.service.js';
import { voteHubService } from './votehub.service.js';

const CACHE_KEY = 'polling-agg:v1';
const CACHE_TTL = 1800; // 30 min

/**
 * Normalize pollster name for deduplication.
 * "Emerson College" and "Emerson" and "Emerson College Polling" → "emerson college"
 */
function normPollster(name) {
  return (name || '')
    .toLowerCase()
    .replace(/\s+(polling|research|group|associates|inc\.?|llc|strategies)\s*/gi, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Create a dedup key for a poll to avoid double-counting.
 * Same pollster + same end date + same state = same poll.
 */
function dedupKey(poll) {
  const pollster = normPollster(poll.pollster);
  const date = (poll.endDate || poll.date || '').slice(0, 10); // YYYY-MM-DD
  const state = (poll.state || '').toLowerCase();
  return `${pollster}|${date}|${state}`;
}

/**
 * Convert a set of deduplicated polls into a D−R margin and implied probability.
 * Uses recency + sample-size weighting.
 */
function computeWeightedAverage(polls) {
  if (polls.length === 0) return null;

  let totalWeight = 0;
  let weightedMargin = 0;
  let totalSample = 0;
  let sampleCount = 0;
  const sourcesUsed = new Set();

  for (let i = 0; i < polls.length; i++) {
    const poll = polls[i];
    const candidates = poll.candidates || [];

    let dPct = null;
    let rPct = null;
    for (const c of candidates) {
      const p = (c.party || '').toUpperCase();
      if ((p === 'D' || p === 'DEM') && c.pct != null) dPct = c.pct;
      if ((p === 'R' || p === 'REP') && c.pct != null) rPct = c.pct;
    }

    if (dPct == null || rPct == null) continue;

    // Recency weight: exponential decay. Most recent = 1.0, 30 days ago = 0.5
    let recencyWeight = 1.0;
    if (poll.endDate || poll.date) {
      const pollDate = new Date(poll.endDate || poll.date);
      const daysSince = Math.max(0, (Date.now() - pollDate.getTime()) / (1000 * 60 * 60 * 24));
      recencyWeight = Math.exp(-0.023 * daysSince); // Half-life ≈ 30 days
    }

    // Sample size weight: sqrt(n) / sqrt(1000). 1000-sample poll = 1.0.
    const n = poll.sampleSize || 600; // Assume 600 if not reported
    const sampleWeight = Math.sqrt(n) / Math.sqrt(1000);

    const weight = recencyWeight * sampleWeight;
    const margin = dPct - rPct;

    weightedMargin += margin * weight;
    totalWeight += weight;

    if (poll.sampleSize) {
      totalSample += poll.sampleSize;
      sampleCount++;
    }

    if (poll.source) sourcesUsed.add(poll.source);
  }

  if (totalWeight === 0) return null;

  const avgMargin = weightedMargin / totalWeight;

  // Logistic conversion: margin → D-win probability
  // k = 0.30 calibrated so ±3 margin ≈ 0.70 probability
  const k = 0.30;
  const dProb = 1 / (1 + Math.exp(-k * avgMargin));

  return {
    dProb,
    margin: Math.round(avgMargin * 10) / 10,
    pollCount: polls.length,
    sources: Array.from(sourcesUsed),
    avgSampleSize: sampleCount > 0 ? Math.round(totalSample / sampleCount) : null,
  };
}

class PollingAggregatorService {
  constructor() {
    this._memCache = null;
    this._memCacheTime = 0;
  }

  /**
   * Aggregate all polls for all races from all sources.
   * Returns { byState: { 'Georgia:senate': {...}, ... }, generic: {...} }
   */
  async aggregateAll(senateRaceTypes) {
    const cached = await cacheService.get(CACHE_KEY);
    if (cached) return cached;

    if (this._memCache && (Date.now() - this._memCacheTime) < 30 * 60 * 1000) {
      return this._memCache;
    }

    console.log('[PollingAgg] Aggregating polls from all sources...');
    const startTime = Date.now();

    // ── Fetch from all sources in parallel ──────────────────────────────

    const [
      fteSenatePollsResult,
      fteGovPollsResult,
      fteGenericResult,
      wikiResult,
      vhGenericResult,
    ] = await Promise.allSettled([
      fiveThirtyEightService.getSenatePolls(),
      fiveThirtyEightService.getGovernorPolls(),
      fiveThirtyEightService.getGenericBallotPolls(),
      senateRaceTypes ? wikipediaPollsService.fetchAllSenatePolls(senateRaceTypes) : Promise.resolve({}),
      voteHubService.getGenericBallot(),
    ]);

    const fteSenate = fteSenatePollsResult.status === 'fulfilled' ? fteSenatePollsResult.value : {};
    const fteGov = fteGovPollsResult.status === 'fulfilled' ? fteGovPollsResult.value : {};
    const fteGeneric = fteGenericResult.status === 'fulfilled' ? fteGenericResult.value : {};
    const wikiPolls = wikiResult.status === 'fulfilled' ? wikiResult.value : {};
    const vhGeneric = vhGenericResult.status === 'fulfilled' ? vhGenericResult.value : { polls: [], average: null };

    // ── Merge and deduplicate per race ──────────────────────────────────

    const byRace = {};
    const sourceStats = { fivethirtyeight: 0, wikipedia: 0, votehub: 0 };

    // Helper: add polls for a state+raceType key
    function addPolls(stateKey, polls) {
      if (!byRace[stateKey]) byRace[stateKey] = {};
      for (const poll of polls) {
        const dk = dedupKey(poll);
        // Keep the one with more metadata
        if (!byRace[stateKey][dk] || (poll.sampleSize && !byRace[stateKey][dk].sampleSize)) {
          byRace[stateKey][dk] = poll;
        }
      }
    }

    // 1. FiveThirtyEight Senate polls
    for (const [state, polls] of Object.entries(fteSenate)) {
      const normalized = polls.map(p => ({
        pollster: p.pollster,
        date: p.endDate || p.startDate,
        endDate: p.endDate,
        sampleSize: p.sampleSize,
        state,
        candidates: p.candidates,
        source: 'fivethirtyeight',
      }));
      addPolls(`${state}:senate`, normalized);
      sourceStats.fivethirtyeight += normalized.length;
    }

    // 2. FiveThirtyEight Governor polls
    for (const [state, polls] of Object.entries(fteGov)) {
      const normalized = polls.map(p => ({
        pollster: p.pollster,
        date: p.endDate || p.startDate,
        endDate: p.endDate,
        sampleSize: p.sampleSize,
        state,
        candidates: p.candidates,
        source: 'fivethirtyeight',
      }));
      addPolls(`${state}:governor`, normalized);
      sourceStats.fivethirtyeight += normalized.length;
    }

    // 3. Wikipedia Senate polls
    for (const [state, data] of Object.entries(wikiPolls)) {
      const generals = (data.generalPolls || []).map(p => ({
        pollster: p.pollster,
        date: p.date,
        endDate: p.date,
        sampleSize: p.sampleSize ? parseInt(String(p.sampleSize).replace(/[^0-9]/g, ''), 10) || null : null,
        state,
        candidates: (p.candidates || []).map(c => ({
          name: c.name,
          party: c.party,
          pct: c.pct,
        })),
        source: 'wikipedia',
      }));
      addPolls(`${state}:senate`, generals);
      sourceStats.wikipedia += generals.length;
    }

    // 4. VoteHub generic ballot → special key
    if (vhGeneric.polls && vhGeneric.polls.length > 0) {
      const vhPolls = vhGeneric.polls.map(p => ({
        pollster: p.pollster,
        date: p.date,
        endDate: p.date,
        sampleSize: parseInt(String(p.sampleSize || '').replace(/[^0-9]/g, ''), 10) || null,
        state: 'National',
        candidates: (p.answers || []).map(a => ({
          name: a.choice,
          party: /democrat/i.test(a.choice) ? 'D' : /republican/i.test(a.choice) ? 'R' : '?',
          pct: a.pct,
        })),
        source: 'votehub',
      }));
      addPolls('_generic', vhPolls);
      sourceStats.votehub += vhPolls.length;
    }

    // 5. FiveThirtyEight generic ballot
    const fteGenericPolls = fteGeneric['_national'] || [];
    if (fteGenericPolls.length > 0) {
      const normalized = fteGenericPolls.map(p => ({
        pollster: p.pollster,
        date: p.endDate || p.startDate,
        endDate: p.endDate,
        sampleSize: p.sampleSize,
        state: 'National',
        candidates: p.candidates,
        source: 'fivethirtyeight',
      }));
      addPolls('_generic', normalized);
      sourceStats.fivethirtyeight += normalized.length;
    }

    // ── Compute weighted averages per race ───────────────────────────────

    const results = {};
    for (const [raceKey, pollMap] of Object.entries(byRace)) {
      const polls = Object.values(pollMap);
      if (polls.length === 0) continue;

      const avg = computeWeightedAverage(polls);
      if (avg) {
        results[raceKey] = avg;
      }
    }

    const elapsedMs = Date.now() - startTime;
    const totalPolls = Object.values(byRace).reduce((s, m) => s + Object.keys(m).length, 0);
    const raceCount = Object.keys(results).length;

    console.log(`[PollingAgg] Done in ${elapsedMs}ms: ${totalPolls} unique polls across ${raceCount} races (538: ${sourceStats.fivethirtyeight}, Wiki: ${sourceStats.wikipedia}, VH: ${sourceStats.votehub})`);

    const output = {
      byRace: results,
      sourceStats,
      totalPolls,
      raceCount,
      timestamp: new Date().toISOString(),
    };

    await cacheService.set(CACHE_KEY, output, CACHE_TTL);
    this._memCache = output;
    this._memCacheTime = Date.now();

    return output;
  }

  /**
   * Get aggregated polling for a specific race.
   * @param {string} state - State name (e.g., 'Georgia')
   * @param {string} raceType - 'senate' | 'governor' | 'house'
   * @returns {{ dProb, margin, pollCount, sources[], avgSampleSize } | null}
   */
  async getRacePolling(state, raceType) {
    const data = await this.aggregateAll();
    return data?.byRace?.[`${state}:${raceType}`] || null;
  }

  /**
   * Get aggregated generic ballot.
   */
  async getGenericBallot() {
    const data = await this.aggregateAll();
    return data?.byRace?.['_generic'] || null;
  }
}

export const pollingAggregatorService = new PollingAggregatorService();
export default pollingAggregatorService;
