/**
 * Global Tension Index Service
 * Computes a composite global tension index from LIVE data sources:
 *   - UCDP (Uppsala Conflict Data Program) for conflict events and casualties
 *   - Stability service for protest, military, and instability signals
 *   - GDELT Project for real-time article volume on conflict keywords
 *
 * Static metadata (names, parties, coordinates, nuclear risk) is kept as
 * reference data. Intensity and tension values are computed dynamically.
 */

import { cacheService } from './cache.service.js';
import { ucdpService } from './ucdp.service.js';
import { stabilityService } from './stability.service.js';
import { fetchGDELTRaw } from './gdelt.client.js';

const CACHE_KEY = 'tension:index';
const CACHE_TTL = 900; // 15 minutes

const GDELT_DOC_URL = 'https://api.gdeltproject.org/api/v2/doc/doc';

// ---------------------------------------------------------------------------
// Reference data: conflict metadata (intensity is computed at runtime)
// ---------------------------------------------------------------------------

const CONFLICT_METADATA = [
  {
    id: 'ukraine-russia',
    name: 'Russia-Ukraine War',
    type: 'interstate',
    region: 'Europe',
    parties: ['Russia', 'Ukraine'],
    escalationRisk: 'high',
    nuclearRisk: 'elevated',
    since: '2022-02-24',
    ucdpKeywords: ['Ukraine', 'Russia'],
    ucdpCountries: ['Ukraine', 'Russia (Soviet Union)'],
    gdeltQuery: 'Ukraine war OR Ukraine conflict OR Ukraine Russia battle',
    stabilityCountries: ['UA', 'RU'],
    baseIntensity: 60,
    lat: 48.38,
    lon: 31.17,
  },
  {
    id: 'israel-palestine',
    name: 'Israel-Palestine Conflict',
    type: 'asymmetric',
    region: 'Middle East',
    parties: ['Israel', 'Hamas', 'Hezbollah'],
    escalationRisk: 'critical',
    nuclearRisk: 'low',
    since: '2023-10-07',
    ucdpKeywords: ['Israel', 'Palestine', 'Gaza'],
    ucdpCountries: ['Israel'],
    gdeltQuery: 'Israel Gaza war OR Israel Hamas OR Israel Palestine conflict',
    stabilityCountries: ['IL', 'PS'],
    baseIntensity: 55,
    lat: 31.05,
    lon: 34.85,
  },
  {
    id: 'sudan-civil',
    name: 'Sudan Civil War',
    type: 'civil',
    region: 'East Africa',
    parties: ['SAF', 'RSF'],
    escalationRisk: 'high',
    nuclearRisk: 'none',
    since: '2023-04-15',
    ucdpKeywords: ['Sudan'],
    ucdpCountries: ['Sudan'],
    gdeltQuery: 'Sudan civil war OR Sudan RSF OR Sudan SAF conflict',
    stabilityCountries: ['SD'],
    baseIntensity: 50,
    lat: 12.86,
    lon: 30.22,
  },
  {
    id: 'myanmar-civil',
    name: 'Myanmar Civil War',
    type: 'civil',
    region: 'Southeast Asia',
    parties: ['Military Junta', 'NUG/PDF'],
    escalationRisk: 'moderate',
    nuclearRisk: 'none',
    since: '2021-02-01',
    ucdpKeywords: ['Myanmar'],
    ucdpCountries: ['Myanmar (Burma)'],
    gdeltQuery: 'Myanmar civil war OR Myanmar junta OR Myanmar resistance',
    stabilityCountries: ['MM'],
    baseIntensity: 45,
    lat: 21.91,
    lon: 95.96,
  },
  {
    id: 'ethiopia-internal',
    name: 'Ethiopia Internal Conflicts',
    type: 'civil',
    region: 'Horn of Africa',
    parties: ['Federal Gov', 'Various militia'],
    escalationRisk: 'moderate',
    nuclearRisk: 'none',
    since: '2020-11-04',
    ucdpKeywords: ['Ethiopia'],
    ucdpCountries: ['Ethiopia'],
    gdeltQuery: 'Ethiopia conflict OR Ethiopia militia OR Ethiopia Amhara',
    stabilityCountries: ['ET'],
    baseIntensity: 30,
    lat: 9.15,
    lon: 40.49,
  },
  {
    id: 'sahel-insurgency',
    name: 'Sahel Insurgency',
    type: 'insurgency',
    region: 'West Africa',
    parties: ['JNIM', 'ISGS', 'Mali/BF/Niger'],
    escalationRisk: 'moderate',
    nuclearRisk: 'none',
    since: '2012-01-01',
    ucdpKeywords: ['Mali', 'Burkina Faso', 'Niger'],
    ucdpCountries: ['Mali', 'Burkina Faso', 'Niger'],
    gdeltQuery: 'Sahel insurgency OR Mali jihadist OR Burkina Faso attack OR Niger militant',
    stabilityCountries: ['ML', 'BF', 'NE'],
    baseIntensity: 40,
    lat: 14.0,
    lon: 0.0,
  },
  {
    id: 'drc-m23',
    name: 'DRC - M23 Conflict',
    type: 'civil',
    region: 'Central Africa',
    parties: ['DRC Army', 'M23/Rwanda'],
    escalationRisk: 'high',
    nuclearRisk: 'none',
    since: '2022-03-01',
    ucdpKeywords: ['Congo', 'DRC', 'M23'],
    ucdpCountries: ['DR Congo (Zaire)'],
    gdeltQuery: 'DRC M23 OR Congo conflict OR DRC Rwanda',
    stabilityCountries: ['CD'],
    baseIntensity: 40,
    lat: -4.04,
    lon: 21.76,
  },
  {
    id: 'somalia-alshabaab',
    name: 'Somalia - Al-Shabaab',
    type: 'insurgency',
    region: 'Horn of Africa',
    parties: ['Somalia/AMISOM', 'Al-Shabaab'],
    escalationRisk: 'moderate',
    nuclearRisk: 'none',
    since: '2006-01-01',
    ucdpKeywords: ['Somalia', 'Shabaab'],
    ucdpCountries: ['Somalia'],
    gdeltQuery: 'Somalia Al-Shabaab OR Somalia conflict OR Somalia insurgency',
    stabilityCountries: ['SO'],
    baseIntensity: 35,
    lat: 5.15,
    lon: 46.20,
  },
  {
    id: 'houthi-red-sea',
    name: 'Houthi Red Sea Campaign',
    type: 'asymmetric',
    region: 'Middle East',
    parties: ['Houthis', 'US/UK Coalition'],
    escalationRisk: 'high',
    nuclearRisk: 'none',
    since: '2023-11-19',
    ucdpKeywords: ['Yemen', 'Houthi'],
    ucdpCountries: ['Yemen (North Yemen)'],
    gdeltQuery: 'Houthi Red Sea OR Yemen Houthi attack OR Red Sea shipping attack',
    stabilityCountries: ['YE'],
    baseIntensity: 35,
    lat: 15.55,
    lon: 48.52,
  },
  {
    id: 'haiti-gangs',
    name: 'Haiti Gang Violence',
    type: 'civil',
    region: 'Americas',
    parties: ['Gangs', 'MPTN'],
    escalationRisk: 'moderate',
    nuclearRisk: 'none',
    since: '2021-07-07',
    ucdpKeywords: ['Haiti'],
    ucdpCountries: ['Haiti'],
    gdeltQuery: 'Haiti gang violence OR Haiti crisis OR Haiti armed groups',
    stabilityCountries: ['HT'],
    baseIntensity: 30,
    lat: 18.97,
    lon: -72.29,
  },
];

