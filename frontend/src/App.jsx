import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Map as MapGL, Source, Layer, Marker, NavigationControl } from '@vis.gl/react-maplibre';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { feature } from 'topojson-client';
import { geoCentroid, geoGraticule10 } from 'd3-geo';
import worldData from 'world-atlas/countries-50m.json';
import usData from 'us-atlas/states-10m.json';
import countries from 'world-countries';
import { useFeed } from './hooks/useFeed';
import { useStocks } from './hooks/useStocks';
import { useFlights } from './hooks/useFlights';
import NewsFeed, { NewsItem } from './features/news/NewsFeed';
import { StocksPanel } from './features/stocks/StocksPanel';
import { PolymarketPanel } from './features/polymarket/PolymarketPanel';
import { usePolymarket } from './features/polymarket/usePolymarket';
import { CountryPanel } from './features/country/CountryPanel';
import { useCountryPanel } from './features/country/useCountryPanel';
import { timeAgo } from './utils/time';
import Navbar, { PagePanel } from './navbar/Navbar';

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

const COUNTRIES_DATA = Array.isArray(countries)
  ? countries
  : (countries?.default && Array.isArray(countries.default) ? countries.default : []);

const COUNTRY_BY_CCN3 = new Map(
  (COUNTRIES_DATA || [])
    .filter((country) => country?.ccn3)
    .map((country) => [String(country.ccn3).padStart(3, '0'), country])
);

