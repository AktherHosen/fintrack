import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Banner } from '../../types/database';
import { useBanners } from '../../hooks/useBanners';
import { Sparkles, ArrowRight, X } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

interface BannerCardProps {
  banner: Banner;
  onDismiss?: () => void;
}

export function BannerCard({ banner, onDismiss }: BannerCardProps) {
  const navigate = useNavigate();
  const { recordImpression, recordClick, dismissBanner } = useBanners(banner.position);

  // Record impression on mount
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
    <div
      className="relative overflow-hidden rounded-2xl p-5 sm:p-6 border border-white/10 shadow-2xl transition-all duration-300 hover:shadow-emerald-500/10 group"
      style={{
        background: banner.background_color || 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
        color: banner.text_color || '#ffffff',
      }}
    >
      {/* Subtle Glow Overlay */}
      <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-white/5 blur-2xl pointer-events-none group-hover:bg-white/10 transition-colors" />

      {/* Dismiss Button */}
      <button
        onClick={handleDismiss}
        className="absolute top-3.5 right-3.5 p-1 rounded-lg bg-black/20 text-white/70 hover:text-white hover:bg-black/40 transition-colors z-10"
        title="Dismiss for 7 days"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
        <div className="flex-1 pr-6">
          <div className="flex items-center gap-2 mb-2">
            {banner.badge_text && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/20 text-white border border-white/30 backdrop-blur-md">
                {banner.badge_text}
              </span>
            )}
            <span className="text-xs uppercase font-bold tracking-wider opacity-75">
              {banner.type}
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-extrabold tracking-tight mb-1 text-white">
            {banner.title}
          </h3>
          {banner.description && (
            <p className="text-xs sm:text-sm text-slate-200/90 font-medium leading-relaxed max-w-2xl">
              {banner.description}
            </p>
          )}
        </div>

        {banner.button_text && (
          <Button
            onClick={handleAction}
            className="whitespace-nowrap bg-white text-slate-950 hover:bg-emerald-400 hover:text-slate-950 font-bold px-5 py-2.5 rounded-xl shadow-lg border-none transition-all flex items-center gap-2"
          >
            <span>{banner.button_text}</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
