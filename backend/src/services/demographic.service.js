/**
 * Demographic Risk Analysis Service
 * Fetches population, age structure, urbanization, and migration data from
 * the World Bank Indicators API (v2) and computes demographic risk scores.
 *
 * API: https://api.worldbank.org/v2/  (no key required)
 * License: CC BY 4.0 — free for commercial use with attribution.
 *
 * Indicators fetched:
 *   SP.POP.TOTL        — Total population
 *   SP.POP.GROW        — Population growth (annual %)
 *   SP.DYN.TFRT.IN     — Fertility rate, total (births per woman)
 *   SP.DYN.LE00.IN     — Life expectancy at birth, total (years)
 *   SP.POP.65UP.TO.ZS  — Population ages 65+ (% of total)
 *   SP.POP.0014.TO.ZS  — Population ages 0-14 (% of total)
 *   SP.URB.TOTL.IN.ZS  — Urban population (% of total)
 *   SL.UEM.1524.ZS     — Youth unemployment, ages 15-24 (% of labor force)
 *   EN.POP.DNST        — Population density (people per sq. km)
 *   SM.POP.NETM        — Net migration
 *
 * Cache: 24 hours (demographic data is slow-moving)
 */

import { cacheService } from './cache.service.js';
import { worldBankService } from './worldbank.service.js';

const WB_BASE = 'https://api.worldbank.org/v2/country';

const CACHE_TTL = 86400; // 24 hours (demographic data is slow-moving)
const CACHE_PREFIX = 'demographic';

// ─── Indicator codes ───────────────────────────────────────────────────────────
const DEMOGRAPHIC_INDICATORS = {
  population:        'SP.POP.TOTL',
  popGrowth:         'SP.POP.GROW',
  fertilityRate:     'SP.DYN.TFRT.IN',
  lifeExpectancy:    'SP.DYN.LE00.IN',
  elderlyPct:        'SP.POP.65UP.TO.ZS',
  youthPct:          'SP.POP.0014.TO.ZS',
  urbanPct:          'SP.URB.TOTL.IN.ZS',
  youthUnemployment: 'SL.UEM.1524.ZS',
  density:           'EN.POP.DNST',
  netMigration:      'SM.POP.NETM',
};

// ─── Monitored countries (40+ covering all regions) ────────────────────────────
const MONITORED_COUNTRIES = [
  // Africa
  { iso2: 'NG', name: 'Nigeria', region: 'Sub-Saharan Africa' },
  { iso2: 'ET', name: 'Ethiopia', region: 'Sub-Saharan Africa' },
  { iso2: 'EG', name: 'Egypt', region: 'North Africa' },
  { iso2: 'CD', name: 'DR Congo', region: 'Sub-Saharan Africa' },
  { iso2: 'ZA', name: 'South Africa', region: 'Sub-Saharan Africa' },
  { iso2: 'KE', name: 'Kenya', region: 'Sub-Saharan Africa' },
  { iso2: 'SD', name: 'Sudan', region: 'North Africa' },
  { iso2: 'TZ', name: 'Tanzania', region: 'Sub-Saharan Africa' },
  // Middle East
  { iso2: 'SA', name: 'Saudi Arabia', region: 'Middle East' },
  { iso2: 'IQ', name: 'Iraq', region: 'Middle East' },
  { iso2: 'YE', name: 'Yemen', region: 'Middle East' },
  { iso2: 'SY', name: 'Syria', region: 'Middle East' },
  { iso2: 'JO', name: 'Jordan', region: 'Middle East' },
  { iso2: 'LB', name: 'Lebanon', region: 'Middle East' },
  // South & Central Asia
  { iso2: 'IN', name: 'India', region: 'South Asia' },
  { iso2: 'PK', name: 'Pakistan', region: 'South Asia' },
  { iso2: 'BD', name: 'Bangladesh', region: 'South Asia' },
  { iso2: 'AF', name: 'Afghanistan', region: 'South Asia' },
  { iso2: 'NP', name: 'Nepal', region: 'South Asia' },
  // East & Southeast Asia
  { iso2: 'CN', name: 'China', region: 'East Asia' },
  { iso2: 'JP', name: 'Japan', region: 'East Asia' },
  { iso2: 'ID', name: 'Indonesia', region: 'Southeast Asia' },
  { iso2: 'PH', name: 'Philippines', region: 'Southeast Asia' },
  { iso2: 'VN', name: 'Vietnam', region: 'Southeast Asia' },
  { iso2: 'MM', name: 'Myanmar', region: 'Southeast Asia' },
  { iso2: 'TH', name: 'Thailand', region: 'Southeast Asia' },
  { iso2: 'KR', name: 'South Korea', region: 'East Asia' },
  // Europe
  { iso2: 'DE', name: 'Germany', region: 'Europe' },
  { iso2: 'FR', name: 'France', region: 'Europe' },
  { iso2: 'GB', name: 'United Kingdom', region: 'Europe' },
  { iso2: 'IT', name: 'Italy', region: 'Europe' },
  { iso2: 'UA', name: 'Ukraine', region: 'Europe' },
  { iso2: 'PL', name: 'Poland', region: 'Europe' },
  { iso2: 'RU', name: 'Russia', region: 'Europe' },
  { iso2: 'TR', name: 'Turkey', region: 'Europe' },
  // Americas
  { iso2: 'US', name: 'United States', region: 'Americas' },
  { iso2: 'BR', name: 'Brazil', region: 'Americas' },
  { iso2: 'MX', name: 'Mexico', region: 'Americas' },
  { iso2: 'CO', name: 'Colombia', region: 'Americas' },
  { iso2: 'AR', name: 'Argentina', region: 'Americas' },
  { iso2: 'VE', name: 'Venezuela', region: 'Americas' },
  { iso2: 'PE', name: 'Peru', region: 'Americas' },
  { iso2: 'HT', name: 'Haiti', region: 'Americas' },
  // Oceania
  { iso2: 'AU', name: 'Australia', region: 'Oceania' },
];

