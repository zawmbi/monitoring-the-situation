/**
 * Country Risk Scoring Service
 * Dynamically computes composite risk scores from multiple live data sources:
 * - UCDP conflict events (event counts, fatalities, active conflicts)
 * - Stability data (protests intensity, military indicators, instability alerts)
 * - Sanctions status (comprehensive vs targeted regimes)
 * - World Bank economic indicators (inflation, unemployment, debt)
 *
 * Instead of hardcoded per-country BASE_RISK scores, countries are assigned a
 * category-based baseline (fragile=70, developing=40, stable=20) which is then
 * adjusted dynamically from live data feeds.
 */

import { cacheService } from './cache.service.js';
import { ucdpService } from './ucdp.service.js';
import { stabilityService } from './stability.service.js';
import { worldBankService } from './worldbank.service.js';
import { sanctionsService } from './sanctions.service.js';

const CACHE_KEY = 'countryrisk:scores';
const CACHE_TTL = 1800; // 30 minutes

// Country coordinates for map display
const COUNTRY_COORDS = {
  'Afghanistan': { lat: 33.94, lon: 67.71 }, 'Iraq': { lat: 33.22, lon: 43.68 },
  'Syria': { lat: 34.8, lon: 38.99 }, 'Yemen': { lat: 15.55, lon: 48.52 },
  'Somalia': { lat: 5.15, lon: 46.2 }, 'Libya': { lat: 26.34, lon: 17.23 },
  'Sudan': { lat: 12.86, lon: 30.22 }, 'South Sudan': { lat: 6.87, lon: 31.31 },
  'DR Congo': { lat: -4.04, lon: 21.76 }, 'Central African Republic': { lat: 6.61, lon: 20.94 },
  'Myanmar': { lat: 21.91, lon: 95.96 }, 'Ukraine': { lat: 48.38, lon: 31.17 },
  'Venezuela': { lat: 6.42, lon: -66.59 }, 'Haiti': { lat: 18.97, lon: -72.29 },
  'Mali': { lat: 17.57, lon: -4.0 }, 'Burkina Faso': { lat: 12.37, lon: -1.52 },
  'Niger': { lat: 17.61, lon: 8.08 }, 'Nigeria': { lat: 9.08, lon: 7.49 },
  'Ethiopia': { lat: 9.15, lon: 40.49 }, 'Mozambique': { lat: -15.41, lon: 40.52 },
  'Pakistan': { lat: 30.38, lon: 69.35 }, 'Lebanon': { lat: 33.87, lon: 35.51 },
  'North Korea': { lat: 39.04, lon: 125.76 }, 'Iran': { lat: 35.69, lon: 51.39 },
  'Russia': { lat: 55.75, lon: 37.62 }, 'Belarus': { lat: 53.9, lon: 27.57 },
  'China': { lat: 39.9, lon: 116.41 }, 'Cuba': { lat: 23.11, lon: -82.37 },
  'Eritrea': { lat: 15.33, lon: 38.93 }, 'Palestine': { lat: 31.95, lon: 35.23 },
  'Israel': { lat: 31.77, lon: 35.22 }, 'Egypt': { lat: 30.04, lon: 31.24 },
  'Tunisia': { lat: 36.81, lon: 10.17 }, 'Algeria': { lat: 36.75, lon: 3.06 },
  'Colombia': { lat: 4.71, lon: -74.07 }, 'Mexico': { lat: 19.43, lon: -99.13 },
  'Honduras': { lat: 14.07, lon: -87.19 }, 'Guatemala': { lat: 14.63, lon: -90.51 },
  'El Salvador': { lat: 13.69, lon: -89.22 }, 'Bangladesh': { lat: 23.81, lon: 90.41 },
  'Philippines': { lat: 14.6, lon: 120.98 }, 'Thailand': { lat: 13.76, lon: 100.5 },
  'Cameroon': { lat: 3.85, lon: 11.5 }, 'Chad': { lat: 12.13, lon: 15.05 },
  'Kenya': { lat: -1.29, lon: 36.82 }, 'Uganda': { lat: 0.35, lon: 32.58 },
  'Tanzania': { lat: -6.79, lon: 39.28 }, 'Zimbabwe': { lat: -17.83, lon: 31.05 },
  'India': { lat: 28.61, lon: 77.21 }, 'Turkey': { lat: 39.93, lon: 32.87 },
  'Saudi Arabia': { lat: 24.69, lon: 46.72 }, 'United Arab Emirates': { lat: 24.45, lon: 54.65 },
};

