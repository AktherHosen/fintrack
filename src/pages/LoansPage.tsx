import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLoans } from '../hooks/useLoans';
import { useUIStore } from '../stores/useUIStore';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { LoanType, Loan } from '../types/database';
import { HandCoins, Plus, ArrowDownLeft, ArrowUpRight, User, Phone, Calendar } from 'lucide-react';
import { formatCurrency, formatDate, cn } from '../lib/utils';

import { useSubscriptions } from '../hooks/useSubscriptions';

export function LoansPage() {
  const { t } = useTranslation();
  const { loans, totalLent, totalBorrowed, createLoan, recordRepayment } = useLoans();
  const { currency, locale, isAddLoanOpen, setAddLoanOpen, addToast } = useUIStore();
  const { isPro, maxLoans, canAddLoan } = useSubscriptions();

  const [personName, setPersonName] = useState('');
  const [personPhone, setPersonPhone] = useState('');
  const [type, setType] = useState<LoanType>('LENT');
  const [principalAmount, setPrincipalAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [repayAmount, setRepayAmount] = useState('');

  const activeLoans = loans.filter((l) => l.status === 'ACTIVE');

  const handleCreateLoan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAddLoan(activeLoans.length)) {
      addToast({
        type: 'error',
        title: 'Plan Limit Reached',
        description: `Free Plan is limited to ${maxLoans} active loans. Upgrade to Pro for unlimited debt ledgers.`,
      });
      return;
    }
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
      <div className="flex flex-row items-center justify-between gap-2 sm:gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 sm:gap-2 truncate">
            <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-50 tracking-tight truncate">
              {t('loans.title')}
            </h2>
          </div>
          <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
            Track money lent to friends or borrowed obligations
          </p>
        </div>

        <Button
          variant="default"
          size="sm"
          onClick={() => {
            if (!canAddLoan(activeLoans.length)) {
              addToast({
                type: 'warning',
                title: 'Plan Limit Reached',
                description: `Free Plan allows up to ${maxLoans} active loans. Upgrade to Pro in Settings for unlimited records.`,
              });
              return;
            }
            setAddLoanOpen(true);
          }}
          className="text-xs h-8 px-2.5 sm:px-3 shrink-0"
        >
          <Plus className="h-3.5 w-3.5 sm:mr-1.5" />
          <span className="hidden sm:inline">New Loan</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
        <Card className="p-3 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1 mb-1 sm:mb-2">
            <span className="text-[11px] sm:text-xs font-semibold text-zinc-600 dark:text-zinc-400 truncate">
              {t('loans.lent')}
            </span>
            <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <ArrowUpRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          </div>
          <div className="min-w-0">
            <div className="text-sm sm:text-xl md:text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 truncate tracking-tight">
              {formatCurrency(totalLent, currency, locale)}
            </div>
            <p className="text-[10px] sm:text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5 sm:mt-1 truncate">
              Outstanding receivable
            </p>
          </div>
        </Card>

        <Card className="p-3 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1 mb-1 sm:mb-2">
            <span className="text-[11px] sm:text-xs font-semibold text-zinc-600 dark:text-zinc-400 truncate">
              {t('loans.borrowed')}
            </span>
            <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <ArrowDownLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          </div>
          <div className="min-w-0">
            <div className="text-sm sm:text-xl md:text-2xl font-bold font-mono text-rose-600 dark:text-rose-400 truncate tracking-tight">
              {formatCurrency(totalBorrowed, currency, locale)}
            </div>
            <p className="text-[10px] sm:text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5 sm:mt-1 truncate">
              Outstanding payable
            </p>
          </div>
        </Card>
      </div>

      {/* Loan Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loans.map((loan) => {
          const isLent = loan.type === 'LENT';
          const isPaid = loan.status === 'PAID';

          return (
            <Card
              key={loan.id}
              className="hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <div className="flex items-center space-x-2.5">
                  <div
                    className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs ${isLent ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
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

                <Badge
                  variant={isPaid ? 'default' : isLent ? 'indigo' : 'destructive'}
                  className="text-[10px] py-0 h-4"
                >
                  {isPaid ? 'PAID' : isLent ? 'LENT' : 'DUE'}
                </Badge>
              </CardHeader>

              <CardContent className="space-y-3 pt-2">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500 dark:text-zinc-400">
                    Principal:{' '}
                    <strong className="text-zinc-900 dark:text-zinc-100 font-semibold">
                      {formatCurrency(loan.principal_amount, currency, locale)}
                    </strong>
                  </span>
                  <span className="text-zinc-500 dark:text-zinc-400">
                    Paid:{' '}
                    <strong className="text-zinc-900 dark:text-zinc-100 font-semibold">
                      {formatCurrency(loan.total_paid, currency, locale)}
                    </strong>
                  </span>
                </div>

                <Progress
                  value={Number(loan.total_paid)}
                  max={Number(loan.principal_amount)}
                  indicatorColor={isPaid ? 'bg-emerald-500' : 'bg-indigo-600'}
                  className="h-1.5"
                />

                <div className="flex items-center justify-between text-xs pt-2 border-t border-zinc-200 dark:border-zinc-800">
                  <span className="text-zinc-500 dark:text-zinc-400">
                    Remaining:{' '}
                    <strong className="text-amber-600 dark:text-amber-400 font-bold">
                      {formatCurrency(loan.remaining_amount, currency, locale)}
                    </strong>
                  </span>
                  {!isPaid && (
                    <button
                      onClick={() => setSelectedLoan(loan)}
                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 hover:underline cursor-pointer"
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
            <DialogTitle className="flex items-center gap-2">
              <HandCoins className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <span>Add Loan Record</span>
            </DialogTitle>
            <DialogDescription>Track lent or borrowed funds with scheduled repayments.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5">
            {/* Loan Type Selector */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setType('LENT')}
                className={cn(
                  'flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer',
                  type === 'LENT'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                )}
              >
                <ArrowUpRight className="h-3.5 w-3.5" />
                <span>Money Lent (Receivable)</span>
              </button>
              <button
                type="button"
                onClick={() => setType('BORROWED')}
                className={cn(
                  'flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer',
                  type === 'BORROWED'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                )}
              >
                <ArrowDownLeft className="h-3.5 w-3.5" />
                <span>Money Borrowed (Payable)</span>
              </button>
            </div>

            <div>
              <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Person / Counterparty Name</Label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
                <Input
                  type="text"
                  required
                  className="pl-9 text-xs"
                  placeholder="e.g. Tanvir Ahmed / Office Colleague"
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Principal Amount ({currency === 'BDT' ? '৳ BDT' : '$ USD'})</Label>
              <Input
                type="number"
                step="0.01"
                min="1"
                required
                className="text-xs font-mono font-medium mt-1"
                placeholder="25000"
                value={principalAmount}
                onChange={(e) => setPrincipalAmount(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Phone Number (Optional)</Label>
                <div className="relative mt-1">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
                  <Input
                    type="tel"
                    className="pl-9 text-xs font-mono"
                    placeholder="01XXXXXXXXX"
                    value={personPhone}
                    onChange={(e) => setPersonPhone(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Due Date (Optional)</Label>
                <div className="relative mt-1">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
                  <Input
                    type="date"
                    className="pl-9 text-xs"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAddLoanOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="default" disabled={createLoan.isPending}>
              {createLoan.isPending ? 'Saving...' : 'Save Loan'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Record Repayment Dialog */}
      {selectedLoan && (
        <Dialog open={!!selectedLoan} onOpenChange={(open) => !open && setSelectedLoan(null)}>
          <form onSubmit={handleRecordRepayment}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ArrowDownLeft className="h-5 w-5 text-emerald-500" />
                <span>Record Loan Repayment</span>
              </DialogTitle>
              <DialogDescription>
                Adjust balance for {selectedLoan.person_name} ({selectedLoan.type === 'LENT' ? 'Lent' : 'Borrowed'}).
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5">
              {/* Summary Card */}
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block font-medium">Counterparty</span>
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{selectedLoan.person_name}</span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block font-medium">Remaining Due</span>
                  <span className="text-xs font-black text-amber-600 dark:text-amber-400 font-mono">
                    {formatCurrency(selectedLoan.remaining_amount, currency, locale)}
                  </span>
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Repayment Amount ({currency === 'BDT' ? '৳ BDT' : '$ USD'})
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min="1"
                  max={selectedLoan.remaining_amount}
                  required
                  className="text-xs font-mono font-bold mt-1"
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
                {recordRepayment.isPending ? 'Recording...' : 'Record Payment'}
              </Button>
            </DialogFooter>
          </form>
        </Dialog>
      )}
    </div>
  );
}
