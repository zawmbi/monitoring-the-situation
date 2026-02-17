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
  phase: 'Full-scale civil war / SAF recaptured Khartoum & Wad Medani / El Fasher fell to RSF (Oct 2025) / Darfur genocide',
  sideA: {
    name: 'Sudanese Armed Forces (SAF)', shortName: 'SAF', color: SAF_GREEN, flag: '\u{1F1F8}\u{1F1E9}',
    leader: 'Gen. Abdel Fattah al-Burhan',
    description: 'Sudanese Armed Forces, the official military of Sudan. Formerly allied with RSF in the 2019 coup, split over integration timeline. Backed by Egypt, Iran, and Turkey.',
    goals: 'Maintain state control, defeat RSF, preserve SAF dominance over security sector',
  },
  sideB: {
    name: 'Rapid Support Forces (RSF)', shortName: 'RSF', color: RSF_GOLD, flag: 'svg:paramilitary',
    leader: 'Gen. Mohamed Hamdan Dagalo "Hemedti"',
    description: 'Rapid Support Forces, evolved from the Janjaweed militia responsible for Darfur atrocities. Paramilitary force with ~100,000 fighters. Backed by UAE arms transfers and Russia/Africa Corps mercenaries.',
    goals: 'Political power-sharing, resist absorption into SAF, control gold mining and trade routes',
  },
  background: 'The war erupted April 2023 from a power struggle between Sudan\'s two top generals who had jointly overthrown the civilian government in 2021. What began as urban fighting in Khartoum escalated into a nationwide conflict with ethnic cleansing in Darfur. Over 12 million displaced, making it the world\'s largest displacement crisis.',
  internationalSupport: {
    sideA: 'Egypt (military aid), Iran (drones — Mohajer-6, documented), Turkey (TB2 drones), Eritrea (alleged)',
    sideB: 'UAE (documented arms transfers via Chad/Libya), Russia/Africa Corps (Wagner successor), Chad (transit route for weapons)',
  },
};

// ─── Frontline segments ───
// Removed: civil/internal conflicts have no meaningful continuous frontlines.
// Battle markers (BATTLE_SITES) show active areas of fighting instead.
export const FRONTLINE_SEGMENTS = [];

// ─── Occupied territory ───
export const OCCUPIED_TERRITORY = {
  type: 'Feature',
  properties: { side: 'sideB', label: 'RSF-controlled territory' },
  geometry: {
    type: 'Polygon',
    coordinates: [[
      // Darfur (all RSF-controlled incl. El Fasher since Oct 2025)
      [22.00, 16.00], [24.00, 16.00], [26.00, 15.50], [27.00, 15.00],
      // Kordofan (much RSF-controlled, but not Gezira/Khartoum anymore)
      [29.00, 14.50], [30.50, 14.00], [30.50, 15.00],
      // West back through Kordofan
      [29.00, 15.50], [28.00, 15.80], [26.00, 16.00],
      // Southern Darfur
      [24.00, 12.00], [22.50, 12.00], [22.00, 13.00], [22.00, 16.00],
    ]],
  },
};

// ─── Capitals & cities ───
export const CAPITALS = [
  { id: 'khartoum', name: 'Khartoum', country: 'sideA', lat: 15.5007, lon: 32.5599, population: '6M (metro)', note: 'Capital; SAF recaptured most of Khartoum by mid-2025 using drone warfare' },
];

