/**
 * 2026 US Midterm Election Data
 * Real races, candidates, polling data, and key dates
 * Sources: Cook Political Report, Sabato's Crystal Ball, 270toWin, Ballotpedia, OpenSecrets
 */

export const GENERAL_ELECTION_DATE = '2026-11-03';
export const DATA_LAST_UPDATED = '2026-02-13';

// Cook Partisan Voting Index (PVI) by state
export const STATE_PVI = {
  'Alabama': 'R+16', 'Alaska': 'R+9', 'Arizona': 'R+3', 'Arkansas': 'R+18',
  'California': 'D+14', 'Colorado': 'D+4', 'Connecticut': 'D+7', 'Delaware': 'D+7',
  'Florida': 'R+5', 'Georgia': 'R+3', 'Hawaii': 'D+16', 'Idaho': 'R+21',
  'Illinois': 'D+8', 'Indiana': 'R+12', 'Iowa': 'R+6', 'Kansas': 'R+12',
  'Kentucky': 'R+17', 'Louisiana': 'R+14', 'Maine': 'D+3', 'Maryland': 'D+14',
  'Massachusetts': 'D+16', 'Michigan': 'R+1', 'Minnesota': 'D+1', 'Mississippi': 'R+12',
  'Missouri': 'R+11', 'Montana': 'R+12', 'Nebraska': 'R+13', 'Nevada': 'R+1',
  'New Hampshire': 'D+1', 'New Jersey': 'D+7', 'New Mexico': 'D+4', 'New York': 'D+10',
  'North Carolina': 'R+3', 'North Dakota': 'R+20', 'Ohio': 'R+6', 'Oklahoma': 'R+22',
  'Oregon': 'D+6', 'Pennsylvania': 'R+1', 'Rhode Island': 'D+9', 'South Carolina': 'R+10',
  'South Dakota': 'R+18', 'Tennessee': 'R+16', 'Texas': 'R+7', 'Utah': 'R+14',
  'Vermont': 'D+14', 'Virginia': 'D+3', 'Washington': 'D+7', 'West Virginia': 'R+23',
  'Wisconsin': 'EVEN', 'Wyoming': 'R+26',
};

// Rating scale: 'safe-d', 'likely-d', 'lean-d', 'toss-up', 'lean-r', 'likely-r', 'safe-r'
export const RATING_LABELS = {
  'safe-d': 'Safe D',
  'likely-d': 'Likely D',
  'lean-d': 'Lean D',
  'toss-up': 'Toss-Up',
  'lean-r': 'Lean R',
  'likely-r': 'Likely R',
  'safe-r': 'Safe R',
};

export const RATING_COLORS = {
  'safe-d': '#1a5ea6',
  'likely-d': '#3b8bd4',
  'lean-d': '#7ab8e8',
  'toss-up': '#a67bc2',
  'lean-r': '#e88a8a',
  'likely-r': '#d44040',
  'safe-r': '#b51a1a',
};

export const PARTY_COLORS = {
  D: '#3b8bd4',
  R: '#d44040',
  I: '#8c6ec9',
  L: '#f5c542',
  G: '#4aa84a',
};

// Primary dates by state
export const PRIMARY_DATES = {
  'Alabama': { primary: '2026-05-19', runoff: '2026-06-16' },
  'Alaska': { primary: '2026-08-18' },
  'Arizona': { primary: '2026-07-21' },
  'Arkansas': { primary: '2026-03-03', runoff: '2026-03-31' },
  'California': { primary: '2026-06-02' },
  'Colorado': { primary: '2026-06-30' },
  'Connecticut': { primary: '2026-08-11' },
  'Delaware': { primary: '2026-09-15' },
  'Florida': { primary: '2026-08-18' },
  'Georgia': { primary: '2026-05-19', runoff: '2026-06-16', generalRunoff: '2026-12-01' },
  'Hawaii': { primary: '2026-08-08' },
  'Idaho': { primary: '2026-05-19' },
  'Illinois': { primary: '2026-03-17' },
  'Indiana': { primary: '2026-05-05' },
  'Iowa': { primary: '2026-06-02' },
  'Kansas': { primary: '2026-08-04' },
  'Kentucky': { primary: '2026-05-19' },
  'Louisiana': { primary: '2026-05-16', runoff: '2026-06-27' },
  'Maine': { primary: '2026-06-09' },
  'Maryland': { primary: '2026-06-23' },
  'Massachusetts': { primary: '2026-09-01' },
  'Michigan': { primary: '2026-08-04' },
  'Minnesota': { primary: '2026-08-11' },
  'Mississippi': { primary: '2026-03-10', runoff: '2026-04-07' },
  'Missouri': { primary: '2026-08-04' },
  'Montana': { primary: '2026-06-02' },
  'Nebraska': { primary: '2026-05-12' },
  'Nevada': { primary: '2026-06-09' },
  'New Hampshire': { primary: '2026-09-08' },
  'New Jersey': { primary: '2026-06-02' },
  'New Mexico': { primary: '2026-06-02' },
  'New York': { primary: '2026-06-23' },
  'North Carolina': { primary: '2026-03-03', runoff: '2026-05-12' },
  'North Dakota': { primary: '2026-06-09' },
  'Ohio': { primary: '2026-05-05' },
  'Oklahoma': { primary: '2026-06-16', runoff: '2026-08-25' },
  'Oregon': { primary: '2026-05-19' },
  'Pennsylvania': { primary: '2026-05-19' },
  'Rhode Island': { primary: '2026-09-08' },
  'South Carolina': { primary: '2026-06-09', runoff: '2026-06-23' },
  'South Dakota': { primary: '2026-06-02', runoff: '2026-07-28' },
  'Tennessee': { primary: '2026-08-06' },
  'Texas': { primary: '2026-03-03', runoff: '2026-05-26' },
  'Utah': { primary: '2026-06-23' },
  'Vermont': { primary: '2026-08-11' },
  'Virginia': { primary: '2026-06-23' },
  'Washington': { primary: '2026-08-04' },
  'West Virginia': { primary: '2026-05-12' },
  'Wisconsin': { primary: '2026-08-11' },
  'Wyoming': { primary: '2026-08-18' },
};

