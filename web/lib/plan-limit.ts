import { ApiError } from "@/lib/api-client";

export function isAtPlanLimit(used: number, limit: number | null | undefined): boolean {
  return typeof limit === "number" && used >= limit;
}

/** API 403 when a numeric plan limit or Pro-only feature blocks the action. */
export function isUpgradeRequiredError(error: unknown): boolean {
  if (!(error instanceof ApiError) || error.status !== 403) return false;
  const msg = error.message.toLowerCase();
  return (
    msg.includes("plan limit") ||
    msg.includes("pro plan") ||
    msg.includes("requires a pro")
  );
}

export function hasPlanFeature(
  features: Record<string, unknown> | undefined,
  key: string,
): boolean {
  const value = features?.[key];
  if (typeof value === "boolean") return value;
  return true;
}
