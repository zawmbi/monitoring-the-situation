/**
 * Sudan Civil War Data
 * SAF vs RSF conflict data — frontlines, troop deployments, casualties
 *
 * Data based on ACLED, OCHA, ISS Africa, and OSINT sources.
 * Positions approximate as of early 2026.
 */

// ─── Colors ───
export const SAF_GREEN = '#007229';
export const RSF_GOLD = '#d4a017';

// ─── Conflict summary ───
export const CONFLICT_SUMMARY = {
  id: 'sudan',
  name: 'Sudan Civil War',
  started: '15 April 2023',
  startDate: new Date(2023, 3, 15),
  daysSince: () => {
    const start = new Date(2023, 3, 15);
    const now = new Date();
    return Math.floor((now - start) / (1000 * 60 * 60 * 24));
  },
  phase: 'Full-scale civil war / SAF counteroffensives / Ethnic cleansing in Darfur / El Fasher siege',
  sideA: { name: 'Sudanese Armed Forces (SAF)', shortName: 'SAF', color: SAF_GREEN, flag: '\u{1F1F8}\u{1F1E9}' },
  sideB: { name: 'Rapid Support Forces (RSF)', shortName: 'RSF', color: RSF_GOLD, flag: '\u{1F1F8}\u{1F1E9}' },
  internationalSupport: {
    sideA: 'Egypt (military aid), Iran (drones — Mohajer-6), Turkey (TB2 drones), Eritrea (alleged)',
    sideB: 'UAE (documented arms transfers via Chad/Libya), Russia/Africa Corps (Wagner successor), Chad (transit route for weapons)',
  },
};

// ─── Frontline segments ───
export const FRONTLINE_SEGMENTS = [
  {
    id: 'khartoum-front',
    label: 'Greater Khartoum',
    asOf: '2026-02-01',
    status: 'active',
    points: [
      [32.40, 15.70], [32.45, 15.65], [32.50, 15.60], [32.55, 15.58],
      [32.58, 15.55], [32.60, 15.52], [32.62, 15.50], [32.65, 15.48],
      [32.60, 15.45], [32.55, 15.42], [32.50, 15.40],
    ],
  },
  {
    id: 'gezira-front',
    label: 'Al-Jazira / Gezira State',
    asOf: '2026-01-28',
    status: 'contested',
    points: [
      [32.50, 15.40], [32.60, 15.20], [32.80, 14.90], [33.00, 14.60],
      [33.10, 14.40], [33.20, 14.20], [33.40, 14.00],
    ],
  },
  {
    id: 'darfur-front',
    label: 'Darfur',
    asOf: '2026-01-20',
    status: 'active',
    points: [
      [25.00, 13.60], [25.20, 13.40], [25.40, 13.20], [25.60, 13.00],
      [25.80, 12.80], [26.00, 12.60], [26.20, 12.40], [26.40, 12.20],
    ],
  },
  {
    id: 'sennar-front',
    label: 'Sennar State',
    asOf: '2026-02-01',
    status: 'contested',
    points: [
      [33.40, 14.00], [33.50, 13.80], [33.60, 13.60], [33.80, 13.40],
      [34.00, 13.30], [34.20, 13.20],
    ],
  },
];

// ─── Occupied territory ───
export const OCCUPIED_TERRITORY = {
  type: 'Feature',
  properties: { side: 'sideB', label: 'RSF-controlled territory' },
  geometry: {
    type: 'Polygon',
    coordinates: [[
      // Darfur (most of it RSF-controlled)
      [22.00, 16.00], [24.00, 16.00], [26.00, 15.50], [27.00, 15.00],
      // Kordofan / Gezira corridor
      [29.00, 14.50], [31.00, 14.00], [32.50, 14.50], [32.55, 15.45],
      // Parts of Khartoum
      [32.50, 15.60], [32.30, 15.70], [31.50, 15.80],
      // West back through Kordofan
      [30.00, 15.50], [28.00, 15.80], [26.00, 16.00],
      // Southern Darfur
      [24.00, 12.00], [22.50, 12.00], [22.00, 13.00], [22.00, 16.00],
    ]],
  },
};

