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
import US_STATE_INFO from './usStateInfo';
import CA_PROVINCE_INFO from './caProvinceInfo';
import POPULATION_POINTS from './populationData';
import { WATER_CANALS } from './waterFeatures';
import { useFeed } from './hooks/useFeed';
import { useFlights } from './hooks/useFlights';
import NewsFeed, { NewsItem } from './features/news/NewsFeed';
import { CountryPanel } from './features/country/CountryPanel';
import { useCountryPanel } from './features/country/useCountryPanel';
import { useWeather } from './hooks/useWeather';
import { useSevereWeather } from './hooks/useSevereWeather';
import { SevereWeatherPanel } from './features/severeWeather/SevereWeatherPanel';
import { TariffPanel } from './features/tariffs/TariffPanel';
import { getUniversalRate, getTariffColor, getTariffColorLight, TARIFF_LEGEND } from './features/tariffs/tariffData';
import { timeAgo } from './utils/time';
import Navbar, { PagePanel } from './navbar/Navbar';
import { useStarfield } from './StarfieldCanvas';
import EarthOverlay from './EarthOverlay';
import { useSettings } from './hooks/useSettings';
import { getStoredTheme, applyTheme } from './themes/index.js';
import { useChat } from './hooks/useChat';
import { useAuth } from './hooks/useAuth';
import ConflictOverlay from './features/conflicts/ConflictOverlay';
import ConflictPanel from './features/conflicts/ConflictPanel';
import { CONFLICT_SUMMARY } from './features/conflicts/conflictData';
import GenericConflictOverlay from './features/conflicts/GenericConflictOverlay';
import GenericConflictPanel from './features/conflicts/GenericConflictPanel';
import * as israelGazaData from './features/conflicts/israelGazaData';
import * as sudanData from './features/conflicts/sudanData';
import * as myanmarData from './features/conflicts/myanmarData';
import * as yemenData from './features/conflicts/yemenData';
import * as ethiopiaData from './features/conflicts/ethiopiaData';
import * as drcData from './features/conflicts/drcData';
import * as iranIsraelData from './features/conflicts/iranIsraelData';
import * as indiaPakistanData from './features/conflicts/indiaPakistanData';
import * as sahelData from './features/conflicts/sahelData';
import { ElectionPanel } from './features/elections/ElectionPanel';
import { getElectionColor, hasElectionRaces, RATING_COLORS } from './features/elections/electionData';
import ProtestHeatmap from './features/stability/ProtestHeatmap';
import MilitaryOverlay from './features/stability/MilitaryOverlay';
import StabilityPanel from './features/stability/StabilityPanel';
import { useStability } from './hooks/useStability';
import { getCountryFillColor } from './features/country/countryColors';
import { WindowManagerProvider } from './hooks/useWindowManager.jsx';
import PanelWindow from './components/PanelWindow';
import MinimizedTray from './components/MinimizedTray';
import AccountPanel from './components/AccountPanel';
import GlobalStatusBar from './components/GlobalStatusBar';
import NewsTicker from './components/NewsTicker';
import { useDisasters } from './hooks/useDisasters';
import { useCyber } from './hooks/useCyber';
import { useHealth } from './hooks/useHealth';
import { useCommodities } from './hooks/useCommodities';
import { useShipping } from './hooks/useShipping';
import { useTension } from './hooks/useTension';
import { useBriefing } from './hooks/useBriefing';
import { useCountryRisk } from './hooks/useCountryRisk';
import { useRefugees } from './hooks/useRefugees';
import DisasterOverlay from './features/disasters/DisasterOverlay';
import { CyberPanel } from './features/cyber/CyberPanel';
import { HealthPanel } from './features/health/HealthPanel';
import { CommoditiesPanel } from './features/commodities/CommoditiesPanel';
import { RefugeePanel } from './features/refugees/RefugeePanel';
import { ShippingPanel } from './features/shipping/ShippingPanel';
import ShippingOverlay from './features/shipping/ShippingOverlay';
import { RefugeeOverlay } from './features/refugees/RefugeeOverlay';
import { RiskOverlay } from './features/risk/RiskOverlay';
import { TensionPanel } from './features/tension/TensionPanel';
import { BriefingPanel } from './features/briefing/BriefingPanel';
import { CourtPanel } from './features/court/CourtPanel';
import { SanctionsPanel } from './features/sanctions/SanctionsPanel';
import { CountryRiskPanel } from './features/risk/CountryRiskPanel';
import { WatchlistPanel } from './features/watchlist/WatchlistPanel';
import { useCourt } from './hooks/useCourt';
import { useSanctions } from './hooks/useSanctions';
import { useNarrative } from './hooks/useNarrative';
import { useRegime } from './hooks/useRegime';
import { useAlliance } from './hooks/useAlliance';
import { useInfrastructure } from './hooks/useInfrastructure';
import { useDemographic } from './hooks/useDemographic';
import { useCredibility } from './hooks/useCredibility';
import { useLeadership } from './hooks/useLeadership';
import { NarrativePanel } from './features/narrative/NarrativePanel';
import { RegimePanel } from './features/regime/RegimePanel';
import { AlliancePanel } from './features/alliance/AlliancePanel';
import { InfrastructurePanel } from './features/infrastructure/InfrastructurePanel';
import { DemographicPanel } from './features/demographic/DemographicPanel';
import { CredibilityPanel } from './features/credibility/CredibilityPanel';
import { LeadershipPanel } from './features/leadership/LeadershipPanel';
import { TimelineNavigator } from './components/TimelineNavigator';
import { useI18n } from './i18n/I18nContext';
import IN_STATE_INFO from './indiaStateInfo';
import RU_OBLAST_INFO from './ruOblastInfo';
import UK_NATION_INFO from './ukNationInfo';
import { useIndiaStates } from './hooks/useIndiaStates';
import { useRussianOblasts } from './hooks/useRussianOblasts';
import { useUKNations } from './hooks/useUKNations';
import { useMultiPanel } from './hooks/useMultiPanel';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { OnboardingTour } from './components/OnboardingTour';
import { FreshnessIndicator } from './components/FreshnessIndicator';
import { CommandPalette, PANEL_INDEX, CONFLICT_INDEX, COUNTRY_INDEX } from './components/CommandPalette';
import { OfflineIndicator } from './components/OfflineIndicator';
import { ClimatePanel } from './features/climate/ClimatePanel';
import { NuclearPanel } from './features/nuclear/NuclearPanel';
import { AITechPanel } from './features/aitech/AITechPanel';
import { useClimate } from './hooks/useClimate';
import { useNuclear } from './hooks/useNuclear';
import { useAiTech } from './hooks/useAiTech';
import { useDeepLink } from './hooks/useDeepLink';
import { useNotifications } from './hooks/useNotifications';

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
    : []
);
const US_STATE_FEATURES = usData?.objects?.states
  ? feature(usData, usData.objects.states).features
  : [];

const CA_PROVINCE_FEATURES = fixGeoJSON(canadaProvinces?.features || []);

// EU member state names as they appear in the TopoJSON world-atlas data
const EU_MEMBER_NAMES = new Set([
  'Austria', 'Belgium', 'Bulgaria', 'Croatia', 'Cyprus', 'Czechia', 'Czech Rep.',
  'Denmark', 'Estonia', 'Finland', 'France', 'Germany', 'Greece', 'Hungary',
  'Ireland', 'Italy', 'Latvia', 'Lithuania', 'Luxembourg', 'Malta', 'Netherlands',
  'Poland', 'Portugal', 'Romania', 'Slovakia', 'Slovenia', 'Spain', 'Sweden',
]);

// Pre-compute how many EU features exist so hover-all loops have a stable count
const EU_FEATURE_COUNT = GEO_FEATURES.filter((f) => EU_MEMBER_NAMES.has(f.properties?.name)).length;

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
  const ccn3 = String(geo.id).padStart(3, '0');
  const coords = CAPITAL_COORDS[ccn3];
  let lon, lat;
  if (coords) {
    [lat, lon] = coords;
  } else {
    [lon, lat] = geoCentroid(geo);
  }
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

// Ambiguous location names that are also common first names, words, or overlap
// with another region. Require these to appear as whole words with context.
const AMBIGUOUS_NAMES = new Set([
  'georgia', 'jordan', 'chad', 'niger', 'guinea', 'mali', 'ireland',
  'turkey', 'china', 'japan', 'india', 'france', 'brazil', 'cuba',
  'panama', 'monaco', 'malta', 'cyprus', 'togo', 'nauru', 'oman',
  'peru', 'fiji', 'laos', 'iran', 'iraq', 'israel', 'congo',
]);

// Words that commonly cause false-positive matches for country names.
// Maps country name (lowercase) → regex that EXCLUDES the match.
// If the exclusion regex matches the text, skip the country match.
const FALSE_POSITIVE_EXCLUSIONS = {
  'oman': /\b(woman|women|roman|ottoman|yeoman|omani(?:a)?s?\b(?!.*\b(?:muscat|sultan)))/i,
  'turkey': /\b(turkey(?:\s+(?:breast|leg|dinner|sandwich|recipe|thanksgiving|stuffing|cranberry|giblet|roast|carve)))/i,
  'iran': /\b(iran(?:ting|dom|ge|ium)|(?:(?:out)?ran|veteran|durango?))\b/i,
  'niger': /\b(nigeria)/i,
  'guinea': /\b(guinea\s+pig)/i,
  'chad': /\b(chad(?:\s+(?:smith|johnson|michael|ochocinco|kroeger)))/i,
  'jordan': /\b(michael\s+jordan|jordan(?:\s+(?:peele|peterson|spieth|brand|sneaker|shoe)))/i,
  'georgia': /\b(georgia(?:\s+(?:peach|bulldog|tech|o'keeffe)))/i,
  'mali': /\b(somali|animal|normal|anomal)/i,
  'cuba': /\b(cuba(?:\s+(?:gooding|libre)))/i,
  'panama': /\b(panama(?:\s+(?:hat|jack)))/i,
  'malta': /\b(malta(?:se))/i,
  'togo': /\b(togos|together)/i,
};

// Build a word-boundary regex for a name; uses \b for strict whole-word matching
function buildMatchRegex(name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Use strict word boundaries (\b) to prevent substring matches like Woman→Oman
  return new RegExp(`\\b${escaped}\\b`, 'i');
}

function deriveHotspots(items) {
  const buckets = GEO_MARKERS.map(marker => ({
    ...marker,
    items: [],
    regex: marker.match ? buildMatchRegex(marker.match) : null,
  }));

  items.forEach(item => {
    const text = `${item.title || ''} ${item.summary || ''} ${item.content || ''} ${item.sourceName || ''} ${item.source || ''}`;
    const textLower = text.toLowerCase();
    buckets.forEach(bucket => {
      if (!bucket.regex) return;
      // Strict word-boundary match to avoid substring false positives
      if (!bucket.regex.test(text)) return;

      // Check for known false-positive patterns (turkey recipes, Woman, etc.)
      const exclusion = FALSE_POSITIVE_EXCLUSIONS[bucket.match];
      if (exclusion && exclusion.test(text)) return;

      // For ambiguous names, require at least one geographic context word nearby
      if (AMBIGUOUS_NAMES.has(bucket.match)) {
        const ctx = textLower;
        const hasContext = /\b(government|president|prime\s+minister|minister|military|troops|war|conflict|crisis|protest|election|capital|border|region|province|state of|country|nation|attack|bomb|strike|sanction|embassy|diplomat|foreign|amid|unrest|ceasefire|treaty|nuclear|regime|coup|dictator|parliament|congress|senate|geopolitical|defense|army|navy|airforce|missile|terrorism|insurgent)\b/.test(ctx);
        if (!hasContext) return;
      }
      bucket.items.push(item);
    });
  });

  // Require minimum 2 items for a hotspot to appear (reduces noise)
  return buckets
    .filter(bucket => bucket.items.length >= 2)
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

  const typeLabel = (t) => ({ article: 'news', rumor: 'rumor', tweet: 'twitter', reddit_post: 'reddit', flight: 'flights', stock: 'stocks' }[t] || t);

  return (
    <div
      ref={popoverRef}
      className="hs-popover"
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        zIndex: 1000,
        cursor: isDragging ? 'grabbing' : 'default'
      }}
      onMouseDown={handleDragStart}
    >
      <div className="hs-popover-inner">
        <div className="hs-popover-head" style={{ cursor: 'grab' }}>
          <div className="hs-popover-title-row">
            <h3 className="hs-popover-title">{hotspot.name}</h3>
            <span className="hs-popover-count">{hotspot.count}</span>
          </div>
          <button className="hs-popover-close" onClick={onClose} aria-label="Close">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>
        {Object.keys(hotspot.byType).length > 1 && (
          <div className="hs-popover-tags">
            {Object.entries(hotspot.byType).sort((a,b) => b[1] - a[1]).map(([type, count]) => (
              <span key={type} className="hs-popover-tag">{count} {typeLabel(type)}</span>
            ))}
          </div>
        )}
        <div className="hs-popover-items">
          {hotspot.items.slice(0, 4).map((item, idx) => (
            <a key={item.id || idx} className="hs-popover-item" href={item.url} target="_blank" rel="noopener noreferrer">
              <span className="hs-popover-item-title">{item.title || 'Untitled'}</span>
              <span className="hs-popover-item-meta">{item.sourceName || item.source} &middot; {timeAgo(item.publishedAt)}</span>
            </a>
          ))}
        </div>
        {hotspot.items.length > 4 && (
          <button className="hs-popover-more" onClick={onOpenInPanel}>
            View all {hotspot.count} items
          </button>
        )}
      </div>
      <div className="hs-popover-arrow" />
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
      className="hs-panel"
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        zIndex: 1001,
        cursor: isDragging ? 'grabbing' : 'default'
      }}
      onMouseDown={handleDragStart}
    >
      <div className="hs-panel-head" style={{ cursor: 'grab' }}>
        <div>
          <h3 className="hs-panel-title">{hotspot.name}</h3>
          <div className="hs-panel-subtitle">{hotspot.count} items</div>
        </div>
        <button className="hs-popover-close" onClick={onClose} aria-label="Close">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
      </div>
      <div className="hs-panel-content">
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
  { id: 'dune', label: 'Dune', swatch: '#e0a020' },
  { id: 'ruby', label: 'Ruby', swatch: '#e03050' },
  { id: 'terra', label: 'Terra', swatch: '#30c050' },
];

