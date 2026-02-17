/**
 * Regime Stability & Coup Risk Service
 * Computes dynamic regime stability scores and coup risk indicators by combining:
 * - Static regime metadata (type, leadership tenure, succession clarity, military role)
 * - GDELT real-time signals (coup/regime-change article volume)
 * - Stability data (protest intensity, military movements, instability alerts)
 * - World Bank economic stress indicators (inflation, unemployment, debt)
 *
 * Sources:
 *   GDELT Project API v2  — https://api.gdeltproject.org (free, no key)
 *   World Bank Indicators  — via worldBankService
 *   Stability signals      — via stabilityService
 *
 * Cache: 30 minutes (regime dynamics shift slowly, but signals refresh)
 */

import { cacheService } from './cache.service.js';
import { stabilityService } from './stability.service.js';
import { worldBankService } from './worldbank.service.js';
import { fetchGDELT as gdeltFetchArticles, fetchGDELTRaw } from './gdelt.client.js';

const CACHE_TTL = 1800; // 30 minutes
const CACHE_KEY_COMBINED = 'regime:combined';
const CACHE_KEY_PROFILES = 'regime:profiles';
const GDELT_BASE = 'https://api.gdeltproject.org/api/v2/doc/doc';

// ─── Risk level thresholds ───
const RISK_THRESHOLDS = {
  extreme: 80,
  high: 60,
  elevated: 40,
  moderate: 20,
};

function classifyRisk(score) {
  if (score >= RISK_THRESHOLDS.extreme) return 'extreme';
  if (score >= RISK_THRESHOLDS.high) return 'high';
  if (score >= RISK_THRESHOLDS.elevated) return 'elevated';
  if (score >= RISK_THRESHOLDS.moderate) return 'moderate';
  return 'low';
}

// ─── Base risk multipliers by regime type ───
const REGIME_BASE_RISK = {
  'democracy': 5,
  'hybrid': 30,
  'authoritarian': 55,
  'military-junta': 70,
  'one-party': 50,
  'monarchy': 25,
  'theocracy': 45,
};

// ─── Country name lookup by ISO alpha-2 ───
const ISO_TO_NAME = {
  AF: 'Afghanistan', AL: 'Albania', DZ: 'Algeria', AO: 'Angola', AR: 'Argentina',
  AM: 'Armenia', AU: 'Australia', AT: 'Austria', AZ: 'Azerbaijan', BH: 'Bahrain',
  BD: 'Bangladesh', BY: 'Belarus', BE: 'Belgium', BJ: 'Benin', BO: 'Bolivia',
  BA: 'Bosnia and Herzegovina', BW: 'Botswana', BR: 'Brazil', BN: 'Brunei',
  BG: 'Bulgaria', BF: 'Burkina Faso', BI: 'Burundi', KH: 'Cambodia', CM: 'Cameroon',
  CA: 'Canada', CF: 'Central African Republic', TD: 'Chad', CL: 'Chile', CN: 'China',
  CO: 'Colombia', CD: 'DR Congo', CG: 'Republic of Congo', CR: 'Costa Rica',
  CI: 'Ivory Coast', HR: 'Croatia', CU: 'Cuba', CZ: 'Czech Republic', DK: 'Denmark',
  DJ: 'Djibouti', DO: 'Dominican Republic', EC: 'Ecuador', EG: 'Egypt',
  SV: 'El Salvador', GQ: 'Equatorial Guinea', ER: 'Eritrea', EE: 'Estonia',
  SZ: 'Eswatini', ET: 'Ethiopia', FI: 'Finland', FR: 'France', GA: 'Gabon',
  GE: 'Georgia', DE: 'Germany', GH: 'Ghana', GR: 'Greece', GT: 'Guatemala',
  GN: 'Guinea', GW: 'Guinea-Bissau', HT: 'Haiti', HN: 'Honduras', HU: 'Hungary',
  IN: 'India', ID: 'Indonesia', IR: 'Iran', IQ: 'Iraq', IE: 'Ireland',
  IL: 'Israel', IT: 'Italy', JP: 'Japan', JO: 'Jordan', KZ: 'Kazakhstan',
  KE: 'Kenya', KP: 'North Korea', KR: 'South Korea', KW: 'Kuwait', KG: 'Kyrgyzstan',
  LA: 'Laos', LV: 'Latvia', LB: 'Lebanon', LY: 'Libya', LT: 'Lithuania',
  MG: 'Madagascar', MW: 'Malawi', MY: 'Malaysia', ML: 'Mali', MR: 'Mauritania',
  MX: 'Mexico', MD: 'Moldova', MN: 'Mongolia', MA: 'Morocco', MZ: 'Mozambique',
  MM: 'Myanmar', NA: 'Namibia', NP: 'Nepal', NL: 'Netherlands', NZ: 'New Zealand',
  NI: 'Nicaragua', NE: 'Niger', NG: 'Nigeria', NO: 'Norway', OM: 'Oman',
  PK: 'Pakistan', PS: 'Palestine', PA: 'Panama', PY: 'Paraguay', PE: 'Peru',
  PH: 'Philippines', PL: 'Poland', PT: 'Portugal', QA: 'Qatar', RO: 'Romania',
  RU: 'Russia', RW: 'Rwanda', SA: 'Saudi Arabia', SN: 'Senegal', RS: 'Serbia',
  SL: 'Sierra Leone', SG: 'Singapore', SK: 'Slovakia', SI: 'Slovenia', SO: 'Somalia',
  ZA: 'South Africa', SS: 'South Sudan', ES: 'Spain', LK: 'Sri Lanka', SD: 'Sudan',
  SE: 'Sweden', CH: 'Switzerland', SY: 'Syria', TW: 'Taiwan', TJ: 'Tajikistan',
  TZ: 'Tanzania', TH: 'Thailand', TG: 'Togo', TN: 'Tunisia', TR: 'Turkey',
  TM: 'Turkmenistan', UG: 'Uganda', UA: 'Ukraine', AE: 'United Arab Emirates',
  GB: 'United Kingdom', US: 'United States', UY: 'Uruguay', UZ: 'Uzbekistan',
  VE: 'Venezuela', VN: 'Vietnam', YE: 'Yemen', ZM: 'Zambia', ZW: 'Zimbabwe',
};

