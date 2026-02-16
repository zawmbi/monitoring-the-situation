/**
 * Court Rulings & Major Legal Cases Service
 * Sources: Google News RSS for court rulings, SCOTUS blog RSS
 *          CourtListener API (free, no auth for basic)
 */

import { cacheService } from './cache.service.js';
import Parser from 'rss-parser';

const parser = new Parser({ timeout: 10000 });
const CACHE_KEY = 'court:combined';
const CACHE_TTL = 900; // 15 minutes

const RSS_SOURCES = [
  { url: 'https://news.google.com/rss/search?q=%22Supreme+Court%22+ruling+OR+decision&hl=en-US&gl=US&ceid=US:en', name: 'SCOTUS News' },
  { url: 'https://news.google.com/rss/search?q=%22court+ruling%22+OR+%22landmark+case%22+OR+%22ICC%22+ruling+OR+%22ICJ%22+ruling&hl=en-US&gl=US&ceid=US:en', name: 'Major Court Rulings' },
  { url: 'https://news.google.com/rss/search?q=%22antitrust%22+ruling+OR+%22trade+court%22+OR+%22sanctions+ruling%22&hl=en-US&gl=US&ceid=US:en', name: 'Trade & Antitrust' },
];

// Major pending/recent cases to track
const TRACKED_CASES = [
  { id: 'icc-netanyahu', court: 'ICC', title: 'ICC Arrest Warrant - Netanyahu', status: 'active', category: 'international', impact: 'high' },
  { id: 'icc-putin', court: 'ICC', title: 'ICC Arrest Warrant - Putin', status: 'active', category: 'international', impact: 'high' },
  { id: 'icj-genocide', court: 'ICJ', title: 'ICJ South Africa v. Israel Genocide Case', status: 'pending', category: 'international', impact: 'critical' },
  { id: 'scotus-term', court: 'SCOTUS', title: 'US Supreme Court 2025-26 Term', status: 'active', category: 'domestic', impact: 'high' },
  { id: 'trump-cases', court: 'Federal', title: 'Trump Federal Criminal Cases', status: 'pending', category: 'domestic', impact: 'critical' },
  { id: 'tiktok-ban', court: 'SCOTUS', title: 'TikTok Ban Challenge', status: 'decided', category: 'tech', impact: 'high' },
  { id: 'google-antitrust', court: 'Federal', title: 'Google Antitrust Ruling', status: 'active', category: 'tech', impact: 'high' },
  { id: 'meta-ftc', court: 'Federal', title: 'Meta FTC Antitrust Trial', status: 'active', category: 'tech', impact: 'high' },
];

async function fetchCourtNews() {
  const allItems = [];
  for (const source of RSS_SOURCES) {
    try {
      const feed = await parser.parseURL(source.url);
      (feed.items || []).forEach(item => {
        allItems.push({
          id: `court-${Buffer.from(item.link || item.title || '').toString('base64').slice(0, 20)}`,
          title: item.title,
          link: item.link,
          date: item.pubDate || item.isoDate,
          source: source.name,
          snippet: item.contentSnippet?.slice(0, 200) || '',
        });
      });
    } catch (err) {
      console.error(`[Court] RSS error for ${source.name}:`, err.message);
    }
  }
  // Dedup
  const seen = new Set();
  return allItems.filter(item => {
    const key = item.title?.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 40);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 30);
}

export const courtService = {
  async getCombinedData() {
    const cached = await cacheService.get(CACHE_KEY);
    if (cached) return cached;

    const news = await fetchCourtNews();

    const result = {
      trackedCases: TRACKED_CASES,
      recentNews: news,
      summary: {
        totalTracked: TRACKED_CASES.length,
        active: TRACKED_CASES.filter(c => c.status === 'active').length,
        pending: TRACKED_CASES.filter(c => c.status === 'pending').length,
        criticalImpact: TRACKED_CASES.filter(c => c.impact === 'critical').length,
      },
    };

    await cacheService.set(CACHE_KEY, result, CACHE_TTL);
    return result;
  },
};
