"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Crown, Eye, Loader2, MoreVertical, Pause, Play, XCircle } from "lucide-react";
import type { AdminSubscriptionDetailDto, AdminSubscriptionDto } from "@fintrack/shared";
import { api } from "@/lib/api-client";
import { formatDate, formatMoney } from "@/lib/formatters";
import { UsageMeter } from "@/components/subscription/usage-meter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FormInput } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { EmptyState, ListDivider, ListItem, SegmentedButton, Skeleton } from "@/components/ui/material";
import { cn } from "@/lib/utils";

type SubFilter = "ALL" | "ACTIVE" | "PAUSED" | "EXPIRED";

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-primary/10 text-primary",
  PAUSED: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
  EXPIRED: "bg-muted text-muted-foreground",
  CANCELED: "bg-destructive/10 text-destructive",
};

export function AdminSubscribersSection({
  enabled,
  locale,
  currency,
}: {
  enabled: boolean;
  locale: string;
  currency: string;
}) {
  const t = useTranslations("admin.subscribers");
  const tc = useTranslations("common");
  const qc = useQueryClient();
  const fmt = (amount: string, planCurrency?: string) =>
    formatMoney(amount, planCurrency ?? currency, locale);

  const [filter, setFilter] = useState<SubFilter>("ALL");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: subscriptions = [], isLoading } = useQuery({
    queryKey: ["admin-subscriptions", filter, search],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filter !== "ALL") params.set("status", filter);
      if (search.trim()) params.set("search", search.trim());
      const qs = params.toString();
      return api<AdminSubscriptionDto[]>(`/admin/subscriptions${qs ? `?${qs}` : ""}`);
    },
    enabled,
  });

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ["admin-subscription", selectedId],
    queryFn: () => api<AdminSubscriptionDetailDto>(`/admin/subscriptions/${selectedId}`),
    enabled: enabled && selectedId !== null,
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "ACTIVE" | "PAUSED" | "CANCELED" }) =>
      api(`/admin/subscriptions/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-subscriptions"] });
      if (selectedId) qc.invalidateQueries({ queryKey: ["admin-subscription", selectedId] });
      qc.invalidateQueries({ queryKey: ["admin-dashboard"] });
    },
  });

  const filterOptions = [
    { value: "ALL" as const, label: t("filterAll") },
    { value: "ACTIVE" as const, label: t("filterActive") },
    { value: "PAUSED" as const, label: t("filterPaused") },
    { value: "EXPIRED" as const, label: t("filterExpired") },
  ];

  function statusLabelSafe(status: string): string {
    const labels: Record<string, string> = {
      ACTIVE: t("status.ACTIVE"),
      PAUSED: t("status.PAUSED"),
      EXPIRED: t("status.EXPIRED"),
      CANCELED: t("status.CANCELED"),
    };
    return labels[status] ?? status;
  }

  function openDetails(id: string) {
    setSelectedId(id);
  }

  function SubscriberRow({ sub }: { sub: AdminSubscriptionDto }) {
    const canPause = sub.status === "ACTIVE";
    const canResume = sub.status === "PAUSED";
    const canCancel = sub.status === "ACTIVE" || sub.status === "PAUSED";

    return (
      <div className="flex items-start gap-3 px-1 py-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-muted/40">
          <Crown className="h-4 w-4 text-amber-600" />
        </div>

        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="text-sm font-medium leading-snug">{sub.user.name}</p>
          <p className="break-all text-xs text-muted-foreground">{sub.user.email}</p>
          <p className="text-xs text-muted-foreground">{sub.plan.name}</p>
          <p className="text-xs text-muted-foreground">
            {t("expires", { date: formatDate(sub.expiresAt, locale) })}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <span
            className={cn(
              "inline-flex min-w-[4.75rem] items-center justify-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase leading-none",
              STATUS_STYLES[sub.status] ?? STATUS_STYLES.EXPIRED,
            )}
          >
            {statusLabelSafe(sub.status)}
          </span>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground"
                aria-label={t("actions")}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => openDetails(sub.id)}>
                <Eye className="mr-2 h-4 w-4" />
                {t("view")}
              </DropdownMenuItem>
              {canPause ? (
                <DropdownMenuItem
                  disabled={updateStatus.isPending}
                  onClick={() => updateStatus.mutate({ id: sub.id, status: "PAUSED" })}
                >
                  <Pause className="mr-2 h-4 w-4" />
                  {t("pause")}
                </DropdownMenuItem>
              ) : null}
              {canResume ? (
                <DropdownMenuItem
                  disabled={updateStatus.isPending}
                  onClick={() => updateStatus.mutate({ id: sub.id, status: "ACTIVE" })}
                >
                  <Play className="mr-2 h-4 w-4" />
                  {t("resume")}
                </DropdownMenuItem>
              ) : null}
              {canCancel ? (
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  disabled={updateStatus.isPending}
                  onClick={() => updateStatus.mutate({ id: sub.id, status: "CANCELED" })}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  {t("cancel")}
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="space-y-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Crown className="h-4 w-4 text-primary" />
            {t("title")}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{t("desc")}</p>
          <SegmentedButton options={filterOptions} value={filter} onChange={setFilter} />
          <FormInput
            placeholder={t("searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoComplete="off"
          />
        </CardHeader>
        <CardContent className="py-1">
          {isLoading ? (
            <div className="space-y-2 px-1 py-3">
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
            </div>
          ) : subscriptions.length === 0 ? (
            <EmptyState message={t("empty")} className="my-3 py-10" />
          ) : (
            subscriptions.map((sub, index) => (
              <div key={sub.id}>
                {index > 0 && <ListDivider />}
                <SubscriberRow sub={sub} />
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Sheet open={selectedId !== null} onOpenChange={(open) => !open && setSelectedId(null)}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-2xl">
          <SheetHeader className="text-left">
            <SheetTitle>{t("detailTitle")}</SheetTitle>
          </SheetHeader>

          {detailLoading || !detail ? (
            <div className="mt-6 flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="mt-5 space-y-4 pb-4">
              <div className="rounded-xl border bg-muted/20 p-4 text-sm">
                <p className="font-semibold">{detail.user.name}</p>
                <p className="text-muted-foreground">{detail.user.email}</p>
                <p className="mt-2">
                  {detail.plan.name} · {fmt(detail.plan.price, detail.plan.currency)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("started", { date: formatDate(detail.startsAt, locale) })} ·{" "}
                  {t("expires", { date: formatDate(detail.expiresAt, locale) })}
                </p>
                <span
                  className={cn(
                    "mt-2 inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase",
                    STATUS_STYLES[detail.status] ?? STATUS_STYLES.EXPIRED,
                  )}
                >
                  {statusLabelSafe(detail.status)}
                </span>
              </div>

              <div className="rounded-xl border bg-muted/20 p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("usageTitle")}
                </p>
                <div className="space-y-2.5">
                  <UsageMeter
                    label={t("usageTransactions")}
                    used={detail.usage.transactions}
                    limit={detail.limits.transactions}
                  />
                  <UsageMeter
                    label={t("usageAccounts")}
                    used={detail.usage.accounts}
                    limit={detail.limits.accounts}
                  />
                  <UsageMeter
                    label={t("usageCategories")}
                    used={detail.usage.categories}
                    limit={detail.limits.categories}
                  />
                </div>
              </div>

              {detail.recentPayments.length > 0 ? (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t("paymentsTitle")}
                  </p>
                  <div className="rounded-xl border py-1">
                    {detail.recentPayments.map((payment, index) => (
                      <div key={payment.id}>
                        {index > 0 && <ListDivider />}
                        <ListItem
                          title={fmt(payment.amount, payment.currency)}
                          subtitle={formatDate(payment.createdAt, locale)}
                          trailing={
                            <span className="text-xs text-muted-foreground">{payment.status}</span>
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                {detail.status === "ACTIVE" ? (
                  <Button
                    variant="outline"
                    className="h-11 flex-1"
                    disabled={updateStatus.isPending}
                    onClick={() => updateStatus.mutate({ id: detail.id, status: "PAUSED" })}
                  >
                    {t("pause")}
                  </Button>
                ) : null}
                {detail.status === "PAUSED" ? (
                  <Button
                    className="h-11 flex-1"
                    disabled={updateStatus.isPending}
                    onClick={() => updateStatus.mutate({ id: detail.id, status: "ACTIVE" })}
                  >
                    {t("resume")}
                  </Button>
                ) : null}
                {detail.status === "ACTIVE" || detail.status === "PAUSED" ? (
                  <Button
                    variant="destructive"
                    className="h-11 flex-1"
                    disabled={updateStatus.isPending}
                    onClick={() => updateStatus.mutate({ id: detail.id, status: "CANCELED" })}
                  >
                    {t("cancel")}
                  </Button>
                ) : null}
                <Button
                  variant="secondary"
                  className="h-11 shrink-0 px-6"
                  onClick={() => setSelectedId(null)}
                >
                  {tc("cancel")}
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
