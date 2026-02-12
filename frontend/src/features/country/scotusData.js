/**
 * Supreme Court of the United States (SCOTUS) data
 * Current justices and notable pending cases for the October 2025-2026 term.
 * Last updated: February 12, 2026
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
    id: 'learning-resources-v-trump',
    name: 'Learning Resources v. Trump',
    docket: '24-1287',
    argued: '2025-11-05',
    topic: 'Tariffs / Executive Power',
    question: 'Whether the International Emergency Economic Powers Act (IEEPA) authorizes the president to impose tariffs, and if so, whether the statute unconstitutionally delegates Congress\'s legislative authority to the executive.',
    petitioner: {
      side: 'Learning Resources & Importers',
      argument: 'IEEPA was enacted to impose sanctions and embargoes for national security, not to levy tariffs — a core congressional power under Article I. No president before Trump used IEEPA for tariffs. The delegation of such sweeping economic authority violates the non-delegation doctrine.',
    },
    respondent: {
      side: 'Trump Administration',
      argument: 'IEEPA grants the president broad authority to "regulate" importation during a national emergency. Trade deficits and supply chain vulnerabilities constitute an emergency. The statute provides an intelligible principle sufficient to satisfy the non-delegation doctrine.',
    },
  },
  {
    id: 'trump-v-slaughter',
    name: 'Trump v. Slaughter (FTC)',
    docket: '25-7',
    argued: '2025-12-08',
    topic: 'Executive Power / Independent Agencies',
    question: 'Whether the president has the authority to remove Federal Trade Commission commissioners at will, overturning the 90-year-old Humphrey\'s Executor precedent that shields independent agency heads from political firing.',
    petitioner: {
      side: 'Trump Administration',
      argument: 'Article II vests all executive power in the president. Restrictions on the president\'s removal power over agency heads are unconstitutional. Humphrey\'s Executor was wrongly decided and should be overruled.',
    },
    respondent: {
      side: 'Rebecca Slaughter (FTC Commissioner)',
      argument: 'Congress has the constitutional authority to create independent agencies insulated from political pressure. Humphrey\'s Executor has been settled law for 90 years. Agencies like the FTC serve Congress\'s regulatory mandate, not the president\'s policy agenda.',
    },
  },
  {
    id: 'trump-v-cook',
    name: 'Trump v. Cook (Federal Reserve)',
    docket: '25-21',
    argued: '2026-01-21',
    topic: 'Executive Power / Fed Independence',
    question: 'Whether the president can fire a Federal Reserve board member, threatening the independence of the central bank from political control.',
    petitioner: {
      side: 'Trump Administration',
      argument: 'The president\'s removal power extends to all principal officers of the executive branch. The Federal Reserve exercises executive power and its governors must be accountable to the elected president.',
    },
    respondent: {
      side: 'Lisa Cook (Fed Governor)',
      argument: 'Federal Reserve independence is essential to economic stability. Congress deliberately insulated the Fed from short-term political pressure to protect monetary policy from electoral cycles. Markets worldwide depend on this independence.',
    },
  },
  {
    id: 'trump-v-barbara',
    name: 'Trump v. Barbara (Birthright Citizenship)',
    docket: '25-61',
    argued: null,
    topic: 'Constitutional Law',
    question: 'Whether Executive Order 14160, which declared an end to birthright citizenship for children of non-citizen parents, complies with the Citizenship Clause of the Fourteenth Amendment and the Immigration and Nationality Act of 1952.',
    petitioner: {
      side: 'Trump Administration',
      argument: 'The phrase "subject to the jurisdiction thereof" in the Fourteenth Amendment has historically excluded certain categories. The executive has authority to interpret citizenship provisions, and the order properly narrows citizenship to children of lawful permanent residents or citizens.',
    },
    respondent: {
      side: 'Barbara et al.',
      argument: 'The Fourteenth Amendment is unambiguous: all persons born in the United States and subject to its jurisdiction are citizens. The 1952 INA explicitly codifies birthright citizenship based on birth on U.S. soil regardless of parents\' status. No executive order can override the Constitution.',
    },
  },
  {
    id: 'west-virginia-v-bpj',
    name: 'West Virginia v. B.P.J.',
    docket: '25-101',
    argued: '2026-01-13',
    topic: 'Equal Protection / Title IX',
    question: 'Whether a state law that categorically bans transgender females from participating in women\'s school sports violates the Equal Protection Clause of the Fourteenth Amendment and Title IX.',
    petitioner: {
      side: 'West Virginia',
      argument: 'States have a legitimate interest in ensuring fair competition in women\'s athletics. Biological differences between the sexes are real, and sex-based classifications in sports serve important governmental objectives. The law does not discriminate based on transgender status.',
    },
    respondent: {
      side: 'B.P.J. (Transgender Student)',
      argument: 'A categorical ban based on transgender status is sex discrimination subject to heightened scrutiny. The law singles out transgender girls for exclusion without individualized assessment. It violates both the Equal Protection Clause and Title IX\'s prohibition on sex discrimination in education.',
    },
  },
  {
    id: 'chiles-v-salazar',
    name: 'Chiles v. Salazar',
    docket: '24-1246',
    argued: '2025-10-06',
    topic: 'First Amendment / LGBTQ+',
    question: 'Whether Colorado\'s ban on conversion therapy for minors violates the First Amendment by restricting the speech of licensed counselors based on viewpoint.',
    petitioner: {
      side: 'Chiles (Counselor)',
      argument: 'Conversion therapy bans regulate pure speech — talk therapy between a counselor and client. The government cannot dictate which viewpoints therapists may express. The law is a viewpoint-based restriction subject to strict scrutiny.',
    },
    respondent: {
      side: 'Colorado',
      argument: 'Conversion therapy bans regulate professional conduct, not speech. States have long regulated the practice of licensed professions. The ban protects minors from a discredited practice that major medical organizations unanimously condemn as harmful.',
    },
  },
  {
    id: 'louisiana-v-callais',
    name: 'Louisiana v. Callais',
    docket: '24-175',
    argued: '2025-10-11',
    topic: 'Voting Rights / Redistricting',
    question: 'Whether race-conscious redistricting required by Section 2 of the Voting Rights Act constitutes unconstitutional racial gerrymandering, potentially invalidating the VRA\'s core enforcement mechanism.',
    petitioner: {
      side: 'Callais Plaintiffs',
      argument: 'Drawing majority-minority districts is racial classification that triggers strict scrutiny under the Equal Protection Clause. Section 2\'s "results test" forces states to sort voters by race, which the Constitution forbids regardless of benign intent.',
    },
    respondent: {
      side: 'Louisiana (Defending the VRA)',
      argument: 'Section 2 of the Voting Rights Act is a valid exercise of Congress\'s enforcement power under the Fourteenth and Fifteenth Amendments. It does not mandate racial quotas but ensures minorities have equal opportunity to participate in the political process.',
    },
  },
  {
    id: 'watson-v-rnc',
    name: 'Watson v. Republican National Committee',
    docket: '25-316',
    argued: null,
    topic: 'Voting Rights / Elections',
    question: 'Whether federal "Election Day" statutes require that all mail-in ballots be received by election officials on Election Day, or whether states may count ballots postmarked by Election Day but received afterward.',
    petitioner: {
      side: 'Watson (Mississippi Secretary of State)',
      argument: 'Mississippi\'s five-day grace period ensures that voters who cast their ballots by Election Day have their votes counted. The postmark requirement confirms timely voting. Sixteen states plus D.C. have similar provisions, and abruptly invalidating late-arriving ballots would disenfranchise millions.',
    },
    respondent: {
      side: 'Republican National Committee',
      argument: 'Federal law establishes a single, uniform Election Day by which all ballots must be both cast and received. Grace periods undermine election integrity and finality. The Constitution gives Congress clear authority to set the time for federal elections.',
    },
  },
  {
    id: 'wolford-v-lopez',
    name: 'Wolford v. Lopez',
    docket: '23-1148',
    argued: '2026-01-20',
    topic: 'Second Amendment',
    question: 'Whether a Hawaii law making it a crime for concealed carry permit holders to carry handguns on private property without express authorization from the property owner violates the Second Amendment.',
    petitioner: {
      side: 'Wolford (Permit Holder)',
      argument: 'The Second Amendment protects the right to carry firearms in public for self-defense. Hawaii\'s default ban on carry across all private property, even when the owner has not objected, is an extreme outlier with no historical analogue that survives scrutiny under Bruen.',
    },
    respondent: {
      side: 'Hawaii (Lopez)',
      argument: 'Property owners have a fundamental right to control who may bring weapons onto their property. Hawaii\'s law respects property rights by requiring express consent. Historical tradition supports broad government authority to regulate firearms in sensitive places.',
    },
  },
  {
    id: 'us-v-hemani',
    name: 'United States v. Hemani',
    docket: '23-1226',
    argued: '2026-02-10',
    topic: 'Second Amendment',
    question: 'Whether the federal law prohibiting firearm possession by persons who are "unlawful users of or addicted to any controlled substance" violates the Second Amendment.',
    petitioner: {
      side: 'United States',
      argument: 'Congress has a compelling interest in keeping firearms from those whose judgment is impaired by drug use. The historical tradition of disarming dangerous persons supports prohibiting drug users from possessing firearms.',
    },
    respondent: {
      side: 'Hemani',
      argument: 'The prohibition is overbroad — it applies to any marijuana user in states where it is legal, even when not intoxicated. There is no historical analogue for permanently disarming someone based on substance use alone. The law fails the Bruen historical-tradition test.',
    },
  },
];

export const SCOTUS_TERM = '2025-2026';
export const SCOTUS_COMPOSITION = { conservative: 6, liberal: 3 };
