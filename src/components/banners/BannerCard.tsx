import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Banner } from '../../types/database';
import { useBanners } from '../../hooks/useBanners';
import { ArrowRight, X, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

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

  return (
    <div className="relative overflow-hidden rounded-xl p-4 sm:p-5 border border-zinc-800 bg-[#121215] shadow-xs group">
      {/* Subtle top accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500/60 via-teal-500/40 to-indigo-500/30" />

      {/* Dismiss Button */}
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 p-1 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
        title="Dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {banner.badge_text && (
              <Badge variant="outline" className="text-[10px] py-0 h-4 bg-zinc-900 border-zinc-700 text-zinc-300">
                {banner.badge_text}
              </Badge>
            )}
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
              {banner.type}
            </span>
          </div>
          <h4 className="text-sm font-semibold text-zinc-100 tracking-tight">
            {banner.title}
          </h4>
          {banner.description && (
            <p className="text-xs text-zinc-400 font-normal leading-relaxed max-w-xl">
              {banner.description}
            </p>
          )}
        </div>

        {banner.button_text && (
          <Button
            size="sm"
            onClick={handleAction}
            className="whitespace-nowrap text-xs font-semibold h-8 px-3 mt-1 sm:mt-0 bg-zinc-50 text-zinc-950 hover:bg-zinc-200 shadow-xs"
          >
            <span>{banner.button_text}</span>
            <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
