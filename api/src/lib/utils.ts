import type { Decimal } from "@prisma/client/runtime/library";
import { toMoney } from "@fintrack/shared";

export function decimalToMoney(value: Decimal | number | string): string {
  return toMoney(value.toString());
}

export function parseDateOnly(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50) || "workspace";
}

export async function uniqueSlug(base: string, exists: (slug: string) => Promise<boolean>): Promise<string> {
  let slug = slugify(base);
  let counter = 1;
  while (await exists(slug)) {
    slug = `${slugify(base)}-${counter++}`;
  }
  return slug;
}
