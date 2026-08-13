"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { api } from "@/lib/api-client";
import { formatMoney } from "@/lib/formatters";
import { useAuth } from "@/lib/auth-context";
import { INCOME_COLOR, EXPENSE_COLOR } from "@/lib/chart-colors";
import type { DashboardDto } from "@fintrack/shared";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ListDivider, ListItem, Skeleton, StatChip, ProgressBar } from "@/components/ui/material";
import { AdBannerCarousel } from "@/components/ads/ad-banner-carousel";
import { HomeTransactionFeed } from "@/components/dashboard/home-transaction-feed";
import { PeriodSummaryCard } from "@/components/dashboard/period-summary-card";
import { cn } from "@/lib/utils";

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
      <div className="space-y-5">
        <Skeleton className="h-40 rounded-2xl" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
        <Skeleton className="h-52 rounded-2xl" />
      </div>
    );
  }

  if (!data) return null;

  const changePositive = data.changePercent >= 0;
  const TrendIcon = changePositive ? TrendingUp : TrendingDown;

  return (
    <div className="space-y-5">
      <AdBannerCarousel />

      <Card className="hero-gradient overflow-hidden border-0 text-white shadow-elevated">
        <CardHeader className="pb-1">
          <CardDescription className="text-xs font-medium uppercase tracking-widest text-white/60">
            {t("totalBalance")}
          </CardDescription>
          <CardTitle className="text-4xl font-bold tracking-tight tabular-nums lg:text-[2.5rem]">
            {formatMoney(data.totalBalance, currency, locale)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-sm",
              changePositive ? "bg-white/15 text-white" : "bg-black/20 text-white/90",
            )}
          >
            <TrendIcon className="h-3.5 w-3.5" />
            {changePositive ? "+" : ""}
            {data.changePercent}% {t("thisMonth")}
          </div>
        </CardContent>
      </Card>

      <PeriodSummaryCard />

      <HomeTransactionFeed />

      {loanSummary && loanSummary.activeCount > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">{t("debtSummary")}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-2 pt-0">
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
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">{t("accounts")}</CardTitle>
          </CardHeader>
          <CardContent className="py-0">
            {data.accountBalances.map((a, i) => (
              <div key={a.id} className="px-1">
                {i > 0 && <ListDivider />}
                <ListItem
                  title={a.name}
                  icon={Wallet}
                  iconClassName="border-primary/15 bg-primary/10 text-primary"
                  trailing={
                    <span className="text-sm font-semibold tabular-nums">
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
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">{t("budgetProgress")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-0">
            {data.budgetProgress.map((b) => (
              <div key={b.id} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{b.name}</span>
                  <span className="tabular-nums text-muted-foreground">{b.percent}%</span>
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
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">{t("cashFlow")}</CardTitle>
          <CardDescription className="text-xs">{t("cashFlowDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data.cashFlowSeries} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={INCOME_COLOR} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={INCOME_COLOR} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={EXPENSE_COLOR} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={EXPENSE_COLOR} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tickFormatter={(d) => d.slice(5)}
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))" }}
                dy={8}
              />
              <YAxis hide />
              <Tooltip
                formatter={(v: number) => formatMoney(String(v), currency, locale)}
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid hsl(var(--border))",
                  background: "hsl(var(--card))",
                  boxShadow: "0 4px 12px rgb(0 0 0 / 0.08)",
                  fontSize: "12px",
                }}
                labelStyle={{ color: "hsl(var(--muted-foreground))", marginBottom: 4 }}
              />
              <Area
                type="monotone"
                dataKey="income"
                stroke={INCOME_COLOR}
                fill="url(#incomeGrad)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
              <Area
                type="monotone"
                dataKey="expense"
                stroke={EXPENSE_COLOR}
                fill="url(#expenseGrad)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
