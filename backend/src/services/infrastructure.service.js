/**
 * Infrastructure Monitoring Service
 * Monitors critical global infrastructure by fetching articles from the GDELT Project API.
 * Pure data passthrough — returns raw GDELT articles with their tone, source, and date.
 * No composite vulnerability scores or derived risk levels.
 *
 * Data sources:
 *   - GDELT Project API (news article feeds with tone metadata)
 *   - Static infrastructure registry (curated list of critical assets)
 *
 * API: https://api.gdeltproject.org/api/v2/doc/doc (no key required)
 * Cache: 15 minutes
 */

import { cacheService } from './cache.service.js';
import { fetchGDELTRaw } from './gdelt.client.js';

const CACHE_TTL = 900; // 15 minutes
const GDELT_BASE = 'https://api.gdeltproject.org/api/v2/doc/doc';

/* ────────────────────────────────────────────────────────────────────────────
 * CRITICAL INFRASTRUCTURE DATABASE
 * Static registry of globally significant infrastructure assets.
 * Each entry includes geolocation, category, and metadata.
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
    description: 'Critical chokepoint handling ~21% of global petroleum consumption. Connects Persian Gulf oil producers to global markets.',
  },
  {
    id: 'infra-energy-nordstream',
    name: 'Nord Stream Pipeline System',
    category: 'energy',
    subcategory: 'pipeline',
    location: { lat: 54.5, lon: 13.5 },
    countries: ['RU', 'DE', 'DK', 'SE', 'FI'],
    description: 'Major natural gas pipeline system from Russia to Germany via the Baltic Sea. Subject to sabotage in 2022.',
  },
  {
    id: 'infra-energy-opec-ghawar',
    name: 'Ghawar Oil Field (OPEC)',
    category: 'energy',
    subcategory: 'oil_production',
    location: { lat: 25.4, lon: 49.4 },
    countries: ['SA'],
    description: 'Largest conventional oil field in the world, producing approximately 3.8 million barrels per day.',
  },
  {
    id: 'infra-energy-suez',
    name: 'Suez Canal Energy Transit',
    category: 'energy',
    subcategory: 'oil_transit',
    location: { lat: 30.4583, lon: 32.3498 },
    countries: ['EG'],
    description: 'Vital waterway connecting Mediterranean and Red Sea. Handles ~12% of global trade and significant oil/LNG shipments.',
  },
  {
    id: 'infra-energy-panama',
    name: 'Panama Canal Energy Transit',
    category: 'energy',
    subcategory: 'oil_transit',
    location: { lat: 9.08, lon: -79.68 },
    countries: ['PA'],
    description: 'Key transit route for LNG and petroleum products between Atlantic and Pacific. Increasingly affected by drought.',
  },
  {
    id: 'infra-energy-abqaiq',
    name: 'Abqaiq Processing Facility',
    category: 'energy',
    subcategory: 'oil_production',
    location: { lat: 25.9394, lon: 49.6814 },
    countries: ['SA'],
    description: 'World largest oil processing facility. Attacked by drones in 2019, briefly halving Saudi output.',
  },
  {
    id: 'infra-energy-druzhba',
    name: 'Druzhba Pipeline',
    category: 'energy',
    subcategory: 'pipeline',
    location: { lat: 52.0, lon: 30.0 },
    countries: ['RU', 'BY', 'UA', 'PL', 'DE', 'CZ', 'SK', 'HU'],
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
    description: 'Fiber-Optic Link Around the Globe. 28,000km cable connecting UK to Japan via the Middle East and India.',
  },
  {
    id: 'infra-digital-seamewe',
    name: 'SEA-ME-WE Submarine Cables',
    category: 'digital',
    subcategory: 'submarine_cable',
    location: { lat: 12.0, lon: 75.0 },
    countries: ['FR', 'EG', 'SA', 'IN', 'SG', 'MY', 'ID', 'AU', 'JP'],
    description: 'South East Asia-Middle East-Western Europe cable system. Critical backbone carrying vast data traffic.',
  },
  {
    id: 'infra-digital-tat14',
    name: 'TAT-14 Transatlantic Cable',
    category: 'digital',
    subcategory: 'submarine_cable',
    location: { lat: 50.0, lon: -20.0 },
    countries: ['US', 'GB', 'FR', 'DE', 'DK', 'NL'],
    description: 'Transatlantic telecommunications cable connecting US to Europe. Part of critical cross-Atlantic backbone.',
  },
  {
    id: 'infra-digital-peace',
    name: 'PEACE Submarine Cable',
    category: 'digital',
    subcategory: 'submarine_cable',
    location: { lat: 30.0, lon: 50.0 },
    countries: ['PK', 'KE', 'EG', 'FR', 'SG', 'CN'],
    description: 'Pakistan and East Africa Connecting Europe cable. 15,000km system connecting Asia, Africa, and Europe.',
  },
  {
    id: 'infra-digital-decix',
    name: 'DE-CIX Frankfurt Internet Exchange',
    category: 'digital',
    subcategory: 'internet_exchange',
    location: { lat: 50.1109, lon: 8.6821 },
    countries: ['DE'],
    description: 'World largest internet exchange point by peak traffic, handling over 14 Tbps. Central European internet hub.',
  },
  {
    id: 'infra-digital-amsix',
    name: 'AMS-IX Amsterdam Internet Exchange',
    category: 'digital',
    subcategory: 'internet_exchange',
    location: { lat: 52.3676, lon: 4.9041 },
    countries: ['NL'],
    description: 'One of the largest internet exchange points globally. Critical node for European internet traffic.',
  },
  {
    id: 'infra-digital-linx',
    name: 'LINX London Internet Exchange',
    category: 'digital',
    subcategory: 'internet_exchange',
    location: { lat: 51.5074, lon: -0.1278 },
    countries: ['GB'],
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
    description: 'Busiest shipping lane in the world. Connects Indian and Pacific Oceans, handling ~25% of global sea trade.',
  },
  {
    id: 'infra-transport-mandeb',
    name: 'Bab el-Mandeb Strait',
    category: 'transport',
    subcategory: 'shipping_lane',
    location: { lat: 12.5833, lon: 43.3333 },
    countries: ['YE', 'DJ', 'ER'],
    description: 'Strategic chokepoint between Red Sea and Gulf of Aden. Heavily disrupted by Houthi attacks since 2023.',
  },
  {
    id: 'infra-transport-gibraltar',
    name: 'Strait of Gibraltar',
    category: 'transport',
    subcategory: 'shipping_lane',
    location: { lat: 35.9667, lon: -5.5 },
    countries: ['ES', 'MA', 'GB'],
    description: 'Narrow strait connecting Mediterranean Sea to Atlantic Ocean. Major shipping and naval transit point.',
  },
  {
    id: 'infra-transport-dover',
    name: 'Dover Strait Shipping Lane',
    category: 'transport',
    subcategory: 'shipping_lane',
    location: { lat: 51.0, lon: 1.5 },
    countries: ['GB', 'FR'],
    description: 'One of the busiest shipping lanes in the world. Over 500 vessels transit daily through English Channel.',
  },
  {
    id: 'infra-transport-suez-canal',
    name: 'Suez Canal Waterway',
    category: 'transport',
    subcategory: 'canal',
    location: { lat: 30.7, lon: 32.3 },
    countries: ['EG'],
    description: 'Artificial sea-level waterway connecting Mediterranean and Red Sea. ~12% of global trade transits here.',
  },
  {
    id: 'infra-transport-panama-canal',
    name: 'Panama Canal Waterway',
    category: 'transport',
    subcategory: 'canal',
    location: { lat: 9.1, lon: -79.7 },
    countries: ['PA'],
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
    description: 'Global financial messaging network connecting 11,000+ institutions in 200+ countries. Headquartered in Belgium.',
  },
  {
    id: 'infra-financial-nyse',
    name: 'New York Stock Exchange',
    category: 'financial',
    subcategory: 'stock_exchange',
    location: { lat: 40.7069, lon: -74.0113 },
    countries: ['US'],
    description: 'Largest stock exchange by market capitalization (~$25 trillion). Central to global equities markets.',
  },
  {
    id: 'infra-financial-lse',
    name: 'London Stock Exchange',
    category: 'financial',
    subcategory: 'stock_exchange',
    location: { lat: 51.5155, lon: -0.0922 },
    countries: ['GB'],
    description: 'One of the oldest and largest stock exchanges in Europe. Key financial market for global investors.',
  },
  {
    id: 'infra-financial-hkex',
    name: 'Hong Kong Stock Exchange',
    category: 'financial',
    subcategory: 'stock_exchange',
    location: { lat: 22.2855, lon: 114.1577 },
    countries: ['HK', 'CN'],
    description: 'Major Asian financial hub and gateway for Chinese capital markets. Third largest in Asia by market cap.',
  },
  {
    id: 'infra-financial-ecb',
    name: 'European Central Bank',
    category: 'financial',
    subcategory: 'central_bank',
    location: { lat: 50.1092, lon: 8.6724 },
    countries: ['DE'],
    description: 'Central bank for the eurozone, managing monetary policy for 20 EU member states using the euro.',
  },
  {
    id: 'infra-financial-fed',
    name: 'US Federal Reserve System',
    category: 'financial',
    subcategory: 'central_bank',
    location: { lat: 38.8927, lon: -77.0461 },
    countries: ['US'],
    description: 'Central banking system of the United States. Sets monetary policy affecting global financial markets.',
  },
  {
    id: 'infra-financial-pboc',
    name: 'People\'s Bank of China',
    category: 'financial',
    subcategory: 'central_bank',
    location: { lat: 39.9042, lon: 116.4074 },
    countries: ['CN'],
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
    description: 'Longest river in Africa, sustaining 300M+ people. GERD dam dispute between Egypt, Sudan, and Ethiopia.',
  },
  {
    id: 'infra-food-mekong',
    name: 'Mekong River Basin',
    category: 'food_water',
    subcategory: 'water_system',
    location: { lat: 15.0, lon: 105.0 },
    countries: ['CN', 'MM', 'LA', 'TH', 'KH', 'VN'],
    description: 'Supports 60M+ people dependent on fishing and agriculture. Chinese dams upstream cause downstream tensions.',
  },
  {
    id: 'infra-food-grain-blacksea',
    name: 'Black Sea Grain Corridor',
    category: 'food_water',
    subcategory: 'grain_corridor',
    location: { lat: 44.0, lon: 33.0 },
    countries: ['UA', 'RU', 'TR', 'RO', 'BG'],
    description: 'Critical grain export route for Ukrainian and Russian wheat, corn, and sunflower oil to global markets.',
  },
  {
    id: 'infra-food-grain-usguld',
    name: 'US Gulf Grain Export Corridor',
    category: 'food_water',
    subcategory: 'grain_corridor',
    location: { lat: 29.5, lon: -89.5 },
    countries: ['US'],
    description: 'Mississippi River grain export infrastructure serving as the primary US agricultural export gateway.',
  },
  {
    id: 'infra-food-indus',
    name: 'Indus River Water System',
    category: 'food_water',
    subcategory: 'water_system',
    location: { lat: 28.0, lon: 69.0 },
    countries: ['PK', 'IN', 'CN'],
    description: 'Sustains agriculture for 300M+ people across Pakistan and India. Subject to Indus Waters Treaty disputes.',
  },
];

/* ────────────────────────────────────────────────────────────────────────────
 * HELPER UTILITIES
 * ──────────────────────────────────────────────────────────────────────────── */

