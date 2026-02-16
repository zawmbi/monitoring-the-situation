/**
 * DRC / Eastern Congo Conflict Data
 * M23, ADF, and other armed groups in eastern DRC
 *
 * Data based on ACLED, UN MONUSCO, Kivu Security Tracker, and OSINT.
 * Positions approximate as of early 2026.
 */

// ─── Colors ───
export const FARDC_GREEN = '#007847';
export const M23_RED = '#cc0000';

// ─── Conflict summary ───
export const CONFLICT_SUMMARY = {
  id: 'drc',
  name: 'Eastern Congo Conflict',
  started: '2021 (M23 resurgence)',
  startDate: new Date(2021, 10, 1),
  daysSince: () => {
    const start = new Date(2021, 10, 1);
    const now = new Date();
    return Math.floor((now - start) / (1000 * 60 * 60 * 24));
  },
  phase: 'M23 offensive / Regional proxy war',
  sideA: { name: 'DRC Armed Forces (FARDC)', shortName: 'FARDC', color: FARDC_GREEN, flag: '\u{1F1E8}\u{1F1E9}' },
  sideB: { name: 'M23 / Rwanda-backed forces', shortName: 'M23', color: M23_RED, flag: '' },
  internationalSupport: {
    sideA: 'MONUSCO (withdrawing), Burundi, SADC Mission (SAMIDRC), Angola mediation',
    sideB: 'Rwanda (RDF troops embedded; UN documented), Uganda (alleged limited)',
  },
};

// ─── Frontline segments ───
export const FRONTLINE_SEGMENTS = [
  {
    id: 'north-kivu-front',
    label: 'North Kivu',
    asOf: '2026-02-01',
    status: 'active',
    points: [
      [29.00, -0.80], [29.10, -1.00], [29.15, -1.20], [29.20, -1.40],
      [29.25, -1.60], [29.30, -1.80], [29.35, -2.00],
    ],
  },
  {
    id: 'south-kivu-front',
    label: 'South Kivu',
    asOf: '2026-01-20',
    status: 'contested',
    points: [
      [29.35, -2.00], [29.30, -2.20], [29.20, -2.40], [29.10, -2.60],
      [29.00, -2.80], [28.90, -3.00],
    ],
  },
  {
    id: 'ituri-front',
    label: 'Ituri Province',
    asOf: '2026-01-15',
    status: 'active',
    points: [
      [29.50, 1.50], [29.60, 1.30], [29.70, 1.10], [29.80, 0.90],
      [29.90, 0.70], [30.00, 0.50],
    ],
  },
];

// ─── Occupied territory ───
export const OCCUPIED_TERRITORY = {
  type: 'Feature',
  properties: { side: 'sideB', label: 'M23-controlled territory' },
  geometry: {
    type: 'Polygon',
    coordinates: [[
      // M23 controlled areas in North Kivu
      [29.05, -1.00], [29.40, -1.00], [29.50, -1.20],
      [29.50, -1.50], [29.40, -1.80], [29.30, -2.00],
      [29.10, -2.00], [29.00, -1.80], [28.95, -1.50],
      [28.95, -1.20], [29.05, -1.00],
    ]],
  },
};

// ─── Capitals & cities ───
export const CAPITALS = [
  { id: 'kinshasa', name: 'Kinshasa', country: 'sideA', lat: -4.4419, lon: 15.2663, population: '17M', note: 'DRC capital; far from eastern conflict' },
];

export const MAJOR_CITIES = [
  { id: 'goma', name: 'Goma', country: 'contested', lat: -1.6585, lon: 29.2200, population: '1.5M', note: 'North Kivu capital; M23 approaching/at gates' },
  { id: 'bukavu', name: 'Bukavu', country: 'sideA', lat: -2.5083, lon: 28.8608, population: '870K', note: 'South Kivu capital; FARDC-held' },
  { id: 'bunia', name: 'Bunia', country: 'sideA', lat: 1.5592, lon: 30.2522, population: '400K', note: 'Ituri capital; ADF/CODECO activity' },
  { id: 'beni', name: 'Beni', country: 'contested', lat: 0.4921, lon: 29.4682, population: '280K', note: 'ADF attacks; civilian massacres' },
  { id: 'rutshuru', name: 'Rutshuru', country: 'sideB', lat: -1.1833, lon: 29.4500, population: '100K', note: 'M23-controlled since 2022' },
  { id: 'masisi', name: 'Masisi', country: 'sideB', lat: -1.4000, lon: 28.8000, population: '50K', note: 'M23-controlled area' },
  { id: 'sake', name: 'Sake', country: 'contested', lat: -1.5728, lon: 29.0417, population: '60K', note: 'Key road junction; fighting' },
  { id: 'lubero', name: 'Lubero', country: 'sideA', lat: -0.1583, lon: 29.2417, population: '50K', note: 'Northern North Kivu; Mai-Mai activity' },
  { id: 'kigali', name: 'Kigali', country: 'other', lat: -1.9403, lon: 30.0587, population: '1.2M', note: 'Rwanda capital; alleged M23 support hub' },
  { id: 'kampala', name: 'Kampala', country: 'other', lat: 0.3476, lon: 32.5825, population: '1.7M', note: 'Uganda capital; EAC mediation' },
];

