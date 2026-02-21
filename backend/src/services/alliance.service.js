/**
 * Alliance Network Data Service
 * Pure data passthrough — returns raw GDELT diplomatic tone data
 * between alliance member countries.
 *
 * No cohesion scores, no tone-to-strength modifiers, no internal tension
 * penalties, no composite alliance strength scores, no severity labels.
 *
 * Data sources:
 *   - Static reference data for major alliances/blocs and bilateral relationships
 *   - GDELT Project for raw article tone data on alliance/bilateral queries
 */

import { cacheService } from './cache.service.js';
import { fetchGDELTRaw } from './gdelt.client.js';

const CACHE_TTL = 3600; // 1 hour

const CACHE_KEYS = {
  combined: 'alliance:combined',
  toneData: 'alliance:tonedata',
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
// Reference data: key bilateral relationships
// ---------------------------------------------------------------------------

const BILATERAL_TENSIONS = [
  {
    id: 'us-china',
    pair: ['US', 'CN'],
    names: ['United States', 'China'],
    gdeltQuery: 'US China tension OR US China trade war OR US China rivalry',
    issues: ['Trade war', 'Taiwan', 'South China Sea', 'Technology rivalry', 'Espionage'],
  },
  {
    id: 'us-russia',
    pair: ['US', 'RU'],
    names: ['United States', 'Russia'],
    gdeltQuery: 'US Russia tension OR US Russia sanctions OR US Russia conflict',
    issues: ['Ukraine war', 'NATO expansion', 'Nuclear arms', 'Sanctions', 'Election interference'],
  },
  {
    id: 'india-pakistan',
    pair: ['IN', 'PK'],
    names: ['India', 'Pakistan'],
    gdeltQuery: 'India Pakistan tension OR Kashmir conflict OR India Pakistan border',
    issues: ['Kashmir dispute', 'Cross-border terrorism', 'Nuclear rivalry', 'Water disputes'],
  },
  {
    id: 'india-china',
    pair: ['IN', 'CN'],
    names: ['India', 'China'],
    gdeltQuery: 'India China border tension OR LAC standoff OR India China rivalry',
    issues: ['LAC border dispute', 'Arunachal Pradesh', 'Trade imbalance', 'BRI competition'],
  },
  {
    id: 'israel-iran',
    pair: ['IL', 'IR'],
    names: ['Israel', 'Iran'],
    gdeltQuery: 'Israel Iran conflict OR Israel Iran attack OR Iran nuclear Israel threat',
    issues: ['Nuclear program', 'Proxy wars', 'Hezbollah', 'Direct strikes', 'Regional dominance'],
  },
  {
    id: 'saudi-iran',
    pair: ['SA', 'IR'],
    names: ['Saudi Arabia', 'Iran'],
    gdeltQuery: 'Saudi Iran tension OR Saudi Iran rivalry OR Saudi Iran proxy',
    issues: ['Sectarian rivalry', 'Yemen proxy war', 'Oil competition', 'Regional influence'],
  },
  {
    id: 'turkey-greece',
    pair: ['TR', 'GR'],
    names: ['Turkey', 'Greece'],
    gdeltQuery: 'Turkey Greece tension OR Aegean dispute OR Turkey Greece conflict',
    issues: ['Aegean Sea disputes', 'Cyprus', 'Airspace violations', 'Maritime boundaries'],
  },
  {
    id: 'japan-china',
    pair: ['JP', 'CN'],
    names: ['Japan', 'China'],
    gdeltQuery: 'Japan China tension OR Senkaku islands OR Japan China dispute',
    issues: ['Senkaku/Diaoyu Islands', 'Historical grievances', 'Military buildup', 'Taiwan stance'],
  },
  {
    id: 'south-north-korea',
    pair: ['KR', 'KP'],
    names: ['South Korea', 'North Korea'],
    gdeltQuery: 'North Korea South Korea tension OR Korean peninsula crisis OR North Korea provocation',
    issues: ['Nuclear weapons', 'Missile tests', 'DMZ incidents', 'Reunification deadlock'],
  },
  {
    id: 'russia-ukraine',
    pair: ['RU', 'UA'],
    names: ['Russia', 'Ukraine'],
    gdeltQuery: 'Russia Ukraine war OR Russia Ukraine conflict OR Ukraine frontline',
    issues: ['Active war', 'Crimea', 'Donbas', 'Energy weaponization', 'War crimes allegations'],
  },
  {
    id: 'china-taiwan',
    pair: ['CN', 'TW'],
    names: ['China', 'Taiwan'],
    gdeltQuery: 'China Taiwan tension OR Taiwan strait crisis OR China Taiwan military',
    issues: ['Sovereignty claims', 'Military exercises', 'International recognition', 'US arms sales'],
  },
  {
    id: 'us-iran',
    pair: ['US', 'IR'],
    names: ['United States', 'Iran'],
    gdeltQuery: 'US Iran tension OR US Iran sanctions OR Iran nuclear deal',
    issues: ['Nuclear program', 'Sanctions', 'Regional proxies', 'Drone strikes', 'Strait of Hormuz'],
  },
];

// ---------------------------------------------------------------------------
// GDELT tone fetcher
// ---------------------------------------------------------------------------

/**
 * Fetch GDELT tone chart data and return raw average tone + data point count.
 */
async function fetchGdeltTone(query, timespan = '14d') {
  try {
    const url =
      `${GDELT_BASE}?query=${encodeURIComponent(query)}` +
      `&mode=ToneChart&timespan=${timespan}&format=json`;

    const data = await fetchGDELTRaw(url, 'Alliance');
    if (!data || Object.keys(data).length === 0) return { dataPointCount: 0, avgTone: null };
    const timeline = data.timeline || [];

    if (timeline.length === 0) return { dataPointCount: 0, avgTone: null };

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

    const avgTone = totalCount > 0 ? totalTone / totalCount : null;
    return {
      dataPointCount: totalCount,
      avgTone: avgTone !== null ? Math.round(avgTone * 100) / 100 : null,
    };
  } catch {
    return { dataPointCount: 0, avgTone: null };
  }
}

/**
 * Fetch GDELT article count for a given query.
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
// Main service class
// ---------------------------------------------------------------------------

class AllianceService {
  /**
   * Fetch raw GDELT tone data for a single alliance.
   * Returns raw tone + article count -- no strength score.
   */
  async getAllianceToneData(allianceId) {
    const cacheKey = `${CACHE_KEYS.toneData}:${allianceId}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const alliance = ALLIANCE_DATA.find(a => a.id === allianceId);
    if (!alliance) {
      console.warn(`[Alliance] Unknown alliance ID: ${allianceId}`);
      return null;
    }

    console.log(`[Alliance] Fetching tone data for ${alliance.name}...`);

    try {
      const [toneResult, articleCountResult] = await Promise.allSettled([
        fetchGdeltTone(alliance.gdeltQuery, '14d'),
        fetchGdeltArticleCount(alliance.gdeltQuery, '14d'),
      ]);

      const tone = toneResult.status === 'fulfilled' ? toneResult.value : { dataPointCount: 0, avgTone: null };
      const articleCount = articleCountResult.status === 'fulfilled' ? articleCountResult.value : 0;

      const result = {
        allianceId: alliance.id,
        allianceName: alliance.name,
        gdelt: {
          avgTone: tone.avgTone,
          toneDataPoints: tone.dataPointCount,
          articleCount,
        },
        fetchedAt: new Date().toISOString(),
      };

      await cacheService.set(cacheKey, result, CACHE_TTL);
      console.log(`[Alliance] ${alliance.name} tone data fetched (avgTone: ${tone.avgTone}, articles: ${articleCount})`);
      return result;
    } catch (error) {
      console.error(`[Alliance] Failed to fetch tone data for ${alliance.name}:`, error.message);
      return {
        allianceId: alliance.id,
        allianceName: alliance.name,
        gdelt: { avgTone: null, toneDataPoints: 0, articleCount: 0 },
        fetchedAt: new Date().toISOString(),
      };
    }
  }

  /**
   * Fetch raw GDELT tone data for all bilateral relationships.
   * Returns raw tone + article count per pair -- no tension scores.
   */
  async getBilateralToneData() {
    const cached = await cacheService.get(CACHE_KEYS.tensions);
    if (cached) return cached;

    console.log('[Alliance] Fetching bilateral tone data...');

    const tensionResults = await Promise.allSettled(
      BILATERAL_TENSIONS.map(async (bt) => {
        try {
          const [toneResult, articleCountResult] = await Promise.allSettled([
            fetchGdeltTone(bt.gdeltQuery, '14d'),
            fetchGdeltArticleCount(bt.gdeltQuery, '14d'),
          ]);

          const tone = toneResult.status === 'fulfilled' ? toneResult.value : { dataPointCount: 0, avgTone: null };
          const articleCount = articleCountResult.status === 'fulfilled' ? articleCountResult.value : 0;

          return {
            id: bt.id,
            pair: bt.pair,
            names: bt.names,
            issues: bt.issues,
            gdelt: {
              avgTone: tone.avgTone,
              toneDataPoints: tone.dataPointCount,
              articleCount,
            },
          };
        } catch (error) {
          console.error(`[Alliance] Failed to fetch tone data for ${bt.names.join('-')}:`, error.message);
          return {
            id: bt.id,
            pair: bt.pair,
            names: bt.names,
            issues: bt.issues,
            gdelt: { avgTone: null, toneDataPoints: 0, articleCount: 0 },
          };
        }
      })
    );

    const tensions = tensionResults
      .map(r => (r.status === 'fulfilled' ? r.value : null))
      .filter(Boolean);

    await cacheService.set(CACHE_KEYS.tensions, tensions, CACHE_TTL);
    console.log(`[Alliance] Fetched tone data for ${tensions.length} bilateral pairs`);
    return tensions;
  }

  /**
   * Get full alliance data with static metadata enriched with raw GDELT tone data.
   * No strength scores.
   */
  async getAlliancesWithToneData() {
    console.log('[Alliance] Fetching all alliances with tone data...');

    const toneResults = await Promise.allSettled(
      ALLIANCE_DATA.map(a => this.getAllianceToneData(a.id))
    );

    return ALLIANCE_DATA.map((alliance, idx) => {
      const toneResult = toneResults[idx];
      const toneData = toneResult.status === 'fulfilled' ? toneResult.value : null;

      return {
        id: alliance.id,
        name: alliance.name,
        type: alliance.type,
        founded: alliance.founded,
        hq: alliance.hq,
        color: alliance.color,
        memberCount: alliance.members.length,
        members: alliance.members,
        gdelt: toneData?.gdelt || { avgTone: null, toneDataPoints: 0, articleCount: 0 },
      };
    });
  }

  /**
   * Get combined alliance network data.
   * Main endpoint returning alliances with raw GDELT tone data,
   * bilateral tone data, and summary counts.
   * No composite scores.
   */
  async getCombinedData() {
    const cached = await cacheService.get(CACHE_KEYS.combined);
    if (cached) return cached;

    console.log('[Alliance] Computing combined alliance network data...');

    const [alliances, bilateralToneData] = await Promise.all([
      this.getAlliancesWithToneData(),
      this.getBilateralToneData(),
    ]);

    const summary = {
      totalAlliances: alliances.length,
      totalBilateralPairs: bilateralToneData.length,
      alliancesWithToneData: alliances.filter(a => a.gdelt.avgTone !== null).length,
      bilateralPairsWithToneData: bilateralToneData.filter(t => t.gdelt.avgTone !== null).length,
    };

    const result = {
      alliances,
      bilateralToneData,
      summary,
      dataSources: [
        'GDELT Project — https://www.gdeltproject.org',
      ],
      updatedAt: new Date().toISOString(),
    };

    await cacheService.set(CACHE_KEYS.combined, result, CACHE_TTL);
    console.log(
      `[Alliance] Combined data ready: ${alliances.length} alliances, ` +
      `${bilateralToneData.length} bilateral pairs`
    );
    return result;
  }
}

export const allianceService = new AllianceService();
export default allianceService;
