"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Check, Crown, Loader2, Sparkles } from "lucide-react";
import type { AdminPlanDto, SubscriptionDto } from "@fintrack/shared";
import { api } from "@/lib/api-client";
import { formatMoney } from "@/lib/formatters";
import { isProPlanSlug, planPriceLabel } from "@/components/subscription/usage-meter";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function planIcon(slug: string) {
  return isProPlanSlug(slug) ? Crown : Sparkles;
}

export function AdminPlanPreview({
  plans,
  plansLoading,
}: {
  plans?: AdminPlanDto[];
  plansLoading?: boolean;
}) {
  const t = useTranslations("admin.preview");
  const { user } = useAuth();
  const qc = useQueryClient();
  const locale = user?.locale ?? "en";
  const currency = user?.currency ?? "BDT";
  const fmt = (amount: string, planCurrency?: string) =>
    formatMoney(amount, planCurrency ?? currency, locale);

  const { data: subscription } = useQuery({
    queryKey: ["subscription"],
    queryFn: () => api<SubscriptionDto | null>("/subscription"),
  });

  const switchPlan = useMutation({
    mutationFn: (planSlug: string) =>
      api<{ planSlug: string; planName: string }>("/admin/me/switch-plan", {
        method: "POST",
        body: JSON.stringify({ planSlug }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subscription"] });
      qc.invalidateQueries({ queryKey: ["plans"] });
    },
  });

  const currentSlug = subscription?.plan.slug;
  const activePlans = [...(plans ?? []).filter((p) => p.isActive)].sort(
    (a, b) => parseFloat(a.price) - parseFloat(b.price),
  );

  return (
    <Card className="overflow-hidden shadow-card">
      <CardContent className="p-0">
        <div className="border-b border-border/60 px-4 py-3.5">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {t("title")}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{t("desc")}</p>
        </div>

        <div className="space-y-2 p-4">
          {plansLoading ? (
            <div className="flex h-24 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            activePlans.map((plan) => {
              const isCurrent = plan.slug === currentSlug;
              const isPending = switchPlan.isPending && switchPlan.variables === plan.slug;
              const Icon = planIcon(plan.slug);

              return (
                <button
                  key={plan.id}
                  type="button"
                  disabled={switchPlan.isPending}
                  onClick={() => !isCurrent && switchPlan.mutate(plan.slug)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition-all",
                    isCurrent
                      ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
                      : "border-border/60 bg-card hover:border-primary/25 hover:bg-muted/30",
                    !isCurrent && "active:scale-[0.99]",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
                      isCurrent
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : "border-border/60 bg-muted/40 text-muted-foreground",
                    )}
                  >
                    {isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{plan.name}</span>
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                      {planPriceLabel(plan.price, plan.billingInterval, (v) =>
                        fmt(v, plan.currency),
                      )}
                    </span>
                  </span>

                  {isCurrent ? (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
                      <Check className="h-3 w-3" strokeWidth={2.5} />
                      {t("active")}
                    </span>
                  ) : (
                    <span className="shrink-0 text-xs font-medium text-primary">{t("switch")}</span>
                  )}
                </button>
              );
            })
          )}

          {switchPlan.isSuccess ? (
            <p className="rounded-xl bg-income/10 px-3 py-2 text-center text-xs font-medium text-income">
              {t("switched")}
            </p>
          ) : null}
        </div>

        <div className="border-t border-border/60 bg-muted/20 px-4 py-2.5">
          <p className="text-center text-xs text-muted-foreground">
            {t("hint")}{" "}
            <Link href="/more" className="font-medium text-primary underline-offset-2 hover:underline">
              {t("openMore")}
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
