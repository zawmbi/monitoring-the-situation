import { useState, useEffect, useMemo, useRef } from 'react';
import { ComposableMap, Geographies, Geography, Marker, Sphere, Graticule, ZoomableGroup, Line } from 'react-simple-maps';
import { feature } from 'topojson-client';
import { geoCentroid } from 'd3-geo';
import worldData from 'world-atlas/countries-110m.json';
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

// Safe guard in case topojson fails to load
const GEO_FEATURES = worldData?.objects?.countries
  ? feature(worldData, worldData.objects.countries).features
  : [];
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

function App() {
  // View state machine: 'world' | 'region' | 'hotspot'
  const [viewMode, setViewMode] = useState('world');
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedHotspotId, setSelectedHotspotId] = useState(null);

  // Country panel hook
  const {
    countryPanel,
    openCountryPanel,
    closeCountryPanel,
    updateCountryPanelPosition,
  } = useCountryPanel();

  // Sidebar state
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  // Popover state
  const [popoverHotspot, setPopoverHotspot] = useState(null);
  const [popoverPosition, setPopoverPosition] = useState(null);
  const mapContainerRef = useRef(null);

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

  const countryColor = (name) => {
    if (!name) return '#111216';
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 35%, 18%)`;
  };

  const handleRegionClick = (geo, scope, event) => {
    const name = geo.properties?.name || 'Unknown';
    setSelectedRegion({ type: scope, id: geo.id, name });
    setViewMode('region');
    if (scope === 'country') {
      handleCountryClick(geo, event);
    }
  };

  const handleCountryClick = (geo, event) => {
    if (!mapContainerRef.current) return;
    const name = geo.properties?.name || 'Unknown';

    const mapRect = mapContainerRef.current.getBoundingClientRect();
    const clickX = event.clientX - mapRect.left;
    const clickY = event.clientY - mapRect.top;

    const panelWidth = 300;
    const panelHeight = 200;
    const padding = 32;

    let x = clickX + 24;
    let y = clickY + 24;

    // Clamp to avoid edges
    x = Math.max(padding, Math.min(x, mapRect.width - panelWidth - padding));
    y = Math.max(padding, Math.min(y, mapRect.height - panelHeight - padding));

    // Open country panel with calculated position
    openCountryPanel(name, { x, y });

    // Open Polymarket panel for this country
    setPolymarketCountry(name);
    setShowPolymarketPanel(true);
  };

  const handleHotspotClick = (hotspot, event) => {
    event.stopPropagation();
    event.preventDefault();

    // Calculate screen position with smart placement to avoid borders
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
      let placement = 'top'; // default placement

      // Determine best placement based on available space
      const spaceTop = markerCenterY;
      const spaceBottom = mapRect.height - markerCenterY;
      const spaceLeft = markerCenterX;
      const spaceRight = mapRect.width - markerCenterX;

      // Check if there's enough space above
      if (spaceTop >= popoverHeight + padding) {
        placement = 'top';
        y = markerCenterY - 20;
      }
      // Check if there's enough space below
      else if (spaceBottom >= popoverHeight + padding) {
        placement = 'bottom';
        y = markerCenterY + 40;
      }
      // Check if there's enough space on the right
      else if (spaceRight >= popoverWidth + padding) {
        placement = 'right';
        x = markerCenterX + popoverWidth / 2 + 20;
        y = Math.max(popoverHeight / 2 + padding, Math.min(markerCenterY, mapRect.height - popoverHeight / 2 - padding));
      }
      // Check if there's enough space on the left
      else if (spaceLeft >= popoverWidth + padding) {
        placement = 'left';
        x = markerCenterX - popoverWidth / 2 - 20;
        y = Math.max(popoverHeight / 2 + padding, Math.min(markerCenterY, mapRect.height - popoverHeight / 2 - padding));
      }
      // Fallback: place below and clamp
      else {
        placement = 'bottom';
        y = markerCenterY + 40;
      }

      // Final clamping to ensure it stays within bounds
      x = Math.max(popoverWidth / 2 + padding, Math.min(x, mapRect.width - popoverWidth / 2 - padding));
      y = Math.max(padding + 60, Math.min(y, mapRect.height - padding - 60));

      setPopoverPosition({ x, y, placement });
      setPopoverHotspot(hotspot);
      setTooltip({ show: false, text: '', x: 0, y: 0 });
    }
  };

  const handleOpenHotspotInPanel = () => {
    if (popoverHotspot && mapContainerRef.current) {
      const mapRect = mapContainerRef.current.getBoundingClientRect();

      // Open news panel in center of screen
      const panelWidth = 480;
      const panelHeight = 600;

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

  const handleBackToWorld = () => {
    setViewMode('world');
    setSelectedRegion(null);
    setSelectedHotspotId(null);
  };

  const handleRegionMouseMove = (geo, event) => {
    if (mapContainerRef.current && !popoverHotspot) {
      const mapRect = mapContainerRef.current.getBoundingClientRect();
      setTooltip({
        show: true,
        text: geo.properties?.name || 'Unknown',
        x: event.clientX - mapRect.left,
        y: event.clientY - mapRect.top
      });
    }
  };

  const handleRegionMouseLeave = () => {
    setTooltip({ show: false, text: '', x: 0, y: 0 });
  };

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

  return (
    <div className="app">
      {/* Sidebar */}
      <div className={`sidebar ${sidebarExpanded ? 'expanded' : 'collapsed'}`}>
        <div className="sidebar-header">
          <div className="sidebar-top-bar">
            <div className="sidebar-logo">
              <div className="logo-icon">
                <img src="/earth.png" alt="Monitored" className="logo-image" />
              </div>
              <span className="sidebar-logo-text">Monitored</span>
            </div>
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
        </div>

        <div className="sidebar-content">
          {feedLoading && sidebarExpanded && (
            <div className="notice" style={{ marginBottom: '12px' }}>
              Loading live feed...
            </div>
          )}
          {feedError && sidebarExpanded && (
            <div className="notice" style={{ marginBottom: '12px' }}>
              Feed unavailable: {feedError.message}
            </div>
          )}

          {/* Source Toggles */}
          {sidebarExpanded && (
            <div className="source-toggles">
              <div className="toggle-group-title">Layers & Sources</div>
              {[
                { id: 'news', label: 'Major News', tone: 'news', disabled: false },
                { id: 'twitter', label: 'Twitter', tone: 'twitter', disabled: false },
                { id: 'reddit', label: 'Reddit', tone: 'reddit', disabled: false },
                { id: 'rumors', label: 'Rumors', tone: 'rumors', disabled: false },
                { id: 'flights', label: 'Flights', tone: 'flights', disabled: false },
                { id: 'stocks', label: 'Stocks', tone: 'stocks', disabled: false },
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
          )}

          {/* News Feed */}
          {sidebarExpanded && (
            <NewsFeed
              items={filteredDisplayFeed}
              viewMode={viewMode}
              selectedRegion={selectedRegion}
              onBackToWorld={handleBackToWorld}
            />
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
        <div className="timezone-labels timezone-labels-top">
          {TIMEZONES.map(tz => (
            <div key={`top-${tz.name}`} className="timezone-label">
              <div className="timezone-name">{tz.name}</div>
              <div className="timezone-time">{getCurrentTimeForOffset(tz.offset)}</div>
            </div>
          ))}
        </div>

        {/* Timezone Labels Bottom */}
        <div className="timezone-labels timezone-labels-bottom">
          {TIMEZONES.map(tz => (
            <div key={`bottom-${tz.name}`} className="timezone-label">
              <div className="timezone-time">{getCurrentTimeForOffset(tz.offset)}</div>
              <div className="timezone-name">{tz.name}</div>
            </div>
          ))}
        </div>

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

        <ComposableMap projection="geoEqualEarth">
          <ZoomableGroup>
            <Sphere stroke="rgba(255,255,255,0.06)" strokeWidth={1} fill="rgba(199, 7, 7, 0.01)" />
            <Graticule stroke="rgba(255,255,255,0.04)" strokeWidth={0.5} />

            {/* Timezone Lines */}
            {[-180, -150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150].map(lon => (
              <Line
                key={`timezone-${lon}`}
                from={[lon, -85]}
                to={[lon, 85]}
                stroke="rgba(255, 180, 80, 0.15)"
                strokeWidth={lon === 0 ? 1.5 : 0.8}
                strokeDasharray={lon === 0 ? "none" : "3,3"}
              />
            ))}

            {/* Cardinal Direction Indicators */}
            <Marker coordinates={[0, 85]}>
              <text textAnchor="middle" className="cardinal-label" fill="rgba(80, 200, 255, 1)" fontSize="13px" fontWeight="700">
                N
              </text>
            </Marker>
            <Marker coordinates={[0, -85]}>
              <text textAnchor="middle" className="cardinal-label" fill="rgba(80, 200, 255, 1)" fontSize="13px" fontWeight="700">
                S
              </text>
            </Marker>
            <Marker coordinates={[175, 0]}>
              <text textAnchor="middle" className="cardinal-label" fill="rgba(80, 200, 255, 1)" fontSize="13px" fontWeight="700">
                E
              </text>
            </Marker>
            <Marker coordinates={[-175, 0]}>
              <text textAnchor="middle" className="cardinal-label" fill="rgba(80, 200, 255, 1)" fontSize="13px" fontWeight="700">
                W
              </text>
            </Marker>

            {/* Countries */}
            <Geographies geography={GEO_FEATURES}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const isSelected = selectedRegion?.type === 'country' && selectedRegion.id === geo.id;
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onClick={(event) => handleRegionClick(geo, 'country', event)}
                      onMouseMove={(event) => handleRegionMouseMove(geo, event)}
                      onMouseLeave={handleRegionMouseLeave}
                      className={isSelected ? 'geography-selected' : 'geography-clickable'}
                      style={{
                        default: {
                          fill: isSelected ? 'rgba(108, 123, 255, 0.3)' : countryColor(geo.properties.name),
                          outline: 'none',
                          stroke: isSelected ? 'var(--color-accent)' : 'var(--color-map-border)',
                          strokeWidth: isSelected ? 1.6 : 0.8,
                          vectorEffect: 'non-scaling-stroke',
                        },
                        hover: {
                          fill: '#1b2334',
                          outline: 'none',
                          stroke: 'var(--color-map-border-strong)',
                          strokeWidth: 0.9,
                          vectorEffect: 'non-scaling-stroke',
                        },
                        pressed: {
                          fill: '#1b2334',
                          outline: 'none',
                          stroke: 'var(--color-map-border-strong)',
                          strokeWidth: 0.9,
                          vectorEffect: 'non-scaling-stroke',
                        },
                      }}
                    />
                  );
                })
              }
            </Geographies>

            {/* US States */}
            {US_STATE_FEATURES.length > 0 && (
              <Geographies geography={US_STATE_FEATURES}>
                {({ geographies }) =>
                  geographies.map((geo) => {
                    const isSelected = selectedRegion?.type === 'state' && selectedRegion.id === geo.id;
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        onClick={(event) => handleRegionClick(geo, 'state', event)}
                        onMouseMove={(event) => handleRegionMouseMove(geo, event)}
                        onMouseLeave={handleRegionMouseLeave}
                        className={isSelected ? 'geography-selected' : 'geography-clickable'}
                        style={{
                          default: {
                            fill: isSelected ? 'rgba(108, 123, 255, 0.3)' : 'transparent',
                            stroke: isSelected ? 'var(--color-accent)' : 'rgba(255,255,255,0.08)',
                            strokeWidth: isSelected ? 1.5 : 0.6,
                          },
                          hover: { fill: 'rgba(255,255,255,0.04)', stroke: 'rgba(255,255,255,0.12)', strokeWidth: 0.8 },
                          pressed: { fill: 'rgba(255,255,255,0.04)', stroke: 'rgba(255,255,255,0.12)', strokeWidth: 0.8 },
                        }}
                      />
                    );
                  })
                }
              </Geographies>
            )}

            {/* Capital Cities */}
            {CAPITAL_MARKERS.map((capital) => (
              <Marker key={capital.id} coordinates={[capital.lon, capital.lat]}>
                <g className="capital-marker">
                  <polygon
                    className="capital-star"
                    points="0,-5 1.6,-1.6 5,-1.6 2.2,1 3.2,4.6 0,2.6 -3.2,4.6 -2.2,1 -5,-1.6 -1.6,-1.6"
                    vectorEffect="non-scaling-stroke"
                  />
                  <text
                    className="capital-label"
                    x={7}
                    y={1}
                    textAnchor="start"
                    dominantBaseline="middle"
                  >
                    {capital.name}
                  </text>
                </g>
              </Marker>
            ))}

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
                  coordinates={[hotspot.lon, hotspot.lat]}
                  onMouseEnter={(event) => handleHotspotMouseEnter(hotspot, event)}
                  onMouseLeave={handleHotspotMouseLeave}
                >
                  <g
                    className={`hotspot-marker breathe ${isStale ? 'hotspot-stale' : 'hotspot-active'}`}
                    style={{ pointerEvents: 'all', cursor: 'pointer' }}
                    onClick={(event) => handleHotspotClick(hotspot, event)}
                    onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
                  >
                    <circle
                      r={size}
                      fill={`rgba(108, 123, 255, ${0.15 + intensity * 0.35})`}
                      stroke="rgba(108,123,255,0.7)"
                      strokeWidth={isActive ? 2 : 1.5}
                    />
                    <circle r={size * 0.6} fill="rgba(108, 123, 255, 0.95)" />
                    {isRecent && <circle r={size * 0.25} fill="#52e08a" />}
                  </g>
                  <text textAnchor="middle" y={-size - 4} className="hotspot-label" style={{ pointerEvents: 'none' }}>
                    {hotspot.name}
                  </text>
                  {isRecent && (
                    <text textAnchor="middle" y={-size - 14} className="hotspot-updated-badge" style={{ pointerEvents: 'none' }}>
                      Updated {timeAgo(hotspot.lastUpdated)}
                    </text>
                  )}
                </Marker>
              );
            })}

            {/* Flight Lines */}
            {enabledLayers.flights &&
              flightPaths.map((flight) => (
                <Line
                  key={flight.id}
                  from={flight.from}
                  to={flight.to}
                  stroke="rgba(80,200,255,0.7)"
                  strokeWidth={2}
                  strokeLinecap="round"
                  className="flight-line"
                />
              ))}
          </ZoomableGroup>
        </ComposableMap>

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
  );
}

export default App;

