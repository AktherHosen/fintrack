import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, isLiveSupabase, localDb } from '../lib/supabase';
import { Account } from '../types/database';
import { useAuth } from './useAuth';
import { useUIStore } from '../stores/useUIStore';

export function useAccounts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const addToast = useUIStore((state) => state.addToast);

  const { data: accounts = [], isLoading, error } = useQuery<Account[]>({
    queryKey: ['accounts', user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (isLiveSupabase) {
        const { data, error } = await supabase
          .from('accounts')
          .select('*')
          .eq('user_id', user!.id)
          .eq('is_active', true)
          .order('name');
        if (error) throw error;
        return data as Account[];
      } else {
        return localDb.getAccounts().filter((a) => a.is_active);
      }
    },
  });

  const createAccount = useMutation({
    mutationFn: async (input: Omit<Account, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      if (!user) throw new Error('Not authenticated');
      if (isLiveSupabase) {
        const { data, error } = await supabase
          .from('accounts')
          .insert({ ...input, user_id: user.id })
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const newAccount: Account = {
          ...input,
          id: 'acc-' + Date.now(),
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        const list = localDb.getAccounts();
        localDb.setAccounts([...list, newAccount]);
        localDb.addAuditLog('CREATE_ACCOUNT', 'ACCOUNT', newAccount.id, { name: newAccount.name, balance: newAccount.balance });
        return newAccount;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      addToast({ type: 'success', title: 'Account Created', description: 'New wallet/account added successfully.' });
    },
    onError: (err: any) => {
      addToast({ type: 'error', title: 'Failed to create account', description: err.message });
    },
  });

  const updateAccount = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Account> & { id: string }) => {
      if (isLiveSupabase) {
        const { data, error } = await supabase
          .from('accounts')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const list = localDb.getAccounts();
        const nextList = list.map((a) => (a.id === id ? { ...a, ...updates, updated_at: new Date().toISOString() } : a));
        localDb.setAccounts(nextList);
        localDb.addAuditLog('UPDATE_ACCOUNT', 'ACCOUNT', id, updates);
        return nextList.find((a) => a.id === id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      addToast({ type: 'success', title: 'Account Updated', description: 'Changes saved successfully.' });
    },
  });

  const deleteAccount = useMutation({
    mutationFn: async (id: string) => {
      if (isLiveSupabase) {
        const { error } = await supabase
          .from('accounts')
          .update({ is_active: false })
          .eq('id', id);
        if (error) throw error;
      } else {
        const list = localDb.getAccounts();
        const nextList = list.map((a) => (a.id === id ? { ...a, is_active: false } : a));
        localDb.setAccounts(nextList);
        localDb.addAuditLog('DELETE_ACCOUNT', 'ACCOUNT', id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      addToast({ type: 'info', title: 'Account Removed', description: 'Account archived successfully.' });
    },
  });

  const totalNetWorth = accounts
    .filter((a) => a.is_included_in_net_worth)
    .reduce((sum, a) => sum + Number(a.balance), 0);

  return {
    accounts,
    totalNetWorth,
    isLoading,
    error,
    createAccount,
    updateAccount,
    deleteAccount,
  };
}
