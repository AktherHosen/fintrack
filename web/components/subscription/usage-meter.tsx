"use client";

function formatLimit(used: number, limit: number | null | undefined): string {
  if (limit === null || limit === undefined) return `${used} / ∞`;
  return `${used} / ${limit}`;
}

function limitPercent(used: number, limit: number | null | undefined): number {
  if (limit === null || limit === undefined || limit === 0) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
}

export function UsageMeter({
  label,
  used,
  limit,
}: {
  label: string;
  used: number;
  limit: number | null | undefined;
}) {
  const pct = limitPercent(used, limit);
  const atLimit = typeof limit === "number" && used >= limit;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className={atLimit ? "font-medium text-destructive" : "text-muted-foreground"}>
          {formatLimit(used, limit)}
        </span>
      </div>
      {typeof limit === "number" && (
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all ${atLimit ? "bg-destructive" : "bg-primary"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}

export function planPriceLabel(price: string, billingInterval: string, formatMoney: (v: string) => string): string {
  const formatted = formatMoney(price);
  return billingInterval === "YEARLY" ? `${formatted}/yr` : `${formatted}/mo`;
}

export function isProPlanSlug(slug: string): boolean {
  return slug === "pro" || slug.startsWith("pro-");
}
