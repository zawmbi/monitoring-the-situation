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
 * Determine momentum from volume time-series data.
 * Compares recent (last 2 entries) vs prior (entries 3-7 from end) daily average.
 * Data comes sorted chronologically (oldest first), so we read from the end.
 */
function determineMomentum(entries) {
  if (!entries || entries.length < 3) return 'stable';
  const recent = entries.slice(-2);
  const prior = entries.slice(-7, -2);
  if (prior.length === 0) return 'stable';
  const recentAvg = recent.reduce((sum, a) => sum + (a.volume || a.value || 1), 0) / recent.length;
  const priorAvg = prior.reduce((sum, a) => sum + (a.volume || a.value || 1), 0) / prior.length;
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
 * ToneChart returns a HISTOGRAM of { bin, count } entries — NOT a time series.
 * bin = integer tone score (-21 to +10), count = number of articles in that bin.
 * We compute a weighted average: sum(bin * count) / sum(count).
 */
function extractAvgToneFromChart(chartData) {
  if (!chartData) return { avgTone: 0, totalArticles: 0 };

  let entries = [];
  if (chartData.tonechart && Array.isArray(chartData.tonechart)) {
    entries = chartData.tonechart;
  } else if (Array.isArray(chartData)) {
    entries = chartData;
  }

  if (entries.length === 0) {
    return { avgTone: 0, totalArticles: 0 };
  }

  let weightedSum = 0;
  let totalCount = 0;

  for (const e of entries) {
    const bin = parseFloat(e.bin ?? 0);
    const count = parseInt(e.count ?? 0, 10);
    if (isNaN(bin) || isNaN(count) || count === 0) continue;
    weightedSum += bin * count;
    totalCount += count;
  }

  const avgTone = totalCount > 0 ? Math.round((weightedSum / totalCount) * 100) / 100 : 0;
  return { avgTone, totalArticles: totalCount };
}

/**
 * Extract tone time-series from a GDELT TimelineTone response.
 * TimelineTone returns { timeline: [{ series, data: [{ date, value }] }] }
 * value = average tone for that day.
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
 * TimelineVol returns { timeline: [{ series, data: [{ date, value }] }] }
 * value = relative volume for that day.
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
 * Note: GDELT ArtList does NOT return per-article tone scores.
 * Fields available: url, url_mobile, title, seendate, socialimage, domain, language, sourcecountry
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
   * Fetch tone data for a given topic using GDELT ToneChart (histogram) +
   * TimelineTone (time-series).
   * Returns { avgTone, totalArticles, toneHistory: [{ date, tone }] }
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

    const { avgTone, totalArticles } = extractAvgToneFromChart(chartData);
    const toneHistory = extractToneTimeline(timelineData);

    const result = { avgTone, totalArticles, toneHistory };
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

        // Fetch tone histogram (for weighted average tone)
        const toneChartUrl = buildGdeltUrl({
          query: topicDef.query,
          mode: 'ToneChart',
          timespan: '14d',
          format: 'json',
        });

        // Fetch tone time-series (for tone history chart)
        const toneTimelineUrl = buildGdeltUrl({
          query: topicDef.query,
          mode: 'TimelineTone',
          timespan: '14d',
          format: 'json',
        });

        // Fetch volume time-series (for momentum detection)
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
        const { avgTone, totalArticles } = extractAvgToneFromChart(toneChartData);
        const toneHistory = extractToneTimeline(toneTimelineData);
        const volumeHistory = extractVolumeTimeline(volTimelineData);

        // Use article count from ToneChart histogram (more accurate than ArtList cap)
        const articleCount = totalArticles > 0 ? totalArticles : articles.length;

        const sentiment = classifySentiment(avgTone);
        const momentum = determineMomentum(volumeHistory);

        // Select top articles (most recent, since individual tone isn't available)
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
          sentiment,
          momentum,
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
          sentiment: 'neutral',
          momentum: 'stable',
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
          // Fetch tone histogram + tone time-series per country
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
            sentiment: classifySentiment(avgTone),
            articleCount: totalArticles || toneHistory.length || 0,
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
          // Fetch tone histogram + tone time-series per topic×country
          const [chartData, timelineData] = await Promise.all([
            safeFetchJson(buildGdeltUrl({
              query: `${topicDef.query} sourcecountry:${countryCode}`,
              mode: 'ToneChart', timespan: '14d', format: 'json',
            }), `DivChart(${topicDef.query}/${countryCode})`),
            safeFetchJson(buildGdeltUrl({
              query: `${topicDef.query} sourcecountry:${countryCode}`,
              mode: 'TimelineTone', timespan: '14d', format: 'json',
            }), `DivTimeline(${topicDef.query}/${countryCode})`),
          ]);

          const { avgTone, totalArticles } = extractAvgToneFromChart(chartData);
          const toneHistory = extractToneTimeline(timelineData);

          return {
            countryCode,
            avgTone,
            articleCount: totalArticles || toneHistory.length || 0,
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
