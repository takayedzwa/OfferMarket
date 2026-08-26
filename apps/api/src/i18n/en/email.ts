// English email message catalog. These strings are the source of truth — the
// Dutch catalog (`../nl/email.ts`) mirrors them. English is also the fallback
// when a locale is unknown or a key is missing, so unmigrated callers keep the
// exact historical wording (zero-regression).
export const enEmail = {
  verification: {
    email_subject: 'Verify your OfferMarket email',
    phone_subject: 'Your OfferMarket phone verification code',
    body: 'Your OfferMarket verification code is: {code}\n\nIt expires in 15 minutes. If you did not request this, you can safely ignore this email.',
    email_body_link: 'Welcome to OfferMarket! Verify your email address to finish setting up your account.\n\nClick the link below to verify (opens in your browser):\n{verifyUrl}\n\nOr enter this 6-digit code in the app:\n{code}\n\nThe link and code expire in 15 minutes. If you did not create an account, you can safely ignore this email.',
  },
  password_reset: {
    subject: 'Reset your OfferMarket password',
    body: 'We received a request to reset your OfferMarket password.\n\nReset your password by visiting:\n{resetUrl}\n\nThis link expires in 1 hour. If you did not request a password reset, you can safely ignore this email and your password will remain unchanged.',
  },
  notification: {
    // Generic framing for notification emails. The notification `title`/`body`
    // are still the English fallback stored on the Notification row — fully
    // localized notification emails (rendered from notificationType + actionData
    // server-side) are deferred as an incremental step; see i18n-phase4 progress.
    open_label: 'Open',
    body_framing: '{title}\n\n{body}\n\n{openLabel}: {actionUrl}\n\n— OfferMarket',
    body_framing_no_link: '{title}\n\n{body}\n\n— OfferMarket',
  },
} as const;