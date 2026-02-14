import { useCallback, useEffect, useState } from 'react';

const API_URL = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || '');

async function fetchFinancialData() {
  const res = await fetch(`${API_URL}/api/financial`);
  if (!res.ok) throw new Error(`Financial API error: ${res.status}`);
  const json = await res.json();
  return json.data || null;
}

export function useFinancialData(enabled = true) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!enabled) { setLoading(false); return; }
    setLoading(true);
    try {
      const result = await fetchFinancialData();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => { refresh(); }, [refresh]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    if (!enabled) return;
    const interval = setInterval(refresh, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [enabled, refresh]);

  return { data, loading, error, refresh };
}

export default useFinancialData;
