"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { Monitor, Moon, Sun } from "lucide-react";
import { SegmentedButton } from "@/components/ui/material";

type ThemeChoice = "light" | "dark" | "system";

export function ThemeSelector({ compact = false }: { compact?: boolean }) {
  const t = useTranslations("more");
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const active: ThemeChoice =
    theme === "light" || theme === "dark" || theme === "system" ? theme : "system";

  const subtitle =
    active === "system"
      ? t("themeSystemDesc", { mode: resolvedTheme === "dark" ? t("themeDark") : t("themeLight") })
      : active === "dark"
        ? t("themeDarkDesc")
        : t("themeLightDesc");

  const Icon = active === "dark" ? Moon : active === "light" ? Sun : Monitor;

  if (!mounted) {
    if (compact) return <div className="h-9 w-full rounded-xl bg-muted animate-pulse" />;
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg border bg-muted" />
          <div className="space-y-1">
            <div className="h-4 w-24 rounded bg-muted" />
            <div className="h-3 w-32 rounded bg-muted" />
          </div>
        </div>
        <div className="h-9 w-full rounded-lg bg-muted" />
      </div>
    );
  }

  if (compact) {
    return (
      <SegmentedButton<ThemeChoice>
        options={[
          { value: "light", label: t("themeLight") },
          { value: "dark", label: t("themeDark") },
          { value: "system", label: t("themeSystem") },
        ]}
        value={active}
        onChange={setTheme}
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-medium">{t("appearance")}</p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <SegmentedButton<ThemeChoice>
        options={[
          { value: "light", label: t("themeLight") },
          { value: "dark", label: t("themeDark") },
          { value: "system", label: t("themeSystem") },
        ]}
        value={active}
        onChange={setTheme}
      />
    </div>
  );
}
