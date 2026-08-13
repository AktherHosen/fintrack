"use client";

import { useState } from "react";
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
import { api, ApiError } from "@/lib/api-client";
import { formatMoney, formatDate } from "@/lib/formatters";
import { useAuth } from "@/lib/auth-context";
import type { LoanDto, LoanDetailDto, AccountDto, CategoryDto } from "@fintrack/shared";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormDatePicker } from "@/components/ui/date-picker";
import { Select, FormField } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { EmptyState, ListDivider, ListItem, PageHeader, ProgressBar, Skeleton } from "@/components/ui/material";
import { Landmark, TrendingDown, TrendingUp } from "lucide-react";

export default function LoansPage() {
  const t = useTranslations("loans");
  const tc = useTranslations("common");
  const { user } = useAuth();
  const locale = user?.locale ?? "en";
  const [createOpen, setCreateOpen] = useState(false);
  const [detailLoan, setDetailLoan] = useState<LoanDto | null>(null);
  const [payOpen, setPayOpen] = useState(false);
  const [locked, setLocked] = useState(false);
  const qc = useQueryClient();

  const { data: loans = [], isLoading } = useQuery({
    queryKey: ["loans"],
    queryFn: () => api<LoanDto[]>("/loans"),
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
    defaultValues: {
      type: "BORROWED",
      currency: user?.currency ?? "BDT",
      interestRate: "0",
      startDate: new Date().toISOString().slice(0, 10),
    },
  });

  const payForm = useForm<RecordLoanPaymentInput>({
    resolver: zodResolver(recordLoanPaymentSchema),
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
      setCreateOpen(false);
      createForm.reset();
    },
    onError: (e) => {
      if (e instanceof ApiError && e.status === 403) setLocked(true);
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
      setDetailLoan(null);
    },
  });

  function statusLabel(status: string) {
    if (status === "PAID_OFF") return t("statusPaidOff");
    if (status === "CLOSED") return t("statusClosed");
    return t("statusActive");
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        action={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            {t("addLoan")}
          </Button>
        }
      />

      {locked && (
        <Card>
          <CardContent className="py-4 text-sm text-muted-foreground">{t("proRequired")}</CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      ) : loans.length === 0 ? (
        <EmptyState message={t("empty")} />
      ) : (
        loans.map((loan) => (
          <Card
            key={loan.id}
            className="cursor-pointer transition-colors hover:bg-muted/30"
            onClick={() => setDetailLoan(loan)}
          >
            <CardContent className="space-y-3 py-5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3">
                  {loan.type === "BORROWED" ? (
                    <TrendingDown className="mt-0.5 h-4 w-4 text-expense" />
                  ) : (
                    <TrendingUp className="mt-0.5 h-4 w-4 text-income" />
                  )}
                  <div>
                    <p className="font-medium">{loan.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {loan.type === "BORROWED" ? t("borrowedDesc") : t("lentDesc")}
                      {loan.counterparty ? ` · ${loan.counterparty}` : ""}
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                  {statusLabel(loan.status)}
                </span>
              </div>
              <ProgressBar value={loan.percentPaid} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  {t("paid")}: {formatMoney(loan.totalPaid, loan.currency, locale)}
                </span>
                <span>
                  {t("remaining")}: {formatMoney(loan.remainingBalance, loan.currency, locale)}
                </span>
              </div>
            </CardContent>
          </Card>
        ))
      )}

      {/* Create loan */}
      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{t("newLoan")}</SheetTitle>
          </SheetHeader>
          <form className="mt-5 space-y-4" onSubmit={createForm.handleSubmit((d) => createLoan.mutate(d))}>
            <FormField label={t("name")}>
              <Input {...createForm.register("name")} placeholder="Home loan" />
            </FormField>
            <FormField label={t("type")}>
              <Select {...createForm.register("type")}>
                <option value="BORROWED">{t("borrowed")}</option>
                <option value="LENT">{t("lent")}</option>
              </Select>
            </FormField>
            <FormField label={t("principal")}>
              <Input {...createForm.register("principal")} inputMode="decimal" />
            </FormField>
            <FormField label={t("interestRate")}>
              <Input {...createForm.register("interestRate")} inputMode="decimal" />
            </FormField>
            <FormField label={t("counterparty")}>
              <Input {...createForm.register("counterparty")} />
            </FormField>
            <FormField label={t("startDate")}>
              <FormDatePicker control={createForm.control} name="startDate" />
            </FormField>
            <FormField label={t("termMonths")}>
              <Input type="number" {...createForm.register("termMonths")} />
            </FormField>
            <FormField label={t("monthlyPayment")}>
              <Input {...createForm.register("monthlyPayment")} inputMode="decimal" />
            </FormField>
            <FormField label={t("linkedAccount")}>
              <Select {...createForm.register("accountId")}>
                <option value="">—</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label={t("notes")}>
              <Input {...createForm.register("notes")} />
            </FormField>
            <Button type="submit" size="lg" className="w-full" disabled={createLoan.isPending}>
              {tc("create")}
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      {/* Loan detail */}
      <Sheet open={!!detailLoan} onOpenChange={(o) => !o && setDetailLoan(null)}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
          {detailLoan && (
            <>
              <SheetHeader>
                <SheetTitle>{detailLoan.name}</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">{t("principal")}</p>
                    <p className="font-semibold">
                      {formatMoney(detailLoan.principal, detailLoan.currency, locale)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t("remaining")}</p>
                    <p className="font-semibold">
                      {formatMoney(detailLoan.remainingBalance, detailLoan.currency, locale)}
                    </p>
                  </div>
                </div>
                <ProgressBar value={detailLoan.percentPaid} />

                <div className="flex gap-2">
                  {detailLoan.status === "ACTIVE" && (
                    <Button className="flex-1" onClick={() => setPayOpen(true)}>
                      {t("recordPayment")}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => closeLoan.mutate(detailLoan.id)}
                    disabled={closeLoan.isPending}
                  >
                    {t("closeLoan")}
                  </Button>
                </div>

                <div>
                  <p className="mb-2 text-sm font-medium">{t("payments")}</p>
                  {!loanDetail?.payments.length ? (
                    <p className="text-sm text-muted-foreground">{t("noPayments")}</p>
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

      {/* Record payment */}
      <Sheet open={payOpen} onOpenChange={setPayOpen}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>{t("recordPayment")}</SheetTitle>
          </SheetHeader>
          <form
            className="mt-5 space-y-4"
            onSubmit={payForm.handleSubmit((d) => recordPayment.mutate(d))}
          >
            <FormField label={t("paymentAmount")}>
              <Input {...payForm.register("amount")} inputMode="decimal" />
            </FormField>
            <FormField label={t("interestPortion")}>
              <Input {...payForm.register("interestAmount")} inputMode="decimal" />
            </FormField>
            <FormField label={t("paymentDate")}>
              <FormDatePicker control={payForm.control} name="paymentDate" />
            </FormField>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...payForm.register("createTransaction")} />
              {t("linkTransaction")}
            </label>
            {payForm.watch("createTransaction") && (
              <FormField label="Category">
                <Select {...payForm.register("categoryId")}>
                  <option value="">Select</option>
                  {payCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </FormField>
            )}
            <Button type="submit" size="lg" className="w-full" disabled={recordPayment.isPending}>
              {tc("save")}
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
