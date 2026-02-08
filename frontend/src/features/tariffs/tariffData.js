/**
 * US Tariff Data by Country
 *
 * Tariff rates represent approximate US import tariff percentages.
 * Includes universal/baseline rate and sector-specific tariffs.
 * Data based on 2025 US trade policy including reciprocal tariffs.
 */

const TARIFF_DATA = {
  // --- Major Trading Partners ---

  China: {
    universal: 145,
    goods: {
      'Steel & Aluminum': 170,
      Electronics: 145,
      Agriculture: 145,
      Automobiles: 170,
      'Textiles & Apparel': 145,
      'Solar Panels': 170,
      Machinery: 145,
      'Rare Earth Minerals': 145,
      Pharmaceuticals: 145,
    },
    notes: 'Reciprocal tariffs; highest US tariff tier',
  },

  Canada: {
    universal: 25,
    goods: {
      'Steel & Aluminum': 50,
      Electronics: 25,
      Agriculture: 25,
      Automobiles: 25,
      'Textiles & Apparel': 25,
      'Lumber & Wood': 30,
      Energy: 10,
      Dairy: 30,
      Pharmaceuticals: 25,
    },
    notes: 'USMCA partner; energy imports at reduced rate',
  },

  Mexico: {
    universal: 25,
    goods: {
      'Steel & Aluminum': 50,
      Electronics: 25,
      Agriculture: 25,
      Automobiles: 25,
      'Textiles & Apparel': 25,
      Energy: 10,
      'Auto Parts': 25,
      Machinery: 25,
      Pharmaceuticals: 25,
    },
    notes: 'USMCA partner; energy imports at reduced rate',
  },

  // --- European Union ---

  Germany: {
    universal: 20,
    goods: {
      'Steel & Aluminum': 45,
      Electronics: 20,
      Agriculture: 20,
      Automobiles: 45,
      'Textiles & Apparel': 20,
      Machinery: 20,
      Chemicals: 20,
      Pharmaceuticals: 20,
    },
    notes: 'EU reciprocal tariff rate',
  },

  France: {
    universal: 20,
    goods: {
      'Steel & Aluminum': 45,
      Electronics: 20,
      Agriculture: 20,
      Automobiles: 45,
      'Wine & Spirits': 25,
      'Luxury Goods': 20,
      Aerospace: 20,
      Pharmaceuticals: 20,
    },
    notes: 'EU reciprocal tariff rate',
  },

  Italy: {
    universal: 20,
    goods: {
      'Steel & Aluminum': 45,
      Electronics: 20,
      Agriculture: 20,
      Automobiles: 45,
      'Textiles & Apparel': 20,
      'Luxury Goods': 20,
      'Food & Beverage': 20,
      Machinery: 20,
    },
    notes: 'EU reciprocal tariff rate',
  },

  Spain: {
    universal: 20,
    goods: {
      'Steel & Aluminum': 45,
      Agriculture: 20,
      Automobiles: 45,
      'Textiles & Apparel': 20,
      'Food & Beverage': 20,
    },
    notes: 'EU reciprocal tariff rate',
  },

  Netherlands: {
    universal: 20,
    goods: {
      'Steel & Aluminum': 45,
      Electronics: 20,
      Agriculture: 20,
      Chemicals: 20,
      Machinery: 20,
    },
    notes: 'EU reciprocal tariff rate',
  },

  Belgium: {
    universal: 20,
    goods: {
      'Steel & Aluminum': 45,
      Chemicals: 20,
      Diamonds: 20,
      Pharmaceuticals: 20,
    },
    notes: 'EU reciprocal tariff rate',
  },

  Poland: {
    universal: 20,
    goods: {
      'Steel & Aluminum': 45,
      Electronics: 20,
      Agriculture: 20,
      Automobiles: 45,
      Machinery: 20,
    },
    notes: 'EU reciprocal tariff rate',
  },

  Sweden: {
    universal: 20,
    goods: {
      'Steel & Aluminum': 45,
      Electronics: 20,
      Automobiles: 45,
      Machinery: 20,
      'Iron & Steel': 45,
    },
    notes: 'EU reciprocal tariff rate',
  },

  Austria: {
    universal: 20,
    goods: {
      'Steel & Aluminum': 45,
      Machinery: 20,
      Automobiles: 45,
    },
    notes: 'EU reciprocal tariff rate',
  },

  Ireland: {
    universal: 20,
    goods: {
      Pharmaceuticals: 20,
      Electronics: 20,
      'Medical Devices': 20,
    },
    notes: 'EU reciprocal tariff rate',
  },

  Portugal: {
    universal: 20,
    goods: {
      'Steel & Aluminum': 45,
      'Textiles & Apparel': 20,
      Agriculture: 20,
    },
    notes: 'EU reciprocal tariff rate',
  },

  Greece: {
    universal: 20,
    goods: {
      Agriculture: 20,
      'Food & Beverage': 20,
      'Steel & Aluminum': 45,
    },
    notes: 'EU reciprocal tariff rate',
  },

  Finland: {
    universal: 20,
    goods: {
      Electronics: 20,
      'Lumber & Wood': 20,
      Machinery: 20,
      'Steel & Aluminum': 45,
    },
    notes: 'EU reciprocal tariff rate',
  },

  Denmark: {
    universal: 20,
    goods: {
      Pharmaceuticals: 20,
      Agriculture: 20,
      'Wind Energy': 20,
    },
    notes: 'EU reciprocal tariff rate',
  },

  Czechia: {
    universal: 20,
    goods: {
      Automobiles: 45,
      Electronics: 20,
      Machinery: 20,
      'Steel & Aluminum': 45,
    },
    notes: 'EU reciprocal tariff rate',
  },

  Romania: {
    universal: 20,
    goods: {
      Automobiles: 45,
      Electronics: 20,
      'Textiles & Apparel': 20,
      'Steel & Aluminum': 45,
    },
    notes: 'EU reciprocal tariff rate',
  },

  Hungary: {
    universal: 20,
    goods: {
      Automobiles: 45,
      Electronics: 20,
      Machinery: 20,
    },
    notes: 'EU reciprocal tariff rate',
  },

  // --- Asia-Pacific ---

  Japan: {
    universal: 24,
    goods: {
      'Steel & Aluminum': 49,
      Electronics: 24,
      Agriculture: 24,
      Automobiles: 49,
      Machinery: 24,
      'Auto Parts': 24,
      'Semiconductors': 24,
      Pharmaceuticals: 24,
    },
    notes: 'Reciprocal tariff rate',
  },

  'South Korea': {
    universal: 25,
    goods: {
      'Steel & Aluminum': 50,
      Electronics: 25,
      Agriculture: 25,
      Automobiles: 50,
      'Semiconductors': 25,
      Machinery: 25,
      'Shipbuilding': 25,
      Petrochemicals: 25,
    },
    notes: 'Reciprocal tariff rate',
  },

  India: {
    universal: 26,
    goods: {
      'Steel & Aluminum': 51,
      Electronics: 26,
      Agriculture: 26,
      Automobiles: 51,
      'Textiles & Apparel': 26,
      Pharmaceuticals: 26,
      'IT Services': 26,
      Gems: 26,
    },
    notes: 'Reciprocal tariff rate',
  },

  Taiwan: {
    universal: 32,
    goods: {
      'Steel & Aluminum': 57,
      Electronics: 32,
      'Semiconductors': 32,
      Machinery: 32,
      Petrochemicals: 32,
    },
    notes: 'Reciprocal tariff rate',
  },

  Vietnam: {
    universal: 46,
    goods: {
      'Steel & Aluminum': 71,
      Electronics: 46,
      Agriculture: 46,
      'Textiles & Apparel': 46,
      Furniture: 46,
      Footwear: 46,
      'Seafood': 46,
    },
    notes: 'Reciprocal tariff rate; trade rerouting concerns',
  },

  Thailand: {
    universal: 36,
    goods: {
      'Steel & Aluminum': 61,
      Electronics: 36,
      Agriculture: 36,
      Automobiles: 61,
      'Textiles & Apparel': 36,
      Rubber: 36,
      'Seafood': 36,
    },
    notes: 'Reciprocal tariff rate',
  },

  Indonesia: {
    universal: 32,
    goods: {
      'Steel & Aluminum': 57,
      Electronics: 32,
      Agriculture: 32,
      'Palm Oil': 32,
      'Textiles & Apparel': 32,
      'Rubber & Timber': 32,
    },
    notes: 'Reciprocal tariff rate',
  },

  Malaysia: {
    universal: 24,
    goods: {
      'Steel & Aluminum': 49,
      Electronics: 24,
      'Semiconductors': 24,
      'Palm Oil': 24,
      Rubber: 24,
    },
    notes: 'Reciprocal tariff rate',
  },

  Philippines: {
    universal: 17,
    goods: {
      'Steel & Aluminum': 42,
      Electronics: 17,
      Agriculture: 17,
      'Textiles & Apparel': 17,
    },
    notes: 'Reciprocal tariff rate',
  },

  Singapore: {
    universal: 10,
    goods: {
      'Steel & Aluminum': 35,
      Electronics: 10,
      Pharmaceuticals: 10,
      Petrochemicals: 10,
    },
    notes: 'Baseline tariff; free trade ally',
  },

  Bangladesh: {
    universal: 37,
    goods: {
      'Steel & Aluminum': 62,
      'Textiles & Apparel': 37,
      Agriculture: 37,
    },
    notes: 'Reciprocal tariff rate',
  },

  Pakistan: {
    universal: 29,
    goods: {
      'Steel & Aluminum': 54,
      'Textiles & Apparel': 29,
      Agriculture: 29,
      'Surgical Instruments': 29,
    },
    notes: 'Reciprocal tariff rate',
  },

  Cambodia: {
    universal: 49,
    goods: {
      'Textiles & Apparel': 49,
      Footwear: 49,
      Agriculture: 49,
    },
    notes: 'Reciprocal tariff rate',
  },

  Myanmar: {
    universal: 44,
    goods: {
      'Textiles & Apparel': 44,
      Agriculture: 44,
      Gems: 44,
    },
    notes: 'Reciprocal tariff rate',
  },

  'Sri Lanka': {
    universal: 44,
    goods: {
      'Textiles & Apparel': 44,
      Agriculture: 44,
      Tea: 44,
    },
    notes: 'Reciprocal tariff rate',
  },

  // --- Oceania ---

  Australia: {
    universal: 10,
    goods: {
      'Steel & Aluminum': 35,
      Agriculture: 10,
      'Mining & Minerals': 10,
      Energy: 10,
      Beef: 10,
    },
    notes: 'Baseline tariff; close security partner',
  },

  'New Zealand': {
    universal: 10,
    goods: {
      Agriculture: 10,
      Dairy: 10,
      'Wine & Spirits': 10,
      Beef: 10,
    },
    notes: 'Baseline tariff; FTA partner',
  },

  // --- United Kingdom ---

  'United Kingdom': {
    universal: 10,
    goods: {
      'Steel & Aluminum': 35,
      Electronics: 10,
      Automobiles: 35,
      Pharmaceuticals: 10,
      'Financial Services': 10,
      Aerospace: 10,
      'Scotch Whisky': 10,
    },
    notes: 'Baseline tariff rate; special relationship',
  },

  // --- Americas ---

  Brazil: {
    universal: 10,
    goods: {
      'Steel & Aluminum': 35,
      Agriculture: 10,
      'Iron Ore': 10,
      'Coffee & Soybeans': 10,
      Automobiles: 35,
      'Ethanol': 10,
    },
    notes: 'Baseline tariff rate',
  },

  Argentina: {
    universal: 10,
    goods: {
      'Steel & Aluminum': 35,
      Agriculture: 10,
      'Beef & Wine': 10,
      'Lithium': 10,
    },
    notes: 'Baseline tariff rate',
  },

  Colombia: {
    universal: 10,
    goods: {
      Agriculture: 10,
      'Coffee': 10,
      Energy: 10,
      'Cut Flowers': 10,
    },
    notes: 'Baseline tariff; FTA partner',
  },

  Chile: {
    universal: 10,
    goods: {
      'Copper & Lithium': 10,
      Agriculture: 10,
      'Wine': 10,
      'Seafood': 10,
    },
    notes: 'Baseline tariff; FTA partner',
  },

  Peru: {
    universal: 10,
    goods: {
      'Mining & Minerals': 10,
      Agriculture: 10,
      'Textiles & Apparel': 10,
    },
    notes: 'Baseline tariff; FTA partner',
  },

  Venezuela: {
    universal: 15,
    goods: {
      Energy: 25,
      'Steel & Aluminum': 40,
      'Petroleum': 25,
    },
    notes: 'Sanctions and tariffs in place',
  },

  Ecuador: {
    universal: 10,
    goods: {
      Agriculture: 10,
      'Bananas': 10,
      'Petroleum': 10,
      'Seafood': 10,
    },
    notes: 'Baseline tariff rate',
  },

  // --- Middle East & Africa ---

  'Saudi Arabia': {
    universal: 10,
    goods: {
      Energy: 10,
      Petrochemicals: 10,
      'Aluminum': 35,
    },
    notes: 'Baseline tariff; energy partner',
  },

  'United Arab Emirates': {
    universal: 10,
    goods: {
      Energy: 10,
      'Aluminum': 35,
      'Gold & Jewelry': 10,
    },
    notes: 'Baseline tariff rate',
  },

  Israel: {
    universal: 17,
    goods: {
      Electronics: 17,
      Agriculture: 17,
      'Diamonds': 17,
      'Defense Equipment': 17,
      Pharmaceuticals: 17,
    },
    notes: 'FTA partner; reciprocal tariff rate',
  },

  Turkey: {
    universal: 10,
    goods: {
      'Steel & Aluminum': 55,
      'Textiles & Apparel': 10,
      Agriculture: 10,
      Automobiles: 35,
    },
    notes: 'Baseline tariff; elevated steel/aluminum',
  },

  Egypt: {
    universal: 10,
    goods: {
      'Textiles & Apparel': 10,
      Agriculture: 10,
      Energy: 10,
    },
    notes: 'Baseline tariff rate',
  },

  'South Africa': {
    universal: 30,
    goods: {
      'Steel & Aluminum': 55,
      'Mining & Minerals': 30,
      Automobiles: 55,
      Agriculture: 30,
    },
    notes: 'Reciprocal tariff rate',
  },

  Nigeria: {
    universal: 14,
    goods: {
      Energy: 14,
      Agriculture: 14,
    },
    notes: 'Reciprocal tariff rate',
  },

  Kenya: {
    universal: 10,
    goods: {
      Agriculture: 10,
      'Coffee & Tea': 10,
      'Textiles & Apparel': 10,
    },
    notes: 'Baseline tariff rate',
  },

  Morocco: {
    universal: 10,
    goods: {
      Agriculture: 10,
      'Textiles & Apparel': 10,
      Phosphates: 10,
    },
    notes: 'FTA partner; baseline rate',
  },

  Ethiopia: {
    universal: 10,
    goods: {
      Coffee: 10,
      'Textiles & Apparel': 10,
      Agriculture: 10,
    },
    notes: 'Baseline tariff rate',
  },

  // --- Other European ---

  Switzerland: {
    universal: 31,
    goods: {
      Pharmaceuticals: 31,
      'Watches & Jewelry': 31,
      Machinery: 31,
      Chemicals: 31,
    },
    notes: 'Reciprocal tariff rate',
  },

  Norway: {
    universal: 15,
    goods: {
      'Seafood': 15,
      Energy: 15,
      'Aluminum': 40,
      'Petroleum': 15,
    },
    notes: 'Reciprocal tariff rate',
  },

  Ukraine: {
    universal: 10,
    goods: {
      'Steel & Aluminum': 35,
      Agriculture: 10,
      'Iron & Steel': 35,
    },
    notes: 'Baseline tariff rate',
  },

  Russia: {
    universal: 35,
    goods: {
      'Steel & Aluminum': 200,
      Energy: 35,
      'Uranium': 35,
      'Diamonds': 100,
      Metals: 35,
    },
    notes: 'Sanctions-related elevated tariffs',
  },

  Serbia: {
    universal: 37,
    goods: {
      'Steel & Aluminum': 62,
      Agriculture: 37,
    },
    notes: 'Reciprocal tariff rate',
  },

  // --- Central & East Asia ---

  Mongolia: {
    universal: 10,
    goods: {
      'Mining & Minerals': 10,
      'Textiles & Apparel': 10,
    },
    notes: 'Baseline tariff rate',
  },

  Kazakhstan: {
    universal: 10,
    goods: {
      Energy: 10,
      'Uranium': 10,
      'Mining & Minerals': 10,
    },
    notes: 'Baseline tariff rate',
  },

  // --- Central America & Caribbean ---

  'Costa Rica': {
    universal: 10,
    goods: {
      Agriculture: 10,
      Electronics: 10,
      'Medical Devices': 10,
    },
    notes: 'CAFTA-DR partner; baseline rate',
  },

  'Dominican Rep.': {
    universal: 10,
    goods: {
      'Textiles & Apparel': 10,
      Agriculture: 10,
      'Tobacco': 10,
    },
    notes: 'CAFTA-DR partner; baseline rate',
  },

  Guatemala: {
    universal: 10,
    goods: {
      Agriculture: 10,
      'Textiles & Apparel': 10,
      'Coffee': 10,
    },
    notes: 'CAFTA-DR partner; baseline rate',
  },

  Honduras: {
    universal: 10,
    goods: {
      'Textiles & Apparel': 10,
      Agriculture: 10,
      'Coffee': 10,
    },
    notes: 'CAFTA-DR partner; baseline rate',
  },

  Nicaragua: {
    universal: 18,
    goods: {
      'Textiles & Apparel': 18,
      Agriculture: 18,
    },
    notes: 'Reciprocal tariff rate',
  },

  Cuba: {
    universal: 0,
    goods: {},
    notes: 'US trade embargo in effect; minimal trade',
  },
};

