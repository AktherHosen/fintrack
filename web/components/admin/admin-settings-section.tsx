"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Crown, Megaphone, Pencil, Settings2, Sparkles } from "lucide-react";
import type { AdminAdPlanDto, AdminPlanDto, PlanFeatures } from "@fintrack/shared";
import { api } from "@/lib/api-client";
import { formatMoney } from "@/lib/formatters";
import { isProPlanSlug } from "@/components/subscription/usage-meter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormField, FormInput } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { EmptyState, ListDivider, ListItem, SegmentedButton, Skeleton } from "@/components/ui/material";
import {
  PlanFeaturesEditor,
  emptyPlanFeatures,
} from "@/components/admin/plan-features-editor";
import { cn } from "@/lib/utils";

type SettingsSection = "payment" | "subscription" | "banner";

type EditTarget =
  | { kind: "subscription"; plan: AdminPlanDto }
  | { kind: "banner"; plan: AdminAdPlanDto };

function AdminPlanRowActions({
  isActive,
  onEdit,
  onToggle,
  toggleDisabled,
  labels,
}: {
  isActive: boolean;
  onEdit: () => void;
  onToggle: () => void;
  toggleDisabled?: boolean;
  labels: {
    active: string;
    inactive: string;
    activate: string;
    deactivate: string;
    edit: string;
  };
}) {
  return (
    <div className="grid shrink-0 grid-cols-[4.75rem_2.25rem_6.25rem] items-center gap-1">
      <span
        className={cn(
          "inline-flex h-6 items-center justify-center rounded-md px-1 text-[10px] font-semibold uppercase leading-none",
          isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
        )}
      >
        {isActive ? labels.active : labels.inactive}
      </span>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="h-9 w-9"
        aria-label={labels.edit}
        onClick={onEdit}
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        size="sm"
        variant={isActive ? "outline" : "default"}
        className="h-9 w-full px-2 text-xs"
        disabled={toggleDisabled}
        onClick={onToggle}
      >
        {isActive ? labels.deactivate : labels.activate}
      </Button>
    </div>
  );
}

