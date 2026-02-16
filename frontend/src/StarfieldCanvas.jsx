import { useRef, useEffect, useCallback } from 'react';

/**
 * StarfieldCanvas — twinkling stars with parallax depth layers.
 * Rendered inside the map container, masked so stars only appear
 * in the "space" area outside the globe.
 *
 * Globe radius is tracked via map 'render' events so the mask
 * stays perfectly in sync during zoom/pan animations.
 */

const STAR_LAYERS = [
  { count: 280, speed: 0.03, sizeMin: 0.3, sizeMax: 0.9, opacity: 0.35 },
  { count: 160, speed: 0.08, sizeMin: 0.5, sizeMax: 1.3, opacity: 0.55 },
  { count: 80,  speed: 0.16, sizeMin: 0.8, sizeMax: 1.8, opacity: 0.80 },
  { count: 12,  speed: 0.22, sizeMin: 1.6, sizeMax: 2.6, opacity: 0.95 },
];

const STAR_COLORS = [
  '#ffffff', '#ffffff', '#ffffff', '#ffffff', '#ffffff',
  '#cce0ff', '#b8d4ff', '#ffeedd', '#ffd8b0',
];

function createStars(width, height) {
  return STAR_LAYERS.map((layer) => {
    const stars = [];
    for (let i = 0; i < layer.count; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: layer.sizeMin + Math.random() * (layer.sizeMax - layer.sizeMin),
        baseOpacity: layer.opacity * (0.5 + Math.random() * 0.5),
        twinkleSpeed: 0.4 + Math.random() * 2.2,
        twinklePhase: Math.random() * Math.PI * 2,
        color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
      });
    }
    return { ...layer, stars };
  });
}

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

export default function StarfieldCanvas({ mapBearing = 0, mapPitch = 0, useGlobe = false, map = null }) {
  const canvasRef = useRef(null);
  const layersRef = useRef(null);
  const animRef = useRef(null);
  const bearingRef = useRef(mapBearing);
  const pitchRef = useRef(mapPitch);
  const useGlobeRef = useRef(useGlobe);

  useEffect(() => { bearingRef.current = mapBearing; }, [mapBearing]);
  useEffect(() => { pitchRef.current = mapPitch; }, [mapPitch]);
  useEffect(() => { useGlobeRef.current = useGlobe; }, [useGlobe]);

  // Track globe radius → update CSS --globe-r for the mask
  useEffect(() => {
    if (!map || !useGlobe) return;
    const update = () => {
      const r = getGlobeScreenRadius(map);
      if (canvasRef.current) {
        canvasRef.current.style.setProperty('--globe-r', r > 0 ? r + 'px' : '0px');
      }
    };
    update();
    map.on('render', update);
    return () => map.off('render', update);
  }, [map, useGlobe]);

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.offsetWidth || window.innerWidth;
    const h = canvas.offsetHeight || window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    layersRef.current = createStars(w * dpr, h * dpr);
  }, []);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    initCanvas();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let time = 0;

    function draw() {
      const w = canvas.width;
      const h = canvas.height;
      const layers = layersRef.current;
      if (!layers) { animRef.current = requestAnimationFrame(draw); return; }

      ctx.clearRect(0, 0, w, h);

      const bearing = bearingRef.current;
      const pitch = pitchRef.current;
      const isGlobe = useGlobeRef.current;

      time += 0.016;

      for (let li = 0; li < layers.length; li++) {
        const layer = layers[li];
        const parallaxFactor = layer.speed;

        const bearingOffset = isGlobe ? bearing * parallaxFactor * 4 : 0;
        const pitchOffset = isGlobe ? pitch * parallaxFactor * 1.5 : 0;

        for (let si = 0; si < layer.stars.length; si++) {
          const star = layer.stars[si];

          const twinkle = 0.5 + 0.5 * Math.sin(time * star.twinkleSpeed + star.twinklePhase);
          const alpha = star.baseOpacity * (0.4 + 0.6 * twinkle);

          let sx = (star.x + bearingOffset) % w;
          let sy = (star.y + pitchOffset) % h;
          if (sx < 0) sx += w;
          if (sy < 0) sy += h;

          ctx.globalAlpha = alpha;
          ctx.fillStyle = star.color;
          ctx.beginPath();
          ctx.arc(sx, sy, star.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.globalAlpha = 1;
      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);

    const onResize = () => initCanvas();
    window.addEventListener('resize', onResize);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', onResize);
    };
  }, [initCanvas]);

  return (
    <canvas
      ref={canvasRef}
      className="starfield-canvas"
      aria-hidden="true"
    />
  );
}
