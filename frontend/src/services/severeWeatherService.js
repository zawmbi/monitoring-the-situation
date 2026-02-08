/**
 * Severe Weather & Natural Disaster Service
 *
 * Fetches real-time data from free public APIs:
 *   - USGS Earthquake Hazards Program (earthquakes M4.5+)
 *   - NASA EONET v3 (storms, wildfires, volcanoes, floods, etc.)
 *
 * No API keys required — both are open government APIs.
 */

const USGS_SIGNIFICANT = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_month.geojson';
const EONET_EVENTS = 'https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=50';

const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function isCacheValid(key) {
  const entry = cache.get(key);
  return entry && Date.now() - entry.ts < CACHE_TTL;
}

/**
 * Categorize EONET event categories into our display categories.
 */
function eonetCategory(cat) {
  const id = (cat || '').toLowerCase();
  if (id.includes('storm') || id.includes('cyclone')) return 'storm';
  if (id.includes('volcano')) return 'volcano';
  if (id.includes('wildfire') || id.includes('fire')) return 'wildfire';
  if (id.includes('flood')) return 'flood';
  if (id.includes('drought')) return 'drought';
  if (id.includes('dust') || id.includes('haze')) return 'dust';
  if (id.includes('ice') || id.includes('snow')) return 'ice';
  if (id.includes('landslide')) return 'landslide';
  if (id.includes('earthquake')) return 'earthquake';
  return 'other';
}

/**
 * Fetch significant earthquakes (M4.5+) from the past 30 days.
 * Returns GeoJSON-compatible array of normalized event objects.
 */
export async function fetchEarthquakes() {
  if (isCacheValid('quakes')) return cache.get('quakes').data;

  try {
    const res = await fetch(USGS_SIGNIFICANT);
    if (!res.ok) return [];
    const geo = await res.json();

    const events = (geo.features || []).map((f) => {
      const p = f.properties || {};
      const [lon, lat, depth] = f.geometry?.coordinates || [0, 0, 0];
      return {
        id: f.id || `eq-${p.time}`,
        type: 'earthquake',
        title: p.title || `M${p.mag} Earthquake`,
        magnitude: p.mag,
        place: p.place || '',
        time: p.time ? new Date(p.time).toISOString() : null,
        timestamp: p.time || 0,
        lon,
        lat,
        depth,
        url: p.url || '',
        tsunami: p.tsunami === 1,
        severity: p.mag >= 7 ? 'extreme' : p.mag >= 6 ? 'severe' : p.mag >= 5 ? 'moderate' : 'minor',
      };
    });

    events.sort((a, b) => b.timestamp - a.timestamp);
    cache.set('quakes', { data: events, ts: Date.now() });
    return events;
  } catch {
    return [];
  }
}

/**
 * Fetch active natural events from NASA EONET.
 * Returns normalized event objects with coordinates.
 */
export async function fetchEONETEvents() {
  if (isCacheValid('eonet')) return cache.get('eonet').data;

  try {
    const res = await fetch(EONET_EVENTS);
    if (!res.ok) return [];
    const data = await res.json();

    const events = (data.events || [])
      .filter((e) => e.geometry?.length > 0)
      .map((e) => {
        const geo = e.geometry[e.geometry.length - 1]; // most recent position
        const coords = geo.coordinates || [];
        const cat = e.categories?.[0]?.title || '';
        return {
          id: e.id || `eonet-${e.title}`,
          type: eonetCategory(cat),
          category: cat,
          title: e.title || 'Unknown Event',
          time: geo.date || null,
          timestamp: geo.date ? new Date(geo.date).getTime() : 0,
          lon: coords[0] || 0,
          lat: coords[1] || 0,
          url: e.link || '',
          severity: 'moderate',
          source: 'NASA EONET',
        };
      });

    events.sort((a, b) => b.timestamp - a.timestamp);
    cache.set('eonet', { data: events, ts: Date.now() });
    return events;
  } catch {
    return [];
  }
}

/**
 * Fetch all severe weather / disaster events combined.
 */
export async function fetchAllSevereEvents() {
  const [quakes, eonet] = await Promise.all([fetchEarthquakes(), fetchEONETEvents()]);
  const all = [...quakes, ...eonet];
  all.sort((a, b) => b.timestamp - a.timestamp);
  return all;
}
