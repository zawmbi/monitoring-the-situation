/**
 * ConflictPanel — Comprehensive war statistics side panel
 * Casualties, equipment, command, drone/missile warfare,
 * humanitarian, sanctions/economic, territorial control, timeline
 *
 * Integrates live data from russianwarship.rip (daily losses) and
 * Ukrinform / Google News RSS (war news) via useConflictData hook.
 */
import { useState } from 'react';
import useConflictData from '../../hooks/useConflictData';
import {
  CASUALTIES,
  EQUIPMENT,
  COMMAND,
  DECEASED_COMMANDERS,
  CONFLICT_SUMMARY,
  TERRITORIAL_CONTROL,
  DRONE_MISSILE_DATA,
  HUMANITARIAN,
  SANCTIONS_ECONOMIC,
  WAR_TIMELINE,
  UA_BLUE,
  UA_YELLOW,
  RU_RED,
} from './conflictData';
import './conflicts.css';

/* ─── Utility: format relative time ─── */
function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

/* ─── Live data badge ─── */
function LiveBadge({ date, loading }) {
  if (loading) return <span className="conflict-live-badge conflict-live-badge--loading">UPDATING</span>;
  if (!date) return null;
  return (
    <span className="conflict-live-badge" title={`Last updated: ${new Date(date).toLocaleString()}`}>
      LIVE
    </span>
  );
}

/* ─── Daily increase chip ─── */
function DailyIncrease({ value }) {
  if (!value || value === 0) return null;
  return <span className="conflict-daily-increase">+{value.toLocaleString()} today</span>;
}

