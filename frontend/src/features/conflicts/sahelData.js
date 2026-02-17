/**
 * Sahel Region Conflict Data
 * Mali, Burkina Faso, Niger — jihadist insurgency and state collapse
 * Based on publicly available OSINT, ACLED, and media sources.
 */

// Colors
export const JNIM_BLACK = '#1a1a1a';
export const SAHEL_GOLD = '#d4a843';
export const FRANCE_BLUE = '#002395';
export const WAGNER_RED = '#8b0000';

export const CONFLICT_SUMMARY = {
  id: 'sahel',
  name: 'Sahel Insurgency',
  started: '17 January 2012',
  startDate: new Date(2012, 0, 17),
  daysSince: () => {
    const start = new Date(2012, 0, 17);
    const now = new Date();
    return Math.floor((now - start) / (1000 * 60 * 60 * 24));
  },
  phase: 'Escalating jihadist expansion / State collapse in Mali / ECOWAS exit',
  sideA: {
    name: 'Sahel Alliance States', shortName: 'AES', color: SAHEL_GOLD, flag: '🇲🇱',
    leader: 'Col. Assimi Goïta (Mali) / Capt. Ibrahim Traoré (BF) / Gen. Tchiani (Niger)',
    description: 'Alliance of Sahel States (AES) formed after military coups. Left ECOWAS Jan 2025. French troops expelled; Russian Wagner/Africa Corps mercenaries deployed. Control shrinking — Burkina Faso holds less than half its territory.',
    goals: 'Regime survival, counter-insurgency, sovereignty from Western influence',
  },
  sideB: {
    name: 'JNIM / ISGS', shortName: 'JNIM', color: JNIM_BLACK, flag: '⚫',
    leader: 'Iyad Ag Ghaly (JNIM) / Abu Huzeifa (ISGS)',
    description: 'JNIM (Jamaat Nusrat al-Islam wal-Muslimin) — al-Qaeda affiliate; largest jihadist force. ISGS (Islamic State in the Greater Sahara) — ISIS affiliate. Together account for 51% of worldwide terrorism deaths. JNIM blockaded Bamako in Sep 2025.',
    goals: 'Islamic governance, territorial control, expulsion of foreign forces',
  },
  background: 'The Sahel insurgency began with the 2012 Tuareg rebellion in Mali. Jihadist groups exploited instability to seize vast territory. Despite French intervention (2013-2022), the crisis deepened. Military coups in Mali (2020/2021), Burkina Faso (2022), and Niger (2023) expelled Western forces and turned to Russia. The Alliance of Sahel States left ECOWAS in Jan 2025. The Sahel now accounts for 51% of global terrorism deaths — up from 1% seventeen years ago.',
  internationalSupport: {
    sideA: 'Russia/Wagner (military advisors), China (economic), Turkey, Iran',
    sideB: 'None officially; diaspora funding, cross-border networks',
  },
};

export const CONTROL_ZONES = [
  {
    id: 'bamako-siege',
    name: 'Bamako Siege Zone',
    side: 'contested',
    type: 'blockade',
    note: 'JNIM economic blockade of Mali capital since Sep 2025',
    polygon: [
      [-8.20, 12.80], [-7.80, 12.80], [-7.80, 12.50], [-8.20, 12.50], [-8.20, 12.80],
    ],
  },
  {
    id: 'liptako-gourma',
    name: 'Liptako-Gourma (Tri-Border)',
    side: 'sideB',
    type: 'insurgent-controlled',
    note: 'JNIM/ISGS stronghold at Mali-Burkina Faso-Niger border junction',
    polygon: [
      [-1.0, 15.0], [0.5, 15.0], [0.5, 13.5], [-1.0, 13.5], [-1.0, 15.0],
    ],
  },
  {
    id: 'northern-mali',
    name: 'Northern Mali (Kidal)',
    side: 'sideB',
    type: 'insurgent-controlled',
    note: 'Largely outside government control; various armed groups',
    polygon: [
      [-3.0, 20.0], [1.0, 20.0], [1.0, 17.0], [-3.0, 17.0], [-3.0, 20.0],
    ],
  },
];