/**
 * Build a GDELT API query URL with standard parameters.
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
 * Routes GDELT URLs through the shared rate-limited client.
 */
async function safeFetchJson(url) {
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
 * Parse the GDELT tone field into a numeric value.
 * GDELT tone is sometimes a comma-separated string (avgTone,posScore,negScore,...).
 */
function parseTone(tone) {
  if (typeof tone === 'number') return tone;
  if (typeof tone === 'string') return parseFloat(tone.split(',')[0]) || 0;
  return 0;
}

/**
 * Format a raw GDELT article into a consistent article object.
 */
function formatArticle(article) {
  const tone = parseTone(article.tone);
  return {
    title: article.title || 'Untitled',
    url: article.url || '',
    source: article.domain || 'Unknown',
    sourceCountry: article.sourcecountry || 'Unknown',
    date: article.seendate || null,
    language: article.language || 'English',
    tone,
  };
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
    };
  }

  /**
   * Get the static infrastructure registry.
   */
  getInfrastructureRegistry() {
    return this.infrastructure;
  }

  /**
   * Fetch raw GDELT articles about infrastructure incidents.
   * Returns articles with their tone, source, and date. No severity scoring.
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

    const articles = data.articles
      .map(formatArticle)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 50);

    await cacheService.set(cacheKey, articles, CACHE_TTL);
    return articles;
  }

  /**
   * Fetch raw GDELT articles about submarine cable incidents.
   * Returns articles with their tone, source, and date.
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

    const articles = data.articles
      .map(formatArticle)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 20);

    await cacheService.set(cacheKey, articles, CACHE_TTL);
    return articles;
  }

  /**
   * Fetch raw GDELT articles about energy infrastructure incidents.
   * Returns articles with their tone, source, and date.
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

    const articles = data.articles
      .map(formatArticle)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 30);

    await cacheService.set(cacheKey, articles, CACHE_TTL);
    return articles;
  }

  /**
   * Main aggregation method returning all infrastructure data.
   * Returns the infrastructure registry alongside raw GDELT articles.
   * No vulnerability scores or risk levels.
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

    // Build category counts from registry
    const categories = {};
    for (const infra of this.infrastructure) {
      if (!categories[infra.category]) {
        categories[infra.category] = { total: 0 };
      }
      categories[infra.category].total += 1;
    }

    const result = {
      infrastructure: this.infrastructure,
      threats,
      cableArticles: cableAlerts,
      energyArticles: energyAlerts,
      summary: {
        totalInfrastructure: this.infrastructure.length,
        totalThreatArticles: threats.length,
        totalCableArticles: cableAlerts.length,
        totalEnergyArticles: energyAlerts.length,
        categories,
      },
      dataSource: 'GDELT Project API v2 (infrastructure registry is curated)',
      updatedAt: new Date().toISOString(),
    };

    await cacheService.set(cacheKey, result, CACHE_TTL);
    return result;
  }
}

export const infrastructureService = new InfrastructureService();
