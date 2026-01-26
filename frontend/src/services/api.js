const API_URL = import.meta.env.VITE_API_URL || '';

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
};

export default api;
