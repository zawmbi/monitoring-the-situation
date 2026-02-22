import { useState, useEffect, useMemo, useRef } from 'react';
import { timeAgoShort } from '../utils/time';

/**
 * NewsTicker — continuously scrolling news bar.
 * Uses JS-driven requestAnimationFrame for smooth, seamless looping.
 * Deduplicates stories by title and prioritises high-tier sources.
 */

const TIER1_DOMAINS = new Set([
  'reuters.com', 'apnews.com', 'afp.com', 'bbc.com', 'bbc.co.uk',
  'npr.org', 'pbs.org', 'economist.com', 'c-span.org', 'dw.com',
]);

function extractDomain(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; }
}

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function NewsTicker({ items = [], visible = true }) {
  const trackRef = useRef(null);
  const contentRef = useRef(null);
  const offsetRef = useRef(0);
  const rafRef = useRef(null);
  const [paused, setPaused] = useState(false);

  // Deduplicate by title (normalized), sort by date, prioritise major sources
  const headlines = useMemo(() => {
    if (!items || items.length === 0) return [];
    const seen = new Set();
    const deduped = [];
    for (const item of items) {
      if (!item.title) continue;
      const key = item.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 50);
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(item);
    }
    // Sort: tier-1 sources first, then by date
    deduped.sort((a, b) => {
      const aT1 = TIER1_DOMAINS.has(extractDomain(a.url || '')) ? 1 : 0;
      const bT1 = TIER1_DOMAINS.has(extractDomain(b.url || '')) ? 1 : 0;
      if (bT1 !== aT1) return bT1 - aT1;
      return new Date(b.publishedAt) - new Date(a.publishedAt);
    });
    return deduped.slice(0, 50);
  }, [items]);

  // Animate with rAF — self-contained effect to avoid stale closure issues
  useEffect(() => {
    if (!visible || headlines.length === 0 || paused) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      return;
    }
    let active = true;
    const tick = () => {
      if (!active || !contentRef.current) return;
      const halfWidth = contentRef.current.scrollWidth / 2;
      if (halfWidth > 0) {
        offsetRef.current -= prefersReducedMotion ? 0.3 : 1.2;
        if (offsetRef.current <= -halfWidth) offsetRef.current += halfWidth;
        contentRef.current.style.transform = `translateX(${offsetRef.current}px)`;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      active = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [visible, headlines.length, paused]);

  if (!visible || headlines.length === 0) return null;

  // Render two copies for seamless looping
  const renderItems = (suffix) =>
    headlines.map((item, idx) => {
      const isTier1 = TIER1_DOMAINS.has(extractDomain(item.url || ''));
      return (
        <span key={`${item.id || idx}-${suffix}-${idx}`} className="news-ticker-item">
          <span className="news-ticker-dot" />
          <a href={item.url || '#'} target="_blank" rel="noopener noreferrer" title={item.title}>
            {item.sourceName && (
              <span style={{
                color: isTier1 ? '#ff4444' : 'var(--color-accent)',
                fontWeight: 700,
                marginRight: 5,
                textTransform: 'uppercase',
                fontSize: '0.85em',
                letterSpacing: '0.05em',
              }}>
                {item.sourceName}
              </span>
            )}
            {item.title}
            {item.publishedAt && (
              <span style={{ color: 'var(--color-text-muted)', marginLeft: 8, fontSize: '0.8em', opacity: 0.7 }}>
                {timeAgoShort(item.publishedAt)}
              </span>
            )}
          </a>
        </span>
      );
    });

  return (
    <div
      className="news-ticker-bar"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="news-ticker-label">
        <span className="news-ticker-live-dot" />
        LIVE
      </div>
      <div ref={trackRef} className="news-ticker-track">
        <div ref={contentRef} className="news-ticker-content">
          {renderItems('a')}
          {renderItems('b')}
        </div>
      </div>
    </div>
  );
}
