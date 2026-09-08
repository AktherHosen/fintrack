import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, isLiveSupabase, localDb } from '../lib/supabase';
import { Plan, Subscription, PaymentSubmission } from '../types/database';
import { useAuth } from './useAuth';
import { useUIStore } from '../stores/useUIStore';

export function useSubscriptions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const addToast = useUIStore((state) => state.addToast);

  // Plans
  const { data: plans = [], isLoading: isPlansLoading } = useQuery<Plan[]>({
    queryKey: ['plans'],
    queryFn: async () => {
      if (isLiveSupabase) {
        const { data, error } = await supabase.from('plans').select('*').eq('is_active', true).order('price');
        if (error) throw error;
        return data as Plan[];
      } else {
        return localDb.getPlans();
      }
    },
  });

  // Current User Subscription
  const { data: subscription, isLoading: isSubLoading } = useQuery<Subscription | null>({
    queryKey: ['subscription', user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (isLiveSupabase) {
        const { data, error } = await supabase
          .from('subscriptions')
          .select('*, plan:plans(*)')
          .eq('user_id', user!.id)
          .eq('status', 'ACTIVE')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        if (error) return null;
        return data as Subscription;
      } else {
        return localDb.getSubscription();
      }
    },
  });

  // Submit bKash / MFS payment
  const submitPayment = useMutation({
    mutationFn: async (input: { plan_id: string; amount: number; payment_method: 'BKASH' | 'NAGAD' | 'ROCKET'; transaction_id: string; sender_number: string }) => {
      if (!user) throw new Error('Not authenticated');
      if (isLiveSupabase) {
        const { data, error } = await supabase.from('payments').insert({
          user_id: user.id,
          ...input,
          currency: 'BDT',
          status: 'PENDING',
        }).select().single();
        if (error) throw error;
        return data;
      } else {
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
          plan: plans.find((p) => p.id === input.plan_id),
          user: user,
        };
        const list = localDb.getPayments();
        localDb.setPayments([newPayment, ...list]);
        localDb.addAuditLog('PAYMENT_SUBMITTED', 'PAYMENT', newPayment.id, { trxId: newPayment.transaction_id, amount: newPayment.amount });
        return newPayment;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
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
        localDb.addAuditLog('PLAN_CREATED', 'PLAN', plan.id, { name: plan.name, price: plan.price });
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
        const { data, error } = await supabase.from('plans').update(updates).eq('id', id).select().single();
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

  const isPro = subscription && subscription.status === 'ACTIVE' && subscription.plan?.slug !== 'free';

  return {
    plans,
    subscription,
    isPro,
    isLoading: isPlansLoading || isSubLoading,
    submitPayment,
    createPlan,
    updatePlan,
    deletePlan,
  };
}
