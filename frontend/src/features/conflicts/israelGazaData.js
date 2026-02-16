/**
 * Israel-Gaza Conflict Data
 * Frontline positions, troop deployments, casualties, equipment, and command structure
 *
 * Data based on publicly available OSINT, UN/OCHA reports, and media sources.
 * Positions approximate as of early 2026.
 */

// ─── Colors ───
export const IL_BLUE = '#0038b8';
export const IL_WHITE = '#ffffff';
export const PS_GREEN = '#009736';
export const PS_RED = '#ce1126';

// ─── Conflict summary ───
export const CONFLICT_SUMMARY = {
  id: 'israel-gaza',
  name: 'Israel–Gaza War',
  started: '7 October 2023',
  startDate: new Date(2023, 9, 7),
  daysSince: () => {
    const start = new Date(2023, 9, 7);
    const now = new Date();
    return Math.floor((now - start) / (1000 * 60 * 60 * 24));
  },
  phase: 'War ended / Final ceasefire in effect / Post-war reconstruction',
  sideA: { name: 'Israel', shortName: 'IL', color: IL_BLUE, flag: '\u{1F1EE}\u{1F1F1}' },
  sideB: { name: 'Hamas / PIJ', shortName: 'Hamas', color: PS_GREEN, flag: '\u{1F1F5}\u{1F1F8}' },
  internationalSupport: {
    sideA: 'United States, EU (partial), UK',
    sideB: 'Iran (military aid), Hezbollah (pre-ceasefire), Houthis',
  },
};

// ─── Control zones ───
export const CONTROL_ZONES = [
  {
    id: 'netzarim-corridor',
    name: 'Netzarim Corridor',
    side: 'sideA',
    type: 'corridor',
    note: 'IDF east-west corridor bisecting Gaza',
    polygon: [
      [34.30, 31.42], [34.46, 31.42], [34.46, 31.40], [34.30, 31.40], [34.30, 31.42],
    ],
  },
  {
    id: 'philadelphi-corridor',
    name: 'Philadelphi Corridor',
    side: 'sideA',
    type: 'corridor',
    note: 'IDF-controlled Gaza-Egypt border corridor',
    polygon: [
      [34.21, 31.24], [34.28, 31.24], [34.28, 31.22], [34.21, 31.22], [34.21, 31.24],
    ],
  },
];

// ─── Frontline segments ───
export const FRONTLINE_SEGMENTS = [
  {
    id: 'gaza-north',
    label: 'Northern Gaza',
    asOf: '2026-02-15',
    status: 'stable',
    points: [
      [34.47, 31.59], [34.46, 31.57], [34.44, 31.55], [34.42, 31.53],
      [34.40, 31.52], [34.38, 31.51], [34.36, 31.50], [34.34, 31.50],
    ],
  },
  {
    id: 'gaza-central',
    label: 'Central Gaza',
    asOf: '2026-02-15',
    status: 'stable',
    points: [
      [34.34, 31.50], [34.33, 31.47], [34.32, 31.44], [34.31, 31.42],
      [34.32, 31.40], [34.33, 31.38], [34.34, 31.36],
    ],
  },
  {
    id: 'gaza-south',
    label: 'Southern Gaza / Rafah',
    asOf: '2026-02-15',
    status: 'stable',
    points: [
      [34.34, 31.36], [34.33, 31.34], [34.31, 31.32], [34.29, 31.30],
      [34.27, 31.28], [34.25, 31.26], [34.23, 31.24],
    ],
  },
];

// ─── Occupied/controlled territory ───
export const OCCUPIED_TERRITORY = {
  type: 'Feature',
  properties: { side: 'sideA', label: 'IDF operational zone' },
  geometry: {
    type: 'Polygon',
    coordinates: [[
      // Northern Gaza buffer zone
      [34.47, 31.60], [34.56, 31.60], [34.56, 31.50],
      // Eastern buffer
      [34.56, 31.40], [34.56, 31.30], [34.56, 31.22],
      // Southern border
      [34.28, 31.22], [34.21, 31.22],
      // Western coast (partial IDF presence)
      [34.21, 31.24], [34.23, 31.30], [34.25, 31.35],
      [34.28, 31.40], [34.30, 31.45], [34.32, 31.50],
      [34.35, 31.55], [34.40, 31.58], [34.47, 31.60],
    ]],
  },
};

