/**
 * Weather & Image Service
 *
 * Fetches current weather from OpenWeatherMap and a matching photo from Unsplash.
 * Designed to accept any city name so it's easy to expand beyond capitals later.
 *
 * Environment variables (set in .env):
 *   VITE_OPENWEATHER_API_KEY  — free tier key from openweathermap.org
 *   VITE_UNSPLASH_ACCESS_KEY  — free tier key from unsplash.com/developers
 */

const OWM_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY || '';
const UNSPLASH_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY || '';

const OWM_BASE = 'https://api.openweathermap.org/data/2.5/weather';
const UNSPLASH_BASE = 'https://api.unsplash.com/search/photos';

// Simple in-memory cache to avoid duplicate fetches during a session
const cache = new Map();

/**
 * Map OpenWeatherMap condition codes to human-friendly labels + Unsplash queries
 */
function conditionToSearchTerm(weatherMain) {
  const map = {
    Thunderstorm: 'thunderstorm city',
    Drizzle: 'rainy city',
    Rain: 'rainy city',
    Snow: 'snowy city',
    Mist: 'foggy city',
    Smoke: 'hazy city',
    Haze: 'hazy city',
    Dust: 'dusty city',
    Fog: 'foggy city',
    Sand: 'sandstorm',
    Ash: 'volcanic ash',
    Squall: 'stormy city',
    Tornado: 'tornado',
    Clear: 'sunny city skyline',
    Clouds: 'cloudy city',
  };
  return map[weatherMain] || 'city weather';
}

/**
 * Fetch current weather for a city.
 *
 * @param {string} cityName  — e.g. "Washington, D.C." or "Tokyo"
 * @param {string} [countryCode] — optional ISO 3166-1 alpha-2 code, e.g. "US"
 * @returns {Promise<Object|null>} weather data or null if unavailable
 */
export async function fetchWeather(cityName, countryCode) {
  if (!cityName || !OWM_KEY) return null;

  const q = countryCode ? `${cityName},${countryCode}` : cityName;
  const cacheKey = `weather:${q}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  try {
    const url = `${OWM_BASE}?q=${encodeURIComponent(q)}&units=metric&appid=${OWM_KEY}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();

    const result = {
      temp: Math.round(data.main?.temp),
      feelsLike: Math.round(data.main?.feels_like),
      humidity: data.main?.humidity,
      windSpeed: data.wind?.speed,
      condition: data.weather?.[0]?.main || 'Unknown',
      description: data.weather?.[0]?.description || '',
      icon: data.weather?.[0]?.icon || '01d',
      iconUrl: `https://openweathermap.org/img/wn/${data.weather?.[0]?.icon || '01d'}@2x.png`,
    };

    cache.set(cacheKey, result);
    return result;
  } catch {
    return null;
  }
}

/**
 * Fetch a weather-matching background image from Unsplash.
 *
 * @param {string} weatherCondition — e.g. "Clear", "Rain", "Clouds"
 * @returns {Promise<Object|null>} image data { url, thumbUrl, credit, creditLink }
 */
export async function fetchWeatherImage(weatherCondition) {
  if (!weatherCondition || !UNSPLASH_KEY) return null;

  const searchTerm = conditionToSearchTerm(weatherCondition);
  const cacheKey = `img:${searchTerm}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  try {
    const url = `${UNSPLASH_BASE}?query=${encodeURIComponent(searchTerm)}&per_page=5&orientation=landscape&client_id=${UNSPLASH_KEY}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();

    const photos = data.results || [];
    if (photos.length === 0) return null;

    // Pick a random photo from top 5 results for variety
    const photo = photos[Math.floor(Math.random() * photos.length)];
    const result = {
      url: photo.urls?.regular || photo.urls?.small,
      thumbUrl: photo.urls?.thumb,
      credit: photo.user?.name || 'Unknown',
      creditLink: photo.user?.links?.html || '',
    };

    cache.set(cacheKey, result);
    return result;
  } catch {
    return null;
  }
}

/**
 * Combined: fetch weather + matching image for a city.
 * This is the main function consumers should call.
 *
 * @param {string} cityName
 * @param {string} [countryCode]
 * @returns {Promise<Object|null>}
 */
export async function fetchWeatherWithImage(cityName, countryCode) {
  const weather = await fetchWeather(cityName, countryCode);
  if (!weather) return null;

  const image = await fetchWeatherImage(weather.condition);
  return { ...weather, image };
}
