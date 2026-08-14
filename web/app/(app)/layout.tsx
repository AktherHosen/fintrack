"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { PremiumModalProvider } from "@/lib/premium-modal-context";
import { MobileShell } from "@/components/mobile/mobile-shell";
import { TransactionSheet } from "@/components/mobile/transaction-sheet";

function AppLayoutInner({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background">
        <div className="h-8 w-8 animate-pulse rounded-md bg-muted" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <PremiumModalProvider>
      <MobileShell onAddClick={() => setSheetOpen(true)}>{children}</MobileShell>
      <TransactionSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </PremiumModalProvider>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppLayoutInner>{children}</AppLayoutInner>
    </AuthProvider>
  );
}