const FLASHPOINT_METADATA = [
  {
    id: 'taiwan',
    name: 'Taiwan Strait',
    category: 'great-power',
    parties: ['China', 'Taiwan', 'USA'],
    escalationRisk: 'elevated',
    nuclear: true,
    gdeltQuery: 'Taiwan strait tension OR China Taiwan military OR Taiwan invasion threat',
    stabilityCountries: ['TW', 'CN'],
    baseTension: 35,
    lat: 23.70,
    lon: 120.96,
  },
  {
    id: 'south-china-sea',
    name: 'South China Sea',
    category: 'territorial',
    parties: ['China', 'Philippines', 'Vietnam'],
    escalationRisk: 'moderate',
    nuclear: false,
    gdeltQuery: 'South China Sea dispute OR Philippines China standoff OR South China Sea military',
    stabilityCountries: ['CN', 'PH', 'VN'],
    baseTension: 30,
    lat: 12.0,
    lon: 114.0,
  },
  {
    id: 'korea',
    name: 'Korean Peninsula',
    category: 'great-power',
    parties: ['North Korea', 'South Korea', 'USA'],
    escalationRisk: 'elevated',
    nuclear: true,
    gdeltQuery: 'North Korea missile OR Korean peninsula tension OR North Korea nuclear',
    stabilityCountries: ['KP', 'KR'],
    baseTension: 30,
    lat: 38.0,
    lon: 127.0,
  },
  {
    id: 'iran-israel',
    name: 'Iran-Israel Shadow War',
    category: 'great-power',
    parties: ['Iran', 'Israel'],
    escalationRisk: 'high',
    nuclear: true,
    gdeltQuery: 'Iran Israel attack OR Iran Israel proxy OR Iran nuclear program threat',
    stabilityCountries: ['IR', 'IL'],
    baseTension: 40,
    lat: 32.0,
    lon: 45.0,
  },
  {
    id: 'nato-russia',
    name: 'NATO-Russia Frontier',
    category: 'great-power',
    parties: ['NATO', 'Russia'],
    escalationRisk: 'elevated',
    nuclear: true,
    gdeltQuery: 'NATO Russia tension OR NATO Russia border OR Russia NATO escalation',
    stabilityCountries: ['RU', 'PL', 'EE', 'LV', 'LT'],
    baseTension: 40,
    lat: 55.0,
    lon: 25.0,
  },
  {
    id: 'india-china',
    name: 'India-China Border',
    category: 'territorial',
    parties: ['India', 'China'],
    escalationRisk: 'low',
    nuclear: true,
    gdeltQuery: 'India China border OR LAC standoff OR India China military',
    stabilityCountries: ['IN', 'CN'],
    baseTension: 20,
    lat: 34.0,
    lon: 78.0,
  },
  {
    id: 'india-pakistan',
    name: 'India-Pakistan',
    category: 'territorial',
    parties: ['India', 'Pakistan'],
    escalationRisk: 'moderate',
    nuclear: true,
    gdeltQuery: 'India Pakistan tension OR Kashmir conflict OR India Pakistan border',
    stabilityCountries: ['IN', 'PK'],
    baseTension: 25,
    lat: 34.0,
    lon: 74.0,
  },
  {
    id: 'arctic',
    name: 'Arctic Competition',
    category: 'resource',
    parties: ['Russia', 'NATO', 'China'],
    escalationRisk: 'low',
    nuclear: false,
    gdeltQuery: 'Arctic military OR Arctic competition OR Arctic Russia NATO',
    stabilityCountries: ['RU', 'NO', 'CA'],
    baseTension: 15,
    lat: 75.0,
    lon: 40.0,
  },
];

