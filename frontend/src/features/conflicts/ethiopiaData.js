/**
 * Ethiopia Conflict Data
 * Post-Tigray War and ongoing regional conflicts
 *
 * Data based on ACLED, ICG, and OSINT sources.
 * The Tigray ceasefire (Nov 2022) largely holds but Amhara/Oromia conflicts continue.
 */

// ─── Colors ───
export const GOVT_GREEN = '#009933';
export const FANO_RED = '#b22222';
export const OLA_YELLOW = '#ffc300';
export const TPLF_GOLD = '#d4a017';

// ─── Conflict summary ───
export const CONFLICT_SUMMARY = {
  id: 'ethiopia',
  name: 'Ethiopia Internal Conflicts',
  started: '4 November 2020',
  startDate: new Date(2020, 10, 4),
  daysSince: () => {
    const start = new Date(2020, 10, 4);
    const now = new Date();
    return Math.floor((now - start) / (1000 * 60 * 60 * 24));
  },
  phase: 'Post-Tigray ceasefire / Amhara & Oromia insurgencies',
  sideA: { name: 'Ethiopian Federal Govt (ENDF)', shortName: 'ENDF', color: GOVT_GREEN, flag: '\u{1F1EA}\u{1F1F9}' },
  sideB: { name: 'Fano / OLA / TPLF (various)', shortName: 'Armed Groups', color: FANO_RED, flag: '\u{1F1EA}\u{1F1F9}' },
  internationalSupport: {
    sideA: 'UAE (drones), Eritrea (Tigray war), Turkey, Iran, China',
    sideB: 'Limited; diaspora funding',
  },
};

// ─── Frontline segments ───
// Removed: civil/internal conflicts have no meaningful continuous frontlines.
// Battle markers (BATTLE_SITES) show active areas of fighting instead.
export const FRONTLINE_SEGMENTS = [];

// ─── Occupied territory ───
export const OCCUPIED_TERRITORY = {
  type: 'Feature',
  properties: { side: 'sideB', label: 'Areas with significant armed group activity' },
  geometry: {
    type: 'Polygon',
    coordinates: [[
      // Amhara insurgency areas
      [37.00, 13.00], [39.50, 13.00], [40.00, 11.50], [39.50, 10.50],
      [38.50, 10.00], [37.50, 10.50], [37.00, 11.50], [37.00, 13.00],
    ]],
  },
};

// ─── Capitals & cities ───
export const CAPITALS = [
  { id: 'addis-ababa', name: 'Addis Ababa', country: 'sideA', lat: 9.0222, lon: 38.7469, population: '5.5M', note: 'Federal capital' },
];

export const MAJOR_CITIES = [
  { id: 'mekelle', name: 'Mekelle', country: 'sideA', lat: 13.4967, lon: 39.4753, population: '500K', note: 'Tigray capital; TPLF agreed to ceasefire Nov 2022' },
  { id: 'bahir-dar', name: 'Bahir Dar', country: 'contested', lat: 11.5936, lon: 37.3908, population: '350K', note: 'Amhara capital; Fano activity nearby' },
  { id: 'gondar', name: 'Gondar', country: 'contested', lat: 12.6030, lon: 37.4521, population: '350K', note: 'Amhara; Fano stronghold area' },
  { id: 'dessie', name: 'Dessie', country: 'contested', lat: 11.1333, lon: 39.6333, population: '200K', note: 'Amhara; contested' },
  { id: 'lalibela', name: 'Lalibela', country: 'contested', lat: 12.0319, lon: 39.0475, population: '25K', note: 'UNESCO site; affected by conflict' },
  { id: 'jimma', name: 'Jimma', country: 'contested', lat: 7.6667, lon: 36.8333, population: '200K', note: 'Oromia; OLA presence' },
  { id: 'nekemte', name: 'Nekemte', country: 'contested', lat: 9.0833, lon: 36.5333, population: '120K', note: 'Western Oromia; OLA activity' },
  { id: 'harar', name: 'Harar', country: 'sideA', lat: 9.3100, lon: 42.1197, population: '130K', note: 'Eastern Ethiopia; relatively stable' },
  { id: 'dire-dawa', name: 'Dire Dawa', country: 'sideA', lat: 9.5931, lon: 41.8500, population: '500K', note: 'Major eastern city; stable' },
  { id: 'adama', name: 'Adama', country: 'sideA', lat: 8.5400, lon: 39.2700, population: '340K', note: 'Oromia industrial city' },
];

