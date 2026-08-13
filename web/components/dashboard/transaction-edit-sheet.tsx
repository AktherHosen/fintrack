"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { createTransactionSchema, type CreateTransactionInput } from "@fintrack/shared";
import { api } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import type { TransactionDto, AccountDto, CategoryDto } from "@fintrack/shared";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { FormDatePicker } from "@/components/ui/date-picker";
import { Select, FormField, FormInput, fieldError } from "@/components/ui/select";
import { SegmentedButton } from "@/components/ui/material";
import { cn } from "@/lib/utils";

import { getCurrencySymbol } from "@/lib/formatters";

export function TransactionEditSheet({
  transaction,
  open,
  onOpenChange,
}: {
  transaction: TransactionDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");
  const { user } = useAuth();
  const currency = user?.currency ?? "BDT";
  const qc = useQueryClient();

  const form = useForm<CreateTransactionInput>({
    resolver: zodResolver(createTransactionSchema),
    mode: "onTouched",
  });

  const txType = form.watch("type");

  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts"],
    queryFn: () => api<AccountDto[]>("/accounts"),
    enabled: open,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories", txType],
    queryFn: () => api<CategoryDto[]>(`/categories?type=${txType}`),
    enabled: open && !!txType,
  });

  useEffect(() => {
    if (!transaction || !open) return;
    form.reset({
      accountId: transaction.accountId,
      categoryId: transaction.categoryId,
      type: transaction.type as "INCOME" | "EXPENSE",
      amount: transaction.amount,
      description: transaction.description ?? "",
      transactionDate: transaction.transactionDate,
      reference: transaction.reference ?? "",
    });
  }, [transaction, open, form]);

  useEffect(() => {
    if (!open || categories.length === 0) return;
    const current = form.getValues("categoryId");
    if (!categories.some((c) => c.id === current)) {
      form.setValue("categoryId", categories[0]?.id ?? "");
    }
  }, [categories, open, form]);

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateTransactionInput> }) =>
      api(`/transactions/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["cashflow-summary"] });
      onOpenChange(false);
    },
  });

  const isIncome = txType === "INCOME";
  const amountErr = fieldError(form.formState.errors, "amount");
  const categoryErr = fieldError(form.formState.errors, "categoryId");
  const accountErr = fieldError(form.formState.errors, "accountId");
  const dateErr = fieldError(form.formState.errors, "transactionDate");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="gap-0 px-0 pb-8 pt-3">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted-foreground/25" />

        <SheetHeader className="px-6 text-left">
          <SheetTitle>{t("editTransaction")}</SheetTitle>
          <SheetDescription>{t("editTransactionDesc")}</SheetDescription>
        </SheetHeader>

        <form
          className="mt-5 space-y-5"
          onSubmit={form.handleSubmit((d) => transaction && update.mutate({ id: transaction.id, data: d }))}
        >
          <div className="px-6">
            <SegmentedButton
              options={[
                { value: "EXPENSE" as const, label: t("expenses") },
                { value: "INCOME" as const, label: t("income") },
              ]}
              value={txType === "INCOME" ? "INCOME" : "EXPENSE"}
              onChange={(type) => form.setValue("type", type)}
            />
          </div>

          <div className="px-6">
            <label
              htmlFor="edit-amount"
              className={cn(
                "text-xs font-medium uppercase tracking-wide",
                amountErr ? "text-destructive" : "text-muted-foreground",
              )}
            >
              {t("amount")}
            </label>
            <div className="mt-1 flex items-baseline gap-1 border-b pb-2">
              <span
                className={cn(
                  "text-2xl font-semibold tabular-nums",
                  isIncome ? "text-income" : "text-expense",
                )}
              >
                {getCurrencySymbol(currency, user?.locale ?? "en")}
              </span>
              <FormInput
                id="edit-amount"
                {...form.register("amount")}
                inputMode="decimal"
                error={amountErr}
                className="h-auto border-0 bg-transparent px-0 text-3xl font-bold shadow-none focus-visible:ring-0"
                placeholder="0.00"
              />
            </div>
            {amountErr ? <p className="mt-1 text-xs text-destructive">{amountErr}</p> : null}
          </div>

          <div className="mx-6 space-y-4 rounded-xl border bg-muted/30 p-4">
            <FormField label={t("categories")} error={categoryErr}>
              <Select
                aria-invalid={categoryErr ? true : undefined}
                {...form.register("categoryId")}
                className="bg-background"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label={t("account")} error={accountErr}>
              <Select
                aria-invalid={accountErr ? true : undefined}
                {...form.register("accountId")}
                className="bg-background"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label={t("date")} error={dateErr}>
              <FormDatePicker
                control={form.control}
                name="transactionDate"
                aria-invalid={dateErr ? true : undefined}
              />
            </FormField>

            <FormField label={t("note")} error={fieldError(form.formState.errors, "description")}>
              <FormInput
                {...form.register("description")}
                placeholder={t("notePlaceholder")}
                error={fieldError(form.formState.errors, "description")}
                className="bg-background"
              />
            </FormField>
          </div>

          <div className="flex gap-3 px-6 pt-2">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              {tc("cancel")}
            </Button>
            <Button type="submit" size="lg" className="flex-1" disabled={update.isPending}>
              {update.isPending ? tc("loading") : t("saveChanges")}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
