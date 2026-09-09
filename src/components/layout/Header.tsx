import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { Moon, Sun, Languages, Plus, ArrowLeftRight, Menu, PanelLeft } from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';
import { Button } from '../ui/button';

import { useSubscriptions } from '../../hooks/useSubscriptions';

export function Header() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const { canUseMultiCurrency, subscription } = useSubscriptions();
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
    addToast,
  } = useUIStore();

  const handleLanguageToggle = () => {
    const nextLang = locale === 'en' ? 'bn' : 'en';
    setLocale(nextLang);
    i18n.changeLanguage(nextLang);
  };

  const handleCurrencyToggle = () => {
    if (!canUseMultiCurrency && currency === 'BDT') {
      addToast({
        type: 'warning',
        title: 'Pro Feature',
        description: 'Multi-Currency (USD/EUR) requires FinTrack Pro. Please upgrade to unlock.',
      });
      return;
    }
    const nextCurr = currency === 'BDT' ? 'USD' : 'BDT';
    setCurrency(nextCurr);
  };

  // Get dynamic page title
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return t('nav.dashboard');
    if (path.startsWith('/transactions')) return t('nav.transactions');
    if (path.startsWith('/accounts')) return t('nav.accounts');
    if (path.startsWith('/budgets')) return t('nav.budgets');
    if (path.startsWith('/categories')) return t('nav.categories');
    if (path.startsWith('/transfers')) return t('nav.transfers');
    if (path.startsWith('/loans')) return t('nav.loans');
    if (path.startsWith('/recurring')) return t('nav.recurring');
    if (path.startsWith('/reports')) return t('nav.reports');
    if (path.startsWith('/settings')) return t('nav.settings');
    if (path.startsWith('/admin')) return 'Admin Portal';
    return 'FinTrack';
  };

  return (
    <header className="sticky top-0 z-20 flex h-14 w-full items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/90 px-3 sm:px-6 backdrop-blur-md">
      {/* Left side: Mobile menu, desktop sidebar toggle, page title & badge */}
      <div className="flex items-center space-x-1.5 sm:space-x-2 min-w-0">
        {/* Mobile menu trigger */}
        <button
          onClick={() => setMobileNavOpen(true)}
          className="md:hidden h-8 w-8 inline-flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
          title="Open menu"
        >
          <Menu className="h-4 w-4" />
        </button>

        {/* Desktop sidebar toggle trigger */}
        <button
          onClick={toggleSidebar}
          className="hidden md:inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
          title="Toggle sidebar"
        >
          <PanelLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-1.5 pl-0.5 truncate">
          <span className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
            {getPageTitle()}
          </span>
        </div>
      </div>

      {/* Right side controls - all unified to h-8 compact height */}
      <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
        {/* Currency Switcher */}
        <button
          onClick={handleCurrencyToggle}
          className="h-8 px-2 sm:px-2.5 inline-flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-[11px] sm:text-xs font-bold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          title="Switch currency"
        >
          <span className="sm:hidden">{currency === 'BDT' ? '৳' : '$'}</span>
          <span className="hidden sm:inline">{currency === 'BDT' ? '৳ BDT' : '$ USD'}</span>
        </button>

        {/* Language Switcher */}
        <button
          onClick={handleLanguageToggle}
          className="h-8 px-2 sm:px-2.5 inline-flex items-center justify-center space-x-1 sm:space-x-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-[11px] sm:text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          title="Switch language"
        >
          <Languages className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400 shrink-0" />
          <span className="uppercase text-[10px] sm:text-[11px] font-bold">{locale}</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-400 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4 text-amber-400" />
          ) : (
            <Moon className="h-4 w-4 text-indigo-600" />
          )}
        </button>

        {/* Transfer Button (Desktop only) */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setAddTransferOpen(true)}
          className="hidden md:inline-flex text-xs h-8 px-2.5 sm:px-3 font-medium rounded-lg"
        >
          <ArrowLeftRight className="h-3.5 w-3.5 mr-1.5 text-zinc-500 dark:text-zinc-400" />
          <span>Transfer</span>
        </Button>

        {/* Add Transaction Button */}
        <Button
          variant="default"
          size="sm"
          onClick={() => setAddTransactionOpen(true)}
          className="h-8 px-2.5 sm:px-3 text-xs font-semibold rounded-lg shadow-xs inline-flex items-center justify-center"
        >
          <Plus className="h-3.5 w-3.5 sm:mr-1.5" />
          <span className="hidden sm:inline">{t('dashboard.add_transaction')}</span>
          <span className="sm:hidden font-medium">Add</span>
        </Button>
      </div>
    </header>
  );
}
