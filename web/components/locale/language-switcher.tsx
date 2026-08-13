"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Globe } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/auth-context";
import { useLocale } from "@/lib/locale-context";
import { api } from "@/lib/api-client";
import { locales, type AppLocale } from "@/i18n/config";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();
  const { user, refresh } = useAuth();
  const t = useTranslations("locale");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  async function selectLocale(next: AppLocale) {
    if (next === locale) {
      setOpen(false);
      return;
    }

    setLocale(next);
    setOpen(false);

    if (!user) return;

    setSaving(true);
    try {
      await api("/auth/me", { method: "PATCH", body: JSON.stringify({ locale: next }) });
      await refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-9 w-9"
        aria-label={t("switchLanguage")}
        aria-expanded={open}
        aria-haspopup="listbox"
        disabled={saving}
        onClick={() => setOpen((value) => !value)}
      >
        <Globe className="h-4 w-4" />
      </Button>

      {open ? (
        <ul
          role="listbox"
          aria-label={t("switchLanguage")}
          className="absolute right-0 top-full z-50 mt-1 min-w-[9rem] overflow-hidden rounded-md border bg-popover py-1 text-popover-foreground shadow-md"
        >
          {locales.map((code) => (
            <li key={code} role="option" aria-selected={locale === code}>
              <button
                type="button"
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent",
                  locale === code && "bg-accent/50",
                )}
                onClick={() => selectLocale(code)}
              >
                <Check className={cn("h-4 w-4", locale === code ? "opacity-100" : "opacity-0")} />
                {t(code)}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
