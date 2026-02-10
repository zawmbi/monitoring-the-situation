/**
 * Russia-Ukraine Conflict Data
 * Frontline positions, troop deployments, casualties, equipment, and command structure
 */

// ─── Colors ───
export const UA_BLUE = '#005BBB';
export const UA_YELLOW = '#FFD500';
export const RU_RED = '#D52B1E';
export const RU_BLUE = '#0039A6';

// ─── Frontline segments with dates for recency coloring ───
// Each segment has an "asOf" date so we can color-code how recent the data is
export const FRONTLINE_SEGMENTS = [
  {
    id: 'north',
    label: 'Kharkiv Sector',
    asOf: '2025-02-01',
    status: 'contested',
    points: [
      [36.85, 50.38], [36.80, 50.30], [36.70, 50.18], [36.65, 50.05],
      [36.72, 49.92], [36.80, 49.80], [36.90, 49.68], [37.00, 49.55],
      [37.10, 49.45], [37.20, 49.35],
    ],
  },
  {
    id: 'luhansk',
    label: 'Luhansk Sector',
    asOf: '2025-01-28',
    status: 'stable',
    points: [
      [37.20, 49.35], [37.35, 49.22], [37.50, 49.10], [37.60, 49.00],
      [37.70, 48.88], [37.75, 48.75], [37.80, 48.62], [37.75, 48.50],
    ],
  },
  {
    id: 'donetsk',
    label: 'Donetsk Sector',
    asOf: '2025-02-03',
    status: 'active',
    points: [
      [37.75, 48.50], [37.68, 48.38], [37.60, 48.25], [37.50, 48.12],
      [37.42, 48.00], [37.32, 47.90], [37.18, 47.82], [37.00, 47.75],
      [36.80, 47.68], [36.60, 47.60],
    ],
  },
  {
    id: 'zaporizhzhia',
    label: 'Zaporizhzhia Sector',
    asOf: '2025-01-20',
    status: 'stable',
    points: [
      [36.60, 47.60], [36.38, 47.52], [36.15, 47.45], [35.90, 47.38],
      [35.65, 47.32], [35.40, 47.28], [35.15, 47.22], [34.90, 47.15],
      [34.65, 47.05], [34.40, 46.95],
    ],
  },
  {
    id: 'kherson',
    label: 'Kherson Sector',
    asOf: '2025-01-15',
    status: 'stable',
    points: [
      [34.40, 46.95], [34.15, 46.82], [33.90, 46.70], [33.65, 46.62],
      [33.38, 46.58], [33.10, 46.58], [32.90, 46.60], [32.75, 46.55],
    ],
  },
];

// ─── Russian-controlled territory (approximate polygon) ───
// Rough outline of occupied territory east/south of frontline
export const OCCUPIED_TERRITORY = {
  type: 'Feature',
  properties: { side: 'russia' },
  geometry: {
    type: 'Polygon',
    coordinates: [[
      // Northern border with Russia
      [36.85, 50.38], [38.00, 50.40], [39.60, 49.80], [40.20, 49.20],
      // Eastern border
      [40.20, 48.50], [39.80, 47.80], [39.20, 47.20],
      // Southern Crimea connection
      [38.50, 46.80], [37.50, 46.20], [36.50, 45.80],
      // Crimea
      [36.00, 45.30], [34.50, 44.70], [33.50, 44.60],
      [32.50, 44.80], [33.00, 45.30], [33.50, 45.60],
      // Back up along frontline
      [32.75, 46.55], [33.10, 46.58], [33.38, 46.58],
      [33.65, 46.62], [33.90, 46.70], [34.15, 46.82],
      [34.40, 46.95], [34.65, 47.05], [34.90, 47.15],
      [35.15, 47.22], [35.40, 47.28], [35.65, 47.32],
      [35.90, 47.38], [36.15, 47.45], [36.38, 47.52],
      [36.60, 47.60], [36.80, 47.68], [37.00, 47.75],
      [37.18, 47.82], [37.32, 47.90], [37.42, 48.00],
      [37.50, 48.12], [37.60, 48.25], [37.68, 48.38],
      [37.75, 48.50], [37.80, 48.62], [37.75, 48.75],
      [37.70, 48.88], [37.60, 49.00], [37.50, 49.10],
      [37.35, 49.22], [37.20, 49.35], [37.10, 49.45],
      [37.00, 49.55], [36.90, 49.68], [36.80, 49.80],
      [36.72, 49.92], [36.65, 50.05], [36.70, 50.18],
      [36.80, 50.30], [36.85, 50.38],
    ]],
  },
};

