/**
 * FiveThirtyEight Polling CSV Service
 *
 * Fetches individual poll results from FiveThirtyEight's public CSV files.
 * License: CC BY 4.0 — commercial use permitted with attribution.
 *
 * Endpoints (no auth required):
 *   Senate:   https://projects.fivethirtyeight.com/polls-page/data/senate_polls.csv
 *   Governor: https://projects.fivethirtyeight.com/polls-page/data/governor_polls.csv
 *   House:    https://projects.fivethirtyeight.com/polls-page/data/house_polls.csv
 *   Generic:  https://projects.fivethirtyeight.com/polls-page/data/generic_ballot_polls.csv
 *
 * Falls back gracefully if 538 data is unavailable (post-shutdown uncertainty).
 * Data attribution: FiveThirtyEight / ABC News (CC BY 4.0)
 */

import { cacheService } from './cache.service.js';

const BASE_URL = 'https://projects.fivethirtyeight.com/polls-page/data';
const CACHE_PREFIX = '538-polls:';
const CACHE_TTL = 3600; // 1 hour — polls update at most daily
const FETCH_TIMEOUT = 20000;

/**
 * Parse a CSV string into an array of objects using the header row as keys.
 * Handles quoted fields with commas inside them.
 */
function parseCSV(text) {
  const lines = text.split('\n');
  if (lines.length < 2) return [];

  // Parse header
  const headers = parseCSVRow(lines[0]);
  if (headers.length === 0) return [];

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = parseCSVRow(line);
    if (values.length < headers.length / 2) continue; // Skip malformed rows

    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = values[j] || '';
    }
    rows.push(obj);
  }

  return rows;
}