export default function ConflictPanel({ open, onClose }) {
  const [tab, setTab] = useState('overview');
  const { losses, news, loading, lastUpdated } = useConflictData(open);

  const days = losses?.day || CONFLICT_SUMMARY.daysSince();

  const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'equipment', label: 'Equipment' },
    { id: 'drones', label: 'Drones/Missiles' },
    { id: 'humanitarian', label: 'Humanitarian' },
    { id: 'sanctions', label: 'Sanctions' },
    { id: 'command', label: 'Command' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'news', label: 'Live Feed' },
    { id: 'donate', label: 'Donate' },
  ];

  return (
    <div className={`conflict-panel ${open ? 'conflict-panel--open' : ''}`}>

      <div className="conflict-panel-header">
        <div className="conflict-panel-header-left">
          <div className="conflict-panel-flags">
            <span className="conflict-panel-flag" title="Russia">🇷🇺</span>
            <span className="conflict-panel-vs">vs</span>
            <span className="conflict-panel-flag" title="Ukraine">🇺🇦</span>
          </div>
          <div>
            <h3 className="conflict-panel-title">
              {CONFLICT_SUMMARY.name}
              <LiveBadge date={losses?.fetchedAt || lastUpdated} loading={loading} />
            </h3>
            <div className="conflict-panel-subtitle">
              Day {days} — Since {CONFLICT_SUMMARY.started}
              {losses?.date && <span className="conflict-panel-data-date"> — Data: {losses.date}</span>}
            </div>
          </div>
        </div>
        <button className="conflict-panel-close" onClick={onClose} aria-label="Close">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="conflict-panel-tabs">
        {TABS.map((t) => (
          <button key={t.id} className={`conflict-panel-tab ${tab === t.id ? 'active' : ''} ${t.id === 'news' && news.length > 0 ? 'conflict-panel-tab--live' : ''}`}
            onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>

      <div className="conflict-panel-content">
        {tab === 'overview' && <OverviewTab losses={losses} />}
        {tab === 'equipment' && <EquipmentTab losses={losses} />}
        {tab === 'drones' && <DronesTab />}
        {tab === 'humanitarian' && <HumanitarianTab />}
        {tab === 'sanctions' && <SanctionsTab />}
        {tab === 'command' && <CommandTab />}
        {tab === 'timeline' && <TimelineTab />}
        {tab === 'news' && <LiveFeedTab news={news} loading={loading} lastUpdated={lastUpdated} />}
        {tab === 'donate' && <DonateTab />}
      </div>

      {lastUpdated && (
        <div className="conflict-panel-footer">
          <div className="conflict-footer-updated">
            Live data updated {timeAgo(lastUpdated)}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Map Symbol Legend (inline in panel) ─── */
function MapSymbolLegend() {
  return (
    <div className="conflict-panel-legend">
      <div className="conflict-panel-legend-title">Map Symbols Guide</div>

      <div className="conflict-panel-legend-section">
        <div className="conflict-panel-legend-heading">Frontlines</div>
        <div className="conflict-panel-legend-grid">
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
      </div>

      <div className="conflict-panel-legend-section">
        <div className="conflict-panel-legend-heading">Cities & Territory</div>
        <div className="conflict-panel-legend-grid">
          <div className="conflict-map-legend-row">
            <span className="conflict-map-legend-dot" style={{ background: '#5baaff' }} />
            <span>Ukrainian-controlled city</span>
          </div>
          <div className="conflict-map-legend-row">
            <span className="conflict-map-legend-dot" style={{ background: '#ff6b6b' }} />
            <span>Russian / occupied city</span>
          </div>
          <div className="conflict-map-legend-row">
            <svg width="14" height="14" viewBox="0 0 24 24">
              <polygon points="12,2 15,9 22,9 16.5,14 18.5,21 12,17 5.5,21 7.5,14 2,9 9,9"
                fill={UA_BLUE} stroke={UA_YELLOW} strokeWidth="2" />
            </svg>
            <span>Capital city</span>
          </div>
        </div>
      </div>

      <div className="conflict-panel-legend-section">
        <div className="conflict-panel-legend-heading">Military Infrastructure</div>
        <div className="conflict-panel-legend-grid">
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
      </div>

      <div className="conflict-panel-legend-section">
        <div className="conflict-panel-legend-heading">Combat & Strategic</div>
        <div className="conflict-panel-legend-grid">
          <div className="conflict-map-legend-row">
            <span className="conflict-map-legend-icon" style={{ color: '#ffa500' }}>⚔</span>
            <span>Battle site (click for details)</span>
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
          <div className="conflict-map-legend-row">
            <span className="conflict-map-legend-icon" style={{ color: '#ff6b6b' }}>✕</span>
            <span>Wreck / destroyed vessel</span>
          </div>
        </div>
      </div>

      <div className="conflict-panel-legend-section">
        <div className="conflict-panel-legend-heading">NATO Unit Symbols — Affiliation</div>
        <div className="conflict-panel-legend-grid">
          <div className="conflict-map-legend-row">
            <span className="conflict-map-legend-nato" style={{ background: UA_BLUE, borderColor: UA_YELLOW }}>╳</span>
            <span>Ukrainian unit</span>
          </div>
          <div className="conflict-map-legend-row">
            <span className="conflict-map-legend-nato" style={{ background: RU_RED, borderColor: '#fff' }}>╳</span>
            <span>Russian unit</span>
          </div>
        </div>
      </div>

      <div className="conflict-panel-legend-section">
        <div className="conflict-panel-legend-heading">Unit Type (symbol inside box)</div>
        <div className="conflict-panel-legend-grid">
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
      </div>

      <div className="conflict-panel-legend-section">
        <div className="conflict-panel-legend-heading">Unit Size (pips above box)</div>
        <div className="conflict-panel-legend-grid">
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
      </div>

      <div className="conflict-panel-legend-section">
        <div className="conflict-panel-legend-heading">Coat of Arms</div>
        <div className="conflict-panel-legend-grid">
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
    </div>
  );
}

/* ─── Overview / Casualties + Territorial ─── */
function OverviewTab({ losses }) {
  const tc = TERRITORIAL_CONTROL;
  const occupiedPct = ((tc.currentOccupied / tc.ukraineTotalArea) * 100).toFixed(1);
  const hasLive = !!losses?.stats;

  return (
    <div className="conflict-tab-body">
      {hasLive ? (
        <div className="conflict-section-note conflict-section-note--live">
          <span className="conflict-live-dot" /> Live data from Ukrainian Armed Forces daily report ({losses.date}).
          Updates daily. See Equipment tab for full Russian losses breakdown.
        </div>
      ) : (
        <div className="conflict-section-note">
          Estimates compiled from multiple OSINT sources. Data as of {CASUALTIES.asOf}.
        </div>
      )}

      {/* ── Map Symbol Legend ── */}
      <MapSymbolLegend />

      <div className="conflict-stat-group">
        <div className="conflict-stat-group-title">Territorial Control</div>
        <div className="conflict-territory-bar">
          <div className="conflict-territory-ua" style={{ flex: tc.ukraineTotalArea - tc.currentOccupied }}>
            <span>UA: {(100 - Number(occupiedPct)).toFixed(1)}%</span>
          </div>
          <div className="conflict-territory-ru" style={{ flex: tc.currentOccupied }}>
            <span>RU: {occupiedPct}%</span>
          </div>
        </div>
        <div className="conflict-territory-details">
          <span>Occupied: ~{(tc.currentOccupied / 1000).toFixed(0)}K km² of {(tc.ukraineTotalArea / 1000).toFixed(0)}K km²</span>
          <span>Incl. Crimea ({(tc.crimea / 1000).toFixed(0)}K km², 2014)</span>
        </div>
      </div>

      <div className="conflict-sides-header">
        <div className="conflict-side-label conflict-side-label--ru">
          <span className="conflict-side-dot" style={{ background: RU_RED }} /> Russia
        </div>
        <div className="conflict-side-label conflict-side-label--ua">
          <span className="conflict-side-dot" style={{ background: UA_BLUE }} /> Ukraine
        </div>
      </div>

      <div className="conflict-stat-group">
        <div className="conflict-stat-group-title">Killed (Military — OSINT est.)</div>
        <div className="conflict-stat-compare">
          <div className="conflict-stat-value conflict-stat-value--ru">{CASUALTIES.russia.killed.label}</div>
          <div className="conflict-stat-value conflict-stat-value--ua">{CASUALTIES.ukraine.killed.label}</div>
        </div>
        <div className="conflict-compare-bar">
          <div className="conflict-compare-bar-ru" style={{ flex: CASUALTIES.russia.killed.high }} />
          <div className="conflict-compare-bar-ua" style={{ flex: CASUALTIES.ukraine.killed.high }} />
        </div>
      </div>

      <div className="conflict-stat-group">
        <div className="conflict-stat-group-title">Wounded (Military)</div>
        <div className="conflict-stat-compare">
          <div className="conflict-stat-value conflict-stat-value--ru">{CASUALTIES.russia.wounded.label}</div>
          <div className="conflict-stat-value conflict-stat-value--ua">{CASUALTIES.ukraine.wounded.label}</div>
        </div>
        <div className="conflict-compare-bar">
          <div className="conflict-compare-bar-ru" style={{ flex: CASUALTIES.russia.wounded.high }} />
          <div className="conflict-compare-bar-ua" style={{ flex: CASUALTIES.ukraine.wounded.high }} />
        </div>
      </div>

      <div className="conflict-stat-group">
        <div className="conflict-stat-group-title">Captured / POW</div>
        <div className="conflict-stat-compare">
          <div className="conflict-stat-value conflict-stat-value--ru">{CASUALTIES.russia.captured.label}</div>
          <div className="conflict-stat-value conflict-stat-value--ua">{CASUALTIES.ukraine.captured.label}</div>
        </div>
      </div>

      <div className="conflict-stat-group">
        <div className="conflict-stat-group-title">Ukrainian Civilian Casualties</div>
        <div className="conflict-stat-single">{CASUALTIES.ukraine.civilian.label} killed (UN est.)</div>
      </div>

      <div className="conflict-sources">Sources: {CASUALTIES.russia.source}; {CASUALTIES.ukraine.source}; {tc.source}</div>
    </div>
  );
}

/* ─── Equipment Tab ─── */
function EquipmentTab({ losses }) {
  const hasLive = !!losses?.stats;

  // Map live stats to equipment categories for Russian losses
  const liveRuLosses = hasLive ? [
    { type: 'Tanks', count: losses.stats.tanks, inc: losses.increase.tanks },
    { type: 'AFVs', count: losses.stats.afv, inc: losses.increase.afv },
    { type: 'Artillery', count: losses.stats.artillery, inc: losses.increase.artillery },
    { type: 'MLRS', count: losses.stats.mlrs, inc: losses.increase.mlrs },
    { type: 'Aircraft', count: losses.stats.aircraft, inc: losses.increase.aircraft },
    { type: 'Helicopters', count: losses.stats.helicopters, inc: losses.increase.helicopters },
    { type: 'UAVs', count: losses.stats.uav, inc: losses.increase.uav },
    { type: 'Naval Ships', count: losses.stats.ships, inc: losses.increase.ships },
    { type: 'Cruise Missiles', count: losses.stats.cruiseMissiles, inc: losses.increase.cruiseMissiles },
    { type: 'Anti-Air Systems', count: losses.stats.antiAir, inc: losses.increase.antiAir },
    { type: 'Vehicles', count: losses.stats.vehicles, inc: losses.increase.vehicles },
    { type: 'Special Equip.', count: losses.stats.specialEquip, inc: losses.increase.specialEquip },
  ] : null;

  return (
    <div className="conflict-tab-body">
      {hasLive ? (
        <div className="conflict-section-note conflict-section-note--live">
          <span className="conflict-live-dot" /> Live equipment losses from UA MOD ({losses.date}). Updated daily.
        </div>
      ) : (
        <div className="conflict-section-note">Visually confirmed losses + estimates. Data as of {EQUIPMENT.asOf}.</div>
      )}

      <div className="conflict-equip-section">
        <div className="conflict-equip-header">
          <span className="conflict-side-dot" style={{ background: RU_RED }} /> Russian Losses
          {hasLive && <span className="conflict-live-badge" style={{ marginLeft: 8 }}>LIVE</span>}
        </div>
        <div className="conflict-equip-grid">
          {(liveRuLosses || EQUIPMENT.russia.lost).map((item) => (
            <div key={item.type} className="conflict-equip-item">
              <span className="conflict-equip-count">{item.count.toLocaleString()}</span>
              {item.inc > 0 && <DailyIncrease value={item.inc} />}
              <span className="conflict-equip-type">{item.type}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="conflict-equip-section">
        <div className="conflict-equip-header"><span className="conflict-side-dot" style={{ background: RU_RED }} /> Russian Production (est.)</div>
        <div className="conflict-prod-list">
          {EQUIPMENT.russia.production.map((item) => (
            <div key={item.type} className="conflict-prod-item">
              <span className="conflict-prod-type">{item.type}</span>
              <span className="conflict-prod-count">{item.count}</span>
              <span className="conflict-prod-note">{item.note}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="conflict-equip-section">
        <div className="conflict-equip-header"><span className="conflict-side-dot" style={{ background: UA_BLUE }} /> Ukrainian Losses</div>
        <div className="conflict-equip-grid">
          {EQUIPMENT.ukraine.lost.map((item) => (
            <div key={item.type} className="conflict-equip-item">
              <span className="conflict-equip-count">{item.count.toLocaleString()}</span>
              <span className="conflict-equip-type">{item.type}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="conflict-equip-section">
        <div className="conflict-equip-header"><span className="conflict-side-dot" style={{ background: UA_BLUE }} /> Western Military Aid Received</div>
        <div className="conflict-prod-list">
          {EQUIPMENT.ukraine.aidReceived.map((item) => (
            <div key={item.type} className="conflict-prod-item">
              <span className="conflict-prod-type">{item.type}</span>
              <span className="conflict-prod-count">{item.count}</span>
              <span className="conflict-prod-note">{item.note}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="conflict-sources">
        Sources: {hasLive ? losses.source : EQUIPMENT.russia.source}; {EQUIPMENT.ukraine.source}
      </div>
    </div>
  );
}

/* ─── Drones & Missiles Tab ─── */
function DronesTab() {
  const ru = DRONE_MISSILE_DATA.russianStrikes;
  const ua = DRONE_MISSILE_DATA.ukrainianStrikes;

  return (
    <div className="conflict-tab-body">
      <div className="conflict-section-note">Drone and missile warfare data. As of {DRONE_MISSILE_DATA.asOf}.</div>

      <div className="conflict-equip-section">
        <div className="conflict-equip-header"><span className="conflict-side-dot" style={{ background: RU_RED }} /> Russian Strikes Against Ukraine</div>
        <div className="conflict-drone-summary">
          <div className="conflict-drone-big">{ru.totalMissiles.toLocaleString()}<span>Missiles launched</span></div>
          <div className="conflict-drone-big">{ru.totalDrones.toLocaleString()}<span>Drones launched</span></div>
          <div className="conflict-drone-big">{ru.interceptRate}<span>Intercept rate</span></div>
        </div>
        <div className="conflict-prod-list">
          {[ru.cruiseMissiles, ru.ballisticMissiles, ru.sGlide, ru.shahed, ru.otherDrones].map((item) => (
            <div key={item.type} className="conflict-prod-item">
              <span className="conflict-prod-type">{item.type}</span>
              <span className="conflict-prod-count">{item.count.toLocaleString()}</span>
              <span className="conflict-prod-note">{item.variants || item.note || ''}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="conflict-equip-section">
        <div className="conflict-equip-header"><span className="conflict-side-dot" style={{ background: UA_BLUE }} /> Ukrainian Deep Strikes</div>
        <div className="conflict-drone-summary">
          <div className="conflict-drone-big">{ua.totalDrones.toLocaleString()}<span>Strike drones used</span></div>
        </div>
        <div className="conflict-prod-list">
          {[ua.longRange, ua.navalUSV, ua.atacms, ua.stormShadow, ua.neptune].map((item) => (
            <div key={item.type} className="conflict-prod-item">
              <span className="conflict-prod-type">{item.type}</span>
              <span className="conflict-prod-count">{typeof item.count === 'number' ? item.count.toLocaleString() : item.count}</span>
              <span className="conflict-prod-note">{item.note}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="conflict-sources">Sources: {ru.source}; {ua.source}</div>
    </div>
  );
}

/* ─── Humanitarian Tab ─── */
function HumanitarianTab() {
  const h = HUMANITARIAN;
  return (
    <div className="conflict-tab-body">
      <div className="conflict-section-note">Humanitarian impact data. As of {h.asOf}.</div>

      <div className="conflict-stat-group">
        <div className="conflict-stat-group-title">Refugees Abroad</div>
        <div className="conflict-humanitarian-big">{h.refugees.label}</div>
        <div className="conflict-refugee-list">
          {h.refugees.topCountries.map((c) => (
            <div key={c.country} className="conflict-refugee-item">
              <span className="conflict-refugee-country">{c.country}</span>
              <div className="conflict-refugee-bar-track">
                <div className="conflict-refugee-bar-fill" style={{ width: `${(c.count / h.refugees.topCountries[0].count) * 100}%` }} />
              </div>
              <span className="conflict-refugee-count">{(c.count / 1000).toFixed(0)}K</span>
            </div>
          ))}
        </div>
        <div className="conflict-sources" style={{ marginTop: 4 }}>{h.refugees.source}</div>
      </div>

      <div className="conflict-stat-group">
        <div className="conflict-stat-group-title">Internally Displaced</div>
        <div className="conflict-humanitarian-big">{h.internallyDisplaced.label}</div>
        <div className="conflict-sources" style={{ marginTop: 4 }}>{h.internallyDisplaced.source}</div>
      </div>

      <div className="conflict-stat-group">
        <div className="conflict-stat-group-title">Infrastructure Damage</div>
        <div className="conflict-prod-list">
          {[
            { t: 'Housing', v: h.infrastructureDamage.housingUnits.toLocaleString(), n: 'units damaged/destroyed' },
            { t: 'Schools', v: h.infrastructureDamage.schools.toLocaleString(), n: 'damaged/destroyed' },
            { t: 'Hospitals', v: h.infrastructureDamage.hospitals.toLocaleString(), n: 'damaged/destroyed' },
            { t: 'Power Grid', v: h.infrastructureDamage.powerGrid, n: '' },
            { t: 'Economic Damage', v: h.infrastructureDamage.economicDamage, n: '' },
            { t: 'Reconstruction', v: h.infrastructureDamage.reconstructionCost, n: 'estimated total' },
          ].map((r) => (
            <div key={r.t} className="conflict-prod-item">
              <span className="conflict-prod-type">{r.t}</span>
              <span className="conflict-prod-count">{r.v}</span>
              <span className="conflict-prod-note">{r.n}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="conflict-stat-group">
        <div className="conflict-stat-group-title">Black Sea Grain Corridor</div>
        <div className="conflict-stat-single">{h.grainCorridor.status}</div>
        <div className="conflict-stat-single">{h.grainCorridor.totalExported} exported</div>
      </div>

      <div className="conflict-sources">Sources: {h.infrastructureDamage.source}; {h.grainCorridor.source}</div>
    </div>
  );
}

/* ─── Sanctions & Economic Tab ─── */
function SanctionsTab() {
  const s = SANCTIONS_ECONOMIC;
  return (
    <div className="conflict-tab-body">
      <div className="conflict-section-note">Sanctions, economic impact, and aid. As of {s.asOf}.</div>

      <div className="conflict-equip-section">
        <div className="conflict-equip-header">Sanctions ({s.sanctions.packages})</div>
        <div className="conflict-prod-list">
          {s.sanctions.keyMeasures.map((m) => (
            <div key={m.measure} className="conflict-prod-item">
              <span className="conflict-prod-type">{m.measure}</span>
              <span className="conflict-prod-count" style={{ gridColumn: 'span 2' }}>{m.detail}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="conflict-equip-section">
        <div className="conflict-equip-header"><span className="conflict-side-dot" style={{ background: RU_RED }} /> Russian Economy</div>
        <div className="conflict-prod-list">
          {[
            { t: 'GDP Growth 2024', v: s.russianEconomy.gdpGrowth2024, n: 'war economy boost' },
            { t: 'Inflation', v: s.russianEconomy.inflation2024, n: '' },
            { t: 'Key Rate', v: s.russianEconomy.keyRate, n: 'CBR record high' },
            { t: 'Military Budget 2025', v: s.russianEconomy.militarySpending, n: '' },
          ].map((r) => (
            <div key={r.t} className="conflict-prod-item">
              <span className="conflict-prod-type">{r.t}</span>
              <span className="conflict-prod-count">{r.v}</span>
              <span className="conflict-prod-note">{r.n}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="conflict-equip-section">
        <div className="conflict-equip-header"><span className="conflict-side-dot" style={{ background: UA_BLUE }} /> Western Aid — {s.westernAid.totalPledged} pledged</div>
        <div className="conflict-prod-list">
          {s.westernAid.topDonors.map((d) => (
            <div key={d.donor} className="conflict-prod-item">
              <span className="conflict-prod-type">{d.donor}</span>
              <span className="conflict-prod-count" style={{ gridColumn: 'span 2' }}>{d.amount}</span>
            </div>
          ))}
          <div className="conflict-prod-item">
            <span className="conflict-prod-type">Frozen Assets Loan</span>
            <span className="conflict-prod-count" style={{ gridColumn: 'span 2' }}>{s.westernAid.frozenAssetsLoan}</span>
          </div>
        </div>
      </div>

      <div className="conflict-sources">Sources: {s.sanctions.source}; {s.westernAid.source}</div>
    </div>
  );
}

/* ─── Command Tab ─── */
function CommandTab() {
  const [showDeceased, setShowDeceased] = useState(false);
  return (
    <div className="conflict-tab-body">
      <div className="conflict-cmd-section">
        <div className="conflict-cmd-header"><span style={{ marginRight: 6 }}>🇷🇺</span>{COMMAND.russia.title}</div>
        <div className="conflict-cmd-personnel">Personnel in theatre: {COMMAND.russia.totalPersonnel}</div>
        <div className="conflict-cmd-list">
          {COMMAND.russia.keyCommanders.map((cmd) => (
            <div key={cmd.name} className="conflict-cmd-item">
              <span className="conflict-cmd-name">{cmd.name}</span><span className="conflict-cmd-role">{cmd.role}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="conflict-cmd-section">
        <div className="conflict-cmd-header"><span style={{ marginRight: 6 }}>🇺🇦</span>{COMMAND.ukraine.title}</div>
        <div className="conflict-cmd-personnel">Total personnel: {COMMAND.ukraine.totalPersonnel}</div>
        <div className="conflict-cmd-list">
          {COMMAND.ukraine.keyCommanders.map((cmd) => (
            <div key={cmd.name} className="conflict-cmd-item">
              <span className="conflict-cmd-name">{cmd.name}</span><span className="conflict-cmd-role">{cmd.role}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="conflict-cmd-section">
        <div className="conflict-cmd-header">International Support</div>
        <div className="conflict-cmd-item">
          <span className="conflict-cmd-name">Ukraine</span>
          <span className="conflict-cmd-role">{CONFLICT_SUMMARY.internationalSupport.ukraine}</span>
        </div>
        <div className="conflict-cmd-item">
          <span className="conflict-cmd-name">Russia</span>
          <span className="conflict-cmd-role">{CONFLICT_SUMMARY.internationalSupport.russia}</span>
        </div>
      </div>

      <div className="conflict-cmd-section">
        <button className="conflict-deceased-toggle" onClick={() => setShowDeceased(!showDeceased)}>
          {showDeceased ? 'Hide' : 'Show'} Fallen Commanders
        </button>

        {showDeceased && (
          <div className="conflict-deceased-section">
            <div className="conflict-deceased-header">
              <span className="conflict-side-dot" style={{ background: RU_RED }} /> Russian Fallen Officers
            </div>
            <div className="conflict-cmd-list">
              {DECEASED_COMMANDERS.russia.map((cmd) => (
                <div key={cmd.name} className="conflict-cmd-item conflict-deceased-item">
                  <div className="conflict-deceased-name-row">
                    <span className="conflict-deceased-cross">☦</span>
                    <span className="conflict-cmd-name">{cmd.rank} {cmd.name}</span>
                  </div>
                  <div className="conflict-deceased-details">
                    <span className="conflict-cmd-role">{cmd.role}</span>
                    <span className="conflict-deceased-date">{cmd.date}</span>
                  </div>
                  <div className="conflict-deceased-cause">{cmd.cause}</div>
                </div>
              ))}
            </div>

            <div className="conflict-deceased-header" style={{ marginTop: 14 }}>
              <span className="conflict-side-dot" style={{ background: UA_BLUE }} /> Ukrainian Fallen Officers
            </div>
            <div className="conflict-cmd-list">
              {DECEASED_COMMANDERS.ukraine.map((cmd) => (
                <div key={cmd.name} className="conflict-cmd-item conflict-deceased-item">
                  <div className="conflict-deceased-name-row">
                    <span className="conflict-deceased-cross">☦</span>
                    <span className="conflict-cmd-name">{cmd.rank} {cmd.name}</span>
                  </div>
                  <div className="conflict-deceased-details">
                    <span className="conflict-cmd-role">{cmd.role}</span>
                    <span className="conflict-deceased-date">{cmd.date}</span>
                  </div>
                  <div className="conflict-deceased-cause">{cmd.cause}</div>
                </div>
              ))}
            </div>

            <div className="conflict-sources">{DECEASED_COMMANDERS.source}</div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Timeline Tab ─── */
function TimelineTab() {
  const phaseColors = {
    invasion: '#ff4444', turning: '#ff8800', counteroffensive: '#44bb44',
    attrition: '#888888', kursk: '#5baaff',
  };
  return (
    <div className="conflict-tab-body">
      <div className="conflict-section-note">Key events since 24 February 2022.</div>
      <div className="conflict-timeline">
        {WAR_TIMELINE.map((evt, i) => (
          <div key={i} className="conflict-timeline-item">
            <div className="conflict-timeline-dot" style={{ background: phaseColors[evt.phase] || '#888' }} />
            <div className="conflict-timeline-date">{evt.date}</div>
            <div className="conflict-timeline-event">{evt.event}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Live Feed Tab ─── */
function LiveFeedTab({ news, loading, lastUpdated }) {
  return (
    <div className="conflict-tab-body">
      <div className="conflict-section-note conflict-section-note--live">
        <span className="conflict-live-dot" /> Live war news from Ukrinform and international sources.
        {lastUpdated && <span> Updated {timeAgo(lastUpdated)}.</span>}
      </div>

      {loading && news.length === 0 && (
        <div className="conflict-news-loading">Loading latest news...</div>
      )}

      {news.length === 0 && !loading && (
        <div className="conflict-news-empty">
          No news available. The backend may be offline or the feeds are temporarily unavailable.
        </div>
      )}

      <div className="conflict-news-list">
        {news.map((item) => (
          <a
            key={item.id}
            className="conflict-news-item"
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="conflict-news-item-source">{item.source}</div>
            <div className="conflict-news-item-title">{item.title}</div>
            {item.summary && (
              <div className="conflict-news-item-summary">{item.summary}</div>
            )}
            <div className="conflict-news-item-time">{timeAgo(item.publishedAt)}</div>
          </a>
        ))}
      </div>

      <div className="conflict-sources" style={{ marginTop: 12 }}>
        Sources: Ukrinform; Google News. Articles link to original publishers.
      </div>
    </div>
  );
}

/* ─── Donate Tab ─── */
const CHARITIES = [
  {
    name: 'United24',
    icon: '🇺🇦',
    url: 'https://u24.gov.ua',
    desc: 'Official fundraising platform of Ukraine — defense, medical, reconstruction',
  },
  {
    name: 'Come Back Alive',
    icon: '🛡',
    url: 'https://savelife.in.ua/en/donate-en/',
    desc: 'Largest UA volunteer org — equipment, training, tech for military',
  },
  {
    name: 'Razom for Ukraine',
    icon: '💙',
    url: 'https://www.razomforukraine.org',
    desc: 'US-based 501(c)(3) — medical supplies, tech, humanitarian aid',
  },
  {
    name: 'UNHCR Ukraine',
    icon: '🏠',
    url: 'https://www.unhcr.org/countries/ukraine',
    desc: 'UN Refugee Agency — shelter, cash assistance, protection for displaced',
  },
  {
    name: 'UNICEF Ukraine',
    icon: '👶',
    url: 'https://www.unicef.org/ukraine/',
    desc: 'Children & families — healthcare, education, clean water, psychosocial support',
  },
  {
    name: 'Hospitallers Medical Battalion',
    icon: '🏥',
    url: 'https://www.hospitallers.life/needs-of-hospitallers',
    desc: 'Volunteer paramedic unit — frontline medical evacuation & trauma care',
  },
  {
    name: 'World Central Kitchen',
    icon: '🍲',
    url: 'https://wck.org',
    desc: 'Hot meals for communities near the frontline and displaced families',
  },
  {
    name: 'Serhiy Prytula Foundation',
    icon: '🎯',
    url: 'https://prytulafoundation.org/en',
    desc: 'Drones, vehicles, equipment for UA military; humanitarian programs',
  },
  {
    name: 'Nova Ukraine',
    icon: '💛',
    url: 'https://novaukraine.org',
    desc: 'US-based nonprofit — humanitarian aid, refugee assistance, education',
  },
  {
    name: 'International Committee of the Red Cross',
    icon: '🔴',
    url: 'https://www.icrc.org/en/where-we-work/europe-central-asia/ukraine',
    desc: 'POW visits, family reunification, medical care, mine clearance',
  },
];

function DonateTab() {
  return (
    <div className="conflict-tab-body">
      <div className="conflict-donate-section" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
        <div className="conflict-donate-title">
          Support Ukraine
        </div>
        <div className="conflict-donate-subtitle">
          Verified organizations providing humanitarian, medical, and defense support to Ukraine and its people.
        </div>
        <div className="conflict-donate-list">
          {CHARITIES.map((c) => (
            <a key={c.name} className="conflict-donate-item"
              href={c.url} target="_blank" rel="noopener noreferrer">
              <span className="conflict-donate-item-icon">{c.icon}</span>
              <div className="conflict-donate-item-info">
                <div className="conflict-donate-item-name">{c.name}</div>
                <div className="conflict-donate-item-desc">{c.desc}</div>
              </div>
              <span className="conflict-donate-item-arrow">&rsaquo;</span>
            </a>
          ))}
        </div>
        <div className="conflict-donate-disclaimer">
          Links go directly to official charity websites. We are not affiliated with and do not receive funds from any of these organizations.
        </div>
      </div>
    </div>
  );
}
