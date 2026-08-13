"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { createBudgetSchema, type CreateBudgetInput } from "@fintrack/shared";
import { api } from "@/lib/api-client";
import { formatMoney, monthRange, formatMoneyStat } from "@/lib/formatters";
import { useAuth } from "@/lib/auth-context";
import type { BudgetDto, CategoryDto } from "@fintrack/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, FormField, FormFieldInput, fieldError } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  EmptyState,
  PageHeader,
  ProgressBar,
  SegmentedButton,
  Skeleton,
  StatChip,
} from "@/components/ui/material";
import { cn } from "@/lib/utils";
import { Plus, Target, Trash2 } from "lucide-react";

type BudgetFilter = "ALL" | "OVER";

function sumMoney(values: string[]): string {
  const total = values.reduce((acc, v) => acc + parseFloat(v || "0"), 0);
  return total.toFixed(2);
}

export default function BudgetsPage() {
  const t = useTranslations("budgets");
  const tc = useTranslations("common");
  const { user } = useAuth();
  const locale = user?.locale ?? "en";
  const currency = user?.currency ?? "BDT";
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<BudgetFilter>("ALL");
  const qc = useQueryClient();
  const { startDate: monthStart, endDate: monthEnd } = monthRange();

  const monthLabel = new Date().toLocaleDateString(locale === "bn" ? "bn-BD" : "en-US", {
    month: "long",
    year: "numeric",
  });

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
    mode: "onTouched",
    defaultValues: { period: "MONTHLY", startDate: monthStart, endDate: monthEnd, amount: "" },
  });

  const create = useMutation({
    mutationFn: (data: CreateBudgetInput) =>
      api("/budgets", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["budgets"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      setOpen(false);
      form.reset({ period: "MONTHLY", startDate: monthStart, endDate: monthEnd, amount: "" });
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => api(`/budgets/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["budgets"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const totals = useMemo(
    () => ({
      budget: sumMoney(budgets.map((b) => b.amount)),
      spent: sumMoney(budgets.map((b) => b.spent)),
      remaining: sumMoney(budgets.map((b) => b.remaining)),
    }),
    [budgets],
  );

  const filteredBudgets = useMemo(
    () =>
      budgets.filter((b) => filter === "ALL" || b.status === "OVER_BUDGET"),
    [budgets, filter],
  );

  const overCount = budgets.filter((b) => b.status === "OVER_BUDGET").length;

  return (
    <div className="space-y-5 pb-4">
      <PageHeader
        title={t("title")}
        subtitle={`${t("thisMonth")} · ${monthLabel}`}
        action={
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            {t("addBudget")}
          </Button>
        }
      />

      {budgets.length > 0 ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">{t("thisMonth")}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-2 pt-0">
            {(
              [
                [t("totalBudget"), totals.budget, "neutral"] as const,
                [t("totalSpent"), totals.spent, "expense"] as const,
                [t("remaining"), totals.remaining, "income"] as const,
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

      {budgets.length > 0 ? (
        <SegmentedButton<BudgetFilter>
          options={[
            { value: "ALL", label: t("filterAll") },
            { value: "OVER", label: `${t("filterOver")}${overCount > 0 ? ` (${overCount})` : ""}` },
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
      ) : filteredBudgets.length === 0 ? (
        <EmptyState message={budgets.length === 0 ? t("empty") : t("noFilterResults")} />
      ) : (
        <div className="space-y-3">
          {filteredBudgets.map((b) => {
            const over = b.status === "OVER_BUDGET";

            return (
              <Card key={b.id} className="overflow-hidden">
                <CardContent className="space-y-3.5 p-4">
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                        over ? "bg-expense-muted text-expense" : "bg-primary/10 text-primary",
                      )}
                    >
                      <Target className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-semibold leading-snug">{b.name}</p>
                          {b.category?.name ? (
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                              {b.category.name}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums",
                              over ? "bg-expense-muted text-expense" : "bg-primary/10 text-primary",
                            )}
                          >
                            {b.percent}%
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => remove.mutate(b.id)}
                            disabled={remove.isPending}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        {t("totalSpent")}
                      </p>
                      <p className={cn("text-lg font-bold tabular-nums tracking-tight", over ? "text-expense" : "text-foreground")}>
                        {formatMoney(b.spent, currency, locale)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        {tc("of")} {formatMoney(b.amount, currency, locale)}
                      </p>
                      <p
                        className={cn(
                          "text-xs font-medium tabular-nums",
                          over ? "text-expense" : "text-income",
                        )}
                      >
                        {formatMoney(b.remaining, currency, locale)} {t("remaining").toLowerCase()}
                      </p>
                    </div>
                  </div>

                  <ProgressBar value={b.percent} overBudget={over} />

                  <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    {over ? t("overBudget") : t("onTrack")}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>{t("newBudget")}</SheetTitle>
          </SheetHeader>
          <form className="mt-5 space-y-4" onSubmit={form.handleSubmit((d) => create.mutate(d))}>
            <FormFieldInput form={form} name="name" label={t("name")} placeholder="Groceries" />
            <FormField label={t("category")} error={fieldError(form.formState.errors, "categoryId")}>
              <Select
                aria-invalid={fieldError(form.formState.errors, "categoryId") ? true : undefined}
                {...form.register("categoryId")}
              >
                <option value="">{t("selectCategory")}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormFieldInput form={form} name="amount" label={t("amount")} inputMode="decimal" />
            <Button type="submit" size="lg" className="w-full" disabled={create.isPending}>
              {tc("create")}
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
