/**
 * ConflictOverlay — Russia-Ukraine conflict map layers
 * Renders frontlines, international border, capitals, cities,
 * military infrastructure, naval positions, coat of arms, and troop symbols.
 */
import { useMemo } from 'react';
import { Source, Layer, Marker } from '@vis.gl/react-maplibre';
import {
  FRONTLINE_SEGMENTS,
  TROOP_POSITIONS,
  COAT_OF_ARMS,
  CAPITALS,
  MAJOR_CITIES,
  MILITARY_INFRASTRUCTURE,
  NAVAL_POSITIONS,
  INTERNATIONAL_BORDER,
  UA_BLUE,
  UA_YELLOW,
  RU_RED,
  getFrontlineColor,
} from './conflictData';

/* ───────────────────────────────────────────
   Marker sub-components
   ─────────────────────────────────────────── */

// NATO APP-6 style unit symbol
function NatoSymbol({ unit, onClick }) {
  const isUA = unit.side === 'ukraine';
  const bgColor = isUA ? UA_BLUE : RU_RED;
  const borderColor = isUA ? UA_YELLOW : '#fff';

  const typeIcon = {
    infantry: '╳', mechanized: '╳⊙', armor: '⊙',
    artillery: '●', marines: '⚓',
  }[unit.unitType] || '╳';

  const sizePips = {
    battalion: 'II', regiment: 'III', brigade: '╳',
    division: '╳╳', corps: '╳╳╳',
  }[unit.unitSize] || '╳';

  return (
    <div
      className="conflict-nato-symbol"
      onClick={(e) => { e.stopPropagation(); onClick?.(unit); }}
      title={`${unit.name} (${unit.sector})`}
      style={{ '--nato-bg': bgColor, '--nato-border': borderColor }}
    >
      <div className="conflict-nato-size">{sizePips}</div>
      <div className="conflict-nato-box">
        <span className="conflict-nato-icon">{typeIcon}</span>
      </div>
    </div>
  );
}

