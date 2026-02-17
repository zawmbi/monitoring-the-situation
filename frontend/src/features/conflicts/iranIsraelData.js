/**
 * Iran-Israel Conflict Data (Twelve Day War & Aftermath)
 * Based on publicly available OSINT, IISS, and media sources.
 * Positions approximate as of early 2026.
 */

// ─── Colors ───
export const IR_GREEN = '#239f40';
export const IR_RED = '#da0000';
export const IL_BLUE = '#0038b8';
export const IL_WHITE = '#ffffff';

// ─── Conflict summary ───
export const CONFLICT_SUMMARY = {
  id: 'iran-israel',
  name: 'Iran–Israel War',
  started: '13 June 2025',
  startDate: new Date(2025, 5, 13),
  daysSince: () => {
    const start = new Date(2025, 5, 13);
    const now = new Date();
    return Math.floor((now - start) / (1000 * 60 * 60 * 24));
  },
  phase: 'Ceasefire (fragile) / Renewed strike risk / Iranian internal crisis',
  sideA: {
    name: 'Israel / United States', shortName: 'IL/US', color: IL_BLUE, flag: '🇮🇱',
    leader: 'PM Benjamin Netanyahu / Pres. Donald Trump',
    description: 'Israel launched Operation Dawn Strike on June 13, 2025 with 200+ fighter jets hitting ~100 targets across Iran. The US joined on June 22, bombing three nuclear sites. Combined forces devastated Iran\'s nuclear program and missile arsenal.',
    goals: 'Eliminate Iranian nuclear capability, degrade missile arsenal, deter future threats',
  },
  sideB: {
    name: 'Iran / IRGC', shortName: 'Iran', color: IR_GREEN, flag: '🇮🇷',
    leader: 'Supreme Leader Khamenei / Pres. Pezeshkian',
    description: 'Islamic Republic of Iran and the Islamic Revolutionary Guard Corps (IRGC). Retaliated with 550+ ballistic missiles and 1,000+ drones. EU designated IRGC as terrorist organization Jan 2026. Regime faces largest protests since 1979.',
    goals: 'Nuclear deterrent, regime survival, regional influence through Axis of Resistance',
  },
  background: 'After the IAEA declared Iran non-compliant, Israel launched surprise strikes on June 13, 2025. Iran retaliated massively. The US joined June 22. Ceasefire reached June 24. Over 1,100 Iranians and 28 Israelis killed. No formal peace exists. In Jan 2026, Israeli Security Cabinet authorized additional strikes. Iranian protests erupted Dec 28, 2025 — the largest since 1979, with 30,000+ killed in crackdowns.',
  internationalSupport: {
    sideA: 'United States (direct military), NATO (intelligence), Arab Gulf states (tacit)',
    sideB: 'Russia (diplomatic), Hezbollah, Houthis, Iraqi militias (Axis of Resistance)',
  },
};

// ─── Control zones ───
export const CONTROL_ZONES = [
  {
    id: 'natanz',
    name: 'Natanz Nuclear Facility (Destroyed)',
    side: 'sideA',
    type: 'strike-target',
    note: 'Underground enrichment facility struck by US bunker busters June 22',
    polygon: [
      [51.70, 33.75], [51.75, 33.75], [51.75, 33.70], [51.70, 33.70], [51.70, 33.75],
    ],
  },
  {
    id: 'isfahan',
    name: 'Isfahan Nuclear Complex (Damaged)',
    side: 'sideA',
    type: 'strike-target',
    note: 'UCF plant and associated facilities struck June 13-22',
    polygon: [
      [51.63, 32.70], [51.68, 32.70], [51.68, 32.65], [51.63, 32.65], [51.63, 32.70],
    ],
  },
  {
    id: 'fordow',
    name: 'Fordow Enrichment Facility',
    side: 'sideA',
    type: 'strike-target',
    note: 'Deep underground facility, partially damaged',
    polygon: [
      [51.56, 34.89], [51.60, 34.89], [51.60, 34.85], [51.56, 34.85], [51.56, 34.89],
    ],
  },
  {
    id: 'tehran-protests',
    name: 'Tehran Protest Zone',
    side: 'contested',
    type: 'protest-zone',
    note: 'Epicenter of ongoing anti-regime protests since Dec 28, 2025',
    polygon: [
      [51.35, 35.75], [51.50, 35.75], [51.50, 35.65], [51.35, 35.65], [51.35, 35.75],
    ],
  },
];

// ─── Frontline segments ───
// Not a traditional frontline war; use strike corridors
export const FRONTLINE_SEGMENTS = [];

// ─── Troop deployments ───
export const TROOP_DEPLOYMENTS = [
  {
    id: 'iaf-bases',
    side: 'sideA',
    label: 'IAF Strike Package',
    type: 'air',
    strength: '200+ aircraft',
    lat: 31.25, lon: 34.78,
    note: 'F-35I, F-15I Ra\'am launched from Nevatim and Ramon airbases',
  },
  {
    id: 'us-b2',
    side: 'sideA',
    label: 'USAF B-2 Deployment',
    type: 'air',
    strength: '6 B-2 Spirit bombers',
    lat: 25.38, lon: 55.40,
    note: 'Forward deployed to Al Dhafra, UAE; struck Natanz/Fordow June 22',
  },
  {
    id: 'irgc-missile',
    side: 'sideB',
    label: 'IRGC Missile Forces',
    type: 'missile',
    strength: '550+ ballistic missiles launched',
    lat: 34.80, lon: 50.95,
    note: 'Massive retaliatory salvo overwhelmed some Iron Dome coverage',
  },
  {
    id: 'irgc-drone',
    side: 'sideB',
    label: 'IRGC Drone Swarm',
    type: 'air',
    strength: '1,000+ Shahed drones',
    lat: 33.50, lon: 48.35,
    note: 'Multi-vector drone attacks from western Iran',
  },
  {
    id: 'protests-nationwide',
    side: 'contested',
    label: 'Nationwide Protests',
    type: 'protest',
    strength: 'Millions of participants',
    lat: 35.69, lon: 51.39,
    note: 'Largest uprising since 1979; 30,000+ killed in crackdown',
  },
];

