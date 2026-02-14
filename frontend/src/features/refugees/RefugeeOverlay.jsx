import { Marker } from '@vis.gl/react-maplibre';

/* ── helpers ── */
function totalDisplaced(s) {
  return (s.refugees || 0) + (s.idps || 0);
}

function markerColor(total) {
  if (total > 5_000_000) return '#f97316';   // orange  – large
  if (total > 1_000_000) return '#facc15';   // yellow  – medium
  return '#2dd4bf';                           // teal    – smaller
}

function markerSize(total) {
  const base = 18;
  if (total > 10_000_000) return base + 28;
  if (total > 5_000_000)  return base + 20;
  if (total > 1_000_000)  return base + 12;
  if (total > 500_000)    return base + 6;
  return base;
}

/* ── RefugeeOverlay ── */
export function RefugeeOverlay({ situations, onSituationClick }) {
  if (!situations || situations.length === 0) return null;

  return (
    <>
      {situations.map((s) => {
        if (s.lat == null || s.lon == null) return null;

        const total = totalDisplaced(s);
        const size  = markerSize(total);
        const color = markerColor(total);

        return (
          <Marker
            key={s.id ?? s.name}
            longitude={s.lon}
            latitude={s.lat}
            anchor="center"
            onClick={() => onSituationClick?.(s)}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.8)', whiteSpace: 'nowrap', marginBottom: 2 }}>
                {s.name}
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
