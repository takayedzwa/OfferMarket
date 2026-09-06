"use client";

/**
 * Minimal SVG bar chart for InsightArticle.charts entries, shaped as
 * `{ type: 'bar', title, unit?, labels: string[], values: number[] }`.
 * Deliberately dependency-free: Insights ships no charting library, and the
 * admin CMS stores charts as plain JSON. The chart itself makes no data-class
 * claim — it inherits the article's TransparencyBox.
 */
export interface InsightChartData {
  type?: string;
  title?: string;
  unit?: string;
  labels?: string[];
  values?: number[];
}

export default function InsightChart({ chart }: { chart: InsightChartData }) {
  const labels = (chart.labels ?? []).slice(0, 12);
  const values = (chart.values ?? []).slice(0, 12);
  if (labels.length === 0 || values.length === 0) return null;

  const max = Math.max(...values, 1);
  const width = 640;
  const height = 220;
  const padding = { top: 12, right: 8, bottom: 28, left: 8 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const slot = innerW / values.length;
  const barW = Math.min(slot * 0.6, 48);

  return (
    <figure className="my-6 rounded-xl border border-gray-200 bg-white p-4">
      {chart.title && <figcaption className="text-sm font-semibold text-gray-900 mb-3">{chart.title}</figcaption>}
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[480px]" role="img" aria-label={chart.title || "chart"}>
          {values.map((value, i) => {
            const h = (value / max) * innerH;
            const x = padding.left + i * slot + (slot - barW) / 2;
            const y = padding.top + innerH - h;
            return (
              <g key={i}>
                <rect x={x} y={y} width={barW} height={h} rx={4} fill="#2563eb" />
                <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize={11} fill="#374151">
                  {typeof value === "number" ? Math.round(value * 10) / 10 : value}
                </text>
                <text x={x + slot / 2} y={padding.top + innerH + 16} textAnchor="middle" fontSize={11} fill="#6b7280">
                  {labels[i]}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      {chart.unit && <p className="mt-2 text-xs text-gray-500">{chart.unit}</p>}
    </figure>
  );
}