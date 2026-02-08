// Major world cities with approximate population (millions) for heatmap visualization
// Sources: UN World Urbanization Prospects, approximate metro-area populations
const POPULATION_POINTS = {
  type: 'FeatureCollection',
  features: [
    // Asia
    { type: 'Feature', geometry: { type: 'Point', coordinates: [121.47, 31.23] }, properties: { pop: 28 } },  // Shanghai
    { type: 'Feature', geometry: { type: 'Point', coordinates: [116.40, 39.90] }, properties: { pop: 22 } },  // Beijing
    { type: 'Feature', geometry: { type: 'Point', coordinates: [77.21, 28.61] }, properties: { pop: 32 } },   // Delhi
    { type: 'Feature', geometry: { type: 'Point', coordinates: [72.88, 19.08] }, properties: { pop: 21 } },   // Mumbai
    { type: 'Feature', geometry: { type: 'Point', coordinates: [90.41, 23.81] }, properties: { pop: 23 } },   // Dhaka
    { type: 'Feature', geometry: { type: 'Point', coordinates: [139.69, 35.69] }, properties: { pop: 37 } },  // Tokyo
    { type: 'Feature', geometry: { type: 'Point', coordinates: [106.85, -6.21] }, properties: { pop: 11 } },  // Jakarta
    { type: 'Feature', geometry: { type: 'Point', coordinates: [126.98, 37.57] }, properties: { pop: 10 } },  // Seoul
    { type: 'Feature', geometry: { type: 'Point', coordinates: [100.50, 13.76] }, properties: { pop: 11 } },  // Bangkok
    { type: 'Feature', geometry: { type: 'Point', coordinates: [106.63, 10.82] }, properties: { pop: 9 } },   // Ho Chi Minh
    { type: 'Feature', geometry: { type: 'Point', coordinates: [67.01, 24.86] }, properties: { pop: 16 } },   // Karachi
    { type: 'Feature', geometry: { type: 'Point', coordinates: [113.26, 23.13] }, properties: { pop: 14 } },  // Guangzhou
    { type: 'Feature', geometry: { type: 'Point', coordinates: [114.06, 22.54] }, properties: { pop: 13 } },  // Shenzhen
    { type: 'Feature', geometry: { type: 'Point', coordinates: [120.98, 14.60] }, properties: { pop: 14 } },  // Manila
    { type: 'Feature', geometry: { type: 'Point', coordinates: [44.37, 33.31] }, properties: { pop: 8 } },    // Baghdad
    { type: 'Feature', geometry: { type: 'Point', coordinates: [51.39, 35.69] }, properties: { pop: 9 } },    // Tehran
    { type: 'Feature', geometry: { type: 'Point', coordinates: [104.07, 30.57] }, properties: { pop: 9 } },   // Chengdu
    { type: 'Feature', geometry: { type: 'Point', coordinates: [114.30, 30.58] }, properties: { pop: 8 } },   // Wuhan
    { type: 'Feature', geometry: { type: 'Point', coordinates: [101.69, 3.14] }, properties: { pop: 8 } },    // Kuala Lumpur
    { type: 'Feature', geometry: { type: 'Point', coordinates: [96.20, 16.87] }, properties: { pop: 5 } },    // Yangon
    { type: 'Feature', geometry: { type: 'Point', coordinates: [85.14, 25.61] }, properties: { pop: 7 } },    // Patna
    { type: 'Feature', geometry: { type: 'Point', coordinates: [88.36, 22.57] }, properties: { pop: 15 } },   // Kolkata
    { type: 'Feature', geometry: { type: 'Point', coordinates: [80.27, 13.08] }, properties: { pop: 11 } },   // Chennai
    { type: 'Feature', geometry: { type: 'Point', coordinates: [77.59, 12.97] }, properties: { pop: 13 } },   // Bangalore
    // Middle East
    { type: 'Feature', geometry: { type: 'Point', coordinates: [29.01, 41.01] }, properties: { pop: 16 } },   // Istanbul
    { type: 'Feature', geometry: { type: 'Point', coordinates: [46.72, 24.69] }, properties: { pop: 8 } },    // Riyadh
    // Africa
    { type: 'Feature', geometry: { type: 'Point', coordinates: [31.24, 30.04] }, properties: { pop: 21 } },   // Cairo
    { type: 'Feature', geometry: { type: 'Point', coordinates: [3.39, 6.52] }, properties: { pop: 15 } },     // Lagos
    { type: 'Feature', geometry: { type: 'Point', coordinates: [28.05, -26.20] }, properties: { pop: 6 } },   // Johannesburg
    { type: 'Feature', geometry: { type: 'Point', coordinates: [36.82, -1.29] }, properties: { pop: 5 } },    // Nairobi
    { type: 'Feature', geometry: { type: 'Point', coordinates: [32.58, 0.35] }, properties: { pop: 4 } },     // Kampala
    { type: 'Feature', geometry: { type: 'Point', coordinates: [39.27, -6.80] }, properties: { pop: 7 } },    // Dar es Salaam
    { type: 'Feature', geometry: { type: 'Point', coordinates: [38.75, 9.02] }, properties: { pop: 5 } },     // Addis Ababa
    { type: 'Feature', geometry: { type: 'Point', coordinates: [15.28, -4.27] }, properties: { pop: 15 } },   // Kinshasa
    { type: 'Feature', geometry: { type: 'Point', coordinates: [-17.47, 14.72] }, properties: { pop: 4 } },   // Dakar
    { type: 'Feature', geometry: { type: 'Point', coordinates: [-5.55, 33.57] }, properties: { pop: 4 } },    // Casablanca (Fez)
    // Europe
    { type: 'Feature', geometry: { type: 'Point', coordinates: [37.62, 55.76] }, properties: { pop: 13 } },   // Moscow
    { type: 'Feature', geometry: { type: 'Point', coordinates: [-0.12, 51.51] }, properties: { pop: 9 } },    // London
    { type: 'Feature', geometry: { type: 'Point', coordinates: [2.35, 48.86] }, properties: { pop: 11 } },    // Paris
    { type: 'Feature', geometry: { type: 'Point', coordinates: [-3.70, 40.42] }, properties: { pop: 7 } },    // Madrid
    { type: 'Feature', geometry: { type: 'Point', coordinates: [12.50, 41.90] }, properties: { pop: 4 } },    // Rome
    { type: 'Feature', geometry: { type: 'Point', coordinates: [13.40, 52.52] }, properties: { pop: 4 } },    // Berlin
    { type: 'Feature', geometry: { type: 'Point', coordinates: [30.32, 59.94] }, properties: { pop: 5 } },    // St Petersburg
    { type: 'Feature', geometry: { type: 'Point', coordinates: [23.73, 37.97] }, properties: { pop: 3 } },    // Athens
    // North America
    { type: 'Feature', geometry: { type: 'Point', coordinates: [-99.13, 19.43] }, properties: { pop: 22 } },  // Mexico City
    { type: 'Feature', geometry: { type: 'Point', coordinates: [-74.01, 40.71] }, properties: { pop: 19 } },  // New York
    { type: 'Feature', geometry: { type: 'Point', coordinates: [-118.24, 34.05] }, properties: { pop: 13 } }, // Los Angeles
    { type: 'Feature', geometry: { type: 'Point', coordinates: [-87.63, 41.88] }, properties: { pop: 9 } },   // Chicago
    { type: 'Feature', geometry: { type: 'Point', coordinates: [-95.37, 29.76] }, properties: { pop: 7 } },   // Houston
    { type: 'Feature', geometry: { type: 'Point', coordinates: [-80.19, 25.76] }, properties: { pop: 6 } },   // Miami
    { type: 'Feature', geometry: { type: 'Point', coordinates: [-79.38, 43.65] }, properties: { pop: 6 } },   // Toronto
    { type: 'Feature', geometry: { type: 'Point', coordinates: [-122.42, 37.77] }, properties: { pop: 5 } },  // San Francisco
    { type: 'Feature', geometry: { type: 'Point', coordinates: [-77.04, 38.91] }, properties: { pop: 5 } },   // Washington DC
    { type: 'Feature', geometry: { type: 'Point', coordinates: [-43.17, -22.91] }, properties: { pop: 13 } }, // Rio de Janeiro
    // South America
    { type: 'Feature', geometry: { type: 'Point', coordinates: [-46.63, -23.55] }, properties: { pop: 22 } }, // São Paulo
    { type: 'Feature', geometry: { type: 'Point', coordinates: [-58.38, -34.60] }, properties: { pop: 15 } }, // Buenos Aires
    { type: 'Feature', geometry: { type: 'Point', coordinates: [-75.57, 6.25] }, properties: { pop: 4 } },    // Medellín
    { type: 'Feature', geometry: { type: 'Point', coordinates: [-74.07, 4.71] }, properties: { pop: 11 } },   // Bogotá
    { type: 'Feature', geometry: { type: 'Point', coordinates: [-77.03, -12.05] }, properties: { pop: 11 } }, // Lima
    { type: 'Feature', geometry: { type: 'Point', coordinates: [-70.64, -33.45] }, properties: { pop: 7 } },  // Santiago
    // Oceania
    { type: 'Feature', geometry: { type: 'Point', coordinates: [151.21, -33.87] }, properties: { pop: 5 } },  // Sydney
    { type: 'Feature', geometry: { type: 'Point', coordinates: [144.96, -37.81] }, properties: { pop: 5 } },  // Melbourne
    // Additional major cities
    { type: 'Feature', geometry: { type: 'Point', coordinates: [73.86, 18.52] }, properties: { pop: 7 } },    // Pune
    { type: 'Feature', geometry: { type: 'Point', coordinates: [78.47, 17.38] }, properties: { pop: 10 } },   // Hyderabad
    { type: 'Feature', geometry: { type: 'Point', coordinates: [108.94, 34.26] }, properties: { pop: 9 } },   // Xi'an
    { type: 'Feature', geometry: { type: 'Point', coordinates: [106.55, 29.56] }, properties: { pop: 9 } },   // Chongqing
    { type: 'Feature', geometry: { type: 'Point', coordinates: [112.94, 28.23] }, properties: { pop: 8 } },   // Changsha
    { type: 'Feature', geometry: { type: 'Point', coordinates: [118.79, 32.06] }, properties: { pop: 7 } },   // Nanjing
    { type: 'Feature', geometry: { type: 'Point', coordinates: [120.15, 30.29] }, properties: { pop: 7 } },   // Hangzhou
    { type: 'Feature', geometry: { type: 'Point', coordinates: [103.83, 1.35] }, properties: { pop: 6 } },    // Singapore
    { type: 'Feature', geometry: { type: 'Point', coordinates: [55.27, 25.20] }, properties: { pop: 4 } },    // Dubai
    { type: 'Feature', geometry: { type: 'Point', coordinates: [47.98, 29.38] }, properties: { pop: 3 } },    // Kuwait City
    { type: 'Feature', geometry: { type: 'Point', coordinates: [36.29, 33.51] }, properties: { pop: 3 } },    // Damascus
    { type: 'Feature', geometry: { type: 'Point', coordinates: [35.50, 33.89] }, properties: { pop: 3 } },    // Beirut
    { type: 'Feature', geometry: { type: 'Point', coordinates: [35.22, 31.77] }, properties: { pop: 2 } },    // Jerusalem
    { type: 'Feature', geometry: { type: 'Point', coordinates: [34.78, 32.08] }, properties: { pop: 4 } },    // Tel Aviv
  ],
};

export default POPULATION_POINTS;
