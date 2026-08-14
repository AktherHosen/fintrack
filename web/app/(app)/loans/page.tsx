"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
  createLoanSchema,
  recordLoanPaymentSchema,
  type CreateLoanInput,
  type RecordLoanPaymentInput,
} from "@fintrack/shared";
import { api } from "@/lib/api-client";
import { formatMoney, formatDate, formatMoneyStat } from "@/lib/formatters";
import { useAuth } from "@/lib/auth-context";
import type { LoanDto, LoanDetailDto, AccountDto, CategoryDto, SubscriptionDto } from "@fintrack/shared";
import { usePlanUpgrade } from "@/lib/use-plan-upgrade";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormDatePicker } from "@/components/ui/date-picker";
import { Select, FormField, FormFieldInput, fieldError } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  EmptyState,
  ListDivider,
  ListItem,
  PageHeader,
  ProgressBar,
  SegmentedButton,
  Skeleton,
  StatChip,
} from "@/components/ui/material";
import { cn } from "@/lib/utils";
import { Landmark, Plus, TrendingDown, TrendingUp } from "lucide-react";

interface LoanSummary {
  borrowedRemaining: string;
  lentRemaining: string;
  netDebt: string;
  activeCount: number;
}

type LoanFilter = "ALL" | "BORROWED" | "LENT";

function statusStyles(status: string) {
  if (status === "PAID_OFF") return "bg-income-muted text-income";
  if (status === "CLOSED") return "bg-muted text-muted-foreground";
  return "bg-primary/10 text-primary";
}