// ─── Capitals & major cities ───
export const CAPITALS = [
  { id: 'jerusalem', name: 'Jerusalem', country: 'sideA', lat: 31.7683, lon: 35.2137, population: '980K' },
  { id: 'tel-aviv', name: 'Tel Aviv', country: 'sideA', lat: 32.0853, lon: 34.7818, population: '460K' },
];

export const MAJOR_CITIES = [
  // Gaza
  { id: 'gaza-city', name: 'Gaza City', country: 'contested', lat: 31.5017, lon: 34.4668, population: '590K (pre-war)', note: 'Largely destroyed' },
  { id: 'khan-yunis', name: 'Khan Yunis', country: 'contested', lat: 31.3462, lon: 34.3032, population: '400K (pre-war)', note: 'Major IDF operations 2024' },
  { id: 'rafah', name: 'Rafah', country: 'contested', lat: 31.2969, lon: 34.2455, population: '280K (pre-war)', note: 'IDF operation May 2024' },
  { id: 'deir-al-balah', name: 'Deir al-Balah', country: 'contested', lat: 31.4175, lon: 34.3494, population: '75K (pre-war)', note: 'Humanitarian zone' },
  { id: 'jabalia', name: 'Jabalia', country: 'contested', lat: 31.5283, lon: 34.4833, population: '115K (pre-war)', note: 'Refugee camp area; heavy fighting' },
  { id: 'beit-hanoun', name: 'Beit Hanoun', country: 'contested', lat: 31.5403, lon: 34.5383, population: '50K (pre-war)', note: 'Northern Gaza' },
  // Israel (near conflict)
  { id: 'sderot', name: 'Sderot', country: 'sideA', lat: 31.5244, lon: 34.5956, population: '27K', note: 'Border town; frequent rocket target' },
  { id: 'beersheba', name: 'Be\'er Sheva', country: 'sideA', lat: 31.2518, lon: 34.7913, population: '210K', note: 'Negev regional center' },
  { id: 'ashkelon', name: 'Ashkelon', country: 'sideA', lat: 31.6688, lon: 34.5743, population: '145K', note: 'Rocket target zone' },
  { id: 'ashdod', name: 'Ashdod', country: 'sideA', lat: 31.8040, lon: 34.6502, population: '225K' },
  // West Bank
  { id: 'ramallah', name: 'Ramallah', country: 'sideB', lat: 31.8996, lon: 35.2042, population: '38K', note: 'PA administrative center' },
  { id: 'nablus', name: 'Nablus', country: 'sideB', lat: 32.2211, lon: 35.2544, population: '150K', note: 'West Bank tensions' },
  { id: 'hebron', name: 'Hebron', country: 'sideB', lat: 31.5326, lon: 35.0998, population: '215K' },
];

