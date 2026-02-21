/**
 * Nuclear News Monitoring Service
 * Fetches nuclear-related articles from GDELT and returns raw article data
 * with GDELT tone scores. Pure data passthrough — no risk scores or risk labels.
 *
 * Data sources:
 *   - GDELT Project API (article feeds with tone metadata)
 *   - Static NUCLEAR_STATES reference data
 *
 * API: https://api.gdeltproject.org/api/v2/doc/doc (no key required)
 * Cache: 30 minutes
 */

import { cacheService } from './cache.service.js';
import { fetchGDELTRaw } from './gdelt.client.js';

const CACHE_KEY = 'nuclear:combined';
const CACHE_TTL = 1800; // 30 minutes

const GDELT_BASE = 'https://api.gdeltproject.org/api/v2/doc/doc';

const NUCLEAR_QUERIES = [
  'nuclear weapon threat',
  'nuclear proliferation treaty',
  'ICBM missile test launch',
];

const NUCLEAR_STATES = [
  { name: 'United States', code: 'US', estimatedWarheads: 5500, status: 'declared' },
  { name: 'Russia', code: 'RU', estimatedWarheads: 6257, status: 'declared' },
  { name: 'China', code: 'CN', estimatedWarheads: 500, status: 'declared' },
  { name: 'United Kingdom', code: 'GB', estimatedWarheads: 225, status: 'declared' },
  { name: 'France', code: 'FR', estimatedWarheads: 290, status: 'declared' },
  { name: 'India', code: 'IN', estimatedWarheads: 172, status: 'declared' },
  { name: 'Pakistan', code: 'PK', estimatedWarheads: 170, status: 'declared' },
  { name: 'Israel', code: 'IL', estimatedWarheads: 90, status: 'undeclared' },
  { name: 'North Korea', code: 'KP', estimatedWarheads: 50, status: 'declared' },
  { name: 'Iran', code: 'IR', estimatedWarheads: 0, status: 'suspected-program' },
];

/**
 * Parse the GDELT tone field into a numeric value.
 * GDELT tone is sometimes a comma-separated string (avgTone,posScore,negScore,...).
 */
function parseTone(tone) {
  if (typeof tone === 'number') return tone;
  if (typeof tone === 'string') return parseFloat(tone.split(',')[0]) || 0;
  return 0;
}

/**
 * Generate a deterministic short ID from a string.
 */
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < (str || '').length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return `nuclear-${Math.abs(hash).toString(36)}`;
}

/**
 * Check if an article mentions a given nuclear state.
 */
function mentionsState(article, state) {
  const text = `${article.title} ${article.source}`.toLowerCase();
  const searchTerms = [state.name.toLowerCase(), state.code.toLowerCase()];

  const aliases = {
    'United States': ['usa', 'u.s.', 'american', 'pentagon'],
    'Russia': ['russian', 'moscow', 'kremlin', 'putin'],
    'China': ['chinese', 'beijing', 'prc'],
    'United Kingdom': ['uk', 'british', 'britain'],
    'France': ['french', 'paris'],
    'India': ['indian', 'delhi'],
    'Pakistan': ['pakistani', 'islamabad'],
    'Israel': ['israeli', 'tel aviv'],
    'North Korea': ['pyongyang', 'dprk', 'kim jong'],
    'Iran': ['iranian', 'tehran'],
  };

  if (aliases[state.name]) {
    searchTerms.push(...aliases[state.name]);
  }

  return searchTerms.some(t => text.includes(t));
}

class NuclearService {
  async getCombinedData() {
    const cached = await cacheService.get(CACHE_KEY);
    if (cached) return cached;

    console.log('[Nuclear] Fetching nuclear-related articles from GDELT...');

    const [articlesResult] = await Promise.allSettled([
      this.fetchNuclearArticles(),
    ]);

    const articles = articlesResult.status === 'fulfilled' ? articlesResult.value : [];

    // Annotate nuclear states with mention counts from raw articles
    const nuclearStates = NUCLEAR_STATES.map(state => ({
      ...state,
      mentionCount: articles.filter(a => mentionsState(a, state)).length,
    }));

    const result = {
      articles,
      nuclearStates,
      summary: {
        totalArticles: articles.length,
        queriesUsed: NUCLEAR_QUERIES,
      },
      dataSource: 'GDELT Project API v2',
      lastUpdated: new Date().toISOString(),
    };

    await cacheService.set(CACHE_KEY, result, CACHE_TTL);
    console.log(`[Nuclear] ${articles.length} articles fetched from GDELT`);

    return result;
  }

  /**
   * Fetch nuclear-related articles from GDELT.
   * Returns raw articles with their GDELT tone data.
   */
  async fetchNuclearArticles() {
    const allArticles = [];

    const results = await Promise.allSettled(
      NUCLEAR_QUERIES.map(async (query) => {
        try {
          const encoded = encodeURIComponent(query);
          const url = `${GDELT_BASE}?query=${encoded}&mode=artlist&maxrecords=30&timespan=7d&format=json&sort=datedesc`;

          const data = await fetchGDELTRaw(url, 'Nuclear');
          if (!data || !data.articles) return [];

          return data.articles.slice(0, 15).map(article => ({
            id: hashString(article.url || article.title),
            title: article.title || 'Untitled',
            url: article.url || '',
            source: article.domain || 'Unknown',
            sourceCountry: article.sourcecountry || 'Unknown',
            date: article.seendate || null,
            language: article.language || 'English',
            tone: parseTone(article.tone),
            query,
          }));
        } catch (err) {
          console.error(`[Nuclear] GDELT error (${query}):`, err.message);
          return [];
        }
      })
    );

    results.forEach(r => {
      if (r.status === 'fulfilled') allArticles.push(...r.value);
    });

    // Deduplicate by URL and sort by date
    const seen = new Set();
    return allArticles
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .filter(article => {
        if (seen.has(article.url)) return false;
        seen.add(article.url);
        return true;
      })
      .slice(0, 30);
  }
}

export const nuclearService = new NuclearService();
export default nuclearService;
