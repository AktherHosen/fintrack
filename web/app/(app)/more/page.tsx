"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  updateProfileSchema,
  changePasswordSchema,
  type UpdateProfileInput,
  type ChangePasswordInput,
} from "@fintrack/shared";
import { api } from "@/lib/api-client";
import { formatMoney } from "@/lib/formatters";
import type { SubscriptionDto, PaymentDto } from "@fintrack/shared";
import { UsageMeter, isProPlanSlug } from "@/components/subscription/usage-meter";
import { useAuth } from "@/lib/auth-context";
import { usePremiumModal } from "@/lib/premium-modal-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormFieldInput } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ListDivider, ListItem } from "@/components/ui/material";
import { ThemeSelector } from "@/components/theme/theme-selector";
import { LanguageSelector } from "@/components/locale/language-selector";
import {
  Crown,
  Shield,
  Wallet,
  Target,
  Repeat,
  Tags,
  ArrowLeftRight,
  Landmark,
  ChevronRight,
  Mail,
  Megaphone,
  KeyRound,
  LogOut,
  type LucideIcon,
} from "lucide-react";

const QUICK_LINKS: { href: string; labelKey: string; icon: LucideIcon }[] = [
  { href: "/accounts", labelKey: "accounts", icon: Wallet },
  { href: "/budgets", labelKey: "budgets", icon: Target },
  { href: "/categories", labelKey: "categories", icon: Tags },
  { href: "/loans", labelKey: "loans", icon: Landmark },
  { href: "/transfers", labelKey: "transfers", icon: ArrowLeftRight },
  { href: "/recurring", labelKey: "recurring", icon: Repeat },
  { href: "/advertise", labelKey: "advertise", icon: Megaphone },
];

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function SettingsRow({
  title,
  subtitle,
  onClick,
  icon: Icon,
}: {
  title: string;
  subtitle?: string;
  onClick?: () => void;
  icon?: LucideIcon;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40"
    >
      {Icon ? (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground">
          <Icon className="h-4 w-4" />
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{title}</span>
        {subtitle ? <span className="block text-xs text-muted-foreground">{subtitle}</span> : null}
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60" />
    </button>
  );
}

export default function MorePage() {
  const t = useTranslations("more");
  const tn = useTranslations("nav");
  const tc = useTranslations("common");
  const { user, logout, refresh } = useAuth();
  const { openPremium } = usePremiumModal();
  const [profileOpen, setProfileOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [verifyMsg, setVerifyMsg] = useState("");

  const { data: subscription } = useQuery({
    queryKey: ["subscription"],
    queryFn: () => api<SubscriptionDto | null>("/subscription"),
  });

  const { data: payments = [] } = useQuery({
    queryKey: ["payments"],
    queryFn: () => api<PaymentDto[]>("/payments"),
  });

  const profileForm = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    mode: "onTouched",
    values: {
      name: user?.name ?? "",
      currency: user?.currency ?? "BDT",
      timezone: user?.timezone ?? "Asia/Dhaka",
    },
  });

  const passwordForm = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    mode: "onTouched",
    defaultValues: { currentPassword: "", newPassword: "" },
  });

  const updateProfile = useMutation({
    mutationFn: (data: UpdateProfileInput) =>
      api("/auth/me", { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: async () => {
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

  const onPaidPro = subscription?.plan.slug ? isProPlanSlug(subscription.plan.slug) : false;
  const fmt = (v: string) => formatMoney(v, user?.currency ?? "BDT", user?.locale ?? "en");

  return (
    <div className="space-y-5 pb-4">
      {user && !user.emailVerifiedAt && (
        <Card className="border-amber-200/80 bg-amber-50/80 dark:border-amber-900/50 dark:bg-amber-950/20">
          <CardContent className="flex items-start gap-3 p-4">
            <Mail className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div className="min-w-0 flex-1 space-y-2">
              <p className="text-sm font-medium">{t("verifyEmail")}</p>
              <p className="text-xs text-muted-foreground">{t("verifyEmailDesc")}</p>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => resendVerification.mutate()}
                disabled={resendVerification.isPending}
              >
                {t("resendEmail")}
              </Button>
              {verifyMsg ? <p className="break-all text-xs text-muted-foreground">{verifyMsg}</p> : null}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="flex items-center gap-4 p-5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-lg font-bold text-primary">
            {initials(user?.name ?? "?")}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{user?.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
            {subscription ? (
              <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                <Crown className="h-3 w-3" />
                {subscription.plan.name}
              </span>
            ) : null}
          </div>
          <Button size="sm" variant="secondary" onClick={() => setProfileOpen(true)}>
            {tc("edit")}
          </Button>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <SettingsRow
            title={t("changePassword")}
            subtitle={t("changePasswordDesc")}
            icon={KeyRound}
            onClick={() => setPasswordOpen(true)}
          />
          <ListDivider />
          <div className="space-y-2 px-4 py-3">
            <p className="text-xs font-medium text-muted-foreground">{t("appearance")}</p>
            <ThemeSelector compact />
          </div>
          <ListDivider />
          <div className="space-y-2 px-4 py-3">
            <p className="text-xs font-medium text-muted-foreground">{t("language")}</p>
            <LanguageSelector compact />
          </div>
        </CardContent>
      </Card>

      <section>
        <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t("quickLinks")}
        </p>
        <div className="grid grid-cols-4 gap-2">
          {QUICK_LINKS.map(({ href, labelKey, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-1.5 rounded-xl border bg-card p-3 shadow-card transition-colors hover:bg-muted/30"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
              </span>
              <span className="text-center text-[10px] font-medium leading-tight">
                {tn(labelKey as "accounts")}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-semibold">{t("subscription")}</CardTitle>
          <Button size="sm" variant="outline" onClick={openPremium}>
            {onPaidPro ? t("managePlan") : tc("upgrade")}
          </Button>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {subscription ? (
            <>
              <p className="text-xs text-muted-foreground">
                {onPaidPro ? t("renewsOn") : t("expiresOn")}{" "}
                <span className="font-medium text-foreground">
                  {new Date(subscription.expiresAt).toLocaleDateString(user?.locale === "bn" ? "bn-BD" : "en-US")}
                </span>
              </p>
              {subscription.usage && subscription.limits ? (
                <div className="space-y-2.5 rounded-xl border bg-muted/20 p-3">
                  <UsageMeter
                    label={t("usageTransactions")}
                    used={subscription.usage.transactions}
                    limit={subscription.limits.transactions}
                  />
                  <UsageMeter
                    label={t("usageAccounts")}
                    used={subscription.usage.accounts}
                    limit={subscription.limits.accounts}
                  />
                  <UsageMeter
                    label={t("usageCategories")}
                    used={subscription.usage.categories}
                    limit={subscription.limits.categories}
                  />
                </div>
              ) : null}
            </>
          ) : (
            <p className="rounded-xl border border-dashed bg-muted/20 px-3 py-4 text-center text-xs text-muted-foreground">
              {t("freePlanDesc")}
            </p>
          )}
        </CardContent>
      </Card>

      {payments.length > 0 ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">{t("paymentHistory")}</CardTitle>
          </CardHeader>
          <CardContent className="py-0">
            {payments.slice(0, 4).map((p, i) => (
              <div key={p.id}>
                {i > 0 && <ListDivider />}
                <ListItem
                  title={p.plan?.name ?? "Plan"}
                  subtitle={p.status}
                  trailing={
                    <span className="text-sm font-semibold tabular-nums">{fmt(p.amount)}</span>
                  }
                />
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {user?.role === "SUPER_ADMIN" ? (
        <Link href="/admin" className="block pt-4">
          <Button variant="secondary" className="h-11 w-full">
            <Shield className="h-4 w-4" />
            {t("adminDashboard")}
          </Button>
        </Link>
      ) : null}

      <Button variant="outline" className="w-full text-destructive hover:text-destructive" onClick={() => logout()}>
        <LogOut className="h-4 w-4" />
        {tc("logout")}
      </Button>

      <Sheet open={profileOpen} onOpenChange={setProfileOpen}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>{t("editProfile")}</SheetTitle>
          </SheetHeader>
          <form
            className="mt-5 space-y-4"
            onSubmit={profileForm.handleSubmit((d) => updateProfile.mutate(d))}
          >
            <FormFieldInput form={profileForm} name="name" label={t("name")} />
            <FormFieldInput form={profileForm} name="currency" label={t("currency")} maxLength={3} />
            <FormFieldInput form={profileForm} name="timezone" label={t("timezone")} />
            <Button type="submit" size="lg" className="w-full" disabled={updateProfile.isPending}>
              {tc("save")}
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      <Sheet open={passwordOpen} onOpenChange={setPasswordOpen}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>{t("changePassword")}</SheetTitle>
          </SheetHeader>
          <form
            className="mt-5 space-y-4"
            onSubmit={passwordForm.handleSubmit((d) => changePassword.mutate(d))}
          >
            <FormFieldInput
              form={passwordForm}
              name="currentPassword"
              label={t("currentPassword")}
              type="password"
            />
            <FormFieldInput
              form={passwordForm}
              name="newPassword"
              label={t("newPassword")}
              type="password"
            />
            <Button type="submit" size="lg" className="w-full" disabled={changePassword.isPending}>
              {t("updatePassword")}
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
