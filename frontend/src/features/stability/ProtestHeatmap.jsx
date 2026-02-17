/**
 * ProtestHeatmap — MapLibre heatmap layer showing protest / unrest intensity
 * Renders as a glowing heat overlay on the globe with clickable markers
 * that show country details, intensity, and live GDELT news articles.
 */

import { useState, useMemo } from 'react';
import { Source, Layer, Marker } from '@vis.gl/react-maplibre';

// Convert ISO alpha-2 → flag emoji
function countryFlag(code) {
  if (!code || code.length !== 2) return '';
  return String.fromCodePoint(
    ...code.toUpperCase().split('').map((c) => 0x1F1E6 + c.charCodeAt(0) - 65)
  );
}

// Protest type labels
const TYPE_LABELS = {
  protest: 'Protest',
  resistance: 'Resistance',
  unrest: 'Civil Unrest',
};

// Intensity color scale
function intensityColor(val) {
  if (val >= 8) return '#ff2222';
  if (val >= 6) return '#ff6600';
  if (val >= 4) return '#ffaa00';
  return '#ffd700';
}

function intensityLabel(val) {
  if (val >= 8) return 'CRITICAL';
  if (val >= 6) return 'HIGH';
  if (val >= 4) return 'ELEVATED';
  return 'LOW';
}

