"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { TrendingUp, Wallet } from "lucide-react";
import { api } from "@/lib/api-client";
import { formatMoney } from "@/lib/formatters";
import { useAuth } from "@/lib/auth-context";
import { INCOME_COLOR, EXPENSE_COLOR } from "@/lib/chart-colors";
import type { DashboardDto } from "@fintrack/shared";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ListDivider, ListItem, Skeleton, StatChip, ProgressBar } from "@/components/ui/material";
import { AdBannerCarousel } from "@/components/ads/ad-banner-carousel";
import { HomeTransactionFeed } from "@/components/dashboard/home-transaction-feed";

interface LoanSummary {
  borrowedRemaining: string;
  lentRemaining: string;
  netDebt: string;
  activeCount: number;
}

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");
  const { user } = useAuth();
  const locale = user?.locale ?? "en";
  const currency = user?.currency ?? "BDT";

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api<DashboardDto>("/reports/dashboard"),
  });

  const { data: loanSummary } = useQuery({
    queryKey: ["loan-summary"],
    queryFn: () => api<LoanSummary>("/loans/summary"),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-36" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-52" />
      </div>
    );
  }

  if (!data) return null;

  const changePositive = data.changePercent >= 0;

  return (
    <div className="space-y-6">
      <AdBannerCarousel />
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>{t("totalBalance")}</CardDescription>
          <CardTitle className="text-3xl font-bold tracking-tight">
            {formatMoney(data.totalBalance, currency, locale)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Badge variant={changePositive ? "success" : "warning"}>
            <TrendingUp className="mr-1 h-3 w-3" />
            {changePositive ? "+" : ""}
            {data.changePercent}% {t("thisMonth")}
          </Badge>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <StatChip label={t("income")} value={formatMoney(data.income, currency, locale)} tone="income" />
        <StatChip label={t("expenses")} value={formatMoney(data.expenses, currency, locale)} tone="expense" />
      </div>

      {loanSummary && loanSummary.activeCount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("debtSummary")}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-2">
            <StatChip
              label={t("youOwe")}
              value={formatMoney(loanSummary.borrowedRemaining, currency, locale)}
              tone="expense"
              className="p-3"
            />
            <StatChip
              label={t("owedToYou")}
              value={formatMoney(loanSummary.lentRemaining, currency, locale)}
              tone="income"
              className="p-3"
            />
            <StatChip
              label={t("netDebt")}
              value={formatMoney(loanSummary.netDebt, currency, locale)}
              tone="neutral"
              className="p-3"
            />
          </CardContent>
        </Card>
      )}

      {data.accountBalances.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("accounts")}</CardTitle>
          </CardHeader>
          <CardContent className="py-1">
            {data.accountBalances.map((a, i) => (
              <div key={a.id}>
                {i > 0 && <ListDivider />}
                <ListItem
                  title={a.name}
                  icon={Wallet}
                  iconClassName="border-primary/20 bg-primary/10 text-primary"
                  trailing={
                    <span className="text-sm font-semibold">
                      {formatMoney(a.balance, currency, locale)}
                    </span>
                  }
                />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {data.budgetProgress.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("budgetProgress")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.budgetProgress.map((b) => (
              <div key={b.id} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{b.name}</span>
                  <span className="text-muted-foreground">{b.percent}%</span>
                </div>
                <ProgressBar value={b.percent} overBudget={b.status === "OVER_BUDGET"} />
                <p className="text-xs text-muted-foreground">
                  {formatMoney(b.spent, currency, locale)} {tc("of")}{" "}
                  {formatMoney(b.amount, currency, locale)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("cashFlow")}</CardTitle>
          <CardDescription>{t("cashFlowDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data.cashFlowSeries}>
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={INCOME_COLOR} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={INCOME_COLOR} stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={EXPENSE_COLOR} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={EXPENSE_COLOR} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tickFormatter={(d) => d.slice(5)}
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "hsl(240 3.8% 46.1%)" }}
              />
              <YAxis hide />
              <Tooltip
                formatter={(v: number) => formatMoney(String(v), currency, locale)}
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid hsl(240 5.9% 90%)",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                }}
              />
              <Area type="monotone" dataKey="income" stroke={INCOME_COLOR} fill="url(#incomeGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="expense" stroke={EXPENSE_COLOR} fill="url(#expenseGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <HomeTransactionFeed />
    </div>
  );
}
