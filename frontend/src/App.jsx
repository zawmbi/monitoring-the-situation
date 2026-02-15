import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Map as MapGL, Source, Layer, Marker, NavigationControl } from '@vis.gl/react-maplibre';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { feature } from 'topojson-client';
import { geoCentroid } from 'd3-geo';
import worldData from 'world-atlas/countries-50m.json';
import usData from 'us-atlas/states-10m.json';
import countries from 'world-countries';
import canadaProvinces from './canadaProvinces.json';
import CAPITAL_COORDS from './capitalCoords';
import POPULATION_POINTS from './populationData';
import { useFeed } from './hooks/useFeed';
import { useStocks } from './hooks/useStocks';
import { useFlights } from './hooks/useFlights';
import NewsFeed, { NewsItem } from './features/news/NewsFeed';
import { StocksPanel } from './features/stocks/StocksPanel';
import { PolymarketPanel } from './features/polymarket/PolymarketPanel';
import { usePolymarket } from './features/polymarket/usePolymarket';
import { CountryPanel } from './features/country/CountryPanel';
import { useCountryPanel } from './features/country/useCountryPanel';
import { useWeather } from './hooks/useWeather';
import { useSevereWeather } from './hooks/useSevereWeather';
import { SevereWeatherPanel } from './features/severeWeather/SevereWeatherPanel';
import { TariffPanel } from './features/tariffs/TariffPanel';
import { getUniversalRate, getTariffColor, getTariffColorLight, TARIFF_LEGEND } from './features/tariffs/tariffData';
import { timeAgo } from './utils/time';
import Navbar, { PagePanel } from './navbar/Navbar';
import FrontlineOverlay from './features/frontline/FrontlineOverlay';
import StarfieldCanvas from './StarfieldCanvas';
import EarthOverlay from './EarthOverlay';

// Fix polygons for MapLibre rendering:
// 1. Clamp latitudes to ±85 (Mercator can't handle ±90)
// 2. Shift negative longitudes by +360 in rings that cross the antimeridian
function fixGeoJSON(geojson) {
  function fixRing(ring) {
    let crosses = false;
    for (let i = 1; i < ring.length; i++) {
      if (Math.abs(ring[i][0] - ring[i - 1][0]) > 180) { crosses = true; break; }
    }
    return ring.map(([lon, lat]) => [
      crosses && lon < 0 ? lon + 360 : lon,
      Math.max(-85, Math.min(85, lat)),
    ]);
  }
  function fixGeometry(geom) {
    if (geom.type === 'Polygon') {
      return { ...geom, coordinates: geom.coordinates.map(fixRing) };
    }
    if (geom.type === 'MultiPolygon') {
      return { ...geom, coordinates: geom.coordinates.map(poly => poly.map(fixRing)) };
    }
    return geom;
  }
  return geojson.map(f => ({ ...f, geometry: fixGeometry(f.geometry) }));
}

// Safe guard in case topojson fails to load
const GEO_FEATURES = fixGeoJSON(
  worldData?.objects?.countries
    ? feature(worldData, worldData.objects.countries).features
        .filter(f => String(f.id).padStart(3, '0') !== '010') // Remove Antarctica
    : []
);
const US_STATE_FEATURES = usData?.objects?.states
  ? feature(usData, usData.objects.states).features
  : [];

const CA_PROVINCE_FEATURES = fixGeoJSON(canadaProvinces?.features || []);

const COUNTRIES_DATA = Array.isArray(countries)
  ? countries
  : (countries?.default && Array.isArray(countries.default) ? countries.default : []);

const COUNTRY_BY_CCN3 = new Map(
  (COUNTRIES_DATA || [])
    .filter((country) => country?.ccn3)
    .map((country) => [String(country.ccn3).padStart(3, '0'), country])
);

const CAPITAL_MARKERS = GEO_FEATURES.map((geo, idx) => {
  const ccn3 = String(geo.id).padStart(3, '0');
  const country = COUNTRY_BY_CCN3.get(ccn3);
  const capitalName = Array.isArray(country?.capital) ? country.capital[0] : country?.capital;
  if (!capitalName) return null;

  const coords = CAPITAL_COORDS[ccn3];
  let lat, lon;

  if (coords) {
    [lat, lon] = coords;
  } else {
    [lon, lat] = geoCentroid(geo);
  }

  if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null;

  return {
    id: `capital-${geo.id || idx}`,
    name: capitalName,
    lon,
    lat,
  };
}).filter(Boolean);

// Build marker list for every country and US state
const COUNTRY_MARKERS = GEO_FEATURES.map((geo, idx) => {
  const [lon, lat] = geoCentroid(geo);
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null;
  return {
    id: geo.id || `country-${idx}`,
    name: geo.properties?.name || `Country ${idx}`,
    lon,
    lat,
    match: (geo.properties?.name || '').toLowerCase(),
    scope: 'country',
  };
}).filter(Boolean);

const STATE_MARKERS = US_STATE_FEATURES.map((geo, idx) => {
  const [lon, lat] = geoCentroid(geo);
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null;
  return {
    id: `us-${geo.id || idx}`,
    name: geo.properties?.name || `State ${idx}`,
    lon,
    lat,
    match: (geo.properties?.name || '').toLowerCase(),
    scope: 'state',
  };
}).filter(Boolean);

const PROVINCE_MARKERS = CA_PROVINCE_FEATURES.map((geo, idx) => {
  const [lon, lat] = geoCentroid(geo);
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null;
  return {
    id: `ca-${geo.id || idx}`,
    name: geo.properties?.name || `Province ${idx}`,
    lon,
    lat,
    match: (geo.properties?.name || '').toLowerCase(),
    scope: 'province',
  };
}).filter(Boolean);

const GEO_MARKERS = [...COUNTRY_MARKERS, ...STATE_MARKERS, ...PROVINCE_MARKERS];

// Pre-generate static GeoJSON data for MapLibre layers
// Build graticule manually — d3's geoGraticule generates latitude lines that
// span the full -180→180 longitude as single LineStrings, which MapLibre clips
// on globe projection. Splitting parallels into two halves fixes this.
const GRATICULE_GEOJSON = {
  type: 'FeatureCollection',
  features: [
    // Meridians (vertical lines) every 10° — from -85 to 85 latitude
    ...Array.from({ length: 36 }, (_, i) => {
      const lon = -180 + i * 10;
      return {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: Array.from({ length: 171 }, (_, j) => [lon, -85 + j]),
        },
      };
    }),
    // Parallels (horizontal lines) every 10° — split into western and eastern halves
    ...Array.from({ length: 17 }, (_, i) => {
      const lat = -80 + i * 10;
      return [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: Array.from({ length: 181 }, (_, j) => [-180 + j, lat]),
          },
        },
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: Array.from({ length: 181 }, (_, j) => [j, lat]),
          },
        },
      ];
    }).flat(),
  ],
};

const EQUATOR_GEOJSON = {
  type: 'Feature',
  properties: {},
  geometry: {
    type: 'LineString',
    coordinates: Array.from({ length: 361 }, (_, i) => [i - 180, 0]),
  },
};

// Compass crosshair: vertical line (prime meridian) + horizontal line (equator)
const COMPASS_LINES_GEOJSON = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', properties: { axis: 'ns' }, geometry: { type: 'LineString', coordinates: [[0, -85], [0, 85]] } },
    { type: 'Feature', properties: { axis: 'ew' }, geometry: { type: 'LineString', coordinates: [[-180, 0], [180, 0]] } },
  ],
};

const TIMEZONE_LINES_GEOJSON = {
  type: 'FeatureCollection',
  features: [-180, -150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150].map(lon => ({
    type: 'Feature',
    properties: { lon, isPrimeMeridian: lon === 0 },
    geometry: {
      type: 'LineString',
      coordinates: [[lon, -85], [lon, 85]],
    },
  })),
};

function deriveHotspots(items) {
  const buckets = GEO_MARKERS.map(marker => ({ ...marker, items: [] }));

  items.forEach(item => {
    const text = `${item.title || ''} ${item.summary || ''} ${item.content || ''} ${item.sourceName || ''} ${item.source || ''}`.toLowerCase();
    buckets.forEach(bucket => {
      if (bucket.match && text.includes(bucket.match)) {
        bucket.items.push(item);
      }
    });
  });

  return buckets
    .filter(bucket => bucket.items.length > 0)
    .map(bucket => {
      const byType = {};
      bucket.items.forEach(entry => {
        byType[entry.contentType] = (byType[entry.contentType] || 0) + 1;
      });
      const mostRecent = bucket.items.reduce((latest, item) => {
        const itemDate = new Date(item.publishedAt);
        return itemDate > latest ? itemDate : latest;
      }, new Date(0));
      return {
        ...bucket,
        count: bucket.items.length,
        byType,
        items: bucket.items.slice(0, 30),
        lastUpdated: mostRecent,
      };
    })
    .sort((a, b) => b.count - a.count);
}

