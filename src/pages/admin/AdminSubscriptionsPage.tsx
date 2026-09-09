import React, { useState } from 'react';
import { useAdmin } from '../../hooks/useAdmin';
import { useSubscriptions } from '../../hooks/useSubscriptions';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '../../components/ui/table';
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Crown,
  Sparkles,
  Users,
  Search,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
} from 'lucide-react';
import { formatDate } from '../../lib/utils';
import { UserProfile, Subscription, Plan } from '../../types/database';
import { CircularProgressLoader } from '../../components/ui/spinner';

export function AdminSubscriptionsPage() {
  const { users, subscriptions, assignUserPlan, cancelUserPlan, isLoading } = useAdmin();
  const { plans } = useSubscriptions();

  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<'ALL' | string>('ALL');
  const [selectedUserForAssign, setSelectedUserForAssign] = useState<UserProfile | null>(null);

  // Form states for plan assignment modal
  const [assignPlanId, setAssignPlanId] = useState<string>('');
  const [durationOption, setDurationOption] = useState<string>('30');
  const [customDays, setCustomDays] = useState<string>('30');
  const [adminNotes, setAdminNotes] = useState<string>('');

  // Map users with their active subscription
  const userSubsMap = users.map((u) => {
    const sub = subscriptions.find((s) => s.user_id === u.id);
    const plan = sub?.plan || plans.find((p) => p.id === sub?.plan_id) || plans.find((p) => p.slug === 'free') || plans[0];
    return {
      user: u,
      subscription: sub,
      plan: plan as Plan,
      isPro: plan && plan.slug !== 'free',
    };
  });

  const filtered = userSubsMap.filter(({ user, plan }) => {
    if (tierFilter !== 'ALL' && plan?.slug !== tierFilter && plan?.id !== tierFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      user.email.toLowerCase().includes(q) ||
      (user.full_name && user.full_name.toLowerCase().includes(q)) ||
      plan?.name.toLowerCase().includes(q)
    );
  });

  // Calculate Metrics
  const totalSubscribers = users.length;
  const proSubscribers = userSubsMap.filter(({ isPro }) => isPro).length;
  const lifetimeMembers = userSubsMap.filter(({ plan }) => plan?.billing_cycle === 'LIFETIME').length;
  const mrr = userSubsMap
    .filter(({ plan }) => plan?.billing_cycle === 'MONTHLY')
    .reduce((sum, { plan }) => sum + (plan?.price || 0), 0);
  const arr = userSubsMap
    .filter(({ plan }) => plan?.billing_cycle === 'YEARLY')
    .reduce((sum, { plan }) => sum + (plan?.price || 0), 0);

  const handleOpenAssign = (u: UserProfile, currentPlanId?: string) => {
    setSelectedUserForAssign(u);
    setAssignPlanId(currentPlanId || plans[1]?.id || plans[0]?.id || '');
    setDurationOption('30');
    setCustomDays('30');
    setAdminNotes('');
  };

  const handleSavePlanAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForAssign || !assignPlanId) return;

    let days = parseInt(durationOption, 10);
    if (durationOption === 'CUSTOM') {
      days = parseInt(customDays, 10) || 30;
    } else if (durationOption === 'LIFETIME') {
      days = 36500;
    }

    assignUserPlan.mutate(
      {
        userId: selectedUserForAssign.id,
        planId: assignPlanId,
        durationDays: days,
        notes: adminNotes.trim() || 'Admin manual subscription assignment',
      },
      {
        onSuccess: () => {
          setSelectedUserForAssign(null);
        },
      }
    );
  };

  const handleRevertFree = (userId: string) => {
    cancelUserPlan.mutate({
      userId,
      reason: 'Reverted to Free Starter by Administrator',
    });
  };

  return (
    <div className="space-y-3.5 sm:space-y-4.5">
      {/* Header */}
      <div>
        <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-50 tracking-tight truncate">
          Memberships & Subscriptions
        </h2>
        <p className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
          Monitor active plan tiers, renewal timelines, and grant manual upgrades
        </p>
      </div>

      {/* KPI Stats Grid - 2 cols on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <Card className="p-2.5 sm:p-3.5 border-indigo-500/30 bg-indigo-50/40 dark:bg-gradient-to-br dark:from-zinc-900 dark:to-indigo-950/20 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 truncate">
              Pro Members
            </span>
            <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Crown className="h-3.5 w-3.5" />
            </div>
          </div>
          <h3 className="text-sm sm:text-lg lg:text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
            {proSubscribers}
            <span className="text-[10px] font-medium text-zinc-500 ml-1">/ {totalSubscribers}</span>
          </h3>
          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5 block truncate">
            {totalSubscribers > 0 ? Math.round((proSubscribers / totalSubscribers) * 100) : 0}% Paid ratio
          </span>
        </Card>

        <Card className="p-2.5 sm:p-3.5 border-purple-500/30 bg-purple-50/40 dark:bg-gradient-to-br dark:from-zinc-900 dark:to-purple-950/20 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400 truncate">
              Founders
            </span>
            <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
          </div>
          <h3 className="text-sm sm:text-lg lg:text-xl font-bold text-purple-600 dark:text-purple-400 mt-0.5">
            {lifetimeMembers}
          </h3>
          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5 block truncate">
            Lifetime VIPs
          </span>
        </Card>

        <Card className="p-2.5 sm:p-3.5 border-emerald-500/30 bg-emerald-50/40 dark:bg-gradient-to-br dark:from-zinc-900 dark:to-emerald-950/20 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 truncate">
              Monthly Run-Rate
            </span>
            <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <TrendingUp className="h-3.5 w-3.5" />
            </div>
          </div>
          <h3 className="text-sm sm:text-lg lg:text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 truncate">
            {mrr.toLocaleString()} ৳
          </h3>
          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5 block truncate">
            Monthly renewals
          </span>
        </Card>

        <Card className="p-2.5 sm:p-3.5 border-blue-500/30 bg-blue-50/40 dark:bg-gradient-to-br dark:from-zinc-900 dark:to-blue-950/20 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 truncate">
              Annual ARR
            </span>
            <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="h-3.5 w-3.5" />
            </div>
          </div>
          <h3 className="text-sm sm:text-lg lg:text-xl font-bold text-blue-600 dark:text-blue-400 mt-0.5 truncate">
            {arr.toLocaleString()} ৳
          </h3>
          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5 block truncate">
            Yearly accounts
          </span>
        </Card>
      </div>

      {/* Filter and Search Controls */}
      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Plan Tier Badges Filter */}
          <div className="flex flex-wrap items-center gap-1 p-0.5 bg-zinc-100 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 text-[11px] font-semibold">
            <button
              type="button"
              onClick={() => setTierFilter('ALL')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                tierFilter === 'ALL'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs font-bold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
              }`}
            >
              All ({users.length})
            </button>
            {plans.map((p) => {
              const count = userSubsMap.filter(({ plan }) => plan?.id === p.id || plan?.slug === p.slug).length;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setTierFilter(p.slug)}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    tierFilter === p.slug
                      ? 'bg-indigo-600 text-white shadow-xs font-bold'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                  }`}
                >
                  {p.name} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
          <Input
            type="text"
            placeholder="Search by subscriber name, email, or plan..."
            className="pl-9 h-8.5 text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Mobile Subscriptions Cards (< md screen) */}
      <div className="block md:hidden space-y-2.5">
        {filtered.length > 0 ? (
          filtered.map(({ user, subscription, plan, isPro }) => {
            const expiresAt = subscription?.expires_at ? new Date(subscription.expires_at) : null;
            const isPermanent = !expiresAt || expiresAt.getFullYear() > 2090;

            return (
              <Card
                key={user.id}
                className="p-3 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 shadow-xs space-y-2.5"
              >
                {/* User Row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div className="h-8 w-8 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold shrink-0">
                      {isPro ? <Crown className="h-4 w-4 text-amber-500" /> : <Users className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 block truncate">
                        {user.full_name || 'Subscriber'}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono truncate block">
                        {user.email}
                      </span>
                    </div>
                  </div>

                  <Badge
                    variant={isPro ? 'default' : 'secondary'}
                    className="font-semibold text-[10px] shrink-0"
                  >
                    {plan?.name || 'Free Starter'}
                  </Badge>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                  <div className="bg-zinc-50 dark:bg-zinc-900/90 p-2 rounded-lg border border-zinc-100 dark:border-zinc-800/60">
                    <span className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider block">
                      Billing & Cost
                    </span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200 block mt-0.5 font-mono text-[11px]">
                      {plan?.price ? `${plan.price} ৳` : 'Free'}
                    </span>
                    <span className="text-[10px] text-zinc-500 block capitalize">
                      {plan?.billing_cycle ? plan.billing_cycle.toLowerCase() : 'N/A'}
                    </span>
                  </div>

                  <div className="bg-zinc-50 dark:bg-zinc-900/90 p-2 rounded-lg border border-zinc-100 dark:border-zinc-800/60">
                    <span className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider block">
                      Validity & Status
                    </span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200 block mt-0.5 text-[10px] truncate">
                      {isPermanent ? 'Permanent' : formatDate(subscription!.expires_at)}
                    </span>
                    {!isPermanent && expiresAt && (
                      <span className="text-[9px] text-indigo-600 dark:text-indigo-400 font-bold font-mono block">
                        {Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))}d left
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenAssign(user, plan?.id)}
                    className="flex-1 h-7.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800"
                  >
                    <span>Change Plan</span>
                  </Button>
                  {isPro && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRevertFree(user.id)}
                      disabled={cancelUserPlan.isPending}
                      className="h-7.5 text-xs px-2.5 text-zinc-500 hover:text-rose-600"
                    >
                      Reset
                    </Button>
                  )}
                </div>
              </Card>
            );
          })
        ) : (
          <Card className="p-6 text-center text-xs text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800">
            {isLoading ? (
              <CircularProgressLoader size="md" />
            ) : (
              'No subscribers found for this tier.'
            )}
          </Card>
        )}
      </div>

      {/* Desktop Subscriptions Table (>= md screen) */}
      <Card className="hidden md:block border-zinc-200 dark:border-zinc-800 shadow-xs overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-zinc-50 dark:bg-zinc-900/80">
                <TableRow>
                  <TableHead className="font-bold uppercase text-[11px] py-2.5 px-3">Subscriber</TableHead>
                  <TableHead className="font-bold uppercase text-[11px] py-2.5 px-3">Active Plan</TableHead>
                  <TableHead className="font-bold uppercase text-[11px] py-2.5 px-3">Billing</TableHead>
                  <TableHead className="font-bold uppercase text-[11px] py-2.5 px-3">Validity</TableHead>
                  <TableHead className="font-bold uppercase text-[11px] py-2.5 px-3">Status</TableHead>
                  <TableHead className="font-bold uppercase text-[11px] py-2.5 px-3 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length > 0 ? (
                  filtered.map(({ user, subscription, plan, isPro }) => {
                    const expiresAt = subscription?.expires_at ? new Date(subscription.expires_at) : null;
                    const isPermanent = !expiresAt || expiresAt.getFullYear() > 2090;

                    return (
                      <TableRow key={user.id} className="text-xs hover:bg-zinc-50/70 dark:hover:bg-zinc-900/40">
                        <TableCell className="py-2.5 px-3">
                          <div className="flex items-center space-x-2">
                            <div className="h-7 w-7 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold shrink-0">
                              {isPro ? <Crown className="h-3.5 w-3.5 text-amber-500" /> : <Users className="h-3.5 w-3.5" />}
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-zinc-900 dark:text-zinc-100 block truncate">
                                {user.full_name || 'Subscriber'}
                              </span>
                              <span className="text-[10px] text-zinc-500 font-mono truncate block">
                                {user.email}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-2.5 px-3">
                          <Badge
                            variant={isPro ? 'default' : 'secondary'}
                            className="font-semibold text-[10px] px-2 py-0"
                          >
                            {plan?.name || 'Free Starter'}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-2.5 px-3 text-zinc-600 dark:text-zinc-400 font-mono text-[11px]">
                          {plan?.price ? `${plan.price} ৳ / ${plan.billing_cycle.toLowerCase()}` : 'Free'}
                        </TableCell>
                        <TableCell className="py-2.5 px-3">
                          <div className="space-y-0.5">
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100 block text-[11px]">
                              {isPermanent ? 'Permanent' : formatDate(subscription!.expires_at)}
                            </span>
                            {!isPermanent && expiresAt && (
                              <span className="text-[10px] text-zinc-500 font-mono block">
                                {Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))}d left
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-2.5 px-3">
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[10px]">
                            <CheckCircle2 className="h-3 w-3" />
                            {subscription?.status || 'ACTIVE'}
                          </span>
                        </TableCell>
                        <TableCell className="py-2.5 px-3 text-right space-x-1 whitespace-nowrap">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenAssign(user, plan?.id)}
                            className="h-7 text-[11px] px-2 font-medium text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800"
                          >
                            <span>Change</span>
                          </Button>
                          {isPro && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRevertFree(user.id)}
                              disabled={cancelUserPlan.isPending}
                              className="h-7 text-[11px] px-1.5 text-zinc-500 hover:text-rose-600"
                            >
                              Reset
                            </Button>
                          )}
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
                        'No subscribers found for this tier.'
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Assign Plan Modal */}
      {selectedUserForAssign && (
        <Dialog
          open={!!selectedUserForAssign}
          onOpenChange={(open) => !open && setSelectedUserForAssign(null)}
        >
          <form onSubmit={handleSavePlanAssignment} className="max-w-md w-full">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-1.5 text-sm font-bold">
                <Crown className="h-4 w-4 text-indigo-600" />
                <span>Assign Plan to {selectedUserForAssign.full_name || selectedUserForAssign.email}</span>
              </DialogTitle>
              <DialogDescription className="text-xs">
                Select subscription tier and validity period to grant.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <div>
                <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Target Plan Tier
                </Label>
                <Select value={assignPlanId} onValueChange={(val) => setAssignPlanId(val)}>
                  <SelectTrigger className="h-8.5 text-xs mt-1">
                    <SelectValue placeholder="Select Plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} — {p.price ? `${p.price} ৳ (${p.billing_cycle})` : 'Free'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
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
                    <SelectItem value="LIFETIME">Lifetime Access (Permanent)</SelectItem>
                    <SelectItem value="CUSTOM">Custom Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {durationOption === 'CUSTOM' && (
                <div>
                  <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Number of Days
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    className="h-8.5 text-xs mt-1"
                    value={customDays}
                    onChange={(e) => setCustomDays(e.target.value)}
                    placeholder="e.g. 60"
                  />
                </div>
              )}

              <div>
                <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Admin Notes (Optional)
                </Label>
                <Input
                  type="text"
                  className="h-8.5 text-xs mt-1"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="e.g. Offline payment / VIP Founder"
                />
              </div>
            </div>

            <DialogFooter className="gap-1.5 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => setSelectedUserForAssign(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="default"
                size="sm"
                disabled={assignUserPlan.isPending}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-8 text-xs"
              >
                {assignUserPlan.isPending ? 'Assigning...' : 'Save & Assign'}
              </Button>
            </DialogFooter>
          </form>
        </Dialog>
      )}
    </div>
  );
}
