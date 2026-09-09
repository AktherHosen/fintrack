import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTransactions } from '../hooks/useTransactions';
import { useAccounts } from '../hooks/useAccounts';
import { useCategories } from '../hooks/useCategories';
import { useSubscriptions } from '../hooks/useSubscriptions';
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
import { DatePicker } from '../components/ui/date-picker';
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
import { ConfirmDialog } from '../components/modals/ConfirmDialog';

export function TransactionsPage() {
  const { t } = useTranslation();
  const { transactions, deleteTransaction } = useTransactions();
  const [deleteTxId, setDeleteTxId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const { accounts } = useAccounts();
  const { categories } = useCategories();
  const { currency, locale, setAddTransactionOpen, addToast } = useUIStore();
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
    if (selectedDate) {
      const txDate = new Date(tx.transaction_date);
      if (
        txDate.getFullYear() !== selectedDate.getFullYear() ||
        txDate.getMonth() !== selectedDate.getMonth() ||
        txDate.getDate() !== selectedDate.getDate()
      ) {
        return false;
      }
    }
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

  const { canExportReports } = useSubscriptions();

  const handleExportCSV = () => {
    if (!canExportReports) {
      addToast({
        type: 'warning',
        title: 'Pro Feature',
        description: 'CSV Statement Export is a Pro feature. Upgrade to Pro in Settings to download.',
      });
      return;
    }
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

  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const activeFiltersCount =
    (selectedDate ? 1 : 0) +
    (selectedType !== 'ALL' ? 1 : 0) +
    (selectedAccountId !== 'ALL' ? 1 : 0) +
    (selectedCategoryId !== 'ALL' ? 1 : 0);

  return (
    <div className="space-y-3.5 sm:space-y-4">
      {/* Header Banner */}
      <BannerCarousel position="TRANSACTIONS" />

      {/* Page Header */}
      <div className="flex flex-row items-center justify-between gap-2 sm:gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-50 tracking-tight truncate">
            {t('transactions.title')}
          </h2>
          <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
            {filteredTransactions.length} {t('transactions.entries_logged', 'entries logged')}
          </p>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="text-xs h-8 px-2.5 sm:px-3"
            disabled={filteredTransactions.length === 0}
          >
            <Download className="h-3.5 w-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">{t('transactions.export_csv', 'Export CSV')}</span>
            <span className="sm:hidden">{t('common.export', 'Export')}</span>
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={() => setAddTransactionOpen(true)}
            className="text-xs h-8 px-2.5 sm:px-3"
          >
            <Plus className="h-3.5 w-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">{t('dashboard.add_transaction', 'Add Transaction')}</span>
            <span className="sm:hidden">{t('common.add', 'Add')}</span>
          </Button>
        </div>
      </div>

      {/* Mobile Filter Bar (< sm) */}
      <div className="sm:hidden space-y-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
            <Input
              type="text"
              placeholder={t('transactions.search_placeholder', 'Search transactions...')}
              className="pl-8.5 h-8.5 text-xs bg-white dark:bg-zinc-900"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Button
            type="button"
            variant={showMobileFilters || activeFiltersCount > 0 ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="h-8.5 px-2.5 text-xs shrink-0 flex items-center gap-1.5 cursor-pointer"
          >
            <Filter className="h-3.5 w-3.5" />
            <span>{t('common.filter', 'Filter')}</span>
            {activeFiltersCount > 0 && (
              <span className="h-4 w-4 rounded-full bg-white text-indigo-600 dark:bg-zinc-950 dark:text-indigo-400 text-[10px] font-black flex items-center justify-center leading-none">
                {activeFiltersCount}
              </span>
            )}
          </Button>
        </div>

        {/* Quick Type Pills on Mobile */}
        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          {(['ALL', 'EXPENSE', 'INCOME'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setSelectedType(type)}
              className={`flex-1 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                selectedType === type
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
              }`}
            >
              {type === 'ALL'
                ? t('transactions.all_types', 'All')
                : type === 'EXPENSE'
                  ? t('dashboard.expenses', 'Expense')
                  : t('dashboard.income', 'Income')}
            </button>
          ))}
        </div>

        {/* Collapsible Expanded Filters on Mobile */}
        {showMobileFilters && (
          <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="grid grid-cols-1 gap-2">
              <DatePicker
                date={selectedDate}
                onSelect={setSelectedDate}
                clearable
                placeholder={t('transactions.filter_date', 'Filter by date')}
                className="h-8.5 text-xs bg-white dark:bg-zinc-950"
              />

              <div className="grid grid-cols-2 gap-2">
                <Select
                  value={selectedAccountId}
                  onValueChange={setSelectedAccountId}
                >
                  <SelectTrigger className="h-8.5 text-xs bg-white dark:bg-zinc-950">
                    <SelectValue placeholder={t('transactions.all_accounts', 'All Accounts')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">{t('transactions.all_accounts', 'All Accounts')}</SelectItem>
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
                  <SelectTrigger className="h-8.5 text-xs bg-white dark:bg-zinc-950">
                    <SelectValue placeholder={t('transactions.all_categories', 'All Categories')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">{t('transactions.all_categories', 'All Categories')}</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {activeFiltersCount > 0 && (
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  {t('transactions.clear_filters', 'Clear filters')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Desktop Filter Row (sm and above) */}
      <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
          <Input
            type="text"
            placeholder={t('transactions.search_placeholder', 'Search by description, tag or amount...')}
            className="pl-9 h-9 text-xs"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <DatePicker
          date={selectedDate}
          onSelect={setSelectedDate}
          clearable
          placeholder={t('transactions.filter_date', 'Filter by date')}
          className="h-9 text-xs"
        />

        <Select
          value={selectedType}
          onValueChange={(val) => setSelectedType(val as any)}
        >
          <SelectTrigger className="h-9 text-xs">
            <SelectValue placeholder={t('transactions.all_types', 'All Types')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t('transactions.all_types', 'All Types')}</SelectItem>
            <SelectItem value="EXPENSE">{t('transactions.expense_only', 'Expense Only')}</SelectItem>
            <SelectItem value="INCOME">{t('transactions.income_only', 'Income Only')}</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={selectedAccountId}
          onValueChange={setSelectedAccountId}
        >
          <SelectTrigger className="h-9 text-xs">
            <SelectValue placeholder={t('transactions.all_accounts', 'All Accounts')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t('transactions.all_accounts', 'All Accounts')}</SelectItem>
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
            <SelectValue placeholder={t('transactions.all_categories', 'All Categories')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t('transactions.all_categories', 'All Categories')}</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Ledger Table & Mobile Non-Scrolling Table */}
      <Card className="overflow-hidden shadow-xs">
        <CardContent className="p-0">
          {/* Mobile Non-Scrolling Table (sm:hidden) */}
          <div className="sm:hidden w-full overflow-hidden">
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className="border-b border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-900/50 text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  <th className="py-2.5 pl-3 w-[62%] truncate">
                    {t('transactions.description', 'Transaction')}
                  </th>
                  <th className="py-2.5 pr-3 w-[38%] text-right truncate">
                    {t('transactions.amount', 'Amount')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/70 text-xs">
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((tx) => (
                    <tr
                      key={tx.id}
                      className="hover:bg-zinc-50/60 dark:hover:bg-zinc-900/40 transition-colors"
                    >
                      {/* Col 1: Transaction details */}
                      <td className="py-2.5 pl-3 align-middle">
                        <div className="flex items-center gap-2.5 min-w-0 pr-1">
                          <div
                            className={`h-7.5 w-7.5 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
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
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate leading-tight">
                              {tx.description}
                            </p>
                            <div className="flex items-center gap-1 text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
                              {tx.category && (
                                <span className="font-medium text-zinc-700 dark:text-zinc-300 truncate max-w-[80px]">
                                  {tx.category.name}
                                </span>
                              )}
                              {tx.account && (
                                <>
                                  <span>•</span>
                                  <span className="truncate max-w-[70px]">
                                    {tx.account.name}
                                  </span>
                                </>
                              )}
                              <span>•</span>
                              <span className="shrink-0">{formatDate(tx.transaction_date)}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Col 2: Amount & Delete button */}
                      <td className="py-2.5 pr-3 text-right align-middle">
                        <div className="flex items-center justify-end gap-1">
                          <div className="text-right">
                            <p
                              className={`text-xs font-bold font-mono ${
                                tx.type === 'INCOME'
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-zinc-900 dark:text-zinc-100'
                              }`}
                            >
                              {tx.type === 'INCOME' ? '+' : '-'}
                              {formatCurrency(tx.amount, currency, locale)}
                            </p>
                          </div>
                          <button
                            onClick={() => setDeleteTxId(tx.id)}
                            className="p-1 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 rounded transition-colors cursor-pointer shrink-0"
                            title={t('common.delete', 'Delete')}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="py-12 text-center text-xs text-zinc-500 px-4">
                      {t('transactions.empty_state', 'No transactions found')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Desktop Multi-column Table View (sm and above) */}
          <div className="hidden sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[220px]">{t('transactions.description', 'Description')}</TableHead>
                  <TableHead>{t('transactions.category', 'Category')}</TableHead>
                  <TableHead>{t('transactions.account', 'Account')}</TableHead>
                  <TableHead>{t('transactions.date', 'Date')}</TableHead>
                  <TableHead className="text-right">{t('transactions.amount', 'Amount')}</TableHead>
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
                            className={`h-7 w-7 rounded-md flex items-center justify-center font-bold text-xs shrink-0 ${tx.type === 'INCOME'
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
                          <span className="truncate max-w-[200px]">{tx.description}</span>
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
                        className={`text-right font-semibold text-xs font-mono ${tx.type === 'INCOME' ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-900 dark:text-zinc-100'}`}
                      >
                        {tx.type === 'INCOME' ? '+' : '-'}
                        {formatCurrency(tx.amount, currency, locale)}
                      </TableCell>
                      <TableCell className="text-right">
                        <button
                          onClick={() => setDeleteTxId(tx.id)}
                          className="p-1 text-zinc-500 hover:text-rose-400 rounded-md transition-colors cursor-pointer"
                          title={t('common.delete', 'Delete')}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-xs text-zinc-500">
                      {t('transactions.empty_state', 'No transactions found')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Transaction Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteTxId}
        onOpenChange={(open) => !open && setDeleteTxId(null)}
        title={t('transactions.delete_title', 'Delete Transaction')}
        description={t('transactions.delete_desc', 'Are you sure you want to delete this transaction record? This action will adjust your account balance.')}
        confirmLabel={t('transactions.delete_title', 'Delete Transaction')}
        isPending={deleteTransaction.isPending}
        onConfirm={() => {
          if (deleteTxId) {
            deleteTransaction.mutate(deleteTxId, {
              onSettled: () => setDeleteTxId(null),
            });
          }
        }}
      />
    </div>
  );
}
