// ============================================================================
// COMPANY — the single source of truth for OfferMarket's legal-identity facts.
// ----------------------------------------------------------------------------
// Every machine-readable (JSON-LD) and rendered (privacy/terms imprint, footer,
// billing) appearance of these facts must derive from this module, never
// restate them. The *sentences* around the facts live in the i18n message
// files (they are translated) and receive facts as interpolation parameters —
// see the "{companyName}"/"{kvk}"/"{street}"... placeholders there.
//
// Rules:
//   - facts only, no prose (prose stays in the translation files)
//   - before editing a value here, verify it is a fact (KvK registry, mailbox)
//   - structured-data's tests assert equality against this module
// ============================================================================

export const COMPANY = {
  /** Brand/trade name, used as the brand label everywhere. Previously
   * `SITE_NAME` in structured-data.ts (kept there as a re-export). */
  name: "OfferMarket",
  /** Name as it appears on the company imprint (privacy/terms/footer). */
  legalName: "Offermarket",
  /** KvK registration number (CTO-verified 2026-11-22). */
  kvk: "94632634",
  address: {
    streetAddress: "Tulastraat 17",
    postalCode: "3084BZ",
    city: "Rotterdam",
    /** ISO country code for schema.org. */
    countryCode: "NL",
    /** Locale-neutral display country is NOT stored here; each locale's
     * message file carries its own word ("Nederland"/"Netherlands"). */
  },
  phone: "+31681412448",
  emails: {
    info: "info@offermarket.nl",
    secondary: "takayedzwa@offermarket.nl",
    legal: "legal@offermarket.nl",
    dpo: "dpo@offermarket.nl",
  },
} as const;

/** One-line imprint address, in Dutch display order. */
export function companyAddressLine(locale: "en" | "nl"): string {
  const { streetAddress, postalCode, city } = COMPANY.address;
  const country = locale === "nl" ? "Nederland" : "Netherlands";
  return `${streetAddress}, ${postalCode}, ${city}, ${country}`;
}
