/**
 * Markets Service
 * Fetches stock market indices, top stocks, commodities, and forex data per country
 * Uses Yahoo Finance chart API directly (no library, no API key)
 * Uses Frankfurter API (no API key required) for forex pairs
 */

import { cacheService } from './cache.service.js';

const CACHE_TTL = 30; // 30 seconds — live ticking
const FOREX_CACHE_TTL = 120; // 2 minutes (forex moves slower)

// ── Fetch a quote directly from Yahoo Finance's chart API ──
async function fetchQuote(symbol) {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
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

    // Try to get day high/low from the indicators
    const indicators = result.indicators?.quote?.[0];
    let dayHigh = meta.regularMarketDayHigh ?? null;
    let dayLow = meta.regularMarketDayLow ?? null;
    let volume = meta.regularMarketVolume ?? null;

    if (dayHigh == null && indicators?.high) {
      const highs = indicators.high.filter(v => v != null);
      if (highs.length) dayHigh = Math.max(...highs);
    }
    if (dayLow == null && indicators?.low) {
      const lows = indicators.low.filter(v => v != null);
      if (lows.length) dayLow = Math.min(...lows);
    }
    if (volume == null && indicators?.volume) {
      const vols = indicators.volume.filter(v => v != null);
      if (vols.length) volume = vols.reduce((a, b) => a + b, 0);
    }

    return {
      price,
      change,
      changePercent: changePct,
      previousClose: prevClose ?? null,
      dayHigh,
      dayLow,
      volume,
      marketState: meta.marketState ?? null,
      currency: meta.currency ?? null,
      exchange: meta.exchangeName ?? null,
      marketCap: null, // chart API doesn't include market cap
    };
  } catch (err) {
    console.warn(`[Markets] fetchQuote failed for ${symbol}: ${err.message}`);
    return null;
  }
}

