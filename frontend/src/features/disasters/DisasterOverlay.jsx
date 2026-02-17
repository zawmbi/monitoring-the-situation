import { Marker } from '@vis.gl/react-maplibre';

const SEVERITY_COLORS = {
  critical: '#ff4444',
  high: '#ff8c00',
  moderate: '#ffd700',
  low: '#4ecdc4',
};

const PULSE_SIZES = {
  critical: 16,
  high: 12,
  moderate: 10,
  low: 8,
};

export default function DisasterOverlay({ events, onEventClick, isMarkerVisible }) {
  if (!events || events.length === 0) return null;

  return (
    <>
      {events
        .filter(e => e.lat && e.lon && (!isMarkerVisible || isMarkerVisible(e.lon, e.lat)))
        .slice(0, 100)
        .map(event => {
          const size = PULSE_SIZES[event.severity] || 10;
          const color = SEVERITY_COLORS[event.severity] || '#ffd700';
          return (
            <Marker key={event.id} longitude={event.lon} latitude={event.lat} anchor="center">
              <div
                className="disaster-marker"
                onClick={(e) => { e.stopPropagation(); onEventClick?.(event); }}
                title={event.title}
                style={{ cursor: 'pointer', contain: 'layout style' }}
              >
                <div className="disaster-marker-pulse" style={{
                  width: size,
                  height: size,
                  background: color,
                  borderRadius: '50%',
                  boxShadow: `0 0 ${size}px ${color}80`,
                  animation: event.severity === 'critical' ? 'pulse-disaster 2s infinite' : 'none',
                  willChange: event.severity === 'critical' ? 'transform' : 'auto',
                }} />
                <div className="disaster-marker-label" style={{
                  position: 'absolute',
                  top: '-18px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: '12px',
                  whiteSpace: 'nowrap',
                }}>
                  {event.icon}
                </div>
              </div>
            </Marker>
          );
        })}
    </>
  );
}
