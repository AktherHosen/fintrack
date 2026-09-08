import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ShieldAlert,
  Users,
  CreditCard,
  Layers,
  Megaphone,
  FileText,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useAdmin } from '../../hooks/useAdmin';
import { Badge } from '../ui/badge';
import { ToastContainer } from '../ui/toast-container';
import { cn } from '../../lib/utils';

export function AdminLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isAdmin, isLoading } = useAuth();
  const { pendingPaymentsCount } = useAdmin();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-950 text-zinc-100">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/30 animate-pulse text-zinc-950">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <span className="text-xs text-zinc-500 font-medium">Checking Admin Permissions...</span>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
        <ShieldAlert className="h-16 w-16 text-rose-500 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Access Restricted</h2>
        <p className="text-zinc-400 max-w-md mb-6">
          You need Administrator permissions to view the FinTrack control center.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-5 py-2.5 rounded-xl bg-zinc-800 text-white hover:bg-zinc-700 font-semibold"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const adminNav = [
    { name: 'Dashboard Overview', path: '/admin', exact: true, icon: ShieldAlert },
    { name: 'User Management', path: '/admin/users', icon: Users },
    { name: 'bKash Verification', path: '/admin/payments', icon: CreditCard, count: pendingPaymentsCount },
    { name: 'Plans & Features', path: '/admin/plans', icon: Layers },
    { name: 'Banner Promotions', path: '/admin/banners', icon: Megaphone },
    { name: 'Audit Security Logs', path: '/admin/audit-logs', icon: FileText },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950 text-zinc-100 selection:bg-amber-500 selection:text-zinc-950">
      {/* Admin Sidebar */}
      <aside className="w-60 h-screen sticky top-0 border-r border-zinc-800 bg-zinc-950 p-4 flex flex-col justify-between hidden md:flex shrink-0">
        <div className="flex-1 overflow-y-auto">
          <div className="flex items-center space-x-3 pb-5 border-b border-zinc-800/80 mb-6">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-zinc-950 font-bold shadow-md shadow-amber-500/20">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-100">Admin Hub</h2>
              <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Master Control</p>
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
                    "flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all",
                    isActive
                      ? "bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-xs"
                      : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                  )
                }
              >
                <div className="flex items-center space-x-2.5">
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </div>
                {item.count ? (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-zinc-950">
                    {item.count}
                  </span>
                ) : null}
              </NavLink>
            ))}
          </div>
        </div>

        <div className="pt-3 border-t border-zinc-800 shrink-0">
          <NavLink
            to="/"
            className="flex items-center space-x-2 text-xs font-semibold text-zinc-400 hover:text-white p-2 rounded-lg hover:bg-zinc-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to User App</span>
          </NavLink>
        </div>
      </aside>

      {/* Main Admin Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-800 bg-zinc-950/80 px-6 backdrop-blur-xl">
          <div className="flex items-center space-x-3">
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/30 uppercase tracking-wide">
              ADMIN MODE
            </span>
          </div>
          <NavLink
            to="/"
            className="md:hidden flex items-center space-x-1.5 text-xs text-zinc-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>App</span>
          </NavLink>
        </header>

        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
          <Outlet />
        </main>
      </div>

      <ToastContainer />
    </div>
  );
}
