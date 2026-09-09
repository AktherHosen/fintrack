import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAdmin } from '../../hooks/useAdmin';
import { useSubscriptions } from '../../hooks/useSubscriptions';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '../../components/ui/table';
import {
  User,
  Search,
  ShieldAlert,
  Crown,
  ChevronRight,
  Sparkles,
  ShoppingBag,
} from 'lucide-react';
import { formatDate } from '../../lib/utils';
import { UserProfile, Subscription, Plan } from '../../types/database';

export function AdminUsersPage() {
  const navigate = useNavigate();
  const { users, payments, subscriptions, isLoading } = useAdmin();
  const { plans } = useSubscriptions();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'USER'>('ALL');

  const filtered = users.filter((u) => {
    if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      u.email.toLowerCase().includes(q) ||
      (u.full_name && u.full_name.toLowerCase().includes(q))
    );
  });

  const getUserSub = (userId: string): Subscription | undefined => {
    return subscriptions.find((s) => s.user_id === userId);
  };

  const getUserPaymentsCount = (userId: string, email?: string): { count: number; total: number } => {
    const list = payments.filter(
      (p) => p.user_id === userId || p.user?.id === userId || (email && p.user?.email === email)
    );
    const total = list
      .filter((p) => p.status === 'APPROVED')
      .reduce((sum, p) => sum + Number(p.amount), 0);
    return { count: list.length, total };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-row items-center justify-between gap-2">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-50 tracking-tight truncate">
            User Directory & Membership Management
          </h2>
          <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
            View subscriber profiles, purchase history, and manage tier upgrades ({users.length} accounts)
          </p>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setRoleFilter('ALL')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                roleFilter === 'ALL'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs font-bold border border-zinc-200/50 dark:border-zinc-700/50'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              All Users ({users.length})
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('ADMIN')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                roleFilter === 'ADMIN'
                  ? 'bg-amber-600 text-white shadow-xs font-bold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>Admins ({users.filter((u) => u.role === 'ADMIN').length})</span>
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('USER')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                roleFilter === 'USER'
                  ? 'bg-indigo-600 text-white shadow-xs font-bold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              <User className="h-3.5 w-3.5" />
              <span>Standard Users ({users.filter((u) => u.role === 'USER').length})</span>
            </button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
          <Input
            type="text"
            placeholder="Search by user name or email..."
            className="pl-10 h-10 text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Users Table */}
      <Card className="border-zinc-200 dark:border-zinc-800 shadow-xs">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-zinc-50 dark:bg-zinc-900/80">
              <TableRow>
                <TableHead className="font-bold uppercase text-[11px]">User</TableHead>
                <TableHead className="font-bold uppercase text-[11px]">Email</TableHead>
                <TableHead className="font-bold uppercase text-[11px]">Current Plan</TableHead>
                <TableHead className="font-bold uppercase text-[11px]">Orders / Spent</TableHead>
                <TableHead className="font-bold uppercase text-[11px]">Joined Date</TableHead>
                <TableHead className="font-bold uppercase text-[11px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length > 0 ? (
                filtered.map((u) => {
                  const sub = getUserSub(u.id);
                  const plan = sub?.plan || plans.find((p) => p.id === sub?.plan_id) || plans[0];
                  const { count: orderCount, total: totalSpent } = getUserPaymentsCount(u.id, u.email);
                  const isProPlan = plan && plan.slug !== 'free';

                  return (
                    <TableRow key={u.id} className="text-xs hover:bg-zinc-50/70 dark:hover:bg-zinc-900/40">
                      <TableCell>
                        <div className="flex items-center space-x-2.5">
                          <div className="h-8.5 w-8.5 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold shrink-0">
                            {isProPlan ? <Crown className="h-4 w-4 text-amber-500" /> : <User className="h-4 w-4" />}
                          </div>
                          <div>
                            <Link
                              to={`/admin/users/${u.id}`}
                              className="font-bold text-zinc-900 dark:text-zinc-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors block truncate"
                            >
                              {u.full_name || 'FinTrack User'}
                            </Link>
                            <span className="font-mono text-[10px] text-zinc-400 truncate block">
                              ID: {u.id.substring(0, 10)}...
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-zinc-600 dark:text-zinc-400">
                        {u.email}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={isProPlan ? 'default' : 'secondary'}
                          className="font-semibold text-[11px]"
                        >
                          {plan?.name || 'Free Starter'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-zinc-900 dark:text-zinc-100 block">
                          {orderCount} order{orderCount === 1 ? '' : 's'}
                        </span>
                        {totalSpent > 0 ? (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                            {totalSpent.toLocaleString()} ৳ spent
                          </span>
                        ) : (
                          <span className="text-[10px] text-zinc-400">No purchases</span>
                        )}
                      </TableCell>
                      <TableCell className="text-zinc-500 dark:text-zinc-400">
                        {formatDate(u.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => navigate(`/admin/users/${u.id}`)}
                          className="h-7.5 text-xs px-2.5 font-medium bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs cursor-pointer inline-flex items-center gap-1"
                        >
                          <span>Manage Plan</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="p-8 text-center text-xs text-zinc-500 dark:text-zinc-400"
                  >
                    {isLoading ? 'Loading users...' : 'No users match your search criteria.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
