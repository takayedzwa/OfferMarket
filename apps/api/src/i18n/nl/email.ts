// Dutch (Nederlands) email message catalog. Mirrors the English source of
// truth (`../en/email.ts`). Transactional emails only — no legal content, so
// no human-review flag is required. Add a language: create `<locale>/email.ts`
// and register it in `../email.ts`'s CATALOGS map.
export const nlEmail = {
  verification: {
    email_subject: 'Verifieer je OfferMarket-e-mailadres',
    phone_subject: 'Je OfferMarket-telefoonverificatiecode',
    body: 'Je OfferMarket-verificatiecode is: {code}\n\nDeze code vervalt over 15 minuten. Als je dit niet hebt aangevraagd, kun je deze e-mail negeren.',
    email_body_link: 'Welkom bij OfferMarket! Verifieer je e-mailadres om je account compleet te maken.\n\nKlik op de onderstaande link om te verifiëren (opent in je browser):\n{verifyUrl}\n\nOf voer deze 6-cijferige code in de app in:\n{code}\n\nDe link en code vervallen over 15 minuten. Als je geen account hebt aangemaakt, kun je deze e-mail negeren.',
  },
  password_reset: {
    subject: 'Stel je OfferMarket-wachtwoord opnieuw in',
    body: 'We hebben een verzoek ontvangen om je OfferMarket-wachtwoord opnieuw in te stellen.\n\nStel je wachtwoord opnieuw in via:\n{resetUrl}\n\nDeze link vervalt over 1 uur. Als je geen wachtwoordherstel hebt aangevraagd, kun je deze e-mail negeren en je wachtwoord blijft ongewijzigd.',
  },
  notification: {
    open_label: 'Openen',
    body_framing: '{title}\n\n{body}\n\n{openLabel}: {actionUrl}\n\n— OfferMarket',
    body_framing_no_link: '{title}\n\n{body}\n\n— OfferMarket',
  },
} as const;