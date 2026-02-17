import { Marker } from '@vis.gl/react-maplibre';

/* ── constants ── */
const RISK_COLORS = {
  critical: '#ff4444',
  high:     '#ff8c00',
};

const SCORE_THRESHOLD = 60;

/* ── helpers ── */
function riskLevel(score) {
  return score >= 80 ? 'critical' : 'high';
}

function markerSize(score) {
  const base = 16;
  if (score >= 90) return base + 24;
  if (score >= 80) return base + 16;
  if (score >= 70) return base + 8;
  return base;
}

/* ── RiskOverlay ── */
export function RiskOverlay({ scores, onCountryClick, isMarkerVisible }) {
  if (!scores || scores.length === 0) return null;

  const visible = scores.filter(
    (c) => c.lat != null && c.lon != null && (c.score ?? 0) >= SCORE_THRESHOLD
      && (!isMarkerVisible || isMarkerVisible(c.lon, c.lat)),
  );

  if (visible.length === 0) return null;

  return (
    <>
      {visible.map((c) => {
        const level = riskLevel(c.score);
        const color = RISK_COLORS[level];
        const size  = markerSize(c.score);

        return (
          <Marker
            key={c.id ?? c.country}
            longitude={c.lon}
            latitude={c.lat}
            anchor="center"
            onClick={() => onCountryClick?.(c)}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.8)', whiteSpace: 'nowrap', marginBottom: 2 }}>
                {c.country}
              </span>
              <div
                style={{
                  width: size,
                  height: size,
                  borderRadius: '50%',
                  background: color,
                  opacity: 0.85,
                  border: '2px solid rgba(255,255,255,0.7)',
                  boxShadow: `0 0 6px ${color}`,
                }}
              />
            </div>
          </Marker>
        );
      })}
    </>
  );
}
