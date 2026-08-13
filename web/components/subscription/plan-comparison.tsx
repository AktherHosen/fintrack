"use client";

import { useTranslations } from "next-intl";
import { Check, Minus } from "lucide-react";
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

function formatLimit(value: number | null | undefined, unlimitedLabel: string): string {
  if (value === null || value === undefined) return unlimitedLabel;
  return String(value);
}

function BoolCell({ enabled }: { enabled: boolean }) {
  return enabled ? (
    <Check className="mx-auto h-4 w-4 text-primary" aria-hidden />
  ) : (
    <Minus className="mx-auto h-4 w-4 text-muted-foreground/50" aria-hidden />
  );
}

export function PlanComparison({
  freeFeatures,
  proFeatures,
  freeLabel,
  proLabel,
  className,
}: {
  freeFeatures: PlanFeatures;
  proFeatures: PlanFeatures;
  freeLabel: string;
  proLabel: string;
  className?: string;
}) {
  const t = useTranslations("premium");

  return (
    <div className={cn("overflow-hidden rounded-2xl border", className)}>
      <div className="grid grid-cols-[1fr_4rem_4rem] gap-px bg-border text-xs">
        <div className="bg-muted/40 px-3 py-2.5 font-semibold uppercase tracking-wide text-muted-foreground">
          {t("compareTitle")}
        </div>
        <div className="bg-muted/40 px-2 py-2.5 text-center font-semibold">{freeLabel}</div>
        <div className="bg-primary/10 px-2 py-2.5 text-center font-semibold text-primary">{proLabel}</div>

        {ROWS.map(({ key, labelKey, kind }) => {
          const freeVal = freeFeatures[key];
          const proVal = proFeatures[key];

          return (
            <div key={key} className="contents">
              <div className="bg-card px-3 py-2.5 text-sm text-foreground">{t(labelKey as "compareTitle")}</div>
              <div className="flex items-center justify-center bg-card px-2 py-2.5 text-center text-sm tabular-nums text-muted-foreground">
                {kind === "limit" ? (
                  formatLimit(freeVal as number | null | undefined, t("unlimited"))
                ) : (
                  <BoolCell enabled={Boolean(freeVal)} />
                )}
              </div>
              <div className="flex items-center justify-center bg-primary/[0.03] px-2 py-2.5 text-center text-sm font-medium tabular-nums">
                {kind === "limit" ? (
                  formatLimit(proVal as number | null | undefined, t("unlimited"))
                ) : (
                  <BoolCell enabled={Boolean(proVal)} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
