/**
 * Stability Data — baseline global protest, military, and instability events
 * OSINT-derived from public reporting. Enriched with live GDELT data.
 */

// ── Known ongoing protest / unrest zones ──
export const BASELINE_PROTESTS = [
  { id: 'p-ir', country: 'Iran', code: 'IR', lat: 35.69, lon: 51.39, intensity: 8, label: 'Anti-regime protests', type: 'protest' },
  { id: 'p-mm', country: 'Myanmar', code: 'MM', lat: 19.76, lon: 96.08, intensity: 9, label: 'Anti-junta resistance', type: 'resistance' },
  { id: 'p-bd', country: 'Bangladesh', code: 'BD', lat: 23.81, lon: 90.41, intensity: 7, label: 'Political unrest', type: 'protest' },
  { id: 'p-ve', country: 'Venezuela', code: 'VE', lat: 10.49, lon: -66.88, intensity: 7, label: 'Opposition protests', type: 'protest' },
  { id: 'p-ke', country: 'Kenya', code: 'KE', lat: -1.29, lon: 36.82, intensity: 6, label: 'Anti-tax protests', type: 'protest' },
  { id: 'p-ng', country: 'Nigeria', code: 'NG', lat: 9.06, lon: 7.49, intensity: 6, label: 'Cost-of-living protests', type: 'protest' },
  { id: 'p-pk', country: 'Pakistan', code: 'PK', lat: 33.69, lon: 73.04, intensity: 6, label: 'Political protests', type: 'protest' },
  { id: 'p-ge', country: 'Georgia', code: 'GE', lat: 41.69, lon: 44.80, intensity: 7, label: 'Pro-EU protests', type: 'protest' },
  { id: 'p-il', country: 'Israel', code: 'IL', lat: 32.07, lon: 34.78, intensity: 7, label: 'Judicial reform protests', type: 'protest' },
  { id: 'p-fr', country: 'France', code: 'FR', lat: 48.86, lon: 2.35, intensity: 5, label: 'Political protests', type: 'protest' },
  { id: 'p-co', country: 'Colombia', code: 'CO', lat: 4.71, lon: -74.07, intensity: 5, label: 'Peace process protests', type: 'protest' },
  { id: 'p-pe', country: 'Peru', code: 'PE', lat: -12.05, lon: -77.04, intensity: 5, label: 'Political crisis', type: 'protest' },
  { id: 'p-sd', country: 'Sudan', code: 'SD', lat: 15.50, lon: 32.56, intensity: 8, label: 'Civil conflict unrest', type: 'unrest' },
  { id: 'p-ht', country: 'Haiti', code: 'HT', lat: 18.54, lon: -72.34, intensity: 8, label: 'Gang violence / unrest', type: 'unrest' },
  { id: 'p-sy', country: 'Syria', code: 'SY', lat: 33.51, lon: 36.29, intensity: 7, label: 'Post-transition instability', type: 'unrest' },
  { id: 'p-in', country: 'India', code: 'IN', lat: 28.61, lon: 77.21, intensity: 4, label: 'Regional protests', type: 'protest' },
  { id: 'p-mx', country: 'Mexico', code: 'MX', lat: 19.43, lon: -99.13, intensity: 4, label: 'Cartel violence protests', type: 'protest' },
  { id: 'p-eg', country: 'Egypt', code: 'EG', lat: 30.04, lon: 31.24, intensity: 3, label: 'Economic grievances', type: 'protest' },
  { id: 'p-tr', country: 'Turkey', code: 'TR', lat: 39.93, lon: 32.86, intensity: 4, label: 'Political tensions', type: 'protest' },
  { id: 'p-th', country: 'Thailand', code: 'TH', lat: 13.76, lon: 100.50, intensity: 4, label: 'Democracy movement', type: 'protest' },
];

