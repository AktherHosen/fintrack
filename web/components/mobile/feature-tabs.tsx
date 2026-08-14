"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
  Home,
  Target,
  Landmark,
  BarChart3,
  Repeat,
  Crown,
  User,
} from "lucide-react";
import type { SubscriptionDto } from "@fintrack/shared";
import { api } from "@/lib/api-client";
import { isProPlanSlug } from "@/components/subscription/usage-meter";
import { usePremiumModal } from "@/lib/premium-modal-context";
import { cn } from "@/lib/utils";

type FeatureTab = {
  href: string;
  labelKey: string;
  icon: typeof Home;
  pro?: boolean;
};

const TABS: FeatureTab[] = [
  { href: "/", labelKey: "home", icon: Home },
  { href: "/loans", labelKey: "loans", icon: Landmark },
  { href: "/budgets", labelKey: "budgets", icon: Target },
  { href: "/reports", labelKey: "reports", icon: BarChart3, pro: true },
  { href: "/recurring", labelKey: "recurring", icon: Repeat, pro: true },
];

export function FeatureTabs() {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const ts = useTranslations("shell");

  const { data: subscription } = useQuery({
    queryKey: ["subscription"],
    queryFn: () => api<SubscriptionDto | null>("/subscription"),
  });

  const isPro = subscription?.plan?.slug ? isProPlanSlug(subscription.plan.slug) : false;
  const profileActive = pathname === "/more";
  const { openPremium } = usePremiumModal();

  return (
    <nav className="bg-background lg:hidden" aria-label="Features">
      <div className="mx-auto max-w-lg px-3 pb-2 pt-1">
        <div className="flex w-full items-center justify-between gap-1">
          {TABS.map(({ href, labelKey, icon: Icon, pro }) => {
            const active = pathname === href;
            const locked = pro && !isPro;
            const label = t(labelKey as "home");

            return locked ? (
              <button
                key={href}
                type="button"
                title={label}
                aria-label={label}
                onClick={openPremium}
                className={cn(
                  "relative flex h-10 flex-1 items-center justify-center rounded-xl transition-all duration-200",
                  "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
                <Crown className="absolute right-1.5 top-1 h-2 w-2 text-amber-500" aria-hidden />
              </button>
            ) : (
              <Link
                key={href}
                href={href}
                title={label}
                aria-label={label}
                className={cn(
                  "relative flex h-10 flex-1 items-center justify-center rounded-xl transition-all duration-200",
                  active
                    ? "bg-primary/10 text-primary shadow-sm"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.5 : 2} />
              </Link>
            );
          })}

          <Link
            href="/more"
            title={ts("profile")}
            aria-label={ts("profile")}
            className={cn(
              "relative flex h-10 flex-1 items-center justify-center rounded-xl transition-all duration-200",
              profileActive
                ? "bg-primary/10 text-primary shadow-sm"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
          >
            <User className="h-[18px] w-[18px]" strokeWidth={profileActive ? 2.5 : 2} />
          </Link>
        </div>
      </div>
    </nav>
  );
}
