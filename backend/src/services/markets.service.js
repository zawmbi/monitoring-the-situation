/**
 * Markets Service
 * Fetches stock market indices and forex data per country
 * Uses yahoo-finance2 (no API key required) for stock indices
 * Uses Frankfurter API (no API key required) for forex pairs
 */

import yahooFinance from 'yahoo-finance2';
import { cacheService } from './cache.service.js';

const CACHE_TTL = 300; // 5 minutes
const FOREX_CACHE_TTL = 600; // 10 minutes

// ── Country code → major stock index symbols (Yahoo Finance) ──
const COUNTRY_INDICES = {
  US: [
    { symbol: '^GSPC', name: 'S&P 500', exchange: 'NYSE' },
    { symbol: '^DJI', name: 'Dow Jones', exchange: 'NYSE' },
    { symbol: '^IXIC', name: 'NASDAQ', exchange: 'NASDAQ' },
    { symbol: '^RUT', name: 'Russell 2000', exchange: 'NYSE' },
  ],
  GB: [
    { symbol: '^FTSE', name: 'FTSE 100', exchange: 'LSE' },
    { symbol: '^FTMC', name: 'FTSE 250', exchange: 'LSE' },
  ],
  JP: [
    { symbol: '^N225', name: 'Nikkei 225', exchange: 'JPX' },
    { symbol: '^TOPX', name: 'TOPIX', exchange: 'JPX' },
  ],
  DE: [
    { symbol: '^GDAXI', name: 'DAX', exchange: 'XETRA' },
    { symbol: '^MDAXI', name: 'MDAX', exchange: 'XETRA' },
  ],
  FR: [
    { symbol: '^FCHI', name: 'CAC 40', exchange: 'Euronext Paris' },
  ],
  CN: [
    { symbol: '000001.SS', name: 'Shanghai Composite', exchange: 'SSE' },
    { symbol: '399001.SZ', name: 'Shenzhen Component', exchange: 'SZSE' },
  ],
  HK: [
    { symbol: '^HSI', name: 'Hang Seng', exchange: 'HKEX' },
  ],
  IN: [
    { symbol: '^BSESN', name: 'BSE Sensex', exchange: 'BSE' },
    { symbol: '^NSEI', name: 'Nifty 50', exchange: 'NSE' },
  ],
  AU: [
    { symbol: '^AXJO', name: 'ASX 200', exchange: 'ASX' },
  ],
  CA: [
    { symbol: '^GSPTSE', name: 'TSX Composite', exchange: 'TSX' },
  ],
  BR: [
    { symbol: '^BVSP', name: 'Bovespa', exchange: 'B3' },
  ],
  KR: [
    { symbol: '^KS11', name: 'KOSPI', exchange: 'KRX' },
  ],
  RU: [
    { symbol: 'IMOEX.ME', name: 'MOEX Russia', exchange: 'MOEX' },
  ],
  MX: [
    { symbol: '^MXX', name: 'IPC Mexico', exchange: 'BMV' },
  ],
  CH: [
    { symbol: '^SSMI', name: 'SMI', exchange: 'SIX' },
  ],
  IT: [
    { symbol: 'FTSEMIB.MI', name: 'FTSE MIB', exchange: 'Borsa Italiana' },
  ],
  ES: [
    { symbol: '^IBEX', name: 'IBEX 35', exchange: 'BME' },
  ],
  NL: [
    { symbol: '^AEX', name: 'AEX', exchange: 'Euronext Amsterdam' },
  ],
  SE: [
    { symbol: '^OMX', name: 'OMX Stockholm 30', exchange: 'Nasdaq Stockholm' },
  ],
  NO: [
    { symbol: 'OSEBX.OL', name: 'Oslo Bors', exchange: 'Oslo Bors' },
  ],
  DK: [
    { symbol: '^OMXC25', name: 'OMX Copenhagen 25', exchange: 'Nasdaq Copenhagen' },
  ],
  FI: [
    { symbol: '^OMXH25', name: 'OMX Helsinki 25', exchange: 'Nasdaq Helsinki' },
  ],
  PL: [
    { symbol: '^WIG20', name: 'WIG 20', exchange: 'GPW' },
  ],
  AT: [
    { symbol: '^ATX', name: 'ATX', exchange: 'Vienna SE' },
  ],
  BE: [
    { symbol: '^BFX', name: 'BEL 20', exchange: 'Euronext Brussels' },
  ],
  PT: [
    { symbol: 'PSI20.LS', name: 'PSI 20', exchange: 'Euronext Lisbon' },
  ],
  GR: [
    { symbol: 'GD.AT', name: 'Athens General', exchange: 'ATHEX' },
  ],
  TR: [
    { symbol: 'XU100.IS', name: 'BIST 100', exchange: 'Borsa Istanbul' },
  ],
  ZA: [
    { symbol: '^J203.JO', name: 'JSE All Share', exchange: 'JSE' },
  ],
  IL: [
    { symbol: '^TA125.TA', name: 'TA-125', exchange: 'TASE' },
  ],
  SA: [
    { symbol: '^TASI.SR', name: 'Tadawul All Share', exchange: 'Tadawul' },
  ],
  AE: [
    { symbol: '^ADI', name: 'ADX General', exchange: 'ADX' },
  ],
  TW: [
    { symbol: '^TWII', name: 'TAIEX', exchange: 'TWSE' },
  ],
  SG: [
    { symbol: '^STI', name: 'Straits Times', exchange: 'SGX' },
  ],
  MY: [
    { symbol: '^KLSE', name: 'FTSE Bursa KLCI', exchange: 'Bursa Malaysia' },
  ],
  TH: [
    { symbol: '^SET.BK', name: 'SET Index', exchange: 'SET' },
  ],
  ID: [
    { symbol: '^JKSE', name: 'Jakarta Composite', exchange: 'IDX' },
  ],
  PH: [
    { symbol: 'PSEI.PS', name: 'PSEi', exchange: 'PSE' },
  ],
  VN: [
    { symbol: '^VNINDEX', name: 'VN-Index', exchange: 'HOSE' },
  ],
  NZ: [
    { symbol: '^NZ50', name: 'NZX 50', exchange: 'NZX' },
  ],
  CL: [
    { symbol: '^IPSA', name: 'S&P IPSA', exchange: 'Santiago SE' },
  ],
  CO: [
    { symbol: '^COLCAP', name: 'COLCAP', exchange: 'BVC' },
  ],
  AR: [
    { symbol: '^MERV', name: 'MERVAL', exchange: 'BCBA' },
  ],
  EG: [
    { symbol: '^EGX30.CA', name: 'EGX 30', exchange: 'EGX' },
  ],
  NG: [
    { symbol: '^NGSE', name: 'NGX All-Share', exchange: 'NGX' },
  ],
  KE: [
    { symbol: '^NSE20.NR', name: 'NSE 20', exchange: 'NSE Kenya' },
  ],
  PK: [
    { symbol: '^KSE100.KA', name: 'KSE 100', exchange: 'PSX' },
  ],
  BD: [
    { symbol: '^DSEX', name: 'DSEX', exchange: 'DSE' },
  ],
  QA: [
    { symbol: '^QSI', name: 'QE Index', exchange: 'QSE' },
  ],
  KW: [
    { symbol: '^BKP.KW', name: 'Boursa Kuwait', exchange: 'BK' },
  ],
  IE: [
    { symbol: '^ISEQ', name: 'ISEQ Overall', exchange: 'Euronext Dublin' },
  ],
  CZ: [
    { symbol: '^PX', name: 'PX Index', exchange: 'PSE Prague' },
  ],
  HU: [
    { symbol: '^BUX', name: 'BUX', exchange: 'BSE Budapest' },
  ],
  RO: [
    { symbol: '^BET', name: 'BET', exchange: 'BVB' },
  ],
  HR: [
    { symbol: '^CRBEX', name: 'CROBEX', exchange: 'ZSE' },
  ],
  // EU aggregate — show major European indices
  EU: [
    { symbol: '^STOXX50E', name: 'Euro Stoxx 50', exchange: 'STOXX' },
    { symbol: '^STOXX', name: 'STOXX Europe 600', exchange: 'STOXX' },
  ],
};

