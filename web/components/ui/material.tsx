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
    <div className={cn("flex items-center gap-3 px-1 py-3 transition-colors", className)}>
      {Icon && (
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-muted/40",
            iconClassName,
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium leading-snug">{title}</p>
        {subtitle && <p className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {trailing && <div className="shrink-0 text-right">{trailing}</div>}
    </div>
  );
}

export function ListDivider() {
  return <Separator className="opacity-60" />;
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
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-muted/20 px-6 py-14 text-center text-sm text-muted-foreground",
        className,
      )}
    >
      {message}
    </div>
  );
}

const toneDot = {
  income: "bg-income",
  expense: "bg-expense",
  neutral: "bg-muted-foreground/50",
} as const;

export function StatChip({
  label,
  value,
  title,
  tone = "neutral",
  className,
}: {
  label: string;
  value: string;
  title?: string;
  tone?: "income" | "expense" | "neutral";
  className?: string;
}) {
  const valueStyles = {
    income: "text-income",
    expense: "text-expense",
    neutral: "text-foreground",
  };

  return (
    <div className={cn("min-w-0 overflow-hidden rounded-2xl border border-border/60 bg-card p-3 shadow-card", className)}>
      <div className="flex min-w-0 items-center gap-1.5">
        <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", toneDot[tone])} />
        <p className="truncate text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
      </div>
      <p
        title={title ?? value}
        className={cn(
          "mt-1.5 truncate text-sm font-semibold tabular-nums leading-snug",
          valueStyles[tone],
        )}
      >
        {value}
      </p>
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
    <div className={cn("inline-flex w-full rounded-xl border border-border/60 bg-muted/50 p-1", className)}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-200",
            value === opt.value
              ? "bg-primary text-primary-foreground shadow-sm"
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
    <div className={cn("h-1.5 overflow-hidden rounded-full bg-secondary", className)}>
      <div
        className={cn(
          "h-full rounded-full transition-all duration-500 ease-out",
          overBudget ? "bg-expense" : "bg-primary",
        )}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  );
}

export { ShadcnSkeleton as Skeleton };
