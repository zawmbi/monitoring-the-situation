const FX_API =
  import.meta.env.VITE_FX_API ||
  'https://api.frankfurter.dev/v1';

function formatUtcDate(date) {
  return date.toISOString().slice(0, 10);
}

export async function fetchCurrencyYtdChange(currencyCode) {
  if (!currencyCode) return null;
  const today = new Date();
  const year = today.getUTCFullYear();
  const startDate = `${year}-01-01`;
  const endDate = formatUtcDate(today);
  const url = `${FX_API}/${startDate}..${endDate}?base=USD&symbols=${currencyCode}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`FX rate error: ${response.status}`);
  }
  const data = await response.json();
  const rates = data?.rates || {};
  const dates = Object.keys(rates).sort();
  if (dates.length === 0) return null;
  const first = rates[dates[0]]?.[currencyCode];
  const last = rates[dates[dates.length - 1]]?.[currencyCode];
  if (!Number.isFinite(first) || !Number.isFinite(last)) return null;
  const percentChange = ((last - first) / first) * 100;
  return {
    currencyCode,
    startDate: dates[0],
    endDate: dates[dates.length - 1],
    startRate: first,
    latestRate: last,
    percentChange,
  };
}

export default { fetchCurrencyYtdChange };
