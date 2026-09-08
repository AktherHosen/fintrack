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
  ChevronRight,
  CreditCard,
  Building2,
  Smartphone,
  Plus,
} from 'lucide-react';
import { useAccounts } from '../hooks/useAccounts';
import { useTransactions } from '../hooks/useTransactions';
import { useBudgets } from '../hooks/useBudgets';
import { useUIStore } from '../stores/useUIStore';
import { BannerCarousel } from '../components/banners/BannerCarousel';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
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
  const { currency, locale, setAddTransactionOpen } = useUIStore();

  const trendData = [
    { month: 'Apr', netWorth: 110000, income: 95000, expense: 62000 },
    { month: 'May', netWorth: 128000, income: 105000, expense: 71000 },
    { month: 'Jun', netWorth: 142000, income: 115000, expense: 68000 },
    { month: 'Jul', netWorth: 154000, income: 120000, expense: 75000 },
    { month: 'Aug', netWorth: 161000, income: 125000, expense: 69000 },
    { month: 'Sep', netWorth: totalNetWorth || 164100, income: monthlyIncome || 125000, expense: monthlyExpense || 47450 },
  ];

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
    <div className="space-y-6">
      {/* 1. Promotional Banner Carousel */}
      <BannerCarousel position="DASHBOARD" />

      {/* 2. Top Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Worth */}
        <Card className="hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Total Net Worth</span>
            <Wallet className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {formatCurrency(totalNetWorth, currency, locale)}
            </div>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 flex items-center">
                <TrendingUp className="h-3 w-3 mr-0.5" />
                +8.4%
              </span>
              <span className="text-[11px] text-zinc-500">vs last month</span>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Income */}
        <Card className="hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Monthly Income</span>
            <ArrowDownLeft className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {formatCurrency(monthlyIncome, currency, locale)}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">Current billing period</p>
          </CardContent>
        </Card>

        {/* Monthly Expense */}
        <Card className="hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Monthly Expenses</span>
            <ArrowUpRight className="h-4 w-4 text-rose-500 dark:text-rose-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
              {formatCurrency(monthlyExpense, currency, locale)}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">38% of monthly income</p>
          </CardContent>
        </Card>

        {/* Savings Rate */}
        <Card className="hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Savings Rate</span>
            <PiggyBank className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-indigo-600 dark:text-indigo-300">
              {savingsRate}%
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">Target: 40%</p>
          </CardContent>
        </Card>
      </div>

      {/* 3. Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Net Worth Progression Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm font-semibold">Net Worth & Cashflow</CardTitle>
              <CardDescription className="text-xs">Historical performance trajectory</CardDescription>
            </div>
            <Badge variant="outline" className="text-xs font-medium border-zinc-700 text-zinc-300">
              +38.2% ROI
            </Badge>
          </CardHeader>
          <CardContent className="h-72 pt-4">
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
                <XAxis dataKey="month" stroke="#52525b" fontSize={11} tickLine={false} />
                <YAxis stroke="#52525b" fontSize={11} tickLine={false} tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', fontSize: '12px', color: '#fafafa' }}
                  formatter={(value: any) => [`${value} ৳`, 'Amount']}
                />
                <Area type="monotone" dataKey="netWorth" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorNetWorth)" name="Net Worth" />
                <Area type="monotone" dataKey="expense" stroke="#71717a" strokeWidth={1.5} strokeDasharray="3 3" fillOpacity={1} fill="url(#colorExpense)" name="Expense" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Spending Breakdown Donut */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Spending Breakdown</CardTitle>
            <CardDescription className="text-xs">Current month category distribution</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center pt-2">
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
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={SHADCN_PALETTE[index % SHADCN_PALETTE.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', fontSize: '12px', color: '#fafafa' }}
                        formatter={(val: any) => [`${val} ৳`, 'Spent']}
                      />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full space-y-1.5 mt-2 max-h-28 overflow-y-auto pr-1">
                  {pieData.slice(0, 4).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: SHADCN_PALETTE[idx % SHADCN_PALETTE.length] }}
                        />
                        <span className="text-zinc-700 dark:text-zinc-300 truncate max-w-[120px]">{item.name}</span>
                      </div>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">{formatCurrency(item.value, currency, locale)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="py-12 text-center text-xs text-zinc-500">
                No expense recorded this month
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 4. Accounts & Recent Transactions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Accounts Card */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm font-semibold">Accounts & Wallets</CardTitle>
              <CardDescription className="text-xs">Active balances</CardDescription>
            </div>
            <Link to="/accounts" className="text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:underline flex items-center gap-0.5">
              <span>View all</span>
              <ChevronRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {accounts.map((acc) => (
              <div
                key={acc.id}
                className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-md bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center font-bold text-xs">
                    {acc.type === 'BANK' && <Building2 className="h-4 w-4" />}
                    {acc.type === 'MOBILE_BANKING' && <Smartphone className="h-4 w-4" />}
                    {acc.type === 'CASH' && <Wallet className="h-4 w-4" />}
                    {acc.type === 'CREDIT_CARD' && <CreditCard className="h-4 w-4" />}
                    {acc.type === 'INVESTMENT' && <TrendingUp className="h-4 w-4" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">{acc.name}</h4>
                    <span className="text-[10px] text-zinc-500 font-mono">{acc.account_number || acc.type}</span>
                  </div>
                </div>
                <div className={`text-xs font-semibold ${Number(acc.balance) < 0 ? 'text-rose-500 dark:text-rose-400' : 'text-zinc-900 dark:text-zinc-100'}`}>
                  {formatCurrency(acc.balance, currency, locale)}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Transactions Table */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm font-semibold">Recent Transactions</CardTitle>
              <CardDescription className="text-xs">Latest activity across accounts</CardDescription>
            </div>
            <Link to="/transactions" className="text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:underline flex items-center gap-0.5">
              <span>View ledger</span>
              <ChevronRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.slice(0, 5).map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-medium text-xs text-zinc-900 dark:text-zinc-200">
                      <div className="flex items-center space-x-2">
                        <div
                          className={`h-6 w-6 rounded-md flex items-center justify-center font-bold text-xs ${
                            tx.type === 'INCOME' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                          }`}
                        >
                          {tx.type === 'INCOME' ? <ArrowDownLeft className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                        </div>
                        <span className="truncate max-w-[130px]">{tx.description}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {tx.category ? (
                        <Badge variant="outline" className="text-[10px] py-0 h-4 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-400">
                          {tx.category.name}
                        </Badge>
                      ) : (
                        <span className="text-zinc-400 dark:text-zinc-600 text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-zinc-600 dark:text-zinc-400">{tx.account?.name || '—'}</TableCell>
                    <TableCell className="text-xs text-zinc-500">{formatDate(tx.transaction_date)}</TableCell>
                    <TableCell className={`text-right font-semibold text-xs ${tx.type === 'INCOME' ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-900 dark:text-zinc-100'}`}>
                      {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount, currency, locale)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
