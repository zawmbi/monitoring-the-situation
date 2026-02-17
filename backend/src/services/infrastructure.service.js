/**
 * Infrastructure Vulnerability Monitoring Service
 * Monitors critical global infrastructure for threats, disruptions, and vulnerabilities.
 * Sources: GDELT Project for news/threat intelligence, static infrastructure database
 */

import { cacheService } from './cache.service.js';
import { fetchGDELTRaw } from './gdelt.client.js';

const CACHE_TTL = 900; // 15 minutes
const GDELT_BASE = 'https://api.gdeltproject.org/api/v2/doc/doc';

/* ────────────────────────────────────────────────────────────────────────────
 * CRITICAL INFRASTRUCTURE DATABASE
 * Static registry of globally significant infrastructure assets.
 * Each entry includes geolocation, strategic importance rating, and metadata.
 * ──────────────────────────────────────────────────────────────────────────── */

const CRITICAL_INFRASTRUCTURE = [
  // ── Energy Infrastructure ──────────────────────────────────────────────
  {
    id: 'infra-energy-hormuz',
    name: 'Strait of Hormuz Oil Transit',
    category: 'energy',
    subcategory: 'oil_transit',
    location: { lat: 26.5667, lon: 56.25 },
    countries: ['IR', 'OM', 'AE'],
    importance: 10,
    description: 'Critical chokepoint handling ~21% of global petroleum consumption. Connects Persian Gulf oil producers to global markets.',
  },
  {
    id: 'infra-energy-nordstream',
    name: 'Nord Stream Pipeline System',
    category: 'energy',
    subcategory: 'pipeline',
    location: { lat: 54.5, lon: 13.5 },
    countries: ['RU', 'DE', 'DK', 'SE', 'FI'],
    importance: 8,
    description: 'Major natural gas pipeline system from Russia to Germany via the Baltic Sea. Subject to sabotage in 2022.',
  },
  {
    id: 'infra-energy-opec-ghawar',
    name: 'Ghawar Oil Field (OPEC)',
    category: 'energy',
    subcategory: 'oil_production',
    location: { lat: 25.4, lon: 49.4 },
    countries: ['SA'],
    importance: 9,
    description: 'Largest conventional oil field in the world, producing approximately 3.8 million barrels per day.',
  },
  {
    id: 'infra-energy-suez',
    name: 'Suez Canal Energy Transit',
    category: 'energy',
    subcategory: 'oil_transit',
    location: { lat: 30.4583, lon: 32.3498 },
    countries: ['EG'],
    importance: 9,
    description: 'Vital waterway connecting Mediterranean and Red Sea. Handles ~12% of global trade and significant oil/LNG shipments.',
  },
  {
    id: 'infra-energy-panama',
    name: 'Panama Canal Energy Transit',
    category: 'energy',
    subcategory: 'oil_transit',
    location: { lat: 9.08, lon: -79.68 },
    countries: ['PA'],
    importance: 8,
    description: 'Key transit route for LNG and petroleum products between Atlantic and Pacific. Increasingly affected by drought.',
  },
  {
    id: 'infra-energy-abqaiq',
    name: 'Abqaiq Processing Facility',
    category: 'energy',
    subcategory: 'oil_production',
    location: { lat: 25.9394, lon: 49.6814 },
    countries: ['SA'],
    importance: 9,
    description: 'World largest oil processing facility. Attacked by drones in 2019, briefly halving Saudi output.',
  },
  {
    id: 'infra-energy-druzhba',
    name: 'Druzhba Pipeline',
    category: 'energy',
    subcategory: 'pipeline',
    location: { lat: 52.0, lon: 30.0 },
    countries: ['RU', 'BY', 'UA', 'PL', 'DE', 'CZ', 'SK', 'HU'],
    importance: 7,
    description: 'One of the longest oil pipeline networks in the world, supplying crude oil from Russia to Central Europe.',
  },

  // ── Digital Infrastructure ─────────────────────────────────────────────
  {
    id: 'infra-digital-flag',
    name: 'FLAG Submarine Cable',
    category: 'digital',
    subcategory: 'submarine_cable',
    location: { lat: 25.0, lon: 55.0 },
    countries: ['GB', 'EG', 'AE', 'IN', 'JP'],
    importance: 8,
    description: 'Fiber-Optic Link Around the Globe. 28,000km cable connecting UK to Japan via the Middle East and India.',
  },
  {
    id: 'infra-digital-seamewe',
    name: 'SEA-ME-WE Submarine Cables',
    category: 'digital',
    subcategory: 'submarine_cable',
    location: { lat: 12.0, lon: 75.0 },
    countries: ['FR', 'EG', 'SA', 'IN', 'SG', 'MY', 'ID', 'AU', 'JP'],
    importance: 9,
    description: 'South East Asia-Middle East-Western Europe cable system. Critical backbone carrying vast data traffic.',
  },
  {
    id: 'infra-digital-tat14',
    name: 'TAT-14 Transatlantic Cable',
    category: 'digital',
    subcategory: 'submarine_cable',
    location: { lat: 50.0, lon: -20.0 },
    countries: ['US', 'GB', 'FR', 'DE', 'DK', 'NL'],
    importance: 7,
    description: 'Transatlantic telecommunications cable connecting US to Europe. Part of critical cross-Atlantic backbone.',
  },
  {
    id: 'infra-digital-peace',
    name: 'PEACE Submarine Cable',
    category: 'digital',
    subcategory: 'submarine_cable',
    location: { lat: 30.0, lon: 50.0 },
    countries: ['PK', 'KE', 'EG', 'FR', 'SG', 'CN'],
    importance: 7,
    description: 'Pakistan and East Africa Connecting Europe cable. 15,000km system connecting Asia, Africa, and Europe.',
  },
  {
    id: 'infra-digital-decix',
    name: 'DE-CIX Frankfurt Internet Exchange',
    category: 'digital',
    subcategory: 'internet_exchange',
    location: { lat: 50.1109, lon: 8.6821 },
    countries: ['DE'],
    importance: 9,
    description: 'World largest internet exchange point by peak traffic, handling over 14 Tbps. Central European internet hub.',
  },
  {
    id: 'infra-digital-amsix',
    name: 'AMS-IX Amsterdam Internet Exchange',
    category: 'digital',
    subcategory: 'internet_exchange',
    location: { lat: 52.3676, lon: 4.9041 },
    countries: ['NL'],
    importance: 8,
    description: 'One of the largest internet exchange points globally. Critical node for European internet traffic.',
  },
  {
    id: 'infra-digital-linx',
    name: 'LINX London Internet Exchange',
    category: 'digital',
    subcategory: 'internet_exchange',
    location: { lat: 51.5074, lon: -0.1278 },
    countries: ['GB'],
    importance: 8,
    description: 'Major internet exchange point in London. Connects over 950 member networks worldwide.',
  },

  // ── Transport Infrastructure ───────────────────────────────────────────
  {
    id: 'infra-transport-malacca',
    name: 'Strait of Malacca',
    category: 'transport',
    subcategory: 'shipping_lane',
    location: { lat: 2.5, lon: 101.0 },
    countries: ['MY', 'SG', 'ID'],
    importance: 10,
    description: 'Busiest shipping lane in the world. Connects Indian and Pacific Oceans, handling ~25% of global sea trade.',
  },
  {
    id: 'infra-transport-mandeb',
    name: 'Bab el-Mandeb Strait',
    category: 'transport',
    subcategory: 'shipping_lane',
    location: { lat: 12.5833, lon: 43.3333 },
    countries: ['YE', 'DJ', 'ER'],
    importance: 9,
    description: 'Strategic chokepoint between Red Sea and Gulf of Aden. Heavily disrupted by Houthi attacks since 2023.',
  },
  {
    id: 'infra-transport-gibraltar',
    name: 'Strait of Gibraltar',
    category: 'transport',
    subcategory: 'shipping_lane',
    location: { lat: 35.9667, lon: -5.5 },
    countries: ['ES', 'MA', 'GB'],
    importance: 8,
    description: 'Narrow strait connecting Mediterranean Sea to Atlantic Ocean. Major shipping and naval transit point.',
  },
  {
    id: 'infra-transport-dover',
    name: 'Dover Strait Shipping Lane',
    category: 'transport',
    subcategory: 'shipping_lane',
    location: { lat: 51.0, lon: 1.5 },
    countries: ['GB', 'FR'],
    importance: 7,
    description: 'One of the busiest shipping lanes in the world. Over 500 vessels transit daily through English Channel.',
  },
  {
    id: 'infra-transport-suez-canal',
    name: 'Suez Canal Waterway',
    category: 'transport',
    subcategory: 'canal',
    location: { lat: 30.7, lon: 32.3 },
    countries: ['EG'],
    importance: 10,
    description: 'Artificial sea-level waterway connecting Mediterranean and Red Sea. ~12% of global trade transits here.',
  },
  {
    id: 'infra-transport-panama-canal',
    name: 'Panama Canal Waterway',
    category: 'transport',
    subcategory: 'canal',
    location: { lat: 9.1, lon: -79.7 },
    countries: ['PA'],
    importance: 9,
    description: 'Connects Atlantic and Pacific Oceans. Handles ~5% of global maritime trade. Water levels critical concern.',
  },

  // ── Financial Infrastructure ───────────────────────────────────────────
  {
    id: 'infra-financial-swift',
    name: 'SWIFT Interbank Network',
    category: 'financial',
    subcategory: 'payment_system',
    location: { lat: 50.7217, lon: 4.3997 },
    countries: ['BE'],
    importance: 10,
    description: 'Global financial messaging network connecting 11,000+ institutions in 200+ countries. Headquartered in Belgium.',
  },
  {
    id: 'infra-financial-nyse',
    name: 'New York Stock Exchange',
    category: 'financial',
    subcategory: 'stock_exchange',
    location: { lat: 40.7069, lon: -74.0113 },
    countries: ['US'],
    importance: 10,
    description: 'Largest stock exchange by market capitalization (~$25 trillion). Central to global equities markets.',
  },
  {
    id: 'infra-financial-lse',
    name: 'London Stock Exchange',
    category: 'financial',
    subcategory: 'stock_exchange',
    location: { lat: 51.5155, lon: -0.0922 },
    countries: ['GB'],
    importance: 8,
    description: 'One of the oldest and largest stock exchanges in Europe. Key financial market for global investors.',
  },
  {
    id: 'infra-financial-hkex',
    name: 'Hong Kong Stock Exchange',
    category: 'financial',
    subcategory: 'stock_exchange',
    location: { lat: 22.2855, lon: 114.1577 },
    countries: ['HK', 'CN'],
    importance: 8,
    description: 'Major Asian financial hub and gateway for Chinese capital markets. Third largest in Asia by market cap.',
  },
  {
    id: 'infra-financial-ecb',
    name: 'European Central Bank',
    category: 'financial',
    subcategory: 'central_bank',
    location: { lat: 50.1092, lon: 8.6724 },
    countries: ['DE'],
    importance: 9,
    description: 'Central bank for the eurozone, managing monetary policy for 20 EU member states using the euro.',
  },
  {
    id: 'infra-financial-fed',
    name: 'US Federal Reserve System',
    category: 'financial',
    subcategory: 'central_bank',
    location: { lat: 38.8927, lon: -77.0461 },
    countries: ['US'],
    importance: 10,
    description: 'Central banking system of the United States. Sets monetary policy affecting global financial markets.',
  },
  {
    id: 'infra-financial-pboc',
    name: 'People\'s Bank of China',
    category: 'financial',
    subcategory: 'central_bank',
    location: { lat: 39.9042, lon: 116.4074 },
    countries: ['CN'],
    importance: 9,
    description: 'Central bank of China. Manages the world second-largest economy monetary policy and yuan exchange rate.',
  },

  // ── Food & Water Infrastructure ────────────────────────────────────────
  {
    id: 'infra-food-nile',
    name: 'Nile River Basin',
    category: 'food_water',
    subcategory: 'water_system',
    location: { lat: 15.5, lon: 32.5 },
    countries: ['EG', 'SD', 'SS', 'ET', 'UG', 'KE', 'TZ', 'RW', 'BI', 'CD'],
    importance: 9,
    description: 'Longest river in Africa, sustaining 300M+ people. GERD dam dispute between Egypt, Sudan, and Ethiopia.',
  },
  {
    id: 'infra-food-mekong',
    name: 'Mekong River Basin',
    category: 'food_water',
    subcategory: 'water_system',
    location: { lat: 15.0, lon: 105.0 },
    countries: ['CN', 'MM', 'LA', 'TH', 'KH', 'VN'],
    importance: 8,
    description: 'Supports 60M+ people dependent on fishing and agriculture. Chinese dams upstream cause downstream tensions.',
  },
  {
    id: 'infra-food-grain-blacksea',
    name: 'Black Sea Grain Corridor',
    category: 'food_water',
    subcategory: 'grain_corridor',
    location: { lat: 44.0, lon: 33.0 },
    countries: ['UA', 'RU', 'TR', 'RO', 'BG'],
    importance: 9,
    description: 'Critical grain export route for Ukrainian and Russian wheat, corn, and sunflower oil to global markets.',
  },
  {
    id: 'infra-food-grain-usguld',
    name: 'US Gulf Grain Export Corridor',
    category: 'food_water',
    subcategory: 'grain_corridor',
    location: { lat: 29.5, lon: -89.5 },
    countries: ['US'],
    importance: 8,
    description: 'Mississippi River grain export infrastructure serving as the primary US agricultural export gateway.',
  },
  {
    id: 'infra-food-indus',
    name: 'Indus River Water System',
    category: 'food_water',
    subcategory: 'water_system',
    location: { lat: 28.0, lon: 69.0 },
    countries: ['PK', 'IN', 'CN'],
    importance: 8,
    description: 'Sustains agriculture for 300M+ people across Pakistan and India. Subject to Indus Waters Treaty disputes.',
  },
];

