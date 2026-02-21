/**
 * Briefing Service
 * Aggregates raw data from upstream services into structured briefings.
 * No custom scoring or composite analysis — just raw data passthrough
 * with clear attribution to upstream data sources.
 */

import { cacheService } from './cache.service.js';
import { aggregationService } from './aggregation.service.js';
import { tensionIndexService } from './tensionIndex.service.js';
import { countryRiskService } from './countryRisk.service.js';
import { disastersService } from './disasters.service.js';
import { cyberService } from './cyber.service.js';

const CACHE_KEY = 'briefing:global';
const CACHE_TTL = 600; // 10 minutes

export const briefingService = {
  async getGlobalBriefing() {
    const cached = await cacheService.get(CACHE_KEY);
    if (cached) return cached;

    const [feedResult, tensionResult, riskResult, disasterResult, cyberResult] = await Promise.allSettled([
      aggregationService.getCombinedFeed({ limit: 50 }),
      tensionIndexService.getGlobalTension(),
      countryRiskService.getCountryRiskScores(),
      disastersService.getCombinedData(),
      cyberService.getCombinedData(),
    ]);

    const feed = feedResult.status === 'fulfilled' ? feedResult.value : [];
    const tension = tensionResult.status === 'fulfilled' ? tensionResult.value : null;
    const risk = riskResult.status === 'fulfilled' ? riskResult.value : null;
    const disasters = disasterResult.status === 'fulfilled' ? disasterResult.value : null;
    const cyber = cyberResult.status === 'fulfilled' ? cyberResult.value : null;

    const result = {
      generatedAt: new Date().toISOString(),

      // Raw tension data from upstream tensionIndexService
      globalTension: tension || null,

      // Raw country risk scores from upstream countryRiskService (top 10)
      topRisks: risk ? risk.scores.slice(0, 10) : [],

      // Raw disaster data from upstream disastersService
      activeDisasters: disasters || null,

      // Raw cyber incident data from upstream cyberService
      cyberThreats: cyber || null,

      // Recent headlines from aggregated feeds (no categorization or scoring)
      headlines: feed.slice(0, 20).map(item => ({
        title: item.title,
        source: item.sourceName || item.source,
        date: item.publishedAt,
        url: item.url,
        type: item.contentType,
      })),

      // Key developments — raw feed items
      keyDevelopments: feed.slice(0, 10).map(item => ({
        title: item.title,
        source: item.sourceName || item.source,
        date: item.publishedAt,
        url: item.url,
        type: item.contentType,
      })),
    };

    await cacheService.set(CACHE_KEY, result, CACHE_TTL);
    return result;
  },

  async getCountryBrief(countryName) {
    const cacheKey = `briefing:country:${countryName.toLowerCase()}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const [feedResult, riskResult] = await Promise.allSettled([
      aggregationService.getCombinedFeed({ limit: 100 }),
      countryRiskService.getCountryRiskScores(),
    ]);

    const feed = feedResult.status === 'fulfilled' ? feedResult.value : [];
    const risk = riskResult.status === 'fulfilled' ? riskResult.value : null;

    // Raw country risk data from upstream (no recomputation)
    const countryRisk = risk?.scores?.find(s => s.country.toLowerCase() === countryName.toLowerCase()) || null;

    // Filter news for this country
    const countryNews = feed.filter(item => {
      const text = `${item.title || ''} ${item.summary || ''}`.toLowerCase();
      return text.includes(countryName.toLowerCase());
    }).slice(0, 10);

    const result = {
      country: countryName,
      risk: countryRisk,
      recentNews: countryNews.map(item => ({
        title: item.title,
        source: item.sourceName || item.source,
        date: item.publishedAt,
        url: item.url,
      })),
      generatedAt: new Date().toISOString(),
    };

    await cacheService.set(cacheKey, result, 300);
    return result;
  },
};
