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

  // Per-conflict news (all tracked conflicts)
  getConflictNewsByType: (conflictId, limit = 20) => api.fetch(`/conflict-news/${conflictId}?limit=${limit}`),
  getAllConflictNews: (limit = 10) => api.fetch(`/conflict-news?limit=${limit}`),

  // Tariffs (US trade policy live data)
  getTariffLive: () => api.fetch('/tariffs'),
  getTariffNews: (limit = 30) => api.fetch(`/tariffs/news?limit=${limit}`),

  // Economic data (World Bank live indicators)
  getEconomicData: (cca2) => api.fetch(`/economic/${cca2}`),

  // World leaders (Wikidata live data)
  getWorldLeaders: () => api.fetch('/leaders'),
  getLeaderByCountry: (country) => api.fetch(`/leaders/${encodeURIComponent(country)}`),

  // Markets (stock indices & forex per country)
  getMarketData: (countryCode) => api.fetch(`/markets/${countryCode}`),

  // UCDP conflict events
  getUCDPEvents: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.fetch(`/ucdp/events${query ? `?${query}` : ''}`);
  },
  getUCDPConflicts: () => api.fetch('/ucdp/conflicts'),

  // Stability data (protests, military, instability)
  getStabilityData: () => api.fetch('/stability'),
  getProtestData: () => api.fetch('/stability/protests'),
  getMilitaryData: () => api.fetch('/stability/military'),
  getInstabilityData: () => api.fetch('/stability/instability'),
  getFleetPositions: () => api.fetch('/stability/fleet'),

};

export default api;
