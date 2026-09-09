import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
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
  X,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useAdmin } from '../../hooks/useAdmin';
import { useUIStore } from '../../stores/useUIStore';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';
import { Logo } from '../ui/Logo';

interface AdminMobileDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function AdminMobileDrawer({ open, onClose }: AdminMobileDrawerProps) {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { pendingPaymentsCount } = useAdmin();
  const { theme, toggleTheme, locale, setLocale, currency, setCurrency } = useUIStore();

  if (!open) return null;

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
    { name: 'Payment Setup & Gateways', path: '/admin/payment-settings', icon: Smartphone },
    { name: 'Plan Tiers & Limits', path: '/admin/plans', icon: Layers },
    { name: 'Promotional Banners', path: '/admin/banners', icon: Megaphone },
    { name: 'Audit Security Logs', path: '/admin/audit-logs', icon: FileText },
  ];

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
    <div className="fixed inset-0 z-50 md:hidden flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Slide-over Drawer Panel */}
      <div className="relative flex flex-col w-4/5 max-w-xs h-full bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 shadow-2xl z-10 animate-in slide-in-from-left duration-200">
        {/* Header */}
        <div className="flex h-14 items-center justify-between px-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold shadow-md">
              <ShieldAlert className="h-4 w-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 block">
                Admin Control
              </span>
              <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                Super Admin Hub
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 px-2 py-1">
            Admin Modules
          </div>

          {adminNav.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors',
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs font-bold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900/60 hover:text-zinc-900 dark:hover:text-zinc-200'
                )
              }
            >
              <div className="flex items-center gap-2.5">
                <item.icon className="h-4 w-4 shrink-0" />
                <span>{item.name}</span>
              </div>
              {item.count ? (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white shrink-0">
                  {item.count}
                </span>
              ) : null}
            </NavLink>
          ))}
        </div>

        {/* Quick System Preferences */}
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 px-1">
            Preferences
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={toggleTheme}
              className="h-8 px-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {theme === 'dark' ? (
                <Sun className="h-3.5 w-3.5 text-amber-400" />
              ) : (
                <Moon className="h-3.5 w-3.5 text-indigo-600" />
              )}
              <span className="text-[10px] uppercase font-bold">{theme}</span>
            </button>

            <button
              onClick={handleCurrencyToggle}
              className="h-8 px-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>{currency}</span>
            </button>

            <button
              onClick={handleLanguageToggle}
              className="h-8 px-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center justify-center gap-1 cursor-pointer"
            >
              <Languages className="h-3.5 w-3.5 text-zinc-400" />
              <span className="uppercase text-[10px]">{locale}</span>
            </button>
          </div>

          <button
            onClick={() => {
              onClose();
              navigate('/');
            }}
            className="w-full h-8.5 mt-1 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return to User App</span>
          </button>
        </div>
      </div>
    </div>
  );
}
