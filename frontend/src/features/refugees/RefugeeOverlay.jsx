import { Marker } from '@vis.gl/react-maplibre';

/* ── helpers ── */
function totalDisplaced(s) {
  return (s.refugees || 0) + (s.idps || 0);
}

function markerColor(total) {
  if (total > 5_000_000) return { fill: '#ef4444', glow: 'rgba(239,68,68,0.4)' };
  if (total > 1_000_000) return { fill: '#f97316', glow: 'rgba(249,115,22,0.35)' };
  if (total > 500_000)   return { fill: '#facc15', glow: 'rgba(250,204,21,0.3)' };
  return { fill: '#2dd4bf', glow: 'rgba(45,212,191,0.3)' };
}

function markerSize(total) {
  if (total > 10_000_000) return 44;
  if (total > 5_000_000)  return 36;
  if (total > 1_000_000)  return 28;
  if (total > 500_000)    return 22;
  return 18;
}

function formatCount(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

/* ── RefugeeOverlay ── */
export function RefugeeOverlay({ situations, onSituationClick, isMarkerVisible }) {
  if (!situations || situations.length === 0) return null;

  return (
    <>
      {situations.map((s) => {
        if (s.lat == null || s.lon == null) return null;
        if (isMarkerVisible && !isMarkerVisible(s.lon, s.lat)) return null;

        const total = totalDisplaced(s);
        const size  = markerSize(total);
        const { fill, glow } = markerColor(total);
        const isLarge = total > 1_000_000;

        return (
          <Marker
            key={s.id ?? s.name}
            longitude={s.lon}
            latitude={s.lat}
            anchor="center"
            onClick={() => onSituationClick?.(s)}
          >
            <div className="refugee-marker" style={{ cursor: 'pointer' }}>
              {/* Pulse ring for large crises */}
              {isLarge && (
                <div
                  className="refugee-marker-pulse"
                  style={{
                    position: 'absolute',
                    top: '50%', left: '50%',
                    width: size + 16, height: size + 16,
                    marginTop: -(size + 16) / 2,
                    marginLeft: -(size + 16) / 2,
                    borderRadius: '50%',
                    border: `2px solid ${fill}`,
                    opacity: 0.6,
                    animation: 'refugee-pulse 2s ease-out infinite',
                  }}
                />
              )}

              {/* Label */}
              <span style={{
                position: 'absolute',
                bottom: size / 2 + 8,
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: 10,
                fontWeight: 700,
                color: '#fff',
                textShadow: '0 1px 4px rgba(0,0,0,0.9)',
                whiteSpace: 'nowrap',
                letterSpacing: '0.3px',
              }}>
                {s.name}
              </span>

              {/* Main circle with count */}
              <div style={{
                position: 'relative',
                width: size,
                height: size,
                borderRadius: '50%',
                background: `radial-gradient(circle at 35% 35%, ${fill}dd, ${fill})`,
                border: '2px solid rgba(255,255,255,0.8)',
                boxShadow: `0 0 12px ${glow}, inset 0 -2px 4px rgba(0,0,0,0.2)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {size >= 24 && (
                  <span style={{
                    fontSize: size >= 36 ? 11 : 9,
                    fontWeight: 800,
                    color: '#fff',
                    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                    lineHeight: 1,
                  }}>
                    {formatCount(total)}
                  </span>
                )}
              </div>

              {/* Source badge */}
              {s.source === 'unhcr' && (
                <span style={{
                  position: 'absolute',
                  top: size / 2 + 6,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: 7,
                  fontWeight: 600,
                  color: '#4ade80',
                  textShadow: '0 1px 3px rgba(0,0,0,0.9)',
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                }}>
                  LIVE
                </span>
              )}
            </div>
          </Marker>
        );
      })}

    </>
  );
}
