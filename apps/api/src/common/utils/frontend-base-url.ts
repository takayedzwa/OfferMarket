/**
 * Canonical app origin used to build links sent to users (referral links,
 * email deep links). FRONTEND_URL may be a comma-separated CORS allowlist (dev
 * lists several *.localhost subdomains), so take the first entry — the primary
 * origin — rather than embedding the whole list into a URL (which would break
 * the link).
 */
export function frontendBaseUrl(): string {
  return (process.env.FRONTEND_URL || 'http://localhost:3000')
    .split(',')[0]
    .trim();
}