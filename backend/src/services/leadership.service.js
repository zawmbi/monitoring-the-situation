/**
 * Leadership Intelligence Service
 * Enhanced political leadership tracking and behavioral analysis.
 *
 * Builds on wikidata.service.js (basic leader data from Wikidata SPARQL)
 * by adding behavioral profiling, influence scoring, and change detection
 * using GDELT media analysis.
 *
 * Data sources:
 *   - Static LEADER_PROFILES (curated OSINT baseline)
 *   - GDELT Project API (media visibility, tone, topic association)
 *   - Wikidata (basic biographical data, pulled via wikidataService)
 *
 * API: https://api.gdeltproject.org/api/v2/doc/doc (no key required)
 * Rate limits: Generous but undocumented; we cache aggressively.
 * Cache: 1 hour (leadership media coverage changes frequently).
 */

import { cacheService } from './cache.service.js';
import { wikidataService } from './wikidata.service.js';

const GDELT_BASE = 'https://api.gdeltproject.org/api/v2/doc/doc';
const CACHE_TTL = 3600; // 1 hour

const CACHE_KEYS = {
  combined: 'leadership:combined',
  activity: 'leadership:activity',
  changes: 'leadership:changes',
};

// ─────────────────────────────────────────────────────────────────────────────
// LEADER PROFILES — Curated static intelligence for 60+ world leaders
// ─────────────────────────────────────────────────────────────────────────────

