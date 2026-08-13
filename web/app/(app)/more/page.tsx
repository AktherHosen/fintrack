"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  manualPaymentSchema,
  updateProfileSchema,
  changePasswordSchema,
  type ManualPaymentInput,
  type UpdateProfileInput,
  type ChangePasswordInput,
} from "@fintrack/shared";
import { api } from "@/lib/api-client";
import { formatBDT, formatMoney } from "@/lib/formatters";
import type { PlanDto, SubscriptionDto, PaymentDto } from "@fintrack/shared";
import { UsageMeter, planPriceLabel, isProPlanSlug } from "@/components/subscription/usage-meter";
import { useAuth } from "@/lib/auth-context";
import { useLocale } from "@/lib/locale-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField, Select } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ListDivider, ListItem, PageHeader } from "@/components/ui/material";
import { ThemeSelector } from "@/components/theme/theme-selector";
import {
  Crown,
  Shield,
  User,
  Wallet,
  Target,
  Repeat,
  Tags,
  ArrowLeftRight,
  Landmark,
  ChevronRight,
  Mail,
  Megaphone,
} from "lucide-react";

const QUICK_LINKS = [
  { href: "/advertise", label: "Advertise", icon: Megaphone },
  { href: "/accounts", label: "Accounts", icon: Wallet },
  { href: "/budgets", label: "Budgets", icon: Target },
  { href: "/recurring", label: "Recurring", icon: Repeat },
  { href: "/categories", label: "Categories", icon: Tags },
  { href: "/loans", label: "Loans", icon: Landmark },
  { href: "/transfers", label: "Transfers", icon: ArrowLeftRight },
];

