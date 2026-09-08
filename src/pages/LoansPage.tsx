import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLoans } from '../hooks/useLoans';
import { useUIStore } from '../stores/useUIStore';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select } from '../components/ui/select';
import { LoanType, Loan } from '../types/database';
import { HandCoins, Plus, ArrowDownLeft, ArrowUpRight, CheckCircle2, User, Phone } from 'lucide-react';
import { formatCurrency, formatDate } from '../lib/utils';

export function LoansPage() {
  const { t } = useTranslation();
  const { loans, totalLent, totalBorrowed, createLoan, recordRepayment } = useLoans();
  const { currency, locale, isAddLoanOpen, setAddLoanOpen } = useUIStore();

  // Create Loan Form State
  const [personName, setPersonName] = useState('');
  const [personPhone, setPersonPhone] = useState('');
  const [type, setType] = useState<LoanType>('LENT');
  const [principalAmount, setPrincipalAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  // Repayment Modal State
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [repayAmount, setRepayAmount] = useState('');
  const [repayNotes, setRepayNotes] = useState('');

  const handleCreateLoan = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(principalAmount);
    if (isNaN(amount) || amount <= 0 || !personName.trim()) return;

    createLoan.mutate(
      {
        person_name: personName.trim(),
        person_phone: personPhone.trim() || null,
        type,
        principal_amount: amount,
        interest_rate: 0,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        notes: notes.trim() || null,
      },
      {
        onSuccess: () => {
          setPersonName('');
          setPersonPhone('');
          setPrincipalAmount('');
          setDueDate('');
          setNotes('');
          setAddLoanOpen(false);
        },
      }
    );
  };

  const handleRecordRepayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan) return;
    const amount = parseFloat(repayAmount);
    if (isNaN(amount) || amount <= 0) return;

    recordRepayment.mutate(
      {
        loan_id: selectedLoan.id,
        amount,
        notes: repayNotes,
      },
      {
        onSuccess: () => {
          setSelectedLoan(null);
          setRepayAmount('');
          setRepayNotes('');
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">{t('loans.title')}</h2>
          <p className="text-xs sm:text-sm text-slate-400">{t('loans.subtitle')}</p>
        </div>

        <Button
          variant="gradient"
          size="sm"
          onClick={() => setAddLoanOpen(true)}
          className="gap-1.5"
        >
          <Plus className="h-4 w-4" />
          <span>{t('loans.add_loan')}</span>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Money Lent (Receivable) */}
        <Card className="p-5 border-emerald-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/20">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {t('loans.lent')}
              </span>
              <h3 className="text-2xl font-black text-emerald-400 mt-1">
                {formatCurrency(totalLent, currency, locale)}
              </h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <ArrowUpRight className="h-5 w-5" />
            </div>
          </div>
        </Card>

        {/* Money Borrowed (Payable) */}
        <Card className="p-5 border-rose-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-rose-950/20">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {t('loans.borrowed')}
              </span>
              <h3 className="text-2xl font-black text-rose-400 mt-1">
                {formatCurrency(totalBorrowed, currency, locale)}
              </h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
              <ArrowDownLeft className="h-5 w-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Loans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loans.map((loan) => {
          const isLent = loan.type === 'LENT';
          const isPaid = loan.status === 'PAID';
          const paidPercentage = Math.min(100, Math.round((Number(loan.total_paid) / Number(loan.principal_amount)) * 100));

          return (
            <Card key={loan.id} className="p-5 relative overflow-hidden group">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className={`h-11 w-11 rounded-xl flex items-center justify-center font-bold ${
                      isLent ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">{loan.person_name}</h4>
                    {loan.person_phone && (
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {loan.person_phone}
                      </span>
                    )}
                  </div>
                </div>

                <Badge variant={isPaid ? 'default' : isLent ? 'indigo' : 'destructive'}>
                  {isPaid ? 'COMPLETED' : isLent ? 'LENT (RECEIVABLE)' : 'BORROWED'}
                </Badge>
              </div>

              <div className="mt-5 space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Repaid: <strong className="text-white">{formatCurrency(loan.total_paid, currency, locale)}</strong></span>
                  <span className="text-slate-400">Principal: <strong className="text-white">{formatCurrency(loan.principal_amount, currency, locale)}</strong></span>
                </div>

                <Progress
                  value={Number(loan.total_paid)}
                  max={Number(loan.principal_amount)}
                  indicatorColor={isPaid ? 'bg-emerald-400' : 'bg-indigo-500'}
                />

                <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Remaining</span>
                    <span className="font-bold text-amber-400 text-sm">{formatCurrency(loan.remaining_amount, currency, locale)}</span>
                  </div>

                  {!isPaid && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedLoan(loan)}
                      className="text-xs h-8"
                    >
                      {t('loans.record_payment')}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Add Loan Modal */}
      <Dialog open={isAddLoanOpen} onOpenChange={setAddLoanOpen}>
        <form onSubmit={handleCreateLoan}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HandCoins className="h-5 w-5 text-emerald-400" />
              <span>{t('loans.add_loan')}</span>
            </DialogTitle>
            <DialogDescription>
              Track money given to others or borrowed loans.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5">
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-950 border border-slate-800">
              <button
                type="button"
                onClick={() => setType('LENT')}
                className={`py-2 rounded-lg text-xs font-bold transition-all ${
                  type === 'LENT' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'text-slate-400'
                }`}
              >
                Money Lent (I gave)
              </button>
              <button
                type="button"
                onClick={() => setType('BORROWED')}
                className={`py-2 rounded-lg text-xs font-bold transition-all ${
                  type === 'BORROWED' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' : 'text-slate-400'
                }`}
              >
                Money Borrowed (I took)
              </button>
            </div>

            <div>
              <Label>Person / Counterparty Name</Label>
              <Input
                type="text"
                required
                placeholder="e.g. Tanvir Ahmed / Uncle Rafiq"
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Phone Number (Optional)</Label>
                <Input
                  type="text"
                  placeholder="017XXXXXXXX"
                  value={personPhone}
                  onChange={(e) => setPersonPhone(e.target.value)}
                />
              </div>

              <div>
                <Label>Principal Amount (৳)</Label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  placeholder="25000"
                  value={principalAmount}
                  onChange={(e) => setPrincipalAmount(e.target.value)}
                  className="font-bold"
                />
              </div>
            </div>

            <div>
              <Label>Due Date (Optional)</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAddLoanOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gradient" disabled={createLoan.isPending}>
              {createLoan.isPending ? 'Saving...' : 'Save Loan Record'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Record Repayment Modal */}
      {selectedLoan && (
        <Dialog open={!!selectedLoan} onOpenChange={(open) => !open && setSelectedLoan(null)}>
          <form onSubmit={handleRecordRepayment}>
            <DialogHeader>
              <DialogTitle>Record Loan Repayment</DialogTitle>
              <DialogDescription>
                Adjust the remaining balance for <strong>{selectedLoan.person_name}</strong>.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>Repayment Amount (৳)</Label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  placeholder={`Max: ${selectedLoan.remaining_amount || selectedLoan.principal_amount}`}
                  value={repayAmount}
                  onChange={(e) => setRepayAmount(e.target.value)}
                  autoFocus
                  className="text-lg font-bold"
                />
              </div>

              <div>
                <Label>Notes (Optional)</Label>
                <Input
                  type="text"
                  placeholder="e.g. Received via bKash"
                  value={repayNotes}
                  onChange={(e) => setRepayNotes(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSelectedLoan(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="gradient" disabled={recordRepayment.isPending}>
                {recordRepayment.isPending ? 'Recording...' : 'Submit Repayment'}
              </Button>
            </DialogFooter>
          </form>
        </Dialog>
      )}
    </div>
  );
}
