import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTransactions } from '../hooks/useTransactions';
import { useAccounts } from '../hooks/useAccounts';
import { useCategories } from '../hooks/useCategories';
import { useUIStore } from '../stores/useUIStore';
import { useFilterStore } from '../stores/useFilterStore';
import { BannerCarousel } from '../components/banners/BannerCarousel';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Search,
  Download,
  Plus,
  Trash2,
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
  Calendar,
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
    const headers = [
      'ID',
      'Date',
      'Type',
      'Amount',
      'Currency',
      'Account',
      'Category',
      'Description',
    ];
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

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `fintrack_transactions_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <BannerCarousel position="TRANSACTIONS" />

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
            {t('transactions.title')}
          </h2>
          <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Total {filteredTransactions.length} transaction entries logged
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="text-xs h-8"
            disabled={filteredTransactions.length === 0}
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            <span>Export CSV</span>
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={() => setAddTransactionOpen(true)}
            className="text-xs h-8"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            <span>{t('dashboard.add_transaction')}</span>
          </Button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
          <Input
            type="text"
            placeholder={t('transactions.search_placeholder')}
            className="pl-9 h-9 text-xs"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Select
          value={selectedType}
          onValueChange={(val) => setSelectedType(val as any)}
        >
          <SelectTrigger className="h-9 text-xs">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            <SelectItem value="EXPENSE">Expense Only</SelectItem>
            <SelectItem value="INCOME">Income Only</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={selectedAccountId}
          onValueChange={setSelectedAccountId}
        >
          <SelectTrigger className="h-9 text-xs">
            <SelectValue placeholder="All Accounts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Accounts</SelectItem>
            {accounts.map((acc) => (
              <SelectItem key={acc.id} value={acc.id}>
                {acc.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={selectedCategoryId}
          onValueChange={setSelectedCategoryId}
        >
          <SelectTrigger className="h-9 text-xs">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Ledger Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-medium text-xs text-zinc-900 dark:text-zinc-100">
                      <div className="flex items-center space-x-2.5">
                        <div
                          className={`h-7 w-7 rounded-md flex items-center justify-center font-bold text-xs ${
                            tx.type === 'INCOME'
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                              : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {tx.type === 'INCOME' ? (
                            <ArrowDownLeft className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          )}
                        </div>
                        <span className="truncate max-w-[180px]">{tx.description}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {tx.category ? (
                        <Badge
                          variant="outline"
                          className="text-[10px] py-0 h-4 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300"
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
                    <TableCell className="text-right">
                      <button
                        onClick={() => {
                          if (confirm('Delete this record?')) deleteTransaction.mutate(tx.id);
                        }}
                        className="p-1 text-zinc-500 hover:text-rose-400 rounded-md transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-xs text-zinc-500">
                    {t('transactions.empty_state')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