// Country code → primary currency code
const COUNTRY_CURRENCIES = {
  US: 'USD', GB: 'GBP', JP: 'JPY', DE: 'EUR', FR: 'EUR', CN: 'CNY',
  HK: 'HKD', IN: 'INR', AU: 'AUD', CA: 'CAD', BR: 'BRL', KR: 'KRW',
  RU: 'RUB', MX: 'MXN', CH: 'CHF', IT: 'EUR', ES: 'EUR', NL: 'EUR',
  SE: 'SEK', NO: 'NOK', DK: 'DKK', FI: 'EUR', PL: 'PLN', AT: 'EUR',
  BE: 'EUR', PT: 'EUR', GR: 'EUR', TR: 'TRY', ZA: 'ZAR', IL: 'ILS',
  SA: 'SAR', AE: 'AED', TW: 'TWD', SG: 'SGD', MY: 'MYR', TH: 'THB',
  ID: 'IDR', PH: 'PHP', VN: 'VND', NZ: 'NZD', CL: 'CLP', CO: 'COP',
  AR: 'ARS', EG: 'EGP', NG: 'NGN', KE: 'KES', PK: 'PKR', BD: 'BDT',
  QA: 'QAR', KW: 'KWD', IE: 'EUR', CZ: 'CZK', HU: 'HUF', RO: 'RON',
  HR: 'EUR', EU: 'EUR',
};

