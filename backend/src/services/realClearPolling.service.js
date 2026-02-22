/**
 * RealClearPolling Service — DEPRECATED
 *
 * This source has been deprecated in favor of FiveThirtyEight polling data.
 * All exported methods retain their original signatures but return empty arrays/objects
 * to avoid breaking downstream consumers.
 *
 * Previously: scraped RealClearPolling index pages and extracted poll data from
 * RSC flight data, JSON endpoints, and rendered HTML fallbacks.
 *
 * Replacement: Use fiveThirtyEight.service.js via pollingAggregator.service.js
 */

class RealClearPollingService {
  constructor() {
    this._available = false;
  }

  async getSenatePolls() {
    return {};
  }

  async getGovernorPolls() {
    return {};
  }

  async getHousePolls() {
    return {};
  }

  async getGenericBallotPolls() {
    return {};
  }

  get isAvailable() {
    return false;
  }
}

export const realClearPollingService = new RealClearPollingService();
export default realClearPollingService;
