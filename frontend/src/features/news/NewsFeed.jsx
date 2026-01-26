import { timeAgo } from '../../utils/time';

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
        <NewsItem key={item.id || `item-${idx}`} item={item} />
      ))}
    </div>
  );
}

export default NewsFeed;
