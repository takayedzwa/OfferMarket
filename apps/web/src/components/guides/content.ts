// ============================================================================
// GUIDE CONTENT REGISTRY (guide family, L1) — Δ3c contract enforcement:
// guides own "elektricien worden / opleiding" (cluster G) and certification
// explainers as MODULES under how-to context — never standalone jargon-landing
// pages, no "salaris" heads (→ /insights), no live numbers (→ /market, linked
// only when the gate passes), no guarantee claims (honesty rules).
// Long-form copy lives here (code-reviewed, editorial sign-off by commit);
// the Δ7 per-page specs in docs/growth/ are the review source.
// ============================================================================

export interface GuideSection {
  heading: string;
  body: string[];
}

export interface GuideDefinition {
  slug: string;
  title: { nl: string; en: string };
  description: { nl: string; en: string };
  audience: "worker" | "employer";
  sections: { nl: GuideSection[]; en: GuideSection[] };
  /** DefinedTerm schema entries (certification explainers). */
  definedTerms?: Array<{ name: string; description: { nl: string; en: string } }>;
  /** Optional /market cross-link, rendered ONLY when the gate passes (T10/T12). */
  marketLink?: { profession: string };
}

export const GUIDES: GuideDefinition[] = [
  {
    slug: "hoe-word-je-elektricien",
    title: { nl: "Hoe word je elektricien?", en: "How do you become an electrician?" },
    description: {
      nl: "De routes naar het vak: mbo, BBL, omscholen, en de certificaten die je nodig hebt. Stap voor stap, zonder loze toezeggingen.",
      en: "The routes into the trade: vocational training, apprenticeships, career switching, and the certificates you need. Step by step, no empty promises.",
    },
    audience: "worker",
    marketLink: { profession: "elektricien" },
    sections: {
      nl: [
        {
          heading: "De vier routes naar het vak",
          body: [
            "De meeste elektriciens komen het vak in via het mbo (elektrotechnische installatietechniek), via een BBL-traject (leren én werken bij een erkend leerbedrijf), via een particuliere opleiding als doorstromer, of door op basis van relevante elektrotechnische kennis bij een installatiebedrijf in dienst te treden en intern verder geleerd te worden.",
            "Welke route bij je past hangt af van voorgaande werkervaring: een BBL-combinatie is de snelste betaalbare weg als je al in de techniek werkt; als omscholer zonder elektrotechnische achtergrond is een voltijds opleiding (vaak avond- of dagtraject op mbo-niveau) de gangbare instap.",
          ],
        },
        {
          heading: "Welke certificaten je nodig hebt",
          body: [
            "Twee zaken komen in vrijwel elke vacature terug: geldende veiligheidscertificaten (VCA of VCA-VOL) en de NEN 1010/3140-werkvoorschriften voor werk aan installaties. Naarmate je verder specialiseert (middenspanning, industriële installaties, zonne-energie, laadpalen) komen specifiekere eisen erbij.",
            "Wet- en regelgeving en cao-afspraken bepalen de details per werkgever — controleer altijd de actuele eisen van de regeling die voor jou geldt.",
          ],
        },
        {
          heading: "Wat je van een eerste functie kunt verwachten",
          body: [
            "Instapprofielen worden doorgaans beoordeeld op bewijsbare vaardigheden en certificaten, niet op levensverhaal. Werk slim: noteer precies welke certificaten je hebt, met geldigheidsduur, en welke installatietypes je hebt behandeld.",
            "Op OfferMarket stel je een profiel in waarin juist die vakinhoud de hoofdrol speelt (werkgebied, vaardigheden, certificaten, beschikbaarheid) — je identiteit blijft anoniem totdat je zelf een bod accepteert.",
          ],
        },
        {
          heading: "Hoe het aanbod-gebaseerde model werkt",
          body: [
            "In plaats van vacature-voor-vacature te solliciteren laat je werkgevers aan je aanbieden: ieder bod vermeldt salaris, uren, arbeidsvoorwaarden en contracttype vóórdat jij kiest je te reageren. Er is geen kostenpost aan jouw kant: werkgevers dragen de marktplaats.",
            "We beloven je niet een aantal aanbiedingen — we beloven dat ieder bod dat binnenkomt concreet en op jou is gericht, en dat jij de knoppen (zichtbaarheid, geblokkeerde werkgevers) in handen hebt.",
          ],
        },
      ],
      en: [
        {
          heading: "Four routes into the trade",
          body: [
            "Most electricians enter the field through vocational education (mbo), a BBL apprenticeship track (working and learning at a recognised training company), a private course as a career switcher, or by being hired for their electrical background and trained internally.",
            "Your previous experience decides which route fits: a BBL combination is the fastest affordable path if you already work in technical trades; career switchers without electrotechnical background usually start with a full-time vocational course.",
          ],
        },
        {
          heading: "Which certificates you need",
          body: [
            "Two things appear in nearly every vacancy: a valid safety certificate (VCA or VCA-VOL) and the NEN 1010/3140 work prescriptions for installation work. More specific requirements appear as you specialise (medium voltage, industrial installations, solar, EV charging).",
            "Rules and collective-agreement arrangements differ per employer — always check the current requirements of the scheme that applies to you.",
          ],
        },
        {
          heading: "What a first role looks like",
          body: [
            "Entry profiles are judged on demonstrable skills and certificates, not on your life story. Keep an exact record of the certificates you hold (with validity dates) and the installation types you have worked on.",
            "On OfferMarket your profile leads with exactly that content (trade area, skills, certifications, availability) — your identity stays anonymous until you accept an offer yourself.",
          ],
        },
        {
          heading: "How the offer-based model works",
          body: [
            "Instead of applying vacancy by vacancy, you let employers bid: every offer states salary, hours, benefits and contract type before you decide to respond. There is no cost to you — employers fund the marketplace.",
            "We don't promise a number of offers — we promise that every offer that arrives is concrete, aimed at you, and that you hold the controls (visibility, blocked employers).",
          ],
        },
      ],
    },
  },
  {
    slug: "elektricien-certificaten-uitleg",
    title: {
      nl: "VCA, NEN 3140 en NEN 1010 voor elektriciens, uitgelegd",
      en: "VCA, NEN 3140 and NEN 1010 for electricians, explained",
    },
    description: {
      nl: "Wat elk certificaat betekent, wanneer het vereist is en hoe werkgevers ernaar filteren in gestructureerde aanbiedingen.",
      en: "What each certificate means, when it is required, and how employers filter on it in structured offers.",
    },
    audience: "worker",
    marketLink: { profession: "elektricien" },
    definedTerms: [
      {
        name: "VCA / VCA-VOL",
        description: {
          nl: "Het NL-arbeidsveiligheidscertificaat voor aannemers en (zelfstandige) monteurs; VCA-VOL is de volledige variant voor zelfstandig werkenden.",
          en: "The Dutch occupational-safety certificate for contractors and (self-employed) technicians; VCA-VOL is the full variant for self-employed workers.",
        },
      },
      {
        name: "NEN 3140",
        description: {
          nl: "De Nederlandse praktijkrichtlijn voor veilig werken met en nabij elektrische installaties; VP (Veilige en Professionele Uitvoering) en VOP (Vakbekwaam Opgeleid Persoon) zijn de gangbare werkvergunningen.",
          en: "The Dutch practice guideline for safe work on and near electrical installations; VP (Safe and Professional Execution) and VOP (Qualified Trained Person) are the common work licences.",
        },
      },
      {
        name: "NEN 1010",
        description: {
          nl: "De norm voor veiligheid van laagspanningsinstallaties — de basis waarop de meeste installatiewerk in de woning- en utiliteitsbouw wordt beoordeeld.",
          en: "The standard for the safety of low-voltage installations — the basis on which most wiring work in residential and commercial construction is assessed.",
        },
      },
    ],
    sections: {
      nl: [
        {
          heading: "Waarom deze drie steeds samen voorkomen",
          body: [
            "In het installatievak hangen veiligheidscertificering en normkennis aan elkaar: VCA toont dat je veiligheidsbewust werkt; NEN 1010 bepaalt hoe installaties veilig zijn gebouwd; NEN 3140 bepaalt hoe je er veilig aan werkt (en op grond van welke vergunning: VP of VOP). Werkgevers gebruiken ze in filters, omdat een ontbrekend certificaat een werkvergunning blokkeert.",
          ],
        },
        {
          heading: "Hoe werkgevers ernaar filteren",
          body: [
            "In de zoekomgeving van OfferMarket werkt elke werkgever met hetzelfde filterpaneel: vakgebied, certificeringen (waaronder VCA en NEN 3140), specialisatie, beschikbaarheid, ervaring en taal. Een volledig en actueel certificaatoverzicht op je profiel vergroot de kans dat je in dat filterresultaat verschijnt — dat is het mechanisme, geen belofte over hoeveel boden je krijgt.",
          ],
        },
        {
          heading: "Zorg dat je certificaatoverzicht klopt",
          body: [
            "Noteer per certificaat: type, nummer (alleen intern — nooit openbaar), geldigheidsdatum en het uitgiftende orgaan. Uitgeef-organen hebben hun eigen registraties; je kunt altijd bij het orgaan controleren of je certificaat nog geldt voordat je het op een profiel vermeldt.",
            "Op OfferMarket worden certificaten op een openbaar profiel alleen getoond wanneer het platform ze expliciet heeft geverifieerd — zo blijft het overzicht betrouwbaar (dit is vastgesteld platformbeleid, geen belofte over toekomstige functionaliteit).",
          ],
        },
      ],
      en: [
        {
          heading: "Why these three always appear together",
          body: [
            "In the installation trade safety certification and standards knowledge go hand in hand: VCA shows you work safety-consciously; NEN 1010 defines how installations must be safely built; NEN 3140 defines how you work on them safely (and on which work licence: VP or VOP). Employers use them as filters, because a missing certificate blocks a work licence.",
          ],
        },
        {
          heading: "How employers filter on them",
          body: [
            "In OfferMarket's search environment every employer uses the same filter panel: trade, certifications (including VCA and NEN 3140), specialisation, availability, experience and language. A complete, current certificate list on your profile increases the chance you appear in that filtered result — that is the mechanism, not a promise about offer counts.",
          ],
        },
        {
          heading: "Keep your certificate list accurate",
          body: [
            "Record per certificate: type, number (internal only — never public), validity date and issuing body. Issuing bodies hold their own registries; verify with them whether your certificate still stands before listing it.",
            "On OfferMarket, certifications are shown on a public profile only when explicitly verified by the platform — an established platform policy, not a promise about future features.",
          ],
        },
      ],
    },
  },
  {
    slug: "gekwalificeerde-elektricien-verifiëren",
    title: {
      nl: "Een gekwalificeerde elektricien verifiëren — checklist",
      en: "How to verify a qualified electrician — a checklist",
    },
    description: {
      nl: "Waar werkgevers op letten: werkvergunningen (VP/VOP), VCA, registraties en de vragen die je een kandidaat of een platform kunt stellen.",
      en: "What employers look for: work licences (VP/VOP), VCA, registrations, and the questions to ask a candidate or a platform.",
    },
    audience: "employer",
    marketLink: { profession: "elektricien" },
    sections: {
      nl: [
        {
          heading: "De vier verificatiestappen vóór het inhuren",
          body: [
            "1. Werkvergunningen binnen NEN 3140: controleer of de kandidaat VP (Veilige en Professionele Uitvoering) of VOP (Vakbekwaam Opgeleid Persoon) heeft volgens het werk dat gepland staat. 2. VCA/VCA-VOL: de veiligheidsbasis die verhuurders en eindverantwoordelijke bedrijven doorgaans vereisen. 3. Normkennis NEN 1010 voor laagspanningsinstallaties. 4. Vak-specifieke registraties (middenspanning, zonnestroom, laadpalen) volgens het project.",
          ],
        },
        {
          heading: "Vragen die je op tafel zet",
          body: [
            "Welke installatietypes heb je in de laatste jaren uitgevoerd? Onder welke vergunning werkte toen? Geldigheidsdata? Wie kan je werk bevestigen? Deze vragen maken het verschil tussen een profiel dat goed klinkt en een profiel dat waar is.",
          ],
        },
        {
          heading: "Hoe OfferMarket dit ondersteunt",
          body: [
            "Profielen op OfferMarket zijn gestructureerd: certification-velden met verificationsstatus, vakgebieden en specialisaties, talen met CEFR-niveau en beschikbaarheid. Als werkgever zie je exact de vakinhoud die overeenkomt met je filters — inclusief vakmensen die niet actief solliciteren. Verificatie van je eigen bedrijf (KvK-controle vóór het eerste bod) gaat vooraf aan elke aanbieding.",
            "Het model zelf is simpel te begrijpen: je zoekt en bied aan, en betaalt €499 per geaccepteerde introductie — niets als niemand accepteert (op onze prijzengids vind je de vergelijking met bureau- en vacatureplatformkosten).",
          ],
        },
      ],
      en: [
        {
          heading: "Four verification steps before hiring",
          body: [
            "1. Work licences under NEN 3140: check whether the candidate holds VP or VOP per the planned work. 2. VCA/VCA-VOL: the safety basis landlords and account-holding companies typically require. 3. NEN 1010 knowledge for low-voltage installations. 4. Trade-specific registrations per project.",
          ],
        },
        {
          heading: "The questions to put on the table",
          body: [
            "Which installation types have you worked on in recent years? Under which licence? Validity dates? Who can confirm your work? These questions separate a profile that sounds right from a profile that is right.",
          ],
        },
        {
          heading: "How OfferMarket supports this",
          body: [
            "Profiles on OfferMarket are structured: certification fields with verification status, trades and specialisations, languages with CEFR levels, availability. As an employer you see exactly the trade content matching your filters — including tradespeople who aren't actively job-hunting. Your own registration (KvK verification before your first offer) precedes any offer.",
            "The model itself is simple: search and bid, pay €499 per accepted introduction — nothing if nobody accepts (see our pricing page for the comparison with agency and job-board costs).",
          ],
        },
      ],
    },
  },
];

export function findGuide(slug: string): GuideDefinition | null {
  return GUIDES.find((g) => g.slug === slug) ?? null;
}