// ─── NATO military symbols — troop positions (estimated) ───
// Using standard NATO APP-6 unit size/type designations
export const TROOP_POSITIONS = [
  // Ukrainian forces
  { id: 'ua-kharkiv', side: 'ukraine', unitType: 'infantry', unitSize: 'brigade', name: '92nd Mech. Brigade', lat: 49.95, lon: 36.45, sector: 'Kharkiv' },
  { id: 'ua-kharkiv-2', side: 'ukraine', unitType: 'infantry', unitSize: 'brigade', name: '57th Mot. Brigade', lat: 50.10, lon: 36.50, sector: 'Kharkiv' },
  { id: 'ua-luhansk', side: 'ukraine', unitType: 'mechanized', unitSize: 'brigade', name: '24th Mech. Brigade', lat: 49.05, lon: 37.20, sector: 'Luhansk' },
  { id: 'ua-donetsk-1', side: 'ukraine', unitType: 'infantry', unitSize: 'brigade', name: '93rd Mech. Brigade', lat: 48.20, lon: 37.15, sector: 'Donetsk' },
  { id: 'ua-donetsk-2', side: 'ukraine', unitType: 'armor', unitSize: 'brigade', name: '1st Tank Brigade', lat: 48.00, lon: 36.95, sector: 'Donetsk' },
  { id: 'ua-donetsk-3', side: 'ukraine', unitType: 'infantry', unitSize: 'brigade', name: '53rd Mech. Brigade', lat: 47.85, lon: 36.70, sector: 'Donetsk' },
  { id: 'ua-zap', side: 'ukraine', unitType: 'mechanized', unitSize: 'brigade', name: '65th Mech. Brigade', lat: 47.40, lon: 35.50, sector: 'Zaporizhzhia' },
  { id: 'ua-zap-2', side: 'ukraine', unitType: 'infantry', unitSize: 'brigade', name: '118th Mech. Brigade', lat: 47.20, lon: 35.00, sector: 'Zaporizhzhia' },
  { id: 'ua-kherson', side: 'ukraine', unitType: 'marines', unitSize: 'brigade', name: '35th Marine Brigade', lat: 46.75, lon: 33.30, sector: 'Kherson' },
  { id: 'ua-reserve', side: 'ukraine', unitType: 'mechanized', unitSize: 'division', name: 'Operational Reserve', lat: 48.50, lon: 35.00, sector: 'Reserve' },

  // Russian forces
  { id: 'ru-kharkiv', side: 'russia', unitType: 'infantry', unitSize: 'brigade', name: '11th Army Corps', lat: 50.15, lon: 37.20, sector: 'Kharkiv' },
  { id: 'ru-kharkiv-2', side: 'russia', unitType: 'infantry', unitSize: 'brigade', name: '44th Army Corps', lat: 49.70, lon: 37.30, sector: 'Kharkiv' },
  { id: 'ru-luhansk', side: 'russia', unitType: 'mechanized', unitSize: 'brigade', name: '2nd Luhansk Corps', lat: 48.90, lon: 38.20, sector: 'Luhansk' },
  { id: 'ru-donetsk-1', side: 'russia', unitType: 'infantry', unitSize: 'brigade', name: '1st Donetsk Corps', lat: 48.10, lon: 37.80, sector: 'Donetsk' },
  { id: 'ru-donetsk-2', side: 'russia', unitType: 'armor', unitSize: 'brigade', name: '5th Tank Brigade', lat: 47.90, lon: 37.60, sector: 'Donetsk' },
  { id: 'ru-donetsk-3', side: 'russia', unitType: 'infantry', unitSize: 'division', name: '150th Mot. Rifle Div.', lat: 47.70, lon: 37.40, sector: 'Donetsk' },
  { id: 'ru-zap', side: 'russia', unitType: 'mechanized', unitSize: 'brigade', name: '58th CAA Elements', lat: 47.20, lon: 36.30, sector: 'Zaporizhzhia' },
  { id: 'ru-zap-2', side: 'russia', unitType: 'infantry', unitSize: 'brigade', name: '42nd Mot. Rifle Div.', lat: 47.00, lon: 35.80, sector: 'Zaporizhzhia' },
  { id: 'ru-kherson', side: 'russia', unitType: 'infantry', unitSize: 'brigade', name: 'Dnepr Group', lat: 46.50, lon: 33.80, sector: 'Kherson' },
  { id: 'ru-crimea', side: 'russia', unitType: 'mechanized', unitSize: 'division', name: 'Southern Reserve', lat: 45.30, lon: 34.50, sector: 'Crimea' },
];

