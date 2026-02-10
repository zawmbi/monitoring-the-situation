/**
 * ConflictOverlay — Russia-Ukraine conflict map layers
 * Renders frontlines with recency colors, occupied territory,
 * coat of arms markers, and NATO division symbols.
 */
import { useMemo } from 'react';
import { Source, Layer, Marker } from '@vis.gl/react-maplibre';
import {
  FRONTLINE_SEGMENTS,
  OCCUPIED_TERRITORY,
  TROOP_POSITIONS,
  COAT_OF_ARMS,
  UA_BLUE,
  UA_YELLOW,
  RU_RED,
  RU_BLUE,
  getFrontlineColor,
} from './conflictData';

// ─── NATO APP-6 style unit symbol renderer ───
function NatoSymbol({ unit, onClick }) {
  const isUA = unit.side === 'ukraine';
  const bgColor = isUA ? UA_BLUE : RU_RED;
  const borderColor = isUA ? UA_YELLOW : '#fff';

  // Unit type icon (simplified NATO symbology)
  const typeIcon = {
    infantry: '╳',      // Crossed lines
    mechanized: '╳⊙',   // Crossed + wheel
    armor: '⊙',         // Oval/wheel shape
    artillery: '●',     // Filled dot
    marines: '⚓',
  }[unit.unitType] || '╳';

  // Unit size indicator (pips above symbol)
  const sizePips = {
    squad: '•',
    platoon: '••',
    company: '•••',
    battalion: 'II',
    regiment: 'III',
    brigade: '╳',
    division: '╳╳',
    corps: '╳╳╳',
  }[unit.unitSize] || '╳';

  return (
    <div
      className="conflict-nato-symbol"
      onClick={(e) => { e.stopPropagation(); onClick?.(unit); }}
      title={`${unit.name} (${unit.sector})`}
      style={{
        '--nato-bg': bgColor,
        '--nato-border': borderColor,
      }}
    >
      <div className="conflict-nato-size">{sizePips}</div>
      <div className="conflict-nato-box">
        <span className="conflict-nato-icon">{typeIcon}</span>
      </div>
    </div>
  );
}

// ─── Coat of Arms SVG markers ───
function CoatOfArms({ country }) {
  if (country === 'ukraine') {
    // Ukraine Tryzub (trident) simplified
    return (
      <div className="conflict-coa conflict-coa--ua" title="Ukraine">
        <svg viewBox="0 0 100 120" width="48" height="56">
          <rect x="5" y="5" width="90" height="110" rx="8" fill="#005BBB" stroke="#FFD500" strokeWidth="4" />
          <g transform="translate(50,60)" fill="#FFD500">
            {/* Simplified trident */}
            <rect x="-3" y="-35" width="6" height="70" rx="2" />
            <rect x="-20" y="-35" width="6" height="50" rx="2" />
            <rect x="14" y="-35" width="6" height="50" rx="2" />
            <path d="M-20,-35 Q-20,-48 -3,-45" fill="none" stroke="#FFD500" strokeWidth="4" />
            <path d="M20,-35 Q20,-48 3,-45" fill="none" stroke="#FFD500" strokeWidth="4" />
            <rect x="-24" y="10" width="48" height="5" rx="2" />
          </g>
        </svg>
      </div>
    );
  }
  // Russia double-headed eagle simplified
  return (
    <div className="conflict-coa conflict-coa--ru" title="Russia">
      <svg viewBox="0 0 100 120" width="48" height="56">
        <rect x="5" y="5" width="90" height="110" rx="8" fill="#D52B1E" stroke="#FFD700" strokeWidth="4" />
        <g transform="translate(50,58)" fill="#FFD700">
          {/* Double-headed eagle simplified */}
          <ellipse cx="0" cy="0" rx="22" ry="18" fill="#FFD700" />
          <ellipse cx="0" cy="0" rx="18" ry="14" fill="#D52B1E" />
          {/* Shield center */}
          <rect x="-8" y="-10" width="16" height="20" rx="3" fill="#0039A6" />
          {/* Heads */}
          <circle cx="-16" cy="-18" r="7" fill="#FFD700" />
          <circle cx="16" cy="-18" r="7" fill="#FFD700" />
          {/* Beaks */}
          <polygon points="-24,-18 -18,-16 -18,-20" fill="#FFD700" />
          <polygon points="24,-18 18,-16 18,-20" fill="#FFD700" />
          {/* Wings */}
          <path d="M-22,-5 Q-35,-15 -30,-28" fill="none" stroke="#FFD700" strokeWidth="3" />
          <path d="M22,-5 Q35,-15 30,-28" fill="none" stroke="#FFD700" strokeWidth="3" />
          {/* Crown */}
          <path d="M-6,-26 L0,-34 L6,-26" fill="#FFD700" stroke="#D52B1E" strokeWidth="1" />
        </g>
      </svg>
    </div>
  );
}

