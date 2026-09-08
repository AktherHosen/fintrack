import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Mail, Lock, ArrowRight, ShieldCheck } from 'lucide-react';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('demo@fintrack.app');
  const [password, setPassword] = useState('12345678');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate(
      { email, password },
      {
        onSuccess: () => navigate('/'),
      }
    );
  };

  const handleAdminQuickFill = () => {
    setEmail('admin@fintrack.app');
    setPassword('admin123');
  };

  return (
    <div>
      <h3 className="text-xl font-bold text-white mb-1">Welcome Back</h3>
      <p className="text-xs text-slate-400 mb-6">Enter your credentials to access your financial dashboard.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Email Address</Label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
            <Input
              type="email"
              required
              className="pl-10"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <Label>Password</Label>
            <a href="#forgot" onClick={(e) => { e.preventDefault(); alert("Use demo password '12345678'"); }} className="text-xs text-emerald-400 hover:underline">
              Forgot password?
            </a>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
            <Input
              type="password"
              required
              className="pl-10"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        <Button
          type="submit"
          variant="gradient"
          size="lg"
          className="w-full mt-2"
          disabled={login.isPending}
        >
          {login.isPending ? 'Authenticating...' : 'Sign In to FinTrack'}
        </Button>
      </form>

      {/* Quick Demo Credentials Helper */}
      <div className="mt-6 pt-4 border-t border-slate-800 text-center">
        <p className="text-xs text-slate-400 mb-2">Want to test with full Admin privileges?</p>
        <button
          type="button"
          onClick={handleAdminQuickFill}
          className="text-xs font-bold text-amber-400 hover:text-amber-300 underline"
        >
          Auto-fill Admin Account (admin@fintrack.app)
        </button>
      </div>

      <div className="mt-6 text-center text-xs text-slate-400">
        Don't have an account?{' '}
        <Link to="/register" className="font-bold text-emerald-400 hover:underline">
          Create one now
        </Link>
      </div>
    </div>
  );
}
