/**
 * Election News Service
 * Uses GDELT Project API (free, no auth) to fetch live election-related news.
 * Provides per-state election coverage, candidate mentions, and trending topics.
 *
 * GDELT Doc API: https://api.gdeltproject.org/api/v2/doc/doc
 * - ArtList mode: article titles, URLs, sources, dates
 * - ToneChart mode: sentiment analysis over time
 * - TimelineVol mode: volume of coverage over time
 *
 * Refreshes every 10 minutes. Cache TTL: 600s.
 */

import { cacheService } from './cache.service.js';

const GDELT_BASE = 'https://api.gdeltproject.org/api/v2/doc/doc';
const CACHE_KEY_PREFIX = 'election-news';
const CACHE_TTL = 600; // 10 minutes

// Key Senate battleground states to track
const BATTLEGROUND_STATES = [
  'Maine', 'Michigan', 'North Carolina', 'Ohio', 'Texas', 'Georgia',
  'Arizona', 'Nevada', 'New Hampshire', 'Iowa', 'Alaska', 'Minnesota',
  'Nebraska', 'Pennsylvania', 'Wisconsin', 'Florida', 'Colorado', 'Virginia',
];

// Senate candidates to track (most competitive races)
const KEY_CANDIDATES = {
  'Maine': ['Susan Collins', 'Janet Mills'],
  'Michigan': ['Mike Rogers', 'Mallory McMorrow', 'Haley Stevens'],
  'North Carolina': ['Roy Cooper', 'Michael Whatley'],
  'Ohio': ['Jon Husted', 'Sherrod Brown'],
  'Texas': ['Ken Paxton', 'John Cornyn', 'Jasmine Crockett'],
  'Georgia': ['Jon Ossoff', 'Buddy Carter'],
  'Arizona': ['Katie Hobbs'],
  'Iowa': ['Ashley Hinson', 'Zach Wahls'],
  'Alaska': ['Dan Sullivan', 'Mary Peltola'],
  'Minnesota': ['Peggy Flanagan', 'Michele Tafoya'],
  'Florida': ['Ashley Moody', 'Alexander Vindman'],
  'New Hampshire': ['Maggie Goodlander', 'Chuck Morse'],
  'Nebraska': ['Pete Ricketts', 'Dan Osborn'],
};

class ElectionNewsService {
  constructor() {
    this._memCache = {};
    this._memCacheTime = {};
  }

  async _fetchGDELT(query, mode = 'ArtList', maxRecords = 20, timespan = '14d') {
    const params = new URLSearchParams({
      query: `${query} sourcelang:english`,
      mode,
      maxrecords: String(maxRecords),
      timespan,
      format: 'json',
      sort: 'DateDesc',
    });

    const url = `${GDELT_BASE}?${params}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (!response.ok) {
        console.warn(`[ElectionNews] GDELT ${response.status} for query: ${query.slice(0, 50)}`);
        return null;
      }
      const text = await response.text();
      if (!text || text.trim() === '') return null;
      return JSON.parse(text);
    } catch (error) {
      clearTimeout(timeout);
      if (error.name === 'AbortError') {
        console.warn('[ElectionNews] GDELT timeout');
      }
      return null;
    }
  }

  /**
   * Fetch top election news articles from GDELT.
   * Returns articles about 2026 midterms, Senate races, key candidates.
   */
  async getTopElectionNews() {
    const cacheKey = `${CACHE_KEY_PREFIX}:top`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    if (this._memCache[cacheKey] && (Date.now() - (this._memCacheTime[cacheKey] || 0)) < 10 * 60 * 1000) {
      return this._memCache[cacheKey];
    }

    // Broad election query
    const data = await this._fetchGDELT(
      '(midterm OR "2026 election" OR "senate race" OR "governor race" OR "house race") (republican OR democrat OR candidate OR poll)',
      'ArtList',
      50,
      '14d'
    );

    const articles = this._parseArticles(data);

    const result = {
      articles: articles.slice(0, 30),
      count: articles.length,
      fetchedAt: new Date().toISOString(),
    };

    await cacheService.set(cacheKey, result, CACHE_TTL);
    this._memCache[cacheKey] = result;
    this._memCacheTime[cacheKey] = Date.now();

    return result;
  }

  /**
   * Fetch election news for a specific state.
   */
  async getStateElectionNews(stateName) {
    if (!stateName) return null;

    const cacheKey = `${CACHE_KEY_PREFIX}:state:${stateName}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    if (this._memCache[cacheKey] && (Date.now() - (this._memCacheTime[cacheKey] || 0)) < 10 * 60 * 1000) {
      return this._memCache[cacheKey];
    }

    // State-specific election query
    const candidates = KEY_CANDIDATES[stateName] || [];
    const candidateQuery = candidates.length > 0
      ? ` OR ${candidates.map(c => `"${c}"`).join(' OR ')}`
      : '';

    const query = `("${stateName}" (election OR senate OR governor OR "house race" OR primary OR candidate OR poll OR campaign)${candidateQuery})`;

    const [articlesData, toneData] = await Promise.allSettled([
      this._fetchGDELT(query, 'ArtList', 25, '14d'),
      this._fetchGDELT(query, 'TimelineTone', 25, '30d'),
    ]);

    const articles = this._parseArticles(
      articlesData.status === 'fulfilled' ? articlesData.value : null
    );

    const tone = this._parseTone(
      toneData.status === 'fulfilled' ? toneData.value : null
    );

    const result = {
      state: stateName,
      articles: articles.slice(0, 15),
      articleCount: articles.length,
      tone,
      fetchedAt: new Date().toISOString(),
    };

    await cacheService.set(cacheKey, result, CACHE_TTL);
    this._memCache[cacheKey] = result;
    this._memCacheTime[cacheKey] = Date.now();

    return result;
  }

