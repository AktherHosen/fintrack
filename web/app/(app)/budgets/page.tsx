"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createBudgetSchema, type CreateBudgetInput } from "@fintrack/shared";
import { api } from "@/lib/api-client";
import { formatBDT } from "@/lib/formatters";
import type { BudgetDto, CategoryDto } from "@fintrack/shared";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, FormField } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { EmptyState, PageHeader, ProgressBar, Skeleton } from "@/components/ui/material";
import { Trash2 } from "lucide-react";

export default function BudgetsPage() {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);

  const { data: budgets = [], isLoading } = useQuery({
    queryKey: ["budgets"],
    queryFn: () => api<BudgetDto[]>("/budgets"),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories", "EXPENSE"],
    queryFn: () => api<CategoryDto[]>("/categories?type=EXPENSE"),
    enabled: open,
  });

  const form = useForm<CreateBudgetInput>({
    resolver: zodResolver(createBudgetSchema),
    defaultValues: { period: "MONTHLY", startDate: monthStart, endDate: monthEnd, amount: "" },
  });

  const create = useMutation({
    mutationFn: (data: CreateBudgetInput) =>
      api("/budgets", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["budgets"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      setOpen(false);
      form.reset({ period: "MONTHLY", startDate: monthStart, endDate: monthEnd });
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => api(`/budgets/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["budgets"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Budgets"
        action={
          <Button size="sm" onClick={() => setOpen(true)}>
            Add
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      ) : budgets.length === 0 ? (
        <EmptyState message="No budgets yet. Set one to track spending." />
      ) : (
        budgets.map((b) => (
          <Card key={b.id}>
            <CardContent className="space-y-3 py-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{b.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatBDT(b.spent)} of {formatBDT(b.amount)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      b.status === "OVER_BUDGET"
                        ? "bg-expense-muted text-expense"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    {b.percent}%
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive"
                    onClick={() => remove.mutate(b.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <ProgressBar value={b.percent} overBudget={b.status === "OVER_BUDGET"} />
              <p className="text-xs text-muted-foreground">{formatBDT(b.remaining)} remaining</p>
            </CardContent>
          </Card>
        ))
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>New budget</SheetTitle>
          </SheetHeader>
          <form className="mt-5 space-y-4" onSubmit={form.handleSubmit((d) => create.mutate(d))}>
            <FormField label="Name">
              <Input {...form.register("name")} />
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
            <FormField label="Amount">
              <Input {...form.register("amount")} inputMode="decimal" />
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
