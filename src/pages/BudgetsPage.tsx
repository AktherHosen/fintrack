import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useBudgets } from '../hooks/useBudgets';
import { useCategories } from '../hooks/useCategories';
import { useUIStore } from '../stores/useUIStore';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../components/ui/dialog';
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

  const overallPercentage =
    totalBudgeted > 0 ? Math.min(100, Math.round((totalBudgetSpent / totalBudgeted) * 100)) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
            {t('budgets.title')}
          </h2>
          <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Monthly budget thresholds and category limits
          </p>
        </div>

        <Button
          variant="default"
          size="sm"
          onClick={() => setAddBudgetOpen(true)}
          className="text-xs h-8"
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          <span>{t('budgets.add_budget')}</span>
        </Button>
      </div>

      {/* Aggregate Overview Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-sm font-semibold">Total Budget Utilization</CardTitle>
            <CardDescription className="text-xs">Current month spending</CardDescription>
          </div>
          <Badge variant={overallPercentage > 90 ? 'destructive' : 'default'} className="text-xs">
            {overallPercentage}% Used
          </Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          <Progress
            value={totalBudgetSpent}
            max={totalBudgeted || 1}
            className="h-2"
            indicatorColor={overallPercentage > 90 ? 'bg-rose-500' : 'bg-emerald-500'}
          />
          <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span>
              Spent:{' '}
              <strong className="text-zinc-900 dark:text-zinc-200">
                {formatCurrency(totalBudgetSpent, currency, locale)}
              </strong>
            </span>
            <span>
              Total Limit:{' '}
              <strong className="text-zinc-900 dark:text-zinc-200">
                {formatCurrency(totalBudgeted, currency, locale)}
              </strong>
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {budgets.map((b) => {
          const isOver = (b.spent || 0) > Number(b.amount);
          const isWarning = (b.percentage || 0) >= b.alert_threshold && !isOver;

          return (
            <Card
              key={b.id}
              className="hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: b.category?.color || '#3b82f6' }}
                  />
                  <CardTitle className="text-sm font-semibold">{b.category?.name}</CardTitle>
                </div>
                {isOver && (
                  <Badge
                    variant="destructive"
                    className="text-[10px] py-0 h-4 flex items-center gap-1"
                  >
                    <AlertTriangle className="h-2.5 w-2.5" />
                    Over Budget
                  </Badge>
                )}
                {isWarning && (
                  <Badge variant="warning" className="text-[10px] py-0 h-4">
                    Near Limit ({b.percentage}%)
                  </Badge>
                )}
                {!isOver && !isWarning && (
                  <Badge variant="default" className="text-[10px] py-0 h-4">
                    On Track
                  </Badge>
                )}
              </CardHeader>

              <CardContent className="space-y-2 pt-2">
                <Progress
                  value={b.spent || 0}
                  max={Number(b.amount)}
                  indicatorColor={
                    isOver ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                  }
                  className="h-1.5"
                />
                <div className="flex justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                  <span>
                    Spent:{' '}
                    <strong className="text-zinc-900 dark:text-zinc-200">
                      {formatCurrency(b.spent, currency, locale)}
                    </strong>
                  </span>
                  <span>
                    Limit:{' '}
                    <strong className="text-zinc-900 dark:text-zinc-200">
                      {formatCurrency(b.amount, currency, locale)}
                    </strong>
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add Budget Dialog */}
      <Dialog open={isAddBudgetOpen} onOpenChange={setAddBudgetOpen}>
        <form onSubmit={handleCreateBudget}>
          <DialogHeader>
            <DialogTitle>Set Budget Target</DialogTitle>
            <DialogDescription>
              Define maximum monthly expenditure for this category.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <Label>Category</Label>
              <Select
                value={selectedCatId || expenseCategories[0]?.id || ''}
                onChange={(e) => setSelectedCatId(e.target.value)}
              >
                {expenseCategories.map((c) => (
                  <option key={c.id} value={c.id} className="bg-zinc-900 text-white">
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
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAddBudgetOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="default" disabled={createBudget.isPending}>
              Save Target
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
