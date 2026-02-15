import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../services/api';

export function useFeed(limit = 80) {
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const hasFetchedRef = useRef(false);

  const fetchFeed = useCallback(async () => {
    // Only show loading spinner on initial fetch, not on background refreshes
    if (!hasFetchedRef.current) setLoading(true);
    try {
      const res = await api.getFeed({ limit });
      const items = res?.data || res || [];
      setFeed(Array.isArray(items) ? items : []);
      setError(null);
      hasFetchedRef.current = true;
    } catch (err) {
      setError(err);
      if (!hasFetchedRef.current) setFeed([]);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchFeed();
    const interval = setInterval(fetchFeed, 60000); // refresh every 60s for dynamic hotspots
    return () => clearInterval(interval);
  }, [fetchFeed]);

  return { feed, loading, error, refresh: fetchFeed };
}

export default useFeed;
