import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Moon,
  Sun,
  Languages,
  Plus,
  ArrowLeftRight,
  RotateCcw,
  Bell,
  Sparkles,
  Menu,
} from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';
import { useAuth } from '../../hooks/useAuth';
import { localDb } from '../../lib/supabase';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
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
    setMobileNavOpen,
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
    <header className="sticky top-0 z-20 flex h-18 w-full items-center justify-between border-b border-slate-800/80 bg-slate-950/80 px-4 sm:px-8 backdrop-blur-xl">
      {/* Title & Mobile Toggle */}
      <div className="flex items-center space-x-3">
        <button
          onClick={() => setMobileNavOpen(true)}
          className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <Menu className="h-6 w-6" />
        </button>
        <div>
          {title && <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">{title}</h1>}
          {subtitle && <p className="hidden sm:block text-xs text-slate-400 font-medium">{subtitle}</p>}
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Currency Switcher */}
        <button
          onClick={handleCurrencyToggle}
          className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl border border-slate-800 bg-slate-900/80 text-xs font-bold text-emerald-400 hover:border-emerald-500/40 hover:bg-slate-800 transition-colors"
          title="Switch currency"
        >
          <span>{currency === 'BDT' ? '৳ BDT' : '$ USD'}</span>
        </button>

        {/* Language Switcher */}
        <button
          onClick={handleLanguageToggle}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl border border-slate-800 bg-slate-900/80 text-xs font-semibold text-slate-300 hover:border-slate-700 hover:text-white hover:bg-slate-800 transition-colors"
          title="Switch language (EN/BN)"
        >
          <Languages className="h-3.5 w-3.5 text-emerald-400" />
          <span className="uppercase">{locale}</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl border border-slate-800 bg-slate-900/80 text-slate-400 hover:text-amber-400 hover:border-amber-400/30 hover:bg-slate-800 transition-colors"
          title="Toggle Dark/Light Mode"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-indigo-400" />}
        </button>

        {/* Transfer Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setAddTransferOpen(true)}
          className="hidden lg:inline-flex gap-1.5"
        >
          <ArrowLeftRight className="h-3.5 w-3.5 text-indigo-400" />
          <span>{t('dashboard.new_transfer')}</span>
        </Button>

        {/* Add Transaction Primary CTA */}
        <Button
          variant="gradient"
          size="sm"
          onClick={() => setAddTransactionOpen(true)}
          className="hidden sm:inline-flex gap-1.5 shadow-emerald-950"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          <span>{t('dashboard.add_transaction')}</span>
        </Button>
      </div>
    </header>
  );
}
