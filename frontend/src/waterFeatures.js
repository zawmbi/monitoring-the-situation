/**
 * Explicit water-body GeoJSON features rendered on top of country fills.
 * Needed because the 50m-resolution world-atlas TopoJSON omits narrow
 * waterways (Suez Canal) and may fill over inland lakes (Lake Michigan).
 */

const LAKE_MICHIGAN = {
  type: 'Feature',
  properties: { name: 'Lake Michigan', kind: 'lake' },
  geometry: {
    type: 'Polygon',
    coordinates: [[
      [-86.72, 46.09],
      [-86.42, 45.97],
      [-86.25, 45.80],
      [-85.87, 45.58],
      [-85.55, 45.35],
      [-85.52, 45.02],
      [-85.60, 44.78],
      [-85.75, 44.52],
      [-85.98, 44.15],
      [-86.15, 43.82],
      [-86.22, 43.50],
      [-86.30, 43.18],
      [-86.40, 42.80],
      [-86.52, 42.45],
      [-86.63, 42.15],
      [-86.78, 41.82],
      [-87.00, 41.68],
      [-87.28, 41.63],
      [-87.52, 41.64],
      [-87.65, 41.84],
      [-87.72, 42.05],
      [-87.82, 42.30],
      [-87.88, 42.55],
      [-87.86, 42.85],
      [-87.78, 43.10],
      [-87.72, 43.40],
      [-87.62, 43.70],
      [-87.50, 43.95],
      [-87.38, 44.22],
      [-87.22, 44.50],
      [-87.08, 44.72],
      [-86.95, 44.95],
      [-86.82, 45.22],
      [-86.72, 45.48],
      [-86.65, 45.72],
      [-86.72, 46.09],
    ]],
  },
};

const SUEZ_CANAL = {
  type: 'Feature',
  properties: { name: 'Suez Canal', kind: 'canal' },
  geometry: {
    type: 'LineString',
    coordinates: [
      [32.32, 31.27],  // Port Said (Mediterranean end)
      [32.33, 31.17],
      [32.34, 31.05],
      [32.35, 30.92],
      [32.36, 30.80],
      [32.37, 30.65],
      [32.38, 30.55],
      [32.39, 30.45],
      [32.42, 30.38],  // Great Bitter Lake north
      [32.42, 30.32],
      [32.40, 30.25],  // Great Bitter Lake south
      [32.45, 30.15],
      [32.48, 30.05],
      [32.52, 29.97],
      [32.55, 29.93],  // Suez (Red Sea end)
    ],
  },
};

export const WATER_FEATURES = {
  type: 'FeatureCollection',
  features: [LAKE_MICHIGAN, SUEZ_CANAL],
};

export const WATER_LAKES = {
  type: 'FeatureCollection',
  features: [LAKE_MICHIGAN],
};

export const WATER_CANALS = {
  type: 'FeatureCollection',
  features: [SUEZ_CANAL],
};
