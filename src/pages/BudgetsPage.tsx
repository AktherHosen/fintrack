import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useBudgets } from '../hooks/useBudgets';
import { useCategories } from '../hooks/useCategories';
import { useUIStore } from '../stores/useUIStore';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select } from '../components/ui/select';
import { PieChart, Plus, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../lib/utils';

export function BudgetsPage() {
  const { t } = useTranslation();
  const { budgets, totalBudgeted, totalBudgetSpent, createBudget } = useBudgets();
  const { expenseCategories } = useCategories();
  const { currency, locale, isAddBudgetOpen, setAddBudgetOpen } = useUIStore();

  const [selectedCatId, setSelectedCatId] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');

  const handleCreateBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(budgetAmount);
    const catId = selectedCatId || (expenseCategories.length > 0 ? expenseCategories[0].id : '');
    if (isNaN(amount) || amount <= 0 || !catId) return;

    createBudget.mutate(
      {
        category_id: catId,
        amount,
      },
      {
        onSuccess: () => {
          setBudgetAmount('');
          setAddBudgetOpen(false);
        },
      }
    );
  };

  const overallPercentage = totalBudgeted > 0 ? Math.min(100, Math.round((totalBudgetSpent / totalBudgeted) * 100)) : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">{t('budgets.title')}</h2>
          <p className="text-xs text-slate-400">Monthly budget thresholds</p>
        </div>

        <Button
          variant="gradient"
          size="sm"
          onClick={() => setAddBudgetOpen(true)}
          className="text-xs h-8 px-2.5"
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          <span>{t('budgets.add_budget')}</span>
        </Button>
      </div>

      {/* Aggregate Progress Card */}
      <div className="flat-card p-4 bg-[#121826] border border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Overall Month Progress</span>
          <span className="font-bold text-emerald-400">{overallPercentage}% used</span>
        </div>
        <Progress
          value={totalBudgetSpent}
          max={totalBudgeted || 1}
          className="h-2"
          indicatorColor={overallPercentage > 90 ? 'bg-rose-500' : 'bg-emerald-400'}
        />
        <div className="flex justify-between text-xs text-slate-300 font-medium pt-1">
          <span>{formatCurrency(totalBudgetSpent, currency, locale)} spent</span>
          <span>{formatCurrency(totalBudgeted, currency, locale)} limit</span>
        </div>
      </div>

      {/* Budget Categories */}
      <div className="space-y-2">
        {budgets.map((b) => {
          const isOver = (b.spent || 0) > Number(b.amount);
          return (
            <div key={b.id} className="p-3.5 rounded-2xl bg-[#121826] border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: b.category?.color || '#3b82f6' }}
                  />
                  <h4 className="text-xs font-bold text-white">{b.category?.name}</h4>
                </div>
                {isOver && (
                  <span className="text-[10px] font-bold text-rose-400 bg-rose-500/15 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <AlertTriangle className="h-2.5 w-2.5" />
                    Over Budget
                  </span>
                )}
              </div>

              <Progress
                value={b.spent || 0}
                max={Number(b.amount)}
                indicatorColor={isOver ? 'bg-rose-500' : 'bg-emerald-400'}
                className="h-1.5"
              />

              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Spent: <strong className="text-slate-200">{formatCurrency(b.spent, currency, locale)}</strong></span>
                <span>Limit: <strong className="text-slate-200">{formatCurrency(b.amount, currency, locale)}</strong></span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Budget Bottom Sheet Modal */}
      <Dialog open={isAddBudgetOpen} onOpenChange={setAddBudgetOpen}>
        <form onSubmit={handleCreateBudget}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-indigo-400" />
              <span>{t('budgets.add_budget')}</span>
            </DialogTitle>
            <DialogDescription>Set monthly spending target</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <Label>Category</Label>
              <Select
                value={selectedCatId || (expenseCategories[0]?.id || '')}
                onChange={(e) => setSelectedCatId(e.target.value)}
              >
                {expenseCategories.map((c) => (
                  <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label>Monthly Limit (৳)</Label>
              <Input
                type="number"
                step="0.01"
                required
                placeholder="e.g. 15000"
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
                className="font-bold text-base"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAddBudgetOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gradient" disabled={createBudget.isPending}>
              {createBudget.isPending ? 'Saving...' : 'Save Target'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
