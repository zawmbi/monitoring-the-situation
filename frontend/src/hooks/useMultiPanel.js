/**
 * useMultiPanel — allows opening multiple instances of the same panel type.
 * Each instance has a unique key, position, and data. Used for country panels
 * so users can compare two countries side by side.
 */
import { useState, useCallback, useRef } from 'react';

let instanceCounter = 0;

export function useMultiPanel() {
  const [panels, setPanels] = useState([]);

  const openPanel = useCallback((type, data, opts = {}) => {
    const id = `${type}-${++instanceCounter}`;
    const offset = (instanceCounter % 8) * 30;
    setPanels(prev => [
      ...prev,
      {
        id,
        type,
        data,
        position: opts.position || { x: 150 + offset, y: 90 + offset },
        size: opts.size || { width: 360, height: 600 },
        minimized: false,
        zIndex: 1300 + instanceCounter,
      },
    ]);
    return id;
  }, []);

  const closePanel = useCallback((id) => {
    setPanels(prev => prev.filter(p => p.id !== id));
  }, []);

  const updatePanel = useCallback((id, updates) => {
    setPanels(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, []);

  const updatePanelData = useCallback((id, data) => {
    setPanels(prev => prev.map(p => p.id === id ? { ...p, data: { ...p.data, ...data } } : p));
  }, []);

  const minimizePanel = useCallback((id) => {
    setPanels(prev => prev.map(p => p.id === id ? { ...p, minimized: !p.minimized } : p));
  }, []);

  const bringToFront = useCallback((id) => {
    setPanels(prev => {
      const maxZ = Math.max(...prev.map(p => p.zIndex), 1300);
      return prev.map(p => p.id === id ? { ...p, zIndex: maxZ + 1 } : p);
    });
  }, []);

  return {
    panels,
    openPanel,
    closePanel,
    updatePanel,
    updatePanelData,
    minimizePanel,
    bringToFront,
  };
}
