/**
 * Leadership Data Service
 * Tracks political leaders using Wikidata for biographical data and
 * GDELT for raw media coverage (article counts and tone).
 * Pure data passthrough — no influence scores, power rankings, or risk levels.
 *
 * Data sources:
 *   - Static LEADER_PROFILES (curated biographical baseline)
 *   - GDELT Project API (raw article counts and tone per leader)
 *   - Wikidata (basic biographical data via wikidataService)
 *
 * API: https://api.gdeltproject.org/api/v2/doc/doc (no key required)
 * Cache: 1 hour (leadership media coverage changes frequently).
 */

import { cacheService } from './cache.service.js';
import { wikidataService } from './wikidata.service.js';
import { fetchGDELTRaw } from './gdelt.client.js';

const GDELT_BASE = 'https://api.gdeltproject.org/api/v2/doc/doc';
const CACHE_TTL = 3600; // 1 hour

const CACHE_KEYS = {
  combined: 'leadership:combined',
  activity: 'leadership:activity',
  changes: 'leadership:changes',
};

// ─────────────────────────────────────────────────────────────────────────────
// LEADER PROFILES — Curated static data for 60+ world leaders
// ─────────────────────────────────────────────────────────────────────────────

const LEADER_PROFILES = [
  // ── North America ──
  { name: 'Donald Trump', country: 'United States', iso2: 'US', title: 'President', age: 79, inPowerSince: 2025, term: 'fixed', ideology: 'right', style: 'populist', nuclearAccess: true, keyAllies: ['IL', 'SA', 'HU'], keyRivals: ['CN', 'IR', 'RU'] },
  { name: 'Mark Carney', country: 'Canada', iso2: 'CA', title: 'Prime Minister', age: 60, inPowerSince: 2025, term: 'fixed', ideology: 'center-left', style: 'technocrat', nuclearAccess: false, keyAllies: ['US', 'GB', 'FR'], keyRivals: [] },
  { name: 'Claudia Sheinbaum', country: 'Mexico', iso2: 'MX', title: 'President', age: 63, inPowerSince: 2024, term: 'fixed', ideology: 'left', style: 'technocrat', nuclearAccess: false, keyAllies: ['BR', 'CO', 'CU'], keyRivals: [] },

  // ── Europe ──
  { name: 'Keir Starmer', country: 'United Kingdom', iso2: 'GB', title: 'Prime Minister', age: 63, inPowerSince: 2024, term: 'fixed', ideology: 'center-left', style: 'reformer', nuclearAccess: true, keyAllies: ['US', 'FR', 'DE'], keyRivals: [] },
  { name: 'Emmanuel Macron', country: 'France', iso2: 'FR', title: 'President', age: 47, inPowerSince: 2017, term: 'fixed', ideology: 'center', style: 'technocrat', nuclearAccess: true, keyAllies: ['DE', 'GB', 'US'], keyRivals: ['RU'] },
  { name: 'Friedrich Merz', country: 'Germany', iso2: 'DE', title: 'Chancellor', age: 69, inPowerSince: 2025, term: 'fixed', ideology: 'center-right', style: 'technocrat', nuclearAccess: false, keyAllies: ['FR', 'US', 'PL'], keyRivals: ['RU'] },
  { name: 'Giorgia Meloni', country: 'Italy', iso2: 'IT', title: 'Prime Minister', age: 48, inPowerSince: 2022, term: 'fixed', ideology: 'right', style: 'populist', nuclearAccess: false, keyAllies: ['US', 'GB', 'IL'], keyRivals: [] },
  { name: 'Pedro Sanchez', country: 'Spain', iso2: 'ES', title: 'Prime Minister', age: 53, inPowerSince: 2018, term: 'fixed', ideology: 'center-left', style: 'diplomat', nuclearAccess: false, keyAllies: ['FR', 'PT', 'DE'], keyRivals: [] },
  { name: 'Donald Tusk', country: 'Poland', iso2: 'PL', title: 'Prime Minister', age: 68, inPowerSince: 2023, term: 'fixed', ideology: 'center', style: 'diplomat', nuclearAccess: false, keyAllies: ['DE', 'FR', 'US'], keyRivals: ['RU', 'BY'] },
  { name: 'Viktor Orban', country: 'Hungary', iso2: 'HU', title: 'Prime Minister', age: 62, inPowerSince: 2010, term: 'fixed', ideology: 'right', style: 'strongman', nuclearAccess: false, keyAllies: ['RS', 'TR', 'CN'], keyRivals: [] },
  { name: 'Alexander De Croo', country: 'Belgium', iso2: 'BE', title: 'Prime Minister', age: 49, inPowerSince: 2020, term: 'fixed', ideology: 'center', style: 'technocrat', nuclearAccess: false, keyAllies: ['NL', 'FR', 'DE'], keyRivals: [] },
  { name: 'Dick Schoof', country: 'Netherlands', iso2: 'NL', title: 'Prime Minister', age: 67, inPowerSince: 2024, term: 'fixed', ideology: 'center-right', style: 'technocrat', nuclearAccess: false, keyAllies: ['DE', 'BE', 'US'], keyRivals: [] },
  { name: 'Alexander Stubb', country: 'Finland', iso2: 'FI', title: 'President', age: 56, inPowerSince: 2024, term: 'fixed', ideology: 'center-right', style: 'diplomat', nuclearAccess: false, keyAllies: ['SE', 'EE', 'US'], keyRivals: ['RU'] },
  { name: 'Ulf Kristersson', country: 'Sweden', iso2: 'SE', title: 'Prime Minister', age: 61, inPowerSince: 2022, term: 'fixed', ideology: 'center-right', style: 'technocrat', nuclearAccess: false, keyAllies: ['FI', 'NO', 'DK'], keyRivals: [] },
  { name: 'Jonas Gahr Store', country: 'Norway', iso2: 'NO', title: 'Prime Minister', age: 65, inPowerSince: 2021, term: 'fixed', ideology: 'center-left', style: 'diplomat', nuclearAccess: false, keyAllies: ['SE', 'DK', 'US'], keyRivals: ['RU'] },
  { name: 'Volodymyr Zelensky', country: 'Ukraine', iso2: 'UA', title: 'President', age: 47, inPowerSince: 2019, term: 'fixed', ideology: 'center', style: 'populist', nuclearAccess: false, keyAllies: ['US', 'GB', 'PL'], keyRivals: ['RU'] },
  { name: 'Aleksandar Vucic', country: 'Serbia', iso2: 'RS', title: 'President', age: 55, inPowerSince: 2017, term: 'fixed', ideology: 'center-right', style: 'strongman', nuclearAccess: false, keyAllies: ['CN', 'RU', 'HU'], keyRivals: ['XK'] },
  { name: 'Maia Sandu', country: 'Moldova', iso2: 'MD', title: 'President', age: 53, inPowerSince: 2020, term: 'fixed', ideology: 'center', style: 'reformer', nuclearAccess: false, keyAllies: ['RO', 'FR', 'DE'], keyRivals: ['RU'] },

  // ── Russia & Central Asia ──
  { name: 'Vladimir Putin', country: 'Russia', iso2: 'RU', title: 'President', age: 72, inPowerSince: 2000, term: 'indefinite', ideology: 'right', style: 'strongman', nuclearAccess: true, keyAllies: ['CN', 'IN', 'IR'], keyRivals: ['US', 'UA', 'GB'] },
  { name: 'Alexander Lukashenko', country: 'Belarus', iso2: 'BY', title: 'President', age: 71, inPowerSince: 1994, term: 'indefinite', ideology: 'far-right', style: 'strongman', nuclearAccess: false, keyAllies: ['RU', 'CN'], keyRivals: ['PL', 'LT'] },
  { name: 'Kassym-Jomart Tokayev', country: 'Kazakhstan', iso2: 'KZ', title: 'President', age: 72, inPowerSince: 2019, term: 'fixed', ideology: 'center-right', style: 'technocrat', nuclearAccess: false, keyAllies: ['RU', 'CN', 'TR'], keyRivals: [] },
  { name: 'Shavkat Mirziyoyev', country: 'Uzbekistan', iso2: 'UZ', title: 'President', age: 67, inPowerSince: 2016, term: 'constitutional-limit', ideology: 'center', style: 'reformer', nuclearAccess: false, keyAllies: ['KZ', 'TR', 'RU'], keyRivals: [] },

  // ── East Asia ──
  { name: 'Xi Jinping', country: 'China', iso2: 'CN', title: 'President', age: 72, inPowerSince: 2013, term: 'indefinite', ideology: 'far-left', style: 'strongman', nuclearAccess: true, keyAllies: ['RU', 'PK', 'KH'], keyRivals: ['US', 'TW', 'JP'] },
  { name: 'Shigeru Ishiba', country: 'Japan', iso2: 'JP', title: 'Prime Minister', age: 68, inPowerSince: 2024, term: 'fixed', ideology: 'center-right', style: 'diplomat', nuclearAccess: false, keyAllies: ['US', 'AU', 'IN'], keyRivals: ['CN', 'KP'] },
  { name: 'Lee Jae-myung', country: 'South Korea', iso2: 'KR', title: 'President', age: 61, inPowerSince: 2025, term: 'fixed', ideology: 'center-left', style: 'populist', nuclearAccess: false, keyAllies: ['US', 'JP', 'AU'], keyRivals: ['KP'] },
  { name: 'Kim Jong Un', country: 'North Korea', iso2: 'KP', title: 'Supreme Leader', age: 41, inPowerSince: 2011, term: 'indefinite', ideology: 'far-left', style: 'strongman', nuclearAccess: true, keyAllies: ['CN', 'RU'], keyRivals: ['US', 'KR', 'JP'] },
  { name: 'Lai Ching-te', country: 'Taiwan', iso2: 'TW', title: 'President', age: 65, inPowerSince: 2024, term: 'fixed', ideology: 'center-left', style: 'diplomat', nuclearAccess: false, keyAllies: ['US', 'JP'], keyRivals: ['CN'] },
  { name: 'Pham Minh Chinh', country: 'Vietnam', iso2: 'VN', title: 'Prime Minister', age: 67, inPowerSince: 2021, term: 'fixed', ideology: 'far-left', style: 'technocrat', nuclearAccess: false, keyAllies: ['CN', 'RU', 'JP'], keyRivals: [] },

  // ── South & Southeast Asia ──
  { name: 'Narendra Modi', country: 'India', iso2: 'IN', title: 'Prime Minister', age: 75, inPowerSince: 2014, term: 'fixed', ideology: 'right', style: 'strongman', nuclearAccess: true, keyAllies: ['US', 'JP', 'AU'], keyRivals: ['CN', 'PK'] },
  { name: 'Anwarul Haq Kamal', country: 'Pakistan', iso2: 'PK', title: 'Prime Minister', age: 62, inPowerSince: 2024, term: 'fixed', ideology: 'center-right', style: 'caretaker', nuclearAccess: true, keyAllies: ['CN', 'SA', 'TR'], keyRivals: ['IN'] },
  { name: 'Paetongtarn Shinawatra', country: 'Thailand', iso2: 'TH', title: 'Prime Minister', age: 39, inPowerSince: 2024, term: 'fixed', ideology: 'center', style: 'populist', nuclearAccess: false, keyAllies: ['CN', 'JP'], keyRivals: [] },
  { name: 'Prabowo Subianto', country: 'Indonesia', iso2: 'ID', title: 'President', age: 73, inPowerSince: 2024, term: 'fixed', ideology: 'center-right', style: 'strongman', nuclearAccess: false, keyAllies: ['CN', 'US', 'AU'], keyRivals: [] },
  { name: 'Ferdinand Marcos Jr', country: 'Philippines', iso2: 'PH', title: 'President', age: 67, inPowerSince: 2022, term: 'fixed', ideology: 'center-right', style: 'populist', nuclearAccess: false, keyAllies: ['US', 'JP', 'AU'], keyRivals: ['CN'] },
  { name: 'Lawrence Wong', country: 'Singapore', iso2: 'SG', title: 'Prime Minister', age: 52, inPowerSince: 2024, term: 'fixed', ideology: 'center', style: 'technocrat', nuclearAccess: false, keyAllies: ['US', 'AU', 'IN'], keyRivals: [] },
  { name: 'Anwar Ibrahim', country: 'Malaysia', iso2: 'MY', title: 'Prime Minister', age: 77, inPowerSince: 2022, term: 'fixed', ideology: 'center', style: 'reformer', nuclearAccess: false, keyAllies: ['ID', 'SG', 'TR'], keyRivals: [] },

  // ── Middle East ──
  { name: 'Benjamin Netanyahu', country: 'Israel', iso2: 'IL', title: 'Prime Minister', age: 76, inPowerSince: 2022, term: 'fixed', ideology: 'right', style: 'strongman', nuclearAccess: true, keyAllies: ['US'], keyRivals: ['IR', 'PS', 'LB'] },
  { name: 'Mohammed bin Salman', country: 'Saudi Arabia', iso2: 'SA', title: 'Crown Prince', age: 39, inPowerSince: 2017, term: 'indefinite', ideology: 'right', style: 'reformer', nuclearAccess: false, keyAllies: ['US', 'AE', 'EG'], keyRivals: ['IR', 'QA'] },
  { name: 'Masoud Pezeshkian', country: 'Iran', iso2: 'IR', title: 'President', age: 70, inPowerSince: 2024, term: 'fixed', ideology: 'center-left', style: 'reformer', nuclearAccess: false, keyAllies: ['RU', 'CN', 'SY'], keyRivals: ['US', 'IL', 'SA'] },
  { name: 'Recep Tayyip Erdogan', country: 'Turkey', iso2: 'TR', title: 'President', age: 71, inPowerSince: 2014, term: 'constitutional-limit', ideology: 'right', style: 'strongman', nuclearAccess: false, keyAllies: ['AZ', 'QA', 'PK'], keyRivals: ['GR', 'AM'] },
  { name: 'Abdel Fattah el-Sisi', country: 'Egypt', iso2: 'EG', title: 'President', age: 70, inPowerSince: 2014, term: 'constitutional-limit', ideology: 'center-right', style: 'strongman', nuclearAccess: false, keyAllies: ['SA', 'AE', 'US'], keyRivals: ['ET', 'TR'] },
  { name: 'Mohammed bin Rashid Al Maktoum', country: 'United Arab Emirates', iso2: 'AE', title: 'Prime Minister', age: 76, inPowerSince: 2006, term: 'indefinite', ideology: 'center-right', style: 'technocrat', nuclearAccess: false, keyAllies: ['SA', 'US', 'IN'], keyRivals: ['IR'] },
  { name: 'Tamim bin Hamad Al Thani', country: 'Qatar', iso2: 'QA', title: 'Emir', age: 45, inPowerSince: 2013, term: 'indefinite', ideology: 'center', style: 'diplomat', nuclearAccess: false, keyAllies: ['TR', 'US'], keyRivals: ['SA', 'AE'] },

  // ── Africa ──
  { name: 'Cyril Ramaphosa', country: 'South Africa', iso2: 'ZA', title: 'President', age: 72, inPowerSince: 2018, term: 'fixed', ideology: 'center-left', style: 'diplomat', nuclearAccess: false, keyAllies: ['CN', 'IN', 'BR'], keyRivals: [] },
  { name: 'Bola Tinubu', country: 'Nigeria', iso2: 'NG', title: 'President', age: 72, inPowerSince: 2023, term: 'fixed', ideology: 'center', style: 'populist', nuclearAccess: false, keyAllies: ['US', 'GB', 'FR'], keyRivals: [] },
  { name: 'William Ruto', country: 'Kenya', iso2: 'KE', title: 'President', age: 58, inPowerSince: 2022, term: 'fixed', ideology: 'center-right', style: 'populist', nuclearAccess: false, keyAllies: ['US', 'GB', 'AE'], keyRivals: [] },
  { name: 'Abiy Ahmed', country: 'Ethiopia', iso2: 'ET', title: 'Prime Minister', age: 49, inPowerSince: 2018, term: 'fixed', ideology: 'center', style: 'reformer', nuclearAccess: false, keyAllies: ['AE', 'CN', 'TR'], keyRivals: ['EG', 'ER'] },
  { name: 'Paul Kagame', country: 'Rwanda', iso2: 'RW', title: 'President', age: 67, inPowerSince: 2000, term: 'indefinite', ideology: 'center', style: 'strongman', nuclearAccess: false, keyAllies: ['GB', 'US'], keyRivals: ['CD'] },
  { name: 'Abdel Fattah al-Burhan', country: 'Sudan', iso2: 'SD', title: 'Chairman', age: 64, inPowerSince: 2019, term: 'indefinite', ideology: 'right', style: 'strongman', nuclearAccess: false, keyAllies: ['EG', 'SA'], keyRivals: [] },
  { name: 'Alassane Ouattara', country: 'Ivory Coast', iso2: 'CI', title: 'President', age: 83, inPowerSince: 2010, term: 'constitutional-limit', ideology: 'center-right', style: 'technocrat', nuclearAccess: false, keyAllies: ['FR', 'US'], keyRivals: [] },
  { name: 'Nana Akufo-Addo', country: 'Ghana', iso2: 'GH', title: 'President', age: 81, inPowerSince: 2017, term: 'constitutional-limit', ideology: 'center-right', style: 'diplomat', nuclearAccess: false, keyAllies: ['US', 'GB'], keyRivals: [] },

  // ── South America ──
  { name: 'Lula da Silva', country: 'Brazil', iso2: 'BR', title: 'President', age: 79, inPowerSince: 2023, term: 'fixed', ideology: 'left', style: 'populist', nuclearAccess: false, keyAllies: ['CN', 'IN', 'ZA'], keyRivals: [] },
  { name: 'Javier Milei', country: 'Argentina', iso2: 'AR', title: 'President', age: 55, inPowerSince: 2023, term: 'fixed', ideology: 'far-right', style: 'populist', nuclearAccess: false, keyAllies: ['US', 'IL'], keyRivals: ['BR'] },
  { name: 'Gustavo Petro', country: 'Colombia', iso2: 'CO', title: 'President', age: 65, inPowerSince: 2022, term: 'fixed', ideology: 'left', style: 'reformer', nuclearAccess: false, keyAllies: ['MX', 'BR'], keyRivals: [] },
  { name: 'Gabriel Boric', country: 'Chile', iso2: 'CL', title: 'President', age: 39, inPowerSince: 2022, term: 'fixed', ideology: 'left', style: 'reformer', nuclearAccess: false, keyAllies: ['CO', 'BR'], keyRivals: [] },
  { name: 'Daniel Noboa', country: 'Ecuador', iso2: 'EC', title: 'President', age: 37, inPowerSince: 2023, term: 'fixed', ideology: 'center-right', style: 'reformer', nuclearAccess: false, keyAllies: ['US', 'CO'], keyRivals: [] },
  { name: 'Nicolas Maduro', country: 'Venezuela', iso2: 'VE', title: 'President', age: 62, inPowerSince: 2013, term: 'indefinite', ideology: 'far-left', style: 'strongman', nuclearAccess: false, keyAllies: ['CU', 'RU', 'CN'], keyRivals: ['US', 'CO'] },

  // ── Oceania ──
  { name: 'Anthony Albanese', country: 'Australia', iso2: 'AU', title: 'Prime Minister', age: 62, inPowerSince: 2022, term: 'fixed', ideology: 'center-left', style: 'diplomat', nuclearAccess: false, keyAllies: ['US', 'JP', 'GB'], keyRivals: ['CN'] },
  { name: 'Christopher Luxon', country: 'New Zealand', iso2: 'NZ', title: 'Prime Minister', age: 54, inPowerSince: 2023, term: 'fixed', ideology: 'center-right', style: 'technocrat', nuclearAccess: false, keyAllies: ['AU', 'US', 'GB'], keyRivals: [] },
];

