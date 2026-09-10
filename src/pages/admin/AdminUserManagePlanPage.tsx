import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAdmin } from '../../hooks/useAdmin';
import { useSubscriptions } from '../../hooks/useSubscriptions';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  User,
  Crown,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Mail,
  Smartphone,
  Building2,
  CreditCard,
  Clock,
  Receipt,
  History,
} from 'lucide-react';
import { formatDate } from '../../lib/utils';
import { Plan } from '../../types/database';
import { CircularProgressLoader } from '../../components/ui/spinner';

export function AdminUserManagePlanPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const {
    users,
    payments,
    auditLogs,
    subscriptions,
    assignUserPlan,
    cancelUserPlan,
    approvePayment,
    rejectPayment,
    isLoading,
  } = useAdmin();
  const { plans } = useSubscriptions();

  const user = users.find((u) => u.id === userId);
  const sub = subscriptions.find((s) => s.user_id === userId);
  const isExpired = Boolean(
    sub?.expires_at &&
    new Date(sub.expires_at).getFullYear() < 2090 &&
    new Date(sub.expires_at).getTime() < Date.now()
  );
  const freePlan = plans.find((p) => p.slug === 'free') || plans[0];
  const assignedPlan = sub?.plan || plans.find((p) => p.id === sub?.plan_id);
  const currentPlan = isExpired ? freePlan : assignedPlan || freePlan;

  const userPayments = payments.filter(
    (p) =>
      p.user_id === userId || p.user?.id === userId || (user?.email && p.user?.email === user.email)
  );
  const userLogs = auditLogs.filter(
    (l) =>
      l.user_id === userId ||
      l.details?.user_id === userId ||
      (user?.email && l.details?.email === user.email)
  );

  // Form State
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [durationOption, setDurationOption] = useState<string>('30');
  const [customDays, setCustomDays] = useState<string>('30');
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'PAYMENTS' | 'ACTIVITY'>('OVERVIEW');

  // Set selected plan when currentPlan or plans load
  React.useEffect(() => {
    if (currentPlan?.id) {
      setSelectedPlanId(currentPlan.id);
    } else if (plans.length > 0 && !selectedPlanId) {
      setSelectedPlanId(plans[0].id);
    }
  }, [currentPlan?.id, plans, selectedPlanId]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <CircularProgressLoader size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-3 max-w-md mx-auto text-center py-8">
        <AlertCircle className="h-8 w-8 text-rose-500 mx-auto" />
        <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">User Not Found</h2>
        <p className="text-xs text-zinc-500">
          The requested user ID does not exist or has been removed.
        </p>
        <Button
          onClick={() => navigate('/admin/users')}
          size="sm"
          variant="default"
          className="text-xs h-8"
        >
          <ArrowLeft className="h-3.5 w-3.5 mr-1" />
          Back to Directory
        </Button>
      </div>
    );
  }

  const isLifetime =
    currentPlan?.billing_cycle === 'LIFETIME' ||
    (sub?.expires_at && new Date(sub.expires_at).getFullYear() > 2090);
  const isPro = currentPlan && currentPlan.slug !== 'free' && !isExpired;

  const handleAssignPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanId) return;

    let days = parseInt(durationOption, 10);
    if (durationOption === 'CUSTOM') {
      days = parseInt(customDays, 10) || 30;
    } else if (durationOption === 'LIFETIME') {
      days = 36500;
    }

    assignUserPlan.mutate({
      userId: user.id,
      planId: selectedPlanId,
      durationDays: days,
      notes: adminNotes.trim() || 'Admin manual plan upgrade',
    });
  };

  const handleRevertToFree = () => {
    cancelUserPlan.mutate({
      userId: user.id,
      reason: 'Reverted to Free Starter by Administrator',
    });
  };

  const getMethodBadge = (method: string) => {
    switch (method) {
      case 'BKASH':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20">
            <Smartphone className="h-2.5 w-2.5" />
            bKash
          </span>
        );
      case 'NAGAD':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
            <Smartphone className="h-2.5 w-2.5" />
            Nagad
          </span>
        );
      case 'ROCKET':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <Smartphone className="h-2.5 w-2.5" />
            Rocket
          </span>
        );
      case 'BANK_TRANSFER':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Building2 className="h-2.5 w-2.5" />
            Bank
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20">
            <CreditCard className="h-2.5 w-2.5" />
            {method}
          </span>
        );
    }
  };

  const activePlanBadge = () => {
    if (isExpired) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          Expired • Reverted to Free
        </span>
      );
    }
    if (isLifetime) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20">
          Lifetime Access
        </span>
      );
    }
    if (isPro) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          Active Subscription
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20">
        Free Tier
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Top Breadcrumb & User Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin/users')}
            className="h-8 w-8 p-0 rounded-lg cursor-pointer"
            title="Back to User Directory"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
                {user.full_name || 'FinTrack User'}
              </h1>
              {user.role === 'ADMIN' && (
                <Badge variant="warning" className="text-[10px] py-0 px-1.5 font-bold">
                  ADMIN
                </Badge>
              )}
              {activePlanBadge()}
            </div>
            <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              <span>{user.email}</span>
              <span>•</span>
              <span>Joined {formatDate(user.created_at)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/admin/users')}
            className="text-xs h-8 cursor-pointer"
          >
            All Users
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/admin/payments')}
            className="text-xs h-8 cursor-pointer"
          >
            Orders ({userPayments.length})
          </Button>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-semibold w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('OVERVIEW')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer ${
            activeTab === 'OVERVIEW'
              ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs font-bold'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          <Crown className="h-3.5 w-3.5 text-amber-500" />
          <span>Plan & Upgrade</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('PAYMENTS')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer ${
            activeTab === 'PAYMENTS'
              ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs font-bold'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          <Receipt className="h-3.5 w-3.5 text-indigo-500" />
          <span>Orders ({userPayments.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('ACTIVITY')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer ${
            activeTab === 'ACTIVITY'
              ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs font-bold'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          <History className="h-3.5 w-3.5 text-zinc-500" />
          <span>Logs ({userLogs.length})</span>
        </button>
      </div>

      {/* Tab 1: OVERVIEW & PLAN ASSIGNMENT */}
      {activeTab === 'OVERVIEW' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Column: Current Active Tier Info Card */}
          <Card className="p-4 border-indigo-500/30 bg-gradient-to-br from-white via-indigo-50/20 to-indigo-50/40 dark:from-zinc-950 dark:via-zinc-900 dark:to-indigo-950/20 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                  Active Tier
                </span>
                <Crown className="h-4 w-4 text-amber-500" />
              </div>

              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50 mt-0.5">
                {currentPlan?.name || 'Free Starter'}
              </h3>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5 line-clamp-2">
                {currentPlan?.description}
              </p>

              <div className="space-y-1.5 mt-3.5 pt-3 border-t border-indigo-200/60 dark:border-indigo-900/40 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 dark:text-zinc-400">Status:</span>
                  {isExpired ? (
                    <span className="font-bold text-rose-600 dark:text-rose-400 inline-flex items-center gap-1 text-[10px]">
                      <Clock className="h-3 w-3" />
                      EXPIRED (Reverted to Free)
                    </span>
                  ) : (
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      {sub?.status || 'ACTIVE'}
                    </span>
                  )}
                </div>
                {isExpired && assignedPlan && (
                  <div className="flex items-center justify-between text-[10px] text-zinc-500">
                    <span>Expired Tier:</span>
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                      {assignedPlan.name}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 dark:text-zinc-400">Pricing:</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                    {currentPlan?.price
                      ? `${currentPlan.price} ৳ / ${currentPlan.billing_cycle}`
                      : 'Free'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 dark:text-zinc-400">Expires:</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">
                    {isLifetime
                      ? 'Permanent'
                      : sub?.expires_at
                        ? formatDate(sub.expires_at)
                        : 'Permanent'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 dark:text-zinc-400">Accounts Limit:</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">
                    {currentPlan?.limits?.max_accounts && currentPlan.limits.max_accounts > 500
                      ? 'Unlimited'
                      : `${currentPlan?.limits?.max_accounts || 3} Wallets`}
                  </span>
                </div>
              </div>
            </div>

            {isPro && (
              <div className="pt-3 mt-1 border-t border-zinc-100 dark:border-zinc-800">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleRevertToFree}
                  disabled={cancelUserPlan.isPending}
                  className="w-full text-xs h-7.5"
                >
                  Reset to Free Starter
                </Button>
              </div>
            )}
          </Card>

          {/* Interactive Plan Assignment Form */}
          <div className="lg:col-span-2">
            <Card className="p-3.5 sm:p-5 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
              <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3 mb-3.5">
                <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Assign Plan & Set Validity
                </h3>
                <p className="text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Select tier, validity duration, and activate immediately for this user
                </p>
              </div>

              <form onSubmit={handleAssignPlan} className="space-y-3.5">
                <div>
                  <Label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                    Select Plan Tier
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1.5">
                    {plans.map((p) => {
                      const isSelected = selectedPlanId === p.id;
                      return (
                        <div
                          key={p.id}
                          onClick={() => setSelectedPlanId(p.id)}
                          className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 ring-1 ring-indigo-600/30'
                              : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-zinc-900 dark:text-zinc-100 text-xs">
                              {p.name}
                            </span>
                            <span className="font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                              {p.price ? `${p.price} ৳` : 'Free'}
                            </span>
                          </div>
                          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block mt-0.5 line-clamp-1">
                            {p.description}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                      Validity Period
                    </Label>
                    <Select value={durationOption} onValueChange={(val) => setDurationOption(val)}>
                      <SelectTrigger className="h-8.5 text-xs mt-1">
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">1 Month (30 Days)</SelectItem>
                        <SelectItem value="90">3 Months (90 Days)</SelectItem>
                        <SelectItem value="180">6 Months (180 Days)</SelectItem>
                        <SelectItem value="365">1 Year (365 Days)</SelectItem>
                        <SelectItem value="LIFETIME">Lifetime Access</SelectItem>
                        <SelectItem value="CUSTOM">Custom Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {durationOption === 'CUSTOM' ? (
                    <div>
                      <Label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                        Custom Days
                      </Label>
                      <Input
                        type="number"
                        min="1"
                        max="36500"
                        className="h-8.5 text-xs mt-1"
                        value={customDays}
                        onChange={(e) => setCustomDays(e.target.value)}
                        placeholder="e.g. 45"
                      />
                    </div>
                  ) : (
                    <div>
                      <Label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                        Auto-Renew
                      </Label>
                      <div className="h-8.5 mt-1 px-2.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex items-center text-[11px] text-zinc-600 dark:text-zinc-400">
                        {durationOption === 'LIFETIME' ? 'Permanent' : 'Enabled'}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                    Admin Notes (Optional)
                  </Label>
                  <Input
                    type="text"
                    className="h-8.5 text-xs mt-1"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="e.g. Verified manual MFS payment"
                  />
                </div>

                <div className="pt-1 flex items-center justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/admin/users')}
                    className="text-xs h-8 px-3"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="default"
                    size="sm"
                    disabled={assignUserPlan.isPending}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-8 px-3.5 text-xs"
                  >
                    {assignUserPlan.isPending ? 'Assigning...' : 'Save & Assign'}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: PURCHASE HISTORY */}
      {activeTab === 'PAYMENTS' && (
        <Card className="p-3.5 sm:p-5 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
          <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3 mb-3.5">
            <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Payment Transactions
            </h3>
            <p className="text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              Order submissions for {user.full_name || user.email}
            </p>
          </div>

          {userPayments.length > 0 ? (
            <div className="relative pl-5 space-y-3 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-200 dark:before:bg-zinc-800">
              {userPayments.map((p) => (
                <div key={p.id} className="relative group">
                  <div className="absolute -left-[19px] top-1.5 h-3 w-3 rounded-full bg-indigo-600 border-2 border-white dark:border-zinc-950" />
                  <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-zinc-900 dark:text-zinc-100 text-xs">
                          {p.plan?.name || 'Pro Plan'}
                        </span>
                        {getMethodBadge(p.payment_method)}
                      </div>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs font-mono">
                        {p.amount} ৳
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                      <div>
                        TrxID:{' '}
                        <strong className="font-mono text-indigo-600 dark:text-indigo-400">
                          {p.transaction_id}
                        </strong>
                      </div>
                      <div>Sender: {p.sender_number}</div>
                      <div>Date: {formatDate(p.created_at)}</div>
                    </div>

                    <div className="flex items-center justify-between pt-1.5 border-t border-zinc-200/60 dark:border-zinc-800/60">
                      <Badge
                        variant={
                          p.status === 'APPROVED'
                            ? 'default'
                            : p.status === 'PENDING'
                              ? 'warning'
                              : 'destructive'
                        }
                        className="text-[9px] px-1.5 py-0"
                      >
                        {p.status}
                      </Badge>

                      {p.status === 'PENDING' && (
                        <div className="space-x-1.5">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() =>
                              approvePayment.mutate({
                                payment_id: p.id,
                                plan_id: p.plan_id,
                                user_id: user.id,
                              })
                            }
                            className="h-6 text-[10px] px-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              rejectPayment.mutate({
                                payment_id: p.id,
                                notes: 'Invalid TrxID',
                              })
                            }
                            className="h-6 text-[10px] px-2"
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-zinc-500 dark:text-zinc-400">
              No transactions recorded for this account.
            </div>
          )}
        </Card>
      )}

      {/* TAB 3: ACTIVITY LOGS */}
      {activeTab === 'ACTIVITY' && (
        <Card className="p-3.5 sm:p-5 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
          <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3 mb-3.5">
            <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Activity & Security Logs
            </h3>
            <p className="text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              Event trail recorded for this account
            </p>
          </div>

          {userLogs.length > 0 ? (
            <div className="space-y-2">
              {userLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-[11px] flex flex-col sm:flex-row sm:items-center justify-between gap-1.5"
                >
                  <div>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">{log.action}</span>
                    <pre className="text-[10px] font-mono text-zinc-500 mt-0.5 overflow-x-auto">
                      {JSON.stringify(log.details)}
                    </pre>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono shrink-0">
                    {formatDate(log.created_at)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-zinc-500 dark:text-zinc-400">
              No audit logs recorded for this account.
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
