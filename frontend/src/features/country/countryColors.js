/**
 * Country fill colors based on historical, ideological, and cultural groupings.
 * Dark theme: muted, deep tones that evoke regional identity.
 * Light theme: analogous lighter versions.
 */

// ── Regional color palettes (multiple shades per region for neighbor variety) ──

const DARK = {
  // NATO / Western democracies — steel blue / navy
  western:    ['#1b3a5e', '#1d3c62', '#1f3e66', '#1a3860', '#1e3b63'],
  // Nordic — icy pale blue
  nordic:     ['#184860', '#1a4a63', '#1c4c66', '#174660'],
  // Eastern Europe (EU) — slate blue, slightly warmer
  easternEU:  ['#2a3560', '#2c3864', '#2e3a68', '#28335e', '#2b3662'],
  // Russia — deep crimson
  russia:     ['#5a1e28'],
  // Post-Soviet CIS (non-EU) — wine / burgundy
  postSoviet: ['#4a2035', '#4c2238', '#4e243a', '#482034', '#4b2237'],
  // Central Asia — dusty mauve / steppe
  centralAsia:['#3e2845', '#402a48', '#422c4a', '#3c2644', '#3f2947'],
  // China — rich red
  china:      ['#5e1c22'],
  // East Asian democracies — plum / cherry blossom
  eastAsia:   ['#4a2250', '#4d2453', '#502656'],
  // Southeast Asia — jade / tropical teal
  seAsia:     ['#1a4540', '#1c4843', '#1e4a46', '#184340', '#1b4642'],
  // South Asia — saffron / deep amber
  southAsia:  ['#4a3518', '#4d381b', '#503a1e', '#483418', '#4b361a'],
  // Middle East — desert gold / sand
  middleEast: ['#4a3d1e', '#4d4021', '#504224', '#483c1e', '#4b3f20'],
  // North Africa — terracotta / ochre
  northAfrica:['#4a3528', '#4d382b', '#503a2e', '#483428', '#4b372a'],
  // West Africa — rich green
  westAfrica: ['#1e4528', '#20482b', '#224a2e', '#1c4326', '#1f4629'],
  // East Africa — olive green
  eastAfrica: ['#2a4522', '#2c4825', '#2e4a28', '#284320', '#2b4623'],
  // Central Africa — deep forest green
  centralAfr: ['#1a3a20', '#1c3d23', '#1e3f26', '#18381e', '#1b3b21'],
  // Southern Africa — earth brown-green
  southernAfr:['#2e3a22', '#303d25', '#323f28', '#2c3820', '#2f3b23'],
  // Latin America — warm emerald
  latam:      ['#1a4a32', '#1c4d35', '#1e4f38', '#184830', '#1b4b33'],
  // Brazil — distinctive green-gold
  brazil:     ['#1e4a28'],
  // Caribbean — tropical aqua
  caribbean:  ['#1a3e4a', '#1c414d', '#1e4350', '#183c48', '#1b3f4b'],
  // Oceania — ocean blue-teal
  oceania:    ['#1a3854', '#1c3b57', '#1e3d5a', '#183652', '#1b3955'],
  // Turkey — bridge of civilizations, muted purple
  turkey:     ['#3a2e50'],
  // Israel — distinct blue-white tradition, muted
  israel:     ['#1e3570'],
  // Balkans (non-EU complex states) — muted indigo
  balkans:    ['#2e2e55', '#303058', '#32325a', '#2c2c52', '#2f2f56'],
  // Fallback — neutral dark grey-blue
  fallback:   ['#222838', '#24293a', '#262b3c', '#202636', '#232939'],
};

const LIGHT = {
  western:    ['#5a8aaa', '#5c8dad', '#5e90b0', '#5888a8', '#5b8bab'],
  nordic:     ['#6a9ab0', '#6c9db3', '#6ea0b6', '#6898ae', '#6b9bb1'],
  easternEU:  ['#6a80aa', '#6c83ad', '#6e86b0', '#687ea8', '#6b81ab'],
  russia:     ['#b06060'],
  postSoviet: ['#8a6878', '#8c6b7b', '#8e6d7e', '#886676', '#8b6979'],
  centralAsia:['#8a7098', '#8c739b', '#8e769e', '#886e96', '#8b7199'],
  china:      ['#a85858'],
  eastAsia:   ['#9a6aa0', '#9d6da3', '#a070a6'],
  seAsia:     ['#4a9a8a', '#4c9d8d', '#4ea090', '#489888', '#4b9b8b'],
  southAsia:  ['#aa8a50', '#ad8d53', '#b09056', '#a8884e', '#ab8b51'],
  middleEast: ['#aa9558', '#ad985b', '#b09b5e', '#a89356', '#ab9659'],
  northAfrica:['#aa8868', '#ad8b6b', '#b08e6e', '#a88666', '#ab8969'],
  westAfrica: ['#4a9a5a', '#4c9d5d', '#4ea060', '#489858', '#4b9b5b'],
  eastAfrica: ['#6a9a5a', '#6c9d5d', '#6ea060', '#689858', '#6b9b5b'],
  centralAfr: ['#3a8a48', '#3c8d4b', '#3e904e', '#388846', '#3b8b49'],
  southernAfr:['#6a8a50', '#6c8d53', '#6e9056', '#688850', '#6b8b52'],
  latam:      ['#3a9a6a', '#3c9d6d', '#3ea070', '#389868', '#3b9b6b'],
  brazil:     ['#3a9a58'],
  caribbean:  ['#4a8a9a', '#4c8d9d', '#4e90a0', '#488898', '#4b8b9b'],
  oceania:    ['#4a80a0', '#4c83a3', '#4e86a6', '#487e9e', '#4b81a1'],
  turkey:     ['#7a6a98'],
  israel:     ['#5a78b0'],
  balkans:    ['#6a6a9a', '#6c6c9d', '#6e6ea0', '#686898', '#6b6b9b'],
  fallback:   ['#8898a8', '#8a9bab', '#8c9eae', '#8696a6', '#8999a9'],
};

