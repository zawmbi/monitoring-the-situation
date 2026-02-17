import { timeAgo } from '../../utils/time';
import { getSourceBias } from '../../utils/sourceBias';

function LeanBadge({ url, sourceName }) {
  const info = getSourceBias(url, sourceName);
  if (!info) return null;

  const style = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '3px',
    padding: '1px 5px',
    borderRadius: '3px',
    fontSize: '0.6rem',
    fontWeight: 600,
    letterSpacing: '0.3px',
    background: `${info.color}20`,
    color: info.color,
    border: `1px solid ${info.color}40`,
    whiteSpace: 'nowrap',
  };

  return <span style={style} title={`Source leans: ${info.label}`}>{info.label}</span>;
}

export function NewsItem({ item }) {
  return (
    <a href={item.url} target="_blank" rel="noopener noreferrer" className="news-feed-item">
      <div className="news-item-header">
        <span className={`news-item-source-badge ${item.contentType}`}>
          {item.contentType === 'tweet' ? 'Twitter' :
           item.contentType === 'reddit_post' ? 'Reddit' :
           item.contentType === 'rumor' ? 'Rumor' :
           item.contentType === 'flight' ? 'Flight' :
           item.contentType === 'stock' ? 'Stock' : 'News'}
        </span>
        <span className="news-item-time">{timeAgo(item.publishedAt)}</span>
      </div>
      <h4 className="news-item-title">{item.title || 'Untitled'}</h4>
      {(item.content || item.summary) && (
        <p className="news-item-snippet">{item.content || item.summary}</p>
      )}
      <div className="news-item-footer">
        <span>{item.sourceName || item.source}</span>
        {item.contentType === 'article' && <LeanBadge url={item.url} sourceName={item.sourceName || item.source} />}
      </div>
    </a>
  );
}

export function NewsFeed({ items = [], viewMode, selectedRegion, onBackToWorld }) {
  if (!items.length) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">[ ]</div>
        <div className="empty-state-title">No items found</div>
        <div className="empty-state-text">
          {viewMode === 'region'
            ? `No news for ${selectedRegion?.name || 'this region'} with current filters.`
            : viewMode === 'hotspot'
              ? 'No items in this hotspot.'
              : 'No items match your current filters.'}
        </div>
        {viewMode !== 'world' && (
          <button className="btn-back-to-world" onClick={onBackToWorld}>
            Back to World View
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="news-feed">
      {items.map((item, idx) => (
        <NewsItem key={`${item.id || 'item'}-${idx}`} item={item} />
      ))}
    </div>
  );
}

export default NewsFeed;