// ─────────────────────────────────────────────────────────────────────────────
// Region mapping for filtering
// ─────────────────────────────────────────────────────────────────────────────

const REGION_MAP = {
  US: 'North America', CA: 'North America', MX: 'North America',
  GB: 'Europe', FR: 'Europe', DE: 'Europe', IT: 'Europe', ES: 'Europe',
  PL: 'Europe', HU: 'Europe', BE: 'Europe', NL: 'Europe', FI: 'Europe',
  SE: 'Europe', NO: 'Europe', UA: 'Europe', RS: 'Europe', MD: 'Europe',
  RU: 'Russia & Central Asia', BY: 'Russia & Central Asia',
  KZ: 'Russia & Central Asia', UZ: 'Russia & Central Asia',
  CN: 'East Asia', JP: 'East Asia', KR: 'East Asia', KP: 'East Asia',
  TW: 'East Asia', VN: 'East Asia',
  IN: 'South & Southeast Asia', PK: 'South & Southeast Asia',
  TH: 'South & Southeast Asia', ID: 'South & Southeast Asia',
  PH: 'South & Southeast Asia', SG: 'South & Southeast Asia',
  MY: 'South & Southeast Asia',
  IL: 'Middle East', SA: 'Middle East', IR: 'Middle East', TR: 'Middle East',
  EG: 'Middle East', AE: 'Middle East', QA: 'Middle East',
  ZA: 'Africa', NG: 'Africa', KE: 'Africa', ET: 'Africa', RW: 'Africa',
  SD: 'Africa', CI: 'Africa', GH: 'Africa',
  BR: 'South America', AR: 'South America', CO: 'South America',
  CL: 'South America', EC: 'South America', VE: 'South America',
  AU: 'Oceania', NZ: 'Oceania',
};

