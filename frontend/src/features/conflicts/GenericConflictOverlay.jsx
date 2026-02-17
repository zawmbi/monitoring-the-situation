/**
 * GenericConflictOverlay — Reusable conflict map overlay
 * Renders frontlines, cities, military infrastructure, battle sites,
 * troop positions, control zones, and coat of arms for any conflict.
 *
 * Expects a `conflictData` prop with a standardized shape.
 */
import { useState, useMemo, memo } from 'react';
import { Source, Layer, Marker } from '@vis.gl/react-maplibre';
import { getFrontlineColor as defaultGetColor } from './utils';
import ConflictFlag from './ConflictFlag';

const ZOOM_SHOW_DETAIL = 4;
const ZOOM_SHOW_LABELS = 5;

/* ─── Marker sub-components ─── */

function NatoSymbol({ unit, sideAColor, sideBColor, onClick }) {
  const isA = unit.side === 'sideA';
  const bgColor = isA ? sideAColor : sideBColor;
  const borderColor = isA ? '#fff' : '#fff';
  const typeIcon = { infantry: '\u2573', mechanized: '\u2573\u2299', armor: '\u2299', artillery: '\u25CF', marines: '\u2693' }[unit.unitType] || '\u2573';
  const sizePips = { battalion: 'II', regiment: 'III', brigade: '\u2573', division: '\u2573\u2573', corps: '\u2573\u2573\u2573' }[unit.unitSize] || '\u2573';
  return (
    <div className="conflict-nato-symbol" onClick={(e) => { e.stopPropagation(); onClick?.(unit); }}
      title={`${unit.name} (${unit.sector})`} style={{ '--nato-bg': bgColor, '--nato-border': borderColor }}>
      <div className="conflict-nato-size">{sizePips}</div>
      <div className="conflict-nato-box"><span className="conflict-nato-icon">{typeIcon}</span></div>
    </div>
  );
}

function CapitalMarker({ city, color }) {
  return (
    <div className="conflict-capital" title={`${city.name} — Capital`}>
      <svg viewBox="0 0 24 24" width="26" height="26">
        <polygon points="12,2 15,9 22,9 16.5,14 18.5,21 12,17 5.5,21 7.5,14 2,9 9,9"
          fill={color} stroke="#FFD700" strokeWidth="1.5" />
      </svg>
      <span className="conflict-capital-label">{city.name}</span>
    </div>
  );
}

