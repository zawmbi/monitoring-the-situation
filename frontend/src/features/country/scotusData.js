/**
 * Supreme Court of the United States (SCOTUS) data
 * Current justices and notable pending cases for the 2024-2025 term.
 */

export const SCOTUS_JUSTICES = [
  { name: 'John Roberts',       role: 'Chief Justice', appointedBy: 'G.W. Bush', year: 2005, lean: 'conservative' },
  { name: 'Clarence Thomas',    role: 'Associate',     appointedBy: 'G.H.W. Bush', year: 1991, lean: 'conservative' },
  { name: 'Samuel Alito',       role: 'Associate',     appointedBy: 'G.W. Bush', year: 2006, lean: 'conservative' },
  { name: 'Sonia Sotomayor',    role: 'Associate',     appointedBy: 'Obama', year: 2009, lean: 'liberal' },
  { name: 'Elena Kagan',        role: 'Associate',     appointedBy: 'Obama', year: 2010, lean: 'liberal' },
  { name: 'Neil Gorsuch',       role: 'Associate',     appointedBy: 'Trump', year: 2017, lean: 'conservative' },
  { name: 'Brett Kavanaugh',    role: 'Associate',     appointedBy: 'Trump', year: 2018, lean: 'conservative' },
  { name: 'Amy Coney Barrett',  role: 'Associate',     appointedBy: 'Trump', year: 2020, lean: 'conservative' },
  { name: 'Ketanji Brown Jackson', role: 'Associate',  appointedBy: 'Biden', year: 2022, lean: 'liberal' },
];

