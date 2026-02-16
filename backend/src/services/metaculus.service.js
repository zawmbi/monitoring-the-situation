/**
 * Metaculus Forecast Aggregation Service
 * Sources: Metaculus API (free, no auth for public questions)
 */

import { cacheService } from './cache.service.js';

const METACULUS_API = 'https://www.metaculus.com/api2';
const CACHE_KEY = 'metaculus:combined';
const CACHE_TTL = 900; // 15 minutes

// Geopolitical topic IDs on Metaculus
const GEOPOLITICAL_TAGS = [
  'geopolitics', 'nuclear', 'conflict', 'china', 'russia', 'ukraine',
  'elections', 'ai', 'climate', 'pandemic', 'economics',
];

async function fetchMetaculusQuestions(topic = '', limit = 20) {
  try {
    const params = new URLSearchParams({
      limit: String(limit),
      offset: '0',
      order_by: '-activity',
      status: 'open',
      type: 'forecast',
      has_group: 'false',
    });
    if (topic) params.set('search', topic);

    const url = `${METACULUS_API}/questions/?${params}`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(15000),
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) throw new Error(`Metaculus ${res.status}`);
    const data = await res.json();

    return (data.results || []).map(q => ({
      id: q.id,
      title: q.title,
      url: `https://www.metaculus.com/questions/${q.id}/`,
      status: q.status,
      type: q.possibilities?.type || 'binary',
      createdAt: q.created_time,
      closeTime: q.close_time,
      resolveTime: q.resolve_time,
      communityPrediction: q.community_prediction?.full?.q2 ?? null,
      numForecasters: q.number_of_forecasters || 0,
      numPredictions: q.number_of_predictions || 0,
      categories: (q.projects || []).map(p => p.name).filter(Boolean),
      description: q.description?.slice(0, 200) || '',
    }));
  } catch (err) {
    console.error(`[Metaculus] Fetch error for topic "${topic}":`, err.message);
    return [];
  }
}

export const metaculusService = {
  async getCombinedData() {
    const cached = await cacheService.get(CACHE_KEY);
    if (cached) return cached;

    // Fetch general geopolitical questions
    const results = await Promise.allSettled([
      fetchMetaculusQuestions('geopolitics war conflict', 15),
      fetchMetaculusQuestions('elections politics', 10),
      fetchMetaculusQuestions('nuclear AI catastrophic risk', 10),
      fetchMetaculusQuestions('economy recession inflation', 10),
    ]);

    // Merge and dedup
    const allQuestions = [];
    const seenIds = new Set();
    results.forEach(r => {
      if (r.status === 'fulfilled') {
        r.value.forEach(q => {
          if (!seenIds.has(q.id)) {
            seenIds.add(q.id);
            allQuestions.push(q);
          }
        });
      }
    });

    // Sort by number of forecasters (most active)
    allQuestions.sort((a, b) => b.numForecasters - a.numForecasters);

    const result = {
      questions: allQuestions.slice(0, 40),
      summary: {
        totalQuestions: allQuestions.length,
        avgForecasters: allQuestions.length > 0
          ? Math.round(allQuestions.reduce((s, q) => s + q.numForecasters, 0) / allQuestions.length)
          : 0,
        highProbability: allQuestions.filter(q => q.communityPrediction > 0.7).length,
        lowProbability: allQuestions.filter(q => q.communityPrediction !== null && q.communityPrediction < 0.3).length,
      },
    };

    await cacheService.set(CACHE_KEY, result, CACHE_TTL);
    return result;
  },

  async searchQuestions(query, limit = 10) {
    const cacheKey = `metaculus:search:${query}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const results = await fetchMetaculusQuestions(query, limit);
    await cacheService.set(cacheKey, results, 300);
    return results;
  },
};
