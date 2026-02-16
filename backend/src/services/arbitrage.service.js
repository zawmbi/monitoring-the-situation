/**
 * Prediction Market Arbitrage Detection Service
 * Compares Polymarket vs Kalshi odds for the same events
 * Detects divergences and potential arbitrage opportunities
 */

import { cacheService } from './cache.service.js';
import { polymarketService } from './polymarket.service.js';
import { kalshiService } from './kalshi.service.js';

const CACHE_KEY = 'arbitrage:opportunities';
const CACHE_TTL = 300; // 5 minutes

// Topics to scan for arbitrage
const SCAN_TOPICS = [
  { keywords: ['president', 'election', '2028'], boost: ['winner', 'nominee'] },
  { keywords: ['ukraine', 'russia', 'war'], boost: ['ceasefire', 'peace'] },
  { keywords: ['china', 'taiwan'], boost: ['invasion', 'conflict'] },
  { keywords: ['fed', 'interest', 'rate'], boost: ['cut', 'hike', 'FOMC'] },
  { keywords: ['recession', 'GDP', 'economy'], boost: ['2026', '2027'] },
  { keywords: ['bitcoin', 'crypto'], boost: ['price', 'ETF'] },
  { keywords: ['AI', 'artificial intelligence'], boost: ['regulation', 'GPT'] },
  { keywords: ['oil', 'OPEC', 'crude'], boost: ['price', 'barrel'] },
  { keywords: ['NATO', 'alliance'], boost: ['expansion', 'defense'] },
  { keywords: ['immigration', 'border'], boost: ['policy', 'wall'] },
];

function normalizeTitle(title) {
  return (title || '').toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function computeSimilarity(a, b) {
  const wordsA = new Set(normalizeTitle(a).split(' '));
  const wordsB = new Set(normalizeTitle(b).split(' '));
  const intersection = [...wordsA].filter(w => wordsB.has(w));
  const union = new Set([...wordsA, ...wordsB]);
  return intersection.length / union.size; // Jaccard similarity
}

function findMatches(polymarkets, kalshiMarkets) {
  const matches = [];

  for (const pm of polymarkets) {
    let bestMatch = null;
    let bestScore = 0;

    for (const km of kalshiMarkets) {
      const score = computeSimilarity(pm.question || pm.title, km.question || km.title);
      if (score > bestScore && score >= 0.35) {
        bestScore = score;
        bestMatch = km;
      }
    }

    if (bestMatch) {
      const pmPrice = pm.probability ?? pm.outcomePrices?.[0] ?? null;
      const kmPrice = bestMatch.probability ?? bestMatch.yes_price ?? null;

      if (pmPrice !== null && kmPrice !== null) {
        const divergence = Math.abs(pmPrice - kmPrice);
        if (divergence >= 0.03) { // At least 3% divergence
          matches.push({
            polymarket: {
              title: pm.question || pm.title,
              probability: pmPrice,
              volume: pm.volume || 0,
              url: pm.url,
            },
            kalshi: {
              title: bestMatch.question || bestMatch.title,
              probability: kmPrice,
              volume: bestMatch.volume || 0,
              url: bestMatch.url,
            },
            similarity: parseFloat(bestScore.toFixed(3)),
            divergence: parseFloat(divergence.toFixed(3)),
            divergencePct: parseFloat((divergence * 100).toFixed(1)),
            direction: pmPrice > kmPrice ? 'Polymarket higher' : 'Kalshi higher',
          });
        }
      }
    }
  }

  return matches.sort((a, b) => b.divergence - a.divergence);
}

export const arbitrageService = {
  async getOpportunities() {
    const cached = await cacheService.get(CACHE_KEY);
    if (cached) return cached;

    const allMatches = [];

    // Scan each topic
    for (const topic of SCAN_TOPICS) {
      try {
        const [pmResult, kmResult] = await Promise.allSettled([
          polymarketService.getMarketsByTopic(topic.keywords, topic.boost),
          kalshiService.getMarketsByTopic(topic.keywords, topic.boost),
        ]);

        const pmMarkets = pmResult.status === 'fulfilled' ? pmResult.value : [];
        const kmMarkets = kmResult.status === 'fulfilled' ? kmResult.value : [];

        if (pmMarkets.length > 0 && kmMarkets.length > 0) {
          const matches = findMatches(pmMarkets, kmMarkets);
          allMatches.push(...matches);
        }
      } catch (err) {
        console.error(`[Arbitrage] Error scanning topic:`, err.message);
      }
    }

    // Deduplicate
    const seen = new Set();
    const unique = allMatches.filter(m => {
      const key = normalizeTitle(m.polymarket.title).slice(0, 40);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const result = {
      opportunities: unique.slice(0, 20),
      summary: {
        totalScanned: SCAN_TOPICS.length,
        divergencesFound: unique.length,
        avgDivergence: unique.length > 0
          ? parseFloat((unique.reduce((s, m) => s + m.divergencePct, 0) / unique.length).toFixed(1))
          : 0,
        maxDivergence: unique.length > 0
          ? Math.max(...unique.map(m => m.divergencePct))
          : 0,
      },
      updatedAt: new Date().toISOString(),
    };

    await cacheService.set(CACHE_KEY, result, CACHE_TTL);
    return result;
  },
};
