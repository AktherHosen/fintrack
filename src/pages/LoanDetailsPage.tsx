import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLoan, useLoanPayments } from '../hooks/useLoans';
import { useUIStore } from '../stores/useUIStore';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
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
import { DatePicker } from '../components/ui/date-picker';
import {
  ArrowLeft,
  Printer,
  Download,
  Plus,
  User,
  Phone,
  Calendar,
  History,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../lib/utils';

export function LoanDetailsPage() {
  const { loanId } = useParams<{ loanId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { currency, locale } = useUIStore();

  const { loan, isLoading, recordRepayment } = useLoan(loanId);
  const { data: payments = [], isLoading: isPaymentsLoading } = useLoanPayments(loanId);

  // Repayment Modal state
  const [isRepayOpen, setRepayOpen] = useState(false);
  const [repayAmount, setRepayAmount] = useState('');
  const [repayDate, setRepayDate] = useState<Date | undefined>(new Date());
  const [repayNotes, setRepayNotes] = useState('');

  const isLent = loan?.type === 'LENT';
  const isPaid = loan?.status === 'PAID';
  const remaining = Number(
    loan?.remaining_amount ?? Number(loan?.principal_amount || 0) - Number(loan?.total_paid || 0)
  );

  const handleRecordRepayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loan) return;
    const amount = parseFloat(repayAmount);
    if (isNaN(amount) || amount <= 0) return;

    recordRepayment.mutate(
      {
        loan_id: loan.id,
        amount,
        payment_date: repayDate ? repayDate.toISOString() : new Date().toISOString(),
        notes: repayNotes.trim() || undefined,
      },
      {
        onSuccess: () => {
          setRepayOpen(false);
          setRepayAmount('');
          setRepayNotes('');
          setRepayDate(new Date());
        },
      }
    );
  };

  const handleDownloadPdf = () => {
    if (!loan) return;
    const originalTitle = document.title;
    const cleanName = (loan.person_name || 'Loan').replace(/[^a-zA-Z0-9_-]/g, '_');
    const dateStr = new Date().toISOString().split('T')[0];
    document.title = `FinTrack_Loan_Statement_${cleanName}_${dateStr}`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto py-8 animate-pulse">
        <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-48" />
        <div className="h-44 bg-zinc-200 dark:bg-zinc-800 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-28 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
          <div className="h-28 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
          <div className="h-28 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <div className="h-12 w-12 rounded-full bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
          {t('loans.not_found_title', 'Loan Record Not Found')}
        </h2>
        <p className="text-xs text-zinc-500 max-w-sm mx-auto">
          {t(
            'loans.not_found_desc',
            'This loan record might have been deleted or the URL is invalid.'
          )}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/loans')}
          className="cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          {t('loans.back_to_loans', 'Back to Loans')}
        </Button>
      </div>
    );
  }

  const percentRepaid = Math.min(
    100,
    Math.round((Number(loan.total_paid) / Math.max(1, Number(loan.principal_amount))) * 100)
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* ================= Printable Formal Report Header (Visible only when Printing / PDF Export) ================= */}
      <div className="hidden print:block space-y-6 text-zinc-900 bg-white p-6">
        <div className="flex items-start justify-between border-b-2 border-zinc-900 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-tight text-zinc-950">FINTRACK</span>
              <span className="text-xs uppercase tracking-widest font-semibold px-2 py-0.5 bg-zinc-100 text-zinc-700 rounded">
                Official Statement
              </span>
            </div>
            <h1 className="text-xl font-bold mt-2">
              {t('loans.loan_statement', 'Loan Statement & Payment History')}
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Ref ID: <span className="font-mono font-medium">{loan.id}</span>
            </p>
          </div>

          <div className="text-right text-xs space-y-1">
            <p className="font-semibold text-zinc-700">
              {t('reports.generated_on', 'Statement Date')}:{' '}
              <span className="font-bold text-zinc-950">
                {new Date().toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </p>
            <p className="text-zinc-500">
              Currency: <span className="font-bold text-zinc-900">{currency}</span>
            </p>
            <p className="font-mono text-[11px] text-zinc-400">STATUS: {loan.status}</p>
          </div>
        </div>

        {/* Counterparty & Loan Terms Overview in PDF */}
        <div className="grid grid-cols-2 gap-4 text-xs border border-zinc-200 rounded-lg p-4 bg-zinc-50/50">
          <div>
            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider block">
              {isLent ? 'Borrower / Counterparty' : 'Lender / Counterparty'}
            </span>
            <p className="text-base font-bold text-zinc-900 mt-0.5">{loan.person_name}</p>
            {loan.person_phone && (
              <p className="text-xs text-zinc-600 font-mono mt-0.5">Phone: {loan.person_phone}</p>
            )}
            <p className="text-xs text-zinc-600 mt-0.5">
              Classification:{' '}
              <strong>{isLent ? 'Receivable (Money Lent)' : 'Payable (Money Borrowed)'}</strong>
            </p>
          </div>

          <div className="text-right space-y-1">
            <p className="text-xs">
              <span className="text-zinc-500">Principal Amount: </span>
              <strong className="font-mono text-zinc-900 text-sm">
                {formatCurrency(loan.principal_amount, currency, locale)}
              </strong>
            </p>
            <p className="text-xs">
              <span className="text-zinc-500">Total Repaid: </span>
              <strong className="font-mono text-emerald-700 text-sm">
                {formatCurrency(loan.total_paid, currency, locale)}
              </strong>
            </p>
            <p className="text-xs">
              <span className="text-zinc-500">Remaining Balance: </span>
              <strong className="font-mono text-amber-700 text-sm font-black">
                {formatCurrency(remaining, currency, locale)}
              </strong>
            </p>
            {loan.due_date && (
              <p className="text-[11px] text-zinc-500">
                Scheduled Due Date: <strong>{formatDate(loan.due_date)}</strong>
              </p>
            )}
          </div>
        </div>

        {/* Itemized Table in PDF */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700 mb-2">
            Itemized Payment Ledger
          </h3>
          <table className="w-full text-left border-collapse text-xs border border-zinc-200">
            <thead>
              <tr className="bg-zinc-100 border-b border-zinc-200 text-zinc-700 font-bold">
                <th className="py-2 px-3">Date</th>
                <th className="py-2 px-3">Transaction / Notes</th>
                <th className="py-2 px-3">Payment ID</th>
                <th className="py-2 px-3 text-right">Amount Paid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {payments.length > 0 ? (
                payments.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2 px-3 font-medium">{formatDate(p.payment_date)}</td>
                    <td className="py-2 px-3 text-zinc-700">
                      {p.notes || 'Repayment Installment'}
                    </td>
                    <td className="py-2 px-3 font-mono text-[10px] text-zinc-500">
                      {p.id.slice(-8)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-zinc-900">
                      {formatCurrency(p.amount, currency, locale)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-zinc-500">
                    No payments have been recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="bg-zinc-50 border-t-2 border-zinc-300 font-bold">
                <td colSpan={3} className="py-2.5 px-3 text-right">
                  Total Repayments:
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-emerald-700 font-black">
                  {formatCurrency(loan.total_paid, currency, locale)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Printable Footer Seal */}
        <div className="pt-8 border-t border-zinc-200 flex justify-between items-center text-[10px] text-zinc-500">
          <p>This is an automated system generated financial report from FinTrack Ledger.</p>
          <div className="text-right">
            <span
              className={`inline-block px-3 py-1 font-bold rounded border ${
                isPaid
                  ? 'border-emerald-500 text-emerald-700 bg-emerald-50'
                  : 'border-amber-500 text-amber-700 bg-amber-50'
              }`}
            >
              {isPaid ? 'PAID IN FULL' : 'OUTSTANDING BALANCE'}
            </span>
          </div>
        </div>
      </div>

      {/* ================= Interactive Screen View (Hidden when printing) ================= */}
      <div className="space-y-6 print:hidden">
        {/* Navigation Breadcrumb & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/loans')}
              className="h-8 px-2.5 text-xs text-zinc-600 dark:text-zinc-300 cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              <span>{t('loans.back_to_loans', 'Back to Loans')}</span>
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPdf}
              className="h-8 px-3 text-xs gap-1.5 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800"
              title="Download or Print PDF Statement"
            >
              <Download className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>{t('loans.download_pdf_report', 'Download PDF Report')}</span>
            </Button>

            {!isPaid && (
              <Button
                variant="default"
                size="sm"
                onClick={() => setRepayOpen(true)}
                className="h-8 px-3 text-xs gap-1.5 cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>{t('loans.record_payment_btn', 'Record Repayment')}</span>
              </Button>
            )}
          </div>
        </div>

        {/* Hero Card with Status and Counterparty */}
        <Card className="overflow-hidden border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
          <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`h-11 w-11 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 shadow-xs ${
                    isLent
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                  }`}
                >
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100">
                      {loan.person_name}
                    </h2>
                    <Badge
                      variant={isPaid ? 'default' : isLent ? 'indigo' : 'destructive'}
                      className="text-[10px] py-0 h-5 px-2 font-bold"
                    >
                      {isPaid
                        ? t('loans.status_paid', 'PAID')
                        : isLent
                          ? t('loans.status_lent', 'LENT')
                          : t('loans.status_due', 'DUE')}
                    </Badge>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {isLent
                      ? t('loans.lent_label', 'Money Lent (Receivable)')
                      : t('loans.borrowed_label', 'Money Borrowed (Payable)')}
                  </p>
                </div>
              </div>

              {loan.person_phone && (
                <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 self-start sm:self-center font-mono">
                  <Phone className="h-3.5 w-3.5 text-zinc-400" />
                  <span>{loan.person_phone}</span>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="pt-4 space-y-4">
            {/* KPI Metric Blocks */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-zinc-50/80 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80">
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider block">
                  {t('loans.principal', 'Principal Amount')}
                </span>
                <span className="text-sm sm:text-base font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-1 block">
                  {formatCurrency(loan.principal_amount, currency, locale)}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-zinc-50/80 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80">
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider block">
                  {t('loans.paid', 'Repaid So Far')}
                </span>
                <span className="text-sm sm:text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1 block">
                  {formatCurrency(loan.total_paid, currency, locale)}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-zinc-50/80 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80">
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider block">
                  {t('loans.remaining', 'Remaining Balance')}
                </span>
                <span className="text-sm sm:text-base font-bold font-mono text-amber-600 dark:text-amber-400 mt-1 block">
                  {formatCurrency(remaining, currency, locale)}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-zinc-50/80 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80">
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider block">
                  {t('loans.due_date', 'Due Date')}
                </span>
                <span className="text-xs sm:text-sm font-semibold text-zinc-800 dark:text-zinc-200 mt-1 block flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                  <span>{loan.due_date ? formatDate(loan.due_date) : 'No fixed deadline'}</span>
                </span>
              </div>
            </div>

            {/* Repayment Progress */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
                <span>Repayment Completion</span>
                <span className="font-bold font-mono text-zinc-800 dark:text-zinc-200">
                  {percentRepaid}%
                </span>
              </div>
              <Progress
                value={Number(loan.total_paid)}
                max={Number(loan.principal_amount)}
                indicatorColor={isPaid ? 'bg-emerald-500' : 'bg-indigo-600'}
                className="h-2.5"
              />
            </div>
          </CardContent>
        </Card>

        {/* Repayment History Ledger Section */}
        <Card className="overflow-hidden border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
          <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800/80 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <div>
                <CardTitle className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {t('loans.payment_history', 'Repayment History')}
                </CardTitle>
              </div>
            </div>

            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono font-medium">
              {payments.length} {payments.length === 1 ? 'record' : 'records'}
            </span>
          </CardHeader>

          <CardContent className="p-0">
            <div className="w-full overflow-hidden">
              <table className="w-full text-left border-collapse table-fixed">
                <thead>
                  <tr className="border-b border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-900/50 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    <th className="py-2.5 px-3 sm:px-4 w-[25%] sm:w-[20%] truncate">
                      {t('transactions.date', 'Date')}
                    </th>
                    <th className="py-2.5 px-2 sm:px-3 w-[45%] sm:w-[50%] truncate">
                      {t('transactions.description', 'Notes / Remarks')}
                    </th>
                    <th className="py-2.5 pr-3 sm:pr-4 w-[30%] text-right truncate">
                      {t('transactions.amount', 'Amount Paid')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/70">
                  {payments.length > 0 ? (
                    payments.map((pmt) => (
                      <tr
                        key={pmt.id}
                        className="hover:bg-zinc-50/60 dark:hover:bg-zinc-900/40 transition-colors"
                      >
                        {/* Col 1: Date */}
                        <td className="py-3 px-3 sm:px-4 align-middle">
                          <span className="text-xs sm:text-sm font-medium text-zinc-800 dark:text-zinc-200 block">
                            {formatDate(pmt.payment_date)}
                          </span>
                        </td>

                        {/* Col 2: Notes / Account */}
                        <td className="py-3 px-2 sm:px-3 align-middle">
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 truncate">
                              {pmt.notes || 'Repayment installment'}
                            </p>
                            {pmt.account && (
                              <span className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400">
                                Via: {pmt.account.name}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Col 3: Amount */}
                        <td className="py-3 pr-3 sm:pr-4 align-middle text-right">
                          <span className="text-xs sm:text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
                            +{formatCurrency(pmt.amount, currency, locale)}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="py-12 text-center text-xs text-zinc-500 px-4">
                        <div className="space-y-1">
                          <p className="font-semibold text-zinc-700 dark:text-zinc-300">
                            {t('loans.no_payments_yet', 'No Repayments Yet')}
                          </p>
                          <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
                            {t(
                              'loans.no_payments_desc',
                              'When a payment is recorded, it will appear here with the exact date, amount, and notes.'
                            )}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ================= Record Repayment Modal (Using Calendar DatePicker) ================= */}
      <Dialog open={isRepayOpen} onOpenChange={setRepayOpen}>
        <form onSubmit={handleRecordRepayment}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowDownLeft className="h-5 w-5 text-emerald-500" />
              <span>{t('loans.record_repayment_title', 'Record Loan Repayment')}</span>
            </DialogTitle>
            <DialogDescription>
              {t('loans.adjust_balance_for', {
                person: loan.person_name,
                type: isLent
                  ? t('loans.lent_label', 'Lent')
                  : t('loans.borrowed_label', 'Borrowed'),
                defaultValue: `Adjust balance for ${loan.person_name} (${isLent ? 'Lent' : 'Borrowed'}).`,
              })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2">
            {/* Summary Box */}
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block font-medium">
                  {t('loans.counterparty', 'Counterparty')}
                </span>
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  {loan.person_name}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block font-medium">
                  {t('loans.remaining_due', 'Remaining Due')}
                </span>
                <span className="text-xs font-black text-amber-600 dark:text-amber-400 font-mono">
                  {formatCurrency(remaining, currency, locale)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  {t('loans.repayment_amount', 'Repayment Amount')} (
                  {currency === 'BDT' ? '৳ BDT' : '$ USD'})
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min="1"
                  max={remaining}
                  required
                  className="text-xs font-mono font-bold mt-1"
                  placeholder={`Max: ${remaining}`}
                  value={repayAmount}
                  onChange={(e) => setRepayAmount(e.target.value)}
                  autoFocus
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  {t('loans.repayment_date', 'Repayment Date')}
                </Label>
                <div className="mt-1">
                  <DatePicker
                    date={repayDate}
                    onSelect={setRepayDate}
                    placeholder={t('loans.pick_repayment_date', 'Select repayment date')}
                    className="h-9 w-full text-xs"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                {t('loans.repayment_notes_optional', 'Payment Notes (Optional)')}
              </Label>
              <Input
                type="text"
                className="text-xs mt-1"
                placeholder={t(
                  'loans.repayment_notes_placeholder',
                  'e.g. Partial cash payment / bKash transfer'
                )}
                value={repayNotes}
                onChange={(e) => setRepayNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setRepayOpen(false)}
              className="cursor-pointer"
            >
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              type="submit"
              variant="default"
              disabled={recordRepayment.isPending}
              className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {recordRepayment.isPending
                ? t('loans.recording', 'Recording...')
                : t('loans.record_payment_btn', 'Record Payment')}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}

export default LoanDetailsPage;
