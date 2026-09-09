import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { cn } from '../../lib/utils';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        'p-3 pointer-events-auto select-none w-full max-w-[280px] sm:max-w-[290px] mx-auto',
        className
      )}
      classNames={{
        // DayPicker v9 element selectors
        root: 'w-full',
        months: 'flex flex-col space-y-3 w-full',
        month: 'space-y-3 w-full',
        month_caption: 'flex justify-center pt-1 relative items-center h-8 mb-1 w-full',
        caption_label: 'text-xs font-bold text-zinc-900 dark:text-zinc-100 tracking-tight',
        nav: 'flex items-center justify-between w-full absolute inset-x-0 top-1 px-1 pointer-events-none',
        button_previous: cn(
          'pointer-events-auto h-7 w-7 inline-flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer p-0 shadow-2xs'
        ),
        button_next: cn(
          'pointer-events-auto h-7 w-7 inline-flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer p-0 shadow-2xs'
        ),
        month_grid: 'w-full border-collapse table-fixed',
        weekdays: 'grid grid-cols-7 text-center mb-1.5',
        weekday: 'text-zinc-400 dark:text-zinc-500 font-semibold text-[10px] uppercase tracking-wider h-6 flex items-center justify-center',
        weeks: 'flex flex-col gap-1 w-full',
        week: 'grid grid-cols-7 gap-0.5 sm:gap-1 w-full text-center',
        day: 'h-8 w-full p-0 flex items-center justify-center relative text-center text-xs font-medium',
        day_button: cn(
          'h-8 w-full rounded-lg text-xs font-medium flex items-center justify-center text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500'
        ),
        selected: '!bg-indigo-600 !text-white hover:!bg-indigo-500 font-bold shadow-xs',
        today: 'border border-indigo-500/50 font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/60 dark:bg-indigo-950/40',
        outside: 'text-zinc-400 dark:text-zinc-600 opacity-40 hover:opacity-80',
        disabled: 'text-zinc-300 dark:text-zinc-700 opacity-30 cursor-not-allowed pointer-events-none',
        range_start: 'rounded-l-lg bg-indigo-600 text-white',
        range_end: 'rounded-r-lg bg-indigo-600 text-white',
        range_middle: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 rounded-none',

        // Backward compatibility v8 classnames
        caption: 'flex justify-center pt-1 relative items-center h-8 mb-1 w-full',
        nav_button: 'h-7 w-7 inline-flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400',
        nav_button_previous: 'absolute left-1',
        nav_button_next: 'absolute right-1',
        table: 'w-full border-collapse table-fixed',
        head_row: 'grid grid-cols-7 text-center mb-1.5',
        head_cell: 'text-zinc-400 dark:text-zinc-500 font-semibold text-[10px] uppercase tracking-wider h-6 flex items-center justify-center',
        row: 'grid grid-cols-7 gap-0.5 sm:gap-1 w-full text-center',
        cell: 'h-8 w-full p-0 flex items-center justify-center relative text-center text-xs font-medium',
        day_selected: '!bg-indigo-600 !text-white hover:!bg-indigo-500 font-bold shadow-xs',
        day_today: 'border border-indigo-500/50 font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/60 dark:bg-indigo-950/40',
        day_outside: 'text-zinc-400 dark:text-zinc-600 opacity-40 hover:opacity-80',
        day_disabled: 'text-zinc-300 dark:text-zinc-700 opacity-30 cursor-not-allowed pointer-events-none',

        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className }) => {
          if (orientation === 'left') {
            return <ChevronLeft className={cn('h-3.5 w-3.5', className)} />;
          }
          return <ChevronRight className={cn('h-3.5 w-3.5', className)} />;
        },
      }}
      {...props}
    />
  );
}
Calendar.displayName = 'Calendar';

export { Calendar };
