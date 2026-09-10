import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, isLiveSupabase, localDb } from '../lib/supabase';
import { Plan, Subscription, PaymentSubmission } from '../types/database';
import { INITIAL_PLANS } from '../lib/mockData';
import { useAuth } from './useAuth';
import { useUIStore } from '../stores/useUIStore';

export function useSubscriptions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const addToast = useUIStore((state) => state.addToast);

  // Plans - synchronous initialData avoids empty blank flash on page refresh
  const { data: plans = INITIAL_PLANS, isLoading: isPlansLoading } = useQuery<Plan[]>({
    queryKey: ['plans'],
    initialData: () => {
      const local = localDb.getPlans();
      return local && local.length > 0 ? local : INITIAL_PLANS;
    },
    queryFn: async () => {
      if (isLiveSupabase) {
        const { data, error } = await supabase
          .from('plans')
          .select('*')
          .eq('is_active', true)
          .order('price');
        if (error) throw error;
        return data as Plan[];
      } else {
        return localDb.getPlans();
      }
    },
  });

  // Current User Subscription - synchronous initialData ensures instant active plan rendering
  const { data: subscription, isLoading: isSubLoading } = useQuery<Subscription | null>({
    queryKey: ['subscription', user?.id],
    enabled: !!user,
    staleTime: 0, // always refetch on mount so plan is fresh after admin assigns
    initialData: () => {
      if (!user) return null;
      return localDb.getUserSubscription(user.id);
    },
    queryFn: async () => {
      if (isLiveSupabase) {
        try {
          const { data, error } = await supabase
            .from('subscriptions')
            .select('*, plan:plans(*)')
            .eq('user_id', user!.id)
            .eq('status', 'ACTIVE')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
          if (!error && data) {
            return data as Subscription;
          }
          // Supabase returned no active sub — fall through to localDb
        } catch (e) {
          console.warn('Could not fetch live subscription, falling back to localDb:', e);
        }
      }
      // LocalDb path (also used as fallback when Supabase returns nothing)
      return localDb.getUserSubscription(user!.id);
    },
  });

  // Submit bKash / MFS payment
  const submitPayment = useMutation({
    mutationFn: async (input: {
      plan_id: string;
      amount: number;
      payment_method: 'BKASH' | 'NAGAD' | 'ROCKET';
      transaction_id: string;
      sender_number: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const planObj = plans.find((p) => p.id === input.plan_id);

      const newPayment: PaymentSubmission = {
        id: 'pay-' + Date.now(),
        user_id: user.id,
        plan_id: input.plan_id,
        amount: input.amount,
        currency: 'BDT',
        payment_method: input.payment_method,
        transaction_id: input.transaction_id.trim().toUpperCase(),
        sender_number: input.sender_number.trim(),
        status: 'PENDING',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        plan: planObj,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          avatar_url: user.avatar_url,
          currency: user.currency,
          locale: user.locale,
          theme: user.theme,
          role: user.role,
          created_at: user.created_at,
          updated_at: user.updated_at,
        },
      };

      // 1. Always record in localDb so it is immediately guaranteed and visible
      const list = localDb.getPayments();
      const filteredList = list.filter((p) => p.transaction_id !== newPayment.transaction_id);
      localDb.setPayments([newPayment, ...filteredList]);
      localDb.addAuditLog('PAYMENT_SUBMITTED', 'PAYMENT', newPayment.id, {
        trxId: newPayment.transaction_id,
        amount: newPayment.amount,
        user_email: user.email,
      });

      // 2. If live Supabase is connected, check for duplicate then insert
      if (isLiveSupabase) {
        try {
          // Guard against duplicate transaction IDs
          const { data: existing } = await supabase
            .from('payments')
            .select('id')
            .eq('transaction_id', newPayment.transaction_id)
            .maybeSingle();
          if (existing) {
            throw new Error(
              'This Transaction ID has already been submitted. Please check and try again.'
            );
          }

          const { data, error } = await supabase
            .from('payments')
            .insert({
              user_id: user.id,
              plan_id: input.plan_id,
              amount: input.amount,
              payment_method: input.payment_method,
              transaction_id: newPayment.transaction_id,
              sender_number: newPayment.sender_number,
              currency: 'BDT',
              status: 'PENDING',
            })
            .select()
            .single();
          if (error) {
            console.warn('Supabase payments insert warning (kept in local store):', error);
          } else if (data) {
            return { ...newPayment, id: data.id };
          }
        } catch (e: any) {
          // Re-throw duplicate TrxID errors so they surface to the user
          if (e?.message?.includes('Transaction ID')) throw e;
          console.warn('Supabase payments insert exception:', e);
        }
      }

      return newPayment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'payments'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'audit-logs'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      addToast({
        type: 'success',
        title: 'Payment TrxID Submitted',
        description: 'Our team is reviewing your transaction. You will be upgraded shortly!',
      });
    },
    onError: (err: any) => {
      addToast({ type: 'error', title: 'Payment Submission Failed', description: err.message });
    },
  });

  // Create Plan (Admin)
  const createPlan = useMutation({
    mutationFn: async (newPlanData: Omit<Plan, 'id' | 'created_at' | 'updated_at'>) => {
      if (isLiveSupabase) {
        const { data, error } = await supabase.from('plans').insert(newPlanData).select().single();
        if (error) throw error;
        return data as Plan;
      } else {
        const plans = localDb.getPlans();
        const plan: Plan = {
          ...newPlanData,
          id: 'plan-' + (newPlanData.slug || Date.now()),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        localDb.setPlans([plan, ...plans]);
        localDb.addAuditLog('PLAN_CREATED', 'PLAN', plan.id, {
          name: plan.name,
          price: plan.price,
        });
        return plan;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      addToast({
        type: 'success',
        title: 'Plan Created',
        description: 'New subscription tier has been published successfully.',
      });
    },
    onError: (err: any) => {
      addToast({ type: 'error', title: 'Plan Creation Failed', description: err.message });
    },
  });

  // Update Plan (Admin)
  const updatePlan = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Plan> & { id: string }) => {
      if (isLiveSupabase) {
        const { data, error } = await supabase
          .from('plans')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return data as Plan;
      } else {
        const plans = localDb.getPlans();
        const updated = plans.map((p) =>
          p.id === id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p
        );
        localDb.setPlans(updated);
        localDb.addAuditLog('PLAN_UPDATED', 'PLAN', id, { updates });
        return updated.find((p) => p.id === id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      addToast({
        type: 'success',
        title: 'Plan Updated',
        description: 'Subscription tier changes saved successfully.',
      });
    },
    onError: (err: any) => {
      addToast({ type: 'error', title: 'Plan Update Failed', description: err.message });
    },
  });

  // Delete Plan (Admin)
  const deletePlan = useMutation({
    mutationFn: async (id: string) => {
      if (isLiveSupabase) {
        const { error } = await supabase.from('plans').delete().eq('id', id);
        if (error) throw error;
      } else {
        const plans = localDb.getPlans();
        localDb.setPlans(plans.filter((p) => p.id !== id));
        localDb.addAuditLog('PLAN_DELETED', 'PLAN', id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      addToast({
        type: 'success',
        title: 'Plan Deleted',
        description: 'The subscription tier has been removed.',
      });
    },
    onError: (err: any) => {
      addToast({ type: 'error', title: 'Plan Deletion Failed', description: err.message });
    },
  });

  // Check if subscription has expired
  const isSubscriptionExpired = Boolean(
    subscription?.expires_at &&
    new Date(subscription.expires_at).getFullYear() < 2090 &&
    new Date(subscription.expires_at).getTime() < Date.now()
  );

  // Auto-sync status to EXPIRED in database when expired subscription is encountered
  useEffect(() => {
    if (isSubscriptionExpired && subscription?.id && subscription.status === 'ACTIVE') {
      if (isLiveSupabase) {
        supabase
          .from('subscriptions')
          .update({ status: 'EXPIRED', updated_at: new Date().toISOString() })
          .eq('id', subscription.id)
          .then(
            () => {
              queryClient.invalidateQueries({ queryKey: ['subscription', user?.id] });
              queryClient.invalidateQueries({ queryKey: ['admin', 'subscriptions'] });
            },
            (err: unknown) => {
              console.warn('Failed to mark subscription expired in Supabase:', err);
            }
          );
      } else {
        const subs = localDb.getSubscriptions();
        const updated = subs.map((s) =>
          s.id === subscription.id ? { ...s, status: 'EXPIRED' as const } : s
        );
        localDb.setSubscriptions(updated);
        queryClient.invalidateQueries({ queryKey: ['subscription', user?.id] });
        queryClient.invalidateQueries({ queryKey: ['admin', 'subscriptions'] });
      }
    }
  }, [isSubscriptionExpired, subscription?.id, subscription?.status, user?.id, queryClient]);

  const freePlan: Plan = plans.find((p) => p.slug === 'free') || INITIAL_PLANS[0];

  // If expired or free, user is on Free Starter
  const currentPlan: Plan = isSubscriptionExpired
    ? freePlan
    : subscription?.plan || plans.find((p) => p.id === subscription?.plan_id) || freePlan;

  const isPro = Boolean(
    subscription &&
    subscription.status === 'ACTIVE' &&
    !isSubscriptionExpired &&
    currentPlan.slug !== 'free'
  );

  const maxAccounts = isPro ? 99999 : (currentPlan.limits?.max_accounts ?? 3);
  const maxBudgets = isPro ? 99999 : (currentPlan.limits?.max_budgets ?? 5);
  const maxRecurring = isPro ? 99999 : 2;
  const maxLoans = isPro ? 99999 : 3;
  const canExportReports = isPro || Boolean(currentPlan.limits?.export_reports);
  const canUseMultiCurrency = isPro || Boolean(currentPlan.limits?.multi_currency);

  const canAddAccount = (currentCount: number) => isPro || currentCount < maxAccounts;
  const canAddBudget = (currentCount: number) => isPro || currentCount < maxBudgets;
  const canAddRecurring = (currentCount: number) => isPro || currentCount < maxRecurring;
  const canAddLoan = (currentCount: number) => isPro || currentCount < maxLoans;

  return {
    plans,
    subscription,
    currentPlan,
    limits: currentPlan.limits,
    maxAccounts,
    maxBudgets,
    maxRecurring,
    maxLoans,
    canExportReports,
    canUseMultiCurrency,
    isPro,
    canAddAccount,
    canAddBudget,
    canAddRecurring,
    canAddLoan,
    isLoading: isPlansLoading || isSubLoading,
    submitPayment,
    createPlan,
    updatePlan,
    deletePlan,
  };
}