export const MAJOR_CITIES = [
  { id: 'omdurman', name: 'Omdurman', country: 'sideA', lat: 15.6445, lon: 32.4776, population: '2.8M', note: 'SAF recaptured Jan 2025; RSF launched new attack on western Khartoum State near Omdurman Jan 2026' },
  { id: 'khartoum-north', name: 'Khartoum North (Bahri)', country: 'sideA', lat: 15.6361, lon: 32.5511, population: '1.5M', note: 'SAF recaptured Jan 2025; part of Khartoum tri-city recapture' },
  { id: 'port-sudan', name: 'Port Sudan', country: 'sideA', lat: 19.6158, lon: 37.2164, population: '490K', note: 'De facto SAF capital / government seat' },
  { id: 'el-fasher', name: 'El Fasher', country: 'sideB', lat: 13.6289, lon: 25.3494, population: '500K', note: 'Fell to RSF Oct 26-28, 2025 after ~500-day siege; 6,000+ killed in mass atrocity; RSF now controls all Darfur' },
  { id: 'nyala', name: 'Nyala', country: 'sideB', lat: 12.0500, lon: 24.8833, population: '560K', note: 'RSF-controlled; ethnic cleansing reported' },
  { id: 'el-geneina', name: 'El Geneina', country: 'sideB', lat: 13.4522, lon: 22.4408, population: '220K', note: 'Masalit genocide site; largely destroyed' },
  { id: 'wad-medani', name: 'Wad Medani', country: 'sideA', lat: 14.4012, lon: 33.5199, population: '360K', note: 'Fell to RSF Dec 2023; SAF recaptured Jan 2025 in Gezira counteroffensive' },
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
  { id: 'saf-wad-medani', side: 'sideA', unitType: 'infantry', unitSize: 'brigade', name: 'SAF Gezira Command (recaptured)', lat: 14.40, lon: 33.52, sector: 'Gezira' },
  { id: 'saf-kassala', side: 'sideA', unitType: 'infantry', unitSize: 'brigade', name: 'SAF Eastern Brigade', lat: 15.45, lon: 36.40, sector: 'Kassala' },
  { id: 'saf-sennar', side: 'sideA', unitType: 'infantry', unitSize: 'brigade', name: 'SAF Sennar Front', lat: 13.50, lon: 33.60, sector: 'Sennar' },
  // RSF
  { id: 'rsf-kordofan-north', side: 'sideB', unitType: 'mechanized', unitSize: 'division', name: 'RSF North Kordofan Force', lat: 13.18, lon: 30.22, sector: 'Kordofan' },
  { id: 'rsf-darfur', side: 'sideB', unitType: 'mechanized', unitSize: 'division', name: 'RSF Darfur Command', lat: 12.50, lon: 25.00, sector: 'Darfur' },
  { id: 'rsf-el-fasher', side: 'sideB', unitType: 'mechanized', unitSize: 'brigade', name: 'RSF El Fasher Occupation Force', lat: 13.63, lon: 25.35, sector: 'El Fasher' },
  { id: 'rsf-kordofan', side: 'sideB', unitType: 'infantry', unitSize: 'brigade', name: 'RSF Kordofan Force', lat: 13.50, lon: 30.00, sector: 'Kordofan' },
  { id: 'rsf-el-geneina', side: 'sideB', unitType: 'infantry', unitSize: 'brigade', name: 'RSF West Darfur', lat: 13.45, lon: 22.45, sector: 'West Darfur' },
];