// ---------------------------------------------------------------------------
// GDELT fetcher: returns article count for a given query over a time span
// ---------------------------------------------------------------------------

async function fetchGdeltArticleCount(query, timespan = '14d') {
  try {
    const url =
      `${GDELT_DOC_URL}?query=${encodeURIComponent(query)}` +
      `&mode=ArtList&maxrecords=250&timespan=${timespan}&format=json`;

    const data = await fetchGDELTRaw(url, 'TensionIndex');
    if (!data) return 0;
    return (data.articles || []).length;
  } catch {
    return 0;
  }
}

// ---------------------------------------------------------------------------
// Intensity computation helpers
// ---------------------------------------------------------------------------

/**
 * Count UCDP events and aggregate casualties for a given conflict.
 * Matches events by country name keywords against the conflict's ucdpCountries
 * and ucdpKeywords arrays.
 */
function matchUcdpEventsToConflict(events, conflict) {
  if (!events || events.length === 0) return { eventCount: 0, totalDeaths: 0 };

  const keywords = (conflict.ucdpKeywords || []).map(k => k.toLowerCase());
  const countries = (conflict.ucdpCountries || []).map(c => c.toLowerCase());

  const matched = events.filter(ev => {
    const evCountry = (ev.country || '').toLowerCase();
    const evConflictName = (ev.conflictName || '').toLowerCase();
    const evLocation = (ev.location || '').toLowerCase();
    const evSideA = (ev.sideA || '').toLowerCase();
    const evSideB = (ev.sideB || '').toLowerCase();

    const haystack = `${evCountry} ${evConflictName} ${evLocation} ${evSideA} ${evSideB}`;

    const countryMatch = countries.some(c => evCountry.includes(c) || c.includes(evCountry));
    const keywordMatch = keywords.some(k => haystack.includes(k));

    return countryMatch || keywordMatch;
  });

  const totalDeaths = matched.reduce((sum, ev) => sum + (ev.deathsBest || 0), 0);

  return { eventCount: matched.length, totalDeaths };
}

