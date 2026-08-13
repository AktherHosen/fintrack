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

  return (
    <nav className="border-b bg-background lg:hidden" aria-label="Features">
      <div className="mx-auto max-w-lg px-3">
        <div className="flex w-full items-center justify-between">
          {TABS.map(({ href, labelKey, icon: Icon, pro }) => {
            const active = pathname === href;
            const locked = pro && !isPro;
            const label = t(labelKey as "home");

            return (
              <Link
                key={href}
                href={locked ? "/more" : href}
                title={label}
                aria-label={label}
                className={cn(
                  "relative flex h-11 flex-1 items-center justify-center transition-colors",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
                {pro ? (
                  <Crown
                    className="absolute right-1 top-1.5 h-2.5 w-2.5 text-amber-500"
                    aria-hidden
                  />
                ) : null}
                {active ? (
                  <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-primary" />
                ) : null}
              </Link>
            );
          })}

          <Link
            href="/more"
            title={ts("profile")}
            aria-label={ts("profile")}
            className={cn(
              "relative flex h-11 flex-1 items-center justify-center transition-colors",
              profileActive
                ? "text-primary"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
          >
            <User className="h-5 w-5" strokeWidth={profileActive ? 2.5 : 2} />
            {profileActive ? (
              <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-primary" />
            ) : null}
          </Link>
        </div>
      </div>
    </nav>
  );
}
