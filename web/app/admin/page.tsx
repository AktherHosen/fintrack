"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  Check,
  ClipboardList,
  CreditCard,
  Users,
  X,
} from "lucide-react";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api-client";
import { formatMoney } from "@/lib/formatters";
import type { AdminDashboardDto, AdminUserDto, AdminPlanDto, PaymentDto } from "@fintrack/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AdminSettingsSection } from "@/components/admin/admin-settings-section";
import { AdminPlanPreview } from "@/components/admin/admin-plan-preview";
import { FormField, FormInput } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  EmptyState,
  ListDivider,
  ListItem,
  PageHeader,
  Skeleton,
  StatChip,
} from "@/components/ui/material";
import { cn } from "@/lib/utils";

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
  actor?: { name: string; email: string };
}

type Tab = "overview" | "users" | "payments" | "settings" | "audit";

function formatDateTime(date: string, locale: string): string {
  return new Date(date).toLocaleString(locale === "bn" ? "bn-BD" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function AdminTabBar({
  tabs,
  value,
  onChange,
}: {
  tabs: { id: Tab; label: string }[];
  value: Tab;
  onChange: (tab: Tab) => void;
}) {
  return (
    <div className="overflow-x-auto pb-0.5">
      <div className="inline-flex min-w-full gap-1 rounded-xl border border-border/60 bg-muted/50 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              "shrink-0 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-200 sm:flex-1",
              value === tab.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function AdminContent() {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const { user, loading } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const locale = user?.locale ?? "en";
  const currency = user?.currency ?? "BDT";
  const fmt = (amount: string, paymentCurrency?: string) =>
    formatMoney(amount, paymentCurrency ?? currency, locale);

  const [tab, setTab] = useState<Tab>("overview");
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [userSearch, setUserSearch] = useState("");

  useEffect(() => {
    if (!loading && (!user || user.role !== "SUPER_ADMIN")) router.replace("/");
  }, [user, loading, router]);

  useEffect(() => {
    if (!rejectId) setRejectNote(t("payments.rejectDefault"));
  }, [rejectId, t]);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: () => api<AdminDashboardDto>("/admin/dashboard"),
    enabled: user?.role === "SUPER_ADMIN",
  });

  const { data: adminPlans = [], isLoading: adminPlansLoading } = useQuery({
    queryKey: ["admin-plans"],
    queryFn: () => api<AdminPlanDto[]>("/admin/plans"),
    enabled: user?.role === "SUPER_ADMIN",
  });

  const { data: pendingPayments = [], isLoading: pendingLoading } = useQuery({
    queryKey: ["admin-payments", "PENDING"],
    queryFn: () => api<PaymentDto[]>("/admin/payments?status=PENDING"),
    enabled: user?.role === "SUPER_ADMIN" && tab === "payments",
  });

  const { data: allPayments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ["admin-payments", "all"],
    queryFn: () => api<PaymentDto[]>("/admin/payments"),
    enabled: user?.role === "SUPER_ADMIN" && tab === "payments",
  });

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["admin-users", userSearch],
    queryFn: () =>
      api<{ items: AdminUserDto[]; total: number }>(
        `/admin/users?search=${encodeURIComponent(userSearch)}`,
      ),
    enabled: user?.role === "SUPER_ADMIN" && tab === "users",
  });

  const { data: auditLogs = [], isLoading: auditLoading } = useQuery({
    queryKey: ["admin-audit"],
    queryFn: () => api<AuditLog[]>("/admin/audit-logs"),
    enabled: user?.role === "SUPER_ADMIN" && tab === "audit",
  });

  const approve = useMutation({
    mutationFn: (id: string) => api(`/admin/payments/${id}/approve`, { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-payments"] });
      qc.invalidateQueries({ queryKey: ["admin-dashboard"] });
      qc.invalidateQueries({ queryKey: ["ads-active"] });
    },
  });

  const reject = useMutation({
    mutationFn: ({ id, adminNote }: { id: string; adminNote: string }) =>
      api(`/admin/payments/${id}/reject`, {
        method: "POST",
        body: JSON.stringify({ adminNote }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-payments"] });
      setRejectId(null);
    },
  });

  const toggleUserStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "ACTIVE" | "SUSPENDED" }) =>
      api(`/admin/users/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  const tabs = useMemo(
    () =>
      [
        { id: "overview" as const, label: t("tabs.overview") },
        { id: "users" as const, label: t("tabs.users") },
        { id: "payments" as const, label: t("tabs.payments") },
        { id: "settings" as const, label: t("tabs.settings") },
        { id: "audit" as const, label: t("tabs.audit") },
      ] satisfies { id: Tab; label: string }[],
    [t],
  );

  function paymentStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      PENDING: t("paymentStatus.PENDING"),
      APPROVED: t("paymentStatus.APPROVED"),
      REJECTED: t("paymentStatus.REJECTED"),
    };
    return labels[status] ?? status;
  }

  function userStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      ACTIVE: t("userStatus.ACTIVE"),
      SUSPENDED: t("userStatus.SUSPENDED"),
    };
    return labels[status] ?? status;
  }

  if (loading || !user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-page">
        <Skeleton className="h-8 w-8 rounded-md" />
        <p className="text-sm text-muted-foreground">{tc("loading")}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page">
      <div className="mx-auto max-w-lg space-y-6 px-4 pb-10 pt-8 lg:max-w-5xl lg:px-8 lg:pt-10">
        <div className="flex items-start gap-2">
          <Link href="/more" className="rounded-md p-2 hover:bg-accent" aria-label={tc("back")}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <PageHeader title={t("title")} subtitle={t("subtitle")} />
        </div>

        <AdminTabBar tabs={tabs} value={tab} onChange={setTab} />

        {tab === "overview" && (
          <>
            <AdminPlanPreview plans={adminPlans} plansLoading={adminPlansLoading} />
            {statsLoading ? (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-[4.5rem] rounded-2xl" />
              ))}
            </div>
          ) : stats ? (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
              <StatChip label={t("stats.users")} value={String(stats.totalUsers)} tone="neutral" />
              <StatChip label={t("stats.active")} value={String(stats.activeUsers)} tone="income" />
              <StatChip
                label={t("stats.suspended")}
                value={String(stats.suspendedUsers)}
                tone="expense"
              />
              <StatChip
                label={t("stats.pending")}
                value={String(stats.pendingPayments)}
                tone="expense"
              />
              <StatChip
                label={t("stats.subscriptions")}
                value={String(stats.activeSubscriptions)}
                tone="neutral"
              />
              <StatChip
                label={t("stats.revenue")}
                value={fmt(stats.monthlyRevenue)}
                tone="income"
              />
            </div>
          ) : null}
          </>
        )}

        {tab === "users" && (
          <Card>
            <CardHeader className="space-y-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4 text-primary" />
                {t("users.title")}
              </CardTitle>
              <FormInput
                placeholder={t("users.searchPlaceholder")}
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                autoComplete="off"
              />
            </CardHeader>
            <CardContent className="py-1">
              {usersLoading ? (
                <div className="space-y-2 px-1 py-3">
                  <Skeleton className="h-14 w-full rounded-xl" />
                  <Skeleton className="h-14 w-full rounded-xl" />
                </div>
              ) : (usersData?.items ?? []).length === 0 ? (
                <EmptyState message={t("users.empty")} className="my-3 py-10" />
              ) : (
                usersData?.items.map((u, index) => (
                  <div key={u.id}>
                    {index > 0 && <ListDivider />}
                    <ListItem
                      title={u.name}
                      subtitle={`${u.email} · ${t("users.meta", {
                        plan: u.plan ?? "—",
                        status: userStatusLabel(u.status),
                      })}`}
                      trailing={
                        <Button
                          size="sm"
                          variant={u.status === "ACTIVE" ? "destructive" : "default"}
                          className="h-9"
                          disabled={toggleUserStatus.isPending}
                          onClick={() =>
                            toggleUserStatus.mutate({
                              id: u.id,
                              status: u.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE",
                            })
                          }
                        >
                          {u.status === "ACTIVE" ? t("users.suspend") : t("users.activate")}
                        </Button>
                      }
                    />
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}

        {tab === "payments" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="h-4 w-4 text-primary" />
                {t("payments.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t("payments.pending")}
                </p>
                {pendingLoading ? (
                  <Skeleton className="h-20 w-full rounded-xl" />
                ) : pendingPayments.length === 0 ? (
                  <p className="rounded-xl border border-dashed bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                    {t("payments.emptyPending")}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {pendingPayments.map((p) => (
                      <div
                        key={p.id}
                        className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-card sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0 text-sm">
                          <p className="font-medium tabular-nums">
                            {fmt(p.amount, p.currency)} · {p.transactionId}
                          </p>
                          <p className="text-muted-foreground">{p.senderNumber}</p>
                          {p.adCampaign ? (
                            <p className="mt-1 text-xs text-primary">
                              {t("payments.adCampaign", {
                                title: p.adCampaign.title,
                                plan: p.adCampaign.adPlan.name,
                              })}
                            </p>
                          ) : p.plan ? (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {t("payments.plan", { name: p.plan.name })}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <Button
                            size="sm"
                            className="h-9 gap-1"
                            disabled={approve.isPending}
                            onClick={() => approve.mutate(p.id)}
                          >
                            <Check className="h-3.5 w-3.5" />
                            {tc("approve")}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-9 gap-1"
                            onClick={() => setRejectId(p.id)}
                          >
                            <X className="h-3.5 w-3.5" />
                            {tc("reject")}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t("payments.recent")}
                </p>
                {paymentsLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-14 w-full rounded-xl" />
                    <Skeleton className="h-14 w-full rounded-xl" />
                  </div>
                ) : allPayments.length === 0 ? (
                  <EmptyState message={t("payments.emptyRecent")} className="py-10" />
                ) : (
                  <div className="py-1">
                    {allPayments.slice(0, 20).map((p, index) => (
                      <div key={p.id}>
                        {index > 0 && <ListDivider />}
                        <ListItem
                          title={`${fmt(p.amount, p.currency)} · ${paymentStatusLabel(p.status)}`}
                          subtitle={p.transactionId ?? "—"}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {tab === "settings" && (
          <AdminSettingsSection
            enabled={user?.role === "SUPER_ADMIN"}
            locale={locale}
            currency={currency}
          />
        )}

        {tab === "audit" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ClipboardList className="h-4 w-4 text-primary" />
                {t("audit.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="py-1">
              {auditLoading ? (
                <div className="space-y-2 px-1 py-3">
                  <Skeleton className="h-12 w-full rounded-xl" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                </div>
              ) : auditLogs.length === 0 ? (
                <EmptyState message={t("audit.empty")} className="my-3 py-10" />
              ) : (
                auditLogs.map((log, index) => (
                  <div key={log.id}>
                    {index > 0 && <ListDivider />}
                    <ListItem
                      title={log.action}
                      subtitle={`${log.entityType} · ${log.actor?.name ?? t("audit.systemActor")} · ${formatDateTime(log.createdAt, locale)}`}
                    />
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <Sheet open={rejectId !== null} onOpenChange={(open) => !open && setRejectId(null)}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader className="text-left">
            <SheetTitle>{t("payments.rejectTitle")}</SheetTitle>
          </SheetHeader>
          <div className="mt-5 space-y-4">
            <FormField label={t("payments.rejectNote")} htmlFor="reject-note">
              <FormInput
                id="reject-note"
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
              />
            </FormField>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                className="h-11 flex-1"
                disabled={reject.isPending || !rejectNote.trim()}
                onClick={() =>
                  rejectId && reject.mutate({ id: rejectId, adminNote: rejectNote.trim() })
                }
              >
                {t("payments.confirmReject")}
              </Button>
              <Button
                variant="secondary"
                className="h-11 shrink-0 px-6"
                onClick={() => setRejectId(null)}
              >
                {tc("cancel")}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default function AdminPage() {
  return (
    <AuthProvider>
      <AdminContent />
    </AuthProvider>
  );
}
