import { useState, useEffect } from 'react';

export function ArbitragePanel({ onRefresh }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch('/api/arbitrage');
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (err) { console.error('[ArbitragePanel]', err); }
    finally { setLoading(false); }
  }

  if (loading && !data) return <div className="panel-loading">Scanning for arbitrage...</div>;
  if (!data) return <div className="panel-empty">No arbitrage data available</div>;

  return (
    <div className="arbitrage-panel">
      <div className="arb-summary">
        <div className="arb-stat"><span className="arb-stat-value">{data.summary?.divergencesFound || 0}</span><span className="arb-stat-label">Divergences</span></div>
        <div className="arb-stat"><span className="arb-stat-value">{data.summary?.avgDivergence || 0}%</span><span className="arb-stat-label">Avg Spread</span></div>
        <div className="arb-stat"><span className="arb-stat-value" style={{ color: '#ffd700' }}>{data.summary?.maxDivergence || 0}%</span><span className="arb-stat-label">Max Spread</span></div>
      </div>

      <div className="arb-header-row">
        <span>Polymarket vs Kalshi Odds Divergence</span>
        <button className="dp-refresh-btn" onClick={() => { fetchData(); onRefresh?.(); }} title="Refresh">↻</button>
      </div>

      <div className="arb-list">
        {(data.opportunities || []).map((opp, i) => (
          <div key={i} className="arb-opp">
            <div className="arb-opp-title">{opp.polymarket.title}</div>
            <div className="arb-opp-comparison">
              <div className="arb-opp-source">
                <span className="arb-opp-platform">Polymarket</span>
                <span className="arb-opp-prob">{Math.round(opp.polymarket.probability * 100)}%</span>
              </div>
              <div className="arb-opp-vs">
                <span className="arb-opp-spread" style={{ color: opp.divergencePct >= 10 ? '#ff4444' : '#ffd700' }}>
                  {opp.divergencePct}%
                </span>
                <span className="arb-opp-direction">{opp.direction}</span>
              </div>
              <div className="arb-opp-source">
                <span className="arb-opp-platform">Kalshi</span>
                <span className="arb-opp-prob">{Math.round(opp.kalshi.probability * 100)}%</span>
              </div>
            </div>
            <div className="arb-opp-bars">
              <div className="arb-bar-pm">
                <div className="arb-bar-fill" style={{ width: `${opp.polymarket.probability * 100}%`, background: '#5b5bf7' }} />
              </div>
              <div className="arb-bar-km">
                <div className="arb-bar-fill" style={{ width: `${opp.kalshi.probability * 100}%`, background: '#ff8c00' }} />
              </div>
            </div>
          </div>
        ))}
        {(!data.opportunities || data.opportunities.length === 0) && (
          <div className="arb-empty">No significant divergences found</div>
        )}
      </div>
    </div>
  );
}
