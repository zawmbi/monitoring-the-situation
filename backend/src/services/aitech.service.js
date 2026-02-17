/**
 * AI & Technology Regulation Monitoring Service
 * Fetches AI/tech news from Google News RSS.
 *
 * Sources:
 *   - Google News RSS (AI regulation, deepfakes, breakthroughs, crypto/CBDC)
 *
 * Cache: 30 minutes
 */

import Parser from 'rss-parser';
import { cacheService } from './cache.service.js';

const CACHE_KEY = 'aitech:combined';
const CACHE_TTL = 1800; // 30 minutes

const AITECH_QUERIES = [
  'AI regulation law 2026',
  'deepfake election disinformation',
  'AI artificial intelligence breakthrough',
  'cryptocurrency CBDC regulation',
];

class AITechService {
  constructor() {
    this.rssParser = new Parser({
      timeout: 15000,
      headers: { 'User-Agent': 'AITechMonitor/1.0' },
    });
  }

  async getCombinedData() {
    const cached = await cacheService.get(CACHE_KEY);
    if (cached) return cached;

    console.log('[AITech] Fetching AI & technology data...');

    const [newsResult] = await Promise.allSettled([
      this.fetchAITechNews(),
    ]);

    const news = newsResult.status === 'fulfilled' ? newsResult.value : [];

    // Classify by category
    const regulation = news.filter(n => n.category === 'regulation');
    const disinformation = news.filter(n => n.category === 'disinformation');
    const breakthrough = news.filter(n => n.category === 'breakthrough');
    const crypto = news.filter(n => n.category === 'crypto');

    const result = {
      news,
      summary: {
        regulationArticles: regulation.length,
        disinformationArticles: disinformation.length,
        breakthroughArticles: breakthrough.length,
        cryptoArticles: crypto.length,
        totalArticles: news.length,
      },
      lastUpdated: new Date().toISOString(),
    };

    await cacheService.set(CACHE_KEY, result, CACHE_TTL);
    console.log(`[AITech] ${news.length} articles fetched`);

    return result;
  }

  async fetchAITechNews() {
    const allItems = [];

    const results = await Promise.allSettled(
      AITECH_QUERIES.map(async (query) => {
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
            category: this.classifyCategory(item.title, item.contentSnippet || ''),
            query,
          }));
        } catch (err) {
          console.error(`[AITech] News error (${query}):`, err.message);
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

  classifyCategory(title, content) {
    const text = `${title} ${content}`.toLowerCase();

    const regulationTerms = [
      'regulation', 'law', 'legislation', 'ban', 'restrict', 'compliance',
      'eu ai act', 'executive order', 'policy', 'govern', 'oversight',
      'safety standard', 'ai safety', 'regulate', 'liability', 'framework',
    ];
    const disinformationTerms = [
      'deepfake', 'disinformation', 'misinformation', 'fake news', 'manipulation',
      'election interference', 'bot', 'propaganda', 'synthetic media', 'ai-generated',
      'social media manipulation', 'influence operation',
    ];
    const cryptoTerms = [
      'crypto', 'bitcoin', 'ethereum', 'blockchain', 'cbdc', 'digital currency',
      'stablecoin', 'defi', 'nft', 'token', 'web3', 'central bank digital',
    ];

    if (disinformationTerms.some(t => text.includes(t))) return 'disinformation';
    if (cryptoTerms.some(t => text.includes(t))) return 'crypto';
    if (regulationTerms.some(t => text.includes(t))) return 'regulation';
    return 'breakthrough';
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
    return `aitech-${Math.abs(hash).toString(36)}`;
  }
}

export const aitechService = new AITechService();
export default aitechService;