// ─── Military infrastructure ───
export const MILITARY_INFRASTRUCTURE = [
  // Israeli military
  { id: 'ab-hatzerim', type: 'airbase', side: 'sideA', name: 'Hatzerim AB', lat: 31.2333, lon: 34.6627, note: 'F-35I / F-16 operations' },
  { id: 'ab-nevatim', type: 'airbase', side: 'sideA', name: 'Nevatim AB', lat: 31.2083, lon: 34.9389, note: 'F-35I Lightning II base' },
  { id: 'ab-ramon', type: 'airbase', side: 'sideA', name: 'Ramon AB', lat: 30.7761, lon: 34.6669, note: 'Negev; strategic reserve' },
  { id: 'ab-palmachim', type: 'airbase', side: 'sideA', name: 'Palmachim AB', lat: 31.8975, lon: 34.6906, note: 'Missile test range; Arrow system' },
  // Air defense
  { id: 'ad-iron-dome-1', type: 'airdefense', side: 'sideA', name: 'Iron Dome Battery (South)', lat: 31.4000, lon: 34.5800, note: 'Short-range rocket defense' },
  { id: 'ad-iron-dome-2', type: 'airdefense', side: 'sideA', name: 'Iron Dome Battery (Central)', lat: 31.8000, lon: 34.7500, note: 'Protecting Tel Aviv metro' },
  { id: 'ad-david-sling', type: 'airdefense', side: 'sideA', name: 'David\'s Sling Battery', lat: 32.0000, lon: 34.9000, note: 'Medium-range intercept' },
  // Naval
  { id: 'port-haifa', type: 'port', side: 'sideA', name: 'Haifa Naval Base', lat: 32.8191, lon: 34.9900, note: 'Israeli Navy HQ' },
  { id: 'port-ashdod-nav', type: 'port', side: 'sideA', name: 'Ashdod Naval Station', lat: 31.8272, lon: 34.6250, note: 'Gaza blockade operations' },
  // Gaza tunnels (approximate surface markers)
  { id: 'tunnel-north', type: 'depot', side: 'sideB', name: 'Northern Tunnel Network', lat: 31.52, lon: 34.48, note: 'Hamas tunnel infrastructure' },
  { id: 'tunnel-khan-yunis', type: 'depot', side: 'sideB', name: 'Khan Yunis Tunnel Complex', lat: 31.34, lon: 34.31, note: 'Major underground network' },
  { id: 'tunnel-rafah', type: 'depot', side: 'sideB', name: 'Rafah Cross-border Tunnels', lat: 31.28, lon: 34.24, note: 'Smuggling tunnels to Egypt' },
];

// ─── Troop positions ───
export const TROOP_POSITIONS = [
  // IDF
  { id: 'il-div-gaza-n', side: 'sideA', unitType: 'infantry', unitSize: 'division', name: '162nd Division', lat: 31.55, lon: 34.52, sector: 'Northern Gaza' },
  { id: 'il-div-gaza-c', side: 'sideA', unitType: 'mechanized', unitSize: 'division', name: '98th Division', lat: 31.42, lon: 34.40, sector: 'Central Gaza' },
  { id: 'il-div-gaza-s', side: 'sideA', unitType: 'armor', unitSize: 'division', name: '252nd Division', lat: 31.30, lon: 34.30, sector: 'Southern Gaza' },
  { id: 'il-brig-netzarim', side: 'sideA', unitType: 'infantry', unitSize: 'brigade', name: 'Nahal Brigade', lat: 31.41, lon: 34.38, sector: 'Netzarim Corridor' },
  { id: 'il-reserve-south', side: 'sideA', unitType: 'mechanized', unitSize: 'brigade', name: 'Southern Command Reserve', lat: 31.25, lon: 34.80, sector: 'Reserve' },
  // Hamas / militant forces (estimated)
  { id: 'hm-north', side: 'sideB', unitType: 'infantry', unitSize: 'brigade', name: 'Northern Brigade (remnants)', lat: 31.52, lon: 34.46, sector: 'Northern Gaza' },
  { id: 'hm-central', side: 'sideB', unitType: 'infantry', unitSize: 'brigade', name: 'Central Gaza Brigade', lat: 31.40, lon: 34.34, sector: 'Central Gaza' },
  { id: 'hm-khan-yunis', side: 'sideB', unitType: 'infantry', unitSize: 'brigade', name: 'Khan Yunis Brigade (remnants)', lat: 31.35, lon: 34.30, sector: 'Khan Yunis' },
  { id: 'hm-rafah', side: 'sideB', unitType: 'infantry', unitSize: 'brigade', name: 'Rafah Brigade (remnants)', lat: 31.29, lon: 34.25, sector: 'Rafah' },
];

