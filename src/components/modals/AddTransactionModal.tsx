import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '../../stores/useUIStore';
import { useAccounts } from '../../hooks/useAccounts';
import { useCategories } from '../../hooks/useCategories';
import { useTransactions } from '../../hooks/useTransactions';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { DatePicker } from '../ui/date-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { TransactionType } from '../../types/database';
import { ArrowDownLeft, ArrowUpRight, Receipt } from 'lucide-react';
import { cn } from '../../lib/utils';

export function AddTransactionModal() {
  const { t } = useTranslation();
  const { currency, isAddTransactionOpen, setAddTransactionOpen } = useUIStore();
  const { accounts } = useAccounts();
  const { categories } = useCategories();
  const { createTransaction } = useTransactions();

  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [tags, setTags] = useState('');

  // Default account selection if not set
  const selectedAccountId = accountId || (accounts.length > 0 ? accounts[0].id : '');
  const filteredCategories = categories.filter((c) => c.type === type);
  const selectedCategoryId =
    categoryId || (filteredCategories.length > 0 ? filteredCategories[0].id : '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    createTransaction.mutate(
      {
        account_id: selectedAccountId,
        category_id: selectedCategoryId || null,
        type,
        amount: numAmount,
        description: description.trim() || (type === 'INCOME' ? t('transactions.income', 'Income') : t('transactions.expense', 'Expense')),
        transaction_date: new Date(date).toISOString(),
        is_recurring: false,
        tags: tags ? tags.split(',').map((t) => t.trim().toLowerCase()) : [],
      },
      {
        onSuccess: () => {
          setAmount('');
          setDescription('');
          setTags('');
          setAddTransactionOpen(false);
        },
      }
    );
  };

  return (
    <Dialog open={isAddTransactionOpen} onOpenChange={setAddTransactionOpen}>
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-emerald-500" />
            <span>{t('dashboard.add_transaction', 'Add Transaction')}</span>
          </DialogTitle>
          <DialogDescription>{t('transactions.add_modal_desc', 'Record new incoming revenue or daily expenditure.')}</DialogDescription>
        </DialogHeader>

        {/* Type Selector (Income vs Expense) */}
        <div className="grid grid-cols-2 gap-2 mb-4 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => setType('EXPENSE')}
            className={cn(
              'flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer',
              type === 'EXPENSE'
                ? 'bg-white dark:bg-zinc-800 text-rose-600 dark:text-rose-400 shadow-xs border border-zinc-200 dark:border-zinc-700'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            )}
          >
            <ArrowDownLeft className="h-4 w-4" />
            <span>{t('transactions.expense', 'Expense')}</span>
          </button>
          <button
            type="button"
            onClick={() => setType('INCOME')}
            className={cn(
              'flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer',
              type === 'INCOME'
                ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-xs border border-zinc-200 dark:border-zinc-700'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            )}
          >
            <ArrowUpRight className="h-4 w-4" />
            <span>{t('transactions.income', 'Income')}</span>
          </button>
        </div>

        <div className="space-y-3.5">
          {/* Amount */}
          <div>
            <Label>{t('transactions.amount_label', 'Amount (BDT ৳)')}</Label>
            <Input
              type="number"
              step="0.01"
              required
              placeholder="e.g. 1500.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-lg font-bold"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <Label>{t('transactions.description_label', 'Description / Purpose')}</Label>
            <Input
              type="text"
              required
              placeholder="e.g. Grocery Shopping at Shwapno"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Account & Category Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>{t('transactions.account_wallet', 'Account / Wallet')}</Label>
              <Select value={selectedAccountId} onValueChange={setAccountId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={t('transactions.select_account', 'Select account')} />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.name} ({acc.balance} ৳)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>{t('transactions.category', 'Category')}</Label>
              <Select value={selectedCategoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={t('transactions.select_category', 'Select category')} />
                </SelectTrigger>
                <SelectContent>
                  {filteredCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date & Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>{t('transactions.date', 'Date')}</Label>
              <div className="mt-1">
                <DatePicker
                  date={date ? new Date(date + 'T00:00:00') : undefined}
                  onSelect={(d) => {
                    if (d) {
                      const year = d.getFullYear();
                      const month = String(d.getMonth() + 1).padStart(2, '0');
                      const day = String(d.getDate()).padStart(2, '0');
                      setDate(`${year}-${month}-${day}`);
                    }
                  }}
                />
              </div>
            </div>
            <div>
              <Label>{t('transactions.tags_label', 'Tags (comma separated)')}</Label>
              <Input
                type="text"
                placeholder="food, dinner, treat"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setAddTransactionOpen(false)}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            type="submit"
            variant={type === 'EXPENSE' ? 'destructive' : 'gradient'}
            disabled={createTransaction.isPending}
          >
            {createTransaction.isPending ? t('common.saving', 'Saving...') : t('transactions.save_transaction', 'Save Transaction')}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
