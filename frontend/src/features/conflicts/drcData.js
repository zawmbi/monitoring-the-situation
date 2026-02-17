/**
 * DRC / Eastern Congo Conflict Data
 * M23, ADF, and other armed groups in eastern DRC
 *
 * Data based on ACLED, UN MONUSCO, Kivu Security Tracker, and OSINT.
 * Positions approximate as of early 2026.
 */

// ─── Colors ───
export const FARDC_GREEN = '#007847';
export const M23_RED = '#cc0000';

// ─── Conflict summary ───
export const CONFLICT_SUMMARY = {
  id: 'drc',
  name: 'Eastern Congo Conflict',
  started: '2021 (M23 resurgence)',
  startDate: new Date(2021, 10, 1),
  daysSince: () => {
    const start = new Date(2021, 10, 1);
    const now = new Date();
    return Math.floor((now - start) / (1000 * 60 * 60 * 24));
  },
  phase: 'M23/RDF captured Goma & Bukavu / Regional crisis / US-brokered Washington Accords / Angola ceasefire talks',
  sideA: { name: 'DRC Armed Forces (FARDC)', shortName: 'FARDC', color: FARDC_GREEN, flag: '\u{1F1E8}\u{1F1E9}' },
  sideB: { name: 'M23 / Rwanda-backed forces', shortName: 'M23', color: M23_RED, flag: '\u{1F1F7}\u{1F1FC}' },
  internationalSupport: {
    sideA: 'MONUSCO (drawdown paused), Burundi, SADC Mission (SAMIDRC — withdrawing since Mar 2025), Angola/US mediation',
    sideB: 'Rwanda (RDF troops embedded; UN documented), Uganda (alleged limited)',
  },
};

// ─── Frontline segments ───
// Removed: civil/internal conflicts have no meaningful continuous frontlines.
// Battle markers (BATTLE_SITES) show active areas of fighting instead.
export const FRONTLINE_SEGMENTS = [];

// ─── Occupied territory ───
export const OCCUPIED_TERRITORY = {
  type: 'Feature',
  properties: { side: 'sideB', label: 'M23-controlled territory' },
  geometry: {
    type: 'Polygon',
    coordinates: [[
      // M23 controlled areas in North and South Kivu (incl. Goma + Bukavu)
      [29.05, -0.80], [29.40, -0.80], [29.50, -1.00],
      [29.50, -1.30], [29.40, -1.60], [29.30, -1.80],
      [29.25, -2.00], [29.10, -2.20], [28.90, -2.50],
      [28.85, -2.60], [28.80, -2.50], [28.75, -2.20],
      [28.80, -1.80], [28.85, -1.50], [28.90, -1.20],
      [29.05, -0.80],
    ]],
  },
};

// ─── Capitals & cities ───
export const CAPITALS = [
  { id: 'kinshasa', name: 'Kinshasa', country: 'sideA', lat: -4.4419, lon: 15.2663, population: '17M', note: 'DRC capital; far from eastern conflict' },
];

export const MAJOR_CITIES = [
  { id: 'goma', name: 'Goma', country: 'sideB', lat: -1.6585, lon: 29.2200, population: '1.5M', note: 'North Kivu capital; fell to M23/RDF forces Jan 27, 2025; humanitarian catastrophe' },
  { id: 'bukavu', name: 'Bukavu', country: 'sideB', lat: -2.5083, lon: 28.8608, population: '870K', note: 'South Kivu capital; fell to M23 Feb 16, 2025 with minimal resistance' },
  { id: 'bunia', name: 'Bunia', country: 'sideA', lat: 1.5592, lon: 30.2522, population: '400K', note: 'Ituri capital; ADF/CODECO activity' },
  { id: 'beni', name: 'Beni', country: 'contested', lat: 0.4921, lon: 29.4682, population: '280K', note: 'ADF attacks; civilian massacres' },
  { id: 'rutshuru', name: 'Rutshuru', country: 'sideB', lat: -1.1833, lon: 29.4500, population: '100K', note: 'M23-controlled since 2022' },
  { id: 'masisi', name: 'Masisi', country: 'sideB', lat: -1.4000, lon: 28.8000, population: '50K', note: 'M23-controlled area' },
  { id: 'sake', name: 'Sake', country: 'sideB', lat: -1.5728, lon: 29.0417, population: '60K', note: 'Key road junction; M23 captured Jan 23, 2025' },
  { id: 'lubero', name: 'Lubero', country: 'sideA', lat: -0.1583, lon: 29.2417, population: '50K', note: 'Northern North Kivu; Mai-Mai activity' },
  { id: 'kigali', name: 'Kigali', country: 'other', lat: -1.9403, lon: 30.0587, population: '1.2M', note: 'Rwanda capital; alleged M23 support hub' },
  { id: 'kampala', name: 'Kampala', country: 'other', lat: 0.3476, lon: 32.5825, population: '1.7M', note: 'Uganda capital; EAC mediation' },
];

