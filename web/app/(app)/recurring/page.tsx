"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { createRecurringSchema, type CreateRecurringInput } from "@fintrack/shared";
import { api, ApiError } from "@/lib/api-client";
import { formatMoney, formatDate } from "@/lib/formatters";
import { useAuth } from "@/lib/auth-context";
import type { AccountDto, CategoryDto } from "@fintrack/shared";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, FormField, FormFieldInput, fieldError } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { EmptyState, PageHeader, SegmentedButton, Skeleton } from "@/components/ui/material";
import { cn } from "@/lib/utils";
import { Plus, Repeat, Square, TrendingDown, TrendingUp } from "lucide-react";

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

type RecurringFilter = "ALL" | "INCOME" | "EXPENSE";

function frequencyLabel(frequency: string, t: (key: string) => string): string {
  if (frequency === "DAILY") return t("freqDaily");
  if (frequency === "WEEKLY") return t("freqWeekly");
  if (frequency === "MONTHLY") return t("freqMonthly");
  if (frequency === "YEARLY") return t("freqYearly");
  return frequency;
}

export default function RecurringPage() {
  const t = useTranslations("recurring");
  const tc = useTranslations("common");
  const { user } = useAuth();
  const locale = user?.locale ?? "en";
  const currency = user?.currency ?? "BDT";
  const [open, setOpen] = useState(false);
  const [locked, setLocked] = useState(false);
  const [filter, setFilter] = useState<RecurringFilter>("ALL");
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
    mode: "onTouched",
    defaultValues: {
      type: "EXPENSE",
      frequency: "MONTHLY",
      nextRunAt: new Date().toISOString(),
      amount: "",
      accountId: "",
      categoryId: "",
      description: "",
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
      form.reset({
        type: "EXPENSE",
        frequency: "MONTHLY",
        nextRunAt: new Date().toISOString(),
        amount: "",
        accountId: "",
        categoryId: "",
        description: "",
      });
    },
    onError: (e) => {
      if (e instanceof ApiError && e.status === 403) setLocked(true);
    },
  });

  const deactivate = useMutation({
    mutationFn: (id: string) => api(`/recurring-transactions/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recurring"] }),
  });

  const activeItems = useMemo(() => items.filter((i) => i.isActive), [items]);

  const filteredItems = useMemo(
    () => activeItems.filter((i) => filter === "ALL" || i.type === filter),
    [activeItems, filter],
  );

  return (
    <div className="space-y-5 pb-4">
      <PageHeader
        title={t("title")}
        subtitle={
          activeItems.length > 0
            ? `${t("subtitle")} · ${t("activeCount", { count: activeItems.length })}`
            : t("subtitle")
        }
        action={
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            {t("addRecurring")}
          </Button>
        }
      />

      {locked ? (
        <Card className="border-amber-200/80 bg-amber-50/80 dark:border-amber-900/50 dark:bg-amber-950/20">
          <CardContent className="py-4 text-sm text-muted-foreground">{t("proRequired")}</CardContent>
        </Card>
      ) : null}

      {activeItems.length > 0 ? (
        <SegmentedButton<RecurringFilter>
          options={[
            { value: "ALL", label: t("filterAll") },
            { value: "INCOME", label: t("filterIncome") },
            { value: "EXPENSE", label: t("filterExpense") },
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
      ) : filteredItems.length === 0 ? (
        <EmptyState message={activeItems.length === 0 ? t("empty") : t("noFilterResults")} />
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const isIncome = item.type === "INCOME";
            const Icon = isIncome ? TrendingUp : TrendingDown;
            const title = item.description || item.category?.name || t("title");

            return (
              <Card key={item.id} className="overflow-hidden">
                <CardContent className="space-y-3.5 p-4">
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                        isIncome ? "bg-income-muted text-income" : "bg-expense-muted text-expense",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-semibold leading-snug">{title}</p>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {item.account?.name}
                            {item.category?.name ? ` · ${item.category.name}` : ""}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                              isIncome ? "bg-income-muted text-income" : "bg-expense-muted text-expense",
                            )}
                          >
                            {frequencyLabel(item.frequency, t)}
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => deactivate.mutate(item.id)}
                            disabled={deactivate.isPending}
                            aria-label={t("stop")}
                          >
                            <Square className="h-3.5 w-3.5 fill-current" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        {t("amount")}
                      </p>
                      <p
                        className={cn(
                          "text-lg font-bold tabular-nums tracking-tight",
                          isIncome ? "text-income" : "text-expense",
                        )}
                      >
                        {formatMoney(item.amount, currency, locale)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        {t("nextRun")}
                      </p>
                      <p className="text-xs font-medium tabular-nums">
                        {formatDate(item.nextRunAt.slice(0, 10), locale)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    <Repeat className="h-3 w-3" />
                    {isIncome ? t("income") : t("expense")}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{t("newRecurring")}</SheetTitle>
          </SheetHeader>
          <form
            className="mt-5 space-y-4"
            onSubmit={form.handleSubmit((d) =>
              create.mutate({
                ...d,
                nextRunAt: d.nextRunAt.includes("T") ? d.nextRunAt : new Date().toISOString(),
              }),
            )}
          >
            <FormField label={t("type")} error={fieldError(form.formState.errors, "type")}>
              <Select
                aria-invalid={fieldError(form.formState.errors, "type") ? true : undefined}
                {...form.register("type")}
              >
                <option value="EXPENSE">{t("expense")}</option>
                <option value="INCOME">{t("income")}</option>
              </Select>
            </FormField>
            <FormFieldInput form={form} name="amount" label={t("amount")} inputMode="decimal" />
            <FormField label={t("account")} error={fieldError(form.formState.errors, "accountId")}>
              <Select
                aria-invalid={fieldError(form.formState.errors, "accountId") ? true : undefined}
                {...form.register("accountId")}
              >
                <option value="">{t("selectAccount")}</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </Select>
            </FormField>
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
            <FormField label={t("frequency")} error={fieldError(form.formState.errors, "frequency")}>
              <Select
                aria-invalid={fieldError(form.formState.errors, "frequency") ? true : undefined}
                {...form.register("frequency")}
              >
                <option value="DAILY">{t("freqDaily")}</option>
                <option value="WEEKLY">{t("freqWeekly")}</option>
                <option value="MONTHLY">{t("freqMonthly")}</option>
                <option value="YEARLY">{t("freqYearly")}</option>
              </Select>
            </FormField>
            <FormFieldInput
              form={form}
              name="description"
              label={t("description")}
              placeholder={t("descriptionPlaceholder")}
            />
            <Button type="submit" size="lg" className="w-full" disabled={create.isPending}>
              {tc("create")}
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
