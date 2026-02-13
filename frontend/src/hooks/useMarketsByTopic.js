/**
 * useMarketsByTopic Hook
 * Fetches combined prediction markets (Polymarket + Kalshi) by topic keywords
 * Uses stale-while-revalidate: keeps showing old data during refresh
 * Auto-refreshes every 90 seconds for live feel
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export function useMarketsByTopic(requiredKeywords = [], boostKeywords = [], enabled = true) {
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const isMounted = useRef(true);

  const requireKey = [...requiredKeywords].sort().join(',');
  const boostKey = [...boostKeywords].sort().join(',');

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const fetchMarkets = useCallback(async () => {
    if (!enabled || !requireKey) {
      setMarkets([]);
      return;
    }

    setLoading(true);
    // Don't clear error or markets — stale-while-revalidate

    try {
      const params = new URLSearchParams();
      params.set('q', requireKey);
      if (boostKey) params.set('boost', boostKey);
      params.set('limit', '8');

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);

      const response = await fetch(`/api/predictions?${params.toString()}`, {
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) throw new Error(`${response.status}`);

      const result = await response.json();

      if (!isMounted.current) return;

      if (result.success && Array.isArray(result.data)) {
        setMarkets(result.data);
        setLastUpdated(new Date());
        setError(null);
      }
    } catch (err) {
      if (!isMounted.current) return;
      // On error, keep showing stale data (don't clear markets)
      // Only set error if we have no data to show
      if (markets.length === 0) {
        setError(err);
      }
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [requireKey, boostKey, enabled]);

  useEffect(() => {
    if (enabled && requireKey) {
      fetchMarkets();
      // Live update every 90 seconds
      const interval = setInterval(fetchMarkets, 90 * 1000);
      return () => clearInterval(interval);
    }
  }, [fetchMarkets, enabled, requireKey]);

  return {
    markets,
    loading,
    error,
    lastUpdated,
    refresh: fetchMarkets,
  };
}

export default useMarketsByTopic;