// ─── Battle sites ───
export const BATTLE_SITES = [
  {
    id: 'battle-oct7', name: 'October 7 Attack', lat: 31.38, lon: 34.39,
    date: '7 Oct 2023', result: 'Hamas attack',
    note: 'Deadliest day in Israeli history; 1,200 killed, 250 hostages taken',
    sideACommander: 'IDF Southern Command', sideBCommander: 'Mohammed Deif (Izz ad-Din al-Qassam)',
    sideATroops: 'Overwhelmed border garrisons', sideBTroops: '~3,000 militants',
    sideAEquipment: 'Border surveillance (breached)', sideBEquipment: 'Paragliders, trucks, rockets, drones',
    sideACasualties: '~1,200 killed (364 soldiers, ~800 civilians), ~250 hostages', sideBCasualties: '~1,500 militants killed on Oct 7',
    significance: 'Triggered the current war. Largest single-day loss of Jewish life since the Holocaust. Led to massive IDF mobilization and ground invasion of Gaza.',
  },
  {
    id: 'battle-shifa', name: 'Battle of Al-Shifa Hospital', lat: 31.5200, lon: 34.4500,
    date: 'Nov 2023 & Mar 2024', result: 'IL captured',
    note: 'Two IDF raids on Gaza\'s largest hospital; alleged Hamas command center beneath',
    sideACommander: '162nd Division', sideBCommander: 'Hamas Northern Brigade',
    sideATroops: 'Brigade-strength', sideBTroops: 'Embedded fighters',
    sideAEquipment: 'Armor, infantry, engineering units', sideBEquipment: 'Small arms, IEDs, tunnels',
    sideACasualties: 'Light', sideBCasualties: '~200 militants killed (IDF claim)',
    significance: 'Became symbol of civilian-military controversy. IDF claimed Hamas HQ under hospital. WHO condemned attacks on healthcare.',
  },
  {
    id: 'battle-khan-yunis', name: 'Battle of Khan Yunis', lat: 31.3462, lon: 34.3032,
    date: 'Dec 2023 – Apr 2024', result: 'IL captured',
    note: 'Major IDF ground operation in southern Gaza',
    sideACommander: '98th Division / 162nd Division', sideBCommander: 'Yahya Sinwar (Hamas leader)',
    sideATroops: '~20,000', sideBTroops: '~5,000 Hamas fighters',
    sideAEquipment: 'Merkava tanks, D9 bulldozers, air support', sideBEquipment: 'Tunnels, RPGs, IEDs, anti-tank missiles',
    sideACasualties: '~100+ killed', sideBCasualties: '~2,000 militants killed (IDF claim)',
    significance: 'Hunt for Yahya Sinwar and hostages. Massive destruction of Khan Yunis. Hundreds of thousands displaced to Rafah.',
  },
  {
    id: 'battle-rafah', name: 'Battle of Rafah', lat: 31.2969, lon: 34.2455,
    date: 'May – Aug 2024', result: 'IL captured',
    note: 'Controversial IDF operation despite international opposition',
    sideACommander: '162nd Division', sideBCommander: 'Rafah Brigade',
    sideATroops: '~15,000', sideBTroops: '~3,000 Hamas fighters',
    sideAEquipment: 'Armor, air strikes, engineering', sideBEquipment: 'Tunnels, IEDs, cross-border tunnels',
    sideACasualties: '~50+ killed', sideBCasualties: '~1,500 militants killed (IDF claim)',
    significance: 'US opposed operation. Philadelphi Corridor seized. Massive humanitarian displacement. Tented camps destroyed.',
  },
  {
    id: 'battle-jabalia-2', name: 'Jabalia Operations (2024-25)', lat: 31.5283, lon: 34.4833,
    date: 'Oct 2024 – Jan 2025', result: 'Contested',
    note: 'Repeated IDF returns to northern Gaza; Hamas reconstitutes',
    sideACommander: '162nd Division', sideBCommander: 'Hamas Northern remnants',
    sideATroops: 'Brigade-strength', sideBTroops: '~1,000-2,000 reconstituted fighters',
    sideAEquipment: 'Armor, infantry, airstrikes', sideBEquipment: 'Rebuilt tunnel positions, IEDs',
    sideACasualties: 'Dozens killed', sideBCasualties: 'Hundreds killed (IDF claim)',
    significance: 'Demonstrated Hamas ability to rebuild forces in cleared areas. IDF forced to repeatedly re-enter northern Gaza. "Mowing the grass" pattern.',
  },
];

