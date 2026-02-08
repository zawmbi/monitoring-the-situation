import { useCallback, useEffect, useState } from 'react';

// In dev, use relative path so requests go through Vite proxy
const FLIGHTS_API_URL = import.meta.env.DEV
  ? '/api/flights'
  : (import.meta.env.VITE_FLIGHTS_API_URL || '/api/flights');

async function fetchFlightsFromApi() {
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