// ── Known military movement indicators ──
export const BASELINE_MILITARY = [
  { id: 'm-cn-tw', country: 'China', code: 'CN', lat: 24.50, lon: 119.50, severity: 'critical', force: 'navy', label: 'PLA Taiwan Strait patrols', type: 'naval_patrol' },
  { id: 'm-cn-scs', country: 'China', code: 'CN', lat: 14.50, lon: 114.50, severity: 'high', force: 'navy', label: 'South China Sea buildup', type: 'buildup' },
  { id: 'm-ru-arctic', country: 'Russia', code: 'RU', lat: 69.35, lon: 33.08, severity: 'elevated', force: 'mixed', label: 'Arctic military buildup', type: 'buildup' },
  { id: 'm-ru-baltic', country: 'Russia', code: 'RU', lat: 54.71, lon: 20.51, severity: 'high', force: 'navy', label: 'Baltic Fleet activity', type: 'naval_patrol' },
  { id: 'm-kp', country: 'North Korea', code: 'KP', lat: 39.03, lon: 125.75, severity: 'high', force: 'missile', label: 'Missile test preparations', type: 'missile_test' },
  { id: 'm-ir-hormuz', country: 'Iran', code: 'IR', lat: 26.56, lon: 56.27, severity: 'elevated', force: 'navy', label: 'Strait of Hormuz naval activity', type: 'naval_patrol' },
  { id: 'm-in-lac', country: 'India', code: 'IN', lat: 34.50, lon: 78.00, severity: 'elevated', force: 'army', label: 'LAC border deployments', type: 'deployment' },
  { id: 'm-nato-east', country: 'Poland', code: 'PL', lat: 51.25, lon: 22.57, severity: 'elevated', force: 'mixed', label: 'NATO eastern flank reinforcement', type: 'deployment' },
  { id: 'm-us-indopac', country: 'Japan', code: 'JP', lat: 26.50, lon: 127.77, severity: 'elevated', force: 'navy', label: 'US Indo-Pacific force posture', type: 'deployment' },
  { id: 'm-ru-ua', country: 'Russia', code: 'RU', lat: 50.40, lon: 36.60, severity: 'critical', force: 'army', label: 'Ukraine border forces', type: 'deployment' },
  { id: 'm-ir-prx', country: 'Iraq', code: 'IQ', lat: 33.30, lon: 44.37, severity: 'elevated', force: 'militia', label: 'Iran-backed militia movements', type: 'proxy' },
  { id: 'm-ye-houthi', country: 'Yemen', code: 'YE', lat: 15.35, lon: 44.21, severity: 'high', force: 'navy', label: 'Red Sea/Houthi maritime threat', type: 'naval_patrol' },
  { id: 'm-et', country: 'Ethiopia', code: 'ET', lat: 9.02, lon: 38.75, severity: 'elevated', force: 'army', label: 'Post-Tigray troop movements', type: 'deployment' },
  { id: 'm-ph-scs', country: 'Philippines', code: 'PH', lat: 10.30, lon: 118.50, severity: 'elevated', force: 'coast_guard', label: 'Second Thomas Shoal patrols', type: 'naval_patrol' },
];

