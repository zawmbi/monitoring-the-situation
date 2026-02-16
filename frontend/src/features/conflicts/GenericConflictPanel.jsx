/**
 * GenericConflictPanel — Reusable conflict statistics side panel
 * Renders overview, casualties, equipment, command, timeline, humanitarian data
 * for any conflict using a standardized data shape.
 */
import { useState } from 'react';
import InlineMarkets from '../../components/InlineMarkets';
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

export default function GenericConflictPanel({ open, onClose, conflictData }) {
  const [tab, setTab] = useState('overview');

  const {
    CONFLICT_SUMMARY: summary,
    CASUALTIES: casualties,
    EQUIPMENT: equipment,
    COMMAND: command,
    WAR_TIMELINE: timeline = [],
    HUMANITARIAN: humanitarian,
    TERRITORIAL_CONTROL: territorial,
    BATTLE_SITES: battles = [],
  } = conflictData;

  const days = summary.daysSince();
  const sideAColor = summary.sideA.color;
  const sideBColor = summary.sideB.color;

  const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'equipment', label: 'Equipment' },
    { id: 'command', label: 'Command' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'humanitarian', label: 'Humanitarian' },
    { id: 'battles', label: 'Battles' },
    { id: 'markets', label: 'Markets' },
  ];

  // Build market keywords from conflict data
  const marketKeywords = summary.id === 'israel-gaza'
    ? { require: ['israel', 'gaza', 'hamas', 'palestinian'], boost: ['ceasefire', 'hostage', 'netanyahu'] }
    : summary.id === 'sudan'
    ? { require: ['sudan'], boost: ['darfur', 'khartoum', 'ceasefire'] }
    : summary.id === 'myanmar'
    ? { require: ['myanmar', 'burma'], boost: ['junta', 'resistance', 'coup'] }
    : summary.id === 'yemen'
    ? { require: ['yemen', 'houthi'], boost: ['red sea', 'shipping', 'ceasefire'] }
    : summary.id === 'ethiopia'
    ? { require: ['ethiopia'], boost: ['tigray', 'amhara', 'abiy'] }
    : summary.id === 'drc'
    ? { require: ['congo', 'drc'], boost: ['m23', 'rwanda', 'goma'] }
    : { require: [summary.name.toLowerCase()], boost: ['conflict', 'war'] };

  return (
    <div className={`conflict-panel ${open ? 'conflict-panel--open' : ''}`}>
      <div className="conflict-panel-header">
        <div className="conflict-panel-header-left">
          <div className="conflict-panel-flags">
            <span className="conflict-panel-flag" title={summary.sideA.name}>{summary.sideA.flag}</span>
            <span className="conflict-panel-vs">vs</span>
            <span className="conflict-panel-flag" title={summary.sideB.name}>{summary.sideB.flag}</span>
          </div>
          <div>
            <h3 className="conflict-panel-title">{summary.name}</h3>
            <div className="conflict-panel-subtitle">
              Day {days} — Since {summary.started}
            </div>
          </div>
        </div>
      </div>

      <div className="conflict-panel-tabs">
        {TABS.map((t) => (
          <button key={t.id} className={`conflict-panel-tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>

      <div className="conflict-panel-content">
        {tab === 'overview' && (
          <OverviewTab
            summary={summary}
            casualties={casualties}
            territorial={territorial}
            sideAColor={sideAColor}
            sideBColor={sideBColor}
            marketKeywords={marketKeywords}
          />
        )}
        {tab === 'equipment' && (
          <EquipmentTab equipment={equipment} summary={summary} sideAColor={sideAColor} sideBColor={sideBColor} />
        )}
        {tab === 'command' && (
          <CommandTab command={command} summary={summary} />
        )}
        {tab === 'timeline' && (
          <TimelineTab timeline={timeline} />
        )}
        {tab === 'humanitarian' && (
          <HumanitarianTab humanitarian={humanitarian} />
        )}
        {tab === 'battles' && (
          <BattlesTab battles={battles} summary={summary} sideAColor={sideAColor} sideBColor={sideBColor} />
        )}
        {tab === 'markets' && (
          <div className="conflict-panel-markets-tab">
            <InlineMarkets
              require={marketKeywords.require}
              boost={marketKeywords.boost}
              title={`${summary.name} Markets`}
              enabled={open}
              maxItems={12}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Overview Tab ─── */
function OverviewTab({ summary, casualties, territorial, sideAColor, sideBColor, marketKeywords }) {
  return (
    <div className="conflict-tab-body">
      <div className="conflict-section-note">
        {summary.phase}. Data as of {casualties?.asOf || 'recent estimates'}.
      </div>

      {/* Territorial control */}
      {territorial && (
        <div className="conflict-stat-group">
          <div className="conflict-stat-group-title">Territorial Control</div>
          {Object.entries(territorial).filter(([k]) => !['totalArea', 'asOf', 'source'].includes(k)).map(([key, val]) => (
            typeof val === 'string' && (
              <div key={key} className="conflict-territory-details">
                <span>{key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}: {val}</span>
              </div>
            )
          ))}
          {territorial.source && <div className="conflict-sources">Source: {territorial.source}</div>}
        </div>
      )}

      <div className="conflict-sides-header">
        <div className="conflict-side-label">
          <span className="conflict-side-dot" style={{ background: sideAColor }} /> {summary.sideA.name}
        </div>
        <div className="conflict-side-label">
          <span className="conflict-side-dot" style={{ background: sideBColor }} /> {summary.sideB.name}
        </div>
      </div>

      {/* Casualties */}
      {casualties && (
        <>
          {casualties.sideA?.killed && casualties.sideB?.killed && (
            <div className="conflict-stat-group">
              <div className="conflict-stat-group-title">Military Killed (est.)</div>
              <div className="conflict-stat-compare">
                <div className="conflict-stat-value" style={{ color: sideAColor }}>{casualties.sideA.killed.label}</div>
                <div className="conflict-stat-value" style={{ color: sideBColor }}>{casualties.sideB.killed.label}</div>
              </div>
              <div className="conflict-compare-bar">
                <div className="conflict-compare-bar-ru" style={{ flex: casualties.sideA.killed.high, background: sideAColor }} />
                <div className="conflict-compare-bar-ua" style={{ flex: casualties.sideB.killed.high, background: sideBColor }} />
              </div>
            </div>
          )}

          {/* Overall/Tigray specific casualties */}
          {casualties.overall && (
            <div className="conflict-stat-group">
              <div className="conflict-stat-group-title">Total Conflict Deaths</div>
              <div className="conflict-stat-single">{casualties.overall.killed.label}</div>
              {casualties.overall.note && <div className="conflict-section-note">{casualties.overall.note}</div>}
            </div>
          )}
          {casualties.tigrayWar && (
            <div className="conflict-stat-group">
              <div className="conflict-stat-group-title">Tigray War Total Deaths</div>
              <div className="conflict-stat-single">{casualties.tigrayWar.totalDeaths.label}</div>
              {casualties.tigrayWar.note && <div className="conflict-section-note">{casualties.tigrayWar.note}</div>}
            </div>
          )}
          {casualties.current && (
            <div className="conflict-stat-group">
              <div className="conflict-stat-group-title">Current Phase Casualties</div>
              {casualties.current.m23Conflict && <div className="conflict-stat-single">M23 conflict: {casualties.current.m23Conflict.label}</div>}
              {casualties.current.adfConflict && <div className="conflict-stat-single">ADF attacks: {casualties.current.adfConflict.label}</div>}
            </div>
          )}

          {/* Civilian casualties */}
          {casualties.civilian && (
            <div className="conflict-stat-group">
              <div className="conflict-stat-group-title">Civilian Casualties</div>
              {casualties.civilian.killed && <div className="conflict-stat-single">{casualties.civilian.killed.label}</div>}
              {casualties.civilian.gazaKilled && <div className="conflict-stat-single">Gaza: {casualties.civilian.gazaKilled.label}</div>}
              {casualties.civilian.gazaWounded && <div className="conflict-stat-single">Gaza wounded: {casualties.civilian.gazaWounded.label}</div>}
              {casualties.civilian.note && <div className="conflict-section-note">{casualties.civilian.note}</div>}
            </div>
          )}

          {/* Hostages (Israel-Gaza specific) */}
          {casualties.sideA?.hostages && (
            <div className="conflict-stat-group">
              <div className="conflict-stat-group-title">Hostages</div>
              <div className="conflict-stat-single">{casualties.sideA.hostages.label}</div>
            </div>
          )}

          <div className="conflict-sources">
            Sources: {casualties.sideA?.source || ''} {casualties.sideB?.source ? `; ${casualties.sideB.source}` : ''} {casualties.civilian?.source ? `; ${casualties.civilian.source}` : ''}
          </div>
        </>
      )}

      <InlineMarkets
        require={marketKeywords.require}
        boost={marketKeywords.boost}
        title="Related Markets"
        enabled={true}
        maxItems={4}
      />
    </div>
  );
}

/* ─── Equipment Tab ─── */
function EquipmentTab({ equipment, summary, sideAColor, sideBColor }) {
  if (!equipment) return <div className="conflict-tab-body"><div className="conflict-section-note">No equipment data available.</div></div>;

  const renderItems = (items, label) => {
    if (!items || !items.length) return null;
    return (
      <div className="conflict-prod-list">
        {items.map((item) => (
          <div key={item.type} className="conflict-prod-item">
            <span className="conflict-prod-type">{item.type}</span>
            <span className="conflict-prod-count">{typeof item.count === 'number' ? item.count.toLocaleString() : item.count}</span>
            <span className="conflict-prod-note">{item.note || ''}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="conflict-tab-body">
      <div className="conflict-section-note">Equipment data. As of {equipment.asOf || 'recent estimates'}.</div>

      {/* Side A */}
      <div className="conflict-equip-section">
        <div className="conflict-equip-header">
          <span className="conflict-side-dot" style={{ background: sideAColor }} /> {summary.sideA.name}
        </div>
        {equipment.sideA?.deployed && renderItems(equipment.sideA.deployed, 'Deployed')}
        {equipment.sideA?.assets && renderItems(equipment.sideA.assets, 'Assets')}
        {equipment.sideA?.losses && renderItems(equipment.sideA.losses, 'Losses')}
        {equipment.sideA?.lost && (
          <div className="conflict-equip-grid">
            {equipment.sideA.lost.map((item) => (
              <div key={item.type} className="conflict-equip-item">
                <span className="conflict-equip-count">{typeof item.count === 'number' ? item.count.toLocaleString() : item.count}</span>
                <span className="conflict-equip-type">{item.type}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Side B */}
      <div className="conflict-equip-section">
        <div className="conflict-equip-header">
          <span className="conflict-side-dot" style={{ background: sideBColor }} /> {summary.sideB.name}
        </div>
        {equipment.sideB?.preWar && renderItems(equipment.sideB.preWar, 'Pre-War Arsenal')}
        {equipment.sideB?.destroyed && renderItems(equipment.sideB.destroyed, 'Destroyed')}
        {equipment.sideB?.assets && renderItems(equipment.sideB.assets, 'Assets')}
      </div>

      <div className="conflict-sources">
        Sources: {equipment.sideA?.source || ''} {equipment.sideB?.source ? `; ${equipment.sideB.source}` : ''}
      </div>
    </div>
  );
}

/* ─── Command Tab ─── */
function CommandTab({ command, summary }) {
  if (!command) return <div className="conflict-tab-body"><div className="conflict-section-note">No command data available.</div></div>;
  return (
    <div className="conflict-tab-body">
      <div className="conflict-section-note">Military command structure.</div>

      {/* Side A */}
      <div className="conflict-cmd-section">
        <div className="conflict-cmd-header"><span style={{ marginRight: 6 }}>{summary.sideA.flag}</span>{command.sideA?.title}</div>
        {command.sideA?.totalPersonnel && <div className="conflict-cmd-personnel">Personnel: {command.sideA.totalPersonnel}</div>}
        <div className="conflict-cmd-list">
          {(command.sideA?.keyCommanders || []).map((cmd) => (
            <div key={cmd.name} className="conflict-cmd-item">
              <span className="conflict-cmd-name">{cmd.name}</span>
              <span className="conflict-cmd-role">{cmd.role}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Side B */}
      <div className="conflict-cmd-section">
        <div className="conflict-cmd-header"><span style={{ marginRight: 6 }}>{summary.sideB.flag}</span>{command.sideB?.title}</div>
        {command.sideB?.totalPersonnel && <div className="conflict-cmd-personnel">Personnel: {command.sideB.totalPersonnel}</div>}
        <div className="conflict-cmd-list">
          {(command.sideB?.keyCommanders || []).map((cmd) => (
            <div key={cmd.name} className="conflict-cmd-item">
              <span className="conflict-cmd-name">{cmd.name}</span>
              <span className="conflict-cmd-role">{cmd.role}</span>
            </div>
          ))}
        </div>
      </div>

      {/* International support */}
      {summary.internationalSupport && (
        <div className="conflict-cmd-section">
          <div className="conflict-cmd-header">International Support</div>
          <div className="conflict-cmd-item">
            <span className="conflict-cmd-name">{summary.sideA.shortName}</span>
            <span className="conflict-cmd-role">{summary.internationalSupport.sideA}</span>
          </div>
          <div className="conflict-cmd-item">
            <span className="conflict-cmd-name">{summary.sideB.shortName}</span>
            <span className="conflict-cmd-role">{summary.internationalSupport.sideB}</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Timeline Tab ─── */
function TimelineTab({ timeline }) {
  const phaseColors = {
    invasion: '#ff4444', turning: '#ff8800', counteroffensive: '#44bb44',
    attrition: '#888888', ground: '#ff4444', ceasefire: '#44bb44',
    legal: '#8844cc', escalation: '#ff6600', red_sea: '#2266cc',
    outbreak: '#ff4444', expansion: '#ff6600', humanitarian: '#cc4444',
    siege: '#ff3333', diplomatic: '#4488cc',
    coup: '#ff0000', crackdown: '#cc0000', resistance: '#4488cc',
    war: '#ff4444', offensive: '#ff6600', political: '#4488cc',
    prewar: '#888888', truce: '#44bb44', stalemate: '#888888',
    first_war: '#ff4444', resurgence: '#ff6600', peacekeeping: '#4488cc',
    tigray: '#ff4444', amhara: '#ff6600', oromia: '#ffcc00',
  };
  return (
    <div className="conflict-tab-body">
      <div className="conflict-section-note">Key events timeline.</div>
      <div className="conflict-timeline">
        {timeline.map((evt, i) => (
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

/* ─── Humanitarian Tab ─── */
function HumanitarianTab({ humanitarian }) {
  if (!humanitarian) return <div className="conflict-tab-body"><div className="conflict-section-note">No humanitarian data available.</div></div>;
  const h = humanitarian;
  return (
    <div className="conflict-tab-body">
      <div className="conflict-section-note">Humanitarian impact. As of {h.asOf || 'recent data'}.</div>

      {h.refugees && (
        <div className="conflict-stat-group">
          <div className="conflict-stat-group-title">Refugees / External Displacement</div>
          <div className="conflict-humanitarian-big">{h.refugees.label}</div>
          {h.refugees.topCountries && (
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
          )}
          {h.refugees.note && <div className="conflict-section-note">{h.refugees.note}</div>}
          {h.refugees.source && <div className="conflict-sources">{h.refugees.source}</div>}
        </div>
      )}

      {h.internallyDisplaced && (
        <div className="conflict-stat-group">
          <div className="conflict-stat-group-title">Internally Displaced</div>
          <div className="conflict-humanitarian-big">{h.internallyDisplaced.label}</div>
          {h.internallyDisplaced.note && <div className="conflict-section-note">{h.internallyDisplaced.note}</div>}
          {h.internallyDisplaced.source && <div className="conflict-sources">{h.internallyDisplaced.source}</div>}
        </div>
      )}

      {/* Hunger / Famine */}
      {(h.hunger || h.famine) && (
        <div className="conflict-stat-group">
          <div className="conflict-stat-group-title">Food Security</div>
          {h.hunger && <div className="conflict-humanitarian-big">{h.hunger.label}</div>}
          {h.famine && <div className="conflict-humanitarian-big">{h.famine.label}</div>}
          {h.hunger?.famineRisk && <div className="conflict-stat-single">{h.hunger.famineRisk}</div>}
          {h.famine?.famineAreas && <div className="conflict-section-note">{h.famine.famineAreas}</div>}
          {(h.hunger?.source || h.famine?.source) && <div className="conflict-sources">{h.hunger?.source || h.famine?.source}</div>}
        </div>
      )}

      {/* Aid access (Israel-Gaza) */}
      {h.aidAccess && (
        <div className="conflict-stat-group">
          <div className="conflict-stat-group-title">Aid Access</div>
          <div className="conflict-stat-single">Status: {h.aidAccess.status}</div>
          <div className="conflict-stat-single">Trucks/day: {h.aidAccess.trucksPerDay}</div>
          {h.aidAccess.note && <div className="conflict-section-note">{h.aidAccess.note}</div>}
        </div>
      )}

      {/* Infrastructure damage */}
      {h.infrastructureDamage && (
        <div className="conflict-stat-group">
          <div className="conflict-stat-group-title">Infrastructure Damage</div>
          <div className="conflict-prod-list">
            {Object.entries(h.infrastructureDamage)
              .filter(([k]) => k !== 'source')
              .map(([key, val]) => (
                <div key={key} className="conflict-prod-item">
                  <span className="conflict-prod-type">{key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</span>
                  <span className="conflict-prod-count" style={{ gridColumn: 'span 2' }}>{typeof val === 'number' ? val.toLocaleString() : val}</span>
                </div>
              ))}
          </div>
          {h.infrastructureDamage.source && <div className="conflict-sources">{h.infrastructureDamage.source}</div>}
        </div>
      )}

      {/* Minerals (DRC) */}
      {h.minerals && (
        <div className="conflict-stat-group">
          <div className="conflict-stat-group-title">Conflict Minerals</div>
          <div className="conflict-section-note">{h.minerals.note}</div>
          <div className="conflict-stat-single">{h.minerals.value}</div>
        </div>
      )}

      {/* Tigray recovery */}
      {h.tigrayRecovery && (
        <div className="conflict-stat-group">
          <div className="conflict-stat-group-title">Tigray Recovery</div>
          <div className="conflict-stat-single">Status: {h.tigrayRecovery.status}</div>
          {h.tigrayRecovery.note && <div className="conflict-section-note">{h.tigrayRecovery.note}</div>}
        </div>
      )}
    </div>
  );
}

/* ─── Battles Tab ─── */
function BattlesTab({ battles, summary, sideAColor, sideBColor }) {
  if (!battles.length) return <div className="conflict-tab-body"><div className="conflict-section-note">No battle data available.</div></div>;
  return (
    <div className="conflict-tab-body">
      <div className="conflict-section-note">Major battles and operations.</div>
      {battles.map((b) => (
        <div key={b.id} className="conflict-stat-group" style={{ borderLeft: `3px solid ${b.result?.toLowerCase().includes('ongoing') || b.result?.toLowerCase().includes('contested') ? '#ffa500' : '#888'}` }}>
          <div className="conflict-stat-group-title">{b.name}</div>
          <div className="conflict-territory-details">
            <span>{b.date} — <strong>{b.result}</strong></span>
          </div>
          <div className="conflict-section-note">{b.note}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
            <div>
              <div style={{ color: sideAColor, fontWeight: 600, fontSize: 11, marginBottom: 4 }}>{summary.sideA.shortName}</div>
              <div style={{ fontSize: 10, opacity: 0.8 }}>Troops: {b.sideATroops}</div>
              <div style={{ fontSize: 10, opacity: 0.8 }}>Casualties: {b.sideACasualties}</div>
            </div>
            <div>
              <div style={{ color: sideBColor, fontWeight: 600, fontSize: 11, marginBottom: 4 }}>{summary.sideB.shortName}</div>
              <div style={{ fontSize: 10, opacity: 0.8 }}>Troops: {b.sideBTroops}</div>
              <div style={{ fontSize: 10, opacity: 0.8 }}>Casualties: {b.sideBCasualties}</div>
            </div>
          </div>
          {b.significance && <div className="conflict-section-note" style={{ marginTop: 6 }}>{b.significance}</div>}
        </div>
      ))}
    </div>
  );
}
