import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Sparkles, ShieldCheck, Zap, Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '../../stores/useUIStore';
import { useAuth } from '../../hooks/useAuth';
import { ToastContainer } from '../ui/toast-container';

export function AuthLayout() {
  const { t, i18n } = useTranslation();
  const { locale, setLocale } = useUIStore();
  const { isAuthenticated, isLoading } = useAuth();

  const handleLangToggle = () => {
    const next = locale === 'en' ? 'bn' : 'en';
    setLocale(next);
    i18n.changeLanguage(next);
  };

  if (!isLoading && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-indigo-500 selection:text-white">
      {/* Background Decorative Gradient Orbs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Language Toggle */}
      <div className="absolute top-6 right-6 z-20 flex items-center gap-3">
        <button
          onClick={handleLangToggle}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/80 text-xs font-semibold text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors"
        >
          <Languages className="h-3.5 w-3.5 text-indigo-400" />
          <span className="uppercase">{locale}</span>
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="flex justify-center mb-4">
          <div className="h-12 w-12 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <Sparkles className="h-6 w-6 text-white font-bold" />
          </div>
        </div>
        <h2 className="text-center text-2xl font-bold tracking-tight text-zinc-100">
          FinTrack <span className="text-indigo-400"></span>
        </h2>
        <p className="mt-1.5 text-center text-xs text-zinc-400">
          Smart Wealth, Debt, Budget & Expense Management
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0 relative z-10">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/90 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
          <Outlet />
        </div>

        {/* Security / Trust Badge */}
        <div className="mt-6 flex items-center justify-center gap-4 text-xs text-zinc-500">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-zinc-400" />
            256-Bit SSL Encrypted
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <Zap className="h-4 w-4 text-amber-400" />
            Supabase RLS Protected
          </span>
        </div>
      </div>

      <ToastContainer />
    </div>
  );
}
