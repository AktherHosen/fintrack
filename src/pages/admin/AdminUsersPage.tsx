import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAdmin } from '../../hooks/useAdmin';
import { useSubscriptions } from '../../hooks/useSubscriptions';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { ConfirmDialog } from '../../components/modals/ConfirmDialog';
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
  ChevronDown,
  ShoppingBag,
  MoreVertical,
  Copy,
  Settings,
  Trash2,
} from 'lucide-react';
import { formatDate } from '../../lib/utils';
import { UserProfile, Subscription, Plan } from '../../types/database';
import { CircularProgressLoader } from '../../components/ui/spinner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { toast } from '../../components/ui/sonner';

export function AdminUsersPage() {
  const navigate = useNavigate();
  const { users, payments, subscriptions, isLoading, deleteUser } = useAdmin();
  const { plans } = useSubscriptions();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'USER'>('ALL');
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);

  const filtered = users.filter((u) => {
    if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      u.email.toLowerCase().includes(q) ||
      (u.full_name && u.full_name.toLowerCase().includes(q))
    );
  }).sort((a, b) => {
    // Admins always on top
    if (a.role === 'ADMIN' && b.role !== 'ADMIN') return -1;
    if (a.role !== 'ADMIN' && b.role === 'ADMIN') return 1;
    return 0;
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

  const customers = users.filter((u) => u.role !== 'ADMIN');
  const admins = users.filter((u) => u.role === 'ADMIN');

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-50 tracking-tight truncate">
          User Directory & Membership Management
        </h2>
        <p className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
          {customers.length} Customers • {admins.length} System Controller • Manage tier upgrades & timelines
        </p>
      </div>

      {/* Filter and Search Controls */}
      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1 p-0.5 bg-zinc-100 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 text-[11px] sm:text-xs font-semibold overflow-x-auto no-scrollbar max-w-full">
            <button
              type="button"
              onClick={() => setRoleFilter('ALL')}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-md transition-all whitespace-nowrap ${roleFilter === 'ALL'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs font-bold border border-zinc-200/50 dark:border-zinc-700/50'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
            >
              All Accounts ({users.length})
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('USER')}
              className={`flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-md transition-all whitespace-nowrap ${roleFilter === 'USER'
                ? 'bg-indigo-600 text-white shadow-xs font-bold'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
            >
              <User className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span>Customers ({customers.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('ADMIN')}
              className={`flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-md transition-all whitespace-nowrap ${roleFilter === 'ADMIN'
                ? 'bg-amber-600 text-white shadow-xs font-bold'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
            >
              <ShieldAlert className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span>System Controller ({admins.length})</span>
            </button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
          <Input
            type="text"
            placeholder="Search by user name or email..."
            className="pl-9 h-8 sm:h-9 text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Mobile User Cards (< md screen) */}
      <div className="block md:hidden space-y-2.5">
        {filtered.length > 0 ? (
          filtered.map((u) => {
            const sub = getUserSub(u.id);
            const plan = sub?.plan || plans.find((p) => p.id === sub?.plan_id) || plans[0];
            const { count: orderCount, total: totalSpent } = getUserPaymentsCount(u.id, u.email);
            const isProPlan = plan && plan.slug !== 'free';

            return (
              <Card
                key={u.id}
                className="p-3 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 shadow-xs space-y-2.5"
              >
                {/* User Row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div className="h-8.5 w-8.5 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold shrink-0">
                      {isProPlan ? <Crown className="h-4 w-4 text-amber-500" /> : <User className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0">
                      <Link
                        to={`/admin/users/${u.id}`}
                        className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors block truncate"
                      >
                        {u.full_name || 'FinTrack User'}
                      </Link>
                      <span className="font-mono text-[10px] text-zinc-500 dark:text-zinc-400 block truncate">
                        {u.email}
                      </span>
                    </div>
                  </div>

                  <Badge
                    variant={isProPlan ? 'default' : 'secondary'}
                    className="font-semibold text-[10px] shrink-0"
                  >
                    {plan?.name || 'Free Starter'}
                  </Badge>
                </div>

                {/* Info grid */}
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                  <div className="bg-zinc-50 dark:bg-zinc-900/90 p-2 rounded-lg border border-zinc-100 dark:border-zinc-800/60">
                    <span className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider block">
                      Orders & Spend
                    </span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200 block mt-0.5">
                      {orderCount} order{orderCount === 1 ? '' : 's'}
                    </span>
                    {totalSpent > 0 ? (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold font-mono block">
                        {totalSpent.toLocaleString()} ৳ spent
                      </span>
                    ) : (
                      <span className="text-[10px] text-zinc-400 block">No purchases</span>
                    )}
                  </div>

                  <div className="bg-zinc-50 dark:bg-zinc-900/90 p-2 rounded-lg border border-zinc-100 dark:border-zinc-800/60">
                    <span className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider block">
                      Account Type
                    </span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200 block mt-0.5">
                      {u.role === 'ADMIN' ? '👑 System Controller' : 'Standard Customer'}
                    </span>
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block">
                      Joined {formatDate(u.created_at)}
                    </span>
                  </div>
                </div>

                {/* Actions Dropdown */}
                <div className="flex justify-end pt-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs font-semibold border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 cursor-pointer flex items-center gap-1.5 px-3"
                      >
                        <Settings className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                        <span>Actions</span>
                        <ChevronDown className="h-3.5 w-3.5 text-zinc-400 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>User Actions</DropdownMenuLabel>
                    <DropdownMenuItem
                      onClick={() => navigate(`/admin/users/${u.id}`)}
                      className="cursor-pointer"
                    >
                      <Crown className="h-3.5 w-3.5 mr-2 text-indigo-600 dark:text-indigo-400" />
                      {u.role === 'ADMIN' ? 'Simulate / Test Plan' : 'Manage Plan & Timeline'}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        navigator.clipboard.writeText(u.email);
                        toast.success('Email copied to clipboard');
                      }}
                      className="cursor-pointer"
                    >
                      <Copy className="h-3.5 w-3.5 mr-2 text-zinc-500" />
                      Copy Email
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        navigator.clipboard.writeText(u.id);
                        toast.success('User ID copied to clipboard');
                      }}
                      className="cursor-pointer"
                    >
                      <Copy className="h-3.5 w-3.5 mr-2 text-zinc-500" />
                      Copy User ID
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => navigate(`/admin/payments`)}
                      className="cursor-pointer"
                    >
                      <ShoppingBag className="h-3.5 w-3.5 mr-2 text-emerald-600 dark:text-emerald-400" />
                      View Order Submissions
                    </DropdownMenuItem>
                    {u.role !== 'ADMIN' && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setDeleteUserId(u.id)}
                          className="cursor-pointer text-rose-600 dark:text-rose-400 focus:text-rose-600 dark:focus:text-rose-400"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-2" />
                          Delete Customer
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
                </div>
              </Card>
            );
          })
        ) : (
          <Card className="p-6 text-center text-xs text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800">
            {isLoading ? (
              <CircularProgressLoader size="md" />
            ) : (
              'No users match your search criteria.'
            )}
          </Card>
        )}
      </div>

      {/* Desktop Table View (>= md screen) */}
      <Card className="hidden md:block border-zinc-200 dark:border-zinc-800 shadow-xs overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-zinc-50 dark:bg-zinc-900/80">
                <TableRow>
                  <TableHead className="font-bold uppercase text-[11px] py-2.5 px-3">User</TableHead>
                  <TableHead className="font-bold uppercase text-[11px] py-2.5 px-3">Email</TableHead>
                  <TableHead className="font-bold uppercase text-[11px] py-2.5 px-3">Current Plan</TableHead>
                  <TableHead className="font-bold uppercase text-[11px] py-2.5 px-3">Orders / Spent</TableHead>
                  <TableHead className="font-bold uppercase text-[11px] py-2.5 px-3">Joined Date</TableHead>
                  <TableHead className="font-bold uppercase text-[11px] py-2.5 px-3 text-right">Actions</TableHead>
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
                        <TableCell className="py-2.5 px-3">
                          <div className="flex items-center space-x-2.5">
                            <div className="h-8.5 w-8.5 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold shrink-0">
                              {isProPlan ? <Crown className="h-4 w-4 text-amber-500" /> : <User className="h-4 w-4" />}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <Link
                                  to={`/admin/users/${u.id}`}
                                  className="font-bold text-zinc-900 dark:text-zinc-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors block truncate"
                                >
                                  {u.full_name || 'FinTrack User'}
                                </Link>
                                {u.role === 'ADMIN' && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                    CONTROLLER
                                  </span>
                                )}
                              </div>
                              <span className="font-mono text-[10px] text-zinc-400 truncate block">
                                ID: {u.id.substring(0, 10)}...
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-2.5 px-3 font-mono text-zinc-600 dark:text-zinc-400">
                          {u.email}
                        </TableCell>
                        <TableCell className="py-2.5 px-3">
                          <Badge
                            variant={isProPlan ? 'default' : 'secondary'}
                            className="font-semibold text-[11px]"
                          >
                            {plan?.name || 'Free Starter'}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-2.5 px-3">
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
                        <TableCell className="py-2.5 px-3 text-zinc-500 dark:text-zinc-400">
                          {formatDate(u.created_at)}
                        </TableCell>
                        <TableCell className="py-2.5 px-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs px-2.5 font-medium border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer inline-flex items-center gap-1.5"
                              >
                                <span>Actions</span>
                                <ChevronDown className="h-3 w-3 text-zinc-400" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52">
                              <DropdownMenuLabel>User Actions</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => navigate(`/admin/users/${u.id}`)}
                                className="cursor-pointer"
                              >
                                <Crown className="h-3.5 w-3.5 mr-2 text-indigo-600 dark:text-indigo-400" />
                                {u.role === 'ADMIN' ? 'Simulate / Test Plan' : 'Manage Plan & Timeline'}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  navigator.clipboard.writeText(u.email);
                                  toast.success('Email copied to clipboard');
                                }}
                                className="cursor-pointer"
                              >
                                <Copy className="h-3.5 w-3.5 mr-2 text-zinc-500" />
                                Copy Email
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  navigator.clipboard.writeText(u.id);
                                  toast.success('User ID copied to clipboard');
                                }}
                                className="cursor-pointer"
                              >
                                <Copy className="h-3.5 w-3.5 mr-2 text-zinc-500" />
                                Copy User ID
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => navigate(`/admin/payments`)}
                                className="cursor-pointer"
                              >
                                <ShoppingBag className="h-3.5 w-3.5 mr-2 text-emerald-600 dark:text-emerald-400" />
                                View Orders
                              </DropdownMenuItem>
                              {u.role !== 'ADMIN' && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => setDeleteUserId(u.id)}
                                    className="cursor-pointer text-rose-600 dark:text-rose-400 focus:text-rose-600 dark:focus:text-rose-400"
                                  >
                                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                                    Delete Customer
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
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
                      {isLoading ? (
                        <CircularProgressLoader size="md" />
                      ) : (
                        'No users match your search criteria.'
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete User Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteUserId}
        onOpenChange={(open) => !open && setDeleteUserId(null)}
        title="Delete Customer"
        description={
          <span>
            Are you sure you want to permanently delete this customer? This will remove all their data including{' '}
            <strong>accounts, transactions, budgets, loans, subscriptions, and payment history</strong>. This action cannot be undone.
          </span>
        }
        confirmLabel="Delete Permanently"
        variant="danger"
        isPending={deleteUser.isPending}
        onConfirm={() => {
          if (deleteUserId) {
            deleteUser.mutate(deleteUserId, {
              onSuccess: () => setDeleteUserId(null),
            });
          }
        }}
      />
    </div>
  );
}
