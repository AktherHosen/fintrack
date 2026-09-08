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
        'inline-flex h-12 items-center justify-center rounded-xl bg-slate-900/90 p-1.5 text-slate-400 border border-slate-800 backdrop-blur-md',
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
        'inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 cursor-pointer',
        isActive
          ? 'bg-slate-800 text-emerald-400 shadow-md border border-slate-700/60'
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40',
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
