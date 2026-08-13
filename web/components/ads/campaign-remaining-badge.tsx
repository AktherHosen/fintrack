"use client";

import { AlertTriangle, Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  formatRemainingShort,
  getCampaignRemaining,
  type RemainingUrgency,
} from "@/lib/ad-campaign";
import { cn } from "@/lib/utils";

const urgencyStyles: Record<RemainingUrgency, string> = {
  normal:
    "border-border/80 bg-muted/50 text-muted-foreground",
  warning:
    "border-amber-300/80 bg-amber-50 text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200",
  critical:
    "border-destructive/40 bg-destructive/10 text-destructive",
};

export function CampaignRemainingBadge({
  endsAt,
  showWhenInactive,
}: {
  endsAt: string;
  showWhenInactive?: boolean;
}) {
  const t = useTranslations("ads");
  const remaining = getCampaignRemaining(endsAt);
  const label = formatRemainingShort(remaining, {
    days: (count) => t("remainingDaysShort", { count }),
    hours: (count) => t("remainingHoursShort", { count }),
    today: t("remainingToday"),
    ended: t("remainingEnded"),
  });

  const isEnded =
    remaining.daysLeft <= 0 && remaining.hoursLeft <= 0 && remaining.minutesLeft <= 0;
  if (isEnded && !showWhenInactive) return null;

  const urgency = isEnded ? "critical" : remaining.urgency;
  const Icon = urgency === "normal" ? Clock : AlertTriangle;

  return (
    <div
      className={cn(
        "flex h-12 w-[3.25rem] shrink-0 flex-col items-center justify-center rounded-xl border text-center leading-tight",
        urgencyStyles[urgency],
      )}
      aria-label={t("remainingAria", { remaining: label })}
    >
      <Icon className={cn("mb-0.5 h-3.5 w-3.5", urgency !== "normal" && "stroke-[2.25]")} />
      <span className="px-0.5 text-[10px] font-semibold uppercase tracking-tight">{label}</span>
    </div>
  );
}
