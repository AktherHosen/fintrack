import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Moon,
  Sun,
  Languages,
  Plus,
  ArrowLeftRight,
  Menu,
  PanelLeft,
} from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';
import { Button } from '../ui/button';

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
    setMobileNavOpen,
    toggleSidebar,
  } = useUIStore();

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
    <header className="sticky top-0 z-20 flex h-14 w-full items-center justify-between border-b border-zinc-800 bg-zinc-950/80 px-4 sm:px-6 backdrop-blur-md">
      <div className="flex items-center space-x-2">
        {/* Mobile menu trigger */}
        <button
          onClick={() => setMobileNavOpen(true)}
          className="md:hidden p-1.5 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900"
          title="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Desktop sidebar toggle trigger */}
        <button
          onClick={toggleSidebar}
          className="hidden md:inline-flex p-1.5 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition-colors"
          title="Toggle sidebar"
        >
          <PanelLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2 pl-1">
          <span className="text-sm font-semibold text-zinc-200">Overview</span>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {/* Currency Switcher */}
        <button
          onClick={handleCurrencyToggle}
          className="px-2.5 py-1 rounded-md border border-zinc-800 bg-zinc-900 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 hover:border-zinc-700 transition-colors"
          title="Switch currency"
        >
          {currency === 'BDT' ? '৳ BDT' : '$ USD'}
        </button>

        {/* Language Switcher */}
        <button
          onClick={handleLanguageToggle}
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md border border-zinc-800 bg-zinc-900 text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 hover:border-zinc-700 transition-colors"
          title="Switch language"
        >
          <Languages className="h-3.5 w-3.5 text-zinc-400" />
          <span className="uppercase text-[11px] font-bold">{locale}</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-md border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 hover:border-zinc-700 transition-colors"
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-indigo-400" />}
        </button>

        {/* Transfer Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setAddTransferOpen(true)}
          className="hidden sm:inline-flex text-xs h-8"
        >
          <ArrowLeftRight className="h-3.5 w-3.5 mr-1.5 text-zinc-400" />
          <span>Transfer</span>
        </Button>

        {/* Add Transaction Button */}
        <Button
          variant="default"
          size="sm"
          onClick={() => setAddTransactionOpen(true)}
          className="text-xs h-8 font-semibold shadow-xs"
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          <span>{t('dashboard.add_transaction')}</span>
        </Button>
      </div>
    </header>
  );
}
