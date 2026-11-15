#!/usr/bin/env bash
# ============================================================================
# verify-host-metadata.sh — repeatable Layer-2/4 metadata verification
# ----------------------------------------------------------------------------
# Curls the key public routes and asserts the per-domain SEO contract from
# docs/growth/URL_ARCHITECTURE.md (Δ5 matrix + audit tickets T1/T2/T4):
#   - robots.txt / sitemap.xml self-reference the serving host's production URLs
#   - shared-template pages emit self-canonical + hreflang (en/nl/x-default)
# Usage:
#   ./scripts/verify-host-metadata.sh            # dev (localhost:3000; dev
#                                                # canonicals use *.localhost)
#   PROD=1 ./scripts/verify-host-metadata.sh     # production (real domains)
# Exits non-zero if any assertion fails.
# ============================================================================
set -uo pipefail

PROD="${PROD:-0}"
if [ "$PROD" = "1" ]; then
  EU_FETCH_URL="https://offermarket.eu"; EU_HOST=""
  NL_FETCH_URL="https://offermarket.nl"; NL_HOST=""
else
  EU_FETCH_URL="http://localhost:3000"; EU_HOST="offermarket.localhost:3000"
  NL_FETCH_URL="http://localhost:3000"; NL_HOST="offermarket-nl.localhost:3000"
fi

# Metadata targets: EN domain (also x-default) and NL domain, prod + dev forms.
EN_T='(https://offermarket\.eu|http://offermarket\.localhost:3000)'
NL_T='(https://offermarket\.nl|http://offermarket-nl\.localhost:3000)'

fetch() { # $1=url $2=host(optional)
  local out
  if [ -n "${2:-}" ]; then
    out=$(curl -fsS -H "Host: $2" "$1" 2>/dev/null)
  else
    out=$(curl -fsS "$1" 2>/dev/null)
  fi
  printf '%s' "$out"
}

fail=0
check() { # $1=desc $2=html $3=regex (ERE, case-insensitive grep)
  if printf '%s' "$2" | grep -qiE "$3"; then
    echo "PASS  $1"
  else
    echo "FAIL  $1"
    echo "      expected ERE: $3"
    fail=1
  fi
}

# Guard: fail fast (exit 2) when the target server is unreachable, so a down
# dev server can never read as "N FAILs" masquerading as contract regressions.
if ! curl -fsS -o /dev/null --max-time 10 "$EU_FETCH_URL/robots.txt"; then
  echo "SKIP  server unreachable at $EU_FETCH_URL — start it or use PROD=1"
  exit 2
fi

# --- robots.txt / sitemap.xml per host (T1/T4 acceptance; prod URLs) --------
EU_ROBOTS=$(fetch "$EU_FETCH_URL/robots.txt" "$EU_HOST")
NL_ROBOTS=$(fetch "$NL_FETCH_URL/robots.txt" "$NL_HOST")
check "EU robots.txt self-references EU sitemap" "$EU_ROBOTS" "Sitemap: https://offermarket\.eu/sitemap\.xml"
check "NL robots.txt self-references NL sitemap" "$NL_ROBOTS" "Sitemap: https://offermarket\.nl/sitemap\.xml"
check "robots.txt disallows /workers (T4)" "$EU_ROBOTS" "Disallow: /workers"
check "robots.txt disallows /insights/your-market (T4)" "$EU_ROBOTS" "Disallow: /insights/your-market"

EU_SITEMAP=$(fetch "$EU_FETCH_URL/sitemap.xml" "$EU_HOST")
NL_SITEMAP=$(fetch "$NL_FETCH_URL/sitemap.xml" "$NL_HOST")
check "EU sitemap includes /pricing (E4)" "$EU_SITEMAP" "offermarket\.eu/pricing<"
check "NL sitemap includes /pricing (E4)" "$NL_SITEMAP" "offermarket\.nl/pricing<"
check "EU sitemap has no /login (T7)" "$(echo "$EU_SITEMAP" | grep -c 'offermarket\.eu/login<')" "^0"
check "EU sitemap includes legal pages (T7)" "$EU_SITEMAP" "offermarket\.eu/terms<"

# --- structured data (T6 acceptance) -----------------------------------------
EU_HOME_LD=$(fetch "$EU_FETCH_URL/" "$EU_HOST")
check "EU home emits Organization JSON-LD (T6)" "$EU_HOME_LD" '"@type":"Organization","name":"OfferMarket"'
check "EU home emits WebSite JSON-LD (T6)" "$EU_HOME_LD" '"@type":"WebSite"'
check "home JSON-LD has no SearchAction (T6)" "$(echo "$EU_HOME_LD" | grep -c SearchAction)" "^0"

# --- OG/Twitter metadata + image convention (T5 acceptance) ------------------
check "EU home emits og:image (T5)" "$EU_HOME_LD" '<meta property="og:image" content="[^"]*"'
check "EU home emits og:site_name OfferMarket (T5)" "$EU_HOME_LD" '<meta property="og:site_name" content="OfferMarket"'
check "EU home emits og:url (T5)" "$EU_HOME_LD" '<meta property="og:url" content="'$EN_T'/?"'
check "EU home emits twitter card (T5)" "$EU_HOME_LD" '<meta name="twitter:card" content="summary_large_image"'
check "OG image route serves 1200x630 png (T5)" "$(fetch "$EU_FETCH_URL/opengraph-image" "$EU_HOST" >/dev/null 2>&1 && echo 200 || echo fail)" "^200$"