export default function ConflictOverlay({ visible, onTroopClick, showTroops = true }) {
  const visibility = visible ? 'visible' : 'none';

  // Build frontline GeoJSON with per-segment colors
  const frontlineGeoJSON = useMemo(() => ({
    type: 'FeatureCollection',
    features: FRONTLINE_SEGMENTS.map((seg) => ({
      type: 'Feature',
      properties: {
        id: seg.id,
        label: seg.label,
        status: seg.status,
        color: getFrontlineColor(seg.asOf),
        asOf: seg.asOf,
      },
      geometry: {
        type: 'LineString',
        coordinates: seg.points,
      },
    })),
  }), []);

  // Occupied territory GeoJSON
  const occupiedGeoJSON = useMemo(() => ({
    type: 'FeatureCollection',
    features: [OCCUPIED_TERRITORY],
  }), []);

  // Sector label midpoints
  const sectorLabels = useMemo(() =>
    FRONTLINE_SEGMENTS.map((seg) => {
      const mid = seg.points[Math.floor(seg.points.length / 2)];
      return { id: seg.id, label: seg.label, status: seg.status, asOf: seg.asOf, lon: mid[0], lat: mid[1] };
    }), []);

  return (
    <>
      {/* Occupied territory fill */}
      <Source id="conflict-occupied" type="geojson" data={occupiedGeoJSON}>
        <Layer
          id="conflict-occupied-fill"
          type="fill"
          layout={{ visibility }}
          paint={{
            'fill-color': RU_RED,
            'fill-opacity': 0.08,
          }}
        />
        <Layer
          id="conflict-occupied-line"
          type="line"
          layout={{ visibility }}
          paint={{
            'line-color': RU_RED,
            'line-opacity': 0.2,
            'line-width': 1,
            'line-dasharray': [4, 4],
          }}
        />
      </Source>

      {/* Frontline layers */}
      <Source id="conflict-frontline" type="geojson" data={frontlineGeoJSON}>
        {/* Background glow - uses recency color */}
        <Layer
          id="conflict-fl-glow"
          type="line"
          layout={{ visibility, 'line-cap': 'round', 'line-join': 'round' }}
          paint={{
            'line-color': ['get', 'color'],
            'line-width': 12,
            'line-opacity': 0.15,
          }}
        />

        {/* Ukraine side - blue */}
        <Layer
          id="conflict-fl-ua"
          type="line"
          layout={{ visibility, 'line-cap': 'butt' }}
          paint={{
            'line-color': UA_BLUE,
            'line-width': 3.5,
            'line-offset': -3.5,
          }}
        />
        {/* Ukraine side - yellow dash */}
        <Layer
          id="conflict-fl-ua-dash"
          type="line"
          layout={{ visibility, 'line-cap': 'butt' }}
          paint={{
            'line-color': UA_YELLOW,
            'line-width': 3.5,
            'line-dasharray': [2, 2],
            'line-offset': -3.5,
          }}
        />

        {/* Center frontline - recency colored */}
        <Layer
          id="conflict-fl-center"
          type="line"
          layout={{ visibility, 'line-cap': 'round', 'line-join': 'round' }}
          paint={{
            'line-color': ['get', 'color'],
            'line-width': 2,
          }}
        />

        {/* Russia side - red */}
        <Layer
          id="conflict-fl-ru"
          type="line"
          layout={{ visibility, 'line-cap': 'butt' }}
          paint={{
            'line-color': RU_RED,
            'line-width': 3.5,
            'line-offset': 3.5,
          }}
        />
        {/* Russia side - blue dash */}
        <Layer
          id="conflict-fl-ru-dash"
          type="line"
          layout={{ visibility, 'line-cap': 'butt' }}
          paint={{
            'line-color': RU_BLUE,
            'line-width': 3.5,
            'line-dasharray': [2, 2],
            'line-offset': 3.5,
          }}
        />
      </Source>

      {/* Sector labels with status */}
      {visible && sectorLabels.map((s) => (
        <Marker key={`cfl-${s.id}`} longitude={s.lon} latitude={s.lat} anchor="right">
          <div className="conflict-sector-label" style={{ marginRight: 18 }}>
            <span className="conflict-sector-name">{s.label}</span>
            <span className={`conflict-sector-status conflict-sector-status--${s.status}`}>
              {s.status === 'active' ? 'Active Combat' : s.status === 'contested' ? 'Contested' : 'Stable'}
            </span>
          </div>
        </Marker>
      ))}

      {/* Coat of Arms on countries */}
      {visible && (
        <>
          <Marker longitude={COAT_OF_ARMS.ukraine.lon} latitude={COAT_OF_ARMS.ukraine.lat} anchor="center">
            <CoatOfArms country="ukraine" />
          </Marker>
          <Marker longitude={COAT_OF_ARMS.russia.lon} latitude={COAT_OF_ARMS.russia.lat} anchor="center">
            <CoatOfArms country="russia" />
          </Marker>
        </>
      )}

      {/* NATO Division Symbols for troop positions */}
      {visible && showTroops && TROOP_POSITIONS.map((unit) => (
        <Marker key={unit.id} longitude={unit.lon} latitude={unit.lat} anchor="center">
          <NatoSymbol unit={unit} onClick={onTroopClick} />
        </Marker>
      ))}
    </>
  );
}
