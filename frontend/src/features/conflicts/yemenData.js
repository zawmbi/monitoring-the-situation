/**
 * Yemen / Houthi Conflict Data
 * Multi-party civil war and Red Sea crisis
 *
 * Data based on ACLED, OCHA, and OSINT sources.
 * Positions approximate as of early 2026.
 */

// ─── Colors ───
export const HOUTHI_GREEN = '#006400';
export const GOVT_BLUE = '#003580';
export const STC_RED = '#c8102e';
export const COALITION_GOLD = '#c8a415';

// ─── Conflict summary ───
export const CONFLICT_SUMMARY = {
  id: 'yemen',
  name: 'Yemen War & Red Sea Crisis',
  started: '19 March 2015',
  startDate: new Date(2015, 2, 19),
  daysSince: () => {
    const start = new Date(2015, 2, 19);
    const now = new Date();
    return Math.floor((now - start) / (1000 * 60 * 60 * 24));
  },
  phase: 'Stalemate / Houthi Red Sea attacks on shipping',
  sideA: { name: 'Houthis (Ansar Allah)', shortName: 'Houthis', color: HOUTHI_GREEN, flag: '\u{1F1FE}\u{1F1EA}' },
  sideB: { name: 'Intl. Recognized Govt / Coalition', shortName: 'IRG/Coalition', color: GOVT_BLUE, flag: '\u{1F1FE}\u{1F1EA}' },
  internationalSupport: {
    sideA: 'Iran (missiles, drones, advisors)',
    sideB: 'Saudi Arabia, UAE, US/UK (anti-Houthi strikes)',
  },
};

// ─── Frontline segments ───
// Removed: civil/internal conflicts have no meaningful continuous frontlines.
// Battle markers (BATTLE_SITES) show active areas of fighting instead.
export const FRONTLINE_SEGMENTS = [];

// ─── Occupied territory ───
export const OCCUPIED_TERRITORY = {
  type: 'Feature',
  properties: { side: 'sideA', label: 'Houthi-controlled territory' },
  geometry: {
    type: 'Polygon',
    coordinates: [[
      // Northern/western Yemen — Houthi control
      [43.00, 17.00], [44.50, 17.00], [45.00, 16.50], [45.50, 16.00],
      [45.50, 15.50], [45.20, 15.00], [45.00, 14.50], [44.50, 14.00],
      [44.00, 13.60], [43.50, 13.50], [43.20, 13.80], [42.80, 14.50],
      [42.60, 15.50], [42.80, 16.50], [43.00, 17.00],
    ]],
  },
};

// ─── Capitals & cities ───
export const CAPITALS = [
  { id: 'sanaa', name: 'Sanaa', country: 'sideA', lat: 15.3694, lon: 44.1910, population: '3.9M', note: 'Houthi-controlled capital' },
  { id: 'aden', name: 'Aden', country: 'sideB', lat: 12.8000, lon: 45.0375, population: '1.0M', note: 'Interim govt seat; STC influence' },
];

export const MAJOR_CITIES = [
  { id: 'hodeidah', name: 'Hodeidah', country: 'sideA', lat: 14.7980, lon: 42.9536, population: '600K', note: 'Red Sea port; Houthi-held; US/UK strikes' },
  { id: 'taiz', name: 'Taiz', country: 'contested', lat: 13.5789, lon: 44.0219, population: '615K', note: 'Besieged since 2015; divided' },
  { id: 'marib', name: 'Marib', country: 'sideB', lat: 15.4542, lon: 45.3269, population: '170K', note: 'Oil/gas region; govt-held' },
  { id: 'ibb', name: 'Ibb', country: 'sideA', lat: 13.9670, lon: 44.1830, population: '270K', note: 'Houthi-controlled' },
  { id: 'saada', name: 'Sa\'ada', country: 'sideA', lat: 16.9406, lon: 43.7614, population: '70K', note: 'Houthi heartland / stronghold' },
  { id: 'mukalla', name: 'Al Mukalla', country: 'sideB', lat: 14.5428, lon: 49.1269, population: '300K', note: 'Hadhramaut; govt-controlled' },
  { id: 'al-hudaydah', name: 'Ras Isa', country: 'sideA', lat: 15.1844, lon: 42.7511, population: '', note: 'Oil terminal; Houthi-controlled' },
];

