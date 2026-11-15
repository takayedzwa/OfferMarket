import { ImageResponse } from "next/og";

// Site-wide default Open Graph / Twitter image (T5). The file convention
// automatically injects og:image + twitter:image (with width/height/type) on
// every route; page-level metadata adds og:title/description/og:url/site_name.
// Code-generated (next/og) rather than a binary asset so the tagline stays
// copy-reviewed in-repo; 1200×630 is the canonical OG ratio.
// The `image` gap in article JSON-LD is closed by pointing at this same route.
export const alt = "OfferMarket — omgekeerde talentmarktplaats voor elektriciens / reverse talent marketplace for electricians";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 60%, #2563eb 100%)",
          padding: "72px 84px",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            style={{
              width: 84,
              height: 84,
              borderRadius: 20,
              background: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ color: "#1e3a8a", fontSize: 56, fontWeight: 700 }}>O</div>
          </div>
          <div style={{ fontSize: 72, fontWeight: 700, letterSpacing: -1 }}>OfferMarket</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 52, fontWeight: 600 }}>
            Omgekeerde talentmarktplaats
          </div>
          <div style={{ fontSize: 40, color: "#bfdbfe", display: "flex" }}>
            Reverse talent marketplace for electricians
          </div>
          <div style={{ fontSize: 34, color: "#93c5fd", display: "flex", marginTop: 12 }}>
            offermarket.eu · offermarket.nl
          </div>
        </div>
      </div>
    ),
    size,
  );
}
