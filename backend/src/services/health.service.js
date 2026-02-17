/**
 * Health & Pandemic Monitoring Service
 * Fetches disease outbreak data from WHO, FDA drug shortages, and health news.
 *
 * Sources:
 *   - WHO Disease Outbreak News (DON) RSS
 *   - Google News RSS (pandemic/health keywords)
 *   - WHO Emergency declarations via news monitoring
 *
 * Cache: 30 minutes (health alerts don't change minute-by-minute)
 */

import Parser from 'rss-parser';
import { cacheService } from './cache.service.js';

const CACHE_KEY = 'health:combined';
const CACHE_TTL = 1800; // 30 minutes

const WHO_DON_RSS = 'https://www.who.int/feeds/entity/don/en/rss.xml';

const HEALTH_QUERIES = [
  'H5N1 bird flu pandemic human transmission',
  'WHO disease outbreak emergency declaration',
  'pandemic preparedness global health threat 2026',
  'drug shortage hospital crisis',
];

class HealthService {
  constructor() {
    this.rssParser = new Parser({
      timeout: 15000,
      headers: { 'User-Agent': 'HealthMonitor/1.0' },
    });
  }

  async getCombinedData() {
    const cached = await cacheService.get(CACHE_KEY);
    if (cached) return cached;

    console.log('[Health] Fetching health & pandemic data...');

    const [whoResult, newsResult] = await Promise.allSettled([
      this.fetchWHOOutbreaks(),
      this.fetchHealthNews(),
    ]);

    const outbreaks = whoResult.status === 'fulfilled' ? whoResult.value : [];
    const news = newsResult.status === 'fulfilled' ? newsResult.value : [];

    // Categorize outbreaks by threat level
    const critical = outbreaks.filter(o => o.threatLevel === 'critical');
    const elevated = outbreaks.filter(o => o.threatLevel === 'elevated');
    const monitoring = outbreaks.filter(o => o.threatLevel === 'monitoring');

    const result = {
      outbreaks,
      news,
      summary: {
        totalOutbreaks: outbreaks.length,
        criticalThreats: critical.length,
        elevatedThreats: elevated.length,
        monitoringThreats: monitoring.length,
        topThreats: critical.slice(0, 3).map(o => o.title),
      },
      lastUpdated: new Date().toISOString(),
    };

    await cacheService.set(CACHE_KEY, result, CACHE_TTL);
    console.log(`[Health] ${outbreaks.length} outbreaks, ${news.length} news articles`);

    return result;
  }

  async fetchWHOOutbreaks() {
    try {
      const parsed = await this.rssParser.parseURL(WHO_DON_RSS);
      return (parsed.items || []).slice(0, 30).map(item => {
        const title = item.title || '';
        const threatLevel = this.classifyThreatLevel(title, item.contentSnippet || '');

        return {
          id: this.hashString(item.link || item.guid || title),
          title,
          link: item.link,
          summary: (item.contentSnippet || item.content || '').replace(/<[^>]*>/g, '').substring(0, 400),
          publishedAt: item.pubDate || item.isoDate || new Date().toISOString(),
          source: 'WHO',
          type: 'outbreak',
          threatLevel,
          disease: this.extractDisease(title),
          region: this.extractRegion(title),
        };
      });
    } catch (err) {
      console.error('[Health] WHO DON fetch error:', err.message);
      return [];
    }
  }

  async fetchHealthNews() {
    const allItems = [];

    const results = await Promise.allSettled(
      HEALTH_QUERIES.map(async (query) => {
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
            query,
          }));
        } catch (err) {
          console.error(`[Health] News error (${query}):`, err.message);
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
      .slice(0, 30);
  }

  classifyThreatLevel(title, content) {
    const text = `${title} ${content}`.toLowerCase();
    const criticalTerms = ['pandemic', 'emergency', 'pheic', 'h5n1 human', 'human-to-human', 'sustained transmission', 'novel virus'];
    const elevatedTerms = ['outbreak', 'epidemic', 'surge', 'cluster', 'spreading', 'mutation', 'variant'];

    if (criticalTerms.some(t => text.includes(t))) return 'critical';
    if (elevatedTerms.some(t => text.includes(t))) return 'elevated';
    return 'monitoring';
  }

  extractDisease(title) {
    const diseases = [
      'H5N1', 'H7N9', 'bird flu', 'avian influenza', 'COVID', 'SARS',
      'Ebola', 'Marburg', 'mpox', 'monkeypox', 'cholera', 'dengue',
      'Zika', 'malaria', 'measles', 'polio', 'plague', 'Nipah',
      'Lassa', 'MERS', 'yellow fever', 'typhoid', 'hepatitis',
    ];
    const lower = title.toLowerCase();
    for (const d of diseases) {
      if (lower.includes(d.toLowerCase())) return d;
    }
    return 'Other';
  }

  extractRegion(title) {
    const regions = {
      Africa: ['africa', 'congo', 'nigeria', 'kenya', 'sudan', 'ethiopia', 'ghana', 'tanzania'],
      'Middle East': ['iran', 'iraq', 'syria', 'yemen', 'saudi', 'jordan', 'lebanon'],
      Asia: ['china', 'india', 'indonesia', 'bangladesh', 'vietnam', 'thailand', 'myanmar', 'japan', 'korea'],
      Europe: ['europe', 'france', 'germany', 'uk', 'italy', 'spain', 'poland'],
      Americas: ['brazil', 'mexico', 'usa', 'united states', 'colombia', 'argentina', 'peru'],
    };
    const lower = title.toLowerCase();
    for (const [region, keywords] of Object.entries(regions)) {
      if (keywords.some(k => lower.includes(k))) return region;
    }
    return 'Global';
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
    return `health-${Math.abs(hash).toString(36)}`;
  }
}

export const healthService = new HealthService();
export default healthService;