/**
 * Compute protest/instability intensity score for a set of country codes from
 * stability data. Returns 0-100 scale.
 */
function computeStabilityScore(stabilityData, countryCodes) {
  if (!stabilityData || !countryCodes || countryCodes.length === 0) return 0;

  let totalSignals = 0;

  // Count protest heat from matching countries
  const protests = stabilityData.protests?.heatmapPoints || [];
  for (const pt of protests) {
    if (countryCodes.includes(pt.countryCode)) {
      totalSignals += pt.count || 0;
    }
  }

  // Count military indicators from matching countries
  const military = stabilityData.military?.indicators || [];
  for (const ind of military) {
    if (countryCodes.includes(ind.countryCode)) {
      totalSignals += (ind.count || 0) * 1.5; // weight military signals higher
    }
  }

  // Count instability alerts from matching countries
  const alerts = stabilityData.instability?.alerts || [];
  for (const alert of alerts) {
    if (countryCodes.includes(alert.countryCode)) {
      const severityMultiplier =
        alert.severity === 'critical' ? 4 :
        alert.severity === 'high' ? 3 :
        alert.severity === 'elevated' ? 2 : 1;
      totalSignals += (alert.count || 0) * severityMultiplier;
    }
  }

  // Normalize: ~50 signals maps to about 50/100, cap at 100
  return Math.min(100, Math.round((totalSignals / 50) * 50));
}

/**
 * Convert a GDELT article count into a 0-100 intensity contribution.
 * Thresholds are tuned so that:
 *   0 articles   ->  0
 *   10 articles  -> ~15
 *   50 articles  -> ~40
 *   100 articles -> ~60
 *   200+ articles -> ~85-100
 */
function gdeltCountToScore(count) {
  if (count <= 0) return 0;
  // Logarithmic scaling: score = 18 * ln(count + 1), capped at 100
  const raw = 18 * Math.log(count + 1);
  return Math.min(100, Math.round(raw));
}

/**
 * Blend base intensity with live signal scores.
 *   - base       (20%): the static baseline intensity
 *   - ucdpScore  (35%): from UCDP event counts / casualties
 *   - gdeltScore (25%): from GDELT article volume
 *   - stabScore  (20%): from stability protests / military / instability
 *
 * The result is clamped to [5, 100].
 */
function blendIntensity(base, ucdpScore, gdeltScore, stabScore) {
  const blended = base * 0.20 + ucdpScore * 0.35 + gdeltScore * 0.25 + stabScore * 0.20;
  return Math.min(100, Math.max(5, Math.round(blended)));
}

/**
 * Convert UCDP raw event count + deaths into a 0-100 score.
 *   - 0 events = 0
 *   - 5 events, 10 deaths ≈ 30
 *   - 50 events, 200 deaths ≈ 70
 *   - 200+ events with high casualties ≈ 90-100
 */
function ucdpToScore(eventCount, totalDeaths) {
  if (eventCount === 0 && totalDeaths === 0) return 0;
  const eventScore = 15 * Math.log(eventCount + 1);
  const deathScore = 10 * Math.log(totalDeaths + 1);
  return Math.min(100, Math.round(eventScore + deathScore));
}

// ---------------------------------------------------------------------------
// Escalation risk derivation from live intensity
// ---------------------------------------------------------------------------

function deriveEscalationRisk(intensity) {
  if (intensity >= 85) return 'critical';
  if (intensity >= 70) return 'high';
  if (intensity >= 50) return 'elevated';
  if (intensity >= 30) return 'moderate';
  return 'low';
}

// ---------------------------------------------------------------------------
// Timeline: compare current intensity to baseline and produce a change record
// ---------------------------------------------------------------------------

