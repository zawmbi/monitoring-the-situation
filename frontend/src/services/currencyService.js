/**
 * Currency Exchange Rate Service
 * Uses the free Frankfurter API (no API key needed)
 * Fetches current rate and computes YTD change vs USD
 */

const FRANKFURTER_API = 'https://api.frankfurter.app';

// In-memory cache to avoid duplicate requests
const cache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// Fallback approximate rates for currencies not in Frankfurter
// (Frankfurter only supports ~33 currencies)
const FALLBACK_RATES = {
  ARS: 1050, NGN: 1550, PKR: 278, BDT: 121, LKR: 325,
  EGP: 50.5, UAH: 41.5, KES: 129, GHS: 15.8, ETB: 127,
  TZS: 2650, UGX: 3750, COP: 4150, PEN: 3.72, VES: 46.5,
  CLP: 950, UYU: 43.5, PYG: 7850, BOB: 6.91, CRC: 510,
  GTQ: 7.72, HNL: 25.3, NIO: 36.8, DOP: 60.5, JMD: 157,
  TTD: 6.78, HTG: 132, BZD: 2.0, GYD: 209, SRD: 35.5,
  AED: 3.67, QAR: 3.64, BHD: 0.376, OMR: 0.385, KWD: 0.307,
  JOD: 0.709, LBP: 89500, IQD: 1310, IRR: 42100, SYP: 13000,
  YER: 250, AFN: 72.5, MMK: 2100, KHR: 4100, LAK: 21800,
  MNT: 3440, KGS: 87.5, TJS: 10.9, UZS: 12800, TMT: 3.5,
  KZT: 500, GEL: 2.75, AMD: 387, AZN: 1.7, BYN: 3.27,
  RSD: 109, BAM: 1.82, MKD: 57.5, ALL: 93.5, XOF: 610,
  XAF: 610, CDF: 2850, MZN: 63.8, AOA: 920, MAD: 10.0,
  TND: 3.12, DZD: 135, LYD: 4.85, SDG: 600, SSP: 1700,
  RWF: 1380, ZMW: 27.5, MWK: 1740, BWP: 13.8, NAD: 18.2,
  LSL: 18.2, SZL: 18.2, MGA: 4600, MUR: 46.2, SCR: 14.2,
  CVE: 102, GMD: 72, GNF: 8650, SLL: 22500, LRD: 192,
  BIF: 2950, DJF: 178, SOS: 571, ERN: 15,
  KPW: 900, CUP: 24, TWD: 32.5, VND: 25400, MYR: 4.72,
  PHP: 58.5, THB: 36.2, IDR: 16200, SGD: 1.35, BND: 1.35,
  NPR: 134, BTN: 84, MVR: 15.4, LKR: 325,
  FJD: 2.28, PGK: 4.0, SBD: 8.5, WST: 2.78, TOP: 2.38,
  VUV: 120,
};

function getFallbackRate(code) {
  if (!FALLBACK_RATES[code]) return null;
  return {
    code,
    rate: FALLBACK_RATES[code],
    ytdStart: FALLBACK_RATES[code],
    ytdChange: 0,
  };
}

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

    if (!currentRate || !startRate) return getFallbackRate(currencyCode);

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
    return getFallbackRate(currencyCode);
  }
}
