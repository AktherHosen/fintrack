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
      let rawList: Category[] = [];
      if (isLiveSupabase) {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .or(`user_id.is.null,user_id.eq.${user?.id || '00000000-0000-0000-0000-000000000000'}`)
          .order('name');
        if (error) throw error;
        rawList = (data || []) as Category[];
      } else {
        rawList = localDb.getCategories();
      }

      // Deduplicate by ID and unique (name + type)
      const seenIds = new Set<string>();
      const seenNames = new Set<string>();
      const uniqueList: Category[] = [];

      for (const cat of rawList) {
        if (!cat || !cat.id) continue;
        const key = `${cat.name?.trim().toLowerCase()}_${cat.type}`;
        if (!seenIds.has(cat.id) && !seenNames.has(key)) {
          seenIds.add(cat.id);
          seenNames.add(key);
          uniqueList.push(cat);
        }
      }

      return uniqueList;
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
        localDb.addAuditLog('CREATE_CATEGORY', 'CATEGORY', newCat.id, {
          name: newCat.name,
          type: newCat.type,
        });
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

  const updateCategory = useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<Category> & { id: string }) => {
      if (isLiveSupabase) {
        const { data, error } = await supabase
          .from('categories')
          .update(updates)
          .eq('id', id)
          .eq('is_system', false)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const list = localDb.getCategories();
        const target = list.find((c) => c.id === id);
        if (target?.is_system) {
          throw new Error('System default categories cannot be modified.');
        }
        const updated = list.map((c) =>
          c.id === id ? { ...c, ...updates, updated_at: new Date().toISOString() } : c
        );
        localDb.setCategories(updated);
        localDb.addAuditLog('UPDATE_CATEGORY', 'CATEGORY', id, updates);
        return updated.find((c) => c.id === id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      addToast({ type: 'success', title: 'Category Updated', description: 'Changes saved successfully.' });
    },
    onError: (err: any) => {
      addToast({ type: 'error', title: 'Failed to update category', description: err.message });
    },
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      if (isLiveSupabase) {
        const { error } = await supabase.from('categories').delete().eq('id', id);
        if (error) throw error;
        return id;
      } else {
        const list = localDb.getCategories();
        const categoryToDelete = list.find((c) => c.id === id);
        if (categoryToDelete?.is_system) {
          throw new Error('System default categories cannot be deleted.');
        }
        const filtered = list.filter((c) => c.id !== id);
        localDb.setCategories(filtered);
        localDb.addAuditLog('DELETE_CATEGORY', 'CATEGORY', id, { id });
        return id;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      addToast({ type: 'success', title: 'Category Deleted', description: 'Category removed successfully.' });
    },
    onError: (err: any) => {
      addToast({ type: 'error', title: 'Failed to delete category', description: err.message });
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
    updateCategory,
    deleteCategory,
  };
}