// Coat of Arms SVG
function CoatOfArms({ country }) {
  if (country === 'ukraine') {
    return (
      <div className="conflict-coa conflict-coa--ua" title="Ukraine">
        <svg viewBox="0 0 100 120" width="48" height="56">
          <rect x="5" y="5" width="90" height="110" rx="8" fill="#005BBB" stroke="#FFD500" strokeWidth="4" />
          <g transform="translate(50,60)" fill="#FFD500">
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
  return (
    <div className="conflict-coa conflict-coa--ru" title="Russia">
      <svg viewBox="0 0 100 120" width="48" height="56">
        <rect x="5" y="5" width="90" height="110" rx="8" fill="#D52B1E" stroke="#FFD700" strokeWidth="4" />
        <g transform="translate(50,58)" fill="#FFD700">
          <ellipse cx="0" cy="0" rx="22" ry="18" />
          <ellipse cx="0" cy="0" rx="18" ry="14" fill="#D52B1E" />
          <rect x="-8" y="-10" width="16" height="20" rx="3" fill="#0039A6" />
          <circle cx="-16" cy="-18" r="7" fill="#FFD700" />
          <circle cx="16" cy="-18" r="7" fill="#FFD700" />
          <polygon points="-24,-18 -18,-16 -18,-20" />
          <polygon points="24,-18 18,-16 18,-20" />
          <path d="M-22,-5 Q-35,-15 -30,-28" fill="none" stroke="#FFD700" strokeWidth="3" />
          <path d="M22,-5 Q35,-15 30,-28" fill="none" stroke="#FFD700" strokeWidth="3" />
          <path d="M-6,-26 L0,-34 L6,-26" fill="#FFD700" stroke="#D52B1E" strokeWidth="1" />
        </g>
      </svg>
    </div>
  );
}

// Capital city marker (star)
function CapitalMarker({ city }) {
  const isUA = city.country === 'ukraine';
  return (
    <div className={`conflict-capital conflict-capital--${city.country}`} title={`${city.name} — Capital`}>
      <svg viewBox="0 0 24 24" width="22" height="22">
        <polygon
          points="12,2 15,9 22,9 16.5,14 18.5,21 12,17 5.5,21 7.5,14 2,9 9,9"
          fill={isUA ? UA_BLUE : RU_RED}
          stroke={isUA ? UA_YELLOW : '#FFD700'}
          strokeWidth="1.5"
        />
      </svg>
      <span className="conflict-capital-label">{city.name}</span>
    </div>
  );
}

// City dot marker
function CityMarker({ city }) {
  const colorClass = city.country === 'ukraine' ? 'ua'
    : city.country === 'russia' ? 'ru' : 'occ';
  return (
    <div className={`conflict-city conflict-city--${colorClass}`} title={city.note || city.name}>
      <span className="conflict-city-dot" />
      <span className="conflict-city-label">{city.name}</span>
    </div>
  );
}

// Infrastructure icon
const INFRA_ICONS = {
  airbase: '✈',
  port: '⚓',
  depot: '◆',
  bridge: '⌇',
  airdefense: '⊕',
};

function InfraMarker({ item }) {
  const isUA = item.side === 'ukraine';
  return (
    <div
      className={`conflict-infra conflict-infra--${item.type} conflict-infra--${isUA ? 'ua' : 'ru'}`}
      title={`${item.name}${item.note ? ` — ${item.note}` : ''}`}
    >
      <span className="conflict-infra-icon">{INFRA_ICONS[item.type] || '●'}</span>
      <span className="conflict-infra-label">{item.name.split(' ')[0]}</span>
    </div>
  );
}

// Naval position marker
const NAVAL_ICONS = {
  patrol: '⛵',
  anchorage: '⚓',
  submarine: '▼',
  coastal: '⛳',
  usv: '◈',
  corridor: '⇢',
  wreck: '✕',
};

function NavalMarker({ pos }) {
  const isUA = pos.side === 'ukraine';
  const isWreck = pos.status === 'destroyed';
  return (
    <div
      className={`conflict-naval conflict-naval--${isUA ? 'ua' : 'ru'} ${isWreck ? 'conflict-naval--wreck' : ''}`}
      title={`${pos.name}\n${pos.vessels}\n${pos.note || ''}`}
    >
      <span className="conflict-naval-icon">{NAVAL_ICONS[pos.type] || '●'}</span>
      <span className="conflict-naval-label">{pos.name.replace(/^(BSF |UA )/, '')}</span>
    </div>
  );
}

/* ───────────────────────────────────────────
   Main overlay
   ─────────────────────────────────────────── */

export default function ConflictOverlay({ visible, onTroopClick, showTroops = true }) {
  const visibility = visible ? 'visible' : 'none';

  // Frontline GeoJSON
  const frontlineGeoJSON = useMemo(() => ({
    type: 'FeatureCollection',
    features: FRONTLINE_SEGMENTS.map((seg) => ({
      type: 'Feature',
      properties: {
        id: seg.id, label: seg.label, status: seg.status,
        color: getFrontlineColor(seg.asOf),
      },
      geometry: { type: 'LineString', coordinates: seg.points },
    })),
  }), []);

  // International border GeoJSON
  const borderGeoJSON = useMemo(() => ({
    type: 'FeatureCollection',
    features: [INTERNATIONAL_BORDER],
  }), []);

  // Sector label midpoints
  const sectorLabels = useMemo(() =>
    FRONTLINE_SEGMENTS.map((seg) => {
      const mid = seg.points[Math.floor(seg.points.length / 2)];
      return { id: seg.id, label: seg.label, status: seg.status, lon: mid[0], lat: mid[1] };
    }), []);

  return (
    <>
      {/* ══════════ International border ══════════ */}
      <Source id="conflict-border" type="geojson" data={borderGeoJSON}>
        {/* Glow */}
        <Layer
          id="conflict-border-glow"
          type="line"
          layout={{ visibility, 'line-cap': 'round', 'line-join': 'round' }}
          paint={{
            'line-color': '#ffffff',
            'line-width': 8,
            'line-opacity': 0.06,
            'line-blur': 3,
          }}
        />
        {/* Primary solid line */}
        <Layer
          id="conflict-border-main"
          type="line"
          layout={{ visibility, 'line-cap': 'round', 'line-join': 'round' }}
          paint={{
            'line-color': '#e0e0e0',
            'line-width': 2.5,
            'line-opacity': 0.7,
          }}
        />
        {/* Dashed overlay for international-border look */}
        <Layer
          id="conflict-border-dash"
          type="line"
          layout={{ visibility, 'line-cap': 'butt' }}
          paint={{
            'line-color': '#ffffff',
            'line-width': 1.5,
            'line-dasharray': [6, 4],
            'line-opacity': 0.5,
          }}
        />
      </Source>

      {/* ══════════ Frontline ══════════ */}
      <Source id="conflict-frontline" type="geojson" data={frontlineGeoJSON}>
        {/* Outer glow */}
        <Layer
          id="conflict-fl-glow"
          type="line"
          layout={{ visibility, 'line-cap': 'round', 'line-join': 'round' }}
          paint={{
            'line-color': ['get', 'color'],
            'line-width': 14,
            'line-opacity': 0.10,
            'line-blur': 4,
          }}
        />
        {/* UA side */}
        <Layer
          id="conflict-fl-ua"
          type="line"
          layout={{ visibility, 'line-cap': 'round', 'line-join': 'round' }}
          paint={{
            'line-color': UA_BLUE,
            'line-width': 2,
            'line-offset': -3,
            'line-opacity': 0.8,
          }}
        />
        {/* Center line */}
        <Layer
          id="conflict-fl-center"
          type="line"
          layout={{ visibility, 'line-cap': 'round', 'line-join': 'round' }}
          paint={{
            'line-color': ['get', 'color'],
            'line-width': 2.5,
          }}
        />
        {/* RU side */}
        <Layer
          id="conflict-fl-ru"
          type="line"
          layout={{ visibility, 'line-cap': 'round', 'line-join': 'round' }}
          paint={{
            'line-color': RU_RED,
            'line-width': 2,
            'line-offset': 3,
            'line-opacity': 0.8,
          }}
        />
      </Source>

      {/* ══════════ Sector labels ══════════ */}
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

      {/* ══════════ Capitals ══════════ */}
      {visible && CAPITALS.map((c) => (
        <Marker key={c.id} longitude={c.lon} latitude={c.lat} anchor="center">
          <CapitalMarker city={c} />
        </Marker>
      ))}

      {/* ══════════ Major cities ══════════ */}
      {visible && MAJOR_CITIES.map((c) => (
        <Marker key={c.id} longitude={c.lon} latitude={c.lat} anchor="left">
          <CityMarker city={c} />
        </Marker>
      ))}

      {/* ══════════ Military infrastructure ══════════ */}
      {visible && MILITARY_INFRASTRUCTURE.map((item) => (
        <Marker key={item.id} longitude={item.lon} latitude={item.lat} anchor="center">
          <InfraMarker item={item} />
        </Marker>
      ))}

      {/* ══════════ Black Sea naval positions ══════════ */}
      {visible && NAVAL_POSITIONS.map((pos) => (
        <Marker key={pos.id} longitude={pos.lon} latitude={pos.lat} anchor="center">
          <NavalMarker pos={pos} />
        </Marker>
      ))}

      {/* ══════════ Coat of Arms ══════════ */}
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

      {/* ══════════ NATO troop symbols ══════════ */}
      {visible && showTroops && TROOP_POSITIONS.map((unit) => (
        <Marker key={unit.id} longitude={unit.lon} latitude={unit.lat} anchor="center">
          <NatoSymbol unit={unit} onClick={onTroopClick} />
        </Marker>
      ))}
    </>
  );
}
