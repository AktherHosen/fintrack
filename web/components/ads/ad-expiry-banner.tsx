"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, X } from "lucide-react";
import { useTranslations } from "next-intl";
import type { AdCampaignDto } from "@fintrack/shared";
import { api } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import {
  dismissAdExpiryAlert,
  formatRemainingShort,
  getCampaignRemaining,
  isAdExpiryAlertDismissed,
} from "@/lib/ad-campaign";
import { formatDate } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function pickSoonestCampaign(campaigns: AdCampaignDto[]): AdCampaignDto | null {
  const active = campaigns.filter(
    (c) => c.status === "ACTIVE" && c.endsAt && getCampaignRemaining(c.endsAt).isEndingSoon,
  );
  if (active.length === 0) return null;

  return active.sort((a, b) => {
    const aEnd = new Date(a.endsAt!).getTime();
    const bEnd = new Date(b.endsAt!).getTime();
    return aEnd - bEnd;
  })[0];
}

export function AdExpiryBanner({ className }: { className?: string }) {
  const t = useTranslations("ads");
  const pathname = usePathname();
  const { user } = useAuth();
  const locale = user?.locale ?? "en";
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(() => new Set());

  const { data: campaigns = [] } = useQuery({
    queryKey: ["ads-mine"],
    queryFn: () => api<AdCampaignDto[]>("/ads/mine"),
    staleTime: 60_000,
  });

  const campaign = useMemo(() => pickSoonestCampaign(campaigns), [campaigns]);

  if (pathname === "/advertise") return null;
  if (!campaign?.endsAt) return null;

  const remaining = getCampaignRemaining(campaign.endsAt);
  if (!remaining.isEndingSoon) return null;
  if (hiddenIds.has(campaign.id)) return null;
  if (isAdExpiryAlertDismissed(campaign.id, remaining.daysLeft)) return null;

  const remainingLabel = formatRemainingShort(remaining, {
    days: (count) => t("remainingDaysLong", { count }),
    hours: (count) => t("remainingHoursLong", { count }),
    today: t("remainingToday"),
    ended: t("remainingEnded"),
  });

  function dismiss() {
    dismissAdExpiryAlert(campaign!.id, remaining.daysLeft);
    setHiddenIds((prev) => new Set(prev).add(campaign!.id));
  }

  return (
    <div
      className={cn(
        "border-b border-amber-200/80 bg-amber-50/90 px-4 py-2.5 dark:border-amber-900/50 dark:bg-amber-950/30",
        className,
      )}
      role="status"
    >
      <div className="mx-auto flex max-w-lg items-start gap-3 lg:max-w-5xl lg:px-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="min-w-0 flex-1 text-sm">
          <p className="font-medium text-amber-950 dark:text-amber-100">{t("expiryBannerTitle")}</p>
          <p className="mt-0.5 text-amber-900/90 dark:text-amber-200/90">
            {t("expiryBannerBody", {
              title: campaign.title,
              date: formatDate(campaign.endsAt, locale),
              remaining: remainingLabel,
            })}
          </p>
          <Button variant="link" className="h-auto p-0 text-amber-950 underline dark:text-amber-100" asChild>
            <Link href="/advertise">{t("expiryBannerAction")}</Link>
          </Button>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-amber-800 hover:bg-amber-100/80 dark:text-amber-200 dark:hover:bg-amber-900/40"
          aria-label={t("dismiss")}
          onClick={dismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
