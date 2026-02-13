/**
 * useElectionLive Hook
 * Fetches live election data from the backend (market-derived ratings + FEC data).
 * Merges with static fallback data from electionData.js.
 * Auto-refreshes every 5 minutes for a live feel.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getStateElectionData, SENATE_RACES, GOVERNOR_RACES } from '../features/elections/electionData';

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
const FETCH_TIMEOUT = 20000;

export function useElectionLive(stateName) {
  const [liveData, setLiveData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const isMounted = useRef(true);
  const fetchedGlobal = useRef(false);
  const globalCache = useRef(null);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const fetchLiveData = useCallback(async () => {
    setLoading(true);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

      const response = await fetch('/api/elections/live', {
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) throw new Error(`${response.status}`);
      const result = await response.json();

      if (!isMounted.current) return;

      if (result.success && result.data) {
        globalCache.current = result.data;
        fetchedGlobal.current = true;
        setLiveData(result.data);
        setLastUpdated(new Date());
      }
    } catch (err) {
      if (!isMounted.current) return;
      // Keep showing stale data on error
      console.warn('[useElectionLive] Fetch failed:', err.message);
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
   * Merge static election data with live data for a specific state.
   * Live market-derived ratings override static ratings.
   * FEC fundraising supplements static fundraising data.
   */
  const getStateData = useCallback((state) => {
    const staticData = getStateElectionData(state);
    if (!liveData) return { ...staticData, live: null };

    const marketRatings = liveData.marketRatings || {};
    const fecData = liveData.fecData || {};

    // Merge Senate data
    let senate = staticData.senate;
    const senateKey = `${state}:senate`;
    const senateLive = marketRatings[senateKey];
    if (senate && senateLive) {
      senate = {
        ...senate,
        liveRating: senateLive.derivedRating,
        dWinProb: senateLive.dWinProb,
        rWinProb: senateLive.rWinProb,
        marketUrl: senateLive.marketUrl,
        marketSource: senateLive.marketSource,
        marketVolume: senateLive.marketVolume,
        marketOutcomes: senateLive.outcomes,
      };
    }

    // Merge Governor data
    let governor = staticData.governor;
    const govKey = `${state}:governor`;
    const govLive = marketRatings[govKey];
    if (governor && govLive) {
      governor = {
        ...governor,
        liveRating: govLive.derivedRating,
        dWinProb: govLive.dWinProb,
        rWinProb: govLive.rWinProb,
        marketUrl: govLive.marketUrl,
        marketSource: govLive.marketSource,
        marketVolume: govLive.marketVolume,
        marketOutcomes: govLive.outcomes,
      };
    }

    // Merge House district data
    let houseDistricts = staticData.houseDistricts || [];
    if (houseDistricts.length > 0) {
      houseDistricts = houseDistricts.map(d => {
        const distKey = `${state}:house:${d.code}`;
        const distLive = marketRatings[distKey];
        if (!distLive) return d;
        return {
          ...d,
          liveRating: distLive.derivedRating,
          dWinProb: distLive.dWinProb,
          rWinProb: distLive.rWinProb,
          marketUrl: distLive.marketUrl,
          marketSource: distLive.marketSource,
          marketVolume: distLive.marketVolume,
          marketOutcomes: distLive.outcomes,
        };
      });
    }

    return {
      ...staticData,
      senate,
      governor,
      houseDistricts,
      live: {
        timestamp: liveData.timestamp,
        fecConfigured: liveData.fecConfigured,
        marketCount: liveData.marketCount,
      },
    };
  }, [liveData]);

  return {
    liveData,
    loading,
    lastUpdated,
    refresh: fetchLiveData,
    getStateData,
    isLive: !!liveData && Object.keys(liveData.marketRatings || {}).length > 0,
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
