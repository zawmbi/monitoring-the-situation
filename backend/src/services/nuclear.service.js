/**
 * Nuclear Threat Monitoring Service
 * Fetches nuclear-related news from Google News RSS and computes risk scores.
 *
 * Sources:
 *   - Google News RSS (nuclear weapons, proliferation, ICBM keywords)
 *
 * Cache: 30 minutes
 */

import Parser from 'rss-parser';
import { cacheService } from './cache.service.js';

const CACHE_KEY = 'nuclear:combined';
const CACHE_TTL = 1800; // 30 minutes

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

class NuclearService {
  constructor() {
    this.rssParser = new Parser({
      timeout: 15000,
      headers: { 'User-Agent': 'NuclearMonitor/1.0' },
    });
  }

  async getCombinedData() {
    const cached = await cacheService.get(CACHE_KEY);
    if (cached) return cached;

    console.log('[Nuclear] Fetching nuclear threat data...');

    const [newsResult] = await Promise.allSettled([
      this.fetchNuclearNews(),
    ]);

    const news = newsResult.status === 'fulfilled' ? newsResult.value : [];

    // Compute composite risk score
    const riskScore = this.computeRiskScore(news);
    const riskLabel = this.getRiskLabel(riskScore);

    // Annotate nuclear states with mention counts
    const nuclearStates = NUCLEAR_STATES.map(state => ({
      ...state,
      mentionCount: news.filter(n => this.mentionsState(n, state)).length,
    }));

    const result = {
      riskScore,
      riskLabel,
      news,
      nuclearStates,
      lastUpdated: new Date().toISOString(),
    };

    await cacheService.set(CACHE_KEY, result, CACHE_TTL);
    console.log(`[Nuclear] ${news.length} articles, risk score: ${riskScore}`);

    return result;
  }

  async fetchNuclearNews() {
    const allItems = [];

    const results = await Promise.allSettled(
      NUCLEAR_QUERIES.map(async (query) => {
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
            severity: this.classifySeverity(item.title, item.contentSnippet || ''),
            query,
          }));
        } catch (err) {
          console.error(`[Nuclear] News error (${query}):`, err.message);
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

  computeRiskScore(news) {
    if (news.length === 0) return 15; // baseline low risk

    // Base score from article volume
    let score = Math.min(news.length * 2, 30);

    // Keyword severity multiplier
    const allText = news.map(n => `${n.title} ${n.summary}`).join(' ').toLowerCase();

    const criticalTerms = [
      'nuclear war', 'nuclear strike', 'first strike', 'launch detected',
      'nuclear detonation', 'nuclear attack', 'defcon', 'nuclear exchange',
    ];
    const highTerms = [
      'icbm test', 'missile launch', 'nuclear threat', 'nuclear escalation',
      'warhead', 'tactical nuclear', 'nuclear alert', 'nuclear readiness',
      'nuclear posture', 'hypersonic missile',
    ];
    const mediumTerms = [
      'nuclear proliferation', 'uranium enrichment', 'plutonium', 'centrifuge',
      'nuclear program', 'arms race', 'nuclear treaty', 'nuclear deal',
      'missile test', 'ballistic missile',
    ];

    const criticalHits = criticalTerms.filter(t => allText.includes(t)).length;
    const highHits = highTerms.filter(t => allText.includes(t)).length;
    const mediumHits = mediumTerms.filter(t => allText.includes(t)).length;

    score += criticalHits * 15;
    score += highHits * 8;
    score += mediumHits * 3;

    return Math.min(Math.max(Math.round(score), 0), 100);
  }

  getRiskLabel(score) {
    if (score >= 80) return 'CRITICAL';
    if (score >= 60) return 'HIGH';
    if (score >= 40) return 'ELEVATED';
    if (score >= 20) return 'GUARDED';
    return 'LOW';
  }

  classifySeverity(title, content) {
    const text = `${title} ${content}`.toLowerCase();
    const criticalTerms = ['nuclear war', 'nuclear strike', 'launch', 'detonation', 'nuclear attack'];
    const highTerms = ['icbm', 'missile test', 'warhead', 'tactical nuclear', 'nuclear threat'];

    if (criticalTerms.some(t => text.includes(t))) return 'critical';
    if (highTerms.some(t => text.includes(t))) return 'high';
    return 'medium';
  }

  mentionsState(article, state) {
    const text = `${article.title} ${article.summary}`.toLowerCase();
    const searchTerms = [state.name.toLowerCase(), state.code.toLowerCase()];

    // Add common alternative names
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
    return `nuclear-${Math.abs(hash).toString(36)}`;
  }
}

export const nuclearService = new NuclearService();
export default nuclearService;
