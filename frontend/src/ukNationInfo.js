/**
 * Devolved UK Nations info for the nation info panel.
 * Used when a UK nation is clicked on the map.
 * Population: 2024 estimates. Area in km².
 */

const UK_NATION_INFO = {
  'England': {
    capital: 'London',
    abbr: 'ENG',
    timezone: 'UTC+0',
    capitalCoords: [51.5074, -0.1278],
    population: 56490048,
    area: 130279,
    leader: 'Keir Starmer',
    leaderTitle: 'Prime Minister',
    party: 'Labour',
    wiki: 'Keir_Starmer',
    largestCity: 'London',
    formed: 927,
    type: 'Country',
  },
  'Scotland': {
    capital: 'Edinburgh',
    abbr: 'SCT',
    timezone: 'UTC+0',
    capitalCoords: [55.9533, -3.1883],
    population: 5454000,
    area: 77933,
    leader: 'John Swinney',
    leaderTitle: 'First Minister',
    party: 'SNP',
    wiki: 'John_Swinney',
    largestCity: 'Glasgow',
    formed: 843,
    type: 'Country',
  },
  'Wales': {
    capital: 'Cardiff',
    abbr: 'WLS',
    timezone: 'UTC+0',
    capitalCoords: [51.4816, -3.1791],
    population: 3107500,
    area: 20779,
    leader: 'Eluned Morgan',
    leaderTitle: 'First Minister',
    party: 'Labour',
    wiki: 'Eluned_Morgan,_Baroness_Morgan_of_Ely',
    largestCity: 'Cardiff',
    formed: 1283,
    type: 'Country',
  },
  'Northern Ireland': {
    capital: 'Belfast',
    abbr: 'NIR',
    timezone: 'UTC+0',
    capitalCoords: [54.5973, -5.9301],
    population: 1903100,
    area: 14130,
    leader: 'Michelle O\'Neill',
    leaderTitle: 'First Minister',
    party: 'Sinn Féin',
    wiki: 'Michelle_O%27Neill',
    largestCity: 'Belfast',
    formed: 1921,
    type: 'Province',
  },
};

export default UK_NATION_INFO;
