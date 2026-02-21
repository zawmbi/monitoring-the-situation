/**
 * Health & Pandemic Monitoring Service
 * Fetches disease outbreak data from WHO and health-related news via GDELT.
 *
 * Sources:
 *   - WHO Disease Outbreak News (DON) RSS (official WHO data)
 *   - GDELT Doc API (pandemic/health keywords)
 *
 * Cache: 30 minutes (health alerts don't change minute-by-minute)
 */

import Parser from 'rss-parser';
import { cacheService } from './cache.service.js';
import { fetchGDELT } from './gdelt.client.js';

const CACHE_KEY = 'health:combined';
const CACHE_TTL = 1800; // 30 minutes

const WHO_DON_RSS = 'https://www.who.int/feeds/entity/don/en/rss.xml';

const HEALTH_QUERIES = [
  'H5N1 bird flu pandemic human transmission',
  'WHO disease outbreak emergency declaration',
  'pandemic preparedness global health threat',
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

    const [whoResult, gdeltResult] = await Promise.allSettled([
      this.fetchWHOOutbreaks(),
      this.fetchHealthArticles(),
    ]);

    const outbreaks = whoResult.status === 'fulfilled' ? whoResult.value : [];
    const articles = gdeltResult.status === 'fulfilled' ? gdeltResult.value : [];

    const result = {
      outbreaks,
      articles,
      summary: {
        totalOutbreaks: outbreaks.length,
        totalArticles: articles.length,
      },
      dataSource: {
        outbreaks: 'WHO Disease Outbreak News RSS',
        articles: 'GDELT Doc API',
      },
      lastUpdated: new Date().toISOString(),
    };

    await cacheService.set(CACHE_KEY, result, CACHE_TTL);
    console.log(`[Health] ${outbreaks.length} outbreaks, ${articles.length} GDELT articles`);

    return result;
  }

  async fetchWHOOutbreaks() {
    try {
      const parsed = await this.rssParser.parseURL(WHO_DON_RSS);
      return (parsed.items || []).slice(0, 30).map(item => {
        const title = item.title || '';
        return {
          title,
          link: item.link,
          summary: (item.contentSnippet || item.content || '').replace(/<[^>]*>/g, '').substring(0, 400),
          publishedAt: item.pubDate || item.isoDate || new Date().toISOString(),
          source: 'WHO',
          type: 'outbreak',
          disease: this.extractDisease(title),
          region: this.extractRegion(title),
        };
      });
    } catch (err) {
      console.error('[Health] WHO DON fetch error:', err.message);
      return [];
    }
  }

  async fetchHealthArticles() {
    const allArticles = [];

    const results = await Promise.allSettled(
      HEALTH_QUERIES.map(query =>
        fetchGDELT(query, { maxRecords: 25, timespan: '7d', caller: 'Health' })
      )
    );

    results.forEach(r => {
      if (r.status === 'fulfilled') allArticles.push(...r.value);
    });

    // Deduplicate by URL
    const seen = new Set();
    return allArticles
      .filter(article => {
        if (seen.has(article.url)) return false;
        seen.add(article.url);
        return true;
      })
      .slice(0, 50);
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
}

export const healthService = new HealthService();
export default healthService;
