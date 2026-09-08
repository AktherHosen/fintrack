import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTransactions } from '../hooks/useTransactions';
import { useAccounts } from '../hooks/useAccounts';
import { useCategories } from '../hooks/useCategories';
import { useUIStore } from '../stores/useUIStore';
import { useFilterStore } from '../stores/useFilterStore';
import { BannerCarousel } from '../components/banners/BannerCarousel';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import {
  Search,
  Filter,
  Download,
  Plus,
  Trash2,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Tag,
  Calendar,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../lib/utils';
import { TransactionType } from '../types/database';

export function TransactionsPage() {
  const { t } = useTranslation();
  const { transactions, deleteTransaction, isLoading } = useTransactions();
  const { accounts } = useAccounts();
  const { categories } = useCategories();
  const { currency, locale, setAddTransactionOpen, setAddTransferOpen } = useUIStore();
  const {
    searchQuery,
    setSearchQuery,
    selectedAccountId,
    setSelectedAccountId,
    selectedCategoryId,
    setSelectedCategoryId,
    selectedType,
    setSelectedType,
    resetFilters,
  } = useFilterStore();

  // Client-side filtering
  const filteredTransactions = transactions.filter((tx) => {
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchDesc = tx.description?.toLowerCase().includes(q);
      const matchTag = tx.tags?.some((t) => t.toLowerCase().includes(q));
      const matchAmount = String(tx.amount).includes(q);
      if (!matchDesc && !matchTag && !matchAmount) return false;
    }

    // Account filter
    if (selectedAccountId !== 'ALL' && tx.account_id !== selectedAccountId) {
      return false;
    }

    // Category filter
    if (selectedCategoryId !== 'ALL' && tx.category_id !== selectedCategoryId) {
      return false;
    }

    // Type filter
    if (selectedType !== 'ALL' && tx.type !== selectedType) {
      return false;
    }

    return true;
  });

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) return;
    const headers = ['ID', 'Date', 'Type', 'Amount', 'Currency', 'Account', 'Category', 'Description'];
    const rows = filteredTransactions.map((tx) => [
      tx.id,
      formatDate(tx.transaction_date),
      tx.type,
      tx.amount,
      currency,
      tx.account?.name || tx.account_id,
      tx.category?.name || 'Uncategorized',
      `"${(tx.description || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `fintrack_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* 1. Transaction Banner (Phase 6) */}
      <BannerCarousel position="TRANSACTIONS" />

      {/* 2. Top Header & Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">{t('transactions.title')}</h2>
          <p className="text-xs sm:text-sm text-slate-400">{t('transactions.subtitle')}</p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="gap-1.5"
            disabled={filteredTransactions.length === 0}
          >
            <Download className="h-4 w-4" />
            <span>{t('transactions.export_csv')}</span>
          </Button>

          <Button
            variant="gradient"
            size="sm"
            onClick={() => setAddTransactionOpen(true)}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>{t('dashboard.add_transaction')}</span>
          </Button>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
            <Input
              type="text"
              placeholder={t('transactions.search_placeholder')}
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Account Filter */}
          <div>
            <Select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
            >
              <option value="ALL" className="bg-slate-900 text-white">All Accounts & Wallets</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id} className="bg-slate-900 text-white">
                  {acc.name}
                </option>
              ))}
            </Select>
          </div>

          {/* Category Filter */}
          <div>
            <Select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
            >
              <option value="ALL" className="bg-slate-900 text-white">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id} className="bg-slate-900 text-white">
                  {cat.name} ({cat.type})
                </option>
              ))}
            </Select>
          </div>

          {/* Type Filter */}
          <div>
            <Select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as any)}
            >
              <option value="ALL" className="bg-slate-900 text-white">All Types (Income / Expense)</option>
              <option value="INCOME" className="bg-slate-900 text-white">Income Only</option>
              <option value="EXPENSE" className="bg-slate-900 text-white">Expense Only</option>
            </Select>
          </div>
        </div>
      </Card>

      {/* 4. Transactions List Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-bold">
            Ledger Records ({filteredTransactions.length})
          </CardTitle>
          {(searchQuery || selectedAccountId !== 'ALL' || selectedCategoryId !== 'ALL' || selectedType !== 'ALL') && (
            <button
              onClick={resetFilters}
              className="text-xs font-semibold text-emerald-400 hover:underline"
            >
              Reset Filters
            </button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {filteredTransactions.length > 0 ? (
            <div className="divide-y divide-slate-800/80">
              {filteredTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-4 hover:bg-slate-900/50 transition-colors"
                >
                  <div className="flex items-center space-x-3.5">
                    <div
                      className={`h-11 w-11 rounded-xl flex items-center justify-center font-bold ${
                        tx.type === 'INCOME'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {tx.type === 'INCOME' ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-white leading-snug">{tx.description}</h4>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(tx.transaction_date)}
                        </span>
                        {tx.account && (
                          <span className="text-[11px] font-medium text-slate-300 px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700">
                            {tx.account.name}
                          </span>
                        )}
                        {tx.category && (
                          <span className="text-[11px] font-semibold text-emerald-400 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                            {tx.category.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className={`text-right text-base font-black ${tx.type === 'INCOME' ? 'text-emerald-400' : 'text-slate-100'}`}>
                      {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount, currency, locale)}
                    </div>

                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this transaction?')) {
                          deleteTransaction.mutate(tx.id);
                        }
                      }}
                      className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      title="Delete record"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center text-sm text-slate-400">
              {t('transactions.empty_state')}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
