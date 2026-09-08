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
  const { user, isAdmin } = useAuth();
  const { pendingPaymentsCount } = useAdmin();

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <ShieldAlert className="h-16 w-16 text-rose-500 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Access Restricted</h2>
        <p className="text-slate-400 max-w-md mb-6">
          You need Administrator permissions to view the FinTrack control center.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-5 py-2.5 rounded-xl bg-slate-800 text-white hover:bg-slate-700 font-semibold"
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
    <div className="flex min-h-screen bg-slate-950 text-slate-100 selection:bg-amber-500 selection:text-slate-950">
      {/* Admin Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-slate-950/95 p-4 flex flex-col justify-between hidden md:flex">
        <div>
          <div className="flex items-center space-x-3 pb-5 border-b border-slate-800/80 mb-6">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-amber-500/20">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">Admin Hub</h2>
              <p className="text-[11px] text-amber-400 font-bold uppercase tracking-wider">Master Control</p>
            </div>
          </div>

          <div className="space-y-1.5">
            {adminNav.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                className={({ isActive }) =>
                  cn(
                    "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all",
                    isActive
                      ? "bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm"
                      : "text-slate-400 hover:bg-slate-900 hover:text-white"
                  )
                }
              >
                <div className="flex items-center space-x-3">
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </div>
                {item.count ? (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-slate-950">
                    {item.count}
                  </span>
                ) : null}
              </NavLink>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800">
          <NavLink
            to="/"
            className="flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to User App</span>
          </NavLink>
        </div>
      </aside>

      {/* Main Admin Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex h-16 items-center justify-between border-b border-slate-800 bg-slate-950/80 px-6 backdrop-blur-xl">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase tracking-wide">
              ADMIN MODE
            </span>
          </div>
          <NavLink
            to="/"
            className="md:hidden flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white"
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
