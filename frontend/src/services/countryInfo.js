const COUNTRY_INFO_API =
  import.meta.env.VITE_COUNTRY_INFO_API ||
  'https://restcountries.com/v3.1/name';

export async function fetchCountryProfile(name) {
  if (!name) return null;
  const url = `${COUNTRY_INFO_API}/${encodeURIComponent(name)}?fullText=true`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Country info error: ${response.status}`);
  }
  const data = await response.json();
  const country = Array.isArray(data) ? data[0] : data;
  if (!country) return null;

  const population = Number.isFinite(country.population)
    ? country.population.toLocaleString()
    : 'Unknown';
  const timezone = Array.isArray(country.timezones)
    ? country.timezones[0]
    : country.timezones || 'UTC';
  const capital = Array.isArray(country.capital) ? country.capital[0] : country.capital;
  const leader =
    country.government?.headOfGovernment ||
    country.government?.headOfState ||
    country.headOfState ||
    country.headOfGovernment ||
    'Unavailable';

  // Extract currencies: { code, name, symbol }
  let currency = null;
  if (country.currencies) {
    const code = Object.keys(country.currencies)[0];
    if (code) {
      currency = {
        code,
        name: country.currencies[code].name,
        symbol: country.currencies[code].symbol,
      };
    }
  }

  // Extract languages as array
  const languages = country.languages
    ? Object.values(country.languages)
    : [];

  // Area in km²
  const area = Number.isFinite(country.area) ? country.area : null;

  // Flag URLs
  const flagUrl = country.flags?.svg || country.flags?.png || null;

  // Continent
  const continent = Array.isArray(country.continents)
    ? country.continents[0]
    : null;

  // cca2 code (for flag CDN etc.)
  const cca2 = country.cca2 || null;

  // Dialing code
  const dialingCode = country.idd?.root
    ? `${country.idd.root}${(country.idd.suffixes || [])[0] || ''}`
    : null;

  // Top-level domain
  const tld = Array.isArray(country.tld) ? country.tld[0] : null;

  // Driving side
  const drivingSide = country.car?.side || null;

  // Demonym
  const demonym = country.demonyms?.eng?.m || null;

  // Gini coefficient (most recent)
  let gini = null;
  if (country.gini) {
    const years = Object.keys(country.gini).sort().reverse();
    if (years.length > 0) {
      gini = { year: years[0], value: country.gini[years[0]] };
    }
  }

  // Lat/lng
  const latlng = Array.isArray(country.latlng) ? country.latlng : null;

  // Landlocked
  const landlocked = country.landlocked || false;

  // Start of week
  const startOfWeek = country.startOfWeek || null;

  return {
    name: country.name?.common || name,
    officialName: country.name?.official || name,
    population,
    populationRaw: country.population,
    timezone,
    timezoneCount: Array.isArray(country.timezones) ? country.timezones.length : 1,
    capital,
    leader,
    region: country.region,
    subregion: country.subregion,
    flag: country.flag,
    flagUrl,
    currency,
    languages,
    area,
    continent,
    cca2,
    independent: country.independent,
    unMember: country.unMember,
    borders: country.borders || [],
    dialingCode,
    tld,
    drivingSide,
    demonym,
    gini,
    latlng,
    landlocked,
    startOfWeek,
    raw: country,
  };
}

export default { fetchCountryProfile };
