/**
 * Country Name Aliases
 * Maps TopoJSON abbreviated/variant names to standard common names
 * used by WORLD_LEADERS, REST Countries API, and approval data.
 */

const COUNTRY_ALIASES = {
  'United States of America': 'United States',
  'Dem. Rep. Congo': 'DR Congo',
  'Central African Rep.': 'Central African Republic',
  'Dominican Rep.': 'Dominican Republic',
  'Eq. Guinea': 'Equatorial Guinea',
  'S. Sudan': 'South Sudan',
  'Bosnia and Herz.': 'Bosnia and Herzegovina',
  'Côte d\'Ivoire': 'Ivory Coast',
  'Macedonia': 'North Macedonia',
  'eSwatini': 'Eswatini',
  'Congo': 'Republic of the Congo',
  'Antigua and Barb.': 'Antigua and Barbuda',
  'St. Vin. and Gren.': 'Saint Vincent and the Grenadines',
  'St. Kitts and Nevis': 'Saint Kitts and Nevis',
  'São Tomé and Principe': 'Sao Tome and Principe',
  'Cabo Verde': 'Cape Verde',
  'Timor-Leste': 'East Timor',
  'Brunei': 'Brunei Darussalam',
  'Solomon Is.': 'Solomon Islands',
  'Marshall Is.': 'Marshall Islands',
  'Cook Is.': 'Cook Islands',
  'Falkland Is.': 'Falkland Islands',
  'Cayman Is.': 'Cayman Islands',
  'British Virgin Is.': 'British Virgin Islands',
  'U.S. Virgin Is.': 'US Virgin Islands',
  'Turks and Caicos Is.': 'Turks and Caicos Islands',
  'N. Mariana Is.': 'Northern Mariana Islands',
  'Faeroe Is.': 'Faroe Islands',
  'Fr. Polynesia': 'French Polynesia',
  'Wallis and Futuna Is.': 'Wallis and Futuna',
  'Br. Indian Ocean Ter.': 'British Indian Ocean Territory',
  'Fr. S. Antarctic Lands': 'French Southern Territories',
  'S. Geo. and the Is.': 'South Georgia',
  'Heard I. and McDonald Is.': 'Heard Island and McDonald Islands',
  'Pitcairn Is.': 'Pitcairn Islands',
  'Indian Ocean Ter.': 'Christmas Island',
  'St-Martin': 'Saint Martin',
  'St-Barthélemy': 'Saint Barthelemy',
  'Curaçao': 'Curacao',
  'Åland': 'Aland Islands',
  'W. Sahara': 'Western Sahara',
  'Somaliland': 'Somalia',
  'N. Cyprus': 'Northern Cyprus',
};

export function resolveCountryName(name) {
  return COUNTRY_ALIASES[name] || name;
}

export default COUNTRY_ALIASES;