// ─── Military infrastructure ───
export const MILITARY_INFRASTRUCTURE = [
  // Houthi
  { id: 'houthi-missile-sanaa', type: 'depot', side: 'sideA', name: 'Sanaa Missile Stores', lat: 15.35, lon: 44.20, note: 'Ballistic missile / drone storage' },
  { id: 'houthi-hodeidah-port', type: 'port', side: 'sideA', name: 'Hodeidah Port (mil.)', lat: 14.80, lon: 42.95, note: 'Key supply route; UN-monitored' },
  { id: 'houthi-saada-base', type: 'depot', side: 'sideA', name: 'Sa\'ada Military Complex', lat: 16.94, lon: 43.76, note: 'Houthi heartland base' },
  // Coalition / Govt
  { id: 'ab-anad', type: 'airbase', side: 'sideB', name: 'Al Anad Air Base', lat: 13.1750, lon: 44.7711, note: 'Former US drone base; govt-controlled' },
  { id: 'port-aden-naval', type: 'port', side: 'sideB', name: 'Aden Naval Base', lat: 12.80, lon: 45.04, note: 'Coalition naval operations' },
  { id: 'ab-marib', type: 'airbase', side: 'sideB', name: 'Marib Airfield', lat: 15.47, lon: 45.33, note: 'Coalition/govt operations' },
  // Red Sea targets (US/UK strikes)
  { id: 'strike-hodeidah', type: 'airdefense', side: 'sideA', name: 'Hodeidah AD Sites', lat: 14.85, lon: 42.98, note: 'US/UK strikes on Houthi radars and missiles' },
];

// ─── Troop positions ───
export const TROOP_POSITIONS = [
  { id: 'houthi-sanaa', side: 'sideA', unitType: 'infantry', unitSize: 'division', name: 'Ansar Allah Sanaa Force', lat: 15.37, lon: 44.19, sector: 'Sanaa' },
  { id: 'houthi-marib', side: 'sideA', unitType: 'infantry', unitSize: 'brigade', name: 'Houthi Marib Front', lat: 15.60, lon: 45.10, sector: 'Marib' },
  { id: 'houthi-hodeidah', side: 'sideA', unitType: 'infantry', unitSize: 'brigade', name: 'Houthi Coastal Force', lat: 14.80, lon: 43.00, sector: 'Hodeidah' },
  { id: 'houthi-taiz', side: 'sideA', unitType: 'infantry', unitSize: 'brigade', name: 'Houthi Taiz Siege Force', lat: 13.70, lon: 44.00, sector: 'Taiz' },
  { id: 'govt-marib', side: 'sideB', unitType: 'infantry', unitSize: 'division', name: 'Govt Marib Defense', lat: 15.45, lon: 45.33, sector: 'Marib' },
  { id: 'govt-taiz', side: 'sideB', unitType: 'infantry', unitSize: 'brigade', name: 'Govt Taiz Force', lat: 13.58, lon: 44.02, sector: 'Taiz' },
  { id: 'stc-aden', side: 'sideB', unitType: 'infantry', unitSize: 'division', name: 'STC / Security Belt', lat: 12.80, lon: 45.04, sector: 'Aden' },
  { id: 'giants-shabwa', side: 'sideB', unitType: 'mechanized', unitSize: 'brigade', name: 'Giants Brigades', lat: 14.50, lon: 46.50, sector: 'Shabwa' },
];

// ─── Battle sites ───
export const BATTLE_SITES = [
  {
    id: 'battle-marib', name: 'Battle of Marib', lat: 15.4542, lon: 45.3269,
    date: 'Feb 2021 – Dec 2021', result: 'Govt held',
    note: 'Houthi offensive repelled with heavy coalition air support',
    sideACommander: 'Ansar Allah Command', sideBCommander: 'Govt / Saudi coalition',
    sideATroops: '~30,000', sideBTroops: '~20,000 + air support',
    sideAEquipment: 'Infantry, ballistic missiles, drones', sideBEquipment: 'Coalition air power, armor',
    sideACasualties: '~10,000 killed/wounded (est.)', sideBCasualties: '~5,000 killed/wounded (est.)',
    significance: 'Marib\'s oil/gas resources make it strategically vital. Houthi failure to capture it preserved govt\'s main revenue source.',
  },
  {
    id: 'battle-red-sea', name: 'Red Sea / Bab al-Mandab Crisis', lat: 13.50, lon: 43.00,
    date: 'Nov 2023 – ongoing', result: 'Ongoing',
    note: 'Houthi attacks on international shipping; US/UK retaliatory strikes',
    sideACommander: 'Houthi Naval/Missile Forces', sideBCommander: 'US CENTCOM / UK Royal Navy',
    sideATroops: 'Missile and drone units', sideBTroops: 'USN carrier groups + coalition navies',
    sideAEquipment: 'Anti-ship ballistic missiles, UAVs, mines, USVs', sideBEquipment: 'Aircraft carriers, destroyers, Tomahawk missiles',
    sideACasualties: 'Targets struck; degraded but resilient; rebuild capability', sideBCasualties: '4+ commercial crew killed; MV Rubymar sunk (Mar 2024); 130+ ships damaged/attacked',
    significance: '130+ commercial vessels attacked (190+ total attacks) since Nov 2023. Global shipping rerouted via Cape of Good Hope adding 10-14 days. Suez Canal revenue dropped ~61%. Iran-backed proxy war dimension.',
  },
  {
    id: 'battle-hodeidah-strikes', name: 'US/UK Strikes on Hodeidah', lat: 14.7980, lon: 42.9536,
    date: 'Jan 2024 – ongoing', result: 'Ongoing',
    note: 'Operation Prosperity Guardian; US/UK airstrikes on Houthi targets',
    sideACommander: 'Houthi military leadership', sideBCommander: 'US CENTCOM',
    sideATroops: 'Air defense and missile crews', sideBTroops: 'US/UK air and naval forces',
    sideAEquipment: 'Air defense, missile launchers', sideBEquipment: 'F/A-18, Tomahawk, B-2 bombers',
    sideACasualties: '~100+ killed; infrastructure damaged', sideBCasualties: 'Minimal; 1 MQ-9 lost',
    significance: 'First direct US/UK military action against Houthis. Failed to stop attacks on shipping. Houthis claim attacks in solidarity with Gaza.',
  },
];

