"use client";

import * as React from "react";
import { format, isValid, parse } from "date-fns";
import { enUS, bn as bnDateFns } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  type Control,
  type FieldPath,
  type FieldValues,
  Controller,
} from "react-hook-form";
import { bn, enUS as enDayPicker } from "react-day-picker/locale";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/locale-context";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function toDateString(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function fromDateString(value?: string): Date | undefined {
  if (!value) return undefined;
  const parsed = parse(value, "yyyy-MM-dd", new Date());
  return isValid(parsed) ? parsed : undefined;
}

interface DatePickerProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  "aria-invalid"?: boolean;
}

export function DatePicker({
  value,
  onChange,
  placeholder,
  disabled,
  className,
  id,
  "aria-invalid": ariaInvalid,
}: DatePickerProps) {
  const { locale } = useLocale();
  const t = useTranslations("common");
  const [open, setOpen] = React.useState(false);
  const selected = fromDateString(value);
  const dateFnsLocale = locale === "bn" ? bnDateFns : enUS;
  const dayPickerLocale = locale === "bn" ? bn : enDayPicker;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          aria-invalid={ariaInvalid}
          className={cn(
            "h-10 w-full justify-start px-3 text-left font-normal",
            !selected && "text-muted-foreground",
            ariaInvalid && "border-destructive focus-visible:ring-destructive/40",
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selected
            ? format(selected, "PPP", { locale: dateFnsLocale })
            : (placeholder ?? t("pickDate"))}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => {
            if (date) {
              onChange(toDateString(date));
              setOpen(false);
            }
          }}
          locale={dayPickerLocale}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}

export function FormDatePicker<T extends FieldValues>({
  control,
  name,
  "aria-invalid": ariaInvalid,
  ...props
}: {
  control: Control<T>;
  name: FieldPath<T>;
  "aria-invalid"?: boolean;
} & Omit<DatePickerProps, "value" | "onChange">) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <DatePicker
          value={field.value}
          onChange={field.onChange}
          aria-invalid={ariaInvalid}
          {...props}
        />
      )}
    />
  );
}
