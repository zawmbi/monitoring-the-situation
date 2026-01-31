export const NAV_PAGES = [
  {
    id: 'feedback',
    label: 'Feedback',
    summary: 'Help us tune signals and reduce noise.',
    sections: [
      {
        title: 'What to share',
        items: [
          'Which region, topic, or source felt off',
          'Screenshots or timestamps that show the issue',
          'What you expected versus what you saw',
        ],
      },
      {
        title: 'Send feedback to',
        items: [
          'feedback@monitored.local',
          'Use a short subject line for faster routing',
        ],
      },
    ],
  },
  {
    id: 'contact',
    label: 'Contact',
    summary: 'Reach the team for partnerships or data access.',
    sections: [
      {
        title: 'General',
        items: [
          'hello@monitored.local',
          'Expected response: 1-2 business days',
        ],
      },
      {
        title: 'Enterprise',
        items: [
          'enterprise@monitored.local',
          'Private feeds, alerting, and custom SLAs',
        ],
      },
    ],
  },
  {
    id: 'about',
    label: 'About',
    summary: 'Monitoring The Situation is a live intelligence map.',
    sections: [
      {
        title: 'Mission',
        items: [
          'Surface breaking stories, fast',
          'Blend verified sources with curated signals',
          'Make context as visual as the headlines',
        ],
      },
      {
        title: 'Focus',
        items: [
          'Global news, markets, and social signals',
          'Regional context with hotspot overlays',
          'Explainable summaries, not just feeds',
        ],
      },
    ],
  },
  {
    id: 'privacy',
    label: 'Privacy',
    summary: 'High-level privacy and data handling notes.',
    sections: [
      {
        title: 'Data sources',
        items: [
          'Public feeds and licensed APIs',
          'No personal data collection by default',
        ],
      },
      {
        title: 'Your data',
        items: [
          'Preferences stored locally in the browser',
          'No analytics sent until explicitly enabled',
        ],
      },
    ],
  },
];
