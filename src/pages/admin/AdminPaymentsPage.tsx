import React, { useState } from 'react';
import { useAdmin } from '../../hooks/useAdmin';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog';
import { CheckCircle2, XCircle, Clock, Smartphone, Search } from 'lucide-react';
import { formatDate } from '../../lib/utils';
import { PaymentSubmission } from '../../types/database';

export function AdminPaymentsPage() {
  const { payments, approvePayment, rejectPayment, isLoading } = useAdmin();
  const [search, setSearch] = useState('');
  const [rejectModalPayment, setRejectModalPayment] = useState<PaymentSubmission | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const filtered = payments.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.transaction_id.toLowerCase().includes(q) ||
      p.sender_number.includes(q) ||
      p.user?.email.toLowerCase().includes(q) ||
      p.user?.full_name?.toLowerCase().includes(q)
    );
  });

  const handleApprove = (pay: PaymentSubmission) => {
    if (confirm(`Approve bKash TrxID ${pay.transaction_id} and activate plan for ${pay.user?.full_name || 'user'}?`)) {
      approvePayment.mutate({
        payment_id: pay.id,
        plan_id: pay.plan_id,
        user_id: pay.user_id,
      });
    }
  };

  const handleRejectConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalPayment) return;
    rejectPayment.mutate(
      {
        payment_id: rejectModalPayment.id,
        notes: rejectReason.trim() || 'TrxID not found in bKash Merchant ledger',
      },
      {
        onSuccess: () => {
          setRejectModalPayment(null);
          setRejectReason('');
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">bKash Payments Verification</h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">Review, verify and activate user subscriptions</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-400" />
        <Input
          type="text"
          placeholder="Search by TrxID, sender number or user email..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-700 dark:text-zinc-300">
              <thead className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80 text-[11px] font-bold uppercase text-zinc-500 dark:text-zinc-400">
                <tr>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Plan & Amount</th>
                  <th className="p-4">Method & Sender</th>
                  <th className="p-4">TrxID</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/60">
                {filtered.map((pay) => (
                  <tr key={pay.id} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-900/40 transition-colors">
                    <td className="p-4">
                      <span className="font-bold text-zinc-900 dark:text-zinc-100 block">{pay.user?.full_name || 'Customer'}</span>
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400">{pay.user?.email}</span>
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-zinc-900 dark:text-zinc-100 block">{pay.plan?.name || 'Pro Plan'}</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">{pay.amount} ৳</span>
                    </td>
                    <td className="p-4">
                      <span className="font-semibold text-pink-600 dark:text-pink-400 flex items-center gap-1">
                        <Smartphone className="h-3 w-3" />
                        {pay.payment_method}
                      </span>
                      <span className="font-mono text-[10px] text-zinc-500 dark:text-zinc-400">{pay.sender_number}</span>
                    </td>
                    <td className="p-4 font-mono font-bold text-amber-600 dark:text-amber-400 text-sm">
                      {pay.transaction_id}
                    </td>
                    <td className="p-4 text-zinc-500 dark:text-zinc-400">
                      {formatDate(pay.created_at)}
                    </td>
                    <td className="p-4">
                      <Badge
                        variant={
                          pay.status === 'APPROVED' ? 'default' : pay.status === 'PENDING' ? 'warning' : 'destructive'
                        }
                      >
                        {pay.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      {pay.status === 'PENDING' ? (
                        <>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleApprove(pay)}
                            disabled={approvePayment.isPending}
                            className="h-8 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
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
                        <span className="text-zinc-400 dark:text-zinc-500 text-[11px] font-medium">Processed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Reject Payment Reason Modal */}
      {rejectModalPayment && (
        <Dialog open={!!rejectModalPayment} onOpenChange={(open) => !open && setRejectModalPayment(null)}>
          <form onSubmit={handleRejectConfirm}>
            <DialogHeader>
              <DialogTitle className="text-rose-600 dark:text-rose-400">Reject Payment</DialogTitle>
              <DialogDescription>
                Provide a reason for rejecting TrxID: <strong>{rejectModalPayment.transaction_id}</strong>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <Input
                type="text"
                required
                placeholder="e.g. TrxID not found in statement / incorrect amount"
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
