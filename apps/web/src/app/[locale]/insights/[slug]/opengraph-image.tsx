import { ImageResponse } from "next/og";
import type { InsightArticleDetail } from "@/lib/api";
import { insightsApi } from "@/lib/api";

// Clean social preview: title + category + the Offermarket brand mark, rendered
// at request time from the article's own fields (no uploaded image needed).
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Offermarket Insight";

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;
  let title = "Offermarket Insights";
  let category = "";
  try {
    const res = await insightsApi.getArticle(slug);
    const article = res.data as InsightArticleDetail;
    title = article.title;
    category = article.category;
  } catch {
    // Fall back to the generic brand image.
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          backgroundColor: "#f9fafb",
          border: "1px solid #e5e7eb",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              backgroundColor: "#2563eb",
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              fontSize: 32,
              fontWeight: 700,
            }}
          >
            O
          </div>
          <div style={{ display: "flex", color: "#111827", fontSize: 28, fontWeight: 700 }}>
            Offermarket Insights
          </div>
          {category && (
            <div
              style={{
                display: "flex",
                marginLeft: "auto",
                color: "#2563eb",
                fontSize: 22,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: 2,
              }}
            >
              {category}
            </div>
          )}
        </div>
        <div
          style={{
            display: "flex",
            color: "#111827",
            fontSize: 58,
            fontWeight: 700,
            lineHeight: 1.2,
            maxWidth: 1050,
          }}
        >
          {title}
        </div>
      </div>
    ),
    { ...size },
  );
}