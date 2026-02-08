/**
 * FrontlineOverlay — MapLibre version
 * Renders the UA/RU frontline as GeoJSON line layers on the map.
 */
import { useMemo } from 'react';
import { Source, Layer, Marker } from '@vis.gl/react-maplibre';
import {
  FRONTLINE_SEGMENTS,
  UKRAINE_BLUE,
  UKRAINE_YELLOW,
  RUSSIA_BLUE,
  RUSSIA_RED,
} from './frontlineData';

// Build a single GeoJSON FeatureCollection with one LineString per segment
function buildFrontlineGeoJSON() {
  return {
    type: 'FeatureCollection',
    features: FRONTLINE_SEGMENTS.map((seg) => ({
      type: 'Feature',
      properties: { id: seg.id, label: seg.label },
      geometry: {
        type: 'LineString',
        coordinates: seg.points,
      },
    })),
  };
}

const FRONTLINE_GEOJSON = buildFrontlineGeoJSON();

// Midpoints for sector labels
const SECTOR_LABELS = FRONTLINE_SEGMENTS.map((seg) => {
  const mid = seg.points[Math.floor(seg.points.length / 2)];
  return { id: seg.id, label: seg.label, lon: mid[0], lat: mid[1] };
});

export default function FrontlineOverlay({ visible }) {
  const visibility = visible ? 'visible' : 'none';

  return (
    <>
      <Source id="frontline" type="geojson" data={FRONTLINE_GEOJSON}>
        {/* Background glow */}
        <Layer
          id="frontline-glow"
          type="line"
          layout={{ visibility, 'line-cap': 'round', 'line-join': 'round' }}
          paint={{
            'line-color': 'rgba(255, 60, 60, 0.2)',
            'line-width': 10,
          }}
        />

        {/* Ukraine side - blue */}
        <Layer
          id="frontline-ua-base"
          type="line"
          layout={{ visibility, 'line-cap': 'butt' }}
          paint={{
            'line-color': UKRAINE_BLUE,
            'line-width': 4,
            'line-offset': -3,
          }}
        />
        {/* Ukraine side - yellow dashes */}
        <Layer
          id="frontline-ua-dash"
          type="line"
          layout={{ visibility, 'line-cap': 'butt' }}
          paint={{
            'line-color': UKRAINE_YELLOW,
            'line-width': 4,
            'line-dasharray': [2, 2],
            'line-offset': -3,
          }}
        />

        {/* Center frontline - red */}
        <Layer
          id="frontline-center"
          type="line"
          layout={{ visibility, 'line-cap': 'round', 'line-join': 'round' }}
          paint={{
            'line-color': 'rgba(255, 50, 50, 0.95)',
            'line-width': 1.5,
          }}
        />

        {/* Russia side - red */}
        <Layer
          id="frontline-ru-base"
          type="line"
          layout={{ visibility, 'line-cap': 'butt' }}
          paint={{
            'line-color': RUSSIA_RED,
            'line-width': 4,
            'line-offset': 3,
          }}
        />
        {/* Russia side - blue dashes */}
        <Layer
          id="frontline-ru-dash"
          type="line"
          layout={{ visibility, 'line-cap': 'butt' }}
          paint={{
            'line-color': RUSSIA_BLUE,
            'line-width': 4,
            'line-dasharray': [2, 2],
            'line-offset': 3,
          }}
        />
      </Source>

      {/* Sector labels */}
      {visible && SECTOR_LABELS.map((s) => (
        <Marker key={`fl-label-${s.id}`} longitude={s.lon} latitude={s.lat} anchor="right">
          <span
            style={{
              fontSize: '10px',
              fontWeight: 600,
              color: 'var(--color-text-secondary)',
              textShadow: '0 0 4px rgba(0,0,0,0.7)',
              pointerEvents: 'none',
              marginRight: 14,
              whiteSpace: 'nowrap',
            }}
          >
            {s.label}
          </span>
        </Marker>
      ))}
    </>
  );
}
