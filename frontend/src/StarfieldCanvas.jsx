import { useRef, useEffect } from 'react';
import Starback from 'starback';

/**
 * StarfieldCanvas — animated twinkling stars using the starback library.
 *
 * Key fix: rendered AFTER <MapGL> in the JSX so it stacks above the map
 * (MapLibre's .maplibregl-map is explicitly z-index: 2 in our CSS, so our
 * canvas must be z-index: 3+ and come later in DOM order to appear on top).
 *
 * A CSS radial-gradient mask hides stars over the globe, with --globe-r
 * tracked dynamically from map projection.
 */

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

export default function StarfieldCanvas({ useGlobe = false, map = null }) {
  const canvasRef = useRef(null);
  const starbackRef = useRef(null);

  // Initialize starback on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const parent = canvas.parentElement;
    const w = parent ? parent.offsetWidth : window.innerWidth;
    const h = parent ? parent.offsetHeight : window.innerHeight;

    starbackRef.current = new Starback(canvas, {
      type: 'dot',
      width: w,
      height: h,
      quantity: 450,
      starSize: [0.3, 1.6],
      speed: [0.1, 0.3],
      direction: 225,
      backgroundColor: 'transparent',
      starColor: 'white',
      randomOpacity: [0.2, 0.9],
    });

    return () => {
      // Neutralize the animation loop on unmount — starback has no destroy()
      canvas.width = 0;
      canvas.height = 0;
      starbackRef.current = null;
    };
  }, []);

  // Track globe radius → update CSS --globe-r for the mask
  useEffect(() => {
    if (!map || !useGlobe) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const update = () => {
      const r = getGlobeScreenRadius(map);
      canvas.style.setProperty('--globe-r', r > 0 ? r + 'px' : '0px');
    };
    update();
    map.on('render', update);
    return () => map.off('render', update);
  }, [map, useGlobe]);

  return (
    <canvas
      ref={canvasRef}
      className="starfield-canvas"
      aria-hidden="true"
    />
  );
}
