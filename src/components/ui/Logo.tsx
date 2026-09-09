import React from 'react';
import { cn } from '../../lib/utils';

interface LogoProps {
  size?: number | string;
  className?: string;
  showText?: boolean;
  versionBadge?: string;
  textClassName?: string;
}

export function LogoIcon({
  size = 28,
  className,
}: {
  size?: number | string;
  className?: string;
}) {
  return (
    <img
      src="/logo.svg"
      alt="FinTrack"
      width={typeof size === 'number' ? size : undefined}
      height={typeof size === 'number' ? size : undefined}
      style={{ width: size, height: size }}
      className={cn(
        'shrink-0 select-none drop-shadow-xs transition-transform hover:scale-105 duration-200 object-contain',
        className
      )}
    />
  );
}

export function Logo({
  size = 28,
  className,
  showText = false,
  versionBadge,
  textClassName,
}: LogoProps) {
  return (
    <div className={cn('inline-flex items-center gap-2.5 min-w-0', className)}>
      <LogoIcon size={size} />
      {showText && (
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className={cn(
              'font-bold text-sm tracking-tight text-zinc-900 dark:text-zinc-100 truncate',
              textClassName
            )}
          >
            FinTrack
          </span>
          {versionBadge && (
            <span className="text-[10px] px-1 py-0 h-4 rounded-sm bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-mono font-medium shrink-0">
              {versionBadge}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