// ─── Capitals & cities ───
export const CAPITALS = [
  { id: 'khartoum', name: 'Khartoum', country: 'contested', lat: 15.5007, lon: 32.5599, population: '6M (metro)', note: 'Capital; contested — SAF holds parts' },
];

export const MAJOR_CITIES = [
  { id: 'omdurman', name: 'Omdurman', country: 'contested', lat: 15.6445, lon: 32.4776, population: '2.8M', note: 'Heavy fighting; largely RSF-controlled' },
  { id: 'khartoum-north', name: 'Khartoum North (Bahri)', country: 'contested', lat: 15.6361, lon: 32.5511, population: '1.5M', note: 'Contested between SAF and RSF' },
  { id: 'port-sudan', name: 'Port Sudan', country: 'sideA', lat: 19.6158, lon: 37.2164, population: '490K', note: 'De facto SAF capital / government seat' },
  { id: 'el-fasher', name: 'El Fasher', country: 'contested', lat: 13.6289, lon: 25.3494, population: '500K', note: 'Last SAF holdout in Darfur; under RSF siege' },
  { id: 'nyala', name: 'Nyala', country: 'sideB', lat: 12.0500, lon: 24.8833, population: '560K', note: 'RSF-controlled; ethnic cleansing reported' },
  { id: 'el-geneina', name: 'El Geneina', country: 'sideB', lat: 13.4522, lon: 22.4408, population: '220K', note: 'Masalit genocide site; largely destroyed' },
  { id: 'wad-medani', name: 'Wad Medani', country: 'sideB', lat: 14.4012, lon: 33.5199, population: '360K', note: 'Fell to RSF Dec 2023' },
  { id: 'kassala', name: 'Kassala', country: 'sideA', lat: 15.4536, lon: 36.3997, population: '400K', note: 'SAF-controlled eastern city' },
  { id: 'atbara', name: 'Atbara', country: 'sideA', lat: 17.7020, lon: 33.9720, population: '110K', note: 'SAF-controlled; Nile corridor' },
  { id: 'el-obeid', name: 'El Obeid', country: 'contested', lat: 13.1833, lon: 30.2167, population: '440K', note: 'North Kordofan; contested' },
  { id: 'gedaref', name: 'Gedaref', country: 'sideA', lat: 14.0333, lon: 35.3833, population: '350K', note: 'SAF-controlled; breadbasket region' },
  { id: 'zalingei', name: 'Zalingei', country: 'sideB', lat: 12.9067, lon: 23.4700, population: '100K', note: 'Central Darfur capital; RSF-controlled' },
];

// ─── Military infrastructure ───
export const MILITARY_INFRASTRUCTURE = [
  { id: 'ab-meroe', type: 'airbase', side: 'sideA', name: 'Meroe Airbase', lat: 18.4433, lon: 31.8333, note: 'SAF air operations hub' },
  { id: 'ab-wadi-sayidna', type: 'airbase', side: 'sideA', name: 'Wadi Sayidna AB', lat: 15.8333, lon: 32.5167, note: 'Near Khartoum; SAF fighter ops' },
  { id: 'ab-port-sudan', type: 'airbase', side: 'sideA', name: 'Port Sudan Airport (mil.)', lat: 19.5764, lon: 37.2192, note: 'SAF logistics hub' },
  { id: 'port-sudan-naval', type: 'port', side: 'sideA', name: 'Port Sudan Naval Base', lat: 19.6100, lon: 37.2300, note: 'Sudan Navy HQ; Red Sea access' },
  { id: 'depot-khartoum', type: 'depot', side: 'sideA', name: 'Khartoum Arsenal', lat: 15.5500, lon: 32.5800, note: 'SAF weapons depot (damaged)' },
  { id: 'rsf-depot-nyala', type: 'depot', side: 'sideB', name: 'RSF Nyala Base', lat: 12.0600, lon: 24.9000, note: 'RSF logistics in South Darfur' },
];