// ─── Military infrastructure ───
export const MILITARY_INFRASTRUCTURE = [
  { id: 'base-goma', type: 'depot', side: 'sideA', name: 'Goma Military Base', lat: -1.65, lon: 29.23, note: 'FARDC North Kivu HQ' },
  { id: 'base-bukavu', type: 'depot', side: 'sideA', name: 'Bukavu Military Base', lat: -2.51, lon: 28.86, note: 'FARDC South Kivu HQ' },
  { id: 'monusco-goma', type: 'depot', side: 'sideA', name: 'MONUSCO Base (Goma)', lat: -1.67, lon: 29.23, note: 'UN peacekeeping; withdrawing' },
  { id: 'samidrc-base', type: 'depot', side: 'sideA', name: 'SAMIDRC Base', lat: -1.60, lon: 29.20, note: 'SADC mission (South Africa, Malawi, Tanzania)' },
  { id: 'ab-goma', type: 'airbase', side: 'sideA', name: 'Goma International Airport', lat: -1.6708, lon: 29.2385, note: 'Military and humanitarian flights' },
  { id: 'm23-rutshuru', type: 'depot', side: 'sideB', name: 'M23 Rutshuru HQ', lat: -1.18, lon: 29.45, note: 'M23 administrative center' },
];

// ─── Troop positions ───
export const TROOP_POSITIONS = [
  // FARDC + allies
  { id: 'fardc-goma', side: 'sideA', unitType: 'infantry', unitSize: 'division', name: 'FARDC 34th Military Region', lat: -1.66, lon: 29.22, sector: 'Goma' },
  { id: 'fardc-bukavu', side: 'sideA', unitType: 'infantry', unitSize: 'brigade', name: 'FARDC South Kivu Brigade', lat: -2.51, lon: 28.86, sector: 'Bukavu' },
  { id: 'fardc-ituri', side: 'sideA', unitType: 'infantry', unitSize: 'brigade', name: 'FARDC Ituri Brigade', lat: 1.56, lon: 30.25, sector: 'Ituri' },
  { id: 'samidrc-force', side: 'sideA', unitType: 'infantry', unitSize: 'brigade', name: 'SAMIDRC (SADC Force)', lat: -1.60, lon: 29.18, sector: 'North Kivu' },
  { id: 'wazalendo-north', side: 'sideA', unitType: 'infantry', unitSize: 'brigade', name: 'Wazalendo Militias', lat: -1.40, lon: 29.00, sector: 'North Kivu' },
  // M23 / Rwanda-backed
  { id: 'm23-north', side: 'sideB', unitType: 'infantry', unitSize: 'brigade', name: 'M23 Northern Force', lat: -1.18, lon: 29.45, sector: 'Rutshuru' },
  { id: 'm23-masisi', side: 'sideB', unitType: 'infantry', unitSize: 'brigade', name: 'M23 Masisi Force', lat: -1.40, lon: 28.80, sector: 'Masisi' },
  { id: 'm23-goma-approach', side: 'sideB', unitType: 'mechanized', unitSize: 'brigade', name: 'M23/RDF Advance Force', lat: -1.55, lon: 29.15, sector: 'Goma approaches' },
  { id: 'rdf-embedded', side: 'sideB', unitType: 'mechanized', unitSize: 'brigade', name: 'RDF Elements (Rwandan)', lat: -1.30, lon: 29.35, sector: 'North Kivu' },
];