export const FRONTLINE_SEGMENTS = [];

export const TROOP_DEPLOYMENTS = [
  {
    id: 'mali-fama',
    side: 'sideA',
    label: 'Mali Armed Forces (FAMa)',
    type: 'ground',
    strength: '~35,000 troops',
    lat: 12.63, lon: -8.00,
    note: 'Concentrated around Bamako; limited presence in north/center',
  },
  {
    id: 'wagner-mali',
    side: 'sideA',
    label: 'Russia Africa Corps (ex-Wagner)',
    type: 'ground',
    strength: '~1,500 personnel',
    lat: 14.50, lon: -4.20,
    note: 'Deployed in central Mali; accused of civilian massacres',
  },
  {
    id: 'bf-army',
    side: 'sideA',
    label: 'Burkina Faso Armed Forces',
    type: 'ground',
    strength: '~12,000 active + VDP militia',
    lat: 12.37, lon: -1.52,
    note: 'Controls <50% of national territory; relies on volunteer militia (VDP)',
  },
  {
    id: 'jnim-main',
    side: 'sideB',
    label: 'JNIM Forces',
    type: 'insurgent',
    strength: '~10,000+ fighters',
    lat: 14.00, lon: -1.00,
    note: 'Largest jihadist force; controls roads, imposes taxes, administers territory',
  },
  {
    id: 'isgs-forces',
    side: 'sideB',
    label: 'ISGS Forces',
    type: 'insurgent',
    strength: '~3,000-5,000 fighters',
    lat: 14.50, lon: 1.50,
    note: 'ISIS affiliate operating in Liptako-Gourma tri-border area',
  },
];

export const CASUALTIES = {
  sideA: {
    killed: { low: 7000, high: 10000, label: '8,000\u201310,000 military/security forces killed (est.)' },
    source: 'ACLED / media',
  },
  sideB: {
    killed: { low: 12000, high: 18000, label: '12,000\u201318,000 insurgent fighters killed (est.)' },
    source: 'ACLED / media',
  },
  civilian: {
    killed: { low: 20000, high: 30000, label: '~25,000 civilian deaths since 2012' },
    note: 'Sahel accounts for 51% of global terrorism deaths (Global Terrorism Index 2025). Civilians targeted by both jihadists and state security forces/Wagner.',
    source: 'ACLED / Global Terrorism Index 2025',
  },
  overall: {
    killed: { low: 40000, high: 60000, label: '~50,000+ total conflict deaths since 2012' },
    note: 'Includes military, insurgent, and civilian casualties across Mali, Burkina Faso, and Niger.',
  },
  asOf: 'February 2026',
};

export const EQUIPMENT = {
  sideA: {
    deployed: [
      { type: 'Mi-24/35 Hind', count: '~12', note: 'Russian-supplied attack helicopters' },
      { type: 'L-39 Albatros', count: '~6', note: 'Czech light attack aircraft' },
      { type: 'TB2 Bayraktar', count: '~4', note: 'Turkish armed drone (Burkina Faso)' },
      { type: 'BTR-80 APC', count: '~50', note: 'Russian-supplied armored personnel carriers' },
    ],
    source: 'IISS / OSINT / media',
  },
  sideB: {
    deployed: [
      { type: 'IEDs', count: 'Primary weapon', note: 'Leading cause of military casualties' },
      { type: 'Toyota technicals', count: 'Hundreds', note: 'Armed pickup trucks \u2014 primary mobility' },
      { type: 'AK-47 / PKM', count: 'Thousands', note: 'Small arms looted from military stockpiles' },
      { type: 'Commercial drones', count: 'Increasing', note: 'Used for reconnaissance and coordination' },
    ],
    source: 'ACLED / OSINT / media',
  },
  asOf: 'February 2026',
};