// Chat Panel Component (sidebar inline)
function ChatPanel({ chatId }) {
  const { messages, loading, error, sending, send } = useChat(chatId || 'global');
  const { user, isAuthenticated } = useAuth();
  const [draft, setDraft] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!draft.trim() || sending) return;
    const text = draft;
    setDraft('');
    await send(text);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="chat-panel">
        <div className="chat-login-prompt">
          <p>Sign in to join the chat</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-panel">
      <div className="chat-messages">
        {loading && messages.length === 0 && (
          <div className="chat-loading">Loading messages...</div>
        )}
        {error && (
          <div className="chat-error">{error}</div>
        )}
        {!loading && messages.length === 0 && !error && (
          <div className="chat-empty">No messages yet. Start the conversation!</div>
        )}
        {messages.map((msg) => {
          const isOwn = msg.sender_id === user?.uid;
          return (
            <div key={msg.id} className={`chat-msg ${isOwn ? 'chat-msg-own' : ''}`}>
              <div className="chat-msg-header">
                <span className="chat-msg-sender">{isOwn ? 'You' : (msg.sender_display_name || 'Anonymous')}</span>
                <span className="chat-msg-time">{msg.created_at ? timeAgo(msg.created_at.toDate ? msg.created_at.toDate() : msg.created_at) : ''}</span>
              </div>
              <div className="chat-msg-body">{msg.message}</div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      <div className="chat-input-row">
        <input
          type="text"
          className="chat-input"
          placeholder="Type a message..."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={sending}
          maxLength={500}
        />
        <button
          className="chat-send-btn"
          onClick={handleSend}
          disabled={sending || !draft.trim()}
          aria-label="Send message"
        >
          {sending ? '...' : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

const getInitialNavCollapsed = () => {
  if (typeof window === 'undefined') return false;
  const stored = window.localStorage.getItem('navCollapsed');
  if (stored === 'true' || stored === 'false') return stored === 'true';
  return window.innerWidth < 1100;
};

const VISUAL_LAYER_DEFAULTS = {
  atmosphere: false,
  earthGlow: true,
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
  const { user, profile, loading: authLoading } = useAuth();
  const { t, lang, setLang, languages: supportedLanguages } = useI18n();

  // View state machine: 'world' | 'region' | 'hotspot'
  const [viewMode, setViewMode] = useState('world');
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedHotspotId, setSelectedHotspotId] = useState(null);
  const [theme, setTheme] = useState(getStoredTheme);
  const [activePage, setActivePage] = useState(null);
  const [showAccount, setShowAccount] = useState(false);
  const [navCollapsed, setNavCollapsed] = useState(getInitialNavCollapsed);

  // Settings persistence — restores theme/layout from Firestore after login.
  // onThemeRestored syncs the Firestore theme into local state without flicker.
  const { saveTheme, saveDesktopPreferences } = useSettings({
    onThemeRestored: (restoredTheme) => setTheme(restoredTheme),
  });

  // Country panel hook
  const {
    countryPanel,
    currencyData,
    currencyLoading,
    approvalData,
    approvalLoading,
    economicData,
    economicLoading,
    marketData,
    marketLoading,
    openCountryPanel,
    openStatePanel,
    openProvincePanel,
    openIndiaStatePanel,
    openRUOblastPanel,
    openUKNationPanel,
    openEUPanel,
    closeCountryPanel,
  } = useCountryPanel();

  // Temperature unit: 'F' (default) or 'C'
  const [tempUnit, setTempUnit] = useState('F');

  // Weather for the currently open country panel (fetches by capital city)
  const weatherCity = countryPanel.open ? countryPanel.data?.capital : null;
  const { weather: panelWeather, loading: panelWeatherLoading } = useWeather(weatherCity);

  // Sidebar state
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [sidebarTab, setSidebarTab] = useState('world');
  const [sidebarTabOrder, setSidebarTabOrder] = useState([
    { id: 'world', label: 'World' },
    { id: 'overlays', label: 'Overlays' },
    { id: 'sources', label: 'Sources' },
    { id: 'themes', label: 'Themes' },
    { id: 'settings', label: 'Settings' },
  ]);
  const [chatOpen, setChatOpen] = useState(false);
  const dragTabRef = useRef(null);
  // Collapsible sidebar sections — only 'live-data' open by default for a clean start
  const [openSections, setOpenSections] = useState(new Set(['live-data']));
  const [panelOpacity, setPanelOpacity] = useState(0.75);
  const [textSize, setTextSize] = useState('medium'); // 'small' | 'medium' | 'large'
  const [showNewsTicker, setShowNewsTicker] = useState(true);
  const [drawerStates, setDrawerStates] = useState({});
  const [minimizedDrawers, setMinimizedDrawers] = useState(new Set());
  const dragInfoRef = useRef(null);

  const toggleMinimize = useCallback((id) => {
    setMinimizedDrawers(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  // Each drawer gets a unique position so they don't overlap
  const DRAWER_POSITIONS = {
    'live-data':    { top: 42, left: 12 },
    'us-politics':  { top: 42, left: 360 },
    'conflicts':    { top: 42, right: 12 },
    'intel':        { top: 260, left: 12 },
    'disasters':    { top: 260, left: 360 },
    'env-tech':     { top: 260, right: 12 },
    'trade':        { bottom: 80, left: 12 },
    'migration':    { bottom: 80, left: 360 },
    'geopolitical': { bottom: 80, right: 12 },
    'lifestyle':    { bottom: 300, right: 12 },
  };

  const toggleSection = (id) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ─── Text Size ───
  useEffect(() => {
    document.documentElement.setAttribute('data-text-size', textSize);
  }, [textSize]);

  // ─── Drawer Drag & Resize ───
  const startDrawerDrag = useCallback((e, drawerId, action) => {
    e.preventDefault();
    e.stopPropagation();
    const el = e.target.closest('.snap-zone-drawer');
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const containerRect = mapContainerRef.current?.getBoundingClientRect() || { left: 0, top: 0 };
    dragInfoRef.current = {
      drawerId, action, el,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startLeft: rect.left - containerRect.left,
      startTop: rect.top - containerRect.top,
      startW: rect.width,
      startH: rect.height,
      currentLeft: null, currentTop: null, currentW: null, currentH: null,
    };
    document.body.style.userSelect = 'none';
    document.body.style.cursor =
      action === 'move' ? 'grabbing' :
      action === 'nw' || action === 'se' ? (action === 'nw' ? 'nw-resize' : 'se-resize') :
      action === 'ne' || action === 'sw' ? (action === 'ne' ? 'ne-resize' : 'sw-resize') :
      action === 'n' || action === 's' ? 'ns-resize' : 'ew-resize';
  }, []);

  useEffect(() => {
    const onMove = (e) => {
      const d = dragInfoRef.current;
      if (!d) return;
      const dx = e.clientX - d.startMouseX;
      const dy = e.clientY - d.startMouseY;
      let l = d.startLeft, t = d.startTop, w = d.startW, h = d.startH;
      if (d.action === 'move') { l += dx; t += dy; }
      else {
        if (d.action.includes('e')) w = Math.max(200, d.startW + dx);
        if (d.action.includes('w')) { w = Math.max(200, d.startW - dx); l = d.startLeft + d.startW - w; }
        if (d.action.includes('s')) h = Math.max(80, d.startH + dy);
        if (d.action.includes('n')) { h = Math.max(80, d.startH - dy); t = d.startTop + d.startH - h; }
      }
      d.el.style.left = l + 'px';
      d.el.style.top = t + 'px';
      d.el.style.right = 'auto';
      d.el.style.bottom = 'auto';
      d.el.style.width = w + 'px';
      if (d.action !== 'move') { d.el.style.height = h + 'px'; d.el.style.maxHeight = 'none'; }
      d.currentLeft = l; d.currentTop = t; d.currentW = w;
      d.currentH = d.action !== 'move' ? h : null;
    };
    const onUp = () => {
      const d = dragInfoRef.current;
      if (!d) return;
      if (d.currentLeft != null) {
        setDrawerStates(prev => {
          const existing = prev[d.drawerId] || {};
          return {
            ...prev,
            [d.drawerId]: {
              x: d.currentLeft, y: d.currentTop,
              w: d.currentW ?? existing.w ?? d.startW,
              h: d.action === 'move' ? (existing.h ?? null) : (d.currentH ?? null),
            }
          };
        });
      }
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      dragInfoRef.current = null;
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
  }, []);

  // ─── Preset Profiles ───
  const PRESETS = [
    {
      id: 'clean',
      label: 'Clean',
      desc: 'News + protests only',
      apply: () => {
        setStabilityMode(true); setShowProtestHeatmap(true);
        setShowMilitaryOverlay(false); setShowRefugeePanel(false);
        setConflictMode(false); setActiveConflicts({});
        setElectionMode(false); setShowTariffHeatmap(false); setShowUSBases(false);
        setShowBriefingPanel(false); setShowTensionPanel(false); setShowCountryRiskMode(false); setShowCountryRiskPanel(false); setShowNarrativePanel(false);
        setShowHealthPanel(false); setShowCyberPanel(false); setShowCourtPanel(false); setShowSanctionsPanel(false); setShowInfrastructurePanel(false); setShowNuclearPanel(false);
        setShowClimatePanel(false); setShowAiTechPanel(false);
        setShowCommoditiesPanel(false); setShowShippingMode(false);
        setShowWatchlistPanel(false); setShowDemographicPanel(false);
        setShowRegimePanel(false); setShowAlliancePanel(false); setShowLeadershipPanel(false); setShowTimeline(false);
        setOpenSections(new Set(['live-data']));
      },
    },
    {
      id: 'conflict',
      label: 'Conflict',
      desc: 'Wars, military, tensions',
      apply: () => {
        setStabilityMode(true); setShowProtestHeatmap(true); setShowMilitaryOverlay(true); setShowRefugeePanel(true);
        setConflictMode(true); setConflictShowTroops(true);
        setShowTensionPanel(true); setShowCountryRiskMode(true); setShowCountryRiskPanel(true); setShowNuclearPanel(true);
        setShowSanctionsPanel(true);
        setOpenSections(new Set(['live-data', 'conflicts', 'intel']));
      },
    },
    {
      id: 'markets',
      label: 'Markets',
      desc: 'Trade, commodities, shipping',
      apply: () => {
        setShowTariffHeatmap(true); setShowCommoditiesPanel(true);
        setShowShippingMode(true); setShowShippingPanel(true);
        setShowSanctionsPanel(true);
        setConflictMode(false); setActiveConflicts({});
        setShowMilitaryOverlay(false);
        setOpenSections(new Set(['live-data', 'us-politics', 'trade']));
      },
    },
    {
      id: 'everything',
      label: 'Everything',
      desc: 'All layers on',
      apply: () => {
        setStabilityMode(true); setShowProtestHeatmap(true); setShowMilitaryOverlay(true); setShowRefugeePanel(true);
        setConflictMode(true); setConflictShowTroops(true);
        setElectionMode(true); setShowTariffHeatmap(true); setShowUSBases(true);
        setShowBriefingPanel(true); setShowTensionPanel(true); setShowCountryRiskMode(true); setShowCountryRiskPanel(true); setShowNarrativePanel(true);
        setShowHealthPanel(true); setShowCyberPanel(true); setShowCourtPanel(true); setShowSanctionsPanel(true); setShowInfrastructurePanel(true); setShowNuclearPanel(true);
        setShowClimatePanel(true); setShowAiTechPanel(true);
        setShowCommoditiesPanel(true); setShowShippingMode(true);
        setShowWatchlistPanel(true); setShowDemographicPanel(true);
        setShowRegimePanel(true); setShowAlliancePanel(true); setShowLeadershipPanel(true);
        setOpenSections(new Set(['live-data', 'us-politics', 'conflicts', 'intel', 'disasters', 'env-tech', 'trade', 'migration', 'geopolitical', 'lifestyle']));
      },
    },
  ];

  const [showTimezones, setShowTimezones] = useState(false);
  const [selectedCapital, setSelectedCapital] = useState(null);
  const [useGlobe, setUseGlobe] = useState(true);
  const [projectionTransition, setProjectionTransition] = useState(null); // null | 'to-2d' | 'to-3d'
  const [autoRotate, setAutoRotate] = useState(true);
  const [rotateSpeed, setRotateSpeed] = useState(0.06);
  const [rotateCCW, setRotateCCW] = useState(false);
  const [mapControlsCollapsed, setMapControlsCollapsed] = useState(false);
  const [mapControlsPos, setMapControlsPos] = useState(null); // null = default CSS position
  const mapControlsDragRef = useRef(null);
  const [holoMode, setHoloMode] = useState(true);
  const [transparentGlobe, setTransparentGlobe] = useState(false);
  const mapCenterRef = useRef({ lng: 0, lat: 20 });
  const [musicPlaying, setMusicPlaying] = useState(true);
  const [musicVolume, setMusicVolume] = useState(0.5);
  const [visualLayers, setVisualLayers] = useState(getInitialVisualLayers);
  const [conflictMode, setConflictMode] = useState(false);
  const [conflictPanelOpen, setConflictPanelOpen] = useState(false);
  const [conflictShowTroops, setConflictShowTroops] = useState(false);
  // ─── Additional conflict modes ───
  const [activeConflicts, setActiveConflicts] = useState({});
  const [conflictPanels, setConflictPanels] = useState({});
  const [conflictTroops, setConflictTroops] = useState({});
  const [conflictLegends, setConflictLegends] = useState({});
  const ADDITIONAL_CONFLICTS = [
    { id: 'israel-gaza', label: 'Israel\u2013Gaza War', data: israelGazaData },
    { id: 'sudan', label: 'Sudan Civil War', data: sudanData },
    { id: 'myanmar', label: 'Myanmar Civil War', data: myanmarData },
    { id: 'yemen', label: 'Yemen / Houthi Crisis', data: yemenData },
    { id: 'ethiopia', label: 'Ethiopia Conflicts', data: ethiopiaData },
    { id: 'drc', label: 'Eastern Congo (M23)', data: drcData },
    { id: 'iran-israel', label: 'Twelve Day War', data: iranIsraelData },
    { id: 'india-pakistan', label: 'India\u2013Pakistan Crisis', data: indiaPakistanData },
    { id: 'sahel', label: 'Sahel Insurgency', data: sahelData },
  ];
  const [showUSStates, setShowUSStates] = useState(false);
  const [showCAProvinces, setShowCAProvinces] = useState(false);
  const [showINStates, setShowINStates] = useState(false);
  const [showRUOblasts, setShowRUOblasts] = useState(false);
  const [showUKNations, setShowUKNations] = useState(false);
  const [showEUCountries, setShowEUCountries] = useState(false);
  const [mapZoom, setMapZoom] = useState(2);
  const [showTariffHeatmap, setShowTariffHeatmap] = useState(false);
  const [electionMode, setElectionMode] = useState(false);
  const [electionPanel, setElectionPanel] = useState({ open: false, state: null, pos: { x: 160, y: 120 } });


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
  const hoveredINStateIdRef = useRef(null);
  const hoveredRUOblastIdRef = useRef(null);
  const hoveredUKNationIdRef = useRef(null);
  const hoveredEUIdRef = useRef(null);

  // News panel state
  const [newsPanelHotspot, setNewsPanelHotspot] = useState(null);
  const [newsPanelPosition, setNewsPanelPosition] = useState(null);


  // Tooltip — ref-based to avoid React re-renders on every mousemove
  const tooltipRef = useRef(null);
  const tooltipDataRef = useRef({ show: false, text: '', x: 0, y: 0 });
  const setTooltip = useCallback((val) => {
    const el = tooltipRef.current;
    const prev = tooltipDataRef.current;
    tooltipDataRef.current = val;
    if (!el) return;
    if (val.show) {
      el.style.display = '';
      el.style.left = val.x + 'px';
      el.style.top = val.y + 'px';
      if (val.text !== prev.text) el.textContent = val.text;
    } else {
      el.style.display = 'none';
    }
  }, []);

  // Multi-instance panel support (allows opening multiple country panels, etc.)
  const {
    panels: extraPanels,
    openPanel: openExtraPanel,
    closePanel: closeExtraPanel,
    bringToFront: bringExtraPanelToFront,
  } = useMultiPanel();

  // Layer toggles (flights disabled by default)
  const [enabledLayers, setEnabledLayers] = useState({
    news: true,
    twitter: true,
    reddit: true,
    flights: false,
    severeWeather: false,
  });
  const [showSeverePanel, setShowSeverePanel] = useState(false);
  const [selectedSevereEventId, setSelectedSevereEventId] = useState(null);

  // Stability state (protests, military, instability)
  const [stabilityMode, setStabilityMode] = useState(true);
  const [showProtestHeatmap, setShowProtestHeatmap] = useState(true);
  const [showMilitaryOverlay, setShowMilitaryOverlay] = useState(false);
  const [showStabilityPanel, setShowStabilityPanel] = useState(false);
  const [showUSBases, setShowUSBases] = useState(false);

  const { feed, loading: feedLoading, error: feedError } = useFeed(80);
  const { flights, loading: flightsLoading, error: flightsError } = useFlights(enabledLayers.flights);
  const {
    events: severeEvents,
    loading: severeLoading,
    refresh: refreshSevere,
  } = useSevereWeather(enabledLayers.severeWeather);

  const {
    data: stabilityData,
    loading: stabilityLoading,
    refresh: refreshStability,
  } = useStability(stabilityMode);

  // Indian states GeoJSON (lazy-loaded)
  const { data: indiaStatesGeoJSON } = useIndiaStates(showINStates);
  // Russian oblasts GeoJSON (lazy-loaded)
  const { data: ruOblastsGeoJSON } = useRussianOblasts(showRUOblasts);
  // UK nations GeoJSON (lazy-loaded)
  const { data: ukNationsGeoJSON } = useUKNations(showUKNations);

  // ── New feature state ──
  const [showHealthPanel, setShowHealthPanel] = useState(false);
  const [showCyberPanel, setShowCyberPanel] = useState(false);
  const [showCommoditiesPanel, setShowCommoditiesPanel] = useState(false);
  const [showRefugeePanel, setShowRefugeePanel] = useState(false);
  const [showShippingMode, setShowShippingMode] = useState(false);
  const [showShippingPanel, setShowShippingPanel] = useState(false);
  const [showTensionPanel, setShowTensionPanel] = useState(false);
  const [showBriefingPanel, setShowBriefingPanel] = useState(false);
  const [showCourtPanel, setShowCourtPanel] = useState(false);
  const [showSanctionsPanel, setShowSanctionsPanel] = useState(false);
  const [showCountryRiskPanel, setShowCountryRiskPanel] = useState(false);
  const [showCountryRiskMode, setShowCountryRiskMode] = useState(false);
  const [showWatchlistPanel, setShowWatchlistPanel] = useState(false);
  const [showNarrativePanel, setShowNarrativePanel] = useState(false);
  const [showRegimePanel, setShowRegimePanel] = useState(false);
  const [showAlliancePanel, setShowAlliancePanel] = useState(false);
  const [showInfrastructurePanel, setShowInfrastructurePanel] = useState(false);
  const [showDemographicPanel, setShowDemographicPanel] = useState(false);
  const [showCredibilityPanel, setShowCredibilityPanel] = useState(false);
  const [showLeadershipPanel, setShowLeadershipPanel] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [showClimatePanel, setShowClimatePanel] = useState(false);
  const [showNuclearPanel, setShowNuclearPanel] = useState(false);
  const [showAiTechPanel, setShowAiTechPanel] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [sidebarSearchQuery, setSidebarSearchQuery] = useState('');
  const [sidebarSearchFocused, setSidebarSearchFocused] = useState(false);
  const sidebarSearchRef = useRef(null);

  // ── New data hooks ──
  const { data: disasterData, loading: disasterLoading, refresh: refreshDisasters } = useDisasters(enabledLayers.severeWeather || showTimeline);
  const { data: cyberData, loading: cyberLoading, refresh: refreshCyber } = useCyber(showCyberPanel || showTimeline);
  const { data: healthData, loading: healthLoading, refresh: refreshHealth } = useHealth(showHealthPanel);
  const { data: commoditiesData, loading: commoditiesLoading, refresh: refreshCommodities } = useCommodities(showCommoditiesPanel);
  const { data: shippingData, loading: shippingLoading, refresh: refreshShipping } = useShipping(showShippingMode);
  const { data: tensionData, loading: tensionLoading, refresh: refreshTension } = useTension(true);
  const { data: briefingData, loading: briefingLoading, refresh: refreshBriefing } = useBriefing(showBriefingPanel);
  const { data: countryRiskData, loading: countryRiskLoading, refresh: refreshCountryRisk } = useCountryRisk(showCountryRiskMode);
  const { data: refugeeData, loading: refugeeLoading, refresh: refreshRefugees } = useRefugees(showRefugeePanel);
  const { data: courtData, loading: courtLoading, refresh: refreshCourt } = useCourt(showCourtPanel);
  const { data: sanctionsData, loading: sanctionsLoading, refresh: refreshSanctions } = useSanctions(showSanctionsPanel);
  const { data: narrativeData, loading: narrativeLoading, refresh: refreshNarrative } = useNarrative(showNarrativePanel);
  const { data: regimeData, loading: regimeLoading, refresh: refreshRegime } = useRegime(showRegimePanel);
  const { data: allianceData, loading: allianceLoading, refresh: refreshAlliance } = useAlliance(showAlliancePanel);
  const { data: infrastructureData, loading: infrastructureLoading, refresh: refreshInfrastructure } = useInfrastructure(showInfrastructurePanel);
  const { data: demographicData, loading: demographicLoading, refresh: refreshDemographic } = useDemographic(showDemographicPanel);
  const { data: credibilityData, loading: credibilityLoading, refresh: refreshCredibility } = useCredibility(showTimeline);
  const { data: leadershipData, loading: leadershipLoading, refresh: refreshLeadership } = useLeadership(showLeadershipPanel || showTimeline);
  const { data: climateData, loading: climateLoading, refresh: refreshClimate } = useClimate(showClimatePanel);
  const { data: nuclearData, loading: nuclearLoading, refresh: refreshNuclear } = useNuclear(showNuclearPanel);
  const { data: aitechData, loading: aitechLoading, refresh: refreshAiTech } = useAiTech(showAiTechPanel);

  // Notifications system
  const notifications = useNotifications();

  const isLightTheme = theme === 'light-analytic';
  const isDuneTheme = theme === 'dune';
  const isRubyTheme = theme === 'ruby';
  const isTerraTheme = theme === 'terra';
  const isThemedDark = isDuneTheme || isRubyTheme || isTerraTheme; // non-default dark themes with custom earth styling
  // Helper: pick color by themed-dark variant (dune/ruby/terra), returns default for other dark themes
  const themedColor = (duneVal, rubyVal, terraVal, defaultVal) =>
    isDuneTheme ? duneVal : isRubyTheme ? rubyVal : isTerraTheme ? terraVal : defaultVal;

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onSearch: () => setShowCommandPalette(true),
    onEscape: () => {
      if (showCommandPalette) { setShowCommandPalette(false); return; }
      // Close the most recently opened panel
      const panelSetters = [
        [showShortcutsHelp, setShowShortcutsHelp],
        [showAiTechPanel, setShowAiTechPanel],
        [showNuclearPanel, setShowNuclearPanel],
        [showClimatePanel, setShowClimatePanel],
        [showLeadershipPanel, setShowLeadershipPanel],
        [showCredibilityPanel, setShowCredibilityPanel],
        [showDemographicPanel, setShowDemographicPanel],
        [showInfrastructurePanel, setShowInfrastructurePanel],
        [showAlliancePanel, setShowAlliancePanel],
        [showRegimePanel, setShowRegimePanel],
        [showNarrativePanel, setShowNarrativePanel],
        [showWatchlistPanel, setShowWatchlistPanel],
        [showCountryRiskPanel, setShowCountryRiskPanel],
        [showSanctionsPanel, setShowSanctionsPanel],
        [showCourtPanel, setShowCourtPanel],
        [showBriefingPanel, setShowBriefingPanel],
        [showTensionPanel, setShowTensionPanel],
        [showShippingPanel, setShowShippingPanel],
        [showRefugeePanel, setShowRefugeePanel],
        [showCommoditiesPanel, setShowCommoditiesPanel],
        [showCyberPanel, setShowCyberPanel],
        [showHealthPanel, setShowHealthPanel],
        [showStabilityPanel, setShowStabilityPanel],
        [showTimeline, setShowTimeline],
      ];
      for (const [isOpen, setter] of panelSetters) {
        if (isOpen) { setter(false); return; }
      }
      if (countryPanel.open) closeCountryPanel();
    },
    onHelp: () => setShowShortcutsHelp(prev => !prev),
    onToggleRotate: () => setAutoRotate(prev => !prev),
    onPrevTab: () => setSidebarTab(t => t === 'country' ? 'world' : t === 'timeline' ? 'country' : t === 'chat' ? 'timeline' : 'chat'),
    onNextTab: () => setSidebarTab(t => t === 'world' ? 'country' : t === 'country' ? 'timeline' : t === 'timeline' ? 'chat' : 'world'),
  });

  useEffect(() => {
    applyTheme(theme);
    window.localStorage.setItem('theme', theme);
  }, [theme, isLightTheme]);

  useEffect(() => {
    document.documentElement.style.setProperty('--nav-height', navCollapsed ? '22px' : '64px');
  }, [navCollapsed]);

  useEffect(() => {
    window.localStorage.setItem('navCollapsed', String(navCollapsed));
  }, [navCollapsed]);

  useEffect(() => {
    document.documentElement.classList.toggle('cp-panel-open', !!countryPanel.open);
  }, [countryPanel.open]);

  useEffect(() => {
    window.localStorage.setItem('visualLayers', JSON.stringify(visualLayers));
  }, [visualLayers]);

  const toggleVisualLayer = useCallback((key) => {
    setVisualLayers(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // Animated projection toggle — flash overlay, switch midway, then fade out
  const handleToggleGlobe = useCallback(() => {
    if (projectionTransition) return; // prevent double-click during animation
    const goingTo3D = !useGlobe;
    setProjectionTransition(goingTo3D ? 'to-3d' : 'to-2d');
    // Switch projection midway through the animation
    setTimeout(() => setUseGlobe(prev => !prev), 250);
    // Clear transition state after animation completes
    setTimeout(() => setProjectionTransition(null), 700);
  }, [useGlobe, projectionTransition]);

  // Sync hillshade visibility to native style layer when toggle changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    try {
      if (map.getLayer('hillshade-layer')) {
        map.setLayoutProperty('hillshade-layer', 'visibility', visualLayers.hillshade ? 'visible' : 'none');
      }
    } catch {}
  }, [visualLayers.hillshade]);

  // Clean up hover states and update background on projection switch
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    try {
      // Clear stale hover feature states
      if (hoveredCountryIdRef.current !== null) {
        map.setFeatureState({ source: 'countries', id: hoveredCountryIdRef.current }, { hover: false });
        hoveredCountryIdRef.current = null;
      }
      if (hoveredStateIdRef.current !== null && map.getSource('us-states')) {
        map.setFeatureState({ source: 'us-states', id: hoveredStateIdRef.current }, { hover: false });
        hoveredStateIdRef.current = null;
      }
      if (hoveredProvinceIdRef.current !== null && map.getSource('ca-provinces')) {
        map.setFeatureState({ source: 'ca-provinces', id: hoveredProvinceIdRef.current }, { hover: false });
        hoveredProvinceIdRef.current = null;
      }
      if (hoveredINStateIdRef.current !== null && map.getSource('in-states')) {
        map.setFeatureState({ source: 'in-states', id: hoveredINStateIdRef.current }, { hover: false });
        hoveredINStateIdRef.current = null;
      }
      if (hoveredRUOblastIdRef.current !== null && map.getSource('ru-oblasts')) {
        map.setFeatureState({ source: 'ru-oblasts', id: hoveredRUOblastIdRef.current }, { hover: false });
        hoveredRUOblastIdRef.current = null;
      }
      if (hoveredUKNationIdRef.current !== null && map.getSource('uk-nations')) {
        map.setFeatureState({ source: 'uk-nations', id: hoveredUKNationIdRef.current }, { hover: false });
        hoveredUKNationIdRef.current = null;
      }
      if (hoveredEUIdRef.current !== null && map.getSource('eu-countries')) {
        for (let i = 0; i < EU_FEATURE_COUNT; i++) {
          map.setFeatureState({ source: 'eu-countries', id: i }, { hover: false });
        }
        hoveredEUIdRef.current = null;
      }
      // Update background color without triggering full style reload
      if (map.getLayer('background')) {
        const bg = isLightTheme ? '#3a7ab0'
          : isThemedDark ? themedColor('#0e0a04', '#0c0408', '#040c06', '#060e18')
          : (holoMode ? '#020810' : '#060e18');
        map.setPaintProperty('background', 'background-color', bg);
      }
    } catch {}
  }, [useGlobe, isLightTheme, isThemedDark, isDuneTheme, isRubyTheme, isTerraTheme, holoMode]);

  // Disable MapLibre's built-in atmosphere (it's directional/one-sided).
  // The uniform halo is rendered by EarthOverlay instead.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    try { map.setSky({ 'atmosphere-blend': 0 }); } catch {}
  }, [mapLoaded]);

  // Starfield — WebGL custom layer rendered directly in the map's pipeline
  useStarfield(mapRef.current, useGlobe && mapLoaded);

  // ── Keyboard Navigation ──
  useEffect(() => {
    const handleKeyboard = (e) => {
      // Don't intercept when typing in inputs
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
      // Ctrl/Cmd shortcuts
      if (e.ctrlKey || e.metaKey) return;

      switch (e.key) {
        case '1': setShowBriefingPanel(p => !p); break;
        case '2': setShowTensionPanel(p => !p); break;
        case '3': setShowCountryRiskPanel(p => !p); setShowCountryRiskMode(true); break;
        case '4': setShowCommoditiesPanel(p => !p); break;
        case '5': toggleLayer('severeWeather'); break;
        case '6': setShowCyberPanel(p => !p); break;
        case '7': setShowShippingMode(p => { if (!p) setShowShippingPanel(true); return !p; }); break;
        case '0': setShowWatchlistPanel(p => !p); break;
        case 'Escape':
          setPopoverHotspot(null);
          setNewsPanelHotspot(null);
          break;
        default: break;
      }
    };
    document.addEventListener('keydown', handleKeyboard);
    return () => document.removeEventListener('keydown', handleKeyboard);
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

  // Close election panel when election mode is turned off
  useEffect(() => {
    if (!electionMode) {
      setElectionPanel({ open: false, state: null, pos: { x: 160, y: 120 } });
    }
  }, [electionMode]);

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

  const countriesGeoJSON = useMemo(() => ({
    type: 'FeatureCollection',
    features: GEO_FEATURES
      .filter((f) => {
        const name = f.properties?.name || '';
        return !(String(f.id).padStart(3, '0') === '010' || name === 'Antarctica');
      })
      .map((f, i) => {
        const name = f.properties?.name || `Country ${i}`;
        const tariffRate = getUniversalRate(name);
        return {
          type: 'Feature',
          id: i,
          geometry: f.geometry,
          properties: {
            name,
            originalId: String(f.id),
            isEU: EU_MEMBER_NAMES.has(name),
            fillColor: getCountryFillColor(name, i, theme),
            tariffColor: isLightTheme ? getTariffColorLight(tariffRate) : getTariffColor(tariffRate),
            tariffRate,
          },
        };
      }),
  }), [theme]);

  const usStatesGeoJSON = useMemo(() => ({
    type: 'FeatureCollection',
    features: US_STATE_FEATURES.map((f, i) => {
      const name = f.properties?.name || `State ${i}`;
      return {
        type: 'Feature',
        id: i,
        geometry: f.geometry,
        properties: {
          name,
          originalId: String(f.id),
          electionColor: getElectionColor(name),
          hasElection: hasElectionRaces(name),
        },
      };
    }),
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

  const euCountriesGeoJSON = useMemo(() => {
    const euFeatures = GEO_FEATURES.filter((f) => {
      const name = f.properties?.name;
      return name && EU_MEMBER_NAMES.has(name);
    });
    return {
      type: 'FeatureCollection',
      features: euFeatures.map((f, i) => ({
        type: 'Feature',
        id: i,
        geometry: f.geometry,
        properties: {
          name: f.properties?.name || `EU Country ${i}`,
          originalId: String(f.id),
        },
      })),
    };
  }, []);

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

  // Aggregate events from all data sources for the TimelineNavigator
  const timelineEvents = useMemo(() => {
    const events = [];
    let id = 0;
    // Tension conflicts — use updatedAt (last refresh) as date, not c.since
    // (c.since is the conflict start year, often years ago, outside timeline range)
    if (tensionData?.activeConflicts) {
      const conflictDate = tensionData.updatedAt || new Date().toISOString();
      for (const c of tensionData.activeConflicts) {
        events.push({
          id: `conflict-${id++}`,
          title: c.name || c.label,
          date: conflictDate,
          category: 'conflict',
          severity: c.nuclearRisk === 'elevated' || c.nuclearRisk === 'high' ? 3 : c.intensity >= 70 ? 3 : c.intensity >= 40 ? 2 : 1,
          country: c.region || c.parties?.[0],
          lat: c.lat,
          lon: c.lon,
        });
      }
    }
    // Tension flashpoints
    if (tensionData?.flashpoints) {
      for (const f of tensionData.flashpoints) {
        events.push({
          id: `flash-${id++}`,
          title: f.name || f.label,
          date: tensionData.updatedAt || new Date().toISOString(),
          category: 'conflict',
          severity: f.nuclear ? 3 : f.tension >= 70 ? 3 : f.tension >= 40 ? 2 : 1,
          country: f.category || f.parties?.[0],
          lat: f.lat,
          lon: f.lon,
        });
      }
    }
    // Disaster events (EONET active events + ReliefWeb recent disasters)
    const allDisasters = [
      ...(disasterData?.activeEvents || []),
      ...(disasterData?.recentDisasters || []),
    ];
    for (const ev of allDisasters) {
      events.push({
        id: `disaster-${id++}`,
        title: ev.title || ev.name,
        date: ev.date || disasterData?.lastUpdated || new Date().toISOString(),
        category: 'disaster',
        severity: ev.severity === 'critical' ? 3 : ev.severity === 'high' ? 2 : 1,
        country: ev.country || ev.region,
        lat: ev.lat,
        lon: ev.lon,
      });
    }
    // Cyber incidents
    if (cyberData?.incidents) {
      for (const inc of cyberData.incidents) {
        events.push({
          id: `cyber-${id++}`,
          title: inc.title || inc.name,
          date: inc.date || inc.publishedAt || new Date().toISOString(),
          category: 'cyber',
          severity: inc.severity === 'critical' ? 3 : inc.severity === 'high' ? 2 : 1,
          country: inc.country,
        });
      }
    }
    // Leadership change alerts
    if (leadershipData?.changeAlerts) {
      for (const alert of leadershipData.changeAlerts) {
        events.push({
          id: `leader-${id++}`,
          title: `${alert.country}: ${alert.description || alert.type}`,
          date: alert.detectedAt || new Date().toISOString(),
          category: 'politics',
          severity: alert.severity === 'critical' ? 3 : alert.severity === 'high' ? 2 : 1,
          country: alert.country,
        });
      }
    }
    // Credibility manipulation alerts
    if (credibilityData?.manipulationAlerts) {
      for (const alert of credibilityData.manipulationAlerts) {
        events.push({
          id: `manip-${id++}`,
          title: alert.title || alert.pattern,
          date: alert.detectedAt || new Date().toISOString(),
          category: 'politics',
          severity: alert.severity === 'critical' ? 3 : alert.severity === 'high' ? 2 : 1,
        });
      }
    }
    return events.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [tensionData, disasterData, cyberData, leadershipData, credibilityData]);

  // MapLibre style — basemap baked in for reliable globe rendering
  // NOTE: useGlobe is NOT a dependency — background is updated via map API
  // to avoid full style reloads on projection switch
  const mapStyle = useMemo(() => {
    let bgColor;
    // TNO-inspired: midnight blue ocean, cool and muted
    if (isLightTheme) {
      bgColor = '#488FACFB';
    } else if (isThemedDark) {
      bgColor = themedColor('#0e0a04', '#0c0408', '#040c06', '#060e18');
    } else {
      bgColor = holoMode ? '#020810' : '#060e18';
    }

    // Positron basemap desaturated and heavily darkened — provides subtle
    // terrain texture (rivers, coastlines, mountains) without its own colors
    const basemapUrl = isLightTheme
      ? 'https://basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png'
      : 'https://basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png';

    let basemapPaint;
    if (isLightTheme) {
      basemapPaint = { 'raster-opacity': 0.55, 'raster-saturation': -0.5 };
    } else if (isThemedDark) {
      basemapPaint = {
        'raster-opacity': 0.22,
        'raster-brightness-max': 0.30,
        'raster-saturation': -0.8,
        'raster-contrast': 0.10,
        'raster-hue-rotate': themedColor(30, -10, 90, 0),
      };
    } else {
      basemapPaint = {
        'raster-opacity': 0.18,
        'raster-brightness-max': 0.35,
        'raster-saturation': -1,
        'raster-contrast': 0.15,
      };
    }

    let hillshadePaint;
    if (isThemedDark) {
      hillshadePaint = {
        'hillshade-exaggeration': 0.35,
        'hillshade-shadow-color': themedColor('rgba(10,5,0,0.35)', 'rgba(10,0,2,0.35)', 'rgba(0,5,2,0.35)', 'rgba(0,0,10,0.3)'),
        'hillshade-highlight-color': themedColor('rgba(224,180,100,0.10)', 'rgba(224,100,120,0.10)', 'rgba(100,224,120,0.10)', 'rgba(180,200,230,0.08)'),
        'hillshade-accent-color': themedColor('rgba(20,12,4,0.15)', 'rgba(20,4,8,0.15)', 'rgba(4,20,8,0.15)', 'rgba(5,10,25,0.12)'),
        'hillshade-illumination-direction': 315,
      };
    } else {
      hillshadePaint = {
        'hillshade-exaggeration': 0.3,
        'hillshade-shadow-color': isLightTheme ? 'rgba(30,30,50,0.4)' : 'rgba(0,0,10,0.3)',
        'hillshade-highlight-color': isLightTheme ? 'rgba(255,255,255,0.3)' : 'rgba(180,200,230,0.08)',
        'hillshade-accent-color': isLightTheme ? 'rgba(50,50,70,0.15)' : 'rgba(5,10,25,0.12)',
        'hillshade-illumination-direction': 315,
      };
    }

    return {
      version: 8,
      name: 'monitoring',
      sources: {
        'basemap-tiles': {
          type: 'raster',
          tiles: [basemapUrl],
          tileSize: 256,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
        },
        'terrain-dem': {
          type: 'raster-dem',
          tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
          encoding: 'terrarium',
          tileSize: 256,
          maxzoom: 7,
        },
      },
      layers: [
        {
          id: 'background',
          type: 'background',
          paint: { 'background-color': bgColor },
        },
        {
          id: 'basemap-raster',
          type: 'raster',
          source: 'basemap-tiles',
          paint: basemapPaint,
        },
        {
          id: 'hillshade-layer',
          type: 'hillshade',
          source: 'terrain-dem',
          paint: hillshadePaint,
        },
      ],
      glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
    };
  }, [isLightTheme, isThemedDark, isDuneTheme, isRubyTheme, isTerraTheme, holoMode]);

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

  const selectedINStateFilter = useMemo(() => {
    if (selectedRegion?.type === 'inState' && selectedRegion.name) {
      return ['==', ['get', 'name'], selectedRegion.name];
    }
    return ['==', ['get', 'name'], '__none__'];
  }, [selectedRegion]);

  const selectedRUOblastFilter = useMemo(() => {
    if (selectedRegion?.type === 'ruOblast' && selectedRegion.name) {
      return ['==', ['get', 'name'], selectedRegion.name];
    }
    return ['==', ['get', 'name'], '__none__'];
  }, [selectedRegion]);

  const selectedUKNationFilter = useMemo(() => {
    if (selectedRegion?.type === 'ukNation' && selectedRegion.name) {
      return ['==', ['get', 'name'], selectedRegion.name];
    }
    return ['==', ['get', 'name'], '__none__'];
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
        if (hoveredStateIdRef.current !== null && map.getSource('us-states')) {
          map.setFeatureState({ source: 'us-states', id: hoveredStateIdRef.current }, { hover: false });
          hoveredStateIdRef.current = null;
        }
        if (hoveredProvinceIdRef.current !== null && map.getSource('ca-provinces')) {
          map.setFeatureState({ source: 'ca-provinces', id: hoveredProvinceIdRef.current }, { hover: false });
          hoveredProvinceIdRef.current = null;
        }
        if (hoveredINStateIdRef.current !== null && map.getSource('in-states')) {
          map.setFeatureState({ source: 'in-states', id: hoveredINStateIdRef.current }, { hover: false });
          hoveredINStateIdRef.current = null;
        }
        if (hoveredRUOblastIdRef.current !== null && map.getSource('ru-oblasts')) {
          map.setFeatureState({ source: 'ru-oblasts', id: hoveredRUOblastIdRef.current }, { hover: false });
          hoveredRUOblastIdRef.current = null;
        }
        if (hoveredUKNationIdRef.current !== null && map.getSource('uk-nations')) {
          map.setFeatureState({ source: 'uk-nations', id: hoveredUKNationIdRef.current }, { hover: false });
          hoveredUKNationIdRef.current = null;
        }
        if (hoveredEUIdRef.current !== null && map.getSource('eu-countries')) {
          for (let i = 0; i < EU_FEATURE_COUNT; i++) {
            map.setFeatureState({ source: 'eu-countries', id: i }, { hover: false });
          }
          hoveredEUIdRef.current = null;
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
    if (hoveredStateIdRef.current !== null && map.getSource('us-states')) {
      map.setFeatureState(
        { source: 'us-states', id: hoveredStateIdRef.current },
        { hover: false }
      );
      hoveredStateIdRef.current = null;
    }
    if (hoveredProvinceIdRef.current !== null && map.getSource('ca-provinces')) {
      map.setFeatureState(
        { source: 'ca-provinces', id: hoveredProvinceIdRef.current },
        { hover: false }
      );
      hoveredProvinceIdRef.current = null;
    }
    if (hoveredINStateIdRef.current !== null && map.getSource('in-states')) {
      map.setFeatureState(
        { source: 'in-states', id: hoveredINStateIdRef.current },
        { hover: false }
      );
      hoveredINStateIdRef.current = null;
    }
    if (hoveredRUOblastIdRef.current !== null && map.getSource('ru-oblasts')) {
      map.setFeatureState(
        { source: 'ru-oblasts', id: hoveredRUOblastIdRef.current },
        { hover: false }
      );
      hoveredRUOblastIdRef.current = null;
    }
    if (hoveredUKNationIdRef.current !== null && map.getSource('uk-nations')) {
      map.setFeatureState(
        { source: 'uk-nations', id: hoveredUKNationIdRef.current },
        { hover: false }
      );
      hoveredUKNationIdRef.current = null;
    }
    if (hoveredEUIdRef.current !== null && map.getSource('eu-countries')) {
      for (let i = 0; i < EU_FEATURE_COUNT; i++) {
        map.setFeatureState({ source: 'eu-countries', id: i }, { hover: false });
      }
      hoveredEUIdRef.current = null;
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
      } else if (sourceId === 'in-states' && feat.id !== undefined) {
        map.setFeatureState(
          { source: 'in-states', id: feat.id },
          { hover: true }
        );
        hoveredINStateIdRef.current = feat.id;
      } else if (sourceId === 'ru-oblasts' && feat.id !== undefined) {
        map.setFeatureState(
          { source: 'ru-oblasts', id: feat.id },
          { hover: true }
        );
        hoveredRUOblastIdRef.current = feat.id;
      } else if (sourceId === 'uk-nations' && feat.id !== undefined) {
        map.setFeatureState(
          { source: 'uk-nations', id: feat.id },
          { hover: true }
        );
        hoveredUKNationIdRef.current = feat.id;
      } else if (sourceId === 'eu-countries' && feat.id !== undefined) {
        // Highlight ALL EU country features for unified entity hover
        for (let i = 0; i < EU_FEATURE_COUNT; i++) {
          map.setFeatureState({ source: 'eu-countries', id: i }, { hover: true });
        }
        hoveredEUIdRef.current = -1; // sentinel: all highlighted
      }

      const tooltipName = sourceId === 'eu-countries'
        ? 'European Union'
        : (feat.properties?.name || 'Unknown');
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
    if (hoveredStateIdRef.current !== null && map.getSource('us-states')) {
      map.setFeatureState(
        { source: 'us-states', id: hoveredStateIdRef.current },
        { hover: false }
      );
      hoveredStateIdRef.current = null;
    }
    if (hoveredProvinceIdRef.current !== null && map.getSource('ca-provinces')) {
      map.setFeatureState(
        { source: 'ca-provinces', id: hoveredProvinceIdRef.current },
        { hover: false }
      );
      hoveredProvinceIdRef.current = null;
    }
    if (hoveredINStateIdRef.current !== null && map.getSource('in-states')) {
      map.setFeatureState(
        { source: 'in-states', id: hoveredINStateIdRef.current },
        { hover: false }
      );
      hoveredINStateIdRef.current = null;
    }
    if (hoveredRUOblastIdRef.current !== null && map.getSource('ru-oblasts')) {
      map.setFeatureState(
        { source: 'ru-oblasts', id: hoveredRUOblastIdRef.current },
        { hover: false }
      );
      hoveredRUOblastIdRef.current = null;
    }
    if (hoveredUKNationIdRef.current !== null && map.getSource('uk-nations')) {
      map.setFeatureState(
        { source: 'uk-nations', id: hoveredUKNationIdRef.current },
        { hover: false }
      );
      hoveredUKNationIdRef.current = null;
    }
    if (hoveredEUIdRef.current !== null && map.getSource('eu-countries')) {
      for (let i = 0; i < EU_FEATURE_COUNT; i++) {
        map.setFeatureState({ source: 'eu-countries', id: i }, { hover: false });
      }
      hoveredEUIdRef.current = null;
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

      // Auto-pause globe rotation when user clicks into a region
      if (sourceId && autoRotateRef.current) {
        setAutoRotate(false);
      }

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

          // If a country panel is already open, open this as an extra panel
          if (countryPanel.open && countryPanel.data?.name !== name) {
            openExtraPanel('country', { name, loading: true }, { position: { x, y } });
            // Also fetch full data for the extra panel
            openCountryPanel(name);
          } else {
            openCountryPanel(name);
          }
        }
      } else if (sourceId === 'us-states') {
        setSelectedRegion({ type: 'state', id: originalId, name });
        setViewMode('region');
        const stateInfo = US_STATE_INFO[name];
        if (stateInfo?.capitalCoords) {
          setSelectedCapital({ name: stateInfo.capital, lat: stateInfo.capitalCoords[0], lon: stateInfo.capitalCoords[1] });
        } else {
          setSelectedCapital(null);
        }

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

          if (electionMode && hasElectionRaces(name)) {
            setElectionPanel({ open: true, state: name, pos: { x, y } });
          } else {
            openStatePanel(name);
          }
        }
      } else if (sourceId === 'ca-provinces') {
        setSelectedRegion({ type: 'province', id: originalId, name });
        setViewMode('region');
        const provInfo = CA_PROVINCE_INFO[name] || CA_PROVINCE_INFO[name.replace(' Territory', '')];
        if (provInfo?.capitalCoords) {
          setSelectedCapital({ name: provInfo.capital, lat: provInfo.capitalCoords[0], lon: provInfo.capitalCoords[1] });
        } else {
          setSelectedCapital(null);
        }

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
          openProvincePanel(name);
        }
      } else if (sourceId === 'in-states') {
        const stateInfo = IN_STATE_INFO[name];
        if (stateInfo) {
          setSelectedRegion({ type: 'inState', id: originalId || name, name });
          setViewMode('region');
          if (stateInfo.capitalCoords) {
            setSelectedCapital({ name: stateInfo.capital, lat: stateInfo.capitalCoords[0], lon: stateInfo.capitalCoords[1] });
          } else {
            setSelectedCapital(null);
          }
          openIndiaStatePanel(name);
        }
      } else if (sourceId === 'ru-oblasts') {
        const oblastInfo = RU_OBLAST_INFO[name];
        if (oblastInfo) {
          setSelectedRegion({ type: 'ruOblast', id: originalId || name, name });
          setViewMode('region');
          if (oblastInfo.capitalCoords) {
            setSelectedCapital({ name: oblastInfo.capital, lat: oblastInfo.capitalCoords[0], lon: oblastInfo.capitalCoords[1] });
          } else {
            setSelectedCapital(null);
          }
          openRUOblastPanel(name);
        }
      } else if (sourceId === 'uk-nations') {
        const nationInfo = UK_NATION_INFO[name];
        if (nationInfo) {
          setSelectedRegion({ type: 'ukNation', id: originalId || name, name });
          setViewMode('region');
          if (nationInfo.capitalCoords) {
            setSelectedCapital({ name: nationInfo.capital, lat: nationInfo.capitalCoords[0], lon: nationInfo.capitalCoords[1] });
          } else {
            setSelectedCapital(null);
          }
          openUKNationPanel(name);
        }
      } else if (sourceId === 'eu-countries') {
        setSelectedRegion({ type: 'eu', id: 'EU', name: 'European Union' });
        setViewMode('region');
        setSelectedCapital(null);
        openEUPanel();
      }
    }, 250);
  }, [openCountryPanel, openStatePanel, openProvincePanel, openRUOblastPanel, openUKNationPanel, openEUPanel, showTariffHeatmap, electionMode]);

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
      const next = THEMES[(idx + 1) % THEMES.length].id;
      saveTheme(next);
      return next;
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
    setShowAccount(false);
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

    // Auto-pause globe rotation on double-click zoom
    if (autoRotateRef.current) {
      setAutoRotate(false);
    }

    // Zoom to click location — country-overview level (not too close)
    map.flyTo({
      center: [event.lngLat.lng, event.lngLat.lat],
      zoom: 4,
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
    // Smooth, Apple-Maps-like scroll zoom (slower = more controlled)
    const sh = evt.target.scrollZoom;
    if (sh) {
      sh.setWheelZoomRate(1 / 250);
      sh.setZoomRate(1 / 60);
    }
  }, []);

  // Track map center for globe hemisphere visibility check
  const lastZoomRef = useRef(2);
  const [mapCenter, setMapCenter] = useState({ lng: 0, lat: 20 });
  const mapCenterThrottleRef = useRef(null);
  const handleMapMove = useCallback((evt) => {
    const c = evt.viewState;
    if (c) {
      mapCenterRef.current = { lng: c.longitude, lat: c.latitude };
      // Throttled mapCenter state update (~200ms) for components that need reactive hemisphere filtering
      if (!mapCenterThrottleRef.current) {
        mapCenterThrottleRef.current = setTimeout(() => {
          mapCenterThrottleRef.current = null;
          setMapCenter({ lng: mapCenterRef.current.lng, lat: mapCenterRef.current.lat });
        }, 200);
      }
      // Only update zoom state when it changes meaningfully (avoids re-render every frame).
      // Round to nearest 0.5 — overlay components use integer thresholds (2, 3, etc.)
      // so finer resolution just causes unnecessary re-renders during smooth zoom.
      if (c.zoom !== undefined) {
        const rounded = Math.round(c.zoom * 2) / 2;
        if (rounded !== lastZoomRef.current) {
          lastZoomRef.current = rounded;
          setMapZoom(rounded);
        }
      }
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
    return cosAngle > 0.1; // tighter margin — cull before visual edge of globe
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

  return (
    <WindowManagerProvider>
    <>
    <div className={`app ${sidebarExpanded ? '' : 'sidebar-is-collapsed'}`}>
      <audio ref={audioRef} src="/suspense_music.mp3" loop preload="auto" />
      <Navbar
        title="monitr"
        logoSrc="/earth.png"
        activePage={activePage}
        onNavigate={handleNavigate}
        theme={theme}
        themes={THEMES}
        onToggleTheme={handleToggleTheme}
        onSetTheme={setTheme}
        useGlobe={useGlobe}
        onToggleGlobe={handleToggleGlobe}
        musicPlaying={musicPlaying}
        onToggleMusic={handleToggleMusic}
        musicVolume={musicVolume}
        onVolumeChange={handleVolumeChange}
        collapsed={navCollapsed}
        onToggleCollapse={handleToggleNav}
        onOpenAccount={() => { setShowAccount(true); setActivePage(null); }}
      />

      <div className="app-body">
        {/* Sidebar */}
        <div className={`sidebar ${sidebarExpanded ? 'expanded' : 'collapsed'}`} style={{ '--panel-opacity': panelOpacity }}>
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
              <div className="sidebar-search-wrapper">
                <div className="sidebar-search-container">
                  <svg className="sidebar-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    ref={sidebarSearchRef}
                    type="text"
                    className="sidebar-search-input"
                    placeholder="Search panels, conflicts..."
                    value={sidebarSearchQuery}
                    onChange={(e) => setSidebarSearchQuery(e.target.value)}
                    onFocus={() => setSidebarSearchFocused(true)}
                    onBlur={() => setTimeout(() => setSidebarSearchFocused(false), 200)}
                  />
                  {sidebarSearchQuery && (
                    <button className="sidebar-search-clear" onClick={() => { setSidebarSearchQuery(''); sidebarSearchRef.current?.focus(); }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  )}
                </div>
                {sidebarSearchFocused && sidebarSearchQuery.trim() && (() => {
                  const q = sidebarSearchQuery.toLowerCase();
                  const all = [
                    ...PANEL_INDEX.map(p => ({ ...p, category: 'Panel' })),
                    ...CONFLICT_INDEX.map(c => ({ ...c, category: 'Conflict' })),
                    ...COUNTRY_INDEX,
                  ];
                  const filtered = all.filter(item => `${item.label} ${item.keywords}`.toLowerCase().includes(q)).slice(0, 8);
                  if (!filtered.length) return (
                    <div className="sidebar-search-results">
                      <div className="sidebar-search-empty">No results</div>
                    </div>
                  );
                  return (
                    <div className="sidebar-search-results">
                      {filtered.map((item, i) => (
                        <button
                          key={`${item.category}-${item.id}-${i}`}
                          className="sidebar-search-result"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setSidebarSearchQuery('');
                            setSidebarSearchFocused(false);
                            if (item.category === 'Panel') {
                              const panelMap = {
                                health: setShowHealthPanel, cyber: setShowCyberPanel,
                                commodities: setShowCommoditiesPanel, refugees: setShowRefugeePanel,
                                shipping: () => { setShowShippingMode(true); setShowShippingPanel(true); },
                                sanctions: setShowSanctionsPanel, court: setShowCourtPanel,
                                stability: setShowStabilityPanel, tension: setShowTensionPanel,
                                briefing: setShowBriefingPanel, elections: () => setElectionMode(true),
                                climate: setShowClimatePanel, nuclear: setShowNuclearPanel, aitech: setShowAiTechPanel,
                              };
                              const setter = panelMap[item.id];
                              if (typeof setter === 'function') setter(true);
                            } else if (item.category === 'Conflict') {
                              if (item.id === 'ukraine-russia') {
                                setActiveConflicts(prev => ({ ...prev, 'ukraine-russia': true }));
                              } else {
                                setActiveConflicts(prev => ({ ...prev, [item.id]: true }));
                                setConflictPanels(prev => ({ ...prev, [item.id]: true }));
                              }
                            }
                          }}
                        >
                          <span className={`sidebar-search-badge sidebar-search-badge--${item.category.toLowerCase()}`}>
                            {item.category}
                          </span>
                          <span className="sidebar-search-label">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}
            {sidebarExpanded && (
              <div className="sidebar-tabs-row">
                <div className="sidebar-tabs" role="tablist" aria-label="Sidebar">
                  {sidebarTabOrder.map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      className={`sidebar-tab ${sidebarTab === tab.id ? 'active' : ''}`}
                      draggable
                      onDragStart={(e) => {
                        dragTabRef.current = tab.id;
                        e.currentTarget.classList.add('dragging');
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.add('drag-over');
                      }}
                      onDragLeave={(e) => {
                        e.currentTarget.classList.remove('drag-over');
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.remove('drag-over');
                        const from = dragTabRef.current;
                        const to = tab.id;
                        if (from && from !== to) {
                          setSidebarTabOrder(prev => {
                            const arr = [...prev];
                            const fromIdx = arr.findIndex(t => t.id === from);
                            const toIdx = arr.findIndex(t => t.id === to);
                            if (fromIdx === -1 || toIdx === -1) return prev;
                            const [moved] = arr.splice(fromIdx, 1);
                            arr.splice(toIdx, 0, moved);
                            return arr;
                          });
                        }
                        dragTabRef.current = null;
                      }}
                      onDragEnd={(e) => {
                        e.currentTarget.classList.remove('dragging');
                        dragTabRef.current = null;
                      }}
                      onClick={() => {
                        if (sidebarTab === tab.id) {
                          setSidebarExpanded(false);
                        } else {
                          setSidebarTab(tab.id);
                          setSidebarExpanded(true);
                        }
                      }}
                      role="tab"
                      aria-selected={sidebarTab === tab.id}
                    >
                      {tab.label}
                    </button>
                  ))}
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

            {/* ═══ Folder-Card Layer Grid ═══ */}
            {sidebarExpanded && sidebarTab === 'world' && (
              <div className="source-toggles">
                {/* ── Preset Tabs ── */}
                <div className="preset-tabs">
                  {PRESETS.map(p => (
                    <div key={p.id} className="preset-tab" onClick={p.apply} title={p.desc}>
                      <span className="preset-tab-icon">{p.id === 'clean' ? '◇' : p.id === 'conflict' ? '⬡' : p.id === 'markets' ? '◈' : '⬢'}</span>
                      <span className="preset-tab-label">{p.label}</span>
                    </div>
                  ))}
                </div>

                {/* ── Folder Card Grid ── */}
                <div className="folder-grid">
                  {[
                    { id: 'live-data', icon: '◉', label: 'Live Data' },
                    { id: 'us-politics', icon: '⚑', label: 'US Politics' },
                    { id: 'conflicts', icon: '⚔', label: 'Conflicts' },
                    { id: 'intel', icon: '◎', label: 'Intel' },
                    { id: 'disasters', icon: '⚠', label: 'Security' },
                    { id: 'env-tech', icon: '❖', label: 'Env & Tech' },
                    { id: 'trade', icon: '⬙', label: 'Trade' },
                    { id: 'migration', icon: '⬡', label: 'Migration' },
                    { id: 'geopolitical', icon: '◆', label: 'Geopolitics' },
                    { id: 'lifestyle', icon: '✦', label: 'Lifestyle' },
                  ].map(f => (
                    <div
                      key={f.id}
                      className={`folder-card ${openSections.has(f.id) ? 'folder-card--open' : ''}`}
                      onClick={() => toggleSection(f.id)}
                    >
                      <span className="folder-card-icon">{f.icon}</span>
                      <span className="folder-card-label">{f.label}</span>
                    </div>
                  ))}
                </div>

                {/* Drawers render as snap-zone panels over the map */}
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

            {/* Overlays Tab */}
            {sidebarExpanded && sidebarTab === 'overlays' && (
              <div className="settings-panel">
                <div className="toggle-group-title">Map Overlays</div>
                <div className="settings-group">
                  <label className="switch switch-neutral switch-disabled">
                    <span className="switch-label">Timezones (WIP)</span>
                    <input type="checkbox" checked={false} disabled />
                    <span className="slider" />
                  </label>
                  {[
                    { id: 'us', label: 'US State Borders', state: showUSStates, set: setShowUSStates },
                    { id: 'ca', label: 'CA Province Borders', state: showCAProvinces, set: setShowCAProvinces },
                    { id: 'in', label: 'IN State Borders', state: showINStates, set: setShowINStates },
                    { id: 'ru', label: 'RU Oblast Borders', state: showRUOblasts, set: setShowRUOblasts },
                    { id: 'uk', label: 'UK Nation Borders', state: showUKNations, set: setShowUKNations },
                    { id: 'eu', label: 'EU Country Borders', state: showEUCountries, set: setShowEUCountries },
                  ].map(b => (
                    <label key={b.id} className="switch switch-neutral">
                      <span className="switch-label">{b.label}</span>
                      <input type="checkbox" checked={b.state} onChange={() => b.set(prev => !prev)} />
                      <span className="slider" />
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Sources Tab */}
            {sidebarExpanded && sidebarTab === 'sources' && (
              <div className="settings-panel">
                <div className="toggle-group-title">Data Sources</div>
                <div className="settings-group">
                  {[
                    { id: 'news', label: 'Major News', tone: 'news' },
                    { id: 'reddit', label: 'Reddit', tone: 'reddit' },
                    { id: 'twitter', label: 'Twitter', tone: 'twitter' },
                  ].map((layer) => (
                    <label key={layer.id} className={`switch switch-${layer.tone}`}>
                      <span className="switch-label">{layer.label}</span>
                      <input
                        type="checkbox"
                        checked={enabledLayers[layer.id]}
                        onChange={() => toggleLayer(layer.id)}
                      />
                      <span className="slider" />
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Themes Tab */}
            {sidebarExpanded && sidebarTab === 'themes' && (
              <div className="themes-panel">
                <div className="toggle-group-title">Theme</div>
                <div className="themes-grid">
                  {THEMES.map(t => (
                    <button
                      key={t.id}
                      className={`theme-card ${theme === t.id ? 'theme-card-active' : ''}`}
                      onClick={() => { setTheme(t.id); saveTheme(t.id); }}
                    >
                      <div className={`theme-card-preview theme-preview-${t.id}`}>
                        <div className="theme-preview-bar" />
                        <div className="theme-preview-body">
                          <div className="theme-preview-sidebar" />
                          <div className="theme-preview-map" />
                        </div>
                      </div>
                      <span className="theme-card-label">{t.label.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>

                <div className="toggle-group-title" style={{ marginTop: '20px' }}>Globe Effects</div>
                <div className="settings-group">
                  <label className="switch switch-neutral">
                    <span className="switch-label">Holographic Borders</span>
                    <input
                      type="checkbox"
                      checked={holoMode}
                      onChange={() => setHoloMode(prev => !prev)}
                    />
                    <span className="slider" />
                  </label>
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
                    <span className="switch-label">Earth Atmosphere Halo</span>
                    <input
                      type="checkbox"
                      checked={visualLayers.earthGlow}
                      onChange={() => toggleVisualLayer('earthGlow')}
                      disabled={!useGlobe}
                    />
                    <span className="slider" />
                  </label>
                </div>

                <div className="toggle-group-title" style={{ marginTop: '20px' }}>Map Visuals</div>
                <div className="settings-group">
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
              </div>
            )}

            {sidebarExpanded && sidebarTab === 'settings' && (
              <div className="settings-panel">
                {/* ─── Display ─── */}
                <div className="toggle-group-title">Display</div>
                <div className="settings-group">
                  <div className="opacity-slider-group">
                    <span className="switch-label">Text Size</span>
                    <div className="text-size-selector">
                      {[
                        { id: 'small', label: 'S' },
                        { id: 'medium', label: 'M' },
                        { id: 'large', label: 'L' },
                      ].map(s => (
                        <button
                          key={s.id}
                          className={`text-size-btn${textSize === s.id ? ' active' : ''}`}
                          onClick={() => setTextSize(s.id)}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="opacity-slider-group">
                    <span className="switch-label">Panel Opacity</span>
                    <input
                      type="range"
                      className="opacity-slider"
                      min="0.15"
                      max="1"
                      step="0.05"
                      value={panelOpacity}
                      onChange={(e) => setPanelOpacity(Number(e.target.value))}
                    />
                    <span className="opacity-value">{Math.round(panelOpacity * 100)}%</span>
                  </div>
                  <label className="switch switch-neutral">
                    <span className="switch-label">News Ticker</span>
                    <input type="checkbox" checked={showNewsTicker} onChange={() => setShowNewsTicker(p => !p)} />
                    <span className="slider" />
                  </label>
                </div>

                {/* ─── Units & Language ─── */}
                <div className="toggle-group-title" style={{ marginTop: '16px' }}>Units & Language</div>
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
                  <div className="lang-selector">
                    <span className="switch-label" style={{ marginBottom: 4, display: 'block' }}>Language</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      <button
                        className={`lang-btn active`}
                        title="English"
                      >
                        English
                      </button>
                      {supportedLanguages.filter(l => l.code !== 'en').map(l => (
                        <button
                          key={l.code}
                          className="lang-btn"
                          title={`${l.label} — coming soon`}
                          disabled
                          style={{ opacity: 0.35, cursor: 'not-allowed' }}
                        >
                          {l.nativeLabel}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}


            {/* Collapsible Chat */}
            {sidebarExpanded && (
              <div className={`sidebar-chat-wrapper${chatOpen ? ' sidebar-chat-open' : ''}`}>
                <button
                  className="sidebar-chat-toggle"
                  onClick={() => setChatOpen(prev => !prev)}
                  aria-expanded={chatOpen}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  Chat
                  <svg className={`sidebar-chat-chevron${chatOpen ? ' open' : ''}`} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="18 15 12 9 6 15" />
                  </svg>
                </button>
                {chatOpen && <ChatPanel chatId="global" />}
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
          {/* Eye indicator — bottom-left corner; shows expanded/collapsed state */}
          <button
            className={`sidebar-eye-btn${sidebarExpanded ? ' sidebar-eye-front' : ''}`}
            onClick={() => setSidebarExpanded(prev => !prev)}
            title={sidebarExpanded ? 'Panel visible — click to collapse' : 'Panel hidden — click to expand'}
            aria-label={sidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarExpanded ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            )}
          </button>
        </div>

        {/* Map */}
        <div className={`map-container${useGlobe ? ' globe-mode' : ''}${mapControlsCollapsed ? ' map-controls-hidden' : ''}`} ref={mapContainerRef}>
        {/* Projection transition overlay */}
        {projectionTransition && (
          <div className={`projection-transition projection-transition--${projectionTransition}`} />
        )}
        {/* Earth Overlay - scan line, atmospheric glow */}
        <EarthOverlay useGlobe={useGlobe} earthGlow={visualLayers.earthGlow} map={mapRef.current} />

        {/* ═══ Snap-Zone Floating Drawers ═══ */}
        {[
          { id: 'live-data', icon: '◉', label: 'Live Data', content: (
            <>
              <div className="source-group-items">
                <label className="switch switch-neutral">
                  <span className="switch-label">Stability Monitor</span>
                  <input type="checkbox" checked={stabilityMode} onChange={() => { setStabilityMode(prev => { if (prev) setShowStabilityPanel(false); return !prev; }); }} />
                  <span className="slider" />
                </label>
                {[
                  { id: 'severeWeather', label: 'Severe Weather', tone: 'flights', disabled: false, kbd: '5' },
                  { id: 'flights', label: 'Flights (WIP)', tone: 'flights', disabled: true },
                ].map((layer) => (
                  <label key={layer.id} className={`switch switch-${layer.tone} ${layer.disabled ? 'switch-disabled' : ''}`}>
                    <span className="switch-label">{layer.label}{layer.kbd && <kbd style={{fontSize:'10px',padding:'0 3px',border:'1px solid rgba(255,255,255,0.15)',borderRadius:'2px',marginLeft:'4px'}}>{layer.kbd}</kbd>}</span>
                    <input type="checkbox" checked={enabledLayers[layer.id]} onChange={() => !layer.disabled && toggleLayer(layer.id)} disabled={layer.disabled} />
                    <span className="slider" />
                  </label>
                ))}
              </div>
              {stabilityMode && (
                <div className="stability-sidebar-info" style={{ marginTop: '8px' }}>
                  <div className="stability-sidebar-stats">
                    <div className="stability-sidebar-stat"><span className="stability-sidebar-stat-value">{stabilityData?.protests?.length || '—'}</span><span className="stability-sidebar-stat-label">Protests</span></div>
                    <div className="stability-sidebar-stat"><span className="stability-sidebar-stat-value">{stabilityData?.military?.length || '—'}</span><span className="stability-sidebar-stat-label">Military</span></div>
                    <div className="stability-sidebar-stat"><span className="stability-sidebar-stat-value">{stabilityData?.instability?.length || '—'}</span><span className="stability-sidebar-stat-label">Alerts</span></div>
                  </div>
                  <div className="conflict-sidebar-toggles">
                    <label className="switch switch-neutral" style={{ fontSize: '11px' }}><span className="switch-label">Protest Heatmap</span><input type="checkbox" checked={showProtestHeatmap} onChange={() => setShowProtestHeatmap(p => !p)} /><span className="slider" /></label>
                    <label className="switch switch-neutral" style={{ fontSize: '11px' }}><span className="switch-label">Military Indicators</span><input type="checkbox" checked={showMilitaryOverlay} onChange={() => setShowMilitaryOverlay(p => !p)} /><span className="slider" /></label>
                    <label className="switch switch-neutral" style={{ fontSize: '11px' }}><span className="switch-label">Refugee Flows</span><input type="checkbox" checked={showRefugeePanel} onChange={() => setShowRefugeePanel(p => !p)} /><span className="slider" /></label>
                  </div>
                  <button className="stability-sidebar-open-btn" onClick={() => setShowStabilityPanel(prev => !prev)}>{showStabilityPanel ? 'Close' : 'Open'} Stability Panel</button>
                </div>
              )}
            </>
          )},
          { id: 'us-politics', icon: '⚑', label: 'US Politics', content: (
            <>
              <div className="source-group-items">
                <label className="switch switch-elections"><span className="switch-label">2026 Midterms</span><input type="checkbox" checked={electionMode} onChange={() => { setElectionMode(prev => { if (prev) { setElectionPanel({ open: false, state: null, pos: { x: 160, y: 120 } }); } else { setShowUSStates(true); } return !prev; }); }} /><span className="slider" /></label>
                <label className="switch switch-neutral"><span className="switch-label">Tariffs & Trade</span><input type="checkbox" checked={showTariffHeatmap} onChange={() => setShowTariffHeatmap(prev => !prev)} /><span className="slider" /></label>
                <label className="switch switch-neutral"><span className="switch-label">US Installations</span><input type="checkbox" checked={showUSBases} onChange={() => setShowUSBases(p => !p)} /><span className="slider" /></label>
              </div>
              {showTariffHeatmap && (
                <div className="tariff-sidebar" style={{ marginTop: '8px' }}>
                  <div className="tariff-heatmap-active-badge"><span className="tariff-heatmap-active-dot" />Heatmap active</div>
                  <div className="tariff-legend"><div className="tariff-legend-title">Tariff Rate Legend</div><div className="tariff-legend-items">{TARIFF_LEGEND.map((item) => (<div key={item.label} className="tariff-legend-item"><span className="tariff-legend-swatch" style={{ background: isLightTheme ? item.colorLight : item.color }} /><span>{item.label}</span></div>))}</div></div>
                </div>
              )}
            </>
          )},
          { id: 'conflicts', icon: '⚔', label: 'Conflicts', content: (
            <>
              <div className="source-group-items">
                <label className="switch switch-frontline"><span className="switch-label">Russia–Ukraine</span><input type="checkbox" checked={conflictMode} onChange={() => { setConflictMode(prev => { if (prev) setConflictPanelOpen(false); return !prev; }); }} /><span className="slider" /></label>
              </div>
              {conflictMode && (
                <div className="conflict-sidebar-info" style={{ marginTop: '8px' }}>
                  <span className="conflict-sidebar-day">Day {CONFLICT_SUMMARY.daysSince()}</span>
                  <strong>Russia–Ukraine War</strong>
                  <div className="conflict-sidebar-toggles"><label className="switch switch-neutral" style={{ fontSize: '11px' }}><span className="switch-label">Troop Positions</span><input type="checkbox" checked={conflictShowTroops} onChange={() => setConflictShowTroops(prev => !prev)} /><span className="slider" /></label></div>
                  <button className="conflict-sidebar-open-btn" style={{ marginTop:'8px',width:'100%',padding:'7px 10px',background:'rgba(255,50,50,0.12)',border:'1px solid rgba(255,50,50,0.25)',borderRadius:'6px',color:'#ff6b6b',fontSize:'11px',fontWeight:600,cursor:'pointer' }} onClick={() => setConflictPanelOpen(prev => !prev)}>{conflictPanelOpen ? 'Close' : 'Open'} Statistics</button>
                </div>
              )}
              {ADDITIONAL_CONFLICTS.map((c) => (
                <div key={c.id}>
                  <div className="source-group-items" style={{ marginTop: 4 }}><label className="switch switch-frontline"><span className="switch-label">{c.label}</span><input type="checkbox" checked={!!activeConflicts[c.id]} onChange={() => { setActiveConflicts(prev => { const next = { ...prev }; if (next[c.id]) { delete next[c.id]; setConflictPanels(p => { const n = { ...p }; delete n[c.id]; return n; }); } else { next[c.id] = true; setConflictTroops(p => ({ ...p, [c.id]: true })); } return next; }); }} /><span className="slider" /></label></div>
                  {activeConflicts[c.id] && (<div className="conflict-sidebar-info" style={{ marginTop:'6px',marginBottom:'4px' }}><span className="conflict-sidebar-day">Day {c.data.CONFLICT_SUMMARY.daysSince()}</span><strong>{c.data.CONFLICT_SUMMARY.name}</strong><p style={{ fontSize:'10px',margin:'4px 0',opacity:0.8 }}>{c.data.CONFLICT_SUMMARY.phase}</p><button className="conflict-sidebar-open-btn" style={{ marginTop:'6px',width:'100%',padding:'6px 10px',background:`${c.data.CONFLICT_SUMMARY.sideA.color}1f`,border:`1px solid ${c.data.CONFLICT_SUMMARY.sideA.color}40`,borderRadius:'6px',color:c.data.CONFLICT_SUMMARY.sideA.color,fontSize:'11px',fontWeight:600,cursor:'pointer' }} onClick={() => setConflictPanels(prev => ({ ...prev, [c.id]: !prev[c.id] }))}>{conflictPanels[c.id] ? 'Close' : 'Open'} Statistics</button></div>)}
                </div>
              ))}
            </>
          )},
          { id: 'intel', icon: '◎', label: 'Intelligence', content: (
            <>
              <div className="source-group-items">
                <label className="switch switch-neutral"><span className="switch-label">Daily Briefing <kbd style={{fontSize:'10px',padding:'0 3px',border:'1px solid rgba(255,255,255,0.15)',borderRadius:'2px',marginLeft:'4px'}}>1</kbd></span><input type="checkbox" checked={showBriefingPanel} onChange={() => setShowBriefingPanel(p => !p)} /><span className="slider" /></label>
                <label className="switch switch-neutral"><span className="switch-label">Tension Index <kbd style={{fontSize:'10px',padding:'0 3px',border:'1px solid rgba(255,255,255,0.15)',borderRadius:'2px',marginLeft:'4px'}}>2</kbd></span><input type="checkbox" checked={showTensionPanel} onChange={() => setShowTensionPanel(p => !p)} /><span className="slider" /></label>
                <label className="switch switch-neutral"><span className="switch-label">Country Risk <kbd style={{fontSize:'10px',padding:'0 3px',border:'1px solid rgba(255,255,255,0.15)',borderRadius:'2px',marginLeft:'4px'}}>3</kbd></span><input type="checkbox" checked={showCountryRiskMode} onChange={() => { setShowCountryRiskMode(p => !p); setShowCountryRiskPanel(p => !p); }} /><span className="slider" /></label>
                <label className="switch switch-neutral"><span className="switch-label">Narrative Tracking</span><input type="checkbox" checked={showNarrativePanel} onChange={() => setShowNarrativePanel(p => !p)} /><span className="slider" /></label>
              </div>
              {showTensionPanel && tensionData && (<div className="stability-sidebar-info" style={{ marginTop:'8px' }}><strong>Tension: <span style={{ color: tensionData.index >= 65 ? '#ff6b6b' : '#ffd700' }}>{tensionData.index}/100</span></strong><p>{tensionData.summary?.totalConflicts || 0} conflicts, {tensionData.summary?.nuclearFlashpoints || 0} nuclear</p></div>)}
            </>
          )},
          { id: 'disasters', icon: '⚠', label: 'Security', content: (
            <div className="source-group-items">
              <label className="switch switch-neutral"><span className="switch-label">Health & Pandemics</span><input type="checkbox" checked={showHealthPanel} onChange={() => setShowHealthPanel(p => !p)} /><span className="slider" /></label>
              <label className="switch switch-neutral"><span className="switch-label">Cyber Threats <kbd style={{fontSize:'10px',padding:'0 3px',border:'1px solid rgba(255,255,255,0.15)',borderRadius:'2px',marginLeft:'4px'}}>6</kbd></span><input type="checkbox" checked={showCyberPanel} onChange={() => setShowCyberPanel(p => !p)} /><span className="slider" /></label>
              <label className="switch switch-neutral"><span className="switch-label">Court Rulings</span><input type="checkbox" checked={showCourtPanel} onChange={() => setShowCourtPanel(p => !p)} /><span className="slider" /></label>
              <label className="switch switch-neutral"><span className="switch-label">Sanctions</span><input type="checkbox" checked={showSanctionsPanel} onChange={() => setShowSanctionsPanel(p => !p)} /><span className="slider" /></label>
              <label className="switch switch-neutral"><span className="switch-label">Infrastructure</span><input type="checkbox" checked={showInfrastructurePanel} onChange={() => setShowInfrastructurePanel(p => !p)} /><span className="slider" /></label>
              <label className="switch switch-neutral"><span className="switch-label">Nuclear Threats</span><input type="checkbox" checked={showNuclearPanel} onChange={() => setShowNuclearPanel(p => !p)} /><span className="slider" /></label>
            </div>
          )},
          { id: 'env-tech', icon: '❖', label: 'Env & Tech', content: (
            <div className="source-group-items">
              <label className="switch switch-neutral"><span className="switch-label">Climate & Environment</span><input type="checkbox" checked={showClimatePanel} onChange={() => setShowClimatePanel(p => !p)} /><span className="slider" /></label>
              <label className="switch switch-neutral"><span className="switch-label">AI & Technology</span><input type="checkbox" checked={showAiTechPanel} onChange={() => setShowAiTechPanel(p => !p)} /><span className="slider" /></label>
            </div>
          )},
          { id: 'trade', icon: '⬙', label: 'Trade', content: (
            <>
              <div className="source-group-items">
                <label className="switch switch-neutral"><span className="switch-label">Commodities <kbd style={{fontSize:'10px',padding:'0 3px',border:'1px solid rgba(255,255,255,0.15)',borderRadius:'2px',marginLeft:'4px'}}>4</kbd></span><input type="checkbox" checked={showCommoditiesPanel} onChange={() => setShowCommoditiesPanel(p => !p)} /><span className="slider" /></label>
                <label className="switch switch-neutral"><span className="switch-label">Shipping <kbd style={{fontSize:'10px',padding:'0 3px',border:'1px solid rgba(255,255,255,0.15)',borderRadius:'2px',marginLeft:'4px'}}>7</kbd></span><input type="checkbox" checked={showShippingMode} onChange={() => { setShowShippingMode(p => { if (!p) setShowShippingPanel(true); return !p; }); }} /><span className="slider" /></label>
              </div>
              {showShippingMode && shippingData && (<div className="stability-sidebar-info" style={{ marginTop:'8px' }}><strong>Maritime Chokepoints</strong><p>{shippingData.summary?.disrupted || 0} disrupted</p><button className="stability-sidebar-open-btn" onClick={() => setShowShippingPanel(p => !p)}>{showShippingPanel ? 'Close' : 'Open'} Shipping</button></div>)}
            </>
          )},
          { id: 'migration', icon: '⬡', label: 'Migration', content: (
            <div className="source-group-items">
              <label className="switch switch-neutral"><span className="switch-label">Watchlist <kbd style={{fontSize:'10px',padding:'0 3px',border:'1px solid rgba(255,255,255,0.15)',borderRadius:'2px',marginLeft:'4px'}}>0</kbd></span><input type="checkbox" checked={showWatchlistPanel} onChange={() => setShowWatchlistPanel(p => !p)} /><span className="slider" /></label>
              <label className="switch switch-neutral"><span className="switch-label">Demographic Risk</span><input type="checkbox" checked={showDemographicPanel} onChange={() => setShowDemographicPanel(p => !p)} /><span className="slider" /></label>
            </div>
          )},
          { id: 'geopolitical', icon: '◆', label: 'Geopolitics', content: (
            <div className="source-group-items">
              <label className="switch switch-neutral"><span className="switch-label">Regime Stability</span><input type="checkbox" checked={showRegimePanel} onChange={() => setShowRegimePanel(p => !p)} /><span className="slider" /></label>
              <label className="switch switch-neutral"><span className="switch-label">Alliance Networks</span><input type="checkbox" checked={showAlliancePanel} onChange={() => setShowAlliancePanel(p => !p)} /><span className="slider" /></label>
              <label className="switch switch-neutral"><span className="switch-label">Leadership Intel</span><input type="checkbox" checked={showLeadershipPanel} onChange={() => setShowLeadershipPanel(p => !p)} /><span className="slider" /></label>
              <label className="switch switch-neutral"><span className="switch-label">Timeline Navigator</span><input type="checkbox" checked={showTimeline} onChange={() => setShowTimeline(p => !p)} /><span className="slider" /></label>
            </div>
          )},
          { id: 'lifestyle', icon: '✦', label: 'Lifestyle', content: (
            <div className="source-group-items">
              {[{ id: 'sports', label: 'Major Sports' }, { id: 'pizzaIndex', label: 'Pizza Index' }].map((l) => (
                <label key={l.id} className="switch switch-neutral switch-disabled"><span className="switch-label">{l.label} (WIP)</span><input type="checkbox" checked={false} disabled /><span className="slider" /></label>
              ))}
            </div>
          )},
        ].map(drawer => openSections.has(drawer.id) && (
          <div
            key={drawer.id}
            className={`snap-zone-drawer${minimizedDrawers.has(drawer.id) ? ' snap-zone-drawer--minimized' : ''}`}
            style={{
              ...(drawerStates[drawer.id]
                ? { left: drawerStates[drawer.id].x, top: drawerStates[drawer.id].y, right: 'auto', bottom: 'auto',
                    width: drawerStates[drawer.id].w || 320,
                    ...(!minimizedDrawers.has(drawer.id) && drawerStates[drawer.id].h ? { height: drawerStates[drawer.id].h, maxHeight: 'none' } : {}) }
                : DRAWER_POSITIONS[drawer.id]),
              background: `rgba(var(--snap-bg-rgb, 8,12,20), ${panelOpacity})`,
            }}
          >
            <div className="folder-drawer-header" onMouseDown={e => startDrawerDrag(e, drawer.id, 'move')} style={{ cursor: 'grab' }}>
              <span className="folder-drawer-icon">{drawer.icon}</span> {drawer.label}
              <span className="folder-drawer-minimize" onClick={() => toggleMinimize(drawer.id)} onMouseDown={e => e.stopPropagation()} title={minimizedDrawers.has(drawer.id) ? 'Expand' : 'Minimize'}>{minimizedDrawers.has(drawer.id) ? '▢' : '▁'}</span>
              <span className="folder-drawer-close" onClick={() => toggleSection(drawer.id)} onMouseDown={e => e.stopPropagation()}>✕</span>
            </div>
            {!minimizedDrawers.has(drawer.id) && drawer.content}
            {/* Resize handles — all edges + corners */}
            {!minimizedDrawers.has(drawer.id) && <>
              <div className="drawer-resize drawer-resize-n" onMouseDown={e => startDrawerDrag(e, drawer.id, 'n')} />
              <div className="drawer-resize drawer-resize-s" onMouseDown={e => startDrawerDrag(e, drawer.id, 's')} />
              <div className="drawer-resize drawer-resize-e" onMouseDown={e => startDrawerDrag(e, drawer.id, 'e')} />
              <div className="drawer-resize drawer-resize-w" onMouseDown={e => startDrawerDrag(e, drawer.id, 'w')} />
              <div className="drawer-resize drawer-resize-nw" onMouseDown={e => startDrawerDrag(e, drawer.id, 'nw')} />
              <div className="drawer-resize drawer-resize-ne" onMouseDown={e => startDrawerDrag(e, drawer.id, 'ne')} />
              <div className="drawer-resize drawer-resize-sw" onMouseDown={e => startDrawerDrag(e, drawer.id, 'sw')} />
              <div className="drawer-resize drawer-resize-se" onMouseDown={e => startDrawerDrag(e, drawer.id, 'se')} />
            </>}
          </div>
        ))}

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

        {/* Severe Weather Panel */}
        {showSeverePanel && (
          <PanelWindow
            id="severe-weather"
            title="Severe Weather & Disasters"
            onClose={() => { setShowSeverePanel(false); setSelectedSevereEventId(null); setEnabledLayers(prev => ({ ...prev, severeWeather: false })); }}
            defaultWidth={440}
            defaultHeight={600}
            defaultMode="floating"
            defaultPosition={{ x: 90, y: 80 }}
          >
            <SevereWeatherPanel
              visible={true}
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
              disasterData={disasterData}
              disasterLoading={disasterLoading}
              onRefreshDisasters={refreshDisasters}
              onDisasterEventClick={(event) => {
                if (event.lat && event.lon && mapRef.current) {
                  mapRef.current.flyTo({ center: [event.lon, event.lat], zoom: 5, duration: 1400, essential: true });
                }
              }}
            />
          </PanelWindow>
        )}

        {/* Tariff Panel */}
        {tariffPanel.open && tariffPanel.country && (
          <PanelWindow
            id="tariff"
            title={`Tariffs — ${tariffPanel.country}`}
            onClose={() => setTariffPanel({ open: false, country: null, pos: { x: 160, y: 120 } })}
            defaultWidth={360}
            defaultHeight={520}
            defaultMode="floating"
            defaultPosition={tariffPanel.pos}
          >
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
          </PanelWindow>
        )}

        {/* Election Panel */}
        {electionPanel.open && electionPanel.state && (
          <PanelWindow
            id="election"
            title={`Election — ${electionPanel.state}`}
            onClose={() => setElectionPanel({ open: false, state: null, pos: { x: 160, y: 120 } })}
            defaultWidth={400}
            defaultHeight={520}
            defaultMode="floating"
            defaultPosition={electionPanel.pos}
          >
            <ElectionPanel
              stateName={electionPanel.state}
              position={electionPanel.pos}
              bounds={
                mapContainerRef.current
                  ? {
                      width: mapContainerRef.current.getBoundingClientRect().width,
                      height: mapContainerRef.current.getBoundingClientRect().height,
                    }
                  : null
              }
              onPositionChange={(pos) => setElectionPanel(prev => ({ ...prev, pos }))}
              onClose={() => setElectionPanel({ open: false, state: null, pos: { x: 160, y: 120 } })}
            />
          </PanelWindow>
        )}

        {/* Conflict panel */}
        {conflictMode && conflictPanelOpen && (
          <PanelWindow
            id="conflict"
            title="Ukraine-Russia Conflict"
            onClose={() => setConflictPanelOpen(false)}
            defaultWidth={420}
            defaultHeight={600}
          >
            <ConflictPanel
              open={true}
              onClose={() => setConflictPanelOpen(false)}
            />
          </PanelWindow>
        )}

        {/* ══════════ Additional Conflict Panels ══════════ */}
        {ADDITIONAL_CONFLICTS.map((conflict) => (
          activeConflicts[conflict.id] && conflictPanels[conflict.id] && (
            <PanelWindow
              key={`conflict-panel-${conflict.id}`}
              id={`conflict-${conflict.id}`}
              title={conflict.data.CONFLICT_SUMMARY.name}
              onClose={() => setConflictPanels(prev => ({ ...prev, [conflict.id]: false }))}
              defaultWidth={420}
              defaultHeight={600}
            >
              <GenericConflictPanel
                open={true}
                onClose={() => setConflictPanels(prev => ({ ...prev, [conflict.id]: false }))}
                conflictData={conflict.data}
              />
            </PanelWindow>
          )
        ))}

        {/* ══════════ Stability Panel ══════════ */}
        {stabilityMode && showStabilityPanel && (
          <PanelWindow
            id="stability"
            title="Global Stability Monitor"
            onClose={() => setShowStabilityPanel(false)}
            defaultWidth={440}
            defaultHeight={600}
            defaultMode="floating"
            defaultPosition={{ x: 90, y: 80 }}
          >
            <StabilityPanel
              data={stabilityData}
              loading={stabilityLoading}
              onRefresh={refreshStability}
              onAlertClick={(alert) => {
                if (alert.lat && alert.lon && mapRef.current) {
                  mapRef.current.flyTo({ center: [alert.lon, alert.lat], zoom: 5, duration: 1400, essential: true });
                }
              }}
              onMilitaryClick={(item) => {
                if (item.lat && item.lon && mapRef.current) {
                  mapRef.current.flyTo({ center: [item.lon, item.lat], zoom: 5, duration: 1400, essential: true });
                }
              }}
              onProtestClick={(item) => {
                if (item.lat && item.lon && mapRef.current) {
                  mapRef.current.flyTo({ center: [item.lon, item.lat], zoom: 5, duration: 1400, essential: true });
                }
              }}
            />
          </PanelWindow>
        )}


        {/* ══════════ Health & Pandemic Panel ══════════ */}
        {showHealthPanel && (
          <PanelWindow
            id="health"
            title="Health & Pandemic Monitor"
            onClose={() => setShowHealthPanel(false)}
            defaultWidth={420}
            defaultHeight={560}
            defaultMode="floating"
          >
            <HealthPanel
              data={healthData}
              loading={healthLoading}
              onRefresh={refreshHealth}
            />
          </PanelWindow>
        )}


        {/* ══════════ Climate Panel ══════════ */}
        {showClimatePanel && (
          <PanelWindow
            id="climate"
            title="Climate & Environment"
            onClose={() => setShowClimatePanel(false)}
            defaultWidth={420}
            defaultHeight={560}
            defaultMode="floating"
            defaultPosition={{ x: 160, y: 100 }}
          >
            <ClimatePanel
              data={climateData}
              loading={climateLoading}
              onRefresh={refreshClimate}
            />
          </PanelWindow>
        )}

        {/* ══════════ Nuclear Panel ══════════ */}
        {showNuclearPanel && (
          <PanelWindow
            id="nuclear"
            title="Nuclear Threat Monitor"
            onClose={() => setShowNuclearPanel(false)}
            defaultWidth={420}
            defaultHeight={560}
            defaultMode="floating"
            defaultPosition={{ x: 180, y: 80 }}
          >
            <NuclearPanel
              data={nuclearData}
              loading={nuclearLoading}
              onRefresh={refreshNuclear}
            />
          </PanelWindow>
        )}

        {/* ══════════ AI & Tech Panel ══════════ */}
        {showAiTechPanel && (
          <PanelWindow
            id="aitech"
            title="AI & Technology Monitor"
            onClose={() => setShowAiTechPanel(false)}
            defaultWidth={440}
            defaultHeight={560}
            defaultMode="floating"
            defaultPosition={{ x: 200, y: 100 }}
          >
            <AITechPanel
              data={aitechData}
              loading={aitechLoading}
              onRefresh={refreshAiTech}
            />
          </PanelWindow>
        )}

        {/* ══════════ Cyber Panel ══════════ */}
        {showCyberPanel && (
          <PanelWindow
            id="cyber"
            title="Cyber Threats & Outages"
            onClose={() => setShowCyberPanel(false)}
            defaultWidth={420}
            defaultHeight={560}
            defaultMode="floating"
            defaultPosition={{ x: 120, y: 100 }}
          >
            <CyberPanel
              data={cyberData}
              loading={cyberLoading}
              onRefresh={refreshCyber}
            />
          </PanelWindow>
        )}

        {/* ══════════ Commodities Panel ══════════ */}
        {showCommoditiesPanel && (
          <PanelWindow
            id="commodities"
            title="Commodity Prices"
            onClose={() => setShowCommoditiesPanel(false)}
            defaultWidth={440}
            defaultHeight={600}
            defaultMode="floating"
            defaultPosition={{ x: 140, y: 80 }}
          >
            <CommoditiesPanel
              data={commoditiesData}
              loading={commoditiesLoading}
              onRefresh={refreshCommodities}
            />
          </PanelWindow>
        )}

        {/* ══════════ Refugee Panel ══════════ */}
        {showRefugeePanel && (
          <PanelWindow
            id="refugees"
            title="Refugee Flows & Migration"
            onClose={() => setShowRefugeePanel(false)}
            defaultWidth={400}
            defaultHeight={560}
            defaultMode="floating"
            defaultPosition={{ x: 100, y: 90 }}
          >
            <RefugeePanel
              data={refugeeData}
              loading={refugeeLoading}
              onRefresh={refreshRefugees}
              onSituationClick={(item) => {
                if (item.lat && item.lon && mapRef.current) {
                  mapRef.current.flyTo({ center: [item.lon, item.lat], zoom: 4, duration: 1400, essential: true });
                }
              }}
            />
          </PanelWindow>
        )}

        {/* ══════════ Shipping Panel ══════════ */}
        {showShippingMode && showShippingPanel && (
          <PanelWindow
            id="shipping"
            title="Shipping & Trade Flows"
            onClose={() => setShowShippingPanel(false)}
            defaultWidth={420}
            defaultHeight={560}
            defaultMode="floating"
            defaultPosition={{ x: 110, y: 85 }}
          >
            <ShippingPanel
              data={shippingData}
              loading={shippingLoading}
              onRefresh={refreshShipping}
              onChokepointClick={(cp) => {
                if (cp.lat && cp.lon && mapRef.current) {
                  mapRef.current.flyTo({ center: [cp.lon, cp.lat], zoom: 5, duration: 1400, essential: true });
                }
              }}
            />
          </PanelWindow>
        )}

        {/* ══════════ Tension Panel ══════════ */}
        {showTensionPanel && (
          <PanelWindow
            id="tension"
            title="Global Tension Index"
            onClose={() => setShowTensionPanel(false)}
            defaultWidth={420}
            defaultHeight={600}
            defaultMode="floating"
            defaultPosition={{ x: 130, y: 70 }}
          >
            <TensionPanel
              data={tensionData}
              loading={tensionLoading}
              onRefresh={refreshTension}
            />
          </PanelWindow>
        )}

        {/* ══════════ Briefing Panel ══════════ */}
        {showBriefingPanel && (
          <PanelWindow
            id="briefing"
            title="Intelligence Briefing"
            onClose={() => setShowBriefingPanel(false)}
            defaultWidth={440}
            defaultHeight={620}
            defaultMode="floating"
            defaultPosition={{ x: 100, y: 60 }}
          >
            <BriefingPanel
              data={briefingData}
              loading={briefingLoading}
              onRefresh={refreshBriefing}
            />
          </PanelWindow>
        )}

        {/* ══════════ Court Panel ══════════ */}
        {showCourtPanel && (
          <PanelWindow
            id="court"
            title="Court Rulings & Cases"
            onClose={() => setShowCourtPanel(false)}
            defaultWidth={400}
            defaultHeight={520}
            defaultMode="floating"
            defaultPosition={{ x: 150, y: 90 }}
          >
            <CourtPanel
              data={courtData}
              loading={courtLoading}
              onRefresh={refreshCourt}
            />
          </PanelWindow>
        )}

        {/* ══════════ Sanctions Panel ══════════ */}
        {showSanctionsPanel && (
          <PanelWindow
            id="sanctions"
            title="Sanctions Monitor"
            onClose={() => setShowSanctionsPanel(false)}
            defaultWidth={400}
            defaultHeight={520}
            defaultMode="floating"
            defaultPosition={{ x: 160, y: 95 }}
          >
            <SanctionsPanel
              data={sanctionsData}
              loading={sanctionsLoading}
              onRefresh={refreshSanctions}
              onRegimeClick={(regime) => {
                if (regime.lat && regime.lon && mapRef.current) {
                  mapRef.current.flyTo({ center: [regime.lon, regime.lat], zoom: 5, duration: 1400, essential: true });
                }
              }}
            />
          </PanelWindow>
        )}


        {/* ══════════ Country Risk Panel ══════════ */}
        {showCountryRiskMode && showCountryRiskPanel && (
          <PanelWindow
            id="country-risk"
            title="Country Risk Scores"
            onClose={() => setShowCountryRiskPanel(false)}
            defaultWidth={380}
            defaultHeight={580}
            defaultMode="floating"
            defaultPosition={{ x: 100, y: 80 }}
          >
            <CountryRiskPanel
              data={countryRiskData}
              loading={countryRiskLoading}
              onRefresh={refreshCountryRisk}
              onCountryClick={(item) => {
                if (item.lat && item.lon && mapRef.current) {
                  mapRef.current.flyTo({ center: [item.lon, item.lat], zoom: 5, duration: 1400, essential: true });
                }
              }}
            />
          </PanelWindow>
        )}

        {/* ══════════ Watchlist Panel ══════════ */}
        {showWatchlistPanel && (
          <PanelWindow
            id="watchlist"
            title="My Watchlist"
            onClose={() => setShowWatchlistPanel(false)}
            defaultWidth={340}
            defaultHeight={460}
            defaultMode="floating"
            defaultPosition={{ x: 160, y: 100 }}
          >
            <WatchlistPanel
              onCountryClick={(name) => {
                // Find country marker and fly to it
                const marker = COUNTRY_MARKERS.find(m => m.name.toLowerCase() === name.toLowerCase());
                if (marker && mapRef.current) {
                  mapRef.current.flyTo({ center: [marker.lon, marker.lat], zoom: 5, duration: 1400, essential: true });
                }
              }}
            />
          </PanelWindow>
        )}

        {/* ══════════ Narrative & Sentiment Panel ══════════ */}
        {showNarrativePanel && (
          <PanelWindow
            id="narrative"
            title="Narrative & Sentiment Tracking"
            onClose={() => setShowNarrativePanel(false)}
            defaultWidth={440}
            defaultHeight={600}
            defaultMode="floating"
            defaultPosition={{ x: 110, y: 70 }}
          >
            <NarrativePanel
              data={narrativeData}
              loading={narrativeLoading}
              onRefresh={refreshNarrative}
              onCountryClick={(item) => {
                if (item.lat && item.lon && mapRef.current) {
                  mapRef.current.flyTo({ center: [item.lon, item.lat], zoom: 5, duration: 1400, essential: true });
                }
              }}
            />
          </PanelWindow>
        )}

        {/* ══════════ Regime Stability Panel ══════════ */}
        {showRegimePanel && (
          <PanelWindow
            id="regime"
            title="Regime Stability & Coup Risk"
            onClose={() => setShowRegimePanel(false)}
            defaultWidth={420}
            defaultHeight={600}
            defaultMode="floating"
            defaultPosition={{ x: 130, y: 75 }}
          >
            <RegimePanel
              data={regimeData}
              loading={regimeLoading}
              onRefresh={refreshRegime}
              onCountryClick={(item) => {
                if (item.lat && item.lon && mapRef.current) {
                  mapRef.current.flyTo({ center: [item.lon, item.lat], zoom: 5, duration: 1400, essential: true });
                }
              }}
            />
          </PanelWindow>
        )}

        {/* ══════════ Alliance Network Panel ══════════ */}
        {showAlliancePanel && (
          <PanelWindow
            id="alliance"
            title="Alliance Network Analysis"
            onClose={() => setShowAlliancePanel(false)}
            defaultWidth={440}
            defaultHeight={580}
            defaultMode="floating"
            defaultPosition={{ x: 100, y: 80 }}
          >
            <AlliancePanel
              data={allianceData}
              loading={allianceLoading}
              onRefresh={refreshAlliance}
              onCountryClick={(item) => {
                if (item.lat && item.lon && mapRef.current) {
                  mapRef.current.flyTo({ center: [item.lon, item.lat], zoom: 4, duration: 1400, essential: true });
                }
              }}
            />
          </PanelWindow>
        )}

        {/* ══════════ Infrastructure Vulnerability Panel ══════════ */}
        {showInfrastructurePanel && (
          <PanelWindow
            id="infrastructure"
            title="Infrastructure Vulnerability"
            onClose={() => setShowInfrastructurePanel(false)}
            defaultWidth={420}
            defaultHeight={580}
            defaultMode="floating"
            defaultPosition={{ x: 120, y: 85 }}
          >
            <InfrastructurePanel
              data={infrastructureData}
              loading={infrastructureLoading}
              onRefresh={refreshInfrastructure}
            />
          </PanelWindow>
        )}

        {/* ══════════ Demographic Risk Panel ══════════ */}
        {showDemographicPanel && (
          <PanelWindow
            id="demographic"
            title="Demographic Risk Analysis"
            onClose={() => setShowDemographicPanel(false)}
            defaultWidth={420}
            defaultHeight={580}
            defaultMode="floating"
            defaultPosition={{ x: 140, y: 90 }}
          >
            <DemographicPanel
              data={demographicData}
              loading={demographicLoading}
              onRefresh={refreshDemographic}
              onCountryClick={(item) => {
                if (item.lat && item.lon && mapRef.current) {
                  mapRef.current.flyTo({ center: [item.lon, item.lat], zoom: 5, duration: 1400, essential: true });
                }
              }}
            />
          </PanelWindow>
        )}

        {/* Source Credibility Panel removed — lean indicators shown inline on news articles */}

        {/* ══════════ Leadership Intelligence Panel ══════════ */}
        {showLeadershipPanel && (
          <PanelWindow
            id="leadership"
            title="Leadership Intelligence"
            onClose={() => setShowLeadershipPanel(false)}
            defaultWidth={440}
            defaultHeight={620}
            defaultMode="floating"
            defaultPosition={{ x: 120, y: 70 }}
          >
            <LeadershipPanel
              data={leadershipData}
              loading={leadershipLoading}
              onRefresh={refreshLeadership}
              onCountryClick={(item) => {
                if (item.lat && item.lon && mapRef.current) {
                  mapRef.current.flyTo({ center: [item.lon, item.lat], zoom: 5, duration: 1400, essential: true });
                }
              }}
            />
          </PanelWindow>
        )}

        {/* ══════════ Timeline Navigator ══════════ */}
        {showTimeline && (
          <TimelineNavigator
            events={timelineEvents}
            onTimeSelect={(date) => {
              // Timeline scrub — no-op for now, events handle navigation
            }}
            onEventClick={(event) => {
              if (mapRef.current && event.lat && event.lon) {
                mapRef.current.flyTo({ center: [event.lon, event.lat], zoom: 5, duration: 1400, essential: true });
              }
            }}
          />
        )}

        {/* News Ticker */}
        <NewsTicker items={feed} visible={showNewsTicker} />

        {/* Global Status Bar */}
        <GlobalStatusBar tensionData={tensionData} disasterData={disasterData} cyberData={cyberData} commoditiesData={commoditiesData} />

        {/* Keyboard shortcut hint */}
        <div className="keyboard-hint">
          <kbd>1</kbd>-<kbd>9</kbd> panels · <kbd>0</kbd> watchlist · <kbd>Esc</kbd> close
        </div>

        {/* Election mode map legend */}
        {electionMode && (
          <div className="el-map-legend">
            {[
              { rating: 'safe-d', label: 'Safe D' },
              { rating: 'likely-d', label: 'Likely D' },
              { rating: 'lean-d', label: 'Lean D' },
              { rating: 'toss-up', label: 'Toss-Up' },
              { rating: 'lean-r', label: 'Lean R' },
              { rating: 'likely-r', label: 'Likely R' },
              { rating: 'safe-r', label: 'Safe R' },
            ].map((item, idx) => (
              <span key={item.rating}>
                {idx > 0 && <span className="el-legend-sep" />}
                <span className="el-legend-item">
                  <span className="el-legend-swatch" style={{ background: RATING_COLORS[item.rating] }} />
                  {item.label}
                </span>
              </span>
            ))}
          </div>
        )}

        {countryPanel.open && countryPanel.data && (
          <PanelWindow
            id="country"
            title={countryPanel.data?.name || 'Country'}
            onClose={closeCountryPanel}
            defaultWidth={360}
            defaultHeight={600}
          >
            <CountryPanel
              data={countryPanel.data}
              onClose={closeCountryPanel}
              weather={panelWeather}
              weatherLoading={panelWeatherLoading}
              tempUnit={tempUnit}
              currencyData={currencyData}
              currencyLoading={currencyLoading}
              approvalData={approvalData}
              approvalLoading={approvalLoading}
              economicData={economicData}
              economicLoading={economicLoading}
              marketData={marketData}
              marketLoading={marketLoading}
            />
          </PanelWindow>
        )}

        {/* Extra panels (multi-instance — opened when clicking countries while a panel is already open) */}
        {extraPanels.filter(p => p.type === 'country' && !p.minimized).map(panel => (
          <PanelWindow
            key={panel.id}
            id={panel.id}
            title={panel.data?.name || 'Country'}
            onClose={() => closeExtraPanel(panel.id)}
            defaultWidth={360}
            defaultHeight={600}
            defaultMode="floating"
            defaultPosition={panel.position}
          >
            <CountryPanel
              data={panel.data}
              onClose={() => closeExtraPanel(panel.id)}
              tempUnit={tempUnit}
            />
          </PanelWindow>
        ))}

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
          interactiveLayerIds={[
            'countries-fill',
            ...(showUSStates ? ['us-states-fill'] : []),
            ...(showCAProvinces ? ['ca-provinces-fill'] : []),
            ...(showINStates && indiaStatesGeoJSON ? ['in-states-fill'] : []),
            ...(showRUOblasts && ruOblastsGeoJSON ? ['ru-oblasts-fill'] : []),
            ...(showUKNations && ukNationsGeoJSON ? ['uk-nations-fill'] : []),
            ...(showEUCountries ? ['eu-countries-fill'] : []),
          ]}
          onMove={handleMapMove}
          onMouseMove={handleMapMouseMove}
          onMouseLeave={handleMapMouseLeave}
          onClick={handleMapClick}
          onDblClick={handleMapDblClick}
          doubleClickZoom={false}
          dragRotate={useGlobe}
          pitchWithRotate={false}
          touchPitch={false}
          renderWorldCopies={!useGlobe}
          maxBounds={useGlobe ? undefined : [[-Infinity, -50], [Infinity, 85]]}
          maxZoom={8}
          minZoom={useGlobe ? 0.8 : 1}
        >
          {/* Basemap raster + hillshade are baked into mapStyle for globe compatibility */}

          {/* Graticule (Micro Topographic Contours) */}
          <Source id="graticule" type="geojson" data={GRATICULE_GEOJSON}>
            <Layer
              id="graticule-lines"
              type="line"
              layout={{ visibility: visualLayers.contours ? 'visible' : 'none' }}
              paint={{
                'line-color': isLightTheme ? 'rgba(100, 120, 160, 0.18)' : isThemedDark ? themedColor('rgba(224, 160, 32, 0.14)', 'rgba(224, 48, 80, 0.14)', 'rgba(48, 192, 80, 0.14)', 'rgba(73, 198, 255, 0.16)') : 'rgba(73, 198, 255, 0.16)',
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
                'line-color': isLightTheme ? 'rgba(194, 120, 62, 0.08)' : isThemedDark ? themedColor('rgba(224, 160, 32, 0.08)', 'rgba(224, 48, 80, 0.08)', 'rgba(48, 192, 80, 0.08)', 'rgba(73, 198, 255, 0.10)') : 'rgba(73, 198, 255, 0.10)',
                'line-width': useGlobe ? 4 : 2,
                'line-blur': 4,
              }}
            />
            {/* Core line */}
            <Layer
              id="compass-lines-layer"
              type="line"
              paint={{
                'line-color': isLightTheme ? 'rgba(0, 4, 255, 0.28)' : isThemedDark ? themedColor('rgba(224, 160, 32, 0.22)', 'rgba(224, 48, 80, 0.22)', 'rgba(48, 192, 80, 0.22)', 'rgba(73, 198, 255, 0.25)') : 'rgba(73, 198, 255, 0.25)',
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
                'line-color': isLightTheme ? 'rgba(50, 8, 167, 0)' : isThemedDark ? themedColor('rgba(224, 160, 32, 0.22)', 'rgba(224, 48, 80, 0.22)', 'rgba(48, 192, 80, 0.22)', 'rgba(73, 198, 255, 0.25)') : 'rgba(73, 198, 255, 0.25)',
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
                'line-color': isLightTheme ? 'rgba(80, 93, 166, 0.2)' : isThemedDark ? themedColor('rgba(224, 160, 32, 0.18)', 'rgba(224, 48, 80, 0.18)', 'rgba(48, 192, 80, 0.18)', 'rgba(73, 198, 255, 0.2)') : 'rgba(73, 198, 255, 0.2)',
                'line-width': 0.8,
                'line-dasharray': [3, 3],
              }}
            />
            <Layer
              id="timezone-lines-prime"
              type="line"
              filter={['==', ['get', 'isPrimeMeridian'], true]}
              paint={{
                'line-color': isLightTheme ? 'rgba(86, 80, 166, 0.2)' : isThemedDark ? themedColor('rgba(224, 160, 32, 0.18)', 'rgba(224, 48, 80, 0.18)', 'rgba(48, 192, 80, 0.18)', 'rgba(73, 198, 255, 0.2)') : 'rgba(73, 198, 255, 0.2)',
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
                      isLightTheme ? '#a8c090' : isThemedDark ? themedColor('#2a2010', '#2a1018', '#102a14', '#1c3040') : '#1c3040',
                      ['get', 'tariffColor'],
                    ]
                  : showEUCountries
                    ? [
                        'case',
                        ['boolean', ['get', 'isEU'], false],
                        'rgba(0,0,0,0)',
                        ['case',
                          ['boolean', ['feature-state', 'hover'], false],
                          isLightTheme ? '#a8c090' : isThemedDark ? themedColor('#2a2010', '#2a1018', '#102a14', '#1c3040') : '#1c3040',
                          ['get', 'fillColor'],
                        ],
                      ]
                    : [
                        'case',
                        ['boolean', ['feature-state', 'hover'], false],
                        isLightTheme ? '#FFFD7C' : isThemedDark ? themedColor('#2a2010', '#2a1018', '#102a14', '#1c3040') : '#1c3040',
                        ['get', 'fillColor'],
                      ],
                'fill-opacity': showTariffHeatmap ? 0.85 : (visualLayers.countryFill ? 0.75 : 0),
              }}
            />
            {/* Holo glow layers: outer blur, mid glow, inner bright */}
            {holoMode && (
              <Layer
                id="countries-glow-outer"
                type="line"
                paint={{
                  'line-color': isLightTheme ? '#3dc2d0' : isThemedDark ? themedColor('#e0a020', '#e03050', '#30c050', '#49c6ff') : '#49c6ff',
                  'line-width': 4,
                  'line-blur': 6,
                  'line-opacity': showEUCountries
                    ? ['case', ['boolean', ['get', 'isEU'], false], 0, 0.2]
                    : 0.2,
                }}
              />
            )}
            {holoMode && (
              <Layer
                id="countries-glow-mid"
                type="line"
                paint={{
                  'line-color': isLightTheme ? '#2a8a94' : isThemedDark ? themedColor('#c89020', '#c83040', '#28a040', '#49c6ff') : '#49c6ff',
                  'line-width': 2,
                  'line-blur': 3,
                  'line-opacity': showEUCountries
                    ? ['case', ['boolean', ['get', 'isEU'], false], 0, 0.4]
                    : 0.4,
                }}
              />
            )}
            <Layer
              id="countries-line"
              type="line"
              paint={{
                'line-color': showTariffHeatmap
                  ? (isLightTheme ? 'rgba(30, 20, 50, 0.75)' : 'rgba(200, 210, 235, 0.6)')
                  : holoMode
                    ? (isLightTheme ? 'rgba(39, 35, 12, 0.82)' : isThemedDark ? themedColor('rgba(224, 160, 32, 0.60)', 'rgba(224, 48, 80, 0.60)', 'rgba(48, 192, 80, 0.60)', 'rgba(73, 198, 255, 0.65)') : 'rgba(73, 198, 255, 0.65)')
                    : (isLightTheme
                        ? 'rgba(30, 25, 50, 0.5)'
                        : isThemedDark ? themedColor('rgba(20, 16, 8, 0.7)', 'rgba(20, 8, 12, 0.7)', 'rgba(8, 20, 10, 0.7)', 'rgba(15, 20, 30, 0.7)') : 'rgba(15, 20, 30, 0.7)'),
                'line-width': showTariffHeatmap
                  ? [
                      'case',
                      ['boolean', ['feature-state', 'hover'], false],
                      2.8,
                      1.4,
                    ]
                  : holoMode
                    ? [
                        'case',
                        ['boolean', ['feature-state', 'hover'], false],
                        2.5,
                        1.6,
                      ]
                    : [
                        'case',
                        ['boolean', ['feature-state', 'hover'], false],
                        1.8,
                        0.8,
                      ],
                'line-opacity': showEUCountries
                  ? ['case', ['boolean', ['get', 'isEU'], false], 0, 1]
                  : 1,
              }}
            />
            {/* Selected country highlight */}
            <Layer
              id="countries-selected-fill"
              type="fill"
              filter={selectedCountryFilter}
              paint={{
                'fill-color': holoMode
                  ? (isLightTheme ? 'rgba(100, 189, 169, 0.47)' : isThemedDark ? themedColor('rgba(224, 160, 32, 0.1)', 'rgba(224, 48, 80, 0.1)', 'rgba(48, 192, 80, 0.1)', 'rgba(73, 198, 255, 0.1)') : 'rgba(73, 198, 255, 0.1)')
                  : (isLightTheme
                      ? 'rgba(194, 120, 62, 0.25)'
                      : isThemedDark ? themedColor('rgba(224, 160, 32, 0.20)', 'rgba(224, 48, 80, 0.20)', 'rgba(48, 192, 80, 0.20)', 'rgba(61, 194, 208, 0.25)') : 'rgba(61, 194, 208, 0.25)'),
              }}
            />
            {holoMode && (
              <Layer
                id="countries-selected-glow"
                type="line"
                filter={selectedCountryFilter}
                paint={{
                  'line-color': isLightTheme ? '#2a8a94' : isThemedDark ? themedColor('#e0a020', '#e03050', '#30c050', '#49c6ff') : '#49c6ff',
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
                  ? (isLightTheme ? '#2a8a94' : isThemedDark ? themedColor('#e0a020', '#e03050', '#30c050', '#49c6ff') : '#49c6ff')
                  : (isLightTheme ? '#2a8a94' : isThemedDark ? themedColor('#c89020', '#c83040', '#28a040', '#3dc2d0') : '#3dc2d0'),
                'line-width': holoMode ? 1.2 : 1.6,
              }}
            />
          </Source>

          {/* Water features — Suez Canal */}
          <Source id="water-canals" type="geojson" data={WATER_CANALS}>
            <Layer
              id="water-canals-line"
              type="line"
              paint={{
                'line-color': isLightTheme ? '#488FACFB' : isThemedDark ? themedColor('#0e0a04', '#0c0408', '#040c06', (holoMode ? '#0a1a30' : '#0a1525')) : (holoMode ? '#0a1a30' : '#0a1525'),
                'line-width': [
                  'interpolate', ['linear'], ['zoom'],
                  2, 1,
                  5, 2.5,
                  8, 5,
                  12, 10,
                ],
                'line-opacity': 1,
              }}
            />
            {holoMode && (
              <Layer
                id="water-canals-glow"
                type="line"
                paint={{
                  'line-color': isLightTheme ? '#3dc2d0' : isThemedDark ? themedColor('#e0a020', '#e03050', '#30c050', '#49c6ff') : '#49c6ff',
                  'line-width': [
                    'interpolate', ['linear'], ['zoom'],
                    2, 2,
                    5, 4,
                    8, 7,
                  ],
                  'line-blur': 4,
                  'line-opacity': 0.15,
                }}
              />
            )}
          </Source>

          {/* US States — only shown when toggled on */}
          {showUSStates && (
            <Source id="us-states" type="geojson" data={usStatesGeoJSON}>
              <Layer
                id="us-states-fill"
                type="fill"
                paint={{
                  'fill-color': electionMode
                    ? [
                        'case',
                        ['boolean', ['feature-state', 'hover'], false],
                        isLightTheme ? 'rgba(153, 0, 0, 0.8)' : isThemedDark ? themedColor('rgba(224, 160, 32, 0.3)', 'rgba(224, 48, 80, 0.3)', 'rgba(48, 192, 80, 0.3)', 'rgba(200, 180, 255, 0.3)') : 'rgba(200, 180, 255, 0.3)',
                        ['get', 'electionColor'],
                      ]
                    : [
                        'case',
                        ['boolean', ['feature-state', 'hover'], false],
                        isLightTheme
                          ? 'rgba(0, 18, 22, 0.15)'
                          : isThemedDark ? themedColor('rgba(224, 160, 32, 0.12)', 'rgba(224, 48, 80, 0.12)', 'rgba(48, 192, 80, 0.12)', 'rgba(61, 194, 208, 0.15)') : 'rgba(61, 194, 208, 0.15)',
                        'rgba(0, 0, 0, 0)',
                      ],
                  'fill-opacity': electionMode ? 0.7 : 1,
                }}
              />
              <Layer
                id="us-states-line"
                type="line"
                paint={{
                  'line-color': isLightTheme
                    ? 'rgba(11, 84, 167, 0.35)'
                    : isThemedDark ? themedColor('rgba(224, 160, 32, 0.30)', 'rgba(224, 48, 80, 0.30)', 'rgba(48, 192, 80, 0.30)', 'rgba(35, 220, 245, 0.35)') : 'rgba(35, 220, 245, 0.35)',
                  'line-width': 2,
                }}
              />
              <Layer
                id="us-states-selected-fill"
                type="fill"
                filter={selectedStateFilter}
                paint={{
                  'fill-color': isLightTheme
                    ? 'rgba(0, 153, 255, 0.22)'
                    : isThemedDark ? themedColor('rgba(224, 160, 32, 0.20)', 'rgba(224, 48, 80, 0.20)', 'rgba(48, 192, 80, 0.20)', 'rgba(61, 194, 208, 0.25)') : 'rgba(61, 194, 208, 0.25)',
                }}
              />
              <Layer
                id="us-states-selected-line"
                type="line"
                filter={selectedStateFilter}
                paint={{
                  'line-color': isLightTheme ? '#3F3CD896' : isThemedDark ? themedColor('#c89020', '#c83040', '#28a040', '#3dc2d0') : '#3dc2d0',
                  'line-width': 2.5,
                }}
              />
            </Source>
          )}

          {/* Canadian provinces — only shown when toggled on */}
          {showCAProvinces && (
            <Source id="ca-provinces" type="geojson" data={caProvincesGeoJSON}>
              {/* Invisible fill for click/hover interactivity */}
              <Layer
                id="ca-provinces-fill"
                type="fill"
                paint={{ 'fill-color': 'rgba(37, 96, 173, 0.15)', 'fill-opacity': 1 }}
              />
              {/* Province border lines */}
              <Layer
                id="ca-provinces-line"
                type="line"
                paint={{
                  'line-color': [
                    'case',
                    ['boolean', ['feature-state', 'hover'], false],
                    isLightTheme ? 'rgba(20, 51, 136, 0.7)' : isThemedDark ? themedColor('rgba(224, 160, 32, 0.55)', 'rgba(224, 48, 80, 0.55)', 'rgba(48, 192, 80, 0.55)', 'rgba(3, 165, 157, 0.6)') : 'rgba(3, 165, 157, 0.6)',
                    isLightTheme ? 'rgba(27, 84, 189, 0.3)' : isThemedDark ? themedColor('rgba(200, 144, 32, 0.5)', 'rgba(200, 48, 80, 0.5)', 'rgba(48, 160, 64, 0.5)', 'rgb(0, 238, 226)') : 'rgb(0, 238, 226)',
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
                  'line-color': isLightTheme ? '#2a8a94' : isThemedDark ? themedColor('#c89020', '#c83040', '#28a040', '#3dc2d0') : '#3dc2d0',
                  'line-width': 2,
                }}
              />
            </Source>
          )}

          {/* Indian States — boundaries with hover & selection highlighting */}
          {showINStates && indiaStatesGeoJSON && (
            <Source id="in-states" type="geojson" data={indiaStatesGeoJSON}>
              <Layer
                id="in-states-fill"
                type="fill"
                paint={{
                  'fill-color': [
                    'case',
                    ['boolean', ['feature-state', 'hover'], false],
                    isLightTheme ? 'rgba(255, 140, 20, 0.18)' : 'rgba(255, 153, 51, 0.2)',
                    'rgba(255, 153, 51, 0.05)',
                  ],
                  'fill-opacity': 1,
                }}
              />
              <Layer
                id="in-states-line"
                type="line"
                paint={{
                  'line-color': [
                    'case',
                    ['boolean', ['feature-state', 'hover'], false],
                    isLightTheme ? 'rgba(255, 120, 20, 0.8)' : 'rgba(255, 180, 60, 0.8)',
                    isLightTheme ? 'rgba(255, 120, 20, 0.5)' : 'rgba(255, 153, 51, 0.6)',
                  ],
                  'line-width': [
                    'case',
                    ['boolean', ['feature-state', 'hover'], false],
                    1.5,
                    0.8,
                  ],
                }}
              />
              {/* Selected state highlight — fill + border */}
              <Layer
                id="in-states-selected-fill"
                type="fill"
                filter={selectedINStateFilter}
                paint={{
                  'fill-color': isLightTheme
                    ? 'rgba(255, 140, 20, 0.25)'
                    : 'rgba(255, 153, 51, 0.3)',
                }}
              />
              <Layer
                id="in-states-selected-line"
                type="line"
                filter={selectedINStateFilter}
                paint={{
                  'line-color': isLightTheme ? '#e07020' : '#ff9933',
                  'line-width': 2.5,
                }}
              />
            </Source>
          )}

          {/* Russian Oblasts — boundaries with hover & selection highlighting */}
          {showRUOblasts && ruOblastsGeoJSON && (
            <Source id="ru-oblasts" type="geojson" data={ruOblastsGeoJSON}>
              <Layer
                id="ru-oblasts-fill"
                type="fill"
                paint={{
                  'fill-color': [
                    'case',
                    ['boolean', ['feature-state', 'hover'], false],
                    isLightTheme ? 'rgba(220, 50, 50, 0.18)' : 'rgba(230, 70, 70, 0.2)',
                    'rgba(200, 60, 60, 0.05)',
                  ],
                  'fill-opacity': 1,
                }}
              />
              <Layer
                id="ru-oblasts-line"
                type="line"
                paint={{
                  'line-color': [
                    'case',
                    ['boolean', ['feature-state', 'hover'], false],
                    isLightTheme ? 'rgba(200, 50, 50, 0.8)' : 'rgba(230, 100, 80, 0.8)',
                    isLightTheme ? 'rgba(200, 50, 50, 0.5)' : 'rgba(200, 80, 60, 0.6)',
                  ],
                  'line-width': [
                    'case',
                    ['boolean', ['feature-state', 'hover'], false],
                    1.5,
                    0.8,
                  ],
                }}
              />
              <Layer
                id="ru-oblasts-selected-fill"
                type="fill"
                filter={selectedRUOblastFilter}
                paint={{
                  'fill-color': isLightTheme
                    ? 'rgba(220, 50, 50, 0.25)'
                    : 'rgba(230, 70, 70, 0.3)',
                }}
              />
              <Layer
                id="ru-oblasts-selected-line"
                type="line"
                filter={selectedRUOblastFilter}
                paint={{
                  'line-color': isLightTheme ? '#c03030' : '#e06040',
                  'line-width': 2.5,
                }}
              />
            </Source>
          )}

          {/* UK Nations — boundaries with hover & selection highlighting */}
          {showUKNations && ukNationsGeoJSON && (
            <Source id="uk-nations" type="geojson" data={ukNationsGeoJSON}>
              <Layer
                id="uk-nations-fill"
                type="fill"
                paint={{
                  'fill-color': [
                    'case',
                    ['boolean', ['feature-state', 'hover'], false],
                    isLightTheme ? 'rgba(30, 120, 180, 0.18)' : 'rgba(50, 160, 220, 0.2)',
                    'rgba(40, 140, 200, 0.05)',
                  ],
                  'fill-opacity': 1,
                }}
              />
              <Layer
                id="uk-nations-line"
                type="line"
                paint={{
                  'line-color': [
                    'case',
                    ['boolean', ['feature-state', 'hover'], false],
                    isLightTheme ? 'rgba(30, 100, 160, 0.8)' : 'rgba(60, 180, 230, 0.8)',
                    isLightTheme ? 'rgba(30, 100, 160, 0.5)' : 'rgba(50, 160, 220, 0.6)',
                  ],
                  'line-width': [
                    'case',
                    ['boolean', ['feature-state', 'hover'], false],
                    1.5,
                    0.8,
                  ],
                }}
              />
              <Layer
                id="uk-nations-selected-fill"
                type="fill"
                filter={selectedUKNationFilter}
                paint={{
                  'fill-color': isLightTheme
                    ? 'rgba(30, 120, 180, 0.25)'
                    : 'rgba(50, 160, 220, 0.3)',
                }}
              />
              <Layer
                id="uk-nations-selected-line"
                type="line"
                filter={selectedUKNationFilter}
                paint={{
                  'line-color': isLightTheme ? '#1e6ea0' : '#30a0e0',
                  'line-width': 2.5,
                }}
              />
            </Source>
          )}

          {/* EU unified entity — holographic gold glow when toggled on */}
          {showEUCountries && (
            <Source id="eu-countries" type="geojson" data={euCountriesGeoJSON}>
              {/* Outer glow — wide soft halo */}
              <Layer
                id="eu-countries-glow-outer"
                type="line"
                paint={{
                  'line-color': isLightTheme ? '#b8960a' : '#ffd700',
                  'line-width': 5,
                  'line-blur': 8,
                  'line-opacity': 0.2,
                }}
              />
              {/* Mid glow — tighter bloom */}
              <Layer
                id="eu-countries-glow-mid"
                type="line"
                paint={{
                  'line-color': isLightTheme ? '#c4a000' : '#ffd700',
                  'line-width': 3,
                  'line-blur': 4,
                  'line-opacity': 0.35,
                }}
              />
              {/* Crisp holographic EU border */}
              <Layer
                id="eu-countries-border"
                type="line"
                paint={{
                  'line-color': isLightTheme ? 'rgba(180, 150, 20, 0.7)' : 'rgba(255, 215, 0, 0.6)',
                  'line-width': [
                    'case',
                    ['boolean', ['feature-state', 'hover'], false],
                    2.5,
                    1.8,
                  ],
                }}
              />
              {/* Subtle EU tinted fill — interactive */}
              <Layer
                id="eu-countries-fill"
                type="fill"
                paint={{
                  'fill-color': [
                    'case',
                    ['boolean', ['feature-state', 'hover'], false],
                    isLightTheme ? 'rgba(180, 160, 30, 0.18)' : 'rgba(255, 215, 0, 0.12)',
                    isLightTheme ? 'rgba(180, 160, 30, 0.08)' : 'rgba(255, 215, 0, 0.05)',
                  ],
                  'fill-opacity': 1,
                }}
              />
            </Source>
          )}

          {/* Conflict Overlay — frontlines, occupied territory, coat of arms, NATO symbols */}
          <ConflictOverlay
            visible={conflictMode}
            showTroops={conflictShowTroops}
            zoom={mapZoom}
            isMarkerVisible={isMarkerVisible}
            onTroopClick={(unit) => {
              if (!conflictPanelOpen) {
                setConflictPanelOpen(true);
              }
            }}
          />

          {/* ══════════ Additional Conflict Overlays ══════════ */}
          {ADDITIONAL_CONFLICTS.map((conflict) => (
            <GenericConflictOverlay
              key={`conflict-overlay-${conflict.id}`}
              visible={!!activeConflicts[conflict.id]}
              conflictData={conflict.data}
              showTroops={conflictTroops[conflict.id] !== false}
              zoom={mapZoom}
              isMarkerVisible={isMarkerVisible}
              showLegend={!!conflictLegends[conflict.id]}
              onLegendToggle={() => setConflictLegends(prev => ({ ...prev, [conflict.id]: !prev[conflict.id] }))}
              onTroopClick={() => {
                if (!conflictPanels[conflict.id]) {
                  setConflictPanels(prev => ({ ...prev, [conflict.id]: true }));
                }
              }}
            />
          ))}

          {/* ══════════ Protest / Unrest Heatmap ══════════ */}
          <ProtestHeatmap
            visible={stabilityMode && showProtestHeatmap}
            protests={stabilityData?.protests || []}
            zoom={mapZoom}
            isMarkerVisible={isMarkerVisible}
            mapCenter={mapCenter}
            useGlobe={useGlobe}
            transparentGlobe={transparentGlobe}
          />

          {/* ══════════ Military Movement Indicators ══════════ */}
          <MilitaryOverlay
            visible={(stabilityMode && showMilitaryOverlay) || showUSBases}
            indicators={stabilityMode && showMilitaryOverlay ? (stabilityData?.military || []) : []}
            zoom={mapZoom}
            showBases={showUSBases}
            isMarkerVisible={isMarkerVisible}
            fleetPositions={stabilityData?.fleetPositions}
          />

          {/* Disaster markers on map */}
          {enabledLayers.severeWeather && disasterData?.activeEvents && (
            <DisasterOverlay
              events={disasterData.activeEvents}
              isMarkerVisible={isMarkerVisible}
              onEventClick={(event) => {
                if (event.lat && event.lon && mapRef.current) {
                  mapRef.current.flyTo({ center: [event.lon, event.lat], zoom: 5, duration: 1400, essential: true });
                }
              }}
            />
          )}

          {/* Shipping chokepoint markers on map */}
          {showShippingMode && shippingData?.chokepoints && (
            <ShippingOverlay
              chokepoints={shippingData.chokepoints}
              isMarkerVisible={isMarkerVisible}
              onChokepointClick={(cp) => {
                if (cp.lat && cp.lon && mapRef.current) {
                  mapRef.current.flyTo({ center: [cp.lon, cp.lat], zoom: 5, duration: 1400, essential: true });
                }
              }}
            />
          )}

          {/* Refugee displacement markers on map */}
          {showRefugeePanel && refugeeData?.situations && (
            <RefugeeOverlay
              situations={refugeeData.situations}
              isMarkerVisible={isMarkerVisible}
              onSituationClick={(s) => {
                if (s.lat && s.lon && mapRef.current) {
                  mapRef.current.flyTo({ center: [s.lon, s.lat], zoom: 4, duration: 1400, essential: true });
                }
              }}
            />
          )}

          {/* Country risk markers on map */}
          {showCountryRiskMode && countryRiskData?.scores && (
            <RiskOverlay
              scores={countryRiskData.scores}
              isMarkerVisible={isMarkerVisible}
              onCountryClick={(c) => {
                if (c.lat && c.lon && mapRef.current) {
                  mapRef.current.flyTo({ center: [c.lon, c.lat], zoom: 5, duration: 1400, essential: true });
                }
              }}
            />
          )}

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
                  0.15, isLightTheme ? 'rgba(100,160,220,0.4)' : isThemedDark ? themedColor('rgba(180,140,40,0.25)', 'rgba(180,48,60,0.25)', 'rgba(48,160,60,0.25)', 'rgba(73,198,255,0.25)') : 'rgba(73,198,255,0.25)',
                  0.4, isLightTheme ? 'rgba(60,190,170,0.55)' : isThemedDark ? themedColor('rgba(200,120,20,0.45)', 'rgba(200,48,60,0.45)', 'rgba(48,160,50,0.45)', 'rgba(100,80,220,0.5)') : 'rgba(100,80,220,0.5)',
                  0.65, isLightTheme ? 'rgba(240,170,50,0.65)' : isThemedDark ? themedColor('rgba(220,80,20,0.55)', 'rgba(220,48,40,0.55)', 'rgba(48,180,50,0.55)', 'rgba(220,80,200,0.6)') : 'rgba(220,80,200,0.6)',
                  1.0, isLightTheme ? 'rgba(220,60,40,0.75)' : isThemedDark ? themedColor('rgba(200,40,20,0.65)', 'rgba(200,30,40,0.65)', 'rgba(40,160,40,0.65)', 'rgba(255,85,85,0.7)') : 'rgba(255,85,85,0.7)',
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
                    : isThemedDark ? themedColor('rgba(200, 144, 32, 0.6)', 'rgba(200, 48, 80, 0.6)', 'rgba(48, 160, 64, 0.6)', 'rgba(73, 198, 255, 0.7)') : 'rgba(73, 198, 255, 0.7)',
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
          {enabledLayers.severeWeather && severeEvents
            .filter((e) => isMarkerVisible(e.lon, e.lat))
            .slice(0, 150)
            .map((event) => {
            const color = { earthquake: '#ff4444', storm: '#6ee6ff', wildfire: '#ff8c00', volcano: '#ff5555', flood: '#4488ff' }[event.type] || '#f5c542';
            const size = event.type === 'earthquake'
              ? Math.max(8, Math.min(20, (event.magnitude || 5) * 2.5))
              : 10;
            const shouldPulse = event.severity === 'extreme' || event.severity === 'severe';
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
                  {shouldPulse && <div className="severe-marker-pulse pulse-active" style={{ borderColor: color }} />}
                </div>
              </Marker>
            );
          })}

          {/* Infrastructure vulnerability markers */}
          {showInfrastructurePanel && infrastructureData?.infrastructure?.map((infra) => {
            if (!infra.location?.lat || !infra.location?.lon) return null;
            if (!isMarkerVisible(infra.location.lon, infra.location.lat)) return null;
            const catColors = { energy: '#f59e0b', digital: '#3b82f6', transport: '#06b6d4', financial: '#22c55e', food_water: '#8b5cf6' };
            const color = catColors[infra.category] || '#888';
            const vulnColor = infra.vulnerabilityScore >= 75 ? '#ef4444' : infra.vulnerabilityScore >= 50 ? '#f97316' : color;
            return (
              <Marker key={infra.id} longitude={infra.location.lon} latitude={infra.location.lat} anchor="center">
                <div
                  title={`${infra.name} (${infra.category}) — Vulnerability: ${infra.vulnerabilityScore}`}
                  style={{
                    width: 12, height: 12, borderRadius: '50%',
                    background: vulnColor, border: '2px solid rgba(0,0,0,0.4)',
                    boxShadow: `0 0 6px ${vulnColor}80`,
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    mapRef.current?.flyTo({ center: [infra.location.lon, infra.location.lat], zoom: 6, duration: 1200, essential: true });
                  }}
                />
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

          {/* Hotspots — dot size scales with article count */}
          {hotspots.filter((h) => isMarkerVisible(h.lon, h.lat)).map((hotspot) => {
            const isActive = hotspot.id === selectedHotspotId;
            const isRecent = isRecentlyUpdated(hotspot.lastUpdated);
            const isStale = !isRecent && new Date() - new Date(hotspot.lastUpdated) > 86400000;
            // Tier: high (10+), mid (5-9), low (2-4) items
            const tier = hotspot.count >= 10 ? 'high' : hotspot.count >= 5 ? 'mid' : 'low';
            // Dynamic dot size: 10px at 2 items → 28px at 20+ items
            const dotSize = Math.round(10 + Math.min(18, (hotspot.count / 20) * 18));

            return (
              <Marker
                key={hotspot.id}
                longitude={hotspot.lon}
                latitude={hotspot.lat}
                anchor="center"
              >
                <div
                  className={`hs-wrap ${isStale ? 'hs-stale' : ''} ${isActive ? 'hs-selected' : ''} hs-${tier}`}
                  onMouseEnter={(e) => handleHotspotMouseEnter(hotspot, e)}
                  onMouseLeave={handleHotspotMouseLeave}
                  onClick={(e) => handleHotspotClick(hotspot, e)}
                >
                  {/* Ping ring for active hotspots */}
                  {!isStale && tier !== 'low' && <span className="hs-ping" style={{ width: dotSize, height: dotSize }} />}
                  <span className="hs-dot" style={{ width: dotSize, height: dotSize }} />
                  <div className="hs-label">
                    <span className="hs-name">{hotspot.name}</span>
                    <span className="hs-count">{hotspot.count}</span>
                  </div>
                </div>
              </Marker>
            );
          })}

          {/* Pole markers — 3D globe only */}
          {useGlobe && (
            <>
              <Marker longitude={0} latitude={90} anchor="center">
                <div className="pole-marker">
                  <div className="pole-ring" />
                  <span className="pole-label">N</span>
                </div>
              </Marker>
              <Marker longitude={0} latitude={-90} anchor="center">
                <div className="pole-marker">
                  <div className="pole-ring" />
                  <span className="pole-label">S</span>
                </div>
              </Marker>
            </>
          )}

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

        {/* Map controls - bottom left, grouped with zoom */}
        {(() => {
          // Determine if arrow is in top or bottom half of map — controls expand away from the edge
          const containerH = mapContainerRef.current?.getBoundingClientRect().height || 600;
          const bottomPx = mapControlsPos ? mapControlsPos.y : 150;
          const arrowInBottomHalf = bottomPx < containerH / 2;
          // When arrow is in bottom half → controls above arrow (column, arrow last)
          // When arrow is in top half → controls below arrow (column-reverse, arrow first)

          const collapseBtn = (
            <div className="map-collapse-toggle-bl">
              <button
                className={`map-autorotate-btn map-controls-collapse-btn${mapControlsCollapsed ? ' map-controls-draggable' : ''}`}
                onClick={() => {
                  if (!mapControlsDragRef.current?.dragged) {
                    setMapControlsCollapsed(prev => !prev);
                  }
                  if (mapControlsDragRef.current) mapControlsDragRef.current.dragged = false;
                }}
                onMouseDown={mapControlsCollapsed ? (e) => {
                  const startX = e.clientX;
                  const startY = e.clientY;
                  const container = mapContainerRef.current;
                  if (!container) return;
                  const rect = container.getBoundingClientRect();
                  const group = e.currentTarget.closest('.map-controls-group');
                  const groupRect = group.getBoundingClientRect();
                  const startLeft = groupRect.left - rect.left;
                  const startBottom = rect.bottom - groupRect.bottom;
                  mapControlsDragRef.current = { dragged: false };

                  const onMove = (ev) => {
                    const dx = ev.clientX - startX;
                    const dy = ev.clientY - startY;
                    if (!mapControlsDragRef.current.dragged && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
                      mapControlsDragRef.current.dragged = true;
                    }
                    if (mapControlsDragRef.current.dragged) {
                      const newLeft = Math.max(0, Math.min(rect.width - 40, startLeft + dx));
                      const newBottom = Math.max(0, Math.min(rect.height - 40, startBottom - dy));
                      setMapControlsPos({ x: newLeft, y: newBottom });
                    }
                  };
                  const onUp = () => {
                    window.removeEventListener('mousemove', onMove);
                    window.removeEventListener('mouseup', onUp);
                  };
                  window.addEventListener('mousemove', onMove);
                  window.addEventListener('mouseup', onUp);
                } : undefined}
                title={mapControlsCollapsed ? 'Show controls (drag to reposition)' : 'Hide controls'}
                aria-label="Toggle map controls"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  {/* Arrow points toward the controls: down when controls below, up when controls above */}
                  {mapControlsCollapsed
                    ? (arrowInBottomHalf
                        ? <polyline points="6 15 12 9 18 15" />
                        : <polyline points="6 9 12 15 18 9" />)
                    : (arrowInBottomHalf
                        ? <polyline points="6 9 12 15 18 9" />
                        : <polyline points="6 15 12 9 18 15" />)
                  }
                </svg>
              </button>
            </div>
          );

          const controls = (
            <div className="map-controls-bl">
              {useGlobe && !mapControlsCollapsed && (
                <div className="map-rotation-controls">
                  {autoRotate && (
                    <input
                      type="range"
                      className="rotate-speed-slider"
                      min="0.005"
                      max="0.2"
                      step="0.005"
                      value={rotateSpeed}
                      onChange={(e) => setRotateSpeed(Number(e.target.value))}
                      title={`Rotation speed: ${Math.round(rotateSpeed * 60)}°/s`}
                      aria-label="Rotation speed"
                    />
                  )}
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
                </div>
              )}
              {!mapControlsCollapsed && (
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
              )}
            </div>
          );

          return (
            <div
              className="map-controls-group"
              style={mapControlsPos ? { left: mapControlsPos.x, bottom: mapControlsPos.y } : undefined}
            >
              {arrowInBottomHalf ? (
                <>{controls}{collapseBtn}</>
              ) : (
                <>{collapseBtn}{controls}</>
              )}
            </div>
          );
        })()}

        {/* Tooltip — ref-based, updated imperatively to avoid re-renders */}
        <div
          ref={tooltipRef}
          className="map-tooltip"
          style={{ position: 'absolute', pointerEvents: 'none', display: 'none' }}
        />
      </div>
    </div>
    </div>
    <PagePanel pageId={activePage} onClose={() => setActivePage(null)} />
    {showAccount && <AccountPanel onClose={() => setShowAccount(false)} />}
    <MinimizedTray />
    {showShortcutsHelp && (
      <div
        onClick={() => setShowShortcutsHelp(false)}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99998,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(4px)',
        }}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{
            background: 'linear-gradient(135deg, rgba(20,25,35,0.98), rgba(30,40,55,0.98))',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            padding: '28px 32px',
            minWidth: '320px',
            color: '#fff',
          }}
        >
          <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600 }}>Keyboard Shortcuts</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
            {[
              ['Ctrl+K', 'Global search'],
              ['Esc', 'Close latest panel'],
              ['Space', 'Toggle auto-rotate'],
              ['[ / ]', 'Cycle sidebar tabs'],
              ['?', 'Show/hide this help'],
            ].map(([key, desc]) => (
              <div key={key} style={{ display: 'flex', justifyContent: 'space-between', gap: '24px' }}>
                <kbd style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '4px',
                  padding: '2px 8px',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  minWidth: '48px',
                  textAlign: 'center',
                }}>{key}</kbd>
                <span style={{ color: 'rgba(255,255,255,0.6)' }}>{desc}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <button
              onClick={() => setShowShortcutsHelp(false)}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '6px',
                color: 'rgba(255,255,255,0.5)',
                padding: '6px 20px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >Close</button>
          </div>
        </div>
      </div>
    )}
    <CommandPalette
      open={showCommandPalette}
      onClose={() => setShowCommandPalette(false)}
      onSelect={(item) => {
        // Handle navigation based on selected item
        if (item.category === 'Panel') {
          const panelMap = {
            health: setShowHealthPanel,
            cyber: setShowCyberPanel,
            commodities: setShowCommoditiesPanel,
            refugees: setShowRefugeePanel,
            shipping: () => { setShowShippingMode(true); setShowShippingPanel(true); },
            sanctions: setShowSanctionsPanel,
            court: setShowCourtPanel,
            stability: setShowStabilityPanel,
            tension: setShowTensionPanel,
            briefing: setShowBriefingPanel,
            climate: setShowClimatePanel,
            nuclear: setShowNuclearPanel,
            aitech: setShowAiTechPanel,
          };
          const setter = panelMap[item.id];
          if (typeof setter === 'function') setter(true);
        }
      }}
    />
    <OfflineIndicator />
    <OnboardingTour />
    </>
    </WindowManagerProvider>
  );
}

export default App;