// Fragile States (derived from the Fund for Peace Fragile States Index top-tier countries)
const FRAGILE_STATES = new Set([
  'Afghanistan', 'Syria', 'Yemen', 'Somalia', 'Sudan', 'South Sudan',
  'DR Congo', 'Central African Republic', 'Chad', 'Haiti', 'Mali',
  'Burkina Faso', 'Niger', 'Eritrea', 'Myanmar', 'Libya', 'Iraq',
  'Palestine', 'Ethiopia', 'Mozambique', 'Nigeria', 'Cameroon',
  'Lebanon',
]);

// Developing countries (elevated baseline, not fragile but not fully stable)
const DEVELOPING_STATES = new Set([
  'Pakistan', 'Venezuela', 'North Korea', 'Iran', 'Ukraine', 'Cuba',
  'Colombia', 'Mexico', 'Honduras', 'Guatemala', 'El Salvador',
  'Bangladesh', 'Philippines', 'Kenya', 'Uganda', 'Zimbabwe',
  'Egypt', 'Tunisia', 'Algeria', 'Russia', 'Belarus', 'India',
  'Turkey',
]);

// All other countries in COUNTRY_COORDS default to "stable" baseline

// Map country names to ISO alpha-2 codes for cross-referencing with stability data
const COUNTRY_TO_ISO = {
  'Afghanistan': 'AF', 'Iraq': 'IQ', 'Syria': 'SY', 'Yemen': 'YE',
  'Somalia': 'SO', 'Libya': 'LY', 'Sudan': 'SD', 'South Sudan': 'SS',
  'DR Congo': 'CD', 'Central African Republic': 'CF', 'Myanmar': 'MM',
  'Ukraine': 'UA', 'Venezuela': 'VE', 'Haiti': 'HT', 'Mali': 'ML',
  'Burkina Faso': 'BF', 'Niger': 'NE', 'Nigeria': 'NG', 'Ethiopia': 'ET',
  'Mozambique': 'MZ', 'Pakistan': 'PK', 'Lebanon': 'LB', 'North Korea': 'KP',
  'Iran': 'IR', 'Russia': 'RU', 'Belarus': 'BY', 'China': 'CN',
  'Cuba': 'CU', 'Eritrea': 'ER', 'Palestine': 'PS', 'Israel': 'IL',
  'Egypt': 'EG', 'Tunisia': 'TN', 'Algeria': 'DZ', 'Colombia': 'CO',
  'Mexico': 'MX', 'Honduras': 'HN', 'Guatemala': 'GT', 'El Salvador': 'SV',
  'Bangladesh': 'BD', 'Philippines': 'PH', 'Thailand': 'TH', 'Cameroon': 'CM',
  'Chad': 'TD', 'Kenya': 'KE', 'Uganda': 'UG', 'Tanzania': 'TZ',
  'Zimbabwe': 'ZW', 'India': 'IN', 'Turkey': 'TR', 'Saudi Arabia': 'SA',
  'United Arab Emirates': 'AE',
};

/**
 * Determine the category-based baseline score for a country.
 *   Fragile state  -> 70
 *   Developing     -> 40
 *   Stable         -> 20
 */
function getBaselineScore(country) {
  if (FRAGILE_STATES.has(country)) return 70;
  if (DEVELOPING_STATES.has(country)) return 40;
  return 20;
}

/**
 * Compute the UCDP conflict adjustment for a country.
 * Considers both event counts and fatalities.
 * Returns 0-20 additional risk points.
 */
