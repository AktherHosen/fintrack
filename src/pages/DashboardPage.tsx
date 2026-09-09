import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Wallet,
  PiggyBank,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronRight,
  CreditCard,
  Building2,
  Smartphone,
} from 'lucide-react';
import { useAccounts } from '../hooks/useAccounts';
import { useTransactions } from '../hooks/useTransactions';
import { useBudgets } from '../hooks/useBudgets';
import { useUIStore } from '../stores/useUIStore';
import { BannerCarousel } from '../components/banners/BannerCarousel';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { formatCurrency, formatDate } from '../lib/utils';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
} from 'recharts';

export function DashboardPage() {
  const { t } = useTranslation();
  const { accounts, totalNetWorth } = useAccounts();
  const { transactions, monthlyIncome, monthlyExpense, savingsRate } = useTransactions();
  const { budgets } = useBudgets();
  const { currency, locale } = useUIStore();

  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const monthName = d.toLocaleString('en-US', { month: 'short' });
    return { monthKey, monthName };
  });

  const trendData = months.map(({ monthKey, monthName }, index) => {
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
      netWorth:
        index === 5
          ? totalNetWorth
          : Math.max(0, totalNetWorth - (5 - index) * (monthlyIncome - monthlyExpense)),
      income,
      expense,
    };
  });

  const categoryExpenses: Record<string, { name: string; value: number; color: string }> = {};
  transactions
    .filter((t) => t.type === 'EXPENSE')
    .forEach((t) => {
      const catName = t.category?.name || 'Uncategorized';
      const catColor = t.category?.color || '#71717a';
      if (!categoryExpenses[catName]) {
        categoryExpenses[catName] = { name: catName, value: 0, color: catColor };
      }
      categoryExpenses[catName].value += Number(t.amount);
    });

  const pieData = Object.values(categoryExpenses);
  const SHADCN_PALETTE = ['#6366f1', '#3b82f6', '#f59e0b', '#ec4899', '#06b6d4', '#71717a'];

  return (
    <div className="space-y-3.5 sm:space-y-4.5">
      {/* 1. Promotional Banner Carousel */}
      <BannerCarousel position="DASHBOARD" />

      {/* 2. Top Metric KPI Cards - 4 in 1 row compact */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-4">
        {/* Net Worth */}
        <Card className="p-2 sm:p-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
          <div className="flex items-center justify-between pb-1 space-y-0">
            <span className="text-[9px] sm:text-xs font-medium text-zinc-500 dark:text-zinc-400 truncate">
              {t('dashboard.net_worth', 'Net Worth')}
            </span>
            <Wallet className="h-3 w-3 sm:h-4 sm:w-4 text-zinc-400 shrink-0 ml-1" />
          </div>
          <div>
            <div className="text-[11px] sm:text-lg lg:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 truncate">
              {formatCurrency(totalNetWorth, currency, locale)}
            </div>
            <div className="hidden md:flex items-center gap-1 mt-1">
              <span className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400 flex items-center">
                <TrendingUp className="h-3 w-3 mr-0.5" />
                +8.4%
              </span>
              <span className="text-[10px] text-zinc-500">{t('dashboard.vs_last_month', 'vs last mo')}</span>
            </div>
          </div>
        </Card>

        {/* Monthly Income */}
        <Card className="p-2 sm:p-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
          <div className="flex items-center justify-between pb-1 space-y-0">
            <span className="text-[9px] sm:text-xs font-medium text-zinc-500 dark:text-zinc-400 truncate">
              {t('dashboard.income', 'Income')}
            </span>
            <ArrowDownLeft className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-500 dark:text-emerald-400 shrink-0 ml-1" />
          </div>
          <div>
            <div className="text-[11px] sm:text-lg lg:text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 truncate">
              {formatCurrency(monthlyIncome, currency, locale)}
            </div>
            <p className="hidden md:block text-[10px] text-zinc-500 mt-1 truncate">{t('dashboard.current_period', 'Current period')}</p>
          </div>
        </Card>

        {/* Monthly Expense */}
        <Card className="p-2 sm:p-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
          <div className="flex items-center justify-between pb-1 space-y-0">
            <span className="text-[9px] sm:text-xs font-medium text-zinc-500 dark:text-zinc-400 truncate">
              {t('dashboard.expenses', 'Expenses')}
            </span>
            <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4 text-rose-500 dark:text-rose-400 shrink-0 ml-1" />
          </div>
          <div>
            <div className="text-[11px] sm:text-lg lg:text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400 truncate">
              {formatCurrency(monthlyExpense, currency, locale)}
            </div>
            <p className="hidden md:block text-[10px] text-zinc-500 mt-1 truncate">38% of income</p>
          </div>
        </Card>

        {/* Savings Rate */}
        <Card className="p-2 sm:p-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
          <div className="flex items-center justify-between pb-1 space-y-0">
            <span className="text-[9px] sm:text-xs font-medium text-zinc-500 dark:text-zinc-400 truncate">
              {t('dashboard.savings', 'Savings')}
            </span>
            <PiggyBank className="h-3 w-3 sm:h-4 sm:w-4 text-indigo-500 dark:text-indigo-400 shrink-0 ml-1" />
          </div>
          <div>
            <div className="text-[11px] sm:text-lg lg:text-2xl font-bold tracking-tight text-indigo-600 dark:text-indigo-300 truncate">
              {savingsRate}%
            </div>
            <p className="hidden md:block text-[10px] text-zinc-500 mt-1 truncate">{t('dashboard.target', 'Target')}: 40%</p>
          </div>
        </Card>
      </div>

      {/* 3. Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Net Worth Progression Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-4 sm:p-6">
            <div>
              <CardTitle className="text-xs sm:text-sm font-semibold">{t('dashboard.net_worth_cashflow', 'Net Worth & Cashflow')}</CardTitle>
              <CardDescription className="text-[10px] sm:text-xs">
                {t('dashboard.historical_trajectory', 'Historical performance trajectory')}
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-[10px] sm:text-xs font-medium border-zinc-700 text-zinc-500">
              +38.2% ROI
            </Badge>
          </CardHeader>
          <CardContent className="h-56 sm:h-72 pt-2 sm:pt-4 px-2 sm:px-6">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#71717a" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#71717a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#52525b" fontSize={10} tickLine={false} />
                <YAxis
                  stroke="#52525b"
                  fontSize={10}
                  tickLine={false}
                  tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    borderColor: '#27272a',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#fafafa',
                  }}
                  formatter={(value: any) => [`${value} ৳`, 'Amount']}
                />
                <Area
                  type="monotone"
                  dataKey="netWorth"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorNetWorth)"
                  name="Net Worth"
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  stroke="#71717a"
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                  fillOpacity={1}
                  fill="url(#colorExpense)"
                  name="Expense"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>        {/* Spending Breakdown Donut */}
        <Card>
          <CardHeader className="pb-2 p-4 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-semibold">{t('dashboard.spending_breakdown', 'Spending Breakdown')}</CardTitle>
            <CardDescription className="text-[10px] sm:text-xs">
              {t('dashboard.current_month_distribution', 'Current month distribution')}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center pt-1 px-3 sm:px-6 pb-4 sm:pb-6">
            {pieData.length > 0 ? (
              <>
                <div className="h-36 sm:h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={38}
                        outerRadius={60}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={SHADCN_PALETTE[index % SHADCN_PALETTE.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#18181b',
                          borderColor: '#27272a',
                          borderRadius: '8px',
                          fontSize: '11px',
                          color: '#fafafa',
                        }}
                        formatter={(val: any) => [`${val} ৳`, 'Spent']}
                      />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full space-y-1 mt-1 max-h-24 overflow-y-auto pr-1">
                  {pieData.slice(0, 4).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[11px] sm:text-xs">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: SHADCN_PALETTE[idx % SHADCN_PALETTE.length] }}
                        />
                        <span className="text-zinc-700 dark:text-zinc-300 truncate max-w-[100px] sm:max-w-[120px]">
                          {item.name}
                        </span>
                      </div>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {formatCurrency(item.value, currency, locale)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="py-8 text-center text-xs text-zinc-500">
                {t('dashboard.no_expense_month', 'No expense recorded this month')}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 4. Accounts & Recent Transactions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Accounts Card */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2.5 p-3.5 sm:p-5">
            <div>
              <CardTitle className="text-xs sm:text-sm font-semibold">{t('accounts.title', 'Accounts & Wallets')}</CardTitle>
              <CardDescription className="text-[10px] sm:text-xs">{t('dashboard.active_balances', 'Active balances')}</CardDescription>
            </div>
            <Link
              to="/accounts"
              className="text-[11px] sm:text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:underline flex items-center gap-0.5"
            >
              <span>{t('common.view_all', 'View all')}</span>
              <ChevronRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-1.5 sm:space-y-2 p-3.5 sm:p-5 pt-0">
            {accounts.map((acc) => (
              <div
                key={acc.id}
                className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                  <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-md bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center font-bold text-xs shrink-0">
                    {acc.type === 'BANK' && <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                    {acc.type === 'MOBILE_BANKING' && <Smartphone className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                    {acc.type === 'CASH' && <Wallet className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                    {acc.type === 'CREDIT_CARD' && <CreditCard className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                    {acc.type === 'INVESTMENT' && <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                  </div>
                  <div className="min-w-0 flex-1 pr-2">
                    <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 leading-tight truncate">
                      {acc.name}
                    </h4>
                    <span className="text-[10px] text-zinc-500 font-mono block truncate">
                      {acc.account_number || acc.type}
                    </span>
                  </div>
                </div>
                <div
                  className={`text-xs font-bold shrink-0 ${Number(acc.balance) < 0 ? 'text-rose-500 dark:text-rose-400' : 'text-zinc-900 dark:text-zinc-100'}`}
                >
                  {formatCurrency(acc.balance, currency, locale)}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Transactions Card - Compact mobile list, structured desktop table */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2.5 p-3.5 sm:p-5">
            <div>
              <CardTitle className="text-xs sm:text-sm font-semibold">{t('dashboard.recent_transactions', 'Recent Transactions')}</CardTitle>
              <CardDescription className="text-[10px] sm:text-xs">{t('dashboard.latest_activity', 'Latest activity across accounts')}</CardDescription>
            </div>
            <Link
              to="/transactions"
              className="text-[11px] sm:text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:underline flex items-center gap-0.5"
            >
              <span>{t('dashboard.view_ledger', 'View ledger')}</span>
              <ChevronRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {/* Mobile View: Compact list (no horizontal scroll) */}
            <div className="sm:hidden divide-y divide-zinc-100 dark:divide-zinc-800/60 px-3.5 pb-2">
              {transactions.slice(0, 5).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-2.5 gap-2">
                  <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                    <div
                      className={`h-7 w-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                        tx.type === 'INCOME'
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      {tx.type === 'INCOME' ? (
                        <ArrowDownLeft className="h-3.5 w-3.5" />
                      ) : (
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                        {tx.description}
                      </p>
                      <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 mt-0.5">
                        <span className="truncate">{tx.category?.name || 'General'}</span>
                        <span>•</span>
                        <span className="shrink-0">{formatDate(tx.transaction_date)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p
                      className={`text-xs font-bold ${
                        tx.type === 'INCOME'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-zinc-900 dark:text-zinc-100'
                      }`}
                    >
                      {tx.type === 'INCOME' ? '+' : '-'}
                      {formatCurrency(tx.amount, currency, locale)}
                    </p>
                    <span className="text-[10px] text-zinc-500 block truncate max-w-[90px]">
                      {tx.account?.name || '—'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View: Full Table */}
            <div className="hidden sm:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">{t('transactions.description', 'Description')}</TableHead>
                    <TableHead>{t('transactions.category', 'Category')}</TableHead>
                    <TableHead>{t('transactions.account', 'Account')}</TableHead>
                    <TableHead>{t('transactions.date', 'Date')}</TableHead>
                    <TableHead className="text-right">{t('transactions.amount', 'Amount')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.slice(0, 5).map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="font-medium text-xs text-zinc-900 dark:text-zinc-200">
                        <div className="flex items-center space-x-2">
                          <div
                            className={`h-6 w-6 rounded-md flex items-center justify-center font-bold text-xs ${
                              tx.type === 'INCOME'
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                            }`}
                          >
                            {tx.type === 'INCOME' ? (
                              <ArrowDownLeft className="h-3 w-3" />
                            ) : (
                              <ArrowUpRight className="h-3 w-3" />
                            )}
                          </div>
                          <span className="truncate max-w-[130px]">{tx.description}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {tx.category ? (
                          <Badge
                            variant="outline"
                            className="text-[10px] py-0 h-4 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-400"
                          >
                            {tx.category.name}
                          </Badge>
                        ) : (
                          <span className="text-zinc-400 dark:text-zinc-600 text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-zinc-600 dark:text-zinc-400">
                        {tx.account?.name || '—'}
                      </TableCell>
                      <TableCell className="text-xs text-zinc-500">
                        {formatDate(tx.transaction_date)}
                      </TableCell>
                      <TableCell
                        className={`text-right font-semibold text-xs ${tx.type === 'INCOME' ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-900 dark:text-zinc-100'}`}
                      >
                        {tx.type === 'INCOME' ? '+' : '-'}
                        {formatCurrency(tx.amount, currency, locale)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