function CityMarker({ city, sideAColor, sideBColor }) {
  const color = city.country === 'sideA' ? sideAColor : city.country === 'sideB' ? sideBColor : '#ffa500';
  return (
    <div className="conflict-city" title={city.note || city.name} style={{ '--city-color': color }}>
      <span className="conflict-city-dot" style={{ background: color }} />
      <span className="conflict-city-label">{city.name}</span>
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

function InfraMarker({ item, sideAColor, sideBColor, showLabel }) {
  const isA = item.side === 'sideA';
  const color = isA ? sideAColor : sideBColor;
  const lightColor = isA ? `${sideAColor}88` : `${sideBColor}88`;
  const svgRenderer = INFRA_SVG[item.type];
  return (
    <div className={`conflict-infra conflict-infra--${item.type}`}
      title={`${item.name}${item.note ? ` \u2014 ${item.note}` : ''}`}>
      <span className="conflict-infra-icon conflict-infra-icon--svg">
        {svgRenderer ? svgRenderer(lightColor) : <svg viewBox="0 0 20 20" width="14" height="14"><circle cx="10" cy="10" r="5" fill={lightColor}/></svg>}
      </span>
      {showLabel && <span className="conflict-infra-label">{item.name.split(' ')[0]}</span>}
    </div>
  );
}

function BattleIcon({ color }) {
  return (
    <svg viewBox="0 0 28 28" width="26" height="26" fill="none">
      <line x1="4" y1="4" x2="24" y2="24" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="24" y1="4" x2="4" y2="24" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="2" y1="6" x2="6" y2="2" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <line x1="22" y1="2" x2="26" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <circle cx="7" cy="7" r="2" fill={color} opacity="0.6"/>
      <circle cx="21" cy="7" r="2" fill={color} opacity="0.6"/>
    </svg>
  );
}

function BattleSiteMarker({ site, onClick, sideAName, sideBName }) {
  const isAResult = site.result?.toLowerCase().includes(sideAName?.toLowerCase()?.slice(0, 4)) || site.result?.toLowerCase().includes('captured');
  const isBResult = site.result?.toLowerCase().includes(sideBName?.toLowerCase()?.slice(0, 4)) || site.result?.toLowerCase().includes('resistance') || site.result?.toLowerCase().includes('victory');
  const resultClass = isAResult && !isBResult ? 'ru' : isBResult ? 'ua' : 'contested';
  const color = resultClass === 'ru' ? '#ff6b6b' : resultClass === 'ua' ? '#5baaff' : '#ffa500';
  return (
    <div className={`conflict-battle conflict-battle--${resultClass}`}
      onClick={(e) => { e.stopPropagation(); onClick?.(site); }}
      title={`${site.name} \u2014 Click for details`}>
      <span className="conflict-battle-icon conflict-battle-icon--svg"><BattleIcon color={color} /></span>
      <span className="conflict-battle-label">{site.name.replace(/^(Battle of |Siege of |Operation )/, '')}</span>
    </div>
  );
}

const UNIT_TYPE_LABELS = { infantry: 'Infantry', mechanized: 'Mechanized Infantry', armor: 'Armor / Tanks', artillery: 'Artillery', marines: 'Marines' };
const UNIT_SIZE_LABELS = { battalion: 'Battalion (~300–1,000)', regiment: 'Regiment (~1,000–3,000)', brigade: 'Brigade (~3,000–5,000)', division: 'Division (~10,000–20,000)', corps: 'Corps (~20,000–40,000)' };

function TroopPopup({ unit, onClose, sideAColor, sideBColor, sideAName, sideBName, sideAFlag, sideBFlag }) {
  if (!unit) return null;
  const isA = unit.side === 'sideA';
  const color = isA ? sideAColor : sideBColor;
  const sideName = isA ? sideAName : sideBName;
  const flag = isA ? sideAFlag : sideBFlag;
  const newsQuery = encodeURIComponent(`${unit.name} ${sideName} military`);
  return (
    <div className="conflict-troop-popup" onClick={(e) => e.stopPropagation()} onWheel={(e) => e.stopPropagation()}>
      <div className="conflict-troop-popup-header">
        <div className="conflict-troop-popup-title">{flag && <span style={{ marginRight: 6 }}><ConflictFlag flag={flag} color={color} size={18} /></span>}{unit.name}</div>
        <button className="conflict-troop-popup-close" onClick={onClose}>{'\u2715'}</button>
      </div>
      <div className="conflict-troop-popup-side-badge" style={{ background: `${color}22`, color, borderColor: `${color}44` }}>
        {sideName}
      </div>
      <div className="conflict-troop-popup-body">
        <div className="conflict-troop-popup-row"><span>Unit Type</span><span>{UNIT_TYPE_LABELS[unit.unitType] || unit.unitType}</span></div>
        <div className="conflict-troop-popup-row"><span>Unit Size</span><span>{UNIT_SIZE_LABELS[unit.unitSize] || unit.unitSize}</span></div>
        <div className="conflict-troop-popup-row"><span>Sector</span><span>{unit.sector}</span></div>
        <div className="conflict-troop-popup-row"><span>Position</span><span className="conflict-troop-popup-coords">{unit.lat.toFixed(2)}°N, {unit.lon.toFixed(2)}°E</span></div>
      </div>
      <div className="conflict-troop-popup-footer">
        <a className="conflict-troop-popup-news-link" href={`https://news.google.com/search?q=${newsQuery}`} target="_blank" rel="noopener noreferrer">Search latest news →</a>
      </div>
    </div>
  );
}

function BattlePopup({ site, onClose, sideAColor, sideBColor, sideAName, sideBName }) {
  if (!site) return null;
  return (
    <div className="conflict-battle-popup" onClick={(e) => e.stopPropagation()} onWheel={(e) => e.stopPropagation()}>
      <div className="conflict-battle-popup-header">
        <div className="conflict-battle-popup-title">{site.name}</div>
        <button className="conflict-battle-popup-close" onClick={onClose}>{'\u2715'}</button>
      </div>
      <div className="conflict-battle-popup-result">{site.result}</div>
      <div className="conflict-battle-popup-date">{site.date}</div>

      <div className="conflict-battle-popup-sides">
        <div className="conflict-battle-popup-side">
          <div className="conflict-battle-popup-side-label">
            <span className="conflict-side-dot" style={{ background: sideAColor }} /> {sideAName}
          </div>
          <div className="conflict-battle-popup-row"><span>Commander</span><span>{site.sideACommander}</span></div>
          <div className="conflict-battle-popup-row"><span>Troops</span><span>{site.sideATroops}</span></div>
          <div className="conflict-battle-popup-row"><span>Equipment</span><span>{site.sideAEquipment}</span></div>
          <div className="conflict-battle-popup-row"><span>Casualties</span><span>{site.sideACasualties}</span></div>
        </div>
        <div className="conflict-battle-popup-side">
          <div className="conflict-battle-popup-side-label">
            <span className="conflict-side-dot" style={{ background: sideBColor }} /> {sideBName}
          </div>
          <div className="conflict-battle-popup-row"><span>Commander</span><span>{site.sideBCommander}</span></div>
          <div className="conflict-battle-popup-row"><span>Troops</span><span>{site.sideBTroops}</span></div>
          <div className="conflict-battle-popup-row"><span>Equipment</span><span>{site.sideBEquipment}</span></div>
          <div className="conflict-battle-popup-row"><span>Casualties</span><span>{site.sideBCasualties}</span></div>
        </div>
      </div>

      {site.significance && (
        <div className="conflict-battle-popup-significance">
          <div className="conflict-battle-popup-sig-title">Significance</div>
          <div className="conflict-battle-popup-sig-text">{site.significance}</div>
        </div>
      )}
      {site.note && <div className="conflict-battle-popup-note">{site.note}</div>}
    </div>
  );
}

/* ─── Map Legend (generic) ─── */

export const GenericMapLegend = memo(function GenericMapLegend({ open, onToggle, summary, hasFrontlines, hasBattles, hasInfra, hasTroops, hasForts }) {
  const sideAColor = summary.sideA.color;
  const sideBColor = summary.sideB.color;
  return (
    <div className={`conflict-map-legend ${open ? 'conflict-map-legend--open' : ''}`}>
      <button className="conflict-map-legend-toggle" onClick={onToggle}>
        {open ? '\u2715' : '?'} {!open && <span>Legend</span>}
      </button>
      {open && (
        <div className="conflict-map-legend-body">
          <div className="conflict-map-legend-title">{summary.name} — Map Symbols</div>

          {/* Sides */}
          <div className="conflict-map-legend-section">
            <div className="conflict-map-legend-heading">Belligerents</div>
            <div className="conflict-map-legend-row">
              <span className="conflict-map-legend-dot" style={{ background: sideAColor }} />
              <span>{summary.sideA.name}</span>
            </div>
            <div className="conflict-map-legend-row">
              <span className="conflict-map-legend-dot" style={{ background: sideBColor }} />
              <span>{summary.sideB.name}</span>
            </div>
          </div>

          {/* Frontlines */}
          {hasFrontlines && (
            <div className="conflict-map-legend-section">
              <div className="conflict-map-legend-heading">Frontlines</div>
              <div className="conflict-map-legend-row">
                <span className="conflict-map-legend-line" style={{ background: sideAColor }} />
                <span>{summary.sideA.shortName} side</span>
              </div>
              <div className="conflict-map-legend-row">
                <span className="conflict-map-legend-line" style={{ background: sideBColor }} />
                <span>{summary.sideB.shortName} side</span>
              </div>
              <div className="conflict-map-legend-row">
                <span className="conflict-map-legend-line" style={{ background: 'rgba(255,255,255,0.7)' }} />
                <span>Line of contact</span>
              </div>
            </div>
          )}

          {hasForts && (
            <div className="conflict-map-legend-section">
              <div className="conflict-map-legend-row">
                <span className="conflict-map-legend-line conflict-map-legend-line--dashed" style={{ background: '#ff8c00' }} />
                <span>Fortification line</span>
              </div>
            </div>
          )}

          {/* Cities */}
          <div className="conflict-map-legend-section">
            <div className="conflict-map-legend-heading">Cities & Territory</div>
            <div className="conflict-map-legend-row">
              <svg width="14" height="14" viewBox="0 0 24 24"><polygon points="12,2 15,9 22,9 16.5,14 18.5,21 12,17 5.5,21 7.5,14 2,9 9,9" fill={sideAColor} stroke="#FFD700" strokeWidth="2" /></svg>
              <span>Capital city</span>
            </div>
            <div className="conflict-map-legend-row">
              <span className="conflict-map-legend-dot" style={{ background: sideAColor }} />
              <span>{summary.sideA.shortName}-controlled city</span>
            </div>
            <div className="conflict-map-legend-row">
              <span className="conflict-map-legend-dot" style={{ background: sideBColor }} />
              <span>{summary.sideB.shortName}-controlled city</span>
            </div>
            <div className="conflict-map-legend-row">
              <span className="conflict-map-legend-dot" style={{ background: '#ffa500' }} />
              <span>Contested city</span>
            </div>
          </div>

          {/* Military infrastructure */}
          {hasInfra && (
            <div className="conflict-map-legend-section">
              <div className="conflict-map-legend-heading">Military Infrastructure</div>
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
          )}

          {/* Battle sites */}
          {hasBattles && (
            <div className="conflict-map-legend-section">
              <div className="conflict-map-legend-heading">Combat</div>
              <div className="conflict-map-legend-row">
                <span className="conflict-map-legend-icon"><BattleIcon color="#ffa500" /></span>
                <span>Battle site (click for details)</span>
              </div>
              <div className="conflict-map-legend-row">
                <span className="conflict-map-legend-icon"><BattleIcon color={sideAColor} /></span>
                <span>{summary.sideA.shortName} victory</span>
              </div>
              <div className="conflict-map-legend-row">
                <span className="conflict-map-legend-icon"><BattleIcon color={sideBColor} /></span>
                <span>{summary.sideB.shortName} victory</span>
              </div>
            </div>
          )}

          {/* NATO unit symbols */}
          {hasTroops && (
            <div className="conflict-map-legend-section">
              <div className="conflict-map-legend-heading">NATO Unit Symbols</div>
              <div className="conflict-map-legend-row">
                <span className="conflict-map-legend-nato" style={{ background: sideAColor, borderColor: '#fff' }}>{'\u2573'}</span>
                <span>{summary.sideA.shortName} unit</span>
              </div>
              <div className="conflict-map-legend-row">
                <span className="conflict-map-legend-nato" style={{ background: sideBColor, borderColor: '#fff' }}>{'\u2573'}</span>
                <span>{summary.sideB.shortName} unit</span>
              </div>
              <div className="conflict-map-legend-section" style={{ marginTop: 4 }}>
                <div className="conflict-map-legend-heading">Unit Types</div>
                <div className="conflict-map-legend-row">
                  <span className="conflict-map-legend-nato" style={{ background: '#555', borderColor: '#888' }}>{'\u2573'}</span>
                  <span>Infantry</span>
                </div>
                <div className="conflict-map-legend-row">
                  <span className="conflict-map-legend-nato" style={{ background: '#555', borderColor: '#888' }}>{'\u2299'}</span>
                  <span>Armor / Tanks</span>
                </div>
                <div className="conflict-map-legend-row">
                  <span className="conflict-map-legend-nato" style={{ background: '#555', borderColor: '#888' }}>{'\u25CF'}</span>
                  <span>Artillery</span>
                </div>
                <div className="conflict-map-legend-row">
                  <span className="conflict-map-legend-nato" style={{ background: '#555', borderColor: '#888' }}>{'\u2693'}</span>
                  <span>Marines</span>
                </div>
              </div>
              <div className="conflict-map-legend-section" style={{ marginTop: 4 }}>
                <div className="conflict-map-legend-heading">Unit Sizes (pips above box)</div>
                <div className="conflict-map-legend-row">
                  <span className="conflict-map-legend-pips">II</span>
                  <span>Battalion (~300–1,000)</span>
                </div>
                <div className="conflict-map-legend-row">
                  <span className="conflict-map-legend-pips">III</span>
                  <span>Regiment (~1,000–3,000)</span>
                </div>
                <div className="conflict-map-legend-row">
                  <span className="conflict-map-legend-pips">{'\u2573'}</span>
                  <span>Brigade (~3,000–5,000)</span>
                </div>
                <div className="conflict-map-legend-row">
                  <span className="conflict-map-legend-pips">{'\u2573\u2573'}</span>
                  <span>Division (~10,000–20,000)</span>
                </div>
              </div>
            </div>
          )}

          {/* Status labels */}
          <div className="conflict-map-legend-section">
            <div className="conflict-map-legend-heading">Sector Status</div>
            <div className="conflict-map-legend-row">
              <span className="conflict-map-legend-dot" style={{ background: '#ff4444' }} />
              <span>Active Combat</span>
            </div>
            <div className="conflict-map-legend-row">
              <span className="conflict-map-legend-dot" style={{ background: '#ffa500' }} />
              <span>Contested</span>
            </div>
            <div className="conflict-map-legend-row">
              <span className="conflict-map-legend-dot" style={{ background: '#44bb44' }} />
              <span>Stable / Ceasefire</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

/* ─── Main overlay ─── */

export default function GenericConflictOverlay({ visible, conflictData, showTroops = true, zoom = 2, onTroopClick, isMarkerVisible, showLegend = false, onLegendToggle }) {
  const [selectedBattle, setSelectedBattle] = useState(null);
  const [selectedTroop, setSelectedTroop] = useState(null);

  const showDetail = zoom >= ZOOM_SHOW_DETAIL;
  const showLabels = zoom >= ZOOM_SHOW_LABELS;

  const {
    CONFLICT_SUMMARY: summary,
    FRONTLINE_SEGMENTS: frontlines = [],
    OCCUPIED_TERRITORY: occupied,
    CAPITALS: capitals = [],
    MAJOR_CITIES: cities = [],
    MILITARY_INFRASTRUCTURE: infra = [],
    TROOP_POSITIONS: troops = [],
    BATTLE_SITES: battles = [],
    FORTIFICATION_LINES: fortLines = [],
  } = conflictData;
  const getColor = conflictData.getFrontlineColor || defaultGetColor;

  const sideAColor = summary.sideA.color;
  const sideBColor = summary.sideB.color;
  const conflictId = summary.id;

  const frontlineGeoJSON = useMemo(() => ({
    type: 'FeatureCollection',
    features: frontlines.map((seg) => ({
      type: 'Feature',
      properties: { id: seg.id, label: seg.label, status: seg.status, color: getColor?.(seg.asOf) || '#ff3333' },
      geometry: { type: 'LineString', coordinates: seg.points },
    })),
  }), [frontlines, getColor]);

  const occupiedGeoJSON = useMemo(() => {
    if (!occupied) return null;
    return { type: 'FeatureCollection', features: [occupied] };
  }, [occupied]);

  const fortGeoJSON = useMemo(() => {
    if (!fortLines.length) return null;
    return {
      type: 'FeatureCollection',
      features: fortLines.map((line) => ({
        type: 'Feature',
        properties: { id: line.id, name: line.name, note: line.note },
        geometry: { type: 'LineString', coordinates: line.points },
      })),
    };
  }, [fortLines]);

  const sectorLabels = useMemo(() =>
    frontlines.map((seg) => {
      const mid = seg.points[Math.floor(seg.points.length / 2)];
      return { id: seg.id, label: seg.label, status: seg.status, lon: mid[0], lat: mid[1] };
    }), [frontlines]);

  const visibility = visible ? 'visible' : 'none';
  const mv = (lon, lat) => !isMarkerVisible || isMarkerVisible(lon, lat);

  return (
    <>
      {/* Occupied territory fill */}
      {occupiedGeoJSON && (
        <Source id={`${conflictId}-occupied`} type="geojson" data={occupiedGeoJSON}>
          <Layer
            id={`${conflictId}-occupied-fill`}
            type="fill"
            layout={{ visibility }}
            paint={{
              'fill-color': sideBColor,
              'fill-opacity': 0.08,
            }}
          />
          <Layer
            id={`${conflictId}-occupied-outline`}
            type="line"
            layout={{ visibility, 'line-cap': 'round', 'line-join': 'round' }}
            paint={{
              'line-color': sideBColor,
              'line-width': 1,
              'line-dasharray': [4, 3],
              'line-opacity': 0.3,
            }}
          />
        </Source>
      )}

      {/* Fortification lines */}
      {fortGeoJSON && (
        <Source id={`${conflictId}-forts`} type="geojson" data={fortGeoJSON}>
          <Layer
            id={`${conflictId}-fort-line`}
            type="line"
            layout={{ visibility, 'line-cap': 'round', 'line-join': 'round' }}
            paint={{
              'line-color': '#ff8c00',
              'line-width': 2,
              'line-dasharray': [4, 3],
              'line-opacity': 0.6,
            }}
          />
        </Source>
      )}

      {/* Frontlines */}
      <Source id={`${conflictId}-frontline`} type="geojson" data={frontlineGeoJSON}>
        <Layer id={`${conflictId}-fl-glow`} type="line"
          layout={{ visibility, 'line-cap': 'round', 'line-join': 'round' }}
          paint={{ 'line-color': 'rgba(255,80,60,0.12)', 'line-width': 10, 'line-blur': 6 }} />
        <Layer id={`${conflictId}-fl-a`} type="line"
          layout={{ visibility, 'line-cap': 'round', 'line-join': 'round' }}
          paint={{ 'line-color': sideAColor, 'line-width': 1.5, 'line-offset': -2, 'line-opacity': 0.7 }} />
        <Layer id={`${conflictId}-fl-center`} type="line"
          layout={{ visibility, 'line-cap': 'round', 'line-join': 'round' }}
          paint={{ 'line-color': 'rgba(255,255,255,0.7)', 'line-width': 1 }} />
        <Layer id={`${conflictId}-fl-b`} type="line"
          layout={{ visibility, 'line-cap': 'round', 'line-join': 'round' }}
          paint={{ 'line-color': sideBColor, 'line-width': 1.5, 'line-offset': 2, 'line-opacity': 0.7 }} />
      </Source>

      {/* Sector labels */}
      {visible && showDetail && sectorLabels.filter(s => mv(s.lon, s.lat)).map((s) => (
        <Marker key={`${conflictId}-sec-${s.id}`} longitude={s.lon} latitude={s.lat} anchor="right">
          <div className="conflict-sector-label" style={{ marginRight: 18 }}>
            <span className="conflict-sector-name">{s.label}</span>
            <span className={`conflict-sector-status conflict-sector-status--${s.status}`}>
              {s.status === 'active' ? 'Active Combat' : s.status === 'contested' ? 'Contested' : 'Stable'}
            </span>
          </div>
        </Marker>
      ))}

      {/* Battle sites */}
      {visible && showDetail && battles.filter(s => mv(s.lon, s.lat)).map((site) => (
        <Marker key={site.id} longitude={site.lon} latitude={site.lat} anchor="center">
          <BattleSiteMarker site={site} onClick={setSelectedBattle} sideAName={summary.sideA.shortName} sideBName={summary.sideB.shortName} />
        </Marker>
      ))}

      {/* Battle popup */}
      {visible && selectedBattle && (
        <Marker longitude={selectedBattle.lon} latitude={selectedBattle.lat} anchor="bottom" style={{ zIndex: 1000 }}>
          <BattlePopup
            site={selectedBattle}
            onClose={() => setSelectedBattle(null)}
            sideAColor={sideAColor}
            sideBColor={sideBColor}
            sideAName={summary.sideA.name}
            sideBName={summary.sideB.name}
          />
        </Marker>
      )}

      {/* Capitals */}
      {visible && capitals.filter(c => mv(c.lon, c.lat)).map((c) => (
        <Marker key={c.id} longitude={c.lon} latitude={c.lat} anchor="center">
          <CapitalMarker city={c} color={c.country === 'sideA' ? sideAColor : sideBColor} />
        </Marker>
      ))}

      {/* Major cities */}
      {visible && showDetail && cities.filter(c => mv(c.lon, c.lat)).map((c) => (
        <Marker key={c.id} longitude={c.lon} latitude={c.lat} anchor="left">
          <CityMarker city={c} sideAColor={sideAColor} sideBColor={sideBColor} />
        </Marker>
      ))}

      {/* Military infrastructure */}
      {visible && showDetail && infra.filter(i => mv(i.lon, i.lat)).map((item) => (
        <Marker key={item.id} longitude={item.lon} latitude={item.lat} anchor="center">
          <InfraMarker item={item} sideAColor={sideAColor} sideBColor={sideBColor} showLabel={showLabels} />
        </Marker>
      ))}

      {/* NATO troop symbols */}
      {visible && showDetail && showTroops && troops.filter(u => mv(u.lon, u.lat)).map((unit) => (
        <Marker key={unit.id} longitude={unit.lon} latitude={unit.lat} anchor="center">
          <NatoSymbol unit={unit} sideAColor={sideAColor} sideBColor={sideBColor} onClick={(u) => { setSelectedTroop(u); onTroopClick?.(u); }} />
        </Marker>
      ))}

      {/* Troop popup */}
      {visible && selectedTroop && (
        <Marker longitude={selectedTroop.lon} latitude={selectedTroop.lat} anchor="bottom" style={{ zIndex: 1000 }}>
          <TroopPopup
            unit={selectedTroop}
            onClose={() => setSelectedTroop(null)}
            sideAColor={sideAColor}
            sideBColor={sideBColor}
            sideAName={summary.sideA.name}
            sideBName={summary.sideB.name}
            sideAFlag={summary.sideA.flag}
            sideBFlag={summary.sideB.flag}
          />
        </Marker>
      )}

      {/* Map Legend */}
      {visible && (
        <GenericMapLegend
          open={showLegend}
          onToggle={() => onLegendToggle?.()}
          summary={summary}
          hasFrontlines={frontlines.length > 0}
          hasBattles={battles.length > 0}
          hasInfra={infra.length > 0}
          hasTroops={troops.length > 0}
          hasForts={fortLines.length > 0}
        />
      )}
    </>
  );
}
