import { useState, useMemo } from 'react';
import { timeAgo } from '../../utils/time';

/* ── Colour helpers ── */

function toneColor(tone) {
  if (tone == null || isNaN(tone)) return '#8899aa';
  if (tone > 5) return '#22c55e';
  if (tone > 2) return '#4ade80';
  if (tone > 1) return '#86efac';
  if (tone > -1) return '#8899aa';
  if (tone > -2) return '#fca5a5';
  if (tone > -5) return '#f87171';
  return '#ef4444';
}

function sentimentColor(sentiment) {
  if (sentiment === 'positive') return '#22c55e';
  if (sentiment === 'negative') return '#ef4444';
  return '#8899aa';
}

function momentumColor(momentum) {
  if (momentum === 'increasing') return '#f59e0b';
  if (momentum === 'decreasing') return '#6366f1';
  return '#8899aa';
}

function momentumArrow(momentum) {
  if (momentum === 'increasing') return '\u2191';
  if (momentum === 'decreasing') return '\u2193';
  return '\u2194';
}

function countryName(code) {
  const map = {
    US: 'United States', GB: 'United Kingdom', RU: 'Russia', CN: 'China', IN: 'India',
    FR: 'France', DE: 'Germany', JP: 'Japan', BR: 'Brazil', AU: 'Australia',
    CA: 'Canada', MX: 'Mexico', IT: 'Italy', ES: 'Spain', PL: 'Poland',
    UA: 'Ukraine', NL: 'Netherlands', SE: 'Sweden', TR: 'Turkey', IL: 'Israel',
    SA: 'Saudi Arabia', IR: 'Iran', AE: 'UAE', QA: 'Qatar', KR: 'South Korea',
    PK: 'Pakistan', ID: 'Indonesia', PH: 'Philippines', NG: 'Nigeria',
    ZA: 'South Africa', EG: 'Egypt', KE: 'Kenya', ET: 'Ethiopia',
    AR: 'Argentina', CO: 'Colombia', NZ: 'New Zealand',
  };
  return map[code] || code;
}

/* ── Loading Skeleton ── */

function NarrativeSkeleton() {
  const shimmer = {
    background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)',
    backgroundSize: '200% 100%',
    animation: 'narrativeShimmer 1.5s ease-in-out infinite',
  };

  return (
    <div style={{ opacity: 0.6 }}>
      {/* Header skeleton */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ width: 220, height: 14, borderRadius: 4, ...shimmer }} />
      </div>
      {/* Stats row skeleton */}
      <div style={{ display: 'flex', gap: 12, padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ width: 40, height: 20, margin: '0 auto 4px', borderRadius: 4, ...shimmer }} />
            <div style={{ width: 60, height: 10, margin: '0 auto', borderRadius: 3, ...shimmer }} />
          </div>
        ))}
      </div>
      {/* Tab skeleton */}
      <div style={{ display: 'flex', gap: 6, padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {[80, 70, 90].map((w, i) => (
          <div key={i} style={{ width: w, height: 24, borderRadius: 12, ...shimmer }} />
        ))}
      </div>
      {/* Card skeletons */}
      {[1, 2, 3, 4].map((i) => (
        <div key={i} style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <div style={{ width: '60%', height: 13, borderRadius: 3, marginBottom: 8, ...shimmer }} />
          <div style={{ width: '85%', height: 10, borderRadius: 3, marginBottom: 6, ...shimmer }} />
          <div style={{ width: '100%', height: 6, borderRadius: 3, ...shimmer }} />
        </div>
      ))}
    </div>
  );
}

/* ── ToneBar: Horizontal bar from -10 to +10 ── */

function ToneBar({ tone }) {
  const value = tone != null ? Math.max(-10, Math.min(10, tone)) : 0;
  const percentage = ((value + 10) / 20) * 100;
  const color = toneColor(value);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
      <span style={{ fontSize: 9, color: '#667788', minWidth: 18, textAlign: 'right' }}>-10</span>
      <div style={{
        flex: 1, height: 8, borderRadius: 4, position: 'relative',
        background: 'linear-gradient(90deg, rgba(239,68,68,0.2) 0%, rgba(136,153,170,0.15) 50%, rgba(34,197,94,0.2) 100%)',
        overflow: 'hidden',
      }}>
        {/* Center line */}
        <div style={{
          position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1,
          background: 'rgba(255,255,255,0.15)', zIndex: 1,
        }} />
        {/* Tone marker */}
        <div style={{
          position: 'absolute', left: `${percentage}%`, top: -1, width: 10, height: 10,
          borderRadius: '50%', background: color, border: '2px solid rgba(0,0,0,0.4)',
          transform: 'translateX(-50%)', zIndex: 2,
          boxShadow: `0 0 6px ${color}66`,
        }} />
        {/* Fill from center */}
        {value !== 0 && (
          <div style={{
            position: 'absolute',
            left: value > 0 ? '50%' : `${percentage}%`,
            width: `${Math.abs(value) / 20 * 100}%`,
            top: 0, bottom: 0,
            background: `${color}44`,
            borderRadius: 4,
          }} />
        )}
      </div>
      <span style={{ fontSize: 9, color: '#667788', minWidth: 18 }}>+10</span>
      <span style={{
        fontSize: 11, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
        color, minWidth: 36, textAlign: 'right',
      }}>
        {value > 0 ? '+' : ''}{value.toFixed(1)}
      </span>
    </div>
  );
}

