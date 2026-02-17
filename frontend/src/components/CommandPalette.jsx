import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';

export const PANEL_INDEX = [
  { id: 'health', label: 'Health & Pandemics', keywords: 'health pandemic WHO bird flu H5N1 disease outbreak', category: 'Panel' },
  { id: 'cyber', label: 'Cyber Threats', keywords: 'cyber hack breach vulnerability CISA', category: 'Panel' },
  { id: 'commodities', label: 'Commodities', keywords: 'oil gold silver gas wheat commodity price', category: 'Panel' },
  { id: 'refugees', label: 'Refugees', keywords: 'refugee displacement UNHCR migration asylum', category: 'Panel' },
  { id: 'shipping', label: 'Shipping & Logistics', keywords: 'shipping Suez Panama chokepoint maritime trade', category: 'Panel' },
  { id: 'sanctions', label: 'Sanctions', keywords: 'sanction embargo restriction OFAC', category: 'Panel' },
  { id: 'court', label: 'Court Rulings', keywords: 'court SCOTUS supreme ICC ruling legal', category: 'Panel' },
  { id: 'stability', label: 'Stability Monitor', keywords: 'protest unrest military stability coup', category: 'Panel' },
  { id: 'tension', label: 'Tension Index', keywords: 'tension conflict escalation risk global', category: 'Panel' },
  { id: 'briefing', label: 'Daily Briefing', keywords: 'briefing summary intelligence report', category: 'Panel' },
  { id: 'elections', label: 'Elections', keywords: 'election vote poll midterm senate governor', category: 'Panel' },
  { id: 'climate', label: 'Climate & Environment', keywords: 'climate warming temperature COP emissions carbon', category: 'Panel' },
  { id: 'nuclear', label: 'Nuclear Threats', keywords: 'nuclear weapon ICBM warhead proliferation', category: 'Panel' },
];

export const CONFLICT_INDEX = [
  { id: 'ukraine-russia', label: 'Russia-Ukraine War', keywords: 'Ukraine Russia Putin Zelensky Donbas Crimea' },
  { id: 'israel-gaza', label: 'Israel-Gaza War', keywords: 'Israel Gaza Hamas Palestine ceasefire' },
  { id: 'iran-israel', label: 'Twelve Day War', keywords: 'Iran Israel nuclear strikes IRGC protests twelve day war' },
  { id: 'india-pakistan', label: 'India-Pakistan Crisis', keywords: 'India Pakistan Kashmir Sindoor nuclear' },
  { id: 'sahel', label: 'Sahel Insurgency', keywords: 'Sahel Mali Burkina Faso Niger JNIM terrorism' },
  { id: 'sudan', label: 'Sudan Civil War', keywords: 'Sudan SAF RSF Darfur Khartoum' },
  { id: 'myanmar', label: 'Myanmar Civil War', keywords: 'Myanmar Burma junta resistance PDF' },
  { id: 'yemen', label: 'Yemen / Houthi Crisis', keywords: 'Yemen Houthi Red Sea Aden' },
  { id: 'ethiopia', label: 'Ethiopia Conflicts', keywords: 'Ethiopia Amhara Tigray Oromia' },
  { id: 'drc', label: 'Eastern Congo (M23)', keywords: 'DRC Congo M23 Rwanda Goma' },
];

export const COUNTRY_INDEX = [
  'United States', 'China', 'Russia', 'India', 'Brazil', 'United Kingdom',
  'France', 'Germany', 'Japan', 'South Korea', 'Iran', 'Israel', 'Turkey',
  'Saudi Arabia', 'Pakistan', 'Ukraine', 'Taiwan', 'North Korea', 'Mexico',
  'Nigeria', 'South Africa', 'Egypt', 'Indonesia', 'Australia', 'Canada',
].map(name => ({ id: name, label: name, keywords: name, category: 'Country' }));

export function CommandPalette({ open, onClose, onSelect }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const all = [
      ...PANEL_INDEX.map(p => ({ ...p, category: 'Panel' })),
      ...CONFLICT_INDEX.map(c => ({ ...c, category: 'Conflict' })),
      ...COUNTRY_INDEX,
    ];
    return all
      .filter(item => {
        const searchable = `${item.label} ${item.keywords}`.toLowerCase();
        return searchable.includes(q);
      })
      .slice(0, 12);
  }, [query]);

  const handleSelect = useCallback((item) => {
    onSelect(item);
    onClose();
  }, [onSelect, onClose]);

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: '15vh',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'rgba(15,15,30,0.98)', border: '1px solid rgba(100,181,246,0.3)',
          borderRadius: '8px', width: '480px', maxWidth: '90vw',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search panels, conflicts, countries..."
            style={{
              width: '100%', background: 'transparent', border: 'none',
              color: 'rgba(255,255,255,0.9)', fontSize: '14px',
              fontFamily: 'inherit', outline: 'none',
            }}
          />
        </div>
        {results.length > 0 && (
          <div style={{ maxHeight: '300px', overflowY: 'auto', padding: '4px 0' }}>
            {results.map((item, i) => (
              <button
                key={`${item.category}-${item.id}-${i}`}
                onClick={() => handleSelect(item)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  width: '100%', padding: '8px 16px', background: 'transparent',
                  border: 'none', color: 'rgba(255,255,255,0.8)', cursor: 'pointer',
                  fontFamily: 'inherit', fontSize: '12px', textAlign: 'left',
                }}
                onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.05)'}
                onMouseLeave={e => e.target.style.background = 'transparent'}
              >
                <span style={{
                  fontSize: '9px', padding: '1px 6px', borderRadius: '3px',
                  background: item.category === 'Panel' ? 'rgba(33,150,243,0.2)' :
                    item.category === 'Conflict' ? 'rgba(244,67,54,0.2)' : 'rgba(76,175,80,0.2)',
                  color: item.category === 'Panel' ? '#64b5f6' :
                    item.category === 'Conflict' ? '#ef9a9a' : '#81c784',
                  border: `1px solid ${item.category === 'Panel' ? 'rgba(33,150,243,0.3)' :
                    item.category === 'Conflict' ? 'rgba(244,67,54,0.3)' : 'rgba(76,175,80,0.3)'}`,
                  minWidth: '50px', textAlign: 'center',
                }}>
                  {item.category}
                </span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        )}
        {query && results.length === 0 && (
          <div style={{ padding: '16px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>
            No results for "{query}"
          </div>
        )}
        <div style={{
          padding: '6px 16px', borderTop: '1px solid rgba(255,255,255,0.06)',
          fontSize: '9px', color: 'rgba(255,255,255,0.2)', display: 'flex', gap: '12px',
        }}>
          <span>&#8593;&#8595; Navigate</span>
          <span>&#8629; Select</span>
          <span>Esc Close</span>
        </div>
      </div>
    </div>
  );
}