export function AdminSettingsSection({
  enabled,
  locale,
  currency,
}: {
  enabled: boolean;
  locale: string;
  currency: string;
}) {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const qc = useQueryClient();
  const fmt = (amount: string, planCurrency?: string) =>
    formatMoney(amount, planCurrency ?? currency, locale);

  const [section, setSection] = useState<SettingsSection>("payment");
  const [bkashNumber, setBkashNumber] = useState("");
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editDurationDays, setEditDurationDays] = useState("");
  const [editFeatures, setEditFeatures] = useState<PlanFeatures>(emptyPlanFeatures());

  const { data: paymentSettings } = useQuery({
    queryKey: ["admin-payment-settings"],
    queryFn: () => api<{ bkashNumber: string | null }>("/admin/settings/payment"),
    enabled,
  });

  const { data: subscriptionPlans = [], isLoading: plansLoading } = useQuery({
    queryKey: ["admin-plans"],
    queryFn: () => api<AdminPlanDto[]>("/admin/plans"),
    enabled: enabled && section === "subscription",
  });

  const { data: bannerPlans = [], isLoading: adPlansLoading } = useQuery({
    queryKey: ["admin-ad-plans"],
    queryFn: () => api<AdminAdPlanDto[]>("/admin/ad-plans"),
    enabled: enabled && section === "banner",
  });

  useEffect(() => {
    if (paymentSettings?.bkashNumber) setBkashNumber(paymentSettings.bkashNumber);
  }, [paymentSettings?.bkashNumber]);

  useEffect(() => {
    if (!editTarget) return;
    setEditName(editTarget.plan.name);
    setEditPrice(editTarget.plan.price);
    if (editTarget.kind === "banner") {
      setEditDurationDays(String(editTarget.plan.durationDays));
    } else {
      setEditFeatures((editTarget.plan.features as PlanFeatures) ?? emptyPlanFeatures());
    }
  }, [editTarget]);

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

  const updateSubscriptionPlan = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      api(`/admin/plans/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-plans"] });
      qc.invalidateQueries({ queryKey: ["plans"] });
      setEditTarget(null);
    },
  });

  const updateBannerPlan = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      api(`/admin/ad-plans/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-ad-plans"] });
      qc.invalidateQueries({ queryKey: ["ad-plans"] });
      setEditTarget(null);
    },
  });

  const sectionOptions = [
    { value: "payment" as const, label: t("settings.sections.payment") },
    { value: "subscription" as const, label: t("settings.sections.subscription") },
    { value: "banner" as const, label: t("settings.sections.banner") },
  ];

  function billingLabel(interval: string): string {
    return interval === "YEARLY" ? t("plans.yearly") : t("plans.monthly");
  }

  function saveEdit() {
    if (!editTarget) return;
    if (editTarget.kind === "subscription") {
      updateSubscriptionPlan.mutate({
        id: editTarget.plan.id,
        body: { name: editName.trim(), price: editPrice.trim(), features: editFeatures },
      });
      return;
    }
    const durationDays = parseInt(editDurationDays, 10);
    if (!Number.isFinite(durationDays) || durationDays < 1) return;
    updateBannerPlan.mutate({
      id: editTarget.plan.id,
      body: {
        name: editName.trim(),
        price: editPrice.trim(),
        durationDays,
      },
    });
  }

  const planMutationPending =
    updateSubscriptionPlan.isPending || updateBannerPlan.isPending;

  const planActionLabels = {
    active: t("plans.active"),
    inactive: t("plans.inactive"),
    activate: t("plans.activate"),
    deactivate: t("plans.deactivate"),
    edit: tc("edit"),
  };

  return (
    <>
      <Card>
        <CardHeader className="space-y-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings2 className="h-4 w-4 text-primary" />
            {t("settings.title")}
          </CardTitle>
          <SegmentedButton options={sectionOptions} value={section} onChange={setSection} />
        </CardHeader>

        <CardContent className="space-y-4">
          {section === "payment" && (
            <>
              <p className="text-sm text-muted-foreground">{t("settings.paymentDesc")}</p>
              <FormField label={t("settings.bkashLabel")} htmlFor="bkash-number" hint={t("settings.bkashHint")}>
                <FormInput
                  id="bkash-number"
                  placeholder={t("settings.bkashPlaceholder")}
                  value={bkashNumber}
                  onChange={(e) => setBkashNumber(e.target.value)}
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={11}
                />
              </FormField>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  className="h-10"
                  onClick={() => savePaymentSettings.mutate({ bkashNumber })}
                  disabled={savePaymentSettings.isPending || bkashNumber.length < 11}
                >
                  {savePaymentSettings.isPending ? t("settings.saving") : t("settings.save")}
                </Button>
                {settingsSaved ? (
                  <span className="text-xs font-medium text-income">{t("settings.saved")}</span>
                ) : null}
              </div>
              {paymentSettings?.bkashNumber ? (
                <p className="rounded-xl border bg-muted/30 px-4 py-3 text-sm">
                  {t("settings.liveNumber")}:{" "}
                  <span className="font-mono font-semibold">{paymentSettings.bkashNumber}</span>
                </p>
              ) : (
                <p className="rounded-xl border border-dashed bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                  {t("settings.notConfigured")}
                </p>
              )}
            </>
          )}

          {section === "subscription" && (
            <>
              <p className="text-sm text-muted-foreground">{t("plans.subscriptionDesc")}</p>
              {plansLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-14 w-full rounded-xl" />
                  <Skeleton className="h-14 w-full rounded-xl" />
                </div>
              ) : subscriptionPlans.length === 0 ? (
                <EmptyState message={t("plans.emptySubscription")} className="py-10" />
              ) : (
                <div className="py-1">
                  {subscriptionPlans.map((plan, index) => {
                    const isPro = isProPlanSlug(plan.slug);
                    const PlanIcon = isPro ? Crown : Sparkles;
                    return (
                    <div key={plan.id}>
                      {index > 0 && <ListDivider />}
                      <ListItem
                        icon={PlanIcon}
                        iconClassName={
                          !plan.isActive
                            ? "opacity-50"
                            : isPro
                              ? "text-amber-600"
                              : "text-muted-foreground"
                        }
                        title={plan.name}
                        subtitle={`${plan.slug} · ${fmt(plan.price, plan.currency)} · ${billingLabel(plan.billingInterval)}`}
                        trailing={
                          <AdminPlanRowActions
                            isActive={plan.isActive}
                            labels={planActionLabels}
                            toggleDisabled={updateSubscriptionPlan.isPending}
                            onEdit={() => setEditTarget({ kind: "subscription", plan })}
                            onToggle={() =>
                              updateSubscriptionPlan.mutate({
                                id: plan.id,
                                body: { isActive: !plan.isActive },
                              })
                            }
                          />
                        }
                      />
                    </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {section === "banner" && (
            <>
              <p className="text-sm text-muted-foreground">{t("plans.bannerDesc")}</p>
              {adPlansLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-14 w-full rounded-xl" />
                  <Skeleton className="h-14 w-full rounded-xl" />
                </div>
              ) : bannerPlans.length === 0 ? (
                <EmptyState message={t("plans.emptyBanner")} className="py-10" />
              ) : (
                <div className="py-1">
                  {bannerPlans.map((plan, index) => (
                    <div key={plan.id}>
                      {index > 0 && <ListDivider />}
                      <ListItem
                        icon={Megaphone}
                        iconClassName={plan.isActive ? "text-primary" : "opacity-50"}
                        title={plan.name}
                        subtitle={`${plan.slug} · ${fmt(plan.price, plan.currency)} · ${t("plans.durationDays", { count: plan.durationDays })}`}
                        trailing={
                          <AdminPlanRowActions
                            isActive={plan.isActive}
                            labels={planActionLabels}
                            toggleDisabled={updateBannerPlan.isPending}
                            onEdit={() => setEditTarget({ kind: "banner", plan })}
                            onToggle={() =>
                              updateBannerPlan.mutate({
                                id: plan.id,
                                body: { isActive: !plan.isActive },
                              })
                            }
                          />
                        }
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Sheet open={editTarget !== null} onOpenChange={(open) => !open && setEditTarget(null)}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-2xl">
          <SheetHeader className="text-left">
            <SheetTitle>
              {editTarget?.kind === "banner" ? t("plans.editBanner") : t("plans.editSubscription")}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-5 space-y-4 pb-4">
            <FormField label={t("plans.name")} htmlFor="plan-name">
              <FormInput id="plan-name" value={editName} onChange={(e) => setEditName(e.target.value)} />
            </FormField>
            <FormField label={t("plans.price")} htmlFor="plan-price">
              <FormInput
                id="plan-price"
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
                inputMode="decimal"
              />
            </FormField>
            {editTarget?.kind === "banner" ? (
              <FormField label={t("plans.durationDaysLabel")} htmlFor="plan-duration">
                <FormInput
                  id="plan-duration"
                  value={editDurationDays}
                  onChange={(e) => setEditDurationDays(e.target.value)}
                  inputMode="numeric"
                />
              </FormField>
            ) : editTarget?.kind === "subscription" ? (
              <PlanFeaturesEditor features={editFeatures} onChange={setEditFeatures} />
            ) : null}
            <div className="flex gap-2">
              <Button
                className="h-11 flex-1"
                disabled={planMutationPending || !editName.trim() || !editPrice.trim()}
                onClick={saveEdit}
              >
                {tc("save")}
              </Button>
              <Button
                variant="secondary"
                className="h-11 shrink-0 px-6"
                onClick={() => setEditTarget(null)}
              >
                {tc("cancel")}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
