export function getCurrencySymbol(currency: string, locale = "en"): string {
  try {
    const parts = new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-US", {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
    }).formatToParts(0);
    return parts.find((p) => p.type === "currency")?.value ?? currency;
  } catch {
    if (currency === "BDT") return "৳";
    return currency;
  }
}

export function formatMoney(value: string, currency = "BDT", locale = "en"): string {
  const num = parseFloat(value);
  const localeTag = locale === "bn" ? "bn-BD" : "en-US";
  try {
    return new Intl.NumberFormat(localeTag, {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
      minimumFractionDigits: 2,
    }).format(num);
  } catch {
    return `${getCurrencySymbol(currency, locale)} ${num.toFixed(2)}`;
  }
}

/** Compact display for stat cards; full precision in `full` for tooltips. */
export function formatMoneyStat(
  value: string,
  currency = "BDT",
  locale = "en",
): { display: string; full: string } {
  const full = formatMoney(value, currency, locale);
  const num = parseFloat(value);
  if (!Number.isFinite(num)) return { display: full, full };

  const abs = Math.abs(num);
  const symbol = getCurrencySymbol(currency, locale);
  const sign = num < 0 ? "-" : "";

  let compact = "";
  if (abs >= 1_000_000_000) compact = `${sign}${symbol}${(abs / 1_000_000_000).toFixed(2)}B`;
  else if (abs >= 1_000_000) compact = `${sign}${symbol}${(abs / 1_000_000).toFixed(2)}M`;
  else if (abs >= 100_000) compact = `${sign}${symbol}${(abs / 1_000).toFixed(1)}K`;

  if (compact && (full.length > 13 || abs >= 1_000_000)) {
    return { display: compact, full };
  }

  return { display: full, full };
}

/** @deprecated Use formatMoney with locale */
export function formatBDT(value: string): string {
  return formatMoney(value, "BDT", "bn");
}

export function formatDate(date: string, locale = "en"): string {
  const localeTag = locale === "bn" ? "bn-BD" : "en-US";
  return new Date(date).toLocaleDateString(localeTag, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function monthRange(): { startDate: string; endDate: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { startDate: fmt(start), endDate: fmt(end) };
}

export function greeting(locale = "en"): string {
  const h = new Date().getHours();
  if (locale === "bn") {
    if (h < 12) return "সুপ্রভাত";
    if (h < 17) return "শুভ অপরাহ্ন";
    return "শুভ সন্ধ্যা";
  }
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}