export default function MorePage() {
  const { user, logout, refresh } = useAuth();
  const { setLocale } = useLocale();
  const [payOpen, setPayOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanDto | null>(null);
  const [verifyMsg, setVerifyMsg] = useState("");
  const qc = useQueryClient();

  const { data: subscription } = useQuery({
    queryKey: ["subscription"],
    queryFn: () => api<SubscriptionDto | null>("/subscription"),
  });

  const { data: plans = [] } = useQuery({
    queryKey: ["plans"],
    queryFn: () => api<PlanDto[]>("/plans"),
  });

  const { data: payments = [] } = useQuery({
    queryKey: ["payments"],
    queryFn: () => api<PaymentDto[]>("/payments"),
  });

  const { data: paymentConfig } = useQuery({
    queryKey: ["payment-config"],
    queryFn: () => api<{ bkashNumber: string | null }>("/payments/config"),
  });

  const payForm = useForm<ManualPaymentInput>({
    resolver: zodResolver(manualPaymentSchema),
    defaultValues: { planSlug: "", transactionId: "", senderNumber: "" },
  });

  const profileForm = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    values: {
      name: user?.name ?? "",
      currency: user?.currency ?? "BDT",
      timezone: user?.timezone ?? "Asia/Dhaka",
      locale: (user?.locale === "bn" ? "bn" : "en") as "en" | "bn",
    },
  });

  const passwordForm = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "" },
  });

  const submitPayment = useMutation({
    mutationFn: (data: ManualPaymentInput) =>
      api("/payments", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payments"] });
      setPayOpen(false);
      payForm.reset();
    },
  });

  const updateProfile = useMutation({
    mutationFn: (data: UpdateProfileInput) =>
      api("/auth/me", { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: async (_data, variables) => {
      if (variables.locale) setLocale(variables.locale);
      await refresh();
      setProfileOpen(false);
    },
  });

  const changePassword = useMutation({
    mutationFn: (data: ChangePasswordInput) =>
      api("/auth/change-password", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      setPasswordOpen(false);
      passwordForm.reset();
    },
  });

  const resendVerification = useMutation({
    mutationFn: () => api<{ ok: boolean; devVerifyUrl?: string }>("/auth/resend-verification", { method: "POST" }),
    onSuccess: (data) => {
      setVerifyMsg(data.devVerifyUrl ? `Dev link: ${data.devVerifyUrl}` : "Verification email sent");
    },
  });

  function openPayment(plan: PlanDto) {
    setSelectedPlan(plan);
    payForm.setValue("planSlug", plan.slug);
    setPayOpen(true);
  }

  const currentSlug = subscription?.plan.slug;
  const onPaidPro = currentSlug ? isProPlanSlug(currentSlug) : false;
  const fmt = (v: string) => formatMoney(v, user?.currency ?? "BDT", user?.locale ?? "en");

  const upgradePlans = plans.filter((p) => {
    if (p.slug === "free") return false;
    if (p.slug === currentSlug) return false;
    return true;
  });

  const billingLabel =
    subscription?.plan.billingInterval === "YEARLY" ? "Yearly" : "Monthly";

  return (
    <div className="space-y-6">
      <PageHeader title="More" subtitle="Profile & subscription" />

      {user && !user.emailVerifiedAt && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
          <CardContent className="flex items-start gap-3 py-4">
            <Mail className="mt-0.5 h-4 w-4 text-amber-600" />
            <div className="flex-1 space-y-2">
              <p className="text-sm font-medium">Verify your email</p>
              <p className="text-xs text-muted-foreground">
                Check your inbox or resend the verification link.
              </p>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => resendVerification.mutate()}
                disabled={resendVerification.isPending}
              >
                Resend email
              </Button>
              {verifyMsg && <p className="text-xs text-muted-foreground break-all">{verifyMsg}</p>}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="py-1">
          <ListItem
            title={user?.name ?? ""}
            subtitle={user?.email}
            icon={User}
            iconClassName="border-primary/20 bg-primary/10 text-primary"
            trailing={
              <Button size="sm" variant="ghost" onClick={() => setProfileOpen(true)}>
                Edit
              </Button>
            }
          />
          <ListDivider />
          <button type="button" className="w-full text-left" onClick={() => setPasswordOpen(true)}>
            <ListItem
              title="Change password"
              subtitle="Update your login credentials"
              trailing={<ChevronRight className="h-4 w-4 text-muted-foreground" />}
            />
          </button>
          <ListDivider />
          <div className="py-2">
            <ThemeSelector />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Quick links</CardTitle>
        </CardHeader>
        <CardContent className="py-1">
          {QUICK_LINKS.map((link, i) => (
            <div key={link.href}>
              {i > 0 && <ListDivider />}
              <Link href={link.href}>
                <ListItem
                  title={link.label}
                  icon={link.icon}
                  iconClassName="border-primary/20 bg-primary/10 text-primary"
                  trailing={<ChevronRight className="h-4 w-4 text-muted-foreground" />}
                />
              </Link>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Subscription</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {subscription ? (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-4">
              <div>
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-primary" />
                  <p className="font-semibold">{subscription.plan.name}</p>
                  {!onPaidPro && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase">
                      {billingLabel}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {onPaidPro
                    ? `Renews ${new Date(subscription.expiresAt).toLocaleDateString()}`
                    : `Expires ${new Date(subscription.expiresAt).toLocaleDateString()}`}
                </p>
              </div>

              {subscription.usage && subscription.limits && (
                <div className="space-y-3 border-t border-primary/10 pt-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Plan usage
                  </p>
                  <UsageMeter
                    label="Transactions (this month)"
                    used={subscription.usage.transactions}
                    limit={subscription.limits.transactions}
                  />
                  <UsageMeter
                    label="Accounts"
                    used={subscription.usage.accounts}
                    limit={subscription.limits.accounts}
                  />
                  <UsageMeter
                    label="Custom categories"
                    used={subscription.usage.categories}
                    limit={subscription.limits.categories}
                  />
                  <UsageMeter
                    label="Budgets"
                    used={subscription.usage.budgets}
                    limit={subscription.limits.budgets}
                  />
                  <UsageMeter
                    label="Active loans"
                    used={subscription.usage.loans}
                    limit={subscription.limits.loans}
                  />
                </div>
              )}
            </div>
          ) : (
            <p className="rounded-lg border border-dashed bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
              Free plan — upgrade for recurring, CSV/PDF export & multi-currency
            </p>
          )}

          {upgradePlans.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {onPaidPro ? "Change billing" : "Upgrade"}
              </p>
              {upgradePlans.map((plan) => (
                <div
                  key={plan.id}
                  className="flex items-center justify-between rounded-lg border bg-card p-4"
                >
                  <div>
                    <p className="font-medium">{plan.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {planPriceLabel(plan.price, plan.billingInterval, fmt)}
                    </p>
                  </div>
                  <Button size="sm" onClick={() => openPayment(plan)}>
                    {onPaidPro ? "Switch" : "Upgrade"}
                  </Button>
                </div>
              ))}
            </div>
          )}

          {onPaidPro && upgradePlans.length === 0 && (
            <p className="text-sm text-muted-foreground">
              You&apos;re on the best plan. Manage renewal from payment history.
            </p>
          )}
        </CardContent>
      </Card>

      {payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment history</CardTitle>
          </CardHeader>
          <CardContent className="py-1">
            {payments.slice(0, 5).map((p, i) => (
              <div key={p.id}>
                {i > 0 && <ListDivider />}
                <ListItem
                  title={p.plan?.name ?? "Plan"}
                  subtitle={p.status}
                  trailing={<span className="text-sm font-medium">{formatBDT(p.amount)}</span>}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {user?.role === "SUPER_ADMIN" && (
        <Link href="/admin">
          <Button variant="secondary" className="w-full">
            <Shield className="h-4 w-4" />
            Admin dashboard
          </Button>
        </Link>
      )}

      <Button variant="destructive" className="w-full" onClick={() => logout()}>
        Logout
      </Button>

      <Sheet open={profileOpen} onOpenChange={setProfileOpen}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Edit profile</SheetTitle>
          </SheetHeader>
          <form
            className="mt-5 space-y-4"
            onSubmit={profileForm.handleSubmit((d) => updateProfile.mutate(d))}
          >
            <FormField label="Name">
              <Input {...profileForm.register("name")} />
            </FormField>
            <FormField label="Currency">
              <Input {...profileForm.register("currency")} maxLength={3} />
            </FormField>
            <FormField label="Timezone">
              <Input {...profileForm.register("timezone")} />
            </FormField>
            <FormField label="Language">
              <Select {...profileForm.register("locale")}>
                <option value="en">English</option>
                <option value="bn">বাংলা</option>
              </Select>
            </FormField>
            <Button type="submit" size="lg" className="w-full" disabled={updateProfile.isPending}>
              Save
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      <Sheet open={passwordOpen} onOpenChange={setPasswordOpen}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Change password</SheetTitle>
          </SheetHeader>
          <form
            className="mt-5 space-y-4"
            onSubmit={passwordForm.handleSubmit((d) => changePassword.mutate(d))}
          >
            <FormField label="Current password">
              <Input type="password" {...passwordForm.register("currentPassword")} />
            </FormField>
            <FormField label="New password">
              <Input type="password" {...passwordForm.register("newPassword")} />
            </FormField>
            <Button type="submit" size="lg" className="w-full" disabled={changePassword.isPending}>
              Update password
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      <Sheet open={payOpen} onOpenChange={setPayOpen}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>
              Pay with bKash — {selectedPlan?.name}
              {selectedPlan && (
                <span className="ml-1 text-sm font-normal text-muted-foreground">
                  ({planPriceLabel(selectedPlan.price, selectedPlan.billingInterval, fmt)})
                </span>
              )}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm">
              {paymentConfig?.bkashNumber ? (
                <p>
                  Send <strong>{selectedPlan ? fmt(selectedPlan.price) : ""}</strong> to{" "}
                  <strong>{paymentConfig.bkashNumber}</strong> via bKash Send Money, then enter your
                  transaction ID below.
                </p>
              ) : (
                <p className="text-muted-foreground">
                  Send {selectedPlan ? fmt(selectedPlan.price) : ""} via bKash Send Money, then
                  enter your transaction ID below. Payment verification is manual.
                </p>
              )}
            </div>
            <form onSubmit={payForm.handleSubmit((d) => submitPayment.mutate(d))} className="space-y-4">
              <FormField label="Transaction ID">
                <Input {...payForm.register("transactionId")} />
              </FormField>
              <FormField label="Sender number">
                <Input placeholder="01XXXXXXXXX" {...payForm.register("senderNumber")} />
              </FormField>
              <Button type="submit" size="lg" className="w-full" disabled={submitPayment.isPending}>
                Submit payment
              </Button>
            </form>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