// ─── Static regime metadata for 55 countries ───
// regimeType | transitionRisk (0-100) | leaderSince | succession | militaryRole | iso2
const REGIME_DATA = {
  AF: {
    country: 'Afghanistan',
    iso2: 'AF',
    regimeType: 'authoritarian',
    transitionRisk: 80,
    leaderSince: 2021,
    succession: 'unclear',
    militaryRole: 'ruler',
  },
  MM: {
    country: 'Myanmar',
    iso2: 'MM',
    regimeType: 'military-junta',
    transitionRisk: 85,
    leaderSince: 2021,
    succession: 'contested',
    militaryRole: 'ruler',
  },
  SD: {
    country: 'Sudan',
    iso2: 'SD',
    regimeType: 'military-junta',
    transitionRisk: 90,
    leaderSince: 2021,
    succession: 'contested',
    militaryRole: 'ruler',
  },
  SS: {
    country: 'South Sudan',
    iso2: 'SS',
    regimeType: 'authoritarian',
    transitionRisk: 85,
    leaderSince: 2011,
    succession: 'unclear',
    militaryRole: 'praetorian',
  },
  SY: {
    country: 'Syria',
    iso2: 'SY',
    regimeType: 'authoritarian',
    transitionRisk: 75,
    leaderSince: 2000,
    succession: 'unclear',
    militaryRole: 'praetorian',
  },
  YE: {
    country: 'Yemen',
    iso2: 'YE',
    regimeType: 'authoritarian',
    transitionRisk: 80,
    leaderSince: 2012,
    succession: 'contested',
    militaryRole: 'praetorian',
  },
  LY: {
    country: 'Libya',
    iso2: 'LY',
    regimeType: 'hybrid',
    transitionRisk: 75,
    leaderSince: 2021,
    succession: 'contested',
    militaryRole: 'praetorian',
  },
  SO: {
    country: 'Somalia',
    iso2: 'SO',
    regimeType: 'hybrid',
    transitionRisk: 80,
    leaderSince: 2022,
    succession: 'unclear',
    militaryRole: 'moderate-influence',
  },
  IQ: {
    country: 'Iraq',
    iso2: 'IQ',
    regimeType: 'hybrid',
    transitionRisk: 55,
    leaderSince: 2022,
    succession: 'unclear',
    militaryRole: 'moderate-influence',
  },
  CF: {
    country: 'Central African Republic',
    iso2: 'CF',
    regimeType: 'authoritarian',
    transitionRisk: 75,
    leaderSince: 2016,
    succession: 'unclear',
    militaryRole: 'praetorian',
  },
  CD: {
    country: 'DR Congo',
    iso2: 'CD',
    regimeType: 'hybrid',
    transitionRisk: 65,
    leaderSince: 2019,
    succession: 'unclear',
    militaryRole: 'moderate-influence',
  },
  TD: {
    country: 'Chad',
    iso2: 'TD',
    regimeType: 'military-junta',
    transitionRisk: 70,
    leaderSince: 2021,
    succession: 'unclear',
    militaryRole: 'ruler',
  },
  ML: {
    country: 'Mali',
    iso2: 'ML',
    regimeType: 'military-junta',
    transitionRisk: 75,
    leaderSince: 2021,
    succession: 'contested',
    militaryRole: 'ruler',
  },
  BF: {
    country: 'Burkina Faso',
    iso2: 'BF',
    regimeType: 'military-junta',
    transitionRisk: 80,
    leaderSince: 2022,
    succession: 'contested',
    militaryRole: 'ruler',
  },
  NE: {
    country: 'Niger',
    iso2: 'NE',
    regimeType: 'military-junta',
    transitionRisk: 75,
    leaderSince: 2023,
    succession: 'contested',
    militaryRole: 'ruler',
  },
  GN: {
    country: 'Guinea',
    iso2: 'GN',
    regimeType: 'military-junta',
    transitionRisk: 70,
    leaderSince: 2021,
    succession: 'unclear',
    militaryRole: 'ruler',
  },
  GA: {
    country: 'Gabon',
    iso2: 'GA',
    regimeType: 'military-junta',
    transitionRisk: 55,
    leaderSince: 2023,
    succession: 'unclear',
    militaryRole: 'ruler',
  },
  RU: {
    country: 'Russia',
    iso2: 'RU',
    regimeType: 'authoritarian',
    transitionRisk: 40,
    leaderSince: 2000,
    succession: 'unclear',
    militaryRole: 'moderate-influence',
  },
  BY: {
    country: 'Belarus',
    iso2: 'BY',
    regimeType: 'authoritarian',
    transitionRisk: 45,
    leaderSince: 1994,
    succession: 'unclear',
    militaryRole: 'moderate-influence',
  },
  CN: {
    country: 'China',
    iso2: 'CN',
    regimeType: 'one-party',
    transitionRisk: 15,
    leaderSince: 2012,
    succession: 'unclear',
    militaryRole: 'moderate-influence',
  },
  KP: {
    country: 'North Korea',
    iso2: 'KP',
    regimeType: 'one-party',
    transitionRisk: 20,
    leaderSince: 2011,
    succession: 'unclear',
    militaryRole: 'praetorian',
  },
  CU: {
    country: 'Cuba',
    iso2: 'CU',
    regimeType: 'one-party',
    transitionRisk: 30,
    leaderSince: 2018,
    succession: 'clear',
    militaryRole: 'moderate-influence',
  },
  VN: {
    country: 'Vietnam',
    iso2: 'VN',
    regimeType: 'one-party',
    transitionRisk: 15,
    leaderSince: 2021,
    succession: 'clear',
    militaryRole: 'civilian-control',
  },
  LA: {
    country: 'Laos',
    iso2: 'LA',
    regimeType: 'one-party',
    transitionRisk: 15,
    leaderSince: 2021,
    succession: 'clear',
    militaryRole: 'moderate-influence',
  },
  IR: {
    country: 'Iran',
    iso2: 'IR',
    regimeType: 'theocracy',
    transitionRisk: 50,
    leaderSince: 1989,
    succession: 'unclear',
    militaryRole: 'praetorian',
  },
  SA: {
    country: 'Saudi Arabia',
    iso2: 'SA',
    regimeType: 'monarchy',
    transitionRisk: 20,
    leaderSince: 2015,
    succession: 'clear',
    militaryRole: 'civilian-control',
  },
  AE: {
    country: 'United Arab Emirates',
    iso2: 'AE',
    regimeType: 'monarchy',
    transitionRisk: 10,
    leaderSince: 2022,
    succession: 'clear',
    militaryRole: 'civilian-control',
  },
  JO: {
    country: 'Jordan',
    iso2: 'JO',
    regimeType: 'monarchy',
    transitionRisk: 20,
    leaderSince: 1999,
    succession: 'clear',
    militaryRole: 'civilian-control',
  },
  MA: {
    country: 'Morocco',
    iso2: 'MA',
    regimeType: 'monarchy',
    transitionRisk: 15,
    leaderSince: 1999,
    succession: 'clear',
    militaryRole: 'civilian-control',
  },
  BH: {
    country: 'Bahrain',
    iso2: 'BH',
    regimeType: 'monarchy',
    transitionRisk: 30,
    leaderSince: 2002,
    succession: 'clear',
    militaryRole: 'moderate-influence',
  },
  QA: {
    country: 'Qatar',
    iso2: 'QA',
    regimeType: 'monarchy',
    transitionRisk: 10,
    leaderSince: 2013,
    succession: 'clear',
    militaryRole: 'civilian-control',
  },
  KW: {
    country: 'Kuwait',
    iso2: 'KW',
    regimeType: 'monarchy',
    transitionRisk: 15,
    leaderSince: 2023,
    succession: 'clear',
    militaryRole: 'civilian-control',
  },
  OM: {
    country: 'Oman',
    iso2: 'OM',
    regimeType: 'monarchy',
    transitionRisk: 10,
    leaderSince: 2020,
    succession: 'clear',
    militaryRole: 'civilian-control',
  },
  SZ: {
    country: 'Eswatini',
    iso2: 'SZ',
    regimeType: 'monarchy',
    transitionRisk: 35,
    leaderSince: 1986,
    succession: 'unclear',
    militaryRole: 'moderate-influence',
  },
  EG: {
    country: 'Egypt',
    iso2: 'EG',
    regimeType: 'authoritarian',
    transitionRisk: 35,
    leaderSince: 2014,
    succession: 'unclear',
    militaryRole: 'praetorian',
  },
  TH: {
    country: 'Thailand',
    iso2: 'TH',
    regimeType: 'hybrid',
    transitionRisk: 40,
    leaderSince: 2023,
    succession: 'unclear',
    militaryRole: 'praetorian',
  },
  PK: {
    country: 'Pakistan',
    iso2: 'PK',
    regimeType: 'hybrid',
    transitionRisk: 50,
    leaderSince: 2024,
    succession: 'contested',
    militaryRole: 'praetorian',
  },
  TR: {
    country: 'Turkey',
    iso2: 'TR',
    regimeType: 'hybrid',
    transitionRisk: 30,
    leaderSince: 2014,
    succession: 'unclear',
    militaryRole: 'moderate-influence',
  },
  VE: {
    country: 'Venezuela',
    iso2: 'VE',
    regimeType: 'authoritarian',
    transitionRisk: 55,
    leaderSince: 2013,
    succession: 'contested',
    militaryRole: 'praetorian',
  },
  NI: {
    country: 'Nicaragua',
    iso2: 'NI',
    regimeType: 'authoritarian',
    transitionRisk: 40,
    leaderSince: 2007,
    succession: 'unclear',
    militaryRole: 'moderate-influence',
  },
  HT: {
    country: 'Haiti',
    iso2: 'HT',
    regimeType: 'hybrid',
    transitionRisk: 75,
    leaderSince: 2024,
    succession: 'contested',
    militaryRole: 'moderate-influence',
  },
  UA: {
    country: 'Ukraine',
    iso2: 'UA',
    regimeType: 'democracy',
    transitionRisk: 20,
    leaderSince: 2019,
    succession: 'clear',
    militaryRole: 'civilian-control',
  },
  GE: {
    country: 'Georgia',
    iso2: 'GE',
    regimeType: 'hybrid',
    transitionRisk: 35,
    leaderSince: 2024,
    succession: 'contested',
    militaryRole: 'civilian-control',
  },
  TN: {
    country: 'Tunisia',
    iso2: 'TN',
    regimeType: 'authoritarian',
    transitionRisk: 40,
    leaderSince: 2019,
    succession: 'unclear',
    militaryRole: 'civilian-control',
  },
  ET: {
    country: 'Ethiopia',
    iso2: 'ET',
    regimeType: 'hybrid',
    transitionRisk: 50,
    leaderSince: 2018,
    succession: 'unclear',
    militaryRole: 'moderate-influence',
  },
  ER: {
    country: 'Eritrea',
    iso2: 'ER',
    regimeType: 'authoritarian',
    transitionRisk: 45,
    leaderSince: 1993,
    succession: 'unclear',
    militaryRole: 'praetorian',
  },
  RW: {
    country: 'Rwanda',
    iso2: 'RW',
    regimeType: 'authoritarian',
    transitionRisk: 30,
    leaderSince: 2000,
    succession: 'unclear',
    militaryRole: 'moderate-influence',
  },
  UG: {
    country: 'Uganda',
    iso2: 'UG',
    regimeType: 'authoritarian',
    transitionRisk: 40,
    leaderSince: 1986,
    succession: 'unclear',
    militaryRole: 'praetorian',
  },
  BD: {
    country: 'Bangladesh',
    iso2: 'BD',
    regimeType: 'hybrid',
    transitionRisk: 45,
    leaderSince: 2024,
    succession: 'unclear',
    militaryRole: 'moderate-influence',
  },
  PH: {
    country: 'Philippines',
    iso2: 'PH',
    regimeType: 'democracy',
    transitionRisk: 20,
    leaderSince: 2022,
    succession: 'clear',
    militaryRole: 'moderate-influence',
  },
  KH: {
    country: 'Cambodia',
    iso2: 'KH',
    regimeType: 'authoritarian',
    transitionRisk: 30,
    leaderSince: 2023,
    succession: 'clear',
    militaryRole: 'moderate-influence',
  },
  MZ: {
    country: 'Mozambique',
    iso2: 'MZ',
    regimeType: 'hybrid',
    transitionRisk: 45,
    leaderSince: 2024,
    succession: 'contested',
    militaryRole: 'moderate-influence',
  },
  NG: {
    country: 'Nigeria',
    iso2: 'NG',
    regimeType: 'democracy',
    transitionRisk: 30,
    leaderSince: 2023,
    succession: 'clear',
    militaryRole: 'moderate-influence',
  },
  ZW: {
    country: 'Zimbabwe',
    iso2: 'ZW',
    regimeType: 'authoritarian',
    transitionRisk: 45,
    leaderSince: 2017,
    succession: 'unclear',
    militaryRole: 'praetorian',
  },
  TJ: {
    country: 'Tajikistan',
    iso2: 'TJ',
    regimeType: 'authoritarian',
    transitionRisk: 35,
    leaderSince: 1994,
    succession: 'unclear',
    militaryRole: 'moderate-influence',
  },
  TM: {
    country: 'Turkmenistan',
    iso2: 'TM',
    regimeType: 'authoritarian',
    transitionRisk: 30,
    leaderSince: 2022,
    succession: 'clear',
    militaryRole: 'moderate-influence',
  },
  UZ: {
    country: 'Uzbekistan',
    iso2: 'UZ',
    regimeType: 'authoritarian',
    transitionRisk: 25,
    leaderSince: 2016,
    succession: 'unclear',
    militaryRole: 'moderate-influence',
  },
  KZ: {
    country: 'Kazakhstan',
    iso2: 'KZ',
    regimeType: 'authoritarian',
    transitionRisk: 30,
    leaderSince: 2019,
    succession: 'unclear',
    militaryRole: 'civilian-control',
  },
  AZ: {
    country: 'Azerbaijan',
    iso2: 'AZ',
    regimeType: 'authoritarian',
    transitionRisk: 25,
    leaderSince: 2003,
    succession: 'unclear',
    militaryRole: 'moderate-influence',
  },
};

