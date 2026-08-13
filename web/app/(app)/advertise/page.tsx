"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { createAdCampaignSchema, type CreateAdCampaignInput } from "@fintrack/shared";
import type { AdCampaignDto, AdPlanDto } from "@fintrack/shared";
import { api } from "@/lib/api-client";
import { formatMoney } from "@/lib/formatters";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/select";
import { ListDivider, ListItem, PageHeader, Skeleton } from "@/components/ui/material";
import { BannerImageUpload } from "@/components/ads/banner-image-upload";
import { ArrowLeft, Megaphone } from "lucide-react";

export default function AdvertisePage() {
  const t = useTranslations("ads");
  const { user } = useAuth();
  const qc = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState<AdPlanDto | null>(null);
  const locale = user?.locale ?? "en";
  const fmt = (v: string) => formatMoney(v, user?.currency ?? "BDT", locale);

  const { data: plans = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ["ad-plans"],
    queryFn: () => api<AdPlanDto[]>("/ad-plans"),
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ["ads-mine"],
    queryFn: () => api<AdCampaignDto[]>("/ads/mine"),
  });

  const { data: paymentConfig } = useQuery({
    queryKey: ["payment-config"],
    queryFn: () => api<{ bkashNumber: string | null }>("/payments/config"),
  });

  const form = useForm<CreateAdCampaignInput>({
    resolver: zodResolver(createAdCampaignSchema),
    defaultValues: {
      adPlanSlug: "",
      title: "",
      subtitle: "",
      targetUrl: "",
      imageUrl: "",
      accentColor: "#16a34a",
      transactionId: "",
      senderNumber: "",
    },
  });

  const submit = useMutation({
    mutationFn: (data: CreateAdCampaignInput) =>
      api("/ads", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ads-mine"] });
      form.reset({
        adPlanSlug: selectedPlan?.slug ?? "",
        title: "",
        subtitle: "",
        targetUrl: "",
        imageUrl: "",
        accentColor: "#16a34a",
        transactionId: "",
        senderNumber: "",
      });
    },
  });

  function openPlan(plan: AdPlanDto) {
    setSelectedPlan(plan);
    form.setValue("adPlanSlug", plan.slug);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Link href="/more" className="rounded-md p-2 hover:bg-accent">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <PageHeader title={t("title")} subtitle={t("subtitle")} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Megaphone className="h-4 w-4 text-primary" />
            {t("plansTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{t("plansDesc")}</p>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : isError ? (
            <div className="rounded-lg border border-dashed bg-muted/30 p-4 text-sm">
              <p className="text-destructive">{t("plansLoadError")}</p>
              <p className="mt-1 text-muted-foreground">
                {error instanceof Error ? error.message : t("plansLoadErrorHint")}
              </p>
              <Button size="sm" variant="secondary" className="mt-3" onClick={() => refetch()}>
                {t("retry")}
              </Button>
            </div>
          ) : plans.length === 0 ? (
            <p className="rounded-lg border border-dashed bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
              {t("plansEmpty")}
            </p>
          ) : (
            plans.map((plan) => (
              <div
                key={plan.id}
                className="flex items-center justify-between rounded-lg border bg-card p-4"
              >
                <div>
                  <p className="font-medium">{plan.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {fmt(plan.price)} · {t("days", { count: plan.durationDays })}
                  </p>
                </div>
                <Button size="sm" onClick={() => openPlan(plan)}>
                  {t("buyBanner")}
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {campaigns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("myCampaigns")}</CardTitle>
          </CardHeader>
          <CardContent className="py-1">
            {campaigns.map((campaign, index) => (
              <div key={campaign.id}>
                {index > 0 && <ListDivider />}
                <ListItem
                  title={campaign.title}
                  subtitle={`${campaign.status} · ${campaign.adPlan.name}${
                    campaign.endsAt ? ` · ${new Date(campaign.endsAt).toLocaleDateString()}` : ""
                  }`}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {selectedPlan && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t("submitTitle")} — {selectedPlan.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={form.handleSubmit((d) => submit.mutate(d))}>
              <FormField label={t("headline")}>
                <Input {...form.register("title")} placeholder={t("headlinePlaceholder")} />
              </FormField>
              <FormField label={t("subheadline")}>
                <Input {...form.register("subtitle")} placeholder={t("subheadlinePlaceholder")} />
              </FormField>
              <FormField label={t("linkUrl")}>
                <Input {...form.register("targetUrl")} placeholder="https://example.com" />
              </FormField>
              <FormField label={t("bannerImage")}>
                <Controller
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <BannerImageUpload
                      value={field.value}
                      onChange={(url) => field.onChange(url ?? "")}
                    />
                  )}
                />
              </FormField>
              <FormField label={t("bannerColor")}>
                <Input type="color" className="h-10 w-20 p-1" {...form.register("accentColor")} />
              </FormField>

              <div className="rounded-lg border bg-muted/40 p-4 text-sm">
                <p className="font-medium">{t("paymentTitle")}</p>
                <p className="mt-1 text-muted-foreground">
                  {t("sendAmount", { amount: fmt(selectedPlan.price) })}
                </p>
                {paymentConfig?.bkashNumber && (
                  <p className="mt-2 font-mono text-base">{paymentConfig.bkashNumber}</p>
                )}
              </div>

              <FormField label={t("trxId")}>
                <Input {...form.register("transactionId")} />
              </FormField>
              <FormField label={t("senderNumber")}>
                <Input {...form.register("senderNumber")} placeholder="01XXXXXXXXX" />
              </FormField>

              {submit.isError && (
                <p className="text-sm text-destructive">{t("submitError")}</p>
              )}
              {submit.isSuccess && (
                <p className="text-sm text-primary">{t("submitSuccess")}</p>
              )}

              <div className="flex gap-2">
                <Button type="submit" size="lg" className="flex-1" disabled={submit.isPending}>
                  {t("submit")}
                </Button>
                <Button type="button" variant="secondary" onClick={() => setSelectedPlan(null)}>
                  {t("cancel")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