// ─── Battle sites ───
export const BATTLE_SITES = [
  {
    id: 'battle-goma-2025', name: 'Battle of Goma', lat: -1.6585, lon: 29.2200,
    date: 'Jan 2025 – ongoing', result: 'Contested',
    note: 'M23/RDF forces approach or enter Goma; humanitarian catastrophe',
    sideACommander: 'FARDC / SAMIDRC', sideBCommander: 'M23 / RDF',
    sideATroops: '~20,000 FARDC + 5,000 SAMIDRC', sideBTroops: '~10,000 M23 + ~3,000 RDF',
    sideAEquipment: 'Infantry, limited armor, air support', sideBEquipment: 'Artillery, mortars, small arms, night vision',
    sideACasualties: 'Hundreds killed; SAMIDRC troops killed', sideBCasualties: 'Moderate',
    significance: 'Fall or siege of Goma would displace 1.5M+ people. Regional escalation risk. Congo severed diplomatic ties with Rwanda.',
  },
  {
    id: 'battle-rutshuru', name: 'Rutshuru Territory', lat: -1.1833, lon: 29.4500,
    date: 'Oct 2022 – ongoing', result: 'M23 captured',
    note: 'M23 captured Rutshuru territory in late 2022',
    sideACommander: 'FARDC', sideBCommander: 'M23 leadership',
    sideATroops: '~5,000', sideBTroops: '~3,000',
    sideAEquipment: 'Infantry', sideBEquipment: 'Rwanda-supplied weapons',
    sideACasualties: 'Hundreds', sideBCasualties: 'Light',
    significance: 'Gave M23 control of lucrative border trade and minerals. Displaced hundreds of thousands.',
  },
  {
    id: 'battle-beni-adf', name: 'ADF Attacks in Beni', lat: 0.4921, lon: 29.4682,
    date: '2014 – ongoing', result: 'Ongoing',
    note: 'ADF (Islamic State-linked) massacres of civilians in Beni territory',
    sideACommander: 'FARDC / UPDF (Uganda)', sideBCommander: 'ADF / ISCAP',
    sideATroops: '~10,000 FARDC + UPDF', sideBTroops: '~2,000 ADF',
    sideAEquipment: 'Infantry, air support', sideBEquipment: 'Small arms, IEDs, machetes',
    sideACasualties: 'Hundreds of soldiers killed', sideBCasualties: 'Hundreds killed',
    significance: 'ADF has killed 6,000+ civilians since 2014. IS-affiliated since 2019. Separate from M23 conflict but overlapping geography.',
  },
];

// ─── Casualties ───
export const CASUALTIES = {
  overall: {
    killed: { low: 6000000, high: 6900000, label: '~6+ million total deaths since 1996 (all Congo wars)' },
    note: 'Deadliest conflict since WWII when including all phases. Current M23 resurgence: ~10,000+ killed since 2022.',
    source: 'IRC / ACLED / Kivu Security Tracker',
  },
  current: {
    m23Conflict: { low: 10000, high: 20000, label: '10,000–20,000 killed (2022-2026 est.)' },
    adfConflict: { low: 6000, high: 8000, label: '6,000+ civilian victims (ADF since 2014)' },
    source: 'ACLED / Kivu Security Tracker',
  },
  asOf: 'February 2026',
};

// ─── Equipment ───
export const EQUIPMENT = {
  sideA: {
    assets: [
      { type: 'Fighter Aircraft', count: '~10', note: 'Su-25 (limited serviceability)' },
      { type: 'Attack Helicopters', count: '~15', note: 'Mi-24, Mi-17 (some MONUSCO)' },
      { type: 'Tanks', count: '~50', note: 'T-55, Type 59 (poor condition)' },
      { type: 'APCs', count: '~100', note: 'Various; many non-functional' },
      { type: 'SAMIDRC Equipment', count: 'Brigade-strength', note: 'South African Rooikat, Casspir' },
    ],
    source: 'IISS / OSINT',
  },
  sideB: {
    assets: [
      { type: 'Rwanda-supplied weapons', count: 'Significant', note: 'Mortars, MANPADs, anti-tank (UN documented)' },
      { type: 'RDF embedded troops', count: '~3,000-4,000', note: 'UN Group of Experts documented' },
      { type: 'Small arms', count: '~10,000+', note: 'AK-pattern, PKM, RPG' },
      { type: 'Night vision / comms', count: 'Modern', note: 'Rwandan military-grade equipment' },
    ],
    source: 'UN Group of Experts / OSINT',
  },
  asOf: 'February 2026',
};

// ─── Command structure ───
export const COMMAND = {
  sideA: {
    title: 'FARDC (Armed Forces of the DRC)',
    commanderInChief: { name: 'Felix Tshisekedi', role: 'President / Commander-in-Chief', since: 'Jan 2019' },
    keyCommanders: [
      { name: 'Felix Tshisekedi', role: 'President of the DRC' },
      { name: 'Gen. Christian Tshiwewe', role: 'Chief of Staff, FARDC' },
    ],
    totalPersonnel: '~130,000 (plus Wazalendo militia allies)',
  },
  sideB: {
    title: 'M23 / AFC (Alliance Fleuve Congo)',
    commanderInChief: { name: 'Sultani Makenga', role: 'M23 Military Commander', since: '2012' },
    keyCommanders: [
      { name: 'Corneille Nangaa', role: 'AFC Political Leader' },
      { name: 'Sultani Makenga', role: 'M23 Military Commander' },
      { name: 'Bertrand Bisimwa', role: 'M23 Political President' },
    ],
    totalPersonnel: '~10,000 M23 + ~3,000-4,000 RDF (est.)',
  },
};