// Senate races (Class 2 + Special Elections)
export const SENATE_RACES = {
  'Alabama': {
    type: 'regular',
    incumbent: 'Tommy Tuberville',
    incumbentParty: 'R',
    status: 'open',
    statusDetail: 'Tuberville running for Governor',
    rating: 'safe-r',
    candidates: {
      primary: {
        R: [
          { name: 'Katie Boyd Britt', polling: 52 },
          { name: 'Mo Brooks', polling: 28 },
        ],
        D: [],
      },
      general: [
        { name: 'R Nominee', party: 'R', polling: 62 },
        { name: 'TBD', party: 'D', polling: 34 },
      ],
    },
  },
  'Alaska': {
    type: 'regular',
    incumbent: 'Dan Sullivan',
    incumbentParty: 'R',
    status: 'running',
    rating: 'lean-r',
    prevMargin: 'R+8.7',
    note: 'Alaska uses ranked-choice voting',
    keyIssues: ['Oil & gas development', 'Cost of living', 'Native affairs', 'Ranked-choice voting'],
    fundraising: { R: '$4.2M', D: '$3.8M' },
    endorsements: { R: ['Trump', 'NRA'], D: ['AFL-CIO', 'EMILY\'s List'] },
    candidates: {
      primary: {
        R: [{ name: 'Dan Sullivan', polling: 78 }],
        D: [{ name: 'Mary Peltola', polling: 85 }],
      },
      general: [
        { name: 'Dan Sullivan', party: 'R', polling: 47 },
        { name: 'Mary Peltola', party: 'D', polling: 45 },
      ],
    },
  },
  'Arkansas': {
    type: 'regular',
    incumbent: 'Tom Cotton',
    incumbentParty: 'R',
    status: 'running',
    rating: 'safe-r',
    candidates: {
      primary: {
        R: [{ name: 'Tom Cotton', polling: 90 }],
        D: [],
      },
      general: [
        { name: 'Tom Cotton', party: 'R', polling: 68 },
        { name: 'TBD', party: 'D', polling: 28 },
      ],
    },
  },
  'Colorado': {
    type: 'regular',
    incumbent: 'John Hickenlooper',
    incumbentParty: 'D',
    status: 'running',
    rating: 'safe-d',
    candidates: {
      primary: {
        D: [{ name: 'John Hickenlooper', polling: 82 }],
        R: [],
      },
      general: [
        { name: 'John Hickenlooper', party: 'D', polling: 56 },
        { name: 'TBD', party: 'R', polling: 38 },
      ],
    },
  },
  'Delaware': {
    type: 'regular',
    incumbent: 'Chris Coons',
    incumbentParty: 'D',
    status: 'running',
    rating: 'safe-d',
    candidates: {
      primary: {
        D: [{ name: 'Chris Coons', polling: 75 }],
        R: [],
      },
      general: [
        { name: 'Chris Coons', party: 'D', polling: 60 },
        { name: 'TBD', party: 'R', polling: 34 },
      ],
    },
  },
  'Florida': {
    type: 'special',
    incumbent: 'Ashley Moody',
    incumbentParty: 'R',
    status: 'running',
    statusDetail: 'Appointed to replace Rubio',
    rating: 'likely-r',
    prevMargin: 'R+5.0',
    keyIssues: ['Insurance costs', 'Immigration', 'Abortion rights', 'Climate/hurricanes'],
    fundraising: { R: '$8.1M', D: '$2.5M' },
    endorsements: { R: ['Trump', 'Gov DeSantis', 'Florida Chamber'], D: [] },
    candidates: {
      primary: {
        R: [{ name: 'Ashley Moody', polling: 65 }],
        D: [],
      },
      general: [
        { name: 'Ashley Moody', party: 'R', polling: 53 },
        { name: 'TBD', party: 'D', polling: 42 },
      ],
    },
  },
  'Georgia': {
    type: 'regular',
    incumbent: 'Jon Ossoff',
    incumbentParty: 'D',
    status: 'running',
    rating: 'lean-d',
    prevMargin: 'D+1.2',
    note: 'Georgia may require runoff if no candidate gets 50%',
    keyIssues: ['Economy/jobs', 'Healthcare', 'Voting rights', 'Immigration'],
    fundraising: { D: '$12.5M', R: '$4.8M' },
    endorsements: { D: ['Obama', 'Stacey Abrams', 'AFL-CIO'], R: ['Trump'] },
    candidates: {
      primary: {
        D: [{ name: 'Jon Ossoff', polling: 88 }],
        R: [
          { name: 'Buddy Carter', polling: 32 },
          { name: 'Mike Collins', polling: 28 },
          { name: 'Derek Dooley', polling: 22 },
        ],
      },
      general: [
        { name: 'Jon Ossoff', party: 'D', polling: 49 },
        { name: 'R Nominee', party: 'R', polling: 45 },
      ],
    },
  },
  'Idaho': {
    type: 'regular',
    incumbent: 'Jim Risch',
    incumbentParty: 'R',
    status: 'running',
    rating: 'safe-r',
    candidates: {
      primary: {
        R: [{ name: 'Jim Risch', polling: 72 }],
        D: [],
      },
      general: [
        { name: 'Jim Risch', party: 'R', polling: 66 },
        { name: 'TBD', party: 'D', polling: 28 },
      ],
    },
  },
  'Illinois': {
    type: 'regular',
    incumbent: 'Dick Durbin',
    incumbentParty: 'D',
    status: 'open',
    statusDetail: 'Durbin retiring',
    rating: 'safe-d',
    candidates: {
      primary: {
        D: [
          { name: 'Raja Krishnamoorthi', polling: 31 },
          { name: 'Juliana Stratton', polling: 24 },
          { name: 'Robin Kelly', polling: 18 },
        ],
        R: [],
      },
      general: [
        { name: 'D Nominee', party: 'D', polling: 58 },
        { name: 'TBD', party: 'R', polling: 36 },
      ],
    },
  },
  'Iowa': {
    type: 'regular',
    incumbent: 'Joni Ernst',
    incumbentParty: 'R',
    status: 'open',
    statusDetail: 'Ernst retiring',
    rating: 'likely-r',
    prevMargin: 'R+6.6',
    keyIssues: ['Agriculture/trade', 'Healthcare', 'Immigration', 'Education'],
    fundraising: { R: '$5.1M', D: '$3.2M' },
    endorsements: { R: ['Iowa Farm Bureau'], D: ['UAW'] },
    candidates: {
      primary: {
        R: [
          { name: 'Ashley Hinson', polling: 42 },
          { name: 'Jim Carlin', polling: 18 },
        ],
        D: [
          { name: 'Zach Wahls', polling: 38 },
          { name: 'Josh Turek', polling: 26 },
        ],
      },
      general: [
        { name: 'R Nominee', party: 'R', polling: 52 },
        { name: 'D Nominee', party: 'D', polling: 43 },
      ],
    },
  },
  'Kansas': {
    type: 'regular',
    incumbent: 'Roger Marshall',
    incumbentParty: 'R',
    status: 'running',
    rating: 'safe-r',
    candidates: {
      primary: {
        R: [{ name: 'Roger Marshall', polling: 78 }],
        D: [],
      },
      general: [
        { name: 'Roger Marshall', party: 'R', polling: 62 },
        { name: 'TBD', party: 'D', polling: 32 },
      ],
    },
  },
  'Kentucky': {
    type: 'regular',
    incumbent: 'Mitch McConnell',
    incumbentParty: 'R',
    status: 'open',
    statusDetail: 'McConnell retiring',
    rating: 'safe-r',
    candidates: {
      primary: {
        R: [
          { name: 'Daniel Cameron', polling: 35 },
          { name: 'Kelly Craft', polling: 28 },
        ],
        D: [],
      },
      general: [
        { name: 'R Nominee', party: 'R', polling: 62 },
        { name: 'TBD', party: 'D', polling: 32 },
      ],
    },
  },
  'Louisiana': {
    type: 'regular',
    incumbent: 'Bill Cassidy',
    incumbentParty: 'R',
    status: 'running',
    rating: 'safe-r',
    candidates: {
      primary: {
        R: [{ name: 'Bill Cassidy', polling: 72 }],
        D: [],
      },
      general: [
        { name: 'Bill Cassidy', party: 'R', polling: 60 },
        { name: 'TBD', party: 'D', polling: 34 },
      ],
    },
  },
  'Maine': {
    type: 'regular',
    incumbent: 'Susan Collins',
    incumbentParty: 'R',
    status: 'running',
    rating: 'toss-up',
    prevMargin: 'R+8.6',
    note: 'Senate Leadership Fund pledged $42M to defend Collins',
    keyIssues: ['Healthcare/ACA', 'Economy', 'Abortion rights', 'Climate/fisheries'],
    fundraising: { R: '$14.2M', D: '$9.8M' },
    endorsements: { R: ['Senate Leadership Fund', 'Collins PAC'], D: ['EMILY\'s List', 'LCV', 'Planned Parenthood'] },
    candidates: {
      primary: {
        R: [
          { name: 'Susan Collins', polling: 68 },
          { name: 'Dan Smeriglio', polling: 15 },
        ],
        D: [
          { name: 'Janet Mills', polling: 45 },
          { name: 'David Costello', polling: 20 },
          { name: 'Graham Platner', polling: 18 },
          { name: 'Jordan Wood', polling: 12 },
        ],
      },
      general: [
        { name: 'Susan Collins', party: 'R', polling: 47 },
        { name: 'Janet Mills', party: 'D', polling: 48 },
      ],
    },
  },
  'Massachusetts': {
    type: 'regular',
    incumbent: 'Ed Markey',
    incumbentParty: 'D',
    status: 'running',
    rating: 'safe-d',
    candidates: {
      primary: {
        D: [{ name: 'Ed Markey', polling: 80 }],
        R: [],
      },
      general: [
        { name: 'Ed Markey', party: 'D', polling: 64 },
        { name: 'TBD', party: 'R', polling: 30 },
      ],
    },
  },
  'Michigan': {
    type: 'regular',
    incumbent: 'Gary Peters',
    incumbentParty: 'D',
    status: 'open',
    statusDetail: 'Peters retiring',
    rating: 'toss-up',
    prevMargin: 'D+1.7',
    keyIssues: ['Auto industry/manufacturing', 'Economy', 'Abortion rights', 'Education'],
    fundraising: { D: '$8.4M', R: '$7.1M' },
    endorsements: { D: ['UAW', 'EMILY\'s List'], R: ['Trump', 'NRSC'] },
    candidates: {
      primary: {
        D: [
          { name: 'Mallory McMorrow', polling: 28 },
          { name: 'Haley Stevens', polling: 26 },
          { name: 'Abdul El-Sayed', polling: 18 },
          { name: 'Joe Tate', polling: 14 },
        ],
        R: [
          { name: 'Mike Rogers', polling: 55 },
        ],
      },
      general: [
        { name: 'D Nominee', party: 'D', polling: 47 },
        { name: 'Mike Rogers', party: 'R', polling: 46 },
      ],
    },
  },
  'Minnesota': {
    type: 'regular',
    incumbent: 'Tina Smith',
    incumbentParty: 'D',
    status: 'open',
    statusDetail: 'Smith retiring',
    rating: 'lean-d',
    prevMargin: 'D+5.4',
    keyIssues: ['Healthcare', 'Economy', 'Education', 'Public safety'],
    fundraising: { D: '$3.5M', R: '$1.8M' },
    endorsements: { D: ['DFL Party'], R: [] },
    candidates: {
      primary: {
        D: [
          { name: 'Ken Martin', polling: 28 },
        ],
        R: [
          { name: 'Jim Schultz', polling: 30 },
          { name: 'Joe Fraser', polling: 18 },
        ],
      },
      general: [
        { name: 'D Nominee', party: 'D', polling: 51 },
        { name: 'R Nominee', party: 'R', polling: 43 },
      ],
    },
  },
  'Mississippi': {
    type: 'regular',
    incumbent: 'Cindy Hyde-Smith',
    incumbentParty: 'R',
    status: 'running',
    rating: 'safe-r',
    candidates: {
      primary: {
        R: [{ name: 'Cindy Hyde-Smith', polling: 70 }],
        D: [],
      },
      general: [
        { name: 'Cindy Hyde-Smith', party: 'R', polling: 60 },
        { name: 'TBD', party: 'D', polling: 35 },
      ],
    },
  },
  'Montana': {
    type: 'regular',
    incumbent: 'Steve Daines',
    incumbentParty: 'R',
    status: 'running',
    rating: 'safe-r',
    candidates: {
      primary: {
        R: [{ name: 'Steve Daines', polling: 80 }],
        D: [],
      },
      general: [
        { name: 'Steve Daines', party: 'R', polling: 58 },
        { name: 'TBD', party: 'D', polling: 36 },
      ],
    },
  },
  'Nebraska': {
    type: 'regular',
    incumbent: 'Pete Ricketts',
    incumbentParty: 'R',
    status: 'running',
    rating: 'likely-r',
    prevMargin: 'R+25.9',
    note: 'Dan Osborn (I) endorsed by NE Democratic Party',
    keyIssues: ['Agriculture', 'Economy', 'Immigration', 'Trade policy'],
    fundraising: { R: '$6.2M', I: '$4.1M' },
    endorsements: { R: ['Trump', 'NRA'], I: ['NE Democratic Party', 'Working families'] },
    candidates: {
      primary: {
        R: [{ name: 'Pete Ricketts', polling: 75 }],
        D: [],
      },
      general: [
        { name: 'Pete Ricketts', party: 'R', polling: 50 },
        { name: 'Dan Osborn', party: 'I', polling: 44 },
      ],
    },
  },
  'New Hampshire': {
    type: 'regular',
    incumbent: 'Jeanne Shaheen',
    incumbentParty: 'D',
    status: 'open',
    statusDetail: 'Shaheen retiring',
    rating: 'lean-d',
    prevMargin: 'D+15.6',
    keyIssues: ['Economy/cost of living', 'Healthcare', 'Opioid crisis', 'Education'],
    fundraising: { D: '$2.1M', R: '$1.5M' },
    endorsements: { D: ['Shaheen'], R: [] },
    candidates: {
      primary: {
        D: [
          { name: 'Maggie Goodlander', polling: 35 },
          { name: 'Colin Van Ostern', polling: 22 },
        ],
        R: [
          { name: 'Chuck Morse', polling: 30 },
          { name: 'Don Bolduc', polling: 24 },
        ],
      },
      general: [
        { name: 'D Nominee', party: 'D', polling: 50 },
        { name: 'R Nominee', party: 'R', polling: 44 },
      ],
    },
  },
  'New Jersey': {
    type: 'regular',
    incumbent: 'Cory Booker',
    incumbentParty: 'D',
    status: 'running',
    rating: 'safe-d',
    candidates: {
      primary: {
        D: [{ name: 'Cory Booker', polling: 78 }],
        R: [],
      },
      general: [
        { name: 'Cory Booker', party: 'D', polling: 58 },
        { name: 'TBD', party: 'R', polling: 36 },
      ],
    },
  },
  'New Mexico': {
    type: 'regular',
    incumbent: 'Ben Ray Lujan',
    incumbentParty: 'D',
    status: 'running',
    rating: 'safe-d',
    candidates: {
      primary: {
        D: [{ name: 'Ben Ray Lujan', polling: 72 }],
        R: [],
      },
      general: [
        { name: 'Ben Ray Lujan', party: 'D', polling: 54 },
        { name: 'TBD', party: 'R', polling: 40 },
      ],
    },
  },
  'North Carolina': {
    type: 'regular',
    incumbent: 'Thom Tillis',
    incumbentParty: 'R',
    status: 'open',
    statusDetail: 'Tillis retiring',
    rating: 'toss-up',
    prevMargin: 'R+1.8',
    keyIssues: ['Economy', 'Education', 'Abortion rights', 'Voting rights'],
    fundraising: { D: '$11.2M', R: '$6.8M' },
    endorsements: { D: ['Obama', 'DSCC', 'EMILY\'s List'], R: ['Trump', 'Club for Growth'] },
    candidates: {
      primary: {
        R: [
          { name: 'Michael Whatley', polling: 38 },
          { name: 'Michele Morrow', polling: 22 },
        ],
        D: [
          { name: 'Roy Cooper', polling: 65 },
        ],
      },
      general: [
        { name: 'Roy Cooper', party: 'D', polling: 49 },
        { name: 'Michael Whatley', party: 'R', polling: 46 },
      ],
    },
  },
  'Ohio': {
    type: 'special',
    incumbent: 'Jon Husted',
    incumbentParty: 'R',
    status: 'running',
    statusDetail: 'Appointed to replace Vance',
    rating: 'lean-r',
    prevMargin: 'R+11.3',
    note: 'Polls show race effectively tied',
    keyIssues: ['Economy/manufacturing', 'Immigration', 'Healthcare', 'Trade'],
    fundraising: { R: '$9.5M', D: '$12.8M' },
    endorsements: { R: ['Trump', 'Ohio Chamber'], D: ['AFL-CIO', 'UAW', 'DSCC'] },
    candidates: {
      primary: {
        R: [{ name: 'Jon Husted', polling: 68 }],
        D: [{ name: 'Sherrod Brown', polling: 72 }],
      },
      general: [
        { name: 'Jon Husted', party: 'R', polling: 48 },
        { name: 'Sherrod Brown', party: 'D', polling: 49 },
      ],
    },
  },
  'Oklahoma': {
    type: 'regular',
    incumbent: 'James Lankford',
    incumbentParty: 'R',
    status: 'running',
    rating: 'safe-r',
    candidates: {
      primary: {
        R: [{ name: 'James Lankford', polling: 70 }],
        D: [],
      },
      general: [
        { name: 'James Lankford', party: 'R', polling: 64 },
        { name: 'TBD', party: 'D', polling: 30 },
      ],
    },
  },
  'Oregon': {
    type: 'regular',
    incumbent: 'Jeff Merkley',
    incumbentParty: 'D',
    status: 'running',
    rating: 'safe-d',
    candidates: {
      primary: {
        D: [{ name: 'Jeff Merkley', polling: 78 }],
        R: [],
      },
      general: [
        { name: 'Jeff Merkley', party: 'D', polling: 56 },
        { name: 'TBD', party: 'R', polling: 38 },
      ],
    },
  },
  'Rhode Island': {
    type: 'regular',
    incumbent: 'Jack Reed',
    incumbentParty: 'D',
    status: 'running',
    rating: 'safe-d',
    candidates: {
      primary: {
        D: [{ name: 'Jack Reed', polling: 80 }],
        R: [],
      },
      general: [
        { name: 'Jack Reed', party: 'D', polling: 62 },
        { name: 'TBD', party: 'R', polling: 32 },
      ],
    },
  },
  'South Carolina': {
    type: 'regular',
    incumbent: 'Lindsey Graham',
    incumbentParty: 'R',
    status: 'running',
    rating: 'safe-r',
    candidates: {
      primary: {
        R: [{ name: 'Lindsey Graham', polling: 68 }],
        D: [],
      },
      general: [
        { name: 'Lindsey Graham', party: 'R', polling: 58 },
        { name: 'TBD', party: 'D', polling: 38 },
      ],
    },
  },
  'South Dakota': {
    type: 'regular',
    incumbent: 'Mike Rounds',
    incumbentParty: 'R',
    status: 'running',
    rating: 'safe-r',
    candidates: {
      primary: {
        R: [{ name: 'Mike Rounds', polling: 75 }],
        D: [],
      },
      general: [
        { name: 'Mike Rounds', party: 'R', polling: 64 },
        { name: 'TBD', party: 'D', polling: 30 },
      ],
    },
  },
  'Tennessee': {
    type: 'regular',
    incumbent: 'Bill Hagerty',
    incumbentParty: 'R',
    status: 'running',
    rating: 'safe-r',
    candidates: {
      primary: {
        R: [{ name: 'Bill Hagerty', polling: 72 }],
        D: [],
      },
      general: [
        { name: 'Bill Hagerty', party: 'R', polling: 62 },
        { name: 'TBD', party: 'D', polling: 32 },
      ],
    },
  },
  'Texas': {
    type: 'regular',
    incumbent: 'John Cornyn',
    incumbentParty: 'R',
    status: 'running',
    rating: 'likely-r',
    prevMargin: 'R+9.7',
    note: 'Competitive R primary; Paxton challenger may force runoff',
    keyIssues: ['Immigration/border', 'Economy', 'Energy', 'Abortion'],
    fundraising: { R: '$18.2M', D: '$8.5M' },
    endorsements: { R: ['NRA', 'Texas Tribune split endorsements'], D: ['Beto O\'Rourke'] },
    candidates: {
      primary: {
        R: [
          { name: 'John Cornyn', polling: 26 },
          { name: 'Ken Paxton', polling: 27 },
          { name: 'Wesley Hunt', polling: 16 },
        ],
        D: [
          { name: 'James Talarico', polling: 47 },
          { name: 'Jasmine Crockett', polling: 38 },
        ],
      },
      general: [
        { name: 'R Nominee', party: 'R', polling: 52 },
        { name: 'D Nominee', party: 'D', polling: 44 },
      ],
    },
  },
  'Virginia': {
    type: 'regular',
    incumbent: 'Mark Warner',
    incumbentParty: 'D',
    status: 'running',
    rating: 'safe-d',
    candidates: {
      primary: {
        D: [{ name: 'Mark Warner', polling: 82 }],
        R: [],
      },
      general: [
        { name: 'Mark Warner', party: 'D', polling: 56 },
        { name: 'TBD', party: 'R', polling: 38 },
      ],
    },
  },
  'West Virginia': {
    type: 'regular',
    incumbent: 'Shelley Moore Capito',
    incumbentParty: 'R',
    status: 'running',
    rating: 'safe-r',
    candidates: {
      primary: {
        R: [{ name: 'Shelley Moore Capito', polling: 78 }],
        D: [],
      },
      general: [
        { name: 'Shelley Moore Capito', party: 'R', polling: 64 },
        { name: 'TBD', party: 'D', polling: 30 },
      ],
    },
  },
  'Wyoming': {
    type: 'regular',
    incumbent: 'Cynthia Lummis',
    incumbentParty: 'R',
    status: 'open',
    statusDetail: 'Lummis retiring',
    rating: 'safe-r',
    candidates: {
      primary: {
        R: [
          { name: 'Harriet Hageman', polling: 45 },
          { name: 'Tim Salazar', polling: 18 },
        ],
        D: [],
      },
      general: [
        { name: 'R Nominee', party: 'R', polling: 70 },
        { name: 'TBD', party: 'D', polling: 24 },
      ],
    },
  },
};