// ─── Military infrastructure ───
export const MILITARY_INFRASTRUCTURE = [
  { id: 'ab-debre-zeit', type: 'airbase', side: 'sideA', name: 'Debre Zeit Air Base', lat: 8.7178, lon: 38.9528, note: 'Main Ethiopian Air Force base' },
  { id: 'ab-harar', type: 'airbase', side: 'sideA', name: 'Harar/Dire Dawa AB', lat: 9.6000, lon: 41.8500, note: 'Eastern air operations' },
  { id: 'depot-addis', type: 'depot', side: 'sideA', name: 'Addis Ababa Military HQ', lat: 9.02, lon: 38.75, note: 'ENDF headquarters' },
  { id: 'depot-bahir-dar', type: 'depot', side: 'sideA', name: 'Bahir Dar Garrison', lat: 11.60, lon: 37.39, note: 'Northern command; facing Fano attacks' },
];

// ─── Troop positions ───
export const TROOP_POSITIONS = [
  // ENDF
  { id: 'endf-addis', side: 'sideA', unitType: 'infantry', unitSize: 'division', name: 'ENDF Central Command', lat: 9.02, lon: 38.75, sector: 'Addis Ababa' },
  { id: 'endf-amhara', side: 'sideA', unitType: 'infantry', unitSize: 'division', name: 'ENDF Amhara Deployment', lat: 11.60, lon: 37.40, sector: 'Amhara' },
  { id: 'endf-oromia', side: 'sideA', unitType: 'infantry', unitSize: 'brigade', name: 'ENDF Oromia Operations', lat: 8.50, lon: 39.00, sector: 'Oromia' },
  { id: 'endf-tigray', side: 'sideA', unitType: 'infantry', unitSize: 'division', name: 'ENDF Northern Command', lat: 13.50, lon: 39.48, sector: 'Tigray' },
  // Armed groups
  { id: 'fano-gondar', side: 'sideB', unitType: 'infantry', unitSize: 'brigade', name: 'Fano Militia (Gondar)', lat: 12.60, lon: 37.45, sector: 'Amhara' },
  { id: 'fano-wollo', side: 'sideB', unitType: 'infantry', unitSize: 'brigade', name: 'Fano Militia (South Wollo)', lat: 11.13, lon: 39.63, sector: 'Amhara' },
  { id: 'ola-west', side: 'sideB', unitType: 'infantry', unitSize: 'brigade', name: 'OLA Western Command', lat: 9.08, lon: 36.53, sector: 'Western Oromia' },
  { id: 'ola-south', side: 'sideB', unitType: 'infantry', unitSize: 'brigade', name: 'OLA Southern Command', lat: 7.67, lon: 36.83, sector: 'Southern Oromia' },
];

// ─── Battle sites ───
export const BATTLE_SITES = [
  {
    id: 'battle-tigray-war', name: 'Tigray War', lat: 13.50, lon: 39.48,
    date: 'Nov 2020 – Nov 2022', result: 'Ceasefire',
    note: 'Devastating war; estimated 300K-600K killed; Pretoria Agreement ended fighting',
    sideACommander: 'PM Abiy Ahmed / ENDF', sideBCommander: 'TPLF leadership',
    sideATroops: '~200,000 ENDF + Eritrean forces + Amhara militia', sideBTroops: '~250,000 TDF',
    sideAEquipment: 'Air force (Turkish drones), armor, artillery', sideBEquipment: 'Captured heavy weapons, infantry',
    sideACasualties: '~50,000-100,000 killed/wounded (est.)', sideBCasualties: '~100,000-150,000 killed/wounded (est.)',
    significance: 'One of the deadliest conflicts of the 21st century. Massive civilian casualties. Pretoria Agreement (signed Nov 2, effective Nov 3, 2022) ended active fighting.',
  },
  {
    id: 'battle-amhara-insurgency', name: 'Amhara Fano Insurgency', lat: 12.00, lon: 37.50,
    date: 'Aug 2023 – ongoing', result: 'Ongoing',
    note: 'Fano militias vs ENDF after attempt to disarm regional forces',
    sideACommander: 'ENDF Command', sideBCommander: 'Decentralized Fano commanders',
    sideATroops: '~60,000', sideBTroops: '~50,000-100,000 (loosely organized)',
    sideAEquipment: 'Air force, armor, heavy weapons', sideBEquipment: 'Small arms, captured weapons, guerrilla tactics',
    sideACasualties: 'Thousands killed/wounded', sideBCasualties: 'Thousands killed; mass arrests of civilians',
    significance: 'Former government allies turned insurgents. Fano controls significant rural territory in Amhara. Emergency declared Aug 2023.',
  },
  {
    id: 'battle-oromia', name: 'Oromia Conflict', lat: 8.50, lon: 37.50,
    date: '2018 – ongoing', result: 'Ongoing',
    note: 'OLA guerrilla war in Oromia region; partial peace deal Dec 2024 (one faction only); main OLA faction under Jaal Marroo continues fighting',
    sideACommander: 'ENDF / Oromia Special Forces', sideBCommander: 'Kumsa Diriba "Jaal Marroo" (OLA)',
    sideATroops: '~40,000', sideBTroops: '~20,000',
    sideAEquipment: 'Conventional military', sideBEquipment: 'Guerrilla warfare; small arms',
    sideACasualties: 'Thousands', sideBCasualties: 'Thousands; civilians targeted',
    significance: 'Long-running insurgency in Ethiopia\'s most populous region. OLA seeks self-determination for Oromo people.',
  },
];

