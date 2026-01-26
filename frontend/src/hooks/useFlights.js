import { useCallback, useEffect, useState } from 'react';

const FLIGHTS_API_URL = import.meta.env.VITE_FLIGHTS_API_URL || '';

async function fetchFlightsFromApi() {
  if (!FLIGHTS_API_URL) throw new Error('VITE_FLIGHTS_API_URL not set');
  const response = await fetch(FLIGHTS_API_URL);
  if (!response.ok) throw new Error(`Flights API error: ${response.status}`);
  return response.json();
}

export function useFlights(enabled = true) {
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFlights = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchFlightsFromApi();
      const items = data?.data || data || [];
      setFlights(Array.isArray(items) ? items : []);
      setError(null);
    } catch (err) {
      setError(err);
      setFlights([]);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    fetchFlights();
    if (!enabled) return undefined;
    const interval = setInterval(fetchFlights, 300000); // refresh every 5 minutes
    return () => clearInterval(interval);
  }, [enabled, fetchFlights]);

  return { flights, loading, error, refresh: fetchFlights };
}

export default useFlights;
