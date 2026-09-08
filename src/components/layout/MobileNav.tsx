import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Receipt,
  Plus,
  Wallet,
  PieChart,
  Menu,
  X,
  Tags,
  ArrowLeftRight,
  HandCoins,
  CalendarSync,
  BarChart3,
  Settings,
  ShieldAlert,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';
import { useAuth } from '../../hooks/useAuth';
import { cn, getInitials } from '../../lib/utils';

export function MobileNav() {
  const { t } = useTranslation();
  const { isMobileNavOpen, setMobileNavOpen, setAddTransactionOpen } = useUIStore();
  const { user, isAdmin, logout } = useAuth();

  const mainTabs = [
    { name: t('nav.dashboard'), path: '/', icon: LayoutDashboard },
    { name: t('nav.transactions'), path: '/transactions', icon: Receipt },
    { name: t('nav.accounts'), path: '/accounts', icon: Wallet },
    { name: t('nav.budgets'), path: '/budgets', icon: PieChart },
  ];

  const drawerLinks = [
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
    <>
      {/* Bottom Floating Mobile Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 border-t border-slate-800 backdrop-blur-2xl px-4 py-2 flex items-center justify-around">
        {mainTabs.slice(0, 2).map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center p-1.5 rounded-xl text-[10px] font-semibold transition-colors",
                isActive ? "text-emerald-400" : "text-slate-400 hover:text-slate-200"
              )
            }
          >
            <item.icon className="h-5 w-5 mb-0.5" />
            <span>{item.name}</span>
          </NavLink>
        ))}

        {/* Center Floating Action Button (FAB) */}
        <div className="relative -top-5">
          <button
            onClick={() => setAddTransactionOpen(true)}
            className="h-13 w-13 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center shadow-xl shadow-emerald-500/40 active:scale-95 transition-transform"
            aria-label="Add transaction"
          >
            <Plus className="h-7 w-7 stroke-[3]" />
          </button>
        </div>

        {mainTabs.slice(2, 4).map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center p-1.5 rounded-xl text-[10px] font-semibold transition-colors",
                isActive ? "text-emerald-400" : "text-slate-400 hover:text-slate-200"
              )
            }
          >
            <item.icon className="h-5 w-5 mb-0.5" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Full Mobile Drawer Overlay */}
      {isMobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-4/5 max-w-xs bg-slate-900 border-r border-slate-800 p-5 flex flex-col justify-between shadow-2xl animate-in slide-in-from-left duration-200">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                <div className="flex items-center space-x-2.5">
                  <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <span className="font-bold text-white text-base">FinTrack v2</span>
                </div>
                <button
                  onClick={() => setMobileNavOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-1 overflow-y-auto max-h-[calc(100vh-220px)] pr-1">
                {drawerLinks.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileNavOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center space-x-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors",
                        isActive
                          ? "bg-emerald-500/15 text-emerald-400 font-semibold"
                          : "text-slate-300 hover:bg-slate-800"
                      )
                    }
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </NavLink>
                ))}

                {isAdmin && (
                  <NavLink
                    to="/admin"
                    onClick={() => setMobileNavOpen(false)}
                    className="flex items-center space-x-3 px-3 py-2 rounded-xl text-sm font-semibold text-amber-400 bg-amber-500/10 mt-2"
                  >
                    <ShieldAlert className="h-4 w-4" />
                    <span>{t('nav.admin')}</span>
                  </NavLink>
                )}
              </div>
            </div>

            {/* Drawer User info */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="h-8 w-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">
                  {getInitials(user?.full_name || user?.email)}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-white truncate">{user?.full_name || 'Guest'}</span>
                  <span className="text-[10px] text-slate-400 truncate">{user?.email}</span>
                </div>
              </div>
              <button
                onClick={() => {
                  setMobileNavOpen(false);
                  logout.mutate();
                }}
                className="p-1.5 text-slate-400 hover:text-rose-400"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
