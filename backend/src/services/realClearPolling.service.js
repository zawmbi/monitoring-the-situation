/**
 * RealClearPolling Service
 *
 * Replaces the defunct FiveThirtyEight polling CSV service.
 * Dynamically discovers races from RealClearPolling's index pages
 * and fetches individual poll data via their JSON API.
 *
 * Sources:
 *   Index:  https://www.realclearpolling.com/latest-polls/senate (and /governor, /house)
 *   Data:   https://www.realclearpolitics.com/epolls/json/polling_data/{ID}.json
 *
 * No auth required. Uses browser-like User-Agent.
 * Attribution: RealClearPolling / RealClearPolitics
 */

import { cacheService } from './cache.service.js';

const INDEX_BASE = 'https://www.realclearpolling.com/latest-polls';
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

/**
 * Infer party from candidate name or affiliation string.
 */
function inferParty(name, affiliation) {
  if (affiliation) {
    const aff = affiliation.trim();
    if (/democrat/i.test(aff) || aff === 'D') return 'D';
    if (/republican/i.test(aff) || aff === 'R') return 'R';
    if (/independent/i.test(aff) || aff === 'I') return 'I';
    if (/libertarian/i.test(aff) || aff === 'L') return 'L';
    if (/green/i.test(aff) || aff === 'G') return 'G';
  }
  // Check name for party indicators
  for (const [keyword, party] of Object.entries(PARTY_KEYWORDS)) {
    if (name && name.includes(keyword)) return party;
  }
  return '?';
}

/**
 * Parse a state name from a URL slug.
 */
function stateFromSlug(slug) {
  return STATE_SLUG_MAP[slug?.toLowerCase()] || null;
}

