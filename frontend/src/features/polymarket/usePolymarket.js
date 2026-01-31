/**
 * usePolymarket Hook
 * Fetches Polymarket prediction markets
 */

import { useState, useEffect, useCallback } from 'react';

export function usePolymarket(country = null, enabled = true) {
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchMarkets = useCallback(async () => {
    if (!enabled) {
      console.log('[usePolymarket] Disabled, skipping fetch');
      setMarkets([]);
      return;
    }

    console.log('[usePolymarket] Fetching markets for country:', country || 'all');
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (country) {
        params.set('country', country);
      }
      params.set('limit', '50');

      const url = `/api/polymarket?${params.toString()}`;
      console.log('[usePolymarket] Fetching from:', url);

      const response = await fetch(url);
      console.log('[usePolymarket] Response status:', response.status);

      if (!response.ok) {
        const text = await response.text();
        console.error('[usePolymarket] Error response:', text);
        throw new Error(`Failed to fetch Polymarket data: ${response.status}`);
      }

      const result = await response.json();
      console.log('[usePolymarket] Response:', {
        success: result.success,
        count: result.count,
        dataLength: result.data?.length
      });

      if (result.success && Array.isArray(result.data)) {
        console.log('[usePolymarket] Setting', result.data.length, 'markets');
        setMarkets(result.data);
        setLastUpdated(new Date());
      } else {
        console.warn('[usePolymarket] Invalid response format:', result);
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('[usePolymarket] Error:', err);
      setError(err);
      setMarkets([]);
    } finally {
      setLoading(false);
    }
  }, [country, enabled]);

  useEffect(() => {
    if (enabled) {
      fetchMarkets();
      // Refresh every 5 minutes
      const interval = setInterval(fetchMarkets, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [fetchMarkets, enabled]);

  return {
    markets,
    loading,
    error,
    lastUpdated,
    refresh: fetchMarkets,
  };
}

export default usePolymarket;