// ─── Fallback profiles (approximate World Bank 2023 figures) ───────────────────
const FALLBACK_PROFILES = {
  NG: { population: 223800000, popGrowth: 2.4, fertilityRate: 5.1, lifeExpectancy: 53.9, youthPct: 43.3, elderlyPct: 2.7, urbanPct: 54.3, youthUnemployment: 19.6, density: 242, netMigration: -60000 },
  ET: { population: 126500000, popGrowth: 2.5, fertilityRate: 4.1, lifeExpectancy: 66.6, youthPct: 39.8, elderlyPct: 3.5, urbanPct: 23.2, youthUnemployment: 5.3, density: 115, netMigration: -30000 },
  EG: { population: 109300000, popGrowth: 1.7, fertilityRate: 2.9, lifeExpectancy: 72.4, youthPct: 33.8, elderlyPct: 5.6, urbanPct: 42.8, youthUnemployment: 26.5, density: 109, netMigration: -38000 },
  CD: { population: 102300000, popGrowth: 3.2, fertilityRate: 5.9, lifeExpectancy: 60.7, youthPct: 46.3, elderlyPct: 2.9, urbanPct: 46.8, youthUnemployment: 8.7, density: 44, netMigration: -22000 },
  ZA: { population: 60400000, popGrowth: 0.8, fertilityRate: 2.3, lifeExpectancy: 65.3, youthPct: 28.2, elderlyPct: 5.8, urbanPct: 68.4, youthUnemployment: 59.6, density: 50, netMigration: 1000000 },
  KE: { population: 55100000, popGrowth: 1.9, fertilityRate: 3.3, lifeExpectancy: 62.1, youthPct: 38.0, elderlyPct: 2.9, urbanPct: 29.0, youthUnemployment: 13.8, density: 96, netMigration: -10000 },
  SD: { population: 47900000, popGrowth: 2.5, fertilityRate: 4.4, lifeExpectancy: 65.9, youthPct: 40.5, elderlyPct: 3.6, urbanPct: 36.1, youthUnemployment: 32.2, density: 27, netMigration: -50000 },
  TZ: { population: 65500000, popGrowth: 2.9, fertilityRate: 4.7, lifeExpectancy: 66.2, youthPct: 43.3, elderlyPct: 2.8, urbanPct: 37.4, youthUnemployment: 5.3, density: 73, netMigration: -40000 },
  SA: { population: 36400000, popGrowth: 1.6, fertilityRate: 2.3, lifeExpectancy: 77.6, youthPct: 23.9, elderlyPct: 3.7, urbanPct: 84.7, youthUnemployment: 28.4, density: 17, netMigration: 100000 },
  IQ: { population: 44500000, popGrowth: 2.3, fertilityRate: 3.5, lifeExpectancy: 71.6, youthPct: 38.2, elderlyPct: 3.4, urbanPct: 71.4, youthUnemployment: 25.2, density: 102, netMigration: 7500 },
  YE: { population: 34450000, popGrowth: 2.3, fertilityRate: 3.7, lifeExpectancy: 63.4, youthPct: 39.2, elderlyPct: 2.9, urbanPct: 39.2, youthUnemployment: 24.0, density: 65, netMigration: -31000 },
  SY: { population: 22130000, popGrowth: 4.2, fertilityRate: 2.7, lifeExpectancy: 73.7, youthPct: 32.1, elderlyPct: 4.2, urbanPct: 56.8, youthUnemployment: 20.0, density: 120, netMigration: 840000 },
  JO: { population: 11300000, popGrowth: 0.6, fertilityRate: 2.6, lifeExpectancy: 75.5, youthPct: 32.3, elderlyPct: 4.1, urbanPct: 91.8, youthUnemployment: 40.2, density: 127, netMigration: 12000 },
  LB: { population: 5500000, popGrowth: -0.6, fertilityRate: 2.1, lifeExpectancy: 75.2, youthPct: 22.0, elderlyPct: 8.2, urbanPct: 89.3, youthUnemployment: 22.0, density: 539, netMigration: -130000 },
  IN: { population: 1428600000, popGrowth: 0.8, fertilityRate: 2.0, lifeExpectancy: 70.8, youthPct: 25.3, elderlyPct: 7.0, urbanPct: 36.4, youthUnemployment: 23.2, density: 481, netMigration: -500000 },
  PK: { population: 240500000, popGrowth: 1.9, fertilityRate: 3.3, lifeExpectancy: 67.7, youthPct: 35.1, elderlyPct: 4.3, urbanPct: 37.2, youthUnemployment: 11.0, density: 312, netMigration: -1300000 },
  BD: { population: 172950000, popGrowth: 1.0, fertilityRate: 2.0, lifeExpectancy: 72.4, youthPct: 26.0, elderlyPct: 5.8, urbanPct: 40.5, youthUnemployment: 12.1, density: 1329, netMigration: -2500000 },
  AF: { population: 42200000, popGrowth: 2.3, fertilityRate: 4.5, lifeExpectancy: 62.0, youthPct: 43.0, elderlyPct: 2.6, urbanPct: 26.5, youthUnemployment: 17.6, density: 65, netMigration: -180000 },
  NP: { population: 30900000, popGrowth: 1.8, fertilityRate: 2.0, lifeExpectancy: 70.8, youthPct: 28.6, elderlyPct: 6.2, urbanPct: 21.8, youthUnemployment: 6.3, density: 216, netMigration: -165000 },
  CN: { population: 1425200000, popGrowth: -0.02, fertilityRate: 1.0, lifeExpectancy: 78.6, youthPct: 17.2, elderlyPct: 14.3, urbanPct: 65.2, youthUnemployment: 11.6, density: 152, netMigration: -310000 },
  JP: { population: 123300000, popGrowth: -0.5, fertilityRate: 1.2, lifeExpectancy: 84.8, youthPct: 11.8, elderlyPct: 29.9, urbanPct: 91.9, youthUnemployment: 4.0, density: 338, netMigration: 75000 },
  ID: { population: 277500000, popGrowth: 0.9, fertilityRate: 2.2, lifeExpectancy: 68.6, youthPct: 24.5, elderlyPct: 6.9, urbanPct: 58.6, youthUnemployment: 14.0, density: 153, netMigration: -98000 },
  PH: { population: 117300000, popGrowth: 1.5, fertilityRate: 2.7, lifeExpectancy: 69.3, youthPct: 30.2, elderlyPct: 5.6, urbanPct: 48.4, youthUnemployment: 9.3, density: 390, netMigration: -67000 },
  VN: { population: 99500000, popGrowth: 0.8, fertilityRate: 2.0, lifeExpectancy: 75.4, youthPct: 22.5, elderlyPct: 8.4, urbanPct: 39.5, youthUnemployment: 7.3, density: 321, netMigration: -80000 },
  MM: { population: 54200000, popGrowth: 0.7, fertilityRate: 2.1, lifeExpectancy: 67.1, youthPct: 25.3, elderlyPct: 6.5, urbanPct: 32.0, youthUnemployment: 4.3, density: 83, netMigration: -163000 },
  TH: { population: 71800000, popGrowth: 0.1, fertilityRate: 1.1, lifeExpectancy: 78.7, youthPct: 16.1, elderlyPct: 14.0, urbanPct: 53.3, youthUnemployment: 5.2, density: 140, netMigration: 19000 },
  KR: { population: 51740000, popGrowth: 0.0, fertilityRate: 0.7, lifeExpectancy: 83.7, youthPct: 11.5, elderlyPct: 18.4, urbanPct: 81.4, youthUnemployment: 7.3, density: 531, netMigration: 30000 },
  DE: { population: 84480000, popGrowth: 0.1, fertilityRate: 1.4, lifeExpectancy: 81.7, youthPct: 14.0, elderlyPct: 22.4, urbanPct: 77.8, youthUnemployment: 6.1, density: 240, netMigration: 331000 },
  FR: { population: 68170000, popGrowth: 0.2, fertilityRate: 1.7, lifeExpectancy: 82.5, youthPct: 17.2, elderlyPct: 21.7, urbanPct: 81.8, youthUnemployment: 17.3, density: 124, netMigration: 90000 },
  GB: { population: 67740000, popGrowth: 0.4, fertilityRate: 1.6, lifeExpectancy: 81.8, youthPct: 17.4, elderlyPct: 19.0, urbanPct: 84.4, youthUnemployment: 11.5, density: 279, netMigration: 260000 },
  IT: { population: 59030000, popGrowth: -0.2, fertilityRate: 1.2, lifeExpectancy: 83.5, youthPct: 12.5, elderlyPct: 24.1, urbanPct: 71.7, youthUnemployment: 23.7, density: 200, netMigration: 148000 },
  UA: { population: 37000000, popGrowth: -1.5, fertilityRate: 1.2, lifeExpectancy: 73.6, youthPct: 15.4, elderlyPct: 17.4, urbanPct: 70.1, youthUnemployment: 19.0, density: 64, netMigration: -7000000 },
  PL: { population: 37750000, popGrowth: -0.3, fertilityRate: 1.3, lifeExpectancy: 78.7, youthPct: 15.1, elderlyPct: 19.4, urbanPct: 60.1, youthUnemployment: 11.8, density: 124, netMigration: 12000 },
  RU: { population: 144240000, popGrowth: -0.2, fertilityRate: 1.5, lifeExpectancy: 73.4, youthPct: 18.4, elderlyPct: 16.0, urbanPct: 75.1, youthUnemployment: 8.9, density: 9, netMigration: 182000 },
  TR: { population: 85280000, popGrowth: 0.6, fertilityRate: 1.6, lifeExpectancy: 76.0, youthPct: 22.6, elderlyPct: 9.5, urbanPct: 77.0, youthUnemployment: 18.3, density: 111, netMigration: -400000 },
  US: { population: 339900000, popGrowth: 0.5, fertilityRate: 1.6, lifeExpectancy: 79.1, youthPct: 17.7, elderlyPct: 17.3, urbanPct: 83.3, youthUnemployment: 8.3, density: 37, netMigration: 999000 },
  BR: { population: 216400000, popGrowth: 0.5, fertilityRate: 1.6, lifeExpectancy: 76.0, youthPct: 20.2, elderlyPct: 10.2, urbanPct: 87.6, youthUnemployment: 20.3, density: 26, netMigration: 6000 },
  MX: { population: 128900000, popGrowth: 0.7, fertilityRate: 1.8, lifeExpectancy: 75.1, youthPct: 24.3, elderlyPct: 8.2, urbanPct: 81.3, youthUnemployment: 6.2, density: 66, netMigration: -300000 },
  CO: { population: 52080000, popGrowth: 0.5, fertilityRate: 1.7, lifeExpectancy: 77.3, youthPct: 22.0, elderlyPct: 9.6, urbanPct: 82.1, youthUnemployment: 19.8, density: 46, netMigration: 88000 },
  AR: { population: 46650000, popGrowth: 0.8, fertilityRate: 1.9, lifeExpectancy: 77.1, youthPct: 23.5, elderlyPct: 11.9, urbanPct: 92.4, youthUnemployment: 22.4, density: 17, netMigration: 4000 },
  VE: { population: 28440000, popGrowth: -0.2, fertilityRate: 2.2, lifeExpectancy: 72.1, youthPct: 26.6, elderlyPct: 7.7, urbanPct: 88.1, youthUnemployment: 14.5, density: 32, netMigration: -680000 },
  PE: { population: 34050000, popGrowth: 0.8, fertilityRate: 2.1, lifeExpectancy: 77.0, youthPct: 24.5, elderlyPct: 8.9, urbanPct: 78.9, youthUnemployment: 8.4, density: 27, netMigration: 100000 },
  HT: { population: 11720000, popGrowth: 1.2, fertilityRate: 2.8, lifeExpectancy: 64.0, youthPct: 32.3, elderlyPct: 4.8, urbanPct: 59.2, youthUnemployment: 30.0, density: 424, netMigration: -35000 },
  AU: { population: 26640000, popGrowth: 1.9, fertilityRate: 1.6, lifeExpectancy: 83.3, youthPct: 18.3, elderlyPct: 17.0, urbanPct: 86.6, youthUnemployment: 8.5, density: 3, netMigration: 500000 },
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Fetch a single World Bank indicator for a given country.
 * Returns { value, date } or null on failure.
 */
async function fetchSingleIndicator(iso2, indicatorCode) {
  const url =
    `${WB_BASE}/${iso2}/indicator/${indicatorCode}` +
    `?format=json&per_page=5&mrv=1`;

  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      console.warn(`[Demographic] WB API ${res.status} for ${iso2}/${indicatorCode}`);
      return null;
    }

    const json = await res.json();

    // World Bank returns an array: [metadata, dataRows]
    if (!Array.isArray(json) || json.length < 2 || !Array.isArray(json[1])) {
      return null;
    }

    // Find the most recent non-null value
    for (const row of json[1]) {
      if (row.value !== null && row.value !== undefined) {
        return { value: row.value, date: row.date };
      }
    }

    return null;
  } catch (err) {
    console.warn(`[Demographic] Failed to fetch ${indicatorCode} for ${iso2}:`, err.message);
    return null;
  }
}

