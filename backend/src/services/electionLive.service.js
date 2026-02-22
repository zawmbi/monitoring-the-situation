/**
 * Election Live Service — Prediction Markets Only
 *
 * Fetches live odds from Polymarket + Kalshi + PredictIt, matches them to
 * 2026 races, and derives win probabilities.  Refreshes every 2 minutes.
 *
 * No ensemble model, no polling aggregation, no FEC/GDELT/Metaculus.
 * Just real-time market prices.
 */

import { cacheService } from './cache.service.js';
import { polymarketService } from './polymarket.service.js';
import { kalshiService } from './kalshi.service.js';
import { predictitService } from './predictit.service.js';

const CACHE_KEY = 'elections:live:v16'; // v16: fix primary matching, add PA/MD/GA/TX candidates, senate primary slug variants
const CACHE_TTL = 120; // 2 minutes

// States with Senate races in 2026 (Class 2 + specials)
const SENATE_STATES = [
  'Alabama', 'Alaska', 'Arkansas', 'Colorado', 'Delaware', 'Florida', 'Georgia',
  'Idaho', 'Illinois', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine',
  'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Montana', 'Nebraska',
  'New Hampshire', 'New Jersey', 'New Mexico', 'North Carolina', 'Ohio', 'Oklahoma',
  'Oregon', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas',
  'Virginia', 'West Virginia', 'Wyoming',
];

// States with Governor races in 2026
const GOVERNOR_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
  'Connecticut', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Iowa',
  'Kansas', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota',
  'Nebraska', 'Nevada', 'New Hampshire', 'New Mexico', 'New York', 'Ohio',
  'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina',
  'South Dakota', 'Tennessee', 'Texas', 'Vermont', 'Wisconsin', 'Wyoming',
];

// Competitive House districts to track (confirmed across Polymarket + Kalshi + PredictIt)
const HOUSE_DISTRICTS = [
  { state: 'Alabama', district: 2, code: 'AL-02' },
  { state: 'Arizona', district: 1, code: 'AZ-01' },
  { state: 'Arizona', district: 2, code: 'AZ-02' },
  { state: 'Arizona', district: 4, code: 'AZ-04' },
  { state: 'Arizona', district: 6, code: 'AZ-06' },
  { state: 'Arkansas', district: 4, code: 'AR-04' },
  { state: 'California', district: 13, code: 'CA-13' },
  { state: 'California', district: 14, code: 'CA-14' },
  { state: 'California', district: 21, code: 'CA-21' },
  { state: 'California', district: 22, code: 'CA-22' },
  { state: 'California', district: 25, code: 'CA-25' },
  { state: 'California', district: 27, code: 'CA-27' },
  { state: 'California', district: 39, code: 'CA-39' },
  { state: 'California', district: 40, code: 'CA-40' },
  { state: 'California', district: 41, code: 'CA-41' },
  { state: 'California', district: 45, code: 'CA-45' },
  { state: 'California', district: 47, code: 'CA-47' },
  { state: 'California', district: 48, code: 'CA-48' },
  { state: 'California', district: 49, code: 'CA-49' },
  { state: 'Colorado', district: 3, code: 'CO-03' },
  { state: 'Colorado', district: 8, code: 'CO-08' },
  { state: 'Connecticut', district: 5, code: 'CT-05' },
  { state: 'Florida', district: 13, code: 'FL-13' },
  { state: 'Florida', district: 22, code: 'FL-22' },
  { state: 'Florida', district: 23, code: 'FL-23' },
  { state: 'Florida', district: 27, code: 'FL-27' },
  { state: 'Florida', district: 28, code: 'FL-28' },
  { state: 'Georgia', district: 6, code: 'GA-06' },
  { state: 'Georgia', district: 7, code: 'GA-07' },
  { state: 'Indiana', district: 5, code: 'IN-05' },
  { state: 'Iowa', district: 1, code: 'IA-01' },
  { state: 'Iowa', district: 2, code: 'IA-02' },
  { state: 'Iowa', district: 3, code: 'IA-03' },
  { state: 'Iowa', district: 4, code: 'IA-04' },
  { state: 'Kansas', district: 3, code: 'KS-03' },
  { state: 'Kentucky', district: 6, code: 'KY-06' },
  { state: 'Louisiana', district: 6, code: 'LA-06' },
  { state: 'Maine', district: 1, code: 'ME-01' },
  { state: 'Maine', district: 2, code: 'ME-02' },
  { state: 'Michigan', district: 3, code: 'MI-03' },
  { state: 'Michigan', district: 5, code: 'MI-05' },
  { state: 'Michigan', district: 6, code: 'MI-06' },
  { state: 'Michigan', district: 7, code: 'MI-07' },
  { state: 'Michigan', district: 8, code: 'MI-08' },
  { state: 'Michigan', district: 10, code: 'MI-10' },
  { state: 'Minnesota', district: 1, code: 'MN-01' },
  { state: 'Minnesota', district: 2, code: 'MN-02' },
  { state: 'Minnesota', district: 3, code: 'MN-03' },
  { state: 'Nebraska', district: 2, code: 'NE-02' },
  { state: 'Nevada', district: 3, code: 'NV-03' },
  { state: 'Nevada', district: 4, code: 'NV-04' },
  { state: 'New Hampshire', district: 1, code: 'NH-01' },
  { state: 'New Hampshire', district: 2, code: 'NH-02' },
  { state: 'New Jersey', district: 2, code: 'NJ-02' },
  { state: 'New Jersey', district: 5, code: 'NJ-05' },
  { state: 'New Jersey', district: 7, code: 'NJ-07' },
  { state: 'New Mexico', district: 2, code: 'NM-02' },
  { state: 'New York', district: 1, code: 'NY-01' },
  { state: 'New York', district: 2, code: 'NY-02' },
  { state: 'New York', district: 4, code: 'NY-04' },
  { state: 'New York', district: 11, code: 'NY-11' },
  { state: 'New York', district: 17, code: 'NY-17' },
  { state: 'New York', district: 18, code: 'NY-18' },
  { state: 'New York', district: 19, code: 'NY-19' },
  { state: 'New York', district: 22, code: 'NY-22' },
  { state: 'North Carolina', district: 1, code: 'NC-01' },
  { state: 'North Carolina', district: 7, code: 'NC-07' },
  { state: 'North Carolina', district: 9, code: 'NC-09' },
  { state: 'North Carolina', district: 13, code: 'NC-13' },
  { state: 'North Carolina', district: 14, code: 'NC-14' },
  { state: 'Ohio', district: 1, code: 'OH-01' },
  { state: 'Ohio', district: 9, code: 'OH-09' },
  { state: 'Ohio', district: 13, code: 'OH-13' },
  { state: 'Oregon', district: 4, code: 'OR-04' },
  { state: 'Oregon', district: 5, code: 'OR-05' },
  { state: 'Oregon', district: 6, code: 'OR-06' },
  { state: 'Pennsylvania', district: 1, code: 'PA-01' },
  { state: 'Pennsylvania', district: 4, code: 'PA-04' },
  { state: 'Pennsylvania', district: 5, code: 'PA-05' },
  { state: 'Pennsylvania', district: 7, code: 'PA-07' },
  { state: 'Pennsylvania', district: 8, code: 'PA-08' },
  { state: 'Pennsylvania', district: 10, code: 'PA-10' },
  { state: 'Pennsylvania', district: 17, code: 'PA-17' },
  { state: 'South Carolina', district: 1, code: 'SC-01' },
  { state: 'Texas', district: 15, code: 'TX-15' },
  { state: 'Texas', district: 23, code: 'TX-23' },
  { state: 'Texas', district: 24, code: 'TX-24' },
  { state: 'Texas', district: 28, code: 'TX-28' },
  { state: 'Texas', district: 32, code: 'TX-32' },
  { state: 'Texas', district: 34, code: 'TX-34' },
  { state: 'Virginia', district: 2, code: 'VA-02' },
  { state: 'Virginia', district: 7, code: 'VA-07' },
  { state: 'Washington', district: 3, code: 'WA-03' },
  { state: 'Washington', district: 8, code: 'WA-08' },
  { state: 'Wisconsin', district: 1, code: 'WI-01' },
  { state: 'Wisconsin', district: 3, code: 'WI-03' },
];

