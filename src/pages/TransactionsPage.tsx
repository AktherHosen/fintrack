import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTransactions } from '../hooks/useTransactions';
import { useAccounts } from '../hooks/useAccounts';
import { useCategories } from '../hooks/useCategories';
import { useUIStore } from '../stores/useUIStore';
import { useFilterStore } from '../stores/useFilterStore';
import { BannerCarousel } from '../components/banners/BannerCarousel';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import {
  Search,
  Download,
  Plus,
  Trash2,
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../lib/utils';

export function TransactionsPage() {
  const { t } = useTranslation();
  const { transactions, deleteTransaction } = useTransactions();
  const { accounts } = useAccounts();
  const { categories } = useCategories();
  const { currency, locale, setAddTransactionOpen } = useUIStore();
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

  const filteredTransactions = transactions.filter((tx) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchDesc = tx.description?.toLowerCase().includes(q);
      const matchTag = tx.tags?.some((t) => t.toLowerCase().includes(q));
      const matchAmount = String(tx.amount).includes(q);
      if (!matchDesc && !matchTag && !matchAmount) return false;
    }
    if (selectedAccountId !== 'ALL' && tx.account_id !== selectedAccountId) return false;
    if (selectedCategoryId !== 'ALL' && tx.category_id !== selectedCategoryId) return false;
    if (selectedType !== 'ALL' && tx.type !== selectedType) return false;
    return true;
  });

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
    <div className="space-y-4">
      {/* Promotional Banner */}
      <BannerCarousel position="TRANSACTIONS" />

      {/* Header & Quick Action */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">{t('transactions.title')}</h2>
          <p className="text-xs text-slate-400">{filteredTransactions.length} records</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCSV}
          className="text-xs h-8 px-2.5"
          disabled={filteredTransactions.length === 0}
        >
          <Download className="h-3.5 w-3.5 mr-1" />
          <span>CSV</span>
        </Button>
      </div>

      {/* Flat Search & Filter Inputs */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
          <Input
            type="text"
            placeholder="Search records..."
            className="pl-9 h-10 text-xs rounded-xl bg-[#121826] border-slate-800"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          <Select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as any)}
            className="h-8 text-[11px] rounded-lg px-2 bg-[#121826] border-slate-800"
          >
            <option value="ALL" className="bg-slate-900 text-white">All Types</option>
            <option value="INCOME" className="bg-slate-900 text-white">Income</option>
            <option value="EXPENSE" className="bg-slate-900 text-white">Expense</option>
          </Select>

          <Select
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="h-8 text-[11px] rounded-lg px-2 bg-[#121826] border-slate-800 truncate"
          >
            <option value="ALL" className="bg-slate-900 text-white">All Accounts</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id} className="bg-slate-900 text-white">
                {acc.name}
              </option>
            ))}
          </Select>

          <Select
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
            className="h-8 text-[11px] rounded-lg px-2 bg-[#121826] border-slate-800 truncate"
          >
            <option value="ALL" className="bg-slate-900 text-white">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id} className="bg-slate-900 text-white">
                {cat.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Transaction Records List */}
      <div className="flat-card bg-[#121826] border border-slate-800 divide-y divide-slate-800/60 overflow-hidden">
        {filteredTransactions.length > 0 ? (
          filteredTransactions.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between p-3 hover:bg-slate-900/40 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`h-9 w-9 rounded-xl flex items-center justify-center font-bold flex-shrink-0 ${
                    tx.type === 'INCOME' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
                  }`}
                >
                  {tx.type === 'INCOME' ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                </div>

                <div>
                  <h4 className="text-xs font-bold text-white leading-tight">{tx.description}</h4>
                  <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-400">
                    <span>{formatDate(tx.transaction_date)}</span>
                    {tx.account && <span>• {tx.account.name}</span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className={`text-xs font-extrabold ${tx.type === 'INCOME' ? 'text-emerald-400' : 'text-slate-100'}`}>
                  {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount, currency, locale)}
                </span>
                <button
                  onClick={() => {
                    if (confirm('Delete this record?')) deleteTransaction.mutate(tx.id);
                  }}
                  className="p-1 text-slate-500 hover:text-rose-400 rounded-lg"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 text-center text-xs text-slate-400">
            {t('transactions.empty_state')}
          </div>
        )}
      </div>
    </div>
  );
}
