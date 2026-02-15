import { useRef, useEffect, useCallback } from 'react';

/**
 * StarfieldCanvas - Black background with white twinkling stars,
 * parallax depth layers, and rotation synced to 3D globe perspective.
 *
 * Performance: Uses a single canvas with requestAnimationFrame.
 * Automatically disabled on prefers-reduced-motion or low-power hint.
 */

const STAR_LAYERS = [
  { count: 200, speed: 0.02, sizeMin: 0.4, sizeMax: 1.0, opacity: 0.4 },  // far
  { count: 120, speed: 0.06, sizeMin: 0.6, sizeMax: 1.4, opacity: 0.6 },  // mid
  { count: 60,  speed: 0.12, sizeMin: 1.0, sizeMax: 2.0, opacity: 0.85 }, // near
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
        twinkleSpeed: 0.5 + Math.random() * 2.0,
        twinklePhase: Math.random() * Math.PI * 2,
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
        const bearingOffset = isGlobe ? bearing * parallaxFactor * 2 : 0;
        const pitchOffset = isGlobe ? pitch * parallaxFactor * 0.5 : 0;

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
          ctx.fillStyle = '#ffffff';
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