// ─── Timeline ───
export const WAR_TIMELINE = [
  { date: '2012-11-20', event: 'M23 captures Goma briefly; then withdraws under pressure', phase: 'first_war' },
  { date: '2013-11-05', event: 'M23 defeated by FARDC + UN intervention brigade', phase: 'first_war' },
  { date: '2021-11-01', event: 'M23 resurges; attacks FARDC positions in North Kivu', phase: 'resurgence' },
  { date: '2022-10-20', event: 'M23 captures Rutshuru territory and Bunagana border town', phase: 'offensive' },
  { date: '2022-11-15', event: 'UN Group of Experts documents Rwandan troops fighting alongside M23', phase: 'escalation' },
  { date: '2023-03-07', event: 'EAC regional force deployed (Kenya, Burundi, Uganda); ineffective', phase: 'peacekeeping' },
  { date: '2023-06-01', event: 'M23 expands territory; captures Masisi areas', phase: 'offensive' },
  { date: '2023-12-01', event: 'EAC force withdraws; replaced by SADC mission (SAMIDRC)', phase: 'peacekeeping' },
  { date: '2024-02-01', event: 'SAMIDRC deploys (South Africa, Tanzania, Malawi)', phase: 'peacekeeping' },
  { date: '2024-06-01', event: 'DRC severs diplomatic ties with Rwanda', phase: 'escalation' },
  { date: '2024-09-01', event: 'MONUSCO begins withdrawal from eastern DRC', phase: 'peacekeeping' },
  { date: '2024-12-01', event: 'M23 advances toward Goma; heavy fighting in Sake area', phase: 'offensive' },
  { date: '2025-01-27', event: 'M23/RDF enter Goma outskirts; regional crisis intensifies', phase: 'offensive' },
  { date: '2025-03-01', event: 'Angola-mediated ceasefire attempts; fighting continues', phase: 'diplomatic' },
  { date: '2025-06-01', event: 'SAMIDRC troops killed in fighting; South Africa threatens escalation', phase: 'escalation' },
  { date: '2026-01-01', event: 'Goma under pressure; humanitarian crisis deepens; 7M+ displaced in DRC', phase: 'offensive' },
];

// ─── Humanitarian ───
export const HUMANITARIAN = {
  refugees: {
    total: 1100000,
    label: '~1.1 million refugees from DRC',
    topCountries: [
      { country: 'Uganda', count: 500000 },
      { country: 'Burundi', count: 150000 },
      { country: 'Tanzania', count: 100000 },
      { country: 'Rwanda', count: 80000 },
    ],
    source: 'UNHCR (Jan 2026)',
  },
  internallyDisplaced: {
    total: 7200000,
    label: '~7.2 million internally displaced',
    note: 'Largest IDP crisis in Africa; mostly eastern provinces',
    source: 'OCHA / IOM',
  },
  hunger: {
    atRisk: 26000000,
    label: '~26 million food insecure in DRC',
    note: 'Largest food crisis in the world by number of people',
    source: 'WFP / IPC',
  },
  minerals: {
    note: 'Conflict fueled by control of coltan, cassiterite, wolframite, gold',
    value: 'Billions in conflict minerals annually',
    source: 'UN Group of Experts / Global Witness',
  },
  asOf: 'February 2026',
};

// ─── Territorial control ───
export const TERRITORIAL_CONTROL = {
  totalArea: 2344858,
  m23Controlled: '~5,000 km\u00B2 in North Kivu',
  adfPresence: 'Beni territory / Ituri',
  govtControlled: 'Most of DRC; eastern provinces contested',
  note: 'Over 100 armed groups operate in eastern DRC',
  asOf: 'February 2026',
  source: 'Kivu Security Tracker / ACLED',
};

// ─── Coat of Arms ───
export const COAT_OF_ARMS = {
  sideA: { lat: -4.44, lon: 15.27, name: 'DRC (Kinshasa)' },
  sideB: { lat: -1.18, lon: 29.45, name: 'M23' },
};

// ─── Fortification lines ───
export const FORTIFICATION_LINES = [];

// ─── Recency color coding ───
export function getFrontlineColor(asOf) {
  const days = Math.floor((Date.now() - new Date(asOf).getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 7) return '#ff3333';
  if (days <= 14) return '#ff6633';
  if (days <= 30) return '#ff9933';
  if (days <= 60) return '#ffcc33';
  return '#999999';
}
