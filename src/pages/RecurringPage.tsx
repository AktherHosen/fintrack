import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRecurring } from '../hooks/useRecurring';
import { useAccounts } from '../hooks/useAccounts';
import { useCategories } from '../hooks/useCategories';
import { useUIStore } from '../stores/useUIStore';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select } from '../components/ui/select';
import {
  CalendarSync,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Play,
  Pause,
  Clock,
  Zap,
  Briefcase,
  Home,
  Wifi,
  Tv,
  Trash2,
} from 'lucide-react';
import { formatCurrency, formatDate, cn } from '../lib/utils';
import { FrequencyType, TransactionType } from '../types/database';

interface RoutineTemplate {
  title: string;
  type: TransactionType;
  defaultAmount: string;
  frequency: FrequencyType;
  categoryKeyword: string;
  icon: any;
}

const ROUTINE_TEMPLATES: RoutineTemplate[] = [
  {
    title: 'Monthly Salary',
    type: 'INCOME',
    defaultAmount: '125000',
    frequency: 'MONTHLY',
    categoryKeyword: 'Salary',
    icon: Briefcase,
  },
  {
    title: 'House Rent',
    type: 'EXPENSE',
    defaultAmount: '25000',
    frequency: 'MONTHLY',
    categoryKeyword: 'Rent',
    icon: Home,
  },
  {
    title: 'Electricity & Utility Bills',
    type: 'EXPENSE',
    defaultAmount: '3500',
    frequency: 'MONTHLY',
    categoryKeyword: 'Utilities',
    icon: Zap,
  },
  {
    title: 'Fiber Internet (WiFi)',
    type: 'EXPENSE',
    defaultAmount: '1500',
    frequency: 'MONTHLY',
    categoryKeyword: 'Utilities',
    icon: Wifi,
  },
  {
    title: 'Netflix & Streaming',
    type: 'EXPENSE',
    defaultAmount: '1200',
    frequency: 'MONTHLY',
    categoryKeyword: 'Entertainment',
    icon: Tv,
  },
];

