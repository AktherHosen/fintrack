import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase, isLiveSupabase, localDb } from '../lib/supabase';
import { UserProfile, Subscription } from '../types/database';
import { useUIStore } from '../stores/useUIStore';
import { queryClient } from '../lib/queryClient';

// Initialize single global auth state listener
if (isLiveSupabase) {
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    }
  });
}

export function useAuth() {
  const addToast = useUIStore((state) => state.addToast);

  const { data: user, isLoading } = useQuery<UserProfile | null>({
    queryKey: ['auth', 'user'],
    queryFn: async () => {
      if (isLiveSupabase) {
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError || !authData.user) {
          localDb.setUser(null);
          return null;
        }

        const { data: profile, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', authData.user.id)
          .single();

        if (error) {
          console.error('Profile fetch error:', error);
          localDb.setUser(null);
          return null;
        }
        localDb.setUser(profile as UserProfile);
        return profile as UserProfile;
      } else {
        return localDb.getUser();
      }
    },
    initialData: () => localDb.getUser(),
    staleTime: 1000 * 60 * 15, // 15 minutes cache
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const login = useMutation({
    mutationFn: async ({ email, password }: { email: string; password?: string }) => {
      if (isLiveSupabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password: password || '123456',
        });
        if (error) throw error;
        return data.user;
      } else {
        // Mock login
        const existingUsers = localDb.getUsers();
        let existing = existingUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
        if (!existing) {
          existing = {
            id: 'usr-' + Date.now(),
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
          localDb.setUsers([existing, ...existingUsers]);
        }
        localDb.setUser(existing);
        localDb.addAuditLog('USER_LOGIN', 'AUTH', existing.id, { email });
        return existing;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'audit-logs'] });
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
          password: password || '123456',
          options: {
            data: { full_name: fullName },
          },
        });
        if (error) throw error;

        // Create 7-day Pro trial subscription
        if (data.user) {
          let proPlan = null;
          try {
            const { data: plans } = await supabase.from('plans').select('*').eq('slug', 'pro-monthly').limit(1).single();
            proPlan = plans;
          } catch {
            // Fallback: find first non-free plan from localDb
            const localPlans = localDb.getPlans();
            proPlan = localPlans.find((p) => p.slug === 'pro-monthly') || localPlans.find((p) => p.slug !== 'free');
          }
          if (proPlan) {
            const trialSub = {
              id: crypto.randomUUID(),
              user_id: data.user.id,
              plan_id: proPlan.id,
              status: 'ACTIVE' as const,
              starts_at: new Date().toISOString(),
              expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              auto_renew: false,
              created_at: new Date().toISOString(),
            };
            localDb.setSubscription({ ...trialSub, plan: proPlan });
            try {
              await supabase.from('subscriptions').insert(trialSub);
            } catch (e) {
              console.warn('Failed to create trial subscription in Supabase:', e);
            }
          }
        }

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
        const users = localDb.getUsers();
        const existingIdx = users.findIndex((u) => u.email.toLowerCase() === email.toLowerCase());
        if (existingIdx >= 0) {
          users[existingIdx] = newUser;
          localDb.setUsers([...users]);
        } else {
          localDb.setUsers([newUser, ...users]);
        }

        // Create 7-day Pro trial subscription
        const plans = localDb.getPlans();
        const proPlan = plans.find((p) => p.slug === 'pro-monthly') || plans.find((p) => p.slug !== 'free');
        if (proPlan) {
          const trialSub: Subscription = {
            id: crypto.randomUUID(),
            user_id: newUser.id,
            plan_id: proPlan.id,
            status: 'ACTIVE',
            starts_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            auto_renew: false,
            created_at: new Date().toISOString(),
            plan: proPlan,
          };
          localDb.setSubscription(trialSub);
        }

        localDb.addAuditLog('USER_REGISTER', 'AUTH', newUser.id, { email });
        return newUser;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'audit-logs'] });
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      addToast({
        type: 'success',
        title: 'Account Created',
        description: 'Welcome to FinTrack! You have 7 days of Pro features.',
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
      try {
        if (isLiveSupabase) {
          await supabase.auth.signOut();
        }
      } catch (e) {
        console.error('Sign out error:', e);
      } finally {
        localDb.setUser(null);
        localStorage.removeItem('fintrack_user');
        // Clear any stored Supabase session tokens from localStorage
        try {
          const keysToRemove: string[] = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith('sb-') || key.includes('supabase.auth.token'))) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach((k) => localStorage.removeItem(k));
        } catch {
          // Ignore
        }
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(['auth', 'user'], null);
      queryClient.removeQueries({ queryKey: ['auth'] });
      addToast({ type: 'info', title: 'Logged Out', description: 'You have been logged out.' });
      window.location.replace('/login');
    },
    onError: () => {
      localDb.setUser(null);
      localStorage.removeItem('fintrack_user');
      queryClient.setQueryData(['auth', 'user'], null);
      window.location.replace('/login');
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
        const users = localDb.getUsers().map((u) => (u.id === merged.id ? merged : u));
        localDb.setUsers(users);
        return merged;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'user'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
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
