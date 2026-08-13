"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDownLeft, ArrowUpRight, Pencil, Trash2 } from "lucide-react";
import { createTransactionSchema, type CreateTransactionInput } from "@fintrack/shared";
import { api } from "@/lib/api-client";
import { formatBDT, formatDate } from "@/lib/formatters";
import type { TransactionDto, AccountDto, CategoryDto } from "@fintrack/shared";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormDatePicker } from "@/components/ui/date-picker";
import { Select, FormField } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { EmptyState, ListDivider, ListItem, PageHeader, Skeleton } from "@/components/ui/material";

interface TxListResponse {
  items: TransactionDto[];
  total: number;
}

export default function TransactionsPage() {
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [editTx, setEditTx] = useState<TransactionDto | null>(null);
  const qc = useQueryClient();

  const queryParams = new URLSearchParams();
  if (typeFilter) queryParams.set("type", typeFilter);

  const { data, isLoading } = useQuery({
    queryKey: ["transactions", typeFilter],
    queryFn: () => api<TxListResponse>(`/transactions?${queryParams.toString()}`),
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts"],
    queryFn: () => api<AccountDto[]>("/accounts"),
    enabled: !!editTx,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories", editTx?.type],
    queryFn: () => api<CategoryDto[]>(`/categories?type=${editTx?.type}`),
    enabled: !!editTx,
  });

  const form = useForm<CreateTransactionInput>({
    resolver: zodResolver(createTransactionSchema),
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateTransactionInput> }) =>
      api(`/transactions/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      setEditTx(null);
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => api(`/transactions/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      setEditTx(null);
    },
  });

  const items = data?.items ?? [];

  function openEdit(tx: TransactionDto) {
    setEditTx(tx);
    form.reset({
      accountId: tx.accountId,
      categoryId: tx.categoryId,
      type: tx.type as "INCOME" | "EXPENSE",
      amount: tx.amount,
      description: tx.description ?? "",
      transactionDate: tx.transactionDate,
      reference: tx.reference ?? "",
    });
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Transactions" subtitle={`${data?.total ?? items.length} total`} />

      <div className="flex gap-2">
        {["", "INCOME", "EXPENSE"].map((t) => (
          <Button
            key={t || "all"}
            size="sm"
            variant={typeFilter === t ? "default" : "secondary"}
            onClick={() => setTypeFilter(t)}
          >
            {t ? t.charAt(0) + t.slice(1).toLowerCase() : "All"}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState message="No transactions yet. Tap + to add one." />
      ) : (
        <Card>
          <CardContent className="py-1">
            {items.map((tx, i) => (
              <div key={tx.id}>
                {i > 0 && <ListDivider />}
                <ListItem
                  title={tx.category?.name ?? "Transaction"}
                  subtitle={`${tx.description || tx.account?.name} · ${formatDate(tx.transactionDate)}`}
                  icon={tx.type === "INCOME" ? ArrowDownLeft : ArrowUpRight}
                  iconClassName={
                    tx.type === "INCOME"
                      ? "border-income/20 bg-income-muted text-income"
                      : "border-expense/20 bg-expense-muted text-expense"
                  }
                  trailing={
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-semibold ${tx.type === "INCOME" ? "text-income" : "text-expense"}`}
                      >
                        {tx.type === "INCOME" ? "+" : "-"}
                        {formatBDT(tx.amount)}
                      </span>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(tx)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  }
                />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Sheet open={!!editTx} onOpenChange={(o) => !o && setEditTx(null)}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Edit transaction</SheetTitle>
          </SheetHeader>
          <form
            className="mt-5 space-y-4"
            onSubmit={form.handleSubmit((d) => editTx && update.mutate({ id: editTx.id, data: d }))}
          >
            <FormField label="Amount">
              <Input {...form.register("amount")} inputMode="decimal" />
            </FormField>
            <FormField label="Date">
              <FormDatePicker control={form.control} name="transactionDate" />
            </FormField>
            <FormField label="Account">
              <Select {...form.register("accountId")}>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Category">
              <Select {...form.register("categoryId")}>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Description">
              <Input {...form.register("description")} />
            </FormField>
            <div className="flex gap-2">
              <Button type="submit" size="lg" className="flex-1" disabled={update.isPending}>
                Save
              </Button>
              <Button
                type="button"
                size="lg"
                variant="destructive"
                disabled={remove.isPending}
                onClick={() => editTx && remove.mutate(editTx.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
