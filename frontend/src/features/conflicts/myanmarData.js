/**
 * Myanmar Civil War Data
 * Junta vs Resistance — frontlines, troop deployments, casualties
 *
 * Data based on ISP Myanmar, ACLED, and OSINT sources.
 * Positions approximate as of early 2026.
 */

// ─── Colors ───
export const JUNTA_RED = '#cc0033';
export const NUG_BLUE = '#1e3a5f';
export const ETHNIC_GREEN = '#2d8659';

// ─── Conflict summary ───
export const CONFLICT_SUMMARY = {
  id: 'myanmar',
  name: 'Myanmar Civil War',
  started: '1 February 2021',
  startDate: new Date(2021, 1, 1),
  daysSince: () => {
    const start = new Date(2021, 1, 1);
    const now = new Date();
    return Math.floor((now - start) / (1000 * 60 * 60 * 24));
  },
  phase: 'Multi-front resistance war / junta losing territory',
  sideA: {
    name: 'Military Junta (SAC/Tatmadaw)',
    shortName: 'Junta',
    color: JUNTA_RED,
    flag: '\u{1F1F2}\u{1F1F2}',
    leader: 'Sr. Gen. Min Aung Hlaing',
    description: 'State Administration Council (SAC) / Tatmadaw military junta. Seized power in Feb 2021 coup overthrowing elected NLD government. Controls shrinking territory, relies on airstrikes against civilian areas.',
    goals: 'Maintain military rule, crush democratic opposition, control natural resources and trade',
  },
  sideB: {
    name: 'NUG / PDF / Ethnic Armed Orgs',
    shortName: 'Resistance',
    color: NUG_BLUE,
    flag: 'svg:resistance',
    leader: 'PM Mahn Win Khaing Than (NUG acting)',
    description: 'National Unity Government (NUG, shadow civilian govt), People\'s Defence Forces (PDF, armed wing), and ethnic armed organizations (KIA, KNU, KNLA, AA, TNLA, MNDAA). A broad coalition of democratic and ethnic resistance movements.',
    goals: 'Restore democracy, federal system with ethnic autonomy, end military impunity',
  },
  internationalSupport: {
    sideA: 'Russia (arms — Su-30, Yak-130), China (economic/political, brokered Shan ceasefire), India (limited engagement)',
    sideB: 'Limited; diaspora funding, cross-border support from Thailand/India border areas; China leverages ethnic armed orgs as proxies',
  },
  background: 'The military coup of Feb 1, 2021 overthrew Aung San Suu Kyi\'s elected government. Peaceful protests were met with lethal force, sparking armed resistance. By 2024-25, resistance forces captured significant territory through Operation 1027 and other offensives. The junta has lost control of much of the country\'s borders and rural areas.',
};

// ─── Frontline segments ───
// Removed: civil/internal conflicts have no meaningful continuous frontlines.
// Battle markers (BATTLE_SITES) show active areas of fighting instead.
export const FRONTLINE_SEGMENTS = [];

// ─── Occupied territory (resistance-controlled) ───
export const OCCUPIED_TERRITORY = {
  type: 'Feature',
  properties: { side: 'sideB', label: 'Resistance-controlled territory' },
  geometry: {
    type: 'Polygon',
    coordinates: [[
      // Northern Shan (MNDAA/TNLA/AA controlled)
      [96.00, 24.00], [98.50, 24.00], [98.50, 22.00], [97.50, 21.50],
      // Eastern Shan
      [98.50, 21.00], [98.50, 19.50],
      // Kayah/Karen
      [97.50, 19.00], [97.80, 17.00], [98.50, 16.00],
      // Southern coast
      [98.00, 15.50], [97.50, 16.50],
      // Back up through central resistance areas
      [97.00, 17.00], [96.50, 18.00], [96.00, 19.00],
      // Chin State
      [93.50, 21.00], [93.00, 22.50], [93.50, 23.00],
      // Sagaing
      [94.00, 23.50], [95.00, 24.00], [96.00, 24.00],
    ]],
  },
};

// ─── Capitals & cities ───
export const CAPITALS = [
  { id: 'naypyidaw', name: 'Naypyidaw', country: 'sideA', lat: 19.7633, lon: 96.0785, population: '1.2M', note: 'Capital; junta stronghold' },
];

