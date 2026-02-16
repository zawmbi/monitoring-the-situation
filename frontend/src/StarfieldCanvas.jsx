import { useRef, useEffect } from 'react';

/**
 * StarfieldCanvas — twinkling stars rendered as a div with a generated
 * background image. Uses the same rendering approach as the working
 * globe-halo-ring (a positioned div inside the map container).
 *
 * Stars are drawn once on an offscreen canvas, converted to a data-URL,
 * and set as background-image. Parallax shifts background-position on drag.
 * A CSS mask hides stars over the globe, tracked via map 'render' events.
 */

const STAR_COUNT = 600;

function generateStarBackground(width, height) {
  const canvas = document.createElement('canvas');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const colors = [
    [255, 255, 255],
    [255, 255, 255],
    [255, 255, 255],
    [190, 210, 255],  // cool blue
    [255, 235, 210],  // warm
  ];

  for (let i = 0; i < STAR_COUNT; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = Math.random() < 0.92
      ? 0.3 + Math.random() * 0.8   // tiny pinpoint
      : 0.8 + Math.random() * 1.4;  // brighter star
    const alpha = 0.25 + Math.random() * 0.65;
    const [r, g, b] = colors[Math.floor(Math.random() * colors.length)];

    ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  return canvas.toDataURL('image/png');
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
  const divRef = useRef(null);

  // Generate starfield background image once on mount
  useEffect(() => {
    if (!divRef.current) return;
    const w = divRef.current.offsetWidth || window.innerWidth;
    const h = divRef.current.offsetHeight || window.innerHeight;
    const url = generateStarBackground(w, h);
    divRef.current.style.backgroundImage = `url(${url})`;
    divRef.current.style.backgroundSize = `${w}px ${h}px`;
    divRef.current.style.backgroundRepeat = 'no-repeat';
  }, []);

  // Track globe radius → update CSS --globe-r for the mask
  useEffect(() => {
    if (!map || !useGlobe) return;
    const update = () => {
      const r = getGlobeScreenRadius(map);
      if (divRef.current) {
        divRef.current.style.setProperty('--globe-r', r > 0 ? r + 'px' : '0px');
      }
    };
    update();
    map.on('render', update);
    return () => map.off('render', update);
  }, [map, useGlobe]);

  // Parallax — shift background position based on globe bearing/pitch
  useEffect(() => {
    if (!divRef.current || !useGlobe) return;
    divRef.current.style.backgroundPosition = `${-mapBearing * 0.5}px ${mapPitch * 0.3}px`;
  }, [mapBearing, mapPitch, useGlobe]);

  return (
    <div
      ref={divRef}
      className="starfield-canvas"
      aria-hidden="true"
    />
  );
}
