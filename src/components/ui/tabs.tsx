import * as React from 'react';
import { cn } from '../../lib/utils';

interface TabsProps {
  value: string;
  onValueChange: (val: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function Tabs({ value, onValueChange, children, className }: TabsProps) {
  return (
    <div className={cn('w-full space-y-4', className)}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as any, { activeValue: value, onValueChange });
        }
        return child;
      })}
    </div>
  );
}

export function TabsList({ children, className, activeValue, onValueChange }: any) {
  return (
    <div
      className={cn(
        'inline-flex h-9 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-900/80 p-1 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800',
        className
      )}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as any, { activeValue, onValueChange });
        }
        return child;
      })}
    </div>
  );
}

export function TabsTrigger({ value, activeValue, onValueChange, children, className }: any) {
  const isActive = activeValue === value;
  return (
    <button
      type="button"
      onClick={() => onValueChange && onValueChange(value)}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-xs font-semibold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
        isActive
          ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-xs font-bold'
          : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50',
        className
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, activeValue, children, className }: any) {
  if (value !== activeValue) return null;
  return <div className={cn('animate-in fade-in-50 duration-200', className)}>{children}</div>;
}