// Major forex pairs to show relative to the country's currency
const MAJOR_CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CNY'];

class MarketsService {
  /**
   * Get stock market indices for a country
   */
  async getIndices(countryCode) {
    const code = countryCode.toUpperCase();
    const cacheKey = `markets:indices:${code}`;

    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const indexDefs = COUNTRY_INDICES[code];
    if (!indexDefs || indexDefs.length === 0) {
      return null;
    }

    const results = await Promise.all(
      indexDefs.map(async (def) => {
        try {
          const quote = await yahooFinance.quote(def.symbol);
          return {
            symbol: def.symbol,
            name: def.name,
            exchange: def.exchange,
            price: quote.regularMarketPrice ?? null,
            change: quote.regularMarketChange ?? null,
            changePercent: quote.regularMarketChangePercent ?? null,
            previousClose: quote.regularMarketPreviousClose ?? null,
            open: quote.regularMarketOpen ?? null,
            dayHigh: quote.regularMarketDayHigh ?? null,
            dayLow: quote.regularMarketDayLow ?? null,
            volume: quote.regularMarketVolume ?? null,
            marketState: quote.marketState ?? null,
            currency: quote.currency ?? null,
          };
        } catch (err) {
          console.warn(`[Markets] Failed to fetch ${def.symbol}: ${err.message}`);
          return {
            symbol: def.symbol,
            name: def.name,
            exchange: def.exchange,
            price: null,
            change: null,
            changePercent: null,
            error: true,
          };
        }
      })
    );

    const data = results.filter(r => r.price !== null);
    if (data.length > 0) {
      await cacheService.set(cacheKey, data, CACHE_TTL);
    }
    return data.length > 0 ? data : null;
  }

  /**
   * Get forex rates for a country's currency vs major currencies
   */
  async getForex(countryCode) {
    const code = countryCode.toUpperCase();
    const localCurrency = COUNTRY_CURRENCIES[code];
    if (!localCurrency) return null;

    const cacheKey = `markets:forex:${localCurrency}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    // Build target currencies (exclude the local one)
    const targets = MAJOR_CURRENCIES.filter(c => c !== localCurrency);
    if (targets.length === 0) return null;

    try {
      const res = await fetch(
        `https://api.frankfurter.app/latest?from=${localCurrency}&to=${targets.join(',')}`
      );
      if (!res.ok) return null;

      const json = await res.json();
      const pairs = targets
        .filter(t => json.rates?.[t] != null)
        .map(t => ({
          pair: `${localCurrency}/${t}`,
          rate: json.rates[t],
          base: localCurrency,
          quote: t,
        }));

      if (pairs.length === 0) return null;

      const data = { base: localCurrency, date: json.date, pairs };
      await cacheService.set(cacheKey, data, FOREX_CACHE_TTL);
      return data;
    } catch (err) {
      console.warn(`[Markets] Forex fetch failed for ${localCurrency}: ${err.message}`);
      return null;
    }
  }

  /**
   * Get combined market data for a country
   */
  async getMarketData(countryCode) {
    const code = countryCode.toUpperCase();
    const cacheKey = `markets:combined:${code}`;

    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const [indices, forex] = await Promise.all([
      this.getIndices(code).catch(() => null),
      this.getForex(code).catch(() => null),
    ]);

    if (!indices && !forex) return null;

    const data = {
      countryCode: code,
      indices: indices || [],
      forex: forex || null,
      lastUpdated: new Date().toISOString(),
    };

    await cacheService.set(cacheKey, data, CACHE_TTL);
    return data;
  }

  /**
   * Check if a country has market data available
   */
  hasMarketData(countryCode) {
    const code = countryCode.toUpperCase();
    return !!(COUNTRY_INDICES[code] || COUNTRY_CURRENCIES[code]);
  }
}

export const marketsService = new MarketsService();
export default marketsService;
