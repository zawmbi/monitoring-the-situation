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

  return {
    name: country.name?.common || name,
    officialName: country.name?.official || name,
    population,
    timezone,
    capital,
    leader,
    region: country.region,
    subregion: country.subregion,
    flag: country.flag,
    raw: country,
  };
}

export default { fetchCountryProfile };