export const MAJOR_CITIES = [
  { id: 'yangon', name: 'Yangon', country: 'sideA', lat: 16.8661, lon: 96.1951, population: '5.4M', note: 'Largest city; junta-controlled' },
  { id: 'mandalay', name: 'Mandalay', country: 'sideA', lat: 21.9588, lon: 96.0891, population: '1.2M', note: 'Second city; junta-controlled' },
  { id: 'lashio', name: 'Lashio', country: 'sideB', lat: 22.9362, lon: 97.7500, note: 'MNDAA captured Aug 2024 — largest city taken by resistance' },
  { id: 'myitkyina', name: 'Myitkyina', country: 'contested', lat: 25.3867, lon: 97.3958, population: '150K', note: 'Kachin State capital; under pressure' },
  { id: 'hakha', name: 'Hakha', country: 'sideB', lat: 21.9588, lon: 93.6100, population: '30K', note: 'Chin State capital; resistance-controlled' },
  { id: 'loikaw', name: 'Loikaw', country: 'sideB', lat: 19.6747, lon: 97.2097, population: '50K', note: 'Kayah State capital; KNPP-controlled' },
  { id: 'monywa', name: 'Monywa', country: 'contested', lat: 21.9147, lon: 95.1336, population: '370K', note: 'Sagaing; junta losing control' },
  { id: 'sittwe', name: 'Sittwe', country: 'sideA', lat: 20.1460, lon: 92.8987, population: '150K', note: 'Rakhine capital; still junta-held but AA besieging; isolated' },
  { id: 'myawaddy', name: 'Myawaddy', country: 'contested', lat: 16.6933, lon: 98.5089, population: '115K', note: 'Border town; briefly fell to KNLA Apr 2024; junta recaptured ~Apr 24; contested' },
  { id: 'taunggyi', name: 'Taunggyi', country: 'sideA', lat: 20.7833, lon: 97.0333, population: '380K', note: 'Shan State capital; junta-held' },
];

// ─── Military infrastructure ───
export const MILITARY_INFRASTRUCTURE = [
  { id: 'ab-meiktila', type: 'airbase', side: 'sideA', name: 'Meiktila Air Base', lat: 20.8833, lon: 95.8667, note: 'Main Tatmadaw air force base' },
  { id: 'ab-pathein', type: 'airbase', side: 'sideA', name: 'Pathein Air Base', lat: 16.7833, lon: 94.7333, note: 'Fighter/helicopter operations' },
  { id: 'ab-hmawbi', type: 'airbase', side: 'sideA', name: 'Hmawbi Air Base', lat: 17.1000, lon: 96.0667, note: 'Near Yangon' },
  { id: 'ab-naypyidaw', type: 'airbase', side: 'sideA', name: 'Naypyidaw Airfield', lat: 19.6236, lon: 96.2011, note: 'Capital defense' },
  { id: 'depot-pyin-oo-lwin', type: 'depot', side: 'sideA', name: 'Defense Services Academy', lat: 22.0333, lon: 96.4667, note: 'Major military complex' },
  { id: 'port-thilawa', type: 'port', side: 'sideA', name: 'Thilawa Port', lat: 16.6500, lon: 96.2500, note: 'Yangon area; military imports' },
];

// ─── Troop positions ───
export const TROOP_POSITIONS = [
  // Junta
  { id: 'junta-naypyidaw', side: 'sideA', unitType: 'infantry', unitSize: 'division', name: 'Capital Defense Force', lat: 19.76, lon: 96.08, sector: 'Naypyidaw' },
  { id: 'junta-mandalay', side: 'sideA', unitType: 'infantry', unitSize: 'division', name: 'Central Command', lat: 21.96, lon: 96.09, sector: 'Mandalay' },
  { id: 'junta-yangon', side: 'sideA', unitType: 'infantry', unitSize: 'division', name: 'Yangon Command', lat: 16.87, lon: 96.20, sector: 'Yangon' },
  { id: 'junta-shan', side: 'sideA', unitType: 'infantry', unitSize: 'brigade', name: 'NE Command (remnants)', lat: 22.50, lon: 97.00, sector: 'Shan' },
  // Resistance
  { id: 'mndaa', side: 'sideB', unitType: 'infantry', unitSize: 'brigade', name: 'MNDAA (Kokang)', lat: 23.50, lon: 98.00, sector: 'N. Shan' },
  { id: 'tnla', side: 'sideB', unitType: 'infantry', unitSize: 'brigade', name: 'TNLA (Ta\'ang)', lat: 23.00, lon: 97.50, sector: 'N. Shan' },
  { id: 'kia', side: 'sideB', unitType: 'infantry', unitSize: 'division', name: 'KIA (Kachin)', lat: 25.00, lon: 97.50, sector: 'Kachin' },
  { id: 'pdf-sagaing', side: 'sideB', unitType: 'infantry', unitSize: 'brigade', name: 'PDF Sagaing', lat: 22.50, lon: 95.00, sector: 'Sagaing' },
  { id: 'cdf', side: 'sideB', unitType: 'infantry', unitSize: 'brigade', name: 'CDF (Chin)', lat: 21.96, lon: 93.61, sector: 'Chin' },
  { id: 'knpp', side: 'sideB', unitType: 'infantry', unitSize: 'brigade', name: 'KNPP (Karenni)', lat: 19.50, lon: 97.20, sector: 'Kayah' },
  { id: 'knla', side: 'sideB', unitType: 'infantry', unitSize: 'division', name: 'KNLA (Karen)', lat: 17.50, lon: 97.80, sector: 'Karen' },
  { id: 'aa', side: 'sideB', unitType: 'infantry', unitSize: 'division', name: 'AA (Arakan Army)', lat: 20.50, lon: 93.00, sector: 'Rakhine' },
];

