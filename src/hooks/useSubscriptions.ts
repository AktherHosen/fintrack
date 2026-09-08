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

  const isPro = subscription && subscription.status === 'ACTIVE' && subscription.plan?.slug !== 'free';

  return {
    plans,
    subscription,
    isPro,
    isLoading: isPlansLoading || isSubLoading,
    submitPayment,
  };
}
