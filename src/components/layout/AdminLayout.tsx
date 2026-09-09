import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ShieldAlert,
  Users,
  CreditCard,
  Crown,
  Smartphone,
  Layers,
  Megaphone,
  FileText,
  ArrowLeft,
  Moon,
  Sun,
  Languages,
  Menu,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useAdmin } from '../../hooks/useAdmin';
import { useUIStore } from '../../stores/useUIStore';
import { Toaster } from '../ui/sonner';
import { AdminMobileNav } from './AdminMobileNav';
import { AdminMobileDrawer } from './AdminMobileDrawer';
import { cn } from '../../lib/utils';

export function AdminLayout() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin, isLoading } = useAuth();
  const { pendingPaymentsCount } = useAdmin();
  const { theme, toggleTheme, locale, setLocale, currency, setCurrency } = useUIStore();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

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
    { name: 'User Directory', path: '/admin/users', icon: Users },
    { name: 'Subscriptions & Plans', path: '/admin/subscriptions', icon: Crown },
    {
      name: 'Payments Verification',
      path: '/admin/payments',
      icon: CreditCard,
      count: pendingPaymentsCount,
    },
    { name: 'Payment Gateways', path: '/admin/payment-settings', icon: Smartphone },
    { name: 'Plan Tiers & Limits', path: '/admin/plans', icon: Layers },
    { name: 'Promotional Banners', path: '/admin/banners', icon: Megaphone },
    { name: 'Audit Security Logs', path: '/admin/audit-logs', icon: FileText },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 selection:bg-indigo-600 selection:text-white">
      {/* Desktop Admin Sidebar */}
      <aside className="w-64 h-screen sticky top-0 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col justify-between hidden md:flex shrink-0">
        {/* Brand Header - exactly h-14 (56px) matching the top dashboard header */}
        <div className="flex h-14 shrink-0 items-center space-x-3 px-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-600/25 shrink-0">
            <ShieldAlert className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate leading-tight">Admin Hub</h2>
            <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider leading-none">
              Master Control
            </p>
          </div>
        </div>

        {/* Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {adminNav.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              className={({ isActive }) =>
                cn(
                  'flex items-center justify-between px-3 h-[38px] rounded-lg text-xs font-semibold transition-colors duration-200',
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs font-bold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100/60 dark:hover:bg-zinc-900/40'
                )
              }
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                <item.icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.name}</span>
              </div>
              {item.count ? (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white shrink-0">
                  {item.count}
                </span>
              ) : null}
            </NavLink>
          ))}
        </div>

        {/* Footer Area */}
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 shrink-0">
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
        {/* Top Header */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 px-3.5 sm:px-6 backdrop-blur-md z-10">
          <div className="flex items-center space-x-2.5">
            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="md:hidden h-8 w-8 inline-flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer shrink-0"
              title="Open Navigation"
            >
              <Menu className="h-4 w-4" />
            </button>

            <span className="h-8 inline-flex items-center px-2.5 text-[11px] font-bold rounded-lg bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 uppercase tracking-wide">
              ADMIN CONTROL
            </span>
          </div>

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
              className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-indigo-600" />
              )}
            </button>

            {/* Exit Admin Button */}
            <NavLink
              to="/"
              className="hidden sm:inline-flex h-8 px-2.5 sm:px-3 items-center justify-center space-x-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors shrink-0"
              title="Return to User App"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Exit Admin</span>
            </NavLink>
          </div>
        </header>

        {/* Main Content Area (with mobile-friendly bottom spacing) */}
        <main className="flex-1 p-3.5 sm:p-6 md:p-8 max-w-7xl w-full mx-auto overflow-y-auto overflow-x-hidden min-w-0 pb-24 md:pb-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <AdminMobileNav onOpenDrawer={() => setMobileDrawerOpen(true)} />

      {/* Mobile Slide-Over Drawer */}
      <AdminMobileDrawer
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
      />

      <Toaster />
    </div>
  );
}