function computeUCDPAdjustment(country, ucdpEvents, activeConflicts) {
  let adjustment = 0;

  // Count events for this country
  if (ucdpEvents?.events) {
    const countryEvents = ucdpEvents.events.filter(
      e => e.country?.toLowerCase() === country.toLowerCase()
    );
    const eventCount = countryEvents.length;
    const totalDeaths = countryEvents.reduce(
      (sum, e) => sum + (e.deathsBest || 0), 0
    );

    // Event count contribution (0-10 points)
    if (eventCount >= 50) adjustment += 10;
    else if (eventCount >= 20) adjustment += 7;
    else if (eventCount >= 10) adjustment += 5;
    else if (eventCount >= 5) adjustment += 3;
    else if (eventCount >= 1) adjustment += 1;

    // Fatality contribution (0-10 points)
    if (totalDeaths >= 1000) adjustment += 10;
    else if (totalDeaths >= 500) adjustment += 7;
    else if (totalDeaths >= 100) adjustment += 5;
    else if (totalDeaths >= 25) adjustment += 3;
    else if (totalDeaths >= 1) adjustment += 1;
  }

  // Check if country has active conflicts marked as "War" intensity
  if (activeConflicts?.conflicts) {
    const hasWar = activeConflicts.conflicts.some(
      c => c.location?.toLowerCase().includes(country.toLowerCase()) &&
           c.intensity === 'War'
    );
    if (hasWar) adjustment += 5;
  }

  return Math.min(adjustment, 20);
}

/**
 * Compute stability adjustment based on protest, military, and instability data.
 * Uses the ISO alpha-2 country code to match stability heatmap points.
 * Returns 0-15 additional risk points.
 */
function computeStabilityAdjustment(isoCode, stabilityData) {
  if (!isoCode || !stabilityData) return 0;

  let adjustment = 0;
  const code = isoCode.toUpperCase();

  // Protest intensity (0-5 points)
  if (stabilityData.protests?.heatmapPoints) {
    const protestPoint = stabilityData.protests.heatmapPoints.find(
      p => p.countryCode === code
    );
    if (protestPoint) {
      const intensity = protestPoint.intensity || 0;
      if (intensity >= 8) adjustment += 5;
      else if (intensity >= 5) adjustment += 3;
      else if (intensity >= 2) adjustment += 1;
    }
  }

  // Military indicators (0-5 points)
  if (stabilityData.military?.indicators) {
    const milIndicator = stabilityData.military.indicators.find(
      m => m.countryCode === code
    );
    if (milIndicator) {
      if (milIndicator.severity === 'critical') adjustment += 5;
      else if (milIndicator.severity === 'high') adjustment += 3;
      else if (milIndicator.severity === 'elevated') adjustment += 2;
    }
  }

  // Instability alerts (0-5 points)
  if (stabilityData.instability?.alerts) {
    const alert = stabilityData.instability.alerts.find(
      a => a.countryCode === code
    );
    if (alert) {
      if (alert.severity === 'critical') adjustment += 5;
      else if (alert.severity === 'high') adjustment += 3;
      else if (alert.severity === 'elevated') adjustment += 2;
      else adjustment += 1;
    }
  }

  return Math.min(adjustment, 15);
}

/**
 * Compute sanctions adjustment.
 * Comprehensive sanctions add more risk than targeted sanctions.
 * Returns 0-10 additional risk points.
 */
function computeSanctionsAdjustment(country, sanctionsData) {
  if (!sanctionsData?.regimes) return 0;

  const regime = sanctionsData.regimes.find(
    r => r.country?.toLowerCase() === country.toLowerCase() ||
         r.country?.toLowerCase().startsWith(country.toLowerCase())
  );

  if (!regime) return 0;

  if (regime.level === 'comprehensive') return 10;
  if (regime.level === 'targeted') return 5;
  return 3;
}

/**
 * Compute economic risk adjustment from World Bank indicators.
 * High inflation, unemployment, or debt contribute to risk.
 * Returns 0-10 additional risk points.
 */
function computeEconomicAdjustment(wbData) {
  if (!wbData) return 0;

  let adjustment = 0;

  // High inflation (>20% = +3, >10% = +2, >7% = +1)
  if (wbData.inflation != null) {
    if (wbData.inflation > 20) adjustment += 3;
    else if (wbData.inflation > 10) adjustment += 2;
    else if (wbData.inflation > 7) adjustment += 1;
  }

  // Negative GDP growth (recession indicator)
  if (wbData.gdpGrowth != null) {
    if (wbData.gdpGrowth < -5) adjustment += 3;
    else if (wbData.gdpGrowth < -2) adjustment += 2;
    else if (wbData.gdpGrowth < 0) adjustment += 1;
  }

  // High unemployment (>20% = +2, >12% = +1)
  if (wbData.unemployment != null) {
    if (wbData.unemployment > 20) adjustment += 2;
    else if (wbData.unemployment > 12) adjustment += 1;
  }

  // Extreme debt-to-GDP (>100% = +2, >80% = +1)
  if (wbData.debtToGdp != null) {
    if (wbData.debtToGdp > 100) adjustment += 2;
    else if (wbData.debtToGdp > 80) adjustment += 1;
  }

  return Math.min(adjustment, 10);
}

