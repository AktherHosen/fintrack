import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRight,
  Plus,
  CreditCard,
  Building2,
  Smartphone,
  ChevronRight,
} from 'lucide-react';
import { useAccounts } from '../hooks/useAccounts';
import { useTransactions } from '../hooks/useTransactions';
import { useBudgets } from '../hooks/useBudgets';
import { useUIStore } from '../stores/useUIStore';
import { BannerCarousel } from '../components/banners/BannerCarousel';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
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
  const { currency, locale, setAddTransactionOpen, setAddTransferOpen } = useUIStore();

  // Chart data: Net worth monthly progression
  const trendData = [
    { month: 'Apr', netWorth: 110000, income: 95000, expense: 62000 },
    { month: 'May', netWorth: 128000, income: 105000, expense: 71000 },
    { month: 'Jun', netWorth: 142000, income: 115000, expense: 68000 },
    { month: 'Jul', netWorth: 154000, income: 120000, expense: 75000 },
    { month: 'Aug', netWorth: 161000, income: 125000, expense: 69000 },
    { month: 'Sep', netWorth: totalNetWorth || 164100, income: monthlyIncome || 125000, expense: monthlyExpense || 47450 },
  ];

  // Spending by category donut data
  const categoryExpenses: Record<string, { name: string; value: number; color: string }> = {};
  transactions
    .filter((t) => t.type === 'EXPENSE')
    .forEach((t) => {
      const catName = t.category?.name || 'Uncategorized';
      const catColor = t.category?.color || '#94a3b8';
      if (!categoryExpenses[catName]) {
        categoryExpenses[catName] = { name: catName, value: 0, color: catColor };
      }
      categoryExpenses[catName].value += Number(t.amount);
    });

  const pieData = Object.values(categoryExpenses);
  const DEFAULT_COLORS = ['#f97316', '#84cc16', '#6366f1', '#eab308', '#06b6d4', '#ec4899'];

  return (
    <div className="space-y-6">
      {/* 1. Promotional Banner Carousel */}
      <BannerCarousel position="DASHBOARD" />

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Worth */}
        <Card className="relative overflow-hidden border-emerald-500/30 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-emerald-950/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {t('dashboard.total_balance')}
            </span>
            <div className="h-9 w-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Wallet className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {formatCurrency(totalNetWorth, currency, locale)}
            </div>
            <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1 font-medium">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>+8.4% from last month</span>
            </p>
          </CardContent>
        </Card>

        {/* Monthly Income */}
        <Card className="relative overflow-hidden border-teal-500/30 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-teal-950/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {t('dashboard.monthly_income')}
            </span>
            <div className="h-9 w-9 rounded-xl bg-teal-500/15 text-teal-400 flex items-center justify-center border border-teal-500/30">
              <ArrowDownLeft className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {formatCurrency(monthlyIncome, currency, locale)}
            </div>
            <p className="text-xs text-slate-400 mt-2 flex items-center gap-1 font-medium">
              <span>Current billing period</span>
            </p>
          </CardContent>
        </Card>

        {/* Monthly Expense */}
        <Card className="relative overflow-hidden border-rose-500/30 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-rose-950/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {t('dashboard.monthly_expense')}
            </span>
            <div className="h-9 w-9 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center border border-rose-500/30">
              <ArrowUpRight className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-black text-rose-400 tracking-tight">
              {formatCurrency(monthlyExpense, currency, locale)}
            </div>
            <p className="text-xs text-rose-400/80 mt-2 flex items-center gap-1 font-medium">
              <TrendingDown className="h-3.5 w-3.5" />
              <span>38% of monthly income</span>
            </p>
          </CardContent>
        </Card>

        {/* Savings Rate */}
        <Card className="relative overflow-hidden border-indigo-500/30 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-indigo-950/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {t('dashboard.savings_rate')}
            </span>
            <div className="h-9 w-9 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <PiggyBank className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-black text-indigo-300 tracking-tight">
              {savingsRate}%
            </div>
            <p className="text-xs text-indigo-400 mt-2 flex items-center gap-1 font-medium">
              <span>Target: 40% target</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 3. Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Net Worth Progression Area Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-base sm:text-lg">Net Worth Growth & Cashflow</CardTitle>
              <p className="text-xs text-slate-400 mt-0.5">Historical trajectory over the last 6 months</p>
            </div>
            <Badge variant="default" className="hidden sm:inline-flex">+38.2% Total ROI</Badge>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px', color: '#f8fafc' }}
                  formatter={(value: any) => [`${value} ৳`, 'Amount']}
                />
                <Area type="monotone" dataKey="netWorth" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorNetWorth)" name="Net Worth" />
                <Area type="monotone" dataKey="expense" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorExpense)" name="Expenses" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Spending by Category Donut */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg">{t('dashboard.spending_by_category')}</CardTitle>
            <p className="text-xs text-slate-400">Current month expense distribution</p>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            {pieData.length > 0 ? (
              <>
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px', color: '#f8fafc' }}
                        formatter={(val: any) => [`${val} ৳`, 'Spent']}
                      />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full space-y-1.5 mt-2 max-h-28 overflow-y-auto pr-1">
                  {pieData.slice(0, 4).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-slate-300 truncate max-w-[120px]">{item.name}</span>
                      </div>
                      <span className="font-bold text-white">{formatCurrency(item.value, currency, locale)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="py-12 text-center text-xs text-slate-500">
                No expense data recorded yet for this month.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 4. Accounts & Recent Transactions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Accounts Snapshot */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Accounts & Wallets</CardTitle>
            <Link to="/accounts" className="text-xs text-emerald-400 hover:underline flex items-center gap-0.5">
              <span>Manage</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {accounts.map((acc) => (
              <div
                key={acc.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: `${acc.color}25`, color: acc.color || '#10b981' }}
                  >
                    {acc.type === 'BANK' && <Building2 className="h-5 w-5" />}
                    {acc.type === 'MOBILE_BANKING' && <Smartphone className="h-5 w-5" />}
                    {acc.type === 'CASH' && <Wallet className="h-5 w-5" />}
                    {acc.type === 'CREDIT_CARD' && <CreditCard className="h-5 w-5" />}
                    {acc.type === 'INVESTMENT' && <TrendingUp className="h-5 w-5" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white leading-tight">{acc.name}</h4>
                    <span className="text-[11px] text-slate-400">{acc.account_number || acc.type}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-bold ${Number(acc.balance) < 0 ? 'text-rose-400' : 'text-slate-100'}`}>
                    {formatCurrency(acc.balance, currency, locale)}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">{t('dashboard.recent_transactions')}</CardTitle>
            <Link to="/transactions" className="text-xs text-emerald-400 hover:underline flex items-center gap-0.5">
              <span>{t('dashboard.view_all')}</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {transactions.slice(0, 5).map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold ${
                      tx.type === 'INCOME'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {tx.type === 'INCOME' ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white leading-snug">{tx.description}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-slate-400">{formatDate(tx.transaction_date)}</span>
                      {tx.category && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                          {tx.category.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className={`text-right text-sm font-black ${tx.type === 'INCOME' ? 'text-emerald-400' : 'text-slate-100'}`}>
                  {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount, currency, locale)}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
