/**
 * ConflictPanel — Popup showing war statistics
 * Casualties, equipment losses, production, military command
 */
import { useState } from 'react';
import {
  CASUALTIES,
  EQUIPMENT,
  COMMAND,
  CONFLICT_SUMMARY,
  RECENCY_LEGEND,
  UA_BLUE,
  UA_YELLOW,
  RU_RED,
} from './conflictData';
import './conflicts.css';

function StatBar({ label, ruValue, uaValue, maxValue }) {
  const ruPct = Math.min(100, (ruValue / maxValue) * 100);
  const uaPct = Math.min(100, (uaValue / maxValue) * 100);
  return (
    <div className="conflict-stat-bar">
      <div className="conflict-stat-bar-label">{label}</div>
      <div className="conflict-stat-bar-tracks">
        <div className="conflict-stat-bar-track conflict-stat-bar-track--ru">
          <div className="conflict-stat-bar-fill" style={{ width: `${ruPct}%`, background: RU_RED }} />
          <span className="conflict-stat-bar-val">{typeof ruValue === 'number' ? ruValue.toLocaleString() : ruValue}</span>
        </div>
        <div className="conflict-stat-bar-track conflict-stat-bar-track--ua">
          <div className="conflict-stat-bar-fill" style={{ width: `${uaPct}%`, background: UA_BLUE }} />
          <span className="conflict-stat-bar-val">{typeof uaValue === 'number' ? uaValue.toLocaleString() : uaValue}</span>
        </div>
      </div>
    </div>
  );
}

