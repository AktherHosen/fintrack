import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20",
        secondary:
          "border-transparent bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300",
        destructive:
          "border-transparent bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20",
        outline: "text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800",
        warning:
          "border-transparent bg-amber-500/10 text-amber-800 dark:text-amber-400 border border-amber-500/20",
        indigo:
          "border-transparent bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20",
        emerald:
          "border-transparent bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