// ── Known instability / assassination / coup alerts ──
export const BASELINE_INSTABILITY = [
  { id: 'i-mm', country: 'Myanmar', code: 'MM', lat: 19.76, lon: 96.08, type: 'coup', severity: 'critical', headline: 'Military junta faces armed resistance nationwide' },
  { id: 'i-sd', country: 'Sudan', code: 'SD', lat: 15.50, lon: 32.56, type: 'political_crisis', severity: 'critical', headline: 'Civil war between SAF and RSF' },
  { id: 'i-ht', country: 'Haiti', code: 'HT', lat: 18.54, lon: -72.34, type: 'political_crisis', severity: 'critical', headline: 'Gang control / political vacuum' },
  { id: 'i-sy', country: 'Syria', code: 'SY', lat: 33.51, lon: 36.29, type: 'regime_change', severity: 'high', headline: 'Post-Assad political transition' },
  { id: 'i-ly', country: 'Libya', code: 'LY', lat: 32.90, lon: 13.18, type: 'political_crisis', severity: 'high', headline: 'Dual government / political fragmentation' },
  { id: 'i-ye', country: 'Yemen', code: 'YE', lat: 15.35, lon: 44.21, type: 'political_crisis', severity: 'high', headline: 'Houthi control vs recognized government' },
  { id: 'i-af', country: 'Afghanistan', code: 'AF', lat: 34.52, lon: 69.17, type: 'regime_change', severity: 'high', headline: 'Taliban governance / resistance activity' },
  { id: 'i-so', country: 'Somalia', code: 'SO', lat: 2.05, lon: 45.32, type: 'political_crisis', severity: 'high', headline: 'Al-Shabaab insurgency threatens government' },
  { id: 'i-cd', country: 'DRC', code: 'CD', lat: -1.68, lon: 29.22, type: 'political_crisis', severity: 'high', headline: 'Eastern DRC armed group conflict' },
  { id: 'i-ss', country: 'South Sudan', code: 'SS', lat: 4.85, lon: 31.60, type: 'political_crisis', severity: 'high', headline: 'Delayed elections / factional violence' },
  { id: 'i-et', country: 'Ethiopia', code: 'ET', lat: 9.02, lon: 38.75, type: 'political_crisis', severity: 'elevated', headline: 'Post-Tigray regional instability' },
  { id: 'i-ve', country: 'Venezuela', code: 'VE', lat: 10.49, lon: -66.88, type: 'political_crisis', severity: 'elevated', headline: 'Contested election / Maduro power grab' },
  { id: 'i-ni', country: 'Nicaragua', code: 'NI', lat: 12.11, lon: -86.24, type: 'political_crisis', severity: 'elevated', headline: 'Ortega authoritarian consolidation' },
  { id: 'i-ml', country: 'Mali', code: 'ML', lat: 12.64, lon: -8.00, type: 'coup', severity: 'elevated', headline: 'Military junta / Wagner presence' },
  { id: 'i-bf', country: 'Burkina Faso', code: 'BF', lat: 12.37, lon: -1.52, type: 'coup', severity: 'elevated', headline: 'Post-coup military governance' },
  { id: 'i-ne', country: 'Niger', code: 'NE', lat: 13.51, lon: 2.13, type: 'coup', severity: 'elevated', headline: 'Post-coup military junta' },
  { id: 'i-ga', country: 'Gabon', code: 'GA', lat: 0.39, lon: 9.45, type: 'coup', severity: 'moderate', headline: 'Post-coup transitional government' },
  { id: 'i-ge', country: 'Georgia', code: 'GE', lat: 41.69, lon: 44.80, type: 'political_crisis', severity: 'elevated', headline: 'Democratic backsliding / Russian influence' },
  { id: 'i-bd', country: 'Bangladesh', code: 'BD', lat: 23.81, lon: 90.41, type: 'political_crisis', severity: 'elevated', headline: 'Post-uprising interim government' },
  { id: 'i-pk', country: 'Pakistan', code: 'PK', lat: 33.69, lon: 73.04, type: 'political_crisis', severity: 'elevated', headline: 'Political crisis / military influence' },
];

// ── Severity color map ──
export const SEVERITY_COLORS = {
  critical: '#ff2222',
  high: '#ff6600',
  elevated: '#ffaa00',
  moderate: '#ffd700',
  low: '#88cc88',
};

// ── Alert type metadata ──
export const ALERT_TYPE_META = {
  assassination: { icon: '🎯', label: 'Assassination', color: '#ff2222' },
  coup: { icon: '⚔', label: 'Coup', color: '#ff4444' },
  regime_change: { icon: '🏛', label: 'Regime Change', color: '#ff6600' },
  political_crisis: { icon: '⚠', label: 'Political Crisis', color: '#ffaa00' },
  martial_law: { icon: '🔒', label: 'Martial Law', color: '#ff3333' },
};

// ── Military force icons ──
export const FORCE_ICONS = {
  navy: '⚓',
  army: '🪖',
  missile: '🚀',
  mixed: '⬡',
  militia: '⚑',
  coast_guard: '🛟',
};

// ── Military severity label ──
export const SEVERITY_LABELS = {
  critical: 'CRITICAL',
  high: 'HIGH',
  elevated: 'ELEVATED',
  low: 'LOW',
};
