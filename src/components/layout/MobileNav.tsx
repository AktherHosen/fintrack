import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Receipt,
  Plus,
  PieChart,
  HandCoins,
  Settings,
  Wallet,
  ArrowLeftRight,
} from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';
import { cn } from '../../lib/utils';

export function MobileNav() {
  const { t } = useTranslation();
  const { setAddTransactionOpen } = useUIStore();

  const navItems = [
    { name: t('nav.dashboard'), path: '/', icon: LayoutDashboard },
    { name: t('nav.transactions'), path: '/transactions', icon: Receipt },
    { name: t('nav.budgets'), path: '/budgets', icon: PieChart },
    { name: t('nav.loans'), path: '/loans', icon: HandCoins },
    { name: t('nav.settings'), path: '/settings', icon: Settings },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0b101b]/95 border-t border-slate-800/80 backdrop-blur-xl">
      <div className="max-w-md mx-auto flex items-center justify-around py-1.5 px-2">
        {/* Item 1: Home */}
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200",
              isActive ? "text-emerald-400 font-bold" : "text-slate-400 hover:text-slate-200"
            )
          }
        >
          {({ isActive }) => (
            <>
              <div className={cn("px-3.5 py-1 rounded-full mb-0.5 transition-all", isActive && "bg-emerald-500/15")}>
                <LayoutDashboard className="h-5 w-5" />
              </div>
              <span className="text-[10px] tracking-tight">{t('nav.dashboard')}</span>
            </>
          )}
        </NavLink>

        {/* Item 2: Transactions */}
        <NavLink
          to="/transactions"
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200",
              isActive ? "text-emerald-400 font-bold" : "text-slate-400 hover:text-slate-200"
            )
          }
        >
          {({ isActive }) => (
            <>
              <div className={cn("px-3.5 py-1 rounded-full mb-0.5 transition-all", isActive && "bg-emerald-500/15")}>
                <Receipt className="h-5 w-5" />
              </div>
              <span className="text-[10px] tracking-tight">{t('nav.transactions')}</span>
            </>
          )}
        </NavLink>

        {/* Center Floating Action Button (FAB) */}
        <div className="relative -top-4 px-1">
          <button
            onClick={() => setAddTransactionOpen(true)}
            className="h-12 w-12 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/30 active:scale-95 transition-all hover:bg-emerald-400"
            aria-label="Add transaction"
          >
            <Plus className="h-6 w-6 stroke-[3]" />
          </button>
        </div>

        {/* Item 3: Budgets */}
        <NavLink
          to="/budgets"
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200",
              isActive ? "text-emerald-400 font-bold" : "text-slate-400 hover:text-slate-200"
            )
          }
        >
          {({ isActive }) => (
            <>
              <div className={cn("px-3.5 py-1 rounded-full mb-0.5 transition-all", isActive && "bg-emerald-500/15")}>
                <PieChart className="h-5 w-5" />
              </div>
              <span className="text-[10px] tracking-tight">{t('nav.budgets')}</span>
            </>
          )}
        </NavLink>

        {/* Item 4: Loans */}
        <NavLink
          to="/loans"
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200",
              isActive ? "text-emerald-400 font-bold" : "text-slate-400 hover:text-slate-200"
            )
          }
        >
          {({ isActive }) => (
            <>
              <div className={cn("px-3.5 py-1 rounded-full mb-0.5 transition-all", isActive && "bg-emerald-500/15")}>
                <HandCoins className="h-5 w-5" />
              </div>
              <span className="text-[10px] tracking-tight">{t('nav.loans')}</span>
            </>
          )}
        </NavLink>
      </div>
    </div>
  );
}