  /**
   * Fetch news coverage volume for all battleground states at once.
   * Returns a map of state → { articleCount, avgTone, trending }
   */
  async getBattlegroundOverview() {
    const cacheKey = `${CACHE_KEY_PREFIX}:battleground`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    if (this._memCache[cacheKey] && (Date.now() - (this._memCacheTime[cacheKey] || 0)) < 10 * 60 * 1000) {
      return this._memCache[cacheKey];
    }

    // Batch fetch — 3 states at a time to avoid overwhelming GDELT
    const results = {};
    const batches = [];
    for (let i = 0; i < BATTLEGROUND_STATES.length; i += 3) {
      batches.push(BATTLEGROUND_STATES.slice(i, i + 3));
    }

    for (const batch of batches) {
      const promises = batch.map(async (state) => {
        const query = `"${state}" (election OR senate OR governor OR campaign OR candidate) sourcelang:english`;
        const data = await this._fetchGDELT(query, 'ArtList', 10, '7d');
        const articles = this._parseArticles(data);

        results[state] = {
          articleCount: articles.length,
          topArticle: articles[0] || null,
        };
      });

      await Promise.allSettled(promises);
      // Small delay between batches
      await new Promise(r => setTimeout(r, 100));
    }

    const result = {
      states: results,
      battlegroundStates: BATTLEGROUND_STATES,
      fetchedAt: new Date().toISOString(),
    };

    await cacheService.set(cacheKey, result, CACHE_TTL);
    this._memCache[cacheKey] = result;
    this._memCacheTime[cacheKey] = Date.now();

    return result;
  }

  /**
   * Parse GDELT ArtList response into clean article objects.
   */
  _parseArticles(data) {
    if (!data || !data.articles) return [];

    return data.articles
      .filter(a => a.url && a.title)
      .map(a => ({
        title: a.title,
        url: a.url,
        source: a.domain || null,
        date: a.seendate ? this._parseGdeltDate(a.seendate) : null,
        image: a.socialimage || null,
        language: a.language || 'English',
        sourceCountry: a.sourcecountry || null,
      }))
      .filter((a, i, arr) => {
        // Deduplicate by domain (keep first per source)
        const seen = new Set();
        for (let j = 0; j < i; j++) {
          if (arr[j].source) seen.add(arr[j].source);
        }
        return !a.source || !seen.has(a.source);
      });
  }

  /**
   * Parse GDELT ToneChart response into sentiment data.
   */
  _parseTone(data) {
    if (!data || !data.timeline || !Array.isArray(data.timeline)) return null;

    const series = data.timeline[0];
    if (!series || !series.data) return null;

    const points = series.data
      .filter(d => d.date && d.value != null)
      .map(d => ({
        date: d.date,
        tone: Math.round(d.value * 10) / 10,
      }));

    if (points.length === 0) return null;

    const avgTone = Math.round(points.reduce((s, p) => s + p.tone, 0) / points.length * 10) / 10;
    const recentTone = points.length > 0 ? points[points.length - 1].tone : avgTone;
    const trend = points.length >= 3
      ? (points[points.length - 1].tone - points[0].tone > 0.5 ? 'improving' :
        points[points.length - 1].tone - points[0].tone < -0.5 ? 'declining' : 'stable')
      : 'stable';

    return {
      avgTone,
      recentTone,
      trend,
      points: points.slice(-14), // Last 14 data points
    };
  }

  _parseGdeltDate(dateStr) {
    if (!dateStr || dateStr.length < 8) return null;
    // GDELT dates: "20260215T120000Z" format
    const y = dateStr.slice(0, 4);
    const m = dateStr.slice(4, 6);
    const d = dateStr.slice(6, 8);
    return `${y}-${m}-${d}`;
  }
}

export const electionNewsService = new ElectionNewsService();
export default electionNewsService;