// ─── Battle sites ───
export const BATTLE_SITES = [
  {
    id: 'op-1027', name: 'Operation 1027', lat: 23.20, lon: 97.80,
    date: 'Oct 2023 – Jan 2024', result: 'Resistance victory',
    note: 'Three Brotherhood Alliance Phase 1 offensive; captured Laukkaing and northern Shan cities (Lashio fell later in Phase 2, Aug 2024)',
    sideACommander: 'NE Regional Military Command', sideBCommander: 'MNDAA / TNLA / AA alliance',
    sideATroops: '~20,000 Tatmadaw', sideBTroops: '~25,000 alliance fighters',
    sideAEquipment: 'Air force, armor, fortified bases', sideBEquipment: 'Light infantry, captured heavy weapons, drones',
    sideACasualties: '~5,000 captured, ~2,000 killed/wounded', sideBCasualties: '~1,000 killed/wounded',
    significance: 'Biggest military defeat for Tatmadaw since 2021 coup. Captured hundreds of junta outposts. Triggered Chinese-brokered ceasefire.',
  },
  {
    id: 'battle-myawaddy', name: 'Battle of Myawaddy', lat: 16.6933, lon: 98.5089,
    date: 'Apr 2024', result: 'Briefly captured; junta recaptured ~Apr 24',
    note: 'KNLA captured major border trade town Apr 11; junta 44th Division recaptured ~Apr 24; remains contested',
    sideACommander: 'Tatmadaw SE Command', sideBCommander: 'KNLA / PDF',
    sideATroops: '~3,000', sideBTroops: '~5,000',
    sideAEquipment: 'Fortified positions', sideBEquipment: 'Light weapons, drones',
    sideACasualties: '~500 captured/killed', sideBCasualties: '~200 killed/wounded',
    significance: 'Key Thai border crossing worth billions in trade. Demonstrated KNLA\'s growing capability.',
  },
  {
    id: 'battle-rakhine', name: 'Rakhine Offensive', lat: 20.50, lon: 93.00,
    date: 'Nov 2023 – ongoing', result: 'AA advancing',
    note: 'Arakan Army capturing most of Rakhine State from junta',
    sideACommander: 'Western Command', sideBCommander: 'AA Commander Twan Mrat Naing',
    sideATroops: '~15,000', sideBTroops: '~20,000 AA',
    sideAEquipment: 'Navy, air force, coastal defenses', sideBEquipment: 'Infantry, captured weapons, naval drones',
    sideACasualties: '~3,000+ captured', sideBCasualties: '~1,000 killed/wounded (est.)',
    significance: 'AA controls most of Rakhine State except Sittwe and Kyaukpyu. Navy bases captured. Junta losing access to Bay of Bengal coast.',
  },
  {
    id: 'battle-sagaing', name: 'Sagaing Resistance', lat: 22.00, lon: 95.00,
    date: '2022 – ongoing', result: 'Contested',
    note: 'PDF guerrilla warfare across central dry zone',
    sideACommander: 'Central Command', sideBCommander: 'PDF / NUG local forces',
    sideATroops: '~30,000', sideBTroops: '~20,000+ (decentralized)',
    sideAEquipment: 'Air strikes, artillery, armor', sideBEquipment: 'Small arms, IEDs, homemade weapons',
    sideACasualties: 'Heavy (thousands)', sideBCasualties: 'Heavy; civilian massacres by junta',
    significance: 'Heartland of Bamar resistance. Junta cannot hold territory despite superior firepower. Villages systematically burned.',
  },
];

