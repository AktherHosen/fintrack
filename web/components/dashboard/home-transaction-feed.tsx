"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { ChevronRight, ListFilter, MoreVertical, Tags } from "lucide-react";
import { api } from "@/lib/api-client";
import { formatMoney, formatDate } from "@/lib/formatters";
import { useAuth } from "@/lib/auth-context";
import type { TransactionDto, CategoryDto } from "@fintrack/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState, Skeleton } from "@/components/ui/material";
import { TransactionEditSheet } from "@/components/dashboard/transaction-edit-sheet";
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
    <div className="group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/30">
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold leading-none text-white ring-2 ring-background",
          isIncome ? "bg-income shadow-sm" : "bg-expense shadow-sm",
        )}
        aria-hidden
      >
        {isIncome ? "+" : "−"}
      </div>

      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-sm font-medium leading-snug", !tx.description?.trim() && "text-muted-foreground")}>
          {note}
        </p>
        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
          {formatDate(tx.transactionDate, locale)}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <div className="text-right">
          <p className={cn("text-sm font-semibold tabular-nums tracking-tight", isIncome ? "text-income" : "text-expense")}>
            {formatMoney(tx.amount, currency, locale)}
          </p>
          <p className="mt-0.5 max-w-[6.5rem] truncate text-[11px] text-muted-foreground">
            {tx.category?.name ?? "—"}
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 rounded-lg text-muted-foreground opacity-60 transition-opacity group-hover:opacity-100"
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

  const remove = useMutation({
    mutationFn: (id: string) => api(`/transactions/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
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
  }

  function clearFilters() {
    setTypeFilter("");
    setSearch("");
    setFilterOpen(false);
  }

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle className="text-sm font-semibold">{t("transactions")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 px-0 pb-2 pt-4">
          <div className="flex items-stretch gap-2 px-4">
            <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
              <button
                type="button"
                onClick={() => setCategoryId("")}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200",
                  categoryId === ""
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted",
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
                      "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200",
                      active
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted/60 text-muted-foreground hover:bg-muted",
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
              <div className="divide-y divide-border/60">
                {items.map((tx) => (
                  <TransactionRow
                    key={tx.id}
                    tx={tx}
                    locale={locale}
                    currency={currency}
                    noNoteLabel={t("noNote")}
                    editLabel={tc("edit")}
                    deleteLabel={tc("delete")}
                    onEdit={() => openEdit(tx)}
                    onDelete={() => remove.mutate(tx.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <TransactionEditSheet
        transaction={editTx}
        open={!!editTx}
        onOpenChange={(open) => !open && setEditTx(null)}
      />
    </>
  );
}
