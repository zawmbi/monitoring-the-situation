/**
 * Narrative & Tone Tracking Service
 *
 * Tracks global narratives using the GDELT API and returns raw tone data.
 * Pure data passthrough — returns GDELT average tone, article count, and
 * tone distribution per topic. No custom sentiment labels, momentum scoring,
 * or divergence flags.
 *
 * Data source: GDELT Project (Global Database of Events, Language, and Tone)
 *   - ToneChart mode: tone histogram for a given query
 *   - TimelineTone mode: tone over time
 *   - TimelineVol mode: volume over time
 *   - ArtList mode: article listings
 */

import { cacheService } from './cache.service.js';
import { fetchGDELTRaw } from './gdelt.client.js';

const CACHE_TTL = 600; // 10 minutes

const GDELT_BASE = 'https://api.gdeltproject.org/api/v2/doc/doc';

// ─── Tracked geopolitical narratives ───────────────────────────────────────────

const TRACKED_TOPICS = [
  { query: 'Ukraine Russia war',        label: 'Ukraine-Russia War' },
  { query: 'China Taiwan',              label: 'China-Taiwan Tensions' },
  { query: 'Israel Palestine',          label: 'Israel-Palestine Conflict' },
  { query: 'North Korea nuclear',       label: 'North Korea Nuclear Program' },
  { query: 'Iran sanctions',            label: 'Iran Sanctions' },
  { query: 'NATO expansion',            label: 'NATO Expansion' },
  { query: 'climate crisis',            label: 'Climate Crisis' },
  { query: 'AI regulation',             label: 'AI Regulation' },
  { query: 'global economy recession',  label: 'Global Economic Recession' },
  { query: 'Sudan conflict',            label: 'Sudan Conflict' },
];

// ─── Countries for tone mapping ───────────────────────────────────────────────

const TONE_COUNTRIES = [
  // North America
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'MX', name: 'Mexico' },
  // Europe
  { code: 'GB', name: 'United Kingdom' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'PL', name: 'Poland' },
  { code: 'UA', name: 'Ukraine' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'SE', name: 'Sweden' },
  // Eurasia
  { code: 'RU', name: 'Russia' },
  { code: 'TR', name: 'Turkey' },
  // Middle East
  { code: 'IL', name: 'Israel' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'IR', name: 'Iran' },
  { code: 'AE', name: 'UAE' },
  { code: 'QA', name: 'Qatar' },
  // Asia
  { code: 'CN', name: 'China' },
  { code: 'JP', name: 'Japan' },
  { code: 'IN', name: 'India' },
  { code: 'KR', name: 'South Korea' },
  { code: 'PK', name: 'Pakistan' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'PH', name: 'Philippines' },
  // Africa
  { code: 'NG', name: 'Nigeria' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'EG', name: 'Egypt' },
  { code: 'KE', name: 'Kenya' },
  { code: 'ET', name: 'Ethiopia' },
  // South America
  { code: 'BR', name: 'Brazil' },
  { code: 'AR', name: 'Argentina' },
  { code: 'CO', name: 'Colombia' },
  // Oceania
  { code: 'AU', name: 'Australia' },
  { code: 'NZ', name: 'New Zealand' },
];

// Countries used for cross-country tone comparison
const COMPARISON_SOURCES = ['US', 'GB', 'RU', 'CN', 'IN'];

// ─── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Build a GDELT API URL with the given parameters.
 */
function buildGdeltUrl(params) {
  const searchParams = new URLSearchParams(params);
  return `${GDELT_BASE}?${searchParams.toString()}`;
}

/**
 * Safely fetch JSON from a URL with a 12-second timeout.
 * Returns null on any error.
 */
async function safeFetchJson(url, label = 'GDELT') {
  // Route GDELT URLs through rate-limited shared client
  if (url.includes('gdeltproject.org')) {
    try {
      const data = await fetchGDELTRaw(url, 'Narrative');
      return data && Object.keys(data).length > 0 ? data : null;
    } catch {
      return null;
    }
  }

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(12000),
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'monitr/1.0 (narrative-tracker)',
      },
    });
    if (!res.ok) {
      console.warn(`[Narrative] ${label} responded ${res.status} for ${url.substring(0, 120)}`);
      return null;
    }
    const text = await res.text();
    if (!text || text.trim().length === 0) return null;
    return JSON.parse(text);
  } catch (err) {
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      console.warn(`[Narrative] ${label} request timed out`);
    } else {
      console.warn(`[Narrative] ${label} fetch error:`, err.message);
    }
    return null;
  }
}