export default function ConflictPanel({ open, onClose, position, onPositionChange }) {
  const [tab, setTab] = useState('overview');
  const [dragStart, setDragStart] = useState(null);

  if (!open) return null;

  const days = CONFLICT_SUMMARY.daysSince();

  const handleDragStart = (e) => {
    if (e.target.closest('button, a, input, select')) return;
    setDragStart({ x: e.clientX - (position?.x || 0), y: e.clientY - (position?.y || 0) });
  };
  const handleDrag = (e) => {
    if (!dragStart || !e.clientX) return;
    onPositionChange?.({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };
  const handleDragEnd = () => setDragStart(null);

  return (
    <div
      className="conflict-panel"
      style={{ left: position?.x ?? 60, top: position?.y ?? 60 }}
      onMouseMove={handleDrag}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd}
    >
      {/* Header */}
      <div className="conflict-panel-header" onMouseDown={handleDragStart}>
        <div className="conflict-panel-header-left">
          <div className="conflict-panel-flags">
            <span className="conflict-panel-flag" title="Russia">🇷🇺</span>
            <span className="conflict-panel-vs">vs</span>
            <span className="conflict-panel-flag" title="Ukraine">🇺🇦</span>
          </div>
          <div>
            <h3 className="conflict-panel-title">{CONFLICT_SUMMARY.name}</h3>
            <div className="conflict-panel-subtitle">
              Day {days} — Since {CONFLICT_SUMMARY.started}
            </div>
          </div>
        </div>
        <button className="conflict-panel-close" onClick={onClose} aria-label="Close">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Tabs */}
      <div className="conflict-panel-tabs">
        {['overview', 'equipment', 'command'].map((t) => (
          <button
            key={t}
            className={`conflict-panel-tab ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t === 'overview' ? 'Casualties' : t === 'equipment' ? 'Equipment' : 'Command'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="conflict-panel-content">
        {tab === 'overview' && <CasualtiesTab />}
        {tab === 'equipment' && <EquipmentTab />}
        {tab === 'command' && <CommandTab />}
      </div>

      {/* Frontline legend */}
      <div className="conflict-panel-footer">
        <div className="conflict-legend-title">Frontline Recency</div>
        <div className="conflict-legend-items">
          {RECENCY_LEGEND.map((item) => (
            <div key={item.label} className="conflict-legend-item">
              <span className="conflict-legend-swatch" style={{ background: item.color }} />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Casualties Tab ───
function CasualtiesTab() {
  return (
    <div className="conflict-tab-body">
      <div className="conflict-section-note">
        Estimates compiled from multiple OSINT sources. Actual figures may vary significantly.
        Data as of {CASUALTIES.asOf}.
      </div>

      {/* Side-by-side headers */}
      <div className="conflict-sides-header">
        <div className="conflict-side-label conflict-side-label--ru">
          <span className="conflict-side-dot" style={{ background: RU_RED }} />
          Russia
        </div>
        <div className="conflict-side-label conflict-side-label--ua">
          <span className="conflict-side-dot" style={{ background: UA_BLUE }} />
          Ukraine
        </div>
      </div>

      {/* Killed */}
      <div className="conflict-stat-group">
        <div className="conflict-stat-group-title">Killed (Military)</div>
        <div className="conflict-stat-compare">
          <div className="conflict-stat-value conflict-stat-value--ru">{CASUALTIES.russia.killed.label}</div>
          <div className="conflict-stat-value conflict-stat-value--ua">{CASUALTIES.ukraine.killed.label}</div>
        </div>
        <div className="conflict-compare-bar">
          <div className="conflict-compare-bar-ru" style={{ flex: CASUALTIES.russia.killed.high }} />
          <div className="conflict-compare-bar-ua" style={{ flex: CASUALTIES.ukraine.killed.high }} />
        </div>
      </div>

      {/* Wounded */}
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

      {/* POWs */}
      <div className="conflict-stat-group">
        <div className="conflict-stat-group-title">Captured / POW</div>
        <div className="conflict-stat-compare">
          <div className="conflict-stat-value conflict-stat-value--ru">{CASUALTIES.russia.captured.label}</div>
          <div className="conflict-stat-value conflict-stat-value--ua">{CASUALTIES.ukraine.captured.label}</div>
        </div>
      </div>

      {/* Civilian */}
      <div className="conflict-stat-group">
        <div className="conflict-stat-group-title">Ukrainian Civilian Casualties</div>
        <div className="conflict-stat-single">{CASUALTIES.ukraine.civilian.label} killed (UN est.)</div>
      </div>

      <div className="conflict-sources">
        Sources: {CASUALTIES.russia.source}; {CASUALTIES.ukraine.source}
      </div>
    </div>
  );
}

// ─── Equipment Tab ───
function EquipmentTab() {
  return (
    <div className="conflict-tab-body">
      <div className="conflict-section-note">
        Visually confirmed losses + estimates. Data as of {EQUIPMENT.asOf}.
      </div>

      {/* Russian losses */}
      <div className="conflict-equip-section">
        <div className="conflict-equip-header">
          <span className="conflict-side-dot" style={{ background: RU_RED }} />
          Russian Losses
        </div>
        <div className="conflict-equip-grid">
          {EQUIPMENT.russia.lost.map((item) => (
            <div key={item.type} className="conflict-equip-item">
              <span className="conflict-equip-count">{item.count.toLocaleString()}</span>
              <span className="conflict-equip-type">{item.type}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Russian production */}
      <div className="conflict-equip-section">
        <div className="conflict-equip-header">
          <span className="conflict-side-dot" style={{ background: RU_RED }} />
          Russian Production (est.)
        </div>
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

      {/* Ukrainian losses */}
      <div className="conflict-equip-section">
        <div className="conflict-equip-header">
          <span className="conflict-side-dot" style={{ background: UA_BLUE }} />
          Ukrainian Losses
        </div>
        <div className="conflict-equip-grid">
          {EQUIPMENT.ukraine.lost.map((item) => (
            <div key={item.type} className="conflict-equip-item">
              <span className="conflict-equip-count">{item.count.toLocaleString()}</span>
              <span className="conflict-equip-type">{item.type}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Western aid received */}
      <div className="conflict-equip-section">
        <div className="conflict-equip-header">
          <span className="conflict-side-dot" style={{ background: UA_BLUE }} />
          Western Military Aid Received
        </div>
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
        Sources: {EQUIPMENT.russia.source}; {EQUIPMENT.ukraine.source}
      </div>
    </div>
  );
}

// ─── Command Tab ───
function CommandTab() {
  return (
    <div className="conflict-tab-body">
      {/* Russia command */}
      <div className="conflict-cmd-section">
        <div className="conflict-cmd-header">
          <span style={{ marginRight: 6 }}>🇷🇺</span>
          {COMMAND.russia.title}
        </div>
        <div className="conflict-cmd-personnel">
          Personnel in theatre: {COMMAND.russia.totalPersonnel}
        </div>
        <div className="conflict-cmd-list">
          {COMMAND.russia.keyCommanders.map((cmd) => (
            <div key={cmd.name} className="conflict-cmd-item">
              <span className="conflict-cmd-name">{cmd.name}</span>
              <span className="conflict-cmd-role">{cmd.role}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Ukraine command */}
      <div className="conflict-cmd-section">
        <div className="conflict-cmd-header">
          <span style={{ marginRight: 6 }}>🇺🇦</span>
          {COMMAND.ukraine.title}
        </div>
        <div className="conflict-cmd-personnel">
          Total personnel: {COMMAND.ukraine.totalPersonnel}
        </div>
        <div className="conflict-cmd-list">
          {COMMAND.ukraine.keyCommanders.map((cmd) => (
            <div key={cmd.name} className="conflict-cmd-item">
              <span className="conflict-cmd-name">{cmd.name}</span>
              <span className="conflict-cmd-role">{cmd.role}</span>
            </div>
          ))}
        </div>
      </div>

      {/* International support */}
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
    </div>
  );
}
