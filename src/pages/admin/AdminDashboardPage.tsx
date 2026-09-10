import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  Crown,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

export function AdminDashboardPage() {
  const { t } = useTranslation();
  const { users, payments, pendingPaymentsCount, auditLogs, subscriptions } = useAdmin();
  const { allBanners } = useBanners();

  const subscriptionRevenue = payments
    .filter((p) => p.status === 'APPROVED')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const bannerRevenue = allBanners
    .filter((b) => b.is_active && b.amount_paid) // count active sponsored banners
    .reduce((sum, b) => sum + Number(b.amount_paid), 0);

  const totalRevenue = subscriptionRevenue + bannerRevenue;

  // Distinguish real customers from system administrators
  const customers = users.filter((u) => u.role !== 'ADMIN');
  const adminUsers = users.filter((u) => u.role === 'ADMIN');
  const adminIds = new Set(adminUsers.map((a) => a.id));

  // Customer Pro subscriptions only (exclude admin simulation)
  const customerProCount = subscriptions.filter(
    (s) => s.status === 'ACTIVE' && s.plan?.slug !== 'free' && !adminIds.has(s.user_id)
  ).length;

  return (
    <div className="space-y-3.5 sm:space-y-4.5">
      {/* Header */}
      <div>
        <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-50 tracking-tight truncate">
          {t('admin.overview', 'Admin Overview')}
        </h2>
        <p className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
          {t(
            'admin.overview_desc',
            'System health, multi-gateway payments, promotions, and subscriber activity'
          )}
        </p>
      </div>

      {/* Metrics Row - Responsive 2-col on mobile, 3-col on tablet, 6-col on desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
        {/* 1. Pending Payments */}
        <Card className="p-2.5 sm:p-3.5 border-indigo-500/30 bg-indigo-50/40 dark:bg-gradient-to-br dark:from-zinc-900 dark:via-zinc-900 dark:to-indigo-950/20 shadow-xs hover:border-indigo-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 truncate">
              {t('admin.pending', 'Pending')}
            </span>
            <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <CreditCard className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </div>
          </div>
          <h3 className="text-sm sm:text-lg lg:text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
            {pendingPaymentsCount}
          </h3>
          {pendingPaymentsCount > 0 ? (
            <Link
              to="/admin/payments"
              className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline mt-1 flex items-center gap-0.5 font-bold truncate"
            >
              <span>
                {t('admin.verify', 'Review')} ({pendingPaymentsCount})
              </span>
              <ArrowRight className="h-2.5 w-2.5" />
            </Link>
          ) : (
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 block truncate">
              {t('admin.all_clear', 'All clear')}
            </span>
          )}
        </Card>

        {/* 2. Registered Customers */}
        <Card className="p-2.5 sm:p-3.5 border-blue-500/30 bg-blue-50/40 dark:bg-gradient-to-br dark:from-zinc-900 dark:via-zinc-900 dark:to-blue-950/20 shadow-xs hover:border-blue-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 truncate">
              {t('admin.customers', 'Customers')}
            </span>
            <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Users className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </div>
          </div>
          <h3 className="text-sm sm:text-lg lg:text-xl font-bold text-blue-600 dark:text-blue-400 mt-0.5">
            {customers.length}
          </h3>
          <div className="flex items-center justify-between mt-1">
            <Link
              to="/admin/users"
              className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 font-medium truncate"
            >
              <span>{t('admin.directory', 'Directory')}</span>
              <ArrowRight className="h-2.5 w-2.5" />
            </Link>
            <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-semibold truncate">
              +{adminUsers.length} Admin
            </span>
          </div>
        </Card>

        {/* 3. Pro Subscribers */}
        <Card className="p-2.5 sm:p-3.5 border-purple-500/30 bg-purple-50/40 dark:bg-gradient-to-br dark:from-zinc-900 dark:via-zinc-900 dark:to-purple-950/20 shadow-xs hover:border-purple-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400 truncate">
              {t('admin.pro_members', 'Pro Members')}
            </span>
            <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Crown className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </div>
          </div>
          <h3 className="text-sm sm:text-lg lg:text-xl font-bold text-purple-600 dark:text-purple-400 mt-0.5">
            {customerProCount}
          </h3>
          <Link
            to="/admin/subscriptions"
            className="text-[10px] text-purple-600 dark:text-purple-400 hover:underline mt-1 flex items-center gap-0.5 font-medium truncate"
          >
            <span>{t('admin.memberships', 'Memberships')}</span>
            <ArrowRight className="h-2.5 w-2.5" />
          </Link>
        </Card>

        {/* 4. Total Revenue */}
        <Card className="p-2.5 sm:p-3.5 border-emerald-500/30 bg-emerald-50/40 dark:bg-gradient-to-br dark:from-zinc-900 dark:via-zinc-900 dark:to-emerald-950/20 shadow-xs hover:border-emerald-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 truncate">
              {t('admin.revenue', 'Revenue')}
            </span>
            <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <TrendingUp className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </div>
          </div>
          <h3 className="text-sm sm:text-lg lg:text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 truncate">
            {totalRevenue.toLocaleString()} ৳
          </h3>
          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 block truncate">
            {t('admin.verified', 'Verified')}
          </span>
        </Card>

        {/* 5. Campaigns */}
        <Card className="p-2.5 sm:p-3.5 border-indigo-500/30 bg-indigo-50/40 dark:bg-gradient-to-br dark:from-zinc-900 dark:via-zinc-900 dark:to-indigo-950/20 shadow-xs hover:border-indigo-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 truncate">
              {t('admin.banners', 'Banners')}
            </span>
            <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Megaphone className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </div>
          </div>
          <h3 className="text-sm sm:text-lg lg:text-xl font-bold text-indigo-600 dark:text-indigo-300 mt-0.5">
            {allBanners.filter((b) => b.is_active).length}
          </h3>
          <Link
            to="/admin/banners"
            className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline mt-1 flex items-center gap-0.5 font-medium truncate"
          >
            <span>{t('admin.promotions', 'Promotions')}</span>
            <ArrowRight className="h-2.5 w-2.5" />
          </Link>
        </Card>

        {/* 6. System Logs */}
        <Card className="p-2.5 sm:p-3.5 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 truncate">
              {t('admin.audit_logs', 'Audit Logs')}
            </span>
            <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center shrink-0">
              <ShieldCheck className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </div>
          </div>
          <h3 className="text-sm sm:text-lg lg:text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
            {auditLogs.length}
          </h3>
          <Link
            to="/admin/audit-logs"
            className="text-[10px] text-zinc-600 dark:text-zinc-400 hover:underline mt-1 flex items-center gap-0.5 font-medium truncate"
          >
            <span>{t('admin.audit_trail', 'Audit trail')}</span>
            <ArrowRight className="h-2.5 w-2.5" />
          </Link>
        </Card>
      </div>

      {/* Quick Action Queue */}
      <Card className="border-zinc-200 dark:border-zinc-800 shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between p-3.5 sm:p-4 border-b border-zinc-100 dark:border-zinc-800/80">
          <CardTitle className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">
            {t('admin.pending_verifications', 'Pending Payment Verifications')}
          </CardTitle>
          <Link
            to="/admin/payments"
            className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            {t('admin.view_all', 'View All')}
          </Link>
        </CardHeader>
        <CardContent className="p-3.5 sm:p-4 pt-1 sm:pt-2">
          {payments.filter((p) => p.status === 'PENDING').length > 0 ? (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {payments
                .filter((p) => p.status === 'PENDING')
                .map((pay) => (
                  <div
                    key={pay.id}
                    className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                          {pay.user?.full_name || 'Customer'}
                        </span>
                        <Badge variant="warning" className="text-[10px] px-1.5 py-0">
                          {pay.plan?.name || 'Pro Plan'}
                        </Badge>
                      </div>
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block mt-0.5">
                        {t('admin.trx_id', 'TrxID')}:{' '}
                        <strong className="font-mono text-indigo-600 dark:text-indigo-400">
                          {pay.transaction_id}
                        </strong>{' '}
                        • {t('admin.sender_mobile', 'Sender')}: {pay.sender_number}
                      </span>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3">
                      <span className="font-bold text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm font-mono">
                        {pay.amount} ৳
                      </span>
                      <Link
                        to="/admin/payments"
                        className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        {t('admin.verify', 'Verify')}
                      </Link>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
              <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto mb-1.5" />
              {t(
                'admin.no_pending_payments',
                'All payment submissions are verified. No pending items.'
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
