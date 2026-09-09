import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Banner } from '../../types/database';
import { useBanners } from '../../hooks/useBanners';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';

interface BannerCardProps {
  banner: Banner;
  onDismiss?: () => void;
  progress?: number;
  totalBanners?: number;
  currentIndex?: number;
}

export function BannerCard({
  banner,
  onDismiss,
  progress = 100,
  totalBanners = 1,
  currentIndex = 0,
}: BannerCardProps) {
  const navigate = useNavigate();
  const { recordImpression, recordClick, dismissBanner } = useBanners(banner.position);

  useEffect(() => {
    recordImpression.mutate(banner.id);
  }, [banner.id]);

  const handleAction = () => {
    recordClick.mutate(banner.id);
    if (banner.link_url) {
      if (banner.link_url.startsWith('http')) {
        window.open(banner.link_url, '_blank');
      } else {
        navigate(banner.link_url);
      }
    }
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    dismissBanner(banner.id);
    if (onDismiss) onDismiss();
  };

  const hasCustomBg = Boolean(
    banner.background_color && banner.background_color.includes('gradient')
  );

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg p-2.5 sm:p-3 border shadow-xs transition-all duration-300',
        hasCustomBg
          ? 'border-zinc-700/60 text-white'
          : 'border-zinc-200/80 dark:border-zinc-800/80 bg-gradient-to-r from-white via-zinc-50/60 to-white dark:from-[#121215] dark:via-[#16161b] dark:to-[#121215] text-zinc-900 dark:text-zinc-100'
      )}
      style={hasCustomBg ? { background: banner.background_color || undefined } : undefined}
    >
      {/* Subtle top accent line */}
      {!hasCustomBg && (
        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-indigo-500/80 via-purple-500/70 to-pink-500/50" />
      )}

      {/* Top Corner Controls Bar: Micro Progress on Top-Left & Micro AD Badge on Top-Right */}
      <div className="flex items-center justify-between gap-2 mb-1">
        {/* Top Left: Micro Circular Progress Timer */}
        <div className="relative flex items-center justify-center w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" title="Ad countdown">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 24 24">
            <circle
              cx="12"
              cy="12"
              r="9.5"
              stroke="currentColor"
              strokeWidth="2.8"
              className={cn(
                'fill-none',
                hasCustomBg ? 'text-white/20' : 'text-zinc-200 dark:text-zinc-800'
              )}
            />
            <circle
              cx="12"
              cy="12"
              r="9.5"
              stroke="currentColor"
              strokeWidth="2.8"
              strokeDasharray="59.69"
              strokeDashoffset={
                59.69 * (1 - Math.min(100, Math.max(0, progress)) / 100)
              }
              strokeLinecap="round"
              className={cn(
                'fill-none transition-[stroke-dashoffset] duration-75 ease-linear',
                hasCustomBg ? 'text-white' : 'text-indigo-600 dark:text-indigo-400'
              )}
            />
          </svg>
        </div>

        {/* Top Right: Micro Glassmorphic AD Badge */}
        <Badge
          variant="outline"
          className={cn(
            'text-[7px] py-0 h-3 px-1 font-black tracking-widest uppercase rounded select-none leading-none shadow-none',
            hasCustomBg
              ? 'bg-white/20 border-white/30 text-white'
              : 'bg-zinc-900/10 dark:bg-white/10 border-zinc-900/15 dark:border-white/15 text-zinc-600 dark:text-zinc-300'
          )}
        >
          AD
        </Badge>
      </div>

      {/* Content Row: Title & Description on Left, CTA Action on Right */}
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-0.5 min-w-0 flex-1">
          <h4
            className={cn(
              'text-xs sm:text-[13px] font-bold tracking-tight truncate',
              hasCustomBg ? 'text-white' : 'text-zinc-900 dark:text-zinc-100'
            )}
          >
            {banner.title}
          </h4>

          {banner.description && (
            <p
              className={cn(
                'text-[10px] sm:text-[11px] truncate font-normal leading-tight max-w-2xl',
                hasCustomBg ? 'text-white/75' : 'text-zinc-500 dark:text-zinc-400'
              )}
            >
              {banner.description}
            </p>
          )}
        </div>

        {banner.button_text && (
          <Button
            size="sm"
            onClick={handleAction}
            className={cn(
              'h-6 sm:h-6.5 text-[10px] sm:text-[11px] font-bold px-2.5 sm:px-3 shadow-xs shrink-0 transition-all hover:scale-[1.02] active:scale-[0.98]',
              hasCustomBg
                ? 'bg-white text-zinc-950 hover:bg-zinc-100'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-indigo-500 dark:hover:bg-indigo-600'
            )}
          >
            <span>{banner.button_text}</span>
            {banner.link_url?.startsWith('http') ? (
              <ExternalLink className="h-2.5 w-2.5 ml-1" />
            ) : (
              <ArrowRight className="h-3 w-3 ml-1" />
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
