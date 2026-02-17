/**
 * Wikipedia Polls Service
 * Fetches and parses polling tables from Wikipedia articles for 2026 Senate races.
 * Uses the MediaWiki API to get rendered HTML, then extracts polling data from tables.
 * Free, no auth needed. Rate limit: be reasonable (~200 req/sec allowed).
 * Cache aggressively — polls update at most daily.
 */

import { cacheService } from './cache.service.js';

const WIKI_API = 'https://en.wikipedia.org/w/api.php';
const CACHE_PREFIX = 'wiki-polls:';
const CACHE_TTL = 3600; // 1 hour
const FETCH_TIMEOUT = 15000;
const USER_AGENT = 'MonitoringTheSituation/1.0 (https://github.com; election dashboard)';

// ── HTML helpers ──────────────────────────────────────────────────────────

function stripHtml(html) {
  return html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<sup[^>]*>[\s\S]*?<\/sup>/gi, '')   // footnotes
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&#\d+;/g, '').replace(/&\w+;/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function getAttr(tag, attr) {
  const m = tag.match(new RegExp(`${attr}\\s*=\\s*["'](\\d+)["']`, 'i'));
  return m ? parseInt(m[1], 10) : 1;
}

// ── Table extraction ──────────────────────────────────────────────────────

function extractWikitables(html) {
  // Match wikitable class tables
  const tables = [];
  const re = /<table[^>]*class="[^"]*wikitable[^"]*"[^>]*>([\s\S]*?)<\/table>/gi;
  let m;
  while ((m = re.exec(html)) !== null) tables.push(m[0]);
  return tables;
}

function extractRows(tableHtml) {
  const rows = [];
  const re = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let m;
  while ((m = re.exec(tableHtml)) !== null) rows.push(m[1]);
  return rows;
}

function extractCells(rowHtml) {
  const cells = [];
  const re = /<(t[dh])([^>]*)>([\s\S]*?)<\/\1>/gi;
  let m;
  while ((m = re.exec(rowHtml)) !== null) {
    const tag = m[0];
    const type = m[1].toLowerCase();
    const attrs = m[2];
    const content = m[3];
    const colspan = getAttr(tag, 'colspan');
    const rowspan = getAttr(tag, 'rowspan');
    const text = stripHtml(content);

    cells.push({ type, text, colspan, rowspan });
    // Expand colspan with placeholder cells
    for (let i = 1; i < colspan; i++) {
      cells.push({ type, text: '', colspan: 1, rowspan: 1, placeholder: true });
    }
  }
  return cells;
}

// ── Polling table detection & parsing ─────────────────────────────────────

function isPollingHeader(cells) {
  return cells.some(c => /^(poll|pollster|source|polling)/i.test(c.text.trim()));
}

/**
 * Identify candidate columns from header cells.
 * Looks for "(D)", "(R)", "(I)" party indicators in header text.
 */
function identifyCandidateColumns(headers) {
  const cols = [];
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i].text;
    // Match "Name (D)", "Name (R)", "Name (I)", "Name (L)", "Name (G)"
    const pm = h.match(/\(([DRILG])\)/);
    if (pm) {
      const name = h.replace(/\s*\([DRILG]\)\s*/, '').trim();
      if (name && name.length > 1) {
        cols.push({ index: i, name, party: pm[1] });
      }
    }
  }
  return cols;
}

/**
 * Determine table context from surrounding HTML — general vs primary.
 */
function getTableContext(tableHtml) {
  const preview = tableHtml.substring(0, 1000).toLowerCase();
  // Check caption or surrounding text
  const captionMatch = tableHtml.match(/<caption[^>]*>([\s\S]*?)<\/caption>/i);
  const caption = captionMatch ? stripHtml(captionMatch[1]).toLowerCase() : '';
  const ctx = caption + ' ' + preview;

  if (/republican\s+primary|gop\s+primary/i.test(ctx)) return { type: 'primary', party: 'R' };
  if (/democrat\w*\s+primary/i.test(ctx)) return { type: 'primary', party: 'D' };
  if (/primary/i.test(ctx)) return { type: 'primary', party: null };
  return { type: 'general', party: null };
}

