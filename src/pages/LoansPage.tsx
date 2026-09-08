import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLoans } from '../hooks/useLoans';
import { useUIStore } from '../stores/useUIStore';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { LoanType, Loan } from '../types/database';
import { HandCoins, Plus, ArrowDownLeft, ArrowUpRight, User, Phone } from 'lucide-react';
import { formatCurrency, formatDate } from '../lib/utils';

export function LoansPage() {
  const { t } = useTranslation();
  const { loans, totalLent, totalBorrowed, createLoan, recordRepayment } = useLoans();
  const { currency, locale, isAddLoanOpen, setAddLoanOpen } = useUIStore();

  const [personName, setPersonName] = useState('');
  const [personPhone, setPersonPhone] = useState('');
  const [type, setType] = useState<LoanType>('LENT');
  const [principalAmount, setPrincipalAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [repayAmount, setRepayAmount] = useState('');

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
      },
      {
        onSuccess: () => {
          setPersonName('');
          setPersonPhone('');
          setPrincipalAmount('');
          setDueDate('');
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
      },
      {
        onSuccess: () => {
          setSelectedLoan(null);
          setRepayAmount('');
        },
      }
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">{t('loans.title')}</h2>
          <p className="text-xs text-slate-400">Debt & lent ledger</p>
        </div>

        <Button
          variant="gradient"
          size="sm"
          onClick={() => setAddLoanOpen(true)}
          className="text-xs h-8 px-2.5"
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          <span>New Loan</span>
        </Button>
      </div>

      {/* Summary 2-Col Grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-3.5 rounded-2xl bg-[#121826] border border-slate-800">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 mb-1">
            <ArrowUpRight className="h-3.5 w-3.5" />
            <span>{t('loans.lent')}</span>
          </div>
          <span className="text-base font-extrabold text-white">
            {formatCurrency(totalLent, currency, locale)}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#121826] border border-slate-800">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-rose-400 mb-1">
            <ArrowDownLeft className="h-3.5 w-3.5" />
            <span>{t('loans.borrowed')}</span>
          </div>
          <span className="text-base font-extrabold text-white">
            {formatCurrency(totalBorrowed, currency, locale)}
          </span>
        </div>
      </div>

      {/* Loan Items */}
      <div className="space-y-2">
        {loans.map((loan) => {
          const isLent = loan.type === 'LENT';
          const isPaid = loan.status === 'PAID';

          return (
            <div key={loan.id} className="p-3.5 rounded-2xl bg-[#121826] border border-slate-800 space-y-2.5">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2.5">
                  <div
                    className={`h-9 w-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                      isLent ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
                    }`}
                  >
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{loan.person_name}</h4>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {isLent ? 'Money Lent' : 'Money Borrowed'}
                    </span>
                  </div>
                </div>

                <span className="text-xs font-extrabold text-white">
                  {formatCurrency(loan.principal_amount, currency, locale)}
                </span>
              </div>

              <Progress
                value={Number(loan.total_paid)}
                max={Number(loan.principal_amount)}
                indicatorColor={isPaid ? 'bg-emerald-400' : 'bg-indigo-500'}
                className="h-1.5"
              />

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>Remaining: <strong className="text-amber-400">{formatCurrency(loan.remaining_amount, currency, locale)}</strong></span>
                {!isPaid && (
                  <button
                    onClick={() => setSelectedLoan(loan)}
                    className="text-xs font-bold text-emerald-400 hover:underline"
                  >
                    Record Payment
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Loan Modal */}
      <Dialog open={isAddLoanOpen} onOpenChange={setAddLoanOpen}>
        <form onSubmit={handleCreateLoan}>
          <DialogHeader>
            <DialogTitle>New Loan Record</DialogTitle>
            <DialogDescription>Track lent or borrowed amount</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-950 border border-slate-800">
              <button
                type="button"
                onClick={() => setType('LENT')}
                className={`py-1.5 rounded-lg text-xs font-bold ${
                  type === 'LENT' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400'
                }`}
              >
                Lent (I gave)
              </button>
              <button
                type="button"
                onClick={() => setType('BORROWED')}
                className={`py-1.5 rounded-lg text-xs font-bold ${
                  type === 'BORROWED' ? 'bg-rose-500/20 text-rose-400' : 'text-slate-400'
                }`}
              >
                Borrowed (I took)
              </button>
            </div>

            <div>
              <Label>Person's Name</Label>
              <Input
                type="text"
                required
                placeholder="e.g. Tanvir Ahmed"
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
              />
            </div>

            <div>
              <Label>Principal Amount (৳)</Label>
              <Input
                type="number"
                step="0.01"
                required
                placeholder="20000"
                value={principalAmount}
                onChange={(e) => setPrincipalAmount(e.target.value)}
                className="font-bold text-base"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAddLoanOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gradient" disabled={createLoan.isPending}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Record Repayment Modal */}
      {selectedLoan && (
        <Dialog open={!!selectedLoan} onOpenChange={(open) => !open && setSelectedLoan(null)}>
          <form onSubmit={handleRecordRepayment}>
            <DialogHeader>
              <DialogTitle>Record Repayment</DialogTitle>
              <DialogDescription>
                For <strong>{selectedLoan.person_name}</strong>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div>
                <Label>Amount (৳)</Label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  placeholder={`Max: ${selectedLoan.remaining_amount}`}
                  value={repayAmount}
                  onChange={(e) => setRepayAmount(e.target.value)}
                  autoFocus
                  className="font-bold text-base"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSelectedLoan(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="gradient" disabled={recordRepayment.isPending}>
                Submit
              </Button>
            </DialogFooter>
          </form>
        </Dialog>
      )}
    </div>
  );
}
