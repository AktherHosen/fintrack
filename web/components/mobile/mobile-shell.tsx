"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Home,
  Receipt,
  BarChart3,
  Menu,
  LogOut,
  Bell,
  Wallet,
  Target,
  Settings,
  Repeat,
  Plus,
  Tags,
  ArrowLeftRight,
  Landmark,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useLocale } from "@/lib/locale-context";
import { greeting } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/locale/language-switcher";
import { AdBannerCarousel } from "@/components/ads/ad-banner-carousel";

export function MobileShell({
  children,
  onAddClick,
}: {
  children: React.ReactNode;
  onAddClick?: () => void;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { locale } = useLocale();
  const t = useTranslations("nav");

  const mobileNav = [
    { href: "/", label: t("home"), icon: Home },
    { href: "/transactions", label: t("activity"), icon: Receipt },
    { href: "/reports", label: t("reports"), icon: BarChart3 },
    { href: "/more", label: t("more"), icon: Menu },
  ];

  const sidebarNav = [
    { href: "/", label: t("dashboard"), icon: Home },
    { href: "/transactions", label: t("transactions"), icon: Receipt },
    { href: "/accounts", label: t("accounts"), icon: Wallet },
    { href: "/budgets", label: t("budgets"), icon: Target },
    { href: "/loans", label: t("loans"), icon: Landmark },
    { href: "/recurring", label: t("recurring"), icon: Repeat },
    { href: "/categories", label: t("categories"), icon: Tags },
    { href: "/transfers", label: t("transfers"), icon: ArrowLeftRight },
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
        <div className="sticky top-0 z-40">
          <AdBannerCarousel />
          <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4 lg:max-w-5xl lg:px-6">
            <div>
              <p className="text-xs text-muted-foreground">{greeting(locale)}</p>
              <p className="text-sm font-semibold">{user?.name}</p>
            </div>
            <div className="flex items-center gap-1">
              <LanguageSwitcher />
              <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Notifications">
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => logout()}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>
        </div>

        <main className="mx-auto w-full max-w-lg flex-1 px-4 py-6 pb-24 lg:max-w-5xl lg:px-6 lg:pb-8">
          {children}
        </main>

        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 safe-bottom lg:hidden">
          <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-2">
            {mobileNav.slice(0, 2).map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex flex-col items-center gap-1 px-3 py-1 text-[11px] font-medium",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </Link>
              );
            })}

            <Button
              type="button"
              size="icon"
              onClick={onAddClick}
              aria-label="Add transaction"
              className="h-12 w-12 -mt-5 rounded-full shadow-lg"
            >
              <Plus className="h-5 w-5" />
            </Button>

            {mobileNav.slice(2).map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex flex-col items-center gap-1 px-3 py-1 text-[11px] font-medium",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