// ─── Military infrastructure ───
export const MILITARY_INFRASTRUCTURE = [
  { id: 'base-goma', type: 'depot', side: 'sideA', name: 'Goma Military Base', lat: -1.65, lon: 29.23, note: 'FARDC North Kivu HQ' },
  { id: 'base-bukavu', type: 'depot', side: 'sideA', name: 'Bukavu Military Base', lat: -2.51, lon: 28.86, note: 'FARDC South Kivu HQ' },
  { id: 'monusco-goma', type: 'depot', side: 'sideA', name: 'MONUSCO Base (Goma)', lat: -1.67, lon: 29.23, note: 'UN peacekeeping; drawdown paused; mandate renewed Dec 2025' },
  { id: 'samidrc-base', type: 'depot', side: 'sideA', name: 'SAMIDRC Base', lat: -1.60, lon: 29.20, note: 'SADC mission; mandate terminated Mar 2025; withdrawal underway' },
  { id: 'ab-goma', type: 'airbase', side: 'sideA', name: 'Goma International Airport', lat: -1.6708, lon: 29.2385, note: 'Military and humanitarian flights' },
  { id: 'm23-rutshuru', type: 'depot', side: 'sideB', name: 'M23 Rutshuru HQ', lat: -1.18, lon: 29.45, note: 'M23 administrative center' },
];

// ─── Troop positions ───
export const TROOP_POSITIONS = [
  // FARDC + allies
  { id: 'fardc-goma', side: 'sideA', unitType: 'infantry', unitSize: 'division', name: 'FARDC 34th Military Region', lat: -1.66, lon: 29.22, sector: 'Goma' },
  { id: 'fardc-bukavu', side: 'sideA', unitType: 'infantry', unitSize: 'brigade', name: 'FARDC South Kivu Brigade', lat: -2.51, lon: 28.86, sector: 'Bukavu' },
  { id: 'fardc-ituri', side: 'sideA', unitType: 'infantry', unitSize: 'brigade', name: 'FARDC Ituri Brigade', lat: 1.56, lon: 30.25, sector: 'Ituri' },
  { id: 'samidrc-force', side: 'sideA', unitType: 'infantry', unitSize: 'brigade', name: 'SAMIDRC (SADC Force)', lat: -1.60, lon: 29.18, sector: 'North Kivu' },
  { id: 'wazalendo-north', side: 'sideA', unitType: 'infantry', unitSize: 'brigade', name: 'Wazalendo Militias', lat: -1.40, lon: 29.00, sector: 'North Kivu' },
  // M23 / Rwanda-backed
  { id: 'm23-north', side: 'sideB', unitType: 'infantry', unitSize: 'brigade', name: 'M23 Northern Force', lat: -1.18, lon: 29.45, sector: 'Rutshuru' },
  { id: 'm23-masisi', side: 'sideB', unitType: 'infantry', unitSize: 'brigade', name: 'M23 Masisi Force', lat: -1.40, lon: 28.80, sector: 'Masisi' },
  { id: 'm23-goma-approach', side: 'sideB', unitType: 'mechanized', unitSize: 'brigade', name: 'M23/RDF Advance Force', lat: -1.55, lon: 29.15, sector: 'Goma approaches' },
  { id: 'rdf-embedded', side: 'sideB', unitType: 'mechanized', unitSize: 'brigade', name: 'RDF Elements (Rwandan)', lat: -1.30, lon: 29.35, sector: 'North Kivu' },
];