export const COMMAND = {
  sideA: {
    title: 'Alliance of Sahel States (AES) / Africa Corps',
    keyCommanders: [
      { name: 'Col. Assimi Go\u00EFta', role: 'Mali Transition Leader' },
      { name: 'Capt. Ibrahim Traor\u00E9', role: 'Burkina Faso Leader' },
      { name: 'Gen. Abdourahamane Tchiani', role: 'Niger Leader' },
      { name: 'AES Joint Command', role: 'Alliance Joint Force Commander' },
      { name: 'Russian military advisors', role: 'Africa Corps Command (ex-Wagner)' },
    ],
    totalPersonnel: '~50,000 combined (Mali ~35,000 + BF ~12,000 + Niger ~10,000) + ~1,500 Russian Africa Corps',
  },
  sideB: {
    title: 'JNIM (al-Qaeda) / ISGS (ISIS)',
    keyCommanders: [
      { name: 'Iyad Ag Ghaly', role: 'JNIM Emir (al-Qaeda affiliate)' },
      { name: 'Amadou Koufa', role: 'Katiba Macina Commander' },
      { name: 'Abu Huzeifa al-Ansari', role: 'ISGS Leader (ISIS affiliate)' },
      { name: 'Various local commanders', role: 'Ansaroul Islam / local cells' },
    ],
    totalPersonnel: '~15,000+ combined (JNIM ~10,000 + ISGS ~3,000-5,000)',
  },
};

export const WAR_TIMELINE = [
  { date: '2025-01-29', event: 'Mali, Burkina Faso, Niger formally exit ECOWAS', phase: 'political', severity: 4 },
  { date: '2025-03-15', event: 'JNIM overruns 3 military bases in central Mali in 48 hours', phase: 'war', severity: 4 },
  { date: '2025-06-20', event: 'Wagner/Africa Corps accused of massacre of 200+ civilians in Moura', phase: 'crackdown', severity: 5 },
  { date: '2025-09-01', event: 'JNIM imposes economic blockade around Bamako; supply routes cut', phase: 'siege', severity: 5 },
  { date: '2025-10-12', event: 'JNIM carries out first attack inside Nigeria (Sokoto state)', phase: 'escalation', severity: 4 },
  { date: '2025-11-15', event: 'Burkina Faso government admits controlling less than 50% of territory', phase: 'war', severity: 4 },
  { date: '2026-01-15', event: 'US begins diplomatic re-engagement with Sahel military juntas', phase: 'diplomatic', severity: 3 },
  { date: '2026-02-01', event: 'Global Terrorism Index 2025: Sahel accounts for 51% of worldwide terrorism deaths', phase: 'escalation', severity: 3 },
];

export const HUMANITARIAN = {
  internallyDisplaced: {
    total: 4200000,
    label: '4.2 million internally displaced persons',
    note: 'Across Mali, Burkina Faso, and Niger; one of the world\'s fastest-growing displacement crises',
    source: 'UNHCR 2025',
  },
  hunger: {
    label: '~12 million facing acute food insecurity across the Sahel',
    famineRisk: 'JNIM blockade of Bamako since Sep 2025 creating severe supply shortages in Mali capital',
    source: 'WFP / IPC 2025',
  },
  infrastructureDamage: {
    schoolsClosed: '~8,000 schools closed due to insecurity',
    healthFacilities: '~1,500 health facilities non-functional',
    economicImpact: 'Tourism collapsed, trade routes disrupted by jihadist checkpoints and taxation',
    source: 'UNICEF / WHO / World Bank',
  },
  asOf: 'February 2026',
};

export const TERRITORIAL_CONTROL = {
  maliControl: 'Government controls Bamako and some southern towns; JNIM controls most of center/north; Bamako under economic blockade since Sep 2025',
  burkinaFasoControl: 'Government admits controlling less than 50% of national territory (Nov 2025)',
  nigerControl: 'Government retains most urban centers; rural areas increasingly contested',
  jihadistExpansion: 'JNIM/ISGS expanding into coastal West Africa; first attack in Nigeria (Oct 2025)',
  terrorismShare: 'Sahel accounts for 51% of worldwide terrorism deaths (up from 1% seventeen years ago)',
  asOf: 'February 2026',
  source: 'ACLED / Global Terrorism Index 2025 / ICG',
};