// ── Country code → major stock index symbols ──
const COUNTRY_INDICES = {
  US: [
    { symbol: '^GSPC', name: 'S&P 500', exchange: 'NYSE' },
    { symbol: '^DJI', name: 'Dow Jones', exchange: 'NYSE' },
    { symbol: '^IXIC', name: 'NASDAQ', exchange: 'NASDAQ' },
    { symbol: '^RUT', name: 'Russell 2000', exchange: 'NYSE' },
    { symbol: '^VIX', name: 'VIX Volatility', exchange: 'CBOE' },
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
    { symbol: '^HSCE', name: 'Hang Seng China', exchange: 'HKEX' },
  ],
  IN: [
    { symbol: '^BSESN', name: 'BSE Sensex', exchange: 'BSE' },
    { symbol: '^NSEI', name: 'Nifty 50', exchange: 'NSE' },
  ],
  AU: [
    { symbol: '^AXJO', name: 'ASX 200', exchange: 'ASX' },
    { symbol: '^AORD', name: 'All Ordinaries', exchange: 'ASX' },
  ],
  CA: [
    { symbol: '^GSPTSE', name: 'TSX Composite', exchange: 'TSX' },
    { symbol: '^TX60', name: 'TSX 60', exchange: 'TSX' },
  ],
  BR: [
    { symbol: '^BVSP', name: 'Bovespa', exchange: 'B3' },
  ],
  KR: [
    { symbol: '^KS11', name: 'KOSPI', exchange: 'KRX' },
    { symbol: '^KQ11', name: 'KOSDAQ', exchange: 'KRX' },
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
  EU: [
    { symbol: '^STOXX50E', name: 'Euro Stoxx 50', exchange: 'STOXX' },
    { symbol: '^STOXX', name: 'STOXX Europe 600', exchange: 'STOXX' },
  ],
};

// ── Country code → top blue-chip stocks ──
const COUNTRY_TOP_STOCKS = {
  US: [
    { symbol: 'AAPL', name: 'Apple' },
    { symbol: 'MSFT', name: 'Microsoft' },
    { symbol: 'GOOGL', name: 'Alphabet' },
    { symbol: 'AMZN', name: 'Amazon' },
    { symbol: 'NVDA', name: 'NVIDIA' },
    { symbol: 'TSLA', name: 'Tesla' },
    { symbol: 'META', name: 'Meta' },
    { symbol: 'JPM', name: 'JPMorgan Chase' },
  ],
  CA: [
    { symbol: 'RY.TO', name: 'Royal Bank' },
    { symbol: 'TD.TO', name: 'TD Bank' },
    { symbol: 'SHOP.TO', name: 'Shopify' },
    { symbol: 'ENB.TO', name: 'Enbridge' },
    { symbol: 'CNR.TO', name: 'CN Railway' },
    { symbol: 'CP.TO', name: 'CP Railway' },
    { symbol: 'BMO.TO', name: 'Bank of Montreal' },
    { symbol: 'SU.TO', name: 'Suncor Energy' },
  ],
  GB: [
    { symbol: 'SHEL.L', name: 'Shell' },
    { symbol: 'HSBA.L', name: 'HSBC' },
    { symbol: 'AZN.L', name: 'AstraZeneca' },
    { symbol: 'BP.L', name: 'BP' },
    { symbol: 'ULVR.L', name: 'Unilever' },
    { symbol: 'RIO.L', name: 'Rio Tinto' },
    { symbol: 'LSEG.L', name: 'LSE Group' },
    { symbol: 'GSK.L', name: 'GSK' },
  ],
  JP: [
    { symbol: '7203.T', name: 'Toyota' },
    { symbol: '6758.T', name: 'Sony' },
    { symbol: '9984.T', name: 'SoftBank' },
    { symbol: '6861.T', name: 'Keyence' },
    { symbol: '8306.T', name: 'MUFG' },
    { symbol: '9432.T', name: 'NTT' },
  ],
  DE: [
    { symbol: 'SAP.DE', name: 'SAP' },
    { symbol: 'SIE.DE', name: 'Siemens' },
    { symbol: 'ALV.DE', name: 'Allianz' },
    { symbol: 'DTE.DE', name: 'Deutsche Telekom' },
    { symbol: 'MBG.DE', name: 'Mercedes-Benz' },
    { symbol: 'BAS.DE', name: 'BASF' },
  ],
  FR: [
    { symbol: 'MC.PA', name: 'LVMH' },
    { symbol: 'TTE.PA', name: 'TotalEnergies' },
    { symbol: 'OR.PA', name: "L'Oreal" },
    { symbol: 'SAN.PA', name: 'Sanofi' },
    { symbol: 'AIR.PA', name: 'Airbus' },
    { symbol: 'BNP.PA', name: 'BNP Paribas' },
  ],
  CN: [
    { symbol: 'BABA', name: 'Alibaba' },
    { symbol: 'PDD', name: 'PDD Holdings' },
    { symbol: 'JD', name: 'JD.com' },
    { symbol: 'BIDU', name: 'Baidu' },
    { symbol: 'NIO', name: 'NIO' },
    { symbol: 'LI', name: 'Li Auto' },
  ],
  HK: [
    { symbol: '0700.HK', name: 'Tencent' },
    { symbol: '9988.HK', name: 'Alibaba (HK)' },
    { symbol: '1299.HK', name: 'AIA Group' },
    { symbol: '0005.HK', name: 'HSBC (HK)' },
    { symbol: '3690.HK', name: 'Meituan' },
  ],
  IN: [
    { symbol: 'RELIANCE.NS', name: 'Reliance' },
    { symbol: 'TCS.NS', name: 'TCS' },
    { symbol: 'INFY.NS', name: 'Infosys' },
    { symbol: 'HDFCBANK.NS', name: 'HDFC Bank' },
    { symbol: 'ICICIBANK.NS', name: 'ICICI Bank' },
    { symbol: 'HINDUNILVR.NS', name: 'Hindustan Unilever' },
  ],
  AU: [
    { symbol: 'BHP.AX', name: 'BHP Group' },
    { symbol: 'CBA.AX', name: 'CommBank' },
    { symbol: 'CSL.AX', name: 'CSL' },
    { symbol: 'NAB.AX', name: 'NAB' },
    { symbol: 'WBC.AX', name: 'Westpac' },
    { symbol: 'FMG.AX', name: 'Fortescue' },
  ],
  BR: [
    { symbol: 'VALE3.SA', name: 'Vale' },
    { symbol: 'PETR4.SA', name: 'Petrobras' },
    { symbol: 'ITUB4.SA', name: 'Itau Unibanco' },
    { symbol: 'BBDC4.SA', name: 'Bradesco' },
    { symbol: 'ABEV3.SA', name: 'Ambev' },
  ],
  KR: [
    { symbol: '005930.KS', name: 'Samsung' },
    { symbol: '000660.KS', name: 'SK Hynix' },
    { symbol: '373220.KS', name: 'LG Energy' },
    { symbol: '207940.KS', name: 'Samsung Bio' },
  ],
  TW: [
    { symbol: 'TSM', name: 'TSMC' },
    { symbol: '2330.TW', name: 'TSMC (TW)' },
    { symbol: '2317.TW', name: 'Hon Hai' },
    { symbol: '2454.TW', name: 'MediaTek' },
  ],
  CH: [
    { symbol: 'NESN.SW', name: 'Nestle' },
    { symbol: 'ROG.SW', name: 'Roche' },
    { symbol: 'NOVN.SW', name: 'Novartis' },
    { symbol: 'UBSG.SW', name: 'UBS' },
  ],
  NL: [
    { symbol: 'ASML.AS', name: 'ASML' },
    { symbol: 'INGA.AS', name: 'ING Group' },
    { symbol: 'PHIA.AS', name: 'Philips' },
  ],
  IT: [
    { symbol: 'ENEL.MI', name: 'Enel' },
    { symbol: 'ISP.MI', name: 'Intesa Sanpaolo' },
    { symbol: 'ENI.MI', name: 'Eni' },
    { symbol: 'UCG.MI', name: 'UniCredit' },
  ],
  ES: [
    { symbol: 'SAN.MC', name: 'Santander' },
    { symbol: 'BBVA.MC', name: 'BBVA' },
    { symbol: 'IBE.MC', name: 'Iberdrola' },
    { symbol: 'ITX.MC', name: 'Inditex' },
  ],
  SE: [
    { symbol: 'ERIC-B.ST', name: 'Ericsson' },
    { symbol: 'VOLV-B.ST', name: 'Volvo' },
    { symbol: 'ATCO-A.ST', name: 'Atlas Copco' },
  ],
  NO: [
    { symbol: 'EQNR.OL', name: 'Equinor' },
    { symbol: 'DNB.OL', name: 'DNB Bank' },
    { symbol: 'TEL.OL', name: 'Telenor' },
  ],
  DK: [
    { symbol: 'NOVO-B.CO', name: 'Novo Nordisk' },
    { symbol: 'MAERSK-B.CO', name: 'Maersk' },
    { symbol: 'CARL-B.CO', name: 'Carlsberg' },
  ],
  MX: [
    { symbol: 'FEMSAUBD.MX', name: 'FEMSA' },
    { symbol: 'WALMEX.MX', name: 'Walmex' },
    { symbol: 'AMXB.MX', name: 'America Movil' },
  ],
  SA: [
    { symbol: '2222.SR', name: 'Saudi Aramco' },
    { symbol: '1180.SR', name: 'Al Rajhi Bank' },
    { symbol: '2010.SR', name: 'SABIC' },
  ],
  SG: [
    { symbol: 'D05.SI', name: 'DBS Group' },
    { symbol: 'O39.SI', name: 'OCBC' },
    { symbol: 'U11.SI', name: 'UOB' },
  ],
  ZA: [
    { symbol: 'NPN.JO', name: 'Naspers' },
    { symbol: 'SOL.JO', name: 'Sasol' },
    { symbol: 'FSR.JO', name: 'FirstRand' },
  ],
  RU: [
    { symbol: 'GAZP.ME', name: 'Gazprom' },
    { symbol: 'SBER.ME', name: 'Sberbank' },
    { symbol: 'LKOH.ME', name: 'Lukoil' },
  ],
  TR: [
    { symbol: 'THYAO.IS', name: 'Turkish Airlines' },
    { symbol: 'GARAN.IS', name: 'Garanti BBVA' },
    { symbol: 'ASELS.IS', name: 'Aselsan' },
  ],
  IL: [
    { symbol: 'TEVA', name: 'Teva Pharma' },
    { symbol: 'CHKP', name: 'Check Point' },
    { symbol: 'NICE', name: 'NICE Ltd' },
  ],
  IE: [
    { symbol: 'CRH', name: 'CRH' },
    { symbol: 'RYA.L', name: 'Ryanair' },
    { symbol: 'LSEG.L', name: 'LSE Group' },
  ],
  NZ: [
    { symbol: 'FPH.NZ', name: 'Fisher & Paykel' },
    { symbol: 'AIR.NZ', name: 'Air New Zealand' },
    { symbol: 'SPK.NZ', name: 'Spark NZ' },
  ],
  PL: [
    { symbol: 'PKN.WA', name: 'PKN Orlen' },
    { symbol: 'PZU.WA', name: 'PZU' },
    { symbol: 'CDR.WA', name: 'CD Projekt' },
  ],
};

// ── Global commodities & crypto (extended) ──
const COMMODITIES = [
  { symbol: 'GC=F', name: 'Gold', unit: '/oz', category: 'precious' },
  { symbol: 'SI=F', name: 'Silver', unit: '/oz', category: 'precious' },
  { symbol: 'CL=F', name: 'Crude Oil (WTI)', unit: '/bbl', category: 'energy' },
  { symbol: 'BZ=F', name: 'Brent Crude', unit: '/bbl', category: 'energy' },
  { symbol: 'NG=F', name: 'Natural Gas', unit: '/MMBtu', category: 'energy' },
  { symbol: 'HG=F', name: 'Copper', unit: '/lb', category: 'industrial' },
  { symbol: 'ZW=F', name: 'Wheat', unit: '/bu', category: 'agriculture' },
  { symbol: 'ZC=F', name: 'Corn', unit: '/bu', category: 'agriculture' },
  { symbol: 'BTC-USD', name: 'Bitcoin', unit: '', category: 'crypto' },
  { symbol: 'ETH-USD', name: 'Ethereum', unit: '', category: 'crypto' },
];

// ── Country-specific 10Y sovereign bond yield symbols ──
const COUNTRY_BOND_YIELDS = {
  US: [
    { symbol: '^IRX', name: '13-Week T-Bill', maturity: '13W' },
    { symbol: '2YY=F', name: '2-Year Yield', maturity: '2Y' },
    { symbol: '^FVX', name: '5-Year Yield', maturity: '5Y' },
    { symbol: '^TNX', name: '10-Year Yield', maturity: '10Y' },
    { symbol: '^TYX', name: '30-Year Yield', maturity: '30Y' },
  ],
  GB: [{ symbol: '^TMBMKGB-10Y', name: 'UK 10Y Gilt', maturity: '10Y' }],
  DE: [{ symbol: '^TMBMKDE-10Y', name: 'Bund 10Y', maturity: '10Y' }],
  JP: [{ symbol: '^TMBMKJP-10Y', name: 'JGB 10Y', maturity: '10Y' }],
  FR: [{ symbol: '^TMBMKFR-10Y', name: 'OAT 10Y', maturity: '10Y' }],
  IT: [{ symbol: '^TMBMKIT-10Y', name: 'BTP 10Y', maturity: '10Y' }],
  ES: [{ symbol: '^TMBMKES-10Y', name: 'Bono 10Y', maturity: '10Y' }],
  AU: [{ symbol: '^TMBMKAU-10Y', name: 'ACGB 10Y', maturity: '10Y' }],
  CA: [{ symbol: '^TMBMKCA-10Y', name: 'Canada 10Y', maturity: '10Y' }],
  IN: [{ symbol: '^TMBMKIN-10Y', name: 'India 10Y', maturity: '10Y' }],
  CN: [{ symbol: '^TMBMKCN-10Y', name: 'China 10Y', maturity: '10Y' }],
  BR: [{ symbol: '^TMBMKBR-10Y', name: 'Brazil 10Y', maturity: '10Y' }],
  KR: [{ symbol: '^TMBMKKR-10Y', name: 'Korea 10Y', maturity: '10Y' }],
  MX: [{ symbol: '^TMBMKMX-10Y', name: 'Mexico 10Y', maturity: '10Y' }],
  ZA: [{ symbol: '^TMBMKZA-10Y', name: 'South Africa 10Y', maturity: '10Y' }],
  TR: [{ symbol: '^TMBMKTR-10Y', name: 'Turkey 10Y', maturity: '10Y' }],
  PL: [{ symbol: '^TMBMKPL-10Y', name: 'Poland 10Y', maturity: '10Y' }],
  NL: [{ symbol: '^TMBMKNL-10Y', name: 'Netherlands 10Y', maturity: '10Y' }],
  SE: [{ symbol: '^TMBMKSE-10Y', name: 'Sweden 10Y', maturity: '10Y' }],
  NO: [{ symbol: '^TMBMKNO-10Y', name: 'Norway 10Y', maturity: '10Y' }],
  CH: [{ symbol: '^TMBMKCH-10Y', name: 'Swiss 10Y', maturity: '10Y' }],
  RU: [{ symbol: '^TMBMKRU-10Y', name: 'Russia 10Y', maturity: '10Y' }],
  // Share Eurozone bonds with members
  AT: [{ symbol: '^TMBMKDE-10Y', name: 'Bund 10Y (ref)', maturity: '10Y' }],
  BE: [{ symbol: '^TMBMKDE-10Y', name: 'Bund 10Y (ref)', maturity: '10Y' }],
  FI: [{ symbol: '^TMBMKDE-10Y', name: 'Bund 10Y (ref)', maturity: '10Y' }],
  IE: [{ symbol: '^TMBMKDE-10Y', name: 'Bund 10Y (ref)', maturity: '10Y' }],
  PT: [{ symbol: '^TMBMKES-10Y', name: 'Bono 10Y (ref)', maturity: '10Y' }],
  GR: [{ symbol: '^TMBMKIT-10Y', name: 'BTP 10Y (ref)', maturity: '10Y' }],
  EU: [
    { symbol: '^TMBMKDE-10Y', name: 'Bund 10Y', maturity: '10Y' },
    { symbol: '^TMBMKIT-10Y', name: 'BTP 10Y', maturity: '10Y' },
    { symbol: '^TMBMKFR-10Y', name: 'OAT 10Y', maturity: '10Y' },
  ],
};

// ── Country-specific volatility indices ──
const COUNTRY_VOLATILITY = {
  US: [
    { symbol: '^VIX', name: 'VIX', description: 'S&P 500 implied vol' },
    { symbol: '^MOVE', name: 'MOVE', description: 'Treasury bond vol' },
    { symbol: '^VXN', name: 'VXN', description: 'NASDAQ 100 vol' },
  ],
  EU: [{ symbol: '^V2X', name: 'VSTOXX', description: 'Euro Stoxx 50 vol' }],
  DE: [{ symbol: '^V2X', name: 'VSTOXX', description: 'Euro Stoxx 50 vol' }],
  FR: [{ symbol: '^V2X', name: 'VSTOXX', description: 'Euro Stoxx 50 vol' }],
  JP: [{ symbol: '^JNV', name: 'Nikkei VI', description: 'Nikkei vol' }],
  HK: [{ symbol: '^VHSI', name: 'VHSI', description: 'HSI vol' }],
  IN: [{ symbol: '^INDIAVIX.NS', name: 'India VIX', description: 'Nifty vol' }],
  GB: [{ symbol: '^VIX', name: 'VIX (ref)', description: 'S&P 500 vol (ref)' }],
  CA: [{ symbol: '^VIX', name: 'VIX (ref)', description: 'S&P 500 vol (ref)' }],
  AU: [{ symbol: '^VIX', name: 'VIX (ref)', description: 'S&P 500 vol (ref)' }],
};

// ── Country-specific credit / CDS proxy ETFs ──
const COUNTRY_CREDIT_ETFS = {
  US: [
    { symbol: 'HYG', name: 'US High Yield', description: 'iShares HY Corp Bond' },
    { symbol: 'LQD', name: 'US Invest. Grade', description: 'iShares IG Corp Bond' },
    { symbol: 'TLT', name: 'Long Treasury', description: 'iShares 20+ Yr Treasury' },
    { symbol: 'JNK', name: 'Junk Bonds', description: 'SPDR HY Bond' },
  ],
  GB: [
    { symbol: 'IGLT.L', name: 'UK Gilts', description: 'iShares UK Gilts' },
    { symbol: 'SLXX.L', name: 'GBP Corp Bond', description: 'iShares GBP Corp Bond' },
  ],
  EU: [
    { symbol: 'IEAC.AS', name: 'EUR Corp Bond', description: 'iShares EUR Corp Bond' },
    { symbol: 'IBGS.AS', name: 'EUR Govt 1-3Y', description: 'iShares EUR Govt Bond' },
  ],
  DE: [
    { symbol: 'IEAC.AS', name: 'EUR Corp Bond', description: 'iShares EUR Corp Bond' },
  ],
  FR: [
    { symbol: 'IEAC.AS', name: 'EUR Corp Bond', description: 'iShares EUR Corp Bond' },
  ],
  // Emerging markets — all share EMB
  BR: [{ symbol: 'EMB', name: 'EM Bonds', description: 'iShares EM Sovereign' }],
  MX: [{ symbol: 'EMB', name: 'EM Bonds', description: 'iShares EM Sovereign' }],
  ZA: [{ symbol: 'EMB', name: 'EM Bonds', description: 'iShares EM Sovereign' }],
  TR: [{ symbol: 'EMB', name: 'EM Bonds', description: 'iShares EM Sovereign' }],
  IN: [{ symbol: 'EMB', name: 'EM Bonds', description: 'iShares EM Sovereign' }],
  CN: [{ symbol: 'CBON', name: 'China Bond', description: 'VanEck China Bond' }],
  JP: [
    { symbol: '2621.T', name: 'Japan Govt Bond', description: 'iShares JGB ETF' },
  ],
};

// ── DXY / Dollar index symbol ──
const DXY_SYMBOL = { symbol: 'DX-Y.NYB', name: 'US Dollar Index', description: 'DXY' };

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

const MAJOR_CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD', 'CNY'];

class MarketsService {
  async getIndices(countryCode) {
    const code = countryCode.toUpperCase();
    const cacheKey = `markets:indices:${code}`;

    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const indexDefs = COUNTRY_INDICES[code];
    if (!indexDefs || indexDefs.length === 0) return null;

    const results = await Promise.all(
      indexDefs.map(async (def) => {
        const q = await fetchQuote(def.symbol);
        if (!q) return null;
        return {
          symbol: def.symbol,
          name: def.name,
          exchange: def.exchange,
          price: q.price,
          change: q.change,
          changePercent: q.changePercent,
          previousClose: q.previousClose,
          dayHigh: q.dayHigh,
          dayLow: q.dayLow,
          volume: q.volume,
          marketState: q.marketState,
          currency: q.currency,
        };
      })
    );

    const data = results.filter(Boolean);
    if (data.length > 0) {
      await cacheService.set(cacheKey, data, CACHE_TTL);
    }
    return data.length > 0 ? data : null;
  }

  async getTopStocks(countryCode) {
    const code = countryCode.toUpperCase();
    const cacheKey = `markets:stocks:${code}`;

    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const stockDefs = COUNTRY_TOP_STOCKS[code];
    if (!stockDefs || stockDefs.length === 0) return null;

    const results = await Promise.all(
      stockDefs.map(async (def) => {
        const q = await fetchQuote(def.symbol);
        if (!q) return null;
        return {
          symbol: def.symbol,
          name: def.name,
          price: q.price,
          change: q.change,
          changePercent: q.changePercent,
          currency: q.currency,
        };
      })
    );

    const data = results.filter(Boolean);
    if (data.length > 0) {
      await cacheService.set(cacheKey, data, CACHE_TTL);
    }
    return data.length > 0 ? data : null;
  }

  async getCommodities() {
    const cacheKey = 'markets:commodities';

    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const results = await Promise.all(
      COMMODITIES.map(async (def) => {
        const q = await fetchQuote(def.symbol);
        if (!q) return null;
        return {
          symbol: def.symbol,
          name: def.name,
          unit: def.unit,
          price: q.price,
          change: q.change,
          changePercent: q.changePercent,
          currency: q.currency ?? 'USD',
        };
      })
    );

    const data = results.filter(Boolean);
    if (data.length > 0) {
      await cacheService.set(cacheKey, data, CACHE_TTL);
    }
    return data.length > 0 ? data : null;
  }

  async getForex(countryCode) {
    const code = countryCode.toUpperCase();
    const localCurrency = COUNTRY_CURRENCIES[code];
    if (!localCurrency) return null;

    const cacheKey = `markets:forex:${localCurrency}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

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

  async getBondYields(countryCode) {
    const code = countryCode.toUpperCase();
    const bondDefs = COUNTRY_BOND_YIELDS[code];
    if (!bondDefs || bondDefs.length === 0) return null;

    const cacheKey = `markets:bonds:${code}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const results = await Promise.all(
      bondDefs.map(async (def) => {
        const q = await fetchQuote(def.symbol);
        if (!q) return null;
        return {
          symbol: def.symbol,
          name: def.name,
          maturity: def.maturity,
          yield: q.price, // Yahoo represents yields as "price"
          change: q.change,
          changePercent: q.changePercent,
        };
      })
    );

    const data = results.filter(Boolean);
    if (data.length > 0) {
      await cacheService.set(cacheKey, data, CACHE_TTL);
    }
    return data.length > 0 ? data : null;
  }

  async getVolatility(countryCode) {
    const code = countryCode.toUpperCase();
    const volDefs = COUNTRY_VOLATILITY[code];
    if (!volDefs || volDefs.length === 0) return null;

    const cacheKey = `markets:vol:${code}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const results = await Promise.all(
      volDefs.map(async (def) => {
        const q = await fetchQuote(def.symbol);
        if (!q) return null;
        return {
          symbol: def.symbol,
          name: def.name,
          description: def.description,
          level: q.price,
          change: q.change,
          changePercent: q.changePercent,
          signal: def.symbol === '^VIX'
            ? (q.price > 30 ? 'elevated' : q.price > 20 ? 'moderate' : 'calm')
            : (def.symbol === '^MOVE'
              ? (q.price > 120 ? 'elevated' : q.price > 80 ? 'moderate' : 'calm')
              : null),
        };
      })
    );

    const data = results.filter(Boolean);
    if (data.length > 0) {
      await cacheService.set(cacheKey, data, CACHE_TTL);
    }
    return data.length > 0 ? data : null;
  }

  async getCreditETFs(countryCode) {
    const code = countryCode.toUpperCase();
    const creditDefs = COUNTRY_CREDIT_ETFS[code];
    if (!creditDefs || creditDefs.length === 0) return null;

    const cacheKey = `markets:credit:${code}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const results = await Promise.all(
      creditDefs.map(async (def) => {
        const q = await fetchQuote(def.symbol);
        if (!q) return null;
        return {
          symbol: def.symbol,
          name: def.name,
          description: def.description,
          price: q.price,
          change: q.change,
          changePercent: q.changePercent,
        };
      })
    );

    const data = results.filter(Boolean);
    if (data.length > 0) {
      await cacheService.set(cacheKey, data, CACHE_TTL);
    }
    return data.length > 0 ? data : null;
  }

  async getDollarIndex() {
    const cacheKey = 'markets:dxy';
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const q = await fetchQuote(DXY_SYMBOL.symbol);
    if (!q) return null;

    const data = {
      symbol: DXY_SYMBOL.symbol,
      name: DXY_SYMBOL.name,
      price: q.price,
      change: q.change,
      changePercent: q.changePercent,
      dayHigh: q.dayHigh,
      dayLow: q.dayLow,
    };

    await cacheService.set(cacheKey, data, CACHE_TTL);
    return data;
  }

  async getMarketData(countryCode) {
    const code = countryCode.toUpperCase();
    const cacheKey = `markets:combined:${code}`;

    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const [indices, topStocks, commodities, forex, bonds, volatility, credit, dxy] = await Promise.all([
      this.getIndices(code).catch(() => null),
      this.getTopStocks(code).catch(() => null),
      this.getCommodities().catch(() => null),
      this.getForex(code).catch(() => null),
      this.getBondYields(code).catch(() => null),
      this.getVolatility(code).catch(() => null),
      this.getCreditETFs(code).catch(() => null),
      this.getDollarIndex().catch(() => null),
    ]);

    if (!indices && !topStocks && !commodities && !forex && !bonds && !volatility && !credit) return null;

    // Compute yield curve spread for US
    let yieldSpreads = null;
    if (bonds && code === 'US') {
      const y2 = bonds.find(b => b.maturity === '2Y');
      const y10 = bonds.find(b => b.maturity === '10Y');
      const y30 = bonds.find(b => b.maturity === '30Y');
      const y3m = bonds.find(b => b.maturity === '13W');
      yieldSpreads = {};
      if (y10 && y2) yieldSpreads['10Y-2Y'] = +(y10.yield - y2.yield).toFixed(3);
      if (y30 && y2) yieldSpreads['30Y-2Y'] = +(y30.yield - y2.yield).toFixed(3);
      if (y10 && y3m) yieldSpreads['10Y-3M'] = +(y10.yield - y3m.yield).toFixed(3);
    }

    const data = {
      countryCode: code,
      indices: indices || [],
      topStocks: topStocks || [],
      commodities: commodities || [],
      forex: forex || null,
      bonds: bonds || [],
      volatility: volatility || [],
      credit: credit || [],
      dxy: dxy || null,
      yieldSpreads,
      lastUpdated: new Date().toISOString(),
    };

    await cacheService.set(cacheKey, data, CACHE_TTL);
    return data;
  }

  hasMarketData(countryCode) {
    const code = countryCode.toUpperCase();
    return !!(COUNTRY_INDICES[code] || COUNTRY_CURRENCIES[code]);
  }
}

export const marketsService = new MarketsService();
export default marketsService;
