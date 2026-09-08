import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRecurring } from '../hooks/useRecurring';
import { useAccounts } from '../hooks/useAccounts';
import { useCategories } from '../hooks/useCategories';
import { useUIStore } from '../stores/useUIStore';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select } from '../components/ui/select';
import { CalendarSync, Plus, ArrowDownLeft, ArrowUpRight, Play, Pause, Clock } from 'lucide-react';
import { formatCurrency, formatDate } from '../lib/utils';
import { FrequencyType, TransactionType } from '../types/database';

export function RecurringPage() {
  const { t } = useTranslation();
  const { recurring, createRecurring, toggleStatus } = useRecurring();
  const { accounts } = useAccounts();
  const { categories } = useCategories();
  const { currency, locale } = useUIStore();

  const [isOpen, setIsOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [frequency, setFrequency] = useState<FrequencyType>('MONTHLY');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    const selectedAccId = accountId || (accounts.length > 0 ? accounts[0].id : '');
    const selectedCatId = categoryId || (categories.length > 0 ? categories[0].id : '');

    if (isNaN(numAmount) || numAmount <= 0 || !description.trim()) return;

    createRecurring.mutate(
      {
        description: description.trim(),
        type,
        amount: numAmount,
        account_id: selectedAccId,
        category_id: selectedCatId,
        frequency,
        interval: 1,
        start_date: new Date(startDate).toISOString(),
        next_run_date: new Date(Date.now() + 30 * 86400000).toISOString(),
        is_active: true,
        auto_create: true,
      },
      {
        onSuccess: () => {
          setDescription('');
          setAmount('');
          setIsOpen(false);
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">{t('recurring.title')}</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{t('recurring.subtitle')}</p>
        </div>

        <Button
          variant="default"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="gap-1.5 text-xs h-8"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>{t('recurring.add_recurring')}</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recurring.map((item) => (
          <Card key={item.id} className="p-4 relative overflow-hidden group hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div
                  className={`h-9 w-9 rounded-lg flex items-center justify-center font-bold text-xs ${
                    item.type === 'INCOME'
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {item.type === 'INCOME' ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{item.description}</h4>
                  <span className="text-[10px] text-zinc-500 uppercase">{item.frequency}</span>
                </div>
              </div>

              <button
                onClick={() => toggleStatus.mutate({ id: item.id, is_active: !item.is_active })}
                className={`px-2 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                  item.is_active
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700'
                }`}
              >
                {item.is_active ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                <span>{item.is_active ? 'Active' : 'Paused'}</span>
              </button>
            </div>

            <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-medium text-zinc-500 block">Amount</span>
                <span className="text-base font-bold text-zinc-900 dark:text-zinc-50">{formatCurrency(item.amount, currency, locale)}</span>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-medium text-zinc-500 flex items-center gap-1">
                  <Clock className="h-3 w-3 text-emerald-500 dark:text-emerald-400" />
                  Next Due
                </span>
                <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{formatDate(item.next_run_date)}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Add Recurring Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <form onSubmit={handleCreate}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarSync className="h-5 w-5 text-emerald-400" />
              <span>{t('recurring.add_recurring')}</span>
            </DialogTitle>
            <DialogDescription>Schedule automated monthly subscriptions or bills.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Description / Title</Label>
              <Input
                type="text"
                required
                placeholder="e.g. Netflix Subscription / Fiber Internet"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type</Label>
                <Select value={type} onChange={(e) => setType(e.target.value as any)}>
                  <option value="EXPENSE" className="bg-slate-900 text-white">Expense</option>
                  <option value="INCOME" className="bg-slate-900 text-white">Income</option>
                </Select>
              </div>

              <div>
                <Label>Frequency</Label>
                <Select value={frequency} onChange={(e) => setFrequency(e.target.value as any)}>
                  <option value="MONTHLY" className="bg-slate-900 text-white">Monthly</option>
                  <option value="WEEKLY" className="bg-slate-900 text-white">Weekly</option>
                  <option value="YEARLY" className="bg-slate-900 text-white">Yearly</option>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Amount (৳)</Label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  placeholder="1200"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="font-bold"
                />
              </div>

              <div>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gradient" disabled={createRecurring.isPending}>
              {createRecurring.isPending ? 'Scheduling...' : 'Save Schedule'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
