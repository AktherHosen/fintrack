import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  amount: number | string | null | undefined,
  currency: string = 'BDT',
  locale: string = 'en'
): string {
  const num = typeof amount === 'number' ? amount : parseFloat(String(amount || 0));
  if (isNaN(num)) return '৳0.00';

  const isBn = locale === 'bn';

  if (currency === 'BDT') {
    const formatted = new Intl.NumberFormat(isBn ? 'bn-BD' : 'en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
    return formatted.replace('BDT', '৳').trim();
  }

  return new Intl.NumberFormat(isBn ? 'bn-BD' : 'en-US', {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: 2,
  }).format(num);
}

export function formatDate(
  date: string | Date | null | undefined,
  pattern: string = 'MMM dd, yyyy'
): string {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function isWithinDays(dateStr: string | null | undefined, days: number): boolean {
  if (!dateStr) return false;
  const target = new Date(dateStr);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - target.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= days;
}

export function getInitials(name?: string | null): string {
  if (!name) return 'FT';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