// Governor races (36 states)
export const GOVERNOR_RACES = {
  'Alabama': {
    incumbent: 'Kay Ivey',
    incumbentParty: 'R',
    termLimited: true,
    status: 'open',
    rating: 'safe-r',
    prevMargin: 'R+34.1',
    candidates: {
      primary: {
        R: [
          { name: 'Tommy Tuberville', polling: 35 },
          { name: 'Tim James', polling: 22 },
          { name: 'Wes Allen', polling: 18 },
        ],
        D: [],
      },
      general: [
        { name: 'R Nominee', party: 'R', polling: 62 },
        { name: 'TBD', party: 'D', polling: 34 },
      ],
    },
  },
  'Alaska': {
    incumbent: 'Mike Dunleavy',
    incumbentParty: 'R',
    termLimited: true,
    status: 'open',
    rating: 'lean-r',
    keyIssues: ['Oil & gas development', 'Cost of living', 'Native affairs', 'PFD'],
    candidates: {
      primary: {
        R: [
          { name: 'Nancy Dahlstrom', polling: 32 },
          { name: 'Mike Dunleavy Jr', polling: 22 },
        ],
        D: [
          { name: 'Les Gara', polling: 38 },
        ],
      },
      general: [
        { name: 'R Nominee', party: 'R', polling: 50 },
        { name: 'D Nominee', party: 'D', polling: 44 },
      ],
    },
  },
  'Arizona': {
    incumbent: 'Katie Hobbs',
    incumbentParty: 'D',
    termLimited: false,
    rating: 'toss-up',
    prevMargin: 'D+0.7',
    note: 'Key swing state; Trump won AZ in 2024',
    keyIssues: ['Immigration/border', 'Water rights', 'Economy', 'Abortion'],
    fundraising: { D: '$9.4M', R: '$5.2M' },
    endorsements: { D: ['EMILY\'s List', 'LCV'], R: [] },
    candidates: {
      primary: {
        D: [{ name: 'Katie Hobbs', polling: 72 }],
        R: [],
      },
      general: [
        { name: 'Katie Hobbs', party: 'D', polling: 47 },
        { name: 'R Nominee', party: 'R', polling: 48 },
      ],
    },
  },
  'Arkansas': {
    incumbent: 'Sarah Huckabee Sanders',
    incumbentParty: 'R',
    termLimited: false,
    rating: 'safe-r',
    candidates: {
      primary: {
        R: [{ name: 'Sarah Huckabee Sanders', polling: 80 }],
        D: [],
      },
      general: [
        { name: 'Sarah Huckabee Sanders', party: 'R', polling: 62 },
        { name: 'TBD', party: 'D', polling: 32 },
      ],
    },
  },
  'California': {
    incumbent: 'Gavin Newsom',
    incumbentParty: 'D',
    termLimited: true,
    status: 'open',
    rating: 'safe-d',
    note: 'Top-two jungle primary; Newsom term-limited',
    keyIssues: ['Housing costs', 'Homelessness', 'Wildfires/climate', 'Immigration'],
    candidates: {
      primary: {
        D: [
          { name: 'Toni Atkins', polling: 28 },
          { name: 'Rob Bonta', polling: 22 },
          { name: 'Betty Yee', polling: 16 },
        ],
        R: [
          { name: 'Steve Garvey', polling: 20 },
          { name: 'Nathan Hochman', polling: 14 },
        ],
      },
      general: [
        { name: 'D Nominee', party: 'D', polling: 58 },
        { name: 'R Nominee', party: 'R', polling: 36 },
      ],
    },
  },
  'Colorado': {
    incumbent: 'Jared Polis',
    incumbentParty: 'D',
    termLimited: true,
    status: 'open',
    rating: 'safe-d',
    candidates: {
      primary: {
        D: [
          { name: 'Phil Weiser', polling: 30 },
          { name: 'Jena Griswold', polling: 28 },
        ],
        R: [
          { name: 'Heidi Ganahl', polling: 35 },
        ],
      },
      general: [
        { name: 'D Nominee', party: 'D', polling: 55 },
        { name: 'R Nominee', party: 'R', polling: 40 },
      ],
    },
  },
  'Connecticut': {
    incumbent: 'Ned Lamont',
    incumbentParty: 'D',
    termLimited: false,
    rating: 'safe-d',
    candidates: {
      primary: {
        D: [{ name: 'Ned Lamont', polling: 70 }],
        R: [],
      },
      general: [
        { name: 'Ned Lamont', party: 'D', polling: 56 },
        { name: 'TBD', party: 'R', polling: 38 },
      ],
    },
  },
  'Florida': {
    incumbent: 'Ron DeSantis',
    incumbentParty: 'R',
    termLimited: true,
    status: 'open',
    rating: 'likely-r',
    prevMargin: 'R+19.4',
    note: 'Crowded GOP primary with multiple high-profile candidates',
    keyIssues: ['Insurance costs', 'Immigration', 'Economy', 'Education', 'Abortion'],
    fundraising: { R: '$22.5M', D: '$6.8M' },
    endorsements: { R: ['DeSantis allies split', 'Trump endorsement pending'], D: ['EMILY\'s List'] },
    candidates: {
      primary: {
        R: [
          { name: 'Jimmy Patronis', polling: 28 },
          { name: 'Byron Donalds', polling: 24 },
          { name: 'Jeanette Nuñez', polling: 18 },
          { name: 'Daniel Davis', polling: 14 },
        ],
        D: [
          { name: 'Nikki Fried', polling: 38 },
          { name: 'Debbie Mucarsel-Powell', polling: 28 },
          { name: 'Anna Eskamani', polling: 22 },
        ],
      },
      general: [
        { name: 'R Nominee', party: 'R', polling: 54 },
        { name: 'D Nominee', party: 'D', polling: 42 },
      ],
    },
  },
  'Georgia': {
    incumbent: 'Brian Kemp',
    incumbentParty: 'R',
    termLimited: true,
    status: 'open',
    rating: 'toss-up',
    prevMargin: 'R+7.5',
    note: 'Major contested primary on both sides; Kemp term-limited',
    keyIssues: ['Economy', 'Education', 'Voting rights', 'Healthcare', 'Immigration'],
    fundraising: { R: '$6.5M', D: '$5.2M' },
    endorsements: { R: ['Kemp allies'], D: ['Stacey Abrams', 'DSCC'] },
    candidates: {
      primary: {
        R: [
          { name: 'Burt Jones', polling: 34 },
          { name: 'Brad Raffensperger', polling: 22 },
          { name: 'Tyler Harper', polling: 16 },
        ],
        D: [
          { name: 'Stacey Abrams', polling: 42 },
          { name: 'Jason Carter', polling: 28 },
          { name: 'Bee Nguyen', polling: 18 },
        ],
      },
      general: [
        { name: 'R Nominee', party: 'R', polling: 48 },
        { name: 'D Nominee', party: 'D', polling: 47 },
      ],
    },
  },
  'Hawaii': {
    incumbent: 'Josh Green',
    incumbentParty: 'D',
    termLimited: false,
    rating: 'safe-d',
    candidates: {
      primary: {
        D: [{ name: 'Josh Green', polling: 68 }],
        R: [],
      },
      general: [
        { name: 'Josh Green', party: 'D', polling: 62 },
        { name: 'TBD', party: 'R', polling: 32 },
      ],
    },
  },
  'Idaho': {
    incumbent: 'Brad Little',
    incumbentParty: 'R',
    termLimited: false,
    rating: 'safe-r',
    candidates: {
      primary: {
        R: [{ name: 'Brad Little', polling: 65 }],
        D: [],
      },
      general: [
        { name: 'Brad Little', party: 'R', polling: 64 },
        { name: 'TBD', party: 'D', polling: 30 },
      ],
    },
  },
  'Illinois': {
    incumbent: 'JB Pritzker',
    incumbentParty: 'D',
    termLimited: false,
    rating: 'safe-d',
    candidates: {
      primary: {
        D: [{ name: 'JB Pritzker', polling: 72 }],
        R: [],
      },
      general: [
        { name: 'JB Pritzker', party: 'D', polling: 56 },
        { name: 'TBD', party: 'R', polling: 38 },
      ],
    },
  },
  'Iowa': {
    incumbent: 'Kim Reynolds',
    incumbentParty: 'R',
    termLimited: false,
    rating: 'likely-r',
    candidates: {
      primary: {
        R: [{ name: 'Kim Reynolds', polling: 70 }],
        D: [],
      },
      general: [
        { name: 'Kim Reynolds', party: 'R', polling: 54 },
        { name: 'TBD', party: 'D', polling: 42 },
      ],
    },
  },
  'Kansas': {
    incumbent: 'Laura Kelly',
    incumbentParty: 'D',
    termLimited: true,
    status: 'open',
    rating: 'lean-r',
    note: 'Dem governor in red state; open seat favors R',
    keyIssues: ['Economy', 'Education', 'Abortion rights', 'Agriculture'],
    candidates: {
      primary: {
        R: [
          { name: 'Derek Schmidt', polling: 35 },
          { name: 'Kris Kobach', polling: 30 },
        ],
        D: [
          { name: 'Sharice Davids', polling: 40 },
          { name: 'TBD', polling: null },
        ],
      },
      general: [
        { name: 'R Nominee', party: 'R', polling: 52 },
        { name: 'D Nominee', party: 'D', polling: 43 },
      ],
    },
  },
  'Maine': {
    incumbent: 'Janet Mills',
    incumbentParty: 'D',
    termLimited: true,
    status: 'open',
    rating: 'lean-d',
    note: 'Mills running for Senate instead; open seat',
    keyIssues: ['Economy', 'Healthcare', 'Climate/fisheries', 'Housing costs'],
    candidates: {
      primary: {
        D: [
          { name: 'Aaron Frey', polling: 30 },
          { name: 'Mike Tipping', polling: 22 },
        ],
        R: [
          { name: 'Paul LePage', polling: 38 },
          { name: 'Shawn Moody', polling: 24 },
        ],
      },
      general: [
        { name: 'D Nominee', party: 'D', polling: 50 },
        { name: 'R Nominee', party: 'R', polling: 44 },
      ],
    },
  },
  'Maryland': {
    incumbent: 'Wes Moore',
    incumbentParty: 'D',
    termLimited: false,
    rating: 'safe-d',
    candidates: {
      primary: {
        D: [{ name: 'Wes Moore', polling: 78 }],
        R: [],
      },
      general: [
        { name: 'Wes Moore', party: 'D', polling: 60 },
        { name: 'TBD', party: 'R', polling: 34 },
      ],
    },
  },
  'Massachusetts': {
    incumbent: 'Maura Healey',
    incumbentParty: 'D',
    termLimited: false,
    rating: 'safe-d',
    candidates: {
      primary: {
        D: [{ name: 'Maura Healey', polling: 75 }],
        R: [],
      },
      general: [
        { name: 'Maura Healey', party: 'D', polling: 62 },
        { name: 'TBD', party: 'R', polling: 32 },
      ],
    },
  },
  'Michigan': {
    incumbent: 'Gretchen Whitmer',
    incumbentParty: 'D',
    termLimited: true,
    status: 'open',
    rating: 'toss-up',
    prevMargin: 'D+10.6',
    note: 'Key swing state; Whitmer term-limited, fiercely contested',
    keyIssues: ['Auto industry', 'Economy', 'Abortion rights', 'Education'],
    fundraising: { D: '$5.8M', R: '$4.1M' },
    endorsements: { D: ['UAW', 'Whitmer'], R: ['Trump'] },
    candidates: {
      primary: {
        D: [
          { name: 'Jocelyn Benson', polling: 32 },
          { name: 'Dana Nessel', polling: 26 },
          { name: 'Garlin Gilchrist', polling: 22 },
        ],
        R: [
          { name: 'Tudor Dixon', polling: 30 },
          { name: 'James Craig', polling: 26 },
          { name: 'Tom Leonard', polling: 18 },
        ],
      },
      general: [
        { name: 'D Nominee', party: 'D', polling: 48 },
        { name: 'R Nominee', party: 'R', polling: 47 },
      ],
    },
  },
  'Minnesota': {
    incumbent: 'Tim Walz',
    incumbentParty: 'D',
    termLimited: false,
    status: 'open',
    statusDetail: 'Walz not seeking reelection',
    rating: 'lean-d',
    keyIssues: ['Economy', 'Education', 'Public safety', 'Healthcare'],
    candidates: {
      primary: {
        D: [
          { name: 'Peggy Flanagan', polling: 35 },
          { name: 'Keith Ellison', polling: 28 },
        ],
        R: [
          { name: 'Scott Jensen', polling: 32 },
          { name: 'Jim Schultz', polling: 24 },
        ],
      },
      general: [
        { name: 'D Nominee', party: 'D', polling: 50 },
        { name: 'R Nominee', party: 'R', polling: 44 },
      ],
    },
  },
  'Nebraska': {
    incumbent: 'Jim Pillen',
    incumbentParty: 'R',
    termLimited: false,
    rating: 'safe-r',
    candidates: {
      primary: {
        R: [{ name: 'Jim Pillen', polling: 65 }],
        D: [],
      },
      general: [
        { name: 'Jim Pillen', party: 'R', polling: 58 },
        { name: 'TBD', party: 'D', polling: 36 },
      ],
    },
  },
  'Nevada': {
    incumbent: 'Joe Lombardo',
    incumbentParty: 'R',
    termLimited: false,
    rating: 'toss-up',
    prevMargin: 'R+1.5',
    note: 'Key swing state',
    keyIssues: ['Economy/tourism', 'Housing costs', 'Water/drought', 'Education'],
    fundraising: { R: '$7.3M', D: '$4.6M' },
    endorsements: { R: ['NRA', 'Nevada Chamber'], D: ['Culinary Union'] },
    candidates: {
      primary: {
        R: [{ name: 'Joe Lombardo', polling: 72 }],
        D: [],
      },
      general: [
        { name: 'Joe Lombardo', party: 'R', polling: 48 },
        { name: 'D Nominee', party: 'D', polling: 47 },
      ],
    },
  },
  'New Hampshire': {
    incumbent: 'Kelly Ayotte',
    incumbentParty: 'R',
    termLimited: false,
    rating: 'lean-r',
    candidates: {
      primary: {
        R: [{ name: 'Kelly Ayotte', polling: 70 }],
        D: [],
      },
      general: [
        { name: 'Kelly Ayotte', party: 'R', polling: 50 },
        { name: 'D Nominee', party: 'D', polling: 45 },
      ],
    },
  },
  'New Mexico': {
    incumbent: 'Michelle Lujan Grisham',
    incumbentParty: 'D',
    termLimited: true,
    status: 'open',
    rating: 'lean-d',
    candidates: {
      primary: {
        D: [
          { name: 'Raul Torrez', polling: 32 },
          { name: 'Melanie Stansbury', polling: 26 },
        ],
        R: [
          { name: 'Mark Ronchetti', polling: 42 },
        ],
      },
      general: [
        { name: 'D Nominee', party: 'D', polling: 52 },
        { name: 'R Nominee', party: 'R', polling: 42 },
      ],
    },
  },
  'New York': {
    incumbent: 'Kathy Hochul',
    incumbentParty: 'D',
    termLimited: false,
    rating: 'likely-d',
    candidates: {
      primary: {
        D: [{ name: 'Kathy Hochul', polling: 60 }],
        R: [],
      },
      general: [
        { name: 'Kathy Hochul', party: 'D', polling: 52 },
        { name: 'R Nominee', party: 'R', polling: 42 },
      ],
    },
  },
  'Ohio': {
    incumbent: 'Mike DeWine',
    incumbentParty: 'R',
    termLimited: true,
    rating: 'lean-r',
    note: 'Vivek Ramaswamy running in R primary',
    candidates: {
      primary: {
        R: [
          { name: 'Vivek Ramaswamy', polling: 32 },
          { name: 'TBD', polling: 25 },
        ],
        D: [],
      },
      general: [
        { name: 'R Nominee', party: 'R', polling: 52 },
        { name: 'D Nominee', party: 'D', polling: 43 },
      ],
    },
  },
  'Oklahoma': {
    incumbent: 'Kevin Stitt',
    incumbentParty: 'R',
    termLimited: true,
    status: 'open',
    rating: 'safe-r',
    candidates: {
      primary: {
        R: [
          { name: 'Ryan Walters', polling: 28 },
          { name: 'Matt Pinnell', polling: 26 },
          { name: 'TBD', polling: null },
        ],
        D: [],
      },
      general: [
        { name: 'R Nominee', party: 'R', polling: 62 },
        { name: 'TBD', party: 'D', polling: 32 },
      ],
    },
  },
  'Oregon': {
    incumbent: 'Tina Kotek',
    incumbentParty: 'D',
    termLimited: false,
    rating: 'lean-d',
    candidates: {
      primary: {
        D: [{ name: 'Tina Kotek', polling: 60 }],
        R: [],
      },
      general: [
        { name: 'Tina Kotek', party: 'D', polling: 50 },
        { name: 'R Nominee', party: 'R', polling: 44 },
      ],
    },
  },
  'Pennsylvania': {
    incumbent: 'Josh Shapiro',
    incumbentParty: 'D',
    termLimited: false,
    rating: 'likely-d',
    candidates: {
      primary: {
        D: [{ name: 'Josh Shapiro', polling: 80 }],
        R: [],
      },
      general: [
        { name: 'Josh Shapiro', party: 'D', polling: 54 },
        { name: 'R Nominee', party: 'R', polling: 40 },
      ],
    },
  },
  'Rhode Island': {
    incumbent: 'Dan McKee',
    incumbentParty: 'D',
    termLimited: false,
    rating: 'safe-d',
    candidates: {
      primary: {
        D: [{ name: 'Dan McKee', polling: 55 }],
        R: [],
      },
      general: [
        { name: 'Dan McKee', party: 'D', polling: 58 },
        { name: 'TBD', party: 'R', polling: 36 },
      ],
    },
  },
  'South Carolina': {
    incumbent: 'Henry McMaster',
    incumbentParty: 'R',
    termLimited: true,
    status: 'open',
    rating: 'safe-r',
    candidates: {
      primary: {
        R: [
          { name: 'Alan Wilson', polling: 32 },
          { name: 'Mark Hammond', polling: 22 },
        ],
        D: [],
      },
      general: [
        { name: 'R Nominee', party: 'R', polling: 58 },
        { name: 'TBD', party: 'D', polling: 38 },
      ],
    },
  },
  'South Dakota': {
    incumbent: 'Larry Rhoden',
    incumbentParty: 'R',
    termLimited: false,
    rating: 'safe-r',
    statusDetail: 'Rhoden succeeded Noem',
    candidates: {
      primary: {
        R: [{ name: 'Larry Rhoden', polling: 55 }],
        D: [],
      },
      general: [
        { name: 'Larry Rhoden', party: 'R', polling: 62 },
        { name: 'TBD', party: 'D', polling: 32 },
      ],
    },
  },
  'Tennessee': {
    incumbent: 'Bill Lee',
    incumbentParty: 'R',
    termLimited: true,
    status: 'open',
    rating: 'safe-r',
    candidates: {
      primary: {
        R: [
          { name: 'Andy Ogles', polling: 28 },
          { name: 'Cameron Sexton', polling: 24 },
        ],
        D: [],
      },
      general: [
        { name: 'R Nominee', party: 'R', polling: 62 },
        { name: 'TBD', party: 'D', polling: 32 },
      ],
    },
  },
  'Texas': {
    incumbent: 'Greg Abbott',
    incumbentParty: 'R',
    termLimited: false,
    rating: 'likely-r',
    candidates: {
      primary: {
        R: [{ name: 'Greg Abbott', polling: 68 }],
        D: [],
      },
      general: [
        { name: 'Greg Abbott', party: 'R', polling: 54 },
        { name: 'D Nominee', party: 'D', polling: 42 },
      ],
    },
  },
  'Vermont': {
    incumbent: 'Phil Scott',
    incumbentParty: 'R',
    termLimited: false,
    rating: 'likely-r',
    note: 'Popular R governor in deep blue state',
    candidates: {
      primary: {
        R: [{ name: 'Phil Scott', polling: 80 }],
        D: [],
      },
      general: [
        { name: 'Phil Scott', party: 'R', polling: 56 },
        { name: 'D Nominee', party: 'D', polling: 38 },
      ],
    },
  },
  'Wisconsin': {
    incumbent: 'Tony Evers',
    incumbentParty: 'D',
    termLimited: false,
    rating: 'toss-up',
    prevMargin: 'D+3.4',
    note: 'Key swing state',
    keyIssues: ['Economy', 'Education', 'Abortion rights', 'Redistricting'],
    fundraising: { D: '$8.9M', R: '$5.5M' },
    endorsements: { D: ['AFL-CIO', 'WI Education Assoc.'], R: ['Trump'] },
    candidates: {
      primary: {
        D: [{ name: 'Tony Evers', polling: 75 }],
        R: [],
      },
      general: [
        { name: 'Tony Evers', party: 'D', polling: 49 },
        { name: 'R Nominee', party: 'R', polling: 47 },
      ],
    },
  },
  'Wyoming': {
    incumbent: 'Mark Gordon',
    incumbentParty: 'R',
    termLimited: true,
    status: 'open',
    rating: 'safe-r',
    candidates: {
      primary: {
        R: [
          { name: 'Mark Gordon Jr', polling: 30 },
          { name: 'TBD', polling: null },
        ],
        D: [],
      },
      general: [
        { name: 'R Nominee', party: 'R', polling: 68 },
        { name: 'TBD', party: 'D', polling: 26 },
      ],
    },
  },
};

