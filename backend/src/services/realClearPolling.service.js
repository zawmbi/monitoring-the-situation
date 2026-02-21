/**
 * RealClearPolling Service
 *
 * Replaces the defunct FiveThirtyEight polling CSV service.
 * Discovers races from RealClearPolling index pages, then fetches
 * poll data from individual race pages (RSC-embedded JSON).
 *
 * Data flow:
 *   1. Index page → discover races (fullPath + pollId from RSC cardsCollection)
 *   2. For each race, try JSON API (usually 403)
 *   3. Fallback: fetch individual race page, extract polls from RSC flight data
 *   4. Last resort: parse rendered HTML on index page for recent polls
 *
 * Sources:
 *   Index:  https://www.realclearpolling.com/latest-polls/senate (and /governor, /house)
 *   Races:  https://www.realclearpolling.com/polls/senate/general/2026/georgia/...
 *   JSON:   https://orig.realclearpolitics.com/poll/race/{ID}/polling_data.json (often 403)
 *
 * Attribution: RealClearPolling / RealClearPolitics
 */

import { cacheService } from './cache.service.js';

const INDEX_BASE = 'https://www.realclearpolling.com/latest-polls';
const RACE_PAGE_BASE = 'https://www.realclearpolling.com/polls';
const JSON_BASE = 'https://www.realclearpolitics.com/epolls/json';
const ORIG_JSON_BASE = 'https://orig.realclearpolitics.com/poll/race';
const CACHE_PREFIX = 'rcp-polls:';
const CACHE_TTL = 7200; // 2 hours
const FETCH_TIMEOUT = 25000;

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

// Map RCP state slugs → canonical state names
const STATE_SLUG_MAP = {
  'alabama': 'Alabama', 'alaska': 'Alaska', 'arizona': 'Arizona', 'arkansas': 'Arkansas',
  'california': 'California', 'colorado': 'Colorado', 'connecticut': 'Connecticut',
  'delaware': 'Delaware', 'florida': 'Florida', 'georgia': 'Georgia', 'hawaii': 'Hawaii',
  'idaho': 'Idaho', 'illinois': 'Illinois', 'indiana': 'Indiana', 'iowa': 'Iowa',
  'kansas': 'Kansas', 'kentucky': 'Kentucky', 'louisiana': 'Louisiana', 'maine': 'Maine',
  'maryland': 'Maryland', 'massachusetts': 'Massachusetts', 'michigan': 'Michigan',
  'minnesota': 'Minnesota', 'mississippi': 'Mississippi', 'missouri': 'Missouri',
  'montana': 'Montana', 'nebraska': 'Nebraska', 'nevada': 'Nevada',
  'new-hampshire': 'New Hampshire', 'new-jersey': 'New Jersey', 'new-mexico': 'New Mexico',
  'new-york': 'New York', 'north-carolina': 'North Carolina', 'north-dakota': 'North Dakota',
  'ohio': 'Ohio', 'oklahoma': 'Oklahoma', 'oregon': 'Oregon', 'pennsylvania': 'Pennsylvania',
  'rhode-island': 'Rhode Island', 'south-carolina': 'South Carolina',
  'south-dakota': 'South Dakota', 'tennessee': 'Tennessee', 'texas': 'Texas', 'utah': 'Utah',
  'vermont': 'Vermont', 'virginia': 'Virginia', 'washington': 'Washington',
  'west-virginia': 'West Virginia', 'wisconsin': 'Wisconsin', 'wyoming': 'Wyoming',
};

// Known party affiliations for RCP candidate labels
const PARTY_KEYWORDS = {
  '(D)': 'D', '(R)': 'R', '(I)': 'I', '(L)': 'L', '(G)': 'G',
  'Democrat': 'D', 'Republican': 'R', 'Independent': 'I',
  'DEM': 'D', 'REP': 'R', 'IND': 'I',
};