// Get current time for a UTC offset
function getCurrentTimeForOffset(offsetHours) {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const targetTime = new Date(utc + (3600000 * offsetHours));
  const hours = targetTime.getHours();
  const minutes = targetTime.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes} ${ampm}`;
}

// Timezone info
const TIMEZONES = [
  { offset: -12, name: 'UTC-12', lon: -180 },
  { offset: -10, name: 'UTC-10', lon: -150 },
  { offset: -8, name: 'UTC-8', lon: -120 },
  { offset: -6, name: 'UTC-6', lon: -90 },
  { offset: -4, name: 'UTC-4', lon: -60 },
  { offset: -2, name: 'UTC-2', lon: -30 },
  { offset: 0, name: 'UTC', lon: 0 },
  { offset: 2, name: 'UTC+2', lon: 30 },
  { offset: 4, name: 'UTC+4', lon: 60 },
  { offset: 6, name: 'UTC+6', lon: 90 },
  { offset: 8, name: 'UTC+8', lon: 120 },
  { offset: 10, name: 'UTC+10', lon: 150 },
];

// Check if hotspot is recently updated (within last hour)
function isRecentlyUpdated(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now - date) / 1000);
  return seconds < 3600; // Within last hour
}

// Compact news item for sidebar

// Hotspot Popover Component
function HotspotPopover({ hotspot, position, onClose, onOpenInPanel, onPositionChange }) {
  const popoverRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        onClose();
      }
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const handleDragStart = (e) => {
    if (e.target.closest('button, a')) return;
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleDragMove = (e) => {
    if (isDragging && onPositionChange) {
      onPositionChange({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);
      return () => {
        document.removeEventListener('mousemove', handleDragMove);
        document.removeEventListener('mouseup', handleDragEnd);
      };
    }
  }, [isDragging, dragOffset]);

  if (!hotspot || !position) return null;

  return (
    <div
      ref={popoverRef}
      className="hotspot-popover"
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        zIndex: 1000,
        cursor: isDragging ? 'grabbing' : 'default'
      }}
      onMouseDown={handleDragStart}
    >
      <div className="hotspot-popover-arrow" />
      <div className="hotspot-popover-content">
        <div className="hotspot-popover-header" style={{ cursor: 'grab' }}>
          <h3 className="hotspot-popover-title">{hotspot.name}</h3>
          <button className="hotspot-popover-close" onClick={onClose} aria-label="Close">x</button>
        </div>
        {isRecentlyUpdated(hotspot.lastUpdated) && (
          <div className="hotspot-popover-badge">Updated {timeAgo(hotspot.lastUpdated)}</div>
        )}
        <div className="hotspot-popover-stats">
          <div className="hotspot-popover-stat">
            <span className="stat-value">{hotspot.count}</span>
            <span className="stat-label">items</span>
          </div>
          {Object.entries(hotspot.byType).map(([type, count]) => (
            <div key={type} className="hotspot-popover-stat">
              <span className="stat-value">{count}</span>
              <span className="stat-label">{type === 'article' ? 'news' : type}</span>
            </div>
          ))}
        </div>
        <div className="hotspot-popover-items">
          {hotspot.items.slice(0, 3).map((item, idx) => (
            <div key={item.id || idx} className="hotspot-popover-item">
              <div className="hotspot-popover-item-title">{item.title || 'Untitled'}</div>
              <div className="hotspot-popover-item-meta">{item.sourceName} - {timeAgo(item.publishedAt)}</div>
            </div>
          ))}
        </div>
        <button className="hotspot-popover-btn" onClick={onOpenInPanel}>
          Open in Panel
        </button>
      </div>
    </div>
  );
}

// News Panel Component
function NewsPanel({ hotspot, position, onClose, onPositionChange }) {
  const panelRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const handleDragStart = (e) => {
    if (e.target.closest('button, a')) return;
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleDragMove = (e) => {
    if (isDragging && onPositionChange) {
      onPositionChange({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);
      return () => {
        document.removeEventListener('mousemove', handleDragMove);
        document.removeEventListener('mouseup', handleDragEnd);
      };
    }
  }, [isDragging, dragOffset]);

  if (!hotspot || !position) return null;

  return (
    <div
      ref={panelRef}
      className="news-panel"
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        zIndex: 1001,
        cursor: isDragging ? 'grabbing' : 'default'
      }}
      onMouseDown={handleDragStart}
    >
      <div className="news-panel-header" style={{ cursor: 'grab' }}>
        <div className="news-panel-title-section">
          <h3 className="news-panel-title">{hotspot.name}</h3>
          <div className="news-panel-subtitle">{hotspot.count} items</div>
        </div>
        <button className="news-panel-close" onClick={onClose} aria-label="Close">x</button>
      </div>
      <div className="news-panel-content">
        {hotspot.items.map((item, idx) => (
          <NewsItem key={item.id || idx} item={item} />
        ))}
      </div>
    </div>
  );
}

const THEMES = [
  { id: 'cyber-control-room', label: 'Cyber Control Room', swatch: '#00d4ff' },
  { id: 'dark-minimal', label: 'Dark Minimal', swatch: '#8080ff' },
  { id: 'light-analytic', label: 'Light Analytic', swatch: '#2060c0' },
];

const getInitialTheme = () => {
  if (typeof window === 'undefined') return 'cyber-control-room';
  const stored = window.localStorage.getItem('theme');
  // Migration: map old values to new theme IDs
  if (stored === 'dark') return 'cyber-control-room';
  if (stored === 'light') return 'light-analytic';
  if (THEMES.some(t => t.id === stored)) return stored;
  return 'cyber-control-room';
};

const getInitialNavCollapsed = () => {
  if (typeof window === 'undefined') return false;
  const stored = window.localStorage.getItem('navCollapsed');
  if (stored === 'true' || stored === 'false') return stored === 'true';
  return window.innerWidth < 1100;
};

const VISUAL_LAYER_DEFAULTS = {
  atmosphere: false,
  contours: true,
  hillshade: true,
  heatmap: false,
  countryFill: true,
};

const getInitialVisualLayers = () => {
  if (typeof window === 'undefined') return VISUAL_LAYER_DEFAULTS;
  try {
    const stored = window.localStorage.getItem('visualLayers');
    if (stored) {
      const parsed = JSON.parse(stored);
      // Only restore known keys to avoid stale data from old schema
      const result = { ...VISUAL_LAYER_DEFAULTS };
      for (const key of Object.keys(VISUAL_LAYER_DEFAULTS)) {
        if (typeof parsed[key] === 'boolean') result[key] = parsed[key];
      }
      return result;
    }
  } catch {}
  return VISUAL_LAYER_DEFAULTS;
};

function App() {
  // View state machine: 'world' | 'region' | 'hotspot'
  const [viewMode, setViewMode] = useState('world');
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedHotspotId, setSelectedHotspotId] = useState(null);
  const [theme, setTheme] = useState(getInitialTheme);
  const [activePage, setActivePage] = useState(null);
  const [navCollapsed, setNavCollapsed] = useState(getInitialNavCollapsed);

  // Country panel hook
  const {
    countryPanel,
    openCountryPanel,
    openStatePanel,
    openProvincePanel,
    closeCountryPanel,
    updateCountryPanelPosition,
  } = useCountryPanel();

  // Temperature unit: 'F' (default) or 'C'
  const [tempUnit, setTempUnit] = useState('F');

  // Weather for the currently open country panel (fetches by capital city)
  const weatherCity = countryPanel.open ? countryPanel.data?.capital : null;
  const { weather: panelWeather, loading: panelWeatherLoading } = useWeather(weatherCity);

  // Sidebar state
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [sidebarTab, setSidebarTab] = useState('world');
  const [showTimezones, setShowTimezones] = useState(false);
  const [selectedCapital, setSelectedCapital] = useState(null);
  const [useGlobe, setUseGlobe] = useState(true);
  const [autoRotate, setAutoRotate] = useState(true);
  const [rotateSpeed, setRotateSpeed] = useState(0.06);
  const [rotateCCW, setRotateCCW] = useState(false);
  const [holoMode, setHoloMode] = useState(false);
  const [transparentGlobe, setTransparentGlobe] = useState(true);
  const mapCenterRef = useRef({ lng: 0, lat: 20 });
  const [musicPlaying, setMusicPlaying] = useState(true);
  const [musicVolume, setMusicVolume] = useState(0.5);
  const [visualLayers, setVisualLayers] = useState(getInitialVisualLayers);
  const [showFrontline, setShowFrontline] = useState(false);
  const [showTariffHeatmap, setShowTariffHeatmap] = useState(false);

  // Tariff panel state
  const [tariffPanel, setTariffPanel] = useState({ open: false, country: null, pos: { x: 160, y: 120 } });

  // Audio ref for background music
  const audioRef = useRef(null);

  // Auto-play music on mount; if browser blocks autoplay, start on first interaction
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = musicVolume;
    const tryPlay = () => {
      audio.play().catch(() => {
        // Browser blocked autoplay — listen for first user interaction
        const startOnInteraction = () => {
          audio.volume = musicVolume;
          audio.play().then(() => setMusicPlaying(true)).catch(() => {});
          document.removeEventListener('click', startOnInteraction);
          document.removeEventListener('keydown', startOnInteraction);
        };
        document.addEventListener('click', startOnInteraction, { once: true });
        document.addEventListener('keydown', startOnInteraction, { once: true });
      });
    };
    tryPlay();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Popover state
  const [popoverHotspot, setPopoverHotspot] = useState(null);
  const [popoverPosition, setPopoverPosition] = useState(null);
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const autoRotateRef = useRef(autoRotate);
  const rotateSpeedRef = useRef(rotateSpeed);
  const rotateCCWRef = useRef(rotateCCW);
  const useGlobeRef = useRef(useGlobe);
  const userInteractingRef = useRef(false);
  const hoveredCountryIdRef = useRef(null);
  const hoveredStateIdRef = useRef(null);
  const hoveredProvinceIdRef = useRef(null);

  // News panel state
  const [newsPanelHotspot, setNewsPanelHotspot] = useState(null);
  const [newsPanelPosition, setNewsPanelPosition] = useState(null);

  // Stocks panel visibility
  const [showStocksPanel, setShowStocksPanel] = useState(false);

  // Polymarket panel visibility and state
  const [showPolymarketPanel, setShowPolymarketPanel] = useState(false);
  const [polymarketCountry, setPolymarketCountry] = useState(null);

  // Tooltip state
  const [tooltip, setTooltip] = useState({ show: false, text: '', x: 0, y: 0 });

  // Layer toggles (flights disabled by default)
  const [enabledLayers, setEnabledLayers] = useState({
    news: true,
    twitter: true,
    reddit: true,
    flights: false,
    stocks: false,
    severeWeather: false,
  });
  const [showSeverePanel, setShowSeverePanel] = useState(false);
  const [selectedSevereEventId, setSelectedSevereEventId] = useState(null);

  const { feed, loading: feedLoading, error: feedError } = useFeed(80);
  const {
    stocks,
    marketStatus,
    lastUpdated: stocksLastUpdated,
    loading: stocksLoading,
    error: stocksError,
    refresh: refreshStocks,
  } = useStocks(enabledLayers.stocks);
  const { flights, loading: flightsLoading, error: flightsError } = useFlights(enabledLayers.flights);
  const {
    markets: polymarkets,
    loading: polymarketsLoading,
    error: polymarketsError,
    lastUpdated: polymarketsLastUpdated,
    refresh: refreshPolymarkets,
  } = usePolymarket(polymarketCountry, showPolymarketPanel);
  const {
    events: severeEvents,
    loading: severeLoading,
    refresh: refreshSevere,
  } = useSevereWeather(enabledLayers.severeWeather);

  const isLightTheme = theme === 'light-analytic';

  useEffect(() => {
    // cyber-control-room uses :root defaults (no data-theme needed)
    if (theme === 'cyber-control-room') {
      delete document.documentElement.dataset.theme;
    } else {
      document.documentElement.dataset.theme = theme;
    }
    document.documentElement.style.colorScheme = isLightTheme ? 'light' : 'dark';
    window.localStorage.setItem('theme', theme);
  }, [theme, isLightTheme]);

  useEffect(() => {
    document.documentElement.style.setProperty('--nav-height', navCollapsed ? '28px' : '64px');
  }, [navCollapsed]);

  useEffect(() => {
    window.localStorage.setItem('navCollapsed', String(navCollapsed));
  }, [navCollapsed]);

  useEffect(() => {
    window.localStorage.setItem('visualLayers', JSON.stringify(visualLayers));
  }, [visualLayers]);

  const toggleVisualLayer = useCallback((key) => {
    setVisualLayers(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1100) {
        setNavCollapsed(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close tariff panel when heatmap is turned off
  useEffect(() => {
    if (!showTariffHeatmap) {
      setTariffPanel({ open: false, country: null, pos: { x: 160, y: 120 } });
    }
  }, [showTariffHeatmap]);

  const flightPaths = useMemo(() => {
    return (flights || [])
      .map((flight) => {
        const fromArray = Array.isArray(flight.from) ? flight.from : [flight.from?.lon, flight.from?.lat];
        const toArray = Array.isArray(flight.to) ? flight.to : [flight.to?.lon, flight.to?.lat];
        if (!fromArray || !toArray) return null;
        if (!Number.isFinite(fromArray[0]) || !Number.isFinite(fromArray[1]) || !Number.isFinite(toArray[0]) || !Number.isFinite(toArray[1])) {
          return null;
        }
        return {
          id: flight.id || `${fromArray.join(',')}-${toArray.join(',')}`,
          from: fromArray,
          to: toArray,
        };
      })
      .filter(Boolean);
  }, [flights]);

  const toggleLayer = (layer) => {
    setEnabledLayers(prev => {
      const newState = { ...prev, [layer]: !prev[layer] };
      // Show stocks panel when stocks layer is enabled
      if (layer === 'stocks' && newState.stocks) {
        setShowStocksPanel(true);
      } else if (layer === 'stocks' && !newState.stocks) {
        setShowStocksPanel(false);
      }
      // Show severe weather panel when toggled on
      if (layer === 'severeWeather' && newState.severeWeather) {
        setShowSeverePanel(true);
      } else if (layer === 'severeWeather' && !newState.severeWeather) {
        setShowSeverePanel(false);
      }
      // Clear open overlays when turning layers off to avoid stale items
      if (!newState[layer]) {
        setPopoverHotspot(null);
        setPopoverPosition(null);
        setNewsPanelHotspot(null);
        setNewsPanelPosition(null);
        if (layer === 'twitter') {
          setSelectedHotspotId(null);
          setViewMode('world');
        }
      }
      return newState;
    });
  };

  // Filter feed by enabled layers
  const layerFilteredFeed = useMemo(() => {
    return feed.filter(item => {
      if (enabledLayers.news && (item.contentType === 'article' || item.contentType === 'rumor')) return true;
      if (enabledLayers.twitter && item.contentType === 'tweet') return true;
      if (enabledLayers.reddit && item.contentType === 'reddit_post') return true;
      if (enabledLayers.flights && item.contentType === 'flight') return true;
      if (enabledLayers.stocks && item.contentType === 'stock') return true;
      return false;
    });
  }, [feed, enabledLayers]);

  const hotspots = useMemo(() => deriveHotspots(layerFilteredFeed), [layerFilteredFeed]);

  // Get display feed based on view mode
  const displayFeed = useMemo(() => {
    if (viewMode === 'world') {
      return layerFilteredFeed.slice(0, 50);
    } else if (viewMode === 'region' && selectedRegion) {
      const regionName = selectedRegion.name.toLowerCase();
      return layerFilteredFeed.filter(item => {
        const text = `${item.title || ''} ${item.summary || ''} ${item.content || ''} ${item.sourceName || ''} ${item.source || ''}`.toLowerCase();
        return text.includes(regionName);
      });
    } else if (viewMode === 'hotspot' && selectedHotspotId) {
      const hotspot = hotspots.find(h => h.id === selectedHotspotId);
      return hotspot ? hotspot.items : [];
    }
    return [];
  }, [viewMode, selectedRegion, selectedHotspotId, layerFilteredFeed, hotspots]);

  const filteredDisplayFeed = useMemo(() => {
    return displayFeed.filter(item => {
      if (item.contentType === 'tweet' && !enabledLayers.twitter) return false;
      return true;
    });
  }, [displayFeed, enabledLayers.twitter]);

  // ---- MapLibre GeoJSON data ----

  const countryColor = useCallback((index) => {
    // Futuristic palette — blues, purples, pinks, teals
    const darkPalette = [
      '#2a3070', '#4a2268', '#602050', '#1e4078', '#3a2878',
      '#5a2058', '#283880', '#4e2060', '#1a3870', '#682050',
      '#303880', '#5e1e52', '#382878', '#224068', '#502465',
      '#1e4a6a', '#422875', '#602852', '#2a3578', '#482468',
      '#1a4572', '#58205a', '#303080', '#522258', '#244070',
      '#3e2878', '#1e3a75', '#5a2250', '#283580', '#4a2060',
    ];
    const lightPalette = [
      '#4a7a3e', '#6b8f42', '#8a6e3a', '#3d6b35', '#7a8548',
      '#5c7040', '#9b7a3c', '#4e7e44', '#6e6838', '#3a6030',
      '#87764a', '#527238', '#7c8a4e', '#48703a', '#a0823e',
      '#5a6e3c', '#6a7a40', '#8b7044', '#3e6832', '#74804a',
      '#4c6a36', '#96783e', '#5e7c42', '#7e6c3a', '#447034',
      '#6c8648', '#8e7a40', '#3c6530', '#78724c', '#568038',
    ];
    const palette = isLightTheme ? lightPalette : darkPalette;
    // Stride by 11 (coprime with 30) so geographic neighbors get distinct colors
    return palette[(index * 11) % palette.length];
  }, [isLightTheme]);

  const countriesGeoJSON = useMemo(() => ({
    type: 'FeatureCollection',
    features: GEO_FEATURES.map((f, i) => {
      const name = f.properties?.name || `Country ${i}`;
      const tariffRate = getUniversalRate(name);
      return {
        type: 'Feature',
        id: i,
        geometry: f.geometry,
        properties: {
          name,
          originalId: String(f.id),
          fillColor: countryColor(i),
          tariffColor: isLightTheme ? getTariffColorLight(tariffRate) : getTariffColor(tariffRate),
          tariffRate,
        },
      };
    }),
  }), [countryColor, isLightTheme]);

  const usStatesGeoJSON = useMemo(() => ({
    type: 'FeatureCollection',
    features: US_STATE_FEATURES.map((f, i) => ({
      type: 'Feature',
      id: i,
      geometry: f.geometry,
      properties: {
        name: f.properties?.name || `State ${i}`,
        originalId: String(f.id),
      },
    })),
  }), []);

  const caProvincesGeoJSON = useMemo(() => ({
    type: 'FeatureCollection',
    features: CA_PROVINCE_FEATURES.map((f, i) => ({
      type: 'Feature',
      id: i,
      geometry: f.geometry,
      properties: {
        name: f.properties?.name || `Province ${i}`,
        originalId: String(f.id ?? i),
      },
    })),
  }), []);

  const flightPathsGeoJSON = useMemo(() => ({
    type: 'FeatureCollection',
    features: flightPaths.map((flight, i) => ({
      type: 'Feature',
      id: i,
      properties: { id: flight.id },
      geometry: {
        type: 'LineString',
        coordinates: [flight.from, flight.to],
      },
    })),
  }), [flightPaths]);

  // MapLibre style (minimal, theme-aware background)
  const mapStyle = useMemo(() => ({
    version: 8,
    name: 'monitoring',
    sources: {},
    layers: [{
      id: 'background',
      type: 'background',
      paint: {
        'background-color': holoMode
          ? (isLightTheme ? '#8ab4d8' : '#060a14')
          : (isLightTheme ? '#8ab4d8' : '#0c1126'),
      },
    }],
    glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
  }), [isLightTheme, holoMode]);

  // Selected region filters for MapLibre layers
  const selectedCountryFilter = useMemo(() => {
    if (selectedRegion?.type === 'country' && selectedRegion.id != null) {
      return ['==', ['get', 'originalId'], String(selectedRegion.id)];
    }
    return ['==', ['get', 'originalId'], '__none__'];
  }, [selectedRegion]);

  const selectedStateFilter = useMemo(() => {
    if (selectedRegion?.type === 'state' && selectedRegion.id != null) {
      return ['==', ['get', 'originalId'], String(selectedRegion.id)];
    }
    return ['==', ['get', 'originalId'], '__none__'];
  }, [selectedRegion]);

  const selectedProvinceFilter = useMemo(() => {
    if (selectedRegion?.type === 'province' && selectedRegion.id != null) {
      return ['==', ['get', 'originalId'], String(selectedRegion.id)];
    }
    return ['==', ['get', 'originalId'], '__none__'];
  }, [selectedRegion]);

  // ---- Map interaction handlers ----

  const handleMapMouseMove = useCallback((event) => {
    if (popoverHotspot) return;
    const map = mapRef.current;
    if (!map) return;

    // In globe mode, ignore interactions on "space" outside the globe surface.
    // Unproject the screen point to a coordinate and project it back — if the
    // round-trip deviates significantly the cursor is off the visible globe.
    if (useGlobeRef.current) {
      const lngLat = map.unproject(event.point);
      const reprojected = map.project(lngLat);
      const dx = reprojected.x - event.point.x;
      const dy = reprojected.y - event.point.y;
      if (dx * dx + dy * dy > 100) {
        // Off globe — clear any hover state
        if (hoveredCountryIdRef.current !== null) {
          map.setFeatureState({ source: 'countries', id: hoveredCountryIdRef.current }, { hover: false });
          hoveredCountryIdRef.current = null;
        }
        if (hoveredStateIdRef.current !== null) {
          map.setFeatureState({ source: 'us-states', id: hoveredStateIdRef.current }, { hover: false });
          hoveredStateIdRef.current = null;
        }
        if (hoveredProvinceIdRef.current !== null) {
          map.setFeatureState({ source: 'ca-provinces', id: hoveredProvinceIdRef.current }, { hover: false });
          hoveredProvinceIdRef.current = null;
        }
        setTooltip({ show: false, text: '', x: 0, y: 0 });
        map.getCanvas().style.cursor = '';
        return;
      }
    }

    const features = event.features;

    // Clear previous hover states
    if (hoveredCountryIdRef.current !== null) {
      map.setFeatureState(
        { source: 'countries', id: hoveredCountryIdRef.current },
        { hover: false }
      );
      hoveredCountryIdRef.current = null;
    }
    if (hoveredStateIdRef.current !== null) {
      map.setFeatureState(
        { source: 'us-states', id: hoveredStateIdRef.current },
        { hover: false }
      );
      hoveredStateIdRef.current = null;
    }
    if (hoveredProvinceIdRef.current !== null) {
      map.setFeatureState(
        { source: 'ca-provinces', id: hoveredProvinceIdRef.current },
        { hover: false }
      );
      hoveredProvinceIdRef.current = null;
    }

    if (features && features.length > 0) {
      const feat = features[0];
      const sourceId = feat.source;

      if (sourceId === 'countries' && feat.id !== undefined) {
        map.setFeatureState(
          { source: 'countries', id: feat.id },
          { hover: true }
        );
        hoveredCountryIdRef.current = feat.id;
      } else if (sourceId === 'us-states' && feat.id !== undefined) {
        map.setFeatureState(
          { source: 'us-states', id: feat.id },
          { hover: true }
        );
        hoveredStateIdRef.current = feat.id;
      } else if (sourceId === 'ca-provinces' && feat.id !== undefined) {
        map.setFeatureState(
          { source: 'ca-provinces', id: feat.id },
          { hover: true }
        );
        hoveredProvinceIdRef.current = feat.id;
      }

      const tooltipName = feat.properties?.name || 'Unknown';
      const tariffRate = feat.properties?.tariffRate;
      let tooltipText = tooltipName;
      if (showTariffHeatmap && tariffRate != null) {
        tooltipText = tariffRate === -1
          ? `${tooltipName} — EMBARGO`
          : `${tooltipName} — ${tariffRate}% tariff`;
      }
      setTooltip({
        show: true,
        text: tooltipText,
        x: event.point.x,
        y: event.point.y,
      });
      map.getCanvas().style.cursor = 'pointer';
    } else {
      setTooltip({ show: false, text: '', x: 0, y: 0 });
      map.getCanvas().style.cursor = '';
    }
  }, [popoverHotspot, showTariffHeatmap]);

  const handleMapMouseLeave = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    if (hoveredCountryIdRef.current !== null) {
      map.setFeatureState(
        { source: 'countries', id: hoveredCountryIdRef.current },
        { hover: false }
      );
      hoveredCountryIdRef.current = null;
    }
    if (hoveredStateIdRef.current !== null) {
      map.setFeatureState(
        { source: 'us-states', id: hoveredStateIdRef.current },
        { hover: false }
      );
      hoveredStateIdRef.current = null;
    }
    if (hoveredProvinceIdRef.current !== null) {
      map.setFeatureState(
        { source: 'ca-provinces', id: hoveredProvinceIdRef.current },
        { hover: false }
      );
      hoveredProvinceIdRef.current = null;
    }
    setTooltip({ show: false, text: '', x: 0, y: 0 });
  }, []);

  // Debounce single click so it doesn't fire on double-click
  const clickTimerRef = useRef(null);

  const handleMapClick = useCallback((event) => {
    // In globe mode, ignore clicks on "space" outside the globe
    if (useGlobeRef.current) {
      const map = mapRef.current;
      if (map) {
        const lngLat = map.unproject(event.point);
        const reprojected = map.project(lngLat);
        const dx = reprojected.x - event.point.x;
        const dy = reprojected.y - event.point.y;
        if (dx * dx + dy * dy > 100) return;
      }
    }

    // Capture values synchronously before the event object is recycled
    const features = event.features ? [...event.features] : [];
    const point = event.point ? { x: event.point.x, y: event.point.y } : null;

    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    clickTimerRef.current = setTimeout(() => {
      clickTimerRef.current = null;

      if (!features || features.length === 0) {
        setSelectedCapital(null);
        return;
      }

      const feat = features[0];
      const sourceId = feat.source;
      const name = feat.properties?.name || 'Unknown';
      const originalId = feat.properties?.originalId;

      if (sourceId === 'countries') {
        setSelectedRegion({ type: 'country', id: originalId, name });
        setViewMode('region');

        const capital = CAPITAL_MARKERS.find(m => m.id === `capital-${originalId}`);
        setSelectedCapital(capital || null);

        if (mapContainerRef.current && point) {
          const mapRect = mapContainerRef.current.getBoundingClientRect();
          const clickX = point.x;
          const clickY = point.y;

          const panelWidth = 300;
          const panelHeight = 200;
          const padding = 32;

          let x = clickX + 24;
          let y = clickY + 24;

          x = Math.max(padding, Math.min(x, mapRect.width - panelWidth - padding));
          y = Math.max(padding, Math.min(y, mapRect.height - panelHeight - padding));

          if (showTariffHeatmap) {
            setTariffPanel({ open: true, country: name, pos: { x, y } });
          }

          openCountryPanel(name, { x, y });
          setPolymarketCountry(name);
          setShowPolymarketPanel(true);
        }
      } else if (sourceId === 'us-states') {
        setSelectedRegion({ type: 'state', id: originalId, name });
        setViewMode('region');
        setSelectedCapital(null);

        if (mapContainerRef.current && point) {
          const mapRect = mapContainerRef.current.getBoundingClientRect();
          const clickX = point.x;
          const clickY = point.y;
          const panelWidth = 300;
          const panelHeight = 200;
          const padding = 32;
          let x = clickX + 24;
          let y = clickY + 24;
          x = Math.max(padding, Math.min(x, mapRect.width - panelWidth - padding));
          y = Math.max(padding, Math.min(y, mapRect.height - panelHeight - padding));
          openStatePanel(name, { x, y });
        }
      } else if (sourceId === 'ca-provinces') {
        setSelectedRegion({ type: 'province', id: originalId, name });
        setViewMode('region');
        setSelectedCapital(null);

        if (mapContainerRef.current && point) {
          const mapRect = mapContainerRef.current.getBoundingClientRect();
          const clickX = point.x;
          const clickY = point.y;
          const panelWidth = 300;
          const panelHeight = 200;
          const padding = 32;
          let x = clickX + 24;
          let y = clickY + 24;
          x = Math.max(padding, Math.min(x, mapRect.width - panelWidth - padding));
          y = Math.max(padding, Math.min(y, mapRect.height - panelHeight - padding));
          openProvincePanel(name, { x, y });
        }
      }
    }, 250);
  }, [openCountryPanel, openStatePanel, openProvincePanel, showTariffHeatmap]);

  // Hotspot interaction handlers (DOM-based markers)
  const handleHotspotClick = (hotspot, event) => {
    event.stopPropagation();
    event.preventDefault();

    if (mapContainerRef.current && event.currentTarget) {
      const mapRect = mapContainerRef.current.getBoundingClientRect();
      const markerRect = event.currentTarget.getBoundingClientRect();

      const popoverWidth = 320;
      const popoverHeight = 450;
      const padding = 40;

      const markerCenterX = markerRect.left - mapRect.left + markerRect.width / 2;
      const markerCenterY = markerRect.top - mapRect.top + markerRect.height / 2;

      let x = markerCenterX;
      let y = markerCenterY;

      const spaceTop = markerCenterY;
      const spaceBottom = mapRect.height - markerCenterY;
      const spaceLeft = markerCenterX;
      const spaceRight = mapRect.width - markerCenterX;

      if (spaceTop >= popoverHeight + padding) {
        y = markerCenterY - 20;
      } else if (spaceBottom >= popoverHeight + padding) {
        y = markerCenterY + 40;
      } else if (spaceRight >= popoverWidth + padding) {
        x = markerCenterX + popoverWidth / 2 + 20;
        y = Math.max(popoverHeight / 2 + padding, Math.min(markerCenterY, mapRect.height - popoverHeight / 2 - padding));
      } else if (spaceLeft >= popoverWidth + padding) {
        x = markerCenterX - popoverWidth / 2 - 20;
        y = Math.max(popoverHeight / 2 + padding, Math.min(markerCenterY, mapRect.height - popoverHeight / 2 - padding));
      } else {
        y = markerCenterY + 40;
      }

      x = Math.max(popoverWidth / 2 + padding, Math.min(x, mapRect.width - popoverWidth / 2 - padding));
      y = Math.max(padding + 60, Math.min(y, mapRect.height - padding - 60));

      setPopoverPosition({ x, y });
      setPopoverHotspot(hotspot);
      setTooltip({ show: false, text: '', x: 0, y: 0 });
    }
  };

  const handleOpenHotspotInPanel = () => {
    if (popoverHotspot && mapContainerRef.current) {
      const mapRect = mapContainerRef.current.getBoundingClientRect();
      const x = mapRect.width / 2;
      const y = mapRect.height / 2;

      setNewsPanelPosition({ x, y });
      setNewsPanelHotspot(popoverHotspot);
      setPopoverHotspot(null);
      setPopoverPosition(null);
    }
  };

  const handleClosePopover = () => {
    setPopoverHotspot(null);
    setPopoverPosition(null);
  };

  const handleCloseNewsPanel = () => {
    setNewsPanelHotspot(null);
    setNewsPanelPosition(null);
  };

  const updateNewsPanelPosition = (newPosition) => {
    setNewsPanelPosition(newPosition);
  };

  const handleToggleTheme = () => {
    setTheme(prev => {
      const idx = THEMES.findIndex(t => t.id === prev);
      return THEMES[(idx + 1) % THEMES.length].id;
    });
  };

  const handleToggleMusic = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (musicPlaying) {
      audio.pause();
      setMusicPlaying(false);
    } else {
      audio.volume = musicVolume;
      audio.play().then(() => setMusicPlaying(true)).catch(() => {});
    }
  };

  const handleVolumeChange = (vol) => {
    setMusicVolume(vol);
    if (audioRef.current) audioRef.current.volume = vol;
  };

  const handleNavigate = (pageId) => {
    setActivePage(prev => (prev === pageId ? null : pageId));
  };

  const handleToggleNav = () => {
    setNavCollapsed(prev => !prev);
  };

  const handleBackToWorld = () => {
    setViewMode('world');
    setSelectedRegion(null);
    setSelectedHotspotId(null);
    setSelectedCapital(null);
  };

  // Double-click: zoom into the clicked country/state centered on click point
  const handleMapDblClick = useCallback((event) => {
    // Cancel pending single-click so it doesn't interfere
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }

    const map = mapRef.current;
    if (!map) return;

    // In globe mode, ignore double-clicks on "space"
    if (useGlobeRef.current) {
      const lngLat = map.unproject(event.point);
      const reprojected = map.project(lngLat);
      const dx = reprojected.x - event.point.x;
      const dy = reprojected.y - event.point.y;
      if (dx * dx + dy * dy > 100) return;
    }

    const features = event.features;
    if (!features || features.length === 0) return;

    // Stop any in-progress animation so flyTo takes effect immediately
    map.stop();

    // Zoom to click location at a country-detail level
    map.flyTo({
      center: [event.lngLat.lng, event.lngLat.lat],
      zoom: 6,
      duration: 1000,
      essential: true,
    });
  }, []);

  const handleHotspotMouseEnter = (hotspot, event) => {
    if (mapContainerRef.current && !popoverHotspot) {
      const mapRect = mapContainerRef.current.getBoundingClientRect();
      const isRecent = isRecentlyUpdated(hotspot.lastUpdated);
      const text = isRecent ? `${hotspot.name} - Updated ${timeAgo(hotspot.lastUpdated)}` : hotspot.name;
      setTooltip({
        show: true,
        text,
        x: event.clientX - mapRect.left,
        y: event.clientY - mapRect.top
      });
    }
  };

  const handleHotspotMouseLeave = () => {
    setTooltip({ show: false, text: '', x: 0, y: 0 });
  };

  const updatePopoverPosition = (newPosition) => {
    setPopoverPosition(newPosition);
  };

  const getBreadcrumb = () => {
    if (viewMode === 'world') {
      return [{ label: 'World', active: true }];
    } else if (viewMode === 'region') {
      return [
        { label: 'World', active: false, onClick: handleBackToWorld },
        { label: selectedRegion?.name || 'Region', active: true },
      ];
    } else if (viewMode === 'hotspot') {
      const hotspot = hotspots.find(h => h.id === selectedHotspotId);
      return [
        { label: 'World', active: false, onClick: handleBackToWorld },
        { label: hotspot?.name || 'Hotspot', active: true },
      ];
    }
    return [];
  };

  const breadcrumb = getBreadcrumb();

  // Store map ref on load
  const onMapLoad = useCallback((evt) => {
    mapRef.current = evt.target;
    setMapLoaded(true);
    // Faster, smoother scroll zoom
    const sh = evt.target.scrollZoom;
    if (sh) {
      sh.setWheelZoomRate(1 / 200);
      sh.setZoomRate(1 / 50);
    }
  }, []);

  // Track map center for globe hemisphere visibility check + starfield parallax
  const handleMapMove = useCallback((evt) => {
    const c = evt.viewState;
    if (c) {
      mapCenterRef.current = { lng: c.longitude, lat: c.latitude };
      // Update bearing/pitch for starfield parallax (throttled by rAF)
      setMapBearing(c.bearing || 0);
      setMapPitch(c.pitch || 0);
    }
  }, []);

  /**
   * Check if a lng/lat is on the visible hemisphere of the globe.
   * Uses great-circle angular distance from map center — if > 90°, it's on the far side.
   * Returns true (visible) when transparent mode is on, globe is off, or point is in front.
   */
  const isMarkerVisible = useCallback((lng, lat) => {
    if (transparentGlobe || !useGlobe) return true;
    const toRad = Math.PI / 180;
    const c = mapCenterRef.current;
    const lat1 = c.lat * toRad;
    const lat2 = lat * toRad;
    const dLng = (lng - c.lng) * toRad;
    const cosAngle = Math.sin(lat1) * Math.sin(lat2) + Math.cos(lat1) * Math.cos(lat2) * Math.cos(dLng);
    return cosAngle > -0.05; // slight margin so edge markers don't flicker
  }, [transparentGlobe, useGlobe]);

  const handleRecenter = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    map.flyTo({
      center: [0, 20],
      zoom: 2.0,
      pitch: 0,
      bearing: 0,
      duration: 1400,
      essential: true,
    });
  }, []);

  // Keep refs in sync with state
  useEffect(() => { autoRotateRef.current = autoRotate; }, [autoRotate]);
  useEffect(() => { rotateSpeedRef.current = rotateSpeed; }, [rotateSpeed]);
  useEffect(() => { rotateCCWRef.current = rotateCCW; }, [rotateCCW]);
  useEffect(() => { useGlobeRef.current = useGlobe; }, [useGlobe]);

  // Auto-rotate globe
  useEffect(() => {
    if (!useGlobe || !autoRotate || !mapLoaded) return;
    const map = mapRef.current;
    if (!map) return;

    let animId;
    let resumeTimer = null;

    function rotate() {
      if (!autoRotateRef.current || userInteractingRef.current) {
        animId = requestAnimationFrame(rotate);
        return;
      }
      const center = map.getCenter();
      const delta = rotateCCWRef.current ? rotateSpeedRef.current : -rotateSpeedRef.current;
      map.setCenter([center.lng + delta, center.lat]);
      animId = requestAnimationFrame(rotate);
    }

    // Pause rotation while user interacts (including zoom)
    const onInteractionStart = () => {
      clearTimeout(resumeTimer);
      userInteractingRef.current = true;
    };
    const onInteractionEnd = () => {
      // Small delay before resuming so zoom animations can finish
      clearTimeout(resumeTimer);
      resumeTimer = setTimeout(() => { userInteractingRef.current = false; }, 800);
    };

    map.on('mousedown', onInteractionStart);
    map.on('touchstart', onInteractionStart);
    map.on('dragstart', onInteractionStart);
    map.on('zoomstart', onInteractionStart);
    map.on('wheel', onInteractionStart);
    map.on('mouseup', onInteractionEnd);
    map.on('touchend', onInteractionEnd);
    map.on('dragend', onInteractionEnd);
    map.on('zoomend', onInteractionEnd);

    animId = requestAnimationFrame(rotate);

    return () => {
      cancelAnimationFrame(animId);
      clearTimeout(resumeTimer);
      map.off('mousedown', onInteractionStart);
      map.off('touchstart', onInteractionStart);
      map.off('dragstart', onInteractionStart);
      map.off('zoomstart', onInteractionStart);
      map.off('wheel', onInteractionStart);
      map.off('mouseup', onInteractionEnd);
      map.off('touchend', onInteractionEnd);
      map.off('dragend', onInteractionEnd);
      map.off('zoomend', onInteractionEnd);
    };
  }, [useGlobe, autoRotate, mapLoaded]);

  // Track map bearing and pitch for starfield parallax
  const [mapBearing, setMapBearing] = useState(0);
  const [mapPitch, setMapPitch] = useState(0);

  return (
    <>
    {!isLightTheme && (
      <StarfieldCanvas mapBearing={mapBearing} mapPitch={mapPitch} useGlobe={useGlobe} />
    )}
    <div className="app">
      <audio ref={audioRef} src="/suspense_music.mp3" loop preload="auto" />
      <Navbar
        title="Monitoring The Situation"
        logoSrc="/earth.png"
        activePage={activePage}
        onNavigate={handleNavigate}
        theme={theme}
        themes={THEMES}
        onToggleTheme={handleToggleTheme}
        onSetTheme={setTheme}
        useGlobe={useGlobe}
        onToggleGlobe={() => setUseGlobe(prev => !prev)}
        musicPlaying={musicPlaying}
        onToggleMusic={handleToggleMusic}
        musicVolume={musicVolume}
        onVolumeChange={handleVolumeChange}
        collapsed={navCollapsed}
        onToggleCollapse={handleToggleNav}
      />

      <div className="app-body">
        {/* Sidebar */}
        <div className={`sidebar ${sidebarExpanded ? 'expanded' : 'collapsed'}`}>
          <div className="sidebar-header">
            {viewMode !== 'world' && (
              <div className="sidebar-breadcrumb">
                {breadcrumb.map((item, idx) => (
                  <span key={idx}>
                    <span
                      className={`breadcrumb-item ${item.active ? 'active' : ''}`}
                      onClick={item.onClick}
                    >
                      {item.label}
                    </span>
                    {idx < breadcrumb.length - 1 && <span className="breadcrumb-separator"> / </span>}
                  </span>
                ))}
              </div>
            )}
            {sidebarExpanded && (
              <div className="sidebar-tabs-row">
                <div className="sidebar-tabs" role="tablist" aria-label="Sidebar">
                  <button
                    type="button"
                    className={`sidebar-tab ${sidebarTab === 'world' ? 'active' : ''}`}
                    onClick={() => setSidebarTab('world')}
                    role="tab"
                    aria-selected={sidebarTab === 'world'}
                  >
                    World
                  </button>
                  <button
                    type="button"
                    className={`sidebar-tab ${sidebarTab === 'settings' ? 'active' : ''}`}
                    onClick={() => setSidebarTab('settings')}
                    role="tab"
                    aria-selected={sidebarTab === 'settings'}
                  >
                    Settings
                  </button>
                </div>
                <button
                  className="sidebar-toggle"
                  onClick={() => setSidebarExpanded(false)}
                  aria-label="Collapse sidebar"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <button
                  type="button"
                  className={`sidebar-tab ${sidebarTab === 'tariffs' ? 'active' : ''}`}
                  onClick={() => setSidebarTab('tariffs')}
                  role="tab"
                  aria-selected={sidebarTab === 'tariffs'}
                >
                  Tariffs & Trade
                </button>
              </div>
            )}
          </div>

          <div className="sidebar-content">
            {sidebarTab === 'world' && feedLoading && sidebarExpanded && (
              <div className="notice" style={{ marginBottom: '12px' }}>
                Loading live feed...
              </div>
            )}
            {sidebarTab === 'world' && feedError && sidebarExpanded && (
              <div className="notice" style={{ marginBottom: '12px' }}>
                Feed unavailable: {feedError.message}
              </div>
            )}

            {/* Source Toggles */}
            {sidebarExpanded && sidebarTab === 'world' && (
              <div className="source-toggles">
                <div className="toggle-group-title">Layers & Sources</div>

                <div className="source-group">
                  <div className="source-group-title">News</div>
                  <div className="source-group-items">
                    {[
                      { id: 'news', label: 'Major News', tone: 'news', disabled: false },
                      { id: 'reddit', label: 'Reddit', tone: 'reddit', disabled: false },
                      { id: 'twitter', label: 'Twitter', tone: 'twitter', disabled: false },
                    ].map((layer) => (
                      <label key={layer.id} className={`switch switch-${layer.tone} ${layer.disabled ? 'switch-disabled' : ''}`}>
                        <span className="switch-label">{layer.label}</span>
                        <input
                          type="checkbox"
                          checked={enabledLayers[layer.id]}
                          onChange={() => !layer.disabled && toggleLayer(layer.id)}
                          disabled={layer.disabled}
                        />
                        <span className="slider" />
                      </label>
                    ))}
                  </div>
                </div>

                <div className="source-group">
                  <div className="source-group-title">Live Data</div>
                  <div className="source-group-items">
                    {[
                      { id: 'stocks', label: 'Stocks', tone: 'stocks', disabled: false },
                      { id: 'severeWeather', label: 'Severe Weather', tone: 'flights', disabled: false },
                      { id: 'flights', label: 'Flights (WIP)', tone: 'flights', disabled: true },
                    ].map((layer) => (
                      <label key={layer.id} className={`switch switch-${layer.tone} ${layer.disabled ? 'switch-disabled' : ''}`}>
                        <span className="switch-label">{layer.label}</span>
                        <input
                          type="checkbox"
                          checked={enabledLayers[layer.id]}
                          onChange={() => !layer.disabled && toggleLayer(layer.id)}
                          disabled={layer.disabled}
                        />
                        <span className="slider" />
                      </label>
                    ))}
                  </div>
                </div>

                <div className="source-group">
                  <div className="source-group-title">Politics & Economy</div>
                  <div className="source-group-items">
                    {[
                      { id: 'elections', label: 'Election News', tone: 'neutral', disabled: true },
                      { id: 'tariffs', label: 'Tariffs & Trade', tone: 'neutral', disabled: true },
                    ].map((layer) => (
                      <label key={layer.id} className={`switch switch-${layer.tone} switch-disabled`}>
                        <span className="switch-label">{layer.label} (WIP)</span>
                        <input type="checkbox" checked={false} disabled />
                        <span className="slider" />
                      </label>
                    ))}
                  </div>
                </div>

                <div className="source-group">
                  <div className="source-group-title">Overlays</div>
                  <div className="source-group-items">
                    <label className="switch switch-frontline">
                      <span className="switch-label">UA/RU Frontline</span>
                      <input
                        type="checkbox"
                        checked={showFrontline}
                        onChange={() => setShowFrontline(prev => !prev)}
                      />
                      <span className="slider" />
                    </label>
                  </div>
                </div>

                <div className="source-group">
                  <div className="source-group-title">Lifestyle & Indices</div>
                  <div className="source-group-items">
                    {[
                      { id: 'sports', label: 'Major Sports', tone: 'neutral', disabled: true },
                      { id: 'pizzaIndex', label: 'Pizza Index', tone: 'neutral', disabled: true },
                    ].map((layer) => (
                      <label key={layer.id} className={`switch switch-${layer.tone} switch-disabled`}>
                        <span className="switch-label">{layer.label} (WIP)</span>
                        <input type="checkbox" checked={false} disabled />
                        <span className="slider" />
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* News Feed */}
            {sidebarExpanded && sidebarTab === 'world' && (
              <NewsFeed
                items={filteredDisplayFeed}
                viewMode={viewMode}
                selectedRegion={selectedRegion}
                onBackToWorld={handleBackToWorld}
              />
            )}

            {sidebarExpanded && sidebarTab === 'settings' && (
              <div className="settings-panel">
                <div className="toggle-group-title">Visuals & App Appearance</div>
                <div className="settings-group">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
                    <span className="switch-label" style={{ fontSize: '0.85rem', fontWeight: 500 }}>Theme</span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {THEMES.map(t => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setTheme(t.id)}
                          style={{
                            padding: '4px 10px',
                            fontSize: '0.72rem',
                            fontWeight: theme === t.id ? 700 : 500,
                            fontFamily: 'var(--font-mono)',
                            letterSpacing: '0.04em',
                            border: `1px solid ${theme === t.id ? 'var(--color-border-light)' : 'var(--color-border)'}`,
                            borderRadius: 'var(--radius-md)',
                            background: theme === t.id ? 'rgba(var(--accent-rgb), 0.12)' : 'transparent',
                            color: theme === t.id ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                          }}
                        >
                          {t.label.split(' ')[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <label className="switch switch-neutral">
                    <span className="switch-label">Holographic</span>
                    <input
                      type="checkbox"
                      checked={holoMode}
                      onChange={() => setHoloMode(prev => !prev)}
                    />
                    <span className="slider" />
                  </label>
                  <label className="switch switch-neutral switch-disabled">
                    <span className="switch-label">Timezones (WIP)</span>
                    <input
                      type="checkbox"
                      checked={false}
                      disabled
                    />
                    <span className="slider" />
                  </label>
                  {[
                    { key: 'contours', label: 'Micro Topographic Contours' },
                    { key: 'countryFill', label: 'Country Fill Color' },
                    { key: 'hillshade', label: 'Elevation / Hillshade (WIP)' },
                    { key: 'heatmap', label: 'Population Heatmap (WIP)' },
                  ].map(({ key, label }) => (
                    <label key={key} className="switch switch-neutral">
                      <span className="switch-label">{label}</span>
                      <input
                        type="checkbox"
                        checked={visualLayers[key]}
                        onChange={() => toggleVisualLayer(key)}
                      />
                      <span className="slider" />
                    </label>
                  ))}
                </div>

                <div className="toggle-group-title" style={{ marginTop: '16px' }}>3D Globe Settings</div>
                <div className="settings-group">
                  <label className={`switch switch-neutral ${!useGlobe ? 'switch-disabled' : ''}`}>
                    <span className="switch-label">Transparent Globe</span>
                    <input
                      type="checkbox"
                      checked={transparentGlobe}
                      onChange={() => setTransparentGlobe(prev => !prev)}
                      disabled={!useGlobe}
                    />
                    <span className="slider" />
                  </label>
                  <label className={`switch switch-neutral ${!useGlobe ? 'switch-disabled' : ''}`}>
                    <span className="switch-label">Atmospheric Edge Glow</span>
                    <input
                      type="checkbox"
                      checked={visualLayers.atmosphere}
                      onChange={() => toggleVisualLayer('atmosphere')}
                      disabled={!useGlobe}
                    />
                    <span className="slider" />
                  </label>
                </div>

                <div className="toggle-group-title" style={{ marginTop: '16px' }}>Units</div>
                <div className="settings-group">
                  <div className="temp-unit-toggle">
                    <span className="switch-label">Temperature</span>
                    <div className="temp-unit-btns">
                      <button
                        className={`temp-unit-btn${tempUnit === 'F' ? ' active' : ''}`}
                        onClick={() => setTempUnit('F')}
                      >°F</button>
                      <button
                        className={`temp-unit-btn${tempUnit === 'C' ? ' active' : ''}`}
                        onClick={() => setTempUnit('C')}
                      >°C</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {sidebarExpanded && sidebarTab === 'tariffs' && (
              <div className="settings-panel tariff-sidebar">
                <div className="toggle-group-title">Tariff Heatmap</div>
                <div className="settings-group tariff-heatmap-toggle">
                  <label className="switch switch-neutral">
                    <span className="switch-label">Show Heatmap</span>
                    <input
                      type="checkbox"
                      checked={showTariffHeatmap}
                      onChange={() => setShowTariffHeatmap(prev => !prev)}
                    />
                    <span className="slider" />
                  </label>
                </div>

                {showTariffHeatmap && (
                  <div className="tariff-heatmap-active-badge">
                    <span className="tariff-heatmap-active-dot" />
                    Heatmap active
                  </div>
                )}

                <div className="tariff-legend">
                  <div className="tariff-legend-title">Tariff Rate Legend</div>
                  <div className="tariff-legend-items">
                    {TARIFF_LEGEND.map((item) => (
                      <div key={item.label} className="tariff-legend-item">
                        <span
                          className="tariff-legend-swatch"
                          style={{ background: isLightTheme ? item.colorLight : item.color }}
                        />
                        <span>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="tariff-sidebar-info">
                  <strong>US Import Tariffs</strong><br />
                  Colors show the universal tariff rate the US applies to imports from each country. Click any country to see detailed sector-specific tariff rates.
                </div>
              </div>
            )}

            {!sidebarExpanded && (
              <div className="sidebar-expand-area" onClick={() => setSidebarExpanded(true)} title="Expand sidebar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Map */}
        <div className={`map-container${visualLayers.atmosphere ? '' : ' hide-atmosphere'}`} ref={mapContainerRef}>
        {/* Earth Overlay - scan line, atmospheric glow */}
        <EarthOverlay useGlobe={useGlobe} />

        {/* Timezone Labels Top */}
        {showTimezones && (
          <div className="timezone-labels timezone-labels-top">
            {TIMEZONES.map(tz => (
              <div key={`top-${tz.name}`} className="timezone-label">
                <div className="timezone-name">{tz.name}</div>
                <div className="timezone-time">{getCurrentTimeForOffset(tz.offset)}</div>
              </div>
            ))}
          </div>
        )}

        {/* Timezone Labels Bottom */}
        {showTimezones && (
          <div className="timezone-labels timezone-labels-bottom">
            {TIMEZONES.map(tz => (
              <div key={`bottom-${tz.name}`} className="timezone-label">
                <div className="timezone-time">{getCurrentTimeForOffset(tz.offset)}</div>
                <div className="timezone-name">{tz.name}</div>
              </div>
            ))}
          </div>
        )}

        {enabledLayers.flights && flightsLoading && (
          <div className="notice map-notice">Loading flights...</div>
        )}
        {enabledLayers.flights && flightsError && (
          <div className="notice map-notice">Flights unavailable: {flightsError.message}</div>
        )}
        {/* Hotspot Popover */}
        {popoverHotspot && (
          <HotspotPopover
            hotspot={popoverHotspot}
            position={popoverPosition}
            onClose={handleClosePopover}
            onOpenInPanel={handleOpenHotspotInPanel}
            onPositionChange={updatePopoverPosition}
          />
        )}

        {/* News Panel */}
        {newsPanelHotspot && (
          <NewsPanel
            hotspot={newsPanelHotspot}
            position={newsPanelPosition}
            onClose={handleCloseNewsPanel}
            onPositionChange={updateNewsPanelPosition}
          />
        )}

        {/* Stocks Panel */}
        <StocksPanel
          visible={showStocksPanel}
          stocks={stocks}
          marketStatus={marketStatus}
          loading={stocksLoading}
          error={stocksError}
          lastUpdated={stocksLastUpdated}
          onClose={() => setShowStocksPanel(false)}
          onRefresh={refreshStocks}
        />

        {/* Severe Weather Panel */}
        <SevereWeatherPanel
          visible={showSeverePanel}
          events={severeEvents}
          loading={severeLoading}
          selectedEventId={selectedSevereEventId}
          onClose={() => { setShowSeverePanel(false); setSelectedSevereEventId(null); setEnabledLayers(prev => ({ ...prev, severeWeather: false })); }}
          onRefresh={refreshSevere}
          onEventClick={(event) => {
            setSelectedSevereEventId(event.id);
            if (event.lon && event.lat && mapRef.current) {
              mapRef.current.flyTo({ center: [event.lon, event.lat], zoom: 5, duration: 1400, essential: true });
            }
          }}
        />

        {/* Polymarket Panel */}
        <PolymarketPanel
          visible={showPolymarketPanel}
          markets={polymarkets}
          loading={polymarketsLoading}
          error={polymarketsError}
          lastUpdated={polymarketsLastUpdated}
          country={polymarketCountry}
          onClose={() => setShowPolymarketPanel(false)}
          onRefresh={refreshPolymarkets}
        />

        {/* Tariff Panel */}
        {tariffPanel.open && tariffPanel.country && (
          <TariffPanel
            countryName={tariffPanel.country}
            position={tariffPanel.pos}
            bounds={
              mapContainerRef.current
                ? {
                    width: mapContainerRef.current.getBoundingClientRect().width,
                    height: mapContainerRef.current.getBoundingClientRect().height,
                  }
                : null
            }
            onPositionChange={(pos) => setTariffPanel(prev => ({ ...prev, pos }))}
            onClose={() => setTariffPanel({ open: false, country: null, pos: { x: 160, y: 120 } })}
          />
        )}

        {countryPanel.open && countryPanel.data && (
          <CountryPanel
            data={countryPanel.data}
            position={countryPanel.pos}
            bounds={
              mapContainerRef.current
                ? {
                    width: mapContainerRef.current.getBoundingClientRect().width,
                    height: mapContainerRef.current.getBoundingClientRect().height,
                  }
                : null
            }
            onPositionChange={updateCountryPanelPosition}
            onClose={closeCountryPanel}
            weather={panelWeather}
            weatherLoading={panelWeatherLoading}
            tempUnit={tempUnit}
          />
        )}

        <MapGL
          mapLib={maplibregl}
          mapStyle={mapStyle}
          projection={useGlobe ? 'globe' : 'mercator'}
          onLoad={onMapLoad}
          initialViewState={{
            longitude: 0,
            latitude: 20,
            zoom: 2.0,
          }}
          style={{ width: '100%', height: '100%' }}
          interactiveLayerIds={['countries-fill', 'us-states-fill', 'ca-provinces-fill']}
          onMove={handleMapMove}
          onMouseMove={handleMapMouseMove}
          onMouseLeave={handleMapMouseLeave}
          onClick={handleMapClick}
          onDblClick={handleMapDblClick}
          doubleClickZoom={false}
          dragRotate={useGlobe}
          pitchWithRotate={useGlobe}
          touchPitch={useGlobe}
          renderWorldCopies={!useGlobe}
          maxBounds={useGlobe ? undefined : [[-Infinity, -75], [Infinity, 85]]}
          maxZoom={8}
          minZoom={1}
        >
          {/* Graticule (Micro Topographic Contours) */}
          <Source id="graticule" type="geojson" data={GRATICULE_GEOJSON}>
            <Layer
              id="graticule-lines"
              type="line"
              layout={{ visibility: visualLayers.contours ? 'visible' : 'none' }}
              paint={{
                'line-color': isLightTheme ? 'rgba(100, 120, 160, 0.18)' : 'rgba(73, 198, 255, 0.16)',
                'line-width': 0.7,
              }}
            />
          </Source>

          {/* Compass crosshair lines — holographic glow through globe */}
          <Source id="compass-lines" type="geojson" data={COMPASS_LINES_GEOJSON}>
            {/* Outer glow layer */}
            <Layer
              id="compass-lines-glow"
              type="line"
              paint={{
                'line-color': isLightTheme ? 'rgba(194, 120, 62, 0.08)' : 'rgba(73, 198, 255, 0.10)',
                'line-width': useGlobe ? 4 : 2,
                'line-blur': 4,
              }}
            />
            {/* Core line */}
            <Layer
              id="compass-lines-layer"
              type="line"
              paint={{
                'line-color': isLightTheme ? 'rgba(194, 120, 62, 0.2)' : 'rgba(73, 198, 255, 0.25)',
                'line-width': useGlobe ? 1.2 : 0.8,
                'line-dasharray': [8, 6],
              }}
            />
          </Source>

          {/* Equator line (always visible) */}
          <Source id="equator" type="geojson" data={EQUATOR_GEOJSON}>
            <Layer
              id="equator-line"
              type="line"
              paint={{
                'line-color': isLightTheme ? 'rgba(166, 120, 80, 0.25)' : 'rgba(73, 198, 255, 0.25)',
                'line-width': 1,
                'line-dasharray': [6, 4],
              }}
            />
          </Source>

          {/* Timezone Lines (dashed) */}
          <Source id="timezone-lines" type="geojson" data={TIMEZONE_LINES_GEOJSON}>
            <Layer
              id="timezone-lines-dashed"
              type="line"
              filter={['!=', ['get', 'isPrimeMeridian'], true]}
              paint={{
                'line-color': isLightTheme ? 'rgba(166, 120, 80, 0.2)' : 'rgba(73, 198, 255, 0.2)',
                'line-width': 0.8,
                'line-dasharray': [3, 3],
              }}
            />
            <Layer
              id="timezone-lines-prime"
              type="line"
              filter={['==', ['get', 'isPrimeMeridian'], true]}
              paint={{
                'line-color': isLightTheme ? 'rgba(166, 120, 80, 0.2)' : 'rgba(73, 198, 255, 0.2)',
                'line-width': 1.5,
              }}
            />
          </Source>

          {/* Countries */}
          <Source id="countries" type="geojson" data={countriesGeoJSON}>
            <Layer
              id="countries-fill"
              type="fill"
              paint={{
                'fill-color': showTariffHeatmap
                  ? [
                      'case',
                      ['boolean', ['feature-state', 'hover'], false],
                      isLightTheme ? '#a8c090' : '#1a3a52',
                      ['get', 'tariffColor'],
                    ]
                  : [
                      'case',
                      ['boolean', ['feature-state', 'hover'], false],
                      isLightTheme ? '#a8c090' : '#1a3a52',
                      ['get', 'fillColor'],
                    ],
                'fill-opacity': showTariffHeatmap ? 0.85 : (visualLayers.countryFill ? 1 : 0),
              }}
            />
            {/* Holo glow layers: outer blur, mid glow, inner bright */}
            {holoMode && (
              <Layer
                id="countries-glow-outer"
                type="line"
                paint={{
                  'line-color': isLightTheme ? '#7b6bff' : '#49c6ff',
                  'line-width': 4,
                  'line-blur': 6,
                  'line-opacity': 0.2,
                }}
              />
            )}
            {holoMode && (
              <Layer
                id="countries-glow-mid"
                type="line"
                paint={{
                  'line-color': isLightTheme ? '#5d4dff' : '#49c6ff',
                  'line-width': 2,
                  'line-blur': 3,
                  'line-opacity': 0.4,
                }}
              />
            )}
            <Layer
              id="countries-line"
              type="line"
              paint={{
                'line-color': holoMode
                  ? (isLightTheme ? 'rgba(166, 120, 80, 0.55)' : 'rgba(73, 198, 255, 0.6)')
                  : (isLightTheme
                      ? 'rgba(50, 40, 80, 0.5)'
                      : 'rgba(140, 160, 200, 0.4)'),
                'line-width': holoMode
                  ? [
                      'case',
                      ['boolean', ['feature-state', 'hover'], false],
                      2.2,
                      1.4,
                    ]
                  : [
                      'case',
                      ['boolean', ['feature-state', 'hover'], false],
                      2.2,
                      1.6,
                    ],
              }}
            />
            {/* Selected country highlight */}
            <Layer
              id="countries-selected-fill"
              type="fill"
              filter={selectedCountryFilter}
              paint={{
                'fill-color': holoMode
                  ? (isLightTheme ? 'rgba(194, 120, 62, 0.12)' : 'rgba(73, 198, 255, 0.1)')
                  : (isLightTheme
                      ? 'rgba(194, 120, 62, 0.25)'
                      : 'rgba(123, 107, 255, 0.35)'),
              }}
            />
            {holoMode && (
              <Layer
                id="countries-selected-glow"
                type="line"
                filter={selectedCountryFilter}
                paint={{
                  'line-color': isLightTheme ? '#5d4dff' : '#49c6ff',
                  'line-width': 5,
                  'line-blur': 6,
                  'line-opacity': 0.5,
                }}
              />
            )}
            <Layer
              id="countries-selected-line"
              type="line"
              filter={selectedCountryFilter}
              paint={{
                'line-color': holoMode
                  ? (isLightTheme ? '#5d4dff' : '#49c6ff')
                  : (isLightTheme ? '#5d4dff' : '#7b6bff'),
                'line-width': holoMode ? 1.2 : 1.6,
              }}
            />
          </Source>

          {/* US States */}
          <Source id="us-states" type="geojson" data={usStatesGeoJSON}>
            <Layer
              id="us-states-fill"
              type="fill"
              paint={{
                'fill-color': [
                  'case',
                  ['boolean', ['feature-state', 'hover'], false],
                  isLightTheme
                    ? 'rgba(194, 120, 62, 0.15)'
                    : 'rgba(123, 107, 255, 0.22)',
                  'rgba(0, 0, 0, 0)',
                ],
                'fill-opacity': 1,
              }}
            />
            <Layer
              id="us-states-line"
              type="line"
              paint={{
                'line-color': isLightTheme
                  ? 'rgba(166, 120, 80, 0.35)'
                  : 'rgba(160, 145, 255, 0.35)',
                'line-width': 1,
              }}
            />
            <Layer
              id="us-states-selected-fill"
              type="fill"
              filter={selectedStateFilter}
              paint={{
                'fill-color': isLightTheme
                  ? 'rgba(194, 120, 62, 0.25)'
                  : 'rgba(123, 107, 255, 0.35)',
              }}
            />
            <Layer
              id="us-states-selected-line"
              type="line"
              filter={selectedStateFilter}
              paint={{
                'line-color': isLightTheme ? '#5d4dff' : '#7b6bff',
                'line-width': 1.5,
              }}
            />
          </Source>

          {/* Canadian provinces — borders only to avoid misalignment with world-atlas */}
          <Source id="ca-provinces" type="geojson" data={caProvincesGeoJSON}>
            {/* Invisible fill for click/hover interactivity */}
            <Layer
              id="ca-provinces-fill"
              type="fill"
              paint={{ 'fill-color': 'rgba(0,0,0,0)', 'fill-opacity': 1 }}
            />
            {/* Province border lines */}
            <Layer
              id="ca-provinces-line"
              type="line"
              paint={{
                'line-color': [
                  'case',
                  ['boolean', ['feature-state', 'hover'], false],
                  isLightTheme ? 'rgba(166, 120, 80, 0.6)' : 'rgba(180, 165, 255, 0.6)',
                  isLightTheme ? 'rgba(166, 120, 80, 0.3)' : 'rgba(160, 145, 255, 0.3)',
                ],
                'line-width': [
                  'case',
                  ['boolean', ['feature-state', 'hover'], false],
                  1.5,
                  0.8,
                ],
              }}
            />
            {/* Selected province highlight — just a brighter border */}
            <Layer
              id="ca-provinces-selected-line"
              type="line"
              filter={selectedProvinceFilter}
              paint={{
                'line-color': isLightTheme ? '#5d4dff' : '#7b6bff',
                'line-width': 2,
              }}
            />
          </Source>

          {/* UA/RU Frontline Overlay */}
          <FrontlineOverlay visible={showFrontline} />

          {/* Elevation / Hillshade — on top of country fills so ocean bathymetry is hidden */}
          <Source
            id="terrain-dem"
            type="raster-dem"
            tiles={['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png']}
            encoding="terrarium"
            tileSize={256}
            maxzoom={15}
          >
            <Layer
              id="hillshade-layer"
              type="hillshade"
              layout={{ visibility: 'none' /* WIP — terrain tile alignment issues */ }}
              paint={{
                'hillshade-exaggeration': 0.3,
                'hillshade-shadow-color': isLightTheme ? 'rgba(40,40,60,0.3)' : 'rgba(0,0,0,0.35)',
                'hillshade-highlight-color': isLightTheme ? 'rgba(255,255,255,0.25)' : 'rgba(180,200,255,0.12)',
                'hillshade-accent-color': isLightTheme ? 'rgba(60,60,80,0.15)' : 'rgba(10,10,30,0.2)',
                'hillshade-illumination-direction': 315,
              }}
            />
          </Source>

          {/* Population heatmap */}
          <Source id="population-heat" type="geojson" data={POPULATION_POINTS}>
            <Layer
              id="population-heatmap"
              type="heatmap"
              layout={{ visibility: 'none' /* WIP — disabled until tuned */ }}
              paint={{
                'heatmap-weight': ['interpolate', ['linear'], ['get', 'pop'], 1, 0.08, 15, 0.5, 37, 1],
                'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 1, 0.4, 3, 0.7, 6, 1],
                'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 1, 8, 3, 14, 6, 25, 8, 40],
                'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 1, 0.55, 6, 0.4, 8, 0.25],
                'heatmap-color': [
                  'interpolate', ['linear'], ['heatmap-density'],
                  0, 'rgba(0,0,0,0)',
                  0.15, isLightTheme ? 'rgba(100,160,220,0.4)' : 'rgba(73,198,255,0.25)',
                  0.4, isLightTheme ? 'rgba(60,190,170,0.55)' : 'rgba(100,80,220,0.5)',
                  0.65, isLightTheme ? 'rgba(240,170,50,0.65)' : 'rgba(220,80,200,0.6)',
                  1.0, isLightTheme ? 'rgba(220,60,40,0.75)' : 'rgba(255,85,85,0.7)',
                ],
              }}
            />
          </Source>

          {/* Flight paths */}
          {enabledLayers.flights && flightPaths.length > 0 && (
            <Source id="flights" type="geojson" data={flightPathsGeoJSON}>
              <Layer
                id="flight-lines"
                type="line"
                paint={{
                  'line-color': isLightTheme
                    ? 'rgba(59, 141, 255, 0.7)'
                    : 'rgba(73, 198, 255, 0.7)',
                  'line-width': 2,
                  'line-dasharray': [6, 6],
                }}
                layout={{
                  'line-cap': 'round',
                }}
              />
            </Source>
          )}

          {/* Severe weather event markers */}
          {enabledLayers.severeWeather && severeEvents.filter((e) => isMarkerVisible(e.lon, e.lat)).map((event) => {
            const colors = {
              earthquake: '#ff4444',
              storm: '#6ee6ff',
              wildfire: '#ff8c00',
              volcano: '#ff5555',
              flood: '#4488ff',
              other: '#f5c542',
            };
            const color = colors[event.type] || colors.other;
            const size = event.type === 'earthquake'
              ? Math.max(8, Math.min(20, (event.magnitude || 5) * 2.5))
              : 10;
            return (
              <Marker key={event.id} longitude={event.lon} latitude={event.lat} anchor="center">
                <div
                  className="severe-marker"
                  title={event.title}
                  onClick={() => {
                    setSelectedSevereEventId(event.id);
                    setShowSeverePanel(true);
                  }}
                  style={{ position: 'relative', width: size * 2, height: size * 2 }}
                >
                  <div
                    className="severe-marker-dot"
                    style={{
                      width: size,
                      height: size,
                      background: color,
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                    }}
                  />
                  <div className="severe-marker-pulse" style={{ borderColor: color }} />
                </div>
              </Marker>
            );
          })}

          {/* Cardinal Direction Indicators (on-surface for 2D) */}
          {!useGlobe && (
            <>
              <Marker longitude={0} latitude={78} anchor="center">
                <span className="cardinal-label-dom">N</span>
              </Marker>
              <Marker longitude={0} latitude={-52} anchor="center">
                <span className="cardinal-label-dom">S</span>
              </Marker>
              <Marker longitude={175} latitude={0} anchor="center">
                <span className="cardinal-label-dom">E</span>
              </Marker>
              <Marker longitude={-175} latitude={0} anchor="center">
                <span className="cardinal-label-dom">W</span>
              </Marker>
            </>
          )}

          {/* Selected country capital */}
          {selectedCapital && isMarkerVisible(selectedCapital.lon, selectedCapital.lat) && (
            <Marker longitude={selectedCapital.lon} latitude={selectedCapital.lat} anchor="center">
              <div className="selected-capital-marker">
                <svg width="14" height="14" viewBox="-7 -7 14 14">
                  <polygon
                    points="0,-6 1.9,-1.9 6,-1.9 2.6,1.2 3.8,5.5 0,3.1 -3.8,5.5 -2.6,1.2 -6,-1.9 -1.9,-1.9"
                    fill="white"
                    stroke="rgba(255,255,255,0.6)"
                    strokeWidth="0.5"
                  />
                </svg>
                <span className="selected-capital-name">{selectedCapital.name}</span>
              </div>
            </Marker>
          )}

          {/* Hotspots */}
          {hotspots.filter((h) => isMarkerVisible(h.lon, h.lat)).map((hotspot) => {
            const maxCount = hotspots[0]?.count || 1;
            const intensity = Math.max(0.2, hotspot.count / maxCount);
            const size = 6 + intensity * 12;
            const isActive = hotspot.id === selectedHotspotId;
            const isRecent = isRecentlyUpdated(hotspot.lastUpdated);
            const isStale = !isRecent && new Date() - new Date(hotspot.lastUpdated) > 86400000;

            return (
              <Marker
                key={hotspot.id}
                longitude={hotspot.lon}
                latitude={hotspot.lat}
                anchor="center"
              >
                <div
                  className={`hotspot-marker-wrap ${isStale ? 'hotspot-stale' : 'hotspot-active'}`}
                  onMouseEnter={(e) => handleHotspotMouseEnter(hotspot, e)}
                  onMouseLeave={handleHotspotMouseLeave}
                  onClick={(e) => handleHotspotClick(hotspot, e)}
                  style={{ cursor: 'pointer' }}
                >
                  <svg
                    className="hotspot-marker breathe"
                    width={size * 2 + 4}
                    height={size * 2 + 4}
                    viewBox={`${-size - 2} ${-size - 2} ${size * 2 + 4} ${size * 2 + 4}`}
                    style={{ overflow: 'visible', display: 'block' }}
                  >
                    <circle
                      r={size}
                      fill={`rgba(var(--accent-rgb), ${0.15 + intensity * 0.35})`}
                      stroke="rgba(var(--accent-rgb), 0.7)"
                      strokeWidth={isActive ? 2 : 1.5}
                    />
                    <circle r={size * 0.6} fill="rgba(var(--accent-rgb), 0.95)" />
                    {isRecent && <circle r={size * 0.25} fill="rgb(var(--success-rgb))" />}
                  </svg>
                  <div className="hotspot-label-wrap">
                    <span className="hotspot-label-dom">{hotspot.name}</span>
                    {isRecent && (
                      <span className="hotspot-updated-badge-dom">
                        Updated {timeAgo(hotspot.lastUpdated)}
                      </span>
                    )}
                  </div>
                </div>
              </Marker>
            );
          })}

          <NavigationControl position="bottom-left" showCompass={false} />
        </MapGL>

        {/* Fixed cardinal directions for 3D globe */}
        {useGlobe && (
          <div className="cardinal-overlay">
            <span className="cardinal-fixed cardinal-n">N</span>
            <span className="cardinal-fixed cardinal-s">S</span>
            <span className="cardinal-fixed cardinal-e">E</span>
            <span className="cardinal-fixed cardinal-w">W</span>
          </div>
        )}

        {/* Map controls - bottom right */}
        <div className="map-controls-br">
          {useGlobe && (
            <>
              {autoRotate && (
                <input
                  type="range"
                  className="rotate-speed-slider"
                  min="0.005"
                  max="0.12"
                  step="0.005"
                  value={rotateSpeed}
                  onChange={(e) => setRotateSpeed(Number(e.target.value))}
                  title={`Rotation speed: ${Math.round(rotateSpeed * 60)}°/s`}
                  aria-label="Rotation speed"
                />
              )}
              {/* Play / Pause rotation */}
              <button
                className={`map-autorotate-btn ${autoRotate ? 'active' : ''}`}
                onClick={() => setAutoRotate(prev => !prev)}
                title={autoRotate ? 'Stop rotation' : 'Start rotation'}
                aria-label="Toggle auto-rotation"
              >
                {autoRotate ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                    <rect x="5" y="4" width="5" height="16" rx="1" />
                    <rect x="14" y="4" width="5" height="16" rx="1" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                    <polygon points="6,3 20,12 6,21" />
                  </svg>
                )}
              </button>
              {/* Direction toggle — left/right arrows */}
              {autoRotate && (
                <button
                  className="map-autorotate-btn map-rotate-dir-btn active"
                  onClick={() => setRotateCCW(prev => !prev)}
                  title={rotateCCW ? 'Switch to clockwise' : 'Switch to counterclockwise'}
                  aria-label="Toggle rotation direction"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {rotateCCW ? (
                      <>
                        <line x1="19" y1="12" x2="5" y2="12" />
                        <polyline points="12 19 5 12 12 5" />
                      </>
                    ) : (
                      <>
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </>
                    )}
                  </svg>
                </button>
              )}
            </>
          )}
        </div>

        {/* Recenter button - bottom left, next to zoom controls */}
        <div className="map-controls-bl">
          <button
            className="map-recenter-btn"
            onClick={handleRecenter}
            title="Recenter map"
            aria-label="Recenter map to default view"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <ellipse cx="12" cy="12" rx="4" ry="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
            </svg>
          </button>
        </div>

        {/* Tooltip */}
        {tooltip.show && (
          <div
            className="map-tooltip"
            style={{
              position: 'absolute',
              left: tooltip.x,
              top: tooltip.y,
              pointerEvents: 'none'
            }}
          >
            {tooltip.text}
          </div>
        )}
      </div>
    </div>
    </div>
    <PagePanel pageId={activePage} onClose={() => setActivePage(null)} />
    </>
  );
}

export default App;
