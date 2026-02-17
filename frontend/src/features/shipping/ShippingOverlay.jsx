import { Marker } from '@vis.gl/react-maplibre';

const RISK_COLORS = {
  critical: '#ff4444',
  high: '#ff8c00',
  elevated: '#ffd700',
  moderate: '#4ecdc4',
  low: '#4a9eff',
};

export default function ShippingOverlay({ chokepoints, onChokepointClick, isMarkerVisible }) {
  if (!chokepoints || chokepoints.length === 0) return null;

  return (
    <>
      {chokepoints.filter(cp => !isMarkerVisible || isMarkerVisible(cp.lon, cp.lat)).map(cp => (
        <Marker key={cp.id} longitude={cp.lon} latitude={cp.lat} anchor="center">
          <div
            className="shipping-marker"
            onClick={(e) => { e.stopPropagation(); onChokepointClick?.(cp); }}
            title={`${cp.name} — ${cp.status} (Risk: ${cp.risk})`}
            style={{ cursor: 'pointer' }}
          >
            <div style={{
              width: cp.risk === 'critical' ? 14 : cp.risk === 'high' ? 12 : 10,
              height: cp.risk === 'critical' ? 14 : cp.risk === 'high' ? 12 : 10,
              background: RISK_COLORS[cp.risk] || '#4a9eff',
              borderRadius: '50%',
              border: '2px solid rgba(255,255,255,0.5)',
              boxShadow: `0 0 8px ${RISK_COLORS[cp.risk]}80`,
              animation: cp.status === 'disrupted' ? 'pulse-disaster 1.5s infinite' : 'none',
            }} />
            <div style={{
              position: 'absolute',
              top: '-20px',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: '9px',
              whiteSpace: 'nowrap',
              color: RISK_COLORS[cp.risk],
              fontWeight: 600,
              textShadow: '0 0 3px rgba(0,0,0,0.8)',
            }}>
              {cp.name}
            </div>
          </div>
        </Marker>
      ))}
    </>
  );
}