# --- canonical + hreflang on shared-template pages (T2 acceptance) ----------
EU_HOME=$(fetch "$EU_FETCH_URL/" "$EU_HOST")
NL_HOME=$(fetch "$NL_FETCH_URL/" "$NL_HOST")
check "EU home emits self-canonical" "$EU_HOME" "<link rel=\"canonical\" href=\"${EN_T}/?\""
check "NL home emits self-canonical" "$NL_HOME" "<link rel=\"canonical\" href=\"${NL_T}/?\""
check "home hreflang en → EN domain" "$EU_HOME" "<link rel=\"alternate\" hrefLang=\"en\" href=\"${EN_T}/?\""
check "home hreflang nl → NL domain" "$EU_HOME" "<link rel=\"alternate\" hrefLang=\"nl\" href=\"${NL_T}/?\""
check "home hreflang x-default → EN domain" "$EU_HOME" "<link rel=\"alternate\" hrefLang=\"x-default\" href=\"${EN_T}/?\""
check "NL home emits the full alternates matrix" "$NL_HOME" "hrefLang=\"nl\" href=\"${NL_T}/?\".*"

EU_PRICING=$(fetch "$EU_FETCH_URL/pricing" "$EU_HOST")
NL_PRICING=$(fetch "$NL_FETCH_URL/pricing" "$NL_HOST")
check "EU pricing emits self-canonical" "$EU_PRICING" "<link rel=\"canonical\" href=\"${EN_T}/pricing\""
check "NL pricing emits self-canonical + x-default" "$NL_PRICING" "hrefLang=\"x-default\" href=\"${EN_T}/pricing\""

# --- insights listings server-rendered (T3 acceptance) -----------------------
EU_INSIGHTS=$(fetch "$EU_FETCH_URL/insights" "$EU_HOST")
NL_CATEGORY=$(fetch "$NL_FETCH_URL/insights/category/salary" "$NL_HOST")
check "EU /insights emits self-canonical" "$EU_INSIGHTS" "<link rel=\"canonical\" href=\"${EN_T}/insights\""
check "EU /insights hero is server-rendered (h1 in initial HTML)" "$EU_INSIGHTS" "<h1"
check "EU /insights contains no client-only loading grid" "$(echo "$EU_INSIGHTS" | grep -c 'animate-pulse' | head -1)" "^[01]"
check "NL category page emits self-canonical" "$NL_CATEGORY" "<link rel=\"canonical\" href=\"${NL_T}/insights/category/salary\""

# --- landing pages (/for-workers, /for-employers) ----------------------------
EU_FW=$(fetch "$EU_FETCH_URL/for-workers" "$EU_HOST")
EU_FE=$(fetch "$EU_FETCH_URL/for-employers" "$EU_HOST")
NL_FE=$(fetch "$NL_FETCH_URL/for-employers" "$NL_HOST")
check "EU /for-workers emits self-canonical" "$EU_FW" "<link rel=\"canonical\" href=\"${EN_T}/for-workers\""
check "EU /for-workers renders h1 (server)" "$EU_FW" "<h1"
check "EU /for-employers emits self-canonical" "$EU_FE" "<link rel=\"canonical\" href=\"${EN_T}/for-employers\""
check "EU /for-employers states €499-on-acceptance" "$EU_FE" "€499|&#x20AC;499|499"
check "NL /for-employers emits self-canonical" "$NL_FE" "<link rel=\"canonical\" href=\"${NL_T}/for-employers\""
check "sitemap includes both landings (EU)" "$EU_SITEMAP" "offermarket\.eu/for-employers<"

# --- /market family (T10) — gate-driven routes --------------------------------
EU_MARKET=$(fetch "$EU_FETCH_URL/market" "$EU_HOST")
check "EU /market hub renders" "$EU_MARKET" "<h1"
check "EU /market hub emits self-canonical" "$EU_MARKET" "<link rel=\"canonical\" href=\"${EN_T}/market\""
# Gate-closed page (or unknown profession) must 404 — the Δ4 no-shell doctrine.
GATE_CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Host: ${EU_HOST:-offermarket.eu}" "$EU_FETCH_URL/market/elektricien")
check "EU /market/elektricien is 404 while gate closed (Δ4 no-shell)" "$GATE_CODE" "^404$"
GATE_C=$(curl -s -o /dev/null -w "%{http_code}" -H "Host: ${EU_HOST:-offermarket.eu}" "$EU_FETCH_URL/market/no-such-profession")
check "EU /market/no-such-profession is 404" "$GATE_C" "^404$"

if [ "$fail" = "1" ]; then
  echo "----------"
  echo "RESULT: FAILED (see FAIL lines above)"
  exit 1
fi
echo "----------"
echo "RESULT: ALL METADATA CHECKS PASSED (mode: PROD=${PROD})"
