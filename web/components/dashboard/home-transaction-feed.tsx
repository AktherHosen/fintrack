"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { ChevronRight, ListFilter, MoreVertical, Tags, Trash2 } from "lucide-react";
import { createTransactionSchema, type CreateTransactionInput } from "@fintrack/shared";
import { api } from "@/lib/api-client";
import { formatMoney, formatDate } from "@/lib/formatters";
import { useAuth } from "@/lib/auth-context";
import type { TransactionDto, AccountDto, CategoryDto } from "@fintrack/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormDatePicker } from "@/components/ui/date-picker";
import { Select, FormField } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState, ListDivider, Skeleton } from "@/components/ui/material";
import { cn } from "@/lib/utils";

interface TxListResponse {
  items: TransactionDto[];
  total: number;
}

function buildQuery(params: Record<string, string | undefined>) {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) qs.set(key, value);
  }
  qs.set("limit", "100");
  return qs.toString();
}

function TransactionRow({
  tx,
  locale,
  currency,
  noNoteLabel,
  onEdit,
  onDelete,
  editLabel,
  deleteLabel,
}: {
  tx: TransactionDto;
  locale: string;
  currency: string;
  noNoteLabel: string;
  onEdit: () => void;
  onDelete: () => void;
  editLabel: string;
  deleteLabel: string;
}) {
  const isIncome = tx.type === "INCOME";
  const note = tx.description?.trim() || noNoteLabel;

  return (
    <div className="flex items-center gap-2.5 px-3 py-3">
      <div
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold leading-none text-white",
          isIncome ? "bg-income" : "bg-expense",
        )}
        aria-hidden
      >
        {isIncome ? "+" : "−"}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium leading-tight">{note}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {formatDate(tx.transactionDate, locale)}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        <div className="text-right">
          <p className={cn("text-sm font-semibold tabular-nums", isIncome ? "text-income" : "text-expense")}>
            {formatMoney(tx.amount, currency, locale)}
          </p>
          <p className="mt-0.5 max-w-[7rem] truncate text-xs text-muted-foreground">
            {tx.category?.name ?? "—"}
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-muted-foreground"
              aria-label="Actions"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>{editLabel}</DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
              {deleteLabel}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export function HomeTransactionFeed() {
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");
  const { user } = useAuth();
  const locale = user?.locale ?? "en";
  const currency = user?.currency ?? "BDT";
  const qc = useQueryClient();

  const [categoryId, setCategoryId] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [editTx, setEditTx] = useState<TransactionDto | null>(null);

  const listQuery = buildQuery({ type: typeFilter, categoryId, search });

  const { data, isLoading } = useQuery({
    queryKey: ["transactions", typeFilter, categoryId, search],
    queryFn: () => api<TxListResponse>(`/transactions?${listQuery}`),
  });

  const countQuery = buildQuery({ type: typeFilter });

  const { data: countData } = useQuery({
    queryKey: ["transactions-counts", typeFilter],
    queryFn: () => api<TxListResponse>(`/transactions?${countQuery}`),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories-all"],
    queryFn: async () => {
      const [expense, income] = await Promise.all([
        api<CategoryDto[]>("/categories?type=EXPENSE"),
        api<CategoryDto[]>("/categories?type=INCOME"),
      ]);
      return [...expense, ...income].sort((a, b) => a.name.localeCompare(b.name));
    },
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts"],
    queryFn: () => api<AccountDto[]>("/accounts"),
    enabled: !!editTx,
  });

  const { data: editCategories = [] } = useQuery({
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
  const countItems = countData?.items ?? [];

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const tx of countItems) {
      counts.set(tx.categoryId, (counts.get(tx.categoryId) ?? 0) + 1);
    }
    return counts;
  }, [countItems]);

  const visibleCategories = useMemo(() => {
    const filtered = typeFilter
      ? categories.filter((c) => c.type === typeFilter)
      : categories;
    return filtered.filter((c) => (categoryCounts.get(c.id) ?? 0) > 0);
  }, [categories, categoryCounts, typeFilter]);

  const totalCount = countData?.total ?? countItems.length;
  const hasActiveFilters = typeFilter !== "" || search !== "";

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

  function clearFilters() {
    setTypeFilter("");
    setSearch("");
    setFilterOpen(false);
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t("transactions")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 px-0 pb-4">
          <div className="flex items-stretch gap-2 px-4">
            <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto scrollbar-none">
              <button
                type="button"
                onClick={() => setCategoryId("")}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  categoryId === ""
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80",
                )}
              >
                {tc("all")}
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                    categoryId === "" ? "bg-primary-foreground/20" : "bg-background",
                  )}
                >
                  {totalCount}
                </span>
              </button>

              {visibleCategories.map((cat) => {
                const count = categoryCounts.get(cat.id) ?? 0;
                const active = categoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80",
                    )}
                  >
                    {cat.name}
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                        active ? "bg-primary-foreground/20" : "bg-background",
                      )}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <Popover open={filterOpen} onOpenChange={setFilterOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  size="icon"
                  variant={hasActiveFilters ? "default" : "secondary"}
                  className="h-8 w-8 shrink-0 rounded-full"
                  aria-label={t("filterAndCategories")}
                >
                  <ListFilter className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72 p-0">
                <div className="space-y-3 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t("filter")}
                  </p>
                  <div className="flex gap-1.5">
                    {(["", "INCOME", "EXPENSE"] as const).map((type) => (
                      <Button
                        key={type || "all"}
                        type="button"
                        size="sm"
                        variant={typeFilter === type ? "default" : "secondary"}
                        className="flex-1 text-xs"
                        onClick={() => {
                          setTypeFilter(type);
                          setCategoryId("");
                        }}
                      >
                        {type === ""
                          ? tc("all")
                          : type === "INCOME"
                            ? t("income")
                            : t("expenses")}
                      </Button>
                    ))}
                  </div>
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t("searchTransactions")}
                    className="h-9"
                  />
                  {hasActiveFilters ? (
                    <Button type="button" size="sm" variant="ghost" className="w-full" onClick={clearFilters}>
                      {t("clearFilters")}
                    </Button>
                  ) : null}
                </div>

                <div className="border-t">
                  <div className="flex items-center justify-between px-3 py-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {t("categories")}
                    </p>
                    <Link
                      href="/categories"
                      className="text-xs font-medium text-primary"
                      onClick={() => setFilterOpen(false)}
                    >
                      {t("manageAll")}
                    </Link>
                  </div>
                  <div className="max-h-48 overflow-y-auto pb-2">
                    {categories.length === 0 ? (
                      <p className="px-3 py-2 text-xs text-muted-foreground">{t("noCategories")}</p>
                    ) : (
                      categories.map((cat) => (
                        <Link
                          key={cat.id}
                          href={`/categories?search=${encodeURIComponent(cat.name)}`}
                          className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted/60"
                          onClick={() => setFilterOpen(false)}
                        >
                          <Tags className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <span className="min-w-0 flex-1 truncate">{cat.name}</span>
                          <span className="text-[10px] uppercase text-muted-foreground">
                            {cat.type === "INCOME" ? t("income") : t("expenses")}
                          </span>
                          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="px-4">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
              </div>
            ) : items.length === 0 ? (
              <EmptyState message={t("noTransactions")} />
            ) : (
              <div className="rounded-xl border bg-card">
                {items.map((tx, i) => (
                  <div key={tx.id}>
                    {i > 0 && <ListDivider />}
                    <TransactionRow
                      tx={tx}
                      locale={locale}
                      currency={currency}
                      noNoteLabel={t("noNote")}
                      editLabel={tc("edit")}
                      deleteLabel={tc("delete")}
                      onEdit={() => openEdit(tx)}
                      onDelete={() => remove.mutate(tx.id)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Sheet open={!!editTx} onOpenChange={(o) => !o && setEditTx(null)}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>{tc("edit")}</SheetTitle>
          </SheetHeader>
          <form
            className="mt-5 space-y-4"
            onSubmit={form.handleSubmit((d) => editTx && update.mutate({ id: editTx.id, data: d }))}
          >
            <FormField label={t("amount")}>
              <Input {...form.register("amount")} inputMode="decimal" />
            </FormField>
            <FormField label={t("date")}>
              <FormDatePicker control={form.control} name="transactionDate" />
            </FormField>
            <FormField label={t("account")}>
              <Select {...form.register("accountId")}>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label={t("categories")}>
              <Select {...form.register("categoryId")}>
                {editCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label={t("description")}>
              <Input {...form.register("description")} />
            </FormField>
            <div className="flex gap-2">
              <Button type="submit" size="lg" className="flex-1" disabled={update.isPending}>
                {tc("save")}
              </Button>
              <Button
                type="button"
                size="lg"
                variant="destructive"
                disabled={remove.isPending}
                onClick={() => editTx && remove.mutate(editTx.id)}
                aria-label={tc("delete")}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