// ─── Troop positions ───
export const TROOP_POSITIONS = [
  // SAF
  { id: 'saf-khartoum', side: 'sideA', unitType: 'infantry', unitSize: 'division', name: 'SAF Khartoum Garrison', lat: 15.55, lon: 32.58, sector: 'Khartoum' },
  { id: 'saf-port-sudan', side: 'sideA', unitType: 'infantry', unitSize: 'division', name: 'SAF Eastern Command', lat: 19.62, lon: 37.22, sector: 'Port Sudan' },
  { id: 'saf-el-fasher', side: 'sideA', unitType: 'infantry', unitSize: 'brigade', name: 'SAF El Fasher Garrison', lat: 13.63, lon: 25.35, sector: 'El Fasher' },
  { id: 'saf-kassala', side: 'sideA', unitType: 'infantry', unitSize: 'brigade', name: 'SAF Eastern Brigade', lat: 15.45, lon: 36.40, sector: 'Kassala' },
  { id: 'saf-sennar', side: 'sideA', unitType: 'infantry', unitSize: 'brigade', name: 'SAF Sennar Front', lat: 13.50, lon: 33.60, sector: 'Sennar' },
  // RSF
  { id: 'rsf-khartoum', side: 'sideB', unitType: 'mechanized', unitSize: 'division', name: 'RSF Khartoum Force', lat: 15.65, lon: 32.48, sector: 'Khartoum' },
  { id: 'rsf-darfur', side: 'sideB', unitType: 'mechanized', unitSize: 'division', name: 'RSF Darfur Command', lat: 12.50, lon: 25.00, sector: 'Darfur' },
  { id: 'rsf-gezira', side: 'sideB', unitType: 'mechanized', unitSize: 'brigade', name: 'RSF Gezira Force', lat: 14.40, lon: 33.00, sector: 'Gezira' },
  { id: 'rsf-kordofan', side: 'sideB', unitType: 'infantry', unitSize: 'brigade', name: 'RSF Kordofan Force', lat: 13.50, lon: 30.00, sector: 'Kordofan' },
  { id: 'rsf-el-geneina', side: 'sideB', unitType: 'infantry', unitSize: 'brigade', name: 'RSF West Darfur', lat: 13.45, lon: 22.45, sector: 'West Darfur' },
];

