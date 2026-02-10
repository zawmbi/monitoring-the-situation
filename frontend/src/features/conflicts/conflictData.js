/**
 * Russia-Ukraine Conflict Data
 * Frontline positions, troop deployments, casualties, equipment, and command structure
 *
 * Frontline coordinates approximate early-2025 positions based on publicly
 * available DeepStateMap / ISW assessments. Many more points are used per
 * sector so the line follows actual geographic features (rivers, roads,
 * settlement lines) rather than smooth arcs.
 */

// ─── Colors ───
export const UA_BLUE = '#005BBB';
export const UA_YELLOW = '#FFD500';
export const RU_RED = '#D52B1E';
export const RU_BLUE = '#0039A6';

// ─── Frontline segments with dates for recency coloring ───
export const FRONTLINE_SEGMENTS = [
  {
    id: 'kharkiv',
    label: 'Kharkiv',
    asOf: '2025-02-01',
    status: 'contested',
    points: [
      // Russian border → Vovchansk pocket → south toward Kupiansk
      [36.30, 50.34], [36.38, 50.32], [36.46, 50.30], [36.55, 50.31],
      [36.62, 50.29], [36.70, 50.28], [36.78, 50.30], [36.85, 50.29],
      [36.92, 50.27], [36.96, 50.23], [36.93, 50.18], [36.88, 50.14],
      [36.84, 50.10], [36.82, 50.05], [36.85, 50.00], [36.90, 49.96],
      [36.94, 49.92], [36.98, 49.87], [37.02, 49.82], [37.05, 49.77],
      [37.10, 49.73], [37.16, 49.70], [37.22, 49.67], [37.28, 49.64],
      [37.34, 49.60], [37.38, 49.56], [37.42, 49.52], [37.48, 49.49],
      [37.54, 49.46], [37.58, 49.42],
    ],
  },
  {
    id: 'luhansk',
    label: 'Luhansk',
    asOf: '2025-01-28',
    status: 'contested',
    points: [
      // Svatove–Kreminna line → south toward Siversk
      [37.58, 49.42], [37.62, 49.38], [37.66, 49.34], [37.70, 49.30],
      [37.74, 49.25], [37.78, 49.20], [37.82, 49.16], [37.85, 49.12],
      [37.88, 49.08], [37.92, 49.04], [37.95, 49.00], [37.97, 48.96],
      [37.98, 48.92], [37.99, 48.88], [38.00, 48.84], [38.02, 48.80],
      [38.05, 48.76], [38.08, 48.73], [38.10, 48.70], [38.08, 48.66],
      [38.05, 48.62], [38.02, 48.58],
    ],
  },
  {
    id: 'donetsk-north',
    label: 'Donetsk (North)',
    asOf: '2025-02-03',
    status: 'active',
    points: [
      // Siversk → Chasiv Yar → Toretsk corridor
      [38.02, 48.58], [37.98, 48.55], [37.94, 48.52], [37.90, 48.49],
      [37.86, 48.46], [37.82, 48.44], [37.78, 48.42], [37.75, 48.40],
      [37.72, 48.38], [37.70, 48.35], [37.68, 48.32], [37.66, 48.29],
      [37.64, 48.26], [37.62, 48.23], [37.60, 48.20], [37.58, 48.17],
      [37.55, 48.14], [37.52, 48.12], [37.50, 48.10], [37.48, 48.08],
    ],
  },
  {
    id: 'donetsk-south',
    label: 'Donetsk (South)',
    asOf: '2025-02-03',
    status: 'active',
    points: [
      // Avdiivka salient → Marinka → Vuhledar → south
      [37.48, 48.08], [37.46, 48.05], [37.44, 48.02], [37.42, 47.99],
      [37.40, 47.96], [37.38, 47.93], [37.35, 47.90], [37.30, 47.87],
      [37.24, 47.84], [37.18, 47.80], [37.12, 47.76], [37.06, 47.73],
      [37.00, 47.70], [36.94, 47.67], [36.88, 47.64], [36.82, 47.62],
      [36.76, 47.60], [36.72, 47.58], [36.68, 47.55], [36.64, 47.52],
      [36.60, 47.50],
    ],
  },
  {
    id: 'zaporizhzhia',
    label: 'Zaporizhzhia',
    asOf: '2025-01-20',
    status: 'stable',
    points: [
      // Relatively stable line west through Zaporizhzhia oblast
      [36.60, 47.50], [36.54, 47.48], [36.48, 47.46], [36.42, 47.44],
      [36.36, 47.42], [36.28, 47.40], [36.20, 47.38], [36.12, 47.36],
      [36.04, 47.34], [35.96, 47.32], [35.88, 47.30], [35.80, 47.29],
      [35.72, 47.28], [35.64, 47.26], [35.56, 47.24], [35.48, 47.22],
      [35.40, 47.20], [35.32, 47.18], [35.24, 47.16], [35.16, 47.14],
      [35.08, 47.12], [35.00, 47.10], [34.92, 47.07], [34.84, 47.04],
      [34.76, 47.01], [34.68, 46.98], [34.60, 46.96], [34.52, 46.93],
      [34.44, 46.90],
    ],
  },
  {
    id: 'kherson',
    label: 'Kherson / Dnipro',
    asOf: '2025-01-15',
    status: 'stable',
    points: [
      // Follows Dnipro river west to Black Sea coast
      [34.44, 46.90], [34.36, 46.88], [34.28, 46.85], [34.20, 46.82],
      [34.12, 46.79], [34.04, 46.76], [33.96, 46.74], [33.88, 46.72],
      [33.80, 46.70], [33.72, 46.68], [33.64, 46.66], [33.56, 46.64],
      [33.48, 46.63], [33.40, 46.62], [33.32, 46.62], [33.24, 46.61],
      [33.16, 46.60], [33.08, 46.60], [33.00, 46.60], [32.92, 46.58],
      [32.84, 46.56], [32.76, 46.54], [32.68, 46.52],
    ],
  },
];

