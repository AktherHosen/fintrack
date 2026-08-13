"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createRecurringSchema, type CreateRecurringInput } from "@fintrack/shared";
import { api, ApiError } from "@/lib/api-client";
import { formatBDT, formatDate } from "@/lib/formatters";
import type { AccountDto, CategoryDto } from "@fintrack/shared";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, FormField } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { EmptyState, ListDivider, ListItem, PageHeader, Skeleton } from "@/components/ui/material";
import { Repeat } from "lucide-react";

interface RecurringItem {
  id: string;
  type: string;
  amount: string;
  frequency: string;
  description: string | null;
  nextRunAt: string;
  isActive: boolean;
  category?: { name: string };
  account?: { name: string };
}

export default function RecurringPage() {
  const [open, setOpen] = useState(false);
  const [locked, setLocked] = useState(false);
  const qc = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["recurring"],
    queryFn: () => api<RecurringItem[]>("/recurring-transactions"),
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts"],
    queryFn: () => api<AccountDto[]>("/accounts"),
    enabled: open,
  });

  const form = useForm<CreateRecurringInput>({
    resolver: zodResolver(createRecurringSchema),
    defaultValues: {
      type: "EXPENSE",
      frequency: "MONTHLY",
      nextRunAt: new Date().toISOString(),
      amount: "",
      accountId: "",
      categoryId: "",
    },
  });

  const recurringType = form.watch("type");

  const { data: categories = [] } = useQuery({
    queryKey: ["categories-recurring", recurringType],
    queryFn: () => api<CategoryDto[]>(`/categories?type=${recurringType}`),
    enabled: open,
  });

  const create = useMutation({
    mutationFn: (data: CreateRecurringInput) =>
      api("/recurring-transactions", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recurring"] });
      setOpen(false);
      form.reset();
    },
    onError: (e) => {
      if (e instanceof ApiError && e.status === 403) setLocked(true);
    },
  });

  const deactivate = useMutation({
    mutationFn: (id: string) => api(`/recurring-transactions/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recurring"] }),
  });

  const activeItems = items.filter((i) => i.isActive);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Recurring"
        subtitle="Automate regular payments"
        action={
          <Button size="sm" onClick={() => setOpen(true)}>
            Add
          </Button>
        }
      />

      {locked && (
        <Card>
          <CardContent className="py-4 text-sm text-muted-foreground">
            Pro plan required for recurring transactions.
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      ) : activeItems.length === 0 ? (
        <EmptyState message="No recurring transactions yet." />
      ) : (
        <Card>
          <CardContent className="py-1">
            {activeItems.map((item, i) => (
              <div key={item.id}>
                {i > 0 && <ListDivider />}
                <ListItem
                  title={item.description || item.category?.name || "Recurring"}
                  subtitle={`${item.frequency} · Next ${formatDate(item.nextRunAt.slice(0, 10))}`}
                  icon={Repeat}
                  iconClassName="border-primary/20 bg-primary/10 text-primary"
                  trailing={
                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatBDT(item.amount)}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-1 h-8 px-2 text-xs"
                        onClick={() => deactivate.mutate(item.id)}
                      >
                        Stop
                      </Button>
                    </div>
                  }
                />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>New recurring</SheetTitle>
          </SheetHeader>
          <form className="mt-5 space-y-4" onSubmit={form.handleSubmit((d) => create.mutate(d))}>
            <FormField label="Type">
              <Select {...form.register("type")}>
                <option value="EXPENSE">Expense</option>
                <option value="INCOME">Income</option>
              </Select>
            </FormField>
            <FormField label="Amount">
              <Input {...form.register("amount")} inputMode="decimal" />
            </FormField>
            <FormField label="Account">
              <Select {...form.register("accountId")}>
                <option value="">Select account</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Category">
              <Select {...form.register("categoryId")}>
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Frequency">
              <Select {...form.register("frequency")}>
                {["DAILY", "WEEKLY", "MONTHLY", "YEARLY"].map((f) => (
                  <option key={f} value={f}>
                    {f.charAt(0) + f.slice(1).toLowerCase()}
                  </option>
                ))}
              </Select>
            </FormField>
            <Button type="submit" size="lg" className="w-full" disabled={create.isPending}>
              Create
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