// ─── Battle sites ───
export const BATTLE_SITES = [
  {
    id: 'battle-goma-2025', name: 'Fall of Goma', lat: -1.6585, lon: 29.2200,
    date: 'Jan 26-27, 2025', result: 'M23/RDF captured',
    note: 'M23 and Rwandan forces captured Goma, North Kivu\'s capital of 1.5M people — worst escalation since 2012',
    sideACommander: 'FARDC / SAMIDRC (South Africa, Tanzania, Malawi)', sideBCommander: 'M23 / RDF (Rwandan Defense Forces)',
    sideATroops: '~20,000 FARDC + 5,000 SAMIDRC', sideBTroops: '~10,000 M23 + ~3,000-4,000 RDF (UN documented)',
    sideAEquipment: 'Infantry, limited armor, SAMIDRC Rooikats', sideBEquipment: 'Artillery, mortars, night vision, Rwanda-supplied heavy weapons',
    sideACasualties: '~500+ FARDC killed; 14 SANDF (South African) soldiers KIA + additional Malawi/Tanzania peacekeepers; ~2,900+ civilians killed during takeover (WHO); summary executions documented by HRW', sideBCasualties: 'Moderate; M23 suffered losses in urban fighting',
    significance: 'Largest city ever captured by M23. 1.5M+ residents trapped. South Africa deployed reinforcements but SADC terminated SAMIDRC mandate Mar 2025. International outrage; UN Security Council emergency session. DRC severed diplomatic ties with Rwanda (Jan 26). Regional war risk at highest level.',
  },
  {
    id: 'battle-bukavu-2025', name: 'Fall of Bukavu', lat: -2.5083, lon: 28.8608,
    date: 'Feb 16, 2025', result: 'M23 captured',
    note: 'M23 captured South Kivu capital with minimal resistance; FARDC withdrew without major fighting',
    sideACommander: 'FARDC South Kivu Command', sideBCommander: 'M23 / RDF advance force',
    sideATroops: 'FARDC garrison (withdrew)', sideBTroops: 'M23 mobile forces',
    sideAEquipment: 'Infantry (withdrew)', sideBEquipment: 'Light mobile forces',
    sideACasualties: 'Minimal (withdrew)', sideBCasualties: 'Minimal',
    significance: 'Second provincial capital to fall in under three weeks. Gave M23 control of both Kivu capitals and most of eastern DRC\'s urban centers. Demonstrated FARDC collapse in the east.',
  },
  {
    id: 'battle-rutshuru', name: 'Rutshuru Territory', lat: -1.1833, lon: 29.4500,
    date: 'Oct 2022 – ongoing', result: 'M23 captured',
    note: 'M23 captured Rutshuru territory in late 2022',
    sideACommander: 'FARDC', sideBCommander: 'M23 leadership',
    sideATroops: '~5,000', sideBTroops: '~3,000',
    sideAEquipment: 'Infantry', sideBEquipment: 'Rwanda-supplied weapons',
    sideACasualties: 'Hundreds', sideBCasualties: 'Light',
    significance: 'Gave M23 control of lucrative border trade and minerals. Displaced hundreds of thousands.',
  },
  {
    id: 'battle-beni-adf', name: 'ADF Attacks in Beni', lat: 0.4921, lon: 29.4682,
    date: '2014 – ongoing', result: 'Ongoing',
    note: 'ADF (Islamic State-linked) massacres of civilians in Beni territory',
    sideACommander: 'FARDC / UPDF (Uganda)', sideBCommander: 'ADF / ISCAP',
    sideATroops: '~10,000 FARDC + UPDF', sideBTroops: '~2,000 ADF',
    sideAEquipment: 'Infantry, air support', sideBEquipment: 'Small arms, IEDs, machetes',
    sideACasualties: 'Hundreds of soldiers killed', sideBCasualties: 'Hundreds killed',
    significance: 'ADF has killed 6,000+ civilians since 2014. IS-affiliated since 2019. Separate from M23 conflict but overlapping geography.',
  },
];

