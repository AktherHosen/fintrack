import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { cn } from '../../lib/utils';
import { buttonVariants } from './button';

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
      className={cn('p-3 pointer-events-auto', className)}
      classNames={{
        months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
        month: 'space-y-3',
        caption: 'flex justify-center pt-1 relative items-center mb-1',
        caption_label: 'text-xs font-bold text-zinc-900 dark:text-zinc-100',
        nav: 'space-x-1 flex items-center',
        nav_button: cn(
          buttonVariants({ variant: 'outline' }),
          'h-6 w-6 bg-transparent p-0 opacity-60 hover:opacity-100 border-zinc-200 dark:border-zinc-800'
        ),
        nav_button_previous: 'absolute left-1',
        nav_button_next: 'absolute right-1',
        table: 'w-full border-collapse space-y-1',
        head_row: 'flex',
        head_cell:
          'text-zinc-400 dark:text-zinc-500 rounded-md w-7 sm:w-8 font-semibold text-[10px] uppercase text-center',
        row: 'flex w-full mt-1',
        cell: cn(
          'relative p-0 text-center text-xs focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-zinc-100 dark:[&:has([aria-selected])]:bg-zinc-800/60 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md'
        ),
        day: cn(
          buttonVariants({ variant: 'ghost' }),
          'h-7 w-7 sm:h-8 sm:w-8 p-0 text-xs font-medium aria-selected:opacity-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md'
        ),
        day_range_start: 'day-range-start',
        day_range_end: 'day-range-end',
        day_selected:
          'bg-indigo-600 text-white hover:bg-indigo-600 hover:text-white focus:bg-indigo-600 focus:text-white dark:bg-indigo-500 dark:text-white font-bold',
        day_today: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-bold',
        day_outside:
          'day-outside text-zinc-400 dark:text-zinc-600 opacity-40 aria-selected:bg-zinc-100/50 aria-selected:text-zinc-500 aria-selected:opacity-30',
        day_disabled: 'text-zinc-400 dark:text-zinc-600 opacity-40',
        day_range_middle:
          'aria-selected:bg-zinc-100 aria-selected:text-zinc-900 dark:aria-selected:bg-zinc-800 dark:aria-selected:text-zinc-100',
        day_hidden: 'invisible',
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className }) => {
          if (orientation === 'left') {
            return <ChevronLeft className={cn('h-4 w-4', className)} />;
          }
          return <ChevronRight className={cn('h-4 w-4', className)} />;
        },
      }}
      {...props}
    />
  );
}
Calendar.displayName = 'Calendar';

export { Calendar };
