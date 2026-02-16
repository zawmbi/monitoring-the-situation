/**
 * Refugee Flows & Migration Pressure Service
 * Sources: UNHCR Population Statistics API (free, no auth)
 *          Google News RSS for migration news
 *          Baseline data as fallback
 */

import { cacheService } from './cache.service.js';
import Parser from 'rss-parser';

const parser = new Parser({ timeout: 10000 });
const UNHCR_API = 'https://api.unhcr.org/population/v1/population/';
const CACHE_KEY = 'refugee:combined';
const CACHE_TTL = 3600; // 1 hour

// ISO3 codes for major displacement origin countries
const ORIGIN_COUNTRIES = [
  { iso3: 'UKR', name: 'Ukraine Crisis', region: 'Europe', lat: 48.38, lon: 31.17, since: 2022 },
  { iso3: 'SYR', name: 'Syria Crisis', region: 'Middle East', lat: 34.8, lon: 38.99, since: 2011 },
  { iso3: 'AFG', name: 'Afghanistan', region: 'South Asia', lat: 33.94, lon: 67.71, since: 2001 },
  { iso3: 'VEN', name: 'Venezuela Situation', region: 'Americas', lat: 6.42, lon: -66.59, since: 2015 },
  { iso3: 'MMR', name: 'Myanmar Emergency', region: 'Southeast Asia', lat: 21.91, lon: 95.96, since: 2017 },
  { iso3: 'SDN', name: 'Sudan Crisis', region: 'East Africa', lat: 12.86, lon: 30.22, since: 2023 },
  { iso3: 'COD', name: 'DR Congo', region: 'Central Africa', lat: -4.04, lon: 21.76, since: 1996 },
  { iso3: 'SOM', name: 'Somalia', region: 'Horn of Africa', lat: 5.15, lon: 46.2, since: 1991 },
  { iso3: 'SSD', name: 'South Sudan', region: 'East Africa', lat: 6.87, lon: 31.31, since: 2013 },
  { iso3: 'ERI', name: 'Eritrea', region: 'Horn of Africa', lat: 15.18, lon: 39.78, since: 2000 },
  { iso3: 'PSE', name: 'Palestine', region: 'Middle East', lat: 31.95, lon: 35.23, since: 1948 },
  { iso3: 'ETH', name: 'Ethiopia', region: 'Horn of Africa', lat: 9.15, lon: 40.49, since: 2020 },
];

// Top host countries by ISO3
const HOST_ISO3 = [
  { iso3: 'TUR', name: 'Turkey', lat: 38.96, lon: 35.24 },
  { iso3: 'IRN', name: 'Iran', lat: 32.43, lon: 53.69 },
  { iso3: 'COL', name: 'Colombia', lat: 4.57, lon: -74.3 },
  { iso3: 'DEU', name: 'Germany', lat: 51.17, lon: 10.45 },
  { iso3: 'PAK', name: 'Pakistan', lat: 30.38, lon: 69.35 },
  { iso3: 'UGA', name: 'Uganda', lat: 1.37, lon: 32.29 },
  { iso3: 'BGD', name: 'Bangladesh', lat: 23.68, lon: 90.36 },
  { iso3: 'POL', name: 'Poland', lat: 51.92, lon: 19.15 },
  { iso3: 'ETH', name: 'Ethiopia', lat: 9.15, lon: 40.49 },
  { iso3: 'TCD', name: 'Chad', lat: 15.45, lon: 18.73 },
  { iso3: 'SDN', name: 'Sudan', lat: 12.86, lon: 30.22 },
  { iso3: 'KEN', name: 'Kenya', lat: -0.02, lon: 37.91 },
  { iso3: 'PER', name: 'Peru', lat: -12.05, lon: -77.04 },
  { iso3: 'USA', name: 'United States', lat: 38.91, lon: -77.04 },
];

// Baseline fallback data (approximate figures from UNHCR Global Trends 2024)
const BASELINE_FALLBACK = {
  UKR: { refugees: 6500000, idps: 3700000 },
  SYR: { refugees: 6800000, idps: 6900000 },
  AFG: { refugees: 6400000, idps: 3400000 },
  VEN: { refugees: 7700000, idps: 0 },
  MMR: { refugees: 1900000, idps: 1800000 },
  SDN: { refugees: 3100000, idps: 10800000 },
  COD: { refugees: 1000000, idps: 6900000 },
  SOM: { refugees: 2100000, idps: 3900000 },
  SSD: { refugees: 2300000, idps: 2200000 },
  ERI: { refugees: 650000, idps: 0 },
  PSE: { refugees: 5900000, idps: 1700000 },
  ETH: { refugees: 900000, idps: 4200000 },
};