// ─── Casualties ───
export const CASUALTIES = {
  overall: {
    killed: { low: 6000000, high: 6900000, label: '~6+ million total deaths since 1996 (all Congo wars)' },
    note: 'Deadliest conflict since WWII when including all phases. Current M23 resurgence: ~10,000+ killed since 2022.',
    source: 'IRC / ACLED / Kivu Security Tracker',
  },
  current: {
    m23Conflict: { low: 10000, high: 20000, label: '10,000–20,000 killed (2022-2026 est.)' },
    adfConflict: { low: 6000, high: 8000, label: '6,000+ civilian victims (ADF since 2014)' },
    source: 'ACLED / Kivu Security Tracker',
  },
  asOf: 'February 2026',
};

// ─── Equipment ───
export const EQUIPMENT = {
  sideA: {
    assets: [
      { type: 'Fighter Aircraft', count: '~10', note: 'Su-25 (limited serviceability)' },
      { type: 'Attack Helicopters', count: '~15', note: 'Mi-24, Mi-17 (some MONUSCO)' },
      { type: 'Tanks', count: '~50', note: 'T-55, Type 59 (poor condition)' },
      { type: 'APCs', count: '~100', note: 'Various; many non-functional' },
      { type: 'SAMIDRC Equipment', count: 'Brigade-strength', note: 'South African Rooikat, Casspir' },
    ],
    source: 'IISS / OSINT',
  },
  sideB: {
    assets: [
      { type: 'Rwanda-supplied weapons', count: 'Significant', note: 'Mortars, MANPADs, anti-tank (UN documented)' },
      { type: 'RDF embedded troops', count: '~3,000-4,000', note: 'UN Group of Experts documented' },
      { type: 'Small arms', count: '~10,000+', note: 'AK-pattern, PKM, RPG' },
      { type: 'Night vision / comms', count: 'Modern', note: 'Rwandan military-grade equipment' },
    ],
    source: 'UN Group of Experts / OSINT',
  },
  asOf: 'February 2026',
};

// ─── Command structure ───
export const COMMAND = {
  sideA: {
    title: 'FARDC (Armed Forces of the DRC)',
    commanderInChief: { name: 'Felix Tshisekedi', role: 'President / Commander-in-Chief', since: 'Jan 2019' },
    keyCommanders: [
      { name: 'Felix Tshisekedi', role: 'President of the DRC' },
      { name: 'Gen. Christian Tshiwewe', role: 'Chief of Staff, FARDC' },
    ],
    totalPersonnel: '~130,000 (plus Wazalendo militia allies)',
  },
  sideB: {
    title: 'M23 / AFC (Alliance Fleuve Congo)',
    commanderInChief: { name: 'Sultani Makenga', role: 'M23 Military Commander', since: '2012' },
    keyCommanders: [
      { name: 'Corneille Nangaa', role: 'AFC Political Leader' },
      { name: 'Sultani Makenga', role: 'M23 Military Commander' },
      { name: 'Bertrand Bisimwa', role: 'M23 Political President' },
    ],
    totalPersonnel: '~10,000 M23 + ~3,000-4,000 RDF (est.)',
  },
};

