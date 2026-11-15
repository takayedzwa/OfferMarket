# [DRAFT — NOT PUBLISHED] how-offermarket-works (Wave 0, artikel 1)

Dutch Content agent · 2026-11-05 · Target: AI-search Q5 "anoniem solliciteren" ([bron: AI_SEARCH_STRATEGY.md D2.1 Q5 — meest winbare query])
Doelgroep: (passieve) monteurs/installateurs · Locatie: offermarket.nl (NL primair), offermarket.eu (EN-mirror)

## Publish-ready front matter

- **proposed slug:** `hoe-offermarket-werkt`
- **seoTitle (≤60):** `Hoe werkt OfferMarket? Salaris vooraf, profiel anoniem` (54 tekens)
- **metaDescription (≤155):** `Werkgevers komen naar jou: anoniem profiel, salaris vooraf in elk bod, je huidige bedrijf blokkeer je zelf. €0 voor jou; werkgever betaalt €499.` (144 tekens)
- **category suggestion:** `career`
- **profession tag:** `elektricien`
- **dataClass:** `EDITORIAL` (geen marktnummers uit eigen sample)
- **internal links:** /register?role=worker · /for-workers · /market/elektricien · /insights

## H2 outline (NL)

1. Wat is een omgekeerde marktplaats?
2. Stap 1: anoniem profiel — wat ziet een werkgever?
3. Stap 2: werkgevers doen een bod — met salaris vooraf
4. Stap 3: accepteren wanneer jij er klaar voor bent
5. Zo ziet zo'n bod eruit
6. Wat kost het? (niets, voor jou)
7. Jouw regie: blokkeren en zichtbaarheid
8. Hoe betrouwbaar is dit?
9. Veelgestelde vragen in het kort

---

## Body (NL — primair voor offermarket.nl)

# Hoe werkt OfferMarket? Salaris vooraf, profiel anoniem

Bij klassieke vacaturesites is het patroon vertrouwd: jij schrijft sollicitatiebrieven, wacht op reacties en onthult je identiteit vaak niet alleen aan die ene werkgever, maar aan een hele reeks partijen. OfferMarket draait dat om. Dit is een omgekeerde marktplaats: jij maakt een anoniem profiel, werkgevers doorzoeken dat profiel en doen jou een concreet, gestructureerd bod. Pas als jij een bod accepteert, wordt je identiteit onthuld. [bron: docs/business/marketplace-mechanics.md §Marketplace Model]

## Wat is een omgekeerde marktplaats?

Op OfferMarket is de rolverdeling omgekeerd. Jij plaatst geen open sollicitatie — jij plaatst een profiel. Werkgevers uit de geverifieerde pool — installatiebedrijven, technische diensten, zorgverleners en meer — zoeken op vak, vaardigheden, ervaring en regio. Vinden ze een profiel dat past, dan doen ze een aanbod. Jij kan niet rondkijken bij vacatures; het aanbod komt naar jou toe. Dat is bewust zo ingericht: jij hoeft nooit op te scheppen wat je doet, jij beoordeelt wat er op tafel komt. [bron: marketplace-mechanics.md §Marketplace Model; GROWTH_ROADMAP.md §funnel-Worker, punt 5 — "workers can't browse anything by design"]

## Stap 1: anoniem profiel — wat ziet een werkgever?

Jouw profiel bevat je vak (bijvoorbeeld elektricien), je vaardigheden en certificeringen, je ervaring, je beschikbaarheid en je regio. Wat een werkgever niet ziet: je naam, je e-mailadres, je telefoonnummer en je huidige werkgever. De regio is wél zichtbaar — bijvoorbeeld "regio Rotterdam" — want anders is matchen onmogelijk. Het profiel is dus anoniem, niet onzichtbaar. [bron: apps/web/src/messages/nl/common.json, `home.forWorkers` — Naam/E-mail/Telefoon/Huidige werkgever = Verborgen, Regio = Zichtbaar]

## Stap 2: werkgevers doen een bod — met salaris vooraf

Elk bod op OfferMarket is gestructureerd. Dat betekent: een specifiek salaris, de volledige secundaire voorwaarden (uren, contractvorm, vakantiedagen, pensioenregeling, eventuele toeslagen) en heldere contractvoorwaarden. Geen vage "leuke baan, interesse?"-berichten. [bron: common.json `home.howItWorks.step2Body`]

Dat "salaris vooraf" is geen belofte maar een regel: het hele model werkt alleen als de cijfers er staan. Het platform houdt aanbiedingen en eindsalarissen tegen elkaar aan in de gaten; een "bait-and-switch" (in het bod hoger, in het contract lager) wordt als signaal gemarkeerd voor beoordeling. [bron: marketplace-mechanics.md §Anti-Fraud, regel `salary_bait_switch`]