// Default tariff for countries not listed
const DEFAULT_TARIFF = {
  universal: 10,
  goods: {
    'Steel & Aluminum': 35,
  },
  notes: 'Baseline universal tariff rate',
};

/**
 * Get tariff data for a country by name.
 * Returns the specific country data or a default if not found.
 */
export function getTariffByName(countryName) {
  if (!countryName) return null;
  const data = TARIFF_DATA[countryName];
  if (data) return { country: countryName, ...data };

  // Try partial matching for edge cases
  const key = Object.keys(TARIFF_DATA).find(
    (k) => k.toLowerCase() === countryName.toLowerCase()
  );
  if (key) return { country: key, ...TARIFF_DATA[key] };

  return { country: countryName, ...DEFAULT_TARIFF };
}

/**
 * Get the universal tariff rate for a country.
 * Returns 0 for US, default rate for unknown countries.
 */
export function getUniversalRate(countryName) {
  if (!countryName) return 0;
  if (
    countryName === 'United States of America' ||
    countryName === 'United States'
  )
    return 0;
  const data = getTariffByName(countryName);
  return data?.universal ?? 10;
}

/**
 * Get a color for the tariff heatmap based on rate.
 * Green (low) -> Yellow (medium) -> Orange -> Red (high)
 */
export function getTariffColor(rate) {
  if (rate === 0) return 'rgba(100, 100, 120, 0.4)'; // Gray for no tariff / embargo
  if (rate <= 10) return '#22c55e'; // Green
  if (rate <= 15) return '#65d544'; // Light green
  if (rate <= 20) return '#a3d930'; // Yellow-green
  if (rate <= 25) return '#eab308'; // Yellow
  if (rate <= 30) return '#f59e0b'; // Amber
  if (rate <= 40) return '#f97316'; // Orange
  if (rate <= 50) return '#ef4444'; // Red
  if (rate <= 100) return '#dc2626'; // Dark red
  return '#991b1b'; // Very dark red (100%+)
}