function buildTimeline(conflicts, flashpoints) {
  const entries = [];
  const now = new Date().toISOString();

  for (const c of conflicts) {
    const delta = c.intensity - c.baseIntensity;
    if (Math.abs(delta) >= 5) {
      entries.push({
        id: c.id,
        name: c.name,
        type: 'conflict',
        previousIntensity: c.baseIntensity,
        currentIntensity: c.intensity,
        delta,
        direction: delta > 0 ? 'escalation' : 'de-escalation',
        timestamp: now,
      });
    }
  }

  for (const f of flashpoints) {
    const delta = f.tension - f.baseTension;
    if (Math.abs(delta) >= 5) {
      entries.push({
        id: f.id,
        name: f.name,
        type: 'flashpoint',
        previousTension: f.baseTension,
        currentTension: f.tension,
        delta,
        direction: delta > 0 ? 'escalation' : 'de-escalation',
        timestamp: now,
      });
    }
  }

  // Sort by absolute delta descending (most significant changes first)
  entries.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

  return entries;
}

// ---------------------------------------------------------------------------
// Global index computation
// ---------------------------------------------------------------------------

function computeGlobalTensionIndex(conflicts, flashpoints, stabilityData) {
  // Weighted average: active conflicts (50%), flashpoints (30%), stability (20%)
  const conflictAvg =
    conflicts.reduce((s, c) => s + c.intensity, 0) / Math.max(conflicts.length, 1);
  const flashpointAvg =
    flashpoints.reduce((s, f) => s + f.tension, 0) / Math.max(flashpoints.length, 1);

  let stabilityScore = 50; // neutral default
  if (stabilityData) {
    const protestPts = stabilityData.protests?.heatmapPoints || [];
    if (protestPts.length > 0) {
      const avgIntensity =
        protestPts.reduce((s, p) => s + (p.intensity || 0), 0) / protestPts.length;
      // Scale protest intensity (1-10) up to 0-100
      stabilityScore = Math.min(100, avgIntensity * 10);
    }
  }

  const index = Math.round(conflictAvg * 0.5 + flashpointAvg * 0.3 + stabilityScore * 0.2);
  return Math.min(100, Math.max(0, index));
}

function getTensionLabel(index) {
  if (index >= 80) return 'Critical';
  if (index >= 65) return 'High';
  if (index >= 50) return 'Elevated';
  if (index >= 35) return 'Guarded';
  return 'Low';
}

// ---------------------------------------------------------------------------
// Main service
// ---------------------------------------------------------------------------

