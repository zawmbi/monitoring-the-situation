import { useState, useEffect, useCallback } from 'react';
import { fetchAllSevereEvents } from '../services/severeWeatherService';

/**
 * Hook — fetches severe weather / natural disaster events.
 * Auto-refreshes every 5 minutes while active.
 *
 * @param {boolean} enabled — whether to fetch (tied to sidebar toggle)
 */
export function useSevereWeather(enabled) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAllSevereEvents();
      setEvents(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    load();
    const interval = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [enabled, load]);

  return { events, loading, error, refresh: load };
}
