import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from '../../components/ui/sonner';

export function LoginPage() {
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

  return (
    <div className="space-y-3">
      <div className="text-center">
        <h3 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Welcome Back</h3>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
          Enter your credentials to access your financial dashboard.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 pt-0.5">
        <div>
          <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Email Address</Label>
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
            <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Password</Label>
            <a
              href="#forgot"
              onClick={(e) => {
                e.preventDefault();
                toast.info('Password Reset', {
                  description: 'Please contact your administrator or support to reset your password.',
                });
              }}
              className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors"
            >
              Forgot password?
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
          {login.isPending ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>

      <div className="pt-1 text-center text-xs text-zinc-500 dark:text-zinc-400">
        Don't have an account?{' '}
        <Link
          to="/register"
          className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 hover:underline transition-colors"
        >
          Create account
        </Link>
      </div>
    </div>
  );
}
