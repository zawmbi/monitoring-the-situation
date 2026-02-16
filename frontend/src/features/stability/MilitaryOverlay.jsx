/**
 * MilitaryOverlay — NATO APP-6 style map markers for military movement indicators
 * and US military installations (OSINT-derived).
 *
 * Each marker uses a NATO-standard rectangular unit box with:
 *   - Force type symbol inside (infantry ╳, armor ⊙, naval ⚓, air ✈, etc.)
 *   - Country flag next to the symbol
 *   - Severity color coding on the border
 *   - Click popup with full details
 */

import { useState } from 'react';
import { Marker } from '@vis.gl/react-maplibre';
import { SEVERITY_COLORS, SEVERITY_LABELS, US_INSTALLATIONS, US_FLEET_ASSETS } from './stabilityData';

// ── Convert ISO alpha-2 → flag emoji ──
function countryFlag(code) {
  if (!code || code.length !== 2) return '';
  return String.fromCodePoint(
    ...code.toUpperCase().split('').map((c) => 0x1F1E6 + c.charCodeAt(0) - 65)
  );
}

// ── NATO APP-6 force type symbols ──
const NATO_SYMBOLS = {
  navy:        '⚓',
  army:        '╳',
  air:         '✈',
  missile:     '⬆',
  mixed:       '╬',
  militia:     '‡',
  coast_guard: '⚓',
  special:     '↯',
  // US installation types
  air_base:    '✈',
  naval_base:  '⚓',
  army_base:   '╳',
  joint_base:  '╬',
  intel:       '◉',
  logistics:   '▣',
  csl:         '◇',
  // Fleet asset types
  csg:         '⬡',  // Carrier Strike Group
  arg:         '⬢',  // Amphibious Ready Group
  ssgn:        '◈',  // Guided-missile submarine
  btf:         '✦',  // Bomber Task Force
};

// ── Movement type descriptions ──
const MOVEMENT_TYPES = {
  naval_patrol:  'Active Naval Patrol',
  buildup:       'Force Buildup',
  deployment:    'Troop Deployment',
  missile_test:  'Missile Activity',
  proxy:         'Proxy Force Movement',
  exercise:      'Military Exercise',
};

// ── Affiliation colors (which side) ──
const AFFILIATION_COLORS = {
  CN: { bg: '#8B0000', border: '#ff4444' },
  RU: { bg: '#8B0000', border: '#ff6b6b' },
  KP: { bg: '#8B0000', border: '#ff4444' },
  IR: { bg: '#8B0000', border: '#ff6b6b' },
  // NATO / Western
  US: { bg: '#003078', border: '#5baaff' },
  GB: { bg: '#003078', border: '#5baaff' },
  FR: { bg: '#003078', border: '#5baaff' },
  PL: { bg: '#003078', border: '#5baaff' },
  JP: { bg: '#003078', border: '#5baaff' },
  KR: { bg: '#003078', border: '#5baaff' },
  PH: { bg: '#003078', border: '#5baaff' },
  // Neutral / Other
  IN: { bg: '#2a4a2a', border: '#88cc88' },
  ET: { bg: '#2a4a2a', border: '#88cc88' },
  IQ: { bg: '#4a3a2a', border: '#ddaa55' },
  YE: { bg: '#4a3a2a', border: '#ddaa55' },
};
const DEFAULT_AFF = { bg: '#2a2a2a', border: '#999' };

const ZOOM_SHOW = 2;
const ZOOM_LABELS = 3;

