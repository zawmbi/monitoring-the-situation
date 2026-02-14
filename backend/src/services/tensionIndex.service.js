/**
 * Global Tension Index Service
 * Computes a composite global tension index from multiple data sources.
 * Provides conflict intensity, event importance scoring, and escalation meter.
 */

import { cacheService } from './cache.service.js';
import { stabilityService } from './stability.service.js';
import { countryRiskService } from './countryRisk.service.js';

const CACHE_KEY = 'tension:index';
const CACHE_TTL = 900; // 15 minutes

// Major ongoing conflicts with intensity ratings
const ACTIVE_CONFLICTS = [
  { id: 'ukraine-russia', name: 'Russia-Ukraine War', intensity: 95, type: 'interstate', region: 'Europe', parties: ['Russia', 'Ukraine'], escalationRisk: 'high', nuclearRisk: 'elevated', since: '2022-02-24' },
  { id: 'israel-palestine', name: 'Israel-Palestine Conflict', intensity: 90, type: 'asymmetric', region: 'Middle East', parties: ['Israel', 'Hamas', 'Hezbollah'], escalationRisk: 'critical', nuclearRisk: 'low', since: '2023-10-07' },
  { id: 'sudan-civil', name: 'Sudan Civil War', intensity: 85, type: 'civil', region: 'East Africa', parties: ['SAF', 'RSF'], escalationRisk: 'high', nuclearRisk: 'none', since: '2023-04-15' },
  { id: 'myanmar-civil', name: 'Myanmar Civil War', intensity: 78, type: 'civil', region: 'Southeast Asia', parties: ['Military Junta', 'NUG/PDF'], escalationRisk: 'moderate', nuclearRisk: 'none', since: '2021-02-01' },
  { id: 'ethiopia-internal', name: 'Ethiopia Internal Conflicts', intensity: 55, type: 'civil', region: 'Horn of Africa', parties: ['Federal Gov', 'Various militia'], escalationRisk: 'moderate', nuclearRisk: 'none', since: '2020-11-04' },
  { id: 'sahel-insurgency', name: 'Sahel Insurgency', intensity: 70, type: 'insurgency', region: 'West Africa', parties: ['JNIM', 'ISGS', 'Mali/BF/Niger'], escalationRisk: 'moderate', nuclearRisk: 'none', since: '2012-01-01' },
  { id: 'drc-m23', name: 'DRC - M23 Conflict', intensity: 72, type: 'civil', region: 'Central Africa', parties: ['DRC Army', 'M23/Rwanda'], escalationRisk: 'high', nuclearRisk: 'none', since: '2022-03-01' },
  { id: 'somalia-alshabaab', name: 'Somalia - Al-Shabaab', intensity: 65, type: 'insurgency', region: 'Horn of Africa', parties: ['Somalia/AMISOM', 'Al-Shabaab'], escalationRisk: 'moderate', nuclearRisk: 'none', since: '2006-01-01' },
  { id: 'houthi-red-sea', name: 'Houthi Red Sea Campaign', intensity: 68, type: 'asymmetric', region: 'Middle East', parties: ['Houthis', 'US/UK Coalition'], escalationRisk: 'high', nuclearRisk: 'none', since: '2023-11-19' },
  { id: 'haiti-gangs', name: 'Haiti Gang Violence', intensity: 60, type: 'civil', region: 'Americas', parties: ['Gangs', 'MPTN'], escalationRisk: 'moderate', nuclearRisk: 'none', since: '2021-07-07' },
];

// Major geopolitical flashpoints
const FLASHPOINTS = [
  { id: 'taiwan', name: 'Taiwan Strait', tension: 72, category: 'great-power', parties: ['China', 'Taiwan', 'USA'], escalationRisk: 'elevated', nuclear: true },
  { id: 'south-china-sea', name: 'South China Sea', tension: 65, category: 'territorial', parties: ['China', 'Philippines', 'Vietnam'], escalationRisk: 'moderate', nuclear: false },
  { id: 'korea', name: 'Korean Peninsula', tension: 60, category: 'great-power', parties: ['North Korea', 'South Korea', 'USA'], escalationRisk: 'elevated', nuclear: true },
  { id: 'iran-israel', name: 'Iran-Israel Shadow War', tension: 78, category: 'great-power', parties: ['Iran', 'Israel'], escalationRisk: 'high', nuclear: true },
  { id: 'nato-russia', name: 'NATO-Russia Frontier', tension: 75, category: 'great-power', parties: ['NATO', 'Russia'], escalationRisk: 'elevated', nuclear: true },
  { id: 'india-china', name: 'India-China Border', tension: 45, category: 'territorial', parties: ['India', 'China'], escalationRisk: 'low', nuclear: true },
  { id: 'india-pakistan', name: 'India-Pakistan', tension: 50, category: 'territorial', parties: ['India', 'Pakistan'], escalationRisk: 'moderate', nuclear: true },
  { id: 'arctic', name: 'Arctic Competition', tension: 35, category: 'resource', parties: ['Russia', 'NATO', 'China'], escalationRisk: 'low', nuclear: false },
];

function computeGlobalTensionIndex(conflicts, flashpoints, stabilityData) {
  // Weighted average: active conflicts (50%), flashpoints (30%), stability (20%)
  const conflictAvg = conflicts.reduce((s, c) => s + c.intensity, 0) / Math.max(conflicts.length, 1);
  const flashpointAvg = flashpoints.reduce((s, f) => s + f.tension, 0) / Math.max(flashpoints.length, 1);

  let stabilityScore = 50; // neutral default
  if (stabilityData?.protests?.length > 0) {
    const avgIntensity = stabilityData.protests.reduce((s, p) => s + (p.intensity || 0), 0) / stabilityData.protests.length;
    stabilityScore = avgIntensity;
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

export const tensionIndexService = {
  async getGlobalTension() {
    const cached = await cacheService.get(CACHE_KEY);
    if (cached) return cached;

    let stabilityData = null;
    try {
      stabilityData = await stabilityService.getCombinedData();
    } catch (e) { /* ignore */ }

    const index = computeGlobalTensionIndex(ACTIVE_CONFLICTS, FLASHPOINTS, stabilityData);

    const result = {
      index,
      label: getTensionLabel(index),
      activeConflicts: ACTIVE_CONFLICTS,
      flashpoints: FLASHPOINTS,
      summary: {
        totalConflicts: ACTIVE_CONFLICTS.length,
        totalFlashpoints: FLASHPOINTS.length,
        criticalConflicts: ACTIVE_CONFLICTS.filter(c => c.intensity >= 80).length,
        nuclearFlashpoints: FLASHPOINTS.filter(f => f.nuclear).length,
        highEscalation: [...ACTIVE_CONFLICTS, ...FLASHPOINTS].filter(
          x => x.escalationRisk === 'critical' || x.escalationRisk === 'high'
        ).length,
      },
      updatedAt: new Date().toISOString(),
    };

    await cacheService.set(CACHE_KEY, result, CACHE_TTL);
    return result;
  },
};
