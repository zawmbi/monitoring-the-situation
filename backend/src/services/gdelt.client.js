/**
 * GDELT Client — shared, rate-limited GDELT API wrapper
 *
 * Problem: 11+ services each make independent GDELT requests with no
 * coordination, causing HTTP 429 (Too Many Requests) errors.
 *
 * Solution: A single request queue with:
 *   - Max concurrent requests (1 in dev, 3 in prod)
 *   - Minimum gap between request starts
 *   - Automatic retry with exponential backoff on 429
 *   - Request deduplication (same URL within TTL returns cached result)
 *   - Circuit breaker: stops sending after repeated 429s, auto-recovers
 *   - Queue drain on circuit trip (resolves waiting items with empty data)
 *
 * Tuning: Set GDELT_DEV_MODE=true in .env for conservative dev-friendly
 * limits (1 concurrent, 800ms gap). For production, leave it unset or
 * use the individual GDELT_MAX_CONCURRENT / GDELT_MIN_GAP_MS overrides.
 */

const GDELT_DOC_BASE = 'https://api.gdeltproject.org/api/v2/doc/doc';

// ── Environment-aware config ─────────────────────────────────────────────
const IS_DEV_MODE = (process.env.GDELT_DEV_MODE || process.env.NODE_ENV || 'development') !== 'production';

const FETCH_TIMEOUT  = parseInt(process.env.GDELT_FETCH_TIMEOUT  || (IS_DEV_MODE ? '15000' : '12000'), 10);
const MAX_CONCURRENT = parseInt(process.env.GDELT_MAX_CONCURRENT || (IS_DEV_MODE ? '1'     : '3'),     10);
const MIN_GAP_MS     = parseInt(process.env.GDELT_MIN_GAP_MS     || (IS_DEV_MODE ? '800'   : '250'),   10);
const RETRY_MAX      = parseInt(process.env.GDELT_RETRY_MAX      || '2',                                10);
const RETRY_BASE_MS  = parseInt(process.env.GDELT_RETRY_BASE_MS  || (IS_DEV_MODE ? '3000'  : '1500'),  10);
const CIRCUIT_THRESHOLD = parseInt(process.env.GDELT_CIRCUIT_THRESHOLD || (IS_DEV_MODE ? '5' : '15'),   10);
const CIRCUIT_RESET_MS  = parseInt(process.env.GDELT_CIRCUIT_RESET_MS  || (IS_DEV_MODE ? '60000' : '30000'), 10);
const DEDUP_TTL_MS      = parseInt(process.env.GDELT_DEDUP_TTL_MS      || (IS_DEV_MODE ? '60000' : '30000'), 10);

console.log(`[GDELT] Mode: ${IS_DEV_MODE ? 'DEV' : 'PROD'} | concurrent=${MAX_CONCURRENT} gap=${MIN_GAP_MS}ms timeout=${FETCH_TIMEOUT}ms circuit=${CIRCUIT_THRESHOLD}/${CIRCUIT_RESET_MS}ms`);

// ── State ─────────────────────────────────────────────────────────────────
let inFlight = 0;
let lastRequestTime = 0;
let consecutive429s = 0;
let circuitOpen = false;
let circuitOpenedAt = 0;
const pendingQueue = [];           // { resolve, reject, url, options }
const recentResults = new Map();   // url -> { data, time }

// ── Drain queue on circuit trip ──────────────────────────────────────────

function drainQueueWithEmpty() {
  const count = pendingQueue.length;
  while (pendingQueue.length > 0) {
    const item = pendingQueue.shift();
    // Resolve directly (bypass the caching wrapper) so empty data isn't cached
    item._rawResolve
      ? item._rawResolve({ articles: [] })
      : item.resolve({ articles: [] });
  }
  if (count > 0) {
    console.warn(`[GDELT] Drained ${count} queued requests with empty data`);
  }
}

// ── Queue processor ───────────────────────────────────────────────────────

function processQueue() {
  if (pendingQueue.length === 0) return;

  // Check circuit breaker
  if (circuitOpen) {
    if (Date.now() - circuitOpenedAt > CIRCUIT_RESET_MS) {
      circuitOpen = false;
      consecutive429s = 0;
      console.log('[GDELT] Circuit breaker reset — resuming requests');
    } else {
      // Drain any waiting items so their Promises resolve (with empty data)
      drainQueueWithEmpty();
      return;
    }
  }

  if (inFlight >= MAX_CONCURRENT) return;

  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < MIN_GAP_MS) {
    setTimeout(processQueue, MIN_GAP_MS - elapsed + 10);
    return;
  }

  const item = pendingQueue.shift();
  if (!item) return;

  inFlight++;
  lastRequestTime = Date.now();

  executeRequest(item.url, item.options, 0)
    .then(item.resolve)
    .catch(item.reject)
    .finally(() => {
      inFlight--;
      // Process next after a small gap
      setTimeout(processQueue, MIN_GAP_MS);
    });

  // Try to fill remaining concurrency slots
  if (inFlight < MAX_CONCURRENT && pendingQueue.length > 0) {
    setTimeout(processQueue, MIN_GAP_MS);
  }
}

