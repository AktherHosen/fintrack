import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, isLiveSupabase, localDb } from '../lib/supabase';
import { PaymentSubmission, AuditLog, UserProfile } from '../types/database';
import { useAuth } from './useAuth';
import { useUIStore } from '../stores/useUIStore';

export function useAdmin() {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const addToast = useUIStore((state) => state.addToast);

  // All Payments
  const { data: payments = [], isLoading: isPaymentsLoading } = useQuery<PaymentSubmission[]>({
    queryKey: ['admin', 'payments'],
    enabled: isAdmin,
    queryFn: async () => {
      if (isLiveSupabase) {
        const { data, error } = await supabase
          .from('payments')
          .select('*, user:users(*), plan:plans(*)')
          .order('created_at', { ascending: false });
        if (error) throw error;
        return data as PaymentSubmission[];
      } else {
        const list = localDb.getPayments();
        const user = localDb.getUser();
        const plans = localDb.getPlans();
        return list.map((p) => ({
          ...p,
          user: user || undefined,
          plan: plans.find((pl) => pl.id === p.plan_id),
        }));
      }
    },
  });

  // Audit Logs
  const { data: auditLogs = [], isLoading: isLogsLoading } = useQuery<AuditLog[]>({
    queryKey: ['admin', 'audit-logs'],
    enabled: isAdmin,
    queryFn: async () => {
      if (isLiveSupabase) {
        const { data, error } = await supabase
          .from('audit_logs')
          .select('*, user:users(*)')
          .order('created_at', { ascending: false })
          .limit(50);
        if (error) throw error;
        return data as AuditLog[];
      } else {
        const logs = localDb.getAuditLogs();
        const u = localDb.getUser();
        return logs.map((l) => ({ ...l, user: u || undefined }));
      }
    },
  });

  // Verify / Approve Payment
  const approvePayment = useMutation({
    mutationFn: async ({
      payment_id,
      plan_id,
      user_id,
    }: {
      payment_id: string;
      plan_id: string;
      user_id: string;
    }) => {
      if (isLiveSupabase) {
        // 1. Update payment status
        await supabase
          .from('payments')
          .update({
            status: 'APPROVED',
            reviewed_by: user?.id,
            reviewed_at: new Date().toISOString(),
          })
          .eq('id', payment_id);

        // 2. Activate subscription
        await supabase.from('subscriptions').insert({
          user_id,
          plan_id,
          status: 'ACTIVE',
          starts_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 365 * 86400000).toISOString(),
        });
      } else {
        const payments = localDb.getPayments();
        const nextPayments = payments.map((p) =>
          p.id === payment_id
            ? {
                ...p,
                status: 'APPROVED' as const,
                reviewed_by: user?.id,
                reviewed_at: new Date().toISOString(),
              }
            : p
        );
        localDb.setPayments(nextPayments);

        const plans = localDb.getPlans();
        const plan = plans.find((p) => p.id === plan_id);

        localDb.setSubscription({
          id: 'sub-' + Date.now(),
          user_id,
          plan_id,
          status: 'ACTIVE',
          starts_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 365 * 86400000).toISOString(),
          auto_renew: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          plan,
        });

        localDb.addAuditLog('APPROVE_PAYMENT', 'PAYMENT', payment_id, { plan_id, user_id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'payments'] });
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      addToast({
        type: 'success',
        title: 'Payment Approved',
        description: 'User subscription has been activated!',
      });
    },
    onError: (err: any) => {
      addToast({ type: 'error', title: 'Approval Failed', description: err.message });
    },
  });

  // Reject Payment
  const rejectPayment = useMutation({
    mutationFn: async ({ payment_id, notes }: { payment_id: string; notes?: string }) => {
      if (isLiveSupabase) {
        await supabase
          .from('payments')
          .update({
            status: 'REJECTED',
            admin_notes: notes || 'TrxID could not be verified on bKash merchant ledger',
            reviewed_by: user?.id,
            reviewed_at: new Date().toISOString(),
          })
          .eq('id', payment_id);
      } else {
        const payments = localDb.getPayments();
        const next = payments.map((p) =>
          p.id === payment_id
            ? {
                ...p,
                status: 'REJECTED' as const,
                admin_notes: notes || 'TrxID invalid or already claimed',
                reviewed_by: user?.id,
                reviewed_at: new Date().toISOString(),
              }
            : p
        );
        localDb.setPayments(next);
        localDb.addAuditLog('REJECT_PAYMENT', 'PAYMENT', payment_id, { notes });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'payments'] });
      addToast({
        type: 'info',
        title: 'Payment Rejected',
        description: 'Marked as rejected with note.',
      });
    },
  });

  const pendingPaymentsCount = payments.filter((p) => p.status === 'PENDING').length;

  return {
    payments,
    auditLogs,
    pendingPaymentsCount,
    isLoading: isPaymentsLoading || isLogsLoading,
    approvePayment,
    rejectPayment,
  };
}