// ── Country → region mapping (using raw TopoJSON names) ──

const REGION_MAP = {
  // NATO / Western democracies
  'United States of America': 'western',
  'Canada': 'western',
  'United Kingdom': 'western',
  'France': 'western',
  'Germany': 'western',
  'Italy': 'western',
  'Spain': 'western',
  'Portugal': 'western',
  'Netherlands': 'western',
  'Belgium': 'western',
  'Luxembourg': 'western',
  'Ireland': 'western',
  'Austria': 'western',
  'Switzerland': 'western',
  'Greece': 'western',

  // Nordic
  'Norway': 'nordic',
  'Sweden': 'nordic',
  'Finland': 'nordic',
  'Denmark': 'nordic',
  'Iceland': 'nordic',

  // Eastern Europe (EU members)
  'Poland': 'easternEU',
  'Czechia': 'easternEU',
  'Czech Rep.': 'easternEU',
  'Slovakia': 'easternEU',
  'Hungary': 'easternEU',
  'Romania': 'easternEU',
  'Bulgaria': 'easternEU',
  'Croatia': 'easternEU',
  'Slovenia': 'easternEU',
  'Lithuania': 'easternEU',
  'Latvia': 'easternEU',
  'Estonia': 'easternEU',
  'Cyprus': 'easternEU',
  'Malta': 'easternEU',

  // Russia
  'Russia': 'russia',

  // Post-Soviet / CIS
  'Ukraine': 'postSoviet',
  'Belarus': 'postSoviet',
  'Moldova': 'postSoviet',
  'Georgia': 'postSoviet',
  'Armenia': 'postSoviet',
  'Azerbaijan': 'postSoviet',

  // Central Asia
  'Kazakhstan': 'centralAsia',
  'Uzbekistan': 'centralAsia',
  'Turkmenistan': 'centralAsia',
  'Tajikistan': 'centralAsia',
  'Kyrgyzstan': 'centralAsia',
  'Mongolia': 'centralAsia',

  // China
  'China': 'china',

  // East Asian democracies
  'Japan': 'eastAsia',
  'S. Korea': 'eastAsia',
  'South Korea': 'eastAsia',
  'Taiwan': 'eastAsia',

  // North Korea — use China's color family
  'N. Korea': 'china',
  'North Korea': 'china',

  // Southeast Asia
  'Vietnam': 'seAsia',
  'Thailand': 'seAsia',
  'Myanmar': 'seAsia',
  'Laos': 'seAsia',
  'Cambodia': 'seAsia',
  'Philippines': 'seAsia',
  'Malaysia': 'seAsia',
  'Indonesia': 'seAsia',
  'Singapore': 'seAsia',
  'Brunei': 'seAsia',
  'Timor-Leste': 'seAsia',
  'Papua New Guinea': 'seAsia',

  // South Asia
  'India': 'southAsia',
  'Pakistan': 'southAsia',
  'Bangladesh': 'southAsia',
  'Sri Lanka': 'southAsia',
  'Nepal': 'southAsia',
  'Bhutan': 'southAsia',
  'Afghanistan': 'southAsia',
  'Maldives': 'southAsia',

  // Turkey (bridge between East and West)
  'Turkey': 'turkey',

  // Israel
  'Israel': 'israel',

  // Middle East
  'Saudi Arabia': 'middleEast',
  'Iran': 'middleEast',
  'Iraq': 'middleEast',
  'Syria': 'middleEast',
  'Jordan': 'middleEast',
  'Lebanon': 'middleEast',
  'Yemen': 'middleEast',
  'Oman': 'middleEast',
  'United Arab Emirates': 'middleEast',
  'Qatar': 'middleEast',
  'Kuwait': 'middleEast',
  'Bahrain': 'middleEast',
  'Palestine': 'middleEast',

  // North Africa
  'Morocco': 'northAfrica',
  'Algeria': 'northAfrica',
  'Tunisia': 'northAfrica',
  'Libya': 'northAfrica',
  'Egypt': 'northAfrica',
  'Sudan': 'northAfrica',
  'W. Sahara': 'northAfrica',
  'Western Sahara': 'northAfrica',

  // West Africa
  'Nigeria': 'westAfrica',
  'Ghana': 'westAfrica',
  'Senegal': 'westAfrica',
  'Mali': 'westAfrica',
  'Burkina Faso': 'westAfrica',
  'Niger': 'westAfrica',
  'Guinea': 'westAfrica',
  'Sierra Leone': 'westAfrica',
  'Liberia': 'westAfrica',
  "Côte d'Ivoire": 'westAfrica',
  'Ivory Coast': 'westAfrica',
  'Togo': 'westAfrica',
  'Benin': 'westAfrica',
  'Gambia': 'westAfrica',
  'Guinea-Bissau': 'westAfrica',
  'Mauritania': 'westAfrica',
  'Cape Verde': 'westAfrica',

  // East Africa
  'Ethiopia': 'eastAfrica',
  'Kenya': 'eastAfrica',
  'Tanzania': 'eastAfrica',
  'Uganda': 'eastAfrica',
  'Rwanda': 'eastAfrica',
  'Burundi': 'eastAfrica',
  'Somalia': 'eastAfrica',
  'Somaliland': 'eastAfrica',
  'Djibouti': 'eastAfrica',
  'Eritrea': 'eastAfrica',
  'S. Sudan': 'eastAfrica',
  'South Sudan': 'eastAfrica',
  'Madagascar': 'eastAfrica',

  // Central Africa
  'Dem. Rep. Congo': 'centralAfr',
  'Congo': 'centralAfr',
  'Cameroon': 'centralAfr',
  'Central African Rep.': 'centralAfr',
  'Chad': 'centralAfr',
  'Gabon': 'centralAfr',
  'Eq. Guinea': 'centralAfr',
  'Equatorial Guinea': 'centralAfr',

  // Southern Africa
  'South Africa': 'southernAfr',
  'Namibia': 'southernAfr',
  'Botswana': 'southernAfr',
  'Zimbabwe': 'southernAfr',
  'Mozambique': 'southernAfr',
  'Zambia': 'southernAfr',
  'Malawi': 'southernAfr',
  'Angola': 'southernAfr',
  'Lesotho': 'southernAfr',
  'eSwatini': 'southernAfr',
  'Swaziland': 'southernAfr',
  'Comoros': 'southernAfr',
  'Mauritius': 'southernAfr',

  // Latin America
  'Mexico': 'latam',
  'Guatemala': 'latam',
  'Belize': 'latam',
  'Honduras': 'latam',
  'El Salvador': 'latam',
  'Nicaragua': 'latam',
  'Costa Rica': 'latam',
  'Panama': 'latam',
  'Colombia': 'latam',
  'Venezuela': 'latam',
  'Ecuador': 'latam',
  'Peru': 'latam',
  'Bolivia': 'latam',
  'Paraguay': 'latam',
  'Uruguay': 'latam',
  'Chile': 'latam',
  'Argentina': 'latam',
  'Guyana': 'latam',
  'Suriname': 'latam',
  'Falkland Is.': 'latam',
  'Fr. S. Antarctic Lands': 'latam',

  // Brazil (distinctive)
  'Brazil': 'brazil',

  // Caribbean
  'Cuba': 'caribbean',
  'Jamaica': 'caribbean',
  'Haiti': 'caribbean',
  'Dominican Rep.': 'caribbean',
  'Dominican Republic': 'caribbean',
  'Trinidad and Tobago': 'caribbean',
  'Bahamas': 'caribbean',
  'Puerto Rico': 'caribbean',

  // Balkans (non-EU complex history)
  'Serbia': 'balkans',
  'Bosnia and Herz.': 'balkans',
  'Bosnia and Herzegovina': 'balkans',
  'Kosovo': 'balkans',
  'Albania': 'balkans',
  'Montenegro': 'balkans',
  'North Macedonia': 'balkans',
  'N. Macedonia': 'balkans',

  // Oceania
  'Australia': 'oceania',
  'New Zealand': 'oceania',
  'Fiji': 'oceania',
  'New Caledonia': 'oceania',
  'Solomon Is.': 'oceania',
  'Vanuatu': 'oceania',
};

// Simple hash for consistent variation within a palette
function nameHash(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = ((h << 5) - h + name.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/**
 * Get a culturally-informed fill color for a country.
 * @param {string} name - TopoJSON country name
 * @param {number} index - Feature array index (fallback)
 * @param {boolean} isLight - Whether light theme is active
 */
export function getCountryFillColor(name, index, isLight) {
  const palettes = isLight ? LIGHT : DARK;
  const region = REGION_MAP[name];

  if (region && palettes[region]) {
    const colors = palettes[region];
    const pick = nameHash(name) % colors.length;
    return colors[pick];
  }

  // Fallback: use neutral palette with stride
  const fb = palettes.fallback;
  return fb[(index * 11) % fb.length];
}
