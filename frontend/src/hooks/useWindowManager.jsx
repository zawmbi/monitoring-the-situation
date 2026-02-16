import { useState, useCallback, useRef, createContext, useContext } from 'react';

const WindowManagerContext = createContext(null);

export function WindowManagerProvider({ children }) {
  const manager = useWindowManagerInternal();
  return (
    <WindowManagerContext.Provider value={manager}>
      {children}
    </WindowManagerContext.Provider>
  );
}

export function useWindowManager() {
  const ctx = useContext(WindowManagerContext);
  if (!ctx) throw new Error('useWindowManager must be used within WindowManagerProvider');
  return ctx;
}

function useWindowManagerInternal() {
  const [windows, setWindows] = useState({});
  const zCounter = useRef(1200);
  const closeCallbacks = useRef({});

  const register = useCallback((id, opts = {}) => {
    setWindows(prev => {
      if (prev[id]) return prev;
      return {
        ...prev,
        [id]: {
          id,
          title: opts.title || id,
          mode: opts.defaultMode || 'docked',
          prevMode: null,
          position: opts.defaultPosition || { x: 120 + Object.keys(prev).length * 30, y: 80 + Object.keys(prev).length * 30 },
          size: opts.defaultSize || null,
          zIndex: zCounter.current++,
        },
      };
    });
  }, []);

  const unregister = useCallback((id) => {
    setWindows(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const setMode = useCallback((id, mode) => {
    setWindows(prev => {
      const win = prev[id];
      if (!win) return prev;
      return {
        ...prev,
        [id]: {
          ...win,
          mode,
          prevMode: win.mode !== 'minimized' ? win.mode : win.prevMode,
          zIndex: zCounter.current++,
        },
      };
    });
  }, []);

  const bringToFront = useCallback((id) => {
    setWindows(prev => {
      const win = prev[id];
      if (!win) return prev;
      return { ...prev, [id]: { ...win, zIndex: zCounter.current++ } };
    });
  }, []);

  const updatePosition = useCallback((id, position) => {
    setWindows(prev => {
      const win = prev[id];
      if (!win) return prev;
      return { ...prev, [id]: { ...win, position } };
    });
  }, []);

  const updateSize = useCallback((id, size) => {
    setWindows(prev => {
      const win = prev[id];
      if (!win) return prev;
      return { ...prev, [id]: { ...win, size } };
    });
  }, []);

  const updateTitle = useCallback((id, title) => {
    setWindows(prev => {
      const win = prev[id];
      if (!win || win.title === title) return prev;
      return { ...prev, [id]: { ...win, title } };
    });
  }, []);

  const restore = useCallback((id) => {
    setWindows(prev => {
      const win = prev[id];
      if (!win) return prev;
      const restoreTo = win.prevMode || 'docked';
      return {
        ...prev,
        [id]: { ...win, mode: restoreTo, prevMode: null, zIndex: zCounter.current++ },
      };
    });
  }, []);

  const registerClose = useCallback((id, fn) => {
    if (fn) {
      closeCallbacks.current[id] = fn;
    } else {
      delete closeCallbacks.current[id];
    }
  }, []);

  const closeWindow = useCallback((id) => {
    const fn = closeCallbacks.current[id];
    if (fn) fn();
  }, []);

  const minimizedWindows = Object.values(windows).filter(w => w.mode === 'minimized');

  return {
    windows,
    register,
    unregister,
    setMode,
    bringToFront,
    updatePosition,
    updateSize,
    updateTitle,
    restore,
    registerClose,
    closeWindow,
    minimizedWindows,
  };
}
