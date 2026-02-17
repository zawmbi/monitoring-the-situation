/**
 * India-Pakistan Conflict Data (Operation Sindoor & Kashmir Crisis)
 * Based on publicly available OSINT and media sources.
 * Positions approximate as of early 2026.
 */

// Colors
export const IN_ORANGE = '#FF9933';
export const IN_GREEN = '#138808';
export const PK_GREEN = '#01411C';
export const PK_WHITE = '#ffffff';

export const CONFLICT_SUMMARY = {
  id: 'india-pakistan',
  name: 'India–Pakistan Crisis',
  started: '7 May 2025',
  startDate: new Date(2025, 4, 7),
  daysSince: () => {
    const start = new Date(2025, 4, 7);
    const now = new Date();
    return Math.floor((now - start) / (1000 * 60 * 60 * 24));
  },
  phase: 'Post-strike tensions / Cautious diplomacy / Drone incursion incidents',
  sideA: {
    name: 'India', shortName: 'IN', color: IN_ORANGE, flag: '🇮🇳',
    leader: 'PM Narendra Modi',
    description: 'Republic of India launched Operation Sindoor in response to the April 22 Pahalgam attack that killed 26 people. Strikes hit 9 targets in Pakistan-administered Kashmir and Pakistan proper — the most extensive Indian military action against Pakistan since 1971.',
    goals: 'Eliminate terrorist infrastructure, deter cross-border attacks, demonstrate resolve',
  },
  sideB: {
    name: 'Pakistan', shortName: 'PK', color: PK_GREEN, flag: '🇵🇰',
    leader: 'PM Shehbaz Sharif',
    description: 'Islamic Republic of Pakistan. Condemned strikes as violation of sovereignty. Raised alert level across military. Both countries possess nuclear weapons, making this the world\'s most dangerous active flashpoint between nuclear powers.',
    goals: 'Sovereignty defense, Kashmir self-determination support, nuclear deterrent credibility',
  },
  background: 'On April 22, 2025, militants killed 26 people including tourists in Pahalgam, Kashmir. India attributed the attack to Pakistan-based groups and launched Operation Sindoor on May 7 — drone and missile strikes on 9 targets. A December 2025 diplomatic handshake in Dhaka raised hopes, but India\'s army chief warned Pakistan over drone incursions in January 2026. CFR rates another confrontation as a Tier II risk for 2026.',
  internationalSupport: {
    sideA: 'United States (diplomatic support), France, Israel',
    sideB: 'China (diplomatic support), Turkey, OIC',
  },
};

export const CONTROL_ZONES = [
  {
    id: 'loc-kashmir',
    name: 'Line of Control (Kashmir)',
    side: 'contested',
    type: 'ceasefire-line',
    note: 'De facto border in disputed Kashmir; 740km of fortified positions',
    polygon: [
      [73.50, 34.80], [74.50, 34.80], [74.50, 34.20], [73.50, 34.20], [73.50, 34.80],
    ],
  },
  {
    id: 'balakot-targets',
    name: 'Strike Zone (Pakistan-side)',
    side: 'sideA',
    type: 'strike-target',
    note: 'Operation Sindoor targets in Azad Kashmir and KPK',
    polygon: [
      [73.20, 34.60], [73.70, 34.60], [73.70, 34.10], [73.20, 34.10], [73.20, 34.60],
    ],
  },
];

export const FRONTLINE_SEGMENTS = [
  {
    id: 'loc-main',
    label: 'Line of Control',
    asOf: '2026-02-01',
    status: 'tense',
    points: [
      [73.75, 34.90], [73.90, 34.70], [74.05, 34.50], [74.20, 34.30],
      [74.35, 34.10], [74.50, 33.90], [74.60, 33.70], [74.70, 33.50],
      [74.80, 33.30], [74.85, 33.10],
    ],
  },
];

export const TROOP_DEPLOYMENTS = [
  {
    id: 'india-northern-command',
    side: 'sideA',
    label: 'Indian Northern Command',
    type: 'ground',
    strength: '300,000+ troops',
    lat: 34.08, lon: 74.79,
    note: 'Largest military deployment along LoC; includes 3 corps',
  },
  {
    id: 'india-air-strikes',
    side: 'sideA',
    label: 'IAF Strike Package',
    type: 'air',
    strength: 'Rafale, Su-30MKI, MQ-9B drones',
    lat: 32.69, lon: 74.84,
    note: 'Operation Sindoor used precision-guided munitions and armed drones',
  },
  {
    id: 'pakistan-ssg',
    side: 'sideB',
    label: 'Pakistan SSG / Strategic Forces',
    type: 'ground',
    strength: 'Classified',
    lat: 33.60, lon: 73.05,
    note: 'Special Services Group and Strategic Plans Division on alert',
  },
  {
    id: 'pakistan-air',
    side: 'sideB',
    label: 'PAF Air Defense',
    type: 'air',
    strength: 'JF-17, F-16 squadrons',
    lat: 33.56, lon: 72.82,
    note: 'Deployed to maximum readiness after Indian strikes',
  },
];

