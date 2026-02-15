/**
 * Market Data Service
 * Fetches stock market indices and forex data per country from backend
 */

const API_URL = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || '');

// In-memory cache
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function fetchMarketData(countryCode) {
  if (!countryCode || countryCode.length < 2) return null;

  const code = countryCode.toUpperCase();
  const key = `market_${code}`;

  // Check cache
  const cached = cache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.data;
  }

  try {
    const res = await fetch(`${API_URL}/api/markets/${code}`);
    if (!res.ok) return null;

    const json = await res.json();
    if (!json.success || !json.data) return null;

    cache.set(key, { data: json.data, ts: Date.now() });
    return json.data;
  } catch {
    return null;
  }
}
