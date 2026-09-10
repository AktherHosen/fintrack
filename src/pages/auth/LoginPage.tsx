import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Mail, Lock, Eye, EyeOff, KeyRound } from 'lucide-react';
import { toast } from '../../components/ui/sonner';

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    login.mutate(
      { email: email.trim(), password },
      {
        onSuccess: () => navigate('/'),
      }
    );
  };

  const handleProQuickFill = () => {
    setEmail('demo@fintrack.app');
    setPassword('123456');
    toast.success(t('auth.demo_loaded', 'Demo account credentials loaded'), {
      description: 'demo@fintrack.app / 123456',
    });
  };

  return (
    <div className="space-y-3">
      <div className="text-center">
        <h3 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          {t('auth.welcome_back', 'Welcome Back')}
        </h3>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
          {t(
            'auth.welcome_back_desc',
            'Enter your credentials to access your financial dashboard.'
          )}
        </p>
      </div>

      {/* Demo Tester Quick Fill Card */}
      <div className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100/70 dark:bg-zinc-950/60 flex items-center justify-between gap-2.5 shadow-xs">
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          <div className="h-7 w-7 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
            <KeyRound className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                {t('auth.demo_account', 'Demo Tester Account')}
              </span>
              <Badge variant="indigo" className="text-[9px] py-0 h-3.5 px-1 font-mono">
                PRO
              </Badge>
            </div>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate font-mono">
              demo@fintrack.app
            </p>
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={handleProQuickFill}
          className="text-[11px] h-6 px-2.5 font-medium shrink-0 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-800"
        >
          {t('auth.autofill', 'Auto-fill')}
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 pt-0.5">
        <div>
          <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            {t('auth.email_address', 'Email Address')}
          </Label>
          <div className="relative mt-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
            <Input
              type="email"
              required
              className="pl-9 h-8.5 text-xs bg-white dark:bg-zinc-950/60 border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus-visible:ring-zinc-400"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              {t('auth.password', 'Password')}
            </Label>
            <a
              href="#forgot"
              onClick={(e) => {
                e.preventDefault();
                toast.info('Password Reset', {
                  description:
                    'Please contact your administrator or support to reset your password.',
                });
              }}
              className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors"
            >
              {t('auth.forgot_password', 'Forgot password?')}
            </a>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
            <Input
              type={showPassword ? 'text' : 'password'}
              required
              className="pl-9 pr-9 h-8.5 text-xs bg-white dark:bg-zinc-950/60 border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus-visible:ring-zinc-400"
              placeholder="••••••••"
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
          disabled={login.isPending}
        >
          {login.isPending ? t('auth.signing_in', 'Signing in...') : t('auth.sign_in', 'Sign In')}
        </Button>
      </form>

      <div className="pt-1 text-center text-xs text-zinc-500 dark:text-zinc-400">
        {t('auth.no_account', "Don't have an account?")}{' '}
        <Link
          to="/register"
          className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 hover:underline transition-colors"
        >
          {t('auth.create_account_link', 'Create account')}
        </Link>
      </div>
    </div>
  );
}
