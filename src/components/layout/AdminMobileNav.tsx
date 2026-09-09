import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Crown,
  Menu,
} from 'lucide-react';
import { useAdmin } from '../../hooks/useAdmin';
import { cn } from '../../lib/utils';

interface AdminMobileNavProps {
  onOpenDrawer: () => void;
}

export function AdminMobileNav({ onOpenDrawer }: AdminMobileNavProps) {
  const { pendingPaymentsCount } = useAdmin();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-zinc-950/95 border-t border-zinc-200 dark:border-zinc-800/90 backdrop-blur-xl pb-safe shadow-lg">
      <div className="grid grid-cols-5 items-center justify-items-center py-1.5 px-2 max-w-md mx-auto relative">
        {/* 1. Dashboard Overview */}
        <NavLink
          to="/admin"
          end
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center justify-center py-1 px-1 rounded-xl text-[10px] font-semibold transition-colors w-full',
              isActive
                ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
            )
          }
        >
          <LayoutDashboard className="h-4 w-4 mb-1" />
          <span className="truncate">Overview</span>
        </NavLink>

        {/* 2. User Management */}
        <NavLink
          to="/admin/users"
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center justify-center py-1 px-1 rounded-xl text-[10px] font-semibold transition-colors w-full',
              isActive
                ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
            )
          }
        >
          <Users className="h-4 w-4 mb-1" />
          <span className="truncate">Users</span>
        </NavLink>

        {/* 3. Subscriptions & Memberships */}
        <NavLink
          to="/admin/subscriptions"
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center justify-center py-1 px-1 rounded-xl text-[10px] font-semibold transition-colors w-full',
              isActive
                ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
            )
          }
        >
          <Crown className="h-4 w-4 mb-1" />
          <span className="truncate">Plans</span>
        </NavLink>

        {/* 4. Payments Verification */}
        <NavLink
          to="/admin/payments"
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center justify-center py-1 px-1 rounded-xl text-[10px] font-semibold transition-colors w-full relative',
              isActive
                ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
            )
          }
        >
          <div className="relative">
            <CreditCard className="h-4 w-4 mb-1" />
            {pendingPaymentsCount > 0 && (
              <span className="absolute -top-1 -right-2 h-3.5 min-w-3.5 px-1 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center">
                {pendingPaymentsCount}
              </span>
            )}
          </div>
          <span className="truncate">Payments</span>
        </NavLink>

        {/* 5. More / Menu Drawer Toggle */}
        <button
          type="button"
          onClick={onOpenDrawer}
          className="flex flex-col items-center justify-center py-1 px-1 rounded-xl text-[10px] font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 transition-colors w-full cursor-pointer"
        >
          <Menu className="h-4 w-4 mb-1" />
          <span className="truncate">More</span>
        </button>
      </div>
    </div>
  );
}