// ─── Battle sites ───
export const BATTLE_SITES = [
  {
    id: 'battle-khartoum', name: 'Battle of Khartoum', lat: 15.5007, lon: 32.5599,
    date: 'Apr 2023 – mid 2025', result: 'SAF recaptured',
    note: 'Urban warfare in the capital; SAF used drone warfare (Mohajer-6, TB2) to recapture most of the city by mid-2025',
    sideACommander: 'Gen. Abdel Fattah al-Burhan', sideBCommander: 'Gen. Mohamed Hamdan Dagalo (Hemedti)',
    sideATroops: '~40,000 SAF + allied militias', sideBTroops: '~30,000 RSF',
    sideAEquipment: 'Air force, armor, artillery', sideBEquipment: 'Technicals, AA guns, small arms',
    sideACasualties: 'Thousands killed/wounded', sideBCasualties: 'Thousands killed/wounded',
    significance: 'The capital was the primary battleground since day one. SAF recaptured most of the city using drone strikes and artillery by mid-2025, though pockets of RSF resistance remain.',
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
    id: 'battle-el-fasher', name: 'Fall of El Fasher', lat: 13.6289, lon: 25.3494,
    date: 'May 2024 – Oct 2025', result: 'RSF captured',
    note: 'RSF captured last SAF stronghold in Darfur after ~500-day siege; mass atrocity — 6,000+ killed',
    sideACommander: 'SAF North Darfur + JEM/SLM allies', sideBCommander: 'RSF Darfur Command',
    sideATroops: '~15,000 (SAF + rebel allies)', sideBTroops: '~20,000 RSF',
    sideAEquipment: 'Air drops, limited armor', sideBEquipment: 'Technicals, siege weapons, heavy weaponry',
    sideACasualties: 'Heavy; 6,000+ killed including massive civilian toll', sideBCasualties: 'Moderate',
    significance: 'Fall of El Fasher gave RSF complete control of all Darfur. Mass atrocity documented — civilians systematically targeted. UN called it genocide. International community failed to prevent the fall despite months of warnings.',
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
    killed: { low: 30000, high: 150000, label: '30,000–150,000+ (possibly 225,000–400,000)' },
    note: 'ACLED reports ~31K verified conflict deaths. LSHTM/Lancet study found 90% underreporting — Khartoum alone had 61K+ deaths (Apr 2023–Jun 2024). Former US envoy cited up to 400K. El Fasher massacre (Oct 2025, 6,000+ killed) further increased toll.',
    source: 'ACLED / LSHTM (Lancet) / OCHA / US envoy estimates',
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
      { type: 'UAVs (Iranian)', count: '~10+', note: 'Mohajer-6 (documented via satellite/wreckage); also locally-produced Safaroog' },
      { type: 'UAVs (Turkish)', count: '~8+', note: 'Bayraktar TB2, Akinci ($120M Baykar deal Nov 2023; 600 warheads; 48 Turkish personnel)' },
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
  { date: '2025-01-11', event: 'SAF recaptures Wad Medani (Gezira state capital) in Gezira counteroffensive', phase: 'counteroffensive' },
  { date: '2025-03-01', event: 'SAF pushes RSF out of most of central Khartoum; Omdurman fighting continues', phase: 'counteroffensive' },
  { date: '2025-05-01', event: 'El Fasher siege at critical point; mass starvation reported; UN calls it potential genocide', phase: 'siege' },
  { date: '2025-06-01', event: 'ICC investigation into Darfur atrocities expanded; new warrants sought', phase: 'legal' },
  { date: '2025-10-26', event: 'El Fasher falls to RSF after ~500-day siege; 6,000+ killed in mass atrocity; RSF now controls all of Darfur', phase: 'atrocity' },
  { date: '2025-11-01', event: 'Famine declared in 5+ regions; 26M+ in acute food crisis (IPC Phase 3+)', phase: 'humanitarian' },
  { date: '2025-12-01', event: 'SAF controls most of Khartoum and recaptured Gezira; RSF retains all of Darfur and much of Kordofan', phase: 'counteroffensive' },
  { date: '2026-01-15', event: 'Quad diplomatic initiative (Jeddah format) advances with preliminary approval from both sides; war of attrition continues', phase: 'diplomatic' },
];

// ─── Humanitarian ───
export const HUMANITARIAN = {
  refugees: {
    total: 4200000,
    label: '~4.2 million refugees',
    topCountries: [
      { country: 'Chad', count: 1300000 },
      { country: 'South Sudan', count: 900000 },
      { country: 'Egypt', count: 600000 },
      { country: 'Ethiopia', count: 400000 },
      { country: 'Central African Republic', count: 300000 },
    ],
    source: 'UNHCR (Feb 2026)',
  },
  internallyDisplaced: {
    total: 9300000,
    label: '~9.3 million internally displaced',
    note: 'World\'s largest displacement crisis; some returns to Khartoum after SAF recapture',
    source: 'OCHA / IOM (Feb 2026)',
  },
  famine: {
    atRisk: 25000000,
    label: '~25 million facing acute hunger',
    famineAreas: 'IPC Phase 5 confirmed in El Fasher (North Darfur) and Kadugli (South Kordofan); 20+ additional areas at famine risk',
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

// ─── Territorial control ───
export const TERRITORIAL_CONTROL = {
  totalArea: 1886068,
  safControlled: 'Eastern Sudan, most of Khartoum (recaptured), Gezira (recaptured Wad Medani), northern corridor',
  rsfControlled: 'All of Darfur (incl. El Fasher since Oct 2025), much of Kordofan',
  contested: 'Parts of Omdurman, Sennar, Kordofan border areas',
  asOf: 'February 2026',
  source: 'ACLED / ISS Africa',
};

