/**
 * Country Risk Data Service
 * Pure data passthrough — returns raw upstream data per country from:
 *   - UCDP conflict events (event counts, fatalities)
 *   - Stability data (protest counts, military indicator counts)
 *   - Sanctions status (active sanctions regimes)
 *   - World Bank economic indicators (inflation, GDP growth, unemployment)
 *
 * No composite scores, no baselines, no risk level classifications,
 * no weighted adjustments, no 0-100 indices.
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

// ---------------------------------------------------------------------------
// Raw data extraction helpers (no scoring)
// ---------------------------------------------------------------------------

/**
 * Extract raw UCDP events and fatalities for a country.
 */
function extractUcdpData(country, ucdpEvents, activeConflicts) {
  let eventCount = 0;
  let totalDeaths = 0;
  let hasActiveWar = false;

  if (ucdpEvents?.events) {
    const countryEvents = ucdpEvents.events.filter(
      e => e.country?.toLowerCase() === country.toLowerCase()
    );
    eventCount = countryEvents.length;
    totalDeaths = countryEvents.reduce(
      (sum, e) => sum + (e.deathsBest || 0), 0
    );
  }

  if (activeConflicts?.conflicts) {
    hasActiveWar = activeConflicts.conflicts.some(
      c => c.location?.toLowerCase().includes(country.toLowerCase()) &&
           c.intensity === 'War'
    );
  }

  return { eventCount, totalDeaths, hasActiveWar };
}

/**
 * Extract raw stability indicators for a country.
 */
function extractStabilityData(isoCode, stabilityData) {
  if (!isoCode || !stabilityData) return { protestCount: 0, protestIntensity: null, militaryIndicators: [], instabilityAlerts: [] };

  const code = isoCode.toUpperCase();

  const protestPoint = (stabilityData.protests?.heatmapPoints || []).find(
    p => p.countryCode === code
  );

  const militaryIndicators = (stabilityData.military?.indicators || []).filter(
    m => m.countryCode === code
  );

  const instabilityAlerts = (stabilityData.instability?.alerts || []).filter(
    a => a.countryCode === code
  );

  return {
    protestCount: protestPoint?.count || 0,
    protestIntensity: protestPoint?.intensity ?? null,
    militaryIndicators: militaryIndicators.map(m => ({
      count: m.count || 0,
      severity: m.severity || null,
    })),
    instabilityAlerts: instabilityAlerts.map(a => ({
      count: a.count || 0,
      severity: a.severity || null,
    })),
  };
}

/**
 * Find sanctions data for a country from the sanctions service response.
 */
function extractSanctionsData(country, sanctionsData) {
  if (!sanctionsData?.regimes) return null;

  const regime = sanctionsData.regimes.find(
    r => r.country?.toLowerCase() === country.toLowerCase() ||
         r.country?.toLowerCase().startsWith(country.toLowerCase())
  );

  if (!regime) return null;

  return {
    country: regime.country,
    level: regime.level,
    programs: regime.programs || [],
    sectors: regime.sectors || [],
  };
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

    // Fetch World Bank data for all countries in parallel
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

    // Build raw data for every country
    const countryData = countries.map((country) => {
      const isoCode = COUNTRY_TO_ISO[country] || null;
      const coords = COUNTRY_COORDS[country] || {};

      // UCDP raw data
      const ucdp = extractUcdpData(country, ucdpEvents, activeConflicts);

      // Stability raw data
      const stability = extractStabilityData(isoCode, stabilityData);

      // Sanctions raw data
      const sanctions = extractSanctionsData(country, sanctionsData);

      // World Bank raw economic data
      const wb = wbDataMap[country] || null;
      const economics = wb ? {
        inflation: wb.inflation ?? null,
        gdpGrowth: wb.gdpGrowth ?? null,
        unemployment: wb.unemployment ?? null,
        debtToGdp: wb.debtToGdp ?? null,
        population: wb.population ?? null,
        tradePercGdp: wb.tradePercGdp ?? null,
        currentAccount: wb.currentAccount ?? null,
      } : null;

      return {
        country,
        isoCode,
        lat: coords.lat || null,
        lon: coords.lon || null,
        ucdp: {
          eventCount: ucdp.eventCount,
          totalDeaths: ucdp.totalDeaths,
          hasActiveWar: ucdp.hasActiveWar,
        },
        stability,
        sanctions,
        economics,
      };
    });

    const result = {
      countries: countryData,
      summary: {
        total: countryData.length,
        withUcdpEvents: countryData.filter(c => c.ucdp.eventCount > 0).length,
        withActiveWar: countryData.filter(c => c.ucdp.hasActiveWar).length,
        withSanctions: countryData.filter(c => c.sanctions !== null).length,
        withEconomicData: countryData.filter(c => c.economics !== null).length,
      },
      dataSources: [
        'UCDP (Uppsala Conflict Data Program) — https://ucdp.uu.se',
        'World Bank Indicators API — https://api.worldbank.org/v2/',
        'Stability service (GDELT + Google News RSS aggregation)',
        'Sanctions service (OFAC/EU sanctions data + Google News RSS)',
      ],
      updatedAt: new Date().toISOString(),
    };

    await cacheService.set(CACHE_KEY, result, CACHE_TTL);
    return result;
  },
};
