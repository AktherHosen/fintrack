import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { PieChart, Plus, AlertTriangle, Crown, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../lib/utils';

export function BudgetsPage() {
  const { t } = useTranslation();
  const {
    budgets,
    totalBudgeted,
    totalBudgetSpent,
    createBudget,
    maxBudgets,
    isLimitReached,
    isPro,
    currentPlan,
  } = useBudgets();
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
      <div className="flex flex-row items-center justify-between gap-2 sm:gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 sm:gap-2 truncate">
            <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-50 tracking-tight truncate">
              {t('budgets.title')}
            </h2>
            <Badge
              variant={isPro ? 'indigo' : 'secondary'}
              className="text-[9px] sm:text-[10px] py-0 h-4 font-mono font-bold tracking-wide shrink-0"
            >
              {budgets.length}/{isPro ? '∞' : maxBudgets}
            </Badge>
          </div>
          <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
            {t('budgets.subtitle', 'Monthly budget thresholds and category limits')}
          </p>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <Button
            variant="default"
            size="sm"
            onClick={() => setAddBudgetOpen(true)}
            className="text-xs h-8 px-2.5 sm:px-3"
          >
            <Plus className="h-3.5 w-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">{t('budgets.add_budget')}</span>
            <span className="sm:hidden">{t('common.add', 'Add')}</span>
          </Button>
        </div>
      </div>

      {/* Limit Reached Warning Bar */}
      {isLimitReached && (
        <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="text-xs">
            <span className="font-bold text-amber-600 dark:text-amber-400">
              {t('budgets.limit_reached', 'Budget Categories Limit Reached')} ({budgets.length}/{maxBudgets})
            </span>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5">
              {t('budgets.limit_reached_desc', 'You are tracking the maximum {{max}} categories allowed on the Free Starter plan.', { max: maxBudgets })}
            </p>
          </div>
          <Link to="/settings#plans" className="shrink-0">
            <Button size="sm" variant="gradient" className="text-xs h-7 gap-1 font-bold shadow-xs">
              <Crown className="h-3 w-3" />
              <span>{t('budgets.unlock_unlimited', 'Unlock Unlimited Budgets')}</span>
            </Button>
          </Link>
        </div>
      )}

      {/* Aggregate Overview Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-sm font-semibold">{t('budgets.utilization', 'Total Budget Utilization')}</CardTitle>
            <CardDescription className="text-xs">{t('budgets.current_spending', 'Current month spending')}</CardDescription>
          </div>
          <Badge variant={overallPercentage > 90 ? 'destructive' : 'default'} className="text-xs">
            {overallPercentage}% {t('budgets.used', 'Used')}
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
              {t('budgets.spent', 'Spent')}:{' '}
              <strong className="text-zinc-900 dark:text-zinc-200">
                {formatCurrency(totalBudgetSpent, currency, locale)}
              </strong>
            </span>
            <span>
              {t('budgets.total_limit', 'Total Limit')}:{' '}
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
                    {t('budgets.over_budget', 'Over Budget')}
                  </Badge>
                )}
                {isWarning && (
                  <Badge variant="warning" className="text-[10px] py-0 h-4">
                    {t('budgets.near_limit', 'Near Limit')} ({b.percentage}%)
                  </Badge>
                )}
                {!isOver && !isWarning && (
                  <Badge variant="default" className="text-[10px] py-0 h-4">
                    {t('budgets.on_track', 'On Track')}
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
                    {t('budgets.spent', 'Spent')}:{' '}
                    <strong className="text-zinc-900 dark:text-zinc-200">
                      {formatCurrency(b.spent, currency, locale)}
                    </strong>
                  </span>
                  <span>
                    {t('budgets.limit', 'Limit')}:{' '}
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
            <DialogTitle>{t('budgets.set_target', 'Set Budget Target')}</DialogTitle>
            <DialogDescription>
              {t('budgets.set_target_desc', 'Define maximum monthly expenditure for this category.')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <Label>{t('transactions.category', 'Category')}</Label>
              <Select
                value={selectedCatId || expenseCategories[0]?.id || ''}
                onValueChange={setSelectedCatId}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={t('budgets.select_category', 'Select category')} />
                </SelectTrigger>
                <SelectContent>
                  {expenseCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>{t('budgets.monthly_limit', 'Monthly Limit (৳)')}</Label>
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
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button type="submit" variant="default" disabled={createBudget.isPending}>
              {t('budgets.save_target', 'Save Target')}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
