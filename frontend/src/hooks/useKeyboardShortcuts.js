import { useEffect } from 'react';

export function useKeyboardShortcuts(handlers) {
  useEffect(() => {
    function handleKeyDown(e) {
      // Don't trigger if user is typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
      if (e.target.isContentEditable) return;

      const key = e.key;
      const ctrl = e.ctrlKey || e.metaKey;

      // Ctrl+K: Global search
      if (ctrl && key === 'k') {
        e.preventDefault();
        handlers.onSearch?.();
        return;
      }

      // Escape: Close topmost panel
      if (key === 'Escape') {
        handlers.onEscape?.();
        return;
      }

      // ?: Show shortcuts help
      if (key === '?' && !ctrl) {
        handlers.onHelp?.();
        return;
      }

      // Space: Toggle auto-rotate
      if (key === ' ' && !ctrl) {
        e.preventDefault();
        handlers.onToggleRotate?.();
        return;
      }

      // [ and ]: Cycle sidebar tabs
      if (key === '[') {
        handlers.onPrevTab?.();
        return;
      }
      if (key === ']') {
        handlers.onNextTab?.();
        return;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers]);
}
