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
  name: 'Twelve Day War',
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
    killed: { low: 25, high: 30, label: '~28 Israeli casualties' },
    wounded: { low: 150, high: 200, label: '~185 Israeli wounded' },
    civilian: { killed: 12, label: '~12 civilian deaths' },
    source: 'IDF/media',
  },
  sideB: {
    killed: { low: 1000, high: 1200, label: '~1,100 Iranian casualties' },
    wounded: { low: 3000, high: 4000, label: '~3,500 Iranian wounded' },
    source: 'OSINT/media',
  },
  civilian: {
    killed: { low: 300, high: 400, label: '~340 Iranian civilian deaths' },
    protestDeaths: { low: 25000, high: 35000, label: '~30,000+ killed in protest crackdowns (opposition est.)' },
    note: 'Protest death toll from Dec 28, 2025 uprising crackdown. Iranian government disputes figures.',
    source: 'OSINT / opposition estimates / media',
  },
  infrastructure: {
    nuclearFacilities: { destroyed: 3, damaged: 5, label: 'Nuclear facilities hit' },
    missileBases: { destroyed: 12, label: 'IRGC missile sites destroyed' },
    airDefense: { destroyed: 18, label: 'Air defense systems neutralized' },
  },
  asOf: 'February 2026',
};

// ─── Equipment ───
export const EQUIPMENT = {
  sideA: {
    deployed: [
      { type: 'F-35I Adir', count: '~50', note: 'Stealth strike aircraft' },
      { type: 'F-15I Ra\'am', count: '~60', note: 'Long-range strike' },
      { type: 'B-2 Spirit', count: 6, note: 'US bunker-buster delivery' },
      { type: 'Iron Dome', count: 10, note: 'Short-range interceptor' },
      { type: 'Arrow-3', count: 2, note: 'Exo-atmospheric interceptor' },
      { type: 'David\'s Sling', count: 4, note: 'Medium-range interceptor' },
    ],
    source: 'IDF / OSINT',
  },
  sideB: {
    preWar: [
      { type: 'Emad MRBM', count: '~200', note: 'Medium-range ballistic' },
      { type: 'Kheibar Shekan', count: '~150', note: 'Solid-fuel MRBM' },
      { type: 'Fattah-2 HGV', count: '~30', note: 'Hypersonic glide vehicle' },
      { type: 'Shahed-136', count: '1000+', note: 'One-way attack drone' },
      { type: 'S-300PMU2', count: 4, note: 'Russian-supplied (most destroyed)' },
      { type: 'Bavar-373', count: 3, note: 'Indigenous long-range SAM' },
    ],
    destroyed: [
      { type: 'Nuclear enrichment facilities', count: 3 },
      { type: 'IRGC missile sites', count: 12 },
      { type: 'Air defense systems', count: 18 },
    ],
    source: 'OSINT / media',
  },
  asOf: 'February 2026',
};

// ─── Command ───
export const COMMAND = {
  sideA: {
    title: 'Israel Defense Forces / US CENTCOM',
    keyCommanders: [
      { name: 'Benjamin Netanyahu', role: 'Prime Minister' },
      { name: 'Yoav Gallant', role: 'Defense Minister' },
      { name: 'Lt. Gen. Herzi Halevi', role: 'IDF Chief of Staff' },
      { name: 'Maj. Gen. Tomer Bar', role: 'IAF Commander' },
      { name: 'Gen. Michael Kurilla', role: 'US CENTCOM Commander' },
    ],
    totalPersonnel: '200+ aircraft + 6 B-2 bombers + naval/air support',
  },
  sideB: {
    title: 'Islamic Republic of Iran / IRGC',
    keyCommanders: [
      { name: 'Ayatollah Ali Khamenei', role: 'Supreme Leader' },
      { name: 'Masoud Pezeshkian', role: 'President' },
      { name: 'Maj. Gen. Hossein Salami', role: 'IRGC Commander' },
      { name: 'Brig. Gen. Amir Ali Hajizadeh', role: 'IRGC Aerospace Forces' },
      { name: 'Brig. Gen. Esmail Qaani', role: 'Quds Force Commander' },
    ],
    totalPersonnel: '~580,000 IRGC + 350,000 regular military',
  },
};

// ─── War timeline ───
export const WAR_TIMELINE = [
  { date: '2025-06-13', event: 'Israel launches Operation Dawn Strike — 200+ aircraft hit ~100 targets across Iran', severity: 5, phase: 'war' },
  { date: '2025-06-13', event: 'Iran retaliates with 550+ ballistic missiles and 1,000+ drones', severity: 5, phase: 'war' },
  { date: '2025-06-14', event: 'Iron Dome and Arrow-3 intercept majority of incoming missiles; some impacts in Tel Aviv area', severity: 4, phase: 'escalation' },
  { date: '2025-06-22', event: 'US B-2 bombers strike Natanz, Fordow, and Isfahan nuclear facilities', severity: 5, phase: 'war' },
  { date: '2025-06-23', event: 'Iran fires missiles at US base in Qatar — minor damage', severity: 4, phase: 'escalation' },
  { date: '2025-06-24', event: 'Ceasefire reached under US diplomatic pressure', severity: 3, phase: 'ceasefire' },
  { date: '2025-10-15', event: 'IAEA confirms Iran\'s nuclear enrichment capability destroyed', severity: 3, phase: 'diplomatic' },
  { date: '2025-12-28', event: 'Massive anti-regime protests erupt across Iran', severity: 4, phase: 'crackdown' },
  { date: '2026-01-15', event: 'Israeli Security Cabinet authorizes additional strikes if needed', severity: 4, phase: 'escalation' },
  { date: '2026-01-29', event: 'EU designates IRGC as terrorist organization', severity: 3, phase: 'diplomatic' },
  { date: '2026-02-14', event: '250,000+ protest in Munich — Global Day of Action for Iran', severity: 3, phase: 'diplomatic' },
];