const STATE_CODES = {
  'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR',
  'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE',
  'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID',
  'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA', 'Kansas': 'KS',
  'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
  'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS',
  'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV',
  'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
  'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK',
  'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
  'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT',
  'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV',
  'Wisconsin': 'WI', 'Wyoming': 'WY',
};

function probabilityToRating(dProb) {
  if (dProb == null || !Number.isFinite(dProb)) return null;
  if (dProb >= 0.85) return 'safe-d';
  if (dProb >= 0.70) return 'likely-d';
  if (dProb >= 0.57) return 'lean-d';
  if (dProb >= 0.43) return 'toss-up';
  if (dProb >= 0.30) return 'lean-r';
  if (dProb >= 0.15) return 'likely-r';
  return 'safe-r';
}

function normalizeText(s) {
  return (s || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

// Two-letter state codes that are common English words — matching these as bare \bXX\b
// would cause massive false positives (e.g. "or" matches Oregon, "me" matches Maine).
// For these codes, only match when adjacent to a digit (district context like "or 04").
const AMBIGUOUS_STATE_CODES = new Set([
  'al', 'ar', 'co', 'de', 'ga', 'hi', 'id', 'il', 'in',
  'la', 'ma', 'me', 'mo', 'mt', 'ne', 'oh', 'ok', 'or', 'pa',
]);

// Known 2026 candidate-to-party mappings for races with candidate-name outcomes
// Used to extract D-win probability from markets that list individual candidates
// Comprehensive mapping: covers all competitive races + any market using candidate names
const CANDIDATE_PARTIES = {
  // Alaska Senate
  'dan sullivan': 'R', 'mary peltola': 'D', 'ann diener': 'I', 'dustin darden': 'I',
  'richard grayson': 'I',
  // Alaska Governor (40 sub-markets on Polymarket — all candidate names, no party labels)
  'nancy dahlstrom': 'R', 'bernadette wilson': 'D', 'tom begich': 'D',
  'click bishop': 'R', 'david bronson': 'R', 'lisa murkowski': 'R',
  'treg taylor': 'R', 'shelley hughes': 'R', 'adam crum': 'R',
  'edna devries': 'D', 'james parkin': 'R', 'matt heilala': 'I',
  // Alabama Senate (open seat — primary candidates)
  'barry moore': 'R', 'steve marshall': 'R', 'jared hudson': 'R',
  // Alabama Governor
  'tommy tuberville': 'R', 'tim james': 'R', 'wes allen': 'R',
  // Arizona Governor (primaries)
  'katie hobbs': 'D', 'karrin taylor robson': 'R', 'andy biggs': 'R',
  'david schweikert': 'R',
  // California Governor (45 sub-markets on Polymarket — all candidate names, no party labels)
  'eric swalwell': 'D', 'katie porter': 'D', 'steve hilton': 'R',
  'chad bianco': 'R', 'alex padilla': 'D', 'antonio villaraigosa': 'D',
  'xavier becerra': 'D', 'rick caruso': 'R', 'kyle langford': 'R',
  'stephen cloobeck': 'D', 'betty yee': 'D', 'eleni kounalakis': 'D',
  'tom steyer': 'D', 'rob bonta': 'D', 'toni atkins': 'D',
  'tony thurmond': 'D', 'leo zacky': 'R', 'kamala harris': 'D',
  // Colorado Senate
  'john hickenlooper': 'D',
  // Colorado Governor
  'phil weiser': 'D', 'jena griswold': 'D', 'heidi ganahl': 'R',
  // Florida Senate
  'ashley moody': 'R', 'alexander vindman': 'D',
  // Florida Governor (R + D primary nominee markets on Polymarket)
  'byron donalds': 'R', 'jay collins': 'R', 'paul renner': 'R', 'james fishback': 'R',
  'matt gaetz': 'R', 'jimmy patronis': 'R', 'casey desantis': 'R',
  'nikki fried': 'D', 'debbie mucarsel powell': 'D', 'anna eskamani': 'D',
  'gwen graham': 'D', 'fentrice driskell': 'D', 'shevrin jones': 'D',
  'david jolly': 'D', 'jerry demings': 'D', 'angie nixon': 'D',
  'daniella levine cava': 'D', 'jason pizzo': 'D',
  // Georgia Senate
  'jon ossoff': 'D', 'buddy carter': 'R', 'mike collins': 'R', 'derek dooley': 'R',
  // Pennsylvania Governor (R primary on Polymarket — Stacy Garrity leads at 91.5%)
  'stacy garrity': 'R', 'john ventre': 'R', 'doug mastriano': 'R',
  'josh shapiro': 'D',
  // Maryland Governor (R primary on Polymarket)
  'wes moore': 'D', 'ed hale': 'R', 'carl brunner': 'R',
  'christopher bouchat': 'R', 'john myrick': 'R', 'kurt wedekind': 'R',
  // Georgia Governor (primaries — large Polymarket markets)
  'burt jones': 'R', 'chris carr': 'R', 'brad raffensperger': 'R',
  'rick jackson': 'R', 'keisha lance bottoms': 'D', 'michael thurmond': 'D',
  'mike thurmond': 'D', 'leland olinger ii': 'R', 'clark dean': 'R',
  'geoff duncan': 'D', 'derrick jackson': 'D', 'jason esteves': 'D', 'olujimi brown': 'D',
  'ruwa romman': 'D', 'ken yasger': 'R',
  // Iowa Senate
  'ashley hinson': 'R', 'jim carlin': 'R', 'john berman': 'R', 'joshua smith': 'R',
  'zach wahls': 'D', 'jackie norris': 'D', 'josh turek': 'D',
  // Iowa Governor (primaries found on Polymarket)
  'kim reynolds': 'R', 'randy feenstra': 'R', 'rob sand': 'D',
  // Kansas Governor
  'derek schmidt': 'R', 'kris kobach': 'R', 'sharice davids': 'D',
  // Kentucky Senate
  'andy barr': 'R', 'daniel cameron': 'R', 'nate morris': 'R',
  'charles booker': 'D', 'amy mcgrath': 'D',
  // Illinois Senate
  'raja krishnamoorthi': 'D', 'juliana stratton': 'D', 'robin kelly': 'D',
  // Maine Senate
  'susan collins': 'R', 'janet mills': 'D', 'david costello': 'D',
  'graham platner': 'D', 'jordan wood': 'D', 'dan smeriglio': 'R',
  // Maine Governor
  'aaron frey': 'D', 'mike tipping': 'D', 'paul lepage': 'R', 'shawn moody': 'R',
  // Michigan Senate
  'mallory mcmorrow': 'D', 'haley stevens': 'D', 'abdul el sayed': 'D',
  'joe tate': 'D', 'mike rogers': 'R', 'dana nessel': 'D',
  'rashida tlaib': 'D', 'fred heurtebise': 'R', 'kent benham': 'R',
  'bernadette smith': 'R', 'genevieve scott': 'R', 'andrew kamal': 'R',
  // Michigan Governor (primaries — Polymarket has R + D primary markets)
  'jocelyn benson': 'D', 'chris swanson': 'D', 'john james': 'R',
  'aric nesbitt': 'R', 'mike cox': 'R', 'mike duggan': 'I',
  'william null': 'R', 'tom leonard': 'R', 'ralph rebandt': 'R', 'karla wagner': 'R',
  'marni sawicki': 'D', 'garlin gilchrist': 'D',
  // Minnesota Senate
  'peggy flanagan': 'D', 'angie craig': 'D', 'keith ellison': 'D',
  'melisa hortman': 'D', 'michele tafoya': 'R', 'royce white': 'R',
  // Minnesota Governor (primaries — large Polymarket markets $176K R, $19K D)
  'amy klobuchar': 'D', 'lisa demuth': 'R', 'mike lindell': 'R', 'scott jensen': 'R',
  'phil parrish': 'R', 'kristin robbins': 'R', 'jeff johnson': 'R',
  'patrick knight': 'R', 'brad kohler': 'R',
  'steve simon': 'D', 'tim walz': 'D', 'bill gates jr': 'D',
  // Nebraska Senate
  'pete ricketts': 'R', 'dan osborn': 'I', 'dan osborne': 'I',
  // Nebraska Governor
  'jim pillen': 'R',
  // Nevada Governor (primaries)
  'joe lombardo': 'R', 'aaron ford': 'D', 'alexis hill': 'D',
  // New Hampshire Senate
  'maggie goodlander': 'D', 'colin van ostern': 'D', 'chuck morse': 'R', 'don bolduc': 'R',
  // New Hampshire Governor
  'kelly ayotte': 'R',
  // New Mexico Governor
  'raul torrez': 'D', 'melanie stansbury': 'D', 'mark ronchetti': 'R',
  // North Carolina Senate
  'roy cooper': 'D', 'michael whatley': 'R', 'don brown': 'R', 'michele morrow': 'R',
  // Ohio Senate
  'jon husted': 'R', 'sherrod brown': 'D',
  // Ohio Governor
  'vivek ramaswamy': 'R',
  // Oklahoma Governor
  'ryan walters': 'R', 'matt pinnell': 'R',
  // Oregon Senate
  'jeff merkley': 'D',
  // Oregon Governor
  'tina kotek': 'D',
  // South Carolina Governor
  'alan wilson': 'R', 'mark hammond': 'R',
  // Tennessee Governor
  'andy ogles': 'R', 'cameron sexton': 'R',
  // Texas Senate (D primary on Polymarket — Colin Allred leads)
  'ken paxton': 'R', 'john cornyn': 'R', 'wesley hunt': 'R',
  'jasmine crockett': 'D', 'james talarico': 'D',
  'colin allred': 'D', 'roland gutierrez': 'D', 'steven keough': 'D',
  // Vermont Governor
  'phil scott': 'R',
  // Virginia Senate
  'mark warner': 'D',
  // Wisconsin Governor
  'tony evers': 'D',
  // Wisconsin Senate
  'tammy baldwin': 'D',
  // Wyoming Senate
  'harriet hageman': 'R', 'tim salazar': 'R',
};

// Negative keywords — markets containing these are NOT election markets
const NON_ELECTION_PATTERNS = /\bnhl\b|\bnba\b|\bnfl\b|\bmlb\b|\bmls\b|\bstanley\s*cup\b|\bsuper\s*bowl\b|\bworld\s*series\b|\bplayoffs?\b|\bchampionship\b|\bmvp\b|\bheisman\b|\bolympic|\bfifa\b|\bworld\s*cup\b|\bballon\s*d\s*or\b|\bpremier\s*league\b|\bla\s*liga\b|\bbundesliga\b|\bserie\s*a\b|\bligue\s*1\b|\bnascar\b|\bf1\b|\bformula\s*1\b|\bufc\b|\bboxing\b|\btennis\b|\bgolf\b|\bpga\b|\bwimbledon\b|\bus\s*open\b|\bcrypto|\bbitcoin\b|\bethereum\b|\bipo\b/;

// Races with significant independent candidates: {state:raceType} -> independent candidate name
const INDEPENDENT_RACES = {
  'Nebraska:senate': 'Dan Osborn',
  'Michigan:governor': 'Mike Duggan',
};

class ElectionLiveService {
  constructor() {
    this._memCache = null;
    this._memCacheTime = 0;
  }

  /**
   * Generate Polymarket event slugs for all 2026 races.
   * Slug patterns confirmed via direct Gamma API testing.
   */
  _generatePolymarketSlugs() {
    const slugs = [];
    const toSlug = (s) => s.toLowerCase().replace(/\s+/g, '-');

    // Senate general election — multiple slug variants per state for maximum coverage
    for (const state of SENATE_STATES) {
      const s = toSlug(state);
      slugs.push(`${s}-senate-election-winner`);
      slugs.push(`${s}-us-senate-election-winner`);
      slugs.push(`${s}-senate-winner-2026`);
      slugs.push(`${s}-senate-race-2026`);
      slugs.push(`${s}-senate-election-2026`);
    }
    // Senate primaries (both parties) — primary + nominee slug variants
    for (const state of SENATE_STATES) {
      const s = toSlug(state);
      slugs.push(`${s}-republican-senate-primary-winner`);
      slugs.push(`${s}-democratic-senate-primary-winner`);
      slugs.push(`${s}-republican-senate-primary`);
      slugs.push(`${s}-democratic-senate-primary`);
      slugs.push(`republican-nominee-for-${s}-senate`);
      slugs.push(`democratic-nominee-for-${s}-senate`);
    }
    // Michigan Republican Senate Primary has special suffix
    slugs.push('michigan-republican-senate-primary-winner-954');

    // Governor general election — multiple slug variants per state
    for (const state of GOVERNOR_STATES) {
      const s = toSlug(state);
      slugs.push(`${s}-governor-winner-2026`);
      slugs.push(`${s}-governor-election-winner`);
      slugs.push(`${s}-governor-election-2026`);
      slugs.push(`${s}-governor-race-2026`);
      slugs.push(`${s}-gubernatorial-election-winner`);
      slugs.push(`${s}-gubernatorial-election-2026`);
    }
    // California uses a different slug pattern
    slugs.push('california-governor-election-2026');

    // Governor primaries — primary + nominee slug variants
    for (const state of GOVERNOR_STATES) {
      const s = toSlug(state);
      slugs.push(`${s}-governor-republican-primary-winner`);
      slugs.push(`${s}-governor-democratic-primary-winner`);
      slugs.push(`republican-nominee-for-${s}-governor`);
      slugs.push(`democratic-nominee-for-${s}-governor`);
    }
    // California jungle primary
    slugs.push('parties-advancing-from-the-california-governor-primary');

    // House districts — multiple slug variants (zero-padded and non-padded)
    for (const d of HOUSE_DISTRICTS) {
      const [st, dist] = d.code.split('-');
      const stLower = st.toLowerCase();
      const paddedDist = dist.padStart(2, '0');
      slugs.push(`${stLower}-${paddedDist}-house-election-winner`);
      slugs.push(`${stLower}-${paddedDist}-congressional-election-winner`);
      // Also try with the full state name for multi-word states
      const stateSlug = toSlug(d.state);
      if (stateSlug !== stLower) {
        slugs.push(`${stateSlug}-${paddedDist}-house-election-winner`);
        slugs.push(`${stateSlug}-district-${paddedDist}-house-election-winner`);
      }
    }

    // Meta / control markets
    slugs.push(
      'which-party-will-win-the-senate-in-2026',
      'which-party-will-win-the-house-in-2026',
      'balance-of-power-2026-midterms',
      'republican-senate-seats-after-the-2026-midterm-elections-927',
      'republican-house-seats-after-the-2026-midterm-elections',
      'will-democrats-win-all-core-four-senate-races',
      '2026-midterms-senate-control',
      '2026-midterms-house-control',
    );
    return slugs;
  }

  /**
   * Fetch all election markets from Polymarket + Kalshi + PredictIt.
   * Uses multiple search strategies to maximize coverage:
   * 1. Keyword search for "2026" (catches explicit year references)
   * 2. Keyword search for "senate" (catches state senate race markets)
   * 3. Keyword search for "governor" (catches governor race markets)
   * 4. Direct slug-based fetching for known Polymarket event patterns
   * 5. Standard Kalshi + PredictIt topic search
   */
  async _fetchAllMarkets() {
    const boost = ['senate', 'governor', 'election', 'midterm', 'congress', 'house', 'democrat', 'republican', 'primary', '2026'];

    // Multiple search strategies for Polymarket (many markets don't contain "2026" in text)
    const polySearches = [
      polymarketService.getMarketsByTopic(['2026'], boost, false),
      polymarketService.getMarketsByTopic(['senate'], ['2026', 'election', 'winner', 'primary', 'democrat', 'republican'], false),
      polymarketService.getMarketsByTopic(['governor'], ['2026', 'election', 'winner', 'primary'], false),
      polymarketService.getMarketsByTopic(['gubernatorial'], ['2026', 'election', 'winner', 'primary'], false),
      polymarketService.getMarketsByTopic(['midterm'], ['2026', 'senate', 'governor', 'house'], false),
      polymarketService.getMarketsByTopic(['primary'], ['2026', 'senate', 'governor', 'republican', 'democrat'], false),
      polymarketService.getMarketsByTopic(['nominee'], ['2026', 'senate', 'governor', 'republican', 'democrat'], false),
      polymarketService.getMarketsByTopic(['congress'], ['2026', 'house', 'district', 'election', 'winner'], false),
      polymarketService.getMarketsByTopic(['house'], ['2026', 'election', 'district', 'winner', 'representative'], false),
    ];

    // Kalshi + PredictIt — broader searches
    const kalshiSearches = [
      kalshiService.getMarketsByTopic(['2026'], boost, false),
      kalshiService.getMarketsByTopic(['senate'], ['2026', 'election', 'winner', 'primary'], false),
      kalshiService.getMarketsByTopic(['governor'], ['2026', 'election', 'winner', 'gubernatorial'], false),
      kalshiService.getMarketsByTopic(['gubernatorial'], ['2026', 'election', 'winner'], false),
      kalshiService.getMarketsByTopic(['house'], ['2026', 'election', 'district', 'winner'], false),
      kalshiService.getMarketsByTopic(['congress'], ['2026', 'house', 'district', 'election'], false),
      kalshiService.getMarketsByTopic(['primary'], ['2026', 'senate', 'governor', 'republican', 'democrat', 'nominee'], false),
      kalshiService.getMarketsByTopic(['midterm'], ['2026', 'senate', 'governor', 'house'], false),
    ];
    const predictitSearches = [
      predictitService.getMarketsByTopic(['2026'], boost, false),
      predictitService.getMarketsByTopic(['senate'], ['2026', 'election', 'primary', 'nomination'], false),
      predictitService.getMarketsByTopic(['governor'], ['2026', 'gubernatorial', 'election'], false),
      predictitService.getMarketsByTopic(['gubernatorial'], ['2026', 'election'], false),
      predictitService.getMarketsByTopic(['house'], ['2026', 'election', 'district'], false),
      predictitService.getMarketsByTopic(['congress'], ['2026', 'house', 'election'], false),
      predictitService.getMarketsByTopic(['midterm'], ['2026', 'senate', 'governor'], false),
    ];

    // Direct slug-based Polymarket fetching for guaranteed coverage
    // Use lower volume threshold ($500) for targeted slug fetches since these are known election markets
    const slugs = this._generatePolymarketSlugs();
    const slugFetch = polymarketService.fetchEventsBySlugs(slugs, 50)
      .then(events => polymarketService.normalizeMarkets(events, { minVolume: 500 }))
      .catch(() => []);

    // Execute all in parallel
    const allResults = await Promise.allSettled([
      ...polySearches,
      ...kalshiSearches,
      ...predictitSearches,
      slugFetch,
    ]);

    // Merge and deduplicate by market ID
    const seen = new Set();
    const markets = [];
    for (const result of allResults) {
      if (result.status !== 'fulfilled' || !Array.isArray(result.value)) continue;
      for (const market of result.value) {
        const key = market.id || market.url || market.question;
        if (!seen.has(key)) {
          seen.add(key);
          markets.push(market);
        }
      }
    }

    return markets;
  }

  /**
   * Score how well a market matches a specific race (0 = no match).
   * raceType can be: 'senate', 'governor', 'house',
   *   'senate-primary-r', 'senate-primary-d', 'governor-primary-r', 'governor-primary-d'
   */
  _scoreMatch(market, stateName, raceType, districtNum = null) {
    const text = normalizeText(`${market.question} ${market.description} ${market.rawSearchText || ''}`);

    // Reject non-election markets (sports, crypto, etc.)
    if (NON_ELECTION_PATTERNS.test(text)) return 0;

    const stateNameLower = stateName.toLowerCase();
    const stateCode = (STATE_CODES[stateName] || '').toLowerCase();

    // For ambiguous codes (common English words like "me", "or", "oh"), only match
    // when they appear adjacent to a digit (district context like "or 04", "me 01").
    // For non-ambiguous codes ("tx", "fl", "nh"), standard word-boundary matching is safe.
    let hasState;
    if (text.includes(stateNameLower)) {
      hasState = true;
    } else if (stateCode.length === 2) {
      if (AMBIGUOUS_STATE_CODES.has(stateCode)) {
        hasState = new RegExp(`\\b${stateCode}[\\s-]?\\d`).test(text);
      } else {
        hasState = new RegExp(`\\b${stateCode}\\b`).test(text);
      }
    } else {
      hasState = false;
    }
    if (!hasState) return 0;

    // Determine base office type and whether this is a primary race
    const isPrimary = raceType.includes('-primary-');
    const baseType = raceType.replace(/-primary-[rd]$/, '');
    const primaryParty = raceType.endsWith('-r') ? 'r' : raceType.endsWith('-d') ? 'd' : null;

    const hasOffice = baseType === 'senate'
      ? /\bsenat/.test(text)
      : baseType === 'governor'
        ? /\bgovern|\bgubern/.test(text)
        : /\bhouse\b|\bcongress|\bdistrict\b|\bcd\b/.test(text);
    if (!hasOffice) return 0;

    // Primary/general matching: check the market TITLE (not full text) for primary/nominee keywords
    // to avoid false matches from descriptions that mention "nominee" in passing
    const titleText = normalizeText(market.question || '');
    if (isPrimary) {
      if (!/\bprimary\b|\bnominee\b|\bnomination\b/.test(titleText)) return 0;
      const hasParty = primaryParty === 'r'
        ? /\brepublican|\bgop\b|\brep\b/.test(text)
        : /\bdemocrat|\bdem\b|\bdfl\b/.test(text);
      if (!hasParty) return 0;
    } else {
      // General election: reject if the market TITLE indicates it's a primary/nominee market
      if (/\bprimary\b|\bnominee\b|\bnomination\b/.test(titleText)) return 0;
    }

    if (baseType === 'house' && districtNum != null) {
      const distStr = String(districtNum);
      const hasDistrict = text.includes(`district ${distStr}`) ||
        text.includes(`cd ${distStr}`) ||
        text.includes(`${stateCode} ${distStr}`) ||
        new RegExp(`\\b${stateCode} ?0?${distStr}\\b`).test(text);
      if (!hasDistrict) return 0;
    }

    if (/202[0-5]|2028|2030|2032/.test(text) && !/2026/.test(text)) return 0;

    let score = 1;
    if (/2026/.test(text)) score += 2;
    if (text.includes(stateNameLower)) score += 1;
    if (isPrimary && /\bprimary\b|\bnominee\b|\bnomination\b/.test(titleText)) score += 2;
    if (districtNum != null && text.includes(`district ${String(districtNum)}`)) score += 1;
    score += Math.log10(Math.max(market.volume || 1, 1));
    return score;
  }

  /**
   * Extract D-win probability from a market's outcomes.
   * Strategy: (1) Party-labeled outcomes, (2) question text, (3) candidate-party mapping.
   */
  _extractDemProbability(market) {
    const outcomes = market.outcomes || [];
    if (outcomes.length === 0) return null;

    // Strategy 1: Look for party-labeled outcomes ("Democrat", "Republican")
    for (const o of outcomes) {
      const name = normalizeText(o.name || '');
      if (/\bdemocrat|\bdem\b|\bblue\b/.test(name) && o.price != null) return o.price;
    }
    for (const o of outcomes) {
      const name = normalizeText(o.name || '');
      if (/\brepublican|\brep\b|\bgop\b|\bred\b/.test(name) && o.price != null) return 1 - o.price;
    }

    // Strategy 2: Check question text for party-specific framing
    const qText = normalizeText(market.question || '');
    const isAboutDemWinning = /democrat.*win|will.*democrat|dem.*flip|blue.*wave/.test(qText);
    const isAboutRepWinning = /republican.*win|will.*republican|rep.*flip|gop.*win|red.*wave/.test(qText);

    if (outcomes.length >= 2) {
      const yesPrice = outcomes[0]?.price;
      if (isAboutDemWinning && yesPrice != null) return yesPrice;
      if (isAboutRepWinning && yesPrice != null) return 1 - yesPrice;
    }

    // Strategy 3: Use candidate-party mapping to compute D-win probability
    // Sum up probabilities of all D candidates vs all R candidates
    let dTotal = 0;
    let rTotal = 0;
    let matched = 0;
    for (const o of outcomes) {
      if (o.price == null || o.price <= 0) continue;
      const name = normalizeText(o.name || '');
      if (!name || name === 'other' || /^person\b|^option\b|^candidate\b/.test(name)) continue;
      const party = CANDIDATE_PARTIES[name];
      if (party === 'D') {
        dTotal += o.price;
        matched++;
      } else if (party === 'R') {
        rTotal += o.price;
        matched++;
      } else if (party === 'I') {
        // Independent candidates don't count toward D or R
        matched++;
      }
    }
    // Only trust candidate mapping if we matched at least 2 outcomes
    if (matched >= 2 && (dTotal + rTotal) > 0) {
      return dTotal / (dTotal + rTotal);
    }

    return null;
  }

  /**
   * Extract all candidate outcomes with party affiliations for a market.
   * Used for races with independent/third-party candidates (e.g., Nebraska).
   */
  _extractAllCandidateOutcomes(market) {
    const outcomes = market.outcomes || [];
    const result = [];
    for (const o of outcomes) {
      if (o.price == null || o.price <= 0) continue;
      const name = normalizeText(o.name || '');
      if (!name || name === 'other' || /^person\b|^option\b|^candidate\b/.test(name)) continue;
      const party = CANDIDATE_PARTIES[name];
      if (party) {
        result.push({
          name: o.name,
          party,
          price: o.price,
          pct: Math.round(o.price * 100),
        });
      }
    }
    return result.sort((a, b) => b.price - a.price);
  }

  /**
   * Match markets to races. For each race, pick the best matching market
   * and extract win probabilities. Also matches primary markets.
   */
  _deriveRatings(allMarkets) {
    const results = {};
    const allRaces = [
      // General election races
      ...SENATE_STATES.map(s => ({ state: s, type: 'senate' })),
      ...GOVERNOR_STATES.map(s => ({ state: s, type: 'governor' })),
      ...HOUSE_DISTRICTS.map(d => ({ state: d.state, type: 'house', district: d.district, code: d.code })),
      // Primary races (R and D for each office)
      ...SENATE_STATES.map(s => ({ state: s, type: 'senate-primary-r' })),
      ...SENATE_STATES.map(s => ({ state: s, type: 'senate-primary-d' })),
      ...GOVERNOR_STATES.map(s => ({ state: s, type: 'governor-primary-r' })),
      ...GOVERNOR_STATES.map(s => ({ state: s, type: 'governor-primary-d' })),
    ];

    for (const race of allRaces) {
      const isPrimary = race.type.includes('-primary-');
      const scored = allMarkets
        .map(m => ({ market: m, score: this._scoreMatch(m, race.state, race.type, race.district || null) }))
        .filter(s => s.score > 0)
        .sort((a, b) => b.score - a.score);

      if (scored.length === 0) continue;
      const bestMatch = scored[0].market;

      if (isPrimary) {
        // Primary markets: pass through all candidate outcomes with prices
        // Filter out placeholder outcomes (Person X, Option X, Candidate X) and party labels
        const PARTY_LABELS = /^(democrat|republican|democratic|gop|independent|libertarian|green|other|dem|rep|ind|lib)$/i;
        const outcomes = (bestMatch.outcomes || [])
          .filter(o => {
            if (!o.name || o.price == null) return false;
            const n = normalizeText(o.name);
            return n && n !== 'other' && !/^person\b|^option\b|^candidate\b/.test(n) && !PARTY_LABELS.test(n.trim());
          })
          .sort((a, b) => b.price - a.price)
          .slice(0, 10)
          .map(o => ({ name: o.name, pct: Math.round(o.price * 100) }));

        if (outcomes.length === 0) continue;

        // Skip party-combination markets (e.g., "Dem-Rep", "Dem-Dem", "Rep-Rep")
        // These are jungle/top-two primary format markets (like California), not candidate-level primaries
        const partyComboPattern = /^(dem|rep|democrat|republican|other|ind|independent)\s*[-–—]\s*(dem|rep|democrat|republican|other|ind|independent)$/i;
        const partyCombos = outcomes.filter(o => partyComboPattern.test((o.name || '').trim()));
        if (partyCombos.length >= Math.ceil(outcomes.length / 2)) continue;

        const party = race.type.endsWith('-r') ? 'R' : 'D';
        const baseType = race.type.replace(/-primary-[rd]$/, '');
        const key = `${race.state}:${baseType}:primary:${party}`;
        results[key] = {
          state: race.state,
          raceType: race.type,
          party,
          candidates: outcomes,
          marketQuestion: bestMatch.question,
          marketUrl: bestMatch.url,
          marketSource: bestMatch.source,
          marketVolume: bestMatch.volume,
        };
      } else {
        // General election: extract D-win probability
        const dProb = this._extractDemProbability(bestMatch);
        if (dProb == null) continue;

        // Build richer outcomes with party info from candidate mapping
        const allCandidateOutcomes = this._extractAllCandidateOutcomes(bestMatch);
        const rawOutcomes = (bestMatch.outcomes || [])
          .filter(o => {
            if (!o.name || o.price == null) return false;
            const n = normalizeText(o.name);
            return n && n !== 'other' && !/^person\b|^option\b|^candidate\b/.test(n);
          })
          .sort((a, b) => (b.price || 0) - (a.price || 0))
          .slice(0, 8)
          .map(o => {
            const party = CANDIDATE_PARTIES[normalizeText(o.name)] || null;
            return {
              name: o.name,
              price: o.price != null ? Math.round(o.price * 100) : null,
              party,
            };
          });

        const key = race.code ? `${race.state}:house:${race.code}` : `${race.state}:${race.type}`;
        const raceResult = {
          state: race.state,
          raceType: race.type,
          district: race.code || null,
          derivedRating: probabilityToRating(dProb),
          dWinProb: Math.round(dProb * 100),
          rWinProb: Math.round((1 - dProb) * 100),
          marketQuestion: bestMatch.question,
          marketUrl: bestMatch.url,
          marketSource: bestMatch.source,
          marketVolume: bestMatch.volume,
          outcomes: rawOutcomes,
          // Include independent/third-party candidate data when available
          candidateOutcomes: allCandidateOutcomes.length > 0 ? allCandidateOutcomes : undefined,
        };

        // For races with significant independent candidates, compute I-win probability
        const indepKey = `${race.state}:${race.type}`;
        const indepCandidate = INDEPENDENT_RACES[indepKey];
        if (indepCandidate) {
          // Extract R and D probabilities directly from outcomes
          let rDirect = null;
          let dDirect = null;
          for (const o of (bestMatch.outcomes || [])) {
            if (o.price == null) continue;
            const name = normalizeText(o.name || '');
            if (/\brepublican|\brep\b|\bgop\b/.test(name)) rDirect = o.price;
            if (/\bdemocrat|\bdem\b/.test(name)) dDirect = o.price;
          }
          if (rDirect != null && dDirect != null) {
            const iProb = Math.max(0, 1 - rDirect - dDirect);
            raceResult.iWinProb = Math.round(iProb * 100);
            raceResult.rWinProb = Math.round(rDirect * 100);
            raceResult.dWinProb = Math.round(dDirect * 100);
            raceResult.independentCandidate = indepCandidate;
          }
        }

        results[key] = raceResult;
      }
    }

    // Synthesize primary data from general election markets when no dedicated primary market exists
    // For races like Alaska Governor where Polymarket only has one market with all candidates
    for (const raceType of ['senate', 'governor']) {
      const states = raceType === 'senate' ? SENATE_STATES : GOVERNOR_STATES;
      for (const state of states) {
        const generalKey = `${state}:${raceType}`;
        const general = results[generalKey];
        if (!general || !general.candidateOutcomes || general.candidateOutcomes.length === 0) continue;

        for (const party of ['R', 'D']) {
          const primaryKey = `${state}:${raceType}:primary:${party}`;
          if (results[primaryKey]) continue; // Already have a dedicated primary market

          const partyCandidates = general.candidateOutcomes
            .filter(c => c.party === party && c.pct > 0)
            .slice(0, 8)
            .map(c => ({ name: c.name, pct: c.pct }));

          if (partyCandidates.length >= 2) {
            results[primaryKey] = {
              state,
              raceType: `${raceType}-primary-${party.toLowerCase()}`,
              party,
              candidates: partyCandidates,
              marketQuestion: general.marketQuestion,
              marketUrl: general.marketUrl,
              marketSource: general.marketSource,
              marketVolume: general.marketVolume,
              derivedFromGeneral: true,
            };
          }
        }
      }
    }

    return results;
  }

  /**
   * Main method: fetch prediction market odds for all 2026 races.
   */
  async getLiveData() {
    const cached = await cacheService.get(CACHE_KEY);
    if (cached) return cached;

    // Short-lived memory cache (5 min stale fallback)
    if (this._memCache && (Date.now() - this._memCacheTime) < 5 * 60 * 1000) {
      return this._memCache;
    }

    console.log('[ElectionLive] Fetching prediction market odds...');
    const startTime = Date.now();

    try {
      const allMarkets = await this._fetchAllMarkets();
      const marketRatings = this._deriveRatings(allMarkets);

      const elapsed = Date.now() - startTime;
      const ratingCount = Object.keys(marketRatings).length;
      console.log(`[ElectionLive] Done in ${elapsed}ms: ${ratingCount} races matched from ${allMarkets.length} markets`);

      const result = {
        marketRatings,
        marketCount: allMarkets.length,
        racesMatched: ratingCount,
        timestamp: new Date().toISOString(),
      };

      await cacheService.set(CACHE_KEY, result, CACHE_TTL);
      this._memCache = result;
      this._memCacheTime = Date.now();

      return result;
    } catch (error) {
      console.error('[ElectionLive] Error:', error.message);
      if (this._memCache) return this._memCache;
      return { marketRatings: {}, marketCount: 0, racesMatched: 0, timestamp: new Date().toISOString() };
    }
  }

  /**
   * Get live data for a single state.
   */
  async getStateData(stateName) {
    const all = await this.getLiveData();
    return {
      senate: all.marketRatings[`${stateName}:senate`] || null,
      governor: all.marketRatings[`${stateName}:governor`] || null,
      house: Object.fromEntries(
        Object.entries(all.marketRatings)
          .filter(([key]) => key.startsWith(`${stateName}:house:`))
          .map(([key, val]) => [val.district || key.split(':')[2], val])
      ),
      timestamp: all.timestamp,
    };
  }
}

export const electionLiveService = new ElectionLiveService();
export default electionLiveService;
