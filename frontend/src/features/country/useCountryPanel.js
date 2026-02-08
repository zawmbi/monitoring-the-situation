/**
 * useCountryPanel Hook
 * Manages country/state/province panel state and data fetching
 */

import { useState } from 'react';
import { fetchCountryProfile } from '../../services/countryInfo';
import US_STATE_INFO from '../../usStateInfo';
import CA_PROVINCE_INFO from '../../caProvinceInfo';

export function useCountryPanel() {
  const [countryPanel, setCountryPanel] = useState({
    open: false,
    data: null,
    pos: { x: 160, y: 120 },
  });

  const openCountryPanel = async (countryName, position) => {
    // Set initial state with loading
    setCountryPanel({
      open: true,
      data: {
        name: countryName,
        population: 'Loading...',
        leader: 'Loading...',
        timezone: 'UTC',
      },
      pos: position,
    });

    // Fetch country data
    try {
      const profile = await fetchCountryProfile(countryName);
      if (profile) {
        setCountryPanel(prev => ({
          ...prev,
          data: {
            name: profile.name || countryName,
            population: profile.population || 'Unknown',
            leader: profile.leader || 'Unavailable',
            timezone: profile.timezone || 'UTC',
            capital: profile.capital,
            region: profile.region,
            subregion: profile.subregion,
          },
        }));
      }
    } catch (err) {
      setCountryPanel(prev => ({
        ...prev,
        data: {
          name: countryName,
          population: 'Unknown',
          leader: 'Unavailable',
          timezone: 'UTC',
          error: err?.message || 'Unable to load country info',
        },
      }));
    }
  };

  const openStatePanel = (stateName, position) => {
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
      pos: position,
    });
  };

  const openProvincePanel = (provinceName, position) => {
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
      pos: position,
    });
  };

  const closeCountryPanel = () => {
    setCountryPanel({ open: false, data: null, pos: { x: 160, y: 120 } });
  };

  const updateCountryPanelPosition = (pos) => {
    setCountryPanel(prev => ({ ...prev, pos }));
  };

  return {
    countryPanel,
    openCountryPanel,
    openStatePanel,
    openProvincePanel,
    closeCountryPanel,
    updateCountryPanelPosition,
  };
}

export default useCountryPanel;
