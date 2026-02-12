/**
 * Country fill colors based on historical, ideological, and cultural groupings.
 * Dark theme: muted, deep tones that evoke regional identity.
 * Light theme: analogous lighter versions.
 */

// ── Regional color palettes (multiple shades per region for neighbor variety) ──

const DARK = {
  // NATO / Western democracies — steel blue / navy (brightened)
  western:    ['#264f7a', '#28528e', '#2b5582', '#24507d', '#275185'],
  // Nordic — icy pale blue (brightened)
  nordic:     ['#215e7c', '#24618f', '#266483', '#1f5c7a'],
  // Eastern Europe (EU) — slate blue, slightly warmer (brightened)
  easternEU:  ['#384a7c', '#3a4d80', '#3c5084', '#36487a', '#394b7e'],
  // Russia — deep crimson (brightened)
  russia:     ['#7a2835'],
  // Post-Soviet CIS (non-EU) — wine / burgundy (brightened)
  postSoviet: ['#632c48', '#66304c', '#683250', '#602a46', '#642e4a'],
  // Central Asia — dusty mauve / steppe (brightened)
  centralAsia:['#54385e', '#563b62', '#583d64', '#52365c', '#553a60'],
  // China — rich red (brightened)
  china:      ['#7e2830'],
  // East Asian democracies — plum / cherry blossom (brightened)
  eastAsia:   ['#643068', '#67336b', '#6a366e'],
  // Southeast Asia — jade / tropical teal (brightened)
  seAsia:     ['#245c56', '#266058', '#28625c', '#225a54', '#255e57'],
  // South Asia — saffron / deep amber (brightened)
  southAsia:  ['#644824', '#674b28', '#6a4e2c', '#624622', '#654a26'],
  // Middle East — desert gold / sand (brightened)
  middleEast: ['#64522a', '#68562e', '#6b5832', '#625028', '#66542c'],
  // North Africa — terracotta / ochre (brightened)
  northAfrica:['#644838', '#68503c', '#6b5240', '#624636', '#664a3a'],
  // West Africa — rich green (brightened)
  westAfrica: ['#2a5e38', '#2d623c', '#306540', '#285c36', '#2c603a'],
  // East Africa — olive green (brightened)
  eastAfrica: ['#3a5e30', '#3d6234', '#406538', '#385c2e', '#3c6032'],
  // Central Africa — deep forest green (brightened)
  centralAfr: ['#244e2e', '#275232', '#2a5436', '#224c2c', '#265030'],
  // Southern Africa — earth brown-green (brightened)
  southernAfr:['#3e4e30', '#425234', '#445438', '#3c4c2e', '#405032'],
  // Latin America — warm emerald (brightened)
  latam:      ['#246444', '#276848', '#2a6a4c', '#226242', '#266646'],
  // Brazil — distinctive green-gold (brightened)
  brazil:     ['#2a6438'],
  // Caribbean — tropical aqua (brightened)
  caribbean:  ['#245464', '#275868', '#2a5a6c', '#225262', '#265666'],
  // Oceania — ocean blue-teal (brightened)
  oceania:    ['#244e6e', '#275272', '#2a5476', '#224c6c', '#265070'],
  // Turkey — bridge of civilizations, muted purple (brightened)
  turkey:     ['#4e3e6a'],
  // Israel — distinct blue-white tradition, muted (brightened)
  israel:     ['#2a4890'],
  // Balkans (non-EU complex states) — muted indigo (brightened)
  balkans:    ['#3e3e70', '#404274', '#424478', '#3c3c6e', '#3f4072'],
  // Fallback — neutral dark grey-blue (brightened)
  fallback:   ['#303848', '#32394a', '#343c4e', '#2e3646', '#313a4a'],
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