// ── Detail Popup ──
function MilPopup({ item, isBase, onClose }) {
  const flag = countryFlag(item.code || item.countryCode);
  const color = SEVERITY_COLORS[item.severity] || '#999';

  return (
    <div className="mil-popup" onClick={(e) => e.stopPropagation()}>
      <div className="mil-popup-header">
        <div className="mil-popup-title-row">
          <span className="mil-popup-flag">{flag}</span>
          <span className="mil-popup-title">{isBase ? item.name : item.country}</span>
        </div>
        <button className="mil-popup-close" onClick={onClose}>✕</button>
      </div>

      {!isBase && item.severity && (
        <span className="mil-popup-severity" style={{ background: color }}>
          {SEVERITY_LABELS[item.severity] || item.severity}
        </span>
      )}

      {isBase && item.type && (
        <span className="mil-popup-base-type">{item.type}</span>
      )}

      <div className="mil-popup-body">
        <div className="mil-popup-row">
          <span className="mil-popup-key">
            {isBase ? 'Installation' : 'Activity'}
          </span>
          <span className="mil-popup-val">{item.label || item.description}</span>
        </div>

        {!isBase && item.force && (
          <div className="mil-popup-row">
            <span className="mil-popup-key">Force Type</span>
            <span className="mil-popup-val" style={{ textTransform: 'capitalize' }}>
              {item.force.replace(/_/g, ' ')}
            </span>
          </div>
        )}

        {!isBase && item.type && (
          <div className="mil-popup-row">
            <span className="mil-popup-key">Movement</span>
            <span className="mil-popup-val">
              {MOVEMENT_TYPES[item.type] || item.type.replace(/_/g, ' ')}
            </span>
          </div>
        )}

        {isBase && item.branch && (
          <div className="mil-popup-row">
            <span className="mil-popup-key">Branch</span>
            <span className="mil-popup-val">{item.branch}</span>
          </div>
        )}

        {isBase && item.hull && (
          <div className="mil-popup-row">
            <span className="mil-popup-key">Hull</span>
            <span className="mil-popup-val">{item.hull}</span>
          </div>
        )}

        {isBase && item.cocom && (
          <div className="mil-popup-row">
            <span className="mil-popup-key">COCOM</span>
            <span className="mil-popup-val">{item.cocom}</span>
          </div>
        )}

        {isBase && item.personnel && (
          <div className="mil-popup-row">
            <span className="mil-popup-key">Personnel</span>
            <span className="mil-popup-val">~{item.personnel.toLocaleString()}</span>
          </div>
        )}

        {isBase && item.fleetAsset && item.positionSource && (
          <div className="mil-popup-row">
            <span className="mil-popup-key">Position</span>
            <span className="mil-popup-val" style={{ color: item.positionSource === 'GDELT' ? '#5baaff' : '#999' }}>
              {item.positionSource === 'GDELT' ? 'Updated from news reports' : 'Baseline estimate'}
            </span>
          </div>
        )}

        <div className="mil-popup-row">
          <span className="mil-popup-key">Coordinates</span>
          <span className="mil-popup-val mil-popup-coords">
            {item.lat?.toFixed(2)}°N, {item.lon?.toFixed(2)}°E
          </span>
        </div>
      </div>

      {/* Articles from GDELT (live data) */}
      {item.articles?.length > 0 && (
        <div className="mil-popup-articles">
          <div className="mil-popup-articles-title">Recent OSINT</div>
          {item.articles.slice(0, 3).map((a, i) => (
            <a key={i} className="mil-popup-article" href={a.url} target="_blank" rel="noopener noreferrer">
              {a.title}
            </a>
          ))}
        </div>
      )}

      <div className="mil-popup-source">
        {isBase
          ? (item.fleetAsset ? 'Source: OSINT / GDELT Fleet Tracking' : 'Source: Public OSINT / DOD')
          : 'Source: GDELT + Baseline OSINT'}
      </div>
    </div>
  );
}

// ── NATO Unit Symbol ──
function NatoMilSymbol({ item, showLabel, onClick, isBase }) {
  const aff = AFFILIATION_COLORS[item.code || item.countryCode] || DEFAULT_AFF;
  const sevColor = isBase ? aff.border : (SEVERITY_COLORS[item.severity] || '#999');
  const symbol = isBase
    ? (NATO_SYMBOLS[item.milType] || '★')
    : (NATO_SYMBOLS[item.force] || '╳');
  const flag = countryFlag(item.code || item.countryCode);
  const isPulsing = !isBase && (item.severity === 'critical' || item.severity === 'high');

  return (
    <div
      className={`mil-nato ${isBase ? 'mil-nato--base' : ''} ${isPulsing ? 'mil-nato--pulse' : ''}`}
      onClick={(e) => { e.stopPropagation(); onClick?.(item); }}
    >
      {/* Severity / type pip above the box */}
      {!isBase && item.severity && (
        <div className="mil-nato-pip" style={{ color: sevColor }}>
          {SEVERITY_LABELS[item.severity]?.[0] || ''}
        </div>
      )}
      {isBase && !item.fleetAsset && (
        <div className="mil-nato-pip mil-nato-pip--base">★</div>
      )}
      {isBase && item.fleetAsset && (
        <div className="mil-nato-pip mil-nato-pip--base" style={{ color: '#5baaff' }}>⬟</div>
      )}

      {/* The NATO rectangle */}
      <div className="mil-nato-row">
        <div
          className="mil-nato-box"
          style={{
            '--nato-bg': aff.bg,
            '--nato-border': isBase ? aff.border : sevColor,
          }}
        >
          {isPulsing && <span className="mil-nato-pulse-ring" style={{ borderColor: sevColor }} />}
          <span className="mil-nato-icon">{symbol}</span>
        </div>
        <span className="mil-nato-flag">{flag}</span>
      </div>

      {/* Label below */}
      {showLabel && (
        <span className="mil-nato-label" style={{ color: isBase ? aff.border : sevColor }}>
          {isBase ? item.name : (item.label?.split(' ').slice(0, 4).join(' ') || item.country)}
        </span>
      )}
    </div>
  );
}

