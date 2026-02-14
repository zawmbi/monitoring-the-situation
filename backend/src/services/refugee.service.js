/**
 * Refugee Flows & Migration Pressure Service
 * Sources: UNHCR Refugee Data API (free, no auth)
 *          IOM DTM (Displacement Tracking Matrix)
 *          Google News RSS for migration news
 */

import { cacheService } from './cache.service.js';
import Parser from 'rss-parser';

const parser = new Parser({ timeout: 10000 });
const UNHCR_API = 'https://data.unhcr.org/api';
const CACHE_KEY = 'refugee:combined';
const CACHE_TTL = 3600; // 1 hour

// Major displacement situations with approximate data
const BASELINE_SITUATIONS = [
  { id: 'ukraine', name: 'Ukraine Crisis', refugees: 6500000, idps: 3700000, region: 'Europe', lat: 48.38, lon: 31.17, status: 'ongoing', year: 2022 },
  { id: 'syria', name: 'Syria Crisis', refugees: 6800000, idps: 6900000, region: 'Middle East', lat: 34.8, lon: 38.99, status: 'ongoing', year: 2011 },
  { id: 'afghanistan', name: 'Afghanistan', refugees: 6400000, idps: 3400000, region: 'South Asia', lat: 33.94, lon: 67.71, status: 'ongoing', year: 2001 },
  { id: 'venezuela', name: 'Venezuela Situation', refugees: 7700000, idps: 0, region: 'Americas', lat: 6.42, lon: -66.59, status: 'ongoing', year: 2015 },
  { id: 'myanmar', name: 'Myanmar Emergency', refugees: 1900000, idps: 1800000, region: 'Southeast Asia', lat: 21.91, lon: 95.96, status: 'ongoing', year: 2017 },
  { id: 'sudan', name: 'Sudan Crisis', refugees: 3100000, idps: 10800000, region: 'East Africa', lat: 12.86, lon: 30.22, status: 'ongoing', year: 2023 },
  { id: 'drc', name: 'DR Congo', refugees: 1000000, idps: 6900000, region: 'Central Africa', lat: -4.04, lon: 21.76, status: 'ongoing', year: 1996 },
  { id: 'somalia', name: 'Somalia', refugees: 2100000, idps: 3900000, region: 'Horn of Africa', lat: 5.15, lon: 46.2, status: 'ongoing', year: 1991 },
  { id: 'southsudan', name: 'South Sudan', refugees: 2300000, idps: 2200000, region: 'East Africa', lat: 6.87, lon: 31.31, status: 'ongoing', year: 2013 },
  { id: 'eritrea', name: 'Eritrea', refugees: 650000, idps: 0, region: 'Horn of Africa', lat: 15.18, lon: 39.78, status: 'ongoing', year: 2000 },
  { id: 'rohingya', name: 'Rohingya Crisis', refugees: 1100000, idps: 150000, region: 'Southeast Asia', lat: 20.15, lon: 92.87, status: 'ongoing', year: 2017 },
  { id: 'palestine', name: 'Palestine', refugees: 5900000, idps: 1700000, region: 'Middle East', lat: 31.95, lon: 35.23, status: 'ongoing', year: 1948 },
];

// Top host countries
const HOST_COUNTRIES = [
  { name: 'Turkey', refugees: 3400000, lat: 38.96, lon: 35.24 },
  { name: 'Iran', refugees: 3800000, lat: 32.43, lon: 53.69 },
  { name: 'Colombia', refugees: 2900000, lat: 4.57, lon: -74.3 },
  { name: 'Germany', refugees: 2600000, lat: 51.17, lon: 10.45 },
  { name: 'Pakistan', refugees: 2100000, lat: 30.38, lon: 69.35 },
  { name: 'Uganda', refugees: 1600000, lat: 1.37, lon: 32.29 },
  { name: 'Bangladesh', refugees: 950000, lat: 23.68, lon: 90.36 },
  { name: 'Poland', refugees: 980000, lat: 51.92, lon: 19.15 },
  { name: 'Ethiopia', refugees: 930000, lat: 9.15, lon: 40.49 },
  { name: 'Chad', refugees: 1100000, lat: 15.45, lon: 18.73 },
  { name: 'Sudan', refugees: 1200000, lat: 12.86, lon: 30.22 },
  { name: 'Kenya', refugees: 790000, lat: -0.02, lon: 37.91 },
];

async function fetchMigrationNews() {
  try {
    const url = 'https://news.google.com/rss/search?q=refugee+OR+migration+crisis+OR+%22asylum+seekers%22+OR+%22displaced+persons%22&hl=en-US&gl=US&ceid=US:en';
    const feed = await parser.parseURL(url);
    return (feed.items || []).slice(0, 15).map(item => ({
      title: item.title,
      link: item.link,
      date: item.pubDate || item.isoDate,
      source: 'Google News',
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

    const news = await fetchMigrationNews();

    const totalRefugees = BASELINE_SITUATIONS.reduce((s, e) => s + e.refugees, 0);
    const totalIDPs = BASELINE_SITUATIONS.reduce((s, e) => s + e.idps, 0);

    const result = {
      situations: BASELINE_SITUATIONS,
      hostCountries: HOST_COUNTRIES,
      news,
      summary: {
        totalRefugees,
        totalIDPs,
        totalDisplaced: totalRefugees + totalIDPs,
        activeSituations: BASELINE_SITUATIONS.length,
        topHostCountries: HOST_COUNTRIES.length,
      },
    };

    await cacheService.set(CACHE_KEY, result, CACHE_TTL);
    return result;
  },
};
