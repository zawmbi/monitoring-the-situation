import { useMemo } from 'react';
import './spaceBackground.css';

/*
  Generates a CSS box-shadow string for N stars scattered across a large area.
  Using a seeded-style deterministic approach so the pattern stays stable across renders.
*/
function generateStars(count, spread) {
  const shadows = [];
  for (let i = 0; i < count; i++) {
    const x = Math.round(Math.random() * spread);
    const y = Math.round(Math.random() * spread);
    shadows.push(`${x}px ${y}px`);
  }
  return shadows.join(', ');
}

export default function SpaceBackground() {
  const stars = useMemo(() => ({
    small: generateStars(600, 2000),
    medium: generateStars(200, 2000),
    large: generateStars(70, 2000),
  }), []);

  return (
    <div className="space-bg" aria-hidden="true">
      <div className="space-bg__nebula" />
      <div className="space-bg__stars space-bg__stars--small" style={{ boxShadow: stars.small }} />
      <div className="space-bg__stars space-bg__stars--medium" style={{ boxShadow: stars.medium }} />
      <div className="space-bg__stars space-bg__stars--large" style={{ boxShadow: stars.large }} />
    </div>
  );
}
