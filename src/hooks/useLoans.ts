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
        try {
          const { data: authData } = await supabase.auth.getUser();
          const targetUserId = authData?.user?.id || user!.id;
          const { data, error } = await supabase
            .from('loans')
            .select('*')
            .eq('user_id', targetUserId)
            .order('created_at', { ascending: false });

          if (!error && data) {
            const dbLoans = data.map((l) => ({
              ...l,
              remaining_amount: Math.max(0, Number(l.principal_amount) - Number(l.total_paid)),
            })) as Loan[];
            const localLoans = localDb.getLoans().map((l) => ({
              ...l,
              remaining_amount: Math.max(0, Number(l.principal_amount) - Number(l.total_paid)),
            }));
            // Merge by ID to ensure any locally cached/saved loans are present
            const seen = new Set(dbLoans.map((l) => l.id));
            const merged = [...dbLoans, ...localLoans.filter((l) => !seen.has(l.id))];
            return merged;
          }
        } catch (e) {
          console.warn('Error fetching Supabase loans, using localDb:', e);
        }
        return localDb.getLoans().map((l) => ({
          ...l,
          remaining_amount: Math.max(0, Number(l.principal_amount) - Number(l.total_paid)),
        }));
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
        try {
          const { data: authData } = await supabase.auth.getUser();
          const supabaseUserId = authData?.user?.id || user.id;

          const { data, error } = await supabase
            .from('loans')
            .insert({
              person_name: input.person_name,
              person_phone: input.person_phone || null,
              person_email: (input as any).person_email || null,
              type: input.type,
              principal_amount: input.principal_amount,
              interest_rate: input.interest_rate || 0,
              total_paid: 0,
              due_date: input.due_date || null,
              notes: (input as any).notes || null,
              status: 'ACTIVE',
              user_id: supabaseUserId,
            })
            .select()
            .single();

          if (error) {
            console.warn('Supabase loan insert error, persisting to local storage:', error);
            // Fallback to local storage so user data is never lost
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
          return {
            ...data,
            remaining_amount: Math.max(0, Number(data.principal_amount) - Number(data.total_paid)),
          };
        } catch (err: any) {
          console.warn('Supabase loan creation error, persisting to local storage:', err);
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
          return newLoan;
        }
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
        try {
          const { data: loan } = await supabase.from('loans').select('*').eq('id', loan_id).single();
          if (loan) {
            const newPaid = Number(loan.total_paid) + Number(amount);
            const status = newPaid >= Number(loan.principal_amount) ? 'PAID' : 'ACTIVE';

            await supabase.from('loans').update({ total_paid: newPaid, status }).eq('id', loan_id);
            const { data: authData } = await supabase.auth.getUser();
            const supabaseUserId = authData?.user?.id || user.id;

            const { data: payment } = await supabase
              .from('loan_payments')
              .insert({
                loan_id,
                user_id: supabaseUserId,
                account_id,
                amount,
                notes,
              })
              .select()
              .single();

            return payment || { loan_id, amount, status };
          }
        } catch (e) {
          console.warn('Supabase repayment error, falling back to localDb:', e);
        }
        // Fallback local update
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
