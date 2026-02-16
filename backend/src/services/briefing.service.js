/**
 * Auto-Generated Briefing Service
 * Aggregates data from all services into structured intelligence briefings
 * Provides "What's happening here?" situational awareness
 */

import { cacheService } from './cache.service.js';
import { aggregationService } from './aggregation.service.js';
import { tensionIndexService } from './tensionIndex.service.js';
import { countryRiskService } from './countryRisk.service.js';
import { disastersService } from './disasters.service.js';
import { cyberService } from './cyber.service.js';

const CACHE_KEY = 'briefing:global';
const CACHE_TTL = 600; // 10 minutes

function categorizeHeadlines(items) {
  const categories = {
    conflict: [],
    politics: [],
    economy: [],
    disaster: [],
    technology: [],
    other: [],
  };

  const patterns = {
    conflict: /\b(war|attack|strike|bomb|missile|military|troops|invasion|conflict|killed|casualties|ceasefire|ukraine|russia|israel|hamas|gaza)\b/i,
    politics: /\b(election|president|congress|parliament|vote|law|legislation|court|ruling|sanction|diplomacy|summit|treaty|policy)\b/i,
    economy: /\b(market|stock|trade|tariff|GDP|inflation|recession|fed|rate|oil|price|economy|fiscal|debt|deficit|bank)\b/i,
    disaster: /\b(earthquake|hurricane|flood|wildfire|tsunami|volcano|storm|drought|disaster|emergency|evacuation)\b/i,
    technology: /\b(AI|cyber|hack|data breach|tech|algorithm|regulation|social media|surveillance|quantum)\b/i,
  };

  (items || []).forEach(item => {
    const text = `${item.title || ''} ${item.summary || ''}`;
    let matched = false;
    for (const [category, pattern] of Object.entries(patterns)) {
      if (pattern.test(text)) {
        categories[category].push({
          title: item.title,
          source: item.sourceName || item.source,
          date: item.publishedAt,
          url: item.url,
        });
        matched = true;
        break;
      }
    }
    if (!matched) {
      categories.other.push({
        title: item.title,
        source: item.sourceName || item.source,
        date: item.publishedAt,
        url: item.url,
      });
    }
  });

  // Limit each category
  Object.keys(categories).forEach(key => {
    categories[key] = categories[key].slice(0, 5);
  });

  return categories;
}

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

    const categorizedHeadlines = categorizeHeadlines(feed);

    const result = {
      generatedAt: new Date().toISOString(),
      globalTension: tension ? {
        index: tension.index,
        label: tension.label,
        criticalConflicts: tension.summary?.criticalConflicts || 0,
      } : null,
      topRisks: risk ? risk.scores.slice(0, 10).map(s => ({
        country: s.country,
        score: s.score,
        level: s.level,
      })) : [],
      activeDisasters: disasters ? disasters.summary?.totalActive || 0 : 0,
      cyberThreats: cyber ? cyber.summary?.totalIncidents || 0 : 0,
      headlines: categorizedHeadlines,
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

    const countryRisk = risk?.scores?.find(s => s.country.toLowerCase() === countryName.toLowerCase());

    // Filter news for this country
    const countryNews = feed.filter(item => {
      const text = `${item.title || ''} ${item.summary || ''}`.toLowerCase();
      return text.includes(countryName.toLowerCase());
    }).slice(0, 10);

    const result = {
      country: countryName,
      riskScore: countryRisk?.score || null,
      riskLevel: countryRisk?.level || 'unknown',
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