// ─── Battle sites ───
export const BATTLE_SITES = [
  {
    id: 'battle-khartoum', name: 'Battle of Khartoum', lat: 15.5007, lon: 32.5599,
    date: 'Apr 2023 – ongoing', result: 'Contested',
    note: 'Urban warfare in the capital; massive civilian displacement',
    sideACommander: 'Gen. Abdel Fattah al-Burhan', sideBCommander: 'Gen. Mohamed Hamdan Dagalo (Hemedti)',
    sideATroops: '~40,000 SAF + allied militias', sideBTroops: '~30,000 RSF',
    sideAEquipment: 'Air force, armor, artillery', sideBEquipment: 'Technicals, AA guns, small arms',
    sideACasualties: 'Thousands killed/wounded', sideBCasualties: 'Thousands killed/wounded',
    significance: 'The capital has been the primary battleground since day one. SAF maintains parts of central Khartoum; RSF controls most residential areas.',
  },
  {
    id: 'battle-el-geneina', name: 'El Geneina Massacres', lat: 13.4522, lon: 22.4408,
    date: 'Apr – Nov 2023', result: 'RSF captured',
    note: 'Ethnic cleansing of Masalit people; UN investigators call it genocide',
    sideACommander: 'West Darfur Governor (killed)', sideBCommander: 'RSF / Arab militia commanders',
    sideATroops: 'Small SAF garrison + local defense', sideBTroops: 'RSF + allied Arab militias',
    sideAEquipment: 'Light weapons', sideBEquipment: 'Technicals, heavy weapons',
    sideACasualties: '10,000–15,000 Masalit civilians killed', sideBCasualties: 'Minimal',
    significance: 'Worst atrocity of the war. Systematic ethnic cleansing targeting Masalit and other non-Arab groups. ICC investigation opened.',
  },
  {
    id: 'battle-wad-medani', name: 'Fall of Wad Medani', lat: 14.4012, lon: 33.5199,
    date: 'Dec 2023', result: 'RSF captured',
    note: 'Major SAF loss; Gezira state capital fell rapidly',
    sideACommander: 'SAF Gezira Command', sideBCommander: 'RSF mobile forces',
    sideATroops: '~10,000 (poorly coordinated)', sideBTroops: '~15,000 RSF',
    sideAEquipment: 'Static defenses', sideBEquipment: 'Mobile technicals, rapid advance',
    sideACasualties: 'Hundreds killed/captured', sideBCasualties: 'Light',
    significance: 'Shocked Sudanese public. RSF captured major city rapidly. Opened path to Sennar and Blue Nile states.',
  },
  {
    id: 'battle-el-fasher', name: 'Siege of El Fasher', lat: 13.6289, lon: 25.3494,
    date: 'May 2024 – ongoing', result: 'Contested',
    note: 'Last SAF stronghold in Darfur; humanitarian catastrophe',
    sideACommander: 'SAF North Darfur + JEM/SLM allies', sideBCommander: 'RSF Darfur Command',
    sideATroops: '~15,000 (SAF + rebel allies)', sideBTroops: '~20,000 RSF',
    sideAEquipment: 'Air drops, limited armor', sideBEquipment: 'Technicals, siege weapons',
    sideACasualties: 'Heavy; 1M+ civilians trapped', sideBCasualties: 'Moderate',
    significance: 'Fall of El Fasher would give RSF complete control of Darfur. UN warns of potential genocide. International community focused on preventing fall.',
  },
  {
    id: 'battle-sennar', name: 'Battle of Sennar', lat: 13.5500, lon: 33.6000,
    date: 'Jun 2024 – ongoing', result: 'Contested',
    note: 'RSF push into Sennar state; SAF counteroffensives',
    sideACommander: 'SAF Southern Front', sideBCommander: 'RSF Gezira/Sennar Force',
    sideATroops: '~8,000', sideBTroops: '~12,000',
    sideAEquipment: 'Air power, artillery', sideBEquipment: 'Mobile forces, technicals',
    sideACasualties: 'Hundreds', sideBCasualties: 'Hundreds',
    significance: 'Strategic for control of agricultural heartland and routes to eastern Sudan.',
  },
];

// ─── Casualties ───
export const CASUALTIES = {
  sideA: {
    killed: { low: 8000, high: 12000, label: '8,000–12,000 (est.)' },
    wounded: { low: 20000, high: 30000, label: '20,000–30,000' },
    source: 'ACLED / OSINT (est.)',
  },
  sideB: {
    killed: { low: 10000, high: 15000, label: '10,000–15,000 (est.)' },
    wounded: { low: 25000, high: 35000, label: '25,000–35,000' },
    source: 'ACLED / OSINT (est.)',
  },
  civilian: {
    killed: { low: 30000, high: 150000, label: '30,000–150,000+' },
    note: 'ACLED reports ~30K+ verified conflict deaths; MSF/LSE/ACLED excess mortality studies suggest 100K-150K+ total deaths including disease and famine. True toll likely far higher due to reporting gaps in RSF-controlled areas.',
    source: 'ACLED / MSF / OCHA / Lancet',
  },
  asOf: 'February 2026',
};

