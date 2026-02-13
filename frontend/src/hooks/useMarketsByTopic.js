/**
 * useMarketsByTopic Hook
 * Fetches combined prediction markets (Polymarket + Kalshi) by topic keywords
 * Auto-refreshes every 5 minutes
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export function useMarketsByTopic(keywords = [], enabled = true) {
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const keywordsRef = useRef(keywords);

  // Update ref when keywords change (stable reference for comparison)
  const keywordsKey = keywords.sort().join(',');

  const fetchMarkets = useCallback(async () => {
    if (!enabled || !keywordsKey) {
      setMarkets([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('topic', keywordsKey);
      params.set('limit', '10');

      const response = await fetch(`/api/predictions?${params.toString()}`);

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
  }, [keywordsKey, enabled]);

  useEffect(() => {
    if (enabled && keywordsKey) {
      fetchMarkets();
      const interval = setInterval(fetchMarkets, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [fetchMarkets, enabled, keywordsKey]);

  return {
    markets,
    loading,
    error,
    lastUpdated,
    refresh: fetchMarkets,
  };
}

export default useMarketsByTopic;
