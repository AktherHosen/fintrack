import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { supabase, isLiveSupabase, localDb } from '../lib/supabase';
import { useUIStore } from '../stores/useUIStore';
import { queryClient } from '../lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { User, Camera, Save, Loader2, Lock } from 'lucide-react';

export function ProfilePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { addToast } = useUIStore();
  const fileRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      addToast({ type: 'error', title: 'Image too large', description: 'Max 2MB.' });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatarUrl(ev.target?.result as string);
      setHasChanges(true);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);

    try {
      const updates = {
        full_name: fullName.trim() || null,
        avatar_url: avatarUrl || null,
        updated_at: new Date().toISOString(),
      };

      if (isLiveSupabase) {
        const { error } = await supabase.from('users').update(updates).eq('id', user.id);
        if (error) throw error;
      }

      const updatedUser = { ...user, ...updates };
      localDb.setUser(updatedUser);

      const users = localDb.getUsers();
      const idx = users.findIndex((u) => u.id === user.id);
      if (idx >= 0) {
        users[idx] = updatedUser;
        localDb.setUsers(users);
      }

      queryClient.invalidateQueries({ queryKey: ['auth'] });
      setHasChanges(false);

      addToast({
        type: 'success',
        title: t('profile.profile_updated', 'Profile Updated'),
        description: t('profile.profile_updated_desc', 'Your profile has been saved.'),
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: t('profile.update_failed', 'Update Failed'),
        description: err.message || 'Could not save profile.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!user) return;

    if (newPassword.length < 6) {
      addToast({
        type: 'error',
        title: t('profile.password_too_short', 'Password must be at least 6 characters'),
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      addToast({
        type: 'error',
        title: t('profile.passwords_not_match', 'Passwords do not match'),
      });
      return;
    }

    setIsChangingPassword(true);

    try {
      if (isLiveSupabase) {
        const { error } = await supabase.auth.updateUser({
          password: newPassword,
        });
        if (error) throw error;
      } else {
        // For local mode, just show success (no real auth to update)
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      addToast({
        type: 'success',
        title: t('profile.password_changed', 'Password Changed'),
        description: t(
          'profile.password_changed_desc',
          'Your password has been updated successfully.'
        ),
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: t('profile.password_change_failed', 'Password Change Failed'),
        description:
          err.message ||
          t(
            'profile.password_change_failed_desc',
            'Could not update password. Please check your current password.'
          ),
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
          {t('profile.title', 'Profile')}
        </h2>
        <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          {t('profile.subtitle', 'Manage your personal information and avatar')}
        </p>
      </div>

      {/* Personal Info Card */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-sm">
            {t('profile.personal_info', 'Personal Information')}
          </CardTitle>
          <CardDescription className="text-[11px]">
            {t('profile.personal_info_desc', 'Update your name and profile picture')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Avatar Section */}
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Avatar className="h-20 w-20 border-2 border-zinc-200 dark:border-zinc-700">
                <AvatarImage src={avatarUrl} alt={fullName || 'User'} className="object-cover" />
                <AvatarFallback className="text-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                  {getInitials(fullName)}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <Camera className="h-5 w-5 text-white" />
              </button>
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                {t('profile.profile_picture', 'Profile Picture')}
              </p>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                {t('profile.avatar_hint', 'JPG, PNG or GIF. Max 2MB. Click avatar to change.')}
              </p>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Name Field */}
          <div className="space-y-1.5">
            <Label className="text-xs">{t('profile.full_name', 'Full Name')}</Label>
            <Input
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                setHasChanges(true);
              }}
              placeholder={t('profile.name_placeholder', 'Enter your full name')}
              className="h-9 text-sm"
            />
          </div>

          {/* Email (Read-only) */}
          <div className="space-y-1.5">
            <Label className="text-xs">{t('profile.email', 'Email')}</Label>
            <Input
              value={user?.email || ''}
              disabled
              className="h-9 text-sm bg-zinc-50 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400"
            />
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
              {t('profile.email_hint', 'Email cannot be changed')}
            </p>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className="h-9 text-xs px-4 gap-1.5"
            >
              {isSaving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              {t('profile.save_changes', 'Save Changes')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Change Password Card */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <Lock className="h-4 w-4 text-zinc-500" />
            {t('profile.change_password', 'Change Password')}
          </CardTitle>
          <CardDescription className="text-[11px]">
            {t('profile.change_password_desc', 'Update your account password for security')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">{t('profile.new_password', 'New Password')}</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={t('profile.password_placeholder', 'Enter new password')}
              className="h-9 text-sm"
            />
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
              {t('profile.password_min_hint', 'Minimum 6 characters')}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">
              {t('profile.confirm_password', 'Confirm New Password')}
            </Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t('profile.password_placeholder', 'Enter new password')}
              className="h-9 text-sm"
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button
              onClick={handlePasswordChange}
              disabled={!newPassword || !confirmPassword || isChangingPassword}
              variant="outline"
              className="h-9 text-xs px-4 gap-1.5"
            >
              {isChangingPassword ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Lock className="h-3.5 w-3.5" />
              )}
              {t('profile.update_password', 'Update Password')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
