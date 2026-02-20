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
          {race.dWinProb != null ? (
            <>
              {race.marketOutcomes && race.marketOutcomes.length > 0 && (
                <MarketOutcomes
                  outcomes={race.marketOutcomes}
                  marketSource={race.marketSource}
                  marketUrl={race.marketUrl}
                />
              )}
            </>
          ) : (
            <>
              <div className="el-section-title el-static-label">
                General Election (Estimated)
                <span className="el-static-badge">NO LIVE DATA</span>
              </div>
              <PollBar candidates={race.candidates.general} partyColors={PARTY_COLORS} />
            </>
          )}
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
                  {!race.dWinProb && <span className="el-static-badge">EST</span>}
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

function FECCandidateList({ candidates }) {
  if (!candidates || candidates.length === 0) return null;

  return (
    <div className="el-fec-candidates">
      <div className="el-section-title">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
        FEC Candidates &amp; Fundraising
        <span className="el-live-micro">LIVE</span>
      </div>
      <div className="el-fec-list">
        {candidates.slice(0, 8).map((c, i) => {
          const color = PARTY_COLORS[c.party] || '#888';
          return (
            <div key={i} className="el-fec-row">
              <div className="el-fec-name-row">
                <span className="el-fec-rank">{i + 1}</span>
                <span className="el-party-tag" style={{ background: color }}>{c.party}</span>
                <span className="el-fec-name">{c.name}</span>
                {c.incumbentChallenge === 'I' && <span className="el-fec-incumbent">INC</span>}
              </div>
              <div className="el-fec-money-row">
                {c.totalRaisedFormatted && (
                  <span className="el-fec-money" title="Total raised">
                    <span className="el-fec-money-label">Raised</span>
                    {c.totalRaisedFormatted}
                  </span>
                )}
                {c.cashOnHandFormatted && (
                  <span className="el-fec-money" title="Cash on hand">
                    <span className="el-fec-money-label">Cash</span>
                    {c.cashOnHandFormatted}
                  </span>
                )}
                {c.disbursementsFormatted && (
                  <span className="el-fec-money" title="Total spent">
                    <span className="el-fec-money-label">Spent</span>
                    {c.disbursementsFormatted}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MarketOutcomes({ outcomes, marketSource, marketUrl }) {
  if (!outcomes || outcomes.length === 0) return null;

  // Only show if we have named outcomes (not just Yes/No)
  const meaningful = outcomes.filter(o => o.name && o.name !== 'Yes' && o.name !== 'No' && o.price != null);
  if (meaningful.length === 0) return null;

  return (
    <div className="el-market-outcomes">
      <div className="el-section-title">
        Market Odds by Candidate
        <span className="el-live-micro">LIVE</span>
      </div>
      <div className="el-market-outcomes-list">
        {meaningful.slice(0, 6).map((o, i) => {
          const pct = o.price != null ? Math.round(o.price) : 0;
          // Try to infer party from name
          const name = o.name || '';
          const isD = /democrat|dem\b|blue|harris|fetterman|warnock|kelly|ossoff/i.test(name);
          const isR = /republican|rep\b|gop|red|trump|paxton|cornyn|desantis/i.test(name);
          const color = isD ? PARTY_COLORS.D : isR ? PARTY_COLORS.R : '#a67bc2';

          return (
            <div key={i} className="el-market-outcome-row">
              <span className="el-market-outcome-name">{name}</span>
              <div className="el-market-outcome-bar-track">
                <div
                  className="el-market-outcome-bar-fill"
                  style={{ width: `${Math.max(pct, 3)}%`, background: color }}
                />
              </div>
              <span className="el-market-outcome-pct" style={{ color }}>{pct}%</span>
            </div>
          );
        })}
      </div>
      {marketSource && (
        <div className="el-market-outcomes-source">
          via {marketSource === 'kalshi' ? 'Kalshi' : marketSource === 'predictit' ? 'PredictIt' : 'Polymarket'}
        </div>
      )}
    </div>
  );
}

function RaceDetails({ race }) {
  if (!race) return null;
  const hasLiveFundraising = race.liveFundraising && Object.keys(race.liveFundraising).length > 0;
  const hasFundraising = race.fundraising && Object.keys(race.fundraising).length > 0;
  const hasEndorsements = race.endorsements && Object.values(race.endorsements).some(e => e.length > 0);
  const hasKeyIssues = race.keyIssues && race.keyIssues.length > 0;

  if (!race.prevMargin && !hasFundraising && !hasLiveFundraising && !hasEndorsements && !hasKeyIssues) return null;

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

      {/* Show live FEC fundraising when available, else fall back to static estimates */}
      {hasLiveFundraising ? (
        <div className="el-detail-section">
          <span className="el-detail-label">
            Fundraising
            <span className="el-live-micro">FEC LIVE</span>
          </span>
          <div className="el-fundraising-row">
            {Object.entries(race.liveFundraising).map(([party, amount]) => (
              <span key={party} className="el-fundraise-tag el-fundraise-live" style={{ borderColor: PARTY_COLORS[party] || '#888' }}>
                <span className="el-fundraise-party" style={{ color: PARTY_COLORS[party] || '#888' }}>{party}</span>
                {amount}
              </span>
            ))}
          </div>
        </div>
      ) : hasFundraising ? (
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
      ) : null}

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

function ConfidenceBadge({ confidence }) {
  if (!confidence) return null;
  const colors = {
    'high': '#2d8a4e',
    'medium-high': '#5a9e3f',
    'medium': '#b8860b',
    'low': '#b85c00',
    'prior-only': '#888',
  };
  const labels = {
    'high': 'High',
    'medium-high': 'Med-High',
    'medium': 'Medium',
    'low': 'Low',
    'prior-only': 'Prior Only',
  };
  return (
    <span
      className="el-confidence-badge"
      style={{ color: colors[confidence] || '#888' }}
      title={`Model confidence: ${confidence} — based on ${confidence === 'high' ? '4' : confidence === 'medium-high' ? '3' : confidence === 'medium' ? '2' : '1'} data source(s)`}
    >
      {labels[confidence] || confidence}
    </span>
  );
}

function SignalBreakdown({ breakdown, signalCount }) {
  if (!breakdown || signalCount <= 1) return null;
  const signalLabels = {
    markets: 'Markets',
    polling: 'Polls',
    fundamentals: 'PVI',
    metaculus: 'Metaculus',
  };
  return (
    <div className="el-signal-breakdown">
      {Object.entries(breakdown).map(([key, prob]) => (
        <span key={key} className="el-signal-chip" title={`${signalLabels[key] || key}: ${Math.round(prob * 100)}% D`}>
          {signalLabels[key] || key} {Math.round(prob * 100)}%
        </span>
      ))}
    </div>
  );
}

function MarketProbBar({ race }) {
  if (!race?.dWinProb && !race?.rWinProb) return null;
  const dProb = race.dWinProb || 0;
  const rProb = race.rWinProb || 0;
  const hasModel = race.signalCount > 0;
  return (
    <div className="el-market-prob">
      <div className="el-market-prob-header">
        <span className="el-market-prob-label">
          {hasModel ? 'Ensemble Forecast' : 'Market Probability'}
        </span>
        <span className="el-market-prob-meta">
          {race.confidence && <ConfidenceBadge confidence={race.confidence} />}
          {race.marketSource && (
            <a
              className="el-market-prob-source"
              href={race.marketUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
            >
              {race.marketSource}
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 3, opacity: 0.6 }}>
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          )}
        </span>
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
        {race.pollingMargin != null && (
          <span className="el-polling-margin" title={`Polling average: D${race.pollingMargin > 0 ? '+' : ''}${race.pollingMargin} (${race.pollCount} polls)`}>
            Polls D{race.pollingMargin > 0 ? '+' : ''}{race.pollingMargin}
          </span>
        )}
        <span style={{ color: PARTY_COLORS.R }}>R {rProb}%</span>
      </div>
      <SignalBreakdown breakdown={race.breakdown} signalCount={race.signalCount} />
    </div>
  );
}

function LiveIndicator({ isLive, marketCount, model }) {
  if (!isLive) return null;
  const sourceCount = model?.sources
    ? Object.values(model.sources).filter(v => v > 0).length
    : 0;
  const title = model
    ? `Ensemble model: ${model.stats?.totalRaces || 0} races from ${sourceCount} data sources — updates every 5min`
    : `Live data from ${marketCount || 0} prediction markets — updates every 5min`;
  return (
    <span className="el-live-indicator" title={title}>
      <span className="el-live-dot" />
      LIVE
      {model && <span className="el-live-count" title="Data sources">{sourceCount}src</span>}
      {!model && marketCount > 0 && <span className="el-live-count">{marketCount}</span>}
    </span>
  );
}

function SuperPACPanel({ expenditures }) {
  if (!expenditures || expenditures.expenditureCount === 0) return null;

  return (
    <div className="el-superpac">
      <div className="el-superpac-header">
        <div className="el-section-title">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
          Outside Spending (Super PACs)
        </div>
        <span className="el-superpac-total">{expenditures.totalOutsideSpending}</span>
      </div>

      {/* Party spending breakdown */}
      {expenditures.byParty && (
        <div className="el-superpac-parties">
          {expenditures.byParty.D && (expenditures.byParty.D.supportSpending || expenditures.byParty.D.opposeSpending) && (
            <div className="el-superpac-party-row">
              <span className="el-superpac-party-label" style={{ color: PARTY_COLORS.D }}>D</span>
              <div className="el-superpac-party-amounts">
                {expenditures.byParty.D.supportSpending && (
                  <span className="el-superpac-for">
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                    {expenditures.byParty.D.supportSpending}
                  </span>
                )}
                {expenditures.byParty.D.opposeSpending && (
                  <span className="el-superpac-against">
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    {expenditures.byParty.D.opposeSpending}
                  </span>
                )}
              </div>
            </div>
          )}
          {expenditures.byParty.R && (expenditures.byParty.R.supportSpending || expenditures.byParty.R.opposeSpending) && (
            <div className="el-superpac-party-row">
              <span className="el-superpac-party-label" style={{ color: PARTY_COLORS.R }}>R</span>
              <div className="el-superpac-party-amounts">
                {expenditures.byParty.R.supportSpending && (
                  <span className="el-superpac-for">
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                    {expenditures.byParty.R.supportSpending}
                  </span>
                )}
                {expenditures.byParty.R.opposeSpending && (
                  <span className="el-superpac-against">
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    {expenditures.byParty.R.opposeSpending}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Top spending committees */}
      {expenditures.topCommittees && expenditures.topCommittees.length > 0 && (
        <div className="el-superpac-committees">
          <div className="el-superpac-committees-title">Top Spenders</div>
          {expenditures.topCommittees.slice(0, 5).map((c, i) => (
            <div key={i} className="el-superpac-committee">
              <span className="el-superpac-committee-name">{c.committee}</span>
              <span className="el-superpac-committee-amount">{c.formattedTotal}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function UpcomingElections({ elections }) {
  if (!elections || elections.length === 0) return null;

  // Show only future elections
  const now = new Date();
  const upcoming = elections.filter(e => {
    if (!e.electionDay) return false;
    return new Date(e.electionDay + 'T00:00:00') >= now;
  }).slice(0, 5);

  if (upcoming.length === 0) return null;

  return (
    <div className="el-upcoming-elections">
      <div className="el-section-title">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        Upcoming Elections (Google Civic)
      </div>
      {upcoming.map((e, i) => (
        <div key={i} className="el-upcoming-election-row">
          <span className="el-upcoming-election-name">{e.name}</span>
          <span className="el-upcoming-election-date">{formatDate(e.electionDay)}</span>
        </div>
      ))}
    </div>
  );
}

function VoterInfoLookup() {
  const [address, setAddress] = useState('');
  const [voterInfo, setVoterInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const lookup = async () => {
    if (!address.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(`/api/civic/voterinfo?address=${encodeURIComponent(address.trim())}`);
      const data = await resp.json();
      if (data.success && data.data) {
        setVoterInfo(data.data);
      } else {
        setError(data.error || 'No info found');
        setVoterInfo(null);
      }
    } catch {
      setError('Lookup failed');
      setVoterInfo(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="el-voter-lookup">
      <div className="el-section-title">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        Polling Place Lookup
      </div>
      <div className="el-voter-lookup-input-row">
        <input
          className="el-voter-lookup-input"
          type="text"
          placeholder="Enter your address..."
          value={address}
          onChange={e => setAddress(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && lookup()}
        />
        <button className="el-voter-lookup-btn" onClick={lookup} disabled={loading || !address.trim()}>
          {loading ? '...' : 'Look Up'}
        </button>
      </div>

      {error && <div className="el-voter-lookup-error">{error}</div>}

      {voterInfo && (
        <div className="el-voter-results">
          {/* Polling locations */}
          {voterInfo.pollingLocations && voterInfo.pollingLocations.length > 0 && (
            <div className="el-voter-section">
              <div className="el-voter-section-title">Polling Places</div>
              {voterInfo.pollingLocations.map((loc, i) => (
                <div key={i} className="el-voter-location">
                  <span className="el-voter-location-name">{loc.name}</span>
                  <span className="el-voter-location-addr">{loc.address}</span>
                  {loc.hours && <span className="el-voter-location-hours">{loc.hours}</span>}
                </div>
              ))}
            </div>
          )}

          {/* Early vote sites */}
          {voterInfo.earlyVoteSites && voterInfo.earlyVoteSites.length > 0 && (
            <div className="el-voter-section">
              <div className="el-voter-section-title">Early Voting</div>
              {voterInfo.earlyVoteSites.map((loc, i) => (
                <div key={i} className="el-voter-location">
                  <span className="el-voter-location-name">{loc.name}</span>
                  <span className="el-voter-location-addr">{loc.address}</span>
                  {loc.hours && <span className="el-voter-location-hours">{loc.hours}</span>}
                </div>
              ))}
            </div>
          )}

          {/* Drop-off locations */}
          {voterInfo.dropOffLocations && voterInfo.dropOffLocations.length > 0 && (
            <div className="el-voter-section">
              <div className="el-voter-section-title">Drop-off Locations</div>
              {voterInfo.dropOffLocations.map((loc, i) => (
                <div key={i} className="el-voter-location">
                  <span className="el-voter-location-name">{loc.name}</span>
                  <span className="el-voter-location-addr">{loc.address}</span>
                </div>
              ))}
            </div>
          )}

          {/* Contests on ballot */}
          {voterInfo.contests && voterInfo.contests.length > 0 && (
            <div className="el-voter-section">
              <div className="el-voter-section-title">Ballot Contests</div>
              {voterInfo.contests.slice(0, 8).map((c, i) => (
                <div key={i} className="el-voter-contest">
                  <span className="el-voter-contest-office">
                    {c.referendumTitle || c.office || c.type}
                  </span>
                  {c.candidates && c.candidates.length > 0 && (
                    <div className="el-voter-contest-candidates">
                      {c.candidates.map((cand, j) => (
                        <span key={j} className="el-voter-contest-candidate">
                          {cand.name}
                          {cand.party && <span className="el-voter-contest-party"> ({cand.party})</span>}
                        </span>
                      ))}
                    </div>
                  )}
                  {c.referendumText && (
                    <span className="el-voter-contest-ref-text">{c.referendumText}</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* State election links */}
          {voterInfo.state && voterInfo.state.length > 0 && voterInfo.state[0].electionInfoUrl && (
            <div className="el-voter-links">
              {voterInfo.state[0].electionInfoUrl && (
                <a href={voterInfo.state[0].electionInfoUrl} target="_blank" rel="noopener noreferrer" className="el-voter-link">
                  Election Info
                </a>
              )}
              {voterInfo.state[0].electionRegistrationUrl && (
                <a href={voterInfo.state[0].electionRegistrationUrl} target="_blank" rel="noopener noreferrer" className="el-voter-link">
                  Register to Vote
                </a>
              )}
              {voterInfo.state[0].absenteeVotingInfoUrl && (
                <a href={voterInfo.state[0].absenteeVotingInfoUrl} target="_blank" rel="noopener noreferrer" className="el-voter-link">
                  Absentee Voting
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </div>
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

function LivePolls({ polls, maxPolls = 5 }) {
  if (!polls || polls.length === 0) return null;

  return (
    <div className="el-live-polls">
      <div className="el-section-title">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
        Latest Polls
        <span className="el-live-micro">LIVE</span>
      </div>
      {polls.slice(0, maxPolls).map((poll, i) => {
        const total = poll.candidates.reduce((s, c) => s + c.pct, 0);
        return (
          <div key={i} className="el-live-poll-entry">
            <div className="el-live-poll-meta">
              <span className="el-live-poll-pollster">{poll.pollster}</span>
              {poll.date && <span className="el-live-poll-date">{poll.date}</span>}
              {poll.sampleSize && <span className="el-live-poll-sample">n={poll.sampleSize}</span>}
            </div>
            <div className="el-poll-bar">
              {poll.candidates.map((c, j) => {
                const color = PARTY_COLORS[c.party] || '#888';
                const w = total > 0 ? (c.pct / total) * 100 : 50;
                return (
                  <div
                    key={j}
                    className="el-poll-bar-segment"
                    style={{ width: `${Math.max(w, 3)}%`, background: color }}
                    title={`${c.name} (${c.party}): ${c.pct}%`}
                  />
                );
              })}
            </div>
            <div className="el-poll-labels">
              {poll.candidates.map((c, j) => {
                const color = PARTY_COLORS[c.party] || '#888';
                return (
                  <div key={j} className="el-poll-label">
                    <span className="el-poll-dot" style={{ background: color }} />
                    <span className="el-poll-name">{c.name}</span>
                    <span className="el-poll-pct" style={{ color }}>{c.pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      <div className="el-live-polls-attr">via Wikipedia / public polls</div>
    </div>
  );
}

function GenericBallotBanner({ genericBallot }) {
  if (!genericBallot?.average) return null;
  const avg = genericBallot.average;
  // VoteHub uses "Democrat"/"Republican" as choice names
  const dPct = avg.Democrat ?? avg.D ?? avg.Dem ?? null;
  const rPct = avg.Republican ?? avg.R ?? avg.Rep ?? null;
  if (dPct == null && rPct == null) return null;

  return (
    <div className="el-generic-ballot">
      <div className="el-gb-header">
        <span className="el-gb-title">2026 Generic Ballot</span>
        <span className="el-live-micro">LIVE</span>
      </div>
      <div className="el-gb-bar">
        {dPct != null && (
          <div className="el-gb-seg" style={{ width: `${dPct}%`, background: PARTY_COLORS.D }} />
        )}
        {rPct != null && (
          <div className="el-gb-seg" style={{ width: `${rPct}%`, background: PARTY_COLORS.R }} />
        )}
      </div>
      <div className="el-gb-labels">
        {dPct != null && <span style={{ color: PARTY_COLORS.D }}>D {dPct}%</span>}
        {rPct != null && <span style={{ color: PARTY_COLORS.R }}>R {rPct}%</span>}
      </div>
      <div className="el-live-polls-attr">via VoteHub</div>
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

  const { getStateData, isLive, lastUpdated: liveUpdated, fetchStateNews } = useElectionLive(stateName);
  const data = getStateData(stateName);
  const [stateNews, setStateNews] = useState(null);
  const [newsLoading, setNewsLoading] = useState(false);

  // Auto-select first available tab and reset district
  useEffect(() => {
    if (data.senate) setActiveTab('senate');
    else if (data.governor) setActiveTab('governor');
    else setActiveTab('house');
    setSelectedDistrict(null);
    setStateNews(null);
  }, [stateName]);

  // Fetch state news when news tab is activated
  useEffect(() => {
    if (activeTab === 'news' && !stateNews && !newsLoading && fetchStateNews) {
      setNewsLoading(true);
      fetchStateNews(stateName).then(news => {
        setStateNews(news);
        setNewsLoading(false);
      });
    }
  }, [activeTab, stateName, stateNews, newsLoading, fetchStateNews]);

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
  const independentExpenditures = data.independentExpenditures || null;
  const upcomingElections = data.upcomingElections || [];

  const tabs = [];
  if (senate) tabs.push({ id: 'senate', label: 'Senate' });
  if (governor) tabs.push({ id: 'governor', label: 'Governor' });
  tabs.push({ id: 'house', label: `House${houseDistricts.length > 0 ? ` (${houseDistricts.length})` : ''}` });
  tabs.push({ id: 'news', label: 'News' });
  tabs.push({ id: 'info', label: 'Info' });

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
        <LiveIndicator isLive={isLive} marketCount={data.live?.marketCount} model={data.live?.model} />
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

            {/* Polling / Market data display */}
            {electionView === 'general' && (
              <>
                {/* Live Wikipedia polls — primary data source */}
                {activeRace.liveGeneralPolls && activeRace.liveGeneralPolls.length > 0 && (
                  <LivePolls polls={activeRace.liveGeneralPolls} maxPolls={5} />
                )}

                {/* Market probabilities */}
                {activeRace.dWinProb != null && (
                  <>
                    {activeRace.marketOutcomes && activeRace.marketOutcomes.length > 0 && (
                      <MarketOutcomes
                        outcomes={activeRace.marketOutcomes}
                        marketSource={activeRace.marketSource}
                        marketUrl={activeRace.marketUrl}
                      />
                    )}
                  </>
                )}

                {/* Fallback: static estimates only when no live data at all */}
                {!activeRace.liveGeneralPolls?.length && activeRace.dWinProb == null && (
                  <>
                    <div className="el-section-title el-static-label">
                      General Election (Estimated)
                      <span className="el-static-badge">NO LIVE DATA</span>
                    </div>
                    <PollBar candidates={activeRace.candidates.general} partyColors={PARTY_COLORS} />
                  </>
                )}
              </>
            )}

            {electionView === 'primary' && activeRace.candidates.primary && (
              <>
                {/* Live primary polls from Wikipedia */}
                {activeRace.livePrimaryPolls && activeRace.livePrimaryPolls.length > 0 && (
                  <LivePolls polls={activeRace.livePrimaryPolls} maxPolls={5} />
                )}

                {/* Static primary data as fallback */}
                {(!activeRace.livePrimaryPolls || activeRace.livePrimaryPolls.length === 0) &&
                  Object.entries(activeRace.candidates.primary).map(([party, cands]) => {
                    if (!cands || cands.length === 0) return null;
                    return (
                      <div key={party} className="el-primary-section">
                        <div className="el-section-title">
                          <span className="el-party-dot" style={{ background: PARTY_COLORS[party] }} />
                          {party === 'D' ? 'Democratic' : party === 'R' ? 'Republican' : party === 'I' ? 'Independent' : party} Primary
                          <span className="el-static-badge">EST</span>
                        </div>
                        <PrimaryView party={party} candidates={cands} />
                      </div>
                    );
                  })
                }
              </>
            )}

            {/* Fundraising, endorsements, key issues */}
            <RaceDetails race={activeRace} />

            {/* FEC registered candidates + real fundraising */}
            {activeTab === 'senate' && data.fecCandidates && data.fecCandidates.length > 0 && (
              <FECCandidateList candidates={data.fecCandidates} />
            )}

            {/* Super PAC spending — Senate only */}
            {activeTab === 'senate' && independentExpenditures && (
              <SuperPACPanel expenditures={independentExpenditures} />
            )}
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
                {data.genericBallot?.average ? (
                  <GenericBallotBanner genericBallot={data.genericBallot} />
                ) : (
                  <div className="el-national-row">
                    <span>Generic Ballot:</span>
                    <strong>
                      <span style={{ color: PARTY_COLORS.D }}>D {NATIONAL_OVERVIEW.house.genericBallot.D}%</span>
                      {' - '}
                      <span style={{ color: PARTY_COLORS.R }}>R {NATIONAL_OVERVIEW.house.genericBallot.R}%</span>
                    </strong>
                    <span className="el-static-badge" style={{ marginLeft: 6 }}>EST</span>
                  </div>
                )}
              </div>
            )}

            {/* Redistricting Section */}
            <RedistrictingPanel redistricting={redistricting} />
          </div>
        )}

        {/* Info tab — voter lookup, upcoming elections, data sources */}
        {activeTab === 'info' && (
          <div className="el-race">
            <UpcomingElections elections={upcomingElections} />
            <VoterInfoLookup />

            <div className="el-info-sources">
              <div className="el-section-title">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                Data Sources
              </div>
              <div className="el-info-source-list">
                <div className="el-info-source-row">
                  <span className="el-info-source-name">Wikipedia Polls</span>
                  <span className="el-info-source-desc">Senate race polling tables (live)</span>
                </div>
                <div className="el-info-source-row">
                  <span className="el-info-source-name">VoteHub</span>
                  <span className="el-info-source-desc">Generic ballot &amp; approval (live)</span>
                </div>
                <div className="el-info-source-row">
                  <span className="el-info-source-name">Prediction Markets</span>
                  <span className="el-info-source-desc">Polymarket + Kalshi + PredictIt (live)</span>
                </div>
                <div className="el-info-source-row">
                  <span className="el-info-source-name">FEC OpenData</span>
                  <span className="el-info-source-desc">Candidates, fundraising, super PACs</span>
                </div>
                {data.live?.civicConfigured && (
                  <div className="el-info-source-row">
                    <span className="el-info-source-name">Google Civic</span>
                    <span className="el-info-source-desc">Elections, polling places, ballot info</span>
                  </div>
                )}
                <div className="el-info-source-row">
                  <span className="el-info-source-name">GDELT Project</span>
                  <span className="el-info-source-desc">Election news &amp; media tone (live)</span>
                </div>
                <div className="el-info-source-row">
                  <span className="el-info-source-name">Congress.gov</span>
                  <span className="el-info-source-desc">Bills, votes, legislative tracking</span>
                </div>
                <div className="el-info-source-row">
                  <span className="el-info-source-name">Cook/Sabato</span>
                  <span className="el-info-source-desc">Race ratings, PVI (static)</span>
                </div>
                <div className="el-info-source-row">
                  <span className="el-info-source-name">OpenSecrets</span>
                  <span className="el-info-source-desc">Fundraising estimates (static)</span>
                </div>
              </div>
              <div className="el-info-api-status">
                <span className="el-info-api-item">
                  <span className={`el-info-api-dot ${isLive ? 'el-info-api-on' : ''}`} />
                  Markets: {isLive ? 'Connected' : 'Offline'}
                </span>
                <span className="el-info-api-item">
                  <span className={`el-info-api-dot ${data.live?.fecConfigured ? 'el-info-api-on' : ''}`} />
                  FEC: {data.live?.fecConfigured ? 'Connected' : 'Demo Key'}
                </span>
                <span className="el-info-api-item">
                  <span className={`el-info-api-dot ${data.live?.civicConfigured ? 'el-info-api-on' : ''}`} />
                  Civic: {data.live?.civicConfigured ? 'Connected' : 'Not configured'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* News Tab Content */}
        {activeTab === 'news' && (
          <div className="el-news-section">
            <div className="el-section-title">
              Election Coverage
              <span className="el-news-live-tag">GDELT LIVE</span>
            </div>
            {newsLoading && (
              <div className="el-news-loading">Loading election news...</div>
            )}
            {stateNews && stateNews.articles && stateNews.articles.length > 0 ? (
              <>
                {stateNews.tone && (
                  <div className="el-news-tone-bar">
                    <span className="el-news-tone-label">Media Tone</span>
                    <span className={`el-news-tone-val ${stateNews.tone.avgTone > 0.5 ? 'positive' : stateNews.tone.avgTone < -0.5 ? 'negative' : 'neutral'}`}>
                      {stateNews.tone.avgTone > 0 ? '+' : ''}{stateNews.tone.avgTone}
                    </span>
                    <span className="el-news-tone-trend">
                      {stateNews.tone.trend === 'improving' ? '\u2191' : stateNews.tone.trend === 'declining' ? '\u2193' : '\u2192'} {stateNews.tone.trend}
                    </span>
                  </div>
                )}
                <div className="el-news-list">
                  {stateNews.articles.map((article, i) => (
                    <a
                      key={i}
                      className="el-news-article"
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <div className="el-news-article-title">{article.title}</div>
                      <div className="el-news-article-meta">
                        {article.source && <span className="el-news-article-source">{article.source}</span>}
                        {article.date && <span className="el-news-article-date">{article.date}</span>}
                        {article.sourceCountry && (
                          <span className="el-news-article-date">{article.sourceCountry}</span>
                        )}
                      </div>
                    </a>
                  ))}
                </div>
                <div className="el-news-footer">
                  {stateNews.articleCount} articles from GDELT (14-day window)
                </div>
              </>
            ) : (!newsLoading && (
              <div className="el-news-empty">
                No recent election news found for {stateName}.
                <br />Coverage increases as primaries approach.
              </div>
            ))}
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

        {/* Prediction Markets — live updates every 90s (not on info tab) */}
        {activeTab !== 'info' && <div className="el-dates-section">
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
        </div>}

        <div className="el-data-footer">
          <span className="el-data-updated">
            {isLive && liveUpdated
              ? `Live ${Math.round((Date.now() - liveUpdated.getTime()) / 60000)}m ago`
              : `Data as of ${DATA_LAST_UPDATED}`}
          </span>
          <span className="el-data-sources">
            {isLive ? 'Polymarket + Kalshi + PredictIt + FEC + GDELT' : 'Cook/Sabato/OpenSecrets'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default ElectionPanel;