// ─── Timeline ───
export const WAR_TIMELINE = [
  { date: '2012-11-20', event: 'M23 captures Goma briefly; then withdraws under pressure', phase: 'first_war' },
  { date: '2013-11-05', event: 'M23 defeated by FARDC + UN intervention brigade', phase: 'first_war' },
  { date: '2021-11-01', event: 'M23 resurges; attacks FARDC positions in North Kivu', phase: 'resurgence' },
  { date: '2022-10-20', event: 'M23 captures Rutshuru territory and Bunagana border town', phase: 'offensive' },
  { date: '2022-11-15', event: 'UN Group of Experts documents Rwandan troops fighting alongside M23', phase: 'escalation' },
  { date: '2023-03-07', event: 'EAC regional force deployed (Kenya, Burundi, Uganda); ineffective', phase: 'peacekeeping' },
  { date: '2023-06-01', event: 'M23 expands territory; captures Masisi areas', phase: 'offensive' },
  { date: '2023-12-01', event: 'EAC force withdraws; replaced by SADC mission (SAMIDRC)', phase: 'peacekeeping' },
  { date: '2024-02-01', event: 'SAMIDRC deploys (South Africa, Tanzania, Malawi)', phase: 'peacekeeping' },
  { date: '2024-06-01', event: 'DRC-Rwanda tensions escalate; Angola mediates July ceasefire (collapses by Oct)', phase: 'escalation' },
  { date: '2024-09-01', event: 'MONUSCO phased drawdown underway (later paused due to crisis)', phase: 'peacekeeping' },
  { date: '2024-12-01', event: 'M23 advances toward Goma; heavy fighting in Sake area', phase: 'offensive' },
  { date: '2025-01-26', event: 'DRC severs diplomatic ties with Rwanda as M23 closes in on Goma', phase: 'escalation' },
  { date: '2025-01-27', event: 'M23/RDF capture Goma — 1.5M people trapped; 14 SANDF soldiers + other SAMIDRC troops killed; ~2,900 civilians killed (WHO); international outcry', phase: 'offensive' },
  { date: '2025-02-16', event: 'M23 captures Bukavu (South Kivu capital) with minimal resistance; FARDC withdraws', phase: 'offensive' },
  { date: '2025-02-15', event: 'South Africa deploys additional forces (infantry + paratroopers) to eastern DRC', phase: 'escalation' },
  { date: '2025-03-01', event: 'Angola-mediated ceasefire signed but immediately violated; Angola ends mediation role; M23 captures Walikale', phase: 'diplomatic' },
  { date: '2025-03-13', event: 'SADC terminates SAMIDRC mandate; begins phased withdrawal from DRC', phase: 'peacekeeping' },
  { date: '2025-06-27', event: 'US/Qatar-brokered "Washington Accords" signed; ceasefire framework agreed but fragile', phase: 'diplomatic' },
  { date: '2025-09-01', event: 'Humanitarian crisis: 8M+ displaced in eastern DRC; M23 administers both Kivu capitals', phase: 'humanitarian' },
  { date: '2025-12-01', event: 'MONUSCO mandate renewed through Dec 2026 (UNSC Res. 2808); drawdown paused', phase: 'peacekeeping' },
  { date: '2026-02-01', event: 'Angola re-engages as mediator; proposes new ceasefire; M23 controls most of North and South Kivu', phase: 'diplomatic' },
];

// ─── Humanitarian ───
export const HUMANITARIAN = {
  refugees: {
    total: 1100000,
    label: '~1.1 million refugees from DRC',
    topCountries: [
      { country: 'Uganda', count: 500000 },
      { country: 'Burundi', count: 150000 },
      { country: 'Tanzania', count: 100000 },
      { country: 'Rwanda', count: 80000 },
    ],
    source: 'UNHCR (Jan 2026)',
  },
  internallyDisplaced: {
    total: 8000000,
    label: '~8 million internally displaced',
    note: 'Largest IDP crisis in Africa; surged after fall of Goma in Jan 2025',
    source: 'OCHA / IOM',
  },
  hunger: {
    atRisk: 26000000,
    label: '~26 million food insecure in DRC',
    note: 'Largest food crisis in the world by number of people',
    source: 'WFP / IPC',
  },
  minerals: {
    note: 'Conflict fueled by control of coltan, cassiterite, wolframite, gold',
    value: 'Billions in conflict minerals annually',
    source: 'UN Group of Experts / Global Witness',
  },
  asOf: 'February 2026',
};

// ─── Territorial control ───
export const TERRITORIAL_CONTROL = {
  totalArea: 2344858,
  m23Controlled: '~20,000-34,000 km\u00B2 across North and South Kivu including Goma and Bukavu (since Jan-Feb 2025)',
  adfPresence: 'Beni territory / Ituri',
  govtControlled: 'Most of DRC; eastern provinces contested',
  note: 'Over 100 armed groups operate in eastern DRC',
  asOf: 'February 2026',
  source: 'Kivu Security Tracker / ACLED',
};

// ─── Coat of Arms ───
export const COAT_OF_ARMS = {
  sideA: { lat: -4.44, lon: 15.27, name: 'DRC (Kinshasa)' },
  sideB: { lat: -1.18, lon: 29.45, name: 'M23' },
};

