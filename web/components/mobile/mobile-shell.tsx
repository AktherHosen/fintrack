"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Home,
  BarChart3,
  Wallet,
  Target,
  Settings,
  Repeat,
  Plus,
  Landmark,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AppTopHeader } from "@/components/mobile/app-top-header";
import { FeatureTabs } from "@/components/mobile/feature-tabs";

export function MobileShell({
  children,
  onAddClick,
}: {
  children: React.ReactNode;
  onAddClick?: () => void;
}) {
  const pathname = usePathname();
  const t = useTranslations("nav");

  const sidebarNav = [
    { href: "/", label: t("dashboard"), icon: Home },
    { href: "/loans", label: t("loans"), icon: Landmark },
    { href: "/budgets", label: t("budgets"), icon: Target },
    { href: "/recurring", label: t("recurring"), icon: Repeat },
    { href: "/reports", label: t("reports"), icon: BarChart3 },
    { href: "/more", label: t("settings"), icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:bg-background">
        <div className="flex h-16 items-center gap-2 border-b px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Wallet className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold">FinTrack</span>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {sidebarNav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <div className="sticky top-0 z-40 bg-background shadow-sm">
          <AppTopHeader />
          <FeatureTabs />
        </div>

        <main className="mx-auto w-full max-w-lg flex-1 px-4 py-4 pb-24 lg:max-w-5xl lg:px-6 lg:pb-8">
          {children}
        </main>

        <Button
          type="button"
          size="icon"
          onClick={onAddClick}
          aria-label="Add transaction"
          className="fixed bottom-5 right-4 z-50 h-14 w-14 rounded-full shadow-lg lg:hidden"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}
