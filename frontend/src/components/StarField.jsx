import { useRef, useEffect, useCallback } from 'react';

function generateStars(count) {
  const stars = [];
  for (let i = 0; i < count; i++) {
    // Most stars white, a few tinted blue or amber
    const tint = Math.random();
    let cr = 255, cg = 255, cb = 255;
    if (tint < 0.12) { cr = 180; cg = 200; cb = 255; }       // cool blue
    else if (tint < 0.20) { cr = 255; cg = 220; cb = 170; }  // warm amber
    else if (tint < 0.25) { cr = 200; cg = 180; cb = 255; }  // soft violet

    stars.push({
      x: Math.random(),
      y: Math.random(),
      baseRadius: 0.3 + Math.random() * 1.5,
      brightness: 0.3 + Math.random() * 0.7,
      twinkleSpeed: 0.0015 + Math.random() * 0.006,
      twinklePhase: Math.random() * Math.PI * 2,
      cr, cg, cb,
    });
  }
  return stars;
}

function generateNebulae(count) {
  const nebulae = [];
  const palette = [
    { r: 90, g: 70, b: 200 },   // deep violet
    { r: 50, g: 140, b: 220 },  // cyan-blue
    { r: 180, g: 80, b: 180 },  // magenta
    { r: 60, g: 100, b: 180 },  // steel blue
    { r: 120, g: 70, b: 160 },  // purple
  ];
  for (let i = 0; i < count; i++) {
    const c = palette[i % palette.length];
    nebulae.push({
      x: 0.05 + Math.random() * 0.9,
      y: 0.05 + Math.random() * 0.9,
      radius: 80 + Math.random() * 200,
      alpha: 0.012 + Math.random() * 0.025,
      ...c,
    });
  }
  return nebulae;
}

export default function StarField({ visible }) {
  const canvasRef = useRef(null);
  const starsRef = useRef(null);
  const nebulaeRef = useRef(null);
  const rafRef = useRef(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Nebula patches
    const nebulae = nebulaeRef.current;
    if (nebulae) {
      for (let i = 0; i < nebulae.length; i++) {
        const n = nebulae[i];
        const nx = n.x * w;
        const ny = n.y * h;
        const r = n.radius * dpr;
        const grad = ctx.createRadialGradient(nx, ny, 0, nx, ny, r);
        grad.addColorStop(0, `rgba(${n.r}, ${n.g}, ${n.b}, ${n.alpha})`);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(nx - r, ny - r, r * 2, r * 2);
      }
    }

    // Stars
    const stars = starsRef.current;
    if (!stars) return;
    const t = performance.now();

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const flicker = 0.7 + 0.3 * Math.sin(t * s.twinkleSpeed + s.twinklePhase);
      const alpha = s.brightness * flicker;
      const r = s.baseRadius * dpr;
      const sx = s.x * w;
      const sy = s.y * h;

      // Glow halo
      ctx.beginPath();
      ctx.arc(sx, sy, r * 2.8, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${s.cr}, ${s.cg}, ${s.cb}, ${alpha * 0.1})`;
      ctx.fill();

      // Core
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${s.cr}, ${s.cg}, ${s.cb}, ${alpha})`;
      ctx.fill();
    }

    rafRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    if (!visible) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Generate stars and nebulae once
    if (!starsRef.current) starsRef.current = generateStars(500);
    if (!nebulaeRef.current) nebulaeRef.current = generateNebulae(25);

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = window.devicePixelRatio || 1;
      const rect = parent.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    };

    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement);

    // Visibility handling — pause when tab hidden
    const onVisChange = () => {
      if (document.hidden) {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      } else {
        if (!rafRef.current) rafRef.current = requestAnimationFrame(draw);
      }
    };
    document.addEventListener('visibilitychange', onVisChange);

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVisChange);
    };
  }, [visible, draw]);

  if (!visible) return null;

  return (
    <canvas
      ref={canvasRef}
      className="star-field-canvas"
      aria-hidden="true"
    />
  );
}