const HOST_BASELINE = {
  TUR: 3400000, IRN: 3800000, COL: 2900000, DEU: 2600000,
  PAK: 2100000, UGA: 1600000, BGD: 950000, POL: 980000,
  ETH: 930000, TCD: 1100000, SDN: 1200000, KEN: 790000,
  PER: 1500000, USA: 1200000,
};

async function fetchUNHCRPopulation(iso3, type = 'origin') {
  try {
    const currentYear = new Date().getFullYear();
    const param = type === 'origin' ? 'coo' : 'coa';
    const url = `${UNHCR_API}?${param}=${iso3}&year_from=${currentYear - 1}&year_to=${currentYear}&limit=5`;
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (!json.items || json.items.length === 0) return null;
    // Sum across all rows for this country
    let totalRefugees = 0, totalAsylum = 0, totalIdps = 0, totalOther = 0;
    for (const row of json.items) {
      totalRefugees += parseInt(row.refugees || 0);
      totalAsylum += parseInt(row.asylum_seekers || 0);
      totalIdps += parseInt(row.idps || 0);
      totalOther += parseInt(row.ooc || row.stateless || 0);
    }
    return {
      refugees: totalRefugees + totalAsylum,
      idps: totalIdps,
      other: totalOther,
      year: json.items[0]?.year || currentYear,
    };
  } catch (err) {
    console.error(`[Refugee] UNHCR API error for ${iso3}:`, err.message);
    return null;
  }
}

async function fetchMigrationNews() {
  try {
    const url = 'https://news.google.com/rss/search?q=refugee+OR+migration+crisis+OR+%22asylum+seekers%22+OR+%22displaced+persons%22&hl=en-US&gl=US&ceid=US:en';
    const feed = await parser.parseURL(url);
    return (feed.items || []).slice(0, 15).map(item => ({
      title: item.title,
      link: item.link,
      date: item.pubDate || item.isoDate,
      source: (item.title || '').split(' - ').pop()?.trim() || 'Google News',
    }));
  } catch (err) {
    console.error('[Refugee] News fetch error:', err.message);
    return [];
  }
}

export const refugeeService = {
  async getCombinedData() {
    const cached = await cacheService.get(CACHE_KEY);
    if (cached) return cached;

    console.log('[Refugee] Fetching UNHCR population data...');

    // Fetch origin country data from UNHCR in parallel (with fallback)
    const originResults = await Promise.allSettled(
      ORIGIN_COUNTRIES.map(async (c) => {
        const live = await fetchUNHCRPopulation(c.iso3, 'origin');
        const fallback = BASELINE_FALLBACK[c.iso3] || { refugees: 0, idps: 0 };
        return {
          id: c.iso3.toLowerCase(),
          name: c.name,
          region: c.region,
          lat: c.lat,
          lon: c.lon,
          since: c.since,
          status: 'ongoing',
          refugees: live?.refugees || fallback.refugees,
          idps: live?.idps || fallback.idps,
          dataSource: live ? 'UNHCR API' : 'baseline estimate',
          dataYear: live?.year || 2024,
        };
      })
    );

    const situations = originResults
      .filter(r => r.status === 'fulfilled')
      .map(r => r.value)
      .sort((a, b) => (b.refugees + b.idps) - (a.refugees + a.idps));

    // Fetch host country data
    const hostResults = await Promise.allSettled(
      HOST_ISO3.map(async (c) => {
        const live = await fetchUNHCRPopulation(c.iso3, 'asylum');
        const fallback = HOST_BASELINE[c.iso3] || 0;
        return {
          name: c.name,
          lat: c.lat,
          lon: c.lon,
          refugees: live?.refugees || fallback,
          dataSource: live ? 'UNHCR API' : 'baseline estimate',
        };
      })
    );

    const hostCountries = hostResults
      .filter(r => r.status === 'fulfilled')
      .map(r => r.value)
      .sort((a, b) => b.refugees - a.refugees);

    const news = await fetchMigrationNews();

    const totalRefugees = situations.reduce((s, e) => s + e.refugees, 0);
    const totalIDPs = situations.reduce((s, e) => s + e.idps, 0);

    const result = {
      situations,
      hostCountries,
      news,
      summary: {
        totalRefugees,
        totalIDPs,
        totalDisplaced: totalRefugees + totalIDPs,
        activeSituations: situations.length,
        topHostCountries: hostCountries.length,
        liveDataSources: situations.filter(s => s.dataSource === 'UNHCR API').length,
      },
      source: 'UNHCR Population Statistics API + Google News',
      updatedAt: new Date().toISOString(),
    };

    await cacheService.set(CACHE_KEY, result, CACHE_TTL);
    console.log(`[Refugee] Cached ${situations.length} situations, ${hostCountries.length} hosts (${result.summary.liveDataSources} from live API)`);
    return result;
  },
};
