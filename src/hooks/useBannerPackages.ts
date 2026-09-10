import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, isLiveSupabase, localDb } from '../lib/supabase';
import { useUIStore } from '../stores/useUIStore';

export interface BannerPackage {
  id: string;
  days: number;
  price: number;
  label: string;
}

const DEFAULT_PACKAGES: BannerPackage[] = [
  { id: 'pkg-3', days: 3, price: 500, label: '3 Days' },
  { id: 'pkg-7', days: 7, price: 1000, label: '7 Days' },
  { id: 'pkg-15', days: 15, price: 2000, label: '15 Days' },
  { id: 'pkg-30', days: 30, price: 3500, label: '30 Days' },
];

export function useBannerPackages() {
  const queryClient = useQueryClient();
  const addToast = useUIStore((state) => state.addToast);

  const { data: packages = DEFAULT_PACKAGES, isLoading } = useQuery<BannerPackage[]>({
    queryKey: ['banner-packages'],
    queryFn: async () => {
      if (isLiveSupabase) {
        try {
          const { data, error } = await supabase
            .from('system_settings')
            .select('value')
            .eq('key', 'banner_packages')
            .maybeSingle();

          if (error) return localDb.getBannerPackages();
          if (data?.value) return data.value as BannerPackage[];
        } catch {
          return localDb.getBannerPackages();
        }
      }
      return localDb.getBannerPackages();
    },
    staleTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const updatePackages = useMutation({
    mutationFn: async (newPackages: BannerPackage[]) => {
      if (isLiveSupabase) {
        try {
          await supabase.from('system_settings').upsert(
            {
              key: 'banner_packages',
              value: newPackages,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'key' }
          );
        } catch {
          // Silent local fallback
        }
      }

      localDb.setBannerPackages(newPackages);
      localDb.addAuditLog('BANNER_PACKAGES_UPDATED', 'SYSTEM_SETTINGS', undefined, {
        count: newPackages.length,
      });

      return newPackages;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banner-packages'] });
      addToast({
        type: 'success',
        title: 'Packages Updated',
        description: 'Banner promotion packages are now live.',
      });
    },
  });

  return { packages, isLoading, updatePackages };
}
