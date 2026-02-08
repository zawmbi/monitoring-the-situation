// Approximate Russia-Ukraine frontline coordinates as of early 2025.
// Each segment is an array of [longitude, latitude] points.
// The line runs roughly from the Russian border near Kharkiv oblast
// south through Donetsk/Luhansk, then west along Zaporizhzhia,
// and down to the Dnipro river / Kherson area.

export const FRONTLINE_SEGMENTS = [
  // Northern sector - Kharkiv oblast / Russian border area
  { id: 'north', label: 'Kharkiv Sector', points: [
    [36.85, 50.38],
    [36.80, 50.30],
    [36.70, 50.18],
    [36.65, 50.05],
    [36.72, 49.92],
    [36.80, 49.80],
    [36.90, 49.68],
    [37.00, 49.55],
    [37.10, 49.45],
    [37.20, 49.35],
  ]},
  // Luhansk sector
  { id: 'luhansk', label: 'Luhansk Sector', points: [
    [37.20, 49.35],
    [37.35, 49.22],
    [37.50, 49.10],
    [37.60, 49.00],
    [37.70, 48.88],
    [37.75, 48.75],
    [37.80, 48.62],
    [37.75, 48.50],
  ]},
  // Donetsk sector - the most active area
  { id: 'donetsk', label: 'Donetsk Sector', points: [
    [37.75, 48.50],
    [37.68, 48.38],
    [37.60, 48.25],
    [37.50, 48.12],
    [37.42, 48.00],
    [37.32, 47.90],
    [37.18, 47.82],
    [37.00, 47.75],
    [36.80, 47.68],
    [36.60, 47.60],
  ]},
  // Zaporizhzhia sector
  { id: 'zaporizhzhia', label: 'Zaporizhzhia Sector', points: [
    [36.60, 47.60],
    [36.38, 47.52],
    [36.15, 47.45],
    [35.90, 47.38],
    [35.65, 47.32],
    [35.40, 47.28],
    [35.15, 47.22],
    [34.90, 47.15],
    [34.65, 47.05],
    [34.40, 46.95],
  ]},
  // Kherson / Dnipro river sector
  { id: 'kherson', label: 'Kherson Sector', points: [
    [34.40, 46.95],
    [34.15, 46.82],
    [33.90, 46.70],
    [33.65, 46.62],
    [33.38, 46.58],
    [33.10, 46.58],
    [32.90, 46.60],
    [32.75, 46.55],
  ]},
];

// All frontline points as a single continuous line
export const FRONTLINE_ALL_POINTS = FRONTLINE_SEGMENTS.flatMap(s => s.points);

// Ukraine colors
export const UKRAINE_BLUE = '#005BBB';
export const UKRAINE_YELLOW = '#FFD500';

// Russia colors
export const RUSSIA_WHITE = '#FFFFFF';
export const RUSSIA_BLUE = '#0039A6';
export const RUSSIA_RED = '#D52B1E';
