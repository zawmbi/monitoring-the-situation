/**
 * Source Credibility Data Service
 * Pure data passthrough — returns raw GDELT tone data per source/topic:
 *   - Average tone, article count, source list from GDELT
 *   - Raw article metadata grouped by topic
 *
 * No sensationalism scoring, no tone extremity scoring, no credibility
 * assessment formulas, no composite credibility scores, no verification
 * status classifications.
 *
 * Sources: GDELT Project API (free, no auth)
 */

import { cacheService } from './cache.service.js';
import { fetchGDELTRaw } from './gdelt.client.js';

const CACHE_TTL = 600; // 10 minutes
const GDELT_BASE = 'https://api.gdeltproject.org/api/v2/doc/doc';

/* -- Helper utilities -- */

/**
 * Extract the root domain from a URL or domain string.
 */
function extractDomain(urlOrDomain) {
  if (!urlOrDomain) return null;
  try {
    let hostname = urlOrDomain;
    if (urlOrDomain.includes('://')) {
      hostname = new URL(urlOrDomain).hostname;
    }
    hostname = hostname.replace(/^www\./, '');
    return hostname.toLowerCase();
  } catch {
    return urlOrDomain.toLowerCase().replace(/^www\./, '');
  }
}

/**
 * Generate a deterministic ID from a string.
 */