export default function MilitaryOverlay({ visible, indicators = [], zoom = 2, showBases = true, isMarkerVisible, fleetPositions }) {
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedIsBase, setSelectedIsBase] = useState(false);

  if (!visible) return null;
  const showMarkers = zoom >= ZOOM_SHOW;
  const showLabels = zoom >= ZOOM_LABELS;
  if (!showMarkers) return null;

  const handleClick = (item, isBase) => {
    if (selectedItem?.id === item.id) {
      setSelectedItem(null);
    } else {
      setSelectedItem(item);
      setSelectedIsBase(isBase);
    }
  };

  const bases = showBases ? US_INSTALLATIONS : [];

  // Merge baseline fleet assets with live GDELT position overrides
  const fleetMap = fleetPositions || {};
  const fleet = showBases
    ? US_FLEET_ASSETS.map((asset) => {
        const live = fleetMap[asset.id];
        if (!live) return { ...asset, positionSource: 'Baseline' };
        return {
          ...asset,
          lat: live.lat,
          lon: live.lon,
          positionSource: 'GDELT',
          articles: live.articles || asset.articles,
          label: live.region ? `${asset.label} (Reported: ${live.region})` : asset.label,
        };
      })
    : [];

  return (
    <>
      {/* Military movement indicators */}
      {indicators
        .filter((m) => m.lat && m.lon && (!isMarkerVisible || isMarkerVisible(m.lon, m.lat)))
        .map((item) => (
          <Marker key={item.id} longitude={item.lon} latitude={item.lat} anchor="center">
            <NatoMilSymbol
              item={item}
              showLabel={showLabels}
              onClick={(it) => handleClick(it, false)}
            />
            {/* Popup */}
            {selectedItem?.id === item.id && !selectedIsBase && (
              <div className="mil-popup-anchor">
                <MilPopup item={item} isBase={false} onClose={() => setSelectedItem(null)} />
              </div>
            )}
          </Marker>
        ))}

      {/* US military installations */}
      {bases
        .filter((b) => b.lat && b.lon && (!isMarkerVisible || isMarkerVisible(b.lon, b.lat)))
        .map((base) => (
          <Marker key={base.id} longitude={base.lon} latitude={base.lat} anchor="center">
            <NatoMilSymbol
              item={base}
              isBase={true}
              showLabel={showLabels}
              onClick={(it) => handleClick(it, true)}
            />
            {/* Popup */}
            {selectedItem?.id === base.id && selectedIsBase && (
              <div className="mil-popup-anchor">
                <MilPopup item={base} isBase={true} onClose={() => setSelectedItem(null)} />
              </div>
            )}
          </Marker>
        ))}

      {/* US Fleet Assets (CSGs, ARGs, SSGNs, BTFs) */}
      {fleet
        .filter((f) => f.lat && f.lon && (!isMarkerVisible || isMarkerVisible(f.lon, f.lat)))
        .map((asset) => (
          <Marker key={asset.id} longitude={asset.lon} latitude={asset.lat} anchor="center">
            <NatoMilSymbol
              item={asset}
              isBase={true}
              showLabel={showLabels}
              onClick={(it) => handleClick(it, true)}
            />
            {/* Popup */}
            {selectedItem?.id === asset.id && selectedIsBase && (
              <div className="mil-popup-anchor">
                <MilPopup item={asset} isBase={true} onClose={() => setSelectedItem(null)} />
              </div>
            )}
          </Marker>
        ))}
    </>
  );
}
