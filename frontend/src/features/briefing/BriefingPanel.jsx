import { useState } from 'react';
import { timeAgo } from '../../utils/time';

/* ── category config ── */
const CATEGORY_META = {
  conflict:   { icon: '\u2694\uFE0F', label: 'Conflict',   color: '#ef4444' },
  politics:   { icon: '\uD83C\uDFDB\uFE0F', label: 'Politics',   color: '#8b5cf6' },
  economy:    { icon: '\uD83D\uDCC8', label: 'Economy',    color: '#22c55e' },
  disaster:   { icon: '\uD83C\uDF0A', label: 'Disaster',   color: '#f59e0b' },
  technology: { icon: '\uD83D\uDCBB', label: 'Technology', color: '#3b82f6' },
  cyber:      { icon: '\uD83D\uDD12', label: 'Cyber',      color: '#06b6d4' },
  other:      { icon: '\uD83D\uDCF0', label: 'Other',      color: '#8899aa' },
};

function catMeta(category) {
  return CATEGORY_META[category] || CATEGORY_META.other;
}

/* ── RiskOverview ── */
function RiskOverview({ data }) {
  const topRisks = data.topRisks || [];
  if (topRisks.length === 0) return null;

  const riskLevelColor = (level) => {
    if (level === 'critical' || level === 'extreme') return '#ff4444';
    if (level === 'high') return '#ff8c00';
    if (level === 'elevated') return '#ffd700';
    if (level === 'moderate') return '#4ecdc4';
    return '#4a9eff';
  };

  return (
    <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{
        fontSize: 10, color: '#8899aa', textTransform: 'uppercase',
        letterSpacing: 0.6, marginBottom: 6, fontWeight: 600,
      }}>
        Highest Risk Countries
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {topRisks.map((r, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, color: '#556677', width: 16, textAlign: 'right',
            }}>
              #{i + 1}
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-primary, #e0e8f0)', flex: 1 }}>
              {r.country}
            </span>
            <span style={{
              fontSize: 10, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
              color: riskLevelColor(r.level),
            }}>
              {r.score}
            </span>
            <span style={{
              fontSize: 8, padding: '1px 5px', borderRadius: 6, fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: 0.3,
              background: `${riskLevelColor(r.level)}15`,
              color: riskLevelColor(r.level),
            }}>
              {r.level}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── TensionSummary mini-bar ── */
function TensionSummary({ tension }) {
  if (!tension) return null;
  const value = tension.index || 0;
  const color = value >= 80 ? '#ff4444' : value >= 60 ? '#ff8c00' : value >= 40 ? '#ffd700' : '#4ecdc4';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 10, color: '#8899aa' }}>Tension</span>
      <div style={{
        flex: 1, height: 6, borderRadius: 3,
        background: 'rgba(255,255,255,0.06)', overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', width: `${value}%`, borderRadius: 3,
          background: `linear-gradient(90deg, #4a9eff, #4ecdc4, #ffd700, #ff8c00, #ff4444)`,
          backgroundSize: '200% 100%',
          backgroundPosition: `${100 - value}% 0`,
          transition: 'width 0.4s ease',
        }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color }}>
        {value}/100
      </span>
      <span style={{ fontSize: 10, fontWeight: 600, color }}>
        {tension.label || ''}
      </span>
    </div>
  );
}

/* ── HeadlineItem ── */
function HeadlineItem({ item, category }) {
  const meta = catMeta(category);
  return (
    <a href={item.url} target="_blank" rel="noopener noreferrer"
      style={{
        display: 'block', padding: '6px 12px 6px 28px', textDecoration: 'none',
        borderBottom: '1px solid rgba(255,255,255,0.03)', position: 'relative',
        transition: 'background 0.15s',
      }}>
      <span style={{
        position: 'absolute', left: 10, top: 8, fontSize: 12,
      }}>
        {meta.icon}
      </span>
      <div style={{ fontSize: 12, color: 'var(--text-primary, #e0e8f0)', lineHeight: 1.4, marginBottom: 2 }}>
        {item.title}
      </div>
      <div style={{ fontSize: 10, color: '#8899aa', display: 'flex', gap: 8 }}>
        {item.source && <span>{item.source}</span>}
        {item.date && <span>{timeAgo(item.date)}</span>}
        <span style={{ color: meta.color }}>{meta.label}</span>
      </div>
    </a>
  );
}

/* ── Loading skeleton ── */
function BriefingSkeleton() {
  return (
    <div className="briefing-panel" style={{ opacity: 0.5 }}>
      <div style={{ padding: '12px 12px 8px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ width: '70%', height: 16, background: 'rgba(255,255,255,0.06)', borderRadius: 3, marginBottom: 6 }} />
        <div style={{ width: '40%', height: 10, background: 'rgba(255,255,255,0.04)', borderRadius: 3 }} />
      </div>
      <div style={{ padding: '10px 12px', display: 'flex', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ width: 36, height: 18, background: 'rgba(255,255,255,0.06)', borderRadius: 3, margin: '0 auto 4px' }} />
            <div style={{ width: 48, height: 8, background: 'rgba(255,255,255,0.04)', borderRadius: 3, margin: '0 auto' }} />
          </div>
        ))}
      </div>
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div key={i} style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
          <div style={{ width: `${60 + (i % 3) * 10}%`, height: 12, background: 'rgba(255,255,255,0.05)', borderRadius: 3, marginBottom: 4 }} />
          <div style={{ width: '35%', height: 8, background: 'rgba(255,255,255,0.03)', borderRadius: 3 }} />
        </div>
      ))}
    </div>
  );
}

