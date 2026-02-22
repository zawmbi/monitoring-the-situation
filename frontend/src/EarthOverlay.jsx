import { useRef, useEffect } from 'react';

/**
 * Calculate the globe's apparent screen radius by projecting limb points.
 * Returns 0 if the globe edge can't be determined.
 */
function getGlobeScreenRadius(map) {
  try {
    const center = map.getCenter();
    const centerPx = map.project(center);

    let maxR = 0;
    // Sample 4 directions (E, W along equator-ish; N, S along meridian)
    for (const dLng of [85, -85]) {
      const pt = map.project({ lng: center.lng + dLng, lat: center.lat });
      const r = Math.hypot(pt.x - centerPx.x, pt.y - centerPx.y);
      if (r > maxR && r < 5000) maxR = r;
    }
    for (const dLat of [85, -85]) {
      const lat = Math.max(-89, Math.min(89, center.lat + dLat));
      const pt = map.project({ lng: center.lng, lat });
      const r = Math.hypot(pt.x - centerPx.x, pt.y - centerPx.y);
      if (r > maxR && r < 5000) maxR = r;
    }

    return maxR > 50 ? maxR : 0;
  } catch {
    return 0;
  }
}

/**
 * EarthOverlay — renders:
 *  • Atmosphere halo     (themed glow ring around the globe edge)
 *  • Scan-line animation
 *
 * The halo div is always mounted when the globe is active so the radius-
 * tracking effect keeps the ref stable. Visibility is toggled via the
 * `earthGlow` prop to avoid losing state on unmount/remount.
 */
export default function EarthOverlay({ useGlobe = false, earthGlow = true, map = null }) {
  const haloRef = useRef(null);
  const lastRadiusRef = useRef(0);

  // ---------- Globe radius tracking ----------
  // Uses 'render' event but only writes to the DOM when the radius actually
  // changes (±2px tolerance) to avoid layout thrashing every frame.
  useEffect(() => {
    if (!map || !useGlobe) return;

    const update = () => {
      const r = getGlobeScreenRadius(map);
      if (r > 0 && haloRef.current) {
        // Only update DOM when radius changes meaningfully
        if (Math.abs(r - lastRadiusRef.current) > 2) {
          lastRadiusRef.current = r;
          haloRef.current.style.width = r * 2 + 'px';
          haloRef.current.style.height = r * 2 + 'px';
          haloRef.current.style.display = '';
        }
      }
    };

    update();
    map.on('render', update);
    return () => map.off('render', update);
  }, [map, useGlobe]);

  return (
    <>
      {/* Atmosphere halo — always mounted when globe active, visibility via earthGlow */}
      {useGlobe && (
        <div
          ref={haloRef}
          className="globe-halo-ring"
          style={{ display: earthGlow ? undefined : 'none' }}
          aria-hidden="true"
        />
      )}

      {/* Scan line overlay */}
      <div className="earth-data-overlay" aria-hidden="true">
        <div className="earth-scan-line" />
      </div>
    </>
  );
}