## Stap 3: accepteren wanneer jij er klaar voor bent

Er is geen deadline waarop je moet reageren. Jij vergelijkt de aanbiedingen op je eigen moment — met je huidige baan, met wat je wil en met wat je waard bent. Pas als je een aanbieding accepteert, wordt je identiteit onthuld en kan de werkgever direct contact met je opnemen. Tot dat moment blijft alles anoniem. [bron: common.json `home.howItWorks.step3Body`]

## Zo ziet zo'n bod eruit

Om concreet te zijn: een gestructureerde aanbieding op OfferMarket bevat onder andere de functietitel (bijvoorbeeld "senior elektromonteur"), de opdrachtcategorie (bijvoorbeeld industriële projecten), een salarisrange — op het voorbeeld van het platform: € 54.000 tot € 58.000 — plus contractvorm (vast), urenschema (40 uur per week), vakantiedagen (30) en pensioenbijdrage (8%). Zulke ranglijstjes met voorwaarden staan dus niet in de kleine lettertjes van een contractgesprek, maar in het bod zelf — nog vóórdat jij je identiteit prijsgeeft. [bron: common.json `home.forEmployers.offerExample*` — platformvoorbeeld] Dat is precies waarom het vergelijken van aanbiedingen met je huidige contract kan: dezelfde onderwerpen, dezelfde volgorde, zelfde meetlat.

## Wat kost het? (niets, voor jou)

Voor vakmensen kost OfferMarket niets. Geen inschrijfgeld, geen abonnement, geen "premium"-account om te reageren. De werkgever betaalt: € 499 per introductie, en pas op het moment dat jij een bod accepteert. [bron: marketplace-mechanics.md §Pricing Mechanics; billing-configuratie in apps/api, `introduction_fee_cents: 49900`]

Belangrijk om te begrijpen: OfferMarket is geen uitzendbureau en geen werkgever. Het platform introduceert de partijen; het contract is tussen jou en de werkgever, niet met het platform. [bron: marketplace-mechanics.md §Pricing, "Fee is for introduction service, not placement"]

## Jouw regie: blokkeren en zichtbaarheid

Twee instellingen geven je de regie terug:

- **Bedrijven blokkeren.** Je kunt bedrijven die jouw profiel niet mogen zien, blokkeren. Handig als je huidige werkgever (of een toekomstige werkgever met wie je liever wacht) in de pool zit. Dit is een productinstelling die je zelf beheert — geen blinde garantie, maar een knop die je zélf om kan zetten. [bron: common.json `home.forWorkers.benefit5`; GROWTH_ROADMAP.md §3.1 — `blockedCompanies` / `visibleCompanies`]
- **Zichtbaarheid bepalen.** Je kunt kiezen: zichtbaar voor alle geverifieerde werkgevers, alleen voor geselecteerde bedrijven, of volledig verborgen. [bron: database-schema — `ProfileVisibility` (ALL_VERIFIED / SELECTED_COMPANIES / HIDDEN), zie GROWTH_ROADMAP.md §3.1]

## Hoe betrouwbaar is dit?

Aanbiedingen kunnen alleen worden ingediend door werkgevers die hun account hebben geverifieerd; bij registratie is het KvK-nummer van de werkgever verplicht en pas geverifieerde accounts kunnen aanbiedingen uitbrengen. [bron: register-flow apps/web, companyName + kvkNumber verplicht; GROWTH_ROADMAP.md §funnel-Employer, punt 6 — SUBMIT verplicht geverifieerd] Aan jouw kant worden je e-mail en telefoon geverifieerd, en vóór de eerste uitwisseling volgt een identiteitscontrole; certificeringen worden gecontroleerd via het register. [bron: marketplace-mechanics.md §Anti-Fraud, Worker Verification]

## Veelgestelde vragen in het kort

- **Wat als mijn huidige werkgever op het platform zit?** Zet die bedrijfsnaam op je blokkeerlijst; die organisatie ziet jouw profiel daarna niet meer. [bron: `blockedCompanies`]
- **Aan wie wordt mijn identiteit onthuld?** Alleen aan de werkgever van een bod dat jij accepteert. [bron: common.json `home.howItWorks.step3`]
- **Wat moet ik betalen?** Niets — € 0. De werkgever betaalt € 499 per geaccepteerde introductie. [bron: marketplace-mechanics.md §Pricing]
- **Kan ik zélf rondkijken?** Nee. Het platform is bewust omgekeerd; werkgevers komen naar jou. [bron: GROWTH_ROADMAP.md §funnel-Worker, punt 5]