// ─── Casualties ───
export const CASUALTIES = {
  sideA: {
    killed: { low: 900, high: 1000, label: '~950 IDF soldiers' },
    wounded: { low: 5500, high: 6500, label: '5,500–6,500' },
    civilian: { killed: 1200, label: '~1,200 (Oct 7 attack — 695 civilians, 373 security forces, ~71 foreigners)' },
    hostages: { taken: 251, released: 251, remaining: 0, deceased: 0, label: 'All 251 hostages accounted for — released, recovered, or remains returned' },
    source: 'IDF / Israeli MoD / Hostages & Missing Families Forum',
  },
  sideB: {
    killed: { low: 18000, high: 22000, label: '18,000–22,000 militants (IDF est.)' },
    wounded: { low: 30000, high: 40000, label: '30,000–40,000' },
    captured: { low: 6000, high: 10000, label: '6,000–10,000' },
    source: 'IDF claims / OSINT est.',
  },
  civilian: {
    gazaKilled: { low: 48000, high: 52000, label: '~50,000+ (Gaza MoH)' },
    gazaWounded: { low: 100000, high: 120000, label: '~110,000+ (Gaza MoH)' },
    note: 'Gaza MoH figures include combatants; distinction contested. UN considers MoH methodology broadly credible. Lancet study (Jul 2024) estimated true toll may be significantly higher when accounting for indirect deaths.',
    source: 'Gaza Ministry of Health / OCHA / Lancet / WHO',
  },
  asOf: 'February 2026',
};

// ─── Equipment ───
export const EQUIPMENT = {
  sideA: {
    deployed: [
      { type: 'Merkava Tanks', count: '~400 deployed', note: 'Mk 4 primary; Mk 3 reserve' },
      { type: 'Namer IFVs', count: '~200', note: 'Heavy APC based on Merkava hull' },
      { type: 'D9 Armored Bulldozers', count: '~100+', note: 'Primary demolition/clearing tool' },
      { type: 'F-35I Adir', count: '~50 in inventory', note: 'Stealth strike aircraft' },
      { type: 'F-16I Sufa', count: '~100', note: 'Primary strike aircraft' },
      { type: 'Hermes 900 / Heron UAV', count: '~50+', note: 'ISR and strike drones' },
      { type: 'Iron Dome Batteries', count: '~15', note: '~90% intercept rate vs rockets' },
    ],
    losses: [
      { type: 'Soldiers KIA', count: '~850' },
      { type: 'Merkava Tanks Damaged/Destroyed', count: '~30-50 (est.)' },
      { type: 'APCs/IFVs', count: '~40-60 (est.)' },
    ],
    source: 'IDF / OSINT',
  },
  sideB: {
    preWar: [
      { type: 'Rockets (total stockpile)', count: '~30,000', note: 'Qassam, Fajr-5, M-302, J-80' },
      { type: 'Anti-tank missiles', count: '~5,000', note: 'Kornet, RPG-29, Yassin-105' },
      { type: 'Military personnel', count: '~30,000', note: 'Izz ad-Din al-Qassam Brigades' },
      { type: 'Tunnel network', count: '~500 km', note: 'Underground metro system' },
      { type: 'Naval commandos', count: '~1,000', note: 'Al-Quds Brigades' },
    ],
    destroyed: [
      { type: 'Tunnel shafts destroyed', count: '~1,500+ (IDF claim)' },
      { type: 'Rocket launchers', count: '~5,000+' },
      { type: 'Weapons workshops', count: '~800+' },
    ],
    source: 'IDF / OSINT / pre-war estimates',
  },
  asOf: 'February 2026',
};

