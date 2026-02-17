/**
 * Explicit water-body GeoJSON features rendered on top of country fills.
 * Needed because the 50m-resolution world-atlas TopoJSON omits narrow
 * waterways like the Suez Canal.
 */

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

export const WATER_CANALS = {
  type: 'FeatureCollection',
  features: [SUEZ_CANAL],
};
