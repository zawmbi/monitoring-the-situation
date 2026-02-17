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
    killed: { total: 8500, label: 'Military/security forces killed (est.)', source: 'ACLED / media' },
  },
  sideB: {
    killed: { total: 15000, label: 'Insurgent fighters killed (est.)', source: 'ACLED / media' },
  },
  civilian: {
    killed: { total: 25000, label: 'Civilian deaths since 2012', source: 'ACLED data' },
    displaced: { total: 4200000, label: 'Internally displaced persons', source: 'UNHCR 2025' },
    terrorismShare: { pct: 51, label: '% of global terrorism deaths from Sahel', source: 'Global Terrorism Index 2025' },
  },
};

export const EQUIPMENT = {
  sideA: [
    { name: 'Mi-24/35 Hind', type: 'helicopter', count: '~12', note: 'Russian-supplied attack helicopters' },
    { name: 'L-39 Albatros', type: 'aircraft', count: '~6', note: 'Czech light attack aircraft' },
    { name: 'TB2 Bayraktar', type: 'drone', count: '~4', note: 'Turkish armed drone (Burkina Faso)' },
    { name: 'BTR-80', type: 'apc', count: '~50', note: 'Russian-supplied APC' },
  ],
  sideB: [
    { name: 'IEDs', type: 'explosive', count: 'Primary weapon', note: 'Leading cause of military casualties' },
    { name: 'Toyota technicals', type: 'vehicle', count: 'Hundreds', note: 'Armed pickup trucks' },
    { name: 'AK-47/PKM', type: 'small-arms', count: 'Thousands', note: 'Looted from military stockpiles' },
    { name: 'Commercial drones', type: 'drone', count: 'Increasing', note: 'Used for reconnaissance' },
  ],
};

export const COMMAND_STRUCTURE = {
  sideA: [
    { role: 'Mali Transition Leader', name: 'Col. Assimi Goïta', since: '2021' },
    { role: 'Burkina Faso Leader', name: 'Capt. Ibrahim Traoré', since: '2022' },
    { role: 'Niger Leader', name: 'Gen. Abdourahamane Tchiani', since: '2023' },
    { role: 'AES Joint Force Cmd.', name: 'Joint command established', since: '2024' },
    { role: 'Africa Corps Cmd.', name: 'Russian military advisors', since: '2022' },
  ],
  sideB: [
    { role: 'JNIM Emir', name: 'Iyad Ag Ghaly', since: '2017' },
    { role: 'Katiba Macina', name: 'Amadou Koufa', since: '2015' },
    { role: 'ISGS Leader', name: 'Abu Huzeifa al-Ansari', since: '2023' },
    { role: 'Ansaroul Islam', name: 'Various local commanders', since: '2016' },
  ],
};

export const KEY_EVENTS = [
  { date: '2025-01-29', event: 'Mali, Burkina Faso, Niger formally exit ECOWAS', severity: 4 },
  { date: '2025-03-15', event: 'JNIM overruns 3 military bases in central Mali in 48 hours', severity: 4 },
  { date: '2025-06-20', event: 'Wagner/Africa Corps accused of massacre of 200+ civilians in Moura', severity: 5 },
  { date: '2025-09-01', event: 'JNIM imposes economic blockade around Bamako; supply routes cut', severity: 5 },
  { date: '2025-10-12', event: 'JNIM carries out first attack inside Nigeria (Sokoto state)', severity: 4 },
  { date: '2025-11-15', event: 'Burkina Faso government admits controlling less than 50% of territory', severity: 4 },
  { date: '2026-01-15', event: 'US begins diplomatic re-engagement with Sahel military juntas', severity: 3 },
  { date: '2026-02-01', event: 'Global Terrorism Index 2025: Sahel accounts for 51% of worldwide terrorism deaths', severity: 3 },
];
