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

  // Smooth circular progress timer with pause on hover
  useEffect(() => {
    if (banners.length === 0) return;

    if (banners.length === 1) {
      setProgress(100);
      return;
    }

    let startTime = Date.now();
    let animId: number;

    const tick = () => {
      if (!isHoveredRef.current) {
        const elapsed = Date.now() - startTime;
        const currentProgress = Math.min(100, (elapsed / ROTATION_DURATION_MS) * 100);
        progressRef.current = currentProgress;
        setProgress(currentProgress);

        if (elapsed >= ROTATION_DURATION_MS) {
          setCurrentIndex((prev) => (prev + 1) % banners.length);
          startTime = Date.now();
          progressRef.current = 0;
          setProgress(0);
        }
      } else {
        // Offset start time while paused so progress doesn't jump
        startTime = Date.now() - (progressRef.current / 100) * ROTATION_DURATION_MS;
      }
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [banners.length, currentIndex]);

  if (isLoading && banners.length === 0) {
    return (
      <div className="mb-3 sm:mb-6">
        <div className="h-14 sm:h-16 rounded-xl bg-zinc-100 dark:bg-zinc-900/50 animate-pulse border border-zinc-200 dark:border-zinc-800" />
      </div>
    );
  }

  const activeBanner = banners.length > 0 ? banners[currentIndex % banners.length] : null;

  return (
    <div
      className="relative mb-3 sm:mb-6 group/carousel"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header bar over banners */}
      <div className="flex items-center justify-between mb-1 sm:mb-1.5 px-0.5">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] sm:text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
            Sponsored Highlights
          </span>
        </div>

        <button
          onClick={() => setCreateBannerOpen(true)}
          className="flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors cursor-pointer"
        >
          <Megaphone className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          <span>Promote</span>
        </button>
      </div>

      {activeBanner ? (
        <div className="relative overflow-hidden rounded-xl">
          <BannerCard
            key={activeBanner.id}
            banner={activeBanner}
            progress={progress}
            totalBanners={banners.length}
            currentIndex={currentIndex % banners.length}
            onDismiss={() => {
              setCurrentIndex((prev) => (prev >= banners.length - 1 ? 0 : prev));
            }}
          />
        </div>
      ) : (
        <div
          onClick={() => setCreateBannerOpen(true)}
          className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 p-2.5 sm:p-4 text-center hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-center gap-1.5 text-[11px] sm:text-xs font-semibold text-zinc-700 dark:text-zinc-300 group-hover:text-indigo-500">
            <Megaphone className="h-3.5 w-3.5 text-indigo-500" />
            <span>Launch a banner promotion seen by all members</span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-zinc-500 mt-0.5">Starting at only ৳ 500 BDT for 3 days</p>
        </div>
      )}

      {/* Dot Indicators */}
      {banners.length > 1 && (
        <div className="flex items-center justify-center space-x-1.5 mt-2">
          {banners.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentIndex(idx);
                setProgress(0);
                progressRef.current = 0;
              }}
              className={`h-1 sm:h-1.5 rounded-full transition-all duration-300 ${
                idx === currentIndex % banners.length
                  ? 'w-4 sm:w-5 bg-indigo-600 dark:bg-indigo-400'
                  : 'w-1 sm:w-1.5 bg-zinc-300 dark:bg-zinc-700 hover:bg-zinc-500'
              }`}
              title={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
