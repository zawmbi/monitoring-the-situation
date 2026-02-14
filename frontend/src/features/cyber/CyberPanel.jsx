import { useState } from 'react';
import { timeAgo } from '../../utils/time';

export function CyberPanel({ data, loading, onRefresh }) {
  const [tab, setTab] = useState('incidents');

  if (loading && !data) {
    return <div className="panel-loading">Loading cyber intelligence...</div>;
  }
  if (!data) return <div className="panel-empty">No cyber data available</div>;

  return (
    <div className="cyber-panel">
      <div className="cp-summary">
        <div className="cp-stat">
          <span className="cp-stat-value">{data.summary?.cyberAttacks || 0}</span>
          <span className="cp-stat-label">Attacks</span>
        </div>
        <div className="cp-stat">
          <span className="cp-stat-value">{data.summary?.outages || 0}</span>
          <span className="cp-stat-label">Outages</span>
        </div>
        <div className="cp-stat">
          <span className="cp-stat-value" style={{ color: '#ff6b6b' }}>{data.summary?.ransomwareRelated || 0}</span>
          <span className="cp-stat-label">Ransomware</span>
        </div>
        <div className="cp-stat">
          <span className="cp-stat-value">{data.summary?.totalVulnerabilities || 0}</span>
          <span className="cp-stat-label">CISA KEV</span>
        </div>
      </div>

      <div className="cp-tabs">
        <button className={`cp-tab${tab === 'incidents' ? ' active' : ''}`} onClick={() => setTab('incidents')}>Incidents</button>
        <button className={`cp-tab${tab === 'vulns' ? ' active' : ''}`} onClick={() => setTab('vulns')}>Vulnerabilities</button>
        <button className="dp-refresh-btn" onClick={onRefresh} title="Refresh" style={{ marginLeft: 'auto' }}>↻</button>
      </div>

      {tab === 'incidents' && (
        <div className="cp-list">
          {(data.incidents || []).map(item => (
            <a key={item.id} className="cp-item" href={item.link} target="_blank" rel="noopener noreferrer">
              <div className="cp-item-header">
                <span className={`cp-item-type cp-type-${item.type}`}>{item.type === 'outage' ? 'OUTAGE' : 'CYBER'}</span>
                {item.date && <span className="cp-item-time">{timeAgo(item.date)}</span>}
              </div>
              <div className="cp-item-title">{item.title}</div>
              <div className="cp-item-source">{item.source}</div>
            </a>
          ))}
        </div>
      )}

      {tab === 'vulns' && (
        <div className="cp-list">
          {(data.vulnerabilities || []).map(vuln => (
            <div key={vuln.id} className="cp-vuln">
              <div className="cp-vuln-header">
                <span className="cp-vuln-cve">{vuln.cve}</span>
                {vuln.knownRansomware && <span className="cp-vuln-ransomware">RANSOMWARE</span>}
              </div>
              <div className="cp-vuln-name">{vuln.name}</div>
              <div className="cp-vuln-meta">
                <span>{vuln.vendor} — {vuln.product}</span>
                <span>Added: {vuln.dateAdded}</span>
              </div>
              {vuln.description && <div className="cp-vuln-desc">{vuln.description}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
