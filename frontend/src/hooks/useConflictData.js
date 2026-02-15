/**
 * useConflictData — fetches live Russia-Ukraine war data from backend
 *
 * Provides:
 *   - losses: latest Russian equipment/personnel losses (daily UA MOD report)
 *   - lossesHistory: recent trend data for charting
 *   - news: latest war-related news articles
 *   - loading / error states
 *   - lastUpdated timestamp
 *
 * Falls back gracefully to null values if the backend is unreachable,
 * so the static data in conflictData.js remains the baseline.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';

const REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes

export default function useConflictData(enabled = true) {
  const [losses, setLosses] = useState(null);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const intervalRef = useRef(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);

    try {
      const res = await api.getConflictLive();
      if (res.success && res.data) {
        setLosses(res.data.losses || null);
        setNews(res.data.news || []);
        setLastUpdated(res.data.fetchedAt || new Date().toISOString());
      }
    } catch (err) {
      console.warn('[useConflictData] Failed to fetch live data:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    // Initial fetch
    fetchData();

    // Periodic refresh
    intervalRef.current = setInterval(fetchData, REFRESH_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, fetchData]);

  return {
    losses,
    news,
    loading,
    error,
    lastUpdated,
    refetch: fetchData,
  };
}
