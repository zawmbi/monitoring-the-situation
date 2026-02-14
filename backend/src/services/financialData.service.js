/**
 * Financial Data Service
 * Deep/arcane financial market data: treasury yields, volatility, credit/CDS proxies,
 * dollar index, extended commodities, fear & greed, sovereign bond yields.
 * Uses Yahoo Finance chart API (no key) + alternative.me (no key).
 */

import { cacheService } from './cache.service.js';

const CACHE_TTL = 300; // 5 min
const FEAR_GREED_TTL = 900; // 15 min

// ── Yahoo Finance quote helper (same pattern as markets.service.js) ──

async function fetchQuote(symbol) {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=5d`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const result = json.chart?.result?.[0];
    if (!result) return null;

    const meta = result.meta;
    const price = meta.regularMarketPrice;
    const prevClose = meta.chartPreviousClose ?? meta.previousClose;
    if (price == null) return null;

    const change = prevClose != null ? price - prevClose : null;
    const changePct = prevClose ? ((price - prevClose) / prevClose) * 100 : null;

    // Get 5-day history for sparkline
    const timestamps = result.timestamp || [];
    const closes = result.indicators?.quote?.[0]?.close || [];
    const history = timestamps.map((ts, i) => ({
      date: new Date(ts * 1000).toISOString().split('T')[0],
      close: closes[i],
    })).filter(d => d.close != null);

    return {
      price,
      change,
      changePercent: changePct,
      previousClose: prevClose ?? null,
      dayHigh: meta.regularMarketDayHigh ?? null,
      dayLow: meta.regularMarketDayLow ?? null,
      volume: meta.regularMarketVolume ?? null,
      marketState: meta.marketState ?? null,
      currency: meta.currency ?? null,
      history,
    };
  } catch (err) {
    console.warn(`[Financial] fetchQuote failed for ${symbol}: ${err.message}`);
    return null;
  }
}

async function fetchMultipleQuotes(symbols) {
  const results = await Promise.allSettled(
    symbols.map(async (s) => {
      const q = await fetchQuote(s.symbol);
      return q ? { ...s, ...q } : null;
    })
  );
  return results
    .filter(r => r.status === 'fulfilled' && r.value)
    .map(r => r.value);
}

// ── Definitions ──

const TREASURY_SYMBOLS = [
  { symbol: '^IRX', name: '13-Week T-Bill', maturity: '13W', years: 0.25 },
  { symbol: '2YY=F', name: '2-Year Yield', maturity: '2Y', years: 2 },
  { symbol: '^FVX', name: '5-Year Yield', maturity: '5Y', years: 5 },
  { symbol: '^TNX', name: '10-Year Yield', maturity: '10Y', years: 10 },
  { symbol: '^TYX', name: '30-Year Yield', maturity: '30Y', years: 30 },
];

const VOLATILITY_SYMBOLS = [
  { symbol: '^VIX', name: 'CBOE VIX', description: 'S&P 500 implied vol (30d)' },
  { symbol: '^MOVE', name: 'MOVE Index', description: 'Treasury bond implied vol' },
  { symbol: '^VXN', name: 'VXN', description: 'NASDAQ 100 implied vol' },
];

const CREDIT_SYMBOLS = [
  { symbol: 'HYG', name: 'iShares High Yield', description: 'US high-yield corporate bonds', category: 'high-yield' },
  { symbol: 'JNK', name: 'SPDR High Yield', description: 'US junk bonds', category: 'high-yield' },
  { symbol: 'LQD', name: 'iShares IG Corp', description: 'US investment-grade corporate bonds', category: 'investment-grade' },
  { symbol: 'EMB', name: 'iShares EM Bonds', description: 'Emerging market sovereign debt', category: 'emerging' },
  { symbol: 'TLT', name: 'iShares 20+ Treasury', description: 'Long-duration US Treasuries', category: 'sovereign' },
  { symbol: 'BKLN', name: 'Invesco Senior Loan', description: 'Senior secured bank loans', category: 'leveraged-loans' },
];

const DXY_SYMBOL = { symbol: 'DX-Y.NYB', name: 'US Dollar Index (DXY)', description: 'Trade-weighted USD vs basket of 6 currencies' };

const EXTENDED_COMMODITIES = [
  { symbol: 'HG=F', name: 'Copper', unit: '/lb', category: 'industrial' },
  { symbol: 'PL=F', name: 'Platinum', unit: '/oz', category: 'precious' },
  { symbol: 'PA=F', name: 'Palladium', unit: '/oz', category: 'precious' },
  { symbol: 'ZW=F', name: 'Wheat', unit: '/bu', category: 'agriculture' },
  { symbol: 'ZC=F', name: 'Corn', unit: '/bu', category: 'agriculture' },
  { symbol: 'ZS=F', name: 'Soybeans', unit: '/bu', category: 'agriculture' },
  { symbol: 'KC=F', name: 'Coffee', unit: '/lb', category: 'agriculture' },
  { symbol: 'CT=F', name: 'Cotton', unit: '/lb', category: 'agriculture' },
  { symbol: 'LBS=F', name: 'Lumber', unit: '/mbf', category: 'industrial' },
  { symbol: 'URA', name: 'Uranium ETF', unit: '', category: 'energy' },
];

// Sovereign 10Y bond yield proxies — countries with Yahoo Finance symbols
const SOVEREIGN_YIELDS = [
  { symbol: '^TNX', name: 'US 10Y', country: 'US' },
  { symbol: '^TMBMKDE-10Y', name: 'Germany 10Y', country: 'DE' },
  { symbol: '^TMBMKGB-10Y', name: 'UK 10Y', country: 'GB' },
  { symbol: '^TMBMKJP-10Y', name: 'Japan 10Y', country: 'JP' },
  { symbol: '^TMBMKFR-10Y', name: 'France 10Y', country: 'FR' },
  { symbol: '^TMBMKIT-10Y', name: 'Italy 10Y', country: 'IT' },
  { symbol: '^TMBMKES-10Y', name: 'Spain 10Y', country: 'ES' },
  { symbol: '^TMBMKAU-10Y', name: 'Australia 10Y', country: 'AU' },
  { symbol: '^TMBMKCA-10Y', name: 'Canada 10Y', country: 'CA' },
  { symbol: '^TMBMKIN-10Y', name: 'India 10Y', country: 'IN' },
  { symbol: '^TMBMKCN-10Y', name: 'China 10Y', country: 'CN' },
  { symbol: '^TMBMKBR-10Y', name: 'Brazil 10Y', country: 'BR' },
];

// ── Fear & Greed computation ──

function computeFearGreedFromMarketData(vix, yieldSlope, hyg, spy) {
  // Simple composite: lower VIX = greedier, steeper curve = greedier,
  // HYG up = greedier, SPY up = greedier
  const scores = [];

  if (vix?.price != null) {
    // VIX: 10 = extreme greed (100), 40+ = extreme fear (0)
    const vixScore = Math.max(0, Math.min(100, ((40 - vix.price) / 30) * 100));
    scores.push(vixScore);
  }

  if (yieldSlope != null) {
    // Yield slope (10Y - 2Y): +2% = greed (80), -1% = fear (20)
    const slopeScore = Math.max(0, Math.min(100, ((yieldSlope + 1) / 3) * 100));
    scores.push(slopeScore);
  }

  if (hyg?.changePercent != null) {
    // HYG daily move: +1% = greed (80), -1% = fear (20)
    const hygScore = Math.max(0, Math.min(100, 50 + hyg.changePercent * 30));
    scores.push(hygScore);
  }

  if (spy?.changePercent != null) {
    // SPY daily move: +2% = greed (90), -2% = fear (10)
    const spyScore = Math.max(0, Math.min(100, 50 + spy.changePercent * 20));
    scores.push(spyScore);
  }

  if (scores.length === 0) return null;

  const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  let label;
  if (avg <= 20) label = 'Extreme Fear';
  else if (avg <= 40) label = 'Fear';
  else if (avg <= 60) label = 'Neutral';
  else if (avg <= 80) label = 'Greed';
  else label = 'Extreme Greed';

  return { score: avg, label, components: scores.length };
}

async function fetchCryptoFearGreed() {
  try {
    const res = await fetch('https://api.alternative.me/fng/?limit=1&format=json', {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const data = json.data?.[0];
    if (!data) return null;
    return {
      score: parseInt(data.value, 10),
      label: data.value_classification,
      timestamp: new Date(parseInt(data.timestamp, 10) * 1000).toISOString(),
    };
  } catch (err) {
    console.warn(`[Financial] Crypto Fear & Greed fetch failed: ${err.message}`);
    return null;
  }
}

// ── Main service ──

class FinancialDataService {
  constructor() {
    this._cache = null;
  }

  async getFinancialData() {
    const cacheKey = 'financial:all';
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    console.log('[Financial] Fetching deep financial data...');

    // Fetch everything in parallel
    const [
      treasuryResults,
      volatilityResults,
      creditResults,
      dxyResult,
      extendedCommodityResults,
      sovereignResults,
      cryptoFearGreed,
      spyResult,
    ] = await Promise.all([
      fetchMultipleQuotes(TREASURY_SYMBOLS),
      fetchMultipleQuotes(VOLATILITY_SYMBOLS),
      fetchMultipleQuotes(CREDIT_SYMBOLS),
      fetchQuote(DXY_SYMBOL.symbol).then(q => q ? { ...DXY_SYMBOL, ...q } : null),
      fetchMultipleQuotes(EXTENDED_COMMODITIES),
      fetchMultipleQuotes(SOVEREIGN_YIELDS),
      fetchCryptoFearGreed(),
      fetchQuote('SPY'),
    ]);

    // Compute yield curve metrics
    const yieldCurve = treasuryResults.map(t => ({
      maturity: t.maturity,
      years: t.years,
      name: t.name,
      yield: t.price, // Yahoo shows yield as "price" for ^TNX etc.
      change: t.change,
      changePercent: t.changePercent,
      history: t.history,
    }));

    const y2 = treasuryResults.find(t => t.maturity === '2Y');
    const y10 = treasuryResults.find(t => t.maturity === '10Y');
    const y30 = treasuryResults.find(t => t.maturity === '30Y');
    const y13w = treasuryResults.find(t => t.maturity === '13W');

    const yieldSpread10Y2Y = (y10?.price != null && y2?.price != null)
      ? +(y10.price - y2.price).toFixed(3) : null;
    const yieldSpread30Y2Y = (y30?.price != null && y2?.price != null)
      ? +(y30.price - y2.price).toFixed(3) : null;
    const yieldSpread10Y3M = (y10?.price != null && y13w?.price != null)
      ? +(y10.price - y13w.price).toFixed(3) : null;

    const curveInverted = yieldSpread10Y2Y != null ? yieldSpread10Y2Y < 0 : null;

    // VIX data for fear & greed
    const vix = volatilityResults.find(v => v.symbol === '^VIX');
    const hyg = creditResults.find(c => c.symbol === 'HYG');
    const marketFearGreed = computeFearGreedFromMarketData(vix, yieldSpread10Y2Y, hyg, spyResult);

    // Volatility section
    const volatility = volatilityResults.map(v => ({
      symbol: v.symbol,
      name: v.name,
      description: v.description,
      level: v.price,
      change: v.change,
      changePercent: v.changePercent,
      history: v.history,
      signal: v.symbol === '^VIX'
        ? (v.price > 30 ? 'elevated' : v.price > 20 ? 'moderate' : 'calm')
        : (v.symbol === '^MOVE'
          ? (v.price > 120 ? 'elevated' : v.price > 80 ? 'moderate' : 'calm')
          : null),
    }));

    // Credit section
    const credit = creditResults.map(c => ({
      symbol: c.symbol,
      name: c.name,
      description: c.description,
      category: c.category,
      price: c.price,
      change: c.change,
      changePercent: c.changePercent,
      history: c.history,
    }));

    // Dollar index
    const dollarIndex = dxyResult ? {
      price: dxyResult.price,
      change: dxyResult.change,
      changePercent: dxyResult.changePercent,
      dayHigh: dxyResult.dayHigh,
      dayLow: dxyResult.dayLow,
      history: dxyResult.history,
      description: DXY_SYMBOL.description,
    } : null;

    // Extended commodities grouped by category
    const commodities = {};
    for (const c of extendedCommodityResults) {
      const cat = c.category || 'other';
      if (!commodities[cat]) commodities[cat] = [];
      commodities[cat].push({
        symbol: c.symbol,
        name: c.name,
        unit: c.unit,
        price: c.price,
        change: c.change,
        changePercent: c.changePercent,
        history: c.history,
      });
    }

    // Sovereign yields
    const sovereignBonds = sovereignResults.map(s => ({
      country: s.country,
      name: s.name,
      yield: s.price,
      change: s.change,
      changePercent: s.changePercent,
    }));

    const data = {
      yieldCurve: {
        points: yieldCurve,
        spreads: {
          '10Y-2Y': yieldSpread10Y2Y,
          '30Y-2Y': yieldSpread30Y2Y,
          '10Y-3M': yieldSpread10Y3M,
        },
        inverted: curveInverted,
      },
      volatility,
      credit,
      dollarIndex,
      commodities,
      sovereignBonds,
      fearGreed: {
        market: marketFearGreed,
        crypto: cryptoFearGreed,
      },
      lastUpdated: new Date().toISOString(),
    };

    const fetchedCount = [
      yieldCurve.length,
      volatility.length,
      credit.length,
      dollarIndex ? 1 : 0,
      extendedCommodityResults.length,
      sovereignBonds.length,
    ].reduce((a, b) => a + b, 0);

    console.log(`[Financial] Done: ${fetchedCount} instruments fetched`);

    // Cache it
    await cacheService.set(cacheKey, data, CACHE_TTL);
    this._cache = data;

    return data;
  }
}

export const financialDataService = new FinancialDataService();
export default financialDataService;
