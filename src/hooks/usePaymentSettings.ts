import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, isLiveSupabase, localDb } from '../lib/supabase';
import { PaymentSettings } from '../types/database';
import { INITIAL_PAYMENT_SETTINGS } from '../lib/mockData';
import { useUIStore } from '../stores/useUIStore';

export function usePaymentSettings() {
  const queryClient = useQueryClient();
  const addToast = useUIStore((state) => state.addToast);

  const { data: settings = INITIAL_PAYMENT_SETTINGS, isLoading } = useQuery<PaymentSettings>({
    queryKey: ['payment-settings'],
    queryFn: async () => {
      if (isLiveSupabase) {
        const { data, error } = await supabase
          .from('system_settings')
          .select('value')
          .eq('key', 'payment_settings')
          .maybeSingle();

        if (error) {
          console.warn('Could not fetch remote payment settings, falling back to local.', error);
          return localDb.getPaymentSettings();
        }

        if (data?.value) {
          return data.value as PaymentSettings;
        }
      }
      return localDb.getPaymentSettings();
    },
  });

  const updatePaymentSettings = useMutation({
    mutationFn: async (newSettings: Partial<PaymentSettings>) => {
      const merged: PaymentSettings = {
        ...settings,
        ...newSettings,
        updated_at: new Date().toISOString(),
      };

      if (isLiveSupabase) {
        const { error } = await supabase
          .from('system_settings')
          .upsert({
            key: 'payment_settings',
            value: merged,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'key' });

        if (error) {
          console.warn('Remote sync failed, updating local database.', error);
        }
      }

      localDb.setPaymentSettings(merged);
      localDb.addAuditLog('PAYMENT_SETTINGS_UPDATED', 'SYSTEM_SETTINGS', undefined, {
        bkash_number: merged.bkash_number,
        nagad_number: merged.nagad_number,
        rocket_number: merged.rocket_number,
      });

      return merged;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-settings'] });
      addToast({
        type: 'success',
        title: 'Payment Settings Saved',
        description: 'Updated wallet numbers and instructions are now live in payment modals.',
      });
    },
    onError: (err: any) => {
      addToast({
        type: 'error',
        title: 'Update Failed',
        description: err.message || 'Could not save payment settings.',
      });
    },
  });

  return {
    settings,
    isLoading,
    updatePaymentSettings,
  };
}
