"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createTransactionSchema,
  createTransferSchema,
  type CreateTransactionInput,
  type CreateTransferInput,
} from "@fintrack/shared";
import { api } from "@/lib/api-client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { FormDatePicker } from "@/components/ui/date-picker";
import { Select, FormField, FormFieldInput, fieldError } from "@/components/ui/select";
import { SegmentedButton } from "@/components/ui/material";
import type { AccountDto, CategoryDto, SubscriptionDto } from "@fintrack/shared";
import { usePlanUpgrade } from "@/lib/use-plan-upgrade";

export function TransactionSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [mode, setMode] = useState<"income" | "expense" | "transfer">("expense");
  const qc = useQueryClient();
  const { promptUpgradeIfAtLimit, handleUpgradeError } = usePlanUpgrade();

  const { data: subscription } = useQuery({
    queryKey: ["subscription"],
    queryFn: () => api<SubscriptionDto | null>("/subscription"),
    enabled: open,
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts"],
    queryFn: () => api<AccountDto[]>("/accounts"),
    enabled: open,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories", mode],
    queryFn: () =>
      api<CategoryDto[]>(`/categories?type=${mode === "income" ? "INCOME" : "EXPENSE"}`),
    enabled: open && mode !== "transfer",
  });

  const txForm = useForm<CreateTransactionInput>({
    resolver: zodResolver(createTransactionSchema),
    mode: "onTouched",
    defaultValues: {
      type: "EXPENSE",
      transactionDate: new Date().toISOString().slice(0, 10),
      amount: "",
      accountId: "",
      categoryId: "",
    },
  });

  const transferForm = useForm<CreateTransferInput>({
    resolver: zodResolver(createTransferSchema),
    mode: "onTouched",
    defaultValues: {
      transferDate: new Date().toISOString().slice(0, 10),
      amount: "",
      fromAccountId: "",
      toAccountId: "",
    },
  });

  const createTx = useMutation({
    mutationFn: (data: CreateTransactionInput) =>
      api("/transactions", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["cashflow-summary"] });
      qc.invalidateQueries({ queryKey: ["subscription"] });
      onOpenChange(false);
      txForm.reset();
    },
    onError: (e) => {
      handleUpgradeError(e, () => onOpenChange(false));
    },
  });

  const createTransfer = useMutation({
    mutationFn: (data: CreateTransferInput) =>
      api("/transfers", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["accounts"] });
      onOpenChange(false);
      transferForm.reset();
    },
  });

  function submitTransaction(data: CreateTransactionInput) {
    if (
      promptUpgradeIfAtLimit(
        subscription?.usage?.transactions ?? 0,
        subscription?.limits?.transactions,
      )
    ) {
      onOpenChange(false);
      return;
    }
    createTx.mutate(data);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Add transaction</SheetTitle>
        </SheetHeader>

        <SegmentedButton
          className="mt-4"
          options={[
            { value: "income" as const, label: "Income" },
            { value: "expense" as const, label: "Expense" },
            { value: "transfer" as const, label: "Transfer" },
          ]}
          value={mode}
          onChange={(m) => {
            setMode(m);
            if (m !== "transfer") txForm.setValue("type", m === "income" ? "INCOME" : "EXPENSE");
          }}
        />

        {mode === "transfer" ? (
          <form
            className="mt-5 space-y-4"
            onSubmit={transferForm.handleSubmit((d) => createTransfer.mutate(d))}
          >
            <FormField label="From account" error={fieldError(transferForm.formState.errors, "fromAccountId")}>
              <Select
                aria-invalid={fieldError(transferForm.formState.errors, "fromAccountId") ? true : undefined}
                {...transferForm.register("fromAccountId")}
              >
                <option value="">Select account</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="To account" error={fieldError(transferForm.formState.errors, "toAccountId")}>
              <Select
                aria-invalid={fieldError(transferForm.formState.errors, "toAccountId") ? true : undefined}
                {...transferForm.register("toAccountId")}
              >
                <option value="">Select account</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormFieldInput form={transferForm} name="amount" label="Amount (৳)" inputMode="decimal" />
            <FormField label="Date" error={fieldError(transferForm.formState.errors, "transferDate")}>
              <FormDatePicker
                control={transferForm.control}
                name="transferDate"
                aria-invalid={
                  fieldError(transferForm.formState.errors, "transferDate") ? true : undefined
                }
              />
            </FormField>
            <Button type="submit" size="lg" className="w-full" disabled={createTransfer.isPending}>
              Transfer
            </Button>
          </form>
        ) : (
          <form
            className="mt-5 space-y-4"
            onSubmit={txForm.handleSubmit((d) =>
              submitTransaction({ ...d, type: mode === "income" ? "INCOME" : "EXPENSE" }),
            )}
          >
            <FormFieldInput form={txForm} name="amount" label="Amount (৳)" inputMode="decimal" />
            <FormField label="Category" error={fieldError(txForm.formState.errors, "categoryId")}>
              <Select
                aria-invalid={fieldError(txForm.formState.errors, "categoryId") ? true : undefined}
                {...txForm.register("categoryId")}
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Account" error={fieldError(txForm.formState.errors, "accountId")}>
              <Select
                aria-invalid={fieldError(txForm.formState.errors, "accountId") ? true : undefined}
                {...txForm.register("accountId")}
              >
                <option value="">Select account</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Date" error={fieldError(txForm.formState.errors, "transactionDate")}>
              <FormDatePicker
                control={txForm.control}
                name="transactionDate"
                aria-invalid={
                  fieldError(txForm.formState.errors, "transactionDate") ? true : undefined
                }
              />
            </FormField>
            <FormFieldInput form={txForm} name="description" label="Note" placeholder="Optional" />
            <Button type="submit" size="lg" className="w-full" disabled={createTx.isPending}>
              Save
            </Button>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