/**
 * Get a light-theme color for the tariff heatmap.
 */
export function getTariffColorLight(rate) {
  if (rate === 0) return 'rgba(140, 140, 155, 0.3)';
  if (rate <= 10) return '#86efac';
  if (rate <= 15) return '#a8e88c';
  if (rate <= 20) return '#d4e070';
  if (rate <= 25) return '#fde047';
  if (rate <= 30) return '#fbbf24';
  if (rate <= 40) return '#fb923c';
  if (rate <= 50) return '#f87171';
  if (rate <= 100) return '#ef4444';
  return '#dc2626';
}

export const TARIFF_LEGEND = [
  { label: '0% (Embargo)', color: 'rgba(100, 100, 120, 0.4)', colorLight: 'rgba(140, 140, 155, 0.3)' },
  { label: '1-10%', color: '#22c55e', colorLight: '#86efac' },
  { label: '11-20%', color: '#a3d930', colorLight: '#d4e070' },
  { label: '21-30%', color: '#f59e0b', colorLight: '#fbbf24' },
  { label: '31-50%', color: '#f97316', colorLight: '#fb923c' },
  { label: '51-100%', color: '#ef4444', colorLight: '#f87171' },
  { label: '100%+', color: '#991b1b', colorLight: '#dc2626' },
];

export default TARIFF_DATA;
