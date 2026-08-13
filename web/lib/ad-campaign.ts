/** Show in-app warnings when an active banner has this many days or fewer left. */
export const AD_EXPIRY_WARN_DAYS = 3;

export type RemainingUrgency = "normal" | "warning" | "critical";

export interface CampaignRemaining {
  daysLeft: number;
  hoursLeft: number;
  minutesLeft: number;
  urgency: RemainingUrgency;
  isEndingSoon: boolean;
}

export function getCampaignRemaining(endsAt: string, now = new Date()): CampaignRemaining {
  const end = new Date(endsAt);
  const totalMs = Math.max(0, end.getTime() - now.getTime());

  const dayMs = 24 * 60 * 60 * 1000;
  const hourMs = 60 * 60 * 1000;
  const daysLeft = Math.floor(totalMs / dayMs);
  const hoursLeft = Math.floor((totalMs % dayMs) / hourMs);
  const minutesLeft = Math.floor((totalMs % hourMs) / (60 * 1000));

  let urgency: RemainingUrgency = "normal";
  if (daysLeft <= 1) urgency = "critical";
  else if (daysLeft <= AD_EXPIRY_WARN_DAYS) urgency = "warning";

  return {
    daysLeft,
    hoursLeft,
    minutesLeft,
    urgency,
    isEndingSoon: totalMs > 0 && daysLeft <= AD_EXPIRY_WARN_DAYS,
  };
}

export function formatRemainingShort(
  remaining: CampaignRemaining,
  labels: {
    days: (count: number) => string;
    hours: (count: number) => string;
    today: string;
    ended: string;
  },
): string {
  if (remaining.daysLeft <= 0 && remaining.hoursLeft <= 0 && remaining.minutesLeft <= 0) {
    return labels.ended;
  }
  if (remaining.daysLeft >= 1) return labels.days(remaining.daysLeft);
  if (remaining.hoursLeft >= 1) return labels.hours(remaining.hoursLeft);
  return labels.today;
}

const DISMISS_STORAGE_KEY = "fintrack-ad-expiry-dismissed";

export function getDismissedAdExpiryAlerts(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(DISMISS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === "object" ? (parsed as Record<string, string>) : {};
  } catch {
    return {};
  }
}

/** Dismiss until the remaining-day bucket changes (e.g. 3d → 2d shows again). */
export function dismissAdExpiryAlert(campaignId: string, daysLeft: number): void {
  if (typeof window === "undefined") return;
  const dismissed = getDismissedAdExpiryAlerts();
  dismissed[campaignId] = String(daysLeft);
  localStorage.setItem(DISMISS_STORAGE_KEY, JSON.stringify(dismissed));
}

export function isAdExpiryAlertDismissed(campaignId: string, daysLeft: number): boolean {
  const dismissed = getDismissedAdExpiryAlerts();
  return dismissed[campaignId] === String(daysLeft);
}
