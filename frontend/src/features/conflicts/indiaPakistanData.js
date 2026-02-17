/**
 * India-Pakistan Conflict Data (Operation Sindoor & Kashmir Crisis)
 * Based on publicly available OSINT and media sources.
 * Positions approximate as of early 2026.
 *
 * Data shape matches GenericConflictPanel expectations.
 */

// Colors
export const IN_ORANGE = '#FF9933';
export const IN_GREEN = '#138808';
export const PK_GREEN = '#01411C';
export const PK_WHITE = '#ffffff';

export const CONFLICT_SUMMARY = {
  id: 'india-pakistan',
  name: 'India\u2013Pakistan Crisis',
  started: '7 May 2025',
  startDate: new Date(2025, 4, 7),
  daysSince: () => {
    const start = new Date(2025, 4, 7);
    const now = new Date();
    return Math.floor((now - start) / (1000 * 60 * 60 * 24));
  },
  phase: 'Post-strike tensions / Cautious diplomacy / Drone incursion incidents',
  sideA: {
    name: 'India', shortName: 'IN', color: IN_ORANGE, flag: '\uD83C\uDDEE\uD83C\uDDF3',
    leader: 'PM Narendra Modi',
    description: 'Republic of India launched Operation Sindoor in response to the April 22 Pahalgam attack that killed 26 people. Strikes hit 9 targets in Pakistan-administered Kashmir and Pakistan proper \u2014 the most extensive Indian military action against Pakistan since 1971.',
    goals: 'Eliminate terrorist infrastructure, deter cross-border attacks, demonstrate resolve',
  },
  sideB: {
    name: 'Pakistan', shortName: 'PK', color: PK_GREEN, flag: '\uD83C\uDDF5\uD83C\uDDF0',
    leader: 'PM Shehbaz Sharif',
    description: 'Islamic Republic of Pakistan. Condemned strikes as violation of sovereignty. Raised alert level across military. Both countries possess nuclear weapons, making this the world\'s most dangerous active flashpoint between nuclear powers.',
    goals: 'Sovereignty defense, Kashmir self-determination support, nuclear deterrent credibility',
  },
  background: 'On April 22, 2025, militants killed 26 people including tourists in Pahalgam, Kashmir. India attributed the attack to Pakistan-based groups and launched Operation Sindoor on May 7 \u2014 drone and missile strikes on 9 targets. A December 2025 diplomatic handshake in Dhaka raised hopes, but India\'s army chief warned Pakistan over drone incursions in January 2026. CFR rates another confrontation as a Tier II risk for 2026.',
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
    killed: { low: 0, high: 0, label: 'No Indian military casualties reported from strikes' },
    civilian: { killed: 26, label: '26 killed in Pahalgam terrorist attack (Apr 22)' },
    source: 'Indian MOD / media',
  },
  sideB: {
    killed: { low: 25, high: 40, label: '~31 Pakistani casualties from strikes' },
    wounded: { low: 35, high: 55, label: '~45 Pakistani wounded' },
    source: 'Pakistan military / media estimates',
  },
  civilian: {
    killed: { low: 26, high: 26, label: '26 killed in Pahalgam attack (trigger event)' },
    note: 'Indian strikes targeted militant infrastructure; Pakistan claims some civilian casualties.',
    source: 'Indian/Pakistani government statements / media',
  },
  asOf: 'February 2026',
};

export const EQUIPMENT = {
  sideA: {
    deployed: [
      { type: 'Rafale', count: 36, note: 'French multirole fighter' },
      { type: 'Su-30MKI', count: 272, note: 'Air superiority fighter' },
      { type: 'MQ-9B SeaGuardian', count: 31, note: 'Armed reconnaissance drone' },
      { type: 'BrahMos', count: '200+', note: 'Supersonic cruise missile' },
      { type: 'S-400', count: 5, note: 'Russian-supplied long-range SAM' },
    ],
    source: 'Indian MOD / IISS / OSINT',
  },
  sideB: {
    deployed: [
      { type: 'JF-17 Thunder', count: 150, note: 'Sino-Pakistani multirole' },
      { type: 'F-16 Block 52+', count: 76, note: 'US-supplied (pre-sanctions)' },
      { type: 'Shaheen-III MRBM', count: 'Unknown', note: 'Nuclear-capable (2,750km range)' },
      { type: 'Babur-3 SLCM', count: 'Unknown', note: 'Submarine-launched cruise missile' },
      { type: 'HQ-9/P SAM', count: 6, note: 'Chinese-supplied long-range SAM' },
    ],
    source: 'Pakistan military / IISS / OSINT',
  },
  asOf: 'February 2026',
};

export const COMMAND = {
  sideA: {
    title: 'Indian Armed Forces',
    keyCommanders: [
      { name: 'Narendra Modi', role: 'Prime Minister / Supreme Commander' },
      { name: 'Rajnath Singh', role: 'Defense Minister' },
      { name: 'Gen. Anil Chauhan', role: 'Chief of Defence Staff' },
      { name: 'Gen. Upendra Dwivedi', role: 'Army Chief' },
      { name: 'Lt. Gen. M.V. Suchindra Kumar', role: 'Northern Command' },
    ],
    totalPersonnel: '~1.45 million active + 1.16 million reserve',
  },
  sideB: {
    title: 'Pakistan Armed Forces',
    keyCommanders: [
      { name: 'Asif Ali Zardari', role: 'President' },
      { name: 'Shehbaz Sharif', role: 'Prime Minister' },
      { name: 'Gen. Asim Munir', role: 'Army Chief (COAS)' },
      { name: 'ACM Zaheer Ahmad Babar', role: 'Air Chief Marshal' },
      { name: 'Lt. Gen. (classified)', role: 'Strategic Plans Division' },
    ],
    totalPersonnel: '~654,000 active + 550,000 reserve',
  },
};