function parsePollingTable(tableHtml) {
  const rows = extractRows(tableHtml);
  if (rows.length < 2) return [];

  // Find header row (first row with mostly <th> cells)
  let headerIdx = -1;
  let headerCells = [];
  for (let i = 0; i < Math.min(rows.length, 4); i++) {
    const cells = extractCells(rows[i]);
    const thCount = cells.filter(c => c.type === 'th').length;
    if (thCount >= 3) {
      headerIdx = i;
      headerCells = cells;
      break;
    }
  }
  if (headerIdx < 0) return [];

  if (!isPollingHeader(headerCells)) return [];

  const candidateCols = identifyCandidateColumns(headerCells);
  if (candidateCols.length === 0) return [];

  // Locate key columns
  const sourceIdx = headerCells.findIndex(c => /^(poll|pollster|source)/i.test(c.text.trim()));
  const dateIdx = headerCells.findIndex(c => /date/i.test(c.text));
  const sampleIdx = headerCells.findIndex(c => /sample/i.test(c.text));
  const marginIdx = headerCells.findIndex(c => /margin/i.test(c.text));

  const context = getTableContext(tableHtml);
  const polls = [];

  for (let r = headerIdx + 1; r < rows.length; r++) {
    const cells = extractCells(rows[r]);
    // Skip sub-header rows
    if (cells.filter(c => c.type === 'th').length > cells.length / 2) continue;
    if (cells.length < 3) continue;

    const sIdx = sourceIdx >= 0 ? sourceIdx : 0;
    const pollster = cells[sIdx]?.text || '';
    // Skip meta-rows
    if (!pollster || pollster.length < 2) continue;
    if (/polling average|hypothetical|notes?$|^results?$/i.test(pollster)) continue;

    const date = dateIdx >= 0 && cells[dateIdx] ? cells[dateIdx].text : '';
    const sampleSize = sampleIdx >= 0 && cells[sampleIdx] ? cells[sampleIdx].text : '';

    const candidates = [];
    let hasValidPct = false;
    for (const col of candidateCols) {
      if (col.index >= cells.length) continue;
      const text = cells[col.index]?.text || '';
      const numMatch = text.match(/(\d+(?:\.\d+)?)/);
      if (numMatch) {
        const pct = parseFloat(numMatch[1]);
        if (pct > 0 && pct <= 100) {
          candidates.push({ name: col.name, party: col.party, pct });
          hasValidPct = true;
        }
      }
    }

    if (hasValidPct && candidates.length > 0) {
      polls.push({
        pollster,
        date,
        sampleSize: sampleSize.replace(/[^\d,LVRVAa]/g, '') || sampleSize,
        candidates,
        type: context.type,
        primaryParty: context.party,
      });
    }
  }

  return polls;
}

// ── Main service ──────────────────────────────────────────────────────────

class WikipediaPollsService {
  constructor() {
    this._memCache = new Map();
  }

  async _fetchHtml(articleTitle) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    try {
      const params = new URLSearchParams({
        action: 'parse',
        page: articleTitle,
        format: 'json',
        prop: 'text',
        disabletoc: 'true',
        disableeditsection: 'true',
      });
      const resp = await fetch(`${WIKI_API}?${params}`, {
        headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!resp.ok) throw new Error(`Wikipedia ${resp.status}`);
      const data = await resp.json();
      if (data.error) throw new Error(data.error.info || 'Wikipedia API error');
      return data.parse?.text?.['*'] || '';
    } catch (err) {
      clearTimeout(timeout);
      throw err;
    }
  }

  /**
   * Fetch and parse polls for one state's Senate race.
   */
  async fetchStatePolls(stateName, raceType = 'regular') {
    const cacheKey = `${CACHE_PREFIX}${stateName}`;

    // Memory cache (1 hour)
    const mem = this._memCache.get(stateName);
    if (mem && (Date.now() - mem.time) < 3600000) return mem.data;

    // Redis cache
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      this._memCache.set(stateName, { data: cached, time: Date.now() });
      return cached;
    }

    try {
      const prefix = raceType === 'special'
        ? '2026_United_States_Senate_special_election_in_'
        : '2026_United_States_Senate_election_in_';
      const article = prefix + stateName.replace(/ /g, '_');

      const html = await this._fetchHtml(article);
      const tables = extractWikitables(html);

      let allPolls = [];
      for (const tbl of tables) {
        const parsed = parsePollingTable(tbl);
        allPolls.push(...parsed);
      }

      // Deduplicate by pollster+date
      const seen = new Set();
      allPolls = allPolls.filter(p => {
        const key = `${p.pollster}|${p.date}|${p.type}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      const result = {
        state: stateName,
        polls: allPolls,
        generalPolls: allPolls.filter(p => p.type === 'general'),
        primaryPolls: allPolls.filter(p => p.type === 'primary'),
        fetchedAt: new Date().toISOString(),
      };

      await cacheService.set(cacheKey, result, CACHE_TTL);
      this._memCache.set(stateName, { data: result, time: Date.now() });
      return result;
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.warn(`[WikiPolls] ${stateName}: ${err.message}`);
      }
      return { state: stateName, polls: [], generalPolls: [], primaryPolls: [], fetchedAt: new Date().toISOString() };
    }
  }

  /**
   * Fetch polls for all Senate races. Batched to avoid hammering Wikipedia.
   * @param {Object} races - Map of state -> { type: 'regular'|'special' }
   */
  async fetchAllSenatePolls(races) {
    const results = {};
    const entries = Object.entries(races);
    const BATCH = 5;

    for (let i = 0; i < entries.length; i += BATCH) {
      const batch = entries.slice(i, i + BATCH);
      const settled = await Promise.allSettled(
        batch.map(([state, info]) => this.fetchStatePolls(state, info.type || 'regular'))
      );
      for (let j = 0; j < batch.length; j++) {
        const [state] = batch[j];
        if (settled[j].status === 'fulfilled' && settled[j].value) {
          results[state] = settled[j].value;
        }
      }
      if (i + BATCH < entries.length) await new Promise(r => setTimeout(r, 250));
    }

    const totalPolls = Object.values(results).reduce((s, r) => s + r.polls.length, 0);
    const statesWithPolls = Object.values(results).filter(r => r.polls.length > 0).length;
    console.log(`[WikiPolls] Fetched ${totalPolls} polls across ${statesWithPolls}/${entries.length} states`);

    return results;
  }
}

export const wikipediaPollsService = new WikipediaPollsService();
export default wikipediaPollsService;
