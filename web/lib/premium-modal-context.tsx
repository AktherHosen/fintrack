"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { PremiumModal } from "@/components/subscription/premium-modal";

type PremiumModalContextValue = {
  openPremium: () => void;
  closePremium: () => void;
};

const PremiumModalContext = createContext<PremiumModalContextValue | null>(null);

export function PremiumModalProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  const openPremium = useCallback(() => setOpen(true), []);
  const closePremium = useCallback(() => setOpen(false), []);

  return (
    <PremiumModalContext.Provider value={{ openPremium, closePremium }}>
      {children}
      <PremiumModal open={open} onOpenChange={setOpen} />
    </PremiumModalContext.Provider>
  );
}

export function usePremiumModal() {
  const ctx = useContext(PremiumModalContext);
  if (!ctx) {
    throw new Error("usePremiumModal must be used within PremiumModalProvider");
  }
  return ctx;
}
