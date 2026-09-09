import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
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
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useUIStore } from '../../stores/useUIStore';
import { useSubscriptions } from '../../hooks/useSubscriptions';
import { Badge } from '../ui/badge';
import { cn, getInitials } from '../../lib/utils';

export function Sidebar() {
  const { t } = useTranslation();
  const { user, isAdmin, logout } = useAuth();
  const { isSidebarOpen } = useUIStore();
  const { subscription } = useSubscriptions();
  const location = useLocation();

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

  const activeIndex = navItems.findIndex((item) =>
    item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)
  );

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col h-screen sticky top-0 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 transition-all duration-300 ease-in-out relative z-30 shrink-0 select-none',
        isSidebarOpen ? 'w-56' : 'w-16'
      )}
    >
      {/* Brand Header */}
      <div className="flex h-14 shrink-0 items-center px-3.5 border-b border-zinc-200 dark:border-zinc-800/80">
        {isSidebarOpen ? (
          <NavLink to="/" className="flex items-center space-x-2.5 min-w-0 overflow-hidden group">
            <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-xs group-hover:bg-indigo-500 transition-colors">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-semibold text-sm tracking-tight text-zinc-900 dark:text-zinc-100 truncate">
                FinTrack
              </span>
              <Badge
                variant="outline"
                className="text-[10px] px-1 py-0 h-4 bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 shrink-0"
              >
                v2
              </Badge>
            </div>
          </NavLink>
        ) : (
          <div className="w-full flex items-center justify-center">
            <NavLink
              to="/"
              className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs hover:bg-indigo-500 transition-colors"
              title="FinTrack"
            >
              <Sparkles className="h-4 w-4" />
            </NavLink>
          </div>
        )}
      </div>

      {/* Navigation List with Smooth Sliding Tab Indicator */}
      <div className="flex-1 overflow-y-auto py-2.5 px-2">
        <div className="relative">
          {/* Sliding Tab Highlight Pill */}
          {activeIndex !== -1 && (
            <div
              className={cn(
                'absolute pointer-events-none rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-xs transition-transform duration-250 ease-[cubic-bezier(0.25,1,0.5,1)] z-0',
                isSidebarOpen ? 'left-0 right-0 h-9' : 'left-1 w-10 h-10'
              )}
              style={{
                transform: `translateY(${activeIndex * (isSidebarOpen ? 40 : 44)}px)`,
              }}
            />
          )}

          <div className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                title={!isSidebarOpen ? item.name : undefined}
                className={({ isActive }) =>
                  cn(
                    'flex items-center rounded-lg text-[13px] font-medium transition-colors duration-200 group relative z-10',
                    isSidebarOpen ? 'gap-2.5 px-2.5 h-9 w-full' : 'justify-center w-10 h-10 mx-auto',
                    isActive
                      ? 'text-zinc-900 dark:text-zinc-100 font-semibold'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/40'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      className={cn(
                        'h-4 w-4 shrink-0 transition-colors duration-200',
                        isActive
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : 'text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-800 dark:group-hover:text-zinc-200'
                      )}
                    />
                    {isSidebarOpen && <span className="truncate flex-1">{item.name}</span>}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>

        {/* Admin Navigation */}
        {isAdmin && (
          <div className="pt-2 mt-2 border-t border-zinc-200 dark:border-zinc-800/80">
            {isSidebarOpen && (
              <p className="px-2.5 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                Admin
              </p>
            )}
            <NavLink
              to="/admin"
              title={!isSidebarOpen ? t('nav.admin') : undefined}
              className={({ isActive }) =>
                cn(
                  'flex items-center rounded-lg text-[13px] font-medium transition-colors duration-200 group',
                  isSidebarOpen ? 'gap-2.5 px-2.5 h-9 w-full' : 'justify-center w-10 h-10 mx-auto',
                  isActive
                    ? 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-500/30 shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-300 border border-transparent'
                )
              }
            >
              <ShieldAlert className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
              {isSidebarOpen && (
                <span className="truncate flex-1 font-semibold">{t('nav.admin')}</span>
              )}
            </NavLink>
          </div>
        )}
      </div>

      {/* User Footer */}
      <div className="p-2 border-t border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 shrink-0">
        {isSidebarOpen ? (
          <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/60">
            <div className="flex items-center space-x-2 min-w-0 overflow-hidden">
              <div className="h-7 w-7 rounded-full bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 flex items-center justify-center font-bold text-[11px] shrink-0">
                {getInitials(user?.full_name || user?.email)}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                  {user?.full_name || 'User'}
                </span>
                <span className="text-[10px] text-zinc-500 truncate">
                  {subscription?.plan?.name || 'Free'}
                </span>
              </div>
            </div>
            <button
              onClick={() => logout.mutate()}
              className="p-1 text-zinc-400 hover:text-rose-500 dark:hover:text-rose-400 rounded-md transition-colors shrink-0 ml-1"
              title="Log out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <button
              onClick={() => logout.mutate()}
              className="h-8 w-8 rounded-lg bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-rose-500 dark:hover:text-rose-400 border border-zinc-200 dark:border-zinc-800 transition-colors"
              title="Log out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

