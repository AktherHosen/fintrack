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
        <h2 className="text-2xl font-black text-white tracking-tight">Admin Overview</h2>
        <p className="text-xs sm:text-sm text-slate-400">System health, bKash transactions, promotions, and subscriber activity</p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border-amber-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/20">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pending bKash Verifications</span>
              <h3 className="text-2xl font-black text-amber-400 mt-1">{pendingPaymentsCount}</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <CreditCard className="h-5 w-5" />
            </div>
          </div>
          {pendingPaymentsCount > 0 && (
            <Link to="/admin/payments" className="text-xs text-amber-400 hover:underline mt-3 flex items-center gap-1 font-bold">
              <span>Review submissions</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </Card>

        <Card className="p-5 border-emerald-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/20">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total BDT Revenue</span>
              <h3 className="text-2xl font-black text-emerald-400 mt-1">{totalRevenue} ৳</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="p-5 border-indigo-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/20">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Banner Campaigns</span>
              <h3 className="text-2xl font-black text-indigo-300 mt-1">{allBanners.filter(b => b.is_active).length}</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
              <Megaphone className="h-5 w-5" />
            </div>
          </div>
          <Link to="/admin/banners" className="text-xs text-indigo-400 hover:underline mt-3 flex items-center gap-1">
            <span>Manage banners</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </Card>

        <Card className="p-5 border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">System Logs</span>
              <h3 className="text-2xl font-black text-slate-100 mt-1">{auditLogs.length} Events</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center font-bold">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>
          <Link to="/admin/audit-logs" className="text-xs text-slate-400 hover:underline mt-3 flex items-center gap-1">
            <span>View audit trail</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </Card>
      </div>

      {/* Quick Action Queue */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Pending Payment Actions</CardTitle>
          <Link to="/admin/payments" className="text-xs text-amber-400 hover:underline">
            View All Payments
          </Link>
        </CardHeader>
        <CardContent>
          {payments.filter((p) => p.status === 'PENDING').length > 0 ? (
            <div className="divide-y divide-slate-800">
              {payments
                .filter((p) => p.status === 'PENDING')
                .map((pay) => (
                  <div key={pay.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{pay.user?.full_name || 'Customer'}</span>
                        <Badge variant="warning">{pay.plan?.name || 'Pro Plan'}</Badge>
                      </div>
                      <span className="text-xs text-slate-400">
                        TrxID: <strong className="font-mono text-amber-400">{pay.transaction_id}</strong> • Sender: {pay.sender_number}
                      </span>
                    </div>
                    <span className="font-bold text-white text-sm">{pay.amount} ৳</span>
                  </div>
                ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              All bKash transactions are up to date. No pending verifications.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