function inferParty(name, affiliation) {
  if (affiliation) {
    const aff = affiliation.trim();
    if (/democrat/i.test(aff) || aff === 'D') return 'D';
    if (/republican/i.test(aff) || aff === 'R') return 'R';
    if (/independent/i.test(aff) || aff === 'I') return 'I';
    if (/libertarian/i.test(aff) || aff === 'L') return 'L';
    if (/green/i.test(aff) || aff === 'G') return 'G';
  }
  for (const [keyword, party] of Object.entries(PARTY_KEYWORDS)) {
    if (name && name.includes(keyword)) return party;
  }
  return '?';
}

function stateFromSlug(slug) {
  return STATE_SLUG_MAP[slug?.toLowerCase()] || null;
}

function stripHtml(html) {
  return (html || '')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"')
    .replace(/&#\d+;/g, '').replace(/&\w+;/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

class RealClearPollingService {
  constructor() {
    this._memCache = {};
    this._memCacheTime = {};
    this._available = null; // null = untested
  }

  async _fetch(url) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    try {
      const resp = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'text/html,application/json,application/xhtml+xml,*/*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!resp.ok) {
        if (resp.status === 403 || resp.status === 503) {
          console.warn(`[RCP] ${url}: ${resp.status} — may be rate-limited`);
        }
        return null;
      }

      return await resp.text();
    } catch (err) {
      clearTimeout(timeout);
      if (err.name !== 'AbortError') {
        console.warn(`[RCP] ${url}: fetch failed — ${err.message}`);
      }
      return null;
    }
  }

  /**
   * Extract and unescape all RSC flight data chunks from HTML.
   */
  _extractRscData(html) {
    const re = /self\.__next_f\.push\(\[[\d,]+,"((?:[^"\\]|\\.)*)"\]\)/g;
    let m;
    const chunks = [];
    while ((m = re.exec(html)) !== null) {
      try {
        chunks.push(
          m[1]
            .replace(/\\"/g, '"')
            .replace(/\\n/g, '\n')
            .replace(/\\t/g, '\t')
            .replace(/\\\\/g, '\\')
        );
      } catch { /* skip malformed */ }
    }
    return chunks.join('\n');
  }

  /**
   * Discover races from an RCP index page using RSC card data.
   * Correlates "fullPath" with "pollId" from the cardsCollection to
   * get race ID, state, stage, and race page URL for each race.
   *
   * Returns: [{ raceId, state, stage, racePageUrl, jsonUrl }]
   */
  _extractRaceInfo(html, raceType) {
    const races = [];
    const seen = new Set();
    const rscData = this._extractRscData(html);
    let m;

    // ── Strategy 1: fullPath + pollId correlation from RSC card data ────
    const paths = [];
    const fpRe = /"fullPath"\s*:\s*"([^"]+)"/g;
    while ((m = fpRe.exec(rscData)) !== null)
      paths.push({ val: m[1], pos: m.index });

    const ids = [];
    const idRe = /"pollId"\s*:\s*"(\d+)"/g;
    while ((m = idRe.exec(rscData)) !== null)
      ids.push({ val: m[1], pos: m.index });

    const pollingUrls = [];
    const puRe = /"pollingDataUrl"\s*:\s*"([^"]+)"/g;
    while ((m = puRe.exec(rscData)) !== null)
      pollingUrls.push({ val: m[1], pos: m.index });

    for (const fp of paths) {
      let bestId = null, bestIdDist = Infinity;
      for (const id of ids) {
        const d = Math.abs(fp.pos - id.pos);
        if (d < bestIdDist && d < 500) { bestIdDist = d; bestId = id.val; }
      }

      let bestUrl = null, bestUrlDist = Infinity;
      for (const pu of pollingUrls) {
        const d = Math.abs(fp.pos - pu.pos);
        if (d < bestUrlDist && d < 500) { bestUrlDist = d; bestUrl = pu.val; }
      }

      if (!bestId && bestUrl) {
        const idM = bestUrl.match(/(?:race\/|polling_data\/)(\d+)/);
        if (idM) bestId = idM[1];
      }

      if (!bestId) continue;
      if (seen.has(bestId)) continue;
      seen.add(bestId);

      // Extract state from fullPath: "senate/general/2026/georgia" → "georgia"
      const parts = fp.val.split('/');
      let stateSlug = null;
      for (const part of parts) {
        if (stateFromSlug(part)) { stateSlug = part; break; }
      }

      const state = stateFromSlug(stateSlug);
      const stage = fp.val.includes('primary') ? 'primary' : 'general';

      races.push({
        raceId: bestId,
        state,
        stage,
        racePageUrl: `${RACE_PAGE_BASE}/${fp.val}`,
        jsonUrl: bestUrl || `${ORIG_JSON_BASE}/${bestId}/polling_data.json`,
      });
    }

    // ── Strategy 2: pollingDataUrl not matched above ────────────────────
    const puRe2 = /pollingDataUrl["']?\s*[:=]\s*["']([^"']+)["']/g;
    while ((m = puRe2.exec(html)) !== null) {
      const url = m[1];
      const idM = url.match(/(?:race\/|polling_data\/)(\d+)/);
      if (idM && !seen.has(idM[1])) {
        seen.add(idM[1]);
        races.push({ raceId: idM[1], jsonUrl: url });
      }
    }

    // ── Strategy 3: /poll/race/{id}/ patterns ───────────────────────────
    const prRe = /\/poll\/race\/(\d+)\//g;
    while ((m = prRe.exec(html)) !== null) {
      if (!seen.has(m[1])) {
        seen.add(m[1]);
        races.push({ raceId: m[1], jsonUrl: `${ORIG_JSON_BASE}/${m[1]}/polling_data.json` });
      }
    }

    // ── Strategy 4: epolls links ────────────────────────────────────────
    const epRe = /\/epolls\/\d{4}\/(\w+)\/(\w+)\/[^"']*?-(\d+)\.html/g;
    while ((m = epRe.exec(html)) !== null) {
      if (!seen.has(m[3])) {
        seen.add(m[3]);
        races.push({ raceId: m[3], state: stateFromSlug(m[2]), jsonUrl: `${JSON_BASE}/polling_data/${m[3]}.json` });
      }
    }

    // ── Fill missing states from "name" fields in RSC data ──────────────
    const nameRe = /"name"\s*:\s*"2026\s+([\w\s]+?)\s+(?:Senate|Governor|House)/g;
    const rscStateNames = [];
    while ((m = nameRe.exec(rscData)) !== null) {
      const slug = m[1].trim().toLowerCase().replace(/\s+/g, '-');
      const state = stateFromSlug(slug);
      if (state) rscStateNames.push(state);
    }

    let nameIdx = 0;
    for (const race of races) {
      if (race.state) continue;
      if (nameIdx < rscStateNames.length) {
        race.state = rscStateNames[nameIdx++];
      }
    }

    // ── Fill remaining from race links in rendered HTML ─────────────────
    const linkRe = /href="\/polls\/(?:senate|governor|house)\/(general|republican-primary|democratic-primary|special-election)[^"]*?\/(2026|2025)\/([a-z-]+)(?:\/[^"]*)?"/g;
    const linkStates = [];
    while ((m = linkRe.exec(html)) !== null) {
      const state = stateFromSlug(m[3]);
      if (state) linkStates.push({ state, stage: m[1].includes('primary') ? 'primary' : 'general', url: m[0].match(/href="([^"]+)"/)?.[1] });
    }

    let linkIdx = 0;
    for (const race of races) {
      if (race.state) continue;
      if (linkIdx < linkStates.length) {
        race.state = linkStates[linkIdx].state;
        race.stage = linkStates[linkIdx].stage;
        if (!race.racePageUrl && linkStates[linkIdx].url) {
          race.racePageUrl = `https://www.realclearpolling.com${linkStates[linkIdx].url}`;
        }
        linkIdx++;
      }
    }

    return races;
  }

  /**
   * Extract poll objects from RSC flight data on an individual race page.
   * Race pages embed poll data as props to a PollsTable component.
   * Each poll: { id, pollster, date, sampleSize, candidate: [{name, value, affiliation}] }
   */
  _extractPollsFromRacePage(html, state, raceId) {
    const rscData = this._extractRscData(html);
    if (!rscData || rscData.length < 50) return [];

    const polls = [];
    const pollsterRe = /"pollster"\s*:\s*"/g;
    let m;
    while ((m = pollsterRe.exec(rscData)) !== null) {
      // Search backwards for the opening '{'
      let start = m.index;
      let backtrack = 0;
      while (start > 0 && rscData[start] !== '{' && backtrack < 200) { start--; backtrack++; }
      if (rscData[start] !== '{') continue;

      // Search forwards with depth counting (handles nested arrays/objects + strings)
      let depth = 0;
      let end = -1;
      let inStr = false;
      for (let i = start; i < rscData.length && i < start + 5000; i++) {
        const c = rscData[i];
        if (inStr) {
          if (c === '\\') { i++; continue; }
          if (c === '"') inStr = false;
          continue;
        }
        if (c === '"') { inStr = true; continue; }
        if (c === '{' || c === '[') depth++;
        else if (c === '}' || c === ']') {
          depth--;
          if (depth === 0) { end = i + 1; break; }
        }
      }

      if (end <= start) continue;

      try {
        const obj = JSON.parse(rscData.substring(start, end));
        if (!obj.pollster || !Array.isArray(obj.candidate) || obj.candidate.length < 2) continue;
        if (/rcp.average/i.test(obj.pollster) || obj.type === 'rcp_average') continue;

        const pollster = stripHtml(obj.pollster);
        const date = obj.date || '';
        const sampleStr = obj.sampleSize || '';
        const sampleMatch = String(sampleStr).match(/(\d+)/);
        const sampleSize = sampleMatch ? parseInt(sampleMatch[1], 10) : null;
        const populationMatch = String(sampleStr).match(/(LV|RV|A|V)\b/i);
        const population = populationMatch ? populationMatch[1].toUpperCase() : '';

        const candidates = [];
        for (const c of obj.candidate) {
          const pct = parseFloat(c.value || c.pct || c.percentage);
          if (!isNaN(pct) && pct > 0) {
            candidates.push({
              name: stripHtml(c.name || 'Unknown'),
              party: inferParty(c.name, c.affiliation || c.party),
              pct,
            });
          }
        }

        if (candidates.length >= 2) {
          const parties = new Set(candidates.map(c => c.party).filter(p => p !== '?'));
          const isPrimary = parties.size === 1 && candidates.length >= 2;

          polls.push({
            pollId: `rcp-${raceId}-${obj.id || polls.length}`,
            pollster,
            startDate: '',
            endDate: date,
            sampleSize,
            population,
            state: state || 'Unknown',
            stage: isPrimary ? 'primary' : 'general',
            primaryParty: isPrimary ? [...parties][0] : undefined,
            candidates,
            source: 'realclearpolling',
          });
        }
      } catch { /* not valid JSON, skip */ }
    }

    return polls;
  }

  /**
   * Parse rendered HTML on the index page for recent poll entries (last resort).
   * Each poll entry has a race title link (with state in URL) followed by
   * pollster name, results, and spread.
   */
  _extractPollsFromHtml(html, raceType) {
    const byState = {};

    // Find race title links containing state slug
    const titleLinkRe = /href="\/polls\/(?:senate|governor|house)\/[^"]*?\/(?:2026|2025)\/([a-z-]+)[^"]*"[^>]*>([^<]+)<\/a>/gi;
    let m;
    const entries = [];
    while ((m = titleLinkRe.exec(html)) !== null) {
      const stateSlug = m[1];
      const state = stateFromSlug(stateSlug);
      const title = stripHtml(m[2]);
      entries.push({ state, title, pos: m.index + m[0].length });
    }

    for (const entry of entries) {
      if (!entry.state) continue;

      const chunk = stripHtml(html.substring(entry.pos, entry.pos + 2000));

      // Extract pollster
      const pollsterM = chunk.match(/(?:Poll|Pollster)\s*:?\s*([A-Z][\w\s.&'-]+?)(?:\s+Results|\s+\d)/i);
      const pollster = pollsterM ? pollsterM[1].trim() : 'Unknown';

      // Extract results: "Results: Name1 XX, Name2 YY"
      const resultsM = chunk.match(/Results?\s*:?\s*((?:[A-Z][\w.' -]+\s+\d+(?:\.\d+)?(?:\s*,\s*)?){2,})/i);
      if (!resultsM) continue;

      const resultsText = resultsM[1];
      const candidates = [];
      const candRe = /([A-Z][\w.' -]+?)\s+(\d+(?:\.\d+)?)/g;
      let cm;
      while ((cm = candRe.exec(resultsText)) !== null) {
        const name = cm[1].trim();
        const pct = parseFloat(cm[2]);
        if (name.length > 1 && !isNaN(pct) && pct > 0 && pct < 100) {
          candidates.push({ name, party: inferParty(name, ''), pct });
        }
      }

      if (candidates.length >= 2) {
        const state = entry.state;
        if (!byState[state]) byState[state] = [];
        const isPrimary = /primary/i.test(entry.title);

        byState[state].push({
          pollId: `rcp-idx-${state}-${pollster}-${byState[state].length}`.replace(/\s+/g, '-').toLowerCase(),
          pollster,
          startDate: '',
          endDate: '',
          sampleSize: null,
          population: '',
          state,
          stage: isPrimary ? 'primary' : 'general',
          candidates,
          source: 'realclearpolling',
        });
      }
    }

    return byState;
  }

  /**
   * Parse the RCP JSON polling data response.
   */
  _parseJsonPollingData(jsonText, state, raceId) {
    try {
      const data = JSON.parse(jsonText);
      const rawPolls = Array.isArray(data) ? data : (data.poll || data.polls || []);
      if (!Array.isArray(rawPolls) || rawPolls.length === 0) return [];

      const polls = [];
      for (const raw of rawPolls) {
        if (/rcp\s*average/i.test(raw.type || raw.pollster || '')) continue;
        if (raw.id === 0 || raw.type === 'rcp_average') continue;

        const pollster = stripHtml(raw.pollster || raw.Poll || raw.poll || 'Unknown');
        const date = raw.date || raw.Date || raw.end_date || '';
        const sampleStr = raw.sample || raw.Sample || raw.sampleSize || '';
        const sampleMatch = String(sampleStr).match(/(\d+)/);
        const sampleSize = sampleMatch ? parseInt(sampleMatch[1], 10) : null;
        const populationMatch = String(sampleStr).match(/(LV|RV|A|V)\b/i);
        const population = populationMatch ? populationMatch[1].toUpperCase() : '';

        const candidates = [];
        if (Array.isArray(raw.candidate)) {
          for (const c of raw.candidate) {
            const pct = parseFloat(c.value || c.pct || c.percentage);
            if (!isNaN(pct) && pct > 0) {
              candidates.push({
                name: stripHtml(c.name || c.candidate || 'Unknown'),
                party: inferParty(c.name, c.affiliation || c.party),
                pct,
              });
            }
          }
        } else {
          const skipFields = new Set([
            'id', 'type', 'pollster', 'poll', 'date', 'sample', 'samplesize',
            'moe', 'spread', 'link', 'source', 'end_date', 'start_date',
          ]);
          for (const [key, val] of Object.entries(raw)) {
            if (skipFields.has(key.toLowerCase())) continue;
            const pct = parseFloat(val);
            if (!isNaN(pct) && pct > 0 && pct < 100) {
              const party = inferParty(key, '');
              const name = key
                .replace(/\s*\([DRILG]\)\s*/g, '')
                .replace(/\s*\((?:Democrat|Republican|Independent)\)\s*/gi, '')
                .trim();
              if (name.length > 1) {
                candidates.push({ name, party, pct });
              }
            }
          }
        }

        if (candidates.length >= 2) {
          const parties = new Set(candidates.map(c => c.party).filter(p => p !== '?'));
          const isPrimary = parties.size === 1 && candidates.length >= 2;

          polls.push({
            pollId: `rcp-${raceId}-${raw.id || polls.length}`,
            pollster,
            startDate: raw.start_date || '',
            endDate: date,
            sampleSize,
            population,
            state: state || 'Unknown',
            stage: isPrimary ? 'primary' : 'general',
            primaryParty: isPrimary ? [...parties][0] : undefined,
            candidates,
            source: 'realclearpolling',
          });
        }
      }

      return polls;
    } catch (err) {
      console.warn(`[RCP] Failed to parse JSON for race ${raceId}:`, err.message);
      return [];
    }
  }

  /**
   * Fetch polls for a given race type.
   *
   * Three-phase approach:
   *   Phase 1: Try JSON API for each discovered race (fast but usually 403)
   *   Phase 2: Fetch individual race pages and parse RSC-embedded poll data
   *   Phase 3: Parse rendered HTML on index page for recent polls (last resort)
   */
  async _getPolls(raceType) {
    const cacheKey = `${CACHE_PREFIX}${raceType}`;

    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    if (this._memCache[raceType] && (Date.now() - (this._memCacheTime[raceType] || 0)) < CACHE_TTL * 1000) {
      return this._memCache[raceType];
    }

    const indexUrl = `${INDEX_BASE}/${raceType}`;
    console.log(`[RCP] Fetching ${raceType} polls from ${indexUrl}...`);

    const html = await this._fetch(indexUrl);
    if (!html) {
      console.warn(`[RCP] Failed to fetch ${raceType} index page`);
      this._available = false;
      return {};
    }

    this._available = true;

    const races = this._extractRaceInfo(html, raceType);
    const withState = races.filter(r => r.state);
    console.log(`[RCP] Discovered ${races.length} ${raceType} races (${withState.length} with state info)`);

    if (races.length === 0) {
      const htmlPolls = this._extractPollsFromHtml(html, raceType);
      const count = Object.values(htmlPolls).flat().length;
      if (count > 0) {
        console.log(`[RCP] HTML fallback: ${count} polls from ${Object.keys(htmlPolls).length} states`);
        return htmlPolls;
      }
      return {};
    }

    const byState = {};
    const BATCH_SIZE = 5;
    let jsonSuccesses = 0;
    let pageSuccesses = 0;

    for (let i = 0; i < races.length; i += BATCH_SIZE) {
      const batch = races.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map(async (race) => {
          // ── Phase 1: Try JSON endpoints ──────────────────────────────
          const jsonUrls = [...new Set([
            race.jsonUrl,
            `${ORIG_JSON_BASE}/${race.raceId}/polling_data.json`,
            `${JSON_BASE}/polling_data/${race.raceId}.json`,
          ].filter(Boolean))];

          for (const url of jsonUrls) {
            const jsonText = await this._fetch(url);
            if (jsonText) {
              const polls = this._parseJsonPollingData(jsonText, race.state, race.raceId);
              if (polls.length > 0) return { state: race.state, polls, via: 'json' };
            }
          }

          // ── Phase 2: Fetch individual race page ──────────────────────
          if (race.racePageUrl && race.state) {
            const pageHtml = await this._fetch(race.racePageUrl);
            if (pageHtml) {
              const polls = this._extractPollsFromRacePage(pageHtml, race.state, race.raceId);
              if (polls.length > 0) return { state: race.state, polls, via: 'page' };
            }
          }

          return { state: race.state, polls: [], via: 'none' };
        })
      );

      for (const result of results) {
        if (result.status !== 'fulfilled') continue;
        const { state, polls, via } = result.value;
        if (!state || polls.length === 0) continue;

        if (via === 'json') jsonSuccesses++;
        if (via === 'page') pageSuccesses++;

        if (!byState[state]) byState[state] = [];
        byState[state].push(...polls);
      }

      if (i + BATCH_SIZE < races.length) {
        await new Promise(r => setTimeout(r, 300));
      }
    }

    let totalPolls = Object.values(byState).reduce((s, arr) => s + arr.length, 0);
    console.log(`[RCP] Phase 1+2: ${totalPolls} polls (${jsonSuccesses} JSON, ${pageSuccesses} race pages)`);

    // ── Phase 3: Index HTML fallback if nothing worked ─────────────────
    if (totalPolls === 0) {
      console.log(`[RCP] All fetches failed, trying index HTML fallback...`);
      const htmlPolls = this._extractPollsFromHtml(html, raceType);
      const htmlTotal = Object.values(htmlPolls).flat().length;
      if (htmlTotal > 0) {
        const stateCount = Object.keys(htmlPolls).length;
        console.log(`[RCP] HTML fallback: ${htmlTotal} polls across ${stateCount} states`);
        await cacheService.set(cacheKey, htmlPolls, CACHE_TTL);
        this._memCache[raceType] = htmlPolls;
        this._memCacheTime[raceType] = Date.now();
        return htmlPolls;
      }
    }

    // Sort each state's polls by date (most recent first)
    for (const polls of Object.values(byState)) {
      polls.sort((a, b) => (b.endDate || '').localeCompare(a.endDate || ''));
    }

    if (Object.keys(byState).length > 0) {
      await cacheService.set(cacheKey, byState, CACHE_TTL);
      this._memCache[raceType] = byState;
      this._memCacheTime[raceType] = Date.now();
    }

    const stateCount = Object.keys(byState).length;
    totalPolls = Object.values(byState).reduce((s, arr) => s + arr.length, 0);
    console.log(`[RCP] ${raceType}: ${totalPolls} polls across ${stateCount} states`);

    return byState;
  }

  async getSenatePolls() {
    return this._getPolls('senate');
  }

  async getGovernorPolls() {
    return this._getPolls('governor');
  }

  async getHousePolls() {
    return this._getPolls('house');
  }

  async getGenericBallotPolls() {
    const cacheKey = `${CACHE_PREFIX}generic`;

    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    if (this._memCache.generic && (Date.now() - (this._memCacheTime.generic || 0)) < CACHE_TTL * 1000) {
      return this._memCache.generic;
    }

    const url = 'https://www.realclearpolling.com/polls/state-of-the-union/generic-congressional-vote';
    const html = await this._fetch(url);
    if (!html) return {};

    const races = this._extractRaceInfo(html, 'generic');
    const polls = [];

    for (const race of races) {
      // Try JSON first
      const jsonUrls = [...new Set([
        race.jsonUrl,
        `${ORIG_JSON_BASE}/${race.raceId}/polling_data.json`,
        `${JSON_BASE}/polling_data/${race.raceId}.json`,
      ].filter(Boolean))];

      let found = false;
      for (const jsonUrl of jsonUrls) {
        const jsonText = await this._fetch(jsonUrl);
        if (jsonText) {
          const parsed = this._parseJsonPollingData(jsonText, 'National', race.raceId);
          polls.push(...parsed);
          found = true;
          break;
        }
      }

      // Try race page if JSON failed
      if (!found && race.racePageUrl) {
        const pageHtml = await this._fetch(race.racePageUrl);
        if (pageHtml) {
          const pagePollsList = this._extractPollsFromRacePage(pageHtml, 'National', race.raceId);
          polls.push(...pagePollsList);
        }
      }
    }

    // If still nothing, try extracting from the page RSC data directly
    if (polls.length === 0) {
      const directPolls = this._extractPollsFromRacePage(html, 'National', 'generic');
      polls.push(...directPolls);
    }

    const result = polls.length > 0 ? { '_national': polls } : {};

    if (Object.keys(result).length > 0) {
      await cacheService.set(cacheKey, result, CACHE_TTL);
      this._memCache.generic = result;
      this._memCacheTime.generic = Date.now();
    }

    console.log(`[RCP] generic ballot: ${polls.length} polls`);
    return result;
  }

  get isAvailable() {
    return this._available !== false;
  }
}

export const realClearPollingService = new RealClearPollingService();
export default realClearPollingService;
