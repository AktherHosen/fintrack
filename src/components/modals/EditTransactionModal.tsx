import React, { useState, useEffect } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Transaction, TransactionType } from '../../types/database';
import { ArrowDownLeft, ArrowUpRight, Pencil } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface EditTransactionModalProps {
  transaction: Transaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditTransactionModal({
  transaction,
  open,
  onOpenChange,
}: EditTransactionModalProps) {
  const { t } = useTranslation();
  const { currency } = useUIStore();
  const { accounts } = useAccounts();
  const { categories } = useCategories();
  const { updateTransaction } = useTransactions();

  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    if (transaction && open) {
      setType(transaction.type);
      setAmount(String(transaction.amount));
      setDescription(transaction.description || '');
      setAccountId(transaction.account_id);
      setCategoryId(transaction.category_id || '');
      setDate(transaction.transaction_date ? new Date(transaction.transaction_date) : new Date());
    }
  }, [transaction, open]);

  const filteredCategories = categories.filter((c) => c.type === type);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transaction) return;
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    updateTransaction.mutate(
      {
        id: transaction.id,
        type,
        amount: numAmount,
        description:
          description.trim() ||
          (type === 'INCOME'
            ? t('transactions.income', 'Income')
            : t('transactions.expense', 'Expense')),
        account_id: accountId || transaction.account_id,
        category_id: categoryId || null,
        transaction_date: date ? date.toISOString() : new Date().toISOString(),
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  if (!transaction) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <span>{t('transactions.edit_transaction', 'Edit Transaction')}</span>
          </DialogTitle>
          <DialogDescription>
            {t(
              'transactions.edit_modal_desc',
              'Update details, classification, or amount for this record.'
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Type Selector (Expense vs Income) */}
        <div className="grid grid-cols-2 gap-2 my-4 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => {
              setType('EXPENSE');
              setCategoryId('');
            }}
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
            onClick={() => {
              setType('INCOME');
              setCategoryId('');
            }}
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
            <Label className="text-xs font-semibold">
              {t('transactions.amount_label', 'Amount')} ({currency === 'BDT' ? '৳ BDT' : '$ USD'})
            </Label>
            <Input
              type="number"
              step="0.01"
              required
              min="0.01"
              placeholder="0.00"
              className="text-xs font-mono font-bold mt-1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <Label className="text-xs font-semibold">
              {t('transactions.description', 'Description')}
            </Label>
            <Input
              type="text"
              required
              className="text-xs mt-1"
              placeholder={t('transactions.description_placeholder', 'e.g. Grocery shopping')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Account & Category Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold">
                {t('transactions.account', 'Account')}
              </Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger className="text-xs mt-1">
                  <SelectValue placeholder={t('transactions.select_account', 'Select account')} />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-semibold">
                {t('transactions.category', 'Category')}
              </Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="text-xs mt-1">
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

          {/* Date Picker */}
          <div>
            <Label className="text-xs font-semibold">{t('transactions.date', 'Date')}</Label>
            <div className="mt-1">
              <DatePicker
                date={date}
                onSelect={setDate}
                placeholder={t('transactions.filter_date', 'Select date')}
                className="h-9 w-full text-xs"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="cursor-pointer"
          >
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            type="submit"
            variant="default"
            disabled={updateTransaction.isPending}
            className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {updateTransaction.isPending
              ? t('common.saving', 'Saving...')
              : t('common.save_changes', 'Save Changes')}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}

export default EditTransactionModal;