export const SCOTUS_PENDING_CASES = [
  {
    id: 'catholic-charities-v-wisconsin',
    name: 'Catholic Charities Bureau v. Wisconsin LIRC',
    docket: '24-203',
    argued: '2025-02-26',
    topic: 'Religious Liberty',
    question: 'Whether the ministerial exception or church autonomy doctrine bars state agencies from adjudicating employment disputes involving employees of religious organizations.',
    petitioner: {
      side: 'Catholic Charities Bureau',
      argument: 'Religious organizations have a First Amendment right to manage their own internal affairs, including employment decisions, free from government interference. State labor regulators cannot override church autonomy.',
    },
    respondent: {
      side: 'Wisconsin LIRC',
      argument: 'Neutral, generally applicable employment laws can apply to religious organizations when the employees perform secular functions. The ministerial exception should be narrowly construed.',
    },
  },
  {
    id: 'fda-v-azar',
    name: 'FDA v. Wages and White Lion Investments',
    docket: '23-1038',
    argued: '2024-10-07',
    topic: 'Administrative Law',
    question: 'Whether the FDA acted lawfully when it denied marketing authorization for flavored e-cigarette products.',
    petitioner: {
      side: 'FDA',
      argument: 'The agency has broad discretion to evaluate public health evidence and deny marketing orders for e-cigarette products that fail to demonstrate a net benefit to public health.',
    },
    respondent: {
      side: 'E-cigarette Manufacturers',
      argument: 'The FDA applied an impossible evidentiary standard, changed its requirements mid-review without notice, and treated similarly-situated applicants differently in violation of the APA.',
    },
  },
  {
    id: 'san-francisco-v-epa',
    name: 'City and County of San Francisco v. EPA',
    docket: '23-753',
    argued: '2024-10-16',
    topic: 'Environmental Law',
    question: 'Whether the Clean Water Act permits the EPA to impose "generic prohibitions" in water discharge permits rather than only specific, numeric effluent limitations.',
    petitioner: {
      side: 'San Francisco',
      argument: 'The CWA requires EPA to set specific, measurable discharge limits. Generic prohibitions like "no toxic amounts" give regulated parties no clear compliance standard and invite arbitrary enforcement.',
    },
    respondent: {
      side: 'EPA',
      argument: 'Generic prohibitions are a permissible backstop that ensure water quality standards are met even when specific numeric limits may not capture all pollutants. This has been standard practice for decades.',
    },
  },
  {
    id: 'royal-canin-v-woudenberg',
    name: 'Royal Canin USA v. Woudenberg',
    docket: '23-677',
    argued: '2024-11-18',
    topic: 'Civil Procedure',
    question: 'Whether Article III standing requires a concrete injury or whether a statutory violation alone is sufficient to confer standing in federal court.',
    petitioner: {
      side: 'Royal Canin',
      argument: 'A plaintiff must show actual, concrete injury-in-fact to have standing. A bare statutory violation without real-world harm does not satisfy Article III requirements.',
    },
    respondent: {
      side: 'Woudenberg',
      argument: 'Congress can create new legal rights, and the violation of those rights constitutes a concrete injury sufficient for standing, even without additional tangible harm.',
    },
  },
  {
    id: 'free-speech-coalition-v-paxton',
    name: 'Free Speech Coalition v. Paxton',
    docket: '23-1122',
    argued: '2024-11-26',
    topic: 'First Amendment',
    question: 'Whether a state law requiring age verification to access online adult content violates the First Amendment.',
    petitioner: {
      side: 'Free Speech Coalition',
      argument: 'Mandatory age-verification requirements for lawful speech are content-based restrictions subject to strict scrutiny. They chill protected speech and create surveillance risks for adult users.',
    },
    respondent: {
      side: 'Texas (Paxton)',
      argument: 'The state has a compelling interest in protecting minors from harmful material. Age verification is a narrowly tailored, minimally burdensome means to achieve that interest without banning any speech.',
    },
  },
  {
    id: 'poland-v-trump',
    name: 'Poland v. Trump (Birthright Citizenship)',
    docket: '24A645',
    argued: null,
    topic: 'Constitutional Law',
    question: 'Whether the president may, by executive order, limit birthright citizenship guaranteed by the Fourteenth Amendment for children born to non-citizen parents.',
    petitioner: {
      side: 'Challenging States',
      argument: 'The Fourteenth Amendment\'s Citizenship Clause is unambiguous: all persons born in the United States and subject to its jurisdiction are citizens. No executive order can override a constitutional guarantee.',
    },
    respondent: {
      side: 'Trump Administration',
      argument: 'The phrase "subject to the jurisdiction thereof" has historically excluded certain categories. The executive has authority to interpret and enforce immigration-related constitutional provisions.',
    },
  },
  {
    id: 'tiktok-v-garland',
    name: 'TikTok Inc. v. Garland',
    docket: '24-656',
    argued: '2025-01-10',
    topic: 'First Amendment / National Security',
    question: 'Whether a federal law requiring ByteDance to divest TikTok or face a ban violates the First Amendment rights of the platform and its users.',
    petitioner: {
      side: 'TikTok / ByteDance',
      argument: 'The divest-or-ban law is an unprecedented restriction on speech affecting 170 million American users. It is a content-based restriction that fails strict scrutiny and constitutes a bill of attainder.',
    },
    respondent: {
      side: 'U.S. Government',
      argument: 'The law addresses genuine national security concerns about a foreign adversary\'s access to American data and ability to covertly manipulate content. It targets foreign ownership, not speech.',
    },
  },
  {
    id: 'oklahoma-v-epa',
    name: 'Oklahoma v. EPA (Good Neighbor Rule)',
    docket: '23A349',
    argued: null,
    topic: 'Environmental / Federal Power',
    question: 'Whether the EPA exceeded its authority under the Clean Air Act by issuing the "Good Neighbor" ozone transport rule requiring upwind states to reduce emissions.',
    petitioner: {
      side: 'Oklahoma & Industry Groups',
      argument: 'EPA\'s rule imposes massive costs on states without adequately accounting for individual state contributions to downwind pollution. The agency bypassed required state consultation procedures.',
    },
    respondent: {
      side: 'EPA',
      argument: 'The Clean Air Act expressly directs EPA to address interstate air pollution when states fail to do so. The Good Neighbor provision has been upheld for decades and the rule follows established methodology.',
    },
  },
];

export const SCOTUS_TERM = '2024-2025';
export const SCOTUS_COMPOSITION = { conservative: 6, liberal: 3 };
