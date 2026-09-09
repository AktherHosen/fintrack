import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  PieChart,
  Tags,
  ArrowLeftRight,
  HandCoins,
  CalendarSync,
  BarChart3,
  Settings,
  ShieldAlert,
  Sparkles,
  LogOut,
  X,
  CreditCard,
  Building2,
  Megaphone,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useUIStore } from '../../stores/useUIStore';
import { useSubscriptions } from '../../hooks/useSubscriptions';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { cn, getInitials } from '../../lib/utils';

export function MobileDrawer() {
  const { t } = useTranslation();
  const { user, isAdmin, logout } = useAuth();
  const { isMobileNavOpen, setMobileNavOpen } = useUIStore();
  const { subscription } = useSubscriptions();
  const navigate = useNavigate();

  if (!isMobileNavOpen) return null;

  const navItems = [
    { name: t('nav.dashboard'), path: '/', icon: LayoutDashboard },
    { name: t('nav.transactions'), path: '/transactions', icon: Receipt },
    { name: t('nav.accounts'), path: '/accounts', icon: Wallet },
    { name: t('nav.budgets'), path: '/budgets', icon: PieChart },
    { name: t('nav.categories'), path: '/categories', icon: Tags },
    { name: t('nav.transfers'), path: '/transfers', icon: ArrowLeftRight },
    { name: t('nav.loans'), path: '/loans', icon: HandCoins },
    { name: t('nav.recurring'), path: '/recurring', icon: CalendarSync },
    { name: t('nav.reports'), path: '/reports', icon: BarChart3 },
    { name: t('nav.settings'), path: '/settings', icon: Settings },
  ];

  const adminNavItems = [
    { name: 'Plan Management', path: '/admin/plans', icon: Sparkles },
    { name: 'Payment Submissions', path: '/admin/payments', icon: CreditCard },
    { name: 'Gateway Settings', path: '/admin/payment-settings', icon: Building2 },
    { name: 'Promotional Banners', path: '/admin/banners', icon: Megaphone },
  ];

  const handleLinkClick = () => {
    setMobileNavOpen(false);
  };

  const handleLogout = () => {
    setMobileNavOpen(false);
    logout.mutate(undefined, {
      onSuccess: () => {
        navigate('/login');
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 md:hidden flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={() => setMobileNavOpen(false)}
      />

      {/* Slide-over Drawer Panel */}
      <div className="relative flex flex-col w-4/5 max-w-xs h-full bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 shadow-2xl z-10 animate-in slide-in-from-left duration-200">
        {/* Header */}
        <div className="flex h-14 items-center justify-between px-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center space-x-2.5">
            <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-xs">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight text-zinc-900 dark:text-zinc-100">
                FinTrack
              </span>
              <Badge
                variant="outline"
                className="text-[10px] px-1 py-0 h-4 bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400"
              >

              </Badge>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            onClick={() => setMobileNavOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 px-2 py-1">
            Menu
          </div>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              onClick={handleLinkClick}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                  isActive
                    ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-semibold border border-zinc-200 dark:border-zinc-800'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900/60 hover:text-zinc-900 dark:hover:text-zinc-200'
                )
              }
            >
              <item.icon className="h-4 w-4 shrink-0 text-zinc-500 dark:text-zinc-400" />
              <span>{item.name}</span>
            </NavLink>
          ))}

          {isAdmin && (
            <>
              <div className="pt-3 pb-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 px-2 flex items-center gap-1.5">
                  <ShieldAlert className="h-3 w-3" />
                  <span>Admin Control</span>
                </div>
              </div>
              {adminNavItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={handleLinkClick}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                      isActive
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold border border-amber-500/20'
                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900/60 hover:text-zinc-900 dark:hover:text-zinc-200'
                    )
                  }
                >
                  <item.icon className="h-4 w-4 shrink-0 text-amber-500" />
                  <span>{item.name}</span>
                </NavLink>
              ))}
            </>
          )}
        </div>

        {/* User Footer */}
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {getInitials(user?.full_name || 'User')}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                  {user?.full_name || 'Demo User'}
                </p>
                <p className="text-[10px] text-zinc-500 truncate">{user?.email}</p>
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400"
              onClick={handleLogout}
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
