import { useState, useEffect } from 'react';

const STORAGE_KEY = 'monitored:watchlist';

function loadWatchlist() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

function saveWatchlist(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function WatchlistPanel({ onCountryClick }) {
  const [items, setItems] = useState(loadWatchlist);
  const [newItem, setNewItem] = useState('');
  const [newType, setNewType] = useState('country');

  useEffect(() => { saveWatchlist(items); }, [items]);

  function addItem() {
    if (!newItem.trim()) return;
    const item = {
      id: Date.now().toString(),
      name: newItem.trim(),
      type: newType,
      addedAt: new Date().toISOString(),
    };
    setItems(prev => [...prev, item]);
    setNewItem('');
  }

  function removeItem(id) {
    setItems(prev => prev.filter(i => i.id !== id));
  }

  const TYPE_ICONS = { country: '🌍', topic: '📌', conflict: '⚔️', market: '📈' };

  return (
    <div className="watchlist-panel">
      <div className="wl-add">
        <input
          className="wl-input"
          type="text"
          value={newItem}
          onChange={e => setNewItem(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addItem()}
          placeholder="Add to watchlist..."
        />
        <select className="wl-type" value={newType} onChange={e => setNewType(e.target.value)}>
          <option value="country">Country</option>
          <option value="topic">Topic</option>
          <option value="conflict">Conflict</option>
          <option value="market">Market</option>
        </select>
        <button className="wl-add-btn" onClick={addItem}>+</button>
      </div>

      <div className="wl-list">
        {items.length === 0 && (
          <div className="wl-empty">
            No watchlist items. Add countries, topics, or conflicts to track.
          </div>
        )}
        {items.map(item => (
          <div key={item.id} className="wl-item" onClick={() => item.type === 'country' && onCountryClick?.(item.name)}>
            <span className="wl-item-icon">{TYPE_ICONS[item.type] || '📌'}</span>
            <div className="wl-item-info">
              <span className="wl-item-name">{item.name}</span>
              <span className="wl-item-type">{item.type}</span>
            </div>
            <button className="wl-remove" onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}>×</button>
          </div>
        ))}
      </div>

      <div className="wl-footer">
        <span>{items.length} items tracked</span>
      </div>
    </div>
  );
}
