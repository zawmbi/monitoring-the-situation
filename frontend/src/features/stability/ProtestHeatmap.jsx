/**
 * ProtestHeatmap — MapLibre heatmap layer showing protest / unrest intensity
 * Renders as a glowing heat overlay on the globe.
 */

import { useMemo } from 'react';
import { Source, Layer, Marker } from '@vis.gl/react-maplibre';

export default function ProtestHeatmap({ visible, protests = [], zoom = 2 }) {
  const geoJSON = useMemo(() => ({
    type: 'FeatureCollection',
    features: protests
      .filter((p) => p.lat && p.lon)
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
  }), [protests]);

  const showLabels = zoom >= 3;

  if (!visible) return null;

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

      {/* Labels for high-intensity protest zones */}
      {showLabels && protests.filter((p) => (p.intensity || p.count || 0) >= 4).map((p) => (
        <Marker key={`plbl-${p.id}`} longitude={p.lon} latitude={p.lat} anchor="top">
          <div className="protest-label" title={`${p.country}: ${p.label}`}>
            <span className="protest-label-dot" />
            <span className="protest-label-text">{p.label || p.country}</span>
          </div>
        </Marker>
      ))}
    </>
  );
}