/**
 * Extract average tone from a GDELT ToneChart response.
 * ToneChart returns a histogram of { bin, count } entries.
 * We compute a weighted average: sum(bin * count) / sum(count).
 */
function extractAvgToneFromChart(chartData) {
  if (!chartData) return { avgTone: 0, totalArticles: 0, toneDistribution: [] };

  let entries = [];
  if (chartData.tonechart && Array.isArray(chartData.tonechart)) {
    entries = chartData.tonechart;
  } else if (Array.isArray(chartData)) {
    entries = chartData;
  }

  if (entries.length === 0) {
    return { avgTone: 0, totalArticles: 0, toneDistribution: [] };
  }

  let weightedSum = 0;
  let totalCount = 0;
  const toneDistribution = [];

  for (const e of entries) {
    const bin = parseFloat(e.bin ?? 0);
    const count = parseInt(e.count ?? 0, 10);
    if (isNaN(bin) || isNaN(count) || count === 0) continue;
    weightedSum += bin * count;
    totalCount += count;
    toneDistribution.push({ bin, count });
  }

  const avgTone = totalCount > 0 ? Math.round((weightedSum / totalCount) * 100) / 100 : 0;
  return { avgTone, totalArticles: totalCount, toneDistribution };
}

/**
 * Extract tone time-series from a GDELT TimelineTone response.
 */
function extractToneTimeline(timelineData) {
  if (!timelineData) return [];

  let series = null;
  if (timelineData.timeline && Array.isArray(timelineData.timeline) && timelineData.timeline.length > 0) {
    series = timelineData.timeline[0];
  }

  if (!series || !Array.isArray(series.data)) return [];

  return series.data
    .filter(d => d.date && d.value != null)
    .map(d => ({
      date: d.date,
      tone: Math.round(parseFloat(d.value) * 100) / 100,
    }));
}

/**
 * Extract volume time-series from a GDELT TimelineVol response.
 */
function extractVolumeTimeline(volData) {
  if (!volData) return [];

  let series = null;
  if (volData.timeline && Array.isArray(volData.timeline) && volData.timeline.length > 0) {
    series = volData.timeline[0];
  }

  if (!series || !Array.isArray(series.data)) return [];

  return series.data
    .filter(d => d.date && d.value != null)
    .map(d => ({
      date: d.date,
      volume: Math.round(parseFloat(d.value) * 10000) / 10000,
    }));
}

/**
 * Extract articles from a GDELT ArtList response.
 */
function extractArticles(artListData) {
  if (!artListData) return [];

  let articles = [];
  if (Array.isArray(artListData)) {
    articles = artListData;
  } else if (artListData.articles && Array.isArray(artListData.articles)) {
    articles = artListData.articles;
  }

  return articles
    .filter(a => a.url && a.title)
    .map((a) => ({
      title: a.title || 'Untitled',
      url: a.url || '',
      source: a.domain || a.sourcecountry || 'Unknown',
      date: a.seendate || null,
      sourceCountry: a.sourcecountry || null,
      language: a.language || null,
      image: a.socialimage || null,
    }));
}

/**
 * Hash a string into a short deterministic id.
 */
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return `nar-${Math.abs(hash).toString(36)}`;
}

// ─── Service class ─────────────────────────────────────────────────────────────

class NarrativeService {
  constructor() {
    this.lastFetchTime = null;
    this.lastError = null;
  }

  // ─── 1. Fetch Narrative Tone ─────────────────────────────────────────────────