/**
 * Classify risk level from a numeric 0-100 score.
 */
function classifyRiskLevel(score) {
  if (score >= 75) return 'critical';
  if (score >= 55) return 'high';
  if (score >= 35) return 'elevated';
  if (score >= 20) return 'moderate';
  return 'low';
}

/**
 * Round to one decimal place.
 */
function round1(n) {
  return n != null ? Math.round(n * 10) / 10 : null;
}

// ─── Service class ─────────────────────────────────────────────────────────────

class DemographicService {
  /**
   * Fetch all demographic indicators for a single country.
   * Returns a structured profile object.
   */
  async fetchDemographicProfile(iso2) {
    const cacheKey = `${CACHE_PREFIX}:profile:${iso2}`;

    // Check cache first
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const countryMeta = MONITORED_COUNTRIES.find((c) => c.iso2 === iso2);
    const countryName = countryMeta?.name || iso2;
    const region = countryMeta?.region || 'Unknown';

    // Fetch all indicators in parallel
    const indicatorEntries = Object.entries(DEMOGRAPHIC_INDICATORS);
    const results = await Promise.allSettled(
      indicatorEntries.map(([, code]) => fetchSingleIndicator(iso2, code))
    );

    // Build raw values map
    const rawValues = {};
    let fetchedCount = 0;
    indicatorEntries.forEach(([key], idx) => {
      const result = results[idx];
      if (result.status === 'fulfilled' && result.value !== null) {
        rawValues[key] = result.value.value;
        fetchedCount++;
      } else {
        rawValues[key] = null;
      }
    });

    // If we got zero indicators from the API, fall back entirely
    const fallback = FALLBACK_PROFILES[iso2] || {};
    const useFallback = fetchedCount < 3; // Use fallback if less than 3 indicators succeeded

    const profile = {
      country: countryName,
      iso2,
      region,
      population:        rawValues.population ?? fallback.population ?? null,
      popGrowth:         round1(rawValues.popGrowth ?? fallback.popGrowth) ?? null,
      fertilityRate:     round1(rawValues.fertilityRate ?? fallback.fertilityRate) ?? null,
      lifeExpectancy:    round1(rawValues.lifeExpectancy ?? fallback.lifeExpectancy) ?? null,
      youthPct:          round1(rawValues.youthPct ?? fallback.youthPct) ?? null,
      elderlyPct:        round1(rawValues.elderlyPct ?? fallback.elderlyPct) ?? null,
      urbanPct:          round1(rawValues.urbanPct ?? fallback.urbanPct) ?? null,
      youthUnemployment: round1(rawValues.youthUnemployment ?? fallback.youthUnemployment) ?? null,
      density:           round1(rawValues.density ?? fallback.density) ?? null,
      netMigration:      rawValues.netMigration ?? fallback.netMigration ?? null,
      dataSource:        useFallback ? 'fallback' : 'api',
      fetchedIndicators: fetchedCount,
    };

    // Compute risk
    profile.risk = this.computeDemographicRisk(profile);

    // Cache the result
    try {
      await cacheService.set(cacheKey, profile, CACHE_TTL);
    } catch (err) {
      console.warn(`[Demographic] Cache set failed for ${iso2}:`, err.message);
    }

    return profile;
  }