// ─── GDELT fetch helper (via shared rate-limited client) ───
async function fetchGDELT(query, maxRecords = 50, timespan = '7d') {
  return gdeltFetchArticles(query, { maxRecords, timespan, caller: 'Regime' });
}

// ─── GDELT article count helper ───
async function fetchGDELTArticleCount(query, timespan = '7d') {
  const articles = await gdeltFetchArticles(query, { maxRecords: 250, timespan, caller: 'Regime' });
  return articles.length;
}

// ─── Main service class ───
class RegimeService {
  /**
   * Compute dynamic coup risk score for a single country.
   * Combines base regime risk with live GDELT signals, stability data,
   * and World Bank economic stress.
   *
   * @param {string} countryCode - ISO alpha-2 country code
   * @returns {{ score: number, level: string, factors: Array, signals: Array }}
   */
  async computeCoupRisk(countryCode) {
    const cacheKey = `regime:couprisk:${countryCode}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const regime = REGIME_DATA[countryCode];
    if (!regime) {
      return { score: 0, level: 'low', factors: [], signals: [] };
    }

    const factors = [];
    const signals = [];
    let score = 0;

    // ── Factor 1: Base regime type risk ──
    const baseRisk = REGIME_BASE_RISK[regime.regimeType] || 20;
    score += baseRisk;
    factors.push({
      name: 'Regime type',
      detail: regime.regimeType,
      weight: baseRisk,
      description: `Base risk for ${regime.regimeType} regime`,
    });

    // ── Factor 2: Years in power ──
    const currentYear = new Date().getFullYear();
    const yearsInPower = currentYear - regime.leaderSince;
    let tenureFactor = 0;

    if (regime.regimeType === 'democracy') {
      // Democracies: longer tenure is stabilizing (within constitutional norms)
      tenureFactor = Math.max(-5, -yearsInPower);
    } else {
      // Non-democracies: longer tenure increases stagnation and succession risk
      if (yearsInPower > 20) {
        tenureFactor = 15;
      } else if (yearsInPower > 10) {
        tenureFactor = 10;
      } else if (yearsInPower > 5) {
        tenureFactor = 5;
      } else if (yearsInPower <= 2) {
        // Very new regimes (e.g., post-coup) are unstable
        tenureFactor = 12;
      } else {
        tenureFactor = 3;
      }
    }
    score += tenureFactor;
    factors.push({
      name: 'Leadership tenure',
      detail: `${yearsInPower} years (since ${regime.leaderSince})`,
      weight: tenureFactor,
      description: yearsInPower <= 2
        ? 'Recent leadership change increases instability'
        : yearsInPower > 20
          ? 'Prolonged rule raises succession anxiety'
          : 'Moderate tenure effect',
    });

    // ── Factor 3: Military role ──
    let militaryFactor = 0;
    switch (regime.militaryRole) {
      case 'ruler':
        militaryFactor = 20;
        break;
      case 'praetorian':
        militaryFactor = 20;
        break;
      case 'moderate-influence':
        militaryFactor = 8;
        break;
      case 'civilian-control':
        militaryFactor = 0;
        break;
      default:
        militaryFactor = 5;
    }
    score += militaryFactor;
    factors.push({
      name: 'Military role',
      detail: regime.militaryRole,
      weight: militaryFactor,
      description: regime.militaryRole === 'ruler' || regime.militaryRole === 'praetorian'
        ? 'Military directly involved in governance'
        : 'Military has limited political role',
    });

    // ── Factor 4: Succession clarity ──
    let successionFactor = 0;
    switch (regime.succession) {
      case 'contested':
        successionFactor = 25;
        break;
      case 'unclear':
        successionFactor = 15;
        break;
      case 'clear':
        successionFactor = 0;
        break;
      default:
        successionFactor = 10;
    }
    score += successionFactor;
    factors.push({
      name: 'Succession clarity',
      detail: regime.succession,
      weight: successionFactor,
      description: regime.succession === 'contested'
        ? 'Active power struggle or disputed succession'
        : regime.succession === 'unclear'
          ? 'No clear succession mechanism'
          : 'Orderly succession plan in place',
    });

    // ── Factor 5: GDELT coup/regime change signals ──
    let gdeltFactor = 0;
    try {
      const countryName = ISO_TO_NAME[countryCode] || regime.country;
      const gdeltQuery = `"coup" OR "military takeover" OR "regime change" ${countryName}`;
      const articles = await fetchGDELT(gdeltQuery, 50, '14d');
      const articleCount = articles.length;

      if (articleCount >= 30) {
        gdeltFactor = 15;
        signals.push({
          type: 'gdelt_volume',
          detail: `${articleCount} coup/regime-change articles in 14 days`,
          severity: 'critical',
        });
      } else if (articleCount >= 15) {
        gdeltFactor = 10;
        signals.push({
          type: 'gdelt_volume',
          detail: `${articleCount} coup/regime-change articles in 14 days`,
          severity: 'high',
        });
      } else if (articleCount >= 5) {
        gdeltFactor = 5;
        signals.push({
          type: 'gdelt_volume',
          detail: `${articleCount} coup/regime-change articles in 14 days`,
          severity: 'moderate',
        });
      }

      // Add recent article titles as signals
      for (const article of articles.slice(0, 3)) {
        signals.push({
          type: 'gdelt_article',
          title: article.title,
          url: article.url,
          source: article.source,
          date: article.date,
        });
      }
    } catch (err) {
      console.warn(`[RegimeService] GDELT signal fetch failed for ${countryCode}:`, err.message);
    }
    score += gdeltFactor;
    if (gdeltFactor > 0) {
      factors.push({
        name: 'GDELT coup signals',
        detail: `Signal strength: ${gdeltFactor > 10 ? 'strong' : gdeltFactor > 5 ? 'moderate' : 'weak'}`,
        weight: gdeltFactor,
        description: 'Real-time media coverage of coup/regime-change activity',
      });
    }

    // ── Factor 6: Stability data (protests & instability) ──
    let stabilityFactor = 0;
    try {
      const stabilityData = await stabilityService.getCombinedData();
      if (stabilityData) {
        // Check protest intensity for this country
        const protestPoints = (stabilityData.protests?.heatmapPoints || [])
          .filter((p) => p.countryCode === countryCode);
        const protestIntensity = protestPoints.reduce((sum, p) => sum + (p.intensity || 0), 0);

        if (protestIntensity >= 8) {
          stabilityFactor += 20;
          signals.push({
            type: 'protest_intensity',
            detail: `High protest intensity: ${protestIntensity}/10`,
            severity: 'critical',
          });
        } else if (protestIntensity >= 5) {
          stabilityFactor += 15;
          signals.push({
            type: 'protest_intensity',
            detail: `Elevated protest intensity: ${protestIntensity}/10`,
            severity: 'high',
          });
        } else if (protestIntensity >= 3) {
          stabilityFactor += 10;
          signals.push({
            type: 'protest_intensity',
            detail: `Moderate protest activity: ${protestIntensity}/10`,
            severity: 'moderate',
          });
        }

        // Check military movement indicators
        const militaryIndicators = (stabilityData.military?.indicators || [])
          .filter((m) => m.countryCode === countryCode);
        if (militaryIndicators.length > 0) {
          const milCount = militaryIndicators.reduce((s, m) => s + (m.count || 1), 0);
          if (milCount >= 5) {
            stabilityFactor += 10;
            signals.push({
              type: 'military_movement',
              detail: `${milCount} military movement reports detected`,
              severity: 'high',
            });
          } else if (milCount >= 2) {
            stabilityFactor += 5;
            signals.push({
              type: 'military_movement',
              detail: `${milCount} military movement reports detected`,
              severity: 'moderate',
            });
          }
        }

        // Check instability alerts
        const instabilityAlerts = (stabilityData.instability?.alerts || [])
          .filter((a) => a.countryCode === countryCode);
        if (instabilityAlerts.length > 0) {
          stabilityFactor += 5;
          signals.push({
            type: 'instability_alert',
            detail: `${instabilityAlerts.length} instability alert(s) active`,
            severity: instabilityAlerts.length >= 3 ? 'high' : 'moderate',
          });
        }
      }
    } catch (err) {
      console.warn(`[RegimeService] Stability data fetch failed for ${countryCode}:`, err.message);
    }
    score += stabilityFactor;
    if (stabilityFactor > 0) {
      factors.push({
        name: 'Stability signals',
        detail: `Protest/military/instability indicators`,
        weight: stabilityFactor,
        description: 'Combined domestic unrest and military activity signals',
      });
    }

    // ── Factor 7: Economic stress (World Bank) ──
    let economicFactor = 0;
    try {
      const econ = await worldBankService.getCountryIndicators(countryCode);
      if (econ) {
        // High inflation stress
        const inflation = econ.inflation?.value;
        if (inflation !== null && inflation !== undefined) {
          if (inflation > 25) {
            economicFactor += 15;
            signals.push({
              type: 'economic_inflation',
              detail: `Extreme inflation: ${inflation.toFixed(1)}%`,
              severity: 'critical',
            });
          } else if (inflation > 15) {
            economicFactor += 10;
            signals.push({
              type: 'economic_inflation',
              detail: `High inflation: ${inflation.toFixed(1)}%`,
              severity: 'high',
            });
          } else if (inflation > 8) {
            economicFactor += 5;
            signals.push({
              type: 'economic_inflation',
              detail: `Elevated inflation: ${inflation.toFixed(1)}%`,
              severity: 'moderate',
            });
          }
        }

        // Unemployment stress
        const unemployment = econ.unemployment?.value;
        if (unemployment !== null && unemployment !== undefined) {
          if (unemployment > 20) {
            economicFactor += 10;
            signals.push({
              type: 'economic_unemployment',
              detail: `Very high unemployment: ${unemployment.toFixed(1)}%`,
              severity: 'high',
            });
          } else if (unemployment > 12) {
            economicFactor += 5;
            signals.push({
              type: 'economic_unemployment',
              detail: `High unemployment: ${unemployment.toFixed(1)}%`,
              severity: 'moderate',
            });
          }
        }

        // Negative GDP growth
        const gdpGrowth = econ.gdpGrowth?.value;
        if (gdpGrowth !== null && gdpGrowth !== undefined && gdpGrowth < -2) {
          economicFactor += 5;
          signals.push({
            type: 'economic_contraction',
            detail: `GDP contraction: ${gdpGrowth.toFixed(1)}%`,
            severity: 'moderate',
          });
        }
      }
    } catch (err) {
      console.warn(`[RegimeService] World Bank data fetch failed for ${countryCode}:`, err.message);
    }
    score += economicFactor;
    if (economicFactor > 0) {
      factors.push({
        name: 'Economic stress',
        detail: `Economic pressure indicators`,
        weight: economicFactor,
        description: 'Inflation, unemployment, and growth stress from World Bank data',
      });
    }

    // ── Clamp final score to 0-100 ──
    score = Math.max(0, Math.min(100, Math.round(score)));
    const level = classifyRisk(score);

    const result = { score, level, factors, signals };

    // Cache the result
    try {
      await cacheService.set(cacheKey, result, CACHE_TTL);
    } catch (err) {
      console.warn(`[RegimeService] Cache set failed for ${cacheKey}:`, err.message);
    }

    return result;
  }

  /**
   * Fetch GDELT articles related to regime instability for a specific country.
   *
   * @param {string} countryCode - ISO alpha-2 code
   * @param {number} maxRecords - Maximum articles to return
   * @returns {Array} Recent regime-related news articles
   */
  async getCountrySignals(countryCode, maxRecords = 10) {
    const cacheKey = `regime:signals:${countryCode}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const regime = REGIME_DATA[countryCode];
    if (!regime) return [];

    const countryName = ISO_TO_NAME[countryCode] || regime.country;
    const queries = [
      `"coup" OR "military takeover" ${countryName}`,
      `"political crisis" OR "power struggle" ${countryName}`,
      `"regime" OR "government collapse" ${countryName}`,
    ];

    const results = await Promise.allSettled(
      queries.map((q) => fetchGDELT(q, Math.ceil(maxRecords / 2), '14d'))
    );

    // Merge and deduplicate by URL
    const seenUrls = new Set();
    const merged = [];
    for (const result of results) {
      if (result.status !== 'fulfilled') continue;
      for (const article of result.value) {
        if (!seenUrls.has(article.url)) {
          seenUrls.add(article.url);
          merged.push(article);
        }
      }
    }

    // Sort by date descending and limit
    const sorted = merged
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      .slice(0, maxRecords);

    try {
      await cacheService.set(cacheKey, sorted, CACHE_TTL);
    } catch (err) {
      console.warn(`[RegimeService] Cache set failed for signals ${countryCode}:`, err.message);
    }

    return sorted;
  }

