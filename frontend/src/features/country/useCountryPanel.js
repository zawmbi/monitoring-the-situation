/**
 * useCountryPanel Hook
 * Manages country/state/province panel state and data fetching
 */

import { useState, useEffect, useRef } from 'react';
import { fetchCountryProfile } from '../../services/countryInfo';
import { fetchCurrencyVsUSD } from '../../services/currencyService';
import { getLeader } from './worldLeaders';
import US_STATE_INFO from '../../usStateInfo';
import CA_PROVINCE_INFO from '../../caProvinceInfo';

export function useCountryPanel() {
  const [countryPanel, setCountryPanel] = useState({
    open: false,
    data: null,
  });
  const [currencyData, setCurrencyData] = useState(null);
  const [currencyLoading, setCurrencyLoading] = useState(false);
  const currencyAbort = useRef(null);

  // Fetch currency data when country data changes
  useEffect(() => {
    if (!countryPanel.open || !countryPanel.data?.currency?.code) {
      setCurrencyData(null);
      return;
    }

    const code = countryPanel.data.currency.code;
    let cancelled = false;
    setCurrencyLoading(true);

    fetchCurrencyVsUSD(code).then(result => {
      if (!cancelled) {
        setCurrencyData(result);
        setCurrencyLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [countryPanel.open, countryPanel.data?.currency?.code]);

  const openCountryPanel = async (countryName) => {
    // Look up leader from static data
    const leaderData = getLeader(countryName);

    // Set initial state with loading
    setCountryPanel({
      open: true,
      data: {
        name: countryName,
        population: 'Loading...',
        leader: leaderData?.name || 'Loading...',
        leaderTitle: leaderData?.title || '',
        leaderPhoto: leaderData?.photo || null,
        timezone: 'UTC',
        loading: true,
      },
    });

    // Fetch country data
    try {
      const profile = await fetchCountryProfile(countryName);
      if (profile) {
        const leader = leaderData || {};
        setCountryPanel(prev => ({
          ...prev,
          data: {
            name: profile.name || countryName,
            officialName: profile.officialName,
            population: profile.population || 'Unknown',
            populationRaw: profile.populationRaw,
            leader: leader.name || profile.leader || 'Unavailable',
            leaderTitle: leader.title || '',
            leaderPhoto: leader.photo || null,
            timezone: profile.timezone || 'UTC',
            capital: profile.capital,
            region: profile.region,
            subregion: profile.subregion,
            flagUrl: profile.flagUrl,
            flag: profile.flag,
            currency: profile.currency,
            languages: profile.languages,
            area: profile.area,
            continent: profile.continent,
            cca2: profile.cca2,
            independent: profile.independent,
            unMember: profile.unMember,
            borders: profile.borders,
            loading: false,
          },
        }));
      }
    } catch (err) {
      setCountryPanel(prev => ({
        ...prev,
        data: {
          ...prev.data,
          population: 'Unknown',
          leader: leaderData?.name || 'Unavailable',
          error: err?.message || 'Unable to load country info',
          loading: false,
        },
      }));
    }
  };

  const openStatePanel = (stateName) => {
    const info = US_STATE_INFO[stateName];
    setCountryPanel({
      open: true,
      data: {
        name: stateName,
        capital: info?.capital || 'Unknown',
        region: 'United States',
        subregion: info?.abbr || '',
        timezone: info?.timezone || 'UTC-5',
        population: '',
        leader: '',
        scope: 'state',
      },
    });
  };

  const openProvincePanel = (provinceName) => {
    // Handle "Yukon Territory" vs "Yukon" naming mismatch
    const info = CA_PROVINCE_INFO[provinceName] || CA_PROVINCE_INFO[provinceName.replace(' Territory', '')];
    setCountryPanel({
      open: true,
      data: {
        name: provinceName,
        capital: info?.capital || 'Unknown',
        region: 'Canada',
        subregion: info?.abbr || '',
        timezone: info?.timezone || 'UTC-5',
        population: '',
        leader: '',
        scope: 'province',
      },
    });
  };

  const closeCountryPanel = () => {
    setCountryPanel({ open: false, data: null });
    setCurrencyData(null);
  };

  return {
    countryPanel,
    currencyData,
    currencyLoading,
    openCountryPanel,
    openStatePanel,
    openProvincePanel,
    closeCountryPanel,
  };
}

export default useCountryPanel;
