/**
 * Google Civic Information API Service
 * Free tier: 25,000 queries/day — commercially usable
 * Provides: upcoming elections, voter info (polling places, contests)
 * Docs: https://developers.google.com/civic-information
 *
 * Note: representativeInfoByAddress was removed April 30, 2025.
 * Available endpoints: electionQuery, voterInfoQuery
 */

import { cacheService } from './cache.service.js';

const CIVIC_API_BASE = 'https://www.googleapis.com/civicinfo/v2';
const CACHE_KEY_PREFIX = 'civic';
const CACHE_TTL = 3600; // 1 hour

class GoogleCivicService {
  constructor() {
    this._memCache = {};
    this._memCacheTime = {};
  }

  get apiKey() {
    return process.env.GOOGLE_CIVIC_API_KEY || '';
  }

  get isConfigured() {
    return !!process.env.GOOGLE_CIVIC_API_KEY;
  }

  async _fetch(endpoint, params = {}) {
    if (!this.isConfigured) return null;

    params.key = this.apiKey;
    const qs = new URLSearchParams(params).toString();
    const url = `${CIVIC_API_BASE}${endpoint}?${qs}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    try {
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (response.status === 403 || response.status === 429) {
        console.warn(`[GoogleCivic] Rate limited or forbidden (${response.status})`);
        return null;
      }
      if (!response.ok) {
        console.warn(`[GoogleCivic] API error ${response.status}`);
        return null;
      }
      return await response.json();
    } catch (error) {
      clearTimeout(timeout);
      if (error.name === 'AbortError') {
        console.warn('[GoogleCivic] Request timed out');
      } else {
        console.error('[GoogleCivic] Fetch failed:', error.message);
      }
      return null;
    }
  }

  /**
   * Get list of upcoming elections with IDs and dates
   */
  async getUpcomingElections() {
    const cacheKey = `${CACHE_KEY_PREFIX}:elections`;

    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    if (this._memCache[cacheKey] && (Date.now() - (this._memCacheTime[cacheKey] || 0)) < 30 * 60 * 1000) {
      return this._memCache[cacheKey];
    }

    const data = await this._fetch('/elections');
    if (!data || !Array.isArray(data.elections)) return [];

    const elections = data.elections
      .filter(e => e.id !== '2000') // Filter out the test election
      .map(e => ({
        id: e.id,
        name: e.name,
        electionDay: e.electionDay,
        ocdDivisionId: e.ocdDivisionId || null,
      }));

    if (elections.length > 0) {
      await cacheService.set(cacheKey, elections, CACHE_TTL);
      this._memCache[cacheKey] = elections;
      this._memCacheTime[cacheKey] = Date.now();
    }

    return elections;
  }

  /**
   * Get voter info for a specific address (polling places, contests, etc.)
   * This is the most data-rich endpoint but requires a street address.
   */
  async getVoterInfo(address, electionId = null) {
    if (!address) return null;

    const cacheKey = `${CACHE_KEY_PREFIX}:voter:${address.replace(/\s+/g, '_').slice(0, 60)}`;

    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const params = { address };
    if (electionId) params.electionId = electionId;

    const data = await this._fetch('/voterinfo', params);
    if (!data) return null;

    const result = {
      election: data.election ? {
        name: data.election.name,
        electionDay: data.election.electionDay,
        id: data.election.id,
      } : null,

      // Polling places
      pollingLocations: (data.pollingLocations || []).slice(0, 5).map(loc => ({
        name: loc.address?.locationName || 'Polling Place',
        address: this._formatAddress(loc.address),
        hours: loc.pollingHours || null,
        startDate: loc.startDate || null,
        endDate: loc.endDate || null,
        notes: loc.notes || null,
      })),

      // Early voting sites
      earlyVoteSites: (data.earlyVoteSites || []).slice(0, 5).map(loc => ({
        name: loc.address?.locationName || 'Early Vote Site',
        address: this._formatAddress(loc.address),
        hours: loc.pollingHours || null,
        startDate: loc.startDate || null,
        endDate: loc.endDate || null,
        notes: loc.notes || null,
      })),

      // Drop-off locations
      dropOffLocations: (data.dropOffLocations || []).slice(0, 5).map(loc => ({
        name: loc.address?.locationName || 'Drop-off',
        address: this._formatAddress(loc.address),
        hours: loc.pollingHours || null,
        startDate: loc.startDate || null,
        endDate: loc.endDate || null,
      })),

      // Contests on the ballot
      contests: (data.contests || []).map(c => ({
        type: c.type || 'General',
        office: c.office || null,
        district: c.district ? {
          name: c.district.name,
          scope: c.district.scope,
          id: c.district.id,
        } : null,
        candidates: (c.candidates || []).map(cand => ({
          name: cand.name,
          party: cand.party || null,
          candidateUrl: cand.candidateUrl || null,
        })),
        referendumTitle: c.referendumTitle || null,
        referendumSubtitle: c.referendumSubtitle || null,
        referendumText: c.referendumText ? c.referendumText.slice(0, 300) : null,
        referendumUrl: c.referendumUrl || null,
      })),

      // State/local election administration
      state: (data.state || []).map(s => ({
        name: s.name,
        electionInfoUrl: s.electionAdministrationBody?.electionInfoUrl || null,
        votingLocationFinderUrl: s.electionAdministrationBody?.votingLocationFinderUrl || null,
        ballotInfoUrl: s.electionAdministrationBody?.ballotInfoUrl || null,
        electionRegistrationUrl: s.electionAdministrationBody?.electionRegistrationUrl || null,
        absenteeVotingInfoUrl: s.electionAdministrationBody?.absenteeVotingInfoUrl || null,
      })),

      // Normalized address (what Google matched)
      normalizedAddress: data.normalizedInput ? this._formatAddress(data.normalizedInput) : null,
    };

    await cacheService.set(cacheKey, result, CACHE_TTL);
    return result;
  }

  _formatAddress(addr) {
    if (!addr) return '';
    const parts = [addr.line1, addr.line2, addr.city, addr.state, addr.zip].filter(Boolean);
    return parts.join(', ');
  }
}

export const googleCivicService = new GoogleCivicService();
export default googleCivicService;