/* ────────────────────────────────────────────────────────────────────────────
 * HELPER UTILITIES
 * ──────────────────────────────────────────────────────────────────────────── */

/**
 * Build a GDELT API query URL with standard parameters.
 * @param {string} queryTerms - Raw search terms (will be URI-encoded)
 * @param {object} opts - Optional overrides: maxrecords, timespan, mode
 * @returns {string} Fully formed GDELT API URL
 */
function buildGdeltUrl(queryTerms, opts = {}) {
  const {
    maxrecords = 50,
    timespan = '7d',
    mode = 'artlist',
    format = 'json',
  } = opts;
  const encoded = encodeURIComponent(queryTerms);
  return `${GDELT_BASE}?query=${encoded}&mode=${mode}&maxrecords=${maxrecords}&format=${format}&timespan=${timespan}`;
}

/**
 * Safely fetch JSON from a URL with timeout.
 * @param {string} url - URL to fetch
 * @returns {object|null} Parsed JSON or null on failure
 */
async function safeFetchJson(url) {
  // Route GDELT URLs through shared rate-limited client
  if (url.includes('gdeltproject.org')) {
    try {
      const data = await fetchGDELTRaw(url, 'Infrastructure');
      return data && Object.keys(data).length > 0 ? data : null;
    } catch {
      return null;
    }
  }
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('[Infrastructure] Fetch error:', err.message);
    return null;
  }
}