// ─── Casualties ───
export const CASUALTIES = {
  sideA: {
    killed: { total: 28, label: 'Israeli casualties', source: 'IDF/media' },
    wounded: { total: 185, label: 'Israeli wounded', source: 'IDF/media' },
    civilianDeaths: { total: 12, label: 'Civilian deaths in Israel', source: 'Media reports' },
  },
  sideB: {
    killed: { total: 1100, label: 'Iranian casualties', source: 'OSINT/media estimates' },
    wounded: { total: 3500, label: 'Iranian wounded', source: 'OSINT estimates' },
    civilianDeaths: { total: 340, label: 'Iranian civilian deaths', source: 'Media estimates' },
    protestDeaths: { total: 30000, label: 'Protest crackdown deaths (est.)', source: 'Internal estimates / opposition' },
  },
  infrastructure: {
    nuclearFacilities: { destroyed: 3, damaged: 5, label: 'Nuclear facilities hit' },
    missileBases: { destroyed: 12, label: 'IRGC missile sites destroyed' },
    airDefense: { destroyed: 18, label: 'Air defense systems neutralized' },
  },
};

// ─── Equipment ───
export const EQUIPMENT = {
  sideA: [
    { name: 'F-35I Adir', type: 'aircraft', count: '~50', note: 'Stealth strike aircraft' },
    { name: 'F-15I Ra\'am', type: 'aircraft', count: '~60', note: 'Long-range strike' },
    { name: 'B-2 Spirit', type: 'aircraft', count: 6, note: 'US bunker-buster delivery' },
    { name: 'Iron Dome', type: 'air-defense', count: 10, note: 'Short-range interceptor' },
    { name: 'Arrow-3', type: 'air-defense', count: 2, note: 'Exo-atmospheric interceptor' },
    { name: 'David\'s Sling', type: 'air-defense', count: 4, note: 'Medium-range interceptor' },
  ],
  sideB: [
    { name: 'Emad MRBM', type: 'missile', count: '~200', note: 'Medium-range ballistic' },
    { name: 'Kheibar Shekan', type: 'missile', count: '~150', note: 'Solid-fuel MRBM' },
    { name: 'Fattah-2 HGV', type: 'missile', count: '~30', note: 'Hypersonic glide vehicle' },
    { name: 'Shahed-136', type: 'drone', count: '1000+', note: 'One-way attack drone' },
    { name: 'S-300PMU2', type: 'air-defense', count: 4, note: 'Russian-supplied (most destroyed)' },
    { name: 'Bavar-373', type: 'air-defense', count: 3, note: 'Indigenous long-range SAM' },
  ],
};

// ─── Command structure ───
export const COMMAND_STRUCTURE = {
  sideA: [
    { role: 'Supreme Commander', name: 'PM Benjamin Netanyahu', since: '2022' },
    { role: 'Defense Minister', name: 'Yoav Gallant', since: '2023' },
    { role: 'IDF Chief of Staff', name: 'Lt. Gen. Herzi Halevi', since: '2023' },
    { role: 'IAF Commander', name: 'Maj. Gen. Tomer Bar', since: '2022' },
    { role: 'US CENTCOM', name: 'Gen. Michael Kurilla', since: '2022' },
  ],
  sideB: [
    { role: 'Supreme Leader', name: 'Ayatollah Ali Khamenei (86)', since: '1989' },
    { role: 'President', name: 'Masoud Pezeshkian', since: '2024' },
    { role: 'IRGC Commander', name: 'Maj. Gen. Hossein Salami', since: '2019' },
    { role: 'IRGC Aerospace', name: 'Brig. Gen. Amir Ali Hajizadeh', since: '2009' },
    { role: 'Quds Force', name: 'Brig. Gen. Esmail Qaani', since: '2020' },
  ],
};

// ─── Key events timeline ───
export const KEY_EVENTS = [
  { date: '2025-06-13', event: 'Israel launches Operation Dawn Strike — 200+ aircraft hit ~100 targets across Iran', severity: 5 },
  { date: '2025-06-13', event: 'Iran retaliates with 550+ ballistic missiles and 1,000+ drones', severity: 5 },
  { date: '2025-06-14', event: 'Iron Dome and Arrow-3 intercept majority of incoming missiles; some impacts in Tel Aviv area', severity: 4 },
  { date: '2025-06-22', event: 'US B-2 bombers strike Natanz, Fordow, and Isfahan nuclear facilities', severity: 5 },
  { date: '2025-06-23', event: 'Iran fires missiles at US base in Qatar — minor damage', severity: 4 },
  { date: '2025-06-24', event: 'Ceasefire reached under US diplomatic pressure', severity: 3 },
  { date: '2025-10-15', event: 'IAEA confirms Iran\'s nuclear enrichment capability destroyed', severity: 3 },
  { date: '2025-12-28', event: 'Massive anti-regime protests erupt across Iran', severity: 4 },
  { date: '2026-01-15', event: 'Israeli Security Cabinet authorizes additional strikes if needed', severity: 4 },
  { date: '2026-01-29', event: 'EU designates IRGC as terrorist organization', severity: 3 },
  { date: '2026-02-14', event: '250,000+ protest in Munich — Global Day of Action for Iran', severity: 3 },
];