// ─────────────────────────────────────────────────────────────────────────────
// Leadership Data Service
// ─────────────────────────────────────────────────────────────────────────────

class LeadershipService {
  /**
   * Fetch raw GDELT media activity for a specific leader.
   * Returns article count, average tone, and recent articles.
   * No visibility index or derived scores.
   */
  async fetchLeaderActivity(leaderName) {
    const cacheKey = `${CACHE_KEYS.activity}:${leaderName.replace(/\s+/g, '_').toLowerCase()}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    console.log(`[Leadership] Fetching GDELT activity for ${leaderName}...`);

    try {
      const query = encodeURIComponent(`"${leaderName}"`);
      const timespan = '7d';
      const url = `${GDELT_BASE}?query=${query}&mode=artlist&maxrecords=50&timespan=${timespan}&format=json&sort=datedesc`;

      const data = await fetchGDELTRaw(url, 'Leadership');
      if (!data || Object.keys(data).length === 0) {
        return this._emptyActivity();
      }
      const articles = data?.articles || [];

      const articleCount = articles.length;

      // Calculate average tone from raw GDELT tone scores
      const tones = articles
        .map((a) => parseFloat(a.tone))
        .filter((t) => !isNaN(t));
      const avgTone = tones.length > 0
        ? Math.round((tones.reduce((sum, t) => sum + t, 0) / tones.length) * 100) / 100
        : null;

      // Format recent articles for display
      const recentArticles = articles.slice(0, 10).map((a) => ({
        title: a.title || 'Untitled',
        url: a.url || '',
        source: a.domain || a.source || 'Unknown',
        date: a.seendate || a.dateadded || '',
        tone: parseFloat(a.tone) || 0,
        language: a.language || 'English',
      }));

      const result = { articleCount, avgTone, recentArticles };

      await cacheService.set(cacheKey, result, CACHE_TTL);
      return result;
    } catch (error) {
      if (error.name === 'TimeoutError') {
        console.warn(`[Leadership] GDELT timeout for ${leaderName}`);
      } else {
        console.error(`[Leadership] Activity fetch failed for ${leaderName}:`, error.message);
      }
      return this._emptyActivity();
    }
  }

  /**
   * Detect potential leadership changes by scanning GDELT for
   * destabilizing keywords associated with tracked leaders.
   * Returns raw matched articles — no severity classification.
   */
  async detectLeadershipChanges() {
    const cached = await cacheService.get(CACHE_KEYS.changes);
    if (cached) return cached;

    console.log('[Leadership] Scanning for leadership change indicators...');
    const alerts = [];

    try {
      const keywords = 'resignation OR impeachment OR "election result" OR coup OR "succession crisis" OR "removed from office"';
      const query = encodeURIComponent(keywords);
      const url = `${GDELT_BASE}?query=${query}&mode=artlist&maxrecords=75&timespan=3d&format=json&sort=datedesc`;

      const data = await fetchGDELTRaw(url, 'Leadership');
      if (data && Object.keys(data).length > 0) {
        const articles = data?.articles || [];

        // Match articles to tracked leaders
        for (const profile of LEADER_PROFILES) {
          const nameParts = profile.name.toLowerCase().split(' ');
          const lastName = nameParts[nameParts.length - 1];

          const matchedArticles = articles.filter((a) => {
            const title = (a.title || '').toLowerCase();
            return title.includes(lastName) || title.includes(profile.country.toLowerCase());
          });

          if (matchedArticles.length > 0) {
            alerts.push({
              leaderName: profile.name,
              country: profile.country,
              iso2: profile.iso2,
              articleCount: matchedArticles.length,
              articles: matchedArticles.slice(0, 5).map((a) => ({
                title: a.title || 'Untitled',
                url: a.url || '',
                date: a.seendate || '',
                tone: parseFloat(a.tone) || 0,
              })),
              detectedAt: new Date().toISOString(),
            });
          }
        }
      }

      // Sort by article count descending
      alerts.sort((a, b) => b.articleCount - a.articleCount);

      await cacheService.set(CACHE_KEYS.changes, alerts, CACHE_TTL);
      return alerts;
    } catch (error) {
      console.error('[Leadership] Change detection failed:', error.message);
      return alerts;
    }
  }

  /**
   * Main aggregation method. Returns leader profiles with raw GDELT activity data
   * and Wikidata cross-reference. No influence scores or power rankings.
   */
  async getCombinedData() {
    const cached = await cacheService.get(CACHE_KEYS.combined);
    if (cached) return cached;

    console.log('[Leadership] Building combined leadership data...');

    // Fetch Wikidata leaders for cross-referencing (best-effort)
    let wikidataLeaders = null;
    try {
      const wdResult = await wikidataService.getWorldLeaders();
      wikidataLeaders = wdResult?.leaders || null;
    } catch (error) {
      console.warn('[Leadership] Wikidata cross-reference unavailable:', error.message);
    }

    // Process all leader profiles in parallel batches to avoid rate limiting
    const BATCH_SIZE = 10;
    const leaders = [];

    for (let i = 0; i < LEADER_PROFILES.length; i += BATCH_SIZE) {
      const batch = LEADER_PROFILES.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.allSettled(
        batch.map(async (profile) => {
          const activity = await this.fetchLeaderActivity(profile.name);

          // Cross-reference with Wikidata if available
          let wdTitle = null;
          if (wikidataLeaders?.[profile.country]) {
            wdTitle = wikidataLeaders[profile.country].title;
          }

          const currentYear = new Date().getFullYear();
          const yearsInPower = currentYear - profile.inPowerSince;

          return {
            name: profile.name,
            country: profile.country,
            iso2: profile.iso2,
            title: wdTitle || profile.title,
            ideology: profile.ideology,
            style: profile.style,
            age: profile.age,
            inPowerSince: profile.inPowerSince,
            yearsInPower,
            term: profile.term,
            nuclearAccess: profile.nuclearAccess,
            keyAllies: profile.keyAllies,
            keyRivals: profile.keyRivals,
            region: REGION_MAP[profile.iso2] || 'Other',
            gdpiMediaActivity: {
              articleCount: activity.articleCount,
              avgTone: activity.avgTone,
            },
            recentArticles: activity.recentArticles,
          };
        })
      );

      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          leaders.push(result.value);
        }
      }
    }

    // Detect leadership changes
    const changeAlerts = await this.detectLeadershipChanges();

    // Summary statistics (factual counts only)
    const nuclearPowers = leaders.filter((l) => l.nuclearAccess).length;
    const totalTenure = leaders.reduce((sum, l) => sum + l.yearsInPower, 0);
    const avgTenure = leaders.length > 0 ? Math.round((totalTenure / leaders.length) * 10) / 10 : 0;

    const result = {
      leaders,
      changeAlerts,
      summary: {
        totalLeaders: leaders.length,
        nuclearPowers,
        avgTenure,
        changeAlerts: changeAlerts.length,
        regions: this._countByRegion(leaders),
        ideologyDistribution: this._countByField(leaders, 'ideology'),
        styleDistribution: this._countByField(leaders, 'style'),
      },
      dataSource: 'GDELT Project API v2, Wikidata SPARQL',
      updatedAt: new Date().toISOString(),
    };

    await cacheService.set(CACHE_KEYS.combined, result, CACHE_TTL);
    console.log(`[Leadership] Combined data ready: ${leaders.length} leaders, ${changeAlerts.length} change alerts`);

    return result;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Private helper methods
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Return an empty activity object for when GDELT fails.
   */
  _emptyActivity() {
    return { articleCount: 0, avgTone: null, recentArticles: [] };
  }

  /**
   * Count leaders by region for summary stats.
   */
  _countByRegion(leaders) {
    const counts = {};
    for (const leader of leaders) {
      const region = leader.region || 'Other';
      counts[region] = (counts[region] || 0) + 1;
    }
    return counts;
  }

  /**
   * Count leaders by an arbitrary field (ideology, style, etc.).
   */
  _countByField(leaders, field) {
    const counts = {};
    for (const leader of leaders) {
      const value = leader[field] || 'unknown';
      counts[value] = (counts[value] || 0) + 1;
    }
    return counts;
  }
}

export const leadershipService = new LeadershipService();
export default leadershipService;