// ─── Casualties ───
export const CASUALTIES = {
  sideA: {
    killed: { low: 15000, high: 25000, label: '15,000–25,000 (est.)' },
    captured: { low: 20000, high: 30000, label: '20,000–30,000' },
    deserted: { low: 30000, high: 50000, label: '30,000–50,000 deserted' },
    source: 'ACLED / ISP Myanmar / OSINT (est.)',
  },
  sideB: {
    killed: { low: 10000, high: 20000, label: '10,000–20,000 (est.)' },
    wounded: { low: 30000, high: 50000, label: '30,000–50,000' },
    source: 'ACLED / ISP Myanmar / OSINT (est.)',
  },
  civilian: {
    killed: { low: 8000, high: 50000, label: '8,000–50,000+' },
    note: 'AAPP documents ~6,000 confirmed killed by junta. True figure likely much higher.',
    source: 'AAPP / ACLED / OSINT',
  },
  asOf: 'February 2026',
};

// ─── Command structure ───
export const COMMAND = {
  sideA: {
    title: 'State Security and Peace Commission (SSPC) / Tatmadaw',
    commanderInChief: { name: 'Min Aung Hlaing', role: 'Chairman, SSPC / Commander-in-Chief', since: 'Feb 2021' },
    keyCommanders: [
      { name: 'Min Aung Hlaing', role: 'Chairman, SSPC / Senior General (formerly SAC; reorganized 2025)' },
      { name: 'Soe Win', role: 'Vice Senior General / Deputy PM' },
      { name: 'Mya Tun Oo', role: 'Minister of Defence' },
    ],
    totalPersonnel: '~150,000 (from ~300K pre-coup; massive attrition offset partially by conscription since Feb 2024)',
  },
  sideB: {
    title: 'National Unity Government (NUG) & Ethnic Armed Organizations',
    commanderInChief: { name: 'Duwa Lashi La', role: 'Acting President, NUG', since: 'Mar 2021' },
    keyCommanders: [
      { name: 'Duwa Lashi La', role: 'Acting President, NUG' },
      { name: 'Yee Mon', role: 'Minister of Defence, NUG' },
      { name: 'Twan Mrat Naing', role: 'Commander, Arakan Army (AA)' },
      { name: 'N\'Ban La', role: 'Chairman, Kachin Independence Organisation (KIO)' },
      { name: 'Peng Deren', role: 'Chairman, MNDAA (Kokang)' },
    ],
    totalPersonnel: '~100,000+ (PDF + EAOs combined; decentralized)',
  },
};

// ─── Timeline ───
export const WAR_TIMELINE = [
  { date: '2021-02-01', event: 'Military coup ousts elected NLD government; Min Aung Hlaing seizes power', phase: 'coup' },
  { date: '2021-03-27', event: 'Deadliest day: security forces kill 114+ protesters', phase: 'crackdown' },
  { date: '2021-04-16', event: 'National Unity Government (NUG) formed by ousted lawmakers', phase: 'resistance' },
  { date: '2021-05-05', event: 'People\'s Defence Force (PDF) established as NUG armed wing', phase: 'resistance' },
  { date: '2021-09-07', event: 'NUG declares "defensive war" against the junta', phase: 'war' },
  { date: '2022-01-01', event: 'Guerrilla warfare intensifies across Sagaing, Magwe, Chin', phase: 'war' },
  { date: '2023-01-01', event: 'Junta extends state of emergency; postpones elections', phase: 'war' },
  { date: '2023-10-27', event: 'Operation 1027 launched by Three Brotherhood Alliance', phase: 'offensive' },
  { date: '2023-11-25', event: 'MNDAA captures Kokang capital Laukkaing', phase: 'offensive' },
  { date: '2024-01-11', event: 'China brokers ceasefire in Shan State (partially holds)', phase: 'ceasefire' },
  { date: '2024-02-10', event: 'Junta introduces conscription law (People\'s Military Service Law) amid severe manpower crisis', phase: 'war' },
  { date: '2024-04-11', event: 'KNLA captures Myawaddy border town (junta recaptures ~Apr 24; remains contested)', phase: 'offensive' },
  { date: '2024-06-01', event: 'AA captures most of Rakhine State; navy bases fall', phase: 'offensive' },
  { date: '2024-06-25', event: 'AA captures multiple Rakhine towns and navy bases; Sittwe besieged but still junta-held', phase: 'offensive' },
  { date: '2024-08-03', event: 'Lashio falls to MNDAA — largest city ever taken by resistance forces', phase: 'offensive' },
  { date: '2024-11-15', event: 'Junta air force loses multiple aircraft; resistance FPV drones increasingly effective', phase: 'offensive' },
  { date: '2025-02-01', event: 'Anniversary of coup: NUG claims 60%+ of territory; independent estimates ~40-50% (ISP Myanmar/BBC)', phase: 'offensive' },
  { date: '2025-03-28', event: 'Major earthquake severely damages Naypyidaw; ~80% of govt buildings affected', phase: 'disaster' },
  { date: '2025-06-01', event: 'Junta increasingly reliant on air strikes; ground forces collapsed in peripheral states', phase: 'attrition' },
  { date: '2025-09-01', event: 'AA controls most of Rakhine State; establishes parallel administration; Sittwe and Kyaukpyu remain junta-held. Junta surges conscription; frontline near Mandalay', phase: 'offensive' },
  { date: '2025-12-01', event: 'Junta holds sham elections (USDP wins predictably); international community rejects results', phase: 'political' },
  { date: '2026-01-01', event: 'NUG and some EAOs continue fragmented federal constitution consultations (NUCC process); key actors (AA, KNU) absent from unified framework', phase: 'political' },
];

