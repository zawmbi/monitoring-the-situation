import { Line, Marker } from 'react-simple-maps';
import {
  FRONTLINE_SEGMENTS,
  UKRAINE_BLUE,
  UKRAINE_YELLOW,
  RUSSIA_BLUE,
  RUSSIA_RED,
} from './frontlineData';

export default function FrontlineOverlay({ visible }) {
  if (!visible) return null;

  return (
    <g className="frontline-overlay">
      {/* Render each segment as a series of layered lines */}
      {FRONTLINE_SEGMENTS.map((segment) => {
        const points = segment.points;

        return points.slice(0, -1).map((from, idx) => {
          const to = points[idx + 1];
          const key = `${segment.id}-${idx}`;

          return (
            <g key={key}>
              {/* Background glow */}
              <Line
                from={from}
                to={to}
                stroke="rgba(255, 60, 60, 0.2)"
                strokeWidth={10}
                strokeLinecap="round"
              />

              {/* Ukraine side - blue base with yellow dashes on top */}
              <Line
                from={from}
                to={to}
                stroke={UKRAINE_BLUE}
                strokeWidth={4}
                strokeLinecap="butt"
              />
              <Line
                from={from}
                to={to}
                stroke={UKRAINE_YELLOW}
                strokeWidth={4}
                strokeLinecap="butt"
                strokeDasharray="4,4"
              />

              {/* Center frontline - red */}
              <Line
                from={from}
                to={to}
                stroke="rgba(255, 50, 50, 0.95)"
                strokeWidth={1.5}
                strokeLinecap="round"
                className="frontline-center"
              />

              {/* Russia side - red base with blue dashes on top */}
              <Line
                from={from}
                to={to}
                stroke={RUSSIA_RED}
                strokeWidth={4}
                strokeLinecap="butt"
                strokeDashoffset="4"
              />
              <Line
                from={from}
                to={to}
                stroke={RUSSIA_BLUE}
                strokeWidth={4}
                strokeLinecap="butt"
                strokeDasharray="4,4"
                strokeDashoffset="4"
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
              x={-14}
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

      {/* Legend at the top of the frontline */}
      <Marker coordinates={[36.85, 50.55]}>
        <g className="frontline-legend" style={{ pointerEvents: 'none' }}>
          <rect x={-44} y={-20} width={88} height={18} rx={3} fill="rgba(0,0,0,0.75)" />
          {/* UA side */}
          <rect x={-40} y={-16} width={6} height={5} fill={UKRAINE_BLUE} />
          <rect x={-34} y={-16} width={6} height={5} fill={UKRAINE_YELLOW} />
          <text x={-24} y={-11} fontSize="5.5px" fill="#eee" fontWeight="600">UA</text>
          {/* Separator slashes */}
          <text x={-7} y={-10.5} fontSize="7px" fill="#ff4444" fontWeight="700">///</text>
          {/* RU side */}
          <text x={13} y={-11} fontSize="5.5px" fill="#eee" fontWeight="600">RU</text>
          <rect x={24} y={-16} width={6} height={5} fill={RUSSIA_BLUE} />
          <rect x={30} y={-16} width={6} height={5} fill={RUSSIA_RED} />
        </g>
      </Marker>
    </g>
  );
}
