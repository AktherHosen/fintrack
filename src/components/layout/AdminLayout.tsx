import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation, Navigate } from 'react-router-dom';
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
  PanelLeft,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useAdmin } from '../../hooks/useAdmin';
import { useSubscriptions } from '../../hooks/useSubscriptions';
import { useUIStore } from '../../stores/useUIStore';
import { Toaster } from '../ui/sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { AdminMobileNav } from './AdminMobileNav';
import { AdminMobileDrawer } from './AdminMobileDrawer';
import { cn } from '../../lib/utils';

import { CircularProgressLoader } from '../ui/spinner';

export function AdminLayout() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, isLoading } = useAuth();
  const { pendingPaymentsCount, assignUserPlan } = useAdmin();
  const { plans, currentPlan } = useSubscriptions();
  const {
    theme,
    toggleTheme,
    locale,
    setLocale,
    currency,
    setCurrency,
    isSidebarOpen,
    toggleSidebar,
  } = useUIStore();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const handleAdminPlanSwitch = (planId: string) => {
    if (!user) return;
    assignUserPlan.mutate({
      userId: user.id,
      planId,
      durationDays: 365,
      notes: 'Admin plan simulation switch',
    });
  };

  const handleLanguageToggle = () => {
    const nextLang = locale === 'en' ? 'bn' : 'en';
    setLocale(nextLang);
    i18n.changeLanguage(nextLang);
  };

  const handleCurrencyToggle = () => {
    const nextCurr = currency === 'BDT' ? 'USD' : 'BDT';
    setCurrency(nextCurr);
  };

  // Circular progress loading animation if user is not yet loaded
  if (isLoading && !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <CircularProgressLoader size="xl" />
      </div>
    );
  }

  if (!user && !isLoading) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin && !isLoading) {
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
      {/* Desktop Admin Sidebar - exactly w-56 matching user dashboard Sidebar */}
      <aside
        className={cn(
          'hidden md:flex flex-col h-screen sticky top-0 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 justify-between shrink-0 transition-all duration-300 ease-in-out select-none',
          isSidebarOpen ? 'w-56' : 'w-16'
        )}
      >
        {/* Brand Header - exactly h-14 (56px) matching user dashboard header */}
        <div
          className={cn(
            'flex h-14 shrink-0 items-center border-b border-zinc-200 dark:border-zinc-800',
            isSidebarOpen ? 'space-x-3 px-3.5' : 'justify-center px-2'
          )}
        >
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-600/25 shrink-0">
            <ShieldAlert className="h-4 w-4" />
          </div>
          {isSidebarOpen && (
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate leading-tight">Admin Hub</h2>
              <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider leading-none">
                Master Control
              </p>
            </div>
          )}
        </div>

        {/* Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {adminNav.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              title={!isSidebarOpen ? item.name : undefined}
              className={({ isActive }) =>
                cn(
                  'flex items-center rounded-lg text-xs font-semibold transition-colors duration-200 relative group',
                  isSidebarOpen
                    ? 'justify-between px-2.5 h-[38px] w-full'
                    : 'justify-center w-10 h-10 mx-auto',
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs font-bold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100/60 dark:hover:bg-zinc-900/40'
                )
              }
            >
              <div className={cn('flex items-center min-w-0', isSidebarOpen ? 'space-x-2.5' : '')}>
                <item.icon className="h-4 w-4 shrink-0" />
                {isSidebarOpen && <span className="truncate">{item.name}</span>}
              </div>
              {item.count ? (
                <span
                  className={cn(
                    'font-bold bg-rose-600 text-white shrink-0',
                    isSidebarOpen
                      ? 'px-1.5 py-0.5 rounded-full text-[10px]'
                      : 'absolute top-1.5 right-1.5 w-2 h-2 rounded-full p-0'
                  )}
                >
                  {isSidebarOpen ? item.count : ''}
                </span>
              ) : null}
            </NavLink>
          ))}
        </div>

        {/* Footer Area */}
        <div className="p-2 border-t border-zinc-200 dark:border-zinc-800 shrink-0">
          <NavLink
            to="/"
            title="Back to User App"
            className={cn(
              'flex items-center rounded-lg text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors',
              isSidebarOpen ? 'space-x-2 p-2.5' : 'justify-center w-10 h-10 mx-auto'
            )}
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            {isSidebarOpen && <span>Back to User App</span>}
          </NavLink>
        </div>
      </aside>

      {/* Main Admin Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        {/* Top Header */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 px-3.5 sm:px-6 backdrop-blur-md z-10">
          <div className="flex items-center space-x-2 sm:space-x-2.5">
            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="md:hidden h-8 w-8 inline-flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer shrink-0"
              title="Open Navigation"
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

            <span className="h-8 inline-flex items-center px-2.5 text-[11px] font-bold rounded-lg bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 uppercase tracking-wide">
              ADMIN CONTROL
            </span>

            {/* Admin Instant Plan Simulator */}
            <div className="hidden sm:flex items-center gap-1.5 pl-2 border-l border-zinc-200 dark:border-zinc-800">
              <Select
                value={currentPlan.id}
                onValueChange={(val) => handleAdminPlanSwitch(val)}
              >
                <SelectTrigger
                  className="h-8 px-2.5 text-[11px] font-bold rounded-lg border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/60 dark:bg-zinc-900 text-indigo-700 dark:text-indigo-400 gap-1.5 w-auto"
                  title="Switch admin's active plan to test and verify tier limits"
                >
                  <SelectValue placeholder="Select Plan">
                    {currentPlan?.name
                      ? `${currentPlan.name} ${currentPlan.slug === 'free' ? '(Free)' : `(${currentPlan.price} ৳)`}`
                      : 'Select Plan'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent align="start">
                  {plans.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="text-xs font-semibold">
                      {p.name} {p.slug === 'free' ? '(Free)' : `(${p.price} ৳)`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
