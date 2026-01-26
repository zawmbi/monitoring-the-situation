/**
 * News Service
 * Handles fetching from NewsAPI, GNews, and other news sources
 */

import config from '../config/index.js';
import { cacheService } from './cache.service.js';

const CACHE_KEYS = {
  topHeadlines: 'news:headlines',
  byCategory: (cat) => `news:category:${cat}`,
  search: (q) => `news:search:${q}`,
};

class NewsService {
  constructor() {
    this.hasApiKey = Boolean(config.newsApi.key);
  }

  /**
   * Fetch from NewsAPI
   */
  async fetchFromNewsApi(endpoint, params = {}) {
    if (!this.hasApiKey) {
      console.log('[News] No API key, using mock data');
      return this.getMockNews();
    }

    const url = new URL(`${config.newsApi.baseUrl}/${endpoint}`);
    url.searchParams.set('apiKey', config.newsApi.key);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

    try {
      const response = await fetch(url.toString());
      const data = await response.json();

      if (data.status === 'error') {
        console.error('[News] API error:', data.message);
        return [];
      }

      return (data.articles || []).map(article => this.normalizeArticle(article, 'newsapi'));
    } catch (error) {
      console.error('[News] Fetch error:', error.message);
      return [];
    }
  }

  /**
   * Normalize article to common format
   */
  normalizeArticle(article, source) {
    return {
      id: this.generateId(article.url || article.title),
      contentType: 'article',
      source: source,
      sourceName: article.source?.name || source,
      title: article.title,
      content: article.content || article.description,
      summary: article.description,
      url: article.url,
      imageUrl: article.urlToImage || article.image,
      author: article.author,
      publishedAt: article.publishedAt || new Date().toISOString(),
      fetchedAt: new Date().toISOString(),
    };
  }

  generateId(input) {
    // Simple hash for deduplication
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `news-${Math.abs(hash).toString(36)}`;
  }

  /**
   * Get top headlines
   */
  async getTopHeadlines(country = 'us', limit = 20) {
    const cacheKey = CACHE_KEYS.topHeadlines;
    
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const articles = await this.fetchFromNewsApi('top-headlines', {
      country,
      pageSize: limit,
    });

    await cacheService.set(cacheKey, articles, config.cache.news);
    return articles;
  }

  /**
   * Get news by category
   */
  async getByCategory(category, country = 'us', limit = 20) {
    const cacheKey = CACHE_KEYS.byCategory(category);
    
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const articles = await this.fetchFromNewsApi('top-headlines', {
      category,
      country,
      pageSize: limit,
    });

    await cacheService.set(cacheKey, articles, config.cache.news);
    return articles;
  }

  /**
   * Search news
   */
  async search(query, limit = 20) {
    const cacheKey = CACHE_KEYS.search(query.toLowerCase());
    
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const articles = await this.fetchFromNewsApi('everything', {
      q: query,
      sortBy: 'publishedAt',
      pageSize: limit,
    });

    await cacheService.set(cacheKey, articles, config.cache.news);
    return articles;
  }

  /**
   * Mock news for development without API key
   */
  getMockNews() {
    const mockArticles = [
      {
        title: 'Tech Giants Report Strong Quarterly Earnings',
        description: 'Major technology companies exceeded analyst expectations in their latest quarterly reports.',
        source: { name: 'Tech News Daily' },
        url: 'https://example.com/tech-earnings',
        urlToImage: 'https://picsum.photos/seed/1/800/400',
        author: 'Sarah Johnson',
        publishedAt: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        title: 'Global Markets Rally on Economic Optimism',
        description: 'Stock markets around the world surged as investors responded to positive economic indicators.',
        source: { name: 'Financial Times' },
        url: 'https://example.com/markets-rally',
        urlToImage: 'https://picsum.photos/seed/2/800/400',
        author: 'Michael Chen',
        publishedAt: new Date(Date.now() - 7200000).toISOString(),
      },
      {
        title: 'New Climate Agreement Reached at International Summit',
        description: 'World leaders announced a landmark agreement to reduce carbon emissions by 50% over the next decade.',
        source: { name: 'Global News Network' },
        url: 'https://example.com/climate-summit',
        urlToImage: 'https://picsum.photos/seed/3/800/400',
        author: 'Emma Williams',
        publishedAt: new Date(Date.now() - 10800000).toISOString(),
      },
      {
        title: 'Breakthrough in Renewable Energy Storage',
        description: 'Scientists announce a new battery technology that could revolutionize how we store solar and wind power.',
        source: { name: 'Science Daily' },
        url: 'https://example.com/energy-breakthrough',
        urlToImage: 'https://picsum.photos/seed/4/800/400',
        author: 'Dr. Robert Kim',
        publishedAt: new Date(Date.now() - 14400000).toISOString(),
      },
      {
        title: 'AI Assistant Market Expected to Triple by 2027',
        description: 'Industry analysts predict massive growth in artificial intelligence personal assistants over the next three years.',
        source: { name: 'Tech Insider' },
        url: 'https://example.com/ai-market',
        urlToImage: 'https://picsum.photos/seed/5/800/400',
        author: 'Jennifer Lee',
        publishedAt: new Date(Date.now() - 18000000).toISOString(),
      },
      {
        title: 'Historic Space Mission Launches Successfully',
        description: 'The joint international mission to study distant asteroids lifted off without incident early this morning.',
        source: { name: 'Space News' },
        url: 'https://example.com/space-launch',
        urlToImage: 'https://picsum.photos/seed/6/800/400',
        author: 'David Martinez',
        publishedAt: new Date(Date.now() - 21600000).toISOString(),
      },
      {
        title: 'Major Sports League Announces Expansion Teams',
        description: 'Two new cities will join the league starting next season, marking the largest expansion in two decades.',
        source: { name: 'Sports Network' },
        url: 'https://example.com/sports-expansion',
        urlToImage: 'https://picsum.photos/seed/7/800/400',
        author: 'Chris Thompson',
        publishedAt: new Date(Date.now() - 25200000).toISOString(),
      },
      {
        title: 'New Study Reveals Benefits of Mediterranean Diet',
        description: 'Researchers found significant health improvements in participants who followed the traditional eating pattern.',
        source: { name: 'Health Journal' },
        url: 'https://example.com/diet-study',
        urlToImage: 'https://picsum.photos/seed/8/800/400',
        author: 'Dr. Maria Santos',
        publishedAt: new Date(Date.now() - 28800000).toISOString(),
      },
    ];

    return mockArticles.map(article => this.normalizeArticle(article, 'mock'));
  }
}

export const newsService = new NewsService();
export default newsService;
