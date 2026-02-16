/**
 * Blocked username patterns — client-side pre-check.
 * The authoritative check lives in the Cloud Function; this is
 * for instant UX feedback only.
 *
 * Entries can be plain strings (substring match) or RegExp.
 */
export const BLOCKED_PATTERNS = [
  // Racial / ethnic slurs
  'nigger', 'nigga', 'n1gger', 'n1gga', 'nigg3r',
  'chink', 'ch1nk', 'gook', 'g00k',
  'spic', 'sp1c', 'wetback', 'beaner',
  'kike', 'k1ke',
  'raghead', 'towelhead', 'camelj0ckey',
  'coon', 'c00n', 'darkie',
  'redskin', 'squaw',
  'zipperhead',

  // Homophobic / transphobic
  'faggot', 'fagg0t', 'f4ggot', 'fag',
  'dyke', 'dyk3',
  'tranny', 'tr4nny',

  // Sexual / vulgar
  'fuck', 'fuk', 'fck', 'f_ck', 'phuck', 'phuk',
  'shit', 'sh1t', 'sht',
  'cunt', 'c_nt',
  'cock', 'c0ck',
  'dick', 'd1ck',
  'pussy', 'puss1',
  'penis', 'pen1s',
  'vagina', 'vag1na',
  'anus', 'an_us',
  'cum', 'c_um',
  'jizz', 'j1zz',
  'whore', 'wh0re', 'hoe',
  'slut', 'sl_ut',
  'porn', 'p0rn',
  'rape', 'r4pe',
  'molest',
  'pedo', 'ped0', 'paedo',

  // Hate / violence
  'nazi', 'n4zi', 'naz1',
  'hitler', 'h1tler',
  'holocaust',
  'kkk',
  'jihad', 'j1had',
  'terrorist',
  'genocide',
  'killall',

  // Abusive
  'retard', 'r3tard', 'ret4rd',
  'bitch', 'b1tch',
  'bastard',
  'asshole', 'a55hole',
  'dumbass',

  // Impersonation / reserved
  'admin', 'moderator', 'system', 'support',
  'deleted', 'anonymous', 'guest_',
];
