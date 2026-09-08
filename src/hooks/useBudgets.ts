import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, isLiveSupabase, localDb } from '../lib/supabase';
import { Budget } from '../types/database';
import { useAuth } from './useAuth';
import { useCategories } from './useCategories';
import { useTransactions } from './useTransactions';
import { useUIStore } from '../stores/useUIStore';

export function useBudgets(month?: number, year?: number) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const addToast = useUIStore((state) => state.addToast);
  const { categories } = useCategories();
  const { transactions } = useTransactions();

  const now = new Date();
  const targetMonth = month || now.getMonth() + 1;
  const targetYear = year || now.getFullYear();

  const { data: rawBudgets = [], isLoading } = useQuery<Budget[]>({
    queryKey: ['budgets', user?.id, targetMonth, targetYear],
    enabled: !!user,
    queryFn: async () => {
      if (isLiveSupabase) {
        const { data, error } = await supabase
          .from('budgets')
          .select(`
            *,
            category:categories(*)
          `)
          .eq('user_id', user!.id)
          .eq('month', targetMonth)
          .eq('year', targetYear);
        if (error) throw error;
        return data as Budget[];
      } else {
        const list = localDb.getBudgets();
        return list.filter((b) => b.month === targetMonth && b.year === targetYear);
      }
    },
  });

  // Calculate actual spending for each budget
  const budgets: Budget[] = rawBudgets.map((b) => {
    const category = b.category || categories.find((c) => c.id === b.category_id);
    const spent = transactions
      .filter((t) => {
        if (t.type !== 'EXPENSE' || t.category_id !== b.category_id) return false;
        const d = new Date(t.transaction_date);
        return d.getMonth() + 1 === targetMonth && d.getFullYear() === targetYear;
      })
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const budgetAmount = Number(b.amount);
    const remaining = Math.max(0, budgetAmount - spent);
    const percentage = budgetAmount > 0 ? Math.min(200, Math.round((spent / budgetAmount) * 100)) : 0;

    return {
      ...b,
      category,
      spent,
      remaining,
      percentage,
    };
  });

  const createBudget = useMutation({
    mutationFn: async (input: { category_id: string; amount: number; month?: number; year?: number; alert_threshold?: number }) => {
      if (!user) throw new Error('Not authenticated');
      const m = input.month || targetMonth;
      const y = input.year || targetYear;

      if (isLiveSupabase) {
        const { data, error } = await supabase
          .from('budgets')
          .upsert({
            user_id: user.id,
            category_id: input.category_id,
            amount: input.amount,
            month: m,
            year: y,
            alert_threshold: input.alert_threshold || 80,
          })
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const list = localDb.getBudgets();
        const existingIdx = list.findIndex((b) => b.category_id === input.category_id && b.month === m && b.year === y);
        const newBudget: Budget = {
          id: 'bg-' + Date.now(),
          user_id: user.id,
          category_id: input.category_id,
          amount: input.amount,
          month: m,
          year: y,
          alert_threshold: input.alert_threshold || 80,
          notify_on_exceed: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        if (existingIdx >= 0) {
          list[existingIdx] = { ...list[existingIdx], amount: input.amount, updated_at: new Date().toISOString() };
          localDb.setBudgets([...list]);
        } else {
          localDb.setBudgets([...list, newBudget]);
        }
        localDb.addAuditLog('UPSERT_BUDGET', 'BUDGET', newBudget.id, { category_id: input.category_id, amount: input.amount });
        return newBudget;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      addToast({ type: 'success', title: 'Budget Saved', description: 'Monthly budget target set.' });
    },
  });

  const totalBudgeted = budgets.reduce((sum, b) => sum + Number(b.amount), 0);
  const totalBudgetSpent = budgets.reduce((sum, b) => sum + (b.spent || 0), 0);

  return {
    budgets,
    totalBudgeted,
    totalBudgetSpent,
    isLoading,
    createBudget,
  };
}
