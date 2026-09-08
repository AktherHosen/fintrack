import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLoans } from '../hooks/useLoans';
import { useUIStore } from '../stores/useUIStore';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">{t('loans.title')}</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Track money lent to friends or borrowed obligations</p>
        </div>

        <Button
          variant="default"
          size="sm"
          onClick={() => setAddLoanOpen(true)}
          className="text-xs h-8"
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          <span>New Loan</span>
        </Button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{t('loans.lent')}</span>
            <ArrowUpRight className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(totalLent, currency, locale)}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">Outstanding receivable</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{t('loans.borrowed')}</span>
            <ArrowDownLeft className="h-4 w-4 text-rose-500 dark:text-rose-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {formatCurrency(totalBorrowed, currency, locale)}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">Outstanding payable</p>
          </CardContent>
        </Card>
      </div>

      {/* Loan Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loans.map((loan) => {
          const isLent = loan.type === 'LENT';
          const isPaid = loan.status === 'PAID';

          return (
            <Card key={loan.id} className="hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <div className="flex items-center space-x-2.5">
                  <div
                    className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                      isLent ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                    }`}
                  >
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold">{loan.person_name}</CardTitle>
                    <CardDescription className="text-[10px] font-mono">
                      {isLent ? 'Lent (Receivable)' : 'Borrowed (Payable)'}
                    </CardDescription>
                  </div>
                </div>

                <Badge variant={isPaid ? 'default' : isLent ? 'indigo' : 'destructive'} className="text-[10px] py-0 h-4">
                  {isPaid ? 'PAID' : isLent ? 'LENT' : 'DUE'}
                </Badge>
              </CardHeader>

              <CardContent className="space-y-3 pt-2">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-400">Principal: <strong className="text-zinc-200">{formatCurrency(loan.principal_amount, currency, locale)}</strong></span>
                  <span className="text-zinc-400">Paid: <strong className="text-zinc-200">{formatCurrency(loan.total_paid, currency, locale)}</strong></span>
                </div>

                <Progress
                  value={Number(loan.total_paid)}
                  max={Number(loan.principal_amount)}
                  indicatorColor={isPaid ? 'bg-emerald-400' : 'bg-indigo-500'}
                  className="h-1.5"
                />

                <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-800">
                  <span className="text-zinc-400">Remaining: <strong className="text-amber-400">{formatCurrency(loan.remaining_amount, currency, locale)}</strong></span>
                  {!isPaid && (
                    <button
                      onClick={() => setSelectedLoan(loan)}
                      className="text-xs font-semibold text-emerald-400 hover:underline"
                    >
                      Record Payment
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add Loan Dialog */}
      <Dialog open={isAddLoanOpen} onOpenChange={setAddLoanOpen}>
        <form onSubmit={handleCreateLoan}>
          <DialogHeader>
            <DialogTitle>Add Loan Record</DialogTitle>
            <DialogDescription>Track lent or borrowed funds with repayments.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 p-1 rounded-lg bg-zinc-900 border border-zinc-800">
              <button
                type="button"
                onClick={() => setType('LENT')}
                className={`py-1 rounded-md text-xs font-semibold transition-all ${
                  type === 'LENT' ? 'bg-emerald-600 text-white shadow-xs' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Money Lent
              </button>
              <button
                type="button"
                onClick={() => setType('BORROWED')}
                className={`py-1 rounded-md text-xs font-semibold transition-all ${
                  type === 'BORROWED' ? 'bg-rose-600 text-white shadow-xs' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Money Borrowed
              </button>
            </div>

            <div>
              <Label>Person Name</Label>
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
                placeholder="25000"
                value={principalAmount}
                onChange={(e) => setPrincipalAmount(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAddLoanOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="default" disabled={createLoan.isPending}>
              Save Loan
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Record Repayment Dialog */}
      {selectedLoan && (
        <Dialog open={!!selectedLoan} onOpenChange={(open) => !open && setSelectedLoan(null)}>
          <form onSubmit={handleRecordRepayment}>
            <DialogHeader>
              <DialogTitle>Record Repayment</DialogTitle>
              <DialogDescription>For {selectedLoan.person_name}</DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div>
                <Label>Repayment Amount (৳)</Label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  placeholder={`Max: ${selectedLoan.remaining_amount}`}
                  value={repayAmount}
                  onChange={(e) => setRepayAmount(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSelectedLoan(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="default" disabled={recordRepayment.isPending}>
                Submit
              </Button>
            </DialogFooter>
          </form>
        </Dialog>
      )}
    </div>
  );
}