// ─── Equipment ───
export const EQUIPMENT = {
  sideA: {
    assets: [
      { type: 'Fighter Aircraft', count: '~40', note: 'MiG-29, Su-25 (primary advantage over RSF)' },
      { type: 'Attack Helicopters', count: '~20', note: 'Mi-24/35' },
      { type: 'Tanks', count: '~200', note: 'T-72, T-55 (many inoperable)' },
      { type: 'Artillery', count: '~150', note: 'Various calibers' },
      { type: 'UAVs', count: '~20', note: 'Iranian-supplied Mohajer (alleged)' },
    ],
    source: 'IISS / OSINT',
  },
  sideB: {
    assets: [
      { type: 'Technicals', count: '~2,000+', note: 'Armed pickup trucks — primary platform' },
      { type: 'APCs', count: '~100', note: 'Captured SAF vehicles' },
      { type: 'Anti-aircraft guns', count: '~200', note: 'ZU-23-2, mounted on technicals' },
      { type: 'MANPADS', count: '~50', note: 'Igla, Stinger (captured/supplied)' },
      { type: 'UAVs', count: '~30', note: 'UAE-supplied (alleged)' },
    ],
    source: 'IISS / OSINT / UN Panel of Experts',
  },
  asOf: 'February 2026',
};

// ─── Command structure ───
export const COMMAND = {
  sideA: {
    title: 'Sudanese Armed Forces (SAF)',
    commanderInChief: { name: 'Abdel Fattah al-Burhan', role: 'Chairman, Sovereignty Council / Commander-in-Chief', since: 'Oct 2021' },
    keyCommanders: [
      { name: 'Abdel Fattah al-Burhan', role: 'Chairman, Sovereignty Council' },
      { name: 'Shams al-Din Khabbashi', role: 'Deputy Chairman, Sovereignty Council' },
      { name: 'Yasser al-Atta', role: 'SAF Assistant Commander-in-Chief' },
      { name: 'Ibrahim Jabir', role: 'Chief of Joint Staff' },
    ],
    totalPersonnel: '~100,000 (pre-war; degraded)',
  },
  sideB: {
    title: 'Rapid Support Forces (RSF)',
    commanderInChief: { name: 'Mohamed Hamdan Dagalo "Hemedti"', role: 'RSF Commander', since: '2013' },
    keyCommanders: [
      { name: 'Mohamed Hamdan Dagalo (Hemedti)', role: 'RSF Commander-in-Chief' },
      { name: 'Abdelrahim Dagalo', role: 'RSF Deputy Commander (brother)' },
      { name: 'Algoney Hamdan Dagalo', role: 'RSF Field Commander (brother)' },
    ],
    totalPersonnel: '~100,000 (including recruited militias)',
  },
};