// ─── Humanitarian ───
export const HUMANITARIAN = {
  refugees: {
    total: 1200000,
    label: '~1.2 million refugees',
    topCountries: [
      { country: 'Thailand', count: 400000 },
      { country: 'India', count: 300000 },
      { country: 'Bangladesh (Rohingya)', count: 950000 },
      { country: 'Malaysia', count: 150000 },
    ],
    source: 'UNHCR (Jan 2026)',
  },
  internallyDisplaced: {
    total: 3400000,
    label: '~3.4 million internally displaced',
    note: 'Since Feb 2021 coup',
    source: 'OCHA',
  },
  infrastructureDamage: {
    villagesBurned: '~85,000 structures burned by junta',
    healthFacilities: '~600 attacks on healthcare (WHO)',
    schools: '~4,000 occupied by military or damaged',
    source: 'ISP Myanmar / WHO / OCHA',
  },
  asOf: 'February 2026',
};

// ─── Equipment ───
export const EQUIPMENT = {
  sideA: {
    assets: [
      { type: 'Fighter/Attack Aircraft', count: '~100', note: 'MiG-29, Yak-130, JF-17, Su-30 (Russian/Chinese)' },
      { type: 'Attack Helicopters', count: '~50', note: 'Mi-35, Mi-17' },
      { type: 'Tanks', count: '~200', note: 'T-72, MBT-2000' },
      { type: 'Artillery', count: '~300+', note: 'Various calibers' },
      { type: 'Navy Vessels', count: '~100', note: 'Frigates, corvettes, patrol craft (many lost in Rakhine)' },
    ],
    source: 'IISS / SIPRI',
  },
  sideB: {
    assets: [
      { type: 'Small Arms', count: '~80,000+', note: 'Captured, homemade, and smuggled' },
      { type: 'FPV Drones', count: '~5,000+', note: 'Increasingly sophisticated; decisive weapon' },
      { type: 'Anti-aircraft', count: '~200', note: 'MANPADS, AA guns (captured)' },
      { type: 'Captured Armor', count: '~50', note: 'From overrun junta bases' },
      { type: 'Homemade Weapons', count: 'Widespread', note: 'Tumee rifles, IEDs, mortars' },
    ],
    source: 'ISP Myanmar / OSINT',
  },
  asOf: 'February 2026',
};

// ─── Territorial control ───
export const TERRITORIAL_CONTROL = {
  totalArea: 676578,
  resistanceControlled: '~40-50% of territory (ISP Myanmar/BBC estimates; NUG claims 60%+)',
  juntaControlled: '~35-45% (major cities, central corridor Yangon-Mandalay-Naypyidaw)',
  contested: '~10-20%',
  note: 'Junta controls cities and major transport routes; resistance controls rural areas and border regions. Exact percentages disputed — NUG claims higher, independent analysts lower.',
  asOf: 'February 2026',
  source: 'ISP Myanmar / Special Advisory Council',
};

// ─── Coat of Arms ───
export const COAT_OF_ARMS = {
  sideA: { lat: 19.76, lon: 96.08, name: 'Junta (Naypyidaw)' },
  sideB: { lat: 22.00, lon: 95.00, name: 'NUG/Resistance' },
};

