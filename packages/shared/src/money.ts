import { Decimal } from "decimal.js";

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export type MoneyString = string;

export function toMoney(value: string | number | Decimal): MoneyString {
  return new Decimal(value).toFixed(2);
}

export function addMoney(a: MoneyString, b: MoneyString): MoneyString {
  return new Decimal(a).plus(b).toFixed(2);
}

export function subMoney(a: MoneyString, b: MoneyString): MoneyString {
  return new Decimal(a).minus(b).toFixed(2);
}

export function compareMoney(a: MoneyString, b: MoneyString): number {
  return new Decimal(a).comparedTo(b);
}

export function isPositiveMoney(value: MoneyString): boolean {
  return new Decimal(value).gt(0);
}

export function formatBDT(value: MoneyString): string {
  const num = parseFloat(value);
  return new Intl.NumberFormat("bn-BD", {
    style: "currency",
    currency: "BDT",
    minimumFractionDigits: 2,
  }).format(num);
}

export function percentOf(spent: MoneyString, limit: MoneyString): number {
  if (new Decimal(limit).eq(0)) return 0;
  return new Decimal(spent).div(limit).mul(100).toNumber();
}

export function budgetStatus(spent: MoneyString, limit: MoneyString): "UNDER_BUDGET" | "NEAR_LIMIT" | "OVER_BUDGET" {
  const pct = percentOf(spent, limit);
  if (pct > 100) return "OVER_BUDGET";
  if (pct >= 80) return "NEAR_LIMIT";
  return "UNDER_BUDGET";
}
