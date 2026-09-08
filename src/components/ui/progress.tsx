import * as React from "react";
import { cn } from "../../lib/utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  indicatorColor?: string;
}

export function Progress({
  value,
  max = 100,
  className,
  indicatorColor = "bg-emerald-500",
  ...props
}: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div
      className={cn(
        "relative h-2.5 w-full overflow-hidden rounded-full bg-slate-800",
        className
      )}
      {...props}
    >
      <div
        className={cn("h-full transition-all duration-500 ease-out rounded-full", indicatorColor)}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