  /**
   * Get all regime profiles with computed coup risk scores.
   * Each profile includes static metadata + dynamic risk assessment.
   *
   * @returns {Array} Array of regime profile objects
   */
  async getRegimeProfiles() {
    const cached = await cacheService.get(CACHE_KEY_PROFILES);
    if (cached) return cached;

    const countryCodes = Object.keys(REGIME_DATA);
    const profiles = [];

    // Process countries in batches of 8 to avoid overwhelming external APIs
    const batchSize = 8;
    for (let i = 0; i < countryCodes.length; i += batchSize) {
      const batch = countryCodes.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(
        batch.map(async (code) => {
          const regime = REGIME_DATA[code];
          const [coupRisk, recentEvents] = await Promise.allSettled([
            this.computeCoupRisk(code),
            this.getCountrySignals(code, 5),
          ]);

          return {
            country: regime.country,
            iso2: regime.iso2,
            regimeType: regime.regimeType,
            leaderSince: regime.leaderSince,
            succession: regime.succession,
            militaryRole: regime.militaryRole,
            transitionRisk: regime.transitionRisk,
            coupRisk: coupRisk.status === 'fulfilled'
              ? coupRisk.value
              : { score: regime.transitionRisk, level: classifyRisk(regime.transitionRisk), factors: [], signals: [] },
            stabilitySignals: (coupRisk.status === 'fulfilled' ? coupRisk.value.signals : [])
              .filter((s) => s.type === 'protest_intensity' || s.type === 'military_movement' || s.type === 'instability_alert'),
            recentEvents: recentEvents.status === 'fulfilled' ? recentEvents.value : [],
          };
        })
      );

      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          profiles.push(result.value);
        }
      }
    }

    // Sort by coup risk score descending
    profiles.sort((a, b) => (b.coupRisk?.score || 0) - (a.coupRisk?.score || 0));

    try {
      await cacheService.set(CACHE_KEY_PROFILES, profiles, CACHE_TTL);
    } catch (err) {
      console.warn('[RegimeService] Cache set failed for profiles:', err.message);
    }

    return profiles;
  }

  /**
   * Main data method: returns combined regime data for the frontend.
   * Includes all profiles, high-risk subset, and summary statistics.
   *
   * @returns {{ profiles, highRisk, summary, updatedAt }}
   */
  async getCombinedData() {
    const cached = await cacheService.get(CACHE_KEY_COMBINED);
    if (cached) return cached;

    const profiles = await this.getRegimeProfiles();

    // Build summary statistics
    const summary = {
      total: profiles.length,
      extreme: 0,
      high: 0,
      elevated: 0,
      moderate: 0,
      low: 0,
      avgScore: 0,
    };

    let totalScore = 0;
    for (const profile of profiles) {
      const level = profile.coupRisk?.level || 'low';
      summary[level] = (summary[level] || 0) + 1;
      totalScore += profile.coupRisk?.score || 0;
    }
    summary.avgScore = profiles.length > 0
      ? Math.round(totalScore / profiles.length)
      : 0;

    // High-risk countries (extreme or high)
    const highRisk = profiles.filter(
      (p) => p.coupRisk?.level === 'extreme' || p.coupRisk?.level === 'high'
    );

    const result = {
      profiles,
      highRisk,
      summary,
      updatedAt: new Date().toISOString(),
    };

    try {
      await cacheService.set(CACHE_KEY_COMBINED, result, CACHE_TTL);
    } catch (err) {
      console.warn('[RegimeService] Cache set failed for combined data:', err.message);
    }

    return result;
  }

  /**
   * Look up a single country's regime data by code.
   *
   * @param {string} countryCode - ISO alpha-2 code
   * @returns {Object|null} Regime profile or null
   */
  async getCountryProfile(countryCode) {
    const code = (countryCode || '').toUpperCase();
    const regime = REGIME_DATA[code];
    if (!regime) return null;

    const [coupRisk, recentEvents] = await Promise.allSettled([
      this.computeCoupRisk(code),
      this.getCountrySignals(code, 10),
    ]);

    return {
      country: regime.country,
      iso2: regime.iso2,
      regimeType: regime.regimeType,
      leaderSince: regime.leaderSince,
      succession: regime.succession,
      militaryRole: regime.militaryRole,
      transitionRisk: regime.transitionRisk,
      coupRisk: coupRisk.status === 'fulfilled'
        ? coupRisk.value
        : { score: regime.transitionRisk, level: classifyRisk(regime.transitionRisk), factors: [], signals: [] },
      stabilitySignals: (coupRisk.status === 'fulfilled' ? coupRisk.value.signals : [])
        .filter((s) => ['protest_intensity', 'military_movement', 'instability_alert'].includes(s.type)),
      recentEvents: recentEvents.status === 'fulfilled' ? recentEvents.value : [],
    };
  }

  /**
   * Get static regime metadata (no dynamic computation).
   * Useful for quick lookups without API calls.
   *
   * @param {string} countryCode - ISO alpha-2 code
   * @returns {Object|null} Static regime data or null
   */
  getStaticData(countryCode) {
    return REGIME_DATA[(countryCode || '').toUpperCase()] || null;
  }

  /**
   * Get all tracked country codes.
   *
   * @returns {string[]} Array of ISO alpha-2 codes
   */
  getTrackedCountries() {
    return Object.keys(REGIME_DATA);
  }

  /**
   * Invalidate all regime caches. Called when external data sources
   * report significant updates.
   */
  async invalidateCache() {
    try {
      const keys = [
        CACHE_KEY_COMBINED,
        CACHE_KEY_PROFILES,
        ...Object.keys(REGIME_DATA).map((c) => `regime:couprisk:${c}`),
        ...Object.keys(REGIME_DATA).map((c) => `regime:signals:${c}`),
      ];
      await Promise.allSettled(keys.map((k) => cacheService.del(k)));
      console.info('[RegimeService] Cache invalidated');
    } catch (err) {
      console.warn('[RegimeService] Cache invalidation failed:', err.message);
    }
  }
}

export const regimeService = new RegimeService();