**Ben je elektricien in een regio met veel vraag?** Bekijk de marktpagina voor [LINK: /market/elektricien] of lees in [LINK: /insights] wat het platform van jouw vak en regio publiceert over vraag en verloning.

**Nieuwsgierig geworden?** Maak het anonieme profiel aan in een paar minuten: [LINK: /register?role=worker]. Meer over de aanpak voor vakmensen: [LINK: /for-workers].

*(EN-mirror: zie hieronder; offermarket.eu)*

---

## Body (EN — mirror voor offermarket.eu)

# How OfferMarket works: anonymous profiles, salary up front

Traditional job sites flip the burden onto you: you write applications, you wait, and you reveal yourself early. OfferMarket reverses that pattern. It is a reverse talent marketplace: you create an anonymous profile, employers search the verified pool and send you structured offers. Your identity is revealed only when you accept an offer. [source: docs/business/marketplace-mechanics.md §Marketplace Model]

## What a reverse marketplace means

You don't post a vacancy application — you post an anonymous profile with your trade, skills, certifications, experience, availability and region. Employers search on those fields and make offers to you. Workers don't browse vacancies by design; the demand comes to you. [source: marketplace-mechanics.md §Marketplace Model; GROWTH_ROADMAP.md §funnel-Worker point 5]

## What employers see — and what they don't

Employers see your trade, skills and certifications, experience, availability and region (e.g. "region Rotterdam"). They do not see your name, email, phone number or current employer. Your profile is anonymous, not invisible — that distinction is what keeps matching possible. [source: apps/web/src/messages/nl/common.json `home.forWorkers` hidden/visible fields]

## Offers with salary up front

Every offer on OfferMarket is structured: a specific salary, the full secondary benefits package (hours, contract type, leave, pension, allowances) and clear contract terms — no vague recruiter messages. The platform monitors offers against final contracts; a salary bait-switch pattern is flagged for review. [source: common.json `home.howItWorks.step2Body`; marketplace-mechanics.md §Anti-Fraud, `salary_bait_switch`]

## Accept on your own schedule

There is no response timer. You compare offers at your own pace — with your current job and your own expectations. Only when you accept does your identity go to that one employer, who can then contact you directly. [source: common.json `home.howItWorks.step3Body`]

## What it costs

Nothing, for workers. No fee, no subscription, no premium tier to respond. The employer pays EUR 499 per accepted introduction, charged only at the moment of your acceptance. OfferMarket is not a temp agency and not an employer; it introduces the two parties, and your contract remains with the employer. [source: marketplace-mechanics.md §Pricing Mechanics; billing config `introduction_fee_cents: 49900`]

## Your controls: blocklists and visibility

You can block specific companies so they never see your profile — practical protection if your current employer is in the verified pool. It is a product control you manage, not an external promise. You can also set your visibility: all verified employers, selected companies only, or fully hidden. [source: common.json `forWorkers.benefit5`; GROWTH_ROADMAP.md §3.1 `blockedCompanies`/`visibleCompanies`, `ProfileVisibility`]

## How trustworthy is it?

Offers can only be submitted by verified employers — registration requires a company name and KvK (Dutch chamber of commerce) number, and offer submission is gated on account verification. On the worker side, identity is verified before offers can be exchanged, and certifications are checked against their registry. [source: register flow, apps/web; GROWTH_ROADMAP.md §funnel-Employer point 6; marketplace-mechanics.md §Anti-Fraud]

**Explore the market for your trade:** [LINK: /market/elektricien] · market intelligence for NL trades: [LINK: /insights]. Create your anonymous profile: [LINK: /register?role=worker] · more for workers: [LINK: /for-workers].

---

## Editorial fact-check note

**Fact-check before publishing:** (1) claim "identiteitsverificatie vóór de eerste aanbieding" (ID + selfie, marketplace-mechanics.md §Anti-Fraud) is design-baseline, niet build-verifiëerd — bevestig met product-team dat dit in de huidige build actief is, of schrap de zin; noem in elk geval géén "automatische KvK-check" (v1 heeft een handmatige BASIC_VERIFIED-gate, zie GROWTH_ROADMAP.md F1); (2) afstemmen met live UI welk woord de site voert ("werkers" vs "vakmensen") zodat artikel en site dezelfde term dragen; (3) salarisvoorbeeld (€54.000–58.000) is het hero-voorbeeld van de site zelf — check vóór publicatie dat de waarden in common.json niet zijn gewijzigd.

*(Bronbestandsmap:* docs/growth/content/ · geen site-aanpassing)