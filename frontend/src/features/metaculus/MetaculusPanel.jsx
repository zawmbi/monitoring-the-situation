import { useState, useEffect } from 'react';

export function MetaculusPanel({ onRefresh }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch('/api/metaculus');
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (err) { console.error('[MetaculusPanel]', err); }
    finally { setLoading(false); }
  }

  if (loading && !data) return <div className="panel-loading">Loading Metaculus forecasts...</div>;
  if (!data) return <div className="panel-empty">No forecast data available</div>;

  function probColor(p) {
    if (p === null) return '#888';
    if (p >= 0.8) return '#ff4444';
    if (p >= 0.6) return '#ff8c00';
    if (p >= 0.4) return '#ffd700';
    if (p >= 0.2) return '#4ecdc4';
    return '#4a9eff';
  }

  return (
    <div className="metaculus-panel">
      <div className="mc-summary">
        <div className="mc-stat"><span className="mc-stat-value">{data.summary?.totalQuestions || 0}</span><span className="mc-stat-label">Questions</span></div>
        <div className="mc-stat"><span className="mc-stat-value">{data.summary?.avgForecasters || 0}</span><span className="mc-stat-label">Avg Forecasters</span></div>
        <div className="mc-stat"><span className="mc-stat-value" style={{ color: '#ff6b6b' }}>{data.summary?.highProbability || 0}</span><span className="mc-stat-label">&gt;70% Likely</span></div>
        <div className="mc-stat"><span className="mc-stat-value" style={{ color: '#4ecdc4' }}>{data.summary?.lowProbability || 0}</span><span className="mc-stat-label">&lt;30% Likely</span></div>
      </div>

      <div className="mc-list">
        {(data.questions || []).map(q => (
          <a key={q.id} className="mc-question" href={q.url} target="_blank" rel="noopener noreferrer">
            <div className="mc-q-header">
              <span className="mc-q-prob" style={{ color: probColor(q.communityPrediction) }}>
                {q.communityPrediction !== null ? `${Math.round(q.communityPrediction * 100)}%` : '—'}
              </span>
              <span className="mc-q-forecasters">{q.numForecasters} forecasters</span>
            </div>
            <div className="mc-q-title">{q.title}</div>
            {q.communityPrediction !== null && (
              <div className="mc-q-bar">
                <div className="mc-q-bar-fill" style={{
                  width: `${q.communityPrediction * 100}%`,
                  background: probColor(q.communityPrediction),
                }} />
              </div>
            )}
          </a>
        ))}
      </div>
    </div>
  );
}
