"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api-client";
import { formatMoney } from "@/lib/formatters";
import { useAuth } from "@/lib/auth-context";
import type { CashflowSummaryDto } from "@fintrack/shared";
import { Card, CardContent } from "@/components/ui/card";
import { SegmentedButton, Skeleton } from "@/components/ui/material";
import { cn } from "@/lib/utils";

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

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-income/20 bg-income-muted/50 p-3">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {t("income")}
            </p>
            <p className="mt-1 text-sm font-semibold tabular-nums text-income">
              {formatMoney(summary.income, currency, locale)}
            </p>
          </div>

          <div className="rounded-xl border border-expense/20 bg-expense-muted/50 p-3">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {t("expenses")}
            </p>
            <p className="mt-1 text-sm font-semibold tabular-nums text-expense">
              {formatMoney(summary.expenses, currency, locale)}
            </p>
          </div>

          <div
            className={cn(
              "rounded-xl border p-3",
              remainingPositive
                ? "border-primary/20 bg-primary/5"
                : "border-expense/20 bg-expense-muted/40",
            )}
          >
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {t("remaining")}
            </p>
            <p
              className={cn(
                "mt-1 text-sm font-semibold tabular-nums",
                remainingPositive ? "text-primary" : "text-expense",
              )}
            >
              {formatMoney(summary.remaining, currency, locale)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
