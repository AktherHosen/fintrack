import React, { useState, useEffect, useRef } from 'react';
import { useBanners } from '../../hooks/useBanners';
import { BannerCard } from './BannerCard';
import { BannerPosition } from '../../types/database';
import { useUIStore } from '../../stores/useUIStore';
import { Megaphone } from 'lucide-react';

interface BannerCarouselProps {
  position?: BannerPosition;
}

const ROTATION_DURATION_MS = 6000;

export function BannerCarousel({ position = 'DASHBOARD' }: BannerCarouselProps) {
  const { banners, isLoading } = useBanners(position);
  const { setCreateBannerOpen } = useUIStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const progressRef = useRef(0);
  const isHoveredRef = useRef(false);

  useEffect(() => {
    isHoveredRef.current = isHovered;
  }, [isHovered]);

  // Smooth 50ms interval timer with pause on hover
  useEffect(() => {
    if (banners.length === 0) return;

    const intervalMs = 50;
    const step = (intervalMs / ROTATION_DURATION_MS) * 100;

    const timer = setInterval(() => {
      if (!isHoveredRef.current) {
        setProgress((prev) => {
          if (prev >= 100) {
            if (banners.length > 1) {
              setCurrentIndex((curr) => (curr + 1) % banners.length);
            }
            return 0;
          }
          return Math.min(100, prev + step);
        });
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [banners.length]);

  if (isLoading && banners.length === 0) {
    return (
      <div className="mb-3 sm:mb-6">
        <div className="h-14 sm:h-16 rounded-xl bg-zinc-100 dark:bg-zinc-900/50 animate-pulse border border-zinc-200 dark:border-zinc-800" />
      </div>
    );
  }

  if (banners.length === 0) {
    return (
      <div className="relative mb-2.5 sm:mb-4">
        {/* Mini Top bar */}
        <div className="flex items-center justify-between mb-1 px-0.5">
          <span className="text-[9px] sm:text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
            Sponsored
          </span>

          <button
            onClick={() => setCreateBannerOpen(true)}
            className="flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors cursor-pointer"
          >
            <Megaphone className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
            <span>Promote</span>
          </button>
        </div>

        {/* Fallback Promote Section Banner */}
        <div className="relative overflow-hidden rounded-lg border border-dashed border-indigo-300 dark:border-indigo-800/80 bg-gradient-to-r from-indigo-50/70 via-purple-50/40 to-indigo-50/70 dark:from-indigo-950/30 dark:via-purple-950/20 dark:to-indigo-950/30 p-2 sm:p-2.5 shadow-xs">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-[7px] py-0 px-1 font-black tracking-widest uppercase rounded bg-indigo-600/15 text-indigo-600 dark:bg-indigo-400/20 dark:text-indigo-400 border border-indigo-600/20">
                  PROMOTE
                </span>
                <h4 className="text-xs sm:text-[13px] font-bold text-zinc-900 dark:text-zinc-100 truncate">
                  Advertise Your Business Here
                </h4>
              </div>
              <p className="text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                Reach thousands of active finance users across the platform with your custom banner.
              </p>
            </div>

            <button
              onClick={() => setCreateBannerOpen(true)}
              className="shrink-0 h-6 sm:h-6.5 px-2.5 rounded-md text-[10px] sm:text-[11px] font-semibold bg-indigo-600 text-white hover:bg-indigo-500 transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
            >
              <Megaphone className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              <span>Promote Now</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const activeBanner = banners[currentIndex % banners.length];

  return (
    <div
      className="relative mb-2.5 sm:mb-4 group/carousel"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Mini Top bar */}
      <div className="flex items-center justify-between mb-1 px-0.5">
        <span className="text-[9px] sm:text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
          Sponsored
        </span>

        <button
          onClick={() => setCreateBannerOpen(true)}
          className="flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors cursor-pointer"
        >
          <Megaphone className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
          <span>Promote</span>
        </button>
      </div>

      <div className="relative overflow-hidden rounded-lg">
        <BannerCard
          key={activeBanner.id}
          banner={activeBanner}
          progress={progress}
          totalBanners={banners.length}
          currentIndex={currentIndex % banners.length}
          onDismiss={() => {
            setCurrentIndex(0);
          }}
        />
      </div>

      {/* Dot Indicators */}
      {banners.length > 1 && (
        <div className="flex items-center justify-center space-x-1 mt-1.5">
          {banners.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentIndex(idx);
                setProgress(0);
                progressRef.current = 0;
              }}
              className={`h-1 rounded-full transition-all duration-300 ${
                idx === currentIndex % banners.length
                  ? 'w-3.5 bg-indigo-600 dark:bg-indigo-400'
                  : 'w-1 bg-zinc-300 dark:bg-zinc-700 hover:bg-zinc-500'
              }`}
              title={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
