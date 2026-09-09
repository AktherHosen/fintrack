import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, isLiveSupabase, localDb } from '../lib/supabase';
import { Transaction, Transfer } from '../types/database';
import { useAuth } from './useAuth';
import { useUIStore } from '../stores/useUIStore';

export function useTransactions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const addToast = useUIStore((state) => state.addToast);

  const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ['transactions', user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (isLiveSupabase) {
        const { data, error } = await supabase
          .from('transactions')
          .select(
            `
            *,
            account:accounts(*),
            category:categories(*)
          `
          )
          .eq('user_id', user!.id)
          .order('transaction_date', { ascending: false });
        if (error) throw error;
        return data as Transaction[];
      } else {
        const txs = localDb.getTransactions();
        const accounts = localDb.getAccounts();
        const categories = localDb.getCategories();

        return txs.map((tx) => ({
          ...tx,
          account: accounts.find((a) => a.id === tx.account_id),
          category: categories.find((c) => c.id === tx.category_id),
        }));
      }
    },
  });

  const createTransaction = useMutation({
    mutationFn: async (
      input: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>
    ) => {
      if (!user) throw new Error('Not authenticated');
      if (isLiveSupabase) {
        const { data, error } = await supabase
          .from('transactions')
          .insert({ ...input, user_id: user.id })
          .select(
            `
            *,
            account:accounts(*),
            category:categories(*)
          `
          )
          .single();
        if (error) throw error;
        return data;
      } else {
        const newTx: Transaction = {
          ...input,
          id: 'tx-' + Date.now(),
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        // Update local database
        const txList = localDb.getTransactions();
        localDb.setTransactions([newTx, ...txList]);

        // Update local account balance
        const accounts = localDb.getAccounts();
        const updatedAccounts = accounts.map((acc) => {
          if (acc.id === newTx.account_id) {
            const currentBal = Number(acc.balance);
            const delta = Number(newTx.amount);
            const nextBal = newTx.type === 'INCOME' ? currentBal + delta : currentBal - delta;
            return { ...acc, balance: nextBal, updated_at: new Date().toISOString() };
          }
          return acc;
        });
        localDb.setAccounts(updatedAccounts);
        localDb.addAuditLog('CREATE_TRANSACTION', 'TRANSACTION', newTx.id, {
          amount: newTx.amount,
          type: newTx.type,
          description: newTx.description,
        });

        return newTx;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      addToast({
        type: 'success',
        title: data.type === 'INCOME' ? 'Income Added' : 'Expense Recorded',
        description: `Successfully logged ${data.amount} BDT.`,
      });
    },
    onError: (err: any) => {
      addToast({ type: 'error', title: 'Transaction Failed', description: err.message });
    },
  });

  const deleteTransaction = useMutation({
    mutationFn: async (id: string) => {
      if (isLiveSupabase) {
        const { error } = await supabase.from('transactions').delete().eq('id', id);
        if (error) throw error;
      } else {
        const list = localDb.getTransactions();
        const target = list.find((t) => t.id === id);
        if (target) {
          // reverse balance change
          const accounts = localDb.getAccounts();
          const updatedAccounts = accounts.map((acc) => {
            if (acc.id === target.account_id) {
              const currentBal = Number(acc.balance);
              const delta = Number(target.amount);
              const nextBal = target.type === 'INCOME' ? currentBal - delta : currentBal + delta;
              return { ...acc, balance: nextBal };
            }
            return acc;
          });
          localDb.setAccounts(updatedAccounts);
          localDb.setTransactions(list.filter((t) => t.id !== id));
          localDb.addAuditLog('DELETE_TRANSACTION', 'TRANSACTION', id);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      addToast({
        type: 'info',
        title: 'Transaction Deleted',
        description: 'Transaction record removed.',
      });
    },
  });

  const createTransfer = useMutation({
    mutationFn: async (input: {
      from_account_id: string;
      to_account_id: string;
      amount: number;
      fee?: number;
      description?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');
      if (isLiveSupabase) {
        const { data, error } = await supabase
          .from('transfers')
          .insert({
            ...input,
            user_id: user.id,
            fee: input.fee || 0,
          })
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const fee = input.fee || 0;
        const newTransfer: Transfer = {
          id: 'trf-' + Date.now(),
          user_id: user.id,
          from_account_id: input.from_account_id,
          to_account_id: input.to_account_id,
          amount: input.amount,
          fee: fee,
          description: input.description,
          transfer_date: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const transfers = localDb.getTransfers();
        localDb.setTransfers([newTransfer, ...transfers]);

        // Update balances
        const accounts = localDb.getAccounts();
        const nextAccounts = accounts.map((acc) => {
          if (acc.id === input.from_account_id) {
            return { ...acc, balance: Number(acc.balance) - (Number(input.amount) + fee) };
          }
          if (acc.id === input.to_account_id) {
            return { ...acc, balance: Number(acc.balance) + Number(input.amount) };
          }
          return acc;
        });
        localDb.setAccounts(nextAccounts);

        localDb.addAuditLog('CREATE_TRANSFER', 'TRANSFER', newTransfer.id, {
          amount: input.amount,
          fee,
          from: input.from_account_id,
          to: input.to_account_id,
        });

        return newTransfer;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      addToast({
        type: 'success',
        title: 'Transfer Completed',
        description: 'Funds moved successfully.',
      });
    },
    onError: (err: any) => {
      addToast({ type: 'error', title: 'Transfer Failed', description: err.message });
    },
  });

  // Derived metrics
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthlyTransactions = transactions.filter((t) => {
    const d = new Date(t.transaction_date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const monthlyIncome = monthlyTransactions
    .filter((t) => t.type === 'INCOME')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const monthlyExpense = monthlyTransactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const savingsRate =
    monthlyIncome > 0
      ? Math.max(0, Math.round(((monthlyIncome - monthlyExpense) / monthlyIncome) * 100))
      : 0;

  return {
    transactions,
    monthlyIncome,
    monthlyExpense,
    savingsRate,
    isLoading,
    createTransaction,
    deleteTransaction,
    createTransfer,
  };
}
