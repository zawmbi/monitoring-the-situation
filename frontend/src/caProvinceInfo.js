/**
 * Canadian province/territory capitals + detailed info.
 * Used when a Canadian province is clicked on the map.
 * Population: 2024 Statistics Canada estimates. Area in km².
 * Premiers current as of early 2026.
 */

const CA_PROVINCE_INFO = {
  'Alberta': { capital: 'Edmonton', abbr: 'AB', timezone: 'UTC-7', capitalCoords: [53.5461, -113.4938], population: 4756408, area: 661848, premier: 'Danielle Smith', premierParty: 'UCP', largestCity: 'Calgary', confederation: 1905, type: 'Province', nickname: 'Wild Rose Country', wiki: 'Danielle_Smith' },
  'British Columbia': { capital: 'Victoria', abbr: 'BC', timezone: 'UTC-8', capitalCoords: [48.4284, -123.3656], population: 5581127, area: 944735, premier: 'David Eby', premierParty: 'NDP', largestCity: 'Vancouver', confederation: 1871, type: 'Province', nickname: 'Beautiful British Columbia', wiki: 'David_Eby' },
  'Manitoba': { capital: 'Winnipeg', abbr: 'MB', timezone: 'UTC-6', capitalCoords: [49.8951, -97.1384], population: 1444190, area: 647797, premier: 'Wab Kinew', premierParty: 'NDP', largestCity: 'Winnipeg', confederation: 1870, type: 'Province', nickname: 'Keystone Province', wiki: 'Wab_Kinew' },
  'New Brunswick': { capital: 'Fredericton', abbr: 'NB', timezone: 'UTC-4', capitalCoords: [45.9636, -66.6431], population: 832118, area: 72908, premier: 'Susan Holt', premierParty: 'Liberal', largestCity: 'Moncton', confederation: 1867, type: 'Province', nickname: 'Picture Province', wiki: 'Susan_Holt_(politician)' },
  'Newfoundland and Labrador': { capital: 'St. John\'s', abbr: 'NL', timezone: 'UTC-3.5', capitalCoords: [47.5615, -52.7126], population: 533710, area: 405212, premier: 'Andrew Furey', premierParty: 'Liberal', largestCity: 'St. John\'s', confederation: 1949, type: 'Province', nickname: 'The Rock', wiki: 'Andrew_Furey' },
  'Northwest Territories': { capital: 'Yellowknife', abbr: 'NT', timezone: 'UTC-7', capitalCoords: [62.4540, -114.3718], population: 44895, area: 1346106, premier: 'R.J. Simpson', premierParty: 'Consensus', largestCity: 'Yellowknife', confederation: 1870, type: 'Territory', nickname: 'True North', wiki: 'R._J._Simpson_(politician)' },
  'Nova Scotia': { capital: 'Halifax', abbr: 'NS', timezone: 'UTC-4', capitalCoords: [44.6488, -63.5752], population: 1058094, area: 55284, premier: 'Tim Houston', premierParty: 'PC', largestCity: 'Halifax', confederation: 1867, type: 'Province', nickname: 'Canada\'s Ocean Playground', wiki: 'Tim_Houston_(politician)' },
  'Nunavut': { capital: 'Iqaluit', abbr: 'NU', timezone: 'UTC-5', capitalCoords: [63.7467, -68.5170], population: 40692, area: 2093190, premier: 'P.J. Akeeagok', premierParty: 'Consensus', largestCity: 'Iqaluit', confederation: 1999, type: 'Territory', nickname: 'Our Land', wiki: 'P.J._Akeeagok' },
  'Ontario': { capital: 'Toronto', abbr: 'ON', timezone: 'UTC-5', capitalCoords: [43.6532, -79.3832], population: 15801768, area: 1076395, premier: 'Doug Ford', premierParty: 'PC', largestCity: 'Toronto', confederation: 1867, type: 'Province', nickname: 'Yours to Discover', wiki: 'Doug_Ford' },
  'Prince Edward Island': { capital: 'Charlottetown', abbr: 'PE', timezone: 'UTC-4', capitalCoords: [46.2382, -63.1311], population: 175853, area: 5660, premier: 'Dennis King', premierParty: 'PC', largestCity: 'Charlottetown', confederation: 1873, type: 'Province', nickname: 'Birthplace of Confederation', wiki: 'Dennis_King_(politician)' },
  'Quebec': { capital: 'Quebec City', abbr: 'QC', timezone: 'UTC-5', capitalCoords: [46.8139, -71.2080], population: 8945000, area: 1542056, premier: 'Francois Legault', premierParty: 'CAQ', largestCity: 'Montreal', confederation: 1867, type: 'Province', nickname: 'La Belle Province', wiki: 'Fran%C3%A7ois_Legault' },
  'Saskatchewan': { capital: 'Regina', abbr: 'SK', timezone: 'UTC-6', capitalCoords: [50.4452, -104.6189], population: 1214684, area: 651036, premier: 'Scott Moe', premierParty: 'SP', largestCity: 'Saskatoon', confederation: 1905, type: 'Province', nickname: 'Land of Living Skies', wiki: 'Scott_Moe' },
  'Yukon': { capital: 'Whitehorse', abbr: 'YT', timezone: 'UTC-7', capitalCoords: [60.7212, -135.0568], population: 44238, area: 482443, premier: 'Ranj Pillai', premierParty: 'Liberal', largestCity: 'Whitehorse', confederation: 1898, type: 'Territory', nickname: 'Canada\'s True North', wiki: 'Ranj_Pillai' },
};

export default CA_PROVINCE_INFO;