export const CASUALTIES = {
  sideA: {
    killed: { total: 26, label: 'Pahalgam attack victims', source: 'Indian government' },
    wounded: { total: 0, label: 'No Indian military casualties reported from strikes', source: 'Indian MOD' },
  },
  sideB: {
    killed: { total: 31, label: 'Pakistani casualties from strikes', source: 'Pakistan military / media' },
    wounded: { total: 45, label: 'Pakistani wounded', source: 'Media estimates' },
    infrastructure: { destroyed: 9, label: 'Targets struck by Operation Sindoor' },
  },
};

export const EQUIPMENT = {
  sideA: [
    { name: 'Rafale', type: 'aircraft', count: 36, note: 'French multirole fighter' },
    { name: 'Su-30MKI', type: 'aircraft', count: 272, note: 'Air superiority fighter' },
    { name: 'MQ-9B SeaGuardian', type: 'drone', count: 31, note: 'Armed reconnaissance drone' },
    { name: 'BrahMos', type: 'missile', count: '200+', note: 'Supersonic cruise missile' },
    { name: 'S-400', type: 'air-defense', count: 5, note: 'Russian-supplied long-range SAM' },
  ],
  sideB: [
    { name: 'JF-17 Thunder', type: 'aircraft', count: 150, note: 'Sino-Pakistani multirole' },
    { name: 'F-16 Block 52+', type: 'aircraft', count: 76, note: 'US-supplied (pre-sanctions)' },
    { name: 'Shaheen-III', type: 'missile', count: 'Unknown', note: 'Nuclear-capable MRBM (2,750km)' },
    { name: 'Babur-3', type: 'missile', count: 'Unknown', note: 'Submarine-launched cruise missile' },
    { name: 'HQ-9/P', type: 'air-defense', count: 6, note: 'Chinese-supplied long-range SAM' },
  ],
};

export const COMMAND_STRUCTURE = {
  sideA: [
    { role: 'Supreme Commander', name: 'PM Narendra Modi', since: '2014' },
    { role: 'Defense Minister', name: 'Rajnath Singh', since: '2019' },
    { role: 'Chief of Defence Staff', name: 'Gen. Anil Chauhan', since: '2022' },
    { role: 'Army Chief', name: 'Gen. Upendra Dwivedi', since: '2024' },
    { role: 'Northern Command', name: 'Lt. Gen. M.V. Suchindra Kumar', since: '2024' },
  ],
  sideB: [
    { role: 'President', name: 'Asif Ali Zardari', since: '2024' },
    { role: 'Prime Minister', name: 'Shehbaz Sharif', since: '2024' },
    { role: 'Army Chief', name: 'Gen. Asim Munir', since: '2022' },
    { role: 'Air Chief', name: 'ACM Zaheer Ahmad Babar', since: '2024' },
    { role: 'Strategic Plans Div.', name: 'Lt. Gen. (classified)', since: 'N/A' },
  ],
};

export const KEY_EVENTS = [
  { date: '2025-04-22', event: 'Pahalgam attack kills 26 including tourists in Kashmir', severity: 5 },
  { date: '2025-05-07', event: 'India launches Operation Sindoor — strikes 9 targets in Pakistan/AJK', severity: 5 },
  { date: '2025-05-08', event: 'Pakistan condemns strikes as act of war; raises nuclear alert level', severity: 5 },
  { date: '2025-05-09', event: 'International diplomatic intervention prevents further escalation', severity: 4 },
  { date: '2025-05-15', event: 'India presents evidence to UN linking attack to Pakistan-based groups', severity: 3 },
  { date: '2025-12-15', event: 'India-Pakistan handshake at Dhaka conference raises diplomatic hopes', severity: 2 },
  { date: '2026-01-10', event: 'Indian Army chief warns Pakistan over drone incursions along LoC', severity: 3 },
  { date: '2026-02-01', event: 'CFR rates India-Pakistan confrontation as Tier II risk for 2026', severity: 3 },
];