async function executeRequest(url, options, attempt) {
  try {
    const resp = await fetch(url, {
      ...options,
      signal: AbortSignal.timeout(FETCH_TIMEOUT),
    });

    if (resp.status === 429) {
      consecutive429s++;
      if (consecutive429s >= CIRCUIT_THRESHOLD) {
        circuitOpen = true;
        circuitOpenedAt = Date.now();
        console.warn(`[GDELT] Circuit breaker OPEN — ${consecutive429s} consecutive 429s. Pausing for ${CIRCUIT_RESET_MS / 1000}s`);
        // Drain remaining queued items so they don't hang
        drainQueueWithEmpty();
        throw new Error('GDELT rate limited (circuit open)');
      }
      if (attempt < RETRY_MAX) {
        const delay = RETRY_BASE_MS * Math.pow(2, attempt);
        await new Promise(r => setTimeout(r, delay));
        return executeRequest(url, options, attempt + 1);
      }
      throw new Error('GDELT HTTP 429');
    }

    if (!resp.ok) throw new Error(`GDELT HTTP ${resp.status}`);

    // Success — reset consecutive 429 counter
    consecutive429s = Math.max(0, consecutive429s - 1);
    return await resp.json();
  } catch (err) {
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      throw new Error('GDELT request timed out');
    }
    throw err;
  }
}

// ── Public API ────────────────────────────────────────────────────────────

/**
 * Rate-limited GDELT fetch. All services should use this instead of direct fetch().
 *
 * @param {string} url - Full GDELT API URL
 * @returns {Promise<object>} - Parsed JSON response
 */
function queuedFetch(url) {
  // Deduplication: return recent result for same URL
  const recent = recentResults.get(url);
  if (recent && (Date.now() - recent.time) < DEDUP_TTL_MS) {
    return Promise.resolve(recent.data);
  }

  // Circuit breaker fast-fail
  if (circuitOpen && (Date.now() - circuitOpenedAt) < CIRCUIT_RESET_MS) {
    return Promise.resolve({ articles: [] });
  }

  return new Promise((resolve, reject) => {
    pendingQueue.push({
      url,
      options: {},
      resolve: (data) => {
        // Only cache successful (non-empty) results
        const hasArticles = data && Array.isArray(data.articles) && data.articles.length > 0;
        const hasOtherData = data && !data.articles && Object.keys(data).length > 0;
        if (hasArticles || hasOtherData) {
          recentResults.set(url, { data, time: Date.now() });
          // Prune old entries
          if (recentResults.size > 200) {
            const cutoff = Date.now() - DEDUP_TTL_MS;
            for (const [k, v] of recentResults) {
              if (v.time < cutoff) recentResults.delete(k);
            }
          }
        }
        resolve(data);
      },
      _rawResolve: resolve,
      reject,
    });
    processQueue();
  });
}

/**
 * Fetch GDELT Doc API articles with rate limiting.
 *
 * @param {string} query - Search query
 * @param {object} [opts]
 * @param {number} [opts.maxRecords=75] - Max articles to return
 * @param {string} [opts.timespan='7d'] - Time window
 * @param {string} [opts.mode='ArtList'] - GDELT mode
 * @param {string} [opts.caller='unknown'] - Service name for logging
 * @returns {Promise<Array>} - Array of article objects
 */
export async function fetchGDELT(query, opts = {}) {
  const {
    maxRecords = 75,
    timespan = '7d',
    mode = 'ArtList',
    caller = 'unknown',
  } = opts;

  const url = `${GDELT_DOC_BASE}?query=${encodeURIComponent(query)}&mode=${mode}&maxrecords=${maxRecords}&timespan=${timespan}&format=json`;

  try {
    const data = await queuedFetch(url);

    if (mode === 'ArtList' || mode === 'artlist') {
      return (data.articles || []).map(a => ({
        title: a.title || '',
        url: a.url || '',
        source: a.domain || '',
        date: a.seendate || '',
        sourcecountry: a.sourcecountry || '',
        language: a.language || '',
        image: a.socialimage || '',
      }));
    }

    // For other modes (TimelineTone, ToneChart, etc.), return raw data
    return data;
  } catch (err) {
    console.warn(`[GDELT:${caller}] Fetch failed for "${query.substring(0, 60)}": ${err.message}`);
    return mode === 'ArtList' || mode === 'artlist' ? [] : {};
  }
}

/**
 * Fetch GDELT article count (ArticleCount mode).
 */
export async function fetchGDELTCount(query, opts = {}) {
  return fetchGDELT(query, { ...opts, mode: 'ArticleCount' });
}

/**
 * Fetch GDELT tone timeline.
 */
export async function fetchGDELTTone(query, opts = {}) {
  return fetchGDELT(query, { ...opts, mode: 'TimelineTone' });
}

/**
 * Fetch raw GDELT URL with rate limiting (for custom endpoints).
 */
export async function fetchGDELTRaw(url, caller = 'unknown') {
  try {
    return await queuedFetch(url);
  } catch (err) {
    console.warn(`[GDELT:${caller}] Raw fetch failed: ${err.message}`);
    return {};
  }
}

/**
 * Get current queue stats (for diagnostics).
 */
export function getGDELTStats() {
  return {
    inFlight,
    queued: pendingQueue.length,
    circuitOpen,
    consecutive429s,
    recentCacheSize: recentResults.size,
  };
}

export default {
  fetchGDELT,
  fetchGDELTCount,
  fetchGDELTTone,
  fetchGDELTRaw,
  getGDELTStats,
};
