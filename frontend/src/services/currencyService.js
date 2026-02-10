/**
 * Currency Exchange Rate Service
 * Uses the free Frankfurter API (no API key needed)
 * Fetches current rate and computes YTD change vs USD
 */

const FRANKFURTER_API = 'https://api.frankfurter.app';

// In-memory cache to avoid duplicate requests
const cache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

function getCacheKey(code) {
  return `currency_${code}`;
}

export async function fetchCurrencyVsUSD(currencyCode) {
  if (!currencyCode || currencyCode === 'USD') {
    return { code: 'USD', rate: 1, ytdChange: 0, ytdStart: 1 };
  }

  const key = getCacheKey(currencyCode);
  const cached = cache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.data;
  }

  try {
    // Fetch current rate and Jan 2 rate in parallel
    const now = new Date();
    const yearStart = `${now.getFullYear()}-01-02`;

    const [currentRes, startRes] = await Promise.all([
      fetch(`${FRANKFURTER_API}/latest?from=USD&to=${currencyCode}`),
      fetch(`${FRANKFURTER_API}/${yearStart}?from=USD&to=${currencyCode}`),
    ]);

    if (!currentRes.ok || !startRes.ok) {
      return null;
    }

    const currentData = await currentRes.json();
    const startData = await startRes.json();

    const currentRate = currentData.rates?.[currencyCode];
    const startRate = startData.rates?.[currencyCode];

    if (!currentRate || !startRate) return null;

    // YTD change: how much has the currency changed vs USD
    // Positive = currency strengthened (fewer units per USD now)
    // Negative = currency weakened (more units per USD now)
    const ytdChange = ((startRate - currentRate) / startRate) * 100;

    const result = {
      code: currencyCode,
      rate: currentRate,
      ytdStart: startRate,
      ytdChange: Math.round(ytdChange * 100) / 100,
    };

    cache.set(key, { data: result, ts: Date.now() });
    return result;
  } catch {
    return null;
  }
}
