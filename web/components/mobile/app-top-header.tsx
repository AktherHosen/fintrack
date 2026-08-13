"use client";

import Link from "next/link";
import { Bell, Crown, Settings, Wallet } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { usePremiumModal } from "@/lib/premium-modal-context";
import { cn } from "@/lib/utils";

const iconBtnClass =
  "h-9 w-9 rounded-xl text-muted-foreground hover:bg-muted/80 hover:text-foreground";

export function AppTopHeader() {
  const t = useTranslations("shell");
  const { openPremium } = usePremiumModal();

  return (
    <header className="bg-background">
      <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4 lg:max-w-5xl lg:px-6">
        <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/20">
            <Wallet className="h-4 w-4" />
          </div>
          <span className="text-lg font-bold tracking-tight">FinTrack</span>
        </Link>

        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className={iconBtnClass} aria-label={t("notifications")}>
            <Bell className="h-[18px] w-[18px]" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(iconBtnClass, "hover:text-amber-500")}
            aria-label={t("premium")}
            onClick={openPremium}
          >
            <Crown className="h-[18px] w-[18px] text-amber-500" />
          </Button>
          <Button variant="ghost" size="icon" className={iconBtnClass} asChild>
            <Link href="/more" aria-label={t("settings")}>
              <Settings className="h-[18px] w-[18px]" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