/**
 * Normalize a GDELT article tone value to a 0-10 severity score.
 * More negative tone = higher severity.
 * @param {number} tone - GDELT average tone (-100 to 100, typically -10 to 10)
 * @returns {number} Severity score 0-10
 */
function toneToSeverity(tone) {
  if (typeof tone !== 'number') return 5;
  // GDELT tone: negative = bad news. Map -10..0 to 10..5, 0..10 to 5..0
  const clamped = Math.max(-10, Math.min(10, tone));
  return Math.round(((clamped * -1) + 10) / 2);
}

/**
 * Generate a deterministic short ID from a string.
 * @param {string} input - Input string
 * @returns {string} Base64-derived short hash
 */
function shortId(input) {
  return Buffer.from(input || '').toString('base64').slice(0, 20);
}

/**
 * Match a GDELT article to known infrastructure items based on keyword overlap.
 * @param {object} article - GDELT article object
 * @param {Array} infraList - List of infrastructure items
 * @returns {Array} Matched infrastructure IDs
 */
function matchArticleToInfrastructure(article, infraList) {
  const text = `${article.title || ''} ${article.seendate || ''}`.toLowerCase();
  const matched = [];

  for (const infra of infraList) {
    const keywords = infra.name.toLowerCase().split(/\s+/);
    const descWords = infra.description.toLowerCase().split(/\s+/).filter(w => w.length > 4);
    const allKeywords = [...keywords, ...descWords.slice(0, 5)];
    const matchCount = allKeywords.filter(kw => text.includes(kw)).length;

    if (matchCount >= 2) {
      matched.push(infra.id);
    }
  }

  return matched;
}

