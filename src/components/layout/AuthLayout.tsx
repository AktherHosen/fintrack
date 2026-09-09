import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { ShieldCheck, Zap, Languages, Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '../../stores/useUIStore';
import { useAuth } from '../../hooks/useAuth';
import { Toaster } from '../ui/sonner';
import { LogoIcon } from '../ui/Logo';

export function AuthLayout() {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme, locale, setLocale } = useUIStore();
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
    <div className="h-screen max-h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 flex flex-col justify-center items-center p-4 relative selection:bg-indigo-500 selection:text-white">
      {/* Background Decorative Gradient Orbs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-80 h-80 bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Right Controls: Theme + Language Switcher */}
      <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 flex items-center gap-2">
        <button
          type="button"
          onClick={toggleTheme}
          className="flex items-center justify-center h-8 w-8 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-300 dark:hover:border-zinc-700 shadow-xs transition-colors cursor-pointer"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4 text-amber-400" />
          ) : (
            <Moon className="h-4 w-4 text-indigo-500" />
          )}
        </button>

        <button
          type="button"
          onClick={handleLangToggle}
          className="flex items-center space-x-1.5 px-2.5 h-8 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-300 dark:hover:border-zinc-700 shadow-xs transition-colors cursor-pointer"
        >
          <Languages className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
          <span className="uppercase">{locale}</span>
        </button>
      </div>

      {/* Centered Auth Stack: Logo + Title + Form Card + Trust Badge */}
      <div className="w-full max-w-sm relative z-10 flex flex-col items-center gap-3">
        {/* Brand Header */}
        <div className="text-center">
          <div className="flex justify-center mb-1.5">
            <LogoIcon size={36} />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 leading-tight">
            FinTrack
          </h1>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
            Smart Wealth, Debt & Multi-Account Tracker
          </p>
        </div>

        {/* Main Auth Card */}
        <div className="w-full rounded-xl border border-2 border-zinc-200 dark:border-zinc-800/90 bg-white/95 dark:bg-zinc-900/90 p-4 sm:p-5 backdrop-blur-xl">
          <Outlet />
        </div>

        {/* Security / Trust Footer */}
        <div className="flex items-center justify-center gap-3 text-[11px] text-zinc-400 dark:text-zinc-500">
          <span className="flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            256-Bit SSL Encrypted
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Zap className="h-3.5 w-3.5 text-amber-500" />
            Supabase RLS Protected
          </span>
        </div>
      </div>

      <Toaster />
    </div>
  );
}
