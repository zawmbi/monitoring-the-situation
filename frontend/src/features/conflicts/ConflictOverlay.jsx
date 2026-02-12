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
      <div className="conflict-coa conflict-coa--ua" title="Ukraine — Tryzub">
        <svg viewBox="0 0 100 130" width="56" height="72">
          {/* Shield shape */}
          <defs>
            <linearGradient id="ua-shield" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0057B8"/>
              <stop offset="100%" stopColor="#003d82"/>
            </linearGradient>
          </defs>
          <path d="M10,5 h80 v65 q0,25 -20,40 l-20,15 -20,-15 q-20,-15 -20,-40 z"
            fill="url(#ua-shield)" stroke="#FFD700" strokeWidth="3.5"/>
          {/* Tryzub (trident) — detailed */}
          <g transform="translate(50,62)" fill="#FFD700">
            {/* Central prong */}
            <rect x="-3.5" y="-40" width="7" height="72" rx="2"/>
            {/* Left prong */}
            <rect x="-22" y="-38" width="5.5" height="48" rx="2"/>
            <path d="M-22,-38 Q-22,-52 -3.5,-48" fill="none" stroke="#FFD700" strokeWidth="4.5" strokeLinecap="round"/>
            {/* Right prong */}
            <rect x="16.5" y="-38" width="5.5" height="48" rx="2"/>
            <path d="M22,-38 Q22,-52 3.5,-48" fill="none" stroke="#FFD700" strokeWidth="4.5" strokeLinecap="round"/>
            {/* Cross bar */}
            <rect x="-26" y="8" width="52" height="5.5" rx="2"/>
            {/* Arrowhead tips */}
            <polygon points="-22,-38 -19,-44 -16.5,-38"/>
            <polygon points="16.5,-38 19,-44 22,-38"/>
            <polygon points="-3.5,-40 0,-48 3.5,-40"/>
          </g>
        </svg>
      </div>
    );
  }
  return (
    <div className="conflict-coa conflict-coa--ru" title="Russia — Double-Headed Eagle">
      <svg viewBox="0 0 100 130" width="56" height="72">
        {/* Shield shape */}
        <defs>
          <linearGradient id="ru-shield" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#D52B1E"/>
            <stop offset="100%" stopColor="#a82018"/>
          </linearGradient>
        </defs>
        <path d="M10,5 h80 v65 q0,25 -20,40 l-20,15 -20,-15 q-20,-15 -20,-40 z"
          fill="url(#ru-shield)" stroke="#FFD700" strokeWidth="3.5"/>
        {/* Double-headed eagle */}
        <g transform="translate(50,60)">
          {/* Body */}
          <ellipse cx="0" cy="2" rx="20" ry="16" fill="#FFD700"/>
          <ellipse cx="0" cy="2" rx="16" ry="12" fill="#D52B1E"/>
          {/* Inner shield (St. George) */}
          <rect x="-8" y="-8" width="16" height="20" rx="3" fill="#0039A6" stroke="#FFD700" strokeWidth="1"/>
          <path d="M0,-2 L4,6 -4,6 z" fill="#fff" opacity="0.7"/>
          {/* Left head */}
          <circle cx="-16" cy="-18" r="7" fill="#FFD700"/>
          <circle cx="-17" cy="-19" r="1.5" fill="#D52B1E"/>
          <polygon points="-24,-18 -20,-16 -20,-20" fill="#FFD700"/>
          {/* Right head */}
          <circle cx="16" cy="-18" r="7" fill="#FFD700"/>
          <circle cx="17" cy="-19" r="1.5" fill="#D52B1E"/>
          <polygon points="24,-18 20,-16 20,-20" fill="#FFD700"/>
          {/* Wings */}
          <path d="M-20,-4 Q-34,-16 -28,-30" fill="none" stroke="#FFD700" strokeWidth="3" strokeLinecap="round"/>
          <path d="M-22,-8 Q-32,-18 -30,-26" fill="none" stroke="#FFD700" strokeWidth="2" strokeLinecap="round"/>
          <path d="M20,-4 Q34,-16 28,-30" fill="none" stroke="#FFD700" strokeWidth="3" strokeLinecap="round"/>
          <path d="M22,-8 Q32,-18 30,-26" fill="none" stroke="#FFD700" strokeWidth="2" strokeLinecap="round"/>
          {/* Crown */}
          <path d="M-8,-28 L0,-38 L8,-28" fill="#FFD700" stroke="#D52B1E" strokeWidth="1"/>
          <circle cx="0" cy="-38" r="3" fill="#FFD700" stroke="#D52B1E" strokeWidth="0.5"/>
          {/* Scepter & orb */}
          <line x1="-16" y1="-10" x2="-26" y2="12" stroke="#FFD700" strokeWidth="2"/>
          <circle cx="-26" cy="12" r="3" fill="#FFD700"/>
          <line x1="16" y1="-10" x2="26" y2="12" stroke="#FFD700" strokeWidth="2"/>
          <circle cx="26" cy="14" r="2.5" fill="#FFD700" stroke="#FFD700" strokeWidth="0.5"/>
          <line x1="26" y1="11.5" x2="26" y2="8" stroke="#FFD700" strokeWidth="1.5"/>
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

const INFRA_SVG = {
  airbase: (color) => (
    <svg viewBox="0 0 20 20" width="22" height="22" fill="none">
      <path d="M10 2L3 11h4v6h6v-6h4L10 2z" fill={color} stroke="rgba(0,0,0,0.5)" strokeWidth="0.8"/>
    </svg>
  ),
  port: (color) => (
    <svg viewBox="0 0 20 20" width="22" height="22" fill="none">
      <path d="M10 2v8M6 10c0 3 1.8 5 4 5s4-2 4-5" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <line x1="4" y1="17" x2="16" y2="17" stroke={color} strokeWidth="1.5"/>
    </svg>
  ),
  depot: (color) => (
    <svg viewBox="0 0 20 20" width="20" height="20" fill="none">
      <rect x="3" y="6" width="14" height="10" rx="1.5" fill={color} stroke="rgba(0,0,0,0.5)" strokeWidth="0.8"/>
      <path d="M3 6l7-4 7 4" stroke={color} strokeWidth="1.5" fill="none"/>
    </svg>
  ),
  bridge: (color) => (
    <svg viewBox="0 0 20 20" width="20" height="20" fill="none">
      <path d="M2 14c3-6 5-6 8-6s5 0 8 6" stroke={color} strokeWidth="1.8" fill="none"/>
      <line x1="6" y1="8" x2="6" y2="14" stroke={color} strokeWidth="1.5"/>
      <line x1="14" y1="8" x2="14" y2="14" stroke={color} strokeWidth="1.5"/>
    </svg>
  ),
  airdefense: (color) => (
    <svg viewBox="0 0 20 20" width="22" height="22" fill="none">
      <circle cx="10" cy="10" r="7" stroke={color} strokeWidth="1.5"/>
      <circle cx="10" cy="10" r="2" fill={color}/>
      <line x1="10" y1="3" x2="10" y2="7" stroke={color} strokeWidth="1.2"/>
      <line x1="10" y1="13" x2="10" y2="17" stroke={color} strokeWidth="1.2"/>
      <line x1="3" y1="10" x2="7" y2="10" stroke={color} strokeWidth="1.2"/>
      <line x1="13" y1="10" x2="17" y2="10" stroke={color} strokeWidth="1.2"/>
    </svg>
  ),
};
function InfraMarker({ item, showLabel }) {
  const isUA = item.side === 'ukraine';
  const color = isUA ? '#9ec8ff' : '#ff9d91';
  const svgRenderer = INFRA_SVG[item.type];
  return (
    <div className={`conflict-infra conflict-infra--${item.type} conflict-infra--${isUA ? 'ua' : 'ru'}`}
      title={`${item.name}${item.note ? ` — ${item.note}` : ''}`}>
      <span className="conflict-infra-icon conflict-infra-icon--svg">
        {svgRenderer ? svgRenderer(color) : <svg viewBox="0 0 20 20" width="14" height="14"><circle cx="10" cy="10" r="5" fill={color}/></svg>}
      </span>
      {showLabel && <span className="conflict-infra-label">{item.name.split(' ')[0]}</span>}
    </div>
  );
}

const NAVAL_SVG = {
  patrol: (color) => (
    <svg viewBox="0 0 20 20" width="22" height="22" fill="none">
      <path d="M3 13c2-1 4-2 7-2s5 1 7 2" stroke={color} strokeWidth="1.5"/>
      <path d="M6 13V8l4-3 4 3v5" stroke={color} strokeWidth="1.2"/>
      <line x1="10" y1="5" x2="10" y2="3" stroke={color} strokeWidth="1"/>
    </svg>
  ),
  anchorage: (color) => (
    <svg viewBox="0 0 20 20" width="22" height="22" fill="none">
      <path d="M10 2v8M6 10c0 3 1.8 5 4 5s4-2 4-5" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <line x1="4" y1="17" x2="16" y2="17" stroke={color} strokeWidth="1.5"/>
    </svg>
  ),
  submarine: (color) => (
    <svg viewBox="0 0 20 20" width="22" height="22" fill="none">
      <ellipse cx="10" cy="12" rx="7" ry="3.5" fill={color} opacity="0.3" stroke={color} strokeWidth="1.2"/>
      <line x1="10" y1="8.5" x2="10" y2="5" stroke={color} strokeWidth="1.2"/>
      <line x1="8" y1="6" x2="12" y2="6" stroke={color} strokeWidth="1"/>
    </svg>
  ),
  coastal: (color) => (
    <svg viewBox="0 0 20 20" width="22" height="22" fill="none">
      <path d="M10 3L5 9h3v6h4V9h3L10 3z" fill={color} stroke="rgba(0,0,0,0.4)" strokeWidth="0.6"/>
      <line x1="3" y1="17" x2="17" y2="17" stroke={color} strokeWidth="1.5"/>
    </svg>
  ),
  usv: (color) => (
    <svg viewBox="0 0 20 20" width="20" height="20" fill="none">
      <path d="M4 12h12l-2 3H6l-2-3z" fill={color} opacity="0.4" stroke={color} strokeWidth="1"/>
      <circle cx="10" cy="9" r="3" stroke={color} strokeWidth="1.2"/>
      <circle cx="10" cy="9" r="1" fill={color}/>
    </svg>
  ),
  corridor: (color) => (
    <svg viewBox="0 0 20 20" width="20" height="20" fill="none">
      <path d="M4 10h9M13 7l3 3-3 3" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  wreck: (color) => (
    <svg viewBox="0 0 20 20" width="20" height="20" fill="none">
      <line x1="5" y1="5" x2="15" y2="15" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <line x1="15" y1="5" x2="5" y2="15" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
};
function NavalMarker({ pos }) {
  const isUA = pos.side === 'ukraine';
  const isWreck = pos.status === 'destroyed';
  const color = isWreck ? '#888' : isUA ? '#9ec8ff' : '#ff9d91';
  const svgRenderer = NAVAL_SVG[pos.type];
  return (
    <div className={`conflict-naval conflict-naval--${isUA ? 'ua' : 'ru'} ${isWreck ? 'conflict-naval--wreck' : ''}`}
      title={`${pos.name}\n${pos.vessels}\n${pos.note || ''}`}>
      <span className="conflict-naval-icon conflict-naval-icon--svg">
        {svgRenderer ? svgRenderer(color) : <svg viewBox="0 0 20 20" width="14" height="14"><circle cx="10" cy="10" r="5" fill={color}/></svg>}
      </span>
      <span className="conflict-naval-label">{pos.name.replace(/^(BSF |UA )/, '')}</span>
    </div>
  );
}

function BattleIcon({ color }) {
  return (
    <svg viewBox="0 0 28 28" width="26" height="26" fill="none">
      {/* Crossed swords */}
      <line x1="4" y1="4" x2="24" y2="24" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="24" y1="4" x2="4" y2="24" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
      {/* Sword hilts */}
      <line x1="2" y1="6" x2="6" y2="2" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <line x1="22" y1="2" x2="26" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      {/* Guards */}
      <circle cx="7" cy="7" r="2" fill={color} opacity="0.6"/>
      <circle cx="21" cy="7" r="2" fill={color} opacity="0.6"/>
    </svg>
  );
}
function BattleSiteMarker({ site, onClick }) {
  const resultClass = site.result.startsWith('RU') ? 'ru' : site.result.startsWith('UA') ? 'ua' : 'contested';
  const color = resultClass === 'ru' ? '#ff6b6b' : resultClass === 'ua' ? '#5baaff' : '#ffa500';
  return (
    <div className={`conflict-battle conflict-battle--${resultClass}`}
      onClick={(e) => { e.stopPropagation(); onClick?.(site); }}
      title={`${site.name} — Click for details`}>
      <span className="conflict-battle-icon conflict-battle-icon--svg"><BattleIcon color={color} /></span>
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

function NppIcon({ color }) {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none">
      {/* Outer circle */}
      <circle cx="12" cy="12" r="11" stroke={color} strokeWidth="1.2"/>
      {/* Center dot */}
      <circle cx="12" cy="12" r="2.5" fill={color}/>
      {/* Three trefoil blades — proper radiation symbol */}
      <path d="M12 9.5 A5.5 5.5 0 0 1 16.76 12.5 L12 12.5 Z" fill={color}/>
      <path d="M12 9.5 A5.5 5.5 0 0 0 7.24 12.5 L12 12.5 Z" fill={color}/>
      <path d="M16.76 12.5 A5.5 5.5 0 0 1 12 15.5 L12 12.5 Z" fill={color} transform="rotate(120 12 12)"/>
      <path d="M12 9.5 A5.5 5.5 0 0 1 16.76 12.5 L12 12.5 Z" fill={color} transform="rotate(120 12 12)"/>
      <path d="M12 9.5 A5.5 5.5 0 0 1 16.76 12.5 L12 12.5 Z" fill={color} transform="rotate(240 12 12)"/>
      {/* Gap circles to create trefoil cutouts */}
      <circle cx="12" cy="7.5" r="1.8" fill="rgba(0,0,0,0.9)"/>
      <circle cx="15.9" cy="14.5" r="1.8" fill="rgba(0,0,0,0.9)"/>
      <circle cx="8.1" cy="14.5" r="1.8" fill="rgba(0,0,0,0.9)"/>
    </svg>
  );
}
function NppMarker({ plant }) {
  const color = plant.status === 'operational' ? '#f0c040' : plant.status === 'occupied' ? '#ff6b6b' : '#888';
  return (
    <div className={`conflict-npp conflict-npp--${plant.status}`} title={`${plant.name}\n${plant.note}`}>
      <span className="conflict-npp-icon conflict-npp-icon--svg"><NppIcon color={color} /></span>
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
              <span className="conflict-map-legend-icon">{INFRA_SVG.airbase('#9ec8ff')}</span>
              <span>Airbase</span>
            </div>
            <div className="conflict-map-legend-row">
              <span className="conflict-map-legend-icon">{INFRA_SVG.port('#9ec8ff')}</span>
              <span>Port / Naval base</span>
            </div>
            <div className="conflict-map-legend-row">
              <span className="conflict-map-legend-icon">{INFRA_SVG.airdefense('#9ec8ff')}</span>
              <span>Air defense</span>
            </div>
            <div className="conflict-map-legend-row">
              <span className="conflict-map-legend-icon">{INFRA_SVG.depot('#9ec8ff')}</span>
              <span>Supply depot</span>
            </div>
            <div className="conflict-map-legend-row">
              <span className="conflict-map-legend-icon">{INFRA_SVG.bridge('#ff9d91')}</span>
              <span>Bridge</span>
            </div>
          </div>
          <div className="conflict-map-legend-section">
            <div className="conflict-map-legend-heading">Combat & Strategic</div>
            <div className="conflict-map-legend-row">
              <span className="conflict-map-legend-icon"><BattleIcon color="#ffa500" /></span>
              <span>Battle site</span>
            </div>
            <div className="conflict-map-legend-row">
              <span className="conflict-map-legend-icon"><NppIcon color="#f0c040" /></span>
              <span>Nuclear power plant</span>
            </div>
            <div className="conflict-map-legend-row">
              <span className="conflict-map-legend-icon">{NAVAL_SVG.patrol('#ff9d91')}</span>
              <span>Naval patrol</span>
            </div>
            <div className="conflict-map-legend-row">
              <span className="conflict-map-legend-icon">{NAVAL_SVG.usv('#9ec8ff')}</span>
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
              <span className="conflict-map-legend-icon">
                <svg viewBox="0 0 100 130" width="16" height="20">
                  <path d="M10,5 h80 v65 q0,25 -20,40 l-20,15 -20,-15 q-20,-15 -20,-40 z"
                    fill="#0057B8" stroke="#FFD700" strokeWidth="4"/>
                  <g transform="translate(50,62)" fill="#FFD700">
                    <rect x="-3" y="-35" width="6" height="60" rx="2"/>
                    <rect x="-18" y="-33" width="5" height="40" rx="2"/>
                    <rect x="13" y="-33" width="5" height="40" rx="2"/>
                    <rect x="-22" y="6" width="44" height="5" rx="2"/>
                  </g>
                </svg>
              </span>
              <span>Ukraine (Tryzub)</span>
            </div>
            <div className="conflict-map-legend-row">
              <span className="conflict-map-legend-icon">
                <svg viewBox="0 0 100 130" width="16" height="20">
                  <path d="M10,5 h80 v65 q0,25 -20,40 l-20,15 -20,-15 q-20,-15 -20,-40 z"
                    fill="#D52B1E" stroke="#FFD700" strokeWidth="4"/>
                  <g transform="translate(50,60)">
                    <ellipse cx="0" cy="2" rx="18" ry="14" fill="#FFD700"/>
                    <circle cx="-14" cy="-16" r="6" fill="#FFD700"/>
                    <circle cx="14" cy="-16" r="6" fill="#FFD700"/>
                  </g>
                </svg>
              </span>
              <span>Russia (Double-headed eagle)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────────────────────────────────────────
   Exported symbol renderers for legend reuse
   ─────────────────────────────────────────── */
export { INFRA_SVG, NAVAL_SVG, BattleIcon, NppIcon };

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

  const sectorLabels = useMemo(() =>
    FRONTLINE_SEGMENTS.map((seg) => {
      const mid = seg.points[Math.floor(seg.points.length / 2)];
      return { id: seg.id, label: seg.label, status: seg.status, lon: mid[0], lat: mid[1] };
    }), []);

  return (
    <>
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

      {/* ══════════ Frontline — sleek minimal design ══════════ */}
      <Source id="conflict-frontline" type="geojson" data={frontlineGeoJSON}>
        {/* Soft outer glow */}
        <Layer id="conflict-fl-glow" type="line"
          layout={{ visibility, 'line-cap': 'round', 'line-join': 'round' }}
          paint={{ 'line-color': 'rgba(255,80,60,0.12)', 'line-width': 10, 'line-blur': 6 }} />
        {/* UA side — thin blue accent */}
        <Layer id="conflict-fl-ua" type="line"
          layout={{ visibility, 'line-cap': 'round', 'line-join': 'round' }}
          paint={{ 'line-color': UA_BLUE, 'line-width': 1.5, 'line-offset': -2, 'line-opacity': 0.7 }} />
        {/* Center line — crisp white-hot core */}
        <Layer id="conflict-fl-center" type="line"
          layout={{ visibility, 'line-cap': 'round', 'line-join': 'round' }}
          paint={{ 'line-color': 'rgba(255,255,255,0.7)', 'line-width': 1 }} />
        {/* RU side — thin red accent */}
        <Layer id="conflict-fl-ru" type="line"
          layout={{ visibility, 'line-cap': 'round', 'line-join': 'round' }}
          paint={{ 'line-color': RU_RED, 'line-width': 1.5, 'line-offset': 2, 'line-opacity': 0.7 }} />
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

      {/* ══════════ Coat of Arms (zoom-gated) ══════════ */}
      {visible && showDetail && (
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
