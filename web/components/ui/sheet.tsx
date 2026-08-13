"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Sheet({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {children}
    </Dialog.Root>
  );
}

export function SheetContent({
  children,
  className,
  side = "bottom",
}: {
  children: React.ReactNode;
  className?: string;
  side?: "bottom" | "center";
}) {
  const isCenter = side === "center";

  return (
    <Dialog.Portal>
      <Dialog.Overlay
        className={cn(
          "fixed inset-0 z-50 bg-black/55 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          isCenter ? "duration-200" : "backdrop-blur-sm duration-300",
        )}
      />
      <Dialog.Content
        className={cn(
          "fixed z-50 bg-background shadow-elevated data-[state=open]:animate-in data-[state=closed]:animate-out",
          isCenter
            ? "left-[50%] top-[50%] flex w-[calc(100%-2rem)] max-w-md translate-x-[-50%] translate-y-[-50%] flex-col overflow-hidden rounded-2xl border max-h-[min(34rem,82vh)] data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] data-[state=closed]:duration-150 data-[state=open]:duration-200"
            : "inset-x-0 bottom-0 max-h-[92vh] gap-4 overflow-y-auto rounded-t-2xl border-t p-6 data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom data-[state=closed]:duration-200 data-[state=open]:duration-300",
          className,
        )}
      >
        {children}
        <Dialog.Close className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-lg opacity-80 ring-offset-background transition-opacity hover:bg-muted/80 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Dialog.Close>
      </Dialog.Content>
    </Dialog.Portal>
  );
}

export function SheetHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex flex-col space-y-2 text-center sm:text-left", className)}>{children}</div>;
}

export function SheetTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <Dialog.Title className={cn("text-lg font-semibold leading-none tracking-tight", className)}>
      {children}
    </Dialog.Title>
  );
}

export function SheetDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return <Dialog.Description className={cn("text-sm text-muted-foreground", className)}>{children}</Dialog.Description>;
}
