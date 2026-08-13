"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api-client";
import { formatBDT } from "@/lib/formatters";
import type { AdminDashboardDto, AdminUserDto, PaymentDto } from "@fintrack/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader, StatChip, ListDivider, ListItem } from "@/components/ui/material";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
  actor?: { name: string; email: string };
}

type Tab = "overview" | "users" | "payments" | "settings" | "audit";

function AdminContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("overview");
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("Payment could not be verified");
  const [userSearch, setUserSearch] = useState("");
  const [bkashNumber, setBkashNumber] = useState("");
  const [settingsSaved, setSettingsSaved] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== "SUPER_ADMIN")) router.replace("/");
  }, [user, loading, router]);

  const { data: stats } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: () => api<AdminDashboardDto>("/admin/dashboard"),
    enabled: user?.role === "SUPER_ADMIN",
  });

  const { data: paymentSettings } = useQuery({
    queryKey: ["admin-payment-settings"],
    queryFn: () => api<{ bkashNumber: string | null }>("/admin/settings/payment"),
    enabled: user?.role === "SUPER_ADMIN" && tab === "settings",
  });

  useEffect(() => {
    if (paymentSettings?.bkashNumber) setBkashNumber(paymentSettings.bkashNumber);
  }, [paymentSettings?.bkashNumber]);

  const savePaymentSettings = useMutation({
    mutationFn: (body: { bkashNumber: string }) =>
      api("/admin/settings/payment", { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-payment-settings"] });
      qc.invalidateQueries({ queryKey: ["payment-config"] });
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2500);
    },
  });

  const { data: pendingPayments = [] } = useQuery({
    queryKey: ["admin-payments", "PENDING"],
    queryFn: () => api<PaymentDto[]>("/admin/payments?status=PENDING"),
    enabled: user?.role === "SUPER_ADMIN" && tab === "payments",
  });

  const { data: allPayments = [] } = useQuery({
    queryKey: ["admin-payments", "all"],
    queryFn: () => api<PaymentDto[]>("/admin/payments"),
    enabled: user?.role === "SUPER_ADMIN" && tab === "payments",
  });

  const { data: usersData } = useQuery({
    queryKey: ["admin-users", userSearch],
    queryFn: () =>
      api<{ items: AdminUserDto[]; total: number }>(
        `/admin/users?search=${encodeURIComponent(userSearch)}`,
      ),
    enabled: user?.role === "SUPER_ADMIN" && tab === "users",
  });

  const { data: auditLogs = [] } = useQuery({
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

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Skeleton className="h-8 w-8 rounded-md" />
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "users", label: "Users" },
    { id: "payments", label: "Payments" },
    { id: "settings", label: "Settings" },
    { id: "audit", label: "Audit" },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-4">
          <Link href="/more" className="rounded-md p-2 hover:bg-accent">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <span className="text-sm font-semibold">Admin</span>
        </div>
      </header>

      <div className="mx-auto max-w-3xl space-y-6 p-4 pb-10">
        <PageHeader title="Dashboard" subtitle="Platform overview" />

        <div className="flex gap-2 overflow-x-auto">
          {tabs.map((t) => (
            <Button
              key={t.id}
              size="sm"
              variant={tab === t.id ? "default" : "secondary"}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </Button>
          ))}
        </div>

        {tab === "overview" && stats && (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <StatChip label="Users" value={String(stats.totalUsers)} tone="neutral" />
            <StatChip label="Active" value={String(stats.activeUsers)} tone="income" />
            <StatChip label="Suspended" value={String(stats.suspendedUsers)} tone="expense" />
            <StatChip label="Pending" value={String(stats.pendingPayments)} tone="expense" />
            <StatChip label="Subscriptions" value={String(stats.activeSubscriptions)} tone="neutral" />
            <StatChip label="Revenue" value={formatBDT(stats.monthlyRevenue)} tone="income" />
          </div>
        )}

        {tab === "users" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Users</CardTitle>
              <Input
                placeholder="Search by name or email"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
            </CardHeader>
            <CardContent className="space-y-3">
              {(usersData?.items ?? []).length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">No users found</p>
              ) : (
                usersData?.items.map((u) => (
                  <div
                    key={u.id}
                    className="flex flex-col gap-2 rounded-lg border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="text-sm">
                      <p className="font-medium">{u.name}</p>
                      <p className="text-muted-foreground">{u.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {u.plan} · {u.status}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant={u.status === "ACTIVE" ? "destructive" : "default"}
                      onClick={() =>
                        toggleUserStatus.mutate({
                          id: u.id,
                          status: u.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE",
                        })
                      }
                    >
                      {u.status === "ACTIVE" ? "Suspend" : "Activate"}
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}

        {tab === "payments" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingPayments.length > 0 && (
                <>
                  <p className="text-xs font-medium uppercase text-muted-foreground">Pending</p>
                  {pendingPayments.map((p) => (
                    <div
                      key={p.id}
                      className="flex flex-col gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="text-sm">
                        <p className="font-medium">
                          {formatBDT(p.amount)} · {p.transactionId}
                        </p>
                        <p className="text-muted-foreground">{p.senderNumber}</p>
                        {p.adCampaign ? (
                          <p className="text-xs text-primary">
                            Ad: {p.adCampaign.title} · {p.adCampaign.adPlan.name}
                          </p>
                        ) : p.plan ? (
                          <p className="text-xs text-muted-foreground">Plan: {p.plan.name}</p>
                        ) : null}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => approve.mutate(p.id)}>
                          Approve
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setRejectId(p.id)}>
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </>
              )}
              <p className="pt-2 text-xs font-medium uppercase text-muted-foreground">Recent</p>
              {allPayments.slice(0, 20).map((p) => (
                <div key={p.id} className="rounded-lg border bg-card p-3 text-sm">
                  <p className="font-medium">
                    {formatBDT(p.amount)} · {p.status}
                  </p>
                  <p className="text-muted-foreground">{p.transactionId ?? "—"}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {tab === "settings" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payment settings</CardTitle>
              <p className="text-sm text-muted-foreground">
                This bKash number is shown in the Upgrade to Pro guide and ad payment flow.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="bkash-number">
                  bKash Send Money number
                </label>
                <Input
                  id="bkash-number"
                  placeholder="01XXXXXXXXX"
                  value={bkashNumber}
                  onChange={(e) => setBkashNumber(e.target.value)}
                  inputMode="numeric"
                />
                <p className="text-xs text-muted-foreground">
                  Users send plan payment to this number, then submit the transaction ID in the app.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => savePaymentSettings.mutate({ bkashNumber })}
                  disabled={savePaymentSettings.isPending || bkashNumber.length < 11}
                >
                  {savePaymentSettings.isPending ? "Saving…" : "Save payment number"}
                </Button>
                {settingsSaved ? (
                  <span className="text-xs font-medium text-income">Saved</span>
                ) : null}
              </div>
              {paymentSettings?.bkashNumber ? (
                <p className="rounded-lg border bg-muted/30 px-3 py-2 text-sm">
                  Live number:{" "}
                  <span className="font-mono font-semibold">{paymentSettings.bkashNumber}</span>
                </p>
              ) : (
                <p className="rounded-lg border border-dashed px-3 py-2 text-sm text-muted-foreground">
                  No payment number configured yet.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {tab === "audit" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Audit log</CardTitle>
            </CardHeader>
            <CardContent className="py-1">
              {auditLogs.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">No audit entries</p>
              ) : (
                auditLogs.map((log, i) => (
                  <div key={log.id}>
                    {i > 0 && <ListDivider />}
                    <ListItem
                      title={log.action}
                      subtitle={`${log.entityType} · ${log.actor?.name ?? "System"} · ${new Date(log.createdAt).toLocaleString()}`}
                    />
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}

        {rejectId && (
          <Card>
            <CardContent className="space-y-3 py-4">
              <p className="text-sm font-medium">Reject payment</p>
              <Input value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => reject.mutate({ id: rejectId, adminNote: rejectNote })}
                >
                  Confirm reject
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setRejectId(null)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
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