const LEADER_PROFILES = [
  // ── North America ──
  { name: 'Donald Trump', country: 'United States', iso2: 'US', title: 'President', age: 79, inPowerSince: 2025, term: 'fixed', ideology: 'right', style: 'populist', nuclearAccess: true, healthConcerns: true, successionCrisis: false, keyAllies: ['IL', 'SA', 'HU'], keyRivals: ['CN', 'IR', 'RU'] },
  { name: 'Mark Carney', country: 'Canada', iso2: 'CA', title: 'Prime Minister', age: 60, inPowerSince: 2025, term: 'fixed', ideology: 'center-left', style: 'technocrat', nuclearAccess: false, healthConcerns: false, successionCrisis: false, keyAllies: ['US', 'GB', 'FR'], keyRivals: [] },
  { name: 'Claudia Sheinbaum', country: 'Mexico', iso2: 'MX', title: 'President', age: 63, inPowerSince: 2024, term: 'fixed', ideology: 'left', style: 'technocrat', nuclearAccess: false, healthConcerns: false, successionCrisis: false, keyAllies: ['BR', 'CO', 'CU'], keyRivals: [] },

  // ── Europe ──
  { name: 'Keir Starmer', country: 'United Kingdom', iso2: 'GB', title: 'Prime Minister', age: 63, inPowerSince: 2024, term: 'fixed', ideology: 'center-left', style: 'reformer', nuclearAccess: true, healthConcerns: false, successionCrisis: false, keyAllies: ['US', 'FR', 'DE'], keyRivals: [] },
  { name: 'Emmanuel Macron', country: 'France', iso2: 'FR', title: 'President', age: 47, inPowerSince: 2017, term: 'fixed', ideology: 'center', style: 'technocrat', nuclearAccess: true, healthConcerns: false, successionCrisis: false, keyAllies: ['DE', 'GB', 'US'], keyRivals: ['RU'] },
  { name: 'Friedrich Merz', country: 'Germany', iso2: 'DE', title: 'Chancellor', age: 69, inPowerSince: 2025, term: 'fixed', ideology: 'center-right', style: 'technocrat', nuclearAccess: false, healthConcerns: false, successionCrisis: false, keyAllies: ['FR', 'US', 'PL'], keyRivals: ['RU'] },
  { name: 'Giorgia Meloni', country: 'Italy', iso2: 'IT', title: 'Prime Minister', age: 48, inPowerSince: 2022, term: 'fixed', ideology: 'right', style: 'populist', nuclearAccess: false, healthConcerns: false, successionCrisis: false, keyAllies: ['US', 'GB', 'IL'], keyRivals: [] },
  { name: 'Pedro Sanchez', country: 'Spain', iso2: 'ES', title: 'Prime Minister', age: 53, inPowerSince: 2018, term: 'fixed', ideology: 'center-left', style: 'diplomat', nuclearAccess: false, healthConcerns: false, successionCrisis: false, keyAllies: ['FR', 'PT', 'DE'], keyRivals: [] },
  { name: 'Donald Tusk', country: 'Poland', iso2: 'PL', title: 'Prime Minister', age: 68, inPowerSince: 2023, term: 'fixed', ideology: 'center', style: 'diplomat', nuclearAccess: false, healthConcerns: false, successionCrisis: false, keyAllies: ['DE', 'FR', 'US'], keyRivals: ['RU', 'BY'] },
  { name: 'Viktor Orban', country: 'Hungary', iso2: 'HU', title: 'Prime Minister', age: 62, inPowerSince: 2010, term: 'fixed', ideology: 'right', style: 'strongman', nuclearAccess: false, healthConcerns: false, successionCrisis: false, keyAllies: ['RS', 'TR', 'CN'], keyRivals: [] },
  { name: 'Alexander De Croo', country: 'Belgium', iso2: 'BE', title: 'Prime Minister', age: 49, inPowerSince: 2020, term: 'fixed', ideology: 'center', style: 'technocrat', nuclearAccess: false, healthConcerns: false, successionCrisis: false, keyAllies: ['NL', 'FR', 'DE'], keyRivals: [] },
  { name: 'Dick Schoof', country: 'Netherlands', iso2: 'NL', title: 'Prime Minister', age: 67, inPowerSince: 2024, term: 'fixed', ideology: 'center-right', style: 'technocrat', nuclearAccess: false, healthConcerns: false, successionCrisis: false, keyAllies: ['DE', 'BE', 'US'], keyRivals: [] },
  { name: 'Alexander Stubb', country: 'Finland', iso2: 'FI', title: 'President', age: 56, inPowerSince: 2024, term: 'fixed', ideology: 'center-right', style: 'diplomat', nuclearAccess: false, healthConcerns: false, successionCrisis: false, keyAllies: ['SE', 'EE', 'US'], keyRivals: ['RU'] },
  { name: 'Ulf Kristersson', country: 'Sweden', iso2: 'SE', title: 'Prime Minister', age: 61, inPowerSince: 2022, term: 'fixed', ideology: 'center-right', style: 'technocrat', nuclearAccess: false, healthConcerns: false, successionCrisis: false, keyAllies: ['FI', 'NO', 'DK'], keyRivals: [] },
  { name: 'Jonas Gahr Store', country: 'Norway', iso2: 'NO', title: 'Prime Minister', age: 65, inPowerSince: 2021, term: 'fixed', ideology: 'center-left', style: 'diplomat', nuclearAccess: false, healthConcerns: false, successionCrisis: false, keyAllies: ['SE', 'DK', 'US'], keyRivals: ['RU'] },
  { name: 'Volodymyr Zelensky', country: 'Ukraine', iso2: 'UA', title: 'President', age: 47, inPowerSince: 2019, term: 'fixed', ideology: 'center', style: 'populist', nuclearAccess: false, healthConcerns: false, successionCrisis: true, keyAllies: ['US', 'GB', 'PL'], keyRivals: ['RU'] },
  { name: 'Aleksandar Vucic', country: 'Serbia', iso2: 'RS', title: 'President', age: 55, inPowerSince: 2017, term: 'fixed', ideology: 'center-right', style: 'strongman', nuclearAccess: false, healthConcerns: false, successionCrisis: false, keyAllies: ['CN', 'RU', 'HU'], keyRivals: ['XK'] },
  { name: 'Maia Sandu', country: 'Moldova', iso2: 'MD', title: 'President', age: 53, inPowerSince: 2020, term: 'fixed', ideology: 'center', style: 'reformer', nuclearAccess: false, healthConcerns: false, successionCrisis: false, keyAllies: ['RO', 'FR', 'DE'], keyRivals: ['RU'] },

  // ── Russia & Central Asia ──
  { name: 'Vladimir Putin', country: 'Russia', iso2: 'RU', title: 'President', age: 72, inPowerSince: 2000, term: 'indefinite', ideology: 'right', style: 'strongman', nuclearAccess: true, healthConcerns: true, successionCrisis: true, keyAllies: ['CN', 'IN', 'IR'], keyRivals: ['US', 'UA', 'GB'] },
  { name: 'Alexander Lukashenko', country: 'Belarus', iso2: 'BY', title: 'President', age: 71, inPowerSince: 1994, term: 'indefinite', ideology: 'far-right', style: 'strongman', nuclearAccess: false, healthConcerns: true, successionCrisis: true, keyAllies: ['RU', 'CN'], keyRivals: ['PL', 'LT'] },
  { name: 'Kassym-Jomart Tokayev', country: 'Kazakhstan', iso2: 'KZ', title: 'President', age: 72, inPowerSince: 2019, term: 'fixed', ideology: 'center-right', style: 'technocrat', nuclearAccess: false, healthConcerns: false, successionCrisis: false, keyAllies: ['RU', 'CN', 'TR'], keyRivals: [] },
  { name: 'Shavkat Mirziyoyev', country: 'Uzbekistan', iso2: 'UZ', title: 'President', age: 67, inPowerSince: 2016, term: 'constitutional-limit', ideology: 'center', style: 'reformer', nuclearAccess: false, healthConcerns: false, successionCrisis: false, keyAllies: ['KZ', 'TR', 'RU'], keyRivals: [] },

  // ── East Asia ──
  { name: 'Xi Jinping', country: 'China', iso2: 'CN', title: 'President', age: 72, inPowerSince: 2013, term: 'indefinite', ideology: 'far-left', style: 'strongman', nuclearAccess: true, healthConcerns: false, successionCrisis: true, keyAllies: ['RU', 'PK', 'KH'], keyRivals: ['US', 'TW', 'JP'] },
  { name: 'Shigeru Ishiba', country: 'Japan', iso2: 'JP', title: 'Prime Minister', age: 68, inPowerSince: 2024, term: 'fixed', ideology: 'center-right', style: 'diplomat', nuclearAccess: false, healthConcerns: false, successionCrisis: false, keyAllies: ['US', 'AU', 'IN'], keyRivals: ['CN', 'KP'] },
  { name: 'Lee Jae-myung', country: 'South Korea', iso2: 'KR', title: 'President', age: 61, inPowerSince: 2025, term: 'fixed', ideology: 'center-left', style: 'populist', nuclearAccess: false, healthConcerns: false, successionCrisis: false, keyAllies: ['US', 'JP', 'AU'], keyRivals: ['KP'] },
  { name: 'Kim Jong Un', country: 'North Korea', iso2: 'KP', title: 'Supreme Leader', age: 41, inPowerSince: 2011, term: 'indefinite', ideology: 'far-left', style: 'strongman', nuclearAccess: true, healthConcerns: true, successionCrisis: true, keyAllies: ['CN', 'RU'], keyRivals: ['US', 'KR', 'JP'] },
  { name: 'Lai Ching-te', country: 'Taiwan', iso2: 'TW', title: 'President', age: 65, inPowerSince: 2024, term: 'fixed', ideology: 'center-left', style: 'diplomat', nuclearAccess: false, healthConcerns: false, successionCrisis: false, keyAllies: ['US', 'JP'], keyRivals: ['CN'] },
  { name: 'Pham Minh Chinh', country: 'Vietnam', iso2: 'VN', title: 'Prime Minister', age: 67, inPowerSince: 2021, term: 'fixed', ideology: 'far-left', style: 'technocrat', nuclearAccess: false, healthConcerns: false, successionCrisis: false, keyAllies: ['CN', 'RU', 'JP'], keyRivals: [] },

  // ── South & Southeast Asia ──
  { name: 'Narendra Modi', country: 'India', iso2: 'IN', title: 'Prime Minister', age: 75, inPowerSince: 2014, term: 'fixed', ideology: 'right', style: 'strongman', nuclearAccess: true, healthConcerns: false, successionCrisis: false, keyAllies: ['US', 'JP', 'AU'], keyRivals: ['CN', 'PK'] },
  { name: 'Anwarul Haq Kamal', country: 'Pakistan', iso2: 'PK', title: 'Prime Minister', age: 62, inPowerSince: 2024, term: 'fixed', ideology: 'center-right', style: 'caretaker', nuclearAccess: true, healthConcerns: false, successionCrisis: true, keyAllies: ['CN', 'SA', 'TR'], keyRivals: ['IN'] },
  { name: 'Paetongtarn Shinawatra', country: 'Thailand', iso2: 'TH', title: 'Prime Minister', age: 39, inPowerSince: 2024, term: 'fixed', ideology: 'center', style: 'populist', nuclearAccess: false, healthConcerns: false, successionCrisis: false, keyAllies: ['CN', 'JP'], keyRivals: [] },
  { name: 'Prabowo Subianto', country: 'Indonesia', iso2: 'ID', title: 'President', age: 73, inPowerSince: 2024, term: 'fixed', ideology: 'center-right', style: 'strongman', nuclearAccess: false, healthConcerns: false, successionCrisis: false, keyAllies: ['CN', 'US', 'AU'], keyRivals: [] },
  { name: 'Ferdinand Marcos Jr', country: 'Philippines', iso2: 'PH', title: 'President', age: 67, inPowerSince: 2022, term: 'fixed', ideology: 'center-right', style: 'populist', nuclearAccess: false, healthConcerns: false, successionCrisis: false, keyAllies: ['US', 'JP', 'AU'], keyRivals: ['CN'] },
  { name: 'Lawrence Wong', country: 'Singapore', iso2: 'SG', title: 'Prime Minister', age: 52, inPowerSince: 2024, term: 'fixed', ideology: 'center', style: 'technocrat', nuclearAccess: false, healthConcerns: false, successionCrisis: false, keyAllies: ['US', 'AU', 'IN'], keyRivals: [] },
  { name: 'Anwar Ibrahim', country: 'Malaysia', iso2: 'MY', title: 'Prime Minister', age: 77, inPowerSince: 2022, term: 'fixed', ideology: 'center', style: 'reformer', nuclearAccess: false, healthConcerns: false, successionCrisis: false, keyAllies: ['ID', 'SG', 'TR'], keyRivals: [] },

  // ── Middle East ──
  { name: 'Benjamin Netanyahu', country: 'Israel', iso2: 'IL', title: 'Prime Minister', age: 76, inPowerSince: 2022, term: 'fixed', ideology: 'right', style: 'strongman', nuclearAccess: true, healthConcerns: false, successionCrisis: false, keyAllies: ['US'], keyRivals: ['IR', 'PS', 'LB'] },
  { name: 'Mohammed bin Salman', country: 'Saudi Arabia', iso2: 'SA', title: 'Crown Prince', age: 39, inPowerSince: 2017, term: 'indefinite', ideology: 'right', style: 'reformer', nuclearAccess: false, healthConcerns: false, successionCrisis: false, keyAllies: ['US', 'AE', 'EG'], keyRivals: ['IR', 'QA'] },
  { name: 'Masoud Pezeshkian', country: 'Iran', iso2: 'IR', title: 'President', age: 70, inPowerSince: 2024, term: 'fixed', ideology: 'center-left', style: 'reformer', nuclearAccess: false, healthConcerns: false, successionCrisis: false, keyAllies: ['RU', 'CN', 'SY'], keyRivals: ['US', 'IL', 'SA'] },
  { name: 'Recep Tayyip Erdogan', country: 'Turkey', iso2: 'TR', title: 'President', age: 71, inPowerSince: 2014, term: 'constitutional-limit', ideology: 'right', style: 'strongman', nuclearAccess: false, healthConcerns: true, successionCrisis: false, keyAllies: ['AZ', 'QA', 'PK'], keyRivals: ['GR', 'AM'] },
  { name: 'Abdel Fattah el-Sisi', country: 'Egypt', iso2: 'EG', title: 'President', age: 70, inPowerSince: 2014, term: 'constitutional-limit', ideology: 'center-right', style: 'strongman', nuclearAccess: false, healthConcerns: false, successionCrisis: false, keyAllies: ['SA', 'AE', 'US'], keyRivals: ['ET', 'TR'] },
  { name: 'Mohammed bin Rashid Al Maktoum', country: 'United Arab Emirates', iso2: 'AE', title: 'Prime Minister', age: 76, inPowerSince: 2006, term: 'indefinite', ideology: 'center-right', style: 'technocrat', nuclearAccess: false, healthConcerns: false, successionCrisis: false, keyAllies: ['SA', 'US', 'IN'], keyRivals: ['IR'] },
  { name: 'Tamim bin Hamad Al Thani', country: 'Qatar', iso2: 'QA', title: 'Emir', age: 45, inPowerSince: 2013, term: 'indefinite', ideology: 'center', style: 'diplomat', nuclearAccess: false, healthConcerns: false, successionCrisis: false, keyAllies: ['TR', 'US'], keyRivals: ['SA', 'AE'] },

  // ── Africa ──
  { name: 'Cyril Ramaphosa', country: 'South Africa', iso2: 'ZA', title: 'President', age: 72, inPowerSince: 2018, term: 'fixed', ideology: 'center-left', style: 'diplomat', nuclearAccess: false, healthConcerns: false, successionCrisis: false, keyAllies: ['CN', 'IN', 'BR'], keyRivals: [] },
  { name: 'Bola Tinubu', country: 'Nigeria', iso2: 'NG', title: 'President', age: 72, inPowerSince: 2023, term: 'fixed', ideology: 'center', style: 'populist', nuclearAccess: false, healthConcerns: true, successionCrisis: false, keyAllies: ['US', 'GB', 'FR'], keyRivals: [] },
  { name: 'William Ruto', country: 'Kenya', iso2: 'KE', title: 'President', age: 58, inPowerSince: 2022, term: 'fixed', ideology: 'center-right', style: 'populist', nuclearAccess: false, healthConcerns: false, successionCrisis: false, keyAllies: ['US', 'GB', 'AE'], keyRivals: [] },
  { name: 'Abiy Ahmed', country: 'Ethiopia', iso2: 'ET', title: 'Prime Minister', age: 49, inPowerSince: 2018, term: 'fixed', ideology: 'center', style: 'reformer', nuclearAccess: false, healthConcerns: false, successionCrisis: false, keyAllies: ['AE', 'CN', 'TR'], keyRivals: ['EG', 'ER'] },
  { name: 'Paul Kagame', country: 'Rwanda', iso2: 'RW', title: 'President', age: 67, inPowerSince: 2000, term: 'indefinite', ideology: 'center', style: 'strongman', nuclearAccess: false, healthConcerns: false, successionCrisis: true, keyAllies: ['GB', 'US'], keyRivals: ['CD'] },
  { name: 'Abdel Fattah al-Burhan', country: 'Sudan', iso2: 'SD', title: 'Chairman', age: 64, inPowerSince: 2019, term: 'indefinite', ideology: 'right', style: 'strongman', nuclearAccess: false, healthConcerns: false, successionCrisis: true, keyAllies: ['EG', 'SA'], keyRivals: [] },
  { name: 'Alassane Ouattara', country: 'Ivory Coast', iso2: 'CI', title: 'President', age: 83, inPowerSince: 2010, term: 'constitutional-limit', ideology: 'center-right', style: 'technocrat', nuclearAccess: false, healthConcerns: true, successionCrisis: true, keyAllies: ['FR', 'US'], keyRivals: [] },
  { name: 'Nana Akufo-Addo', country: 'Ghana', iso2: 'GH', title: 'President', age: 81, inPowerSince: 2017, term: 'constitutional-limit', ideology: 'center-right', style: 'diplomat', nuclearAccess: false, healthConcerns: true, successionCrisis: false, keyAllies: ['US', 'GB'], keyRivals: [] },

  // ── South America ──
  { name: 'Lula da Silva', country: 'Brazil', iso2: 'BR', title: 'President', age: 79, inPowerSince: 2023, term: 'fixed', ideology: 'left', style: 'populist', nuclearAccess: false, healthConcerns: true, successionCrisis: false, keyAllies: ['CN', 'IN', 'ZA'], keyRivals: [] },
  { name: 'Javier Milei', country: 'Argentina', iso2: 'AR', title: 'President', age: 55, inPowerSince: 2023, term: 'fixed', ideology: 'far-right', style: 'populist', nuclearAccess: false, healthConcerns: false, successionCrisis: false, keyAllies: ['US', 'IL'], keyRivals: ['BR'] },
  { name: 'Gustavo Petro', country: 'Colombia', iso2: 'CO', title: 'President', age: 65, inPowerSince: 2022, term: 'fixed', ideology: 'left', style: 'reformer', nuclearAccess: false, healthConcerns: false, successionCrisis: false, keyAllies: ['MX', 'BR'], keyRivals: [] },
  { name: 'Gabriel Boric', country: 'Chile', iso2: 'CL', title: 'President', age: 39, inPowerSince: 2022, term: 'fixed', ideology: 'left', style: 'reformer', nuclearAccess: false, healthConcerns: false, successionCrisis: false, keyAllies: ['CO', 'BR'], keyRivals: [] },
  { name: 'Daniel Noboa', country: 'Ecuador', iso2: 'EC', title: 'President', age: 37, inPowerSince: 2023, term: 'fixed', ideology: 'center-right', style: 'reformer', nuclearAccess: false, healthConcerns: false, successionCrisis: false, keyAllies: ['US', 'CO'], keyRivals: [] },
  { name: 'Nicolas Maduro', country: 'Venezuela', iso2: 'VE', title: 'President', age: 62, inPowerSince: 2013, term: 'indefinite', ideology: 'far-left', style: 'strongman', nuclearAccess: false, healthConcerns: false, successionCrisis: true, keyAllies: ['CU', 'RU', 'CN'], keyRivals: ['US', 'CO'] },

  // ── Oceania ──
  { name: 'Anthony Albanese', country: 'Australia', iso2: 'AU', title: 'Prime Minister', age: 62, inPowerSince: 2022, term: 'fixed', ideology: 'center-left', style: 'diplomat', nuclearAccess: false, healthConcerns: false, successionCrisis: false, keyAllies: ['US', 'JP', 'GB'], keyRivals: ['CN'] },
  { name: 'Christopher Luxon', country: 'New Zealand', iso2: 'NZ', title: 'Prime Minister', age: 54, inPowerSince: 2023, term: 'fixed', ideology: 'center-right', style: 'technocrat', nuclearAccess: false, healthConcerns: false, successionCrisis: false, keyAllies: ['AU', 'US', 'GB'], keyRivals: [] },
];

