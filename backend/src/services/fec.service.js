/**
 * FEC (Federal Election Commission) Service
 * Fetches candidate lists and fundraising data from OpenFEC API
 * Free API — covers Senate & House races (not governors)
 * Docs: https://api.open.fec.gov/developers/
 */

import { cacheService } from './cache.service.js';

const FEC_API_BASE = 'https://api.open.fec.gov/v1';
const CACHE_KEY_PREFIX = 'fec';
const CACHE_TTL = 21600; // 6 hours — FEC updates nightly

// State name → two-letter code mapping for FEC queries
const STATE_CODES = {
  'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR',
  'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE',
  'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID',
  'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA', 'Kansas': 'KS',
  'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
  'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS',
  'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV',
  'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
  'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK',
  'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
  'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT',
  'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV',
  'Wisconsin': 'WI', 'Wyoming': 'WY',
};

class FECService {
  constructor() {
    this._memCache = {};
    this._memCacheTime = {};
  }

  get apiKey() {
    return process.env.FEC_API_KEY || 'DEMO_KEY';
  }

  get isConfigured() {
    return !!process.env.FEC_API_KEY;
  }

  async _fetch(endpoint, params = {}) {
    params.api_key = this.apiKey;
    const qs = new URLSearchParams(params).toString();
    const url = `${FEC_API_BASE}${endpoint}?${qs}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (response.status === 429) {
        console.warn('[FEC] Rate limited — try setting FEC_API_KEY env');
        return null;
      }
      if (!response.ok) {
        const body = await response.text().catch(() => '');
        throw new Error(`FEC API ${response.status}: ${body.slice(0, 200)}`);
      }
      return await response.json();
    } catch (error) {
      clearTimeout(timeout);
      if (error.name === 'AbortError') {
        console.warn('[FEC] Request timed out');
      } else {
        console.error('[FEC] Fetch failed:', error.message);
      }
      return null;
    }
  }

  /**
   * Get Senate candidates for a state in the 2026 cycle
   */
  async getSenateCandidates(stateName) {
    const stateCode = STATE_CODES[stateName];
    if (!stateCode) return [];

    const cacheKey = `${CACHE_KEY_PREFIX}:senate:${stateCode}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    // Check memory cache (30 min stale)
    if (this._memCache[cacheKey] && (Date.now() - (this._memCacheTime[cacheKey] || 0)) < 30 * 60 * 1000) {
      return this._memCache[cacheKey];
    }

    const data = await this._fetch('/candidates/search/', {
      state: stateCode,
      office: 'S',
      election_year: '2026',
      sort: '-total_receipts',
      per_page: '20',
      is_active_candidate: 'true',
    });

    if (!data || !Array.isArray(data.results)) return [];

    const candidates = data.results.map(c => ({
      name: c.name ? this._formatName(c.name) : 'Unknown',
      party: this._normalizeParty(c.party),
      incumbentChallenge: c.incumbent_challenge || 'unknown',
      totalReceipts: c.total_receipts || 0,
      totalDisbursements: c.total_disbursements || 0,
      cashOnHand: c.cash_on_hand_end_period || 0,
      candidateId: c.candidate_id,
      state: stateCode,
      office: 'senate',
    }));

    if (candidates.length > 0) {
      await cacheService.set(cacheKey, candidates, CACHE_TTL);
      this._memCache[cacheKey] = candidates;
      this._memCacheTime[cacheKey] = Date.now();
    }

    return candidates;
  }

  /**
   * Get all 2026 Senate candidates across all states
   */
  async getAllSenateCandidates() {
    const cacheKey = `${CACHE_KEY_PREFIX}:senate:all`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    if (this._memCache[cacheKey] && (Date.now() - (this._memCacheTime[cacheKey] || 0)) < 30 * 60 * 1000) {
      return this._memCache[cacheKey];
    }

    const allCandidates = {};
    let page = 1;
    let hasMore = true;

    while (hasMore && page <= 5) {
      const data = await this._fetch('/candidates/search/', {
        office: 'S',
        election_year: '2026',
        sort: '-total_receipts',
        per_page: '100',
        page: String(page),
        is_active_candidate: 'true',
      });

      if (!data || !Array.isArray(data.results) || data.results.length === 0) {
        hasMore = false;
        break;
      }

      for (const c of data.results) {
        const stateCode = c.state;
        if (!stateCode) continue;
        if (!allCandidates[stateCode]) allCandidates[stateCode] = [];

        allCandidates[stateCode].push({
          name: c.name ? this._formatName(c.name) : 'Unknown',
          party: this._normalizeParty(c.party),
          incumbentChallenge: c.incumbent_challenge || 'unknown',
          totalReceipts: c.total_receipts || 0,
          totalDisbursements: c.total_disbursements || 0,
          cashOnHand: c.cash_on_hand_end_period || 0,
          candidateId: c.candidate_id,
          state: stateCode,
          office: 'senate',
        });
      }

      hasMore = data.pagination && page < data.pagination.pages;
      page++;
    }

    if (Object.keys(allCandidates).length > 0) {
      await cacheService.set(cacheKey, allCandidates, CACHE_TTL);
      this._memCache[cacheKey] = allCandidates;
      this._memCacheTime[cacheKey] = Date.now();
    }

    return allCandidates;
  }