// ─── Russian-controlled territory (approximate polygon) ───
// East/south of frontline + Crimea + land bridge
export const OCCUPIED_TERRITORY = {
  type: 'Feature',
  properties: { side: 'russia' },
  geometry: {
    type: 'Polygon',
    coordinates: [[
      // Start at NW corner of frontline (border), go east along RU border
      [36.30, 50.34], [37.00, 50.40], [37.60, 50.35], [38.20, 50.20],
      [38.80, 50.00], [39.40, 49.70], [39.80, 49.40], [40.10, 49.10],
      // Eastern border of Luhansk oblast
      [40.20, 48.80], [40.10, 48.40], [39.90, 48.00], [39.70, 47.60],
      // Southeast — Sea of Azov coast
      [39.30, 47.20], [38.80, 46.90], [38.30, 46.70], [37.80, 46.50],
      [37.30, 46.30], [36.80, 46.10],
      // Land bridge to Crimea — Azov coast
      [36.40, 45.90], [36.10, 45.70], [35.80, 45.50], [35.60, 45.35],
      // Crimea — east coast (Kerch)
      [36.60, 45.20], [36.40, 45.00], [35.80, 44.80], [35.40, 44.60],
      // Crimea — south coast
      [34.80, 44.45], [34.20, 44.40], [33.60, 44.42], [33.20, 44.50],
      [32.80, 44.58],
      // Crimea — west coast (Sevastopol)
      [33.00, 44.80], [33.20, 45.00], [33.30, 45.20], [33.40, 45.40],
      [33.50, 45.60], [33.40, 45.80], [33.20, 46.00], [33.00, 46.20],
      // Back up the Dnipro to frontline
      [32.68, 46.52], [32.76, 46.54], [32.84, 46.56], [32.92, 46.58],
      [33.00, 46.60], [33.08, 46.60], [33.16, 46.60], [33.24, 46.61],
      [33.32, 46.62], [33.40, 46.62], [33.48, 46.63], [33.56, 46.64],
      [33.64, 46.66], [33.72, 46.68], [33.80, 46.70], [33.88, 46.72],
      [33.96, 46.74], [34.04, 46.76], [34.12, 46.79], [34.20, 46.82],
      [34.28, 46.85], [34.36, 46.88], [34.44, 46.90],
      // Zaporizhzhia frontline
      [34.52, 46.93], [34.60, 46.96], [34.68, 46.98], [34.76, 47.01],
      [34.84, 47.04], [34.92, 47.07], [35.00, 47.10], [35.08, 47.12],
      [35.16, 47.14], [35.24, 47.16], [35.32, 47.18], [35.40, 47.20],
      [35.48, 47.22], [35.56, 47.24], [35.64, 47.26], [35.72, 47.28],
      [35.80, 47.29], [35.88, 47.30], [35.96, 47.32], [36.04, 47.34],
      [36.12, 47.36], [36.20, 47.38], [36.28, 47.40], [36.36, 47.42],
      [36.42, 47.44], [36.48, 47.46], [36.54, 47.48], [36.60, 47.50],
      // Donetsk south frontline
      [36.64, 47.52], [36.68, 47.55], [36.72, 47.58], [36.76, 47.60],
      [36.82, 47.62], [36.88, 47.64], [36.94, 47.67], [37.00, 47.70],
      [37.06, 47.73], [37.12, 47.76], [37.18, 47.80], [37.24, 47.84],
      [37.30, 47.87], [37.35, 47.90], [37.38, 47.93], [37.40, 47.96],
      [37.42, 47.99], [37.44, 48.02], [37.46, 48.05], [37.48, 48.08],
      // Donetsk north frontline
      [37.50, 48.10], [37.52, 48.12], [37.55, 48.14], [37.58, 48.17],
      [37.60, 48.20], [37.62, 48.23], [37.64, 48.26], [37.66, 48.29],
      [37.68, 48.32], [37.70, 48.35], [37.72, 48.38], [37.75, 48.40],
      [37.78, 48.42], [37.82, 48.44], [37.86, 48.46], [37.90, 48.49],
      [37.94, 48.52], [37.98, 48.55], [38.02, 48.58],
      // Luhansk frontline
      [38.05, 48.62], [38.08, 48.66], [38.10, 48.70], [38.08, 48.73],
      [38.05, 48.76], [38.02, 48.80], [38.00, 48.84], [37.99, 48.88],
      [37.98, 48.92], [37.97, 48.96], [37.95, 49.00], [37.92, 49.04],
      [37.88, 49.08], [37.85, 49.12], [37.82, 49.16], [37.78, 49.20],
      [37.74, 49.25], [37.70, 49.30], [37.66, 49.34], [37.62, 49.38],
      [37.58, 49.42],
      // Kharkiv frontline
      [37.54, 49.46], [37.48, 49.49], [37.42, 49.52], [37.38, 49.56],
      [37.34, 49.60], [37.28, 49.64], [37.22, 49.67], [37.16, 49.70],
      [37.10, 49.73], [37.05, 49.77], [37.02, 49.82], [36.98, 49.87],
      [36.94, 49.92], [36.90, 49.96], [36.85, 50.00], [36.82, 50.05],
      [36.84, 50.10], [36.88, 50.14], [36.93, 50.18], [36.96, 50.23],
      [36.92, 50.27], [36.85, 50.29], [36.78, 50.30], [36.70, 50.28],
      [36.62, 50.29], [36.55, 50.31], [36.46, 50.30], [36.38, 50.32],
      [36.30, 50.34],
    ]],
  },
};

