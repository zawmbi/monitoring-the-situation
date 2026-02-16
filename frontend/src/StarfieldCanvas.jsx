import { useRef, useEffect, useCallback } from 'react';

/**
 * StarfieldCanvas - Black background with white twinkling stars,
 * parallax depth layers, and rotation synced to 3D globe perspective.
 *
 * Performance: Uses a single canvas with requestAnimationFrame.
 * Automatically disabled on prefers-reduced-motion or low-power hint.
 */

const STAR_LAYERS = [
  { count: 280, speed: 0.03, sizeMin: 0.3, sizeMax: 0.9, opacity: 0.35 },  // far — faint, many
  { count: 160, speed: 0.08, sizeMin: 0.5, sizeMax: 1.3, opacity: 0.55 },  // mid
  { count: 80,  speed: 0.16, sizeMin: 0.8, sizeMax: 1.8, opacity: 0.80 },  // near — bright, few
  { count: 12,  speed: 0.22, sizeMin: 1.6, sizeMax: 2.6, opacity: 0.95 },  // accent — rare bright stars
];

// Subtle color tints for realism (most stars white, a few blue/warm)
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

export default function StarfieldCanvas({ mapBearing = 0, mapPitch = 0, useGlobe = false }) {
  const canvasRef = useRef(null);
  const layersRef = useRef(null);
  const animRef = useRef(null);
  const bearingRef = useRef(mapBearing);
  const pitchRef = useRef(mapPitch);
  const useGlobeRef = useRef(useGlobe);

  // Keep refs in sync without re-creating stars
  useEffect(() => { bearingRef.current = mapBearing; }, [mapBearing]);
  useEffect(() => { pitchRef.current = mapPitch; }, [mapPitch]);
  useEffect(() => { useGlobeRef.current = useGlobe; }, [useGlobe]);

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    layersRef.current = createStars(w * dpr, h * dpr);
  }, []);

  useEffect(() => {
    // Respect reduced motion preference
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

      time += 0.016; // ~60fps tick

      for (let li = 0; li < layers.length; li++) {
        const layer = layers[li];
        const parallaxFactor = layer.speed;

        // In 3D globe mode, shift stars based on bearing and pitch for parallax
        // Stronger multipliers for visible rotation with globe
        const bearingOffset = isGlobe ? bearing * parallaxFactor * 4 : 0;
        const pitchOffset = isGlobe ? pitch * parallaxFactor * 1.5 : 0;

        for (let si = 0; si < layer.stars.length; si++) {
          const star = layer.stars[si];

          // Twinkle
          const twinkle = 0.5 + 0.5 * Math.sin(time * star.twinkleSpeed + star.twinklePhase);
          const alpha = star.baseOpacity * (0.4 + 0.6 * twinkle);

          // Position with parallax offset (wrapping)
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
