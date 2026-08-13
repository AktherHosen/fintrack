"use client";

import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Skeleton as ShadcnSkeleton } from "@/components/ui/skeleton";

export function ListItem({
  title,
  subtitle,
  trailing,
  icon: Icon,
  iconClassName,
  className,
}: {
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
  icon?: LucideIcon;
  iconClassName?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3 py-3", className)}>
      {Icon && (
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-muted/50",
            iconClassName,
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium leading-none">{title}</p>
        {subtitle && <p className="mt-1 truncate text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {trailing && <div className="shrink-0 text-right">{trailing}</div>}
    </div>
  );
}

export function ListDivider() {
  return <Separator />;
}

export function PageHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-3", className)}>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ message, className }: { message: string; className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 px-6 py-12 text-center text-sm text-muted-foreground",
        className,
      )}
    >
      {message}
    </div>
  );
}

export function StatChip({
  label,
  value,
  tone = "neutral",
  className,
}: {
  label: string;
  value: string;
  tone?: "income" | "expense" | "neutral";
  className?: string;
}) {
  const toneStyles = {
    income: "border-income/20 bg-income-muted",
    expense: "border-expense/20 bg-expense-muted",
    neutral: "border-border bg-card",
  };

  const valueStyles = {
    income: "text-income",
    expense: "text-expense",
    neutral: "text-foreground",
  };

  return (
    <div className={cn("rounded-xl border p-4 shadow-sm", toneStyles[tone], className)}>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-lg font-semibold tracking-tight", valueStyles[tone])}>{value}</p>
    </div>
  );
}

export function SegmentedButton<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("inline-flex w-full rounded-lg border bg-muted p-1", className)}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
            value === opt.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function ProgressBar({
  value,
  overBudget,
  className,
}: {
  value: number;
  overBudget?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("h-2 overflow-hidden rounded-full bg-secondary", className)}>
      <div
        className={cn("h-full rounded-full transition-all", overBudget ? "bg-expense" : "bg-primary")}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  );
}

export { ShadcnSkeleton as Skeleton };
