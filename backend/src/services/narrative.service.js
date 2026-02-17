/**
 * Narrative & Sentiment Tracking Service
 *
 * Tracks global narratives and sentiment using the GDELT Tone API and article feeds.
 * Monitors key geopolitical topics, computes average tone/sentiment per narrative,
 * detects divergence across source countries, and builds a country-level sentiment map.
 *
 * Data source: GDELT Project (Global Database of Events, Language, and Tone)
 *   - ToneChart mode: tone over time for a given query
 *   - ArtList mode:   article listings with tone metadata
 */

import { cacheService } from './cache.service.js';

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

// ─── Countries for sentiment mapping ───────────────────────────────────────────

const SENTIMENT_COUNTRIES = [
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

// Countries used for divergence comparison
const DIVERGENCE_SOURCES = ['US', 'GB', 'RU', 'CN', 'IN'];

// ─── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Classify tone value into a sentiment label.
 * GDELT tone ranges roughly from -10 to +10.
 */
function classifySentiment(tone) {
  if (tone == null || isNaN(tone)) return 'neutral';
  if (tone > 1) return 'positive';
  if (tone < -1) return 'negative';
  return 'neutral';
}

/**
 * Determine momentum from article counts.
 * Compares recent (last 2 days) vs prior (days 3-7) daily average.
 */
function determineMomentum(articles) {
  if (!articles || articles.length < 3) return 'stable';
  const recent = articles.slice(0, 2);
  const prior = articles.slice(2, 7);
  if (prior.length === 0) return 'stable';
  const recentAvg = recent.reduce((sum, a) => sum + (a.volume || 1), 0) / recent.length;
  const priorAvg = prior.reduce((sum, a) => sum + (a.volume || 1), 0) / prior.length;
  const ratio = recentAvg / (priorAvg || 1);
  if (ratio > 1.25) return 'increasing';
  if (ratio < 0.75) return 'decreasing';
  return 'stable';
}

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
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Monitored/1.0 (narrative-tracker)',
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
 * ToneChart returns an array of { date, tone } objects (or similar structure).
 */
function extractAvgToneFromChart(chartData) {
  if (!chartData) return { avgTone: 0, toneHistory: [] };

  // GDELT ToneChart may return data in various formats
  let entries = [];
  if (Array.isArray(chartData)) {
    entries = chartData;
  } else if (chartData.timeline && Array.isArray(chartData.timeline)) {
    entries = chartData.timeline;
  } else if (chartData.tonechart && Array.isArray(chartData.tonechart)) {
    entries = chartData.tonechart;
  }

  if (entries.length === 0) {
    return { avgTone: 0, toneHistory: [] };
  }

  const toneHistory = entries.map((e) => ({
    date: e.date || e.bin || e.toneminingdate || null,
    tone: parseFloat(e.tone || e.value || e.avg || 0),
    volume: parseInt(e.count || e.numarts || e.volume || 0, 10),
  }));

  const validTones = toneHistory.filter((t) => !isNaN(t.tone));
  const avgTone = validTones.length > 0
    ? validTones.reduce((sum, t) => sum + t.tone, 0) / validTones.length
    : 0;

  return { avgTone: Math.round(avgTone * 100) / 100, toneHistory };
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

  return articles.map((a) => ({
    title: a.title || a.urltitle || 'Untitled',
    url: a.url || a.sourceurl || '',
    source: a.source || a.domain || a.sourcecountry || 'Unknown',
    date: a.seendate || a.dateadded || a.date || null,
    tone: parseFloat(a.tone || 0),
    sourceCountry: a.sourcecountry || a.srccountry || null,
    language: a.language || a.lang || null,
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
   * Fetch tone over time for a given topic using GDELT ToneChart mode.
   * Returns { avgTone, toneHistory: [{ date, tone, volume }] }
   */
  async fetchNarrativeTone(topic) {
    const cacheKey = `narrative:tone:${topic.replace(/\s+/g, '_').toLowerCase()}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    console.log(`[Narrative] Fetching tone chart for "${topic}"...`);

    const url = buildGdeltUrl({
      query: topic,
      mode: 'ToneChart',
      timespan: '30d',
      format: 'json',
    });

    const data = await safeFetchJson(url, `ToneChart(${topic})`);
    const result = extractAvgToneFromChart(data);

    await cacheService.set(cacheKey, result, CACHE_TTL);
    return result;
  }

  // ─── 2. Fetch Top Narratives ─────────────────────────────────────────────────

  /**
   * Query GDELT for trending geopolitical narratives across tracked topics.
   * For each topic, fetches article volume, average tone, sentiment, and momentum.
   * Returns an array of narrative objects.
   */
  async fetchTopNarratives() {
    const cacheKey = 'narrative:top_narratives';
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    console.log('[Narrative] Fetching top narratives across tracked topics...');

    const narrativePromises = TRACKED_TOPICS.map(async (topicDef) => {
      try {
        // Fetch articles for this topic from the last 7 days
        const artUrl = buildGdeltUrl({
          query: topicDef.query,
          mode: 'ArtList',
          maxrecords: '50',
          timespan: '7d',
          format: 'json',
          sort: 'DateDesc',
        });

        // Fetch tone chart concurrently
        const toneUrl = buildGdeltUrl({
          query: topicDef.query,
          mode: 'ToneChart',
          timespan: '14d',
          format: 'json',
        });

        const [artData, toneData] = await Promise.all([
          safeFetchJson(artUrl, `ArtList(${topicDef.query})`),
          safeFetchJson(toneUrl, `ToneChart(${topicDef.query})`),
        ]);

        const articles = extractArticles(artData);
        const { avgTone, toneHistory } = extractAvgToneFromChart(toneData);

        // Compute article-level average tone as a fallback/supplement
        const articleTones = articles
          .map((a) => a.tone)
          .filter((t) => !isNaN(t) && t !== 0);
        const articleAvgTone = articleTones.length > 0
          ? articleTones.reduce((s, t) => s + t, 0) / articleTones.length
          : 0;

        // Blend GDELT chart tone with article-level tone
        const blendedTone = avgTone !== 0
          ? Math.round(((avgTone * 0.6) + (articleAvgTone * 0.4)) * 100) / 100
          : Math.round(articleAvgTone * 100) / 100;

        const sentiment = classifySentiment(blendedTone);
        const momentum = determineMomentum(toneHistory);

        // Select top articles by absolute tone (most opinionated)
        const topArticles = articles
          .sort((a, b) => Math.abs(b.tone) - Math.abs(a.tone))
          .slice(0, 5)
          .map((a) => ({
            title: a.title,
            url: a.url,
            source: a.source,
            date: a.date,
            tone: Math.round(a.tone * 100) / 100,
          }));

        return {
          id: hashString(topicDef.query),
          topic: topicDef.query,
          label: topicDef.label,
          articleCount: articles.length,
          avgTone: blendedTone,
          sentiment,
          momentum,
          toneHistory,
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
          sentiment: 'neutral',
          momentum: 'stable',
          toneHistory: [],
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

  // ─── 3. Fetch Sentiment by Country ──────────────────────────────────────────

  /**
   * Fetch articles about major countries and compute average tone per country.
   * Uses GDELT sourcecountry field to correlate media tone by origin.
   * Returns a map: { countryCode: { name, avgTone, sentiment, articleCount } }
   */
  async fetchSentimentByCountry() {
    const cacheKey = 'narrative:sentiment_by_country';
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    console.log('[Narrative] Fetching sentiment by country...');

    // Batch countries to avoid overwhelming the API
    const batchSize = 6;
    const sentimentMap = {};

    for (let i = 0; i < SENTIMENT_COUNTRIES.length; i += batchSize) {
      const batch = SENTIMENT_COUNTRIES.slice(i, i + batchSize);

      const batchPromises = batch.map(async (country) => {
        try {
          // Single ToneChart request per country (no ArtList needed for sentiment map)
          const url = buildGdeltUrl({
            query: `sourcecountry:${country.code}`,
            mode: 'ToneChart',
            timespan: '14d',
            format: 'json',
          });

          const data = await safeFetchJson(url, `CountryTone(${country.code})`);
          const { avgTone, toneHistory } = extractAvgToneFromChart(data);

          return {
            code: country.code,
            name: country.name,
            avgTone: avgTone,
            sentiment: classifySentiment(avgTone),
            articleCount: toneHistory.length || 0,
            toneHistory: toneHistory.slice(-7),
          };
        } catch (err) {
          console.warn(`[Narrative] Error fetching sentiment for ${country.code}:`, err.message);
          return {
            code: country.code,
            name: country.name,
            avgTone: 0,
            sentiment: 'neutral',
            articleCount: 0,
            toneHistory: [],
            error: err.message,
          };
        }
      });

      const batchResults = await Promise.allSettled(batchPromises);
      batchResults.forEach((r) => {
        if (r.status === 'fulfilled' && r.value) {
          sentimentMap[r.value.code] = r.value;
        }
      });

      // Small delay between batches to respect rate limits
      if (i + batchSize < SENTIMENT_COUNTRIES.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    console.log(`[Narrative] Sentiment map built for ${Object.keys(sentimentMap).length} countries`);
    await cacheService.set(cacheKey, sentimentMap, CACHE_TTL);
    return sentimentMap;
  }

  // ─── 4. Detect Narrative Divergence ──────────────────────────────────────────

  /**
   * Compare how the same story is covered in different source countries.
   * Picks top 5 active topics and compares tone from US, UK, Russia, China, India.
   * Flags divergences where tone difference exceeds 3 points.
   * Returns an array of divergence objects.
   */
  async detectNarrativeDivergence() {
    const cacheKey = 'narrative:divergence';
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    console.log('[Narrative] Detecting narrative divergence across source countries...');

    // Use top 5 topics by default
    const topTopics = TRACKED_TOPICS.slice(0, 5);
    const divergences = [];

    for (const topicDef of topTopics) {
      const countryTones = {};
      let hasData = false;

      const sourcePromises = DIVERGENCE_SOURCES.map(async (countryCode) => {
        try {
          // Single ToneChart request per topic×country (no ArtList needed for divergence)
          const url = buildGdeltUrl({
            query: `${topicDef.query} sourcecountry:${countryCode}`,
            mode: 'ToneChart',
            timespan: '14d',
            format: 'json',
          });

          const data = await safeFetchJson(url, `Divergence(${topicDef.query}/${countryCode})`);
          const { avgTone, toneHistory } = extractAvgToneFromChart(data);

          return {
            countryCode,
            avgTone,
            articleCount: toneHistory.length || 0,
            toneHistory: toneHistory.slice(-7),
          };
        } catch (err) {
          console.warn(`[Narrative] Divergence error for ${topicDef.query}/${countryCode}:`, err.message);
          return { countryCode, avgTone: 0, articleCount: 0, toneHistory: [] };
        }
      });

      const sourceResults = await Promise.allSettled(sourcePromises);
      sourceResults.forEach((r) => {
        if (r.status === 'fulfilled' && r.value) {
          countryTones[r.value.countryCode] = r.value;
          if (r.value.articleCount > 0) hasData = true;
        }
      });

      if (!hasData) continue;

      // Detect divergences: find pairs where tone differs by >3 points
      const countryCodes = Object.keys(countryTones);
      const flaggedPairs = [];
      let maxDivergence = 0;

      for (let i = 0; i < countryCodes.length; i++) {
        for (let j = i + 1; j < countryCodes.length; j++) {
          const a = countryTones[countryCodes[i]];
          const b = countryTones[countryCodes[j]];
          if (a.articleCount === 0 || b.articleCount === 0) continue;

          const diff = Math.abs(a.avgTone - b.avgTone);
          if (diff > maxDivergence) maxDivergence = diff;

          if (diff > 3) {
            flaggedPairs.push({
              countries: [countryCodes[i], countryCodes[j]],
              tones: [
                Math.round(a.avgTone * 100) / 100,
                Math.round(b.avgTone * 100) / 100,
              ],
              difference: Math.round(diff * 100) / 100,
            });
          }
        }
      }

      divergences.push({
        id: hashString(`div-${topicDef.query}`),
        topic: topicDef.query,
        label: topicDef.label,
        sources: countryTones,
        maxDivergence: Math.round(maxDivergence * 100) / 100,
        flaggedPairs,
        isDiverging: flaggedPairs.length > 0,
      });
    }

    // Sort by divergence magnitude
    divergences.sort((a, b) => b.maxDivergence - a.maxDivergence);

    console.log(
      `[Narrative] Divergence analysis complete: ${divergences.length} topics, ` +
      `${divergences.filter((d) => d.isDiverging).length} with significant divergence`
    );

    await cacheService.set(cacheKey, divergences, CACHE_TTL);
    return divergences;
  }

  // ─── 5. Get Combined Data ────────────────────────────────────────────────────

  /**
   * Main method: calls all sub-methods and returns a combined result.
   * Designed to be the single entry point for the API route.
   */
  async getCombinedData() {
    const cacheKey = 'narrative:combined';
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    console.log('[Narrative] Building combined narrative & sentiment data...');
    this.lastFetchTime = Date.now();

    try {
      // Run all three methods in parallel for faster loading
      const [narratives, divergences, sentimentMap] = await Promise.all([
        this.fetchTopNarratives().catch((err) => {
          console.error('[Narrative] fetchTopNarratives failed:', err.message);
          return [];
        }),
        this.detectNarrativeDivergence().catch((err) => {
          console.error('[Narrative] detectNarrativeDivergence failed:', err.message);
          return [];
        }),
        this.fetchSentimentByCountry().catch((err) => {
          console.error('[Narrative] fetchSentimentByCountry failed:', err.message);
          return {};
        }),
      ]);

      // Compute global summary statistics
      const totalArticles = narratives.reduce((sum, n) => sum + n.articleCount, 0);
      const allTones = narratives.filter((n) => n.articleCount > 0).map((n) => n.avgTone);
      const avgGlobalTone = allTones.length > 0
        ? Math.round((allTones.reduce((s, t) => s + t, 0) / allTones.length) * 100) / 100
        : 0;
      const divergenceCount = divergences.filter((d) => d.isDiverging).length;

      // Identify trending narratives (increasing momentum + high article count)
      const trending = narratives
        .filter((n) => n.momentum === 'increasing' || n.articleCount > 20)
        .sort((a, b) => b.articleCount - a.articleCount)
        .slice(0, 5)
        .map((n) => ({
          topic: n.topic,
          label: n.label,
          articleCount: n.articleCount,
          avgTone: n.avgTone,
          sentiment: n.sentiment,
          momentum: n.momentum,
        }));

      const result = {
        narratives,
        sentimentMap,
        divergences,
        trending,
        summary: {
          totalNarratives: narratives.length,
          totalArticles,
          avgGlobalTone,
          globalSentiment: classifySentiment(avgGlobalTone),
          divergenceCount,
          countriesTracked: Object.keys(sentimentMap).length,
          trendingCount: trending.length,
        },
        updatedAt: new Date().toISOString(),
      };

      await cacheService.set(cacheKey, result, CACHE_TTL);
      this.lastError = null;

      console.log(
        `[Narrative] Combined data ready: ${narratives.length} narratives, ` +
        `${Object.keys(sentimentMap).length} countries, ` +
        `${divergenceCount} divergences, ${totalArticles} articles`
      );

      return result;
    } catch (err) {
      console.error('[Narrative] getCombinedData failed:', err.message);
      this.lastError = err.message;

      // Return fallback structure so the frontend always gets a valid shape
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
      sentiment: 'neutral',
      momentum: 'stable',
      toneHistory: [],
      topArticles: [],
      error: errorMessage || 'Data unavailable',
    }));

    return {
      narratives: fallbackNarratives,
      sentimentMap: {},
      divergences: [],
      trending: [],
      summary: {
        totalNarratives: fallbackNarratives.length,
        totalArticles: 0,
        avgGlobalTone: 0,
        globalSentiment: 'neutral',
        divergenceCount: 0,
        countriesTracked: 0,
        trendingCount: 0,
      },
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
      trackedCountries: SENTIMENT_COUNTRIES.length,
      divergenceSources: DIVERGENCE_SOURCES.length,
      cacheTtl: CACHE_TTL,
    };
  }
}

export const narrativeService = new NarrativeService();
export default narrativeService;
