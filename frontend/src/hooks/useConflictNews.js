/**
 * useConflictNews — fetches live news for a specific conflict from backend
 *
 * Provides:
 *   - news: array of recent news articles for the conflict
 *   - loading / error states
 *   - lastUpdated timestamp
 *
 * Falls back gracefully to empty array if backend is unreachable.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';

const REFRESH_INTERVAL = 15 * 60 * 1000; // 15 minutes

export default function useConflictNews(conflictId, enabled = true) {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const intervalRef = useRef(null);

  const fetchData = useCallback(async () => {
    if (!enabled || !conflictId) return;
    setLoading(true);
    setError(null);

    try {
      const res = await api.getConflictNewsByType(conflictId, 20);
      if (res.success && res.data) {
        setNews(res.data.items || []);
        setLastUpdated(res.data.fetchedAt || new Date().toISOString());
      }
    } catch (err) {
      console.warn(`[useConflictNews] Failed to fetch news for ${conflictId}:`, err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [enabled, conflictId]);

  useEffect(() => {
    if (!enabled || !conflictId) return;

    fetchData();

    intervalRef.current = setInterval(fetchData, REFRESH_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, conflictId, fetchData]);

  return {
    news,
    loading,
    error,
    lastUpdated,
    refetch: fetchData,
  };
}
