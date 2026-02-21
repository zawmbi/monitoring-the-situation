/**
 * Polling Aggregator Service
 *
 * Passes through raw poll data from FiveThirtyEight. No recency weighting,
 * no sample-size weighting, no logistic margin-to-probability conversion.
 * Returns raw polls with their upstream margins as-is.
 *
 * Data source: FiveThirtyEight CSV polling data (CC BY 4.0)
 *   Senate:  https://projects.fivethirtyeight.com/polls-page/data/senate_polls.csv
 *   Governor: https://projects.fivethirtyeight.com/polls-page/data/governor_polls.csv
 *   House:   https://projects.fivethirtyeight.com/polls-page/data/house_polls.csv
 *   Generic: https://projects.fivethirtyeight.com/polls-page/data/generic_ballot_polls.csv
 *
 * Attribution: FiveThirtyEight / ABC News (CC BY 4.0)
 */

import { cacheService } from './cache.service.js';
import { fiveThirtyEightService } from './fiveThirtyEight.service.js';

const CACHE_KEY = 'polling-agg:v4';
const CACHE_TTL = 1800; // 30 min

/**
 * Compute a simple unweighted D-R margin from a poll's candidates.
 * Returns null if both D and R percentages are not present.
 */
function computeRawMargin(candidates) {
  let dPct = null;
  let rPct = null;
  for (const c of candidates || []) {
    const p = (c.party || '').toUpperCase();
    if ((p === 'D' || p === 'DEM') && c.pct != null) dPct = c.pct;
    if ((p === 'R' || p === 'REP') && c.pct != null) rPct = c.pct;
  }
  if (dPct == null || rPct == null) return null;
  return Math.round((dPct - rPct) * 10) / 10;
}

/**
 * Compute a simple arithmetic average margin from an array of polls.
 * No weighting of any kind is applied.
 */
function computeSimpleAverage(polls) {
  const margins = [];
  let totalSample = 0;
  let sampleCount = 0;

  for (const poll of polls) {
    const margin = computeRawMargin(poll.candidates);
    if (margin != null) margins.push(margin);
    if (poll.sampleSize) {
      totalSample += poll.sampleSize;
      sampleCount++;
    }
  }

  if (margins.length === 0) return null;

  const avgMargin = margins.reduce((s, m) => s + m, 0) / margins.length;

  return {
    margin: Math.round(avgMargin * 10) / 10,
    pollCount: polls.length,
    sources: ['fivethirtyeight'],
    avgSampleSize: sampleCount > 0 ? Math.round(totalSample / sampleCount) : null,
    dataSource: 'FiveThirtyEight (CC BY 4.0)',
  };
}

/**
 * Compute a simple average for primary polls.
 * Returns per-candidate average percentages with no weighting.
 */
function computeSimplePrimaryAverage(polls) {
  if (polls.length === 0) return null;

  const candidateTotals = {}; // name -> { totalPct, count, party }

  for (const poll of polls) {
    for (const c of poll.candidates || []) {
      if (c.pct == null || c.pct <= 0) continue;
      const name = c.name || 'Unknown';
      if (!candidateTotals[name]) candidateTotals[name] = { totalPct: 0, count: 0, party: c.party };
      candidateTotals[name].totalPct += c.pct;
      candidateTotals[name].count++;
    }
  }

  if (Object.keys(candidateTotals).length === 0) return null;

  const candidates = Object.entries(candidateTotals).map(([name, data]) => ({
    name,
    party: data.party,
    avgPct: Math.round((data.totalPct / data.count) * 10) / 10,
  }));

  candidates.sort((a, b) => b.avgPct - a.avgPct);

  return {
    candidates,
    pollCount: polls.length,
    sources: ['fivethirtyeight'],
    avgSampleSize: null,
    dataSource: 'FiveThirtyEight (CC BY 4.0)',
  };
}

class PollingAggregatorService {
  constructor() {
    this._memCache = null;
    this._memCacheTime = 0;
  }

