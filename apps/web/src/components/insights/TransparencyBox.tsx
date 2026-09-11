"use client";

import { useTranslations } from "next-intl";
import { useFormat } from "@/hooks/useFormat";
import DataClassBadge from "./DataClassBadge";

/**
 * The data-transparency box rendered on every data-driven insight: sample
 * size, period, scope, profession, methodology and data class. The fields are
 * structured on the article — the sentence "Based on N verified offers …" is
 * composed from the structured fields, never hand-typed prose.
 */
export interface TransparencyBoxProps {
  dataClass: string;
  sampleSize?: number | null;
  dataPeriodStart?: string | null;
  dataPeriodEnd?: string | null;
  profession?: string | null;
  scope?: string | null;
  methodology?: string | null;
}

export default function TransparencyBox(props: TransparencyBoxProps) {
  const t = useTranslations("insights.article.transparency");
  const { date } = useFormat();
  const isEditorial = props.dataClass === "EDITORIAL";

  const rows: Array<{ label: string; value: string }> = [];
  if (!isEditorial && typeof props.sampleSize === "number" && props.sampleSize > 0) {
    rows.push({ label: t("sampleSize"), value: t("observations", { count: props.sampleSize }) });
  }
  if (props.dataPeriodStart && props.dataPeriodEnd) {
    rows.push({
      label: t("dataPeriod"),
      value: `${date(props.dataPeriodStart)} – ${date(props.dataPeriodEnd)}`,
    });
  }
  if (props.scope) rows.push({ label: t("scope"), value: props.scope });
  if (props.profession) rows.push({ label: t("profession"), value: props.profession });
  if (props.methodology) rows.push({ label: t("methodology"), value: props.methodology });

  return (
    <aside className="rounded-xl border border-gray-200 bg-gray-50 p-4 my-6" aria-label={t("title")}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-sm font-semibold text-gray-900">{t("title")}</h2>
        <DataClassBadge dataClass={props.dataClass} />
      </div>
      {isEditorial ? (
        <p className="mt-2 text-sm text-gray-600">{t("noSample")}</p>
      ) : (
        <dl className="mt-3 space-y-2">
          {rows.map((row) => (
            <div key={row.label} className="text-sm">
              <dt className="inline text-gray-500">{row.label}: </dt>
              <dd className="inline font-medium text-gray-900">{row.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </aside>
  );
}