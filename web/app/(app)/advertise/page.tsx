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
import { FormField, FormFieldInput, FormInput, fieldError } from "@/components/ui/select";
import { PageHeader, Skeleton } from "@/components/ui/material";
import { BannerImageUpload } from "@/components/ads/banner-image-upload";
import { CampaignListItem } from "@/components/ads/campaign-list-item";
import { ArrowLeft, Megaphone } from "lucide-react";

const DEFAULT_ACCENT = "#2d3f6c";

export default function AdvertisePage() {
  const t = useTranslations("ads");
  const { user } = useAuth();
  const qc = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState<AdPlanDto | null>(null);
  const [submitNotice, setSubmitNotice] = useState<string | null>(null);
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
    mode: "onTouched",
    defaultValues: {
      adPlanSlug: "",
      title: "",
      subtitle: "",
      targetUrl: "",
      imageUrl: "",
      accentColor: DEFAULT_ACCENT,
      transactionId: "",
      senderNumber: "",
    },
  });

  const imageError = fieldError(form.formState.errors, "imageUrl");
  const accentError = fieldError(form.formState.errors, "accentColor");

  const submit = useMutation({
    mutationFn: (data: CreateAdCampaignInput) =>
      api("/ads", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ads-mine"] });
      form.reset({
        adPlanSlug: "",
        title: "",
        subtitle: "",
        targetUrl: "",
        imageUrl: "",
        accentColor: DEFAULT_ACCENT,
        transactionId: "",
        senderNumber: "",
      });
      setSelectedPlan(null);
      setSubmitNotice(t("submitSuccess"));
    },
  });

  function openPlan(plan: AdPlanDto) {
    setSubmitNotice(null);
    setSelectedPlan(plan);
    form.setValue("adPlanSlug", plan.slug, { shouldValidate: true });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Link href="/more" className="rounded-md p-2 hover:bg-accent">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <PageHeader title={t("title")} subtitle={t("subtitle")} />
      </div>

      {submitNotice ? (
        <p className="rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm text-primary">
          {submitNotice}
        </p>
      ) : null}

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
              <Button size="default" variant="secondary" className="mt-3 h-10" onClick={() => refetch()}>
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
                className="flex items-center justify-between gap-3 rounded-lg border bg-card p-4"
              >
                <div className="min-w-0">
                  <p className="font-medium">{plan.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {fmt(plan.price)} · {t("days", { count: plan.durationDays })}
                  </p>
                </div>
                <Button size="default" className="h-10 shrink-0" onClick={() => openPlan(plan)}>
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
              <CampaignListItem
                key={campaign.id}
                campaign={campaign}
                locale={locale}
                showDivider={index > 0}
              />
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
              <FormFieldInput
                form={form}
                name="title"
                label={t("headline")}
                placeholder={t("headlinePlaceholder")}
                autoComplete="off"
              />
              <FormFieldInput
                form={form}
                name="subtitle"
                label={t("subheadline")}
                placeholder={t("subheadlinePlaceholder")}
                autoComplete="off"
              />
              <FormFieldInput
                form={form}
                name="targetUrl"
                label={t("linkUrl")}
                placeholder="https://example.com"
                type="url"
                inputMode="url"
                autoComplete="url"
              />
              <FormField label={t("bannerImage")} error={imageError}>
                <Controller
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <BannerImageUpload
                      value={field.value}
                      onChange={(url) => field.onChange(url ?? "")}
                      fieldError={imageError}
                    />
                  )}
                />
              </FormField>
              <FormField label={t("bannerColor")} error={accentError} hint={t("bannerColorHint")}>
                <FormInput
                  type="color"
                  error={accentError}
                  className="h-10 w-20 cursor-pointer p-1"
                  {...form.register("accentColor")}
                />
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

              <FormFieldInput
                form={form}
                name="transactionId"
                label={t("trxId")}
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
              />
              <FormFieldInput
                form={form}
                name="senderNumber"
                label={t("senderNumber")}
                placeholder="01XXXXXXXXX"
                inputMode="numeric"
                autoComplete="tel"
                maxLength={11}
              />

              {submit.isError && (
                <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {t("submitError")}
                </p>
              )}

              <div className="flex gap-2 pt-1">
                <Button type="submit" size="lg" className="h-11 flex-1" disabled={submit.isPending}>
                  {t("submit")}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  className="h-11 shrink-0 px-6"
                  onClick={() => {
                    setSubmitNotice(null);
                    setSelectedPlan(null);
                  }}
                >
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
