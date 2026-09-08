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
}

export function BannerCard({ banner, onDismiss }: BannerCardProps) {
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
        'relative overflow-hidden rounded-xl p-4 sm:p-5 border shadow-xs group transition-all',
        hasCustomBg
          ? 'border-zinc-700/60 text-white'
          : 'border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-[#121215] text-zinc-900 dark:text-zinc-100'
      )}
      style={hasCustomBg ? { background: banner.background_color || undefined } : undefined}
    >
      {/* Subtle top accent line if no custom gradient */}
      {!hasCustomBg && (
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500/60 via-purple-500/40 to-pink-500/30" />
      )}

      {/* Dismiss Button */}
      <button
        onClick={handleDismiss}
        className={cn(
          'absolute top-3 right-3 p-1 rounded-md transition-colors',
          hasCustomBg
            ? 'text-white/60 hover:text-white hover:bg-white/10'
            : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
        )}
        title="Dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            {banner.badge_text && (
              <Badge
                variant="outline"
                className={cn(
                  'text-[10px] py-0 h-4 font-bold tracking-wide uppercase',
                  hasCustomBg
                    ? 'bg-black/30 border-white/20 text-white'
                    : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-700 dark:text-indigo-400'
                )}
              >
                {banner.badge_text}
              </Badge>
            )}

            {/* Days remaining counter */}
            {daysRemaining !== null && (
              <span
                className={cn(
                  'text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 font-medium',
                  hasCustomBg
                    ? 'bg-white/15 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800'
                )}
              >
                <Clock className="h-3 w-3" />
                <span>{daysRemaining === 0 ? 'Last day' : `${daysRemaining} days left`}</span>
              </span>
            )}
          </div>

          <h4
            className={cn(
              'text-sm font-semibold tracking-tight',
              hasCustomBg ? 'text-white' : 'text-zinc-900 dark:text-zinc-100'
            )}
          >
            {banner.title}
          </h4>

          {banner.description && (
            <p
              className={cn(
                'text-xs font-normal leading-relaxed max-w-xl',
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
              'whitespace-nowrap text-xs font-semibold h-8 px-3 mt-1 sm:mt-0 shadow-xs',
              hasCustomBg
                ? 'bg-white text-zinc-950 hover:bg-zinc-100'
                : 'bg-zinc-900 text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200'
            )}
          >
            <span>{banner.button_text}</span>
            {banner.link_url?.startsWith('http') ? (
              <ExternalLink className="h-3 w-3 ml-1.5" />
            ) : (
              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