/* ── SentimentBadge ── */

function SentimentBadge({ sentiment }) {
  const color = sentimentColor(sentiment);
  const label = sentiment
    ? sentiment.charAt(0).toUpperCase() + sentiment.slice(1)
    : 'Neutral';

  return (
    <span style={{
      fontSize: 9, padding: '2px 8px', borderRadius: 10, fontWeight: 600,
      textTransform: 'uppercase', letterSpacing: 0.4,
      background: `${color}18`, color, border: `1px solid ${color}33`,
    }}>
      {label}
    </span>
  );
}

/* ── MomentumIndicator ── */

function MomentumIndicator({ momentum }) {
  const color = momentumColor(momentum);
  const arrow = momentumArrow(momentum);
  const label = momentum
    ? momentum.charAt(0).toUpperCase() + momentum.slice(1)
    : 'Stable';

  return (
    <span style={{
      fontSize: 10, display: 'inline-flex', alignItems: 'center', gap: 3, color,
    }}>
      <span style={{ fontSize: 13, fontWeight: 700, lineHeight: 1 }}>{arrow}</span>
      {label}
    </span>
  );
}

/* ── NarrativeCard ── */

function NarrativeCard({ narrative }) {
  const n = narrative;
  if (!n) return null;

  const borderColor = toneColor(n.avgTone);

  return (
    <div style={{
      padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)',
      borderLeft: `3px solid ${borderColor}`,
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary, #e0e8f0)' }}>
          {n.label || n.topic}
        </span>
        <span style={{
          fontSize: 11, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
          color: n.articleCount > 0 ? '#8899aa' : '#556677',
        }}>
          {n.articleCount > 0 ? `${n.articleCount} articles` : 'Awaiting data'}
        </span>
      </div>

      {/* Badges row */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <SentimentBadge sentiment={n.sentiment} />
        <MomentumIndicator momentum={n.momentum} />
        {n.error && (
          <span style={{
            fontSize: 9, padding: '2px 6px', borderRadius: 8,
            background: 'rgba(255,136,0,0.12)', color: '#ff8c00',
            border: '1px solid rgba(255,136,0,0.25)',
          }}>
            partial data
          </span>
        )}
      </div>

      {/* Tone bar */}
      <ToneBar tone={n.avgTone} />

      {/* Top articles */}
      {n.topArticles && n.topArticles.length > 0 && (
        <div style={{ marginTop: 8 }}>
          {n.topArticles.slice(0, 3).map((article, idx) => (
            <div key={idx} style={{
              padding: '4px 0', borderTop: idx > 0 ? '1px solid rgba(255,255,255,0.03)' : 'none',
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8,
            }}>
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: 11, color: '#8899aa', textDecoration: 'none',
                  lineHeight: 1.3, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={article.title}
              >
                {article.title}
              </a>
              <span style={{
                fontSize: 9, fontVariantNumeric: 'tabular-nums',
                color: toneColor(article.tone), whiteSpace: 'nowrap',
              }}>
                {article.tone > 0 ? '+' : ''}{article.tone?.toFixed(1)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── DivergenceCard ── */

function DivergenceCard({ divergence }) {
  const d = divergence;
  if (!d) return null;

  const hasFlag = d.isDiverging;
  const borderColor = hasFlag ? '#f59e0b' : 'rgba(255,255,255,0.08)';

  return (
    <div style={{
      padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)',
      borderLeft: `3px solid ${borderColor}`,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary, #e0e8f0)' }}>
          {d.label || d.topic}
        </span>
        {hasFlag && (
          <span style={{
            fontSize: 9, padding: '2px 8px', borderRadius: 10, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: 0.4,
            background: 'rgba(245,158,11,0.15)', color: '#f59e0b',
            border: '1px solid rgba(245,158,11,0.3)',
          }}>
            DIVERGING
          </span>
        )}
      </div>

      {/* Max divergence */}
      <div style={{ fontSize: 10, color: '#667788', marginBottom: 8 }}>
        Max tone divergence: <span style={{
          fontWeight: 700, color: d.maxDivergence > 5 ? '#ef4444' : d.maxDivergence > 3 ? '#f59e0b' : '#8899aa',
        }}>{d.maxDivergence?.toFixed(1)} pts</span>
      </div>

      {/* Country comparison bars */}
      {d.sources && Object.keys(d.sources).length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {Object.entries(d.sources).map(([code, src]) => (
            <div key={code} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                fontSize: 10, fontWeight: 600, color: '#8899aa', minWidth: 22,
                textAlign: 'right',
              }}>
                {code}
              </span>
              <div style={{
                flex: 1, height: 6, borderRadius: 3, position: 'relative',
                background: 'rgba(255,255,255,0.04)',
              }}>
                <div style={{
                  position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1,
                  background: 'rgba(255,255,255,0.1)',
                }} />
                {src.articleCount > 0 && (
                  <div style={{
                    position: 'absolute',
                    left: src.avgTone >= 0 ? '50%' : `${((src.avgTone + 10) / 20) * 100}%`,
                    width: `${(Math.abs(src.avgTone) / 20) * 100}%`,
                    top: 0, bottom: 0, borderRadius: 3,
                    background: toneColor(src.avgTone),
                    opacity: 0.7,
                  }} />
                )}
              </div>
              <span style={{
                fontSize: 9, fontWeight: 600, fontVariantNumeric: 'tabular-nums',
                color: toneColor(src.avgTone), minWidth: 32, textAlign: 'right',
              }}>
                {src.articleCount > 0
                  ? `${src.avgTone > 0 ? '+' : ''}${src.avgTone?.toFixed(1)}`
                  : 'n/a'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Flagged pairs */}
      {d.flaggedPairs && d.flaggedPairs.length > 0 && (
        <div style={{ marginTop: 8, padding: '6px 8px', borderRadius: 6, background: 'rgba(245,158,11,0.06)' }}>
          <div style={{ fontSize: 9, color: '#f59e0b', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.3 }}>
            Flagged Divergences
          </div>
          {d.flaggedPairs.map((pair, idx) => (
            <div key={idx} style={{ fontSize: 10, color: '#8899aa', padding: '2px 0' }}>
              <span style={{ fontWeight: 600 }}>{pair.countries[0]}</span>
              <span style={{ color: toneColor(pair.tones[0]), fontWeight: 600 }}> ({pair.tones[0] > 0 ? '+' : ''}{pair.tones[0]})</span>
              {' vs '}
              <span style={{ fontWeight: 600 }}>{pair.countries[1]}</span>
              <span style={{ color: toneColor(pair.tones[1]), fontWeight: 600 }}> ({pair.tones[1] > 0 ? '+' : ''}{pair.tones[1]})</span>
              <span style={{ color: '#667788' }}> — {pair.difference} pts</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── SentimentHeatmap ── */

function SentimentHeatmap({ sentimentMap }) {
  if (!sentimentMap || Object.keys(sentimentMap).length === 0) {
    return (
      <div style={{ padding: 20, textAlign: 'center', color: '#667788', fontSize: 12 }}>
        No country sentiment data available.
      </div>
    );
  }

  const entries = Object.values(sentimentMap)
    .filter((e) => e && e.code)
    .sort((a, b) => (a.avgTone || 0) - (b.avgTone || 0));

  return (
    <div style={{ padding: '4px 0' }}>
      {/* Column headers */}
      <div style={{
        display: 'grid', gridTemplateColumns: '120px 1fr 60px 70px',
        gap: 8, padding: '6px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)',
        fontSize: 9, color: '#556677', textTransform: 'uppercase', letterSpacing: 0.5,
      }}>
        <span>Country</span>
        <span>Tone</span>
        <span style={{ textAlign: 'right' }}>Score</span>
        <span style={{ textAlign: 'right' }}>Sentiment</span>
      </div>

      {/* Country rows */}
      {entries.map((entry) => {
        const tone = entry.avgTone || 0;
        const color = toneColor(tone);
        const pct = ((tone + 10) / 20) * 100;

        return (
          <div key={entry.code} style={{
            display: 'grid', gridTemplateColumns: '120px 1fr 60px 70px',
            gap: 8, padding: '5px 14px', alignItems: 'center',
            borderBottom: '1px solid rgba(255,255,255,0.03)',
          }}>
            {/* Country name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                fontSize: 9, fontWeight: 700, color: '#556677', minWidth: 20,
              }}>
                {entry.code}
              </span>
              <span style={{ fontSize: 11, color: '#8899aa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {entry.name || countryName(entry.code)}
              </span>
            </div>

            {/* Mini tone bar */}
            <div style={{
              height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.04)', position: 'relative',
              overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1,
                background: 'rgba(255,255,255,0.08)',
              }} />
              {entry.articleCount > 0 && (
                <div style={{
                  position: 'absolute',
                  left: tone >= 0 ? '50%' : `${pct}%`,
                  width: `${(Math.abs(tone) / 20) * 100}%`,
                  top: 0, bottom: 0, borderRadius: 3,
                  background: color, opacity: 0.6,
                }} />
              )}
            </div>

            {/* Score */}
            <span style={{
              fontSize: 11, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
              color, textAlign: 'right',
            }}>
              {entry.articleCount > 0
                ? `${tone > 0 ? '+' : ''}${tone.toFixed(1)}`
                : '--'}
            </span>

            {/* Sentiment badge */}
            <div style={{ textAlign: 'right' }}>
              {entry.articleCount > 0
                ? <SentimentBadge sentiment={entry.sentiment} />
                : <span style={{ fontSize: 9, color: '#556677' }}>N/A</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Main Panel ── */

const TABS = ['Narratives', 'Divergence', 'Sentiment Map'];

export function NarrativePanel({ data, loading, onRefresh }) {
  const [activeTab, setActiveTab] = useState('Narratives');

  const narratives = data?.narratives || [];
  const divergences = data?.divergences || [];
  const sentimentMap = data?.sentimentMap || {};
  const summary = data?.summary || {};

  const sortedNarratives = useMemo(
    () => [...narratives].sort((a, b) => (b.articleCount || 0) - (a.articleCount || 0)),
    [narratives]
  );

  const tabCounts = useMemo(() => ({
    Narratives: narratives.length,
    Divergence: divergences.filter((d) => d.isDiverging).length,
    'Sentiment Map': Object.keys(sentimentMap).length,
  }), [narratives, divergences, sentimentMap]);

  // Loading state
  if (loading && !data) return <NarrativeSkeleton />;

  // Empty state
  if (!data) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: '#667788', fontSize: 12 }}>
        No narrative data available. Enable the panel to begin tracking.
      </div>
    );
  }

  return (
    <div className="narrative-panel">
      {/* ── Header ── */}
      <div style={{
        padding: '10px 14px', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 11, fontWeight: 700, letterSpacing: 1.2, color: '#8899aa',
            textTransform: 'uppercase',
          }}>
            Narrative &amp; Sentiment Tracking
          </span>
          {summary.totalArticles > 0 && (
            <span style={{
              fontSize: 8, padding: '2px 6px', borderRadius: 8, fontWeight: 700,
              background: 'rgba(34,197,94,0.15)', color: '#22c55e',
              border: '1px solid rgba(34,197,94,0.3)', textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}>
              LIVE
            </span>
          )}
          {loading && (
            <span style={{
              fontSize: 8, padding: '2px 6px', borderRadius: 8, fontWeight: 700,
              background: 'rgba(74,158,255,0.15)', color: '#4a9eff',
              border: '1px solid rgba(74,158,255,0.3)', textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}>
              UPDATING
            </span>
          )}
        </div>
        <button
          onClick={onRefresh}
          title="Refresh narrative data"
          style={{
            background: 'none', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 6, padding: '3px 8px', cursor: 'pointer',
            color: '#8899aa', fontSize: 13, lineHeight: 1,
          }}
        >
          {'\u21BB'}
        </button>
      </div>

      {/* ── How it works ── */}
      <div style={{
        padding: '8px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)',
        fontSize: 10, lineHeight: 1.5, color: '#667788',
        background: 'rgba(74,158,255,0.03)',
      }}>
        Tracks how 10 major geopolitical topics are covered across global media using the{' '}
        <strong style={{ color: '#8899aa' }}>GDELT Project</strong> (free, open data).{' '}
        <strong style={{ color: '#8899aa' }}>Tone</strong> measures article sentiment on a{' '}
        <span style={{ color: '#ef4444' }}>-10</span> (very negative) to{' '}
        <span style={{ color: '#22c55e' }}>+10</span> (very positive) scale.{' '}
        <strong style={{ color: '#8899aa' }}>Divergence</strong> flags when US, UK, Russia, China & India media
        report on the same topic with significantly different tones ({'>'}3 pts apart).
      </div>

      {/* ── Summary stats row ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        {[
          {
            value: summary.totalNarratives || 0,
            label: 'Topics Tracked',
            color: '#4a9eff',
          },
          {
            value: summary.avgGlobalTone != null
              ? `${summary.avgGlobalTone > 0 ? '+' : ''}${summary.avgGlobalTone.toFixed(1)}`
              : '--',
            label: 'Global Tone',
            color: toneColor(summary.avgGlobalTone || 0),
          },
          {
            value: summary.divergenceCount || 0,
            label: 'Divergences',
            color: summary.divergenceCount > 0 ? '#f59e0b' : '#8899aa',
          },
          {
            value: summary.totalArticles || 0,
            label: 'GDELT Articles',
            color: summary.totalArticles > 0 ? '#8899aa' : '#556677',
          },
        ].map((stat, idx) => (
          <div key={idx} style={{
            textAlign: 'center', padding: '10px 6px',
            borderRight: idx < 3 ? '1px solid rgba(255,255,255,0.04)' : 'none',
          }}>
            <div style={{
              fontSize: 18, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
              color: stat.color, lineHeight: 1.2,
            }}>
              {stat.value}
            </div>
            <div style={{
              fontSize: 9, color: '#556677', textTransform: 'uppercase',
              letterSpacing: 0.5, marginTop: 2,
            }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div style={{
        display: 'flex', gap: 4, padding: '8px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        overflowX: 'auto',
      }}>
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '4px 12px', borderRadius: 14, fontSize: 11, fontWeight: 600,
              cursor: 'pointer', border: 'none', whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
              background: activeTab === tab ? 'rgba(74,158,255,0.15)' : 'transparent',
              color: activeTab === tab ? '#4a9eff' : '#667788',
            }}
          >
            {tab}
            {tabCounts[tab] > 0 && (
              <span style={{ marginLeft: 4, fontSize: 9, opacity: 0.7 }}>
                ({tabCounts[tab]})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Narratives tab ── */}
      {activeTab === 'Narratives' && (
        <div>
          {sortedNarratives.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: '#667788', fontSize: 12 }}>
              No narrative data available yet. Data loads from GDELT on first open.
            </div>
          ) : (
            <>
              {/* Key explaining badges */}
              <div style={{
                padding: '6px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)',
                display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center',
                fontSize: 9, color: '#556677',
              }}>
                <span><span style={{ color: '#22c55e' }}>Positive</span> / <span style={{ color: '#ef4444' }}>Negative</span> / <span style={{ color: '#8899aa' }}>Neutral</span> = media tone</span>
                <span>{'\u2191'} Increasing {'\u2193'} Decreasing {'\u2194'} Stable = coverage momentum</span>
              </div>
              {sortedNarratives.map((n) => (
                <NarrativeCard key={n.id || n.topic} narrative={n} />
              ))}
            </>
          )}
        </div>
      )}

      {/* ── Divergence tab ── */}
      {activeTab === 'Divergence' && (
        <div>
          <div style={{
            padding: '6px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)',
            fontSize: 10, color: '#667788', lineHeight: 1.4,
          }}>
            Compares how the <strong style={{ color: '#8899aa' }}>same topic</strong> is reported
            by media from 5 major powers (US, UK, Russia, China, India). A{' '}
            <span style={{ color: '#f59e0b', fontWeight: 600 }}>DIVERGING</span> flag means tone
            differs by {'>'} 3 points — suggesting information warfare or fundamentally different framing.
          </div>
          {divergences.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: '#667788', fontSize: 12 }}>
              No divergence data available yet. Data loads from GDELT on first open.
            </div>
          ) : (
            divergences.map((d) => (
              <DivergenceCard key={d.id || d.topic} divergence={d} />
            ))
          )}
        </div>
      )}

      {/* ── Sentiment Map tab ── */}
      {activeTab === 'Sentiment Map' && (
        <div>
          <div style={{
            padding: '6px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)',
            fontSize: 10, color: '#667788', lineHeight: 1.4,
          }}>
            Average tone of news <strong style={{ color: '#8899aa' }}>originating from</strong> each
            country over the last 14 days. Negative tone doesn't mean bad news about the country —
            it reflects the overall sentiment of that country's media output.
          </div>
          <SentimentHeatmap sentimentMap={sentimentMap} />
        </div>
      )}

      {/* ── Footer ── */}
      <div style={{
        padding: '8px 14px', borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontSize: 9, color: '#556677', letterSpacing: 0.3,
      }}>
        <span>Data: GDELT Project (14-day window) — refreshes every 10 min</span>
        {data.updatedAt && <span>Updated {timeAgo(data.updatedAt)}</span>}
      </div>
    </div>
  );
}
