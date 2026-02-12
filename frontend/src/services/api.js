// In dev, use empty string so requests go through the Vite proxy (avoids CORS/IPv6 issues).
// In production, VITE_API_URL should point to the backend origin.
const API_URL = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || '');

export const api = {
  async fetch(endpoint) {
    const response = await fetch(`${API_URL}/api${endpoint}`);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
  },

  getFeed: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.fetch(`/feed${query ? `?${query}` : ''}`);
  },

  getNews: () => api.fetch('/news'),
  getTweets: () => api.fetch('/tweets'),
  getReddit: () => api.fetch('/reddit'),
  getRss: () => api.fetch('/rss'),
  search: (q) => api.fetch(`/search?q=${encodeURIComponent(q)}`),
  getStats: () => api.fetch('/stats'),

  // Conflict (Russia-Ukraine live data)
  getConflictLive: () => api.fetch('/conflict'),
  getConflictLosses: () => api.fetch('/conflict/losses'),
  getConflictLossesHistory: (days = 30) => api.fetch(`/conflict/losses/history?days=${days}`),
  getConflictNews: (limit = 30) => api.fetch(`/conflict/news?limit=${limit}`),
};

export default api;
