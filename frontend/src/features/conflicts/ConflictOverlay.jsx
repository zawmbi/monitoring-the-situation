/**
 * ConflictOverlay — Russia-Ukraine conflict map layers
 * Renders frontlines, capitals, cities, military infrastructure,
 * naval positions, battle sites, fortifications, NPPs, roads, coat of arms, and troops.
 */
import { useState, useMemo } from 'react';
import { Source, Layer, Marker } from '@vis.gl/react-maplibre';
import {
  FRONTLINE_SEGMENTS,
  TROOP_POSITIONS,
  COAT_OF_ARMS,
  CAPITALS,
  MAJOR_CITIES,
  MILITARY_INFRASTRUCTURE,
  NAVAL_POSITIONS,
  BATTLE_SITES,
  FORTIFICATION_LINES,
  OCCUPIED_OBLAST_BORDERS,
  NUCLEAR_PLANTS,
  UA_BLUE,
  UA_YELLOW,
  RU_RED,
  getFrontlineColor,
} from './conflictData';

/* ───────────────────────────────────────────
   Zoom thresholds — markers hidden when zoomed out
   ─────────────────────────────────────────── */
const ZOOM_SHOW_DETAIL = 4;     // cities, infra, naval, battles, troops, sector labels
const ZOOM_SHOW_LABELS = 5;     // city name labels on infra markers

/* ───────────────────────────────────────────
   Build a set of cities that share coords with infrastructure
   so we can skip duplicate name labels
   ─────────────────────────────────────────── */
const INFRA_CITY_IDS = (() => {
  const infraCoords = new Set();
  MILITARY_INFRASTRUCTURE.forEach((item) => {
    // Round to 2 decimal places to match nearby
    const key = `${item.lat.toFixed(2)},${item.lon.toFixed(2)}`;
    infraCoords.add(key);
  });
  const ids = new Set();
  MAJOR_CITIES.forEach((c) => {
    const key = `${c.lat.toFixed(2)},${c.lon.toFixed(2)}`;
    if (infraCoords.has(key)) ids.add(c.id);
  });
  return ids;
})();

/* ───────────────────────────────────────────
   Marker sub-components
   ─────────────────────────────────────────── */

function NatoSymbol({ unit, onClick }) {
  const isUA = unit.side === 'ukraine';
  const bgColor = isUA ? UA_BLUE : RU_RED;
  const borderColor = isUA ? UA_YELLOW : '#fff';
  const typeIcon = { infantry: '╳', mechanized: '╳⊙', armor: '⊙', artillery: '●', marines: '⚓' }[unit.unitType] || '╳';
  const sizePips = { battalion: 'II', regiment: 'III', brigade: '╳', division: '╳╳', corps: '╳╳╳' }[unit.unitSize] || '╳';
  return (
    <div className="conflict-nato-symbol" onClick={(e) => { e.stopPropagation(); onClick?.(unit); }}
      title={`${unit.name} (${unit.sector})`} style={{ '--nato-bg': bgColor, '--nato-border': borderColor }}>
      <div className="conflict-nato-size">{sizePips}</div>
      <div className="conflict-nato-box"><span className="conflict-nato-icon">{typeIcon}</span></div>
    </div>
  );
}