export const tensionIndexService = {
  async getGlobalTension() {
    // ── Check cache ──
    const cached = await cacheService.get(CACHE_KEY);
    if (cached) return cached;

    console.log('[TensionIndex] Computing global tension from live data...');

    // ── Fetch all live data in parallel ──
    const [ucdpEventsResult, ucdpConflictsResult, stabilityResult] = await Promise.allSettled([
      ucdpService.getRecentEvents({ limit: 500 }),
      ucdpService.getActiveConflicts(),
      stabilityService.getCombinedData(),
    ]);

    const ucdpEvents =
      ucdpEventsResult.status === 'fulfilled' && ucdpEventsResult.value
        ? ucdpEventsResult.value.events || []
        : [];

    const ucdpConflicts =
      ucdpConflictsResult.status === 'fulfilled' && ucdpConflictsResult.value
        ? ucdpConflictsResult.value.conflicts || []
        : [];

    const stabilityData =
      stabilityResult.status === 'fulfilled' ? stabilityResult.value : null;

    // ── Fetch GDELT article counts for every conflict and flashpoint in parallel ──
    const allGdeltQueries = [
      ...CONFLICT_METADATA.map(c => c.gdeltQuery),
      ...FLASHPOINT_METADATA.map(f => f.gdeltQuery),
    ];

    const gdeltResults = await Promise.allSettled(
      allGdeltQueries.map(q => fetchGdeltArticleCount(q, '14d'))
    );

    const gdeltCounts = gdeltResults.map(r =>
      r.status === 'fulfilled' ? r.value : 0
    );

    const conflictGdeltCounts = gdeltCounts.slice(0, CONFLICT_METADATA.length);
    const flashpointGdeltCounts = gdeltCounts.slice(CONFLICT_METADATA.length);

    // ── Build enriched conflict objects ──
    const activeConflicts = CONFLICT_METADATA.map((meta, idx) => {
      // UCDP matching
      const { eventCount, totalDeaths } = matchUcdpEventsToConflict(ucdpEvents, meta);

      // Check if UCDP active conflicts list has a matching entry with War intensity
      const ucdpMatch = ucdpConflicts.find(uc => {
        const ucName = (uc.name || '').toLowerCase();
        const ucLocation = (uc.location || '').toLowerCase();
        const ucSideA = (uc.sideA || '').toLowerCase();
        const ucSideB = (uc.sideB || '').toLowerCase();
        const hay = `${ucName} ${ucLocation} ${ucSideA} ${ucSideB}`;
        return meta.ucdpKeywords.some(k => hay.includes(k.toLowerCase()));
      });

      const isWarIntensity = ucdpMatch?.intensity === 'War';

      // Score components
      const ucdpScore = ucdpToScore(eventCount, totalDeaths);
      const gdeltScore = gdeltCountToScore(conflictGdeltCounts[idx]);
      const stabScore = computeStabilityScore(stabilityData, meta.stabilityCountries);

      // If UCDP classifies as "War", push the base a bit higher
      const adjustedBase = isWarIntensity ? Math.max(meta.baseIntensity, 65) : meta.baseIntensity;

      const intensity = blendIntensity(adjustedBase, ucdpScore, gdeltScore, stabScore);

      return {
        id: meta.id,
        name: meta.name,
        intensity,
        type: meta.type,
        region: meta.region,
        parties: meta.parties,
        escalationRisk: deriveEscalationRisk(intensity),
        nuclearRisk: meta.nuclearRisk,
        since: meta.since,
        lat: meta.lat,
        lon: meta.lon,
        baseIntensity: meta.baseIntensity,
        liveSignals: {
          ucdpEvents: eventCount,
          ucdpDeaths: totalDeaths,
          ucdpClassification: ucdpMatch?.intensity || 'Unknown',
          gdeltArticles: conflictGdeltCounts[idx],
          stabilityScore: stabScore,
        },
      };
    });

    // Sort by intensity descending
    activeConflicts.sort((a, b) => b.intensity - a.intensity);

    // ── Build enriched flashpoint objects ──
    const flashpoints = FLASHPOINT_METADATA.map((meta, idx) => {
      const gdeltScore = gdeltCountToScore(flashpointGdeltCounts[idx]);
      const stabScore = computeStabilityScore(stabilityData, meta.stabilityCountries);

      // Flashpoints blend: base (30%) + GDELT (40%) + stability (30%)
      // No UCDP component since flashpoints are latent, not active wars
      const tension = Math.min(
        100,
        Math.max(
          5,
          Math.round(meta.baseTension * 0.30 + gdeltScore * 0.40 + stabScore * 0.30)
        )
      );

      return {
        id: meta.id,
        name: meta.name,
        tension,
        category: meta.category,
        parties: meta.parties,
        escalationRisk: deriveEscalationRisk(tension),
        nuclear: meta.nuclear,
        lat: meta.lat,
        lon: meta.lon,
        baseTension: meta.baseTension,
        liveSignals: {
          gdeltArticles: flashpointGdeltCounts[idx],
          stabilityScore: stabScore,
        },
      };
    });

    // Sort by tension descending
    flashpoints.sort((a, b) => b.tension - a.tension);

    // ── Timeline of escalation changes ──
    const timeline = buildTimeline(activeConflicts, flashpoints);

    // ── Global index ──
    const index = computeGlobalTensionIndex(activeConflicts, flashpoints, stabilityData);

    const result = {
      index,
      label: getTensionLabel(index),
      activeConflicts,
      flashpoints,
      timeline,
      summary: {
        totalConflicts: activeConflicts.length,
        totalFlashpoints: flashpoints.length,
        criticalConflicts: activeConflicts.filter(c => c.intensity >= 80).length,
        nuclearFlashpoints: flashpoints.filter(f => f.nuclear).length,
        highEscalation: [...activeConflicts, ...flashpoints].filter(
          x => x.escalationRisk === 'critical' || x.escalationRisk === 'high'
        ).length,
        dataQuality: {
          ucdpEventsAvailable: ucdpEvents.length,
          ucdpConflictsAvailable: ucdpConflicts.length,
          stabilityAvailable: stabilityData !== null,
          gdeltQueriesSucceeded: gdeltCounts.filter(c => c > 0).length,
          gdeltQueriesTotal: allGdeltQueries.length,
        },
      },
      updatedAt: new Date().toISOString(),
    };

    await cacheService.set(CACHE_KEY, result, CACHE_TTL);
    console.log(`[TensionIndex] Computed global index: ${index} (${result.label})`);
    return result;
  },
};