// ─── Coat of Arms positions ───
export const COAT_OF_ARMS = {
  ukraine: { lat: 49.0, lon: 32.0, name: 'Ukraine' },
  russia: { lat: 61.5, lon: 50.0, name: 'Russia' },
};

// ─── Casualties data (estimates compiled from multiple OSINT sources) ───
export const CASUALTIES = {
  ukraine: {
    killed: { low: 70000, high: 120000, label: '70,000–120,000' },
    wounded: { low: 140000, high: 240000, label: '140,000–240,000' },
    captured: { low: 5000, high: 15000, label: '5,000–15,000' },
    civilian: { killed: 11500, label: '~11,500+' },
    source: 'Various OSINT / UN (est.)',
  },
  russia: {
    killed: { low: 150000, high: 250000, label: '150,000–250,000' },
    wounded: { low: 300000, high: 500000, label: '300,000–500,000' },
    captured: { low: 8000, high: 20000, label: '8,000–20,000' },
    source: 'UA General Staff / OSINT (est.)',
  },
  asOf: 'February 2025',
};

// ─── Equipment losses (from Oryx/OSINT visually confirmed + estimates) ───
export const EQUIPMENT = {
  russia: {
    lost: [
      { type: 'Tanks', count: 3650, icon: '🛡️' },
      { type: 'AFVs', count: 7800, icon: '🚛' },
      { type: 'Artillery', count: 2100, icon: '💥' },
      { type: 'MLRS', count: 450, icon: '🚀' },
      { type: 'Aircraft', count: 370, icon: '✈️' },
      { type: 'Helicopters', count: 330, icon: '🚁' },
      { type: 'UAVs', count: 5200, icon: '🤖' },
      { type: 'Naval Ships', count: 28, icon: '🚢' },
      { type: 'Cruise Missiles', count: 2800, icon: '🎯' },
    ],
    production: [
      { type: 'Tanks/yr', count: '~250', note: 'Mostly refurbished T-72/T-80' },
      { type: 'AFVs/yr', count: '~350', note: 'BMPs, BTRs' },
      { type: 'Artillery/yr', count: '~150', note: 'New + repaired' },
      { type: 'Shaheds/mo', count: '~300', note: 'Iranian-design drones' },
    ],
    source: 'Oryx (visually confirmed) + est.',
  },
  ukraine: {
    lost: [
      { type: 'Tanks', count: 900, icon: '🛡️' },
      { type: 'AFVs', count: 2100, icon: '🚛' },
      { type: 'Artillery', count: 580, icon: '💥' },
      { type: 'MLRS', count: 95, icon: '🚀' },
      { type: 'Aircraft', count: 95, icon: '✈️' },
      { type: 'Helicopters', count: 40, icon: '🚁' },
      { type: 'UAVs', count: 3800, icon: '🤖' },
      { type: 'Naval Ships', count: 1, icon: '🚢' },
    ],
    aidReceived: [
      { type: 'Tanks', count: '~600', note: 'Leopard 2, Challenger 2, M1 Abrams, T-72 variants' },
      { type: 'IFVs/APCs', count: '~2,500', note: 'Bradley, Marder, Stryker, CV90, etc.' },
      { type: 'Artillery', count: '~800', note: 'M777, PzH 2000, CAESAR, Krab, etc.' },
      { type: 'MLRS', count: '~60', note: 'HIMARS, M270, MARS II' },
      { type: 'Air Defense', count: '~30 batteries', note: 'Patriot, NASAMS, IRIS-T, Gepard' },
      { type: 'F-16s', count: '~80 pledged', note: 'Denmark, Netherlands, Norway, Belgium' },
    ],
    source: 'Oryx (visually confirmed) + est.',
  },
  asOf: 'February 2025',
};