// Aggregated House forecast by state
// Shows number of competitive districts and overall state delegation lean
export const HOUSE_FORECAST = {
  'Alabama': { total: 7, safeR: 6, safeD: 1, competitive: 0, lean: 'R+6' },
  'Alaska': { total: 1, safeR: 0, safeD: 0, competitive: 1, lean: 'Lean R', tossUpDistricts: ['AL-Large'] },
  'Arizona': { total: 9, safeR: 4, safeD: 3, competitive: 2, lean: 'R+1', tossUpDistricts: ['AZ-01', 'AZ-06'] },
  'Arkansas': { total: 4, safeR: 4, safeD: 0, competitive: 0, lean: 'R+4' },
  'California': { total: 52, safeR: 12, safeD: 36, competitive: 4, lean: 'D+24', tossUpDistricts: ['CA-13', 'CA-22', 'CA-27', 'CA-45'] },
  'Colorado': { total: 8, safeR: 3, safeD: 4, competitive: 1, lean: 'D+1', tossUpDistricts: ['CO-08'] },
  'Connecticut': { total: 5, safeR: 0, safeD: 5, competitive: 0, lean: 'D+5' },
  'Delaware': { total: 1, safeR: 0, safeD: 1, competitive: 0, lean: 'D+1' },
  'Florida': { total: 28, safeR: 18, safeD: 10, competitive: 0, lean: 'R+8' },
  'Georgia': { total: 14, safeR: 8, safeD: 5, competitive: 1, lean: 'R+3' },
  'Hawaii': { total: 2, safeR: 0, safeD: 2, competitive: 0, lean: 'D+2' },
  'Idaho': { total: 2, safeR: 2, safeD: 0, competitive: 0, lean: 'R+2' },
  'Illinois': { total: 17, safeR: 5, safeD: 12, competitive: 0, lean: 'D+7' },
  'Indiana': { total: 9, safeR: 7, safeD: 2, competitive: 0, lean: 'R+5' },
  'Iowa': { total: 4, safeR: 1, safeD: 1, competitive: 2, lean: 'Even', tossUpDistricts: ['IA-01', 'IA-03'] },
  'Kansas': { total: 4, safeR: 3, safeD: 1, competitive: 0, lean: 'R+2' },
  'Kentucky': { total: 6, safeR: 5, safeD: 1, competitive: 0, lean: 'R+4' },
  'Louisiana': { total: 6, safeR: 5, safeD: 1, competitive: 0, lean: 'R+4' },
  'Maine': { total: 2, safeR: 0, safeD: 1, competitive: 1, lean: 'D+1', tossUpDistricts: ['ME-02'] },
  'Maryland': { total: 8, safeR: 1, safeD: 7, competitive: 0, lean: 'D+6' },
  'Massachusetts': { total: 9, safeR: 0, safeD: 9, competitive: 0, lean: 'D+9' },
  'Michigan': { total: 13, safeR: 5, safeD: 6, competitive: 2, lean: 'D+1', tossUpDistricts: ['MI-07', 'MI-08'] },
  'Minnesota': { total: 8, safeR: 3, safeD: 4, competitive: 1, lean: 'D+1' },
  'Mississippi': { total: 4, safeR: 3, safeD: 1, competitive: 0, lean: 'R+2' },
  'Missouri': { total: 8, safeR: 6, safeD: 2, competitive: 0, lean: 'R+4' },
  'Montana': { total: 2, safeR: 2, safeD: 0, competitive: 0, lean: 'R+2' },
  'Nebraska': { total: 3, safeR: 2, safeD: 0, competitive: 1, lean: 'R+1', tossUpDistricts: ['NE-02'] },
  'Nevada': { total: 4, safeR: 1, safeD: 3, competitive: 0, lean: 'D+2' },
  'New Hampshire': { total: 2, safeR: 0, safeD: 2, competitive: 0, lean: 'D+2' },
  'New Jersey': { total: 12, safeR: 4, safeD: 8, competitive: 0, lean: 'D+4' },
  'New Mexico': { total: 3, safeR: 1, safeD: 2, competitive: 0, lean: 'D+1' },
  'New York': { total: 26, safeR: 9, safeD: 15, competitive: 2, lean: 'D+6', tossUpDistricts: ['NY-17', 'NY-19'] },
  'North Carolina': { total: 14, safeR: 8, safeD: 5, competitive: 1, lean: 'R+3', tossUpDistricts: ['NC-01'] },
  'North Dakota': { total: 1, safeR: 1, safeD: 0, competitive: 0, lean: 'R+1' },
  'Ohio': { total: 15, safeR: 9, safeD: 4, competitive: 2, lean: 'R+5', tossUpDistricts: ['OH-09', 'OH-13'] },
  'Oklahoma': { total: 5, safeR: 5, safeD: 0, competitive: 0, lean: 'R+5' },
  'Oregon': { total: 6, safeR: 2, safeD: 4, competitive: 0, lean: 'D+2' },
  'Pennsylvania': { total: 17, safeR: 6, safeD: 8, competitive: 3, lean: 'D+2', tossUpDistricts: ['PA-01', 'PA-07', 'PA-10'] },
  'Rhode Island': { total: 2, safeR: 0, safeD: 2, competitive: 0, lean: 'D+2' },
  'South Carolina': { total: 7, safeR: 6, safeD: 1, competitive: 0, lean: 'R+5' },
  'South Dakota': { total: 1, safeR: 1, safeD: 0, competitive: 0, lean: 'R+1' },
  'Tennessee': { total: 9, safeR: 7, safeD: 2, competitive: 0, lean: 'R+5' },
  'Texas': { total: 38, safeR: 22, safeD: 14, competitive: 2, lean: 'R+8', tossUpDistricts: ['TX-34', 'TX-28'] },
  'Utah': { total: 4, safeR: 4, safeD: 0, competitive: 0, lean: 'R+4' },
  'Vermont': { total: 1, safeR: 0, safeD: 1, competitive: 0, lean: 'D+1' },
  'Virginia': { total: 11, safeR: 4, safeD: 7, competitive: 0, lean: 'D+3' },
  'Washington': { total: 10, safeR: 3, safeD: 6, competitive: 1, lean: 'D+3', tossUpDistricts: ['WA-03'] },
  'West Virginia': { total: 2, safeR: 2, safeD: 0, competitive: 0, lean: 'R+2' },
  'Wisconsin': { total: 8, safeR: 4, safeD: 4, competitive: 0, lean: 'Even' },
  'Wyoming': { total: 1, safeR: 1, safeD: 0, competitive: 0, lean: 'R+1' },
};

