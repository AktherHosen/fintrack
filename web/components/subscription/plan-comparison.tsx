"use client";

import { useTranslations } from "next-intl";
import { Check, X } from "lucide-react";
import { FeatureKey, type PlanFeatures } from "@fintrack/shared";
import { cn } from "@/lib/utils";

type RowDef = {
  key: keyof PlanFeatures;
  labelKey: string;
  kind: "limit" | "boolean";
};

const ROWS: RowDef[] = [
  { key: FeatureKey.TRANSACTIONS_LIMIT, labelKey: "compareTransactions", kind: "limit" },
  { key: FeatureKey.ACCOUNTS_LIMIT, labelKey: "compareAccounts", kind: "limit" },
  { key: FeatureKey.CATEGORIES_LIMIT, labelKey: "compareCategories", kind: "limit" },
  { key: FeatureKey.BUDGETS_LIMIT, labelKey: "compareBudgets", kind: "limit" },
  { key: FeatureKey.LOANS_LIMIT, labelKey: "compareLoans", kind: "limit" },
  { key: FeatureKey.ADVANCED_REPORTS, labelKey: "compareReports", kind: "boolean" },
  { key: FeatureKey.RECURRING_TRANSACTIONS, labelKey: "compareRecurring", kind: "boolean" },
  { key: FeatureKey.CSV_EXPORT, labelKey: "compareCsv", kind: "boolean" },
  { key: FeatureKey.PDF_EXPORT, labelKey: "comparePdf", kind: "boolean" },
  { key: FeatureKey.MULTIPLE_CURRENCIES, labelKey: "compareCurrencies", kind: "boolean" },
];

function readFeature(features: PlanFeatures, key: keyof PlanFeatures) {
  return features[key];
}

function LimitCell({ value }: { value: number | null | undefined }) {
  if (value === null || value === undefined) {
    return <span className="font-semibold text-primary">∞</span>;
  }
  return <span className="tabular-nums">{value}</span>;
}

function BoolCell({ enabled }: { enabled: boolean }) {
  return enabled ? (
    <Check className="mx-auto h-3.5 w-3.5 text-primary" strokeWidth={2.5} aria-hidden />
  ) : (
    <X className="mx-auto h-3.5 w-3.5 text-muted-foreground/40" strokeWidth={2} aria-hidden />
  );
}

export function PlanComparison({
  freeFeatures,
  proFeatures,
  className,
}: {
  freeFeatures: PlanFeatures;
  proFeatures: PlanFeatures;
  className?: string;
}) {
  const t = useTranslations("premium");

  return (
    <div className={cn("overflow-hidden rounded-xl border text-[11px]", className)}>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-2.5 py-2 text-left font-medium text-muted-foreground">
              {t("compareTitle")}
            </th>
            <th className="w-11 px-1 py-2 text-center font-semibold">{t("compareFree")}</th>
            <th className="w-11 px-1 py-2 text-center font-semibold text-primary">{t("comparePro")}</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map(({ key, labelKey, kind }, i) => {
            const freeVal = readFeature(freeFeatures, key);
            const proVal = readFeature(proFeatures, key);

            return (
              <tr
                key={key}
                className={cn("border-b border-border/50 last:border-0", i % 2 === 1 && "bg-muted/20")}
              >
                <td className="px-2.5 py-1.5 text-left leading-snug text-foreground">
                  {t(labelKey as "compareTitle")}
                </td>
                <td className="px-1 py-1.5 text-center text-muted-foreground">
                  {kind === "limit" ? (
                    <LimitCell value={freeVal as number | null | undefined} />
                  ) : (
                    <BoolCell enabled={Boolean(freeVal)} />
                  )}
                </td>
                <td className="px-1 py-1.5 text-center">
                  {kind === "limit" ? (
                    <LimitCell value={proVal as number | null | undefined} />
                  ) : (
                    <BoolCell enabled={Boolean(proVal)} />
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