// ─── Command structure ───
export const COMMAND = {
  sideA: {
    title: 'Israel Defense Forces (IDF)',
    commanderInChief: { name: 'Eyal Zamir', role: 'Chief of General Staff (from Apr 2025)', since: 'Apr 2025' },
    keyCommanders: [
      { name: 'Benjamin Netanyahu', role: 'Prime Minister / Defense Council Chair' },
      { name: 'Israel Katz', role: 'Minister of Defense (from Nov 2024)' },
      { name: 'Eyal Zamir', role: 'Chief of General Staff (from Apr 2025)' },
      { name: 'Herzi Halevi (resigned)', role: 'Former Chief of General Staff — resigned Jan 2025 over Oct 7 failures' },
      { name: 'Yoav Gallant (dismissed)', role: 'Former Minister of Defense — fired Nov 2024' },
      { name: 'Yaron Finkelman', role: 'Commander, Southern Command' },
    ],
    totalPersonnel: '~170,000 active + 465,000 reserves mobilized',
  },
  sideB: {
    title: 'Hamas / Izz ad-Din al-Qassam Brigades',
    commanderInChief: { name: 'Mohammed Sinwar', role: 'Hamas Leader (since Oct 2024)', since: 'Oct 2024' },
    keyCommanders: [
      { name: 'Yahya Sinwar (killed)', role: 'Former Hamas Leader in Gaza — killed Oct 2024 in Rafah' },
      { name: 'Ismail Haniyeh (killed)', role: 'Former Hamas Political Bureau Chair — assassinated in Tehran Aug 2024' },
      { name: 'Mohammed Deif (killed)', role: 'Former Al-Qassam Commander — killed Jul 2024' },
      { name: 'Mohammed Sinwar', role: 'Hamas Leader in Gaza (brother of Yahya)' },
      { name: 'Khalil al-Hayya', role: 'Hamas Political Bureau Deputy (Qatar-based, lead negotiator)' },
      { name: 'Marwan Issa (killed)', role: 'Former Deputy Al-Qassam Commander — killed Mar 2024' },
    ],
    totalPersonnel: '~30,000 pre-war (est. 60-70% degraded by Feb 2026)',
  },
};

