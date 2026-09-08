import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Moon,
  Sun,
  Languages,
  Plus,
  ArrowLeftRight,
  Bell,
  Sparkles,
  Search,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';
import { useAuth } from '../../hooks/useAuth';
import { useAccounts } from '../../hooks/useAccounts';
import { Button } from '../ui/button';
import { getInitials } from '../../lib/utils';

export function Header() {
  const { t, i18n } = useTranslation();
  const {
    theme,
    toggleTheme,
    locale,
    setLocale,
    currency,
    setCurrency,
    setAddTransactionOpen,
    setAddTransferOpen,
  } = useUIStore();
  const { user } = useAuth();

  const handleLanguageToggle = () => {
    const nextLang = locale === 'en' ? 'bn' : 'en';
    setLocale(nextLang);
    i18n.changeLanguage(nextLang);
  };

  const handleCurrencyToggle = () => {
    const nextCurr = currency === 'BDT' ? 'USD' : 'BDT';
    setCurrency(nextCurr);
  };

  return (
    <header className="sticky top-0 z-30 bg-[#0b101b]/95 border-b border-slate-800/80 px-4 py-3 backdrop-blur-md">
      <div className="flex items-center justify-between">
        {/* User Profile & Greeting */}
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-extrabold text-sm flex-shrink-0">
            {getInitials(user?.full_name || user?.email)}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400 font-medium">Hello,</span>
              <span className="text-sm font-bold text-white leading-none">
                {user?.full_name?.split(' ')[0] || 'Member'} 👋
              </span>
            </div>
            <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider block mt-0.5">
              Personal Wealth
            </span>
          </div>
        </div>

        {/* Quick Flat Pills */}
        <div className="flex items-center space-x-2">
          {/* Currency Pill */}
          <button
            onClick={handleCurrencyToggle}
            className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-emerald-400 hover:bg-slate-800 transition-all"
            title="Toggle Currency"
          >
            {currency === 'BDT' ? '৳ BDT' : '$ USD'}
          </button>

          {/* Language Pill */}
          <button
            onClick={handleLanguageToggle}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
            title="Toggle Language"
          >
            <Languages className="h-3 w-3 text-emerald-400" />
            <span className="uppercase text-[11px]">{locale}</span>
          </button>

          {/* Theme Pill */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-amber-400 transition-all"
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-indigo-400" />}
          </button>
        </div>
      </div>
    </header>
  );
}