  /**
   * Get House candidates for a specific district in the 2026 cycle
   */
  async getHouseCandidates(stateCode, district) {
    if (!stateCode || !district) return [];

    const cacheKey = `${CACHE_KEY_PREFIX}:house:${stateCode}:${district}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    if (this._memCache[cacheKey] && (Date.now() - (this._memCacheTime[cacheKey] || 0)) < 30 * 60 * 1000) {
      return this._memCache[cacheKey];
    }

    const data = await this._fetch('/candidates/search/', {
      state: stateCode,
      office: 'H',
      district: String(district).padStart(2, '0'),
      election_year: '2026',
      sort: '-total_receipts',
      per_page: '20',
      is_active_candidate: 'true',
    });

    if (!data || !Array.isArray(data.results)) return [];

    const candidates = data.results.map(c => ({
      name: c.name ? this._formatName(c.name) : 'Unknown',
      party: this._normalizeParty(c.party),
      incumbentChallenge: c.incumbent_challenge || 'unknown',
      totalReceipts: c.total_receipts || 0,
      totalDisbursements: c.total_disbursements || 0,
      cashOnHand: c.cash_on_hand_end_period || 0,
      candidateId: c.candidate_id,
      state: stateCode,
      district: c.district,
      office: 'house',
    }));

    if (candidates.length > 0) {
      await cacheService.set(cacheKey, candidates, CACHE_TTL);
      this._memCache[cacheKey] = candidates;
      this._memCacheTime[cacheKey] = Date.now();
    }

    return candidates;
  }

  /**
   * FEC names are "LAST, FIRST M" — convert to "First Last"
   */
  _formatName(fecName) {
    if (!fecName) return 'Unknown';
    const parts = fecName.split(',').map(s => s.trim());
    if (parts.length >= 2) {
      const first = parts[1].split(' ')[0]; // Drop middle initial
      const last = parts[0];
      return `${this._titleCase(first)} ${this._titleCase(last)}`;
    }
    return this._titleCase(fecName);
  }

  _titleCase(str) {
    return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  }

  /**
   * Get independent expenditures (super PAC spending) for a candidate
   * Endpoint: /schedules/schedule_e/
   * Returns spending for/against a candidate by outside groups
   */
  async getIndependentExpenditures(candidateId) {
    if (!candidateId) return [];

    const cacheKey = `${CACHE_KEY_PREFIX}:ie:${candidateId}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    if (this._memCache[cacheKey] && (Date.now() - (this._memCacheTime[cacheKey] || 0)) < 30 * 60 * 1000) {
      return this._memCache[cacheKey];
    }

    const data = await this._fetch('/schedules/schedule_e/', {
      candidate_id: candidateId,
      cycle: '2026',
      sort: '-expenditure_amount',
      per_page: '20',
    });

    if (!data || !Array.isArray(data.results)) return [];

    const expenditures = data.results.map(e => ({
      committee: e.committee_name || 'Unknown Committee',
      committeeId: e.committee_id,
      amount: e.expenditure_amount || 0,
      supportOppose: e.support_oppose_indicator === 'S' ? 'support' : 'oppose',
      description: e.expenditure_description || null,
      date: e.expenditure_date || null,
      candidateName: e.candidate_name ? this._formatName(e.candidate_name) : null,
    }));

    if (expenditures.length > 0) {
      await cacheService.set(cacheKey, expenditures, CACHE_TTL);
      this._memCache[cacheKey] = expenditures;
      this._memCacheTime[cacheKey] = Date.now();
    }

    return expenditures;
  }