function CoatOfArms({ country }) {
  if (country === 'ukraine') {
    return (
      <div className="conflict-coa conflict-coa--ua" title="Ukraine">
        <svg viewBox="0 0 100 120" width="48" height="56">
          <rect x="5" y="5" width="90" height="110" rx="8" fill="#005BBB" stroke="#FFD500" strokeWidth="4" />
          <g transform="translate(50,60)" fill="#FFD500">
            <rect x="-3" y="-35" width="6" height="70" rx="2" /><rect x="-20" y="-35" width="6" height="50" rx="2" />
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
          <ellipse cx="0" cy="0" rx="22" ry="18" /><ellipse cx="0" cy="0" rx="18" ry="14" fill="#D52B1E" />
          <rect x="-8" y="-10" width="16" height="20" rx="3" fill="#0039A6" />
          <circle cx="-16" cy="-18" r="7" fill="#FFD700" /><circle cx="16" cy="-18" r="7" fill="#FFD700" />
          <polygon points="-24,-18 -18,-16 -18,-20" /><polygon points="24,-18 18,-16 18,-20" />
          <path d="M-22,-5 Q-35,-15 -30,-28" fill="none" stroke="#FFD700" strokeWidth="3" />
          <path d="M22,-5 Q35,-15 30,-28" fill="none" stroke="#FFD700" strokeWidth="3" />
          <path d="M-6,-26 L0,-34 L6,-26" fill="#FFD700" stroke="#D52B1E" strokeWidth="1" />
        </g>
      </svg>
    </div>
  );
}

function CapitalMarker({ city }) {
  const isUA = city.country === 'ukraine';
  return (
    <div className={`conflict-capital conflict-capital--${city.country}`} title={`${city.name} — Capital`}>
      <svg viewBox="0 0 24 24" width="26" height="26">
        <polygon points="12,2 15,9 22,9 16.5,14 18.5,21 12,17 5.5,21 7.5,14 2,9 9,9"
          fill={isUA ? UA_BLUE : RU_RED} stroke={isUA ? UA_YELLOW : '#FFD700'} strokeWidth="1.5" />
      </svg>
      <span className="conflict-capital-label">{city.name}</span>
    </div>
  );
}

function CityMarker({ city, hideLabel }) {
  const colorClass = city.country === 'ukraine' ? 'ua' : city.country === 'russia' ? 'ru' : 'occ';
  return (
    <div className={`conflict-city conflict-city--${colorClass}`} title={city.note || city.name}>
      <span className="conflict-city-dot" />
      {!hideLabel && <span className="conflict-city-label">{city.name}</span>}
    </div>
  );
}

const INFRA_ICONS = { airbase: '✈', port: '⚓', depot: '◆', bridge: '⌇', airdefense: '⊕' };
function InfraMarker({ item, showLabel }) {
  const isUA = item.side === 'ukraine';
  return (
    <div className={`conflict-infra conflict-infra--${item.type} conflict-infra--${isUA ? 'ua' : 'ru'}`}
      title={`${item.name}${item.note ? ` — ${item.note}` : ''}`}>
      <span className="conflict-infra-icon">{INFRA_ICONS[item.type] || '●'}</span>
      {showLabel && <span className="conflict-infra-label">{item.name.split(' ')[0]}</span>}
    </div>
  );
}

const NAVAL_ICONS = { patrol: '⛵', anchorage: '⚓', submarine: '▼', coastal: '🛡', usv: '◈', corridor: '⇢', wreck: '✕' };
function NavalMarker({ pos }) {
  const isUA = pos.side === 'ukraine';
  const isWreck = pos.status === 'destroyed';
  return (
    <div className={`conflict-naval conflict-naval--${isUA ? 'ua' : 'ru'} ${isWreck ? 'conflict-naval--wreck' : ''}`}
      title={`${pos.name}\n${pos.vessels}\n${pos.note || ''}`}>
      <span className="conflict-naval-icon">{NAVAL_ICONS[pos.type] || '●'}</span>
      <span className="conflict-naval-label">{pos.name.replace(/^(BSF |UA )/, '')}</span>
    </div>
  );
}

function BattleSiteMarker({ site, onClick }) {
  const resultClass = site.result.startsWith('RU') ? 'ru' : site.result.startsWith('UA') ? 'ua' : 'contested';
  return (
    <div className={`conflict-battle conflict-battle--${resultClass}`}
      onClick={(e) => { e.stopPropagation(); onClick?.(site); }}
      title={`${site.name} — Click for details`}>
      <span className="conflict-battle-icon">⚔</span>
      <span className="conflict-battle-label">{site.name.replace(/^(Battle of |Siege of )/, '')}</span>
    </div>
  );
}

function BattlePopup({ site, onClose }) {
  if (!site) return null;
  const resultClass = site.result.startsWith('RU') ? 'ru' : site.result.startsWith('UA') ? 'ua' : 'contested';
  return (
    <div className="conflict-battle-popup" onClick={(e) => e.stopPropagation()} onWheel={(e) => e.stopPropagation()}>
      <div className="conflict-battle-popup-header">
        <div className="conflict-battle-popup-title">{site.name}</div>
        <button className="conflict-battle-popup-close" onClick={onClose}>✕</button>
      </div>
      <div className={`conflict-battle-popup-result conflict-battle-popup-result--${resultClass}`}>
        {site.result}
      </div>
      <div className="conflict-battle-popup-date">{site.date}</div>

      <div className="conflict-battle-popup-sides">
        <div className="conflict-battle-popup-side conflict-battle-popup-side--ru">
          <div className="conflict-battle-popup-side-label">
            <span className="conflict-side-dot" style={{ background: RU_RED }} /> Russia
          </div>
          <div className="conflict-battle-popup-row"><span>Commander</span><span>{site.ruCommander}</span></div>
          <div className="conflict-battle-popup-row"><span>Troops</span><span>{site.ruTroops}</span></div>
          <div className="conflict-battle-popup-row"><span>Equipment</span><span>{site.ruEquipment}</span></div>
          <div className="conflict-battle-popup-row"><span>Casualties</span><span>{site.ruCasualties}</span></div>
        </div>
        <div className="conflict-battle-popup-side conflict-battle-popup-side--ua">
          <div className="conflict-battle-popup-side-label">
            <span className="conflict-side-dot" style={{ background: UA_BLUE }} /> Ukraine
          </div>
          <div className="conflict-battle-popup-row"><span>Commander</span><span>{site.uaCommander}</span></div>
          <div className="conflict-battle-popup-row"><span>Troops</span><span>{site.uaTroops}</span></div>
          <div className="conflict-battle-popup-row"><span>Equipment</span><span>{site.uaEquipment}</span></div>
          <div className="conflict-battle-popup-row"><span>Casualties</span><span>{site.uaCasualties}</span></div>
        </div>
      </div>

      <div className="conflict-battle-popup-significance">
        <div className="conflict-battle-popup-sig-title">Significance</div>
        <div className="conflict-battle-popup-sig-text">{site.significance}</div>
      </div>
      <div className="conflict-battle-popup-note">{site.note}</div>
    </div>
  );
}

function NppMarker({ plant }) {
  return (
    <div className={`conflict-npp conflict-npp--${plant.status}`} title={`${plant.name}\n${plant.note}`}>
      <span className="conflict-npp-icon">☢</span>
      <span className="conflict-npp-label">{plant.name.replace(/ NPP$/, '')}</span>
    </div>
  );
}

/* ───────────────────────────────────────────
   Map Legend — explains all symbols
   ─────────────────────────────────────────── */
export function MapLegend({ open, onToggle }) {
  return (
    <div className={`conflict-map-legend ${open ? 'conflict-map-legend--open' : ''}`}>
      <button className="conflict-map-legend-toggle" onClick={onToggle}>
        {open ? '✕' : '?'} {!open && <span>Legend</span>}
      </button>
      {open && (
        <div className="conflict-map-legend-body">
          <div className="conflict-map-legend-title">Map Symbols</div>
          <div className="conflict-map-legend-section">
            <div className="conflict-map-legend-heading">Frontlines</div>
            <div className="conflict-map-legend-row">
              <span className="conflict-map-legend-line" style={{ background: UA_BLUE }} />
              <span>Ukrainian side</span>
            </div>
            <div className="conflict-map-legend-row">
              <span className="conflict-map-legend-line" style={{ background: RU_RED }} />
              <span>Russian side</span>
            </div>
            <div className="conflict-map-legend-row">
              <span className="conflict-map-legend-line conflict-map-legend-line--dashed" style={{ background: '#ff8c00' }} />
              <span>Fortification (Surovikin Line)</span>
            </div>
            <div className="conflict-map-legend-row">
              <span className="conflict-map-legend-line conflict-map-legend-line--dashed" style={{ background: '#ffa500' }} />
              <span>Occupied oblast border</span>
            </div>
          </div>
          <div className="conflict-map-legend-section">
            <div className="conflict-map-legend-heading">Cities & Territory</div>
            <div className="conflict-map-legend-row">
              <span className="conflict-map-legend-dot" style={{ background: '#5baaff' }} />
              <span>Ukrainian-controlled city</span>
            </div>
            <div className="conflict-map-legend-row">
              <span className="conflict-map-legend-dot" style={{ background: '#ff6b6b' }} />
              <span>Russian / occupied city</span>
            </div>
            <div className="conflict-map-legend-row">
              <svg width="14" height="14" viewBox="0 0 24 24"><polygon points="12,2 15,9 22,9 16.5,14 18.5,21 12,17 5.5,21 7.5,14 2,9 9,9" fill={UA_BLUE} stroke={UA_YELLOW} strokeWidth="2" /></svg>
              <span>Capital city</span>
            </div>
          </div>
          <div className="conflict-map-legend-section">
            <div className="conflict-map-legend-heading">Military</div>
            <div className="conflict-map-legend-row">
              <span className="conflict-map-legend-icon" style={{ color: '#82b1ff' }}>✈</span>
              <span>Airbase</span>
            </div>
            <div className="conflict-map-legend-row">
              <span className="conflict-map-legend-icon" style={{ color: '#82b1ff' }}>⚓</span>
              <span>Port / Naval base</span>
            </div>
            <div className="conflict-map-legend-row">
              <span className="conflict-map-legend-icon" style={{ color: '#82b1ff' }}>⊕</span>
              <span>Air defense</span>
            </div>
            <div className="conflict-map-legend-row">
              <span className="conflict-map-legend-icon" style={{ color: '#82b1ff' }}>◆</span>
              <span>Supply depot</span>
            </div>
            <div className="conflict-map-legend-row">
              <span className="conflict-map-legend-icon" style={{ color: '#ff8a80' }}>⌇</span>
              <span>Bridge</span>
            </div>
          </div>
          <div className="conflict-map-legend-section">
            <div className="conflict-map-legend-heading">Combat & Strategic</div>
            <div className="conflict-map-legend-row">
              <span className="conflict-map-legend-icon" style={{ color: '#ffa500' }}>⚔</span>
              <span>Battle site</span>
            </div>
            <div className="conflict-map-legend-row">
              <span className="conflict-map-legend-icon" style={{ color: '#66ff66' }}>☢</span>
              <span>Nuclear power plant</span>
            </div>
            <div className="conflict-map-legend-row">
              <span className="conflict-map-legend-icon" style={{ color: '#ff8a80' }}>⛵</span>
              <span>Naval patrol</span>
            </div>
            <div className="conflict-map-legend-row">
              <span className="conflict-map-legend-icon" style={{ color: '#82b1ff' }}>◈</span>
              <span>Unmanned surface vehicle</span>
            </div>
          </div>
          <div className="conflict-map-legend-section">
            <div className="conflict-map-legend-heading">NATO Unit Symbols — Affiliation</div>
            <div className="conflict-map-legend-row">
              <span className="conflict-map-legend-nato" style={{ background: UA_BLUE, borderColor: UA_YELLOW }}>╳</span>
              <span>Ukrainian unit</span>
            </div>
            <div className="conflict-map-legend-row">
              <span className="conflict-map-legend-nato" style={{ background: RU_RED, borderColor: '#fff' }}>╳</span>
              <span>Russian unit</span>
            </div>
          </div>
          <div className="conflict-map-legend-section">
            <div className="conflict-map-legend-heading">Unit Type (symbol inside box)</div>
            <div className="conflict-map-legend-row">
              <span className="conflict-map-legend-nato" style={{ background: '#555', borderColor: '#888' }}>╳</span>
              <span>Infantry</span>
            </div>
            <div className="conflict-map-legend-row">
              <span className="conflict-map-legend-nato" style={{ background: '#555', borderColor: '#888' }}>⊙</span>
              <span>Armor / Tanks</span>
            </div>
            <div className="conflict-map-legend-row">
              <span className="conflict-map-legend-nato" style={{ background: '#555', borderColor: '#888' }}>╳⊙</span>
              <span>Mechanized Infantry</span>
            </div>
            <div className="conflict-map-legend-row">
              <span className="conflict-map-legend-nato" style={{ background: '#555', borderColor: '#888' }}>●</span>
              <span>Artillery</span>
            </div>
            <div className="conflict-map-legend-row">
              <span className="conflict-map-legend-nato" style={{ background: '#555', borderColor: '#888' }}>⚓</span>
              <span>Marines</span>
            </div>
          </div>
          <div className="conflict-map-legend-section">
            <div className="conflict-map-legend-heading">Unit Size (pips above box)</div>
            <div className="conflict-map-legend-row">
              <span className="conflict-map-legend-pips">II</span>
              <span>Battalion (~300–1,000)</span>
            </div>
            <div className="conflict-map-legend-row">
              <span className="conflict-map-legend-pips">III</span>
              <span>Regiment (~1,000–3,000)</span>
            </div>
            <div className="conflict-map-legend-row">
              <span className="conflict-map-legend-pips">╳</span>
              <span>Brigade (~3,000–5,000)</span>
            </div>
            <div className="conflict-map-legend-row">
              <span className="conflict-map-legend-pips">╳╳</span>
              <span>Division (~10,000–20,000)</span>
            </div>
            <div className="conflict-map-legend-row">
              <span className="conflict-map-legend-pips">╳╳╳</span>
              <span>Corps (~20,000–40,000)</span>
            </div>
          </div>
          <div className="conflict-map-legend-section">
            <div className="conflict-map-legend-heading">Coat of Arms</div>
            <div className="conflict-map-legend-row">
              <span className="conflict-map-legend-icon" style={{ fontSize: 14 }}>🇺🇦</span>
              <span>Ukraine (Tryzub)</span>
            </div>
            <div className="conflict-map-legend-row">
              <span className="conflict-map-legend-icon" style={{ fontSize: 14 }}>🇷🇺</span>
              <span>Russia (Double-headed eagle)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────────────────────────────────────────
   Main overlay
   ─────────────────────────────────────────── */

export default function ConflictOverlay({ visible, onTroopClick, showTroops = true, zoom = 2 }) {
  const visibility = visible ? 'visible' : 'none';
  const [selectedBattle, setSelectedBattle] = useState(null);

  const showDetail = zoom >= ZOOM_SHOW_DETAIL;
  const showLabels = zoom >= ZOOM_SHOW_LABELS;

  const frontlineGeoJSON = useMemo(() => ({
    type: 'FeatureCollection',
    features: FRONTLINE_SEGMENTS.map((seg) => ({
      type: 'Feature',
      properties: { id: seg.id, label: seg.label, status: seg.status, color: getFrontlineColor(seg.asOf) },
      geometry: { type: 'LineString', coordinates: seg.points },
    })),
  }), []);

  const fortificationGeoJSON = useMemo(() => ({
    type: 'FeatureCollection',
    features: FORTIFICATION_LINES.map((line) => ({
      type: 'Feature',
      properties: { id: line.id, name: line.name, note: line.note },
      geometry: {
        type: line.id === 'kursk-incursion' ? 'Polygon' : 'LineString',
        coordinates: line.id === 'kursk-incursion' ? [line.points] : line.points,
      },
    })),
  }), []);

  const oblastBordersGeoJSON = useMemo(() => ({
    type: 'FeatureCollection',
    features: OCCUPIED_OBLAST_BORDERS.map((ob) => ({
      type: 'Feature',
      properties: { id: ob.id, name: ob.name, note: ob.note },
      geometry: { type: 'LineString', coordinates: ob.points },
    })),
  }), []);

  const sectorLabels = useMemo(() =>
    FRONTLINE_SEGMENTS.map((seg) => {
      const mid = seg.points[Math.floor(seg.points.length / 2)];
      return { id: seg.id, label: seg.label, status: seg.status, lon: mid[0], lat: mid[1] };
    }), []);

  return (
    <>
      {/* ══════════ Occupied oblast borders ══════════ */}
      <Source id="conflict-oblast-borders" type="geojson" data={oblastBordersGeoJSON}>
        <Layer
          id="conflict-oblast-glow"
          type="line"
          layout={{ visibility, 'line-cap': 'round', 'line-join': 'round' }}
          paint={{
            'line-color': '#ffa500',
            'line-width': 5,
            'line-blur': 4,
            'line-opacity': 0.15,
          }}
        />
        <Layer
          id="conflict-oblast-line"
          type="line"
          layout={{ visibility, 'line-cap': 'round', 'line-join': 'round' }}
          paint={{
            'line-color': '#ffa500',
            'line-width': 1.5,
            'line-dasharray': [6, 4],
            'line-opacity': 0.55,
          }}
        />
      </Source>

      {/* ══════════ Fortification lines & zones ══════════ */}
      <Source id="conflict-fortifications" type="geojson" data={fortificationGeoJSON}>
        {/* Surovikin line — dashed orange */}
        <Layer
          id="conflict-fort-line"
          type="line"
          filter={['==', ['geometry-type'], 'LineString']}
          layout={{ visibility, 'line-cap': 'round', 'line-join': 'round' }}
          paint={{
            'line-color': '#ff8c00',
            'line-width': 2,
            'line-dasharray': [4, 3],
            'line-opacity': 0.6,
          }}
        />
        {/* Kursk incursion zone — blue fill */}
        <Layer
          id="conflict-fort-fill"
          type="fill"
          filter={['==', ['geometry-type'], 'Polygon']}
          layout={{ visibility }}
          paint={{
            'fill-color': UA_BLUE,
            'fill-opacity': 0.12,
          }}
        />
        <Layer
          id="conflict-fort-outline"
          type="line"
          filter={['==', ['geometry-type'], 'Polygon']}
          layout={{ visibility, 'line-cap': 'round', 'line-join': 'round' }}
          paint={{
            'line-color': UA_BLUE,
            'line-width': 2,
            'line-dasharray': [3, 2],
            'line-opacity': 0.7,
          }}
        />
      </Source>

      {/* ══════════ Frontline ══════════ */}
      <Source id="conflict-frontline" type="geojson" data={frontlineGeoJSON}>
        <Layer id="conflict-fl-glow" type="line"
          layout={{ visibility, 'line-cap': 'round', 'line-join': 'round' }}
          paint={{ 'line-color': ['get', 'color'], 'line-width': 14, 'line-opacity': 0.10, 'line-blur': 4 }} />
        <Layer id="conflict-fl-ua" type="line"
          layout={{ visibility, 'line-cap': 'round', 'line-join': 'round' }}
          paint={{ 'line-color': UA_BLUE, 'line-width': 2, 'line-offset': -3, 'line-opacity': 0.8 }} />
        <Layer id="conflict-fl-center" type="line"
          layout={{ visibility, 'line-cap': 'round', 'line-join': 'round' }}
          paint={{ 'line-color': ['get', 'color'], 'line-width': 2.5 }} />
        <Layer id="conflict-fl-ru" type="line"
          layout={{ visibility, 'line-cap': 'round', 'line-join': 'round' }}
          paint={{ 'line-color': RU_RED, 'line-width': 2, 'line-offset': 3, 'line-opacity': 0.8 }} />
      </Source>

      {/* ══════════ Sector labels (zoom-gated) ══════════ */}
      {visible && showDetail && sectorLabels.map((s) => (
        <Marker key={`cfl-${s.id}`} longitude={s.lon} latitude={s.lat} anchor="right">
          <div className="conflict-sector-label" style={{ marginRight: 18 }}>
            <span className="conflict-sector-name">{s.label}</span>
            <span className={`conflict-sector-status conflict-sector-status--${s.status}`}>
              {s.status === 'active' ? 'Active Combat' : s.status === 'contested' ? 'Contested' : 'Stable'}
            </span>
          </div>
        </Marker>
      ))}

      {/* ══════════ Battle sites (zoom-gated) ══════════ */}
      {visible && showDetail && BATTLE_SITES.map((site) => (
        <Marker key={site.id} longitude={site.lon} latitude={site.lat} anchor="center">
          <BattleSiteMarker site={site} onClick={setSelectedBattle} />
        </Marker>
      ))}

      {/* ══════════ Battle popup ══════════ */}
      {visible && selectedBattle && (
        <Marker longitude={selectedBattle.lon} latitude={selectedBattle.lat} anchor="bottom">
          <BattlePopup site={selectedBattle} onClose={() => setSelectedBattle(null)} />
        </Marker>
      )}

      {/* ══════════ Nuclear power plants (zoom-gated) ══════════ */}
      {visible && showDetail && NUCLEAR_PLANTS.map((plant) => (
        <Marker key={plant.id} longitude={plant.lon} latitude={plant.lat} anchor="center">
          <NppMarker plant={plant} />
        </Marker>
      ))}

      {/* ══════════ Capitals (always visible when conflict mode on) ══════════ */}
      {visible && CAPITALS.map((c) => (
        <Marker key={c.id} longitude={c.lon} latitude={c.lat} anchor="center">
          <CapitalMarker city={c} />
        </Marker>
      ))}

      {/* ══════════ Major cities (zoom-gated, hide label if infra shares coords) ══════════ */}
      {visible && showDetail && MAJOR_CITIES.map((c) => (
        <Marker key={c.id} longitude={c.lon} latitude={c.lat} anchor="left">
          <CityMarker city={c} hideLabel={INFRA_CITY_IDS.has(c.id)} />
        </Marker>
      ))}

      {/* ══════════ Military infrastructure (zoom-gated) ══════════ */}
      {visible && showDetail && MILITARY_INFRASTRUCTURE.map((item) => (
        <Marker key={item.id} longitude={item.lon} latitude={item.lat} anchor="center">
          <InfraMarker item={item} showLabel={showLabels} />
        </Marker>
      ))}

      {/* ══════════ Black Sea naval (zoom-gated) ══════════ */}
      {visible && showDetail && NAVAL_POSITIONS.map((pos) => (
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
          {/* Russia coat of arms positioned near the border by the conflict zone */}
          <Marker longitude={38.5} latitude={50.8} anchor="center">
            <CoatOfArms country="russia" />
          </Marker>
        </>
      )}

      {/* ══════════ NATO troop symbols (zoom-gated) ══════════ */}
      {visible && showDetail && showTroops && TROOP_POSITIONS.map((unit) => (
        <Marker key={unit.id} longitude={unit.lon} latitude={unit.lat} anchor="center">
          <NatoSymbol unit={unit} onClick={onTroopClick} />
        </Marker>
      ))}

    </>
  );
}
