"use client";

import * as React from "react";
import { format } from "date-fns";
import { enUS, bn as bnDateFns } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { DateRange as DayPickerRange } from "react-day-picker";
import { bn, enUS as enDayPicker } from "react-day-picker/locale";
import {
  DATE_RANGE_PRESETS,
  type DateRange,
  type DateRangePresetId,
  getDateRangePreset,
  matchDateRangePreset,
} from "@/lib/date-ranges";
import { useIsDesktop } from "@/lib/use-media-query";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/locale-context";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { fromDateString, toDateString } from "@/components/ui/date-picker";

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onChange: (range: DateRange) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

function formatRangeLabel(
  startDate: string,
  endDate: string,
  locale: string,
  presetLabel: string | null,
): string {
  if (presetLabel) return presetLabel;

  const from = fromDateString(startDate);
  const to = fromDateString(endDate);
  if (!from || !to) return "";

  const dateFnsLocale = locale === "bn" ? bnDateFns : enUS;

  if (startDate === endDate) {
    return format(from, "PPP", { locale: dateFnsLocale });
  }

  const sameYear = from.getFullYear() === to.getFullYear();
  if (sameYear) {
    return `${format(from, "MMM d", { locale: dateFnsLocale })} – ${format(to, "MMM d, yyyy", { locale: dateFnsLocale })}`;
  }

  return `${format(from, "PPP", { locale: dateFnsLocale })} – ${format(to, "PPP", { locale: dateFnsLocale })}`;
}

interface DateRangePanelProps {
  activePreset: DateRangePresetId | null;
  draft: DayPickerRange | undefined;
  month: Date;
  dateFnsLocale: typeof enUS;
  dayPickerLocale: typeof enDayPicker;
  onPreset: (id: DateRangePresetId) => void;
  onSelectRange: (range: DayPickerRange | undefined) => void;
  onMonthChange: (month: Date) => void;
  presetLabel: (id: DateRangePresetId) => string;
  inDrawer?: boolean;
}

function DateRangePanel({
  activePreset,
  draft,
  month,
  dateFnsLocale,
  dayPickerLocale,
  onPreset,
  onSelectRange,
  onMonthChange,
  presetLabel,
  inDrawer = false,
}: DateRangePanelProps) {
  return (
    <div className="flex flex-col sm:flex-row">
      <div
        className={cn(
          "grid grid-cols-4 gap-1.5 border-b pb-2 pt-1",
          inDrawer ? "px-0" : "px-3 pt-3",
          "sm:flex sm:w-[9.5rem] sm:shrink-0 sm:flex-col sm:gap-0.5 sm:border-b-0 sm:border-r sm:p-3 sm:pt-3",
        )}
      >
        {DATE_RANGE_PRESETS.map((presetId) => (
          <Button
            key={presetId}
            type="button"
            variant={activePreset === presetId ? "default" : "outline"}
            size="sm"
            className="h-auto min-h-7 whitespace-normal px-1 py-1 text-center text-[10px] leading-tight sm:h-9 sm:justify-start sm:px-2.5 sm:py-2 sm:text-left sm:text-sm sm:leading-normal"
            onClick={() => onPreset(presetId)}
          >
            {presetLabel(presetId)}
          </Button>
        ))}
      </div>

      <Calendar
        mode="range"
        selected={draft}
        onSelect={onSelectRange}
        month={month}
        onMonthChange={onMonthChange}
        locale={dayPickerLocale}
        numberOfMonths={1}
        className={cn(
          inDrawer
            ? "mx-auto w-fit p-2 [--cell-size:1.875rem]"
            : "w-fit sm:w-fit",
        )}
        formatters={{
          formatWeekdayName: (date) => format(date, "EEEEE", { locale: dateFnsLocale }),
        }}
      />
    </div>
  );
}

export function DateRangePicker({
  startDate,
  endDate,
  onChange,
  placeholder,
  disabled,
  className,
  id,
}: DateRangePickerProps) {
  const { locale } = useLocale();
  const t = useTranslations("reports.dateRange");
  const isDesktop = useIsDesktop();
  const [mounted, setMounted] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [month, setMonth] = React.useState(() => fromDateString(startDate) ?? new Date());
  const [draft, setDraft] = React.useState<DayPickerRange | undefined>(() => ({
    from: fromDateString(startDate),
    to: fromDateString(endDate),
  }));

  React.useEffect(() => setMounted(true), []);

  const activePreset = matchDateRangePreset(startDate, endDate);

  React.useEffect(() => {
    if (!open) {
      const from = fromDateString(startDate);
      const to = fromDateString(endDate);
      setDraft({ from, to });
      if (from) setMonth(from);
    }
  }, [open, startDate, endDate]);

  const presetLabel = activePreset ? t(`preset.${activePreset}`) : null;
  const dateFnsLocale = locale === "bn" ? bnDateFns : enUS;
  const dayPickerLocale = locale === "bn" ? bn : enDayPicker;
  const label = formatRangeLabel(startDate, endDate, locale, presetLabel);

  function applyPreset(presetId: DateRangePresetId) {
    const range = getDateRangePreset(presetId);
    onChange(range);
    setOpen(false);
  }

  function applyDraftRange(range: DayPickerRange | undefined) {
    setDraft(range);
    if (range?.from) setMonth(range.from);
    if (range?.from && range.to) {
      onChange({
        startDate: toDateString(range.from),
        endDate: toDateString(range.to),
      });
      setOpen(false);
    }
  }

  const panelProps = {
    activePreset,
    draft,
    month,
    dateFnsLocale,
    dayPickerLocale,
    onPreset: applyPreset,
    onSelectRange: applyDraftRange,
    onMonthChange: setMonth,
    presetLabel: (presetId: DateRangePresetId) => t(`preset.${presetId}`),
  };

  const trigger = (
    <Button
      id={id}
      type="button"
      variant="outline"
      disabled={disabled}
      className={cn(
        "h-10 w-full justify-start px-3 text-left font-normal",
        !label && "text-muted-foreground",
        className,
      )}
      onClick={mounted && !isDesktop ? () => setOpen(true) : undefined}
    >
      <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
      <span className="truncate">{label || (placeholder ?? t("pickRange"))}</span>
    </Button>
  );

  if (!mounted) {
    return trigger;
  }

  if (isDesktop) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start" sideOffset={8}>
          <DateRangePanel {...panelProps} />
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <>
      {trigger}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{t("pickRange")}</SheetTitle>
          </SheetHeader>
          <div className="mt-5">
            <DateRangePanel {...panelProps} inDrawer />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
