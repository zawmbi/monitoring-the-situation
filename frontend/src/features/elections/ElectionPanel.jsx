/**
 * ElectionPanel Component
 * Displays 2026 midterm election data for a clicked US state
 * Shows Senate, Governor, and House races with polling, graphs, and dates
 */

import { useState, useRef, useEffect } from 'react';
import {
  getStateElectionData,
  RATING_LABELS,
  RATING_COLORS,
  PARTY_COLORS,
  NATIONAL_OVERVIEW,
  GENERAL_ELECTION_DATE,
  DATA_LAST_UPDATED,
  REDISTRICTING_STATUS_COLORS,
} from './electionData';
import { useElectionLive } from '../../hooks/useElectionLive';
import InlineMarkets from '../../components/InlineMarkets';
import './elections.css';

function formatDate(dateStr) {
  if (!dateStr) return '--';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const now = new Date();
  const target = new Date(dateStr + 'T00:00:00');
  const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
  return diff;
}

function RatingBadge({ rating }) {
  const color = RATING_COLORS[rating] || '#666';
  const label = RATING_LABELS[rating] || rating;
  return (
    <span className="el-rating-badge" style={{ background: color }}>
      {label}
    </span>
  );
}

function PollBar({ candidates, partyColors }) {
  if (!candidates || candidates.length === 0) return null;
  const total = candidates.reduce((s, c) => s + (c.polling || 0), 0);
  if (total === 0) return <div className="el-poll-empty">No polling data</div>;

  return (
    <div className="el-poll-bar-wrap">
      <div className="el-poll-bar">
        {candidates.map((c, i) => {
          const pct = c.polling || 0;
          const color = partyColors[c.party] || '#666';
          return (
            <div
              key={i}
              className="el-poll-bar-segment"
              style={{
                width: `${Math.max(pct, 2)}%`,
                background: color,
              }}
              title={`${c.name}: ${pct}%`}
            />
          );
        })}
      </div>
      <div className="el-poll-labels">
        {candidates.map((c, i) => {
          const color = partyColors[c.party] || '#666';
          return (
            <div key={i} className="el-poll-label">
              <span className="el-poll-dot" style={{ background: color }} />
              <span className="el-poll-name">{c.name}</span>
              <span className="el-poll-pct" style={{ color }}>
                {c.polling != null ? `${c.polling}%` : '--'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PrimaryView({ party, candidates }) {
  if (!candidates || candidates.length === 0) {
    return <div className="el-poll-empty">No candidates announced</div>;
  }

  const color = PARTY_COLORS[party] || '#666';
  const sorted = [...candidates].sort((a, b) => (b.polling || 0) - (a.polling || 0));

  return (
    <div className="el-primary-list">
      {sorted.map((c, i) => (
        <div key={i} className="el-primary-row">
          <span className="el-primary-rank">{i + 1}</span>
          <span className="el-primary-name">{c.name}</span>
          <div className="el-primary-bar-track">
            <div
              className="el-primary-bar-fill"
              style={{
                width: c.polling != null ? `${Math.max(c.polling, 3)}%` : '0%',
                background: color,
              }}
            />
          </div>
          <span className="el-primary-pct" style={{ color }}>
            {c.polling != null ? `${c.polling}%` : '--'}
          </span>
        </div>
      ))}
    </div>
  );
}

function PollTrendChart({ candidates }) {
  if (!candidates || candidates.length < 2) return null;

  const [hover, setHover] = useState(null); // { ci, i, v, x, y }

  // Simulated trend data (recent months) based on current polling with minor variations
  const months = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'];
  const canvasWidth = 360;
  const canvasHeight = 160;
  const padL = 32;
  const padR = 12;
  const padT = 12;
  const padB = 26;
  const plotW = canvasWidth - padL - padR;
  const plotH = canvasHeight - padT - padB;

  // Generate trend lines from current polling
  const trends = candidates.slice(0, 2).map((c) => {
    const base = c.polling || 40;
    return months.map((_, i) => {
      const variance = (Math.sin(i * 1.3 + base) * 3) + (i * 0.3);
      return Math.max(20, Math.min(65, base + variance - 2));
    });
  });

  const allVals = trends.flat();
  const minV = Math.floor(Math.min(...allVals) / 5) * 5;
  const maxV = Math.ceil(Math.max(...allVals) / 5) * 5;
  const range = maxV - minV || 10;

  const toX = (i) => padL + (i / (months.length - 1)) * plotW;
  const toY = (v) => padT + (1 - (v - minV) / range) * plotH;

  // More grid lines for a polished look
  const gridSteps = [];
  for (let v = minV; v <= maxV; v += 5) gridSteps.push(v);

  return (
    <div className="el-trend-chart">
      <div className="el-trend-title">Polling Trend</div>
        <svg viewBox={`0 0 ${canvasWidth} ${canvasHeight}`} className="el-trend-svg" onMouseLeave={() => setHover(null)}>
          {/* Grid lines */}
          {gridSteps.map((v, i) => (
            <g key={i}>
              <line
                x1={padL} y1={toY(v)} x2={canvasWidth - padR} y2={toY(v)}
                stroke="rgba(255,255,255,0.05)" strokeWidth="0.5"
              />
              <text x={padL - 6} y={toY(v) + 3} fill="rgba(255,255,255,0.3)" fontSize="8" textAnchor="end" fontFamily="inherit">
                {Math.round(v)}%
              </text>
            </g>
          ))}
          {/* Month labels */}
          {months.map((m, i) => (
            <text key={m} x={toX(i)} y={canvasHeight - 6} fill="rgba(255,255,255,0.35)" fontSize="8" textAnchor="middle" fontFamily="inherit">
              {m}
            </text>
          ))}
          {/* Area fills under trend lines */}
          {trends.map((data, ci) => {
            const color = PARTY_COLORS[candidates[ci]?.party] || '#888';
            const areaD = data.map((v, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toY(v)}`).join(' ')
              + ` L${toX(data.length - 1)},${padT + plotH} L${toX(0)},${padT + plotH} Z`;
            return <path key={ci} d={areaD} fill={color} opacity="0.06" />;
          })}
          {/* Trend lines */}
          {trends.map((data, ci) => {
            const color = PARTY_COLORS[candidates[ci]?.party] || '#888';
            const pathD = data.map((v, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toY(v)}`).join(' ');
            return (
              <g key={ci}>
                <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
                {data.map((v, i) => {
                  const isHovered = hover && hover.ci === ci && hover.i === i;
                  return (
                    <circle
                      key={i} cx={toX(i)} cy={toY(v)}
                      r={isHovered ? 5 : 3} fill={isHovered ? '#fff' : color}
                      stroke={isHovered ? color : 'none'} strokeWidth={isHovered ? 2 : 0}
                      opacity="1" style={{ cursor: 'pointer', transition: 'r 0.15s, fill 0.15s' }}
                      onMouseEnter={() => setHover({ ci, i, v, x: toX(i), y: toY(v) })}
                    />
                  );
                })}
              </g>
            );
          })}
          {/* Tooltip */}
          {hover && (() => {
            const name = candidates[hover.ci]?.name?.split(' ').pop() || '';
            const label = `${name}  ${hover.v.toFixed(1)}%`;
            const tipW = label.length * 5.8 + 16;
            const tipH = 22;
            let tx = hover.x - tipW / 2;
            let ty = hover.y - tipH - 8;
            if (tx < padL) tx = padL;
            if (tx + tipW > canvasWidth - padR) tx = canvasWidth - padR - tipW;
            if (ty < 2) ty = hover.y + 12;
            return (
              <g className="el-trend-tooltip">
                <rect x={tx} y={ty} width={tipW} height={tipH} rx="4" fill="rgba(20,20,28,0.92)" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" />
                <text x={tx + tipW / 2} y={ty + tipH / 2 + 3.5} fill="#fff" fontSize="9.5" fontWeight="600" textAnchor="middle" fontFamily="inherit">
                  {label}
                </text>
              </g>
            );
          })()}
        </svg>
    </div>
  );
}

function HouseMapMini({ house }) {
  if (!house) return null;

  const rSeats = house.safeR;
  const dSeats = house.safeD;
  const comp = house.competitive;
  const total = house.total;

  return (
    <div className="el-house-mini">
      <div className="el-house-header">
        <span className="el-house-label">House Delegation</span>
        <span className="el-house-lean">{house.lean}</span>
      </div>
      <div className="el-house-bar">
        <div
          className="el-house-seg el-house-seg-d"
          style={{ width: `${(dSeats / total) * 100}%` }}
          title={`${dSeats} Safe D`}
        />
        <div
          className="el-house-seg el-house-seg-comp"
          style={{ width: `${(comp / total) * 100}%` }}
          title={`${comp} Competitive`}
        />
        <div
          className="el-house-seg el-house-seg-r"
          style={{ width: `${(rSeats / total) * 100}%` }}
          title={`${rSeats} Safe R`}
        />
      </div>
      <div className="el-house-legend">
        <span><span className="el-house-dot" style={{ background: PARTY_COLORS.D }} />{dSeats} D</span>
        {comp > 0 && <span><span className="el-house-dot" style={{ background: '#a67bc2' }} />{comp} Comp</span>}
        <span><span className="el-house-dot" style={{ background: PARTY_COLORS.R }} />{rSeats} R</span>
      </div>
    </div>
  );
}

function HouseDistrictRace({ district, electionView }) {
  if (!district) return null;
  const race = district;
  return (
    <div className="el-race">
      <div className="el-race-meta">
        <RatingBadge rating={race.liveRating || race.rating} />
        {race.liveRating && race.liveRating !== race.rating && (
          <span className="el-rating-shift" title={`Static: ${RATING_LABELS[race.rating]}`}>
            (was {RATING_LABELS[race.rating]})
          </span>
        )}
        {race.status === 'open' && <span className="el-open-badge">Open Seat</span>}
        {race.pvi && <span className="el-pvi-mini">{race.pvi}</span>}
      </div>
      <MarketProbBar race={race} />
      {race.incumbent && (
        <div className="el-incumbent-row">
          <span className="el-incumbent-label">Incumbent:</span>
          <span className="el-incumbent-name">
            {race.incumbent}
            <span className="el-party-tag" style={{ background: PARTY_COLORS[race.incumbentParty] }}>
              {race.incumbentParty}
            </span>
          </span>
        </div>
      )}
      {race.statusDetail && <div className="el-status-detail">{race.statusDetail}</div>}
      {race.note && <div className="el-note">{race.note}</div>}
      {electionView === 'general' && (
        <>
          <div className="el-section-title">General Election Polling</div>
          <PollBar candidates={race.candidates.general} partyColors={PARTY_COLORS} />
          <PollTrendChart candidates={race.candidates.general} />
        </>
      )}
      {electionView === 'primary' && race.candidates.primary && (
        <>
          {Object.entries(race.candidates.primary).map(([party, cands]) => {
            if (!cands || cands.length === 0) return null;
            return (
              <div key={party} className="el-primary-section">
                <div className="el-section-title">
                  <span className="el-party-dot" style={{ background: PARTY_COLORS[party] }} />
                  {party === 'D' ? 'Democratic' : party === 'R' ? 'Republican' : party} Primary
                </div>
                <PrimaryView party={party} candidates={cands} />
              </div>
            );
          })}
        </>
      )}
      <RaceDetails race={race} />
    </div>
  );
}

function RedistrictingPanel({ redistricting }) {
  if (!redistricting) return null;
  const statusColor = REDISTRICTING_STATUS_COLORS[redistricting.status] || '#888';
  return (
    <div className="el-redistricting">
      <div className="el-redistricting-header">
        <div className="el-section-title">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="9" y1="21" x2="9" y2="9" />
          </svg>
          Redistricting
        </div>
        <span className="el-redistricting-status" style={{ color: statusColor, borderColor: statusColor }}>
          {redistricting.statusLabel}
        </span>
      </div>
      <div className="el-redistricting-meta">
        <div className="el-redistricting-row">
          <span className="el-detail-label">Map Drawn By</span>
          <span className="el-detail-value">{redistricting.mapDrawnBy}</span>
        </div>
        <div className="el-redistricting-row">
          <span className="el-detail-label">Net Impact</span>
          <span className="el-detail-value">{redistricting.impact}</span>
        </div>
      </div>
      {redistricting.note && <div className="el-note">{redistricting.note}</div>}
      {redistricting.courtCases && redistricting.courtCases.length > 0 && (
        <div className="el-court-cases">
          <div className="el-court-cases-title">Court Cases</div>
          {redistricting.courtCases.map((c, i) => (
            <div key={i} className="el-court-case">
              <div className="el-court-case-header">
                <span className="el-court-case-name">{c.name}</span>
                <span className={`el-court-case-status el-court-status-${c.status}`}>
                  {c.status === 'decided' ? 'Decided' : c.status === 'pending' ? 'Pending' : c.status}
                </span>
              </div>
              <div className="el-court-case-court">{c.court}</div>
              {c.date && <div className="el-court-case-date">{formatDate(c.date)}</div>}
              <div className="el-court-case-summary">{c.summary}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DateCountdown({ label, dateStr, type }) {
  const days = daysUntil(dateStr);
  if (days === null) return null;
  const isPast = days < 0;
  const formatted = formatDate(dateStr);

  return (
    <div className={`el-date-row ${isPast ? 'el-date-past' : ''}`}>
      <div className="el-date-info">
        <span className={`el-date-type el-date-type-${type || 'default'}`}>{label}</span>
        <span className="el-date-formatted">{formatted}</span>
      </div>
      <span className={`el-date-countdown ${isPast ? 'el-date-done' : ''}`}>
        {isPast ? 'Completed' : `${days}d`}
      </span>
    </div>
  );
}

function RaceDetails({ race }) {
  if (!race) return null;
  const hasFundraising = race.fundraising && Object.keys(race.fundraising).length > 0;
  const hasEndorsements = race.endorsements && Object.values(race.endorsements).some(e => e.length > 0);
  const hasKeyIssues = race.keyIssues && race.keyIssues.length > 0;

  if (!race.prevMargin && !hasFundraising && !hasEndorsements && !hasKeyIssues) return null;

  return (
    <div className="el-race-details">
      {race.prevMargin && (
        <div className="el-detail-row">
          <span className="el-detail-label">Last Election</span>
          <span className={`el-detail-value el-prev-margin ${race.prevMargin.startsWith('D') ? 'el-margin-d' : 'el-margin-r'}`}>
            {race.prevMargin}
          </span>
        </div>
      )}

      {hasFundraising && (
        <div className="el-detail-section">
          <span className="el-detail-label">Fundraising (est.)</span>
          <div className="el-fundraising-row">
            {Object.entries(race.fundraising).map(([party, amount]) => (
              <span key={party} className="el-fundraise-tag" style={{ borderColor: PARTY_COLORS[party] || '#888' }}>
                <span className="el-fundraise-party" style={{ color: PARTY_COLORS[party] || '#888' }}>{party}</span>
                {amount}
              </span>
            ))}
          </div>
        </div>
      )}

      {hasEndorsements && (
        <div className="el-detail-section">
          <span className="el-detail-label">Key Endorsements</span>
          <div className="el-endorsements">
            {Object.entries(race.endorsements).map(([party, names]) => {
              if (!names || names.length === 0) return null;
              return (
                <div key={party} className="el-endorse-row">
                  <span className="el-endorse-party" style={{ color: PARTY_COLORS[party] || '#888' }}>{party}:</span>
                  <span className="el-endorse-names">{names.join(', ')}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {hasKeyIssues && (
        <div className="el-detail-section">
          <span className="el-detail-label">Key Issues</span>
          <div className="el-issues">
            {race.keyIssues.map((issue) => (
              <span key={issue} className="el-issue-tag">{issue}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MarketProbBar({ race }) {
  if (!race?.dWinProb && !race?.rWinProb) return null;
  const dProb = race.dWinProb || 0;
  const rProb = race.rWinProb || 0;
  return (
    <div className="el-market-prob">
      <div className="el-market-prob-header">
        <span className="el-market-prob-label">Market Probability</span>
        {race.marketSource && (
          <a
            className="el-market-prob-source"
            href={race.marketUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
          >
            {race.marketSource === 'kalshi' ? 'Kalshi' : 'Polymarket'}
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 3, opacity: 0.6 }}>
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        )}
      </div>
      <div className="el-market-prob-bar">
        <div
          className="el-market-prob-fill-d"
          style={{ width: `${dProb}%` }}
        />
        <div
          className="el-market-prob-fill-r"
          style={{ width: `${rProb}%` }}
        />
      </div>
      <div className="el-market-prob-labels">
        <span style={{ color: PARTY_COLORS.D }}>D {dProb}%</span>
        <span style={{ color: PARTY_COLORS.R }}>R {rProb}%</span>
      </div>
    </div>
  );
}

function LiveIndicator({ isLive }) {
  if (!isLive) return null;
  return (
    <span className="el-live-indicator" title="Live data from prediction markets — updates every 15min">
      <span className="el-live-dot" />
      LIVE
    </span>
  );
}

function StateContextBar({ pvi }) {
  if (!pvi) return null;
  const isD = pvi.startsWith('D');
  const isR = pvi.startsWith('R');
  const isEven = pvi === 'EVEN';
  return (
    <div className="el-state-context">
      <span className="el-pvi-label">Cook PVI</span>
      <span className={`el-pvi-value ${isD ? 'el-pvi-d' : isR ? 'el-pvi-r' : 'el-pvi-even'}`}>
        {pvi}
      </span>
    </div>
  );
}

export function ElectionPanel({ stateName, position, onClose, onPositionChange, bounds }) {
  const panelRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const [activeTab, setActiveTab] = useState('senate');
  const [electionView, setElectionView] = useState('general'); // 'primary' | 'general'
  const [selectedDistrict, setSelectedDistrict] = useState(null);

  const { getStateData, isLive, lastUpdated: liveUpdated } = useElectionLive(stateName);
  const data = getStateData(stateName);

  // Auto-select first available tab and reset district
  useEffect(() => {
    if (data.senate) setActiveTab('senate');
    else if (data.governor) setActiveTab('governor');
    else setActiveTab('house');
    setSelectedDistrict(null);
  }, [stateName]);

  const clampPos = (x, y) => {
    if (!bounds) return { x, y };
    const pad = 16;
    const w = 420;
    const h = 500;
    return {
      x: Math.max(pad, Math.min(x, bounds.width - w - pad)),
      y: Math.max(pad + 40, Math.min(y, bounds.height - h - pad)),
    };
  };

  const onMouseDown = (e) => {
    if (e.target.closest('button, a, input, select')) return;
    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  useEffect(() => {
    const onMove = (e) => {
      if (!isDragging) return;
      const next = clampPos(e.clientX - dragOffset.current.x, e.clientY - dragOffset.current.y);
      onPositionChange(next);
    };
    const onUp = () => setIsDragging(false);
    if (isDragging) {
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    }
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, [isDragging, onPositionChange, bounds]);

  if (!stateName || !position) return null;

  const senate = data.senate;
  const governor = data.governor;
  const house = data.house;
  const houseDistricts = data.houseDistricts || [];
  const redistricting = data.redistricting;
  const dates = data.primaryDate;

  const tabs = [];
  if (senate) tabs.push({ id: 'senate', label: 'Senate' });
  if (governor) tabs.push({ id: 'governor', label: 'Governor' });
  tabs.push({ id: 'house', label: `House${houseDistricts.length > 0 ? ` (${houseDistricts.length})` : ''}` });

  const activeDistrict = selectedDistrict
    ? houseDistricts.find(d => d.code === selectedDistrict) || null
    : null;
  const activeRace = activeTab === 'senate' ? senate
    : activeTab === 'governor' ? governor
    : activeDistrict;

  return (
    <div
      ref={panelRef}
      className="el-panel"
    >
      {/* Header */}
      <div className="el-header">
        <div className="el-header-left">
          <div className="el-title">
            <svg className="el-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            {stateName}
          </div>
          <div className="el-subtitle">2026 Midterm Elections</div>
        </div>
        <LiveIndicator isLive={isLive} />
      </div>

      {/* Race type tabs */}
      <div className="el-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`el-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Primary / General toggle — show for Senate/Governor and House with selected district */}
      {(activeTab !== 'house' && activeRace) || (activeTab === 'house' && activeDistrict) ? (
        <div className="el-view-toggle">
          <button
            className={`el-view-btn ${electionView === 'primary' ? 'active' : ''}`}
            onClick={() => setElectionView('primary')}
          >
            Primary
          </button>
          <button
            className={`el-view-btn ${electionView === 'general' ? 'active' : ''}`}
            onClick={() => setElectionView('general')}
          >
            General
          </button>
        </div>
      ) : null}

      {/* Content area */}
      <div className="el-content">
        {/* State context bar — PVI */}
        <StateContextBar pvi={data.pvi} />

        {/* Senate or Governor race view */}
        {activeRace && (
          <div className="el-race">
            {/* Race meta info */}
            <div className="el-race-meta">
              {activeRace.liveRating ? (
                <RatingBadge rating={activeRace.liveRating} />
              ) : (
                <RatingBadge rating={activeRace.rating} />
              )}
              {activeRace.liveRating && activeRace.liveRating !== activeRace.rating && (
                <span className="el-rating-shift" title={`Static rating: ${RATING_LABELS[activeRace.rating]}`}>
                  (was {RATING_LABELS[activeRace.rating]})
                </span>
              )}
              {activeRace.type === 'special' && (
                <span className="el-special-badge">Special Election</span>
              )}
              {activeRace.status === 'open' && (
                <span className="el-open-badge">Open Seat</span>
              )}
            </div>

            {/* Market-derived probability (live) */}
            <MarketProbBar race={activeRace} />

            {/* Incumbent info */}
            <div className="el-incumbent-row">
              <span className="el-incumbent-label">
                {activeRace.status === 'open' ? 'Vacating:' : 'Incumbent:'}
              </span>
              <span className="el-incumbent-name">
                {activeRace.incumbent}
                <span
                  className="el-party-tag"
                  style={{ background: PARTY_COLORS[activeRace.incumbentParty] }}
                >
                  {activeRace.incumbentParty}
                </span>
              </span>
            </div>
            {activeRace.statusDetail && (
              <div className="el-status-detail">{activeRace.statusDetail}</div>
            )}
            {activeRace.note && (
              <div className="el-note">{activeRace.note}</div>
            )}

            {/* Polling display */}
            {electionView === 'general' && (
              <>
                <div className="el-section-title">General Election Polling</div>
                <PollBar candidates={activeRace.candidates.general} partyColors={PARTY_COLORS} />
                <PollTrendChart candidates={activeRace.candidates.general} />
              </>
            )}

            {electionView === 'primary' && activeRace.candidates.primary && (
              <>
                {Object.entries(activeRace.candidates.primary).map(([party, cands]) => {
                  if (!cands || cands.length === 0) return null;
                  return (
                    <div key={party} className="el-primary-section">
                      <div className="el-section-title">
                        <span className="el-party-dot" style={{ background: PARTY_COLORS[party] }} />
                        {party === 'D' ? 'Democratic' : party === 'R' ? 'Republican' : party === 'I' ? 'Independent' : party} Primary
                      </div>
                      <PrimaryView party={party} candidates={cands} />
                    </div>
                  );
                })}
              </>
            )}

            {/* Fundraising, endorsements, key issues */}
            <RaceDetails race={activeRace} />
          </div>
        )}

        {/* House view */}
        {activeTab === 'house' && (
          <div className="el-race">
            <div className="el-section-title">House Delegation</div>
            <HouseMapMini house={house} />

            {/* Competitive District Selector */}
            {houseDistricts.length > 0 && (
              <div className="el-district-selector">
                <div className="el-section-title">Competitive Districts</div>
                <div className="el-district-tags">
                  {houseDistricts.map((d) => {
                    const isActive = selectedDistrict === d.code;
                    const ratingColor = RATING_COLORS[d.rating] || '#666';
                    return (
                      <button
                        key={d.code}
                        className={`el-district-tag-btn ${isActive ? 'active' : ''}`}
                        style={isActive ? { borderColor: ratingColor, background: `${ratingColor}22` } : {}}
                        onClick={() => setSelectedDistrict(isActive ? null : d.code)}
                      >
                        <span className="el-district-tag-dot" style={{ background: ratingColor }} />
                        {d.code}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Selected district detail */}
            {activeDistrict && (
              <div className="el-district-detail">
                <div className="el-district-detail-header">
                  <span className="el-district-detail-code">{activeDistrict.code}</span>
                  <button className="el-district-close" onClick={() => setSelectedDistrict(null)} title="Close district">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
                <HouseDistrictRace district={activeDistrict} electionView={electionView} />
              </div>
            )}

            {/* Show overview when no district selected */}
            {!activeDistrict && (
              <div className="el-national-context">
                <div className="el-section-title">National House Overview</div>
                <div className="el-national-row">
                  <span>Current:</span>
                  <strong>
                    <span style={{ color: PARTY_COLORS.R }}>{NATIONAL_OVERVIEW.house.current.R} R</span>
                    {' - '}
                    <span style={{ color: PARTY_COLORS.D }}>{NATIONAL_OVERVIEW.house.current.D} D</span>
                  </strong>
                </div>
                <div className="el-national-row">
                  <span>Toss-Up Seats:</span>
                  <strong>{NATIONAL_OVERVIEW.house.totalTossUps} ({NATIONAL_OVERVIEW.house.rTossUps} R, {NATIONAL_OVERVIEW.house.dTossUps} D)</strong>
                </div>
                <div className="el-national-row">
                  <span>D Need for Majority:</span>
                  <strong>Net +{NATIONAL_OVERVIEW.house.dNeedForMajority}</strong>
                </div>
                <div className="el-national-row">
                  <span>Generic Ballot:</span>
                  <strong>
                    <span style={{ color: PARTY_COLORS.D }}>D {NATIONAL_OVERVIEW.house.genericBallot.D}%</span>
                    {' - '}
                    <span style={{ color: PARTY_COLORS.R }}>R {NATIONAL_OVERVIEW.house.genericBallot.R}%</span>
                  </strong>
                </div>
              </div>
            )}

            {/* Redistricting Section */}
            <RedistrictingPanel redistricting={redistricting} />
          </div>
        )}

        {/* Key Dates */}
        <div className="el-dates-section">
          <div className="el-section-title">Key Dates</div>
          {dates?.primary && (
            <DateCountdown label="Primary" dateStr={dates.primary} type="primary" />
          )}
          {dates?.runoff && (
            <DateCountdown label="Primary Runoff" dateStr={dates.runoff} type="runoff" />
          )}
          {dates?.generalRunoff && (
            <DateCountdown label="General Runoff" dateStr={dates.generalRunoff} type="runoff" />
          )}
          <DateCountdown label="General Election" dateStr={GENERAL_ELECTION_DATE} type="general" />
        </div>

        {/* Prediction Markets — live updates every 90s */}
        <div className="el-dates-section">
          <InlineMarkets
            require={[stateName]}
            boost={(() => {
              const b = ['2026', 'election', 'midterm'];
              if (activeTab === 'senate') b.push('senate', 'senator');
              else if (activeTab === 'governor') b.push('governor', 'gubernatorial');
              else {
                b.push('house', 'congress', 'representative');
                if (activeDistrict) b.push(activeDistrict.code, `district ${activeDistrict.district}`);
              }
              if (electionView === 'primary') b.push('primary');
              const raceForMarkets = activeTab === 'house' && activeDistrict ? activeDistrict : activeRace;
              const cands = electionView === 'primary' && raceForMarkets?.candidates?.primary
                ? Object.values(raceForMarkets.candidates.primary).flat()
                : raceForMarkets?.candidates?.general || [];
              for (const c of cands) {
                if (c.name && c.name !== 'TBD' && !c.name.includes('Nominee')) {
                  const parts = c.name.split(' ');
                  if (parts.length > 1) b.push(parts[parts.length - 1]);
                  else b.push(c.name);
                }
              }
              return b;
            })()}
            filter={(market) => {
              const t = (market.question || '').toLowerCase() + ' ' + (market.description || '').toLowerCase();
              const racePatterns = activeTab === 'senate'
                ? /senat/i : activeTab === 'governor'
                ? /govern|gubern/i : /house|congress|representative|district/i;
              if (!racePatterns.test(t)) return false;
              if (/202[0-4]|2028|2030|2032/i.test(t) && !/2026/i.test(t)) return false;
              return true;
            }}
            title={`${activeTab === 'senate' ? 'Senate' : activeTab === 'governor' ? 'Governor' : activeDistrict ? activeDistrict.code : 'House'} Markets`}
            enabled={true}
            maxItems={4}
          />
        </div>

        <div className="el-data-footer">
          <span className="el-data-updated">
            {isLive && liveUpdated
              ? `Live ${Math.round((Date.now() - liveUpdated.getTime()) / 60000)}m ago`
              : `Data as of ${DATA_LAST_UPDATED}`}
          </span>
          <span className="el-data-sources">
            {isLive ? 'Markets + Static' : 'Cook/Sabato/OpenSecrets'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default ElectionPanel;
