import * as React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './button';
import { Calendar } from './calendar';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

export interface DatePickerProps {
  date?: Date;
  onSelect?: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  clearable?: boolean;
}

export function DatePicker({
  date,
  onSelect,
  placeholder = 'Pick a date',
  className,
  disabled = false,
  clearable = false,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="relative inline-flex items-center w-full">
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className={cn(
              'h-8 w-full justify-start text-left font-normal text-xs border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900',
              !date && 'text-zinc-400 dark:text-zinc-500',
              className
            )}
          >
            <CalendarIcon className="mr-2 h-3.5 w-3.5 text-zinc-500 shrink-0" />
            <span className="truncate">{date ? format(date, 'PPP') : placeholder}</span>
          </Button>
        </PopoverTrigger>
        {clearable && date && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect?.(undefined);
            }}
            className="absolute right-2.5 p-0.5 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
          >
            <X className="h-3 w-3" />
            <span className="sr-only">Clear date</span>
          </button>
        )}
      </div>
      <PopoverContent
        className="w-auto p-0 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 max-w-[calc(100vw-2rem)] overflow-hidden"
        align="start"
        sideOffset={6}
        collisionPadding={16}
      >
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => {
            onSelect?.(d);
            setOpen(false);
          }}
          initialFocus
        />
        {/* Quick action helper bar */}
        <div className="flex items-center justify-between px-3 py-1.5 border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-900/50 text-xs">
          <button
            type="button"
            onClick={() => {
              onSelect?.(new Date());
              setOpen(false);
            }}
            className="px-2 py-1 rounded-md text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors cursor-pointer"
          >
            Today
          </button>
          {date && (
            <button
              type="button"
              onClick={() => {
                onSelect?.(undefined);
                setOpen(false);
              }}
              className="px-2 py-1 rounded-md text-[11px] font-medium text-zinc-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
