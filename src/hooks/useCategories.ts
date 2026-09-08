import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, isLiveSupabase, localDb } from '../lib/supabase';
import { Category } from '../types/database';
import { useAuth } from './useAuth';
import { useUIStore } from '../stores/useUIStore';

export function useCategories() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const addToast = useUIStore((state) => state.addToast);

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ['categories', user?.id],
    queryFn: async () => {
      if (isLiveSupabase) {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .or(`user_id.is.null,user_id.eq.${user?.id || '00000000-0000-0000-0000-000000000000'}`)
          .order('name');
        if (error) throw error;
        return data as Category[];
      } else {
        return localDb.getCategories();
      }
    },
  });

  const createCategory = useMutation({
    mutationFn: async (input: Omit<Category, 'id' | 'created_at' | 'updated_at'>) => {
      if (!user) throw new Error('Not authenticated');
      if (isLiveSupabase) {
        const { data, error } = await supabase
          .from('categories')
          .insert({ ...input, user_id: user.id, is_system: false })
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const newCat: Category = {
          ...input,
          id: 'cat-custom-' + Date.now(),
          user_id: user.id,
          is_system: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        const list = localDb.getCategories();
        localDb.setCategories([...list, newCat]);
        localDb.addAuditLog('CREATE_CATEGORY', 'CATEGORY', newCat.id, { name: newCat.name, type: newCat.type });
        return newCat;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      addToast({ type: 'success', title: 'Category Added', description: 'New category created.' });
    },
    onError: (err: any) => {
      addToast({ type: 'error', title: 'Failed to create category', description: err.message });
    },
  });

  const expenseCategories = categories.filter((c) => c.type === 'EXPENSE');
  const incomeCategories = categories.filter((c) => c.type === 'INCOME');

  return {
    categories,
    expenseCategories,
    incomeCategories,
    isLoading,
    createCategory,
  };
}
