/**
 * UCDP (Uppsala Conflict Data Program) Service
 * Fetches conflict event data from the UCDP GED API.
 *
 * API: https://ucdp.uu.se/apidocs/
 * License: Free for all users (no commercial restrictions documented).
 * Rate limits: 5,000 requests/day, max 1,000 events per page.
 *
 * Data: Georeferenced Event Dataset (GED) — battles, violence against civilians,
 *       one-sided violence, etc. Global coverage 1989–present.
 *
 * Cache: 24 hours (UCDP data updates periodically, not real-time).
 */

import { cacheService } from './cache.service.js';

const UCDP_BASE = 'https://ucdpapi.pcr.uu.se/api';
const CACHE_PREFIX = 'ucdp';
const CACHE_TTL = 86400; // 24 hours

class UCDPService {
  /**
   * Fetch recent conflict events from the GED (Georeferenced Event Dataset).
   * Returns the most recent events globally or for a specific country.
   *
   * @param {Object} opts
   * @param {string} [opts.country] - Country name to filter by
   * @param {number} [opts.year] - Year to filter (default: current and previous year)
   * @param {number} [opts.limit] - Max events to return (default 100)
   */
  async getRecentEvents({ country, year, limit = 100 } = {}) {
    const currentYear = new Date().getFullYear();
    const targetYear = year || currentYear;
    const cacheKey = `${CACHE_PREFIX}:events:${country || 'global'}:${targetYear}`;

    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    console.log(`[UCDP] Fetching conflict events (year=${targetYear}, country=${country || 'all'})...`);

    try {
      // GED API endpoint
      let url = `${UCDP_BASE}/gedevents/24.1?pagesize=${Math.min(limit, 1000)}`;

      if (country) {
        url += `&Country=${encodeURIComponent(country)}`;
      }

      // Try current year first, fall back to previous year if no data
      let events = await this.fetchEvents(url + `&StartDate=${targetYear}-01-01&EndDate=${targetYear}-12-31`);

      if ((!events || events.length === 0) && targetYear === currentYear) {
        // Current year may not have data yet, try previous year
        const prevYear = currentYear - 1;
        events = await this.fetchEvents(url + `&StartDate=${prevYear}-01-01&EndDate=${prevYear}-12-31`);
      }

      if (!events) events = [];

      const result = {
        events: events.slice(0, limit).map(e => this.normalizeEvent(e)),
        total: events.length,
        year: targetYear,
        country: country || null,
        source: 'UCDP Georeferenced Event Dataset',
        sourceUrl: 'https://ucdp.uu.se/',
        fetchedAt: new Date().toISOString(),
      };

      await cacheService.set(cacheKey, result, CACHE_TTL);
      console.log(`[UCDP] Cached ${result.events.length} events`);
      return result;
    } catch (error) {
      console.error('[UCDP] Failed to fetch events:', error.message);
      return null;
    }
  }

  /**
   * Fetch active conflicts summary (dyads and their casualties).
   */
  async getActiveConflicts() {
    const cacheKey = `${CACHE_PREFIX}:active`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    console.log('[UCDP] Fetching active conflicts...');

    try {
      const currentYear = new Date().getFullYear();
      // Try to get conflicts from current year, fall back to previous
      let conflicts = await this.fetchConflicts(currentYear);
      if (!conflicts || conflicts.length === 0) {
        conflicts = await this.fetchConflicts(currentYear - 1);
      }

      const result = {
        conflicts: (conflicts || []).map(c => ({
          id: c.conflict_id,
          name: c.conflict_name || 'Unknown',
          location: c.location || '',
          region: c.region || '',
          type: this.conflictTypeName(c.type_of_conflict),
          startDate: c.start_date || c.start_date2 || null,
          sideA: c.side_a || '',
          sideB: c.side_b || '',
          territory: c.territory_name || '',
          intensity: c.intensity_level === 2 ? 'War' : 'Minor',
        })),
        total: (conflicts || []).length,
        source: 'UCDP/PRIO Armed Conflict Dataset',
        fetchedAt: new Date().toISOString(),
      };

      await cacheService.set(cacheKey, result, CACHE_TTL);
      console.log(`[UCDP] Cached ${result.total} active conflicts`);
      return result;
    } catch (error) {
      console.error('[UCDP] Failed to fetch active conflicts:', error.message);
      return null;
    }
  }

  /**
   * Fetch events from the GED API.
   */
  async fetchEvents(url) {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(20000),
    });

    if (!res.ok) throw new Error(`UCDP API responded ${res.status}`);

    const json = await res.json();
    return json.Result || [];
  }

  /**
   * Fetch conflicts from the UCDP API.
   */
  async fetchConflicts(year) {
    const url = `${UCDP_BASE}/ucdpconflict/24.1?pagesize=200&Year=${year}`;

    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(20000),
    });

    if (!res.ok) throw new Error(`UCDP Conflict API responded ${res.status}`);

    const json = await res.json();
    return json.Result || [];
  }

  /**
   * Normalize a GED event into a clean shape.
   */
  normalizeEvent(e) {
    return {
      id: e.id || e.ged_id,
      date: e.date_start || e.date_prec,
      dateEnd: e.date_end || null,
      country: e.country || '',
      region: e.region || '',
      location: e.where_description || e.adm_1 || '',
      lat: e.latitude ? parseFloat(e.latitude) : null,
      lon: e.longitude ? parseFloat(e.longitude) : null,
      type: this.eventTypeName(e.type_of_violence),
      conflictName: e.conflict_name || '',
      sideA: e.side_a || '',
      sideB: e.side_b || '',
      deathsBest: e.best != null ? parseInt(e.best) : null,
      deathsLow: e.low != null ? parseInt(e.low) : null,
      deathsHigh: e.high != null ? parseInt(e.high) : null,
      deathsCivilians: e.deaths_civilians != null ? parseInt(e.deaths_civilians) : null,
      source: e.source_original || '',
    };
  }

  eventTypeName(type) {
    switch (parseInt(type)) {
      case 1: return 'State-based conflict';
      case 2: return 'Non-state conflict';
      case 3: return 'One-sided violence';
      default: return 'Unknown';
    }
  }

  conflictTypeName(type) {
    switch (parseInt(type)) {
      case 1: return 'Extrasystemic';
      case 2: return 'Interstate';
      case 3: return 'Internal';
      case 4: return 'Internationalized internal';
      default: return 'Unknown';
    }
  }
}

export const ucdpService = new UCDPService();
export default ucdpService;
