/**
 * StabilityPanel — Tabbed panel showing:
 *   1. Protest/Unrest feed
 *   2. Military movement indicators
 *   3. Instability alerts (assassinations, coups, regime change)
 */

import { useState } from 'react';
import { SEVERITY_COLORS, ALERT_TYPE_META, FORCE_ICONS, SEVERITY_LABELS } from './stabilityData';
import './stability.css';

const TABS = [
  { id: 'alerts', label: 'Instability Alerts' },
  { id: 'protests', label: 'Protests' },
  { id: 'military', label: 'Military' },
];

function timeAgoShort(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function SeverityBadge({ severity }) {
  return (
    <span
      className="stab-severity-badge"
      style={{ background: SEVERITY_COLORS[severity] || SEVERITY_COLORS.moderate }}
    >
      {SEVERITY_LABELS[severity] || severity}
    </span>
  );
}

function AlertCard({ alert, onClick }) {
  const meta = ALERT_TYPE_META[alert.type] || ALERT_TYPE_META.political_crisis;
  return (
    <button className="stab-alert-card" type="button" onClick={() => onClick?.(alert)}>
      <div className="stab-alert-card-left">
        <span className="stab-alert-icon" style={{ color: meta.color }}>{meta.icon}</span>
      </div>
      <div className="stab-alert-card-body">
        <div className="stab-alert-card-header">
          <span className="stab-alert-country">{alert.country}</span>
          <span className="stab-alert-type-chip" style={{ borderColor: meta.color, color: meta.color }}>
            {meta.label}
          </span>
        </div>
        <div className="stab-alert-headline">{alert.headline}</div>
        {alert.articles?.length > 0 && (
          <div className="stab-alert-source">{alert.articles[0].source} {alert.articles[0].date && `· ${timeAgoShort(alert.articles[0].date)}`}</div>
        )}
      </div>
      <SeverityBadge severity={alert.severity} />
    </button>
  );
}

function MilitaryCard({ item, onClick }) {
  const icon = FORCE_ICONS[item.force] || '⬡';
  return (
    <button className="stab-mil-card" type="button" onClick={() => onClick?.(item)}>
      <span className="stab-mil-icon">{icon}</span>
      <div className="stab-mil-body">
        <div className="stab-mil-header">
          <span className="stab-mil-country">{item.country}</span>
          <span className="stab-mil-force">{item.force}</span>
        </div>
        <div className="stab-mil-label">{item.label}</div>
      </div>
      <SeverityBadge severity={item.severity} />
    </button>
  );
}

function ProtestCard({ item, onClick }) {
  const intensity = item.intensity || item.count || 0;
  const barWidth = Math.min(100, intensity * 10);
  return (
    <button className="stab-protest-card" type="button" onClick={() => onClick?.(item)}>
      <div className="stab-protest-info">
        <span className="stab-protest-country">{item.country}</span>
        <span className="stab-protest-label">{item.label}</span>
      </div>
      <div className="stab-protest-bar-track">
        <div className="stab-protest-bar-fill" style={{ width: `${barWidth}%` }} />
      </div>
      <span className="stab-protest-intensity">{intensity}</span>
    </button>
  );
}

function NewsSection({ headlines }) {
  if (!headlines || headlines.length === 0) return null;
  return (
    <div className="stab-news-section">
      <div className="stab-news-title">Latest Headlines</div>
      {headlines.slice(0, 8).map((item, i) => (
        <a
          key={i}
          className="stab-news-item"
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="stab-news-headline">{item.title}</span>
          {item.pubDate && <span className="stab-news-time">{timeAgoShort(item.pubDate)}</span>}
        </a>
      ))}
    </div>
  );
}

export default function StabilityPanel({
  data,
  loading,
  onRefresh,
  onAlertClick,
  onMilitaryClick,
  onProtestClick,
}) {
  const [activeTab, setActiveTab] = useState('alerts');

  const protests = data?.protests || [];
  const military = data?.military || [];
  const instability = data?.instability || [];

  // Sort instability by severity
  const severityOrder = { critical: 0, high: 1, elevated: 2, moderate: 3, low: 4 };
  const sortedAlerts = [...instability].sort((a, b) => (severityOrder[a.severity] ?? 9) - (severityOrder[b.severity] ?? 9));
  const sortedMilitary = [...military].sort((a, b) => (severityOrder[a.severity] ?? 9) - (severityOrder[b.severity] ?? 9));
  const sortedProtests = [...protests].sort((a, b) => (b.intensity || b.count || 0) - (a.intensity || a.count || 0));

  const counts = {
    alerts: instability.length,
    protests: protests.length,
    military: military.length,
  };

  return (
    <div className="stab-panel">
      <div className="stab-panel-header">
        <div className="stab-panel-title-row">
          <span className="stab-panel-title">Global Stability Monitor</span>
          <span className="stab-live-badge">OSINT</span>
        </div>
        <button className="stab-btn-refresh" onClick={onRefresh} disabled={loading}>
          {loading ? '...' : '↻'}
        </button>
      </div>

      <div className="stab-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`stab-tab${activeTab === tab.id ? ' stab-tab--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            {counts[tab.id] > 0 && <span className="stab-tab-count">{counts[tab.id]}</span>}
          </button>
        ))}
      </div>

      <div className="stab-panel-content">
        {loading && !data && (
          <div className="stab-loading">
            <span className="stab-loading-dot" />
            Loading stability data...
          </div>
        )}

        {/* ── Instability Alerts Tab ── */}
        {activeTab === 'alerts' && (
          <div className="stab-tab-body">
            <div className="stab-section-note">
              Regime instability, coups, assassinations, and political crises detected from GDELT + open-source intelligence.
            </div>
            {sortedAlerts.length === 0 && !loading && (
              <div className="stab-empty">No active instability alerts</div>
            )}
            <div className="stab-card-list">
              {sortedAlerts.map((alert) => (
                <AlertCard key={alert.id} alert={alert} onClick={onAlertClick} />
              ))}
            </div>
            <NewsSection headlines={data?.instabilityNews} />
          </div>
        )}

        {/* ── Protests Tab ── */}
        {activeTab === 'protests' && (
          <div className="stab-tab-body">
            <div className="stab-section-note">
              Active protest movements, demonstrations, and civil unrest worldwide. Intensity is based on GDELT article volume and baseline intelligence.
            </div>
            {sortedProtests.length === 0 && !loading && (
              <div className="stab-empty">No active protest data</div>
            )}
            <div className="stab-card-list">
              {sortedProtests.map((p) => (
                <ProtestCard key={p.id} item={p} onClick={onProtestClick} />
              ))}
            </div>
            <NewsSection headlines={data?.protestNews} />
          </div>
        )}

        {/* ── Military Tab ── */}
        {activeTab === 'military' && (
          <div className="stab-tab-body">
            <div className="stab-section-note">
              Military deployments, exercises, buildups, and force posture changes detected from OSINT sources.
            </div>
            {sortedMilitary.length === 0 && !loading && (
              <div className="stab-empty">No active military indicators</div>
            )}
            <div className="stab-card-list">
              {sortedMilitary.map((m) => (
                <MilitaryCard key={m.id} item={m} onClick={onMilitaryClick} />
              ))}
            </div>
            <NewsSection headlines={data?.militaryNews} />
          </div>
        )}
      </div>

      <div className="stab-panel-footer">
        <span className="stab-panel-sources">GDELT + Google News + Baseline OSINT</span>
        {data?.lastUpdated && (
          <span className="stab-panel-updated">Updated {timeAgoShort(data.lastUpdated)}</span>
        )}
      </div>
    </div>
  );
}