  /**
   * Fetch raw tone data for a given topic using GDELT ToneChart + TimelineTone.
   * Returns { avgTone, totalArticles, toneDistribution, toneHistory }
   */
  async fetchNarrativeTone(topic) {
    const cacheKey = `narrative:tone:${topic.replace(/\s+/g, '_').toLowerCase()}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    console.log(`[Narrative] Fetching tone for "${topic}"...`);

    const [chartData, timelineData] = await Promise.all([
      safeFetchJson(buildGdeltUrl({
        query: topic, mode: 'ToneChart', timespan: '30d', format: 'json',
      }), `ToneChart(${topic})`),
      safeFetchJson(buildGdeltUrl({
        query: topic, mode: 'TimelineTone', timespan: '30d', format: 'json',
      }), `TimelineTone(${topic})`),
    ]);

    const { avgTone, totalArticles, toneDistribution } = extractAvgToneFromChart(chartData);
    const toneHistory = extractToneTimeline(timelineData);

    const result = { avgTone, totalArticles, toneDistribution, toneHistory };
    await cacheService.set(cacheKey, result, CACHE_TTL);
    return result;
  }

  // ─── 2. Fetch Top Narratives ─────────────────────────────────────────────────

  /**
   * Query GDELT for tone data across all tracked topics.
   * For each topic: average tone, article count, tone distribution,
   * tone history, volume history, and top articles.
   * No custom sentiment labels or momentum scores.
   */
  async fetchTopNarratives() {
    const cacheKey = 'narrative:top_narratives';
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    console.log('[Narrative] Fetching top narratives across tracked topics...');

    const narrativePromises = TRACKED_TOPICS.map(async (topicDef) => {
      try {
        const artUrl = buildGdeltUrl({
          query: topicDef.query,
          mode: 'ArtList',
          maxrecords: '50',
          timespan: '7d',
          format: 'json',
          sort: 'DateDesc',
        });

        const toneChartUrl = buildGdeltUrl({
          query: topicDef.query,
          mode: 'ToneChart',
          timespan: '14d',
          format: 'json',
        });

        const toneTimelineUrl = buildGdeltUrl({
          query: topicDef.query,
          mode: 'TimelineTone',
          timespan: '14d',
          format: 'json',
        });

        const volTimelineUrl = buildGdeltUrl({
          query: topicDef.query,
          mode: 'TimelineVol',
          timespan: '14d',
          format: 'json',
        });

        const [artData, toneChartData, toneTimelineData, volTimelineData] = await Promise.all([
          safeFetchJson(artUrl, `ArtList(${topicDef.query})`),
          safeFetchJson(toneChartUrl, `ToneChart(${topicDef.query})`),
          safeFetchJson(toneTimelineUrl, `TimelineTone(${topicDef.query})`),
          safeFetchJson(volTimelineUrl, `TimelineVol(${topicDef.query})`),
        ]);

        const articles = extractArticles(artData);
        const { avgTone, totalArticles, toneDistribution } = extractAvgToneFromChart(toneChartData);
        const toneHistory = extractToneTimeline(toneTimelineData);
        const volumeHistory = extractVolumeTimeline(volTimelineData);

        const articleCount = totalArticles > 0 ? totalArticles : articles.length;

        const topArticles = articles
          .slice(0, 5)
          .map((a) => ({
            title: a.title,
            url: a.url,
            source: a.source,
            date: a.date,
          }));

        return {
          id: hashString(topicDef.query),
          topic: topicDef.query,
          label: topicDef.label,
          articleCount,
          avgTone,
          toneDistribution,
          toneHistory,
          volumeHistory,
          topArticles,
        };
      } catch (err) {
        console.error(`[Narrative] Error processing topic "${topicDef.query}":`, err.message);
        return {
          id: hashString(topicDef.query),
          topic: topicDef.query,
          label: topicDef.label,
          articleCount: 0,
          avgTone: 0,
          toneDistribution: [],
          toneHistory: [],
          volumeHistory: [],
          topArticles: [],
          error: err.message,
        };
      }
    });

    const results = await Promise.allSettled(narrativePromises);
    const narratives = results
      .filter((r) => r.status === 'fulfilled' && r.value)
      .map((r) => r.value)
      .sort((a, b) => b.articleCount - a.articleCount);

    console.log(`[Narrative] Fetched ${narratives.length} narratives`);
    await cacheService.set(cacheKey, narratives, CACHE_TTL);
    return narratives;
  }

  // ─── 3. Fetch Tone by Country ──────────────────────────────────────────

  /**
   * Fetch GDELT tone data per source country.
   * Returns raw average tone, article count, and tone history per country.
   * No custom sentiment labels.
   */
  async fetchToneByCountry() {
    const cacheKey = 'narrative:tone_by_country';
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    console.log('[Narrative] Fetching tone by country...');

    const batchSize = 6;
    const toneMap = {};

    for (let i = 0; i < TONE_COUNTRIES.length; i += batchSize) {
      const batch = TONE_COUNTRIES.slice(i, i + batchSize);

      const batchPromises = batch.map(async (country) => {
        try {
          const [chartData, timelineData] = await Promise.all([
            safeFetchJson(buildGdeltUrl({
              query: `sourcecountry:${country.code}`,
              mode: 'ToneChart', timespan: '14d', format: 'json',
            }), `CountryToneChart(${country.code})`),
            safeFetchJson(buildGdeltUrl({
              query: `sourcecountry:${country.code}`,
              mode: 'TimelineTone', timespan: '14d', format: 'json',
            }), `CountryTimelineTone(${country.code})`),
          ]);

          const { avgTone, totalArticles } = extractAvgToneFromChart(chartData);
          const toneHistory = extractToneTimeline(timelineData);

          return {
            code: country.code,
            name: country.name,
            avgTone,
            articleCount: totalArticles || toneHistory.length || 0,
            toneHistory: toneHistory.slice(-7),
          };
        } catch (err) {
          console.warn(`[Narrative] Error fetching tone for ${country.code}:`, err.message);
          return {
            code: country.code,
            name: country.name,
            avgTone: 0,
            articleCount: 0,
            toneHistory: [],
            error: err.message,
          };
        }
      });

      const batchResults = await Promise.allSettled(batchPromises);
      batchResults.forEach((r) => {
        if (r.status === 'fulfilled' && r.value) {
          toneMap[r.value.code] = r.value;
        }
      });

      // Small delay between batches to respect rate limits
      if (i + batchSize < TONE_COUNTRIES.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    console.log(`[Narrative] Tone map built for ${Object.keys(toneMap).length} countries`);
    await cacheService.set(cacheKey, toneMap, CACHE_TTL);
    return toneMap;
  }

  // ─── 4. Cross-Country Tone Comparison ──────────────────────────────────

  /**
   * Compare raw tone for the same topic across different source countries.
   * Returns tone per country per topic. No divergence flags or thresholds.
   */
  async fetchCrossCountryTone() {
    const cacheKey = 'narrative:cross_country_tone';
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    console.log('[Narrative] Fetching cross-country tone comparison...');

    const topTopics = TRACKED_TOPICS.slice(0, 5);
    const comparisons = [];

    for (const topicDef of topTopics) {
      const countryTones = {};

      const sourcePromises = COMPARISON_SOURCES.map(async (countryCode) => {
        try {
          const chartData = await safeFetchJson(buildGdeltUrl({
            query: `${topicDef.query} sourcecountry:${countryCode}`,
            mode: 'ToneChart', timespan: '14d', format: 'json',
          }), `CrossTone(${topicDef.query}/${countryCode})`);

          const { avgTone, totalArticles } = extractAvgToneFromChart(chartData);

          return {
            countryCode,
            avgTone,
            articleCount: totalArticles,
          };
        } catch (err) {
          console.warn(`[Narrative] Cross-country error for ${topicDef.query}/${countryCode}:`, err.message);
          return { countryCode, avgTone: 0, articleCount: 0 };
        }
      });

      const sourceResults = await Promise.allSettled(sourcePromises);
      sourceResults.forEach((r) => {
        if (r.status === 'fulfilled' && r.value) {
          countryTones[r.value.countryCode] = r.value;
        }
      });

      comparisons.push({
        id: hashString(`cross-${topicDef.query}`),
        topic: topicDef.query,
        label: topicDef.label,
        toneByCountry: countryTones,
      });
    }

    console.log(`[Narrative] Cross-country tone comparison complete for ${comparisons.length} topics`);

    await cacheService.set(cacheKey, comparisons, CACHE_TTL);
    return comparisons;
  }

  // ─── 5. Get Combined Data ────────────────────────────────────────────────────

  /**
   * Main method: calls all sub-methods and returns a combined result.
   * Returns raw GDELT tone data throughout. No custom sentiment labels
   * or divergence flags.
   */
  async getCombinedData() {
    const cacheKey = 'narrative:combined';
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    console.log('[Narrative] Building combined narrative tone data...');
    this.lastFetchTime = Date.now();

    try {
      const [narratives, crossCountryTone, toneMap] = await Promise.all([
        this.fetchTopNarratives().catch((err) => {
          console.error('[Narrative] fetchTopNarratives failed:', err.message);
          return [];
        }),
        this.fetchCrossCountryTone().catch((err) => {
          console.error('[Narrative] fetchCrossCountryTone failed:', err.message);
          return [];
        }),
        this.fetchToneByCountry().catch((err) => {
          console.error('[Narrative] fetchToneByCountry failed:', err.message);
          return {};
        }),
      ]);

      // Compute global average tone from raw GDELT data
      const totalArticles = narratives.reduce((sum, n) => sum + n.articleCount, 0);
      const allTones = narratives.filter((n) => n.articleCount > 0).map((n) => n.avgTone);
      const avgGlobalTone = allTones.length > 0
        ? Math.round((allTones.reduce((s, t) => s + t, 0) / allTones.length) * 100) / 100
        : 0;

      const result = {
        narratives,
        toneByCountry: toneMap,
        crossCountryTone,
        summary: {
          totalNarratives: narratives.length,
          totalArticles,
          avgGlobalTone,
          countriesTracked: Object.keys(toneMap).length,
        },
        dataSource: 'GDELT Project API v2 (ToneChart, TimelineTone, TimelineVol, ArtList)',
        updatedAt: new Date().toISOString(),
      };

      await cacheService.set(cacheKey, result, CACHE_TTL);
      this.lastError = null;

      console.log(
        `[Narrative] Combined data ready: ${narratives.length} narratives, ` +
        `${Object.keys(toneMap).length} countries, ${totalArticles} articles`
      );

      return result;
    } catch (err) {
      console.error('[Narrative] getCombinedData failed:', err.message);
      this.lastError = err.message;
      return this.getFallbackData(err.message);
    }
  }

  // ─── Fallback & Utilities ────────────────────────────────────────────────────

  /**
   * Generate fallback data structure when all fetches fail.
   * Ensures the frontend always receives a valid response shape.
   */
  getFallbackData(errorMessage) {
    const fallbackNarratives = TRACKED_TOPICS.map((topicDef) => ({
      id: hashString(topicDef.query),
      topic: topicDef.query,
      label: topicDef.label,
      articleCount: 0,
      avgTone: 0,
      toneDistribution: [],
      toneHistory: [],
      volumeHistory: [],
      topArticles: [],
      error: errorMessage || 'Data unavailable',
    }));

    return {
      narratives: fallbackNarratives,
      toneByCountry: {},
      crossCountryTone: [],
      summary: {
        totalNarratives: fallbackNarratives.length,
        totalArticles: 0,
        avgGlobalTone: 0,
        countriesTracked: 0,
      },
      dataSource: 'GDELT Project API v2 (ToneChart, TimelineTone, TimelineVol, ArtList)',
      updatedAt: new Date().toISOString(),
      error: errorMessage || 'Data temporarily unavailable',
    };
  }

  /**
   * Get service health status for monitoring.
   */
  getHealthStatus() {
    return {
      service: 'NarrativeService',
      lastFetch: this.lastFetchTime ? new Date(this.lastFetchTime).toISOString() : null,
      lastError: this.lastError,
      trackedTopics: TRACKED_TOPICS.length,
      trackedCountries: TONE_COUNTRIES.length,
      comparisonSources: COMPARISON_SOURCES.length,
      cacheTtl: CACHE_TTL,
    };
  }
}

export const narrativeService = new NarrativeService();
export default narrativeService;