// ─── Timeline ───
export const WAR_TIMELINE = [
  { date: '2023-04-15', event: 'Fighting erupts in Khartoum between SAF and RSF', phase: 'outbreak' },
  { date: '2023-04-20', event: 'Embassies evacuated; international staff withdrawn', phase: 'outbreak' },
  { date: '2023-06-01', event: 'RSF seizes control of most of West Darfur', phase: 'expansion' },
  { date: '2023-06-15', event: 'El Geneina massacres — systematic killing of Masalit people', phase: 'atrocity' },
  { date: '2023-09-01', event: 'Nyala falls to RSF; South Darfur under RSF control', phase: 'expansion' },
  { date: '2023-11-01', event: 'RSF controls most of Darfur; ethnic cleansing widespread', phase: 'expansion' },
  { date: '2023-12-19', event: 'Wad Medani falls to RSF; major SAF defeat', phase: 'expansion' },
  { date: '2024-02-01', event: 'SAF counteroffensive in Omdurman; regains some ground', phase: 'counteroffensive' },
  { date: '2024-05-10', event: 'RSF begins siege of El Fasher — last SAF hold in Darfur', phase: 'siege' },
  { date: '2024-06-01', event: 'RSF pushes into Sennar state', phase: 'expansion' },
  { date: '2024-09-01', event: 'UN reports 10M+ displaced; world\'s worst displacement crisis', phase: 'humanitarian' },
  { date: '2024-12-01', event: 'Famine declared in parts of Darfur and Kordofan', phase: 'humanitarian' },
  { date: '2025-01-01', event: 'SAF recaptures large parts of Khartoum using drone warfare (Iranian Mohajer-6, Turkish TB2)', phase: 'counteroffensive' },
  { date: '2025-03-01', event: 'SAF pushes RSF out of most of central Khartoum; Omdurman fighting continues', phase: 'counteroffensive' },
  { date: '2025-05-01', event: 'El Fasher siege at critical point; mass starvation reported; UN calls it potential genocide', phase: 'siege' },
  { date: '2025-06-01', event: 'ICC investigation into Darfur atrocities expanded; new warrants sought', phase: 'legal' },
  { date: '2025-09-01', event: 'SAF launches offensive toward Gezira state with drone and artillery support', phase: 'counteroffensive' },
  { date: '2025-11-01', event: 'Famine declared in 5+ regions; 26M+ in acute food crisis (IPC Phase 3+)', phase: 'humanitarian' },
  { date: '2025-12-01', event: 'SAF advances in Khartoum area but stalls in Gezira; RSF retains Darfur control', phase: 'counteroffensive' },
  { date: '2026-01-15', event: 'Jeddah/Switzerland ceasefire talks collapse again; both sides recruit heavily; war of attrition continues', phase: 'diplomatic' },
];

// ─── Humanitarian ───
export const HUMANITARIAN = {
  refugees: {
    total: 3200000,
    label: '~3.2 million refugees',
    topCountries: [
      { country: 'Chad', count: 1100000 },
      { country: 'South Sudan', count: 800000 },
      { country: 'Egypt', count: 500000 },
      { country: 'Ethiopia', count: 350000 },
      { country: 'Central African Republic', count: 250000 },
    ],
    source: 'UNHCR (Jan 2026)',
  },
  internallyDisplaced: {
    total: 10800000,
    label: '~10.8 million internally displaced',
    note: 'World\'s largest displacement crisis',
    source: 'OCHA / IOM',
  },
  famine: {
    atRisk: 25000000,
    label: '~25 million facing acute hunger',
    famineAreas: 'Parts of Darfur, Kordofan, Khartoum declared famine (IPC Phase 5)',
    source: 'WFP / IPC',
  },
  infrastructureDamage: {
    healthFacilities: '70-80% non-functional',
    schools: '~10,000 closed',
    waterSystems: '~50% damaged or non-functional',
    source: 'WHO / UNICEF / OCHA',
  },
  asOf: 'February 2026',
};

// ─── Coat of Arms ───
export const COAT_OF_ARMS = {
  sideA: { lat: 19.62, lon: 37.22, name: 'SAF (Port Sudan)' },
  sideB: { lat: 12.50, lon: 25.00, name: 'RSF (Darfur)' },
};

// ─── Fortification lines ───
export const FORTIFICATION_LINES = [];

// ─── Territorial control ───
export const TERRITORIAL_CONTROL = {
  totalArea: 1886068,
  safControlled: 'Eastern Sudan, parts of Khartoum, northern corridor',
  rsfControlled: 'Most of Darfur, Kordofan, Gezira, parts of Khartoum',
  contested: 'Khartoum, El Fasher, Sennar',
  asOf: 'February 2026',
  source: 'ACLED / ISS Africa',
};

// ─── Recency color coding ───
export function getFrontlineColor(asOf) {
  const days = Math.floor((Date.now() - new Date(asOf).getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 7) return '#ff3333';
  if (days <= 14) return '#ff6633';
  if (days <= 30) return '#ff9933';
  if (days <= 60) return '#ffcc33';
  return '#999999';
}
