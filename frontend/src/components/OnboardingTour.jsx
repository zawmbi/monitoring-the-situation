import React, { useState, useEffect } from 'react';

const TOUR_STEPS = [
  {
    title: 'Welcome to Monitoring The Situation',
    description: 'A real-time global intelligence dashboard tracking conflicts, economics, health, and more across 50+ data sources.',
    position: 'center',
  },
  {
    title: 'Interactive Globe',
    description: 'Click any country to view detailed intelligence. Scroll to zoom. Drag to rotate. Toggle between 2D and 3D views.',
    position: 'center',
  },
  {
    title: 'Sidebar Panels',
    description: 'Use the left sidebar to toggle data panels — conflicts, cyber threats, commodities, health monitoring, and more. Each panel opens as a floating window you can drag and resize.',
    position: 'left',
  },
  {
    title: 'Status Bar',
    description: 'The bottom bar shows live metrics — global tension index, active conflicts, disaster count, and market movements. The news ticker scrolls breaking headlines.',
    position: 'bottom',
  },
  {
    title: 'Keyboard Shortcuts',
    description: 'Press ? for shortcuts. Space to pause globe rotation. [ ] to cycle sidebar tabs. Escape to close panels.',
    position: 'center',
  },
];

const STORAGE_KEY = 'onboarding-completed';

export function OnboardingTour() {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      // Delay slightly so the app renders first
      const timer = setTimeout(() => setVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleNext = () => {
    if (step < TOUR_STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      handleDismiss();
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem(STORAGE_KEY, 'true');
  };

  if (!visible) return null;

  const current = TOUR_STEPS[step];
  const isLast = step === TOUR_STEPS.length - 1;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 100000,
      display: 'flex',
      alignItems: current.position === 'bottom' ? 'flex-end' : 'center',
      justifyContent: current.position === 'left' ? 'flex-start' : 'center',
      padding: current.position === 'left' ? '0 0 0 80px' : current.position === 'bottom' ? '0 0 80px 0' : '0',
      background: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        background: 'rgba(15,15,30,0.95)',
        border: '1px solid rgba(100,181,246,0.3)',
        borderRadius: '8px',
        padding: '24px 28px',
        maxWidth: '420px',
        width: '90%',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#64b5f6' }}>
            {current.title}
          </span>
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>
            {step + 1} / {TOUR_STEPS.length}
          </span>
        </div>
        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, margin: '0 0 16px 0' }}>
          {current.description}
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={handleDismiss}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.3)',
              cursor: 'pointer',
              fontSize: '11px',
              fontFamily: 'inherit',
              padding: '4px 8px',
            }}
          >
            Skip tour
          </button>
          <button
            onClick={handleNext}
            style={{
              background: 'rgba(33,150,243,0.2)',
              border: '1px solid rgba(33,150,243,0.4)',
              color: '#64b5f6',
              cursor: 'pointer',
              fontSize: '11px',
              fontFamily: 'inherit',
              padding: '6px 16px',
              borderRadius: '4px',
              fontWeight: 600,
            }}
          >
            {isLast ? 'Get Started' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
}
