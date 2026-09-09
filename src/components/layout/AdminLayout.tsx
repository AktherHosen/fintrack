import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ShieldAlert,
  Users,
  CreditCard,
  Layers,
  Megaphone,
  FileText,
  ArrowLeft,
  Moon,
  Sun,
  Languages,
  Menu,
  X,
  Smartphone,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useAdmin } from '../../hooks/useAdmin';
import { useUIStore } from '../../stores/useUIStore';
import { ToastContainer } from '../ui/toast-container';
import { cn } from '../../lib/utils';

export function AdminLayout() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, isLoading } = useAuth();
  const { pendingPaymentsCount } = useAdmin();
  const { theme, toggleTheme, locale, setLocale, currency, setCurrency } = useUIStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLanguageToggle = () => {
    const nextLang = locale === 'en' ? 'bn' : 'en';
    setLocale(nextLang);
    i18n.changeLanguage(nextLang);
  };

  const handleCurrencyToggle = () => {
    const nextCurr = currency === 'BDT' ? 'USD' : 'BDT';
    setCurrency(nextCurr);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30 animate-pulse text-white">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            Checking Admin Permissions...
          </span>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 text-center text-zinc-900 dark:text-zinc-100">
        <ShieldAlert className="h-16 w-16 text-rose-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Access Restricted</h2>
        <p className="text-zinc-600 dark:text-zinc-400 max-w-md mb-6">
          You need Administrator permissions to view the FinTrack control center.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-5 py-2.5 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 font-semibold transition-opacity"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const adminNav = [
    { name: 'Dashboard Overview', path: '/admin', exact: true, icon: ShieldAlert },
    { name: 'User Management', path: '/admin/users', icon: Users },
    {
      name: 'Payments Verification',
      path: '/admin/payments',
      icon: CreditCard,
      count: pendingPaymentsCount,
    },
    { name: 'Payment Setup', path: '/admin/payment-settings', icon: Smartphone },
    { name: 'Plans & Features', path: '/admin/plans', icon: Layers },
    { name: 'Banner Promotions', path: '/admin/banners', icon: Megaphone },
    { name: 'Audit Security Logs', path: '/admin/audit-logs', icon: FileText },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 selection:bg-indigo-600 selection:text-white">
      {/* Desktop Admin Sidebar */}
      <aside className="w-64 h-screen sticky top-0 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 flex flex-col justify-between hidden md:flex shrink-0">
        <div className="flex-1 overflow-y-auto">
          <div className="flex items-center space-x-3 pb-5 border-b border-zinc-200 dark:border-zinc-800/80 mb-6">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-600/25">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Admin Hub</h2>
              <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider">
                Master Control
              </p>
            </div>
          </div>

          <div className="space-y-1">
            {adminNav.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                className={({ isActive }) =>
                  cn(
                    'flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all',
                    isActive
                      ? 'bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 shadow-xs font-bold'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-200'
                  )
                }
              >
                <div className="flex items-center space-x-2.5">
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.name}</span>
                </div>
                {item.count ? (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white shrink-0">
                    {item.count}
                  </span>
                ) : null}
              </NavLink>
            ))}
          </div>
        </div>

        <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 shrink-0">
          <NavLink
            to="/"
            className="flex items-center space-x-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white p-2.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to User App</span>
          </NavLink>
        </div>
      </aside>

      {/* Main Admin Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 px-4 sm:px-6 backdrop-blur-md">
          <div className="flex items-center space-x-3">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 rounded-md text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900"
              title="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            <span className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 uppercase tracking-wide">
              ADMIN MODE
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {/* Currency Switcher */}
            <button
              onClick={handleCurrencyToggle}
              className="px-2.5 py-1 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
              title="Switch currency"
            >
              {currency === 'BDT' ? '৳ BDT' : '$ USD'}
            </button>

            {/* Language Switcher */}
            <button
              onClick={handleLanguageToggle}
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
              title="Switch language"
            >
              <Languages className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
              <span className="uppercase text-[11px] font-bold">{locale}</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-indigo-600" />
              )}
            </button>

            {/* Return to App Button */}
            <NavLink
              to="/"
              className="flex items-center space-x-1.5 px-3 py-1 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Exit Admin</span>
            </NavLink>
          </div>
        </header>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3 space-y-1 animate-in slide-in-from-top-2 duration-150">
            {adminNav.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all',
                    isActive
                      ? 'bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                  )
                }
              >
                <div className="flex items-center space-x-2.5">
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </div>
                {item.count ? (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white">
                    {item.count}
                  </span>
                ) : null}
              </NavLink>
            ))}
          </div>
        )}

        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
          <Outlet />
        </main>
      </div>

      <ToastContainer />
    </div>
  );
}
