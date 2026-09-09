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
      // 1. Resolve plan details
      const plans = localDb.getPlans();
      const plan = plans.find((p) => p.id === plan_id);
      const isLifetimePlan = plan?.billing_cycle === 'LIFETIME';
      // Duration is billing-cycle aware: MONTHLY=30, YEARLY=365, LIFETIME=100yrs, others=30
      const durationDays =
        isLifetimePlan ? 36500
        : plan?.billing_cycle === 'YEARLY' ? 365
        : plan?.billing_cycle === 'MONTHLY' ? 30
        : 30;
      const startsAt = new Date().toISOString();
      const expiresAt = new Date(Date.now() + durationDays * 86400000).toISOString();

      const newSub = {
        id: 'sub-' + Date.now(),
        user_id,
        plan_id,
        status: 'ACTIVE' as const,
        starts_at: startsAt,
        expires_at: expiresAt,
        auto_renew: !isLifetimePlan,
        created_at: startsAt,
        updated_at: startsAt,
        plan,
      };

      // 2. Update payment status in localDb
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

      // 3. Upsert subscription in localDb (replaces existing user subscription)
      localDb.setSubscription(newSub);
      localDb.addAuditLog('APPROVE_PAYMENT', 'PAYMENT', payment_id, { plan_id, user_id });

      // 4. If live Supabase is connected — cancel old subscriptions first, then insert new one
      if (isLiveSupabase) {
        try {
          // Mark payment approved
          await supabase
            .from('payments')
            .update({
              status: 'APPROVED',
              reviewed_by: user?.id,
              reviewed_at: new Date().toISOString(),
            })
            .eq('id', payment_id);

          // Cancel any existing active subscriptions for this user
          await supabase
            .from('subscriptions')
            .update({ status: 'CANCELLED', updated_at: new Date().toISOString() })
            .eq('user_id', user_id)
            .eq('status', 'ACTIVE');

          // Insert fresh subscription
          await supabase.from('subscriptions').insert({
            user_id,
            plan_id,
            status: 'ACTIVE',
            starts_at: startsAt,
            expires_at: expiresAt,
            auto_renew: !isLifetimePlan,
          });
        } catch (e) {
          console.warn('Supabase approve payment warning:', e);
        }
      }
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'payments'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'audit-logs'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      // Invalidate all subscription queries (including user-specific ['subscription', userId])
      queryClient.invalidateQueries({ queryKey: ['subscription'], exact: false });
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

  // All Subscriptions across users (ACTIVE only, newest first)
  const { data: subscriptions = [], isLoading: isSubsLoading } = useQuery<Subscription[]>({
    queryKey: ['admin', 'subscriptions'],
    enabled: isAdmin,
    staleTime: 0,
    queryFn: async () => {
      let liveSubs: Subscription[] = [];
      if (isLiveSupabase) {
        try {
          const { data, error } = await supabase
            .from('subscriptions')
            .select('*, plan:plans(*)')
            .eq('status', 'ACTIVE')
            .order('created_at', { ascending: false });
          if (!error && data) {
            liveSubs = data as Subscription[];
          }
        } catch (e) {
          console.warn('Could not fetch live subscriptions:', e);
        }
      }
      const localSubs = localDb.getSubscriptions().filter((s) => s.status === 'ACTIVE');
      const plans = localDb.getPlans();
      const combined: Subscription[] = [];
      const seen = new Set<string>();

      // Live Supabase first (authoritative), then localDb as fallback
      for (const s of [...liveSubs, ...localSubs]) {
        if (!s || !s.user_id || seen.has(s.user_id)) continue;
        seen.add(s.user_id);
        const assignedPlan = s.plan || plans.find((p) => p.id === s.plan_id);
        combined.push({ ...s, plan: assignedPlan });
      }
      return combined;
    },
  });

  // Assign Plan to User (Admin)
  const assignUserPlan = useMutation({
    mutationFn: async ({
      userId,
      planId,
      durationDays = 30,
      notes,
    }: {
      userId: string;
      planId: string;
      durationDays?: number;
      notes?: string;
    }) => {
      const plans = localDb.getPlans();
      const targetPlan = plans.find((p) => p.id === planId) || plans[0];
      const isLifetime = targetPlan?.billing_cycle === 'LIFETIME' || durationDays >= 36500;
      const startsAt = new Date().toISOString();
      const expiresAt = isLifetime
        ? new Date(Date.now() + 100 * 365 * 86400000).toISOString()
        : new Date(Date.now() + durationDays * 86400000).toISOString();

      const newSub: Subscription = {
        id: 'sub-' + Date.now(),
        user_id: userId,
        plan_id: planId,
        status: 'ACTIVE',
        starts_at: startsAt,
        expires_at: expiresAt,
        auto_renew: !isLifetime,
        created_at: startsAt,
        updated_at: startsAt,
        plan: targetPlan,
      };

      // 1. Upsert in localDb (replaces any existing subscription for this user)
      localDb.setSubscription(newSub);
      localDb.addAuditLog('ASSIGN_PLAN', 'SUBSCRIPTION', newSub.id, {
        user_id: userId,
        plan_id: planId,
        plan_name: targetPlan?.name,
        durationDays,
        notes,
      });

      // 2. If live Supabase is connected — cancel old then insert new
      if (isLiveSupabase) {
        try {
          // Cancel all existing active subscriptions for this user first
          await supabase
            .from('subscriptions')
            .update({ status: 'CANCELLED', updated_at: new Date().toISOString() })
            .eq('user_id', userId)
            .eq('status', 'ACTIVE');

          // Insert fresh active subscription
          await supabase.from('subscriptions').insert({
            user_id: userId,
            plan_id: planId,
            status: 'ACTIVE',
            starts_at: startsAt,
            expires_at: expiresAt,
            auto_renew: !isLifetime,
          });
        } catch (e) {
          console.warn('Supabase assign plan warning:', e);
        }
      }

      return newSub;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'audit-logs'] });
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      queryClient.invalidateQueries({ queryKey: ['subscription', vars.userId] });
      addToast({
        type: 'success',
        title: 'Plan Assigned',
        description: 'User subscription has been updated successfully.',
      });
    },
    onError: (err: any) => {
      addToast({ type: 'error', title: 'Plan Assignment Failed', description: err.message });
    },
  });

  // Cancel / Revert User Subscription (Admin)
  const cancelUserPlan = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason?: string }) => {
      const plans = localDb.getPlans();
      const freePlan = plans.find((p) => p.slug === 'free') || plans[0];
      const startsAt = new Date().toISOString();
      const expiresAt = new Date(Date.now() + 3650 * 86400000).toISOString();

      const freeSub: Subscription = {
        id: 'sub-' + Date.now(),
        user_id: userId,
        plan_id: freePlan?.id || 'plan-free',
        status: 'ACTIVE',
        starts_at: startsAt,
        expires_at: expiresAt,
        auto_renew: false,
        created_at: startsAt,
        updated_at: startsAt,
        plan: freePlan,
      };

      localDb.setSubscription(freeSub);
      localDb.addAuditLog('CANCEL_PLAN', 'SUBSCRIPTION', freeSub.id, {
        user_id: userId,
        reason: reason || 'Reverted to Free Starter by Admin',
      });

      if (isLiveSupabase) {
        try {
          await supabase
            .from('subscriptions')
            .update({ status: 'CANCELLED' })
            .eq('user_id', userId);
        } catch (e) {
          console.warn('Supabase cancel plan warning:', e);
        }
      }

      return freeSub;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'audit-logs'] });
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      queryClient.invalidateQueries({ queryKey: ['subscription', vars.userId] });
      addToast({
        type: 'info',
        title: 'Subscription Reverted',
        description: 'User plan has been reset to Free Starter.',
      });
    },
    onError: (err: any) => {
      addToast({ type: 'error', title: 'Cancel Failed', description: err.message });
    },
  });

  const pendingPaymentsCount = payments.filter((p) => p.status === 'PENDING').length;

  return {
    users,
    payments,
    auditLogs,
    subscriptions,
    pendingPaymentsCount,
    isLoading: isPaymentsLoading || isLogsLoading || isUsersLoading || isSubsLoading,
    approvePayment,
    rejectPayment,
    updateUserRole,
    assignUserPlan,
    cancelUserPlan,
  };
}
