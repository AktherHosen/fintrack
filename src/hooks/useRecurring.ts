import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, isLiveSupabase, localDb } from '../lib/supabase';
import { RecurringTransaction } from '../types/database';
import { useAuth } from './useAuth';
import { useUIStore } from '../stores/useUIStore';

export function useRecurring() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const addToast = useUIStore((state) => state.addToast);

  const { data: recurring = [], isLoading } = useQuery<RecurringTransaction[]>({
    queryKey: ['recurring', user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (isLiveSupabase) {
        const { data, error } = await supabase
          .from('recurring_transactions')
          .select(`
            *,
            account:accounts(*),
            category:categories(*)
          `)
          .eq('user_id', user!.id)
          .order('next_run_date', { ascending: true });
        if (error) throw error;
        return data as RecurringTransaction[];
      } else {
        const list = localDb.getRecurring();
        const accounts = localDb.getAccounts();
        const categories = localDb.getCategories();
        return list.map((r) => ({
          ...r,
          account: accounts.find((a) => a.id === r.account_id),
          category: categories.find((c) => c.id === r.category_id),
        }));
      }
    },
  });

  const createRecurring = useMutation({
    mutationFn: async (input: Omit<RecurringTransaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      if (!user) throw new Error('Not authenticated');
      if (isLiveSupabase) {
        const { data, error } = await supabase
          .from('recurring_transactions')
          .insert({ ...input, user_id: user.id })
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const newRec: RecurringTransaction = {
          ...input,
          id: 'rec-' + Date.now(),
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        const list = localDb.getRecurring();
        localDb.setRecurring([...list, newRec]);
        localDb.addAuditLog('CREATE_RECURRING', 'RECURRING', newRec.id, { description: newRec.description, amount: newRec.amount });
        return newRec;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring'] });
      addToast({ type: 'success', title: 'Recurring Rule Created', description: 'Schedule created successfully.' });
    },
    onError: (err: any) => {
      addToast({ type: 'error', title: 'Error', description: err.message });
    },
  });

  const toggleStatus = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      if (isLiveSupabase) {
        const { error } = await supabase
          .from('recurring_transactions')
          .update({ is_active })
          .eq('id', id);
        if (error) throw error;
      } else {
        const list = localDb.getRecurring();
        localDb.setRecurring(list.map((r) => (r.id === id ? { ...r, is_active } : r)));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring'] });
    },
  });

  const deleteRecurring = useMutation({
    mutationFn: async (id: string) => {
      if (isLiveSupabase) {
        const { error } = await supabase
          .from('recurring_transactions')
          .delete()
          .eq('id', id);
        if (error) throw error;
      } else {
        const list = localDb.getRecurring();
        localDb.setRecurring(list.filter((r) => r.id !== id));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring'] });
      addToast({ type: 'success', title: 'Schedule Removed', description: 'Recurring transaction deleted.' });
    },
  });

  return {
    recurring,
    isLoading,
    createRecurring,
    toggleStatus,
    deleteRecurring,
  };
}
