import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Mail, Lock, Sparkles, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { toast } from '../../components/ui/sonner';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('demo@fintrack.app');
  const [password, setPassword] = useState('12345678');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate(
      { email: email.trim(), password },
      {
        onSuccess: () => navigate('/'),
      }
    );
  };

  const handleProQuickFill = () => {
    setEmail('demo@fintrack.app');
    setPassword('12345678');
    toast.success('Pro Demo Account Loaded', {
      description: 'Credentials autofilled: demo@fintrack.app (FinTrack Pro)',
    });
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-xl font-bold tracking-tight text-zinc-100">Welcome Back</h3>
        <p className="text-xs text-zinc-400 mt-1">
          Enter your credentials to access your financial dashboard.
        </p>
      </div>

      {/* Pro Demo Quick Fill Card */}
      <div className="p-3 rounded-xl border border-zinc-800 bg-zinc-950/60 flex items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5 min-w-0 flex-1">
          <div className="h-8 w-8 rounded-lg bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-300 shrink-0">
            <Sparkles className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-zinc-200 truncate">Pro Demo Account</span>
              <Badge variant="indigo" className="text-[9px] py-0 h-3.5 px-1 font-mono">
                PRO
              </Badge>
            </div>
            <p className="text-[11px] text-zinc-400 truncate font-mono">demo@fintrack.app</p>
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={handleProQuickFill}
          className="text-xs h-7 px-2.5 font-medium shrink-0 cursor-pointer"
        >
          Auto-fill
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        <div>
          <Label className="text-xs font-semibold text-zinc-300">Email Address</Label>
          <div className="relative mt-1.5">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
            <Input
              type="email"
              required
              className="pl-10 h-10 text-xs bg-zinc-950/60 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-zinc-400"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <Label className="text-xs font-semibold text-zinc-300">Password</Label>
            <a
              href="#forgot"
              onClick={(e) => {
                e.preventDefault();
                toast.info('Demo Credentials Hint', {
                  description: "For testing, use demo password '12345678'",
                });
              }}
              className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Forgot password?
            </a>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
            <Input
              type={showPassword ? 'text' : 'password'}
              required
              className="pl-10 pr-10 h-10 text-xs bg-zinc-950/60 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-zinc-400"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 cursor-pointer p-1"
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          variant="default"
          className="w-full h-9 text-xs font-semibold mt-2 cursor-pointer"
          disabled={login.isPending}
        >
          {login.isPending ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>

      <div className="pt-2 text-center text-xs text-zinc-400">
        Don't have an account?{' '}
        <Link
          to="/register"
          className="font-medium text-zinc-200 hover:text-white hover:underline transition-colors"
        >
          Create one now
        </Link>
      </div>
    </div>
  );
}
