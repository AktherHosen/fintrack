import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  Plus,
  CreditCard,
  Building2,
  Smartphone,
  ChevronRight,
  Eye,
  EyeOff,
  Tags,
  HandCoins,
  Receipt,
  Sparkles,
} from 'lucide-react';
import { useAccounts } from '../hooks/useAccounts';
import { useTransactions } from '../hooks/useTransactions';
import { useBudgets } from '../hooks/useBudgets';
import { useUIStore } from '../stores/useUIStore';
import { BannerCarousel } from '../components/banners/BannerCarousel';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { formatCurrency, formatDate } from '../lib/utils';

export function DashboardPage() {
  const { t } = useTranslation();
  const { accounts, totalNetWorth } = useAccounts();
  const { transactions, monthlyIncome, monthlyExpense, savingsRate } = useTransactions();
  const { budgets } = useBudgets();
  const { currency, locale, setAddTransactionOpen, setAddTransferOpen, setAddAccountOpen } = useUIStore();
  const [hideBalance, setHideBalance] = useState(false);

  return (
    <div className="space-y-4">
      {/* 1. Main Flutter Balance Card */}
      <div className="flat-card p-5 bg-[#121826] border border-slate-800 relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-400">
            {t('dashboard.total_balance')}
          </span>
          <button
            onClick={() => setHideBalance(!hideBalance)}
            className="p-1 rounded-lg text-slate-400 hover:text-white"
            title={hideBalance ? "Show balance" : "Hide balance"}
          >
            {hideBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {/* Large Crisp Amount */}
        <div className="text-3xl font-extrabold text-white tracking-tight mb-4">
          {hideBalance ? '••••••••' : formatCurrency(totalNetWorth, currency, locale)}
        </div>

        {/* Income & Expense Pill Chips */}
        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800/80">
          <div className="flex items-center space-x-2.5 p-2 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="h-7 w-7 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold">
              <ArrowDownLeft className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block leading-tight">Income</span>
              <span className="text-xs font-bold text-emerald-400">
                {hideBalance ? '••••' : formatCurrency(monthlyIncome, currency, locale)}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 p-2 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="h-7 w-7 rounded-lg bg-rose-500/15 text-rose-400 flex items-center justify-center font-bold">
              <ArrowUpRight className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block leading-tight">Expense</span>
              <span className="text-xs font-bold text-rose-400">
                {hideBalance ? '••••' : formatCurrency(monthlyExpense, currency, locale)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Quick Action Grid (Flutter Squircle Icon Row) */}
      <div className="grid grid-cols-4 gap-2 py-1">
        <button
          onClick={() => setAddTransactionOpen(true)}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#121826] border border-slate-800 hover:border-emerald-500/40 transition-all group"
        >
          <div className="h-11 w-11 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
            <Plus className="h-5 w-5 stroke-[2.5]" />
          </div>
          <span className="text-[11px] font-semibold text-slate-200">Add Log</span>
        </button>

        <button
          onClick={() => setAddTransferOpen(true)}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#121826] border border-slate-800 hover:border-indigo-500/40 transition-all group"
        >
          <div className="h-11 w-11 rounded-2xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
            <ArrowLeftRight className="h-5 w-5 stroke-[2.5]" />
          </div>
          <span className="text-[11px] font-semibold text-slate-200">Transfer</span>
        </button>

        <Link
          to="/accounts"
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#121826] border border-slate-800 hover:border-teal-500/40 transition-all group"
        >
          <div className="h-11 w-11 rounded-2xl bg-teal-500/15 text-teal-400 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
            <Wallet className="h-5 w-5 stroke-[2.5]" />
          </div>
          <span className="text-[11px] font-semibold text-slate-200">Wallets</span>
        </Link>

        <Link
          to="/reports"
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#121826] border border-slate-800 hover:border-amber-500/40 transition-all group"
        >
          <div className="h-11 w-11 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
            <TrendingUp className="h-5 w-5 stroke-[2.5]" />
          </div>
          <span className="text-[11px] font-semibold text-slate-200">Analytics</span>
        </Link>
      </div>

      {/* 3. Promotional Banner Carousel */}
      <BannerCarousel position="DASHBOARD" />

      {/* 4. Accounts Horizontal Scroll / Quick List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            My Accounts ({accounts.length})
          </span>
          <Link to="/accounts" className="text-xs font-semibold text-emerald-400 hover:underline">
            Manage
          </Link>
        </div>

        <div className="flex space-x-2.5 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className="flex-shrink-0 w-40 p-3.5 rounded-2xl bg-[#121826] border border-slate-800 hover:border-slate-700 transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className="h-7 w-7 rounded-xl flex items-center justify-center font-bold text-xs"
                  style={{ backgroundColor: `${acc.color}20`, color: acc.color || '#10b981' }}
                >
                  {acc.type === 'MOBILE_BANKING' ? <Smartphone className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
                </div>
                <span className="text-[10px] font-mono text-slate-400 truncate max-w-[70px]">
                  {acc.bank_name || acc.type}
                </span>
              </div>
              <span className="text-xs font-bold text-white block truncate">{acc.name}</span>
              <span className="text-sm font-extrabold text-emerald-400 block mt-0.5">
                {hideBalance ? '••••' : formatCurrency(acc.balance, currency, locale)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Budget Status Card */}
      {budgets.length > 0 && (
        <div className="flat-card p-4 bg-[#121826] border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-300">Monthly Budget Limits</span>
            <Link to="/budgets" className="text-xs font-semibold text-emerald-400 hover:underline">
              {budgets.length} Targets
            </Link>
          </div>

          <div className="space-y-2.5 mt-2">
            {budgets.slice(0, 2).map((b) => (
              <div key={b.id} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium">{b.category?.name}</span>
                  <span className="text-slate-400">
                    {formatCurrency(b.spent, currency, locale)} / {formatCurrency(b.amount, currency, locale)}
                  </span>
                </div>
                <Progress
                  value={b.spent || 0}
                  max={Number(b.amount)}
                  indicatorColor={(b.spent || 0) > Number(b.amount) ? 'bg-rose-500' : 'bg-emerald-400'}
                  className="h-1.5"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Recent Transactions ListTile */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            {t('dashboard.recent_transactions')}
          </span>
          <Link to="/transactions" className="text-xs font-semibold text-emerald-400 hover:underline">
            {t('dashboard.view_all')}
          </Link>
        </div>

        <div className="flat-card bg-[#121826] border border-slate-800 divide-y divide-slate-800/60 overflow-hidden">
          {transactions.slice(0, 5).map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between p-3.5 hover:bg-slate-900/50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`h-10 w-10 rounded-2xl flex items-center justify-center font-bold flex-shrink-0 ${
                    tx.type === 'INCOME'
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : 'bg-rose-500/15 text-rose-400'
                  }`}
                >
                  {tx.type === 'INCOME' ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                </div>

                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white leading-tight">{tx.description}</h4>
                  <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-400">
                    <span>{formatDate(tx.transaction_date)}</span>
                    {tx.category && <span>• {tx.category.name}</span>}
                  </div>
                </div>
              </div>

              <span
                className={`text-sm font-extrabold ${
                  tx.type === 'INCOME' ? 'text-emerald-400' : 'text-slate-100'
                }`}
              >
                {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount, currency, locale)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