export function RecurringPage() {
  const { t } = useTranslation();
  const { recurring, createRecurring, toggleStatus, deleteRecurring } = useRecurring();
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

  // Calculations for summary metrics
  const activeRules = recurring.filter((r) => r.is_active);
  const monthlyInflow = activeRules
    .filter((r) => r.type === 'INCOME')
    .reduce((sum, r) => sum + Number(r.amount), 0);
  const monthlyOutflow = activeRules
    .filter((r) => r.type === 'EXPENSE')
    .reduce((sum, r) => sum + Number(r.amount), 0);

  const openWithTemplate = (template: RoutineTemplate) => {
    setDescription(template.title);
    setType(template.type);
    setAmount(template.defaultAmount);
    setFrequency(template.frequency);

    const matchCat = categories.find((c) =>
      c.name.toLowerCase().includes(template.categoryKeyword.toLowerCase())
    );
    if (matchCat) {
      setCategoryId(matchCat.id);
    } else {
      const typeCats = categories.filter((c) => c.type === template.type);
      if (typeCats.length > 0) setCategoryId(typeCats[0].id);
    }

    if (accounts.length > 0) setAccountId(accounts[0].id);
    setIsOpen(true);
  };

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

  const filteredCategories = categories.filter((c) => c.type === type);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight flex items-center gap-2">
            <span>{t('recurring.title')}</span>
            <Badge variant="indigo" className="text-[10px] py-0 h-4">Auto-Pilot</Badge>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Automate routine salaries, subscriptions, and utility bills
          </p>
        </div>

        <Button
          variant="default"
          size="sm"
          onClick={() => {
            setDescription('');
            setAmount('');
            setIsOpen(true);
          }}
          className="gap-1.5 text-xs h-8"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>{t('recurring.add_recurring')}</span>
        </Button>
      </div>

      {/* Summary KPI Strip (visible when at least one recurring rule exists) */}
      {recurring.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4 border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20">
            <span className="text-[11px] uppercase font-medium text-zinc-500 dark:text-zinc-400">Monthly Auto Income</span>
            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              +{formatCurrency(monthlyInflow, currency, locale)}
            </div>
          </Card>

          <Card className="p-4 border-rose-500/30 bg-rose-500/5 dark:bg-rose-950/20">
            <span className="text-[11px] uppercase font-medium text-zinc-500 dark:text-zinc-400">Monthly Auto Bills & Rent</span>
            <div className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1">
              -{formatCurrency(monthlyOutflow, currency, locale)}
            </div>
          </Card>

          <Card className="p-4 border-indigo-500/30 bg-indigo-500/5 dark:bg-indigo-950/20">
            <span className="text-[11px] uppercase font-medium text-zinc-500 dark:text-zinc-400">Active Schedules</span>
            <div className="text-xl font-bold text-indigo-600 dark:text-indigo-300 mt-1">
              {activeRules.length} of {recurring.length} Active
            </div>
          </Card>
        </div>
      )}

      {/* Main Content Area */}
      {recurring.length > 0 ? (
        <div className="space-y-6">
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
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-zinc-500 uppercase font-mono">{item.frequency}</span>
                        {item.account && (
                          <span className="text-[10px] text-zinc-400">• {item.account.name}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => toggleStatus.mutate({ id: item.id, is_active: !item.is_active })}
                      className={`px-2 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                        item.is_active
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700'
                      }`}
                      title={item.is_active ? 'Click to pause' : 'Click to activate'}
                    >
                      {item.is_active ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                      <span>{item.is_active ? 'Active' : 'Paused'}</span>
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Remove recurring rule "${item.description}"?`)) {
                          deleteRecurring.mutate(item.id);
                        }
                      }}
                      className="p-1 text-zinc-400 hover:text-rose-500 dark:hover:text-rose-400 rounded-md transition-colors cursor-pointer"
                      title="Delete Schedule"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-medium text-zinc-500 block">Scheduled Amount</span>
                    <span className={`text-base font-bold ${item.type === 'INCOME' ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-900 dark:text-zinc-50'}`}>
                      {item.type === 'INCOME' ? '+' : '-'}{formatCurrency(item.amount, currency, locale)}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase font-medium text-zinc-500 flex items-center gap-1">
                      <Clock className="h-3 w-3 text-indigo-500 dark:text-indigo-400" />
                      Next Due
                    </span>
                    <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 font-mono">
                      {formatDate(item.next_run_date)}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Quick Add Another Routine Bar */}
          <div className="pt-2">
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-2">
              Quick-Add Routine Template:
            </span>
            <div className="flex flex-wrap gap-2">
              {ROUTINE_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.title}
                  onClick={() => openWithTemplate(tmpl)}
                  className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:border-indigo-500/50 hover:bg-indigo-500/5 dark:hover:bg-indigo-500/10 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <tmpl.icon className="h-3.5 w-3.5 text-indigo-500" />
                  <span>{tmpl.title} (৳{Number(tmpl.defaultAmount).toLocaleString()})</span>
                  <Plus className="h-3 w-3 text-zinc-400" />
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Rich Empty State when no recurring transactions exist */
        <Card className="border-dashed border-zinc-300 dark:border-zinc-800 bg-white/60 dark:bg-zinc-950/40 p-6 sm:p-10 text-center">
          <div className="max-w-xl mx-auto space-y-4">
            <div className="h-14 w-14 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center mx-auto shadow-sm">
              <CalendarSync className="h-7 w-7" />
            </div>

            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Automate routine salaries, subscriptions, and utility bills
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto mt-1 leading-relaxed">
                Schedule your regular salary deposits, house rent, broadband internet, streaming subscriptions, and electricity bills once — FinTrack tracks them automatically.
              </p>
            </div>

            <Button
              variant="default"
              size="sm"
              onClick={() => {
                setDescription('');
                setAmount('');
                setIsOpen(true);
              }}
              className="gap-1.5 text-xs h-9 px-4 font-semibold shadow-xs cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Schedule Custom Transaction</span>
            </Button>

            {/* Starter Automation Templates */}
            <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800/80">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-3">
                Or Start With a Common Routine Template:
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-left">
                {ROUTINE_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.title}
                    onClick={() => openWithTemplate(tmpl)}
                    className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800/90 bg-zinc-50/70 dark:bg-zinc-900/50 hover:bg-white dark:hover:bg-zinc-900 hover:border-indigo-500/40 hover:shadow-sm transition-all group cursor-pointer"
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold shrink-0 group-hover:scale-105 transition-transform">
                        <tmpl.icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                          {tmpl.title}
                        </div>
                        <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                          {tmpl.type === 'INCOME' ? '+' : '-'}৳ {Number(tmpl.defaultAmount).toLocaleString()} / mo
                        </div>
                      </div>
                      <Plus className="h-3.5 w-3.5 text-zinc-400 group-hover:text-indigo-500 shrink-0" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Add / Edit Recurring Rule Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <form onSubmit={handleCreate}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
              <CalendarSync className="h-5 w-5 text-indigo-500" />
              <span>Schedule Recurring Transaction</span>
            </DialogTitle>
            <DialogDescription>
              Set up automated routines for salary, rent, subscriptions, or utility payments.
            </DialogDescription>
          </DialogHeader>

          {/* Type Selector (Income vs Expense) */}
          <div className="grid grid-cols-2 gap-2 mb-4 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setType('EXPENSE')}
              className={cn(
                "flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer",
                type === 'EXPENSE'
                  ? "bg-white dark:bg-zinc-800 text-rose-600 dark:text-rose-400 shadow-xs border border-zinc-200 dark:border-zinc-700"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              )}
            >
              <ArrowDownLeft className="h-4 w-4" />
              <span>Recurring Bill / Expense</span>
            </button>
            <button
              type="button"
              onClick={() => setType('INCOME')}
              className={cn(
                "flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer",
                type === 'INCOME'
                  ? "bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-xs border border-zinc-200 dark:border-zinc-700"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              )}
            >
              <ArrowUpRight className="h-4 w-4" />
              <span>Recurring Salary / Income</span>
            </button>
          </div>

          <div className="space-y-3.5">
            <div>
              <Label>Description / Routine Name</Label>
              <Input
                type="text"
                required
                placeholder="e.g. Monthly Salary, House Rent, Netflix Subscription"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Amount (৳ BDT)</Label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 25000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="font-bold text-sm"
                />
              </div>

              <div>
                <Label>Frequency</Label>
                <Select value={frequency} onChange={(e) => setFrequency(e.target.value as any)}>
                  <option value="MONTHLY">Monthly (Routine Bills & Salary)</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="YEARLY">Yearly (Annual Subscriptions)</option>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Target Account / Wallet</Label>
                <Select
                  value={accountId || (accounts[0]?.id || '')}
                  onChange={(e) => setAccountId(e.target.value)}
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.balance} ৳)
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <Label>Category</Label>
                <Select
                  value={categoryId || (filteredCategories[0]?.id || '')}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  {filteredCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div>
              <Label>Next Execution Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="default" disabled={createRecurring.isPending}>
              {createRecurring.isPending ? 'Scheduling...' : 'Save Recurring Rule'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
