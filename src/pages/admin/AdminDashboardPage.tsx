import React from 'react';
import { Link } from 'react-router-dom';
import { useAdmin } from '../../hooks/useAdmin';
import { useBanners } from '../../hooks/useBanners';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import {
  Users,
  CreditCard,
  Megaphone,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';

export function AdminDashboardPage() {
  const { payments, pendingPaymentsCount, auditLogs } = useAdmin();
  const { allBanners } = useBanners();

  const totalRevenue = payments
    .filter((p) => p.status === 'APPROVED')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">Admin Overview</h2>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">System health, bKash transactions, promotions, and subscriber activity</p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border-amber-500/30 bg-amber-50/50 dark:bg-gradient-to-br dark:from-zinc-900 dark:via-zinc-900 dark:to-amber-950/20 shadow-xs hover:border-amber-500/50 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Pending bKash</span>
              <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{pendingPaymentsCount}</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <CreditCard className="h-5 w-5" />
            </div>
          </div>
          {pendingPaymentsCount > 0 ? (
            <Link to="/admin/payments" className="text-xs text-amber-600 dark:text-amber-400 hover:underline mt-3 flex items-center gap-1 font-bold">
              <span>Review submissions</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          ) : (
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-3 block">All clear</span>
          )}
        </Card>

        <Card className="p-5 border-emerald-500/30 bg-emerald-50/50 dark:bg-gradient-to-br dark:from-zinc-900 dark:via-zinc-900 dark:to-emerald-950/20 shadow-xs hover:border-emerald-500/50 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Total BDT Revenue</span>
              <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{totalRevenue.toLocaleString()} ৳</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-3 block">Lifetime verified payments</span>
        </Card>

        <Card className="p-5 border-indigo-500/30 bg-indigo-50/50 dark:bg-gradient-to-br dark:from-zinc-900 dark:via-zinc-900 dark:to-indigo-950/20 shadow-xs hover:border-indigo-500/50 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">Active Campaigns</span>
              <h3 className="text-2xl font-black text-indigo-600 dark:text-indigo-300 mt-1">{allBanners.filter(b => b.is_active).length}</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Megaphone className="h-5 w-5" />
            </div>
          </div>
          <Link to="/admin/banners" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline mt-3 flex items-center gap-1 font-medium">
            <span>Manage banners</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </Card>

        <Card className="p-5 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">System Logs</span>
              <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mt-1">{auditLogs.length}</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center font-bold">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>
          <Link to="/admin/audit-logs" className="text-xs text-zinc-600 dark:text-zinc-400 hover:underline mt-3 flex items-center gap-1 font-medium">
            <span>View audit trail</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </Card>
      </div>

      {/* Quick Action Queue */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <CardTitle className="text-base text-zinc-900 dark:text-zinc-100">Pending Payment Actions</CardTitle>
          <Link to="/admin/payments" className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline">
            View All Payments
          </Link>
        </CardHeader>
        <CardContent className="pt-4">
          {payments.filter((p) => p.status === 'PENDING').length > 0 ? (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {payments
                .filter((p) => p.status === 'PENDING')
                .map((pay) => (
                  <div key={pay.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{pay.user?.full_name || 'Customer'}</span>
                        <Badge variant="warning">{pay.plan?.name || 'Pro Plan'}</Badge>
                      </div>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">
                        TrxID: <strong className="font-mono text-amber-600 dark:text-amber-400">{pay.transaction_id}</strong> • Sender: {pay.sender_number}
                      </span>
                    </div>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">{pay.amount} ৳</span>
                  </div>
                ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-zinc-500 dark:text-zinc-400">
              All bKash transactions are up to date. No pending verifications.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
