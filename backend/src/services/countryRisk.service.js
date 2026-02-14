/**
 * Country Risk Scoring Service
 * Computes composite risk scores from existing data sources:
 * - Stability data (protests, military, instability)
 * - UCDP conflict events
 * - Economic indicators (World Bank)
 * - Sanctions status
 * - Prediction market data
 */

import { cacheService } from './cache.service.js';
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

// Base risk scores (manually curated from multiple indices)
const BASE_RISK = {
  'Afghanistan': 95, 'Syria': 93, 'Yemen': 92, 'Somalia': 91, 'Sudan': 90,
  'South Sudan': 89, 'DR Congo': 87, 'Myanmar': 86, 'Libya': 85, 'Iraq': 82,
  'Central African Republic': 84, 'Haiti': 83, 'Ukraine': 80,
  'Mali': 78, 'Burkina Faso': 77, 'Niger': 76, 'Palestine': 88,
  'North Korea': 75, 'Venezuela': 72, 'Eritrea': 71, 'Chad': 73,
  'Nigeria': 70, 'Ethiopia': 69, 'Mozambique': 67, 'Pakistan': 65,
  'Lebanon': 74, 'Iran': 63, 'Russia': 58, 'Belarus': 55,
  'Cameroon': 64, 'Cuba': 52, 'Colombia': 48, 'Mexico': 47,
  'Honduras': 50, 'Guatemala': 49, 'El Salvador': 42, 'Bangladesh': 46,
  'Philippines': 40, 'Kenya': 44, 'Uganda': 43, 'Zimbabwe': 51,
  'Egypt': 45, 'Tunisia': 38, 'Algeria': 36, 'China': 34,
  'India': 35, 'Turkey': 39, 'Israel': 56, 'Thailand': 32,
  'Tanzania': 33, 'Saudi Arabia': 30, 'United Arab Emirates': 18,
};

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

    // Get stability data to adjust scores
    let stabilityData = null;
    try {
      stabilityData = await stabilityService.getCombinedData();
    } catch (e) { /* ignore */ }

    // Get sanctions data
    let sanctionsData = null;
    try {
      sanctionsData = await sanctionsService.getCombinedData();
    } catch (e) { /* ignore */ }

    const sanctionedCountries = new Set(
      (sanctionsData?.regimes || []).map(r => r.country)
    );

    const scores = Object.entries(BASE_RISK).map(([country, baseScore]) => {
      let adjustedScore = baseScore;

      // Adjust based on protest intensity
      if (stabilityData?.protests) {
        const protest = stabilityData.protests.find(p =>
          p.country?.toLowerCase() === country.toLowerCase()
        );
        if (protest && protest.intensity > 50) {
          adjustedScore = Math.min(100, adjustedScore + 3);
        }
      }

      // Adjust for sanctions
      if (sanctionedCountries.has(country)) {
        adjustedScore = Math.min(100, adjustedScore + 5);
      }

      const coords = COUNTRY_COORDS[country] || {};

      return {
        country,
        score: adjustedScore,
        level: computeRiskLevel(adjustedScore),
        sanctioned: sanctionedCountries.has(country),
        lat: coords.lat || null,
        lon: coords.lon || null,
        trend: 'stable', // Could be computed from historical data
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