function parseCSVRow(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Normalize a 538 state name to match our internal naming.
 */
function normalizeState(state) {
  if (!state) return null;
  // 538 uses full state names, same as ours
  return state.trim();
}

class FiveThirtyEightService {
  constructor() {
    this._memCache = {};
    this._memCacheTime = {};
    this._available = null; // null = unknown, true/false = tested
  }

  async _fetchCSV(filename) {
    const url = `${BASE_URL}/${filename}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    try {
      const resp = await fetch(url, {
        headers: {
          'User-Agent': 'monitr/1.0 (election dashboard, CC BY 4.0 attribution)',
          'Accept': 'text/csv, text/plain, */*',
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!resp.ok) {
        if (resp.status === 404 || resp.status === 403) {
          console.warn(`[538] ${filename}: ${resp.status} — data may no longer be available`);
          this._available = false;
        }
        return null;
      }

      this._available = true;
      const text = await resp.text();
      return text;
    } catch (err) {
      clearTimeout(timeout);
      if (err.name !== 'AbortError') {
        console.warn(`[538] ${filename}: fetch failed — ${err.message}`);
      }
      return null;
    }
  }

  /**
   * Fetch and parse polls for a race type.
   * Returns normalized poll objects grouped by state.
   */
  async _getPolls(raceType) {
    const filenames = {
      senate: 'senate_polls.csv',
      governor: 'governor_polls.csv',
      house: 'house_polls.csv',
      generic: 'generic_ballot_polls.csv',
    };

    const filename = filenames[raceType];
    if (!filename) return {};

    const cacheKey = `${CACHE_PREFIX}${raceType}`;

    // Redis cache
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    // Memory cache (1hr stale)
    const memKey = raceType;
    if (this._memCache[memKey] && (Date.now() - (this._memCacheTime[memKey] || 0)) < 3600000) {
      return this._memCache[memKey];
    }

    // If we already know 538 is down, skip
    if (this._available === false) return {};

    const csvText = await this._fetchCSV(filename);
    if (!csvText) return {};

    const rows = parseCSV(csvText);
    if (rows.length === 0) return {};

    // Filter to 2026 cycle and recent polls only
    const now = new Date();
    const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

    const byState = {};

    for (const row of rows) {
      // 538 CSV columns vary but typically include:
      // poll_id, question_id, cycle, state, pollster, start_date, end_date,
      // sample_size, population, candidate_name, party, pct, ...

      const cycle = row.cycle || row.election_date?.slice(0, 4) || '';
      if (cycle && cycle !== '2026' && cycle !== '2025') continue;

      const endDate = row.end_date || row.created_at || '';
      if (endDate) {
        const d = new Date(endDate);
        if (d < sixMonthsAgo) continue;
      }

      const state = normalizeState(row.state);
      if (!state && raceType !== 'generic') continue;

      const key = raceType === 'generic' ? '_national' : state;
      if (!byState[key]) byState[key] = {};

      // Detect primary vs general from CSV stage/type fields
      const stage = (row.stage || row.race_type || row.type || '').toLowerCase();
      const isPrimary = stage === 'primary' || stage === 'pri';

      // Group by poll_id to collect all candidates from the same poll
      const pollId = row.poll_id || row.question_id || `${row.pollster}-${endDate}`;
      if (!byState[key][pollId]) {
        byState[key][pollId] = {
          pollId,
          pollster: row.pollster || row.pollster_rating_name || 'Unknown',
          startDate: row.start_date || '',
          endDate,
          sampleSize: parseInt(row.sample_size, 10) || null,
          population: row.population || '',
          methodology: row.methodology || '',
          state: state || 'National',
          district: row.seat_number || row.district || null,
          stage: isPrimary ? 'primary' : 'general',
          candidates: [],
          source: 'fivethirtyeight',
        };
      }

      const pct = parseFloat(row.pct);
      if (isNaN(pct) || pct <= 0) continue;

      // Normalize party
      let party = (row.party || '').toUpperCase();
      if (party === 'DEM') party = 'D';
      else if (party === 'REP') party = 'R';
      else if (party === 'IND') party = 'I';
      else if (party === 'LIB') party = 'L';
      else if (party === 'GRN' || party === 'GRE') party = 'G';
      else party = party.charAt(0) || '?';

      byState[key][pollId].candidates.push({
        name: row.candidate_name || row.answer || 'Unknown',
        party,
        pct,
      });
    }

    // Infer primary polls from candidate party composition:
    // If all candidates in a poll share the same party, it's a primary poll.
    for (const polls of Object.values(byState)) {
      for (const poll of Object.values(polls)) {
        if (poll.stage === 'general' && poll.candidates.length >= 2) {
          const parties = new Set(poll.candidates.map(c => c.party).filter(p => p && p !== '?'));
          if (parties.size === 1) {
            poll.stage = 'primary';
            poll.primaryParty = [...parties][0];
          }
        }
      }
    }

    // Flatten poll groups into arrays, sorted by date (most recent first)
    const result = {};
    for (const [stateKey, polls] of Object.entries(byState)) {
      const pollList = Object.values(polls)
        .filter(p => p.candidates.length >= 2)
        .sort((a, b) => {
          const dateA = a.endDate || a.startDate || '';
          const dateB = b.endDate || b.startDate || '';
          return dateB.localeCompare(dateA);
        });

      if (pollList.length > 0) {
        result[stateKey] = pollList;
      }
    }

    // Cache results
    if (Object.keys(result).length > 0) {
      await cacheService.set(cacheKey, result, CACHE_TTL);
      this._memCache[memKey] = result;
      this._memCacheTime[memKey] = Date.now();
    }

    const totalPolls = Object.values(result).reduce((s, arr) => s + arr.length, 0);
    const stateCount = Object.keys(result).length;
    console.log(`[538] ${raceType}: ${totalPolls} polls across ${stateCount} states`);

    return result;
  }

  /**
   * Get Senate polls grouped by state.
   * Returns { 'Georgia': [...polls], 'Michigan': [...], ... }
   */
  async getSenatePolls() {
    return this._getPolls('senate');
  }

  /**
   * Get Governor polls grouped by state.
   */
  async getGovernorPolls() {
    return this._getPolls('governor');
  }

  /**
   * Get House polls grouped by state.
   */
  async getHousePolls() {
    return this._getPolls('house');
  }

  /**
   * Get Generic Ballot polls.
   * Returns { '_national': [...polls] }
   */
  async getGenericBallotPolls() {
    return this._getPolls('generic');
  }

  /**
   * Check if 538 data appears to be available.
   */
  get isAvailable() {
    return this._available !== false;
  }
}

export const fiveThirtyEightService = new FiveThirtyEightService();
export default fiveThirtyEightService;