// ─── Casualties ───
export const CASUALTIES = {
  sideA: {
    killed: { low: 30000, high: 50000, label: '30,000–50,000 (est.)' },
    source: 'ACLED / OSINT',
  },
  sideB: {
    killed: { low: 20000, high: 30000, label: '20,000–30,000 (est.)' },
    source: 'ACLED / OSINT',
  },
  civilian: {
    killed: { low: 150000, high: 377000, label: '150,000–377,000 total conflict deaths' },
    note: 'UN estimated 377,000 total deaths (direct + indirect) by end of 2021. Famine and disease major factors.',
    source: 'UNDP / ACLED / OCHA',
  },
  asOf: 'February 2026',
};

// ─── Equipment ───
export const EQUIPMENT = {
  sideA: {
    assets: [
      { type: 'Ballistic Missiles', count: '~500+', note: 'Burkan, Toufan, Palestine series (Iranian-derived)' },
      { type: 'Cruise Missiles', count: '~100+', note: 'Quds series (similar to Iranian Ya Ali)' },
      { type: 'Anti-Ship Missiles', count: '~200+', note: 'C-802 variants, locally produced' },
      { type: 'UAVs / Drones', count: '~2,000+', note: 'Samad, Qasef series (Shahed-derived)' },
      { type: 'USVs (Explosive Boats)', count: '~50+', note: 'Remote-controlled explosive boats' },
      { type: 'MANPADS', count: '~200+', note: 'SA-7, SA-14 (captured/supplied)' },
    ],
    source: 'UN Panel of Experts / OSINT',
  },
  sideB: {
    assets: [
      { type: 'Coalition Aircraft', count: '~200 (Saudi/UAE/US)', note: 'F-15, Typhoon, F/A-18' },
      { type: 'Tanks (Govt)', count: '~100', note: 'M60, T-72 (limited)' },
      { type: 'MRAP/APCs', count: '~500', note: 'Various coalition-supplied' },
      { type: 'Patriot/THAAD', count: '~10 batteries', note: 'Saudi air defense' },
    ],
    source: 'IISS / SIPRI',
  },
  asOf: 'February 2026',
};

// ─── Command structure ───
export const COMMAND = {
  sideA: {
    title: 'Ansar Allah (Houthis)',
    commanderInChief: { name: 'Abdel-Malek al-Houthi', role: 'Supreme Leader', since: '2004' },
    keyCommanders: [
      { name: 'Abdel-Malek al-Houthi', role: 'Supreme Leader' },
      { name: 'Mahdi al-Mashat', role: 'President, Supreme Political Council' },
      { name: 'Abdel Khalek Badr al-Din al-Houthi', role: 'Military Commander' },
    ],
    totalPersonnel: '~150,000 (including tribal militias)',
  },
  sideB: {
    title: 'Internationally Recognized Government / Coalition',
    commanderInChief: { name: 'Rashad al-Alimi', role: 'Chairman, Presidential Leadership Council', since: 'Apr 2022' },
    keyCommanders: [
      { name: 'Rashad al-Alimi', role: 'Chairman, Presidential Council' },
      { name: 'Aidarus al-Zoubaidi', role: 'VP; STC leader' },
      { name: 'Sultan al-Arada', role: 'Marib governor / PLC member' },
    ],
    totalPersonnel: '~100,000 (govt + STC + tribal forces)',
  },
};

