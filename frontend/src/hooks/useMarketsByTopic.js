/**
 * useMarketsByTopic Hook
 * Fetches combined prediction markets (Polymarket + Kalshi) by topic keywords
 * Uses required keywords (must match) + optional boost keywords (improve ranking)
 * Auto-refreshes every 5 minutes
 */

import { useState, useEffect, useCallback } from 'react';

export function useMarketsByTopic(requiredKeywords = [], boostKeywords = [], enabled = true) {
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Stable key for required + boost keywords
  const requireKey = [...requiredKeywords].sort().join(',');
  const boostKey = [...boostKeywords].sort().join(',');

  const fetchMarkets = useCallback(async () => {
    if (!enabled || !requireKey) {
      setMarkets([]);
      return;
    }

    setLoading(true);
    setError(null);

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

      if (!response.ok) {
        throw new Error(`Failed to fetch predictions: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && Array.isArray(result.data)) {
        setMarkets(result.data);
        setLastUpdated(new Date());
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('[useMarketsByTopic] Error:', err);
      setError(err);
      setMarkets([]);
    } finally {
      setLoading(false);
    }
  }, [requireKey, boostKey, enabled]);

  useEffect(() => {
    if (enabled && requireKey) {
      fetchMarkets();
      const interval = setInterval(fetchMarkets, 5 * 60 * 1000);
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
