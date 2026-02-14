/**
 * MilitaryOverlay — Map markers for military movement indicators (OSINT-derived)
 * Shows force type icons with severity-coded markers.
 */

import { Marker } from '@vis.gl/react-maplibre';
import { SEVERITY_COLORS, FORCE_ICONS } from './stabilityData';

const ZOOM_SHOW = 2;
const ZOOM_LABELS = 3;

function MilitaryMarker({ item, showLabel }) {
  const color = SEVERITY_COLORS[item.severity] || SEVERITY_COLORS.elevated;
  const icon = FORCE_ICONS[item.force] || '⬡';
  const isPulsing = item.severity === 'critical' || item.severity === 'high';

  return (
    <div
      className={`mil-marker mil-marker--${item.severity}`}
      title={`${item.country}: ${item.label}\nSeverity: ${item.severity?.toUpperCase()}\nForce: ${item.force}`}
    >
      <div className="mil-marker-ring" style={{ borderColor: color }}>
        {isPulsing && <span className="mil-marker-pulse" style={{ borderColor: color }} />}
        <span className="mil-marker-icon">{icon}</span>
      </div>
      {showLabel && (
        <span className="mil-marker-label" style={{ color }}>
          {item.label?.split(' ').slice(0, 3).join(' ') || item.country}
        </span>
      )}
    </div>
  );
}

export default function MilitaryOverlay({ visible, indicators = [], zoom = 2 }) {
  if (!visible) return null;
  const showMarkers = zoom >= ZOOM_SHOW;
  const showLabels = zoom >= ZOOM_LABELS;

  if (!showMarkers) return null;

  return (
    <>
      {indicators
        .filter((m) => m.lat && m.lon)
        .map((item) => (
          <Marker key={item.id} longitude={item.lon} latitude={item.lat} anchor="center">
            <MilitaryMarker item={item} showLabel={showLabels} />
          </Marker>
        ))}
    </>
  );
}
