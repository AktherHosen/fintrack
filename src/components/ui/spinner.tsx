import React from 'react';
import { cn } from '../../lib/utils';

interface SpinnerProps extends React.SVGAttributes<SVGSVGElement> {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  trackClassName?: string;
}

const sizeMap = {
  xs: 'h-3.5 w-3.5',
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
};

export function Spinner({ size = 'md', className, trackClassName, ...props }: SpinnerProps) {
  return (
    <svg
      className={cn('animate-spin text-indigo-600 dark:text-indigo-400', sizeMap[size], className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-label="Loading"
      role="status"
      {...props}
    >
      <circle
        className={cn('opacity-20 text-zinc-400 dark:text-zinc-700', trackClassName)}
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3.5"
      />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export function CircularProgressLoader({
  size = 'lg',
  label,
  className,
}: {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 p-6', className)}>
      <div className="relative flex items-center justify-center">
        <Spinner size={size} />
      </div>
      {label && (
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 animate-pulse">
          {label}
        </span>
      )}
    </div>
  );
}