  /**
   * Aggregate all polls for all races from FiveThirtyEight.
   * Returns { byRace: { 'Georgia:senate': {...}, ... }, generic: {...} }
   */
  async aggregateAll(senateRaceTypes) {
    const cached = await cacheService.get(CACHE_KEY);
    if (cached) return cached;

    if (this._memCache && (Date.now() - this._memCacheTime) < 30 * 60 * 1000) {
      return this._memCache;
    }

    console.log('[PollingAgg] Aggregating polls from FiveThirtyEight...');
    const startTime = Date.now();

    // Fetch from FiveThirtyEight only
    const [
      senateResult,
      govResult,
      genericResult,
    ] = await Promise.allSettled([
      fiveThirtyEightService.getSenatePolls(),
      fiveThirtyEightService.getGovernorPolls(),
      fiveThirtyEightService.getGenericBallotPolls(),
    ]);

    const senatePollsByState = senateResult.status === 'fulfilled' ? senateResult.value : {};
    const govPollsByState = govResult.status === 'fulfilled' ? govResult.value : {};
    const genericPolls = genericResult.status === 'fulfilled' ? genericResult.value : {};

    // Collect all polls per race key (general elections)
    const byRacePolls = {};
    // Collect primary polls per race+party key
    const byPrimaryPolls = {};

    let totalFiveThirtyEight = 0;

    // Senate polls
    for (const [state, polls] of Object.entries(senatePollsByState)) {
      for (const p of polls) {
        totalFiveThirtyEight++;
        if (p.stage === 'primary' && p.primaryParty) {
          const key = `${state}:senate:${p.primaryParty}`;
          if (!byPrimaryPolls[key]) byPrimaryPolls[key] = [];
          byPrimaryPolls[key].push(p);
        } else {
          const key = `${state}:senate`;
          if (!byRacePolls[key]) byRacePolls[key] = [];
          byRacePolls[key].push(p);
        }
      }
    }

    // Governor polls
    for (const [state, polls] of Object.entries(govPollsByState)) {
      for (const p of polls) {
        totalFiveThirtyEight++;
        if (p.stage === 'primary' && p.primaryParty) {
          const key = `${state}:governor:${p.primaryParty}`;
          if (!byPrimaryPolls[key]) byPrimaryPolls[key] = [];
          byPrimaryPolls[key].push(p);
        } else {
          const key = `${state}:governor`;
          if (!byRacePolls[key]) byRacePolls[key] = [];
          byRacePolls[key].push(p);
        }
      }
    }

    // Generic ballot
    const genericPollList = genericPolls['_national'] || [];
    if (genericPollList.length > 0) {
      byRacePolls['_generic'] = genericPollList;
      totalFiveThirtyEight += genericPollList.length;
    }

    // Compute simple averages per race (no weighting)
    const results = {};
    for (const [raceKey, polls] of Object.entries(byRacePolls)) {
      const avg = computeSimpleAverage(polls);
      if (avg) results[raceKey] = avg;
    }

    // Compute simple primary averages
    const primaryResults = {};
    for (const [primaryKey, polls] of Object.entries(byPrimaryPolls)) {
      const avg = computeSimplePrimaryAverage(polls);
      if (avg) primaryResults[primaryKey] = avg;
    }

    const elapsedMs = Date.now() - startTime;
    const totalPolls = Object.values(byRacePolls).reduce((s, arr) => s + arr.length, 0);
    const totalPrimaryPolls = Object.values(byPrimaryPolls).reduce((s, arr) => s + arr.length, 0);
    const raceCount = Object.keys(results).length;

    console.log(`[PollingAgg] Done in ${elapsedMs}ms: ${totalPolls} general + ${totalPrimaryPolls} primary polls across ${raceCount} races (source: FiveThirtyEight: ${totalFiveThirtyEight})`);

    const output = {
      byRace: results,
      byPrimary: primaryResults,
      sourceStats: { fivethirtyeight: totalFiveThirtyEight },
      totalPolls,
      totalPrimaryPolls,
      raceCount,
      timestamp: new Date().toISOString(),
      dataSource: 'FiveThirtyEight (CC BY 4.0)',
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
   * @returns {{ margin, pollCount, sources[], avgSampleSize } | null}
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
