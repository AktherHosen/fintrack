import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, isLiveSupabase, localDb } from '../lib/supabase';
import { Loan, LoanPayment } from '../types/database';
import { useAuth } from './useAuth';
import { useUIStore } from '../stores/useUIStore';

export function useLoans() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const addToast = useUIStore((state) => state.addToast);

  const { data: loans = [], isLoading } = useQuery<Loan[]>({
    queryKey: ['loans', user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (isLiveSupabase) {
        const { data, error } = await supabase
          .from('loans')
          .select('*')
          .eq('user_id', user!.id)
          .order('created_at', { ascending: false });
        if (error) throw error;
        return data as Loan[];
      } else {
        return localDb.getLoans().map((l) => ({
          ...l,
          remaining_amount: Math.max(0, Number(l.principal_amount) - Number(l.total_paid)),
        }));
      }
    },
  });

  const createLoan = useMutation({
    mutationFn: async (
      input: Omit<Loan, 'id' | 'user_id' | 'total_paid' | 'status' | 'created_at' | 'updated_at'>
    ) => {
      if (!user) throw new Error('Not authenticated');
      if (isLiveSupabase) {
        const { data, error } = await supabase
          .from('loans')
          .insert({ ...input, user_id: user.id, total_paid: 0, status: 'ACTIVE' })
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const newLoan: Loan = {
          ...input,
          id: 'loan-' + Date.now(),
          user_id: user.id,
          total_paid: 0,
          status: 'ACTIVE',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          remaining_amount: Number(input.principal_amount),
        };
        const list = localDb.getLoans();
        localDb.setLoans([newLoan, ...list]);
        localDb.addAuditLog('CREATE_LOAN', 'LOAN', newLoan.id, {
          person: newLoan.person_name,
          amount: newLoan.principal_amount,
          type: newLoan.type,
        });
        return newLoan;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      addToast({
        type: 'success',
        title: 'Loan Record Created',
        description: `${data.type === 'LENT' ? 'Money Lent to' : 'Borrowed from'} ${data.person_name}.`,
      });
    },
    onError: (err: any) => {
      addToast({ type: 'error', title: 'Failed to create loan', description: err.message });
    },
  });

  const recordRepayment = useMutation({
    mutationFn: async ({
      loan_id,
      amount,
      account_id,
      notes,
    }: {
      loan_id: string;
      amount: number;
      account_id?: string;
      notes?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');
      if (isLiveSupabase) {
        const { data: loan } = await supabase.from('loans').select('*').eq('id', loan_id).single();
        if (!loan) throw new Error('Loan not found');

        const newPaid = Number(loan.total_paid) + Number(amount);
        const status = newPaid >= Number(loan.principal_amount) ? 'PAID' : 'ACTIVE';

        await supabase.from('loans').update({ total_paid: newPaid, status }).eq('id', loan_id);
        const { data: payment, error } = await supabase
          .from('loan_payments')
          .insert({
            loan_id,
            user_id: user.id,
            account_id,
            amount,
            notes,
          })
          .select()
          .single();
        if (error) throw error;
        return payment;
      } else {
        const list = localDb.getLoans();
        const target = list.find((l) => l.id === loan_id);
        if (!target) throw new Error('Loan not found');

        const newPaid = Number(target.total_paid) + Number(amount);
        const isCompleted = newPaid >= Number(target.principal_amount);
        const nextStatus: Loan['status'] = isCompleted ? 'PAID' : 'ACTIVE';

        const updatedLoans: Loan[] = list.map((l) =>
          l.id === loan_id ? { ...l, total_paid: newPaid, status: nextStatus } : l
        );
        localDb.setLoans(updatedLoans);
        localDb.addAuditLog('LOAN_REPAYMENT', 'LOAN', loan_id, {
          amount,
          person: target.person_name,
        });
        return { loan_id, amount, status: nextStatus };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      addToast({
        type: 'success',
        title: 'Repayment Recorded',
        description: 'Loan balance adjusted.',
      });
    },
    onError: (err: any) => {
      addToast({ type: 'error', title: 'Repayment Error', description: err.message });
    },
  });

  const totalLent = loans
    .filter((l) => l.type === 'LENT' && l.status === 'ACTIVE')
    .reduce((sum, l) => sum + (Number(l.principal_amount) - Number(l.total_paid)), 0);
  const totalBorrowed = loans
    .filter((l) => l.type === 'BORROWED' && l.status === 'ACTIVE')
    .reduce((sum, l) => sum + (Number(l.principal_amount) - Number(l.total_paid)), 0);

  return {
    loans,
    totalLent,
    totalBorrowed,
    isLoading,
    createLoan,
    recordRepayment,
  };
}
