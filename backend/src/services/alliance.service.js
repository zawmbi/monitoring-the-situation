/**
 * Alliance Network Service
 * Tracks geopolitical alliance networks, strength scores, and diplomatic tensions.
 *
 * Data sources:
 *   - Static reference data for major alliances/blocs and bilateral relationships
 *   - GDELT Project for real-time article tone analysis on alliance cohesion
 *   - Computed strength scores blending base cohesion with live sentiment signals
 */

import { cacheService } from './cache.service.js';
import { fetchGDELTRaw } from './gdelt.client.js';

const CACHE_TTL = 3600; // 1 hour

const CACHE_KEYS = {
  combined: 'alliance:combined',
  strength: 'alliance:strength',
  tensions: 'alliance:tensions',
};

const GDELT_BASE = 'https://api.gdeltproject.org/api/v2/doc/doc';

// ---------------------------------------------------------------------------
// Reference data: major alliances and blocs
// ---------------------------------------------------------------------------

const ALLIANCE_DATA = [
  {
    id: 'nato',
    name: 'NATO',
    type: 'military',
    founded: 1949,
    hq: 'Brussels, Belgium',
    color: '#3b82f6',
    gdeltQuery: 'NATO alliance OR NATO summit OR NATO unity OR NATO disagreement',
    baseCohesion: 78,
    members: [
      { country: 'United States', iso2: 'US', role: 'leader' },
      { country: 'United Kingdom', iso2: 'GB', role: 'core' },
      { country: 'France', iso2: 'FR', role: 'core' },
      { country: 'Germany', iso2: 'DE', role: 'core' },
      { country: 'Canada', iso2: 'CA', role: 'core' },
      { country: 'Italy', iso2: 'IT', role: 'core' },
      { country: 'Spain', iso2: 'ES', role: 'member' },
      { country: 'Turkey', iso2: 'TR', role: 'member' },
      { country: 'Poland', iso2: 'PL', role: 'member' },
      { country: 'Netherlands', iso2: 'NL', role: 'member' },
      { country: 'Belgium', iso2: 'BE', role: 'member' },
      { country: 'Norway', iso2: 'NO', role: 'member' },
      { country: 'Denmark', iso2: 'DK', role: 'member' },
      { country: 'Portugal', iso2: 'PT', role: 'member' },
      { country: 'Czech Republic', iso2: 'CZ', role: 'member' },
      { country: 'Romania', iso2: 'RO', role: 'member' },
      { country: 'Hungary', iso2: 'HU', role: 'member' },
      { country: 'Bulgaria', iso2: 'BG', role: 'member' },
      { country: 'Greece', iso2: 'GR', role: 'member' },
      { country: 'Estonia', iso2: 'EE', role: 'member' },
      { country: 'Latvia', iso2: 'LV', role: 'member' },
      { country: 'Lithuania', iso2: 'LT', role: 'member' },
      { country: 'Slovakia', iso2: 'SK', role: 'member' },
      { country: 'Slovenia', iso2: 'SI', role: 'member' },
      { country: 'Albania', iso2: 'AL', role: 'member' },
      { country: 'Croatia', iso2: 'HR', role: 'member' },
      { country: 'Montenegro', iso2: 'ME', role: 'member' },
      { country: 'North Macedonia', iso2: 'MK', role: 'member' },
      { country: 'Finland', iso2: 'FI', role: 'member' },
      { country: 'Sweden', iso2: 'SE', role: 'member' },
    ],
  },
  {
    id: 'eu',
    name: 'European Union',
    type: 'economic',
    founded: 1993,
    hq: 'Brussels, Belgium',
    color: '#eab308',
    gdeltQuery: 'European Union unity OR EU summit OR EU disagreement OR EU policy division',
    baseCohesion: 65,
    members: [
      { country: 'Germany', iso2: 'DE', role: 'core' },
      { country: 'France', iso2: 'FR', role: 'core' },
      { country: 'Italy', iso2: 'IT', role: 'core' },
      { country: 'Spain', iso2: 'ES', role: 'core' },
      { country: 'Netherlands', iso2: 'NL', role: 'member' },
      { country: 'Belgium', iso2: 'BE', role: 'member' },
      { country: 'Austria', iso2: 'AT', role: 'member' },
      { country: 'Poland', iso2: 'PL', role: 'member' },
      { country: 'Sweden', iso2: 'SE', role: 'member' },
      { country: 'Denmark', iso2: 'DK', role: 'member' },
      { country: 'Finland', iso2: 'FI', role: 'member' },
      { country: 'Ireland', iso2: 'IE', role: 'member' },
      { country: 'Portugal', iso2: 'PT', role: 'member' },
      { country: 'Greece', iso2: 'GR', role: 'member' },
      { country: 'Czech Republic', iso2: 'CZ', role: 'member' },
      { country: 'Romania', iso2: 'RO', role: 'member' },
      { country: 'Hungary', iso2: 'HU', role: 'member' },
      { country: 'Bulgaria', iso2: 'BG', role: 'member' },
      { country: 'Croatia', iso2: 'HR', role: 'member' },
      { country: 'Slovakia', iso2: 'SK', role: 'member' },
      { country: 'Slovenia', iso2: 'SI', role: 'member' },
      { country: 'Lithuania', iso2: 'LT', role: 'member' },
      { country: 'Latvia', iso2: 'LV', role: 'member' },
      { country: 'Estonia', iso2: 'EE', role: 'member' },
      { country: 'Luxembourg', iso2: 'LU', role: 'member' },
      { country: 'Malta', iso2: 'MT', role: 'member' },
      { country: 'Cyprus', iso2: 'CY', role: 'member' },
    ],
  },
  {
    id: 'brics-plus',
    name: 'BRICS+',
    type: 'economic',
    founded: 2006,
    hq: 'Rotating Presidency',
    color: '#22c55e',
    gdeltQuery: 'BRICS summit OR BRICS expansion OR BRICS unity OR BRICS cooperation',
    baseCohesion: 52,
    members: [
      { country: 'Brazil', iso2: 'BR', role: 'founding' },
      { country: 'Russia', iso2: 'RU', role: 'founding' },
      { country: 'India', iso2: 'IN', role: 'founding' },
      { country: 'China', iso2: 'CN', role: 'founding' },
      { country: 'South Africa', iso2: 'ZA', role: 'founding' },
      { country: 'Egypt', iso2: 'EG', role: 'new member' },
      { country: 'Ethiopia', iso2: 'ET', role: 'new member' },
      { country: 'Iran', iso2: 'IR', role: 'new member' },
      { country: 'UAE', iso2: 'AE', role: 'new member' },
      { country: 'Saudi Arabia', iso2: 'SA', role: 'new member' },
    ],
  },
  {
    id: 'five-eyes',
    name: 'Five Eyes',
    type: 'intelligence',
    founded: 1941,
    hq: 'Distributed',
    color: '#06b6d4',
    gdeltQuery: 'Five Eyes intelligence OR FVEY cooperation OR Five Eyes alliance',
    baseCohesion: 92,
    members: [
      { country: 'United States', iso2: 'US', role: 'core' },
      { country: 'United Kingdom', iso2: 'GB', role: 'core' },
      { country: 'Canada', iso2: 'CA', role: 'core' },
      { country: 'Australia', iso2: 'AU', role: 'core' },
      { country: 'New Zealand', iso2: 'NZ', role: 'core' },
    ],
  },
  {
    id: 'quad',
    name: 'Quadrilateral Security Dialogue',
    type: 'political',
    founded: 2007,
    hq: 'Rotating',
    color: '#8b5cf6',
    gdeltQuery: 'QUAD alliance OR Quad summit OR Quad Indo-Pacific OR Quad security',
    baseCohesion: 68,
    members: [
      { country: 'United States', iso2: 'US', role: 'core' },
      { country: 'Japan', iso2: 'JP', role: 'core' },
      { country: 'India', iso2: 'IN', role: 'core' },
      { country: 'Australia', iso2: 'AU', role: 'core' },
    ],
  },
  {
    id: 'aukus',
    name: 'AUKUS',
    type: 'military',
    founded: 2021,
    hq: 'Distributed',
    color: '#ef4444',
    gdeltQuery: 'AUKUS submarine OR AUKUS defense OR AUKUS military cooperation',
    baseCohesion: 85,
    members: [
      { country: 'Australia', iso2: 'AU', role: 'core' },
      { country: 'United Kingdom', iso2: 'GB', role: 'core' },
      { country: 'United States', iso2: 'US', role: 'core' },
    ],
  },
  {
    id: 'sco',
    name: 'Shanghai Cooperation Organization',
    type: 'political',
    founded: 2001,
    hq: 'Beijing, China',
    color: '#f97316',
    gdeltQuery: 'SCO summit OR Shanghai Cooperation Organization OR SCO cooperation',
    baseCohesion: 55,
    members: [
      { country: 'China', iso2: 'CN', role: 'founding' },
      { country: 'Russia', iso2: 'RU', role: 'founding' },
      { country: 'India', iso2: 'IN', role: 'member' },
      { country: 'Pakistan', iso2: 'PK', role: 'member' },
      { country: 'Kazakhstan', iso2: 'KZ', role: 'founding' },
      { country: 'Kyrgyzstan', iso2: 'KG', role: 'founding' },
      { country: 'Tajikistan', iso2: 'TJ', role: 'founding' },
      { country: 'Uzbekistan', iso2: 'UZ', role: 'founding' },
      { country: 'Iran', iso2: 'IR', role: 'member' },
    ],
  },
  {
    id: 'african-union',
    name: 'African Union',
    type: 'political',
    founded: 2002,
    hq: 'Addis Ababa, Ethiopia',
    color: '#10b981',
    gdeltQuery: 'African Union summit OR AU peace OR African Union cooperation',
    baseCohesion: 42,
    members: [
      { country: 'Nigeria', iso2: 'NG', role: 'key member' },
      { country: 'South Africa', iso2: 'ZA', role: 'key member' },
      { country: 'Egypt', iso2: 'EG', role: 'key member' },
      { country: 'Ethiopia', iso2: 'ET', role: 'host' },
      { country: 'Kenya', iso2: 'KE', role: 'key member' },
      { country: 'Ghana', iso2: 'GH', role: 'member' },
      { country: 'Algeria', iso2: 'DZ', role: 'member' },
      { country: 'Morocco', iso2: 'MA', role: 'member' },
      { country: 'Tanzania', iso2: 'TZ', role: 'member' },
      { country: 'Rwanda', iso2: 'RW', role: 'member' },
      { country: 'Senegal', iso2: 'SN', role: 'member' },
      { country: 'Ivory Coast', iso2: 'CI', role: 'member' },
      { country: 'DR Congo', iso2: 'CD', role: 'member' },
      { country: 'Uganda', iso2: 'UG', role: 'member' },
      { country: 'Angola', iso2: 'AO', role: 'member' },
    ],
  },
  {
    id: 'asean',
    name: 'ASEAN',
    type: 'economic',
    founded: 1967,
    hq: 'Jakarta, Indonesia',
    color: '#0ea5e9',
    gdeltQuery: 'ASEAN summit OR ASEAN unity OR ASEAN cooperation OR ASEAN trade',
    baseCohesion: 58,
    members: [
      { country: 'Indonesia', iso2: 'ID', role: 'founding' },
      { country: 'Malaysia', iso2: 'MY', role: 'founding' },
      { country: 'Philippines', iso2: 'PH', role: 'founding' },
      { country: 'Singapore', iso2: 'SG', role: 'founding' },
      { country: 'Thailand', iso2: 'TH', role: 'founding' },
      { country: 'Brunei', iso2: 'BN', role: 'member' },
      { country: 'Vietnam', iso2: 'VN', role: 'member' },
      { country: 'Laos', iso2: 'LA', role: 'member' },
      { country: 'Myanmar', iso2: 'MM', role: 'member' },
      { country: 'Cambodia', iso2: 'KH', role: 'member' },
    ],
  },
  {
    id: 'gcc',
    name: 'Gulf Cooperation Council',
    type: 'economic',
    founded: 1981,
    hq: 'Riyadh, Saudi Arabia',
    color: '#a855f7',
    gdeltQuery: 'GCC summit OR Gulf Cooperation Council OR GCC unity OR GCC cooperation',
    baseCohesion: 62,
    members: [
      { country: 'Saudi Arabia', iso2: 'SA', role: 'leader' },
      { country: 'UAE', iso2: 'AE', role: 'core' },
      { country: 'Qatar', iso2: 'QA', role: 'member' },
      { country: 'Kuwait', iso2: 'KW', role: 'member' },
      { country: 'Bahrain', iso2: 'BH', role: 'member' },
      { country: 'Oman', iso2: 'OM', role: 'member' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Reference data: key bilateral tensions
// ---------------------------------------------------------------------------

const BILATERAL_TENSIONS = [
  {
    id: 'us-china',
    pair: ['US', 'CN'],
    names: ['United States', 'China'],
    baseTension: 72,
    gdeltQuery: 'US China tension OR US China trade war OR US China rivalry',
    issues: ['Trade war', 'Taiwan', 'South China Sea', 'Technology rivalry', 'Espionage'],
  },
  {
    id: 'us-russia',
    pair: ['US', 'RU'],
    names: ['United States', 'Russia'],
    baseTension: 85,
    gdeltQuery: 'US Russia tension OR US Russia sanctions OR US Russia conflict',
    issues: ['Ukraine war', 'NATO expansion', 'Nuclear arms', 'Sanctions', 'Election interference'],
  },
  {
    id: 'india-pakistan',
    pair: ['IN', 'PK'],
    names: ['India', 'Pakistan'],
    baseTension: 68,
    gdeltQuery: 'India Pakistan tension OR Kashmir conflict OR India Pakistan border',
    issues: ['Kashmir dispute', 'Cross-border terrorism', 'Nuclear rivalry', 'Water disputes'],
  },
  {
    id: 'india-china',
    pair: ['IN', 'CN'],
    names: ['India', 'China'],
    baseTension: 58,
    gdeltQuery: 'India China border tension OR LAC standoff OR India China rivalry',
    issues: ['LAC border dispute', 'Arunachal Pradesh', 'Trade imbalance', 'BRI competition'],
  },
  {
    id: 'israel-iran',
    pair: ['IL', 'IR'],
    names: ['Israel', 'Iran'],
    baseTension: 90,
    gdeltQuery: 'Israel Iran conflict OR Israel Iran attack OR Iran nuclear Israel threat',
    issues: ['Nuclear program', 'Proxy wars', 'Hezbollah', 'Direct strikes', 'Regional dominance'],
  },
  {
    id: 'saudi-iran',
    pair: ['SA', 'IR'],
    names: ['Saudi Arabia', 'Iran'],
    baseTension: 55,
    gdeltQuery: 'Saudi Iran tension OR Saudi Iran rivalry OR Saudi Iran proxy',
    issues: ['Sectarian rivalry', 'Yemen proxy war', 'Oil competition', 'Regional influence'],
  },
  {
    id: 'turkey-greece',
    pair: ['TR', 'GR'],
    names: ['Turkey', 'Greece'],
    baseTension: 45,
    gdeltQuery: 'Turkey Greece tension OR Aegean dispute OR Turkey Greece conflict',
    issues: ['Aegean Sea disputes', 'Cyprus', 'Airspace violations', 'Maritime boundaries'],
  },
  {
    id: 'japan-china',
    pair: ['JP', 'CN'],
    names: ['Japan', 'China'],
    baseTension: 52,
    gdeltQuery: 'Japan China tension OR Senkaku islands OR Japan China dispute',
    issues: ['Senkaku/Diaoyu Islands', 'Historical grievances', 'Military buildup', 'Taiwan stance'],
  },
  {
    id: 'south-north-korea',
    pair: ['KR', 'KP'],
    names: ['South Korea', 'North Korea'],
    baseTension: 75,
    gdeltQuery: 'North Korea South Korea tension OR Korean peninsula crisis OR North Korea provocation',
    issues: ['Nuclear weapons', 'Missile tests', 'DMZ incidents', 'Reunification deadlock'],
  },
  {
    id: 'russia-ukraine',
    pair: ['RU', 'UA'],
    names: ['Russia', 'Ukraine'],
    baseTension: 98,
    gdeltQuery: 'Russia Ukraine war OR Russia Ukraine conflict OR Ukraine frontline',
    issues: ['Active war', 'Crimea', 'Donbas', 'Energy weaponization', 'War crimes allegations'],
  },
  {
    id: 'china-taiwan',
    pair: ['CN', 'TW'],
    names: ['China', 'Taiwan'],
    baseTension: 65,
    gdeltQuery: 'China Taiwan tension OR Taiwan strait crisis OR China Taiwan military',
    issues: ['Sovereignty claims', 'Military exercises', 'International recognition', 'US arms sales'],
  },
  {
    id: 'us-iran',
    pair: ['US', 'IR'],
    names: ['United States', 'Iran'],
    baseTension: 78,
    gdeltQuery: 'US Iran tension OR US Iran sanctions OR Iran nuclear deal',
    issues: ['Nuclear program', 'Sanctions', 'Regional proxies', 'Drone strikes', 'Strait of Hormuz'],
  },
];

// ---------------------------------------------------------------------------
// GDELT fetchers
// ---------------------------------------------------------------------------

/**
 * Fetch GDELT articles and extract average tone for a given query.
 * Returns { articleCount, avgTone } where tone ranges from -10 (very negative) to +10 (very positive).
 */
async function fetchGdeltTone(query, timespan = '14d') {
  try {
    const url =
      `${GDELT_BASE}?query=${encodeURIComponent(query)}` +
      `&mode=ToneChart&timespan=${timespan}&format=json`;

    const data = await fetchGDELTRaw(url, 'Alliance');
    if (!data || Object.keys(data).length === 0) return { articleCount: 0, avgTone: 0 };
    const timeline = data.timeline || [];

    if (timeline.length === 0) return { articleCount: 0, avgTone: 0 };

    // ToneChart returns series of tone data points
    let totalTone = 0;
    let totalCount = 0;

    for (const series of timeline) {
      const dataPoints = series.data || [];
      for (const point of dataPoints) {
        const value = point.value || 0;
        totalTone += value;
        totalCount += 1;
      }
    }

    const avgTone = totalCount > 0 ? totalTone / totalCount : 0;
    return { articleCount: totalCount, avgTone };
  } catch {
    return { articleCount: 0, avgTone: 0 };
  }
}

/**
 * Fetch GDELT article count for a given query.
 * Returns total number of articles matching the query in the given timespan.
 */
async function fetchGdeltArticleCount(query, timespan = '14d') {
  try {
    const url =
      `${GDELT_BASE}?query=${encodeURIComponent(query)}` +
      `&mode=ArtList&maxrecords=250&timespan=${timespan}&format=json`;

    const data = await fetchGDELTRaw(url, 'Alliance');
    if (!data) return 0;
    const articles = data.articles || [];
    return articles.length;
  } catch {
    return 0;
  }
}

// ---------------------------------------------------------------------------
// Score computation helpers
// ---------------------------------------------------------------------------

/**
 * Convert GDELT tone to a strength modifier.
 * Positive tone boosts alliance strength, negative tone reduces it.
 * Returns a modifier in range [-20, +15].
 */
function toneToStrengthModifier(avgTone) {
  // GDELT tone ranges roughly -10 to +10
  // Map to [-20, +15] modifier
  if (avgTone >= 5) return 15;
  if (avgTone >= 2) return 10;
  if (avgTone >= 0.5) return 5;
  if (avgTone >= -0.5) return 0;
  if (avgTone >= -2) return -5;
  if (avgTone >= -5) return -10;
  return -20;
}

/**
 * Convert GDELT tone to a tension modifier.
 * Negative tone increases tension, positive tone decreases it.
 * Returns a modifier in range [-15, +20].
 */
function toneToTensionModifier(avgTone) {
  if (avgTone >= 5) return -15;
  if (avgTone >= 2) return -10;
  if (avgTone >= 0.5) return -5;
  if (avgTone >= -0.5) return 0;
  if (avgTone >= -2) return 5;
  if (avgTone >= -5) return 10;
  return 20;
}

/**
 * Determine trend based on tone value.
 */
function determineTrend(avgTone) {
  if (avgTone >= 1.5) return 'strengthening';
  if (avgTone <= -1.5) return 'weakening';
  return 'stable';
}

/**
 * Generate human-readable signals based on tone and article count.
 */
function generateStrengthSignals(allianceName, avgTone, articleCount) {
  const signals = [];

  if (articleCount > 100) {
    signals.push(`High media coverage: ${articleCount} articles in 14d`);
  } else if (articleCount > 30) {
    signals.push(`Moderate media coverage: ${articleCount} articles in 14d`);
  } else if (articleCount > 0) {
    signals.push(`Low media coverage: ${articleCount} articles in 14d`);
  }

  if (avgTone >= 3) {
    signals.push(`Strong positive sentiment in ${allianceName} coverage`);
  } else if (avgTone >= 1) {
    signals.push(`Slightly positive media tone toward ${allianceName}`);
  } else if (avgTone <= -3) {
    signals.push(`Significant negative sentiment in ${allianceName} coverage`);
  } else if (avgTone <= -1) {
    signals.push(`Mildly negative media tone toward ${allianceName}`);
  }

  if (signals.length === 0) {
    signals.push(`Neutral media environment for ${allianceName}`);
  }

  return signals;
}

/**
 * Get the tension severity label from a tension score.
 */
function getTensionSeverity(score) {
  if (score >= 85) return 'critical';
  if (score >= 70) return 'high';
  if (score >= 50) return 'elevated';
  if (score >= 30) return 'moderate';
  return 'low';
}

// ---------------------------------------------------------------------------
// Main service class
// ---------------------------------------------------------------------------

class AllianceService {
  /**
   * Compute the dynamic strength score for a single alliance.
   * Blends base cohesion with GDELT tone analysis.
   *
   * Returns: { score: 0-100, trend, signals: [...], gdelt: { avgTone, articleCount } }
   */
  async computeAllianceStrength(allianceId) {
    const cacheKey = `${CACHE_KEYS.strength}:${allianceId}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const alliance = ALLIANCE_DATA.find(a => a.id === allianceId);
    if (!alliance) {
      console.warn(`[Alliance] Unknown alliance ID: ${allianceId}`);
      return null;
    }

    console.log(`[Alliance] Computing strength for ${alliance.name}...`);

    try {
      // Fetch GDELT tone data for this alliance
      const { avgTone, articleCount } = await fetchGdeltTone(alliance.gdeltQuery, '14d');

      // Compute strength modifier from media tone
      const toneModifier = toneToStrengthModifier(avgTone);

      // Internal tension penalty: alliances with members in rival blocs lose cohesion
      const internalTensionPenalty = this.computeInternalTensionPenalty(alliance);

      // Size penalty: very large alliances tend to have lower cohesion
      const sizePenalty = alliance.members.length > 20 ? -5 : 0;

      // Compute final score
      const rawScore = alliance.baseCohesion + toneModifier - internalTensionPenalty + sizePenalty;
      const score = Math.min(100, Math.max(0, Math.round(rawScore)));

      // Determine trend from tone direction
      const trend = determineTrend(avgTone);

      // Generate human-readable signals
      const signals = generateStrengthSignals(alliance.name, avgTone, articleCount);

      // Add internal tension signal if applicable
      if (internalTensionPenalty > 3) {
        signals.push(`Internal member tensions detected (-${internalTensionPenalty} cohesion)`);
      }

      const result = {
        allianceId: alliance.id,
        allianceName: alliance.name,
        score,
        trend,
        signals,
        components: {
          baseCohesion: alliance.baseCohesion,
          toneModifier,
          internalTensionPenalty,
          sizePenalty,
        },
        gdelt: {
          avgTone: Math.round(avgTone * 100) / 100,
          articleCount,
        },
        computedAt: new Date().toISOString(),
      };

      await cacheService.set(cacheKey, result, CACHE_TTL);
      console.log(`[Alliance] ${alliance.name} strength: ${score}/100 (${trend})`);
      return result;
    } catch (error) {
      console.error(`[Alliance] Failed to compute strength for ${alliance.name}:`, error.message);

      // Fallback to base cohesion on failure
      return {
        allianceId: alliance.id,
        allianceName: alliance.name,
        score: alliance.baseCohesion,
        trend: 'stable',
        signals: ['Live data unavailable, using baseline estimate'],
        components: { baseCohesion: alliance.baseCohesion, toneModifier: 0, internalTensionPenalty: 0, sizePenalty: 0 },
        gdelt: { avgTone: 0, articleCount: 0 },
        computedAt: new Date().toISOString(),
      };
    }
  }

  /**
   * Compute internal tension penalty for an alliance.
   * Checks if any alliance members appear in bilateral tension pairs with
   * other members of the same alliance.
   *
   * Returns a penalty score (0-15).
   */
  computeInternalTensionPenalty(alliance) {
    const memberCodes = new Set(alliance.members.map(m => m.iso2));
    let maxTension = 0;
    let tensionCount = 0;

    for (const bt of BILATERAL_TENSIONS) {
      const [a, b] = bt.pair;
      if (memberCodes.has(a) && memberCodes.has(b)) {
        tensionCount += 1;
        maxTension = Math.max(maxTension, bt.baseTension);
      }
    }

    if (tensionCount === 0) return 0;

    // Penalty scales with number of internal rivalries and their severity
    const avgPenalty = (maxTension / 100) * 10;
    const countBonus = Math.min(tensionCount - 1, 3) * 2;
    return Math.min(15, Math.round(avgPenalty + countBonus));
  }

  /**
   * Compute current bilateral tension levels for all tracked pairs.
   * Adjusts base tension scores using GDELT media tone analysis.
   *
   * Returns array of tension objects with current scores and metadata.
   */
  async computeBilateralTensions() {
    const cached = await cacheService.get(CACHE_KEYS.tensions);
    if (cached) return cached;

    console.log('[Alliance] Computing bilateral tensions...');

    const tensionResults = await Promise.allSettled(
      BILATERAL_TENSIONS.map(async (bt) => {
        try {
          const { avgTone, articleCount } = await fetchGdeltTone(bt.gdeltQuery, '14d');
          const toneModifier = toneToTensionModifier(avgTone);
          const currentTension = Math.min(100, Math.max(0, Math.round(bt.baseTension + toneModifier)));
          const severity = getTensionSeverity(currentTension);

          return {
            id: bt.id,
            pair: bt.pair,
            names: bt.names,
            baseTension: bt.baseTension,
            currentTension,
            severity,
            issues: bt.issues,
            gdelt: {
              avgTone: Math.round(avgTone * 100) / 100,
              articleCount,
              toneModifier,
            },
            trend: avgTone >= 1 ? 'de-escalating' : avgTone <= -1 ? 'escalating' : 'stable',
          };
        } catch (error) {
          console.error(`[Alliance] Failed to compute tension for ${bt.names.join('-')}:`, error.message);
          return {
            id: bt.id,
            pair: bt.pair,
            names: bt.names,
            baseTension: bt.baseTension,
            currentTension: bt.baseTension,
            severity: getTensionSeverity(bt.baseTension),
            issues: bt.issues,
            gdelt: { avgTone: 0, articleCount: 0, toneModifier: 0 },
            trend: 'stable',
          };
        }
      })
    );

    const tensions = tensionResults
      .map(r => (r.status === 'fulfilled' ? r.value : null))
      .filter(Boolean)
      .sort((a, b) => b.currentTension - a.currentTension);

    await cacheService.set(CACHE_KEYS.tensions, tensions, CACHE_TTL);
    console.log(`[Alliance] Computed ${tensions.length} bilateral tension scores`);
    return tensions;
  }

  /**
   * Get full alliance data with static metadata enriched with live strength scores.
   * Returns array of alliance objects with members, metadata, and dynamic strength.
   */
  async getAlliancesWithStrength() {
    console.log('[Alliance] Fetching all alliances with strength scores...');

    const strengthResults = await Promise.allSettled(
      ALLIANCE_DATA.map(a => this.computeAllianceStrength(a.id))
    );

    return ALLIANCE_DATA.map((alliance, idx) => {
      const strengthResult = strengthResults[idx];
      const strength = strengthResult.status === 'fulfilled' ? strengthResult.value : null;

      return {
        id: alliance.id,
        name: alliance.name,
        type: alliance.type,
        founded: alliance.founded,
        hq: alliance.hq,
        color: alliance.color,
        memberCount: alliance.members.length,
        members: alliance.members,
        strength: strength
          ? {
              score: strength.score,
              trend: strength.trend,
              signals: strength.signals,
              components: strength.components,
              gdelt: strength.gdelt,
            }
          : {
              score: alliance.baseCohesion,
              trend: 'stable',
              signals: ['Live data unavailable'],
              components: { baseCohesion: alliance.baseCohesion },
              gdelt: { avgTone: 0, articleCount: 0 },
            },
      };
    });
  }

  /**
   * Get combined alliance network data.
   * Main endpoint returning alliances, bilateral tensions, and summary statistics.
   *
   * Returns: { alliances, bilateralTensions, summary, updatedAt }
   */
  async getCombinedData() {
    const cached = await cacheService.get(CACHE_KEYS.combined);
    if (cached) return cached;

    console.log('[Alliance] Computing combined alliance network data...');

    const [alliances, bilateralTensions] = await Promise.all([
      this.getAlliancesWithStrength(),
      this.computeBilateralTensions(),
    ]);

    // Compute summary statistics
    const strengthScores = alliances.map(a => a.strength.score);
    const avgStrength = strengthScores.length > 0
      ? Math.round(strengthScores.reduce((s, v) => s + v, 0) / strengthScores.length)
      : 0;

    const criticalTensions = bilateralTensions.filter(t => t.severity === 'critical').length;
    const highTensions = bilateralTensions.filter(t => t.severity === 'high').length;
    const escalatingPairs = bilateralTensions.filter(t => t.trend === 'escalating').length;
    const deescalatingPairs = bilateralTensions.filter(t => t.trend === 'de-escalating').length;

    const weakestAlliance = alliances.reduce(
      (min, a) => (a.strength.score < min.score ? { name: a.name, score: a.strength.score } : min),
      { name: '', score: 101 }
    );

    const strongestAlliance = alliances.reduce(
      (max, a) => (a.strength.score > max.score ? { name: a.name, score: a.strength.score } : max),
      { name: '', score: -1 }
    );

    const hottestTension = bilateralTensions.length > 0
      ? { names: bilateralTensions[0].names, score: bilateralTensions[0].currentTension }
      : null;

    const summary = {
      totalAlliances: alliances.length,
      avgStrength,
      criticalTensions,
      highTensions,
      escalatingPairs,
      deescalatingPairs,
      activeDisputes: criticalTensions + highTensions,
      weakestAlliance,
      strongestAlliance,
      hottestTension,
    };

    const result = {
      alliances,
      bilateralTensions,
      summary,
      updatedAt: new Date().toISOString(),
    };

    await cacheService.set(CACHE_KEYS.combined, result, CACHE_TTL);
    console.log(
      `[Alliance] Combined data ready: ${alliances.length} alliances, ` +
      `${bilateralTensions.length} bilateral pairs, avg strength ${avgStrength}/100`
    );
    return result;
  }
}

export const allianceService = new AllianceService();
export default allianceService;
