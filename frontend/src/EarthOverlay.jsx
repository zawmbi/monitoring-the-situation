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
 *  • Starfield canvas   (white dots masked to only show in "space")
 *  • Atmosphere halo     (uniform blue box-shadow ring around the globe edge)
 *  • Scan-line animation
 */
export default function EarthOverlay({ useGlobe = false, earthGlow = true, map = null }) {
  const haloRef = useRef(null);

  // ---------- Globe radius tracking ----------
  // Uses 'render' event (fires every frame during animations) and updates
  // the DOM synchronously — no rAF delay — so the halo stays locked to the globe.
  useEffect(() => {
    if (!map || !useGlobe) return;

    const update = () => {
      const r = getGlobeScreenRadius(map);
      if (r > 0) {
        if (haloRef.current) {
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
      {/* Atmosphere halo — uniform blue glow ring via box-shadow */}
      {useGlobe && earthGlow && (
        <div
          ref={haloRef}
          className="globe-halo-ring"
          style={{ display: 'none' }}
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