export const WAR_TIMELINE = [
  { date: '2025-04-22', event: 'Pahalgam attack kills 26 including tourists in Kashmir', severity: 5, phase: 'war' },
  { date: '2025-05-07', event: 'India launches Operation Sindoor \u2014 strikes 9 targets in Pakistan/AJK', severity: 5, phase: 'escalation' },
  { date: '2025-05-08', event: 'Pakistan condemns strikes as act of war; raises nuclear alert level', severity: 5, phase: 'escalation' },
  { date: '2025-05-09', event: 'International diplomatic intervention prevents further escalation', severity: 4, phase: 'diplomatic' },
  { date: '2025-05-15', event: 'India presents evidence to UN linking attack to Pakistan-based groups', severity: 3, phase: 'diplomatic' },
  { date: '2025-12-15', event: 'India-Pakistan handshake at Dhaka conference raises diplomatic hopes', severity: 2, phase: 'diplomatic' },
  { date: '2026-01-10', event: 'Indian Army chief warns Pakistan over drone incursions along LoC', severity: 3, phase: 'escalation' },
  { date: '2026-02-01', event: 'CFR rates India-Pakistan confrontation as Tier II risk for 2026', severity: 3, phase: 'diplomatic' },
];

export const HUMANITARIAN = {
  internallyDisplaced: {
    total: 50000,
    label: '~50,000 displaced along LoC following strikes',
    note: 'Both sides evacuated border villages; most returned within weeks',
    source: 'OCHA / Indian/Pakistani media',
  },
  infrastructureDamage: {
    targetsStruck: '9 militant infrastructure targets in Pakistan/AJK',
    civilianDamage: 'Pakistan claims collateral damage to civilian areas near strike sites',
    source: 'Indian MOD / Pakistan government statements',
  },
  asOf: 'February 2026',
};

export const TERRITORIAL_CONTROL = {
  lineOfControl: '740km fortified ceasefire line dividing Kashmir; unchanged since 2003',
  indianKashmir: 'India controls Jammu & Kashmir (UT status since 2019)',
  pakistanKashmir: 'Pakistan controls Azad Kashmir and Gilgit-Baltistan',
  strikeImpact: 'Indian strikes hit targets in AJK and KPK but no territorial change',
  nuclearDimension: 'Both states possess 150-170 nuclear warheads each; LoC is world\'s most militarized nuclear border',
  asOf: 'February 2026',
  source: 'IISS / FAS / CFR',
};

export const BATTLE_SITES = [
  {
    id: 'pahalgam-attack',
    name: 'Pahalgam Terrorist Attack',
    lat: 34.01, lon: 75.32,
    date: '22 Apr 2025',
    result: 'Terrorist attack on civilians',
    note: 'Militants killed 26 people including tourists in Pahalgam, Kashmir \u2014 trigger event for Operation Sindoor',
    sideACommander: 'N/A (civilian target)',
    sideBCommander: 'Pakistan-based militant group',
    sideATroops: 'Civilians',
    sideBTroops: 'Unknown number of militants',
    sideAEquipment: 'N/A',
    sideBEquipment: 'Small arms',
    sideACasualties: '26 killed',
    sideBCasualties: 'Militants killed in subsequent encounter',
    significance: 'Deadliest attack on tourists in Kashmir; directly triggered Indian military response',
  },
  {
    id: 'op-sindoor',
    name: 'Operation Sindoor',
    lat: 34.35, lon: 73.45,
    date: '7 May 2025',
    result: 'Indian tactical success',
    note: 'India struck 9 targets in Pakistan-administered Kashmir and Pakistan proper using drones and missiles',
    sideACommander: 'IAF / Northern Command',
    sideBCommander: 'Pakistan Air Force / SSG',
    sideATroops: 'Rafale, Su-30MKI, MQ-9B armed drones',
    sideBTroops: 'JF-17, F-16 interceptors scrambled',
    sideAEquipment: 'Precision-guided munitions, armed drones',
    sideBEquipment: 'Air defense systems',
    sideACasualties: 'No Indian military casualties reported',
    sideBCasualties: '~31 killed, 45 wounded',
    significance: 'Most extensive Indian military action against Pakistan since 1971; crossed sovereignty red line',
  },
];

export const INTERNATIONAL_RESPONSE = {
  usPosition: 'US offered diplomatic support to India; urged restraint from both sides',
  chinaPosition: 'China called for dialogue; provided diplomatic backing to Pakistan',
  unResponse: 'India presented evidence to UN linking Pahalgam attack to Pakistan-based groups',
  cfrAssessment: 'CFR rates India-Pakistan confrontation as Tier II risk for 2026',
  diplomaticProgress: 'India-Pakistan handshake at Dhaka conference (Dec 2025) raised cautious hopes',
  trumpTariffs: 'US imposed 50% tariffs on India (later reduced to 18%), adding economic friction',
  asOf: 'February 2026',
};
