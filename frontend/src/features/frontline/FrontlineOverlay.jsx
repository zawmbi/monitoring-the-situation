import { Line, Marker } from 'react-simple-maps';
import {
  FRONTLINE_SEGMENTS,
  UKRAINE_BLUE,
  UKRAINE_YELLOW,
  RUSSIA_WHITE,
  RUSSIA_BLUE,
  RUSSIA_RED,
} from './frontlineData';

// SVG pattern definition for the slash hatching between colors.
// This gets rendered inside the <ComposableMap> SVG via a <defs> block.
export function FrontlinePatternDefs() {
  return (
    <defs>
      {/* Ukraine side - blue/yellow diagonal slashes */}
      <pattern
        id="frontline-ua"
        patternUnits="userSpaceOnUse"
        width="6"
        height="6"
        patternTransform="rotate(45)"
      >
        <rect width="3" height="6" fill={UKRAINE_BLUE} />
        <rect x="3" width="3" height="6" fill={UKRAINE_YELLOW} />
      </pattern>

      {/* Russia side - white/blue/red diagonal slashes */}
      <pattern
        id="frontline-ru"
        patternUnits="userSpaceOnUse"
        width="6"
        height="6"
        patternTransform="rotate(-45)"
      >
        <rect width="2" height="6" fill={RUSSIA_WHITE} />
        <rect x="2" width="2" height="6" fill={RUSSIA_BLUE} />
        <rect x="4" width="2" height="6" fill={RUSSIA_RED} />
      </pattern>

      {/* Combined frontline pattern - UA left, slashes, RU right */}
      <pattern
        id="frontline-combined"
        patternUnits="userSpaceOnUse"
        width="12"
        height="12"
        patternTransform="rotate(45)"
      >
        <rect width="6" height="12" fill={UKRAINE_BLUE} />
        <rect x="6" width="6" height="12" fill={RUSSIA_RED} />
      </pattern>
    </defs>
  );
}

export default function FrontlineOverlay({ visible }) {
  if (!visible) return null;

  return (
    <g className="frontline-overlay">
      <FrontlinePatternDefs />

      {/* Render each segment */}
      {FRONTLINE_SEGMENTS.map((segment) => {
        const points = segment.points;

        // Draw lines between consecutive points
        return points.slice(0, -1).map((from, idx) => {
          const to = points[idx + 1];
          return (
            <g key={`${segment.id}-${idx}`}>
              {/* Wider background glow */}
              <Line
                from={from}
                to={to}
                stroke="rgba(255, 60, 60, 0.15)"
                strokeWidth={8}
                strokeLinecap="round"
              />

              {/* Ukraine side (offset left) - blue/yellow slashes */}
              <Line
                from={from}
                to={to}
                stroke="url(#frontline-ua)"
                strokeWidth={4}
                strokeLinecap="butt"
                className="frontline-line frontline-ua"
              />

              {/* Center line - the actual frontline */}
              <Line
                from={from}
                to={to}
                stroke="rgba(255, 50, 50, 0.9)"
                strokeWidth={1.2}
                strokeLinecap="round"
                className="frontline-line frontline-center"
              />

              {/* Russia side (offset right) - white/blue/red slashes */}
              <Line
                from={from}
                to={to}
                stroke="url(#frontline-ru)"
                strokeWidth={4}
                strokeLinecap="butt"
                className="frontline-line frontline-ru"
                style={{ transform: 'translate(0, 0)' }}
              />
            </g>
          );
        });
      })}

      {/* Sector labels */}
      {FRONTLINE_SEGMENTS.map((segment) => {
        const mid = segment.points[Math.floor(segment.points.length / 2)];
        return (
          <Marker key={`label-${segment.id}`} coordinates={mid}>
            <text
              className="frontline-label"
              textAnchor="end"
              x={-12}
              y={-2}
              fontSize="4px"
              fontWeight="600"
              fill="var(--color-text-secondary)"
              style={{ pointerEvents: 'none' }}
            >
              {segment.label}
            </text>
          </Marker>
        );
      })}

      {/* Legend marker at top of frontline */}
      <Marker coordinates={[36.85, 50.38]}>
        <g className="frontline-legend" style={{ pointerEvents: 'none' }}>
          <rect x={-42} y={-18} width={84} height={16} rx={3} fill="rgba(0,0,0,0.7)" />
          {/* UA side */}
          <rect x={-39} y={-15} width={5} height={4} fill={UKRAINE_BLUE} />
          <rect x={-34} y={-15} width={5} height={4} fill={UKRAINE_YELLOW} />
          <text x={-26} y={-10} fontSize="5px" fill="#eee" fontWeight="500">UA</text>
          {/* Separator */}
          <text x={-7} y={-9.5} fontSize="6px" fill="#ff4444" fontWeight="700">///</text>
          {/* RU side */}
          <text x={12} y={-10} fontSize="5px" fill="#eee" fontWeight="500">RU</text>
          <rect x={22} y={-15} width={4} height={4} fill={RUSSIA_WHITE} />
          <rect x={26} y={-15} width={4} height={4} fill={RUSSIA_BLUE} />
          <rect x={30} y={-15} width={4} height={4} fill={RUSSIA_RED} />
        </g>
      </Marker>
    </g>
  );
}
