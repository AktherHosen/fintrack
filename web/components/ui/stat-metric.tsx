"use client";

import { cn } from "@/lib/utils";

export function StatMetric({
  label,
  value,
  title,
  tone = "neutral",
  className,
}: {
  label: string;
  value: string;
  title?: string;
  tone?: "income" | "expense" | "neutral" | "primary";
  className?: string;
}) {
  const valueStyles = {
    income: "text-income",
    expense: "text-expense",
    neutral: "text-foreground",
    primary: "text-primary",
  };

  const borderStyles = {
    income: "border-income/20 bg-income-muted/50",
    expense: "border-expense/20 bg-expense-muted/50",
    neutral: "border-border/60 bg-card",
    primary: "border-primary/20 bg-primary/5",
  };

  return (
    <div className={cn("min-w-0 overflow-hidden rounded-xl border p-3", borderStyles[tone], className)}>
      <p className="truncate text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p
        title={title ?? value}
        className={cn("mt-1 truncate text-sm font-semibold tabular-nums leading-snug", valueStyles[tone])}
      >
        {value}
      </p>
    </div>
  );
}
