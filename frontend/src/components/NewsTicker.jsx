import { useState, useEffect, useMemo } from 'react';
import { timeAgoShort } from '../utils/time';

/**
 * NewsTicker — scrolling news bar similar to TV news tickers.
 * Uses the existing feed data (passed as prop) to display real headlines.
 */
export default function NewsTicker({ items = [], visible = true }) {
  const [offset, setOffset] = useState(0);

  // Cycle through items: pick the 30 most recent
  const headlines = useMemo(() => {
    if (!items || items.length === 0) return [];
    const sorted = [...items]
      .filter(i => i.title)
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
      .slice(0, 30);
    // Duplicate for seamless loop
    return [...sorted, ...sorted];
  }, [items]);

  if (!visible || headlines.length === 0) return null;

  return (
    <div className="news-ticker-bar">
      <div className="news-ticker-label">
        <span style={{
          display: 'inline-block',
          width: 6, height: 6, borderRadius: '50%',
          background: '#ff4444', marginRight: 6,
          boxShadow: '0 0 6px #ff4444',
          animation: 'pulse-live 2s ease-in-out infinite',
        }} />
        BREAKING
      </div>
      <div className="news-ticker-track">
        <div className="news-ticker-content">
          {headlines.map((item, idx) => (
            <span key={`${item.id || idx}-${idx}`} className="news-ticker-item">
              <span className="news-ticker-dot" />
              <a
                href={item.url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                title={item.title}
              >
                {item.sourceName && (
                  <span style={{ color: 'var(--color-accent)', fontWeight: 600, marginRight: 4 }}>
                    {item.sourceName}:
                  </span>
                )}
                {item.title}
                {item.publishedAt && (
                  <span style={{ color: 'var(--color-text-muted)', marginLeft: 6, fontSize: '10px' }}>
                    {timeAgoShort(item.publishedAt)}
                  </span>
                )}
              </a>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
