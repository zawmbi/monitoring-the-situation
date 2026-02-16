/**
 * useStability — fetches combined stability data (protests, military, instability)
 * Merges live GDELT/RSS data from backend with static baseline events.
 */

import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import {
  BASELINE_PROTESTS,
  BASELINE_MILITARY,
  BASELINE_INSTABILITY,
} from '../features/stability/stabilityData';

export function useStability(enabled = false) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    try {
      const res = await api.getStabilityData();
      const live = res?.data || res || {};

      // Merge live GDELT heatmap points with baseline protests
      const liveProtestCodes = new Set((live.protests?.heatmapPoints || []).map((p) => p.countryCode));
      const mergedProtests = [
        ...BASELINE_PROTESTS.filter((b) => !liveProtestCodes.has(b.code)),
        ...(live.protests?.heatmapPoints || []).map((p) => ({
          ...p,
          country: p.countryCode,
          code: p.countryCode,
          label: `${p.count} GDELT articles`,
          type: 'protest',
          live: true,
        })),
      ];

      // Merge live military indicators with baseline
      const liveMilCodes = new Set((live.military?.indicators || []).map((m) => m.countryCode));
      const mergedMilitary = [
        ...BASELINE_MILITARY.filter((b) => !liveMilCodes.has(b.code)),
        ...(live.military?.indicators || []).map((m) => ({
          ...m,
          country: m.countryCode,
          code: m.countryCode,
          label: `${m.count} GDELT articles`,
          force: 'mixed',
          type: 'deployment',
          live: true,
        })),
      ];

      // Merge live instability alerts with baseline
      const liveAlertCodes = new Set((live.instability?.alerts || []).map((a) => a.countryCode));
      const mergedInstability = [
        ...BASELINE_INSTABILITY.filter((b) => !liveAlertCodes.has(b.code)),
        ...(live.instability?.alerts || []).map((a) => ({
          ...a,
          country: a.countryCode,
          code: a.countryCode,
          headline: a.articles?.[0]?.title || 'Instability detected',
          live: true,
        })),
      ];

      setData({
        protests: mergedProtests,
        military: mergedMilitary,
        instability: mergedInstability,
        protestNews: live.protests?.newsHeadlines || [],
        militaryNews: live.military?.newsHeadlines || [],
        instabilityNews: live.instability?.newsHeadlines || [],
        lastUpdated: live.lastUpdated || new Date().toISOString(),
      });
      setError(null);
    } catch (err) {
      console.warn('[useStability] API fetch failed, using baseline data:', err.message);
      // Fallback to static baseline
      setData({
        protests: BASELINE_PROTESTS,
        military: BASELINE_MILITARY,
        instability: BASELINE_INSTABILITY,
        protestNews: [],
        militaryNews: [],
        instabilityNews: [],
        lastUpdated: new Date().toISOString(),
      });
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    fetchData();
    if (!enabled) return;
    const interval = setInterval(fetchData, 10 * 60 * 1000); // refresh every 10 min
    return () => clearInterval(interval);
  }, [fetchData, enabled]);

  return { data, loading, error, refresh: fetchData };
}
