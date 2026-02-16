/**
 * Russia-Ukraine Conflict Data
 * Frontline positions, troop deployments, casualties, equipment, and command structure
 *
 * Frontline coordinates approximate early-2026 positions based on publicly
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
    asOf: '2026-02-01',
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
    asOf: '2026-01-28',
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
    asOf: '2026-02-03',
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
    asOf: '2026-02-03',
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
    asOf: '2026-01-20',
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
    asOf: '2026-01-15',
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
  // Russia coat of arms near border by conflict zone (visible when zoomed in)
  russia: { lat: 50.8, lon: 38.5, name: 'Russia' },
};

// ─── Capitals & major cities ───
export const CAPITALS = [
  { id: 'kyiv', name: 'Kyiv', country: 'ukraine', lat: 50.4501, lon: 30.5234, population: '2.9M' },
  { id: 'moscow', name: 'Moscow', country: 'russia', lat: 55.7558, lon: 37.6173, population: '13M' },
];

export const MAJOR_CITIES = [
  // Ukrainian cities
  { id: 'kharkiv-city', name: 'Kharkiv', country: 'ukraine', lat: 49.9935, lon: 36.2304, population: '1.4M', note: 'Under frequent bombardment' },
  { id: 'odesa', name: 'Odesa', country: 'ukraine', lat: 46.4825, lon: 30.7233, population: '1.0M', note: 'Major Black Sea port' },
  { id: 'dnipro', name: 'Dnipro', country: 'ukraine', lat: 48.4647, lon: 35.0462, population: '980K', note: 'Logistics hub' },
  { id: 'zaporizhzhia-city', name: 'Zaporizhzhia', country: 'ukraine', lat: 47.8388, lon: 35.1396, population: '710K', note: 'Nuclear power plant nearby' },
  { id: 'lviv', name: 'Lviv', country: 'ukraine', lat: 49.8397, lon: 24.0297, population: '720K', note: 'Western logistics hub' },
  { id: 'mykolaiv', name: 'Mykolaiv', country: 'ukraine', lat: 46.9750, lon: 31.9946, population: '480K' },
  { id: 'kherson-city', name: 'Kherson', country: 'ukraine', lat: 46.6354, lon: 32.6169, population: '280K', note: 'Liberated Nov 2022' },
  { id: 'sumy', name: 'Sumy', country: 'ukraine', lat: 50.9077, lon: 34.7981, population: '260K' },
  { id: 'kramatorsk', name: 'Kramatorsk', country: 'ukraine', lat: 48.7380, lon: 37.5886, population: '150K', note: 'UA eastern HQ' },
  { id: 'pokrovsk', name: 'Pokrovsk', country: 'ukraine', lat: 48.2843, lon: 36.2093, population: '60K', note: 'Key logistics node' },
  // Russian-occupied cities
  { id: 'donetsk-city', name: 'Donetsk', country: 'occupied', lat: 48.0159, lon: 37.8029, population: '900K', note: 'Russian-occupied since 2014' },
  { id: 'luhansk-city', name: 'Luhansk', country: 'occupied', lat: 48.5740, lon: 39.3078, population: '400K', note: 'Russian-occupied since 2014' },
  { id: 'mariupol', name: 'Mariupol', country: 'occupied', lat: 47.0958, lon: 37.5433, population: '430K', note: 'Fell May 2022' },
  { id: 'melitopol', name: 'Melitopol', country: 'occupied', lat: 46.8489, lon: 35.3675, population: '150K', note: 'Occupied Feb 2022' },
  { id: 'sevastopol', name: 'Sevastopol', country: 'occupied', lat: 44.6166, lon: 33.5254, population: '510K', note: 'RU Black Sea Fleet base' },
  { id: 'simferopol', name: 'Simferopol', country: 'occupied', lat: 44.9521, lon: 34.1024, population: '340K', note: 'Crimea capital, occupied 2014' },
  // Key Russian cities near conflict
  { id: 'rostov', name: 'Rostov-on-Don', country: 'russia', lat: 47.2357, lon: 39.7015, population: '1.1M', note: 'Southern Military District HQ' },
  { id: 'belgorod', name: 'Belgorod', country: 'russia', lat: 50.5997, lon: 36.5882, population: '390K', note: 'Border staging area' },
  { id: 'kursk', name: 'Kursk', country: 'russia', lat: 51.7304, lon: 36.1926, population: '450K', note: 'UA cross-border incursion 2024' },
  { id: 'voronezh', name: 'Voronezh', country: 'russia', lat: 51.6720, lon: 39.1843, population: '1.0M' },
  { id: 'krasnodar', name: 'Krasnodar', country: 'russia', lat: 45.0355, lon: 38.9753, population: '950K' },
];

// ─── Military infrastructure ───
export const MILITARY_INFRASTRUCTURE = [
  // Ukrainian airbases
  { id: 'ab-starokonstantiniv', type: 'airbase', side: 'ukraine', name: 'Starokostiantyniv AB', lat: 49.3929, lon: 27.1008, note: 'F-16 ops rumored' },
  { id: 'ab-myrhorod', type: 'airbase', side: 'ukraine', name: 'Myrhorod AB', lat: 49.9722, lon: 33.6000, note: 'Fighter base' },
  { id: 'ab-kulbakino', type: 'airbase', side: 'ukraine', name: 'Kulbakino AB', lat: 46.9750, lon: 32.0500, note: 'Near Mykolaiv' },
  { id: 'ab-ozerne', type: 'airbase', side: 'ukraine', name: 'Ozerne AB', lat: 49.8333, lon: 28.7500, note: 'Zhytomyr region' },
  // Russian / occupied airbases
  { id: 'ab-belbek', type: 'airbase', side: 'russia', name: 'Belbek AB', lat: 44.6900, lon: 33.5700, note: 'Crimea — damaged by strikes' },
  { id: 'ab-saky', type: 'airbase', side: 'russia', name: 'Saky / Novofedorivka AB', lat: 45.0928, lon: 33.5811, note: 'Crimea — hit Aug 2022' },
  { id: 'ab-morozovsk', type: 'airbase', side: 'russia', name: 'Morozovsk AB', lat: 48.3167, lon: 41.7833, note: 'Rostov Oblast — bomber ops' },
  { id: 'ab-millerovo', type: 'airbase', side: 'russia', name: 'Millerovo AB', lat: 48.9333, lon: 40.3500, note: 'Rostov Oblast' },
  { id: 'ab-mariupol', type: 'airbase', side: 'russia', name: 'Mariupol AB', lat: 47.0761, lon: 37.4497, note: 'Occupied — rotary wing ops' },
  // Ukrainian ports
  { id: 'port-odesa', type: 'port', side: 'ukraine', name: 'Port of Odesa', lat: 46.4886, lon: 30.7400, note: 'Grain corridor hub' },
  { id: 'port-pivdennyi', type: 'port', side: 'ukraine', name: 'Pivdennyi Port', lat: 46.3750, lon: 30.7500, note: 'Major bulk cargo terminal' },
  { id: 'port-chornomorsk', type: 'port', side: 'ukraine', name: 'Chornomorsk Port', lat: 46.3000, lon: 30.6528, note: 'Grain export terminal' },
  { id: 'port-mykolaiv', type: 'port', side: 'ukraine', name: 'Mykolaiv Shipyard', lat: 46.9650, lon: 32.0100, note: 'Restricted due to proximity' },
  // Russian / occupied ports
  { id: 'port-sevastopol', type: 'port', side: 'russia', name: 'Sevastopol Naval Base', lat: 44.6100, lon: 33.5100, note: 'Black Sea Fleet HQ — damaged' },
  { id: 'port-novorossiysk', type: 'port', side: 'russia', name: 'Novorossiysk Naval Base', lat: 44.7239, lon: 37.7676, note: 'Fleet relocated here' },
  { id: 'port-kerch', type: 'port', side: 'russia', name: 'Kerch Port / Strait', lat: 45.3531, lon: 36.4761, note: 'Crimean Bridge nearby' },
  { id: 'port-mariupol-occ', type: 'port', side: 'russia', name: 'Mariupol Port', lat: 47.0800, lon: 37.5600, note: 'Occupied — limited ops' },
  { id: 'port-berdyansk', type: 'port', side: 'russia', name: 'Berdyansk Port', lat: 46.7558, lon: 36.7939, note: 'Occupied — struck Mar 2022' },
  // Key logistics / supply depots
  { id: 'depot-khmelnitsky', type: 'depot', side: 'ukraine', name: 'Khmelnytskyi Depot', lat: 49.4230, lon: 26.9871, note: 'Western arms supply hub' },
  { id: 'depot-pavlohrad', type: 'depot', side: 'ukraine', name: 'Pavlohrad Ammo Depot', lat: 48.5337, lon: 35.8705, note: 'Major munitions storage' },
  { id: 'bridge-crimea', type: 'bridge', side: 'russia', name: 'Crimean Bridge', lat: 45.3050, lon: 36.5150, note: 'Kerch Strait — damaged, partially operational' },
  // Air defense sites
  { id: 'ad-kyiv', type: 'airdefense', side: 'ukraine', name: 'Kyiv Air Defense Ring', lat: 50.40, lon: 30.40, note: 'Patriot / NASAMS umbrella' },
  { id: 'ad-odesa', type: 'airdefense', side: 'ukraine', name: 'Odesa AD Coverage', lat: 46.50, lon: 30.60, note: 'IRIS-T / NASAMS' },
];

// ─── Black Sea naval positions (approximate patrol/presence areas) ───
export const NAVAL_POSITIONS = [
  // Russian Navy — Black Sea Fleet
  { id: 'ru-nav-patrol-west', side: 'russia', type: 'patrol', name: 'BSF Western Patrol', lat: 43.80, lon: 32.50, vessels: '2–3 frigates', note: 'Kalibr launch zone', status: 'active' },
  { id: 'ru-nav-patrol-south', side: 'russia', type: 'patrol', name: 'BSF Southern Patrol', lat: 43.20, lon: 35.00, vessels: '1–2 corvettes', note: 'Defensive screen', status: 'active' },
  { id: 'ru-nav-novorossiysk', side: 'russia', type: 'anchorage', name: 'Novorossiysk Anchorage', lat: 44.60, lon: 37.80, vessels: 'Fleet main body', note: 'Relocated from Sevastopol', status: 'active' },
  { id: 'ru-nav-azov', side: 'russia', type: 'patrol', name: 'Sea of Azov Patrol', lat: 46.30, lon: 37.00, vessels: '1–2 patrol boats', note: 'Coastal defense', status: 'active' },
  { id: 'ru-sub-area', side: 'russia', type: 'submarine', name: 'Kilo-class Submarine Area', lat: 43.50, lon: 34.00, vessels: '1–3 Kilo-class SSK', note: 'Kalibr-armed', status: 'active' },
  // Ukrainian Navy — limited surface but active with USVs
  { id: 'ua-nav-odesa', side: 'ukraine', type: 'coastal', name: 'Odesa Coastal Defense', lat: 46.40, lon: 30.90, vessels: 'Coastal batteries + USVs', note: 'Neptune AShM', status: 'active' },
  { id: 'ua-usv-ops', side: 'ukraine', type: 'usv', name: 'USV Operations Zone', lat: 44.80, lon: 32.80, vessels: 'Unmanned surface vehicles', note: 'Sea Baby / MAGURA V5 drones', status: 'active' },
  { id: 'ua-nav-grain', side: 'ukraine', type: 'corridor', name: 'Grain Corridor', lat: 45.50, lon: 30.80, vessels: 'Merchant traffic', note: 'UA-enforced humanitarian corridor', status: 'active' },
  // Notable sunk/damaged
  { id: 'ru-moskva-sunk', side: 'russia', type: 'wreck', name: 'Moskva (sunk)', lat: 45.17, lon: 31.00, vessels: 'Slava-class cruiser', note: 'Sunk 14 Apr 2022 — Neptune strike', status: 'destroyed' },
];

// ─── Casualties data (estimates compiled from multiple OSINT sources) ───
export const CASUALTIES = {
  ukraine: {
    killed: { low: 100000, high: 140000, label: '100,000–140,000' },
    wounded: { low: 300000, high: 460000, label: '300,000–460,000' },
    captured: { low: 5000, high: 15000, label: '5,000–15,000' },
    civilian: { killed: 15000, label: '~15,000+' },
    source: 'CSIS / OHCHR / OSINT (est.)',
  },
  russia: {
    killed: { low: 267000, high: 386000, label: '267,000–386,000' },
    wounded: { low: 700000, high: 860000, label: '700,000–860,000' },
    captured: { low: 10000, high: 25000, label: '10,000–25,000' },
    source: 'BBC / UK MoD / CSIS / OSINT (est.)',
  },
  asOf: 'February 2026',
};

// ─── Equipment losses (from Oryx/OSINT visually confirmed + estimates) ───
export const EQUIPMENT = {
  russia: {
    lost: [
      { type: 'Tanks', count: 4200, icon: '🛡️' },
      { type: 'AFVs', count: 9600, icon: '🚛' },
      { type: 'Artillery', count: 3100, icon: '💥' },
      { type: 'MLRS', count: 580, icon: '🚀' },
      { type: 'Aircraft', count: 435, icon: '✈️' },
      { type: 'Helicopters', count: 347, icon: '🚁' },
      { type: 'UAVs', count: 8500, icon: '🤖' },
      { type: 'Naval Ships', count: 29, icon: '🚢' },
      { type: 'Cruise Missiles', count: 4270, icon: '🎯' },
    ],
    production: [
      { type: 'Tanks/yr', count: '~300', note: 'Mostly refurbished T-72/T-80; T-90M from scratch' },
      { type: 'AFVs/yr', count: '~400', note: 'BMPs, BTRs (Soviet stockpiles depleting)' },
      { type: 'Artillery/yr', count: '~200', note: 'New + repaired' },
      { type: 'Shaheds/mo', count: '~5,000', note: 'RU-produced; ~170/day by mid-2025' },
    ],
    source: 'Oryx / WarSpotting (visually confirmed) + est.',
  },
  ukraine: {
    lost: [
      { type: 'Tanks', count: 1200, icon: '🛡️' },
      { type: 'AFVs', count: 2800, icon: '🚛' },
      { type: 'Artillery', count: 750, icon: '💥' },
      { type: 'MLRS', count: 120, icon: '🚀' },
      { type: 'Aircraft', count: 140, icon: '✈️' },
      { type: 'Helicopters', count: 50, icon: '🚁' },
      { type: 'UAVs', count: 5500, icon: '🤖' },
      { type: 'Naval Ships', count: 1, icon: '🚢' },
    ],
    aidReceived: [
      { type: 'Tanks', count: '~700', note: 'Leopard 2, Challenger 2, M1 Abrams, T-72 variants' },
      { type: 'IFVs/APCs', count: '~3,000', note: 'Bradley, Marder, Stryker, CV90, etc.' },
      { type: 'Artillery', count: '~1,000', note: 'M777, PzH 2000, CAESAR, Krab, etc.' },
      { type: 'MLRS', count: '~70', note: 'HIMARS, M270, MARS II' },
      { type: 'Air Defense', count: '~40 batteries', note: 'Patriot, NASAMS, IRIS-T, Gepard, HAWK' },
      { type: 'F-16s', count: '~100 delivered', note: 'Denmark, Netherlands, Norway, Belgium' },
    ],
    source: 'Oryx / WarSpotting (visually confirmed) + est.',
  },
  asOf: 'February 2026',
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
      { name: 'Mykhailo Drapatyi', role: 'Commander, Ground Forces' },
      { name: 'Anatoliy Kryvonozhko', role: 'Commander, Air Force' },
      { name: 'Oleksiy Hromov', role: 'Deputy Chief of General Staff' },
    ],
    totalPersonnel: '~1,000,000 (incl. reserves; 18 corps)',
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
    totalPersonnel: '~750,000 in theatre (est.)',
  },
};

// ─── Fallen commanders / senior officers killed in action ───
export const DECEASED_COMMANDERS = {
  russia: [
    { name: 'Andrei Sukhovetsky', rank: 'Maj. Gen.', role: 'Deputy Commander, 41st CAA', date: '3 Mar 2022', cause: 'Sniper fire near Hostomel' },
    { name: 'Vitaly Gerasimov', rank: 'Maj. Gen.', role: 'Chief of Staff, 41st CAA', date: '7 Mar 2022', cause: 'Artillery strike near Kharkiv' },
    { name: 'Andrei Kolesnikov', rank: 'Maj. Gen.', role: 'Commander, 29th CAA', date: '11 Mar 2022', cause: 'Killed in action, Mariupol area' },
    { name: 'Oleg Mityaev', rank: 'Maj. Gen.', role: 'Commander, 150th Mot. Rifle Div.', date: '15 Mar 2022', cause: 'Killed near Mariupol' },
    { name: 'Yakov Rezantsev', rank: 'Lt. Gen.', role: 'Commander, 49th CAA', date: '25 Mar 2022', cause: 'HIMARS strike at command post, Kherson' },
    { name: 'Vladimir Frolov', rank: 'Maj. Gen.', role: 'Deputy Commander, 8th CAA', date: '16 Apr 2022', cause: 'Killed in Donbas fighting' },
    { name: 'Kanamat Botashev', rank: 'Maj. Gen. (ret.)', role: 'Pilot, volunteered for combat', date: '22 May 2022', cause: 'Su-25 shot down over Luhansk' },
    { name: 'Roman Kutuzov', rank: 'Maj. Gen.', role: 'Commander, 1st DPR Corps', date: '5 Jun 2022', cause: 'Killed leading assault near Popasna' },
    { name: 'Yevgeny Prigozhin', rank: 'Civilian (Wagner head)', role: 'Founder, Wagner PMC', date: '23 Aug 2023', cause: 'Plane crash after failed mutiny' },
    { name: 'Vladimir Zavadsky', rank: 'Maj. Gen.', role: 'Commander, 14th Army Corps', date: '4 Oct 2024', cause: 'Killed in action, Zaporizhzhia front' },
  ],
  ukraine: [
    { name: 'Vitaliy Skakun', rank: 'Marine Engineer', role: '35th Marine Brigade', date: '24 Feb 2022', cause: 'Manually detonated Henichesk bridge to delay RU advance — Hero of Ukraine' },
    { name: 'Dmytro Kotsiubailo ("Da Vinci")', rank: 'Lt. Col.', role: 'Commander, 1st Assault Battalion', date: '7 Mar 2023', cause: 'Killed near Bakhmut — youngest Hero of Ukraine' },
    { name: 'Vyacheslav Zaborsky', rank: 'Brig. Gen.', role: 'Commander, 58th Mot. Brigade', date: '13 Jul 2023', cause: 'Killed in action, Zaporizhzhia front' },
    { name: 'Dmytro Lysenko', rank: 'Colonel', role: 'Commander, 128th Mountain Assault Brigade', date: '5 Aug 2023', cause: 'Killed near Bakhmut' },
    { name: 'Oleh Makiievskyi', rank: 'Colonel', role: 'Commander, 47th Mech. Brigade', date: '21 Jan 2024', cause: 'Killed in Avdiivka fighting' },
    { name: 'Ihor Skybiuk', rank: 'Colonel', role: 'Special Operations Forces', date: '9 Mar 2024', cause: 'Killed in combat operations' },
  ],
  source: 'Compiled from official reports, OSINT, and media as of Feb 2026',
};

// ─── Key battle sites (map markers with dates) ───
export const BATTLE_SITES = [
  {
    id: 'battle-bakhmut', name: 'Battle of Bakhmut', lat: 48.5953, lon: 38.0005,
    date: 'Aug 2022 – May 2023', result: 'RU captured', note: 'Deadliest battle; Wagner-led assault',
    ruCommander: 'Yevgeny Prigozhin (Wagner)', uaCommander: 'Oleksandr Syrskyi',
    ruTroops: '~50,000 (Wagner + VDV)', uaTroops: '~30,000 (rotated brigades)',
    ruEquipment: 'Artillery-heavy, limited armor', uaEquipment: 'Fortified positions, artillery',
    ruCasualties: '~20,000–30,000 killed/wounded (est.)', uaCasualties: '~10,000–15,000 killed/wounded (est.)',
    significance: 'Longest and deadliest battle of the war. Wagner PMC bore bulk of assault losses. Prigozhin publicly feuded with MoD over ammunition.',
  },
  {
    id: 'battle-avdiivka', name: 'Battle of Avdiivka', lat: 48.1397, lon: 37.7473,
    date: 'Oct 2023 – Feb 2024', result: 'RU captured', note: 'Major fortified position fell after 4-month siege',
    ruCommander: 'Col. Gen. Aleksandr Lapin', uaCommander: 'Brig. Gen. Oleksandr Tarnavskyi',
    ruTroops: '~40,000', uaTroops: '~10,000 (garrison)',
    ruEquipment: 'Armored assaults, glide bombs (FAB-500)', uaEquipment: 'Fortified coke plant, minefields',
    ruCasualties: '~15,000–17,000 killed/wounded (est.)', uaCasualties: '~5,000 killed/wounded (est.)',
    significance: 'Key UA fortress since 2014. Fall forced UA withdrawal under heavy glide-bomb strikes. RU used 5:1 numerical advantage.',
  },
  {
    id: 'battle-vuhledar', name: 'Battle of Vuhledar', lat: 47.7764, lon: 37.2527,
    date: 'Jan 2023 – Oct 2024', result: 'RU captured', note: 'Multiple failed assaults before eventual fall',
    ruCommander: '155th Naval Infantry Brigade / 36th CAA', uaCommander: '72nd Mech. Brigade',
    ruTroops: '~15,000 (multiple rotations)', uaTroops: '~4,000 (garrison)',
    ruEquipment: 'Tanks, APCs (heavy losses in failed charges)', uaEquipment: 'Elevated defensive positions, ATGMs',
    ruCasualties: '~5,000+ killed/wounded over multiple assaults', uaCasualties: '~2,000 killed/wounded (est.)',
    significance: 'Famous for devastating UA ambushes on RU armored columns in early 2023. Eventually fell after UA forces were stretched thin.',
  },
  {
    id: 'battle-mariupol', name: 'Siege of Mariupol', lat: 47.0958, lon: 37.5433,
    date: 'Feb – May 2022', result: 'RU captured', note: 'Azovstal siege; ~2,500 UA POWs',
    ruCommander: 'Col. Gen. Mikhail Mizintsev', uaCommander: 'Lt. Col. Denys Prokopenko (Azov)',
    ruTroops: '~14,000 (RU + DPR militia + Chechens)', uaTroops: '~3,500 (Azov Regt + 36th Marines)',
    ruEquipment: 'Naval bombardment, heavy artillery, air strikes', uaEquipment: 'Urban fortifications, Azovstal steel plant',
    ruCasualties: '~4,000–6,000 killed/wounded (est.)', uaCasualties: '~1,500 killed, ~2,500 surrendered as POWs',
    significance: 'Defining siege of the war. Azov Regiment held Azovstal for 82 days. ~90% of city destroyed. Secured Russian land bridge to Crimea.',
  },
  {
    id: 'battle-kherson', name: 'Battle of Kherson', lat: 46.6354, lon: 32.6169,
    date: 'Feb – Nov 2022', result: 'UA liberated', note: 'Only regional capital liberated',
    ruCommander: 'Gen. Sergei Surovikin', uaCommander: 'Gen. Oleksandr Syrskyi / Brig. Gen. Andriy Kovalchuk',
    ruTroops: '~20,000 (withdrew across Dnipro)', uaTroops: '~40,000 (southern counter-offensive)',
    ruEquipment: 'Dug-in positions, pontoon supply', uaEquipment: 'HIMARS targeting supply lines, artillery',
    ruCasualties: '~3,000–5,000 killed/wounded before withdrawal', uaCasualties: '~2,000–3,000 killed/wounded (est.)',
    significance: 'HIMARS strikes cut Russian logistics across the Dnipro. Surovikin ordered withdrawal — only major RU retreat of the war.',
  },
  {
    id: 'battle-chasiv-yar', name: 'Battle of Chasiv Yar', lat: 48.6089, lon: 37.8447,
    date: 'Apr 2024 – ongoing', result: 'Contested', note: 'Key high-ground position west of Bakhmut; canal defense line',
    ruCommander: 'Southern Group of Forces', uaCommander: 'Multiple brigade rotations',
    ruTroops: '~15,000', uaTroops: '~8,000',
    ruEquipment: 'Glide bombs, infantry assaults', uaEquipment: 'Fortified canal line, elevated positions',
    ruCasualties: 'Heavy (est. thousands)', uaCasualties: 'Moderate–heavy',
    significance: 'Critical high ground west of Bakhmut. Canal acts as natural defense line. Fall would open route deeper into Donetsk.',
  },
  {
    id: 'battle-toretsk', name: 'Battle of Toretsk', lat: 48.3928, lon: 37.8448,
    date: 'Jun 2024 – ongoing', result: 'Contested', note: 'Urban combat in Donetsk sector',
    ruCommander: 'Central Group of Forces', uaCommander: 'UA Joint Forces',
    ruTroops: '~10,000', uaTroops: '~6,000',
    ruEquipment: 'Infantry, FAB glide bombs', uaEquipment: 'Urban defensive positions',
    ruCasualties: 'Ongoing', uaCasualties: 'Ongoing',
    significance: 'Dense urban battle. Part of RU multi-axis pressure in Donetsk. Grinding attritional warfare.',
  },
  {
    id: 'battle-pokrovsk-axis', name: 'Pokrovsk Axis', lat: 48.15, lon: 37.10,
    date: 'Jul 2024 – ongoing', result: 'RU advancing', note: 'RU captured Myrnohrad (Feb 2026); approaching Pokrovsk',
    ruCommander: 'Centre Group of Forces', uaCommander: 'UA General Staff reserves',
    ruTroops: '~35,000+', uaTroops: '~25,000 (reinforced)',
    ruEquipment: 'Combined arms, armor, glide bombs', uaEquipment: 'Prepared defensive lines, drones',
    ruCasualties: 'Very heavy (~1,000+/week est.)', uaCasualties: 'Heavy',
    significance: 'Most active front 2024-2025. Myrnohrad fell Feb 2026. Pokrovsk critical logistics hub. RU trading massive casualties for incremental gains.',
  },
  {
    id: 'battle-kursk', name: 'Kursk Incursion', lat: 51.42, lon: 35.20,
    date: 'Aug 2024 – Mar 2025', result: 'RU recaptured most territory', note: 'UA cross-border offensive; RU recaptured Sudzha Mar 2025',
    ruCommander: 'Col. Gen. Aleksandr Lapin (redeployed)', uaCommander: 'Gen. Oleksandr Syrskyi',
    ruTroops: '~50,000 (inc. ~15,000 North Korean troops)', uaTroops: '~10,000–12,000',
    ruEquipment: 'Reserves, conscripts, KPA infantry', uaEquipment: 'Western armor, mobile brigades',
    ruCasualties: '~20,000 killed/wounded (est.)', uaCasualties: 'Heavy',
    significance: 'Audacious UA cross-border operation. RU recaptured Sudzha and most territory by Mar 2025. UA held ~90 km² by mid-2025, minimal foothold by 2026.',
  },
  {
    id: 'battle-kharkiv-2024', name: 'Kharkiv Offensive (2024)', lat: 50.28, lon: 36.70,
    date: 'May 2024', result: 'Stalled', note: 'RU attempt to create buffer zone; largely repelled',
    ruCommander: 'North Group of Forces', uaCommander: 'Kharkiv garrison + reserves',
    ruTroops: '~30,000', uaTroops: '~20,000',
    ruEquipment: 'Infantry-led, limited armor', uaEquipment: 'Fortified positions, artillery, drones',
    ruCasualties: '~6,000 killed/wounded in first month (est.)', uaCasualties: '~2,000 killed/wounded (est.)',
    significance: 'Russia aimed to push UA artillery out of range of Belgorod. Captured some villages but largely stalled at Vovchansk.',
  },
];

// ─── Fortification / defense lines ───
export const FORTIFICATION_LINES = [
  {
    id: 'surovikin-line',
    name: 'Surovikin Line',
    note: 'Russian multi-layered defense (minefields, dragon teeth, trenches)',
    points: [
      [36.60, 47.50], [36.30, 47.35], [36.00, 47.25], [35.70, 47.15],
      [35.40, 47.08], [35.10, 47.00], [34.80, 46.92], [34.50, 46.85],
    ],
  },
  {
    id: 'kursk-incursion',
    name: 'Kursk Incursion Zone (former UA-held)',
    note: 'RU recaptured most territory by Mar 2025; UA holds minimal foothold',
    points: [
      [34.90, 51.55], [35.10, 51.60], [35.30, 51.55], [35.50, 51.45],
      [35.40, 51.30], [35.20, 51.25], [35.00, 51.30], [34.90, 51.40],
      [34.90, 51.55],
    ],
  },
];

// ─── Nuclear power plants ───
export const NUCLEAR_PLANTS = [
  { id: 'npp-zaporizhzhia', name: 'Zaporizhzhia NPP', lat: 47.5070, lon: 34.5853, status: 'occupied', note: 'Europe\'s largest NPP — Russian-occupied since Mar 2022, cold shutdown' },
  { id: 'npp-south-ukraine', name: 'South Ukraine NPP', lat: 47.8167, lon: 31.2167, status: 'operational', note: '3 reactors — operational under UA control' },
  { id: 'npp-rivne', name: 'Rivne NPP', lat: 51.3281, lon: 25.8953, status: 'operational', note: '4 reactors — operational' },
  { id: 'npp-khmelnytskyi', name: 'Khmelnytskyi NPP', lat: 50.3014, lon: 26.6492, status: 'operational', note: '2 reactors — operational' },
];

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

// ─── Territorial control (approximate) ───
export const TERRITORIAL_CONTROL = {
  ukraineTotalArea: 603550,
  occupiedPreFeb2022: 43133,
  occupiedAtPeak: 119000,
  currentOccupied: 116300,
  liberatedSincePeak: 2700,
  crimea: 27000,
  donbasPreWar: 16133,
  asOf: 'February 2026',
  source: 'ISW / DeepStateMap (est.)',
};

// ─── Drone & missile warfare ───
export const DRONE_MISSILE_DATA = {
  russianStrikes: {
    totalMissiles: 14000,
    totalDrones: 60000,
    cruiseMissiles: { type: 'Cruise Missiles', count: 6500, variants: 'Kalibr, Kh-101, Kh-555' },
    ballisticMissiles: { type: 'Ballistic Missiles', count: 2800, variants: 'Iskander-M, KN-23 (DPRK), Kinzhal, Oreshnik' },
    sGlide: { type: 'S-300/400 (Surface-to-Air used as ground)', count: 3200, note: 'Repurposed air defense missiles' },
    shahed: { type: 'Shahed-136/131 Drones', count: 56000, note: 'RU-produced; ~5,000/month since mid-2025' },
    otherDrones: { type: 'Other UAVs (recon/strike)', count: 4000 },
    interceptRate: '~65-80%',
    source: 'UA Air Force / OSINT',
  },
  ukrainianStrikes: {
    totalDrones: 18000,
    longRange: { type: 'Long-range strike drones', count: 12000, note: 'Domestically produced (Beaver, Lyutyy, Palianytsia, etc.)' },
    navalUSV: { type: 'Naval USV attacks', count: 350, note: 'Sea Baby, MAGURA V5' },
    atacms: { type: 'ATACMS strikes', count: '~200', note: 'US-provided, 165-300km range' },
    stormShadow: { type: 'Storm Shadow/SCALP', count: '~100', note: 'UK/France provided' },
    neptune: { type: 'Neptune AShM', count: '~40', note: 'Sank Moskva, adapted for land targets' },
    source: 'UA MoD / OSINT',
  },
  asOf: 'February 2026',
};

// ─── Humanitarian / refugee data ───
export const HUMANITARIAN = {
  refugees: {
    total: 5860000,
    label: '~5.86 million',
    topCountries: [
      { country: 'Poland', count: 1400000 },
      { country: 'Germany', count: 1150000 },
      { country: 'Czech Republic', count: 370000 },
      { country: 'United Kingdom', count: 240000 },
      { country: 'Spain', count: 195000 },
      { country: 'Italy', count: 175000 },
    ],
    source: 'UNHCR (Dec 2025)',
  },
  internallyDisplaced: {
    total: 3700000,
    label: '~3.7 million',
    source: 'UNHCR / IOM (Dec 2025)',
  },
  infrastructureDamage: {
    housingUnits: 2500000,
    schools: 4200,
    hospitals: 1400,
    powerGrid: '~50% generation + 60% gas production offline (Oct 2025)',
    economicDamage: '$186 billion (World Bank est.)',
    reconstructionCost: '$524 billion (World Bank / EU est.)',
    source: 'World Bank / EU / KSE Institute',
  },
  grainCorridor: {
    status: 'Active (UA-enforced since Aug 2023)',
    totalExported: '~80 million tonnes (since Jul 2022)',
    note: 'Black Sea Grain Initiative expired Jul 2023; UA established own corridor',
    source: 'UA Infrastructure Ministry',
  },
  asOf: 'February 2026',
};

// ─── Sanctions & economic impact ───
export const SANCTIONS_ECONOMIC = {
  sanctions: {
    packages: '18 EU packages, 12+ US rounds',
    keyMeasures: [
      { measure: 'SWIFT disconnection', detail: '~10 major Russian banks' },
      { measure: 'Central Bank reserves frozen', detail: '~$300B of ~$640B total' },
      { measure: 'Oil price cap', detail: '$47.6/barrel (EU lowered Jul 2025)' },
      { measure: 'Technology export controls', detail: 'Semiconductors, precision equipment' },
      { measure: 'Oligarch asset freezes', detail: '~$58B in yachts, property, accounts' },
      { measure: 'Total restrictions', detail: '16,000+ on Russian entities (most sanctioned country)' },
    ],
    source: 'EU/US Treasury / Castellum.AI',
  },
  russianEconomy: {
    gdpGrowth2023: '+3.6%',
    gdpGrowth2024: '+3.8%',
    inflation2024: '~10%',
    keyRate: '~16%',
    rubleUSD: '~100',
    militarySpending: '~$169B (2025), ~$162B (2026 budget)',
    note: 'Stagnation in 2025-26; IMF forecasts 0.6-1.0% growth; labor shortages',
    source: 'CBR / IMF / Moscow Times',
  },
  westernAid: {
    totalPledged: '$450 billion+',
    topDonors: [
      { donor: 'United States', amount: '$128B (new aid halted 2025)' },
      { donor: 'EU Institutions', amount: '$110B+ (Team Europe: $178B total)' },
      { donor: 'Germany', amount: '$34B (largest EU military donor)' },
      { donor: 'United Kingdom', amount: '$22B' },
      { donor: 'Japan', amount: '$14B' },
      { donor: 'Canada', amount: '$9B' },
      { donor: 'Norway', amount: '$9B' },
      { donor: 'Denmark', amount: '$8.5B' },
    ],
    frozenAssetsLoan: '$50B G7 loan backed by frozen RU asset profits',
    source: 'Kiel Institute Ukraine Support Tracker',
  },
  asOf: 'February 2026',
};

// ─── War timeline (key events) ───
export const WAR_TIMELINE = [
  { date: '2022-02-24', event: 'Full-scale Russian invasion begins', phase: 'invasion' },
  { date: '2022-03-02', event: 'Siege of Mariupol begins', phase: 'invasion' },
  { date: '2022-04-02', event: 'Russia retreats from Kyiv / northern Ukraine', phase: 'turning' },
  { date: '2022-04-14', event: 'Moskva cruiser sunk by Neptune missiles', phase: 'turning' },
  { date: '2022-05-20', event: 'Mariupol falls after Azovstal siege', phase: 'invasion' },
  { date: '2022-06-01', event: 'HIMARS deliveries begin — transforms artillery war', phase: 'turning' },
  { date: '2022-09-06', event: 'Kharkiv counteroffensive begins — 6,000 km² liberated', phase: 'counteroffensive' },
  { date: '2022-10-08', event: 'Crimean Bridge struck for the first time', phase: 'counteroffensive' },
  { date: '2022-11-11', event: 'Kherson liberated — only regional capital retaken', phase: 'counteroffensive' },
  { date: '2022-12-01', event: 'Russia begins systematic energy infrastructure attacks', phase: 'attrition' },
  { date: '2023-01-01', event: 'Battle of Bakhmut intensifies — Wagner Group leads', phase: 'attrition' },
  { date: '2023-05-20', event: 'Bakhmut falls after 9-month battle', phase: 'attrition' },
  { date: '2023-06-04', event: 'Kakhovka Dam destroyed — massive flooding', phase: 'attrition' },
  { date: '2023-06-08', event: 'Ukrainian summer counteroffensive begins', phase: 'counteroffensive' },
  { date: '2023-07-17', event: 'Black Sea Grain Initiative expires', phase: 'attrition' },
  { date: '2023-09-13', event: 'UA strikes Sevastopol dry dock — damages RU submarine', phase: 'counteroffensive' },
  { date: '2024-02-08', event: 'Syrskyi replaces Zaluzhny as Commander-in-Chief', phase: 'attrition' },
  { date: '2024-02-17', event: 'Avdiivka falls after 4-month battle', phase: 'attrition' },
  { date: '2024-05-10', event: 'Russia launches Kharkiv offensive — creates buffer zone attempt', phase: 'attrition' },
  { date: '2024-06-01', event: 'F-16 deliveries begin from Denmark/Netherlands', phase: 'attrition' },
  { date: '2024-08-06', event: 'Ukraine launches Kursk incursion into Russia', phase: 'kursk' },
  { date: '2024-10-01', event: 'North Korean troops arrive in Russia (~12,000)', phase: 'attrition' },
  { date: '2024-10-15', event: 'Vuhledar falls after 20 months of fighting', phase: 'attrition' },
  { date: '2024-11-19', event: 'ATACMS & Storm Shadow authorized for deep strikes into Russia', phase: 'attrition' },
  { date: '2024-11-21', event: 'Russia fires Oreshnik hypersonic IRBM at Dnipro', phase: 'attrition' },
  { date: '2025-01-01', event: 'Russia 2025 budget: 40% military spending; war economy', phase: 'attrition' },
  { date: '2025-03-15', event: 'Russia recaptures Sudzha; UA Kursk incursion largely repelled', phase: 'attrition' },
  { date: '2025-04-20', event: 'Putin declares Easter ceasefire; UA reports attacks continue', phase: 'attrition' },
  { date: '2025-05-10', event: 'UA drone strikes reduce Russian refinery capacity by 17%', phase: 'attrition' },
  { date: '2025-06-01', event: 'Shahed production reaches ~170/day; drone war intensifies', phase: 'attrition' },
  { date: '2025-07-01', event: 'EU 18th sanctions package; oil price cap lowered to $47.6/bbl', phase: 'attrition' },
  { date: '2025-08-06', event: 'Ukraine tests Palianytsia cruise missile (3,000 km range)', phase: 'attrition' },
  { date: '2025-09-15', event: 'Largest single Russian aerial attack: 818 drones + missiles', phase: 'attrition' },
  { date: '2025-10-01', event: 'Russian strikes knock out 50% of Ukraine energy generation', phase: 'attrition' },
  { date: '2025-12-01', event: 'Oreshnik missile deployed to Belarus; enters combat duty', phase: 'attrition' },
  { date: '2026-01-01', event: 'Europe surpasses US in total Ukraine aid; US halts new funding', phase: 'attrition' },
  { date: '2026-01-15', event: 'Russia fires Oreshnik IRBM at Lviv', phase: 'attrition' },
  { date: '2026-02-01', event: 'Russia captures Myrnohrad and Huliaipole in Donetsk/Zaporizhzhia', phase: 'attrition' },
];


