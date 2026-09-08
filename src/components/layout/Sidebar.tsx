import React from 'react';
import { NavLink } from 'react-router-dom';
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
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useUIStore } from '../../stores/useUIStore';
import { useSubscriptions } from '../../hooks/useSubscriptions';
import { Badge } from '../ui/badge';
import { cn, getInitials } from '../../lib/utils';

export function Sidebar() {
  const { t } = useTranslation();
  const { user, isAdmin, logout } = useAuth();
  const { isSidebarOpen, toggleSidebar } = useUIStore();
  const { isPro, subscription } = useSubscriptions();

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

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col border-r border-slate-800 bg-slate-950/90 backdrop-blur-2xl transition-all duration-300 relative z-30",
        isSidebarOpen ? "w-64" : "w-20"
      )}
    >
      {/* Brand Header */}
      <div className="flex h-18 items-center justify-between px-4 border-b border-slate-800/80">
        <NavLink to="/" className="flex items-center space-x-3 overflow-hidden">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/25 flex-shrink-0">
            <Sparkles className="h-5 w-5 text-slate-950 font-bold" />
          </div>
          {isSidebarOpen && (
            <div className="flex flex-col">
              <span className="font-extrabold text-lg tracking-tight text-white flex items-center gap-1.5">
                FinTrack <span className="text-xs px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">v2</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Smart Wealth Hub</span>
            </div>
          )}
        </NavLink>

        <button
          onClick={toggleSidebar}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {isSidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              cn(
                "flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 group relative",
                isActive
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-500/10 font-semibold"
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-100 hover:border hover:border-slate-800/80"
              )
            }
          >
            <item.icon className="h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-110" />
            {isSidebarOpen && <span className="truncate">{item.name}</span>}
          </NavLink>
        ))}

        {/* Admin Navigation (if role is ADMIN) */}
        {isAdmin && (
          <div className="pt-4 mt-4 border-t border-slate-800/80">
            {isSidebarOpen && (
              <p className="px-3 text-[10px] font-bold text-amber-400/80 uppercase tracking-wider mb-2">
                Administration
              </p>
            )}
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                cn(
                  "flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 group",
                  isActive
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-sm"
                    : "text-amber-400/70 hover:bg-amber-500/10 hover:text-amber-300"
                )
              }
            >
              <ShieldAlert className="h-5 w-5 flex-shrink-0 text-amber-400" />
              {isSidebarOpen && <span className="truncate font-semibold">{t('nav.admin')}</span>}
            </NavLink>
          </div>
        )}
      </div>

      {/* User Card & Plan Badge */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/60">
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="h-9 w-9 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold text-xs flex-shrink-0">
              {getInitials(user?.full_name || user?.email)}
            </div>
            {isSidebarOpen && (
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-slate-100 truncate">{user?.full_name || 'Guest User'}</span>
                <span className="text-[10px] text-slate-400 truncate">{user?.email}</span>
              </div>
            )}
          </div>
          {isSidebarOpen && (
            <button
              onClick={() => logout.mutate()}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
              title="Log out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
