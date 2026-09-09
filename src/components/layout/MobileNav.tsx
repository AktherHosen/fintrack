import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, Receipt, Plus, PieChart, HandCoins, Settings } from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';
import { cn } from '../../lib/utils';

export function MobileNav() {
  const { t } = useTranslation();
  const { setAddTransactionOpen } = useUIStore();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-zinc-950/95 border-t border-zinc-200 dark:border-zinc-800 backdrop-blur-xl">
      <div className="flex items-center justify-around py-2 px-3 max-w-md mx-auto">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center justify-center p-1 rounded-xl text-[10px] font-semibold transition-colors',
              isActive
                ? 'text-indigo-600 dark:text-zinc-50'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
            )
          }
        >
          <LayoutDashboard className="h-4 w-4 mb-0.5" />
          <span>{t('nav.dashboard')}</span>
        </NavLink>

        <NavLink
          to="/transactions"
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center justify-center p-1 rounded-xl text-[10px] font-semibold transition-colors',
              isActive
                ? 'text-indigo-600 dark:text-zinc-50'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
            )
          }
        >
          <Receipt className="h-4 w-4 mb-0.5" />
          <span>{t('nav.transactions')}</span>
        </NavLink>

        {/* Center Add Button */}
        <button
          onClick={() => setAddTransactionOpen(true)}
          className="h-10 w-10 rounded-full bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-950 flex items-center justify-center shadow-sm active:scale-95 transition-transform"
          aria-label="Add transaction"
        >
          <Plus className="h-5 w-5 stroke-[2.5]" />
        </button>

        <NavLink
          to="/budgets"
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center justify-center p-1 rounded-xl text-[10px] font-semibold transition-colors',
              isActive
                ? 'text-indigo-600 dark:text-zinc-50'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
            )
          }
        >
          <PieChart className="h-4 w-4 mb-0.5" />
          <span>{t('nav.budgets')}</span>
        </NavLink>

        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center justify-center p-1 rounded-xl text-[10px] font-semibold transition-colors',
              isActive
                ? 'text-indigo-600 dark:text-zinc-50'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
            )
          }
        >
          <Settings className="h-4 w-4 mb-0.5" />
          <span>{t('nav.settings')}</span>
        </NavLink>
      </div>
    </div>
  );
}
