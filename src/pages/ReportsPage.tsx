import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTransactions } from '../hooks/useTransactions';
import { useAccounts } from '../hooks/useAccounts';
import { useSubscriptions } from '../hooks/useSubscriptions';
import { useUIStore } from '../stores/useUIStore';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Download, Printer, TrendingUp, DollarSign, Calendar, Wallet, PiggyBank, Crown, ArrowRight } from 'lucide-react';
import { formatCurrency } from '../lib/utils';

export function ReportsPage() {
  const { t } = useTranslation();
  const { transactions, monthlyIncome, monthlyExpense, savingsRate } = useTransactions();
  const { totalNetWorth } = useAccounts();
  const { currency, locale } = useUIStore();
  const { isPro, currentPlan } = useSubscriptions();

  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const monthName = d.toLocaleString('en-US', { month: 'short' });
    return { monthKey, monthName };
  });

  const reportData = months.map(({ monthKey, monthName }) => {
    const monthTxs = transactions.filter(
      (t) => t.transaction_date && t.transaction_date.startsWith(monthKey)
    );
    const income = monthTxs
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const expense = monthTxs
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return {
      month: monthName,
      Income: income,
      Expense: expense,
      Savings: income - expense,
    };
  });

  return (
    <div className="space-y-6">
      {/* Formal Printable Document Header (Only visible on Print / PDF export) */}
      <div className="hidden print:flex items-center justify-between pb-4 border-b border-zinc-300 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-950 tracking-tight">FinTrack — Financial Statement</h1>
          <p className="text-xs text-zinc-600 mt-0.5">
            Generated on {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="text-right text-xs text-zinc-600">
          <p className="font-bold text-zinc-950">Primary Currency: {currency}</p>
          <p className="text-[11px] text-zinc-500">Confidential Financial Report</p>
        </div>
      </div>

      <div className="flex flex-row items-center justify-between gap-2 sm:gap-4 print:hidden">
        <div className="min-w-0 flex-1">
          <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-50 tracking-tight truncate">
            {t('reports.title')}
          </h2>
          <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
            {t('reports.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <Badge variant={isPro ? 'default' : 'secondary'} className="text-[10px] px-2 py-0.5 font-semibold">
            {isPro ? 'Pro Analytics' : 'Free: 1 Mo History'}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="text-xs h-8 px-2.5 sm:px-3"
          >
            <Printer className="h-3.5 w-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">Print Report</span>
          </Button>
        </div>
      </div>

      {/* Free Plan Historical Limitation Callout */}
      {!isPro && (
        <div className="p-3 sm:p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-800/80 bg-gradient-to-r from-indigo-50/70 via-purple-50/40 to-transparent dark:from-indigo-950/30 dark:via-purple-950/20 dark:to-transparent flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold shrink-0">
              <Crown className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                1-Month Historical View active (Free Starter)
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Upgrade to Pro to unlock 12-month multi-year financial statements, automated bank CSV importers, and tax summaries.
              </p>
            </div>
          </div>
          <Link
            to="/settings#plans"
            className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline shrink-0"
          >
            <span>Upgrade to Pro</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}

      {/* Analytics Summary - 3 Column Compact on Mobile & Desktop */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-4">
        <Card className="p-2 sm:p-4 border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20 hover:border-emerald-500/50 transition-colors">
          <div className="flex items-center justify-between pb-0.5 sm:pb-1">
            <span className="text-[9px] sm:text-xs font-medium text-zinc-500 dark:text-zinc-400 truncate">
              Net Worth
            </span>
            <Wallet className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-500 shrink-0 ml-1 hidden xs:block" />
          </div>
          <h3 className="text-[11px] sm:text-lg lg:text-xl font-bold text-zinc-900 dark:text-zinc-50 truncate mt-0.5 sm:mt-1">
            {formatCurrency(totalNetWorth, currency, locale)}
          </h3>
        </Card>

        <Card className="p-2 sm:p-4 border-teal-500/30 bg-teal-500/5 dark:bg-teal-950/20 hover:border-teal-500/50 transition-colors">
          <div className="flex items-center justify-between pb-0.5 sm:pb-1">
            <span className="text-[9px] sm:text-xs font-medium text-zinc-500 dark:text-zinc-400 truncate">
              Surplus
            </span>
            <PiggyBank className="h-3 w-3 sm:h-4 sm:w-4 text-teal-500 shrink-0 ml-1 hidden xs:block" />
          </div>
          <h3 className="text-[11px] sm:text-lg lg:text-xl font-bold text-emerald-600 dark:text-emerald-400 truncate mt-0.5 sm:mt-1">
            {formatCurrency(monthlyIncome - monthlyExpense, currency, locale)}
          </h3>
        </Card>

        <Card className="p-2 sm:p-4 border-indigo-500/30 bg-indigo-500/5 dark:bg-indigo-950/20 hover:border-indigo-500/50 transition-colors">
          <div className="flex items-center justify-between pb-0.5 sm:pb-1">
            <span className="text-[9px] sm:text-xs font-medium text-zinc-500 dark:text-zinc-400 truncate">
              Efficiency
            </span>
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-indigo-500 shrink-0 ml-1 hidden xs:block" />
          </div>
          <h3 className="text-[11px] sm:text-lg lg:text-xl font-bold text-indigo-600 dark:text-indigo-400 truncate mt-0.5 sm:mt-1">
            {savingsRate}%
          </h3>
        </Card>
      </div>

      {/* Monthly Bar Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">{t('reports.monthly_comparison')}</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={reportData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="month" stroke="#71717a" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#71717a"
                fontSize={11}
                tickLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#18181b',
                  borderColor: '#27272a',
                  borderRadius: '8px',
                  fontSize: '11px',
                  color: '#fafafa',
                }}
                formatter={(val: any) => [`${val} ৳`, '']}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Savings" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