// ─── Timeline ───
export const WAR_TIMELINE = [
  { date: '2023-10-07', event: 'Hamas launches surprise attack on southern Israel; ~1,200 killed, 251 hostages taken', phase: 'invasion' },
  { date: '2023-10-09', event: 'Israel declares state of war; total blockade on Gaza begins', phase: 'invasion' },
  { date: '2023-10-13', event: 'IDF orders 1.1M Gazans to evacuate northern Gaza', phase: 'invasion' },
  { date: '2023-10-17', event: 'Al-Ahli Hospital explosion — blame disputed between IDF and PIJ', phase: 'invasion' },
  { date: '2023-10-27', event: 'IDF ground incursion into northern Gaza begins', phase: 'ground' },
  { date: '2023-11-15', event: 'IDF raids Al-Shifa Hospital; claims Hamas command center beneath', phase: 'ground' },
  { date: '2023-11-24', event: 'First hostage deal: 7-day pause, 105 hostages released for 240 Palestinian prisoners', phase: 'ceasefire' },
  { date: '2023-12-01', event: 'Fighting resumes after truce expires; IDF expands into southern Gaza', phase: 'ground' },
  { date: '2024-01-26', event: 'ICJ orders Israel to prevent genocide; stops short of ceasefire order', phase: 'legal' },
  { date: '2024-03-25', event: 'UN Security Council passes ceasefire resolution 2728 (US abstains for first time)', phase: 'legal' },
  { date: '2024-05-06', event: 'IDF launches Rafah ground operation despite US opposition', phase: 'ground' },
  { date: '2024-05-24', event: 'ICJ orders Israel to immediately halt Rafah military offensive', phase: 'legal' },
  { date: '2024-07-13', event: 'IDF strike targeting Mohammed Deif in Al-Mawasi; massive civilian casualties', phase: 'ground' },
  { date: '2024-08-01', event: 'Hamas Political Bureau Chair Ismail Haniyeh assassinated in Tehran', phase: 'escalation' },
  { date: '2024-10-01', event: 'Iran launches ~180 ballistic missiles at Israel (Operation True Promise II)', phase: 'escalation' },
  { date: '2024-10-16', event: 'Yahya Sinwar killed by IDF troops in Rafah during chance encounter', phase: 'ground' },
  { date: '2024-11-04', event: 'Defense Minister Yoav Gallant dismissed by Netanyahu; replaced by Israel Katz', phase: 'political' },
  { date: '2024-11-21', event: 'ICC issues arrest warrants for PM Netanyahu and former DM Gallant for war crimes', phase: 'legal' },
  { date: '2024-11-27', event: 'Israel-Lebanon/Hezbollah ceasefire agreement reached (60-day)', phase: 'ceasefire' },
  { date: '2025-01-15', event: 'Gaza ceasefire deal reached via Qatar/Egypt mediation; 3-phase framework', phase: 'ceasefire' },
  { date: '2025-01-19', event: 'Phase 1 ceasefire begins; first 3 hostages released (Romi Gonen, Emily Damari, Doron Steinbrecher)', phase: 'ceasefire' },
  { date: '2025-01-21', event: 'IDF Chief of Staff Herzi Halevi resigns taking responsibility for Oct 7 failures', phase: 'political' },
  { date: '2025-01-25', event: 'Second hostage exchange: 4 hostages released for Palestinian prisoners', phase: 'ceasefire' },
  { date: '2025-02-01', event: 'Third exchange: 4 female IDF soldier hostages released', phase: 'ceasefire' },
  { date: '2025-03-01', event: 'Phase 1 extended; ~33 hostages released; Phase 2 negotiations begin', phase: 'ceasefire' },
  { date: '2025-06-01', event: 'Phase 2 negotiations advance; additional hostages released', phase: 'ceasefire' },
  { date: '2025-09-01', event: 'Multiple countries enforce ICC warrants; Netanyahu travel restricted', phase: 'legal' },
  { date: '2025-12-01', event: 'UNOSAT confirms 80%+ of Gaza structures damaged or destroyed', phase: 'humanitarian' },
  { date: '2026-01-15', event: 'Final ceasefire agreement reached; all remaining hostages accounted for; war declared over', phase: 'ceasefire' },
  { date: '2026-02-01', event: 'War officially ends; IDF withdrawal underway; international reconstruction planning begins', phase: 'ceasefire' },
];

// ─── Humanitarian ───
export const HUMANITARIAN = {
  refugees: {
    total: 1900000,
    label: '~1.9 million displaced (90%+ of population)',
    note: 'Virtually entire Gaza population displaced at least once',
    source: 'UNRWA / OCHA (Jan 2026)',
  },
  internallyDisplaced: {
    total: 1900000,
    label: '~1.9 million',
    note: 'No external displacement possible due to border closures',
    source: 'OCHA',
  },
  infrastructureDamage: {
    housingUnits: 370000,
    schools: 625,
    hospitals: 36,
    universities: 12,
    mosques: 400,
    churches: 3,
    powerGrid: '100% of power infrastructure destroyed or non-functional',
    waterSystem: '97% of water sources contaminated or non-functional',
    economicDamage: '$18.5 billion (World Bank est. as of early 2024; likely far higher)',
    reconstructionCost: '$80 billion+ (UN est.); some analysts estimate 80+ years to rebuild',
    rubbleVolume: '~42 million tonnes of debris (UNEP est.)',
    source: 'World Bank / UNDP / OCHA / UNEP',
  },
  aidAccess: {
    status: 'Expanding under post-war ceasefire; massive humanitarian operation underway',
    trucksPerDay: 'Increasing toward pre-war levels (~500/day target); aid surge in progress',
    note: 'Famine conditions persist in northern Gaza despite increased aid flow; UNRWA and international organizations scaling up operations; reconstruction aid beginning to enter',
    source: 'OCHA / WFP / IPC / UNRWA',
  },
  asOf: 'February 2026',
};

