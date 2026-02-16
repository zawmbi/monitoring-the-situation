import { useRef, useEffect } from 'react';

/**
 * Draw a starfield (random white dots) on a canvas.
 * Canvas is transparent — dots are composited over the map,
 * and a CSS mask hides them inside the globe area.
 */
function drawStarfield(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.offsetWidth;
  const h = canvas.offsetHeight;
  if (!w || !h) return;
  canvas.width = w * dpr;
  canvas.height = h * dpr;

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, w, h);

  const count = Math.min(900, Math.round((w * h) / 1100));
  for (let i = 0; i < count; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    // Mostly tiny pinpoints, a few slightly larger
    const size = Math.random() < 0.9
      ? Math.random() * 0.9 + 0.3
      : Math.random() * 1.6 + 0.6;
    const alpha = Math.random() * 0.6 + 0.25;

    // Subtle color temperature variation
    const temp = Math.random();
    let r = 255, g = 255, b = 255;
    if (temp < 0.12) { r = 190; g = 210; b = 255; }       // Cool blue-ish
    else if (temp < 0.20) { r = 255; g = 235; b = 210; }   // Warm

    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
}

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
  const starCanvasRef = useRef(null);
  const haloRef = useRef(null);

  // ---------- Starfield ----------
  useEffect(() => {
    if (!useGlobe) return;
    const canvas = starCanvasRef.current;
    if (!canvas) return;

    drawStarfield(canvas);

    const onResize = () => drawStarfield(canvas);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [useGlobe]);

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
        if (starCanvasRef.current) {
          starCanvasRef.current.style.setProperty('--globe-r', r + 'px');
        }
      }
    };

    update();
    map.on('render', update);
    return () => map.off('render', update);
  }, [map, useGlobe]);

  return (
    <>
      {/* Starfield — white dots on transparent canvas, CSS-masked to space area */}
      {useGlobe && (
        <canvas
          ref={starCanvasRef}
          className="starfield-canvas"
          aria-hidden="true"
        />
      )}

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