/**
 * Categorize a threat by region based on article metadata.
 * @param {object} article - GDELT article
 * @returns {string} Region label
 */
function categorizeRegion(article) {
  const country = (article.sourcecountry || '').toLowerCase();
  const regionMap = {
    'united states': 'North America',
    'canada': 'North America',
    'mexico': 'North America',
    'united kingdom': 'Europe',
    'germany': 'Europe',
    'france': 'Europe',
    'russia': 'Europe/Asia',
    'china': 'Asia',
    'japan': 'Asia',
    'india': 'Asia',
    'australia': 'Oceania',
    'brazil': 'South America',
    'nigeria': 'Africa',
    'south africa': 'Africa',
    'egypt': 'Middle East/Africa',
    'saudi arabia': 'Middle East',
    'iran': 'Middle East',
    'turkey': 'Middle East/Europe',
  };

  for (const [key, region] of Object.entries(regionMap)) {
    if (country.includes(key)) return region;
  }
  return 'Global';
}

/* ────────────────────────────────────────────────────────────────────────────
 * INFRASTRUCTURE SERVICE CLASS
 * ──────────────────────────────────────────────────────────────────────────── */

class InfrastructureService {
  constructor() {
    this.infrastructure = CRITICAL_INFRASTRUCTURE;
    this.cacheKeys = {
      combined: 'infrastructure:combined',
      threats: 'infrastructure:threats',
      cables: 'infrastructure:cables',
      energy: 'infrastructure:energy',
      scores: 'infrastructure:scores',
    };
  }