function hashId(str) {
  let hash = 0;
  const s = str || '';
  for (let i = 0; i < s.length; i++) {
    const char = s.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/* -- Main Service Class -- */

class CredibilityService {
  /**
   * Fetch trending topics from GDELT and group by topic.
   * Returns raw article data grouped by topic with tone and source info.
   * No credibility scoring, no verification status.
   */
  async fetchTrendingClaims() {
    const cacheKey = 'credibility:claims';
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    try {
      const queries = [
        'conflict OR war OR military',
        'election OR vote OR political',
        'economy OR recession OR inflation',
        'climate OR disaster OR earthquake',
        'technology OR AI OR cyber',
      ];

      const allArticles = [];

      const results = await Promise.allSettled(
        queries.map(async (query) => {
          const encoded = encodeURIComponent(query);
          const url = `${GDELT_BASE}?query=${encoded}&mode=artlist&maxrecords=50&format=json&timespan=3d&sort=datedesc`;
          const data = await fetchGDELTRaw(url, 'Credibility');
          return data?.articles || [];
        })
      );

      for (const result of results) {
        if (result.status === 'fulfilled') {
          allArticles.push(...result.value);
        }
      }

      // Group articles by approximate topic (using title similarity)
      const claimGroups = new Map();

      for (const article of allArticles) {
        if (!article.title) continue;
        const titleNorm = article.title.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
        const titleKey = titleNorm.split(/\s+/).slice(0, 6).join(' ');

        if (!claimGroups.has(titleKey)) {
          claimGroups.set(titleKey, {
            id: `claim-${hashId(titleKey)}`,
            title: article.title,
            articles: [],
            sources: new Set(),
            countries: new Set(),
            tones: [],
          });
        }

        const group = claimGroups.get(titleKey);
        const domain = extractDomain(article.url || article.domain);
        group.articles.push(article);
        if (domain) group.sources.add(domain);
        if (article.sourcecountry) group.countries.add(article.sourcecountry);
        if (article.tone != null) group.tones.push(parseFloat(article.tone));
      }

      // Convert groups to claims array with raw data
      const claims = [];
      for (const [, group] of claimGroups) {
        if (group.sources.size < 2) continue; // Only include multi-source topics

        const uniqueSources = [...group.sources];
        const avgTone = group.tones.length > 0
          ? group.tones.reduce((sum, t) => sum + t, 0) / group.tones.length
          : null;

        claims.push({
          id: group.id,
          title: group.title,
          sourceCount: uniqueSources.length,
          sources: uniqueSources.slice(0, 8),
          countries: [...group.countries].slice(0, 5),
          avgTone: avgTone !== null ? Math.round(avgTone * 100) / 100 : null,
          articleCount: group.articles.length,
        });
      }

      // Sort by source count (higher = more widely reported), take top 20
      claims.sort((a, b) => b.sourceCount - a.sourceCount);
      const topClaims = claims.slice(0, 20);

      await cacheService.set(cacheKey, topClaims, CACHE_TTL);
      return topClaims;
    } catch (err) {
      console.error('[Credibility] Error fetching trending claims:', err.message);
      return [];
    }
  }

  /**
   * Fetch recent articles and return raw source/tone data grouped by topic.
   * No manipulation detection scoring -- just raw data about source
   * distribution and tone per topic cluster.
   */
  async getTopicSourceData() {
    const cacheKey = 'credibility:topicsources';
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    try {
      const query = encodeURIComponent('breaking OR crisis OR scandal OR threat OR war');
      const url = `${GDELT_BASE}?query=${query}&mode=artlist&maxrecords=100&format=json&timespan=2d&sort=datedesc`;
      const data = await fetchGDELTRaw(url, 'Credibility');
      const articles = data?.articles || [];

      // Group by approximate topic
      const topicGroups = new Map();
      for (const article of articles) {
        if (!article.title) continue;
        const key = article.title.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).slice(0, 5).join(' ');

        if (!topicGroups.has(key)) {
          topicGroups.set(key, {
            title: article.title,
            articles: [],
            sources: [],
            countries: [],
          });
        }

        const group = topicGroups.get(key);
        group.articles.push(article);
        const domain = extractDomain(article.url || article.domain);
        if (domain) group.sources.push(domain);
        if (article.sourcecountry) group.countries.push(article.sourcecountry);
      }

      const topics = [];

      for (const [, group] of topicGroups) {
        if (group.articles.length < 3) continue;

        const uniqueSources = [...new Set(group.sources)];
        const uniqueCountries = [...new Set(group.countries)];

        const tones = group.articles
          .filter(a => a.tone != null)
          .map(a => parseFloat(a.tone));
        const avgTone = tones.length > 0
          ? tones.reduce((s, t) => s + t, 0) / tones.length
          : null;

        // Country distribution
        const countryCounts = {};
        for (const c of group.countries) {
          countryCounts[c] = (countryCounts[c] || 0) + 1;
        }

        topics.push({
          id: `topic-${hashId(group.title)}`,
          title: group.title,
          articleCount: group.articles.length,
          sourceCount: uniqueSources.length,
          sources: uniqueSources.slice(0, 6),
          countries: uniqueCountries.slice(0, 5),
          countryDistribution: countryCounts,
          avgTone: avgTone !== null ? Math.round(avgTone * 100) / 100 : null,
        });
      }

      topics.sort((a, b) => b.articleCount - a.articleCount);
      const topTopics = topics.slice(0, 15);

      await cacheService.set(cacheKey, topTopics, CACHE_TTL);
      return topTopics;
    } catch (err) {
      console.error('[Credibility] Error getting topic source data:', err.message);
      return [];
    }
  }

  /**
   * Analyze source distribution across geographies from recent GDELT data.
   * Returns raw counts of articles by source country and domain.
   * No tier classification, no bias labels.
   */
  async getSourceDistribution() {
    const cacheKey = 'credibility:distribution';
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    try {
      const query = encodeURIComponent('*');
      const url = `${GDELT_BASE}?query=${query}&mode=artlist&maxrecords=100&format=json&timespan=1d&sort=datedesc`;
      const data = await fetchGDELTRaw(url, 'Credibility');
      const articles = data?.articles || [];

      const countryCounts = {};
      const domainCounts = {};
      const sourcesUsed = new Set();

      for (const article of articles) {
        const domain = extractDomain(article.url || article.domain);
        if (domain) {
          sourcesUsed.add(domain);
          domainCounts[domain] = (domainCounts[domain] || 0) + 1;
        }

        const country = article.sourcecountry || 'Unknown';
        countryCounts[country] = (countryCounts[country] || 0) + 1;
      }

      // Top countries
      const topCountries = Object.entries(countryCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 15)
        .map(([country, count]) => ({ country, count }));

      // Top domains
      const topDomains = Object.entries(domainCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 20)
        .map(([domain, count]) => ({ domain, count }));

      const distribution = {
        countries: topCountries,
        topDomains,
        totalArticles: articles.length,
        uniqueSources: sourcesUsed.size,
      };

      await cacheService.set(cacheKey, distribution, CACHE_TTL);
      return distribution;
    } catch (err) {
      console.error('[Credibility] Error getting source distribution:', err.message);
      return {
        countries: [],
        topDomains: [],
        totalArticles: 0,
        uniqueSources: 0,
      };
    }
  }

  /**
   * Main method: fetch and combine all raw GDELT data.
   * Returns a unified payload for the frontend.
   * No credibility scores, no verification statuses.
   */
  async getCombinedData() {
    const cacheKey = 'credibility:combined';
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const [claimsResult, topicSourceResult, distributionResult] = await Promise.allSettled([
      this.fetchTrendingClaims(),
      this.getTopicSourceData(),
      this.getSourceDistribution(),
    ]);

    const claims = claimsResult.status === 'fulfilled' ? claimsResult.value : [];
    const topicSources = topicSourceResult.status === 'fulfilled' ? topicSourceResult.value : [];
    const distribution = distributionResult.status === 'fulfilled' ? distributionResult.value : {};

    const result = {
      claims,
      topicSources,
      distribution,
      summary: {
        totalSources: distribution.uniqueSources || 0,
        totalArticlesAnalyzed: distribution.totalArticles || 0,
        trendingTopics: claims.length,
      },
      dataSources: [
        'GDELT Project — https://www.gdeltproject.org',
      ],
      updatedAt: new Date().toISOString(),
    };

    await cacheService.set(cacheKey, result, CACHE_TTL);
    return result;
  }
}

export const credibilityService = new CredibilityService();
