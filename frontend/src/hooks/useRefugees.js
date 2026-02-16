import { useState, useEffect, useCallback } from 'react';

export function useRefugees(enabled = false) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    try {
      const res = await fetch('/api/refugees');
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (err) {
      console.error('[useRefugees]', err);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    fetchData();
    if (!enabled) return;
    const interval = setInterval(fetchData, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData, enabled]);

  return { data, loading, refresh: fetchData };
}
