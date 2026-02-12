/**
 * useTariffData — fetches live US tariff news and updates from backend
 *
 * Provides:
 *   - news: latest tariff-related news articles
 *   - overrides: any live tariff rate changes detected since static baseline
 *   - loading / error states
 *   - lastUpdated timestamp
 *
 * Falls back gracefully to null values if the backend is unreachable,
 * so the static data in tariffData.js remains the baseline.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';

const REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes

export default function useTariffData(enabled = true) {
  const [news, setNews] = useState([]);
  const [overrides, setOverrides] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const intervalRef = useRef(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);

    try {
      const res = await api.getTariffLive();
      if (res.success && res.data) {
        setNews(res.data.news || []);
        setOverrides(res.data.overrides || {});
        setLastUpdated(res.data.fetchedAt || new Date().toISOString());
      }
    } catch (err) {
      console.warn('[useTariffData] Failed to fetch live data:', err.message);
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
    news,
    overrides,
    loading,
    error,
    lastUpdated,
    refetch: fetchData,
  };
}
