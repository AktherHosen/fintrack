"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Globe } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useLocale } from "@/lib/locale-context";
import { api } from "@/lib/api-client";
import { locales, type AppLocale } from "@/i18n/config";
import { SegmentedButton } from "@/components/ui/material";

export function LanguageSelector({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale } = useLocale();
  const { user, refresh } = useAuth();
  const tMore = useTranslations("more");
  const tLocale = useTranslations("locale");
  const [saving, setSaving] = useState(false);

  async function selectLocale(next: AppLocale) {
    if (next === locale || saving) return;

    setLocale(next);

    if (!user) return;

    setSaving(true);
    try {
      await api("/auth/me", { method: "PATCH", body: JSON.stringify({ locale: next }) });
      await refresh();
    } finally {
      setSaving(false);
    }
  }

  const options = locales.map((code) => ({
    value: code,
    label: tLocale(code),
  }));

  if (compact) {
    return (
      <SegmentedButton<AppLocale>
        options={options}
        value={locale}
        onChange={selectLocale}
        className={saving ? "pointer-events-none opacity-60" : undefined}
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
          <Globe className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-medium">{tMore("language")}</p>
          <p className="text-xs text-muted-foreground">{tLocale(locale)}</p>
        </div>
      </div>
      <SegmentedButton<AppLocale>
        options={options}
        value={locale}
        onChange={selectLocale}
        className={saving ? "pointer-events-none opacity-60" : undefined}
      />
    </div>
  );
}
