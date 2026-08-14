"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api-client";
import { formatMoneyStat } from "@/lib/formatters";
import { useAuth } from "@/lib/auth-context";
import type { CashflowSummaryDto } from "@fintrack/shared";
import { Card, CardContent } from "@/components/ui/card";
import { SegmentedButton, Skeleton } from "@/components/ui/material";
import { StatMetric } from "@/components/ui/stat-metric";

type PeriodKey = "today" | "month" | "total";

export function PeriodSummaryCard() {
  const t = useTranslations("dashboard");
  const { user } = useAuth();
  const locale = user?.locale ?? "en";
  const currency = user?.currency ?? "BDT";
  const [period, setPeriod] = useState<PeriodKey>("today");

  const { data, isLoading } = useQuery({
    queryKey: ["cashflow-summary"],
    queryFn: () => api<CashflowSummaryDto>("/reports/cashflow-summary"),
  });

  if (isLoading) {
    return <Skeleton className="h-44 rounded-2xl" />;
  }

  if (!data) return null;

  const summary = data[period];
  const remainingNum = parseFloat(summary.remaining);
  const remainingPositive = remainingNum >= 0;

  const income = formatMoneyStat(summary.income, currency, locale);
  const expenses = formatMoneyStat(summary.expenses, currency, locale);
  const remaining = formatMoneyStat(summary.remaining, currency, locale);

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <SegmentedButton
          options={[
            { value: "today" as const, label: t("periodToday") },
            { value: "month" as const, label: t("periodMonth") },
            { value: "total" as const, label: t("periodTotal") },
          ]}
          value={period}
          onChange={setPeriod}
        />

        <div className="grid grid-cols-3 gap-2">
          <StatMetric
            label={t("income")}
            value={income.display}
            title={income.full}
            tone="income"
          />
          <StatMetric
            label={t("expenses")}
            value={expenses.display}
            title={expenses.full}
            tone="expense"
          />
          <StatMetric
            label={t("remaining")}
            value={remaining.display}
            title={remaining.full}
            tone={remainingPositive ? "primary" : "expense"}
          />
        </div>
      </CardContent>
    </Card>
  );
}