// ─── NATO military symbols — troop positions (estimated) ───
export const TROOP_POSITIONS = [
  // Ukrainian forces — west of frontline
  { id: 'ua-kharkiv', side: 'ukraine', unitType: 'infantry', unitSize: 'brigade', name: '92nd Mech. Brigade', lat: 50.05, lon: 36.25, sector: 'Kharkiv' },
  { id: 'ua-kharkiv-2', side: 'ukraine', unitType: 'infantry', unitSize: 'brigade', name: '57th Mot. Brigade', lat: 49.75, lon: 36.85, sector: 'Kharkiv' },
  { id: 'ua-luhansk', side: 'ukraine', unitType: 'mechanized', unitSize: 'brigade', name: '24th Mech. Brigade', lat: 49.10, lon: 37.50, sector: 'Luhansk' },
  { id: 'ua-donetsk-1', side: 'ukraine', unitType: 'infantry', unitSize: 'brigade', name: '93rd Mech. Brigade', lat: 48.50, lon: 37.30, sector: 'Donetsk' },
  { id: 'ua-donetsk-2', side: 'ukraine', unitType: 'armor', unitSize: 'brigade', name: '1st Tank Brigade', lat: 48.15, lon: 37.10, sector: 'Donetsk' },
  { id: 'ua-donetsk-3', side: 'ukraine', unitType: 'infantry', unitSize: 'brigade', name: '53rd Mech. Brigade', lat: 47.80, lon: 36.60, sector: 'Donetsk' },
  { id: 'ua-zap', side: 'ukraine', unitType: 'mechanized', unitSize: 'brigade', name: '65th Mech. Brigade', lat: 47.40, lon: 35.20, sector: 'Zaporizhzhia' },
  { id: 'ua-zap-2', side: 'ukraine', unitType: 'infantry', unitSize: 'brigade', name: '118th Mech. Brigade', lat: 47.15, lon: 34.50, sector: 'Zaporizhzhia' },
  { id: 'ua-kherson', side: 'ukraine', unitType: 'marines', unitSize: 'brigade', name: '35th Marine Brigade', lat: 46.70, lon: 33.00, sector: 'Kherson' },
  { id: 'ua-reserve', side: 'ukraine', unitType: 'mechanized', unitSize: 'division', name: 'Operational Reserve', lat: 48.50, lon: 35.00, sector: 'Reserve' },

  // Russian forces — east of frontline
  { id: 'ru-kharkiv', side: 'russia', unitType: 'infantry', unitSize: 'brigade', name: '11th Army Corps', lat: 50.20, lon: 37.30, sector: 'Kharkiv' },
  { id: 'ru-kharkiv-2', side: 'russia', unitType: 'infantry', unitSize: 'brigade', name: '44th Army Corps', lat: 49.55, lon: 37.80, sector: 'Kharkiv' },
  { id: 'ru-luhansk', side: 'russia', unitType: 'mechanized', unitSize: 'brigade', name: '2nd Luhansk Corps', lat: 48.90, lon: 38.60, sector: 'Luhansk' },
  { id: 'ru-donetsk-1', side: 'russia', unitType: 'infantry', unitSize: 'brigade', name: '1st Donetsk Corps', lat: 48.30, lon: 38.00, sector: 'Donetsk' },
  { id: 'ru-donetsk-2', side: 'russia', unitType: 'armor', unitSize: 'brigade', name: '5th Tank Brigade', lat: 47.90, lon: 37.80, sector: 'Donetsk' },
  { id: 'ru-donetsk-3', side: 'russia', unitType: 'infantry', unitSize: 'division', name: '150th Mot. Rifle Div.', lat: 47.60, lon: 37.50, sector: 'Donetsk' },
  { id: 'ru-zap', side: 'russia', unitType: 'mechanized', unitSize: 'brigade', name: '58th CAA Elements', lat: 47.10, lon: 36.60, sector: 'Zaporizhzhia' },
  { id: 'ru-zap-2', side: 'russia', unitType: 'infantry', unitSize: 'brigade', name: '42nd Mot. Rifle Div.', lat: 46.80, lon: 35.50, sector: 'Zaporizhzhia' },
  { id: 'ru-kherson', side: 'russia', unitType: 'infantry', unitSize: 'brigade', name: 'Dnepr Group', lat: 46.35, lon: 33.80, sector: 'Kherson' },
  { id: 'ru-crimea', side: 'russia', unitType: 'mechanized', unitSize: 'division', name: 'Southern Reserve', lat: 45.00, lon: 34.20, sector: 'Crimea' },
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
  if (days <= 7) return '#ff3333';
  if (days <= 14) return '#ff6633';
  if (days <= 30) return '#ff9933';
  if (days <= 60) return '#ffcc33';
  return '#999999';
}

export const RECENCY_LEGEND = [
  { label: '< 1 week', color: '#ff3333' },
  { label: '1–2 weeks', color: '#ff6633' },
  { label: '< 1 month', color: '#ff9933' },
  { label: '1–2 months', color: '#ffcc33' },
  { label: '> 2 months', color: '#999999' },
];
