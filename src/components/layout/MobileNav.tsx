import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, Receipt, Plus, PieChart, Settings } from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';
import { cn } from '../../lib/utils';

export function MobileNav() {
  const { t } = useTranslation();
  const { setAddTransactionOpen } = useUIStore();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-zinc-950/95 border-t border-zinc-200 dark:border-zinc-800/90 backdrop-blur-xl pb-safe">
      <div className="grid grid-cols-5 items-center justify-items-center py-1.5 px-2 max-w-md mx-auto relative">
        {/* 1. Dashboard */}
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-semibold transition-colors w-full',
              isActive
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
            )
          }
        >
          <LayoutDashboard className="h-4 w-4 mb-1" />
          <span className="truncate">{t('nav.dashboard')}</span>
        </NavLink>

        {/* 2. Transactions */}
        <NavLink
          to="/transactions"
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-semibold transition-colors w-full',
              isActive
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
            )
          }
        >
          <Receipt className="h-4 w-4 mb-1" />
          <span className="truncate">{t('nav.transactions')}</span>
        </NavLink>

        {/* 3. Center Elevated + Action Button */}
        <div className="flex flex-col items-center justify-center -mt-6">
          <button
            onClick={() => setAddTransactionOpen(true)}
            className="h-12 w-12 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 ring-4 ring-white dark:ring-zinc-950 active:scale-90 transition-all cursor-pointer group"
            aria-label={t('dashboard.add_transaction', 'Add transaction')}
            title={t('dashboard.add_transaction', 'Add new transaction')}
          >
            <Plus className="h-6 w-6 stroke-[2.5] group-hover:rotate-90 transition-transform duration-200" />
          </button>
          <span className="text-[9px] font-bold text-zinc-600 dark:text-zinc-400 mt-0.5">{t('common.add', 'Add')}</span>
        </div>

        {/* 4. Budgets */}
        <NavLink
          to="/budgets"
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-semibold transition-colors w-full',
              isActive
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
            )
          }
        >
          <PieChart className="h-4 w-4 mb-1" />
          <span className="truncate">{t('nav.budgets')}</span>
        </NavLink>

        {/* 5. Settings */}
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-semibold transition-colors w-full',
              isActive
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
            )
          }
        >
          <Settings className="h-4 w-4 mb-1" />
          <span className="truncate">{t('nav.settings')}</span>
        </NavLink>
      </div>
    </div>
  );
}
