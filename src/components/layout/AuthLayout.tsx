import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Sparkles, ShieldCheck, Zap, ArrowRight, Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '../../stores/useUIStore';
import { ToastContainer } from '../ui/toast-container';

export function AuthLayout() {
  const { t, i18n } = useTranslation();
  const { locale, setLocale } = useUIStore();

  const handleLangToggle = () => {
    const next = locale === 'en' ? 'bn' : 'en';
    setLocale(next);
    i18n.changeLanguage(next);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-emerald-500 selection:text-white">
      {/* Background Decorative Gradient Orbs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navbar */}
      <div className="absolute top-6 right-6 z-20 flex items-center gap-3">
        <button
          onClick={handleLangToggle}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900/80 text-xs font-semibold text-slate-300 hover:text-white"
        >
          <Languages className="h-3.5 w-3.5 text-emerald-400" />
          <span className="uppercase">{locale}</span>
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="flex justify-center mb-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-xl shadow-emerald-500/30">
            <Sparkles className="h-8 w-8 text-slate-950 font-bold" />
          </div>
        </div>
        <h2 className="text-center text-3xl font-extrabold tracking-tight text-white">
          FinTrack <span className="text-emerald-400">v2</span>
        </h2>
        <p className="mt-2 text-center text-xs sm:text-sm text-slate-400">
          Smart Wealth, Debt, Budget & Expense Management
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0 relative z-10">
        <div className="rounded-3xl border border-slate-800/80 bg-slate-900/80 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl shadow-slate-950/80">
          <Outlet />
        </div>

        {/* Security / Trust Badge */}
        <div className="mt-6 flex items-center justify-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
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