function computeRiskLevel(score) {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 40) return 'elevated';
  if (score >= 20) return 'moderate';
  return 'low';
}

export const countryRiskService = {
  async getCountryRiskScores() {
    const cached = await cacheService.get(CACHE_KEY);
    if (cached) return cached;

    // Fetch all data sources in parallel; each can fail independently
    const [ucdpEventsResult, activeConflictsResult, stabilityResult, sanctionsResult] =
      await Promise.allSettled([
        ucdpService.getRecentEvents({ limit: 500 }),
        ucdpService.getActiveConflicts(),
        stabilityService.getCombinedData(),
        sanctionsService.getCombinedData(),
      ]);

    const ucdpEvents = ucdpEventsResult.status === 'fulfilled' ? ucdpEventsResult.value : null;
    const activeConflicts = activeConflictsResult.status === 'fulfilled' ? activeConflictsResult.value : null;
    const stabilityData = stabilityResult.status === 'fulfilled' ? stabilityResult.value : null;
    const sanctionsData = sanctionsResult.status === 'fulfilled' ? sanctionsResult.value : null;

    // Fetch World Bank data for all countries in parallel (batched)
    const countries = Object.keys(COUNTRY_COORDS);
    const wbDataMap = {};

    const wbPromises = countries.map(async (country) => {
      const isoCode = COUNTRY_TO_ISO[country];
      if (!isoCode) return;
      try {
        const data = await worldBankService.getEconomicData(isoCode);
        if (data) wbDataMap[country] = data;
      } catch (e) {
        // Silently skip countries where WB data is unavailable
      }
    });

    await Promise.allSettled(wbPromises);

    // Build the sanctioned countries set for the result flag
    const sanctionedCountries = new Set(
      (sanctionsData?.regimes || []).map(r => r.country)
    );

    // Compute dynamic scores for every country
    const scores = countries.map((country) => {
      const isoCode = COUNTRY_TO_ISO[country] || null;

      // 1. Category-based baseline (fragile=70, developing=40, stable=20)
      const baseline = getBaselineScore(country);

      // 2. UCDP conflict adjustment (0-20)
      const ucdpAdj = computeUCDPAdjustment(country, ucdpEvents, activeConflicts);

      // 3. Stability adjustment — protests, military, instability (0-15)
      const stabilityAdj = computeStabilityAdjustment(isoCode, stabilityData);

      // 4. Sanctions adjustment (0-10)
      const sanctionsAdj = computeSanctionsAdjustment(country, sanctionsData);

      // 5. Economic risk adjustment from World Bank (0-10)
      const economicAdj = computeEconomicAdjustment(wbDataMap[country] || null);

      // Composite score clamped to [0, 100]
      const rawScore = baseline + ucdpAdj + stabilityAdj + sanctionsAdj + economicAdj;
      const finalScore = Math.max(0, Math.min(100, rawScore));

      const coords = COUNTRY_COORDS[country] || {};
      const isSanctioned = sanctionedCountries.has(country);

      return {
        country,
        score: finalScore,
        level: computeRiskLevel(finalScore),
        sanctioned: isSanctioned,
        lat: coords.lat || null,
        lon: coords.lon || null,
        trend: 'stable', // Could be computed from historical snapshots
        breakdown: {
          baseline,
          ucdpConflict: ucdpAdj,
          stability: stabilityAdj,
          sanctions: sanctionsAdj,
          economic: economicAdj,
        },
      };
    });

    scores.sort((a, b) => b.score - a.score);

    const result = {
      scores,
      summary: {
        total: scores.length,
        critical: scores.filter(s => s.level === 'critical').length,
        high: scores.filter(s => s.level === 'high').length,
        elevated: scores.filter(s => s.level === 'elevated').length,
        moderate: scores.filter(s => s.level === 'moderate').length,
        low: scores.filter(s => s.level === 'low').length,
        avgScore: Math.round(scores.reduce((s, c) => s + c.score, 0) / scores.length),
      },
      updatedAt: new Date().toISOString(),
    };

    await cacheService.set(CACHE_KEY, result, CACHE_TTL);
    return result;
  },
};