// ─── Military command structure ───
export const COMMAND = {
  ukraine: {
    title: 'Armed Forces of Ukraine',
    commanderInChief: { name: 'Oleksandr Syrskyi', role: 'Commander-in-Chief', since: 'Feb 2024' },
    keyCommanders: [
      { name: 'Volodymyr Zelenskyy', role: 'Supreme Commander (President)' },
      { name: 'Rustem Umerov', role: 'Minister of Defence' },
      { name: 'Oleksandr Syrskyi', role: 'Commander-in-Chief of the AFU' },
      { name: 'Anatoliy Barhylevych', role: 'Commander, Ground Forces' },
      { name: 'Mykola Oleshchuk', role: 'Commander, Air Force' },
      { name: 'Oleksiy Hromov', role: 'Deputy Chief of General Staff' },
    ],
    totalPersonnel: '~1,000,000 (incl. reserves)',
  },
  russia: {
    title: 'Russian Armed Forces',
    commanderInChief: { name: 'Valery Gerasimov', role: 'Chief of General Staff / Theatre Commander', since: 'Jan 2023' },
    keyCommanders: [
      { name: 'Vladimir Putin', role: 'Supreme Commander (President)' },
      { name: 'Andrei Belousov', role: 'Minister of Defence' },
      { name: 'Valery Gerasimov', role: 'Chief of General Staff' },
      { name: 'Aleksandr Lapin', role: 'Chief of Staff, Ground Forces' },
      { name: 'Mikhail Teplinsky', role: 'Commander, VDV (Airborne)' },
      { name: 'Viktor Afzalov', role: 'Commander, VKS (Aerospace Forces)' },
    ],
    totalPersonnel: '~700,000 in theatre (est.)',
  },
};

// ─── Conflict summary ───
export const CONFLICT_SUMMARY = {
  name: 'Russia–Ukraine War',
  started: '24 February 2022',
  daysSince: () => {
    const start = new Date(2022, 1, 24);
    const now = new Date();
    return Math.floor((now - start) / (1000 * 60 * 60 * 24));
  },
  phase: 'Attritional warfare / positional',
  internationalSupport: {
    ukraine: 'NATO members, EU, Australia, Japan, South Korea',
    russia: 'Iran, North Korea, China (economic)',
  },
};

// ─── Recency color coding ───
export function getFrontlineColor(asOf) {
  const days = Math.floor((Date.now() - new Date(asOf).getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 7) return '#ff3333';    // Very recent - bright red
  if (days <= 14) return '#ff6633';   // Recent - orange-red
  if (days <= 30) return '#ff9933';   // Within month - orange
  if (days <= 60) return '#ffcc33';   // Older - yellow
  return '#999999';                    // Stale - gray
}

export const RECENCY_LEGEND = [
  { label: '< 1 week', color: '#ff3333' },
  { label: '1–2 weeks', color: '#ff6633' },
  { label: '< 1 month', color: '#ff9933' },
  { label: '1–2 months', color: '#ffcc33' },
  { label: '> 2 months', color: '#999999' },
];