// ─── Timeline ───
export const WAR_TIMELINE = [
  { date: '2014-09-21', event: 'Houthis capture Sanaa from govt forces', phase: 'prewar' },
  { date: '2015-03-19', event: 'Saudi-led coalition begins air campaign (Operation Decisive Storm)', phase: 'war' },
  { date: '2016-10-08', event: 'US strikes Houthi radar sites after USS Mason attacked', phase: 'war' },
  { date: '2018-06-13', event: 'Battle of Hodeidah begins; UN brokers Stockholm Agreement', phase: 'war' },
  { date: '2019-09-14', event: 'Houthi drones/missiles strike Saudi Aramco Abqaiq facility', phase: 'escalation' },
  { date: '2022-04-02', event: 'UN-brokered truce begins; largely holds', phase: 'truce' },
  { date: '2022-10-02', event: 'Truce expires; not renewed but relative calm continues', phase: 'truce' },
  { date: '2023-10-19', event: 'Houthis launch missiles at Israel; declare solidarity with Gaza', phase: 'escalation' },
  { date: '2023-11-19', event: 'Houthis seize Galaxy Leader cargo ship in Red Sea', phase: 'red_sea' },
  { date: '2024-01-12', event: 'US/UK launch strikes on Houthi targets in Yemen', phase: 'red_sea' },
  { date: '2024-03-01', event: 'Global shipping diversions cost $100B+; Suez traffic drops 50%', phase: 'red_sea' },
  { date: '2024-03-02', event: 'MV Rubymar sinks in Red Sea — first commercial vessel sunk by Houthis', phase: 'red_sea' },
  { date: '2024-06-01', event: 'Houthis claim hypersonic missile capability (disputed by analysts; likely conventional ballistic)', phase: 'escalation' },
  { date: '2024-10-01', event: 'US deploys B-2 bombers against underground Houthi sites', phase: 'red_sea' },
  { date: '2025-01-19', event: 'Gaza ceasefire leads to temporary reduction in Houthi Red Sea attacks', phase: 'red_sea' },
  { date: '2025-03-01', event: 'Houthi attacks resume after Gaza ceasefire collapses; shipping disruption continues', phase: 'red_sea' },
  { date: '2025-06-01', event: 'US intensifies strikes on Houthi infrastructure; limited degradation of capability', phase: 'red_sea' },
  { date: '2025-09-01', event: 'Red Sea shipping rerouting becomes semi-permanent; insurance costs remain elevated 10x+', phase: 'red_sea' },
  { date: '2025-12-01', event: 'Internal Yemen peace talks stall; Saudi Arabia continues backchannel with Houthis', phase: 'stalemate' },
  { date: '2026-01-01', event: 'Houthis maintain operational capability; 130+ commercial vessels attacked since Nov 2023; Red Sea crisis enters 3rd year', phase: 'stalemate' },
];

// ─── Humanitarian ───
export const HUMANITARIAN = {
  refugees: {
    total: 4500000,
    label: '~4.5 million displaced',
    note: 'Mostly internal displacement; some to Djibouti, Somalia, Oman',
    source: 'OCHA / UNHCR',
  },
  internallyDisplaced: {
    total: 4500000,
    label: '~4.5 million internally displaced',
    source: 'OCHA',
  },
  hunger: {
    atRisk: 21000000,
    label: '~21 million need humanitarian assistance (2/3 of population)',
    famineRisk: '~5M in emergency food insecurity',
    source: 'WFP / IPC',
  },
  infrastructureDamage: {
    healthFacilities: '~50% non-functional',
    waterSystems: '~18M without clean water access',
    schools: '~2,500 damaged/destroyed',
    source: 'WHO / UNICEF / OCHA',
  },
  asOf: 'February 2026',
};

// ─── Territorial control ───
export const TERRITORIAL_CONTROL = {
  totalArea: 527968,
  houthiControlled: '~30% of territory but ~70-80% of population',
  govtControlled: '~50% of territory (south, east)',
  stcControlled: '~20% (southern governorates)',
  contested: 'Marib, Taiz frontlines',
  asOf: 'February 2026',
  source: 'ACLED / OSINT',
};

// ─── Coat of Arms ───
export const COAT_OF_ARMS = {
  sideA: { lat: 15.37, lon: 44.19, name: 'Houthis (Sanaa)' },
  sideB: { lat: 12.80, lon: 45.04, name: 'Govt (Aden)' },
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
