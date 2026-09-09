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
      let liveList: PaymentSubmission[] = [];
      if (isLiveSupabase) {
        try {
          const { data, error } = await supabase
            .from('payments')
            .select('*')
            .order('created_at', { ascending: false });
          if (!error && data) {
            liveList = data as PaymentSubmission[];
          }
        } catch (e) {
          console.warn('Could not fetch live payments, using localDb:', e);
        }
      }

      const localList = localDb.getPayments();
      const plans = localDb.getPlans();
      const currentUser = localDb.getUser();

      const combined: PaymentSubmission[] = [];
      const seenIds = new Set<string>();

      // Put local list first (which contains fresh user submissions) followed by live list
      for (const p of [...localList, ...liveList]) {
        if (!p) continue;
        const key = p.transaction_id ? p.transaction_id.toUpperCase() : p.id;
        if (seenIds.has(key) || seenIds.has(p.id)) continue;
        seenIds.add(key);
        seenIds.add(p.id);

        const assignedUser =
          p.user ||
          (p.user_id === currentUser?.id
            ? currentUser
            : localDb.getUsers().find((u) => u.id === p.user_id) || {
                id: p.user_id,
                email: (p as any).user_email || 'customer@fintrack.app',
                full_name: (p as any).user_name || 'FinTrack Customer',
                role: 'USER',
                currency: 'BDT',
                locale: 'en',
                theme: 'dark',
                avatar_url: null,
                created_at: p.created_at,
                updated_at: p.updated_at,
              });

        const assignedPlan = p.plan || plans.find((pl) => pl.id === p.plan_id);

        combined.push({
          ...p,
          user: assignedUser,
          plan: assignedPlan,
        });
      }

      return combined.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    },
  });

  // Audit Logs
  const { data: auditLogs = [], isLoading: isLogsLoading } = useQuery<AuditLog[]>({
    queryKey: ['admin', 'audit-logs'],
    enabled: isAdmin,
    queryFn: async () => {
      if (isLiveSupabase) {
        try {
          const { data, error } = await supabase
            .from('audit_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);
          if (!error && data) {
            return data as AuditLog[];
          }
        } catch (e) {
          console.warn('Could not fetch live audit logs:', e);
        }
      }
      const logs = localDb.getAuditLogs();
      const u = localDb.getUser();
      return logs.map((l) => ({ ...l, user: u || undefined }));
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
      // 1. Update in localDb
      const payments = localDb.getPayments();
      const nextPayments = payments.map((p) =>
        p.id === payment_id || p.transaction_id === payment_id
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

      // 2. If live Supabase is connected
      if (isLiveSupabase) {
        try {
          await supabase
            .from('payments')
            .update({
              status: 'APPROVED',
              reviewed_by: user?.id,
              reviewed_at: new Date().toISOString(),
            })
            .eq('id', payment_id);

          await supabase.from('subscriptions').insert({
            user_id,
            plan_id,
            status: 'ACTIVE',
            starts_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 365 * 86400000).toISOString(),
          });
        } catch (e) {
          console.warn('Supabase approve payment warning:', e);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'payments'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'audit-logs'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
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
      // 1. Update in localDb
      const payments = localDb.getPayments();
      const next = payments.map((p) =>
        p.id === payment_id || p.transaction_id === payment_id
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

      // 2. If live Supabase is connected
      if (isLiveSupabase) {
        try {
          await supabase
            .from('payments')
            .update({
              status: 'REJECTED',
              admin_notes: notes || 'TrxID could not be verified on bKash merchant ledger',
              reviewed_by: user?.id,
              reviewed_at: new Date().toISOString(),
            })
            .eq('id', payment_id);
        } catch (e) {
          console.warn('Supabase reject payment warning:', e);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'payments'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'audit-logs'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      addToast({
        type: 'info',
        title: 'Payment Rejected',
        description: 'Marked as rejected with note.',
      });
    },
  });

  // All Users
  const { data: users = [], isLoading: isUsersLoading } = useQuery<UserProfile[]>({
    queryKey: ['admin', 'users'],
    enabled: isAdmin,
    queryFn: async () => {
      let liveUsers: UserProfile[] = [];
      if (isLiveSupabase) {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });
          if (!error && data) {
            liveUsers = data as UserProfile[];
          }
        } catch (e) {
          console.warn('Could not fetch live users:', e);
        }
      }
      const localUsers = localDb.getUsers();
      const seen = new Set<string>();
      const combined: UserProfile[] = [];
      for (const u of [...localUsers, ...liveUsers]) {
        if (!u || !u.email || seen.has(u.email.toLowerCase())) continue;
        seen.add(u.email.toLowerCase());
        combined.push(u);
      }
      return combined;
    },
  });

  // Update User Role
  const updateUserRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: 'ADMIN' | 'USER' }) => {
      if (isLiveSupabase) {
        try {
          await supabase.from('users').update({ role }).eq('id', userId);
        } catch (e) {
          console.warn('Could not update live user role:', e);
        }
      }
      const list = localDb.getUsers();
      const next = list.map((u) => (u.id === userId ? { ...u, role } : u));
      localDb.setUsers(next);
      localDb.addAuditLog('UPDATE_USER_ROLE', 'USER', userId, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'audit-logs'] });
      addToast({
        type: 'success',
        title: 'User Role Updated',
        description: 'Access permissions have been updated.',
      });
    },
    onError: (err: any) => {
      addToast({ type: 'error', title: 'Update Failed', description: err.message });
    },
  });

  const pendingPaymentsCount = payments.filter((p) => p.status === 'PENDING').length;

  return {
    users,
    payments,
    auditLogs,
    pendingPaymentsCount,
    isLoading: isPaymentsLoading || isLogsLoading || isUsersLoading,
    approvePayment,
    rejectPayment,
    updateUserRole,
  };
}