  /**
   * Compute a demographic risk score (0-100) from a country profile.
   * Returns { score, level, factors }.
   *
   * Risk factors:
   *   - Youth bulge (high 0-14% → instability risk)
   *   - Aging crisis (high 65+% with low fertility → economic pressure)
   *   - Youth unemployment (>25% → high unrest risk)
   *   - Rapid urbanization (high urban% with high growth → infrastructure pressure)
   *   - Negative net migration (brain drain risk)
   *   - Very high population density (resource pressure)
   *   - High population growth (>2.5% → sustainability risk)
   */
  computeDemographicRisk(profile) {
    let score = 0;
    const factors = [];

    // 1. Youth bulge factor: high 0-14 population % = instability risk
    if (profile.youthPct != null && profile.youthPct > 35) {
      const contribution = Math.min(15, Math.round(((profile.youthPct - 35) / 15) * 15));
      score += contribution;
      factors.push({
        name: 'Youth bulge',
        contribution,
        value: `${profile.youthPct}% under 14`,
        description: 'Large youth population increases social instability pressure',
      });
    }

    // 2. Aging crisis: high 65+ with low fertility = economic pressure
    if (profile.elderlyPct != null && profile.elderlyPct > 15 &&
        profile.fertilityRate != null && profile.fertilityRate < 1.8) {
      const agingSeverity = (profile.elderlyPct - 15) / 15; // 0-1 scale
      const fertilitySeverity = (1.8 - profile.fertilityRate) / 1.0; // 0-1 scale
      const contribution = Math.min(10, Math.round((agingSeverity + fertilitySeverity) * 5));
      score += contribution;
      factors.push({
        name: 'Aging crisis',
        contribution,
        value: `${profile.elderlyPct}% over 65, fertility ${profile.fertilityRate}`,
        description: 'Aging population with low fertility creates economic pressure',
      });
    }

    // 3. Youth unemployment: >25% = high unrest risk
    if (profile.youthUnemployment != null && profile.youthUnemployment > 15) {
      const severity = (profile.youthUnemployment - 15) / 45; // normalize 15-60 range
      const contribution = Math.min(20, Math.round(severity * 20));
      score += contribution;
      factors.push({
        name: 'Youth unemployment',
        contribution,
        value: `${profile.youthUnemployment}%`,
        description: profile.youthUnemployment > 25
          ? 'Critical youth unemployment levels increase unrest risk'
          : 'Elevated youth unemployment is a destabilizing factor',
      });
    }

    // 4. Rapid urbanization: high urban growth = infrastructure pressure
    if (profile.urbanPct != null && profile.popGrowth != null) {
      const urbanGrowthProxy = profile.popGrowth * (profile.urbanPct / 100);
      if (urbanGrowthProxy > 1.5) {
        const contribution = Math.min(10, Math.round(((urbanGrowthProxy - 1.5) / 2) * 10));
        score += contribution;
        factors.push({
          name: 'Rapid urbanization',
          contribution,
          value: `${profile.urbanPct}% urban, ${profile.popGrowth}% growth`,
          description: 'Rapid urban growth strains infrastructure and services',
        });
      }
    }

    // 5. Negative net migration: brain drain risk
    if (profile.netMigration != null && profile.netMigration < -100000) {
      const severity = Math.min(1, Math.abs(profile.netMigration) / 2000000);
      const contribution = Math.min(10, Math.round(severity * 10));
      score += contribution;
      factors.push({
        name: 'Brain drain',
        contribution,
        value: `Net migration: ${(profile.netMigration / 1000).toFixed(0)}K`,
        description: 'Significant outward migration indicates brain drain',
      });
    }

    // 6. Very high population density: resource pressure
    if (profile.density != null && profile.density > 400) {
      const severity = Math.min(1, (profile.density - 400) / 1000);
      const contribution = Math.min(10, Math.round(severity * 10));
      score += contribution;
      factors.push({
        name: 'Population density',
        contribution,
        value: `${profile.density} per km²`,
        description: 'Very high population density increases resource competition',
      });
    }

    // 7. High population growth (>2.5%): sustainability risk
    if (profile.popGrowth != null && profile.popGrowth > 2.5) {
      const severity = Math.min(1, (profile.popGrowth - 2.5) / 2);
      const contribution = Math.min(10, Math.round(severity * 10));
      score += contribution;
      factors.push({
        name: 'Rapid population growth',
        contribution,
        value: `${profile.popGrowth}% annual`,
        description: 'High growth rate strains resources and sustainability',
      });
    }

    // Clamp score to 0-100
    score = Math.max(0, Math.min(100, score));

    // Sort factors by contribution (descending)
    factors.sort((a, b) => b.contribution - a.contribution);

    return {
      score,
      level: classifyRiskLevel(score),
      factors,
    };
  }

