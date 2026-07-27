// ============================================================================
// COMMON-PASSWORD BLOCKLIST
// ----------------------------------------------------------------------------
// The DTO-level PASSWORD_REGEX (auth.dto.ts) enforces shape (8+ chars, upper,
// lower, digit) but cannot reject passwords that are trivially guessable
// despite meeting the shape (e.g. "Password1", "Qwerty123"). This blocklist is
// a self-contained, deterministic second line of defense — no network call.
//
// A Have-I-Been-Pwned ranged-API check can be layered on top later as an
// optional hook (see plan); it is deliberately NOT added now to avoid an
// outbound network dependency and a fail-open/fail-closed decision.
// ============================================================================

/**
 * Lowercase, trimmed common passwords. Keep this curated — breadth matters
 * more than length; a few hundred well-chosen entries covers the vast majority
 * of trivially-guessable passwords that still satisfy the regex.
 */
export const COMMON_PASSWORDS: ReadonlySet<string> = new Set([
  // "password" family
  'password', 'password1', 'password12', 'password123', 'password1234',
  'password12345', 'password123456', 'password!', 'password1!', 'passw0rd',
  'passw0rd1', 'passw0rd123', 'p@ssword', 'p@ssw0rd', 'p@ssword1', 'p@ssw0rd1',
  'pa55word', 'pa55word1',
  // name + year / common word combos that satisfy the regex
  'letmein', 'letmein1', 'letmein123', 'welcome', 'welcome1', 'welcome123',
  'qwerty', 'qwerty1', 'qwerty12', 'qwerty123', 'qwertyui', 'qwertyuiop',
  'abc123', 'abc12345', 'abcd1234', 'abc123456', 'abcabc123',
  'iloveyou', 'iloveyou1', 'iloveyou123', 'love123', 'lovely123',
  'monkey', 'monkey12', 'monkey123', 'dragon', 'dragon12', 'dragon123',
  'master', 'master12', 'master123', 'sunshine', 'sunshine1', 'sunshine123',
  'princess', 'princess1', 'princess123', 'football', 'football1', 'football123',
  'baseball', 'baseball1', 'baseball123', 'shadow', 'shadow12', 'shadow123',
  'michael', 'michael1', 'michael123', 'jordan', 'jordan23', 'jordan123',
  'hunter', 'hunter2', 'hunter12', 'hunter123', 'ranger', 'ranger1', 'ranger12',
  'summer', 'summer1', 'summer123', 'winter', 'winter1', 'winter123',
  'spring', 'spring1', 'spring123', 'autumn', 'autumn1', 'autumn123',
  'flower', 'flower12', 'flower123', 'cookie', 'cookie12', 'cookie123',
  'whatever', 'whatever1', 'whatever123', 'trustno1', 'trustno12',
  // numeric/sequential that meet 8+ chars with the regex? these don't all
  // satisfy the regex (no upper), but block them anyway in case of future
  // relaxation
  '12345678', '123456789', '1234567890', '87654321', '11111111', '00000000',
  '12341234', 'abcdabcd', 'aaaaaaaa', 'aaaaaaaa1',
  // common "shape-satisfying" attempts
  'admin123', 'admin1234', 'administrator1', 'root1234', 'rootroot1',
  'test1234', 'testtest1', 'guest1234', 'guestguest1', 'user1234', 'useruser1',
  'changeme1', 'changeme123', 'welcome2024', 'welcome2025', 'welcome2026',
  'password2024', 'password2025', 'password2026', 'qwerty2024', 'qwerty2025',
  // keyboard walks that satisfy shape
  'qwerty123', 'asdf1234', 'asdfasdf1', 'zxcv1234', 'zxcvbnm1', '1qaz2wsx',
  '1q2w3e4r', '1q2w3e4r5t', 'q1w2e3r4', 'qwer1234', 'qazwsx123',
  // seasonal + year combos
  'summer2024', 'summer2025', 'summer2026', 'winter2024', 'winter2025',
  'winter2026', 'spring2024', 'spring2025', 'spring2026', 'fall2024',
  'fall2025', 'fall2026', 'january2024', 'february2024', 'march2024',
  // brand / app-specific guesses
  'offermarket1', 'offermarket123', 'offermarket2024', 'offermarket2025',
  'offermkt123', 'market1234',
]);

/**
 * Returns true if the password is trivially guessable. Normalizes to lowercase
 * + trimmed and also rejects a couple of obvious derived variants (the value
 * itself, the value + "123"/"1"/"!"). Case-insensitive on purpose.
 */
export function isCommonPassword(password: string): boolean {
  if (typeof password !== 'string') return false;
  const pw = password.trim().toLowerCase();
  if (!pw) return false;
  if (COMMON_PASSWORDS.has(pw)) return true;
  // Reject obvious suffix variants of any blocklisted entry.
  for (const suffix of ['123', '1234', '1', '!', '12']) {
    if (COMMON_PASSWORDS.has(pw.slice(0, -suffix.length)) && pw.endsWith(suffix)) {
      return true;
    }
  }
  return false;
}