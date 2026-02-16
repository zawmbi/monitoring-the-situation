import { useState, useEffect, useCallback } from 'react';

export function useTension(enabled = true) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    try {
      const res = await fetch('/api/tension');
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (err) {
      console.error('[useTension]', err);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    fetchData();
    if (!enabled) return;
    const interval = setInterval(fetchData, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData, enabled]);

  return { data, loading, refresh: fetchData };
}
