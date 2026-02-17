import { useState, useEffect, useCallback, useRef } from 'react';

const STORAGE_KEY = 'notification-rules';

/**
 * Browser notification system with custom alert rules.
 * Uses the Notification API (no server needed).
 */
export function useNotifications() {
  const [permission, setPermission] = useState(Notification?.permission || 'default');
  const [rules, setRules] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  });
  const [history, setHistory] = useState([]);
  const lastChecked = useRef({});

  // Persist rules
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
  }, [rules]);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return 'denied';
    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  }, []);

  const addRule = useCallback((rule) => {
    // rule: { id, name, metric, operator, threshold }
    // e.g. { id: 'tension-high', name: 'High Tension', metric: 'tensionIndex', operator: '>', threshold: 75 }
    setRules(prev => [...prev, { ...rule, id: rule.id || Date.now().toString(), enabled: true }]);
  }, []);

  const removeRule = useCallback((ruleId) => {
    setRules(prev => prev.filter(r => r.id !== ruleId));
  }, []);

  const toggleRule = useCallback((ruleId) => {
    setRules(prev => prev.map(r => r.id === ruleId ? { ...r, enabled: !r.enabled } : r));
  }, []);

  const evaluate = useCallback((data) => {
    if (permission !== 'granted') return;

    for (const rule of rules) {
      if (!rule.enabled) continue;

      const value = data[rule.metric];
      if (value == null) continue;

      let triggered = false;
      if (rule.operator === '>' && value > rule.threshold) triggered = true;
      if (rule.operator === '<' && value < rule.threshold) triggered = true;
      if (rule.operator === '=' && value === rule.threshold) triggered = true;

      // Don't re-trigger within 30 minutes
      const lastTime = lastChecked.current[rule.id] || 0;
      if (triggered && Date.now() - lastTime > 30 * 60 * 1000) {
        lastChecked.current[rule.id] = Date.now();

        const notification = new Notification(`Alert: ${rule.name}`, {
          body: `${rule.metric} is ${value} (threshold: ${rule.operator} ${rule.threshold})`,
          icon: '/favicon.ico',
          tag: rule.id,
        });

        setHistory(prev => [{
          id: Date.now().toString(),
          rule: rule.name,
          value,
          threshold: rule.threshold,
          timestamp: new Date().toISOString(),
        }, ...prev].slice(0, 50));

        // Auto-close after 10 seconds
        setTimeout(() => notification.close(), 10000);
      }
    }
  }, [permission, rules]);

  return {
    permission,
    requestPermission,
    rules,
    addRule,
    removeRule,
    toggleRule,
    evaluate,
    history,
  };
}