  /**
   * Fetch demographic profiles for all monitored countries.
   * Returns array of profiles sorted by risk score (descending).
   */
  async getGlobalDemographics() {
    const cacheKey = `${CACHE_PREFIX}:global`;

    // Check cache first
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    console.log(`[Demographic] Fetching profiles for ${MONITORED_COUNTRIES.length} countries...`);

    // Fetch in batches of 8 to avoid overwhelming the API
    const batchSize = 8;
    const profiles = [];

    for (let i = 0; i < MONITORED_COUNTRIES.length; i += batchSize) {
      const batch = MONITORED_COUNTRIES.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(
        batch.map((c) => this.fetchDemographicProfile(c.iso2))
      );

      for (let j = 0; j < batchResults.length; j++) {
        const result = batchResults[j];
        if (result.status === 'fulfilled' && result.value) {
          profiles.push(result.value);
        } else {
          // Use fallback for failed countries
          const country = batch[j];
          const fallback = FALLBACK_PROFILES[country.iso2];
          if (fallback) {
            const profile = {
              country: country.name,
              iso2: country.iso2,
              region: country.region,
              ...fallback,
              dataSource: 'fallback',
              fetchedIndicators: 0,
            };
            profile.risk = this.computeDemographicRisk(profile);
            profiles.push(profile);
          } else {
            console.warn(`[Demographic] No data available for ${country.name} (${country.iso2})`);
          }
        }
      }

      // Small delay between batches to be polite to the API
      if (i + batchSize < MONITORED_COUNTRIES.length) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    // Sort by risk score descending
    profiles.sort((a, b) => (b.risk?.score ?? 0) - (a.risk?.score ?? 0));

    // Cache the global result
    try {
      await cacheService.set(cacheKey, profiles, CACHE_TTL);
    } catch (err) {
      console.warn('[Demographic] Cache set failed for global data:', err.message);
    }

    console.log(`[Demographic] Fetched ${profiles.length} country profiles`);
    return profiles;
  }

  /**
   * Get combined demographic data: profiles, high-risk list, and summary.
   * This is the main method called by the API route.
   */
  async getCombinedData() {
    const cacheKey = `${CACHE_PREFIX}:combined`;

    // Check cache first
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const profiles = await this.getGlobalDemographics();

    // Identify high-risk countries (elevated and above)
    const highRisk = profiles.filter(
      (p) => p.risk && (p.risk.level === 'critical' || p.risk.level === 'high')
    );

    // Count by risk level
    const criticalCount = profiles.filter((p) => p.risk?.level === 'critical').length;
    const highCount = profiles.filter((p) => p.risk?.level === 'high').length;

    // Average risk score
    const totalRisk = profiles.reduce((sum, p) => sum + (p.risk?.score ?? 0), 0);
    const avgRisk = profiles.length > 0 ? Math.round(totalRisk / profiles.length) : 0;

    // Find youngest population (highest youthPct)
    const youngestPopulation = profiles.reduce((best, p) => {
      if (p.youthPct != null && (best === null || p.youthPct > best.youthPct)) {
        return p;
      }
      return best;
    }, null);

    // Find oldest population (highest elderlyPct)
    const oldestPopulation = profiles.reduce((best, p) => {
      if (p.elderlyPct != null && (best === null || p.elderlyPct > best.elderlyPct)) {
        return p;
      }
      return best;
    }, null);

    const combined = {
      profiles,
      highRisk,
      summary: {
        total: profiles.length,
        critical: criticalCount,
        high: highCount,
        avgRisk,
        youngestPopulation: youngestPopulation
          ? { country: youngestPopulation.country, iso2: youngestPopulation.iso2, youthPct: youngestPopulation.youthPct }
          : null,
        oldestPopulation: oldestPopulation
          ? { country: oldestPopulation.country, iso2: oldestPopulation.iso2, elderlyPct: oldestPopulation.elderlyPct }
          : null,
      },
      updatedAt: new Date().toISOString(),
    };

    // Cache the combined result
    try {
      await cacheService.set(cacheKey, combined, CACHE_TTL);
    } catch (err) {
      console.warn('[Demographic] Cache set failed for combined data:', err.message);
    }

    return combined;
  }

  /**
   * Look up a single country profile by ISO2 code.
   * Returns null if the country is not in the monitored list.
   */
  async getCountryProfile(iso2) {
    if (!iso2 || typeof iso2 !== 'string') return null;
    const code = iso2.toUpperCase();
    const isMonitored = MONITORED_COUNTRIES.some((c) => c.iso2 === code);
    if (!isMonitored) return null;
    return this.fetchDemographicProfile(code);
  }

  /**
   * Get the list of all monitored countries.
   */
  getMonitoredCountries() {
    return MONITORED_COUNTRIES.map((c) => ({ ...c }));
  }

  /**
   * Get risk distribution summary (counts per level).
   */
  async getRiskDistribution() {
    const profiles = await this.getGlobalDemographics();
    const distribution = { critical: 0, high: 0, elevated: 0, moderate: 0, low: 0 };

    for (const p of profiles) {
      const level = p.risk?.level || 'low';
      if (distribution[level] !== undefined) {
        distribution[level]++;
      }
    }

    return distribution;
  }

  /**
   * Get countries grouped by region with average risk per region.
   */
  async getRegionalSummary() {
    const profiles = await this.getGlobalDemographics();
    const regionMap = {};

    for (const p of profiles) {
      const region = p.region || 'Unknown';
      if (!regionMap[region]) {
        regionMap[region] = { region, countries: [], totalRisk: 0 };
      }
      regionMap[region].countries.push({
        country: p.country,
        iso2: p.iso2,
        riskScore: p.risk?.score ?? 0,
        riskLevel: p.risk?.level ?? 'low',
      });
      regionMap[region].totalRisk += p.risk?.score ?? 0;
    }

    const regions = Object.values(regionMap).map((r) => ({
      region: r.region,
      countries: r.countries.sort((a, b) => b.riskScore - a.riskScore),
      avgRisk: r.countries.length > 0 ? Math.round(r.totalRisk / r.countries.length) : 0,
      count: r.countries.length,
    }));

    return regions.sort((a, b) => b.avgRisk - a.avgRisk);
  }
}

export const demographicService = new DemographicService();
