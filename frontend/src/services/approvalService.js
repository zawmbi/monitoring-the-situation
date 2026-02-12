/**
 * Approval Rating Service
 * Fetches live approval data from Wikipedia's "List of heads of the executive
 * by approval rating" page, merges with static fallback data, and caches.
 *
 * - Refreshes from Wikipedia at most once per CACHE_TTL (default 24 h)
 * - Falls back to static leaderApproval.js data when the fetch fails
 * - Merges: static history + live Wikipedia current data point
 */

import { getLeaderApproval as getStaticApproval } from '../features/country/leaderApproval';

const WIKI_API =
  'https://en.wikipedia.org/w/api.php?action=parse' +
  '&page=List_of_heads_of_the_executive_by_approval_rating' +
  '&format=json&prop=text&origin=*';

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

let wikiCache = null; // { data: Map<country, {approve, disapprove, date}>, ts }

/**
 * Parse the Wikipedia approval table HTML into a map of country → rating.
 * The table has columns roughly: Country | Leader | Approve | Disapprove | …
 */
function parseApprovalTable(html) {
  const results = new Map();

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const tables = doc.querySelectorAll('table.wikitable');

    for (const table of tables) {
      const rows = table.querySelectorAll('tr');
      if (rows.length < 2) continue;

      // Try to find header indices
      const headers = rows[0]?.querySelectorAll('th');
      if (!headers || headers.length < 3) continue;

      let countryIdx = -1, approveIdx = -1, disapproveIdx = -1;
      for (let i = 0; i < headers.length; i++) {
        const txt = (headers[i].textContent || '').toLowerCase().trim();
        if (txt.includes('country') || txt.includes('state') || txt.includes('nation')) countryIdx = i;
        if (txt.includes('approv') && approveIdx === -1) approveIdx = i;
        if (txt.includes('disapprov')) disapproveIdx = i;
      }

      if (countryIdx === -1 || approveIdx === -1) continue;

      for (let r = 1; r < rows.length; r++) {
        const cells = rows[r].querySelectorAll('td, th');
        if (cells.length <= approveIdx) continue;

        const country = (cells[countryIdx]?.textContent || '').trim().replace(/\[.*\]/g, '');
        const approveStr = (cells[approveIdx]?.textContent || '').replace(/[^0-9.]/g, '');
        const disapproveStr = disapproveIdx >= 0 && cells[disapproveIdx]
          ? (cells[disapproveIdx].textContent || '').replace(/[^0-9.]/g, '')
          : null;

        const approve = parseFloat(approveStr);
        if (!country || isNaN(approve)) continue;

        const disapprove = disapproveStr ? parseFloat(disapproveStr) : null;

        results.set(normalizeWikiCountry(country), {
          approve: Math.round(approve),
          disapprove: disapprove && !isNaN(disapprove) ? Math.round(disapprove) : null,
          date: new Date().toISOString().slice(0, 7), // e.g. "2026-02"
        });
      }
    }
  } catch {
    // Parsing failed — return whatever we got
  }

  return results;
}

/**
 * Normalize country names from Wikipedia table to match our internal names.
 */
function normalizeWikiCountry(name) {
  const aliases = {
    'United States': 'United States',
    'US': 'United States',
    'USA': 'United States',
    'UK': 'United Kingdom',
    'South Korea': 'South Korea',
    'Republic of Korea': 'South Korea',
    'DR Congo': 'DR Congo',
    'Democratic Republic of the Congo': 'DR Congo',
  };
  return aliases[name] || name;
}

/**
 * Fetch live approval data from Wikipedia. Returns a Map or null on failure.
 */
async function fetchWikiApprovals() {
  // Return cache if fresh
  if (wikiCache && Date.now() - wikiCache.ts < CACHE_TTL) {
    return wikiCache.data;
  }

  try {
    const res = await fetch(WIKI_API);
    if (!res.ok) return wikiCache?.data || null;

    const json = await res.json();
    const html = json?.parse?.text?.['*'];
    if (!html) return wikiCache?.data || null;

    const data = parseApprovalTable(html);
    if (data.size > 0) {
      wikiCache = { data, ts: Date.now() };
    }
    return data;
  } catch {
    return wikiCache?.data || null;
  }
}

/**
 * Get approval data for a country. Merges live Wikipedia data with static fallback.
 *
 * Returns the same shape as leaderApproval.js entries:
 * { approvalHistory, party, governmentType, inaugurated, … , lastUpdated, source }
 */
export async function fetchLeaderApproval(countryName) {
  const staticData = getStaticApproval(countryName);
  const wikiData = await fetchWikiApprovals();
  const live = wikiData?.get(countryName) || null;

  if (!staticData && !live) return null;

  // Start from static data if available
  const result = staticData
    ? { ...staticData }
    : { approvalHistory: [] };

  if (live) {
    // Append the live data point if it's newer than the last static entry
    const history = [...(result.approvalHistory || [])];
    const lastEntry = history[history.length - 1];
    const alreadyHas = lastEntry && lastEntry.date === live.date &&
      lastEntry.approve === live.approve;

    if (!alreadyHas) {
      history.push({
        date: live.date,
        approve: live.approve,
        disapprove: live.disapprove ?? (lastEntry?.disapprove || 0),
      });
    }

    result.approvalHistory = history;
    result.liveApprove = live.approve;
    result.liveDisapprove = live.disapprove;
    result.lastUpdated = new Date().toISOString();
    result.source = 'wikipedia';
  } else if (staticData) {
    result.lastUpdated = null;
    result.source = 'static';
  }

  return result;
}

/**
 * Synchronous check: does a country have ANY approval data (static or potentially live)?
 * Used for quickly deciding whether to show the approval button.
 */
export function hasApprovalData(countryName) {
  // Check static data synchronously
  if (getStaticApproval(countryName)) return true;
  // Check live cache if available
  if (wikiCache?.data?.has(countryName)) return true;
  return false;
}

/**
 * Preload Wikipedia approval data in the background.
 * Call once at app startup to populate the cache.
 */
export function preloadApprovals() {
  fetchWikiApprovals().catch(() => {});
}