  /**
   * Get the static infrastructure registry.
   * @returns {Array} All critical infrastructure items
   */
  getInfrastructureRegistry() {
    return this.infrastructure;
  }

  /**
   * Fetch infrastructure threat signals from GDELT.
   * Searches for articles related to infrastructure attacks, sabotage, and disruptions,
   * then maps detected threats to known infrastructure assets.
   * @returns {Array} Threat objects with severity, matched infrastructure, and metadata
   */
  async fetchInfrastructureThreats() {
    const cacheKey = this.cacheKeys.threats;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const query = 'infrastructure attack OR infrastructure sabotage OR infrastructure disruption OR infrastructure outage OR critical infrastructure threat';
    const url = buildGdeltUrl(query, { maxrecords: 75, timespan: '7d' });
    const data = await safeFetchJson(url);

    if (!data || !data.articles) {
      return [];
    }

    const threats = data.articles.map(article => {
      const matchedInfra = matchArticleToInfrastructure(article, this.infrastructure);
      const tone = typeof article.tone === 'string'
        ? parseFloat(article.tone.split(',')[0])
        : (typeof article.tone === 'number' ? article.tone : 0);
      const severity = toneToSeverity(tone);

      return {
        id: `threat-${shortId(article.url)}`,
        title: article.title,
        url: article.url,
        source: article.domain || 'Unknown',
        sourceCountry: article.sourcecountry || 'Unknown',
        date: article.seendate || null,
        language: article.language || 'English',
        tone: tone,
        severity: severity,
        severityLabel: severity >= 8 ? 'critical' : severity >= 6 ? 'high' : severity >= 4 ? 'moderate' : 'low',
        region: categorizeRegion(article),
        matchedInfrastructure: matchedInfra,
        isDirectMatch: matchedInfra.length > 0,
      };
    });

    // Sort by severity descending, then by date
    const sorted = threats
      .sort((a, b) => b.severity - a.severity || new Date(b.date) - new Date(a.date))
      .slice(0, 50);

    await cacheService.set(cacheKey, sorted, CACHE_TTL);
    return sorted;
  }

