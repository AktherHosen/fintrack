import React, { useState } from 'react';
import { useAdmin } from '../../hooks/useAdmin';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
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
  CheckCircle2,
  XCircle,
  Clock,
  Smartphone,
  Search,
  Building2,
  CreditCard,
  Filter,
} from 'lucide-react';
import { formatDate } from '../../lib/utils';
import { PaymentSubmission, PaymentMethod } from '../../types/database';

export function AdminPaymentsPage() {
  const { payments, approvePayment, rejectPayment, isLoading } = useAdmin();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>(
    'ALL'
  );
  const [methodFilter, setMethodFilter] = useState<'ALL' | PaymentMethod>('ALL');
  const [rejectModalPayment, setRejectModalPayment] = useState<PaymentSubmission | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const filtered = payments.filter((p) => {
    // Status filter
    if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;

    // Method filter
    if (methodFilter !== 'ALL' && p.payment_method !== methodFilter) return false;

    // Search query
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.transaction_id.toLowerCase().includes(q) ||
      p.sender_number.includes(q) ||
      p.user?.email?.toLowerCase().includes(q) ||
      p.user?.full_name?.toLowerCase().includes(q)
    );
  });

  const pendingCount = payments.filter((p) => p.status === 'PENDING').length;
  const approvedCount = payments.filter((p) => p.status === 'APPROVED').length;
  const rejectedCount = payments.filter((p) => p.status === 'REJECTED').length;

  const handleApprove = (pay: PaymentSubmission) => {
    approvePayment.mutate({
      payment_id: pay.id,
      plan_id: pay.plan_id,
      user_id: pay.user_id,
    });
  };

  const handleRejectConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalPayment) return;
    rejectPayment.mutate(
      {
        payment_id: rejectModalPayment.id,
        notes:
          rejectReason.trim() ||
          `TrxID not verified in ${rejectModalPayment.payment_method} ledger`,
      },
      {
        onSuccess: () => {
          setRejectModalPayment(null);
          setRejectReason('');
        },
      }
    );
  };

  const getMethodBadge = (method: PaymentMethod | string) => {
    switch (method) {
      case 'BKASH':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20">
            <Smartphone className="h-3 w-3" />
            bKash
          </span>
        );
      case 'NAGAD':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
            <Smartphone className="h-3 w-3" />
            Nagad
          </span>
        );
      case 'ROCKET':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <Smartphone className="h-3 w-3" />
            Rocket
          </span>
        );
      case 'BANK_TRANSFER':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Building2 className="h-3 w-3" />
            Bank Transfer
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <CreditCard className="h-3 w-3" />
            {method || 'MANUAL'}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
            Payments Verification
          </h2>
          <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Review, verify, and activate user subscriptions across all payment methods
          </p>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="space-y-3">
        {/* Status Tabs and Method Filter */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                statusFilter === 'ALL'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs font-bold border border-zinc-200/50 dark:border-zinc-700/50'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              All ({payments.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('PENDING')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                statusFilter === 'PENDING'
                  ? 'bg-indigo-600 text-white shadow-xs font-bold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              <span>Pending ({pendingCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('APPROVED')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                statusFilter === 'APPROVED'
                  ? 'bg-emerald-600 text-white shadow-xs font-bold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Approved ({approvedCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('REJECTED')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                statusFilter === 'REJECTED'
                  ? 'bg-rose-600 text-white shadow-xs font-bold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              <XCircle className="h-3.5 w-3.5" />
              <span>Rejected ({rejectedCount})</span>
            </button>
          </div>

          {/* Payment Method Selector */}
          <div className="flex items-center gap-1.5 min-w-[200px]">
            <Filter className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
            <Select
              value={methodFilter}
              onValueChange={(val) => setMethodFilter(val as any)}
            >
              <SelectTrigger className="h-8 text-xs font-medium min-w-[160px]">
                <SelectValue placeholder="All Payment Methods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Payment Methods</SelectItem>
                <SelectItem value="BKASH">bKash</SelectItem>
                <SelectItem value="NAGAD">Nagad</SelectItem>
                <SelectItem value="ROCKET">Rocket</SelectItem>
                <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                <SelectItem value="MANUAL">Manual / Cash</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Search Bar with Fixed Centered Icon */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
          <Input
            type="text"
            placeholder="Search by TrxID, sender number, customer name, or email..."
            className="pl-10 h-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Submissions Table with shadcn Table components */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-zinc-50 dark:bg-zinc-900/80">
              <TableRow>
                <TableHead className="font-bold uppercase text-[11px]">Customer</TableHead>
                <TableHead className="font-bold uppercase text-[11px]">Plan & Amount</TableHead>
                <TableHead className="font-bold uppercase text-[11px]">Method & Sender</TableHead>
                <TableHead className="font-bold uppercase text-[11px]">TrxID</TableHead>
                <TableHead className="font-bold uppercase text-[11px]">Date</TableHead>
                <TableHead className="font-bold uppercase text-[11px]">Status</TableHead>
                <TableHead className="font-bold uppercase text-[11px] text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length > 0 ? (
                filtered.map((pay) => (
                  <TableRow key={pay.id} className="text-xs">
                    <TableCell>
                      <span className="font-bold text-zinc-900 dark:text-zinc-100 block">
                        {pay.user?.full_name || 'Customer'}
                      </span>
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                        {pay.user?.email}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-bold text-zinc-900 dark:text-zinc-100 block">
                        {pay.plan?.name || 'Pro Plan'}
                      </span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        {pay.amount} ৳
                      </span>
                    </TableCell>
                    <TableCell className="space-y-1">
                      <div>{getMethodBadge(pay.payment_method)}</div>
                      <span className="font-mono text-[10px] text-zinc-500 dark:text-zinc-400 block">
                        {pay.sender_number || 'N/A'}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                      {pay.transaction_id}
                    </TableCell>
                    <TableCell className="text-zinc-500 dark:text-zinc-400">
                      {formatDate(pay.created_at)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          pay.status === 'APPROVED'
                            ? 'default'
                            : pay.status === 'PENDING'
                              ? 'warning'
                              : 'destructive'
                        }
                      >
                        {pay.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2 whitespace-nowrap">
                      {pay.status === 'PENDING' ? (
                        <>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleApprove(pay)}
                            disabled={approvePayment.isPending}
                            className="h-8 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-xs"
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setRejectModalPayment(pay)}
                            className="h-8 text-xs"
                          >
                            Reject
                          </Button>
                        </>
                      ) : (
                        <span className="text-zinc-400 dark:text-zinc-500 text-[11px] font-medium">
                          Processed
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="p-8 text-center text-xs text-zinc-500 dark:text-zinc-400"
                  >
                    {isLoading
                      ? 'Loading payment records...'
                      : 'No payment submissions matched your filter criteria.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Reject Payment Reason Modal */}
      {rejectModalPayment && (
        <Dialog
          open={!!rejectModalPayment}
          onOpenChange={(open) => !open && setRejectModalPayment(null)}
        >
          <form onSubmit={handleRejectConfirm}>
            <DialogHeader>
              <DialogTitle className="text-rose-600 dark:text-rose-400">Reject Payment</DialogTitle>
              <DialogDescription>
                Provide a reason for rejecting {rejectModalPayment.payment_method} TrxID:{' '}
                <strong className="font-mono">{rejectModalPayment.transaction_id}</strong> (
                {rejectModalPayment.amount} ৳)
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <Input
                type="text"
                required
                placeholder={`e.g. TrxID not found in ${rejectModalPayment.payment_method} ledger / invalid amount`}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                autoFocus
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRejectModalPayment(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="destructive" disabled={rejectPayment.isPending}>
                Confirm Rejection
              </Button>
            </DialogFooter>
          </form>
        </Dialog>
      )}
    </div>
  );
}
