/**
 * useElectionLive Hook
 * Fetches live prediction market odds from the backend (Polymarket + Kalshi + PredictIt).
 * Merges with static fallback data from electionData.js.
 * Auto-refreshes every 60 seconds for a live feel.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getStateElectionData, SENATE_RACES, GOVERNOR_RACES } from '../features/elections/electionData';
import { API_URL } from '../services/api';

const REFRESH_INTERVAL = 60 * 1000; // 1 minute — market odds update frequently
const FETCH_TIMEOUT = 15000; // 15s — markets-only fetch is fast
const RETRY_DELAY = 5000;
const MAX_RETRIES = 2;

export function useElectionLive(stateName) {
  const [liveData, setLiveData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const isMounted = useRef(true);
  const fetchedGlobal = useRef(false);
  const globalCache = useRef(null);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const fetchLiveData = useCallback(async (retryCount = 0) => {
    setLoading(true);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

      const response = await fetch(`${API_URL}/api/elections/live`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) throw new Error(`${response.status}`);
      const result = await response.json();

      if (!isMounted.current) return;

      if (result.success && result.data) {
        const mr = result.data.marketRatings || {};
        // If the response has no market ratings and we haven't retried yet,
        // the model may still be computing — retry after a short delay.
        if (Object.keys(mr).length === 0 && retryCount < MAX_RETRIES) {
          console.log(`[useElectionLive] Empty ratings, retrying in ${RETRY_DELAY / 1000}s (${retryCount + 1}/${MAX_RETRIES})...`);
          setTimeout(() => { if (isMounted.current) fetchLiveData(retryCount + 1); }, RETRY_DELAY);
          return;
        }
        globalCache.current = result.data;
        fetchedGlobal.current = true;
        setLiveData(result.data);
        setHasLoaded(true);
        setLastUpdated(new Date());
      }
    } catch (err) {
      if (!isMounted.current) return;
      // Retry on timeout/network errors — model may still be computing on first load
      if (retryCount < MAX_RETRIES) {
        console.log(`[useElectionLive] Fetch failed (${err.message}), retrying in ${RETRY_DELAY / 1000}s (${retryCount + 1}/${MAX_RETRIES})...`);
        setTimeout(() => { if (isMounted.current) fetchLiveData(retryCount + 1); }, RETRY_DELAY);
        return;
      }
      console.warn('[useElectionLive] Fetch failed after retries:', err.message);
      if (isMounted.current) setHasLoaded(true);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, []);

  // Initial fetch + periodic refresh
  useEffect(() => {
    if (!fetchedGlobal.current) {
      fetchLiveData();
    } else if (globalCache.current) {
      setLiveData(globalCache.current);
      setLastUpdated(new Date());
    }

    const interval = setInterval(fetchLiveData, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchLiveData]);

  /**
   * Merge static election data with live market odds.
   * Market data overrides static probabilities when available.
   */
  const getStateData = useCallback((state) => {
    const staticData = getStateElectionData(state);
    if (!liveData) return { ...staticData, live: null };

    const marketRatings = liveData.marketRatings || {};

    // Helper: merge live general election market data into a race object
    const mergeMarketData = (race, liveRace) => {
      if (!race || !liveRace) return race;
      return {
        ...race,
        liveRating: liveRace.derivedRating,
        dWinProb: liveRace.dWinProb,
        rWinProb: liveRace.rWinProb,
        iWinProb: liveRace.iWinProb || null,
        independentCandidate: liveRace.independentCandidate || null,
        candidateOutcomes: liveRace.candidateOutcomes || null,
        marketUrl: liveRace.marketUrl,
        marketSource: liveRace.marketSource,
        marketVolume: liveRace.marketVolume,
        marketOutcomes: liveRace.outcomes,
        _fundamentalsOnly: false,
      };
    };

    // Helper: merge live primary market data into a race object
    const mergePrimaryMarketData = (race, raceType, state) => {
      if (!race) return race;
      const rPrimary = marketRatings[`${state}:${raceType}:primary:R`];
      const dPrimary = marketRatings[`${state}:${raceType}:primary:D`];
      if (!rPrimary && !dPrimary) return race;
      return {
        ...race,
        livePrimaryR: rPrimary || null,
        livePrimaryD: dPrimary || null,
      };
    };

    let senate = mergeMarketData(staticData.senate, marketRatings[`${state}:senate`]);
    senate = mergePrimaryMarketData(senate, 'senate', state);
    let governor = mergeMarketData(staticData.governor, marketRatings[`${state}:governor`]);
    governor = mergePrimaryMarketData(governor, 'governor', state);

    let houseDistricts = staticData.houseDistricts || [];
    houseDistricts = houseDistricts.map(d => {
      const distLive = marketRatings[`${state}:house:${d.code}`];
      return distLive ? mergeMarketData(d, distLive) : d;
    });

    return {
      ...staticData,
      senate,
      governor,
      houseDistricts,
      live: {
        timestamp: liveData.timestamp,
        marketCount: liveData.marketCount,
        racesMatched: liveData.racesMatched,
      },
    };
  }, [liveData]);

  // Also fetch election news from GDELT
  const [newsData, setNewsData] = useState(null);
  const newsCache = useRef(null);

  const fetchElectionNews = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

      const response = await fetch(`${API_URL}/api/elections/news`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) return;
      const result = await response.json();
      if (!isMounted.current) return;
      if (result.success && result.data) {
        newsCache.current = result.data;
        setNewsData(result.data);
      }
    } catch (err) {
      // Keep stale news on error
    }
  }, []);

  // Fetch state-specific election news
  const fetchStateNews = useCallback(async (state) => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

      const response = await fetch(`${API_URL}/api/elections/news/${encodeURIComponent(state)}`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) return null;
      const result = await response.json();
      return result.success ? result.data : null;
    } catch (err) {
      return null;
    }
  }, []);

  // Fetch news on mount
  useEffect(() => {
    if (!newsCache.current) fetchElectionNews();
    const newsInterval = setInterval(fetchElectionNews, 10 * 60 * 1000);
    return () => clearInterval(newsInterval);
  }, [fetchElectionNews]);

  return {
    liveData,
    loading,
    hasLoaded,
    lastUpdated,
    refresh: fetchLiveData,
    getStateData,
    isLive: !!liveData && Object.keys(liveData.marketRatings || {}).length > 0,
    newsData,
    fetchStateNews,
  };
}

/**
 * Hook to get election live data for the full map.
 * Returns market-derived ratings keyed by state, for map coloring.
 */
export function useElectionMapData() {
  const { liveData, isLive, loading } = useElectionLive();

  const getMapRating = useCallback((stateName, raceType = 'senate') => {
    if (!liveData?.marketRatings) return null;
    const key = `${stateName}:${raceType}`;
    const live = liveData.marketRatings[key];
    return live?.derivedRating || null;
  }, [liveData]);

  return { getMapRating, isLive, loading };
}

export default useElectionLive;
