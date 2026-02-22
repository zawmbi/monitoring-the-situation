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

// Dune theme — warm desert tones: amber, sand, ochre, sienna, umber
const DUNE = {
  western:    ['#3a3020', '#3d3224', '#403428', '#38301e', '#3b3222'],
  nordic:     ['#2e3828', '#303a2c', '#323c30', '#2c3626', '#2f3a2a'],
  easternEU:  ['#3a342a', '#3d362e', '#403832', '#383228', '#3b342c'],
  russia:     ['#5a2018'],
  postSoviet: ['#4a2828', '#4d2a2c', '#502c30', '#482626', '#4b2a2a'],
  centralAsia:['#44382a', '#463a2e', '#483c32', '#423628', '#453a2c'],
  china:      ['#5a2020'],
  eastAsia:   ['#4a3030', '#4d3234', '#503438'],
  seAsia:     ['#2a4030', '#2c4234', '#2e4438', '#283e2e', '#2b4032'],
  southAsia:  ['#50402a', '#53422e', '#564432', '#4e3e28', '#51402c'],
  middleEast: ['#4e4428', '#51462c', '#544830', '#4c4226', '#4f442a'],
  northAfrica:['#4e3c28', '#513e2c', '#544030', '#4c3a26', '#4f3c2a'],
  westAfrica: ['#2a4428', '#2c462c', '#2e4830', '#284226', '#2b442a'],
  eastAfrica: ['#344428', '#36462c', '#384830', '#324226', '#35442a'],
  centralAfr: ['#203820', '#223a24', '#243c28', '#1e361e', '#213822'],
  southernAfr:['#363820', '#383a24', '#3a3c28', '#34361e', '#373822'],
  latam:      ['#204432', '#224636', '#244838', '#1e4230', '#214434'],
  brazil:     ['#2a4428'],
  caribbean:  ['#283c3a', '#2a3e3c', '#2c403e', '#263a38', '#293c3a'],
  oceania:    ['#283848', '#2a3a4a', '#2c3c4c', '#263646', '#293a48'],
  turkey:     ['#3e3040'],
  israel:     ['#2a3860'],
  balkans:    ['#343040', '#363244', '#383448', '#322e3e', '#353042'],
  fallback:   ['#2c2820', '#2e2a22', '#302c24', '#2a261e', '#2d2922'],
};

// Ruby theme — deep crimson, burgundy, rose, and dark wine tones
const RUBY = {
  western:    ['#3a2028', '#3d2230', '#402434', '#38202a', '#3b2230'],
  nordic:     ['#2e2838', '#30283a', '#322a3c', '#2c2636', '#2f2838'],
  easternEU:  ['#3a2a30', '#3d2c34', '#402e38', '#38282e', '#3b2a32'],
  russia:     ['#5a1828'],
  postSoviet: ['#4a2030', '#4d2234', '#502438', '#48202e', '#4b2232'],
  centralAsia:['#442830', '#462a34', '#482c38', '#42282e', '#452a32'],
  china:      ['#5a1828'],
  eastAsia:   ['#4a2030', '#4d2234', '#502438'],
  seAsia:     ['#2a3038', '#2c323a', '#2e343c', '#282e36', '#2b3038'],
  southAsia:  ['#503028', '#53322c', '#563430', '#4e2e26', '#51302a'],
  middleEast: ['#4e3028', '#51322c', '#543430', '#4c2e26', '#4f302a'],
  northAfrica:['#4e2828', '#51282c', '#542a30', '#4c2626', '#4f282a'],
  westAfrica: ['#2a3428', '#2c362c', '#2e3830', '#283226', '#2b342a'],
  eastAfrica: ['#343028', '#36322c', '#383430', '#322e26', '#35302a'],
  centralAfr: ['#203028', '#22322c', '#243430', '#1e2e26', '#213028'],
  southernAfr:['#363028', '#38322c', '#3a3430', '#342e26', '#37302a'],
  latam:      ['#203038', '#22323a', '#24343c', '#1e2e36', '#213038'],
  brazil:     ['#2a3828'],
  caribbean:  ['#283038', '#2a323a', '#2c343c', '#262e36', '#293038'],
  oceania:    ['#282838', '#2a2a3a', '#2c2c3c', '#262636', '#292838'],
  turkey:     ['#3e2840'],
  israel:     ['#2a2850'],
  balkans:    ['#342838', '#362a3c', '#382c40', '#322636', '#35283a'],
  fallback:   ['#2c2028', '#2e222a', '#30242c', '#2a1e26', '#2d2028'],
};

// Terra theme — deep forest, emerald, moss, and earthy green tones
const TERRA = {
  western:    ['#203a28', '#223d2c', '#244030', '#1e3826', '#213b2a'],
  nordic:     ['#282e38', '#2a303a', '#2c323c', '#262c36', '#292e38'],
  easternEU:  ['#2a3a30', '#2c3d34', '#2e4038', '#283830', '#2b3a32'],
  russia:     ['#185a28'],
  postSoviet: ['#204a30', '#224d34', '#245038', '#204830', '#224b32'],
  centralAsia:['#284438', '#2a463a', '#2c483c', '#264236', '#294438'],
  china:      ['#185a20'],
  eastAsia:   ['#204a28', '#224d2c', '#245030'],
  seAsia:     ['#1a4030', '#1c4234', '#1e4438', '#183e2e', '#1b4032'],
  southAsia:  ['#304028', '#32422c', '#344430', '#2e3e26', '#31402a'],
  middleEast: ['#384428', '#3a462c', '#3c4830', '#364226', '#39442a'],
  northAfrica:['#383c28', '#3a3e2c', '#3c4030', '#363a26', '#393c2a'],
  westAfrica: ['#1a4428', '#1c462c', '#1e4830', '#184226', '#1b442a'],
  eastAfrica: ['#244428', '#26462c', '#284830', '#224226', '#25442a'],
  centralAfr: ['#143814', '#163a18', '#183c1c', '#123612', '#153816'],
  southernAfr:['#2a3820', '#2c3a24', '#2e3c28', '#28361e', '#2b3822'],
  latam:      ['#144432', '#164636', '#184838', '#124230', '#154434'],
  brazil:     ['#1a4428'],
  caribbean:  ['#203c38', '#223e3a', '#24403c', '#1e3a36', '#213c38'],
  oceania:    ['#203848', '#223a4a', '#243c4c', '#1e3646', '#213848'],
  turkey:     ['#2e3840'],
  israel:     ['#203850'],
  balkans:    ['#283440', '#2a3644', '#2c3848', '#26323e', '#293442'],
  fallback:   ['#202c20', '#222e22', '#243024', '#1e2a1e', '#212c22'],
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
 * @param {boolean|string} themeOrIsLight - Theme ID string or boolean (true = light)
 */
export function getCountryFillColor(name, index, themeOrIsLight) {
  let palettes;
  if (themeOrIsLight === true || themeOrIsLight === 'light-analytic') {
    palettes = LIGHT;
  } else if (themeOrIsLight === 'dune') {
    palettes = DUNE;
  } else if (themeOrIsLight === 'ruby') {
    palettes = RUBY;
  } else if (themeOrIsLight === 'terra') {
    palettes = TERRA;
  } else {
    palettes = DARK;
  }
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
