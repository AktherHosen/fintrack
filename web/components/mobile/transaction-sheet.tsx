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
import { Input } from "@/components/ui/input";
import { FormDatePicker } from "@/components/ui/date-picker";
import { Select, FormField } from "@/components/ui/select";
import { SegmentedButton } from "@/components/ui/material";
import type { AccountDto, CategoryDto } from "@fintrack/shared";

export function TransactionSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [mode, setMode] = useState<"income" | "expense" | "transfer">("expense");
  const qc = useQueryClient();

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
      onOpenChange(false);
      txForm.reset();
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
            <FormField label="From account">
              <Select {...transferForm.register("fromAccountId")}>
                <option value="">Select account</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="To account">
              <Select {...transferForm.register("toAccountId")}>
                <option value="">Select account</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Amount (৳)">
              <Input {...transferForm.register("amount")} inputMode="decimal" />
            </FormField>
            <FormField label="Date">
              <FormDatePicker control={transferForm.control} name="transferDate" />
            </FormField>
            <Button type="submit" size="lg" className="w-full" disabled={createTransfer.isPending}>
              Transfer
            </Button>
          </form>
        ) : (
          <form
            className="mt-5 space-y-4"
            onSubmit={txForm.handleSubmit((d) =>
              createTx.mutate({ ...d, type: mode === "income" ? "INCOME" : "EXPENSE" }),
            )}
          >
            <FormField label="Amount (৳)">
              <Input {...txForm.register("amount")} inputMode="decimal" />
            </FormField>
            <FormField label="Category">
              <Select {...txForm.register("categoryId")}>
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Account">
              <Select {...txForm.register("accountId")}>
                <option value="">Select account</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Date">
              <FormDatePicker control={txForm.control} name="transactionDate" />
            </FormField>
            <FormField label="Note">
              <Input {...txForm.register("description")} placeholder="Optional" />
            </FormField>
            <Button type="submit" size="lg" className="w-full" disabled={createTx.isPending}>
              Save
            </Button>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