// ─── Casualties ───
export const CASUALTIES = {
  tigrayWar: {
    totalDeaths: { low: 300000, high: 600000, label: '300,000–600,000 total deaths (conflict + famine)' },
    note: 'Includes combat deaths, famine, disease. AU-mediated Pretoria ceasefire Nov 2022.',
    source: 'Ghent University / AU / OSINT',
  },
  amharaConflict: {
    killed: { low: 5000, high: 15000, label: '5,000–15,000 (est. since Aug 2023)' },
    source: 'ACLED / OSINT',
  },
  oromiaConflict: {
    killed: { low: 5000, high: 10000, label: '5,000–10,000 (est. 2018-2026)' },
    source: 'ACLED / OSINT',
  },
  asOf: 'February 2026',
};

// ─── Equipment ───
export const EQUIPMENT = {
  sideA: {
    assets: [
      { type: 'Fighter Aircraft', count: '~35', note: 'Su-27, Su-30 (Russian), J-7 (Chinese)' },
      { type: 'Turkish Drones (Bayraktar TB2)', count: '~20', note: 'Decisive in Tigray War' },
      { type: 'Iranian Drones (Mohajer-6)', count: '~12', note: 'Recently acquired' },
      { type: 'Tanks', count: '~300', note: 'T-72 (main); T-55' },
      { type: 'Artillery', count: '~400+', note: 'Various Soviet/Chinese' },
    ],
    source: 'IISS / SIPRI',
  },
  sideB: {
    assets: [
      { type: 'Small Arms (Fano)', count: '~100,000+', note: 'Former regional militia weapons + captured' },
      { type: 'Heavy Weapons (TPLF)', count: '~200+ (surrendered)', note: 'Per Pretoria Agreement' },
      { type: 'Small Arms (OLA)', count: '~15,000', note: 'Light weapons, guerrilla equipment' },
    ],
    source: 'ICG / OSINT',
  },
  asOf: 'February 2026',
};

// ─── Command structure ───
export const COMMAND = {
  sideA: {
    title: 'Ethiopian National Defense Forces (ENDF)',
    commanderInChief: { name: 'Abiy Ahmed', role: 'Prime Minister / Commander-in-Chief', since: 'Apr 2018' },
    keyCommanders: [
      { name: 'Abiy Ahmed', role: 'Prime Minister' },
      { name: 'Birhanu Jula', role: 'Chief of General Staff, ENDF' },
    ],
    totalPersonnel: '~250,000 (significantly expanded since 2020)',
  },
  sideB: {
    title: 'Various Armed Groups',
    commanderInChief: { name: 'Decentralized', role: 'Multiple independent groups', since: 'Various' },
    keyCommanders: [
      { name: 'Debretsion Gebremichael', role: 'TPLF Chairman (re-elected Aug 2024; party legal status revoked May 2025; seized Mekelle institutions Mar 2025)' },
      { name: 'Amhara Fano National Force (AFNF)', role: 'Unified Fano command formed May 2025 (4 factions merged); controls rural Amhara' },
      { name: 'Kumsa Diriba "Jaal Marroo"', role: 'OLA Commander' },
    ],
    totalPersonnel: '~150,000-200,000 combined (Fano + OLA + others)',
  },
};

