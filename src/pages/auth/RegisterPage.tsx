import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';

export function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    register.mutate(
      { email: email.trim(), password, fullName: fullName.trim() },
      {
        onSuccess: () => navigate('/'),
      }
    );
  };

  return (
    <div className="space-y-3">
      <div className="text-center">
        <h3 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          {t('auth.create_account', 'Create Account')}
        </h3>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
          {t('auth.create_account_desc', 'Start tracking with smart personal finance tools.')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 pt-0.5">
        <div>
          <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            {t('auth.full_name', 'Full Name')}
          </Label>
          <div className="relative mt-1">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
            <Input
              type="text"
              required
              className="pl-9 h-8.5 text-xs bg-white dark:bg-zinc-950/60 border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus-visible:ring-zinc-400"
              placeholder="e.g. John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
        </div>

        <div>
          <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            {t('auth.email_address', 'Email Address')}
          </Label>
          <div className="relative mt-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
            <Input
              type="email"
              required
              className="pl-9 h-8.5 text-xs bg-white dark:bg-zinc-950/60 border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus-visible:ring-zinc-400"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div>
          <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            {t('auth.password', 'Password')}
          </Label>
          <div className="relative mt-1">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
            <Input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={6}
              className="pl-9 pr-9 h-8.5 text-xs bg-white dark:bg-zinc-950/60 border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus-visible:ring-zinc-400"
              placeholder={t('auth.password_placeholder', 'Minimum 6 characters')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 cursor-pointer p-0.5"
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          variant="default"
          className="w-full h-8.5 text-xs font-semibold mt-1 cursor-pointer"
          disabled={register.isPending}
        >
          {register.isPending ? t('auth.creating_account', 'Creating account...') : t('auth.create_account', 'Create Account')}
        </Button>
      </form>

      <div className="pt-1 text-center text-xs text-zinc-500 dark:text-zinc-400">
        {t('auth.already_have_account', 'Already have an account?')}{' '}
        <Link
          to="/login"
          className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 hover:underline transition-colors"
        >
          {t('auth.sign_in_link', 'Sign in')}
        </Link>
      </div>
    </div>
  );
}
