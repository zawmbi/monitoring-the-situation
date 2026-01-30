import { useCallback, useEffect, useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';
const STOCKS_API_URL =
  import.meta.env.VITE_STOCKS_API_URL ||
  (API_BASE_URL ? `${API_BASE_URL.replace(/\/$/, '')}/api/stocks` : '/api/stocks');

async function fetchStocksFromApi() {
  if (!STOCKS_API_URL) throw new Error('Stocks API URL not configured');
  const response = await fetch(STOCKS_API_URL);
  if (!response.ok) throw new Error(`Stocks API error: ${response.status}`);
  return response.json();
}

function parseStocksPayload(payload) {
  const dataContainer = payload?.data && !Array.isArray(payload?.data) ? payload.data : {};
  const itemsSource = Array.isArray(dataContainer?.items)
    ? dataContainer.items
    : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload)
        ? payload
        : [];

  return {
    items: (itemsSource || []).slice(0, 100),
    markets: Array.isArray(dataContainer?.markets) ? dataContainer.markets : [],
    lastUpdated: dataContainer?.lastUpdated || payload?.lastUpdated || null,
    refreshIntervalSeconds: dataContainer?.refreshIntervalSeconds || 300,
  };
}

export function useStocks(enabled = true) {
  const [stocks, setStocks] = useState([]);
  const [marketStatus, setMarketStatus] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshIntervalSeconds, setRefreshIntervalSeconds] = useState(300);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStocks = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    try {
      const payload = await fetchStocksFromApi();
      const parsed = parseStocksPayload(payload);
      setStocks(parsed.items);
      setMarketStatus(parsed.markets);
      setLastUpdated(parsed.lastUpdated || new Date().toISOString());
      setRefreshIntervalSeconds(parsed.refreshIntervalSeconds || 300);
      setError(null);
    } catch (err) {
      setError(err);
      setStocks([]);
      setMarketStatus([]);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    fetchStocks();
  }, [enabled, fetchStocks]);

  useEffect(() => {
    if (!enabled) return undefined;
    const intervalMs = Math.max((refreshIntervalSeconds || 300) * 1000, 30000);
    const interval = setInterval(fetchStocks, intervalMs);
    return () => clearInterval(interval);
  }, [enabled, fetchStocks, refreshIntervalSeconds]);

  return { stocks, marketStatus, lastUpdated, refreshIntervalSeconds, loading, error, refresh: fetchStocks };
}

export default useStocks;
