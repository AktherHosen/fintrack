import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, isLiveSupabase, localDb } from '../lib/supabase';
import { UserProfile } from '../types/database';
import { useUIStore } from '../stores/useUIStore';

export function useAuth() {
  const queryClient = useQueryClient();
  const addToast = useUIStore((state) => state.addToast);

  // Subscribe to Supabase auth changes
  useEffect(() => {
    if (!isLiveSupabase) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);

  const { data: user, isLoading } = useQuery<UserProfile | null>({
    queryKey: ['auth', 'user'],
    queryFn: async () => {
      if (isLiveSupabase) {
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError || !authData.user) return null;

        const { data: profile, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', authData.user.id)
          .single();

        if (error) {
          console.error('Profile fetch error:', error);
          return null;
        }
        return profile as UserProfile;
      } else {
        return localDb.getUser();
      }
    },
    staleTime: 1000 * 60 * 5,
  });

  const login = useMutation({
    mutationFn: async ({ email, password }: { email: string; password?: string }) => {
      if (isLiveSupabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password: password || '12345678',
        });
        if (error) throw error;
        return data.user;
      } else {
        // Mock login
        const existing = localDb.getUser() || {
          id: 'usr-1001-demo',
          email,
          full_name: email.split('@')[0],
          avatar_url: null,
          currency: 'BDT',
          locale: 'en',
          theme: 'dark',
          role: email.includes('admin') ? 'ADMIN' : 'USER',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        localDb.setUser(existing);
        localDb.addAuditLog('USER_LOGIN', 'AUTH', existing.id, { email });
        return existing;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      addToast({ type: 'success', title: 'Welcome Back!', description: 'Logged in successfully.' });
    },
    onError: (err: any) => {
      addToast({
        type: 'error',
        title: 'Login Failed',
        description: err.message || 'Invalid credentials',
      });
    },
  });

  const register = useMutation({
    mutationFn: async ({
      email,
      password,
      fullName,
    }: {
      email: string;
      password?: string;
      fullName: string;
    }) => {
      if (isLiveSupabase) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: password || '12345678',
          options: {
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        return data.user;
      } else {
        const newUser: UserProfile = {
          id: 'usr-' + Date.now(),
          email,
          full_name: fullName,
          avatar_url: null,
          currency: 'BDT',
          locale: 'en',
          theme: 'dark',
          role: email.includes('admin') ? 'ADMIN' : 'USER',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        localDb.setUser(newUser);
        localDb.addAuditLog('USER_REGISTER', 'AUTH', newUser.id, { email, fullName });
        return newUser;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      addToast({
        type: 'success',
        title: 'Account Created',
        description: 'Welcome to FinTrack !',
      });
    },
    onError: (err: any) => {
      addToast({
        type: 'error',
        title: 'Registration Failed',
        description: err.message || 'Could not sign up',
      });
    },
  });

  const logout = useMutation({
    mutationFn: async () => {
      if (isLiveSupabase) {
        await supabase.auth.signOut();
      } else {
        localDb.setUser(null);
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(['auth', 'user'], null);
      queryClient.clear();
      addToast({ type: 'info', title: 'Logged Out', description: 'You have been logged out.' });
    },
  });

  const updateProfile = useMutation({
    mutationFn: async (updated: Partial<UserProfile>) => {
      if (!user) throw new Error('Not authenticated');
      if (isLiveSupabase) {
        const { data, error } = await supabase
          .from('users')
          .update(updated)
          .eq('id', user.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const merged = { ...user, ...updated, updated_at: new Date().toISOString() };
        localDb.setUser(merged);
        return merged;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'user'] });
      addToast({
        type: 'success',
        title: 'Profile Updated',
        description: 'Preferences saved successfully.',
      });
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
    login,
    register,
    logout,
    updateProfile,
  };
}