// ─── Timeline ───
export const WAR_TIMELINE = [
  { date: '2020-11-04', event: 'Tigray War begins; ENDF attacks TPLF positions', phase: 'tigray' },
  { date: '2020-11-28', event: 'ENDF captures Mekelle; TPLF retreats to mountains', phase: 'tigray' },
  { date: '2021-06-28', event: 'TDF recaptures Mekelle; ENDF withdraws from Tigray', phase: 'tigray' },
  { date: '2021-10-01', event: 'TDF advances into Amhara/Afar; threatens Addis Ababa', phase: 'tigray' },
  { date: '2022-03-24', event: 'Government declares humanitarian truce', phase: 'truce' },
  { date: '2022-08-24', event: 'Fighting resumes; heaviest phase of Tigray War', phase: 'tigray' },
  { date: '2022-11-03', event: 'Pretoria Agreement — ceasefire between ENDF and TPLF', phase: 'ceasefire' },
  { date: '2023-01-01', event: 'TPLF begins disarmament; heavy weapons surrendered', phase: 'ceasefire' },
  { date: '2023-08-04', event: 'Fano insurgency escalates into full-scale fighting in Amhara (tensions since Apr 2023 disarmament attempt)', phase: 'amhara' },
  { date: '2023-08-05', event: 'State of emergency declared in Amhara region', phase: 'amhara' },
  { date: '2024-01-01', event: 'Fano controls significant rural territory in Amhara', phase: 'amhara' },
  { date: '2024-01-01', event: 'Ethiopia signs MoU with Somaliland to lease 20km coastline; Somalia recalls ambassador; regional tensions escalate', phase: 'political' },
  { date: '2024-06-01', event: 'OLA intensifies operations in western Oromia; state of emergency in Amhara ends Jun 6', phase: 'oromia' },
  { date: '2024-12-12', event: 'Turkey brokers Ankara Declaration between Ethiopia and Somalia (collapses by Apr 2025)', phase: 'political' },
  { date: '2024-12-15', event: 'Partial peace deal signed with OLA faction (Sanyi Nagasa); Jaal Marroo\'s main faction not party to deal', phase: 'oromia' },
  { date: '2025-01-01', event: 'Amhara conflict becomes Ethiopia\'s primary security crisis; ENDF deploys est. 100K+ troops (unverified)', phase: 'amhara' },
  { date: '2025-03-01', event: 'Fano launches Operation Andinet; captures towns in North/South Gondar and Debark; ENDF retakes with air strikes', phase: 'amhara' },
  { date: '2025-03-15', event: 'TPLF Debretsion faction seizes key institutions in Mekelle; federal govt replaces Getachew Reda with Lt. Gen. Tadesse Worede as Tigray interim leader', phase: 'political' },
  { date: '2025-05-01', event: 'TPLF legal status as political party revoked by federal authorities', phase: 'political' },
  { date: '2025-05-15', event: 'Four Fano factions unify into Amhara Fano National Force (AFNF)', phase: 'amhara' },
  { date: '2025-06-01', event: 'Tigray reconstruction extremely slow; Western Tigray still occupied by Amhara forces; 878K+ IDPs in Tigray', phase: 'ceasefire' },
  { date: '2025-09-01', event: 'OLA main faction (Jaal Marroo) continues operations despite partial peace deal; ENDF kills key OLA associate', phase: 'oromia' },
  { date: '2026-01-01', event: 'Multiple active fronts; ENDF stretched thin across Amhara, Oromia; Tigray ceasefire fragile; ~15.8M food insecure', phase: 'amhara' },
  { date: '2026-02-12', event: 'TPLF warns of federal troop mobilizations toward Tigray; Pretoria ceasefire under strain', phase: 'political' },
];

// ─── Humanitarian ───
export const HUMANITARIAN = {
  refugees: {
    total: 900000,
    label: '~900,000 refugees',
    note: 'Mainly in Sudan (now displaced again), Kenya, Djibouti',
    source: 'UNHCR',
  },
  internallyDisplaced: {
    total: 4500000,
    label: '~4.5 million internally displaced',
    note: 'Tigray, Amhara, Oromia combined',
    source: 'OCHA / IOM',
  },
  hunger: {
    atRisk: 15800000,
    label: '~15.8 million in acute food insecurity',
    note: 'Additional millions require broader humanitarian assistance',
    source: 'WFP / IPC / HRP 2024',
  },
  tigrayRecovery: {
    status: 'Slow; infrastructure devastated',
    note: 'Banking, telecom, basic services only partially restored in Tigray',
    source: 'OCHA',
  },
  asOf: 'February 2026',
};

// ─── Territorial control ───
export const TERRITORIAL_CONTROL = {
  totalArea: 1104300,
  govtControlled: '~70% of territory (cities, federal infrastructure)',
  fanoControlled: '~15% (rural Amhara)',
  olaControlled: '~10% (rural western/southern Oromia)',
  tigray: 'Under Tigray Interim Administration (per Pretoria Agreement)',
  asOf: 'February 2026',
  source: 'ACLED / ICG',
};

// ─── Coat of Arms ───
export const COAT_OF_ARMS = {
  sideA: { lat: 9.02, lon: 38.75, name: 'Ethiopia (Addis Ababa)' },
  sideB: { lat: 12.00, lon: 37.50, name: 'Armed Groups' },
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
