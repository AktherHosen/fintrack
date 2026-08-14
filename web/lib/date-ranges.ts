import {
  endOfMonth,
  endOfYear,
  format,
  startOfDay,
  startOfMonth,
  startOfYear,
  subDays,
  subMonths,
  subYears,
} from "date-fns";

export interface DateRange {
  startDate: string;
  endDate: string;
}

export function toDateString(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

function range(start: Date, end: Date): DateRange {
  return { startDate: toDateString(start), endDate: toDateString(end) };
}

export const DATE_RANGE_PRESETS = [
  "today",
  "yesterday",
  "last7",
  "last30",
  "thisMonth",
  "lastMonth",
  "thisYear",
  "lastYear",
] as const;

export type DateRangePresetId = (typeof DATE_RANGE_PRESETS)[number];

export function getDateRangePreset(id: DateRangePresetId, now = new Date()): DateRange {
  switch (id) {
    case "today":
      return range(startOfDay(now), startOfDay(now));
    case "yesterday": {
      const day = subDays(now, 1);
      return range(startOfDay(day), startOfDay(day));
    }
    case "last7":
      return range(startOfDay(subDays(now, 6)), startOfDay(now));
    case "last30":
      return range(startOfDay(subDays(now, 29)), startOfDay(now));
    case "thisMonth":
      return range(startOfMonth(now), endOfMonth(now));
    case "lastMonth": {
      const month = subMonths(now, 1);
      return range(startOfMonth(month), endOfMonth(month));
    }
    case "thisYear":
      return range(startOfYear(now), endOfYear(now));
    case "lastYear": {
      const year = subYears(now, 1);
      return range(startOfYear(year), endOfYear(year));
    }
  }
}

export function monthRange(): DateRange {
  return getDateRangePreset("thisMonth");
}

export function matchDateRangePreset(startDate: string, endDate: string): DateRangePresetId | null {
  for (const id of DATE_RANGE_PRESETS) {
    const preset = getDateRangePreset(id);
    if (preset.startDate === startDate && preset.endDate === endDate) {
      return id;
    }
  }
  return null;
}