  /**
   * Monitor submarine cable status via GDELT news.
   * Searches for reports of cable cuts, damage, or disruption events.
   * @returns {Array} Cable alert objects with severity and affected cable info
   */
  async fetchSubmarineCableStatus() {
    const cacheKey = this.cacheKeys.cables;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const query = 'submarine cable cut OR submarine cable damaged OR submarine cable severed OR undersea cable fault OR internet cable disruption';
    const url = buildGdeltUrl(query, { maxrecords: 30, timespan: '14d' });
    const data = await safeFetchJson(url);

    if (!data || !data.articles) {
      return [];
    }

    const cableInfra = this.infrastructure.filter(i => i.subcategory === 'submarine_cable');

    const alerts = data.articles.map(article => {
      const matchedCables = matchArticleToInfrastructure(article, cableInfra);
      const tone = typeof article.tone === 'string'
        ? parseFloat(article.tone.split(',')[0])
        : (typeof article.tone === 'number' ? article.tone : 0);

      return {
        id: `cable-${shortId(article.url)}`,
        title: article.title,
        url: article.url,
        source: article.domain || 'Unknown',
        date: article.seendate || null,
        tone: tone,
        severity: toneToSeverity(tone),
        affectedCables: matchedCables,
        region: categorizeRegion(article),
        type: 'cable_alert',
      };
    });

    const sorted = alerts
      .sort((a, b) => b.severity - a.severity)
      .slice(0, 20);

    await cacheService.set(cacheKey, sorted, CACHE_TTL);
    return sorted;
  }

