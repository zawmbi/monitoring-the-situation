import { useState, useEffect, useMemo } from 'react';
import { api } from './services/api';
import { ComposableMap, Geographies, Geography, Marker, Sphere, Graticule, ZoomableGroup, Line } from 'react-simple-maps';
import { feature } from 'topojson-client';
import { geoCentroid } from 'd3-geo';
import worldData from 'world-atlas/countries-110m.json';
import usData from 'us-atlas/states-10m.json';

// Safe guard in case topojson fails to load
const GEO_FEATURES = worldData?.objects?.countries
  ? feature(worldData, worldData.objects.countries).features
  : [];
const US_STATE_FEATURES = usData?.objects?.states
  ? feature(usData, usData.objects.states).features
  : [];

// Build marker list for every country and US state
const COUNTRY_MARKERS = GEO_FEATURES.map((geo, idx) => {
  const [lon, lat] = geoCentroid(geo);
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null;
  return {
    id: geo.id || `country-${idx}`,
    name: geo.properties?.name || `Country ${idx}`,
    lon,
    lat,
    match: (geo.properties?.name || '').toLowerCase(),
    scope: 'country',
  };
}).filter(Boolean);

const STATE_MARKERS = US_STATE_FEATURES.map((geo, idx) => {
  const [lon, lat] = geoCentroid(geo);
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null;
  return {
    id: `us-${geo.id || idx}`,
    name: geo.properties?.name || `State ${idx}`,
    lon,
    lat,
    match: (geo.properties?.name || '').toLowerCase(),
    scope: 'state',
  };
}).filter(Boolean);

const GEO_MARKERS = [...COUNTRY_MARKERS, ...STATE_MARKERS];

function DraggablePanel({ id, initial, width, height = 'auto', resizable = true, children }) {
  const [pos, setPos] = useState(initial);
  const [size, setSize] = useState({ width, height });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const startRef = useState({ startX: 0, startY: 0, origX: 0, origY: 0, origW: 0, origH: 0 })[0];

  useEffect(() => {
    const onMove = (e) => {
      if (isDragging) {
        const dx = e.clientX - startRef.startX;
        const dy = e.clientY - startRef.startY;
        setPos({ x: startRef.origX + dx, y: startRef.origY + dy });
      }
      if (isResizing) {
        const dx = e.clientX - startRef.startX;
        const dy = e.clientY - startRef.startY;
        const newWidth = Math.max(260, startRef.origW + dx);
        const newHeight = Math.max(200, startRef.origH + dy);
        setSize({ width: newWidth, height: newHeight });
      }
    };
    const onUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    if (isDragging || isResizing) {
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    }
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [isDragging, startRef]);

  const onPointerDown = (e) => {
    e.preventDefault();
    startRef.startX = e.clientX;
    startRef.startY = e.clientY;
    startRef.origX = pos.x;
    startRef.origY = pos.y;
    startRef.origW = typeof size.width === 'number' ? size.width : 400;
    startRef.origH = typeof size.height === 'number' ? size.height : 320;
    setIsDragging(true);
  };

  const onResizeDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    startRef.startX = e.clientX;
    startRef.startY = e.clientY;
    startRef.origW = typeof size.width === 'number' ? size.width : 400;
    startRef.origH = typeof size.height === 'number' ? size.height : 320;
    setIsResizing(true);
  };

  return (
    <div
      className="draggable-panel"
      style={{ left: pos.x, top: pos.y, width: size.width, height: size.height }}
      data-id={id}
      data-resizable={resizable}
    >
      <div className={`panel-handle ${isDragging ? 'dragging' : ''}`} onPointerDown={onPointerDown}>
        <span className="drag-dots">⋮⋮</span> Drag to move
      </div>
      {children}
      {resizable && <div className="panel-resizer" onPointerDown={onResizeDown}>⇲</div>}
    </div>
  );
}

function deriveHotspots(items) {
  const buckets = GEO_MARKERS.map(marker => ({ ...marker, items: [] }));

  items.forEach(item => {
    const text = `${item.title || ''} ${item.summary || ''} ${item.content || ''} ${item.sourceName || ''} ${item.source || ''}`.toLowerCase();
    buckets.forEach(bucket => {
      if (bucket.match && text.includes(bucket.match)) {
        bucket.items.push(item);
      }
    });
  });

  return buckets
    .filter(bucket => bucket.items.length > 0)
    .map(bucket => {
      const byType = {};
      bucket.items.forEach(entry => {
        byType[entry.contentType] = (byType[entry.contentType] || 0) + 1;
      });
      return {
        ...bucket,
        count: bucket.items.length,
        byType,
        items: bucket.items.slice(0, 30),
        summary: buildSummary(bucket.name, bucket.items, byType),
      };
    })
    .sort((a, b) => b.count - a.count);
}

