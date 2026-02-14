/**
 * Natural Disasters & Emergencies Service
 * Sources: NASA EONET (Earth Observatory Natural Event Tracker) - free, no auth
 *          GDELT for earthquake/disaster news
 *          ReliefWeb API (UN OCHA) - free, no auth
 */

import { cacheService } from './cache.service.js';

const EONET_API = 'https://eonet.gsfc.nasa.gov/api/v3';
const RELIEFWEB_API = 'https://api.reliefweb.int/v1';
const CACHE_KEY = 'disasters:combined';
const CACHE_TTL = 600; // 10 minutes

// EONET category mapping
const CATEGORY_MAP = {
  drought: { icon: '🏜️', severity: 'moderate' },
  dustHaze: { icon: '🌫️', severity: 'low' },
  earthquakes: { icon: '🌍', severity: 'high' },
  floods: { icon: '🌊', severity: 'high' },
  landslides: { icon: '⛰️', severity: 'moderate' },
  manmade: { icon: '🏭', severity: 'moderate' },
  seaLakeIce: { icon: '🧊', severity: 'low' },
  severeStorms: { icon: '⛈️', severity: 'high' },
  snow: { icon: '❄️', severity: 'moderate' },
  tempExtremes: { icon: '🌡️', severity: 'moderate' },
  volcanoes: { icon: '🌋', severity: 'critical' },
  waterColor: { icon: '💧', severity: 'low' },
  wildfires: { icon: '🔥', severity: 'high' },
};

async function fetchEONET() {
  try {
    const url = `${EONET_API}/events?status=open&limit=100`;
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`EONET ${res.status}`);
    const data = await res.json();

    return (data.events || []).map(event => {
      const category = event.categories?.[0]?.id || 'unknown';
      const catInfo = CATEGORY_MAP[category] || { icon: '⚠️', severity: 'moderate' };
      const geometry = event.geometry?.[event.geometry.length - 1];
      const coords = geometry?.coordinates || [];

      return {
        id: event.id,
        title: event.title,
        category,
        categoryLabel: event.categories?.[0]?.title || category,
        icon: catInfo.icon,
        severity: catInfo.severity,
        lat: coords[1] || null,
        lon: coords[0] || null,
        date: geometry?.date || event.geometry?.[0]?.date,
        source: 'NASA EONET',
        sources: (event.sources || []).map(s => ({ id: s.id, url: s.url })),
        link: event.link,
        closed: event.closed,
        geometryType: geometry?.type || 'Point',
      };
    });
  } catch (err) {
    console.error('[Disasters] EONET fetch error:', err.message);
    return [];
  }
}

async function fetchReliefWeb() {
  try {
    const url = `${RELIEFWEB_API}/disasters?appname=monitored&limit=30&sort[]=date:desc&fields[include][]=name&fields[include][]=date&fields[include][]=status&fields[include][]=country&fields[include][]=type&fields[include][]=url&fields[include][]=glide`;
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`ReliefWeb ${res.status}`);
    const data = await res.json();

    return (data.data || []).map(item => ({
      id: `reliefweb-${item.id}`,
      title: item.fields?.name || 'Unknown disaster',
      date: item.fields?.date?.created,
      status: item.fields?.status,
      countries: (item.fields?.country || []).map(c => c.name),
      type: (item.fields?.type || []).map(t => t.name),
      url: item.fields?.url,
      glide: item.fields?.glide,
      source: 'ReliefWeb',
    }));
  } catch (err) {
    console.error('[Disasters] ReliefWeb fetch error:', err.message);
    return [];
  }
}

export const disastersService = {
  async getCombinedData() {
    const cached = await cacheService.get(CACHE_KEY);
    if (cached) return cached;

    const [eonetEvents, reliefWebEvents] = await Promise.allSettled([
      fetchEONET(),
      fetchReliefWeb(),
    ]);

    const result = {
      activeEvents: eonetEvents.status === 'fulfilled' ? eonetEvents.value : [],
      recentDisasters: reliefWebEvents.status === 'fulfilled' ? reliefWebEvents.value : [],
      summary: {
        totalActive: eonetEvents.status === 'fulfilled' ? eonetEvents.value.length : 0,
        bySeverity: {},
        byCategory: {},
      },
    };

    // Compute summary stats
    if (result.activeEvents.length > 0) {
      result.activeEvents.forEach(e => {
        result.summary.bySeverity[e.severity] = (result.summary.bySeverity[e.severity] || 0) + 1;
        result.summary.byCategory[e.categoryLabel] = (result.summary.byCategory[e.categoryLabel] || 0) + 1;
      });
    }

    await cacheService.set(CACHE_KEY, result, CACHE_TTL);
    return result;
  },

  async getActiveEvents() {
    const data = await this.getCombinedData();
    return data.activeEvents;
  },

  async getByCategory(category) {
    const events = await this.getActiveEvents();
    return events.filter(e => e.category === category);
  },
};