export const BATTLE_SITES = [
  {
    id: 'bamako-blockade',
    name: 'Bamako Economic Blockade',
    lat: 12.63, lon: -8.00,
    date: '1 Sep 2025',
    result: 'Ongoing / JNIM advantage',
    note: 'JNIM imposed economic blockade around Mali capital, cutting supply routes',
    sideACommander: 'FAMa / Africa Corps',
    sideBCommander: 'JNIM forces',
    sideATroops: '~10,000 garrison',
    sideBTroops: '~3,000 encircling',
    sideAEquipment: 'Armored vehicles, helicopters',
    sideBEquipment: 'IEDs, small arms, road checkpoints',
    sideACasualties: 'Ongoing attrition',
    sideBCasualties: 'Unknown',
    significance: 'Unprecedented siege of a national capital; JNIM demonstrating ability to threaten state survival',
  },
  {
    id: 'central-mali-bases',
    name: 'Central Mali Base Overruns',
    lat: 14.50, lon: -4.20,
    date: '15 Mar 2025',
    result: 'JNIM victory',
    note: 'JNIM overran 3 military bases in central Mali within 48 hours',
    sideACommander: 'FAMa local commands',
    sideBCommander: 'JNIM field commanders',
    sideATroops: 'Garrison forces (~300 total)',
    sideBTroops: '~500+ fighters',
    sideAEquipment: 'Light weapons, fortifications',
    sideBEquipment: 'Technicals, IEDs, small arms',
    sideACasualties: '~80 killed, equipment captured',
    sideBCasualties: '~30 killed',
    significance: 'Demonstrated JNIM ability to overwhelm state forces in coordinated multi-site attacks',
  },
  {
    id: 'moura-massacre',
    name: 'Moura Massacre (Wagner)',
    lat: 14.07, lon: -5.34,
    date: '20 Jun 2025',
    result: 'Civilian massacre',
    note: 'Wagner/Africa Corps accused of massacre of 200+ civilians during anti-insurgent operation',
    sideACommander: 'Africa Corps / FAMa',
    sideBCommander: 'N/A (civilian victims)',
    sideATroops: 'Africa Corps + FAMa units',
    sideBTroops: 'Civilian population',
    sideAEquipment: 'Small arms, vehicles',
    sideBEquipment: 'N/A',
    sideACasualties: 'None reported',
    sideBCasualties: '200+ civilians killed',
    significance: 'International outrage; highlighted Wagner atrocities and state complicity',
  },
  {
    id: 'nigeria-incursion',
    name: 'JNIM Nigeria Incursion',
    lat: 13.06, lon: 5.24,
    date: '12 Oct 2025',
    result: 'JNIM expansion',
    note: 'JNIM carried out first attack inside Nigeria (Sokoto state), signaling expansion beyond Sahel',
    sideACommander: 'Nigerian security forces',
    sideBCommander: 'JNIM external operations',
    sideATroops: 'Local police / military',
    sideBTroops: 'JNIM cell',
    sideAEquipment: 'Standard military',
    sideBEquipment: 'IEDs, small arms',
    sideACasualties: '~15 killed',
    sideBCasualties: 'Several killed',
    significance: 'First JNIM attack in Nigeria; Sahel insurgency expanding to coastal West Africa',
  },
];

export const INTERNATIONAL_RESPONSE = {
  ecowasExit: 'Mali, Burkina Faso, Niger formally exited ECOWAS (Jan 2025); formed Alliance of Sahel States',
  frenchExpulsion: 'French military forces fully withdrawn from all three countries by 2023',
  wagnerPresence: 'Russian Africa Corps (ex-Wagner) deployed ~1,500 personnel; accused of civilian massacres',
  usReengagement: 'US began diplomatic re-engagement with Sahel military juntas (Jan 2026)',
  chinaRole: 'China expanding economic partnerships with AES states',
  unResponse: 'UN peacekeeping mission (MINUSMA) withdrew from Mali in Dec 2023',
  asOf: 'February 2026',
};
