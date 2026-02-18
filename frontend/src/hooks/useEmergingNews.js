/**
 * useEmergingNews — fetches emerging development news from backend
 *
 * Provides:
 *   - data: full emerging news payload (watches, hotWatches, feed, summary)
 *   - loading / error states
 *   - lastUpdated timestamp
 *
 * Optionally filter by conflictId to get only relevant emerging stories.
 * Falls back gracefully to empty state if backend is unreachable.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';

const REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes

export default function useEmergingNews({ conflictId = null, enabled = true } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const intervalRef = useRef(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);

    try {
      const res = conflictId
        ? await api.getEmergingByConflict(conflictId)
        : await api.getEmergingNews();

      if (res.success && res.data) {
        setData(res.data);
        setLastUpdated(res.data.fetchedAt || res.timestamp || new Date().toISOString());
      }
    } catch (err) {
      console.warn('[useEmergingNews] Failed to fetch emerging news:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [enabled, conflictId]);

  useEffect(() => {
    if (!enabled) return;

    fetchData();

    intervalRef.current = setInterval(fetchData, REFRESH_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, conflictId, fetchData]);

  return {
    data,
    watches: data?.watches || [],
    hotWatches: data?.hotWatches || [],
    feed: data?.feed || [],
    summary: data?.summary || null,
    loading,
    error,
    lastUpdated,
    refetch: fetchData,
  };
}