  /**
   * Get aggregated independent expenditure totals for a race (state + office)
   * Fetches top spending committees and total for/against by party
   */
  async getRaceExpenditures(stateCode, office = 'S', district = null) {
    if (!stateCode) return null;

    const distKey = district ? `:${district}` : '';
    const cacheKey = `${CACHE_KEY_PREFIX}:ie:race:${stateCode}:${office}${distKey}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    if (this._memCache[cacheKey] && (Date.now() - (this._memCacheTime[cacheKey] || 0)) < 30 * 60 * 1000) {
      return this._memCache[cacheKey];
    }

    const params = {
      cycle: '2026',
      sort: '-expenditure_amount',
      per_page: '100',
      is_notice: 'false',
    };

    // Get candidates for this race first to filter expenditures
    let candidates;
    if (office === 'S') {
      candidates = await this.getSenateCandidatesByCode(stateCode);
    } else if (office === 'H' && district) {
      candidates = await this.getHouseCandidates(stateCode, district);
    } else {
      return null;
    }

    if (!candidates || candidates.length === 0) return null;

    // Fetch IEs for top candidates (limit API calls)
    const topCandidates = candidates.slice(0, 6);
    const allIEs = [];

    for (const cand of topCandidates) {
      const ies = await this.getIndependentExpenditures(cand.candidateId);
      for (const ie of ies) {
        allIEs.push({ ...ie, candidateParty: cand.party, candidateName: cand.name });
      }
    }

    // Aggregate by committee
    const byCommittee = {};
    for (const ie of allIEs) {
      const key = ie.committeeId || ie.committee;
      if (!byCommittee[key]) {
        byCommittee[key] = { committee: ie.committee, committeeId: ie.committeeId, totalSpent: 0, support: {}, oppose: {} };
      }
      byCommittee[key].totalSpent += ie.amount;
      const bucket = ie.supportOppose === 'support' ? byCommittee[key].support : byCommittee[key].oppose;
      const party = ie.candidateParty || '?';
      bucket[party] = (bucket[party] || 0) + ie.amount;
    }

    // Sort by total spending
    const topCommittees = Object.values(byCommittee)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10)
      .map(c => ({
        committee: c.committee,
        totalSpent: c.totalSpent,
        formattedTotal: this._formatMoney(c.totalSpent),
        supportingParties: Object.entries(c.support).map(([p, amt]) => ({ party: p, amount: this._formatMoney(amt) })),
        opposingParties: Object.entries(c.oppose).map(([p, amt]) => ({ party: p, amount: this._formatMoney(amt) })),
      }));

    // Aggregate totals
    let totalForD = 0, totalAgainstD = 0, totalForR = 0, totalAgainstR = 0;
    for (const ie of allIEs) {
      if (ie.candidateParty === 'D') {
        if (ie.supportOppose === 'support') totalForD += ie.amount;
        else totalAgainstD += ie.amount;
      } else if (ie.candidateParty === 'R') {
        if (ie.supportOppose === 'support') totalForR += ie.amount;
        else totalAgainstR += ie.amount;
      }
    }

    const result = {
      topCommittees,
      totalOutsideSpending: this._formatMoney(allIEs.reduce((s, ie) => s + ie.amount, 0)),
      totalOutsideSpendingRaw: allIEs.reduce((s, ie) => s + ie.amount, 0),
      byParty: {
        D: {
          supportSpending: this._formatMoney(totalForD),
          opposeSpending: this._formatMoney(totalAgainstD),
        },
        R: {
          supportSpending: this._formatMoney(totalForR),
          opposeSpending: this._formatMoney(totalAgainstR),
        },
      },
      expenditureCount: allIEs.length,
    };

    if (allIEs.length > 0) {
      await cacheService.set(cacheKey, result, CACHE_TTL);
      this._memCache[cacheKey] = result;
      this._memCacheTime[cacheKey] = Date.now();
    }

    return result;
  }

  /**
   * Get Senate candidates by state code (2-letter) instead of state name
   */
  async getSenateCandidatesByCode(stateCode) {
    if (!stateCode) return [];

    const cacheKey = `${CACHE_KEY_PREFIX}:senate:${stateCode}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    if (this._memCache[cacheKey] && (Date.now() - (this._memCacheTime[cacheKey] || 0)) < 30 * 60 * 1000) {
      return this._memCache[cacheKey];
    }

    const data = await this._fetch('/candidates/search/', {
      state: stateCode,
      office: 'S',
      election_year: '2026',
      sort: '-total_receipts',
      per_page: '20',
      is_active_candidate: 'true',
    });

    if (!data || !Array.isArray(data.results)) return [];

    const candidates = data.results.map(c => ({
      name: c.name ? this._formatName(c.name) : 'Unknown',
      party: this._normalizeParty(c.party),
      incumbentChallenge: c.incumbent_challenge || 'unknown',
      totalReceipts: c.total_receipts || 0,
      totalDisbursements: c.total_disbursements || 0,
      cashOnHand: c.cash_on_hand_end_period || 0,
      candidateId: c.candidate_id,
      state: stateCode,
      office: 'senate',
    }));

    if (candidates.length > 0) {
      await cacheService.set(cacheKey, candidates, CACHE_TTL);
      this._memCache[cacheKey] = candidates;
      this._memCacheTime[cacheKey] = Date.now();
    }

    return candidates;
  }

  /**
   * Format dollar amount for display
   */
  _formatMoney(num) {
    if (!num || num === 0) return null;
    if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(0)}k`;
    return `$${num.toFixed(0)}`;
  }

  _normalizeParty(party) {
    if (!party) return '?';
    const p = party.toUpperCase();
    if (p === 'DEM' || p === 'DEMOCRAT' || p === 'DEMOCRATIC') return 'D';
    if (p === 'REP' || p === 'REPUBLICAN') return 'R';
    if (p === 'LIB' || p === 'LIBERTARIAN') return 'L';
    if (p === 'GRE' || p === 'GREEN') return 'G';
    if (p === 'IND' || p === 'INDEPENDENT') return 'I';
    return party.charAt(0).toUpperCase();
  }
}

export const fecService = new FECService();
export default fecService;
