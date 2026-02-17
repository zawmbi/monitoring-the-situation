/**
 * Climate & Environment Monitoring Service
 * Fetches climate news from Google News RSS.
 *
 * Sources:
 *   - Google News RSS (climate change, extreme weather, COP/emissions keywords)
 *
 * Cache: 30 minutes
 */

import Parser from 'rss-parser';
import { cacheService } from './cache.service.js';

const CACHE_KEY = 'climate:combined';
const CACHE_TTL = 1800; // 30 minutes

const CLIMATE_QUERIES = [
  'climate change global warming',
  'extreme weather disaster 2026',
  'COP climate agreement emissions',
];

class ClimateService {
  constructor() {
    this.rssParser = new Parser({
      timeout: 15000,
      headers: { 'User-Agent': 'ClimateMonitor/1.0' },
    });
  }

  async getCombinedData() {
    const cached = await cacheService.get(CACHE_KEY);
    if (cached) return cached;

    console.log('[Climate] Fetching climate & environment data...');

    const [newsResult] = await Promise.allSettled([
      this.fetchClimateNews(),
    ]);

    const news = newsResult.status === 'fulfilled' ? newsResult.value : [];

    // Classify events by type
    const extremeWeather = news.filter(n => n.eventType === 'extreme-weather');
    const policy = news.filter(n => n.eventType === 'policy');
    const emissions = news.filter(n => n.eventType === 'emissions');
    const ecosystem = news.filter(n => n.eventType === 'ecosystem');

    const result = {
      news,
      summary: {
        extremeWeatherEvents: extremeWeather.length,
        policyUpdates: policy.length,
        emissionsArticles: emissions.length,
        ecosystemArticles: ecosystem.length,
        totalArticles: news.length,
      },
      lastUpdated: new Date().toISOString(),
    };

    await cacheService.set(CACHE_KEY, result, CACHE_TTL);
    console.log(`[Climate] ${news.length} articles fetched`);

    return result;
  }

  async fetchClimateNews() {
    const allItems = [];

    const results = await Promise.allSettled(
      CLIMATE_QUERIES.map(async (query) => {
        try {
          const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}+when:7d&hl=en-US&gl=US&ceid=US:en`;
          const parsed = await this.rssParser.parseURL(url);
          return (parsed.items || []).slice(0, 10).map(item => ({
            id: this.hashString(item.link || item.guid || item.title),
            title: item.title,
            link: item.link,
            summary: (item.contentSnippet || '').replace(/<[^>]*>/g, '').substring(0, 300),
            publishedAt: item.pubDate || item.isoDate || new Date().toISOString(),
            source: this.extractSource(item.title),
            type: 'news',
            eventType: this.classifyEventType(item.title, item.contentSnippet || ''),
            query,
          }));
        } catch (err) {
          console.error(`[Climate] News error (${query}):`, err.message);
          return [];
        }
      })
    );

    results.forEach(r => {
      if (r.status === 'fulfilled') allItems.push(...r.value);
    });

    // Deduplicate and sort
    const seen = new Set();
    return allItems
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
      .filter(item => {
        if (seen.has(item.link)) return false;
        seen.add(item.link);
        return true;
      })
      .slice(0, 40);
  }

  classifyEventType(title, content) {
    const text = `${title} ${content}`.toLowerCase();

    const extremeWeatherTerms = [
      'hurricane', 'typhoon', 'cyclone', 'tornado', 'flood', 'drought',
      'wildfire', 'heatwave', 'heat wave', 'blizzard', 'storm', 'extreme weather',
      'record temperature', 'ice melt', 'sea level', 'landslide', 'mudslide',
    ];
    const policyTerms = [
      'cop28', 'cop29', 'cop30', 'paris agreement', 'climate accord', 'climate policy',
      'emissions target', 'carbon tax', 'net zero', 'green deal', 'climate law',
      'climate regulation', 'climate summit', 'climate pledge', 'climate treaty',
    ];
    const emissionsTerms = [
      'carbon emission', 'greenhouse gas', 'co2', 'methane', 'carbon dioxide',
      'fossil fuel', 'coal', 'oil drilling', 'natural gas', 'decarbonize',
    ];

    if (extremeWeatherTerms.some(t => text.includes(t))) return 'extreme-weather';
    if (policyTerms.some(t => text.includes(t))) return 'policy';
    if (emissionsTerms.some(t => text.includes(t))) return 'emissions';
    return 'ecosystem';
  }

  extractSource(title) {
    const match = title?.match(/ - ([^-]+)$/);
    return match ? match[1].trim() : 'Google News';
  }

  hashString(str) {
    let hash = 0;
    for (let i = 0; i < (str || '').length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return `climate-${Math.abs(hash).toString(36)}`;
  }
}

export const climateService = new ClimateService();
export default climateService;
