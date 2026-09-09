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
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0 select-none drop-shadow-xs transition-transform hover:scale-105 duration-200', className)}
    >
      <defs>
        <linearGradient id="ft-brand-bg" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4F46E5" />
          <stop offset="50%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
        <linearGradient id="ft-brand-accent" x1="8" y1="16" x2="24" y2="16" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#34D399" />
        </linearGradient>
      </defs>

      {/* Squircle Background Container */}
      <rect width="32" height="32" rx="8" fill="url(#ft-brand-bg)" />

      {/* Geometric 'F' Glyph & Wealth Growth Pulse */}
      <rect x="7.5" y="7" width="3.5" height="18" rx="1.75" fill="#FFFFFF" />
      <path
        d="M9.25 7H20.75C22.5449 7 24 8.45507 24 10.25C24 12.0449 22.5449 13.5 20.75 13.5H9.25V7Z"
        fill="#FFFFFF"
      />
      <path
        d="M9.25 15.5H17.25C18.7688 15.5 20 16.7312 20 18.25C20 19.7688 18.7688 21 17.25 21H9.25V15.5Z"
        fill="url(#ft-brand-accent)"
      />
      <circle cx="20.75" cy="10.25" r="1.5" fill="#4F46E5" />
    </svg>
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
