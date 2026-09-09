import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Banner } from '../../types/database';
import { useBanners } from '../../hooks/useBanners';
import { ArrowRight, X, Clock, ExternalLink } from 'lucide-react';
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

  // Calculate days remaining
  const daysRemaining = banner.expires_at
    ? Math.max(
        0,
        Math.ceil((new Date(banner.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      )
    : null;

  const hasCustomBg = Boolean(
    banner.background_color && banner.background_color.includes('gradient')
  );

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl p-3 sm:p-4 border shadow-xs transition-all duration-300',
        hasCustomBg
          ? 'border-zinc-700/60 text-white'
          : 'border-zinc-200/80 dark:border-zinc-800/80 bg-gradient-to-r from-white via-zinc-50/50 to-white dark:from-[#121215] dark:via-[#16161c] dark:to-[#121215] text-zinc-900 dark:text-zinc-100 shadow-[0_2px_10px_rgba(0,0,0,0.03)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.3)]'
      )}
      style={hasCustomBg ? { background: banner.background_color || undefined } : undefined}
    >
      {/* Subtle top accent gradient line */}
      {!hasCustomBg && (
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 via-purple-500/80 to-pink-500/60" />
      )}

      {/* Top Controls Bar: Clean Circular Progress on Top-Left & Glassmorphic AD Badge + Dismiss on Top-Right */}
      <div className="flex items-center justify-between gap-2 mb-2">
        {/* Top Left: Clean Circular Loading Progress Ring */}
        <div className="flex items-center gap-1.5" title="Ad rotation countdown">
          <div className="relative flex items-center justify-center w-3.5 h-3.5 sm:w-4 sm:h-4">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 24 24">
              <circle
                cx="12"
                cy="12"
                r="9.5"
                stroke="currentColor"
                strokeWidth="2"
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
                strokeWidth="2"
                strokeDasharray={2 * Math.PI * 9.5}
                strokeDashoffset={
                  2 * Math.PI * 9.5 * (1 - Math.min(100, Math.max(0, progress)) / 100)
                }
                strokeLinecap="round"
                className={cn(
                  'fill-none transition-all duration-75 ease-linear',
                  hasCustomBg ? 'text-white' : 'text-indigo-600 dark:text-indigo-400'
                )}
              />
            </svg>
          </div>

          {totalBanners > 1 && (
            <span
              className={cn(
                'text-[9px] sm:text-[10px] font-mono font-medium tracking-tight',
                hasCustomBg ? 'text-white/70' : 'text-zinc-400 dark:text-zinc-500'
              )}
            >
              {currentIndex + 1}/{totalBanners}
            </span>
          )}

          {banner.badge_text && (
            <Badge
              variant="outline"
              className={cn(
                'text-[8px] sm:text-[9px] py-0 h-4 font-bold tracking-wider uppercase px-1.5 ml-1',
                hasCustomBg
                  ? 'bg-black/30 border-white/25 text-white'
                  : 'bg-indigo-500/10 border-indigo-500/25 text-indigo-700 dark:text-indigo-300'
              )}
            >
              {banner.badge_text}
            </Badge>
          )}

          {daysRemaining !== null && (
            <span
              className={cn(
                'text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1 font-medium',
                hasCustomBg
                  ? 'bg-white/15 text-white'
                  : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800'
              )}
            >
              <Clock className="h-2.5 w-2.5" />
              <span>{daysRemaining === 0 ? 'Last day' : `${daysRemaining}d left`}</span>
            </span>
          )}
        </div>

        {/* Top Right: Glassmorphic AD Badge & Dismiss Button */}
        <div className="flex items-center gap-1.5">
          {/* Glassmorphic shadcn Badge */}
          <Badge
            variant="outline"
            className={cn(
              'text-[8px] sm:text-[9px] py-0 h-4 px-1.5 font-extrabold tracking-wider uppercase rounded-full select-none shadow-xs backdrop-blur-md',
              hasCustomBg
                ? 'bg-white/20 border-white/30 text-white'
                : 'bg-zinc-900/10 dark:bg-white/10 border-zinc-900/15 dark:border-white/15 text-zinc-800 dark:text-zinc-200'
            )}
          >
            AD
          </Badge>

          {/* Dismiss Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className={cn(
              'h-5 w-5 p-0 rounded-full cursor-pointer transition-colors',
              hasCustomBg
                ? 'text-white/70 hover:text-white hover:bg-white/20'
                : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            )}
            title="Dismiss ad"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Main Content & CTA Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
        <div className="space-y-0.5 min-w-0 flex-1">
          <h4
            className={cn(
              'text-[12px] sm:text-sm font-bold tracking-tight truncate',
              hasCustomBg ? 'text-white' : 'text-zinc-900 dark:text-zinc-100'
            )}
          >
            {banner.title}
          </h4>

          {banner.description && (
            <p
              className={cn(
                'text-[10px] sm:text-xs font-normal leading-relaxed line-clamp-1 sm:line-clamp-2 max-w-2xl',
                hasCustomBg ? 'text-white/80' : 'text-zinc-600 dark:text-zinc-400'
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
              'self-start sm:self-auto whitespace-nowrap text-[11px] sm:text-xs font-bold h-7 sm:h-8 px-3 sm:px-4 shadow-sm shrink-0 transition-all hover:scale-[1.02] active:scale-[0.98]',
              hasCustomBg
                ? 'bg-white text-zinc-950 hover:bg-zinc-100 shadow-black/20'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-indigo-500 dark:hover:bg-indigo-600 shadow-indigo-500/20'
            )}
          >
            <span>{banner.button_text}</span>
            {banner.link_url?.startsWith('http') ? (
              <ExternalLink className="h-3 w-3 ml-1" />
            ) : (
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