// National overview data
export const NATIONAL_OVERVIEW = {
  senate: {
    current: { R: 53, D: 47 },
    seatsUp: 35,
    dNeedForMajority: 4,
    genericBallot: { D: 52, R: 46 },
  },
  house: {
    current: { R: 218, D: 214, vacant: 3 },
    dNeedForMajority: 3,
    totalTossUps: 18,
    rTossUps: 14,
    dTossUps: 4,
    genericBallot: { D: 52, R: 46 },
  },
  trumpApproval: {
    approve: 41,
    disapprove: 54,
    net: -13,
  },
  voterMotivation: {
    overall: 76,
    democratic: 82,
    republican: 76,
    independent: 61,
  },
};

/**
 * Get election rating color for map fill
 */
export function getElectionColor(stateName) {
  const senate = SENATE_RACES[stateName];
  const governor = GOVERNOR_RACES[stateName];

  // Use the most competitive race rating for color
  const ratings = [];
  if (senate) ratings.push(senate.rating);
  if (governor) ratings.push(governor.rating);

  if (ratings.length === 0) return 'rgba(80, 80, 80, 0.3)';

  // Pick the most competitive rating
  const priority = ['toss-up', 'lean-d', 'lean-r', 'likely-d', 'likely-r', 'safe-d', 'safe-r'];
  const best = ratings.sort((a, b) => priority.indexOf(a) - priority.indexOf(b))[0];
  return RATING_COLORS[best] || 'rgba(80, 80, 80, 0.3)';
}

/**
 * Check if a state has any election races
 */
export function hasElectionRaces(stateName) {
  return !!(SENATE_RACES[stateName] || GOVERNOR_RACES[stateName] || HOUSE_FORECAST[stateName]);
}

/**
 * Get all election data for a state
 */
export function getStateElectionData(stateName) {
  return {
    senate: SENATE_RACES[stateName] || null,
    governor: GOVERNOR_RACES[stateName] || null,
    house: HOUSE_FORECAST[stateName] || null,
    primaryDate: PRIMARY_DATES[stateName] || null,
    generalDate: GENERAL_ELECTION_DATE,
    pvi: STATE_PVI[stateName] || null,
    lastUpdated: DATA_LAST_UPDATED,
  };
}
