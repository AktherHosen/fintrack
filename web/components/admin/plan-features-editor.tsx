"use client";

import { FeatureKey, type PlanFeatures } from "@fintrack/shared";
import { useTranslations } from "next-intl";
import { FormField, FormInput } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const LIMIT_KEYS = [
  FeatureKey.TRANSACTIONS_LIMIT,
  FeatureKey.ACCOUNTS_LIMIT,
  FeatureKey.CATEGORIES_LIMIT,
  FeatureKey.BUDGETS_LIMIT,
  FeatureKey.LOANS_LIMIT,
] as const;

const BOOL_KEYS = [
  FeatureKey.ADVANCED_REPORTS,
  FeatureKey.RECURRING_TRANSACTIONS,
  FeatureKey.CSV_EXPORT,
  FeatureKey.PDF_EXPORT,
  FeatureKey.MULTIPLE_CURRENCIES,
  FeatureKey.RECEIPT_STORAGE,
] as const;

const FEATURE_LABEL_KEYS: Record<string, string> = {
  [FeatureKey.TRANSACTIONS_LIMIT]: "transactionsLimit",
  [FeatureKey.ACCOUNTS_LIMIT]: "accountsLimit",
  [FeatureKey.CATEGORIES_LIMIT]: "categoriesLimit",
  [FeatureKey.BUDGETS_LIMIT]: "budgetsLimit",
  [FeatureKey.LOANS_LIMIT]: "loansLimit",
  [FeatureKey.ADVANCED_REPORTS]: "advancedReports",
  [FeatureKey.RECURRING_TRANSACTIONS]: "recurringTransactions",
  [FeatureKey.CSV_EXPORT]: "csvExport",
  [FeatureKey.PDF_EXPORT]: "pdfExport",
  [FeatureKey.MULTIPLE_CURRENCIES]: "multipleCurrencies",
  [FeatureKey.RECEIPT_STORAGE]: "receiptStorage",
};

export function limitToInput(value: number | null | undefined): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

export function inputToLimit(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "∞") return null;
  const parsed = parseInt(trimmed, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export function PlanFeaturesEditor({
  features,
  onChange,
  className,
}: {
  features: PlanFeatures;
  onChange: (features: PlanFeatures) => void;
  className?: string;
}) {
  const t = useTranslations("admin.plans.features");

  function setLimit(key: (typeof LIMIT_KEYS)[number], raw: string) {
    onChange({ ...features, [key]: inputToLimit(raw) });
  }

  function setBool(key: (typeof BOOL_KEYS)[number], enabled: boolean) {
    onChange({ ...features, [key]: enabled });
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t("limitsTitle")}
        </p>
        <p className="mb-3 text-xs text-muted-foreground">{t("limitsHint")}</p>
        <div className="grid grid-cols-2 gap-3">
          {LIMIT_KEYS.map((key) => (
            <FormField
              key={key}
              label={t(FEATURE_LABEL_KEYS[key] as "transactionsLimit")}
              htmlFor={`feature-${key}`}
            >
              <FormInput
                id={`feature-${key}`}
                value={limitToInput(features[key] as number | null | undefined)}
                onChange={(e) => setLimit(key, e.target.value)}
                inputMode="numeric"
                placeholder="∞"
              />
            </FormField>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t("featuresTitle")}
        </p>
        <div className="space-y-2">
          {BOOL_KEYS.map((key) => {
            const enabled = Boolean(features[key]);
            return (
              <button
                key={key}
                type="button"
                onClick={() => setBool(key, !enabled)}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm transition-colors",
                  enabled
                    ? "border-primary/30 bg-primary/5"
                    : "border-border/60 bg-muted/20",
                )}
              >
                <span>{t(FEATURE_LABEL_KEYS[key] as "advancedReports")}</span>
                <span
                  className={cn(
                    "rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase",
                    enabled ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                  )}
                >
                  {enabled ? t("on") : t("off")}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function emptyPlanFeatures(): PlanFeatures {
  return {};
}
