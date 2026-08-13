"use client";

import Link from "next/link";
import { Bell, Crown, Settings, Wallet } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export function AppTopHeader() {
  const t = useTranslations("shell");

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-12 max-w-lg items-center justify-between px-3 lg:max-w-5xl lg:h-14 lg:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
            <Wallet className="h-4 w-4" />
          </div>
          <span className="text-lg font-bold tracking-tight text-primary">FinTrack</span>
        </Link>

        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full" aria-label={t("notifications")}>
            <Bell className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full" asChild>
            <Link href="/more" aria-label={t("premium")}>
              <Crown className="h-5 w-5 text-amber-500" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full" asChild>
            <Link href="/more" aria-label={t("settings")}>
              <Settings className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
