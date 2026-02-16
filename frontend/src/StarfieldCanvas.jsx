import { useRef, useEffect, useMemo } from 'react';

/**
 * StarfieldCanvas — stars rendered as CSS box-shadows on a plain div.
 *
 * Uses the exact same rendering approach as the working globe-halo-ring:
 * a positioned div with box-shadow, z-index 2, inside map-container.
 *
 * Each star is a tiny box-shadow at a random (x, y) offset from center.
 * A CSS radial-gradient mask hides stars over the globe disc.
 */

const STAR_COUNT = 500;

function getGlobeScreenRadius(map) {
  try {
    const center = map.getCenter();
    const centerPx = map.project(center);
    let maxR = 0;
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

/** Build a box-shadow string with STAR_COUNT random star dots.
 *  Coordinates are relative to a 1x1 element at (0,0), so each shadow
 *  offset is (x - halfW, y - halfH) to spread stars from center. */
function generateStarShadows(w, h) {
  const shadows = [];
  const halfW = Math.round(w / 2);
  const halfH = Math.round(h / 2);

  for (let i = 0; i < STAR_COUNT; i++) {
    const x = Math.round(Math.random() * w) - halfW;
    const y = Math.round(Math.random() * h) - halfH;
    const bright = Math.random();
    const size = bright < 0.92 ? 0.5 : bright < 0.98 ? 1 : 1.5;
    const alpha = (0.2 + Math.random() * 0.7).toFixed(2);

    // box-shadow: offsetX offsetY blurRadius spreadRadius color
    shadows.push(`${x}px ${y}px 0px ${size}px rgba(255,255,255,${alpha})`);
  }
  return shadows.join(',');
}

export default function StarfieldCanvas({ useGlobe = false, map = null }) {
  const divRef = useRef(null);

  // Pre-generate star shadows once — stable across re-renders
  const starShadow = useMemo(() => {
    const w = window.innerWidth || 1920;
    const h = window.innerHeight || 1080;
    return generateStarShadows(w, h);
  }, []);

  // Track globe radius → update CSS --globe-r for the mask
  useEffect(() => {
    if (!map || !useGlobe) return;
    const el = divRef.current;
    if (!el) return;

    const update = () => {
      const r = getGlobeScreenRadius(map);
      el.style.setProperty('--globe-r', r > 0 ? r + 'px' : '0px');
    };
    update();
    map.on('render', update);
    return () => map.off('render', update);
  }, [map, useGlobe]);

  return (
    <div
      ref={divRef}
      className="starfield-canvas"
      aria-hidden="true"
      style={{ boxShadow: starShadow }}
    />
  );
}