  /**
   * Monitor energy infrastructure via GDELT news.
   * Tracks pipeline explosions, facility attacks, power grid failures, and blackouts.
   * @returns {Array} Energy alert objects categorized by region and severity
   */
  async fetchEnergyInfrastructure() {
    const cacheKey = this.cacheKeys.energy;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const query = 'pipeline explosion OR oil facility attack OR power grid failure OR blackout OR energy infrastructure sabotage OR refinery fire';
    const url = buildGdeltUrl(query, { maxrecords: 50, timespan: '7d' });
    const data = await safeFetchJson(url);

    if (!data || !data.articles) {
      return [];
    }

    const energyInfra = this.infrastructure.filter(i => i.category === 'energy');

    const alerts = data.articles.map(article => {
      const matchedEnergy = matchArticleToInfrastructure(article, energyInfra);
      const tone = typeof article.tone === 'string'
        ? parseFloat(article.tone.split(',')[0])
        : (typeof article.tone === 'number' ? article.tone : 0);
      const severity = toneToSeverity(tone);

      let subtype = 'general';
      const titleLower = (article.title || '').toLowerCase();
      if (titleLower.includes('pipeline') || titleLower.includes('gas')) subtype = 'pipeline';
      else if (titleLower.includes('blackout') || titleLower.includes('power grid') || titleLower.includes('outage')) subtype = 'grid';
      else if (titleLower.includes('oil') || titleLower.includes('refinery')) subtype = 'oil_facility';
      else if (titleLower.includes('nuclear') || titleLower.includes('reactor')) subtype = 'nuclear';

      return {
        id: `energy-${shortId(article.url)}`,
        title: article.title,
        url: article.url,
        source: article.domain || 'Unknown',
        date: article.seendate || null,
        tone: tone,
        severity: severity,
        severityLabel: severity >= 8 ? 'critical' : severity >= 6 ? 'high' : severity >= 4 ? 'moderate' : 'low',
        subtype: subtype,
        region: categorizeRegion(article),
        matchedInfrastructure: matchedEnergy,
        type: 'energy_alert',
      };
    });

    const sorted = alerts
      .sort((a, b) => b.severity - a.severity)
      .slice(0, 30);

    await cacheService.set(cacheKey, sorted, CACHE_TTL);
    return sorted;
  }

  /**
   * Compute vulnerability scores for each infrastructure item.
   * Combines base importance, GDELT threat volume, tone analysis,
   * and geographic instability signals into a composite vulnerability score.
   * @param {Array} threats - Threat objects from fetchInfrastructureThreats
   * @param {Array} cableAlerts - Cable alerts from fetchSubmarineCableStatus
   * @param {Array} energyAlerts - Energy alerts from fetchEnergyInfrastructure
   * @returns {Array} Infrastructure items with computed vulnerability scores, sorted by score
   */
  computeVulnerabilityScores(threats = [], cableAlerts = [], energyAlerts = []) {
    const allAlerts = [...threats, ...cableAlerts, ...energyAlerts];

    // Count how many alerts reference each infrastructure item
    const alertCountMap = {};
    const toneAccumulator = {};

    for (const alert of allAlerts) {
      const matchedIds = alert.matchedInfrastructure || alert.affectedCables || [];
      for (const infraId of matchedIds) {
        alertCountMap[infraId] = (alertCountMap[infraId] || 0) + 1;
        if (!toneAccumulator[infraId]) toneAccumulator[infraId] = [];
        toneAccumulator[infraId].push(alert.tone || 0);
      }
    }

    // Regions with known instability get a modifier
    const instabilityRegions = {
      'Middle East': 1.5,
      'Middle East/Africa': 1.4,
      'Europe/Asia': 1.3,
      'Africa': 1.2,
      'Asia': 1.1,
    };

    const scored = this.infrastructure.map(infra => {
      // Base score from importance (0-10 normalized to 0-40)
      const baseScore = (infra.importance / 10) * 40;

      // Threat volume signal (0-30)
      const alertCount = alertCountMap[infra.id] || 0;
      const volumeScore = Math.min(30, alertCount * 6);

      // Tone-based severity signal (0-20)
      const tones = toneAccumulator[infra.id] || [];
      let toneScore = 0;
      if (tones.length > 0) {
        const avgTone = tones.reduce((sum, t) => sum + t, 0) / tones.length;
        // More negative tone = higher threat. Map -10..10 to 20..0
        toneScore = Math.max(0, Math.min(20, ((-avgTone + 10) / 20) * 20));
      }

      // Geographic instability modifier (0-10)
      let geoModifier = 0;
      for (const region of Object.keys(instabilityRegions)) {
        // Check if any threat in this region matches this infra
        const regionalThreats = allAlerts.filter(a =>
          a.region === region && (a.matchedInfrastructure || a.affectedCables || []).includes(infra.id)
        );
        if (regionalThreats.length > 0) {
          geoModifier = Math.max(geoModifier, instabilityRegions[region] * 5);
        }
      }

      const rawScore = baseScore + volumeScore + toneScore + geoModifier;
      const vulnerabilityScore = Math.min(100, Math.round(rawScore));

      let riskLevel;
      if (vulnerabilityScore >= 75) riskLevel = 'critical';
      else if (vulnerabilityScore >= 55) riskLevel = 'high';
      else if (vulnerabilityScore >= 35) riskLevel = 'moderate';
      else riskLevel = 'low';

      return {
        ...infra,
        vulnerabilityScore,
        riskLevel,
        activeAlerts: alertCount,
        toneAverage: tones.length > 0 ? Math.round((tones.reduce((s, t) => s + t, 0) / tones.length) * 100) / 100 : null,
        scoreBreakdown: {
          base: Math.round(baseScore),
          volume: Math.round(volumeScore),
          tone: Math.round(toneScore),
          geographic: Math.round(geoModifier),
        },
      };
    });

    return scored.sort((a, b) => b.vulnerabilityScore - a.vulnerabilityScore);
  }

