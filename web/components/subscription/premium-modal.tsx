"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
  BarChart3,
  Check,
  Crown,
  FileDown,
  Infinity,
  Repeat,
  Sparkles,
  Tags,
  Wallet,
} from "lucide-react";
import { manualPaymentSchema, type ManualPaymentInput } from "@fintrack/shared";
import { api } from "@/lib/api-client";
import { formatMoney } from "@/lib/formatters";
import { useAuth } from "@/lib/auth-context";
import type { PlanDto, SubscriptionDto } from "@fintrack/shared";
import { isProPlanSlug, planPriceLabel } from "@/components/subscription/usage-meter";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/select";

const BENEFIT_ICONS = [Repeat, BarChart3, FileDown, Tags, Wallet, Infinity] as const;

export function PremiumModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const t = useTranslations("premium");
  const tc = useTranslations("common");
  const { user } = useAuth();
  const qc = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState<PlanDto | null>(null);
  const [showPayment, setShowPayment] = useState(false);

  const locale = user?.locale ?? "en";
  const currency = user?.currency ?? "BDT";
  const fmt = (v: string) => formatMoney(v, currency, locale);

  const { data: subscription } = useQuery({
    queryKey: ["subscription"],
    queryFn: () => api<SubscriptionDto | null>("/subscription"),
    enabled: open,
  });

  const { data: plans = [] } = useQuery({
    queryKey: ["plans"],
    queryFn: () => api<PlanDto[]>("/plans"),
    enabled: open,
  });

  const { data: paymentConfig } = useQuery({
    queryKey: ["payment-config"],
    queryFn: () => api<{ bkashNumber: string | null }>("/payments/config"),
    enabled: open,
  });

  const payForm = useForm<ManualPaymentInput>({
    resolver: zodResolver(manualPaymentSchema),
    defaultValues: { planSlug: "", transactionId: "", senderNumber: "" },
  });

  const submitPayment = useMutation({
    mutationFn: (data: ManualPaymentInput) =>
      api("/payments", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["subscription"] });
      setShowPayment(false);
      setSelectedPlan(null);
      payForm.reset();
      onOpenChange(false);
    },
  });

  const currentSlug = subscription?.plan.slug;
  const onPaidPro = currentSlug ? isProPlanSlug(currentSlug) : false;

  const upgradePlans = plans.filter((p) => {
    if (p.slug === "free") return false;
    if (parseFloat(p.price) === 0) return false;
    if (p.slug === currentSlug) return false;
    return true;
  });

  const benefits = [
    t("benefitRecurring"),
    t("benefitReports"),
    t("benefitExport"),
    t("benefitCategories"),
    t("benefitAccounts"),
    t("benefitLimits"),
  ];

  const steps = [t("step1"), t("step2"), t("step3"), t("step4")];

  function pickPlan(plan: PlanDto) {
    setSelectedPlan(plan);
    payForm.setValue("planSlug", plan.slug);
    setShowPayment(true);
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      setShowPayment(false);
      setSelectedPlan(null);
      payForm.reset();
    }
    onOpenChange(next);
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="center"
        className="gap-0 p-0 [&>button]:text-white [&>button]:hover:bg-white/15"
      >
        <div className="hero-gradient shrink-0 px-5 pb-5 pt-6 text-white">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
              <Crown className="h-5 w-5 text-amber-300" />
            </div>
            <Sparkles className="h-4 w-4 text-amber-200/80" />
          </div>
          <SheetHeader className="mt-3 space-y-1 text-left pr-8">
            <SheetTitle className="text-lg font-bold text-white">{t("title")}</SheetTitle>
            <SheetDescription className="text-xs text-white/75">{t("subtitle")}</SheetDescription>
          </SheetHeader>
          {subscription ? (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur-sm">
              <span className="text-white/70">{t("currentPlan")}:</span>
              <span>{subscription.plan.name}</span>
            </div>
          ) : null}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {!showPayment ? (
            <div className="space-y-5">
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {t("benefitsTitle")}
                </h3>
                <ul className="mt-3 space-y-2.5">
                  {benefits.map((label, i) => {
                    const Icon = BENEFIT_ICONS[i] ?? Check;
                    return (
                      <li key={label} className="flex items-start gap-3 text-sm">
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <span>{label}</span>
                      </li>
                    );
                  })}
                </ul>
              </section>

              <section>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {t("howToBuy")}
                </h3>
                <ol className="mt-3 space-y-3">
                  {steps.map((step, i) => (
                    <li key={step} className="flex gap-3 text-sm">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                        {i + 1}
                      </span>
                      <span className="pt-0.5 text-muted-foreground">{step}</span>
                    </li>
                  ))}
                </ol>
                {paymentConfig?.bkashNumber ? (
                  <p className="mt-3 rounded-xl border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                    bKash: <strong className="text-foreground">{paymentConfig.bkashNumber}</strong>
                  </p>
                ) : null}
              </section>

              <section>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {t("plansTitle")}
                </h3>
                {upgradePlans.length === 0 ? (
                  <p className="mt-3 rounded-xl border border-dashed bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
                    {t("onBestPlan")}
                  </p>
                ) : (
                  <div className="mt-3 space-y-2">
                    {upgradePlans.map((plan) => (
                      <div
                        key={plan.id}
                        className="flex items-center justify-between rounded-2xl border bg-card p-4 shadow-card"
                      >
                        <div>
                          <p className="font-semibold">{plan.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {planPriceLabel(plan.price, plan.billingInterval, fmt)}
                          </p>
                        </div>
                        <Button size="sm" onClick={() => pickPlan(plan)}>
                          {onPaidPro ? t("switchPlan") : tc("upgrade")}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          ) : (
            <div className="space-y-5">
              <button
                type="button"
                onClick={() => setShowPayment(false)}
                className="text-sm font-medium text-primary"
              >
                ← {t("backToPlans")}
              </button>

              <div>
                <h3 className="font-semibold">
                  {t("payWithBkash")} — {selectedPlan?.name}
                </h3>
                {selectedPlan ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {planPriceLabel(selectedPlan.price, selectedPlan.billingInterval, fmt)}
                  </p>
                ) : null}
              </div>

              <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm">
                {paymentConfig?.bkashNumber ? (
                  <p>
                    {t("sendAmount")}{" "}
                    <strong>{selectedPlan ? fmt(selectedPlan.price) : ""}</strong> {t("sendTo")}{" "}
                    <strong>{paymentConfig.bkashNumber}</strong> {t("viaBkash")}
                  </p>
                ) : (
                  <p className="text-muted-foreground">{t("bkashFallback")}</p>
                )}
              </div>

              <form onSubmit={payForm.handleSubmit((d) => submitPayment.mutate(d))} className="space-y-4">
                <FormField label={t("transactionId")}>
                  <Input {...payForm.register("transactionId")} placeholder="8NXXXXXXXX" />
                </FormField>
                <FormField label={t("senderNumber")}>
                  <Input placeholder="01XXXXXXXXX" {...payForm.register("senderNumber")} />
                </FormField>
                <Button type="submit" size="lg" className="w-full" disabled={submitPayment.isPending}>
                  {submitPayment.isPending ? tc("loading") : t("submitPayment")}
                </Button>
              </form>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
