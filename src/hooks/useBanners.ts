import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, isLiveSupabase, localDb } from '../lib/supabase';
import { Banner, BannerPosition } from '../types/database';
import { useAuth } from './useAuth';
import { isWithinDays } from '../lib/utils';
import { useUIStore } from '../stores/useUIStore';

export function useBanners(position: BannerPosition = 'DASHBOARD') {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const addToast = useUIStore((state) => state.addToast);

  const { data: allBanners = [], isLoading } = useQuery<Banner[]>({
    queryKey: ['banners', position],
    queryFn: async () => {
      if (isLiveSupabase) {
        const { data, error } = await supabase
          .from('banners')
          .select('*')
          .eq('is_active', true)
          .eq('position', position)
          .order('priority', { ascending: false });
        if (error) throw error;
        return data as Banner[];
      } else {
        return localDb
          .getBanners()
          .filter((b) => b.is_active && (b.position === position || b.position === 'ALL_PAGES'));
      }
    },
  });

  // Client-side audience filtering & dismissal memory check (7-day dismiss window)
  const activeBanners = allBanners.filter((banner) => {
    // 1. Check expiration / start date
    if (banner.expires_at && new Date(banner.expires_at) < new Date()) return false;
    if (banner.starts_at && new Date(banner.starts_at) > new Date()) return false;

    // 2. Check 7-day dismissal in localStorage
    const dismissedAt = localStorage.getItem(`fintrack_banner_dismissed_${banner.id}`);
    if (dismissedAt) {
      const dismissedDays = (Date.now() - Number(dismissedAt)) / (1000 * 60 * 60 * 24);
      if (dismissedDays < 7) return false;
    }

    // 3. Target Audience Logic
    const subscription = localDb.getSubscription();
    const isPro =
      subscription && subscription.status === 'ACTIVE' && subscription.plan?.slug !== 'free';

    switch (banner.target_audience) {
      case 'ALL':
        return true;
      case 'FREE_USERS':
        return !isPro;
      case 'PRO_USERS':
        return isPro;
      case 'NEW_USERS':
        return user ? isWithinDays(user.created_at, 7) : true;
      case 'EXPIRING_SOON':
        return subscription?.expires_at ? isWithinDays(subscription.expires_at, 3) : false;
      default:
        return true;
    }
  });

  // Record impression
  const recordImpression = useMutation({
    mutationFn: async (bannerId: string) => {
      if (isLiveSupabase) {
        await supabase.from('banner_events').insert({
          banner_id: bannerId,
          user_id: user?.id || null,
          event_type: 'IMPRESSION',
        });
      } else {
        const banners = localDb.getBanners();
        const next = banners.map((b) =>
          b.id === bannerId ? { ...b, impression_count: (b.impression_count || 0) + 1 } : b
        );
        localDb.setBanners(next);
      }
    },
  });

  // Record click
  const recordClick = useMutation({
    mutationFn: async (bannerId: string) => {
      if (isLiveSupabase) {
        await supabase.from('banner_events').insert({
          banner_id: bannerId,
          user_id: user?.id || null,
          event_type: 'CLICK',
        });
      } else {
        const banners = localDb.getBanners();
        const next = banners.map((b) =>
          b.id === bannerId ? { ...b, click_count: (b.click_count || 0) + 1 } : b
        );
        localDb.setBanners(next);
      }
    },
  });

  // Dismiss banner
  const dismissBanner = (bannerId: string) => {
    localStorage.setItem(`fintrack_banner_dismissed_${bannerId}`, Date.now().toString());
    queryClient.invalidateQueries({ queryKey: ['banners'] });
  };

  // Admin banner CRUD
  const createBanner = useMutation({
    mutationFn: async (
      input: Omit<Banner, 'id' | 'created_at' | 'updated_at' | 'impression_count' | 'click_count'>
    ) => {
      if (isLiveSupabase) {
        const { data, error } = await supabase.from('banners').insert(input).select().single();
        if (error) throw error;
        return data;
      } else {
        const newBanner: Banner = {
          ...input,
          id: 'bnr-' + Date.now(),
          impression_count: 0,
          click_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        const list = localDb.getBanners();
        localDb.setBanners([newBanner, ...list]);
        localDb.addAuditLog('CREATE_BANNER', 'BANNER', newBanner.id, { title: newBanner.title });
        return newBanner;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banners'] });
      addToast({
        type: 'success',
        title: 'Banner Campaign Created',
        description: 'Banner is now active.',
      });
    },
  });

  const updateBanner = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Banner> & { id: string }) => {
      if (isLiveSupabase) {
        const { data, error } = await supabase
          .from('banners')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const list = localDb.getBanners();
        const next = list.map((b) =>
          b.id === id ? { ...b, ...updates, updated_at: new Date().toISOString() } : b
        );
        localDb.setBanners(next);
        localDb.addAuditLog('UPDATE_BANNER', 'BANNER', id, updates);
        return next.find((b) => b.id === id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banners'] });
      addToast({ type: 'success', title: 'Banner Updated', description: 'Changes published.' });
    },
  });

  const deleteBanner = useMutation({
    mutationFn: async (id: string) => {
      if (isLiveSupabase) {
        const { error } = await supabase.from('banners').delete().eq('id', id);
        if (error) throw error;
      } else {
        const list = localDb.getBanners();
        localDb.setBanners(list.filter((b) => b.id !== id));
        localDb.addAuditLog('DELETE_BANNER', 'BANNER', id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banners'] });
      addToast({ type: 'info', title: 'Banner Removed', description: 'Promotion archived.' });
    },
  });

  return {
    banners: activeBanners,
    allBanners,
    isLoading,
    recordImpression,
    recordClick,
    dismissBanner,
    createBanner,
    updateBanner,
    deleteBanner,
  };
}