// ─── Sanctions/International ───
export const INTERNATIONAL_RESPONSE = {
  icjRuling: 'Ordered Israel to prevent genocide, allow aid, halt Rafah offensive (Jan & May 2024)',
  iccWarrants: 'Arrest warrants for PM Netanyahu & former DM Gallant (Nov 21, 2024) for war crimes and crimes against humanity; Hamas leader warrants also issued',
  unResolutions: 'UNSC Resolution 2728 (Mar 2024) demanding ceasefire; multiple UNGA resolutions; UNSC Resolution 2735 (Jun 2024) endorsing ceasefire plan',
  armsEmbargoes: 'Arms suspensions by Belgium, Italy, Spain, Netherlands, Canada, UK (partial), Japan; ICJ ruling cited',
  usAid: '$14.1B emergency military aid (Oct 2023); $26.4B total since Oct 7; 2,000-lb bomb shipment paused May 2024',
  recognitions: 'Norway, Ireland, Spain, Slovenia recognized Palestine statehood (May 2024); 146 of 193 UN members now recognize',
  southAfricaCase: 'South Africa genocide case at ICJ ongoing; multiple countries joined (Nicaragua, Colombia, Libya, Mexico, etc.)',
  asOf: 'February 2026',
};

// ─── Territorial control ───
export const TERRITORIAL_CONTROL = {
  gazaTotalArea: 365,
  idfOperationalControl: 'IDF withdrawal underway per ceasefire terms',
  bufferZone: 'Buffer zone status to be determined in final agreement',
  destructionRate: '~80% of structures damaged or destroyed (UN satellite analysis)',
  postWar: 'War ended; reconstruction planning underway; international donors assessing',
  asOf: 'February 2026',
  source: 'UNOSAT / OCHA / IDF',
};

// ─── Coat of Arms ───
export const COAT_OF_ARMS = {
  sideA: { lat: 31.77, lon: 35.22, name: 'Israel' },
  sideB: { lat: 31.40, lon: 34.35, name: 'Palestine' },
};

// ─── Fortification lines ───
export const FORTIFICATION_LINES = [
  {
    id: 'netzarim-corridor-line',
    name: 'Netzarim Corridor',
    note: 'IDF east-west corridor bisecting Gaza at Wadi Gaza',
    points: [
      [34.25, 31.41], [34.30, 31.41], [34.35, 31.41], [34.40, 31.41], [34.45, 31.41], [34.50, 31.41], [34.56, 31.41],
    ],
  },
  {
    id: 'philadelphi-line',
    name: 'Philadelphi Corridor',
    note: 'IDF-controlled Gaza-Egypt border strip',
    points: [
      [34.21, 31.23], [34.24, 31.23], [34.28, 31.23],
    ],
  },
];

// ─── Nuclear/strategic facilities ───
export const STRATEGIC_FACILITIES = [
  { id: 'dimona', name: 'Dimona Nuclear Facility', lat: 31.0017, lon: 35.1448, status: 'operational', note: 'Israeli nuclear research center (undeclared)' },
];

// ─── Recency color coding ───
export function getFrontlineColor(asOf) {
  const days = Math.floor((Date.now() - new Date(asOf).getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 7) return '#ff3333';
  if (days <= 14) return '#ff6633';
  if (days <= 30) return '#ff9933';
  if (days <= 60) return '#ffcc33';
  return '#999999';
}