// ─────────────────────────────────────────────────────────────────────────────
// Region mapping for filtering and analytics
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
// Leadership Intelligence Service
// ─────────────────────────────────────────────────────────────────────────────

class LeadershipService {
  /**
   * Fetch recent GDELT media activity for a specific leader.
   * Queries article volume, average tone, and associated topics.
   *
   * @param {string} leaderName - Full name of the leader (e.g. "Vladimir Putin")
   * @returns {{ visibility: number, tone: number, topics: string[], recentArticles: object[] }}
   */
  async fetchLeaderActivity(leaderName) {
    const cacheKey = `${CACHE_KEYS.activity}:${leaderName.replace(/\s+/g, '_').toLowerCase()}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    console.log(`[Leadership] Fetching GDELT activity for ${leaderName}...`);

    try {
      // Build GDELT doc API query for this leader
      const query = encodeURIComponent(`"${leaderName}"`);
      const timespan = '7d';
      const url = `${GDELT_BASE}?query=${query}&mode=artlist&maxrecords=50&timespan=${timespan}&format=json&sort=datedesc`;

      const res = await fetch(url, {
        headers: { 'User-Agent': 'Monitored/1.0 (leadership-intelligence)' },
        signal: AbortSignal.timeout(12000),
      });

      if (!res.ok) {
        console.warn(`[Leadership] GDELT responded ${res.status} for ${leaderName}`);
        return this._emptyActivity();
      }

      const data = await res.json();
      const articles = data?.articles || [];

      // Calculate visibility index (article count normalized to 0-100)
      const articleCount = articles.length;
      const visibility = Math.min(100, Math.round((articleCount / 50) * 100));

      // Calculate average tone from GDELT tone scores
      const tones = articles
        .map((a) => parseFloat(a.tone))
        .filter((t) => !isNaN(t));
      const tone = tones.length > 0
        ? Math.round((tones.reduce((sum, t) => sum + t, 0) / tones.length) * 100) / 100
        : 0;

      // Extract associated topics from article titles
      const topics = this._extractTopics(articles);

      // Format recent articles for display
      const recentArticles = articles.slice(0, 10).map((a) => ({
        title: a.title || 'Untitled',
        url: a.url || '',
        source: a.domain || a.source || 'Unknown',
        date: a.seendate || a.dateadded || '',
        tone: parseFloat(a.tone) || 0,
        language: a.language || 'English',
      }));

      const result = { visibility, tone, topics, recentArticles, articleCount };

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
   * Compute an influence score (0-100) for a leader based on profile + activity data.
   *
   * Scoring formula:
   *   - Media visibility:      0-25 pts (GDELT article volume)
   *   - Power concentration:   0-25 pts (term type + years in power)
   *   - Nuclear access:        0-15 pts (binary bonus)
   *   - Alliance network:      0-15 pts (number of key allies)
   *   - Global reach / tone:   0-10 pts (media coverage sentiment reach)
   *   - Style multiplier:      0.9x-1.1x (strongman boost, caretaker penalty)
   *
   * @param {object} profile - Static LEADER_PROFILES entry
   * @param {object} activity - Result from fetchLeaderActivity()
   * @returns {{ score: number, rank: number|null, factors: object[] }}
   */
  computeLeaderInfluenceScore(profile, activity) {
    const factors = [];
    let rawScore = 0;

    // 1. Media visibility (0-25)
    const visibilityPts = Math.round((activity.visibility / 100) * 25);
    rawScore += visibilityPts;
    factors.push({ name: 'Media Visibility', points: visibilityPts, max: 25 });

    // 2. Power concentration (0-25)
    const currentYear = new Date().getFullYear();
    const yearsInPower = currentYear - profile.inPowerSince;
    const tenurePts = Math.min(15, Math.round(yearsInPower * 0.75));

    let termPts = 0;
    if (profile.term === 'indefinite') termPts = 10;
    else if (profile.term === 'constitutional-limit') termPts = 5;
    else termPts = 2; // fixed

    const powerPts = Math.min(25, tenurePts + termPts);
    rawScore += powerPts;
    factors.push({ name: 'Power Concentration', points: powerPts, max: 25, detail: `${yearsInPower}y in power, ${profile.term} term` });

    // 3. Nuclear access (0-15)
    const nuclearPts = profile.nuclearAccess ? 15 : 0;
    rawScore += nuclearPts;
    factors.push({ name: 'Nuclear Access', points: nuclearPts, max: 15 });

    // 4. Alliance network (0-15)
    const allyCount = (profile.keyAllies?.length || 0) + (profile.keyRivals?.length || 0);
    const networkPts = Math.min(15, Math.round(allyCount * 2.5));
    rawScore += networkPts;
    factors.push({ name: 'Alliance Network', points: networkPts, max: 15, detail: `${profile.keyAllies?.length || 0} allies, ${profile.keyRivals?.length || 0} rivals` });

    // 5. Global reach / tone impact (0-10)
    const abstoneMagnitude = Math.abs(activity.tone);
    const reachPts = Math.min(10, Math.round(abstoneMagnitude * 1.5) + (activity.articleCount > 20 ? 3 : 0));
    rawScore += reachPts;
    factors.push({ name: 'Global Reach', points: reachPts, max: 10, detail: `tone: ${activity.tone}` });

    // 6. Style multiplier
    const styleMultipliers = {
      strongman: 1.10,
      populist: 1.05,
      technocrat: 1.00,
      diplomat: 0.98,
      reformer: 0.97,
      caretaker: 0.90,
    };
    const multiplier = styleMultipliers[profile.style] || 1.0;
    const finalScore = Math.min(100, Math.max(0, Math.round(rawScore * multiplier)));

    factors.push({ name: 'Style Modifier', points: multiplier, max: null, detail: `${profile.style} (${multiplier}x)` });

    return {
      score: finalScore,
      rank: null, // Rank is assigned later when all leaders are scored
      factors,
    };
  }

  /**
   * Detect potential leadership changes by scanning GDELT for
   * destabilizing keywords associated with tracked leaders.
   *
   * Monitors:
   *   - Resignation, impeachment, election, coup, succession keywords
   *   - Health alerts for leaders flagged with healthConcerns
   *   - Term limit approaching for constitutional-limit leaders
   *
   * @returns {object[]} Array of change alert objects
   */
  async detectLeadershipChanges() {
    const cached = await cacheService.get(CACHE_KEYS.changes);
    if (cached) return cached;

    console.log('[Leadership] Scanning for leadership change indicators...');
    const alerts = [];

    try {
      // 1. GDELT scan for leadership instability keywords
      const keywords = 'resignation OR impeachment OR "election result" OR coup OR "succession crisis" OR "removed from office"';
      const query = encodeURIComponent(keywords);
      const url = `${GDELT_BASE}?query=${query}&mode=artlist&maxrecords=75&timespan=3d&format=json&sort=datedesc`;

      const res = await fetch(url, {
        headers: { 'User-Agent': 'Monitored/1.0 (leadership-intelligence)' },
        signal: AbortSignal.timeout(12000),
      });

      if (res.ok) {
        const data = await res.json();
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
            const changeType = this._classifyChangeType(matchedArticles);
            const severity = this._assessChangeSeverity(profile, matchedArticles, changeType);

            alerts.push({
              id: `change-${profile.iso2}-${Date.now()}`,
              leaderName: profile.name,
              country: profile.country,
              iso2: profile.iso2,
              type: changeType,
              severity,
              articleCount: matchedArticles.length,
              description: this._buildChangeDescription(profile, changeType, matchedArticles.length),
              sources: matchedArticles.slice(0, 3).map((a) => ({
                title: a.title || 'Untitled',
                url: a.url || '',
                date: a.seendate || '',
              })),
              detectedAt: new Date().toISOString(),
            });
          }
        }
      }

      // 2. Health alerts for leaders with known health concerns
      for (const profile of LEADER_PROFILES) {
        if (!profile.healthConcerns) continue;

        const existingAlert = alerts.find((a) => a.iso2 === profile.iso2);
        if (existingAlert) continue; // Already flagged by keyword scan

        const currentYear = new Date().getFullYear();
        const yearsInPower = currentYear - profile.inPowerSince;

        if (profile.age >= 75 || yearsInPower >= 20) {
          alerts.push({
            id: `health-${profile.iso2}-${Date.now()}`,
            leaderName: profile.name,
            country: profile.country,
            iso2: profile.iso2,
            type: 'health',
            severity: profile.age >= 80 ? 'high' : 'moderate',
            articleCount: 0,
            description: `${profile.name} (age ${profile.age}) has flagged health concerns. ${yearsInPower} years in power.`,
            sources: [],
            detectedAt: new Date().toISOString(),
          });
        }
      }

      // 3. Term limit approaching alerts
      for (const profile of LEADER_PROFILES) {
        if (profile.term !== 'constitutional-limit') continue;
        const existingAlert = alerts.find((a) => a.iso2 === profile.iso2);
        if (existingAlert) continue;

        const currentYear = new Date().getFullYear();
        const yearsInPower = currentYear - profile.inPowerSince;

        // Most constitutional limits are 2 terms of ~5 years = 10 years
        if (yearsInPower >= 8) {
          alerts.push({
            id: `term-${profile.iso2}-${Date.now()}`,
            leaderName: profile.name,
            country: profile.country,
            iso2: profile.iso2,
            type: 'term-limit',
            severity: yearsInPower >= 10 ? 'high' : 'moderate',
            articleCount: 0,
            description: `${profile.name} approaching constitutional term limit after ${yearsInPower} years in power.`,
            sources: [],
            detectedAt: new Date().toISOString(),
          });
        }
      }

      // Sort by severity
      const severityOrder = { critical: 0, high: 1, elevated: 2, moderate: 3, low: 4 };
      alerts.sort((a, b) => (severityOrder[a.severity] ?? 9) - (severityOrder[b.severity] ?? 9));

      await cacheService.set(CACHE_KEYS.changes, alerts, CACHE_TTL);
      return alerts;
    } catch (error) {
      console.error('[Leadership] Change detection failed:', error.message);
      return alerts; // Return whatever we collected before failure
    }
  }

  /**
   * Main aggregation method. Returns the full Leadership Intelligence dataset
   * combining static profiles, GDELT activity, influence scores, and change detection.
   *
   * @returns {object} Combined leadership intelligence data
   */
  async getCombinedData() {
    const cached = await cacheService.get(CACHE_KEYS.combined);
    if (cached) return cached;

    console.log('[Leadership] Building combined leadership intelligence...');

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
          const influence = this.computeLeaderInfluenceScore(profile, activity);

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
            healthConcerns: profile.healthConcerns,
            successionCrisis: profile.successionCrisis,
            keyAllies: profile.keyAllies,
            keyRivals: profile.keyRivals,
            region: REGION_MAP[profile.iso2] || 'Other',
            influence,
            visibility: activity.visibility,
            tone: activity.tone,
            topics: activity.topics,
            changeRisk: this._assessChangeRisk(profile),
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

    // Assign global influence rankings
    const sorted = [...leaders].sort((a, b) => b.influence.score - a.influence.score);
    sorted.forEach((leader, index) => {
      leader.influence.rank = index + 1;
    });

    // Detect leadership changes
    const changeAlerts = await this.detectLeadershipChanges();

    // Merge change alerts into leader entries
    for (const alert of changeAlerts) {
      const leader = leaders.find((l) => l.iso2 === alert.iso2);
      if (leader) {
        leader.changeRisk = alert.severity;
        leader.changeAlert = {
          type: alert.type,
          severity: alert.severity,
          description: alert.description,
        };
      }
    }

    // Build power rankings (top 20)
    const powerRankings = sorted.slice(0, 20).map((l) => ({
      rank: l.influence.rank,
      name: l.name,
      country: l.country,
      iso2: l.iso2,
      title: l.title,
      score: l.influence.score,
      ideology: l.ideology,
      style: l.style,
      nuclearAccess: l.nuclearAccess,
      yearsInPower: l.yearsInPower,
    }));

    // Summary statistics
    const nuclearPowers = leaders.filter((l) => l.nuclearAccess).length;
    const totalTenure = leaders.reduce((sum, l) => sum + l.yearsInPower, 0);
    const avgTenure = leaders.length > 0 ? Math.round((totalTenure / leaders.length) * 10) / 10 : 0;

    const result = {
      leaders,
      changeAlerts,
      powerRankings,
      summary: {
        total: leaders.length,
        nuclearPowers,
        avgTenure,
        changeAlerts: changeAlerts.length,
        regions: this._countByRegion(leaders),
        ideologyDistribution: this._countByField(leaders, 'ideology'),
        styleDistribution: this._countByField(leaders, 'style'),
      },
      updatedAt: new Date().toISOString(),
    };

    await cacheService.set(CACHE_KEYS.combined, result, CACHE_TTL);
    console.log(`[Leadership] Combined data ready: ${leaders.length} leaders, ${changeAlerts.length} alerts`);

    return result;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Private helper methods
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Return an empty activity object for when GDELT fails.
   */
  _emptyActivity() {
    return { visibility: 0, tone: 0, topics: [], recentArticles: [], articleCount: 0 };
  }

  /**
   * Extract prominent topics from a set of GDELT articles by analyzing titles.
   */
  _extractTopics(articles) {
    const topicKeywords = {
      'war': 'War & Conflict',
      'military': 'Military',
      'nuclear': 'Nuclear',
      'economy': 'Economy',
      'trade': 'Trade',
      'sanctions': 'Sanctions',
      'climate': 'Climate',
      'election': 'Elections',
      'protest': 'Protests',
      'diplomacy': 'Diplomacy',
      'summit': 'Summit',
      'treaty': 'Treaty',
      'refugee': 'Refugees',
      'human rights': 'Human Rights',
      'terrorism': 'Terrorism',
      'cyber': 'Cybersecurity',
      'pandemic': 'Health',
      'covid': 'Health',
      'energy': 'Energy',
      'oil': 'Energy',
      'gas': 'Energy',
      'ai': 'Technology',
      'technology': 'Technology',
    };

    const topicCounts = {};

    for (const article of articles) {
      const title = (article.title || '').toLowerCase();
      for (const [keyword, topic] of Object.entries(topicKeywords)) {
        if (title.includes(keyword)) {
          topicCounts[topic] = (topicCounts[topic] || 0) + 1;
        }
      }
    }

    // Return top 5 topics sorted by frequency
    return Object.entries(topicCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([topic]) => topic);
  }

  /**
   * Classify the type of leadership change from matched GDELT articles.
   */
  _classifyChangeType(articles) {
    const titles = articles.map((a) => (a.title || '').toLowerCase()).join(' ');

    if (titles.includes('coup') || titles.includes('overthrow')) return 'coup';
    if (titles.includes('impeach')) return 'impeachment';
    if (titles.includes('resign')) return 'resignation';
    if (titles.includes('assassin') || titles.includes('killed')) return 'assassination';
    if (titles.includes('election') || titles.includes('vote')) return 'election';
    if (titles.includes('health') || titles.includes('hospital')) return 'health';
    if (titles.includes('succession')) return 'succession';
    return 'political-instability';
  }

  /**
   * Assess the severity of a detected leadership change.
   */
  _assessChangeSeverity(profile, articles, changeType) {
    let severity = 'moderate';

    // High-impact change types
    if (['coup', 'assassination'].includes(changeType)) {
      severity = 'critical';
    } else if (['impeachment', 'resignation'].includes(changeType)) {
      severity = 'high';
    } else if (changeType === 'health' && profile.age >= 75) {
      severity = 'high';
    }

    // Escalate if nuclear power
    if (profile.nuclearAccess && severity === 'high') {
      severity = 'critical';
    }

    // Escalate if succession crisis flagged
    if (profile.successionCrisis && severity === 'moderate') {
      severity = 'elevated';
    }

    // Escalate based on article volume (high media attention)
    if (articles.length >= 10 && severity === 'moderate') {
      severity = 'elevated';
    }

    return severity;
  }

  /**
   * Build a human-readable description for a leadership change alert.
   */
  _buildChangeDescription(profile, changeType, articleCount) {
    const typeDescriptions = {
      'coup': `Coup-related activity detected around ${profile.country}`,
      'impeachment': `Impeachment proceedings or discussion detected for ${profile.name}`,
      'resignation': `Resignation signals detected for ${profile.name}`,
      'assassination': `Assassination-related reports involving ${profile.country} leadership`,
      'election': `Election activity detected in ${profile.country}`,
      'health': `Health concerns reported for ${profile.name} (age ${profile.age})`,
      'succession': `Succession discussions detected for ${profile.country}`,
      'political-instability': `Political instability detected in ${profile.country}`,
    };

    const base = typeDescriptions[changeType] || `Leadership change signals in ${profile.country}`;
    return `${base}. ${articleCount} related article${articleCount !== 1 ? 's' : ''} in last 72h.`;
  }

  /**
   * Assess the baseline change risk for a leader based on static profile data.
   */
  _assessChangeRisk(profile) {
    const currentYear = new Date().getFullYear();
    const yearsInPower = currentYear - profile.inPowerSince;

    if (profile.successionCrisis) return 'high';
    if (profile.healthConcerns && profile.age >= 75) return 'elevated';
    if (profile.term === 'indefinite' && yearsInPower >= 20) return 'elevated';
    if (profile.term === 'constitutional-limit' && yearsInPower >= 8) return 'moderate';
    return 'low';
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
