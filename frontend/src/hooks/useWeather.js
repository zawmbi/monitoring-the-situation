import { useState, useEffect } from 'react';
import { fetchWeatherWithImage } from '../services/weatherService';

/**
 * React hook — fetches weather + background image for a given city.
 * Designed to accept any city; callers typically pass the capital.
 *
 * @param {string|null} cityName   — city to look up, or null to skip
 * @param {string|null} countryCode — optional ISO alpha-2, e.g. "US"
 */
export function useWeather(cityName, countryCode) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!cityName) {
      setWeather(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetchWeatherWithImage(cityName, countryCode)
      .then((data) => {
        if (!cancelled) {
          setWeather(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setWeather(null);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [cityName, countryCode]);

  return { weather, loading };
}
