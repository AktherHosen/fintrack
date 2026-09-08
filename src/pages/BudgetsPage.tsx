import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useBudgets } from '../hooks/useBudgets';
import { useCategories } from '../hooks/useCategories';
import { useUIStore } from '../stores/useUIStore';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select } from '../components/ui/select';
import { PieChart, Plus, AlertTriangle, CheckCircle2 } from 'lucide-react';
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">{t('budgets.title')}</h2>
          <p className="text-xs sm:text-sm text-slate-400">{t('budgets.subtitle')}</p>
        </div>

        <Button
          variant="gradient"
          size="sm"
          onClick={() => setAddBudgetOpen(true)}
          className="gap-1.5"
        >
          <Plus className="h-4 w-4" />
          <span>{t('budgets.add_budget')}</span>
        </Button>
      </div>

      {/* Monthly Budget Summary Banner */}
      <Card className="p-6 border-indigo-500/30 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 flex-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Budget Utilization (This Month)
            </span>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black text-white">
                {formatCurrency(totalBudgetSpent, currency, locale)}
              </span>
              <span className="text-sm font-semibold text-slate-400">
                / {formatCurrency(totalBudgeted, currency, locale)}
              </span>
            </div>

            <Progress
              value={totalBudgetSpent}
              max={totalBudgeted || 1}
              className="h-3 bg-slate-800"
              indicatorColor={overallPercentage > 90 ? 'bg-rose-500' : 'bg-emerald-500'}
            />
          </div>

          <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6">
            <div className="text-center md:text-left">
              <span className="text-xs text-slate-400 block">Remaining Room</span>
              <span className="text-xl font-bold text-emerald-400">
                {formatCurrency(Math.max(0, totalBudgeted - totalBudgetSpent), currency, locale)}
              </span>
            </div>
            <Badge variant={overallPercentage > 90 ? 'destructive' : 'default'} className="text-sm py-1 px-3">
              {overallPercentage}% Used
            </Badge>
          </div>
        </div>
      </Card>

      {/* Budgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {budgets.map((b) => {
          const isOver = (b.spent || 0) > Number(b.amount);
          const isWarning = (b.percentage || 0) >= b.alert_threshold && !isOver;

          return (
            <Card key={b.id} className="p-5 relative overflow-hidden group">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: b.category?.color || '#3b82f6' }}
                  />
                  <h4 className="text-base font-bold text-white">{b.category?.name || 'Category'}</h4>
                </div>

                {isOver && (
                  <Badge variant="destructive" className="flex items-center gap-1 text-[11px]">
                    <AlertTriangle className="h-3 w-3" />
                    <span>Over Budget</span>
                  </Badge>
                )}
                {isWarning && (
                  <Badge variant="warning" className="text-[11px]">
                    Near Limit ({b.percentage}%)
                  </Badge>
                )}
                {!isOver && !isWarning && (
                  <Badge variant="default" className="text-[11px]">
                    On Track
                  </Badge>
                )}
              </div>

              <div className="space-y-3 mt-4">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Spent: <strong className="text-white">{formatCurrency(b.spent, currency, locale)}</strong></span>
                  <span className="text-slate-400">Limit: <strong className="text-slate-200">{formatCurrency(b.amount, currency, locale)}</strong></span>
                </div>

                <Progress
                  value={b.spent || 0}
                  max={Number(b.amount)}
                  indicatorColor={isOver ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'}
                />

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                  <span>Remaining: <strong className={isOver ? 'text-rose-400' : 'text-emerald-400'}>{formatCurrency(b.remaining, currency, locale)}</strong></span>
                  <span>{b.percentage}%</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Add / Edit Budget Modal */}
      <Dialog open={isAddBudgetOpen} onOpenChange={setAddBudgetOpen}>
        <form onSubmit={handleCreateBudget}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-indigo-400" />
              <span>{t('budgets.add_budget')}</span>
            </DialogTitle>
            <DialogDescription>
              Set monthly spending thresholds to receive warnings before exceeding limits.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
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
                className="font-bold text-lg"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setAddBudgetOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="gradient"
              disabled={createBudget.isPending}
            >
              {createBudget.isPending ? 'Saving...' : 'Save Budget Target'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
