import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-xs font-semibold tracking-tight transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none",
  {
    variants: {
      variant: {
        default:
          "bg-zinc-50 text-zinc-950 shadow-sm hover:bg-zinc-200 active:bg-zinc-300",
        secondary:
          "bg-zinc-900 text-zinc-100 hover:bg-zinc-800 border border-zinc-800",
        outline:
          "border border-zinc-800 bg-transparent text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100 hover:border-zinc-700",
        ghost:
          "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100",
        destructive:
          "bg-rose-500/15 text-rose-400 border border-rose-500/30 hover:bg-rose-500/25",
        link:
          "text-emerald-400 underline-offset-4 hover:underline",
        emerald:
          "bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm",
        gradient:
          "bg-zinc-50 text-zinc-950 hover:bg-zinc-200 shadow-sm",
      },
      size: {
        default: "h-8 px-3.5 py-1.5",
        sm: "h-7 rounded-md px-2.5 text-[11px]",
        lg: "h-9 rounded-lg px-4 text-xs font-bold",
        icon: "h-8 w-8 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