// ─── Humanitarian ───
export const HUMANITARIAN = {
  internallyDisplaced: { total: 500000, label: '~500,000 displaced within Iran from strikes', source: 'OCHA estimates' },
  refugees: { total: 0, label: 'No significant external refugee flow from this conflict', source: 'UNHCR' },
  infrastructureDamage: {
    nuclearFacilities: '3 destroyed, 5 damaged',
    missileBases: '12 IRGC missile sites destroyed',
    airDefense: '18 air defense systems neutralized',
    economicDamage: 'Estimated $50B+ in military/nuclear infrastructure losses',
    source: 'IAEA / OSINT / media estimates',
  },
  hunger: { label: 'Economic sanctions + infrastructure damage causing supply chain disruptions', source: 'WFP' },
  asOf: 'February 2026',
};

// ─── Territorial control ───
export const TERRITORIAL_CONTROL = {
  nuclearProgram: 'Iran\'s enrichment capability destroyed (IAEA confirmed Oct 2025)',
  militaryAssets: '~60% of IRGC missile arsenal destroyed or degraded',
  airDefense: 'Iranian air defense network effectively neutralized',
  regimeControl: 'Central government authority challenged by nationwide protests since Dec 2025',
  asOf: 'February 2026',
  source: 'IAEA / IISS / OSINT',
};

// ─── Battle sites ───
export const BATTLE_SITES = [
  {
    id: 'dawn-strike',
    name: 'Operation Dawn Strike',
    lat: 32.65, lon: 51.67,
    date: '13 Jun 2025',
    result: 'Israeli victory',
    note: '200+ IAF jets struck ~100 targets across Iran in surprise attack',
    sideACommander: 'IAF Command',
    sideBCommander: 'IRGC Air Defense',
    sideATroops: '200+ aircraft',
    sideBTroops: 'Air defense units',
    sideAEquipment: 'F-35I, F-15I',
    sideBEquipment: 'S-300, Bavar-373',
    sideACasualties: 'None reported',
    sideBCasualties: '~600 killed',
    significance: 'Largest Israeli air operation in history; devastated Iranian military infrastructure',
  },
  {
    id: 'iran-retaliation',
    name: 'Iranian Missile/Drone Retaliation',
    lat: 32.08, lon: 34.78,
    date: '13 Jun 2025',
    result: 'Partially intercepted',
    note: 'Iran launched 550+ ballistic missiles and 1,000+ drones at Israel',
    sideACommander: 'IDF Air Defense',
    sideBCommander: 'IRGC Missile Forces',
    sideATroops: 'Iron Dome, Arrow-3, David\'s Sling batteries',
    sideBTroops: 'IRGC Aerospace',
    sideAEquipment: 'Iron Dome, Arrow-3',
    sideBEquipment: 'Emad, Kheibar Shekan, Shahed-136',
    sideACasualties: '28 killed, 185 wounded',
    sideBCasualties: 'N/A',
    significance: 'Largest ballistic missile attack in history; most intercepted but some impacts in Tel Aviv area',
  },
  {
    id: 'us-nuclear-strikes',
    name: 'US Nuclear Site Strikes',
    lat: 33.72, lon: 51.65,
    date: '22 Jun 2025',
    result: 'Decisive coalition victory',
    note: 'US B-2 bombers struck Natanz, Fordow, and Isfahan nuclear facilities',
    sideACommander: 'US CENTCOM',
    sideBCommander: 'IRGC defense forces',
    sideATroops: '6 B-2 Spirit bombers',
    sideBTroops: 'Facility defense units',
    sideAEquipment: 'B-2 Spirit, GBU-57 bunker busters',
    sideBEquipment: 'Underground fortifications',
    sideACasualties: 'None',
    sideBCasualties: '~200 killed at facilities',
    significance: 'Destroyed Iran\'s nuclear enrichment capability; first US combat use of GBU-57',
  },
  {
    id: 'protests-dec25',
    name: 'Iranian Uprising (Dec 2025)',
    lat: 35.69, lon: 51.39,
    date: '28 Dec 2025',
    result: 'Ongoing',
    note: 'Largest protests since 1979 revolution erupted across Iran',
    sideACommander: 'Popular movement (decentralized)',
    sideBCommander: 'IRGC / Basij',
    sideATroops: 'Millions of civilians',
    sideBTroops: 'Security forces',
    sideAEquipment: 'N/A',
    sideBEquipment: 'Riot control, firearms',
    sideACasualties: '~30,000 killed (opposition est.)',
    sideBCasualties: 'Unknown',
    significance: 'Threatens regime survival; largest challenge to Islamic Republic since its founding',
  },
];

// ─── International response ───
export const INTERNATIONAL_RESPONSE = {
  euIrgcDesignation: 'EU designated IRGC as terrorist organization (Jan 29, 2026)',
  iaeaFindings: 'IAEA confirmed Iran\'s nuclear enrichment capability destroyed (Oct 2025)',
  usStance: 'Trump administration backed Israel; B-2 bombers struck nuclear sites June 22',
  israelCabinet: 'Israeli Security Cabinet authorized additional strikes if needed (Jan 2026)',
  russiaPosition: 'Russia condemned strikes but did not intervene militarily',
  globalProtests: '250,000+ protested in Munich during Global Day of Action (Feb 14, 2026)',
  asOf: 'February 2026',
};