/* ─── Protest Popup ─── */
function ProtestPopup({ protest, onClose }) {
  const flag = countryFlag(protest.code);
  const intensity = protest.intensity || protest.count || 3;
  const color = intensityColor(intensity);
  const articles = protest.articles || [];
  const searchQuery = `${protest.country || protest.code} protest unrest ${new Date().getFullYear()}`;

  return (
    <div className="protest-popup" onClick={(e) => e.stopPropagation()}>
      <div className="protest-popup-header">
        <div className="protest-popup-title-row">
          <span className="protest-popup-flag">{flag}</span>
          <span className="protest-popup-title">{protest.country || protest.code}</span>
          {protest.live && (
            <span className="protest-popup-live-badge">LIVE</span>
          )}
        </div>
        <button className="protest-popup-close" onClick={onClose}>✕</button>
      </div>

      <div className="protest-popup-badges">
        <span className="protest-popup-severity" style={{ background: color }}>
          {intensityLabel(intensity)}
        </span>
        <span className="protest-popup-type">
          {TYPE_LABELS[protest.type] || protest.type || 'Unrest'}
        </span>
      </div>

      <div className="protest-popup-body">
        <div className="protest-popup-desc">{protest.label}</div>

        {/* Intensity bar */}
        <div className="protest-popup-meter">
          <div className="protest-popup-meter-label">Intensity</div>
          <div className="protest-popup-meter-track">
            <div
              className="protest-popup-meter-fill"
              style={{ width: `${Math.min(100, (intensity / 10) * 100)}%`, background: color }}
            />
          </div>
          <div className="protest-popup-meter-val" style={{ color }}>{intensity}/10</div>
        </div>

        {/* GDELT article count if live */}
        {protest.live && protest.count && (
          <div className="protest-popup-stat">
            <span className="protest-popup-stat-key">GDELT Articles (14d)</span>
            <span className="protest-popup-stat-val" style={{ color: '#5baaff' }}>{protest.count}</span>
          </div>
        )}

        <div className="protest-popup-stat">
          <span className="protest-popup-stat-key">Coordinates</span>
          <span className="protest-popup-stat-val">{protest.lat?.toFixed(2)}°N, {protest.lon?.toFixed(2)}°E</span>
        </div>
      </div>

      {/* News articles from GDELT */}
      {articles.length > 0 && (
        <div className="protest-popup-articles">
          <div className="protest-popup-articles-title">Recent News</div>
          {articles.slice(0, 4).map((a, i) => (
            <a key={i} className="protest-popup-article" href={a.url} target="_blank" rel="noopener noreferrer">
              <span className="protest-popup-article-text">{a.title}</span>
              {a.source && <span className="protest-popup-article-source">{a.source}</span>}
            </a>
          ))}
        </div>
      )}

      <div className="protest-popup-footer">
        <a
          className="protest-popup-news-link"
          href={`https://news.google.com/search?q=${encodeURIComponent(searchQuery)}&hl=en`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Search latest news
        </a>
        <span className="protest-popup-source">
          {protest.live ? 'GDELT Project (live)' : 'Baseline OSINT'}
        </span>
      </div>
    </div>
  );
}

/* ─── Clickable Protest Marker ─── */
function ProtestMarker({ protest, showLabel, isSelected, onClick }) {
  const intensity = protest.intensity || protest.count || 3;
  const color = intensityColor(intensity);
  const isHigh = intensity >= 6;

  return (
    <div
      className={`protest-marker ${isHigh ? 'protest-marker--high' : ''}`}
      onClick={(e) => { e.stopPropagation(); onClick(protest); }}
    >
      <div className="protest-marker-dot" style={{ background: color, boxShadow: `0 0 8px ${color}88` }}>
        <span className="protest-marker-icon">{intensity >= 8 ? '!' : '•'}</span>
      </div>
      {showLabel && (
        <span className="protest-marker-label" style={{ color }}>
          {protest.label || protest.country}
        </span>
      )}
    </div>
  );
}

export default function ProtestHeatmap({ visible, protests = [], zoom = 2, isMarkerVisible, mapCenter, useGlobe, transparentGlobe }) {
  const [selectedProtest, setSelectedProtest] = useState(null);

  const geoJSON = useMemo(() => {
    const toRad = Math.PI / 180;
    const shouldFilter = useGlobe && !transparentGlobe && mapCenter;
    return {
      type: 'FeatureCollection',
      features: protests
        .filter((p) => {
          if (!p.lat || !p.lon) return false;
          if (!shouldFilter) return true;
          const lat1 = mapCenter.lat * toRad;
          const lat2 = p.lat * toRad;
          const dLng = (p.lon - mapCenter.lng) * toRad;
          const cosAngle = Math.sin(lat1) * Math.sin(lat2) + Math.cos(lat1) * Math.cos(lat2) * Math.cos(dLng);
          return cosAngle > 0.1;
        })
        .map((p) => ({
          type: 'Feature',
          properties: {
            intensity: p.intensity || p.count || 3,
            id: p.id,
            label: p.label || p.country,
          },
          geometry: {
            type: 'Point',
            coordinates: [p.lon, p.lat],
          },
        })),
    };
  }, [protests, mapCenter, useGlobe, transparentGlobe]);

  const showLabels = zoom >= 3;
  const showMarkers = zoom >= 2;

  if (!visible) return null;

  const handleClick = (protest) => {
    if (selectedProtest?.id === protest.id) {
      setSelectedProtest(null);
    } else {
      setSelectedProtest(protest);
    }
  };

  return (
    <>
      <Source id="protest-heatmap" type="geojson" data={geoJSON}>
        {/* Heatmap layer — glowing red/orange */}
        <Layer
          id="protest-heat"
          type="heatmap"
          paint={{
            'heatmap-weight': ['interpolate', ['linear'], ['get', 'intensity'], 0, 0, 10, 1],
            'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 0.6, 5, 1.2, 10, 2],
            'heatmap-color': [
              'interpolate', ['linear'], ['heatmap-density'],
              0, 'rgba(255,200,50,0)',
              0.15, 'rgba(255,180,0,0.25)',
              0.3, 'rgba(255,140,0,0.45)',
              0.5, 'rgba(255,80,0,0.6)',
              0.7, 'rgba(255,40,0,0.75)',
              0.9, 'rgba(220,0,0,0.85)',
              1, 'rgba(180,0,0,1)',
            ],
            'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 15, 3, 30, 6, 50, 10, 80],
            'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 0, 0.7, 8, 0.5, 14, 0.3],
          }}
        />
      </Source>

      {/* Clickable protest markers */}
      {showMarkers && protests
        .filter((p) => p.lat && p.lon && (!isMarkerVisible || isMarkerVisible(p.lon, p.lat)))
        .map((p) => (
          <Marker key={`pm-${p.id}`} longitude={p.lon} latitude={p.lat} anchor="center">
            <ProtestMarker
              protest={p}
              showLabel={showLabels}
              isSelected={selectedProtest?.id === p.id}
              onClick={handleClick}
            />
            {selectedProtest?.id === p.id && (
              <div className="protest-popup-anchor">
                <ProtestPopup protest={p} onClose={() => setSelectedProtest(null)} />
              </div>
            )}
          </Marker>
        ))}
    </>
  );
}
