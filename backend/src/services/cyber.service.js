/**
 * Cyberattacks & Outages Monitoring Service
 * Sources: GDELT for cyber event news, Google News RSS for cyber incidents
 *          CISA KEV (Known Exploited Vulnerabilities) - free, no auth
 */

import { cacheService } from './cache.service.js';
import { fetchGDELTRaw } from './gdelt.client.js';
import Parser from 'rss-parser';

const parser = new Parser({ timeout: 10000 });
const CACHE_KEY = 'cyber:combined';
const CACHE_TTL = 600; // 10 minutes

const RSS_SOURCES = [
  { url: 'https://news.google.com/rss/search?q=cyberattack+OR+%22data+breach%22+OR+%22ransomware%22&hl=en-US&gl=US&ceid=US:en', name: 'Google News - Cyber' },
  { url: 'https://news.google.com/rss/search?q=internet+outage+OR+%22service+outage%22+OR+%22major+outage%22&hl=en-US&gl=US&ceid=US:en', name: 'Google News - Outages' },
  { url: 'https://www.bleepingcomputer.com/feed/', name: 'BleepingComputer' },
];

const CISA_KEV_URL = 'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json';

async function fetchRSSCyber() {
  const allItems = [];
  for (const source of RSS_SOURCES) {
    try {
      const feed = await parser.parseURL(source.url);
      (feed.items || []).forEach(item => {
        allItems.push({
          id: `cyber-${Buffer.from(item.link || item.title || '').toString('base64').slice(0, 20)}`,
          title: item.title,
          link: item.link,
          date: item.pubDate || item.isoDate,
          source: source.name,
          snippet: item.contentSnippet?.slice(0, 200) || '',
          type: source.name.includes('Outage') ? 'outage' : 'cyber',
        });
      });
    } catch (err) {
      console.error(`[Cyber] RSS error for ${source.name}:`, err.message);
    }
  }
  // Deduplicate by title similarity
  const seen = new Set();
  return allItems.filter(item => {
    const key = item.title?.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 40);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 50);
}

async function fetchCISAVulns() {
  try {
    const res = await fetch(CISA_KEV_URL, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`CISA ${res.status}`);
    const data = await res.json();
    const vulns = (data.vulnerabilities || [])
      .sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded))
      .slice(0, 20);
    return vulns.map(v => ({
      id: v.cveID,
      cve: v.cveID,
      vendor: v.vendorProject,
      product: v.product,
      name: v.vulnerabilityName,
      description: v.shortDescription,
      dateAdded: v.dateAdded,
      dueDate: v.dueDate,
      knownRansomware: v.knownRansomwareCampaignUse === 'Known',
      source: 'CISA KEV',
    }));
  } catch (err) {
    console.error('[Cyber] CISA KEV fetch error:', err.message);
    return [];
  }
}

async function fetchGDELTCyber() {
  try {
    const query = encodeURIComponent('cyberattack OR "data breach" OR ransomware OR "critical infrastructure"');
    const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${query}&mode=artlist&maxrecords=30&format=json&timespan=7d`;
    const data = await fetchGDELTRaw(url, 'Cyber');
    if (!data) return [];
    return (data.articles || []).map(a => ({
      id: `gdelt-cyber-${Buffer.from(a.url || '').toString('base64').slice(0, 20)}`,
      title: a.title,
      link: a.url,
      date: a.seendate,
      source: a.domain || 'GDELT',
      language: a.language,
      country: a.sourcecountry,
      tone: a.tone,
      type: 'cyber',
    })).slice(0, 20);
  } catch (err) {
    console.error('[Cyber] GDELT fetch error:', err.message);
    return [];
  }
}

export const cyberService = {
  async getCombinedData() {
    const cached = await cacheService.get(CACHE_KEY);
    if (cached) return cached;

    const [rssItems, cisaVulns, gdeltItems] = await Promise.allSettled([
      fetchRSSCyber(),
      fetchCISAVulns(),
      fetchGDELTCyber(),
    ]);

    const incidents = rssItems.status === 'fulfilled' ? rssItems.value : [];
    const vulns = cisaVulns.status === 'fulfilled' ? cisaVulns.value : [];
    const gdelt = gdeltItems.status === 'fulfilled' ? gdeltItems.value : [];

    // Merge RSS + GDELT, dedup
    const allIncidents = [...incidents];
    const existingTitles = new Set(incidents.map(i => i.title?.toLowerCase().slice(0, 40)));
    gdelt.forEach(g => {
      const key = g.title?.toLowerCase().slice(0, 40);
      if (!existingTitles.has(key)) {
        allIncidents.push(g);
        existingTitles.add(key);
      }
    });

    const result = {
      incidents: allIncidents.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 40),
      vulnerabilities: vulns,
      summary: {
        totalIncidents: allIncidents.length,
        totalVulnerabilities: vulns.length,
        ransomwareRelated: vulns.filter(v => v.knownRansomware).length,
        cyberAttacks: allIncidents.filter(i => i.type === 'cyber').length,
        outages: allIncidents.filter(i => i.type === 'outage').length,
      },
    };

    await cacheService.set(CACHE_KEY, result, CACHE_TTL);
    return result;
  },
};