/* ── MAIN PANEL ── */
export function BriefingPanel({ data, loading, onRefresh }) {
  const [expandedSection, setExpandedSection] = useState(null);

  if (loading && !data) return <BriefingSkeleton />;
  if (!data) return <div className="panel-empty">No briefing available</div>;

  const headlines = data.headlines || {};
  const allCategories = Object.keys(headlines).filter(k => headlines[k]?.length > 0);
  const keyDevelopments = data.keyDevelopments || [];

  return (
    <div className="briefing-panel">
      {/* ── Header ── */}
      <div style={{
        padding: '10px 12px 8px', borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      }}>
        <div>
          <div style={{
            fontSize: 13, fontWeight: 700, letterSpacing: 1.2, color: 'var(--text-primary, #e0e8f0)',
            textTransform: 'uppercase',
          }}>
            GLOBAL INTELLIGENCE BRIEFING
          </div>
          <div style={{ fontSize: 10, color: '#8899aa', marginTop: 2 }}>
            Generated: {data.generatedAt ? new Date(data.generatedAt).toLocaleString() : '—'}
          </div>
        </div>
        <button className="dp-refresh-btn" onClick={onRefresh} title="Refresh">↻</button>
      </div>

      {/* ── Overview stats ── */}
      <div className="bp-overview" style={{
        padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        {/* tension mini gauge */}
        <TensionSummary tension={data.globalTension} />

        {/* stat row */}
        <div style={{ display: 'flex', gap: 2 }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#f59e0b' }}>{data.activeDisasters ?? '—'}</div>
            <div style={{ fontSize: 9, color: '#8899aa', textTransform: 'uppercase', letterSpacing: 0.3 }}>Active Disasters</div>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#06b6d4' }}>{data.cyberThreats ?? '—'}</div>
            <div style={{ fontSize: 9, color: '#8899aa', textTransform: 'uppercase', letterSpacing: 0.3 }}>Cyber Threats</div>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#ef4444' }}>{data.activeConflicts ?? '—'}</div>
            <div style={{ fontSize: 9, color: '#8899aa', textTransform: 'uppercase', letterSpacing: 0.3 }}>Active Conflicts</div>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#8b5cf6' }}>{data.electionsUpcoming ?? '—'}</div>
            <div style={{ fontSize: 9, color: '#8899aa', textTransform: 'uppercase', letterSpacing: 0.3 }}>Elections Soon</div>
          </div>
        </div>
      </div>

      {/* ── Highest risk countries ── */}
      <RiskOverview data={data} />

      {/* ── Key Developments ── */}
      {keyDevelopments.length > 0 && (
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{
            padding: '8px 12px 4px', fontSize: 10, color: '#8899aa',
            textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600,
          }}>
            Key Developments
          </div>
          {keyDevelopments.map((dev, i) => {
            const meta = catMeta(dev.category);
            return (
              <div key={i} style={{
                padding: '6px 12px', borderBottom: '1px solid rgba(255,255,255,0.03)',
                display: 'flex', gap: 8, alignItems: 'flex-start',
              }}>
                <span style={{ fontSize: 12, flexShrink: 0, marginTop: 1 }}>{meta.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-primary, #e0e8f0)', lineHeight: 1.4 }}>
                    {dev.title}
                  </div>
                  {dev.description && (
                    <div style={{ fontSize: 11, color: '#667788', marginTop: 2, lineHeight: 1.3 }}>
                      {dev.description}
                    </div>
                  )}
                  <div style={{ fontSize: 9, color: '#556677', marginTop: 2 }}>
                    {dev.date && <span>{timeAgo(dev.date)}</span>}
                    {dev.region && <span style={{ marginLeft: 6 }}>{dev.region}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Categorized headlines ── */}
      {allCategories.map(category => {
        const items = headlines[category] || [];
        const meta = catMeta(category);
        const isExpanded = expandedSection === category;
        const displayItems = isExpanded ? items : items.slice(0, 4);

        return (
          <div key={category} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div
              onClick={() => setExpandedSection(isExpanded ? null : category)}
              style={{
                padding: '8px 12px', fontSize: 11, fontWeight: 600,
                color: meta.color, cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'space-between',
                textTransform: 'uppercase', letterSpacing: 0.5,
              }}>
              <span>{meta.icon} {meta.label} ({items.length})</span>
              <span style={{ fontSize: 10, color: '#8899aa' }}>{isExpanded ? 'Collapse' : items.length > 4 ? `+${items.length - 4} more` : ''}</span>
            </div>
            {displayItems.map((item, i) => (
              <HeadlineItem key={i} item={item} category={category} />
            ))}
          </div>
        );
      })}

      {/* ── Footer ── */}
      <div style={{
        padding: '8px 12px', borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontSize: 9, color: '#556677', letterSpacing: 0.3,
      }}>
        <span>Multi-source intelligence aggregation</span>
        {data.generatedAt && <span>Generated {timeAgo(data.generatedAt)}</span>}
      </div>
    </div>
  );
}