const CAPITAL_MARKERS = GEO_FEATURES.map((geo, idx) => {
  const country = COUNTRY_BY_CCN3.get(String(geo.id).padStart(3, '0'));
  const capitalName = Array.isArray(country?.capital) ? country.capital[0] : country?.capital;
  if (!capitalName) return null;

  const capitalCoords = country?.capitalInfo?.latlng;
  let lon;
  let lat;

  if (Array.isArray(capitalCoords) && capitalCoords.length === 2) {
    [lat, lon] = capitalCoords;
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

const GEO_MARKERS = [...COUNTRY_MARKERS, ...STATE_MARKERS];

// Pre-generate static GeoJSON data for MapLibre layers
const GRATICULE_GEOJSON = {
  type: 'Feature',
  properties: {},
  geometry: geoGraticule10(),
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

const getInitialTheme = () => {
  if (typeof window === 'undefined') return 'dark';
  const stored = window.localStorage.getItem('theme');
  if (stored === 'light' || stored === 'dark') return stored;
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    return 'light';
  }
  return 'dark';
};

const getInitialNavCollapsed = () => {
  if (typeof window === 'undefined') return false;
  const stored = window.localStorage.getItem('navCollapsed');
  if (stored === 'true' || stored === 'false') return stored === 'true';
  return window.innerWidth < 1100;
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
    closeCountryPanel,
    updateCountryPanelPosition,
  } = useCountryPanel();

  // Sidebar state
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [sidebarTab, setSidebarTab] = useState('world');
  const [showTimezones, setShowTimezones] = useState(false);
  const [selectedCapital, setSelectedCapital] = useState(null);
  const [useGlobe, setUseGlobe] = useState(false);

  // Popover state
  const [popoverHotspot, setPopoverHotspot] = useState(null);
  const [popoverPosition, setPopoverPosition] = useState(null);
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const hoveredCountryIdRef = useRef(null);
  const hoveredStateIdRef = useRef(null);

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
    rumors: false,
    flights: false,
    stocks: false,
  });

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

  const isLightTheme = theme === 'light';

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.style.setProperty('--nav-height', navCollapsed ? '28px' : '64px');
  }, [navCollapsed]);

  useEffect(() => {
    window.localStorage.setItem('navCollapsed', String(navCollapsed));
  }, [navCollapsed]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1100) {
        setNavCollapsed(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      if (enabledLayers.news && item.contentType === 'article') return true;
      if (enabledLayers.twitter && item.contentType === 'tweet') return true;
      if (enabledLayers.reddit && item.contentType === 'reddit_post') return true;
      if (enabledLayers.rumors && item.contentType === 'rumor') return true;
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

  const countryColor = useCallback((name) => {
    if (!name) return isLightTheme ? '#dfe6ff' : '#111827';
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    const saturation = isLightTheme ? 34 : 36;
    const lightness = isLightTheme ? 78 : 18;
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }, [isLightTheme]);

  const countriesGeoJSON = useMemo(() => ({
    type: 'FeatureCollection',
    features: GEO_FEATURES.map((f, i) => ({
      type: 'Feature',
      id: i,
      geometry: f.geometry,
      properties: {
        name: f.properties?.name || `Country ${i}`,
        originalId: String(f.id),
        fillColor: countryColor(f.properties?.name),
      },
    })),
  }), [countryColor]);

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
    projection: { type: useGlobe ? 'globe' : 'mercator' },
    sources: {},
    layers: [{
      id: 'background',
      type: 'background',
      paint: {
        'background-color': isLightTheme ? '#f0f4ff' : '#0c1126',
      },
    }],
    glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
  }), [isLightTheme, useGlobe]);

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

  // ---- Map interaction handlers ----

  const handleMapMouseMove = useCallback((event) => {
    if (popoverHotspot) return;
    const map = mapRef.current;
    if (!map) return;

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
      }

      setTooltip({
        show: true,
        text: feat.properties?.name || 'Unknown',
        x: event.point.x,
        y: event.point.y,
      });
      map.getCanvas().style.cursor = 'pointer';
    } else {
      setTooltip({ show: false, text: '', x: 0, y: 0 });
      map.getCanvas().style.cursor = '';
    }
  }, [popoverHotspot]);

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
    setTooltip({ show: false, text: '', x: 0, y: 0 });
  }, []);

  const handleMapClick = useCallback((event) => {
    const features = event.features;
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

      // Show capital star for selected country
      const capital = CAPITAL_MARKERS.find(m => m.id === `capital-${originalId}`);
      setSelectedCapital(capital || null);

      // Calculate panel position
      if (mapContainerRef.current) {
        const mapRect = mapContainerRef.current.getBoundingClientRect();
        const clickX = event.point.x;
        const clickY = event.point.y;

        const panelWidth = 300;
        const panelHeight = 200;
        const padding = 32;

        let x = clickX + 24;
        let y = clickY + 24;

        x = Math.max(padding, Math.min(x, mapRect.width - panelWidth - padding));
        y = Math.max(padding, Math.min(y, mapRect.height - panelHeight - padding));

        openCountryPanel(name, { x, y });
        setPolymarketCountry(name);
        setShowPolymarketPanel(true);
      }
    } else if (sourceId === 'us-states') {
      setSelectedRegion({ type: 'state', id: originalId, name });
      setViewMode('region');
      setSelectedCapital(null);
    }
  }, [openCountryPanel]);

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
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
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

  // Double-click: zoom to fit the clicked country/state
  const handleMapDblClick = useCallback((event) => {
    const map = mapRef.current;
    if (!map) return;

    const features = event.features;
    if (!features || features.length === 0) return;

    const feat = features[0];
    const originalId = feat.properties?.originalId;
    const sourceId = feat.source;

    let geoFeature;
    if (sourceId === 'countries') {
      geoFeature = GEO_FEATURES.find(f => String(f.id) === String(originalId));
    } else if (sourceId === 'us-states') {
      geoFeature = US_STATE_FEATURES.find(f => String(f.id) === String(originalId));
    }
    if (!geoFeature) return;

    // Compute bounding box from geometry
    const coords = [];
    const geom = geoFeature.geometry;
    if (geom.type === 'Polygon') {
      geom.coordinates.forEach(ring => ring.forEach(c => coords.push(c)));
    } else if (geom.type === 'MultiPolygon') {
      geom.coordinates.forEach(poly => poly.forEach(ring => ring.forEach(c => coords.push(c))));
    }
    if (coords.length === 0) return;

    let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
    coords.forEach(([lon, lat]) => {
      const normLon = lon > 180 ? lon - 360 : lon;
      minLon = Math.min(minLon, normLon);
      maxLon = Math.max(maxLon, normLon);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
    });

    map.fitBounds([[minLon, minLat], [maxLon, maxLat]], {
      padding: 60,
      duration: 800,
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
    const map = evt.target;
    if (useGlobe) {
      map.setProjection({ type: 'globe' });
    }
  }, [useGlobe]);

  return (
    <>
    <div className="app">
      <Navbar
        title="Monitoring The Situation"
        logoSrc="/earth.png"
        activePage={activePage}
        onNavigate={handleNavigate}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        collapsed={navCollapsed}
        onToggleCollapse={handleToggleNav}
      />

      <div className="app-body">
        {/* Sidebar */}
        <div className={`sidebar ${sidebarExpanded ? 'expanded' : 'collapsed'}`}>
          <div className="sidebar-header">
            <div className="sidebar-top-bar">

              <button
                className="sidebar-toggle"
                onClick={() => setSidebarExpanded(!sidebarExpanded)}
                aria-label={sidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
              >
                {sidebarExpanded ? '<' : '>'}
              </button>
            </div>
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
            {sidebarExpanded && (
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
                  <div className="source-group-title">Signals</div>
                  <div className="source-group-items">
                    {[
                      { id: 'rumors', label: 'Rumors', tone: 'rumors', disabled: false },
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
                      { id: 'flights', label: 'Flights', tone: 'flights', disabled: false },
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
                <div className="toggle-group-title">Appearance</div>
                <div className="settings-group">
                  <label className="switch switch-theme">
                    <span className="switch-label">Light mode</span>
                    <input
                      type="checkbox"
                      checked={isLightTheme}
                      onChange={(event) => setTheme(event.target.checked ? 'light' : 'dark')}
                    />
                    <span className="slider" />
                  </label>
                </div>

                <div className="toggle-group-title">Projection</div>
                <div className="settings-group">
                  <label className="switch switch-neutral">
                    <span className="switch-label">3D Globe</span>
                    <input
                      type="checkbox"
                      checked={useGlobe}
                      onChange={() => setUseGlobe(prev => !prev)}
                    />
                    <span className="slider" />
                  </label>
                </div>

                <div className="toggle-group-title">Map Overlays</div>
                <div className="settings-group">
                  <label className="switch switch-neutral">
                    <span className="switch-label">Timezones</span>
                    <input
                      type="checkbox"
                      checked={showTimezones}
                      onChange={() => setShowTimezones(prev => !prev)}
                    />
                    <span className="slider" />
                  </label>
                </div>
              </div>
            )}

            {!sidebarExpanded && (
              <div className="sidebar-icon-stack">
                <div className="sidebar-icon" title="Expand sidebar">
                  map
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Map */}
        <div className="map-container" ref={mapContainerRef}>
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
          />
        )}

        <MapGL
          key={useGlobe ? 'globe' : 'flat'}
          mapLib={maplibregl}
          mapStyle={mapStyle}
          onLoad={onMapLoad}
          initialViewState={{
            longitude: 0,
            latitude: 20,
            zoom: 1.5,
          }}
          style={{ width: '100%', height: '100%' }}
          interactiveLayerIds={['countries-fill', 'us-states-fill']}
          onMouseMove={handleMapMouseMove}
          onMouseLeave={handleMapMouseLeave}
          onClick={handleMapClick}
          onDblClick={handleMapDblClick}
          doubleClickZoom={false}
          dragRotate={useGlobe}
          pitchWithRotate={useGlobe}
          touchPitch={useGlobe}
          renderWorldCopies={false}
          {...(!useGlobe && { maxBounds: [[-360, -58], [360, 85]] })}
          maxZoom={8}
          minZoom={1}
        >
          {/* Graticule */}
          <Source id="graticule" type="geojson" data={GRATICULE_GEOJSON}>
            <Layer
              id="graticule-lines"
              type="line"
              paint={{
                'line-color': isLightTheme ? 'rgba(93, 77, 255, 0.12)' : 'rgba(73, 198, 255, 0.12)',
                'line-width': 0.5,
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
                'line-color': isLightTheme ? 'rgba(93, 77, 255, 0.2)' : 'rgba(73, 198, 255, 0.2)',
                'line-width': 0.8,
                'line-dasharray': [3, 3],
              }}
            />
            <Layer
              id="timezone-lines-prime"
              type="line"
              filter={['==', ['get', 'isPrimeMeridian'], true]}
              paint={{
                'line-color': isLightTheme ? 'rgba(93, 77, 255, 0.2)' : 'rgba(73, 198, 255, 0.2)',
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
                'fill-color': [
                  'case',
                  ['boolean', ['feature-state', 'hover'], false],
                  isLightTheme ? '#e9edff' : '#1a2654',
                  ['get', 'fillColor'],
                ],
                'fill-opacity': 1,
              }}
            />
            <Layer
              id="countries-line"
              type="line"
              paint={{
                'line-color': isLightTheme
                  ? 'rgba(148, 163, 184, 0.55)'
                  : 'rgba(148, 163, 184, 0.55)',
                'line-width': [
                  'case',
                  ['boolean', ['feature-state', 'hover'], false],
                  0.9,
                  0.8,
                ],
              }}
            />
            {/* Selected country highlight */}
            <Layer
              id="countries-selected-fill"
              type="fill"
              filter={selectedCountryFilter}
              paint={{
                'fill-color': isLightTheme
                  ? 'rgba(93, 77, 255, 0.35)'
                  : 'rgba(123, 107, 255, 0.35)',
              }}
            />
            <Layer
              id="countries-selected-line"
              type="line"
              filter={selectedCountryFilter}
              paint={{
                'line-color': isLightTheme ? '#5d4dff' : '#7b6bff',
                'line-width': 1.6,
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
                    ? 'rgba(93, 77, 255, 0.08)'
                    : 'rgba(123, 107, 255, 0.08)',
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
                  ? 'rgba(93, 77, 255, 0.18)'
                  : 'rgba(123, 107, 255, 0.18)',
                'line-width': 0.6,
              }}
            />
            <Layer
              id="us-states-selected-fill"
              type="fill"
              filter={selectedStateFilter}
              paint={{
                'fill-color': isLightTheme
                  ? 'rgba(93, 77, 255, 0.35)'
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

          {/* Cardinal Direction Indicators */}
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

          {/* Selected country capital */}
          {selectedCapital && (
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
          {hotspots.map((hotspot) => {
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

          <NavigationControl position="bottom-right" showCompass={true} />
        </MapGL>

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