export default function LoansPage() {
  const t = useTranslations("loans");
  const td = useTranslations("dashboard");
  const tc = useTranslations("common");
  const { user } = useAuth();
  const locale = user?.locale ?? "en";
  const currency = user?.currency ?? "BDT";
  const [createOpen, setCreateOpen] = useState(false);
  const [detailLoan, setDetailLoan] = useState<LoanDto | null>(null);
  const [payOpen, setPayOpen] = useState(false);
  const [filter, setFilter] = useState<LoanFilter>("ALL");
  const qc = useQueryClient();
  const { promptUpgradeIfAtLimit, handleUpgradeError } = usePlanUpgrade();

  const { data: loans = [], isLoading } = useQuery({
    queryKey: ["loans"],
    queryFn: () => api<LoanDto[]>("/loans"),
  });

  const { data: loanSummary } = useQuery({
    queryKey: ["loan-summary"],
    queryFn: () => api<LoanSummary>("/loans/summary"),
  });

  const { data: subscription } = useQuery({
    queryKey: ["subscription"],
    queryFn: () => api<SubscriptionDto | null>("/subscription"),
  });

  const { data: loanDetail } = useQuery({
    queryKey: ["loans", detailLoan?.id],
    queryFn: () => api<LoanDetailDto>(`/loans/${detailLoan!.id}`),
    enabled: !!detailLoan,
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts"],
    queryFn: () => api<AccountDto[]>("/accounts"),
    enabled: createOpen || payOpen,
  });

  const createForm = useForm<CreateLoanInput>({
    resolver: zodResolver(createLoanSchema),
    mode: "onTouched",
    defaultValues: {
      type: "BORROWED",
      currency: user?.currency ?? "BDT",
      interestRate: "0",
      startDate: new Date().toISOString().slice(0, 10),
    },
  });

  const payForm = useForm<RecordLoanPaymentInput>({
    resolver: zodResolver(recordLoanPaymentSchema),
    mode: "onTouched",
    defaultValues: {
      paymentDate: new Date().toISOString().slice(0, 10),
      interestAmount: "0",
      createTransaction: false,
    },
  });

  const payCategoryType = detailLoan?.type === "BORROWED" ? "EXPENSE" : "INCOME";

  const { data: payCategories = [] } = useQuery({
    queryKey: ["categories-loan-pay", payCategoryType],
    queryFn: () => api<CategoryDto[]>(`/categories?type=${payCategoryType}`),
    enabled: payOpen && !!detailLoan,
  });

  const loanType = createForm.watch("type");

  const { data: categories = [] } = useQuery({
    queryKey: ["categories-loan", loanType],
    queryFn: () =>
      api<CategoryDto[]>(`/categories?type=${loanType === "BORROWED" ? "EXPENSE" : "INCOME"}`),
    enabled: createOpen,
  });

  const createLoan = useMutation({
    mutationFn: (data: CreateLoanInput) =>
      api("/loans", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["loans"] });
      qc.invalidateQueries({ queryKey: ["loan-summary"] });
      qc.invalidateQueries({ queryKey: ["subscription"] });
      setCreateOpen(false);
      createForm.reset();
    },
    onError: (e) => {
      handleUpgradeError(e, () => setCreateOpen(false));
    },
  });

  const recordPayment = useMutation({
    mutationFn: (data: RecordLoanPaymentInput) =>
      api(`/loans/${detailLoan!.id}/payments`, { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["loans"] });
      qc.invalidateQueries({ queryKey: ["loan-summary"] });
      setPayOpen(false);
      payForm.reset({ paymentDate: new Date().toISOString().slice(0, 10), interestAmount: "0" });
    },
  });

  const closeLoan = useMutation({
    mutationFn: (id: string) => api(`/loans/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["loans"] });
      qc.invalidateQueries({ queryKey: ["loan-summary"] });
      setDetailLoan(null);
    },
  });

  const filteredLoans = useMemo(
    () => loans.filter((l) => filter === "ALL" || l.type === filter),
    [loans, filter],
  );

  function statusLabel(status: string) {
    if (status === "PAID_OFF") return t("statusPaidOff");
    if (status === "CLOSED") return t("statusClosed");
    return t("statusActive");
  }

  function openCreate() {
    if (
      promptUpgradeIfAtLimit(
        subscription?.usage?.loans ?? loanSummary?.activeCount ?? 0,
        subscription?.limits?.loans,
      )
    ) {
      return;
    }
    setCreateOpen(true);
  }

  return (
    <div className="space-y-5 pb-4">
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        action={
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            {t("addLoan")}
          </Button>
        }
      />

      {loanSummary && loanSummary.activeCount > 0 ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">{t("overview")}</CardTitle>
            <p className="text-xs text-muted-foreground">
              {t("activeCount", { count: loanSummary.activeCount })}
            </p>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-2 pt-0">
            {(
              [
                [td("youOwe"), loanSummary.borrowedRemaining, "expense"] as const,
                [td("owedToYou"), loanSummary.lentRemaining, "income"] as const,
                [td("netDebt"), loanSummary.netDebt, "neutral"] as const,
              ] as const
            ).map(([label, amount, tone]) => {
              const formatted = formatMoneyStat(amount, currency, locale);
              return (
                <StatChip
                  key={label}
                  label={label}
                  value={formatted.display}
                  title={formatted.full}
                  tone={tone}
                  className="p-3"
                />
              );
            })}
          </CardContent>
        </Card>
      ) : null}

      {loans.length > 0 ? (
        <SegmentedButton<LoanFilter>
          options={[
            { value: "ALL", label: t("filterAll") },
            { value: "BORROWED", label: t("borrowed") },
            { value: "LENT", label: t("lent") },
          ]}
          value={filter}
          onChange={setFilter}
        />
      ) : null}

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      ) : filteredLoans.length === 0 ? (
        <EmptyState message={loans.length === 0 ? t("empty") : t("noFilterResults")} />
      ) : (
        <div className="space-y-3">
          {filteredLoans.map((loan) => {
            const isBorrowed = loan.type === "BORROWED";
            const Icon = isBorrowed ? TrendingDown : TrendingUp;

            return (
              <Card
                key={loan.id}
                className="cursor-pointer transition-all hover:border-primary/20 hover:shadow-card"
                onClick={() => setDetailLoan(loan)}
              >
                <CardContent className="space-y-3.5 p-4">
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                        isBorrowed
                          ? "bg-expense-muted text-expense"
                          : "bg-income-muted text-income",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate font-semibold leading-snug">{loan.name}</p>
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                            statusStyles(loan.status),
                          )}
                        >
                          {statusLabel(loan.status)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {isBorrowed ? t("borrowedDesc") : t("lentDesc")}
                        {loan.counterparty ? ` · ${loan.counterparty}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        {t("remaining")}
                      </p>
                      <p
                        className={cn(
                          "text-lg font-bold tabular-nums tracking-tight",
                          isBorrowed ? "text-expense" : "text-income",
                        )}
                      >
                        {formatMoney(loan.remainingBalance, loan.currency, locale)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs tabular-nums text-muted-foreground">
                        {loan.percentPaid}% {t("paid").toLowerCase()}
                      </p>
                      <p className="text-xs tabular-nums text-muted-foreground">
                        {formatMoney(loan.totalPaid, loan.currency, locale)}
                      </p>
                    </div>
                  </div>

                  <ProgressBar value={loan.percentPaid} />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{t("newLoan")}</SheetTitle>
          </SheetHeader>
          <form className="mt-5 space-y-4" onSubmit={createForm.handleSubmit((d) => createLoan.mutate(d))}>
            <FormFieldInput form={createForm} name="name" label={t("name")} placeholder="Home loan" />
            <FormField label={t("type")} error={fieldError(createForm.formState.errors, "type")}>
              <Select
                aria-invalid={fieldError(createForm.formState.errors, "type") ? true : undefined}
                {...createForm.register("type")}
              >
                <option value="BORROWED">{t("borrowed")}</option>
                <option value="LENT">{t("lent")}</option>
              </Select>
            </FormField>
            <FormFieldInput form={createForm} name="principal" label={t("principal")} inputMode="decimal" />
            <FormFieldInput
              form={createForm}
              name="interestRate"
              label={t("interestRate")}
              inputMode="decimal"
            />
            <FormFieldInput form={createForm} name="counterparty" label={t("counterparty")} />
            <FormField label={t("startDate")} error={fieldError(createForm.formState.errors, "startDate")}>
              <FormDatePicker
                control={createForm.control}
                name="startDate"
                aria-invalid={fieldError(createForm.formState.errors, "startDate") ? true : undefined}
              />
            </FormField>
            <FormFieldInput form={createForm} name="termMonths" label={t("termMonths")} type="number" />
            <FormFieldInput
              form={createForm}
              name="monthlyPayment"
              label={t("monthlyPayment")}
              inputMode="decimal"
            />
            <FormField label={t("linkedAccount")} error={fieldError(createForm.formState.errors, "accountId")}>
              <Select
                aria-invalid={fieldError(createForm.formState.errors, "accountId") ? true : undefined}
                {...createForm.register("accountId")}
              >
                <option value="">—</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormFieldInput form={createForm} name="notes" label={t("notes")} />
            <Button type="submit" size="lg" className="w-full" disabled={createLoan.isPending}>
              {tc("create")}
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      <Sheet open={!!detailLoan} onOpenChange={(o) => !o && setDetailLoan(null)}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
          {detailLoan && (
            <>
              <SheetHeader>
                <SheetTitle>{detailLoan.name}</SheetTitle>
              </SheetHeader>
              <div className="mt-5 space-y-5">
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl border bg-muted/20 p-3">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      {t("principal")}
                    </p>
                    <p className="mt-1 text-sm font-semibold tabular-nums">
                      {formatMoney(detailLoan.principal, detailLoan.currency, locale)}
                    </p>
                  </div>
                  <div className="rounded-xl border bg-muted/20 p-3">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      {t("remaining")}
                    </p>
                    <p
                      className={cn(
                        "mt-1 text-sm font-semibold tabular-nums",
                        detailLoan.type === "BORROWED" ? "text-expense" : "text-income",
                      )}
                    >
                      {formatMoney(detailLoan.remainingBalance, detailLoan.currency, locale)}
                    </p>
                  </div>
                  <div className="rounded-xl border bg-muted/20 p-3">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      {t("paid")}
                    </p>
                    <p className="mt-1 text-sm font-semibold tabular-nums">
                      {formatMoney(detailLoan.totalPaid, detailLoan.currency, locale)}
                    </p>
                  </div>
                  <div className="rounded-xl border bg-muted/20 p-3">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      {t("interestRate")}
                    </p>
                    <p className="mt-1 text-sm font-semibold tabular-nums">
                      {detailLoan.interestRate}%
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{detailLoan.percentPaid}% complete</span>
                    <span>{statusLabel(detailLoan.status)}</span>
                  </div>
                  <ProgressBar value={detailLoan.percentPaid} />
                </div>

                <div className="flex gap-2">
                  {detailLoan.status === "ACTIVE" ? (
                    <Button className="flex-1" onClick={() => setPayOpen(true)}>
                      {t("recordPayment")}
                    </Button>
                  ) : null}
                  <Button
                    variant="outline"
                    className={detailLoan.status === "ACTIVE" ? "" : "flex-1"}
                    onClick={() => closeLoan.mutate(detailLoan.id)}
                    disabled={closeLoan.isPending}
                  >
                    {t("closeLoan")}
                  </Button>
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    {t("payments")}
                  </p>
                  {!loanDetail?.payments.length ? (
                    <p className="rounded-xl border border-dashed bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
                      {t("noPayments")}
                    </p>
                  ) : (
                    <Card>
                      <CardContent className="py-1">
                        {loanDetail.payments.map((p, i) => (
                          <div key={p.id}>
                            {i > 0 && <ListDivider />}
                            <ListItem
                              title={formatMoney(p.amount, detailLoan.currency, locale)}
                              subtitle={formatDate(p.paymentDate, locale)}
                              icon={Landmark}
                              iconClassName="border-primary/20 bg-primary/10 text-primary"
                            />
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Sheet open={payOpen} onOpenChange={setPayOpen}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>{t("recordPayment")}</SheetTitle>
          </SheetHeader>
          <form
            className="mt-5 space-y-4"
            onSubmit={payForm.handleSubmit((d) => recordPayment.mutate(d))}
          >
            <FormFieldInput form={payForm} name="amount" label={t("paymentAmount")} inputMode="decimal" />
            <FormFieldInput
              form={payForm}
              name="interestAmount"
              label={t("interestPortion")}
              inputMode="decimal"
            />
            <FormField label={t("paymentDate")} error={fieldError(payForm.formState.errors, "paymentDate")}>
              <FormDatePicker
                control={payForm.control}
                name="paymentDate"
                aria-invalid={fieldError(payForm.formState.errors, "paymentDate") ? true : undefined}
              />
            </FormField>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...payForm.register("createTransaction")} />
              {t("linkTransaction")}
            </label>
            {payForm.watch("createTransaction") ? (
              <FormField label={t("category")} error={fieldError(payForm.formState.errors, "categoryId")}>
                <Select
                  aria-invalid={fieldError(payForm.formState.errors, "categoryId") ? true : undefined}
                  {...payForm.register("categoryId")}
                >
                  <option value="">{t("selectCategory")}</option>
                  {payCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </FormField>
            ) : null}
            <Button type="submit" size="lg" className="w-full" disabled={recordPayment.isPending}>
              {tc("save")}
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
