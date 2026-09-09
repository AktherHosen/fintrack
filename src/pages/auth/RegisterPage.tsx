import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-react';

export function RegisterPage() {
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
    <div className="space-y-5">
      <div>
        <h3 className="text-xl font-bold tracking-tight text-zinc-100">Create Account</h3>
        <p className="text-xs text-zinc-400 mt-1">
          Start managing your personal finances with modern tools and Pro analytics.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        <div>
          <Label className="text-xs font-semibold text-zinc-300">Full Name</Label>
          <div className="relative mt-1.5">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
            <Input
              type="text"
              required
              className="pl-10 h-10 text-xs bg-zinc-950/60 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-indigo-500"
              placeholder="e.g. John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
        </div>

        <div>
          <Label className="text-xs font-semibold text-zinc-300">Email Address</Label>
          <div className="relative mt-1.5">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
            <Input
              type="email"
              required
              className="pl-10 h-10 text-xs bg-zinc-950/60 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-indigo-500"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div>
          <Label className="text-xs font-semibold text-zinc-300">Password</Label>
          <div className="relative mt-1.5">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
            <Input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={6}
              className="pl-10 pr-10 h-10 text-xs bg-zinc-950/60 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-zinc-400"
              placeholder="Minimum 6 characters"
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

        <div className="flex items-center gap-2 pt-1 text-[11px] text-zinc-400">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
          <span>Your data is end-to-end encrypted & private</span>
        </div>

        <Button
          type="submit"
          variant="default"
          className="w-full h-9 text-xs font-semibold mt-2 cursor-pointer"
          disabled={register.isPending}
        >
          {register.isPending ? 'Creating Account...' : 'Create Account'}
        </Button>
      </form>

      <div className="pt-2 text-center text-xs text-zinc-400">
        Already have an account?{' '}
        <Link
          to="/login"
          className="font-medium text-zinc-200 hover:text-white hover:underline transition-colors"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
