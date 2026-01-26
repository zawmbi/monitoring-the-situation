import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api';

export function useFeed(limit = 80) {
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFeed = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getFeed({ limit });
      const items = res?.data || res || [];
      setFeed(Array.isArray(items) ? items : []);
      setError(null);
    } catch (err) {
      setError(err);
      setFeed([]);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchFeed();
    const interval = setInterval(fetchFeed, 300000); // refresh every 5 minutes
    return () => clearInterval(interval);
  }, [fetchFeed]);

  return { feed, loading, error, refresh: fetchFeed };
}

export default useFeed;