/**
 * Strip HTML tags from a string.
 */
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

  /**
   * Fetch a URL with browser-like headers.
   */
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
   * Discover race IDs and metadata from an RCP index page.
   * Extracts pollingDataUrl references and race information.
   * Returns: [{ raceId, state, stage, jsonUrl, title }]
   */
  _extractRaceInfo(html, raceType) {
    const races = [];
    const seen = new Set();

    // Pattern 1: Extract pollingDataUrl from embedded JSON
    // e.g., "pollingDataUrl":"https://orig.realclearpolitics.com/poll/race/8689/polling_data.json"
    const jsonUrlRe = /pollingDataUrl["']?\s*[:=]\s*["']([^"']+)["']/g;
    let match;
    while ((match = jsonUrlRe.exec(html)) !== null) {
      const url = match[1];
      const idMatch = url.match(/race\/(\d+)\//);
      if (idMatch && !seen.has(idMatch[1])) {
        seen.add(idMatch[1]);
        races.push({ raceId: idMatch[1], jsonUrl: url });
      }
    }

    // Pattern 2: Extract race IDs from epolls links
    // e.g., /epolls/2026/senate/ga/2026_georgia_senate_...-8717.html
    const epollsRe = /\/epolls\/\d{4}\/(\w+)\/(\w+)\/[^"']*?-(\d+)\.html/g;
    while ((match = epollsRe.exec(html)) !== null) {
      const raceId = match[3];
      if (!seen.has(raceId)) {
        seen.add(raceId);
        races.push({
          raceId,
          jsonUrl: `${JSON_BASE}/polling_data/${raceId}.json`,
        });
      }
    }

    // Pattern 3: Extract from /poll/race/{id}/ patterns
    const pollRaceRe = /\/poll\/race\/(\d+)\//g;
    while ((match = pollRaceRe.exec(html)) !== null) {
      const raceId = match[1];
      if (!seen.has(raceId)) {
        seen.add(raceId);
        races.push({
          raceId,
          jsonUrl: `${ORIG_JSON_BASE}/${raceId}/polling_data.json`,
        });
      }
    }

    // Pattern 4: Extract from RCP URL paths for state/race info
    // /polls/senate/general/2026/georgia/ossoff-vs-taylor-greene
    const raceUrlRe = /\/polls\/(senate|governor|house)\/(general|primary[^/]*)\/(2026|2025)\/([a-z-]+)\//g;
    while ((match = raceUrlRe.exec(html)) !== null) {
      const state = stateFromSlug(match[4]);
      const stage = match[2].startsWith('primary') ? 'primary' : 'general';
      // Associate with any unassigned race
      for (const race of races) {
        if (!race.state && state) {
          race.state = state;
          race.stage = stage;
        }
      }
    }

    // Try to extract state from page titles and race labels
    // "2026 Georgia Senate" or "2026 Ohio Senate Special Election"
    const titleRe = /2026\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:Senate|Governor|House)/g;
    const stateMentions = [];
    while ((match = titleRe.exec(html)) !== null) {
      stateMentions.push(match[1]);
    }

    // Assign states to races that don't have one yet
    let stateIdx = 0;
    for (const race of races) {
      if (!race.state && stateIdx < stateMentions.length) {
        race.state = stateMentions[stateIdx++];
      }
    }

    return races;
  }

  /**
   * Extract poll data from embedded page content (fallback when JSON fails).
   * Parses the Next.js server-rendered HTML for poll entries.
   */
  _extractPollsFromHtml(html, raceType) {
    const byState = {};

    // Look for poll entries in the HTML structure
    // RCP renders poll rows with: race title, pollster, date, sample, candidates, spread
    // Pattern: "Pollster" ... "Date" ... "Sample" ... "Candidate X%" ... "Spread"

    // Extract individual poll blocks from the serialized React data
    // Look for patterns like: "pollster":"Name","date":"Feb 15"
    const pollsterRe = /"pollster"\s*:\s*"([^"]+)"/g;
    const dateRe = /"date"\s*:\s*"([^"]+)"/g;
    const sampleRe = /"sample"\s*:\s*"?(\d+)\s*(RV|LV|A|V)?"?/gi;

    // Broader pattern: extract race+poll groups from the streaming data
    // RCP uses React Server Components with self.__next_f.push data
    const nextDataRe = /self\.__next_f\.push\(\[[\d,]+,"([^]*?)"\]\)/g;
    let nextMatch;
    const dataChunks = [];
    while ((nextMatch = nextDataRe.exec(html)) !== null) {
      // Unescape the JSON string
      try {
        const chunk = nextMatch[1]
          .replace(/\\"/g, '"')
          .replace(/\\n/g, '\n')
          .replace(/\\\\/g, '\\');
        dataChunks.push(chunk);
      } catch { /* skip malformed */ }
    }

    const allData = dataChunks.join('\n');

    // Extract race sections: "2026 STATE RACETYPE - TYPE"
    // Then extract poll entries within each section
    const raceBlockRe = /2026\s+([\w\s]+?)\s+(?:Senate|Governor|House)\s*(?:-\s*(\w[\w\s]*))?/g;
    let raceMatch;
    const racePositions = [];
    while ((raceMatch = raceBlockRe.exec(allData)) !== null) {
      racePositions.push({
        state: raceMatch[1].trim(),
        type: (raceMatch[2] || 'General').trim(),
        pos: raceMatch.index,
      });
    }

    // For each race section, extract polls between this position and the next
    for (let i = 0; i < racePositions.length; i++) {
      const race = racePositions[i];
      const start = race.pos;
      const end = i + 1 < racePositions.length ? racePositions[i + 1].pos : allData.length;
      const section = allData.substring(start, end);

      const state = race.state;
      if (!state) continue;

      const isPrimary = /primary/i.test(race.type);

      // Look for individual polls in this section
      // Pattern varies but typically: "Pollster Name" ... numbers representing percentages
      // We try to extract structured data from the serialized format
      const pollEntryRe = /(?:"pollster"|"poll"|"source")\s*:\s*"([^"]+)"[\s\S]*?(?:"date"|"endDate")\s*:\s*"([^"]+)"[\s\S]*?(?:"candidates?"|"results?")\s*:\s*\[([\s\S]*?)\]/g;
      let pollMatch;
      while ((pollMatch = pollEntryRe.exec(section)) !== null) {
        const pollster = pollMatch[1];
        const date = pollMatch[2];
        const candidatesStr = pollMatch[3];

        // Parse candidates from JSON-like array
        const candidates = [];
        const candRe = /\{[^}]*"name"\s*:\s*"([^"]+)"[^}]*"(?:pct|value|percentage)"\s*:\s*([\d.]+)[^}]*\}/g;
        let candMatch;
        while ((candMatch = candRe.exec(candidatesStr)) !== null) {
          candidates.push({
            name: candMatch[1],
            party: '?', // Will be inferred later
            pct: parseFloat(candMatch[2]),
          });
        }

        if (candidates.length >= 2) {
          if (!byState[state]) byState[state] = [];
          byState[state].push({
            pollId: `rcp-html-${state}-${date}-${pollster}`.replace(/\s+/g, '-').toLowerCase(),
            pollster,
            startDate: '',
            endDate: date,
            sampleSize: null,
            population: '',
            state,
            stage: isPrimary ? 'primary' : 'general',
            candidates,
            source: 'realclearpolling',
          });
        }
      }
    }

    return byState;
  }

  /**
   * Parse the RCP JSON polling data response.
   * The JSON format from RCP typically contains an array of poll objects.
   */
  _parseJsonPollingData(jsonText, state, raceId) {
    try {
      const data = JSON.parse(jsonText);

      // RCP JSON can be structured as:
      // { poll: [...], rcp_avg: {...} }
      // or just an array of poll objects
      const rawPolls = Array.isArray(data) ? data : (data.poll || data.polls || []);

      if (!Array.isArray(rawPolls) || rawPolls.length === 0) return [];

      const polls = [];

      for (const raw of rawPolls) {
        // Skip the RCP Average entry
        if (/rcp\s*average/i.test(raw.type || raw.pollster || '')) continue;
        if (raw.id === 0 || raw.type === 'rcp_average') continue;

        const pollster = stripHtml(raw.pollster || raw.Poll || raw.poll || 'Unknown');
        const date = raw.date || raw.Date || raw.end_date || '';
        const sampleStr = raw.sample || raw.Sample || raw.sampleSize || '';
        const sampleMatch = String(sampleStr).match(/(\d+)/);
        const sampleSize = sampleMatch ? parseInt(sampleMatch[1], 10) : null;

        const populationMatch = String(sampleStr).match(/(LV|RV|A|V)\b/i);
        const population = populationMatch ? populationMatch[1].toUpperCase() : '';

        // Extract candidates from the poll entry
        // RCP JSON has candidate data in various formats
        const candidates = [];

        // Format 1: candidate array
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
        }
        // Format 2: named candidate fields (e.g., "Collins (R)": "36")
        else {
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
          // Detect primary: all same party
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
   * 1. Fetches the index page to discover races
   * 2. Fetches JSON data for each discovered race
   * 3. Falls back to HTML parsing if JSON fails
   * Returns: { 'State': [...polls] }
   */
  async _getPolls(raceType) {
    const cacheKey = `${CACHE_PREFIX}${raceType}`;

    // Redis cache
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    // Memory cache (2hr stale)
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

    // Discover races from the index page
    const races = this._extractRaceInfo(html, raceType);
    console.log(`[RCP] Discovered ${races.length} ${raceType} races`);

    if (races.length === 0) {
      // Try HTML fallback parsing
      const htmlPolls = this._extractPollsFromHtml(html, raceType);
      if (Object.keys(htmlPolls).length > 0) {
        console.log(`[RCP] Extracted ${Object.values(htmlPolls).flat().length} polls from HTML fallback`);
        return htmlPolls;
      }
      return {};
    }

    // Fetch JSON data for each race (batched, max 5 concurrent)
    const byState = {};
    const BATCH_SIZE = 5;

    for (let i = 0; i < races.length; i += BATCH_SIZE) {
      const batch = races.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map(async (race) => {
          // Try orig JSON URL first, then epolls JSON
          const urls = [
            race.jsonUrl,
            `${ORIG_JSON_BASE}/${race.raceId}/polling_data.json`,
            `${JSON_BASE}/polling_data/${race.raceId}.json`,
          ];

          for (const url of urls) {
            if (!url) continue;
            const jsonText = await this._fetch(url);
            if (jsonText) {
              const polls = this._parseJsonPollingData(jsonText, race.state, race.raceId);
              return { raceId: race.raceId, state: race.state, polls };
            }
          }
          return { raceId: race.raceId, state: race.state, polls: [] };
        })
      );

      for (const result of results) {
        if (result.status !== 'fulfilled') continue;
        const { state, polls } = result.value;
        if (!state || polls.length === 0) continue;

        // Infer state from poll data if not set from index
        const actualState = state || polls[0]?.state;
        if (!actualState) continue;

        if (!byState[actualState]) byState[actualState] = [];
        byState[actualState].push(...polls);
      }

      // Small delay between batches to be polite
      if (i + BATCH_SIZE < races.length) {
        await new Promise(r => setTimeout(r, 300));
      }
    }

    // If JSON fetches all failed, try HTML fallback
    const totalPolls = Object.values(byState).reduce((s, arr) => s + arr.length, 0);
    if (totalPolls === 0) {
      console.log(`[RCP] JSON fetch yielded no polls, trying HTML fallback...`);
      const htmlPolls = this._extractPollsFromHtml(html, raceType);
      const htmlTotal = Object.values(htmlPolls).flat().length;
      if (htmlTotal > 0) {
        console.log(`[RCP] HTML fallback extracted ${htmlTotal} polls`);
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

    // Cache results
    if (Object.keys(byState).length > 0) {
      await cacheService.set(cacheKey, byState, CACHE_TTL);
      this._memCache[raceType] = byState;
      this._memCacheTime[raceType] = Date.now();
    }

    const stateCount = Object.keys(byState).length;
    console.log(`[RCP] ${raceType}: ${totalPolls} polls across ${stateCount} states`);

    return byState;
  }

  /**
   * Get Senate polls grouped by state.
   * Returns: { 'Georgia': [...polls], 'Michigan': [...], ... }
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
   * Returns: { '_national': [...polls] }
   */
  async getGenericBallotPolls() {
    const cacheKey = `${CACHE_PREFIX}generic`;

    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    if (this._memCache.generic && (Date.now() - (this._memCacheTime.generic || 0)) < CACHE_TTL * 1000) {
      return this._memCache.generic;
    }

    // RCP generic ballot URL
    const url = 'https://www.realclearpolling.com/polls/state-of-the-union/generic-congressional-vote';
    const html = await this._fetch(url);
    if (!html) return {};

    // Try to extract race IDs for the JSON endpoint
    const races = this._extractRaceInfo(html, 'generic');
    const polls = [];

    for (const race of races) {
      const urls = [
        race.jsonUrl,
        `${ORIG_JSON_BASE}/${race.raceId}/polling_data.json`,
        `${JSON_BASE}/polling_data/${race.raceId}.json`,
      ];

      for (const jsonUrl of urls) {
        if (!jsonUrl) continue;
        const jsonText = await this._fetch(jsonUrl);
        if (jsonText) {
          const parsed = this._parseJsonPollingData(jsonText, 'National', race.raceId);
          polls.push(...parsed);
          break;
        }
      }
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

  /**
   * Check if RCP data appears to be available.
   */
  get isAvailable() {
    return this._available !== false;
  }
}

export const realClearPollingService = new RealClearPollingService();
export default realClearPollingService;