  /**
   * Main aggregation method returning all infrastructure vulnerability data.
   * Fetches threats, cable status, energy alerts concurrently,
   * computes vulnerability scores, and assembles a comprehensive summary.
   * @returns {object} Combined infrastructure vulnerability assessment
   */
  async getCombinedData() {
    const cacheKey = this.cacheKeys.combined;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    // Fetch all data sources concurrently
    const [threatsResult, cablesResult, energyResult] = await Promise.allSettled([
      this.fetchInfrastructureThreats(),
      this.fetchSubmarineCableStatus(),
      this.fetchEnergyInfrastructure(),
    ]);

    const threats = threatsResult.status === 'fulfilled' ? threatsResult.value : [];
    const cableAlerts = cablesResult.status === 'fulfilled' ? cablesResult.value : [];
    const energyAlerts = energyResult.status === 'fulfilled' ? energyResult.value : [];

    // Compute vulnerability scores for all infrastructure
    const scoredInfrastructure = this.computeVulnerabilityScores(threats, cableAlerts, energyAlerts);

    // Build category summary
    const categories = {};
    for (const infra of scoredInfrastructure) {
      if (!categories[infra.category]) {
        categories[infra.category] = {
          total: 0,
          threatened: 0,
          critical: 0,
          avgScore: 0,
          scores: [],
        };
      }
      categories[infra.category].total += 1;
      categories[infra.category].scores.push(infra.vulnerabilityScore);
      if (infra.activeAlerts > 0) categories[infra.category].threatened += 1;
      if (infra.riskLevel === 'critical') categories[infra.category].critical += 1;
    }

    // Compute average scores per category
    for (const cat of Object.values(categories)) {
      cat.avgScore = cat.scores.length > 0
        ? Math.round(cat.scores.reduce((s, v) => s + v, 0) / cat.scores.length)
        : 0;
      delete cat.scores;
    }

    const totalThreatened = scoredInfrastructure.filter(i => i.activeAlerts > 0).length;
    const totalCritical = scoredInfrastructure.filter(i => i.riskLevel === 'critical').length;

    const result = {
      infrastructure: scoredInfrastructure,
      threats: threats,
      cableAlerts: cableAlerts,
      energyAlerts: energyAlerts,
      summary: {
        total: scoredInfrastructure.length,
        threatened: totalThreatened,
        critical: totalCritical,
        categories: categories,
      },
      updatedAt: new Date().toISOString(),
    };

    await cacheService.set(cacheKey, result, CACHE_TTL);
    return result;
  }
}

export const infrastructureService = new InfrastructureService();
