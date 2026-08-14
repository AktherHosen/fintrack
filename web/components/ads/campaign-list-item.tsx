"use client";

import { useTranslations } from "next-intl";
import type { AdCampaignDto } from "@fintrack/shared";
import { CampaignRemainingBadge } from "@/components/ads/campaign-remaining-badge";
import { ListDivider } from "@/components/ui/material";
import { formatDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  ACTIVE: "bg-primary/10 text-primary",
  PENDING: "bg-muted text-muted-foreground",
  REJECTED: "bg-destructive/10 text-destructive",
  EXPIRED: "bg-muted text-muted-foreground",
};

function statusLabel(status: string, t: ReturnType<typeof useTranslations<"ads">>): string {
  switch (status) {
    case "ACTIVE":
      return t("statusActive");
    case "PENDING":
      return t("statusPending");
    case "REJECTED":
      return t("statusRejected");
    case "EXPIRED":
      return t("statusExpired");
    default:
      return status;
  }
}

export function CampaignListItem({
  campaign,
  locale,
  showDivider,
}: {
  campaign: AdCampaignDto;
  locale: string;
  showDivider?: boolean;
}) {
  const t = useTranslations("ads");
  const isActive = campaign.status === "ACTIVE" && campaign.endsAt;

  return (
    <>
      {showDivider ? <ListDivider /> : null}
      <div className="flex items-center gap-3 px-1 py-3">
        {isActive ? (
          <CampaignRemainingBadge endsAt={campaign.endsAt!} />
        ) : (
          <div className="flex h-12 w-[3.25rem] shrink-0 items-center justify-center rounded-xl border border-border/80 bg-muted/40">
            <span
              className={cn(
                "rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide",
                statusStyles[campaign.status] ?? statusStyles.PENDING,
              )}
            >
              {statusLabel(campaign.status, t).slice(0, 3)}
            </span>
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-sm font-medium leading-snug">{campaign.title}</p>
            <span
              className={cn(
                "shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                statusStyles[campaign.status] ?? statusStyles.PENDING,
              )}
            >
              {statusLabel(campaign.status, t)}
            </span>
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {campaign.adPlan.name}
            {" · "}
            {t("days", { count: campaign.adPlan.durationDays })}
            {campaign.endsAt ? (
              <>
                {" · "}
                {t("endsOn", { date: formatDate(campaign.endsAt, locale) })}
              </>
            ) : null}
          </p>
          {campaign.status === "REJECTED" && campaign.adminNote ? (
            <p className="mt-1 text-xs text-destructive">{campaign.adminNote}</p>
          ) : null}
        </div>
      </div>
    </>
  );
}
