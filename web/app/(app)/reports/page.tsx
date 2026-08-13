"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { api, apiRaw } from "@/lib/api-client";
import { formatMoney, formatMoneyStat } from "@/lib/formatters";
import { monthRange } from "@/lib/date-ranges";
import { useAuth } from "@/lib/auth-context";
import { CHART_COLORS } from "@/lib/chart-colors";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { EmptyState, ListDivider, ListItem, PageHeader, ProgressBar, Skeleton } from "@/components/ui/material";
import { StatMetric } from "@/components/ui/stat-metric";
import { Download, Wallet } from "lucide-react";

interface ReportData {
  income: string;
  expenses: string;
  net: string;
  expenseByCategory: { categoryName: string; amount: string; percent: number }[];
  accountReport: { id: string; name: string; balance: string }[];
}

export default function ReportsPage() {
  const t = useTranslations("reports");
  const { user } = useAuth();
  const locale = user?.locale ?? "en";
  const currency = user?.currency ?? "BDT";
  const defaultRange = monthRange();
  const [range, setRange] = useState(defaultRange);
  const { startDate, endDate } = range;
  const [exportError, setExportError] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["reports", startDate, endDate],
    queryFn: () => api<ReportData>(`/reports/summary?startDate=${startDate}&endDate=${endDate}`),
  });

  const pieData =
    data?.expenseByCategory.map((c) => ({
      name: c.categoryName,
      value: parseFloat(c.amount),
      percent: c.percent,
    })) ?? [];

  async function download(path: string, filename: string) {
    setExportError("");
    try {
      const res = await apiRaw(`${path}?startDate=${startDate}&endDate=${endDate}`);
      if (!res.ok) throw new Error(t("exportFailed"));
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setExportError(e instanceof Error ? e.message : t("exportFailed"));
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-5 pb-4">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-24 rounded-2xl" />
        <div className="grid grid-cols-3 gap-2">
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (!data) return null;

  const income = formatMoneyStat(data.income, currency, locale);
  const spent = formatMoneyStat(data.expenses, currency, locale);
  const net = formatMoneyStat(data.net, currency, locale);
  const netNum = parseFloat(data.net);

  return (
    <div className="space-y-5 pb-4">
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        action={
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => download("/reports/export.csv", `transactions-${startDate}-${endDate}.csv`)}
            >
              <Download className="h-3.5 w-3.5" />
              {t("exportCsv")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => download("/reports/export.pdf", `transactions-${startDate}-${endDate}.pdf`)}
            >
              <Download className="h-3.5 w-3.5" />
              {t("exportPdf")}
            </Button>
          </div>
        }
      />

      <Card>
        <CardContent className="p-4">
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t("period")}</label>
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onChange={setRange}
          />
        </CardContent>
      </Card>

      {exportError ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {exportError}
        </p>
      ) : null}

      <div className="grid grid-cols-3 gap-2">
        <StatMetric label={t("income")} value={income.display} title={income.full} tone="income" />
        <StatMetric label={t("spent")} value={spent.display} title={spent.full} tone="expense" />
        <StatMetric
          label={t("net")}
          value={net.display}
          title={net.full}
          tone={netNum >= 0 ? "primary" : "expense"}
        />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">{t("byCategory")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 pt-0">
          {pieData.length === 0 ? (
            <EmptyState message={t("noExpenses")} className="py-10" />
          ) : (
            <>
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={80}
                      paddingAngle={2}
                      strokeWidth={0}
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v: number) => formatMoney(String(v), currency, locale)}
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid hsl(var(--border))",
                        background: "hsl(var(--card))",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-3">
                {data.expenseByCategory.map((c, i) => (
                  <div key={c.categoryName} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                        />
                        <span className="truncate font-medium">{c.categoryName}</span>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="font-semibold tabular-nums">
                          {formatMoney(c.amount, currency, locale)}
                        </span>
                        <span className="ml-1.5 text-xs tabular-nums text-muted-foreground">
                          {c.percent}%
                        </span>
                      </div>
                    </div>
                    <ProgressBar value={c.percent} />
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {data.accountReport.length > 0 ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">{t("accounts")}</CardTitle>
          </CardHeader>
          <CardContent className="py-0">
            {data.accountReport.map((a, i) => {
              const balance = formatMoneyStat(a.balance, currency, locale);
              return (
                <div key={a.id}>
                  {i > 0 && <ListDivider />}
                  <ListItem
                    title={a.name}
                    icon={Wallet}
                    iconClassName="border-primary/20 bg-primary/10 text-primary"
                    trailing={
                      <span className="text-sm font-semibold tabular-nums" title={balance.full}>
                        {balance.display}
                      </span>
                    }
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