function buildSummary(name, items, byType) {
  if (!items.length) return 'No live signals here yet.';
  const topTypes = Object.entries(byType).sort((a, b) => b[1] - a[1]).map(([type]) => type);
  const headlines = items.slice(0, 3).map(item => item.title).filter(Boolean).join(' • ');
  return `Activity spike in ${name} led by ${topTypes.join(', ')} sources. Headlines: ${headlines || 'Multiple updates rolling in.'}`;
}

// Format relative time
function timeAgo(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function buildStats(items) {
  const byType = {};
  items.forEach(item => {
    byType[item.contentType] = (byType[item.contentType] || 0) + 1;
  });
  return {
    totalItems: items.length,
    byType,
    lastUpdated: items[0]?.publishedAt || null,
  };
}

function getDemoFeed() {
  const now = Date.now();
  const minutes = n => new Date(now - n * 60 * 1000).toISOString();
  return [
    {
      id: 'demo-1',
      title: 'Global markets react to unexpected rate cut',
      content: 'Central banks across Europe and the US signal coordinated policy shifts.',
      summary: 'Investors rush to reprice risk as central banks blink.',
      url: 'https://example.com/markets',
      source: 'demo',
      sourceName: 'Demo Wire',
      contentType: 'article',
      publishedAt: minutes(24),
    },
    {
      id: 'demo-2',
      title: 'Major outage hits social platforms across North America',
      content: 'Users report widespread login failures and API instability.',
      summary: 'Engineers triage cascading failures in core auth service.',
      url: 'https://example.com/outage',
      source: 'demo',
      sourceName: 'Status Pulse',
      contentType: 'article',
      publishedAt: minutes(42),
    },
    {
      id: 'demo-3',
      title: 'Rapid escalation in Middle East ceasefire talks',
      content: 'Delegations converge as mediators push for 48-hour pause.',
      summary: 'Regional sources cite optimism but warn of fragile trust.',
      url: 'https://example.com/ceasefire',
      source: 'demo',
      sourceName: 'Briefing Desk',
      contentType: 'article',
      publishedAt: minutes(12),
    },
    {
      id: 'demo-4',
      title: 'New AI model claims state-of-the-art reasoning',
      content: 'Researchers from Tokyo release benchmarks challenging US labs.',
      summary: 'Model touted as more data-efficient; details pending peer review.',
      url: 'https://example.com/aimodel',
      source: 'demo',
      sourceName: 'Research Note',
      contentType: 'article',
      publishedAt: minutes(7),
    },
    {
      id: 'demo-5',
      title: 'Tweet: Coordinated protests erupt in multiple EU capitals',
      content: 'Live threads sharing ground footage from Berlin, Paris, Madrid.',
      url: 'https://twitter.com/demo/status/1',
      source: 'demo',
      sourceName: 'Twitter',
      contentType: 'tweet',
      author: '@livefeed',
      publishedAt: minutes(5),
    },
    {
      id: 'demo-6',
      title: 'Reddit: Witnessing the outage from Toronto, anyone else?',
      content: 'Users describing login loops and 500s.',
      url: 'https://reddit.com/r/demo/1',
      source: 'demo',
      sourceName: 'Reddit',
      contentType: 'reddit_post',
      author: 'canuck-tech',
      publishedAt: minutes(18),
    },
  ];
}

// Feed item component
function FeedItem({ item }) {
  const hasImage = item.imageUrl && !item.imageUrl.includes('self') && item.contentType === 'article';
  return (
    <article className="feed-item">
      <div className="feed-item-header">
        {item.authorAvatarUrl ? (
          <img src={item.authorAvatarUrl} alt="" className="feed-item-avatar" />
        ) : (
          <div className="feed-item-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 600, color: '#71717a' }}>
            {(item.sourceName || item.source || '?')[0].toUpperCase()}
          </div>
        )}
        <div className="feed-item-meta">
          <div className="feed-item-author">
            {item.author || item.sourceName || 'Unknown'}
            {item.authorHandle && <span className="feed-item-handle">{item.authorHandle}</span>}
          </div>
          <div className="feed-item-source">
            <span className={`source-badge ${item.contentType}`}>
              {item.contentType === 'tweet' ? 'Twitter' : item.contentType === 'reddit_post' ? 'Reddit' : 'Article'}
            </span>
            <span>{item.sourceName}</span>
          </div>
        </div>
      </div>

      {item.title && (
        <h3 className="feed-item-title">
          <a href={item.url} target="_blank" rel="noopener noreferrer">
            {item.title}
          </a>
        </h3>
      )}

      {(item.content || item.summary) && <p className="feed-item-content">{item.content || item.summary}</p>}

      {hasImage && (
        <img
          src={item.imageUrl}
          alt=""
          className="feed-item-image"
          loading="lazy"
          onError={(e) => (e.target.style.display = 'none')}
        />
      )}

      <div className="feed-item-footer">
        {item.likesCount > 0 && (
          <span className="feed-item-stat">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            {item.likesCount.toLocaleString()}
          </span>
        )}
        {item.retweetsCount > 0 && (
          <span className="feed-item-stat">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 1l4 4-4 4" />
              <path d="M3 11V9a4 4 0 0 1 4-4h14" />
              <path d="M7 23l-4-4 4-4" />
              <path d="M21 13v2a4 4 0 0 1-4 4H3" />
            </svg>
            {item.retweetsCount.toLocaleString()}
          </span>
        )}
        {item.repliesCount > 0 && (
          <span className="feed-item-stat">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            {item.repliesCount.toLocaleString()}
          </span>
        )}
        <span className="feed-item-time">{timeAgo(item.publishedAt)}</span>
      </div>
    </article>
  );
}

function App() {
  const demoFeed = getDemoFeed();
  const [feed, setFeed] = useState(demoFeed);
  const [activeFilters, setActiveFilters] = useState(['all']);
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [selectedHotspotId, setSelectedHotspotId] = useState(null);
  const flightPaths = useMemo(
    () => [
      // Transatlantic
      { id: 'flight-nyc-lon', from: [-74.006, 40.7128], to: [0.1276, 51.5074] },
      { id: 'flight-nyc-par', from: [-74.006, 40.7128], to: [2.3522, 48.8566] },
      { id: 'flight-bos-dub', from: [-71.0589, 42.3601], to: [-6.2603, 53.3498] },
      // Transpacific
      { id: 'flight-sfo-tok', from: [-122.4194, 37.7749], to: [139.6917, 35.6895] },
      { id: 'flight-lax-syd', from: [-118.4085, 33.9416], to: [151.2093, -33.8688] },
      { id: 'flight-hkg-sfo', from: [114.1694, 22.3193], to: [-122.4194, 37.7749] },
      // Middle East to US/EU
      { id: 'flight-dxb-nyc', from: [55.2708, 25.2048], to: [-74.006, 40.7128] },
      { id: 'flight-doh-lhr', from: [51.531, 25.2854], to: [0.1276, 51.5074] },
      // Europe intra + to Asia
      { id: 'flight-par-ber', from: [2.3522, 48.8566], to: [13.405, 52.52] },
      { id: 'flight-fra-del', from: [8.6821, 50.1109], to: [77.1025, 28.7041] },
      { id: 'flight-lhr-cpt', from: [0.1276, 51.5074], to: [18.4241, -33.9249] },
      // Americas
      { id: 'flight-jfk-lax', from: [-73.7781, 40.6413], to: [-118.4085, 33.9416] },
      { id: 'flight-mia-gru', from: [-80.1918, 25.7617], to: [-46.6333, -23.5505] },
      { id: 'flight-mex-yyz', from: [-99.1332, 19.4326], to: [-79.3832, 43.6532] },
      // Africa/Asia
      { id: 'flight-nbo-dxb', from: [36.8219, -1.2921], to: [55.2708, 25.2048] },
      { id: 'flight-jnb-sin', from: [28.0473, -26.2041], to: [103.8198, 1.3521] },
      // SE Asia / Oceania
      { id: 'flight-sin-syd', from: [103.8198, 1.3521], to: [151.2093, -33.8688] },
      { id: 'flight-sin-hkg', from: [103.8198, 1.3521], to: [114.1694, 22.3193] },
    ],
    []
  );

  // Load feed data
  const loadFeed = async () => {
    try {
      const [feedRes, statsRes] = await Promise.all([api.getFeed({ limit: 80 }), api.getStats()]);
      const nextFeed = feedRes.data || [];
      if (nextFeed.length) {
        setFeed(nextFeed);
        setIsDemoMode(false);
      }
    } catch (error) {
      console.error('Failed to load feed, staying in demo mode:', error);
      setFeed(demoFeed);
      setIsDemoMode(true);
    }
  };

  useEffect(() => {
    loadFeed();
    const interval = setInterval(loadFeed, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, []);

  // Filter logic
  const toggleFilter = (filter) => {
    if (filter === 'all') {
      setActiveFilters(['all']);
    } else {
      const newFilters = activeFilters.includes('all')
        ? [filter]
        : activeFilters.includes(filter)
          ? activeFilters.filter((f) => f !== filter)
          : [...activeFilters, filter];
      setActiveFilters(newFilters.length === 0 ? ['all'] : newFilters);
    }
  };

  const filteredFeed = activeFilters.includes('all')
    ? feed
    : feed.filter((item) => {
        if (activeFilters.includes('twitter') && item.contentType === 'tweet') return true;
        if (activeFilters.includes('reddit') && item.contentType === 'reddit_post') return true;
        if (activeFilters.includes('news') && item.contentType === 'article') return true;
        // Future toggles (rumors, flights) can map to their own contentType when available
        return false;
      });

  const countryColor = (name) => {
    if (!name) return '#111216';
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 35%, 18%)`;
  };

  const hotspots = useMemo(() => deriveHotspots(feed), [feed]);
  const selectedHotspot = useMemo(
    () => hotspots.find((h) => h.id === selectedHotspotId) || hotspots[0],
    [hotspots, selectedHotspotId]
  );
  const flightsEnabled = activeFilters.includes('flights');

  useEffect(() => {
    if (hotspots.length && !selectedHotspotId) {
      setSelectedHotspotId(hotspots[0].id);
    }
  }, [hotspots, selectedHotspotId]);

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <div className="logo-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1m2 13a2 2 0 0 1-2-2V7m2 13a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2" />
              </svg>
            </div>
            Monitored
          </div>
        </div>
      </header>

      <main className="main">
        {isDemoMode && (
          <div className="notice">
            Live API not reachable right now — showing demo data so visuals stay lit.
          </div>
        )}

        <section className="map-section">
          <div className="map-card full-map">
            <div className="map-heading">
              <div>
                <p className="map-kicker">Global Signal Map</p>
                <h2>Where the conversation is heating up</h2>
                <p className="map-subtitle">Hotspots scale by how often a country or U.S. state is mentioned across headlines, tweets, and Reddit threads. Click any pulse to inspect the stories.</p>
              </div>
              <div className="map-legend">
                <div className="legend-row"><span className="legend-dot legend-low"></span> Emerging</div>
                <div className="legend-row"><span className="legend-dot legend-mid"></span> Active</div>
                <div className="legend-row"><span className="legend-dot legend-peak"></span> Surging</div>
              </div>
            </div>

            <div className="map-wrapper">
              <ComposableMap projection="geoEqualEarth">
                <ZoomableGroup>
                  <Sphere stroke="rgba(255,255,255,0.06)" strokeWidth={1} fill="rgba(255,255,255,0.01)" />
                  <Graticule stroke="rgba(255,255,255,0.04)" strokeWidth={0.5} />

                  <Geographies geography={{ type: 'FeatureCollection', features: GEO_FEATURES }}>
                    {({ geographies }) =>
                      geographies.map((geo) => (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          style={{
                            default: { fill: countryColor(geo.properties.name), outline: 'none', stroke: '#1f2937', strokeWidth: 0.25 },
                            hover: { fill: '#1b2334', outline: 'none' },
                            pressed: { fill: '#1b2334', outline: 'none' },
                          }}
                        />
                      ))
                    }
                  </Geographies>

                  {US_STATE_FEATURES.length > 0 && (
                    <Geographies geography={{ type: 'FeatureCollection', features: US_STATE_FEATURES }}>
                      {({ geographies }) =>
                        geographies.map((geo) => (
                          <Geography
                            key={geo.rsmKey}
                            geography={geo}
                            style={{
                              default: { fill: 'transparent', stroke: 'rgba(255,255,255,0.08)', strokeWidth: 0.6 },
                              hover: { fill: 'rgba(255,255,255,0.04)', stroke: 'rgba(255,255,255,0.12)', strokeWidth: 0.8 },
                              pressed: { fill: 'rgba(255,255,255,0.04)', stroke: 'rgba(255,255,255,0.12)', strokeWidth: 0.8 },
                            }}
                          />
                        ))
                      }
                    </Geographies>
                  )}

                  {hotspots.map((hotspot) => {
                    const maxCount = hotspots[0]?.count || 1;
                    const intensity = Math.max(0.2, hotspot.count / maxCount);
                    const size = 6 + intensity * 12;
                    return (
                      <Marker key={hotspot.id} coordinates={[hotspot.lon, hotspot.lat]} onClick={() => setSelectedHotspotId(hotspot.id)}>
                        <g className="pulse breathe">
                          <circle r={size} fill={`rgba(108, 123, 255, ${0.15 + intensity * 0.35})`} stroke="rgba(108,123,255,0.7)" strokeWidth={1.5} />
                          <circle r={size * 0.6} fill="rgba(108, 123, 255, 0.95)" />
                        </g>
                        <text textAnchor="middle" y={-size - 4} className="hotspot-label">
                          {hotspot.name}
                        </text>
                      </Marker>
                    );
                  })}

                  {flightsEnabled &&
                    flightPaths.map((flight) => (
                      <Line
                        key={flight.id}
                        from={flight.from}
                        to={flight.to}
                        stroke="rgba(80,200,255,0.7)"
                        strokeWidth={2}
                        strokeLinecap="round"
                        className="flight-line"
                      />
                    ))}
                </ZoomableGroup>
              </ComposableMap>
            </div>
          </div>

          <DraggablePanel id="hotspot" initial={{ x: 24, y: 90 }} width={420} height={520}>
            <div className="hotspot-card">
              <div className="hotspot-header">
                <div>
                  <p className="map-kicker">Snapshot</p>
                  <h3>{selectedHotspot ? selectedHotspot.name : 'Pick a hotspot'}</h3>
                  <p className="map-subtitle">{selectedHotspot?.summary || 'Select a pulse on the map to see what is driving it.'}</p>
                </div>
                <div className="hotspot-pills">
                  {(selectedHotspot ? Object.entries(selectedHotspot.byType) : []).map(([type, count]) => (
                    <span key={type} className={`pill pill-${type}`}>
                      {type === 'tweet' ? 'Twitter' : type === 'reddit_post' ? 'Reddit' : 'News'} · {count}
                    </span>
                  ))}
                </div>
              </div>

              <div className="hotspot-stream">
                {(selectedHotspot?.items || []).map((item, idx) => (
                  <a key={item.id || `${item.contentType || 'item'}-${idx}`} href={item.url} target="_blank" rel="noopener noreferrer" className="hotspot-story">
                    <div className="story-meta">
                      <span className={`pill mini pill-${item.contentType}`}>
                        {item.contentType === 'tweet' ? 'Twitter' : item.contentType === 'reddit_post' ? 'Reddit' : 'News'}
                      </span>
                      <span className="story-source">{item.sourceName || item.source}</span>
                    </div>
                    <div className="story-title">{item.title || item.content || 'Untitled update'}</div>
                    <div className="story-foot">
                      <span>{item.author || 'Unknown'}</span>
                      <span className="dot">•</span>
                      <span>{timeAgo(item.publishedAt)}</span>
                    </div>
                  </a>
                ))}

                {(selectedHotspot?.items || []).length === 0 && <div className="loading">Pick a hotspot to view linked stories.</div>}
              </div>
            </div>
          </DraggablePanel>
        </section>

        <div className="filters">
          {[
            { id: 'all', label: 'All Sources' },
            { id: 'news', label: 'News Articles', tone: 'news' },
            { id: 'twitter', label: 'Twitter', tone: 'twitter' },
            { id: 'reddit', label: 'Reddit', tone: 'reddit' },
            { id: 'rumors', label: 'Rumors', tone: 'rumors' },
            { id: 'flights', label: 'Flights', tone: 'flights' },
          ].map((f) => (
            <label key={f.id} className={`switch ${f.tone ? `switch-${f.tone}` : ''}`}>
              <input
                type="checkbox"
                checked={activeFilters.includes(f.id)}
                onChange={() => toggleFilter(f.id)}
                aria-label={f.label}
              />
              <span className="slider" />
              <span className="switch-label">{f.label}</span>
            </label>
          ))}
        </div>

        <div className="feed">
          {filteredFeed.map((item, idx) => (
            <FeedItem key={item.id || `${item.contentType || 'item'}-${idx}`} item={item} />
          ))}
        </div>

        {filteredFeed.length === 0 && <div className="loading">No content found for selected filters</div>}
      </main>
    </div>
  );
}

export default App;
