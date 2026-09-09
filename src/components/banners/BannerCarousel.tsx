import React, { useState, useEffect } from 'react';
import { useBanners } from '../../hooks/useBanners';
import { BannerCard } from './BannerCard';
import { BannerPosition } from '../../types/database';
import { useUIStore } from '../../stores/useUIStore';
import { Megaphone, ChevronLeft, ChevronRight } from 'lucide-react';

interface BannerCarouselProps {
  position?: BannerPosition;
}

export function BannerCarousel({ position = 'DASHBOARD' }: BannerCarouselProps) {
  const { banners, isLoading } = useBanners(position);
  const { setCreateBannerOpen } = useUIStore();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-rotate every 6 seconds if multiple banners
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [banners.length]);

  return (
    <div className="relative mb-6">
      {/* Header bar over banners */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
            Sponsored Highlights
          </span>
          {banners.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-mono">
              {currentIndex + 1}/{banners.length}
            </span>
          )}
        </div>

        <button
          onClick={() => setCreateBannerOpen(true)}
          className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors cursor-pointer"
        >
          <Megaphone className="h-3.5 w-3.5" />
          <span>Promote Here</span>
        </button>
      </div>

      {banners.length > 0 ? (
        <div className="relative overflow-hidden rounded-xl">
          <BannerCard
            key={banners[currentIndex % banners.length].id}
            banner={banners[currentIndex % banners.length]}
            onDismiss={() => {
              setCurrentIndex((prev) => (prev >= banners.length - 1 ? 0 : prev));
            }}
          />
        </div>
      ) : (
        <div
          onClick={() => setCreateBannerOpen(true)}
          className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 p-4 text-center hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 group-hover:text-indigo-500">
            <Megaphone className="h-4 w-4 text-indigo-500" />
            <span>Launch a banner promotion seen by all FinTrack members</span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-0.5">Starting at only ৳ 500 BDT for 3 days</p>
        </div>
      )}

      {/* Dot Indicators */}
      {banners.length > 1 && (
        <div className="flex items-center justify-center space-x-1.5 mt-2.5">
          {banners.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentIndex
                  ? 'w-5 bg-indigo-600 dark:bg-indigo-400'
                  : 'w-1.5 bg-zinc-300 dark:bg-zinc-700 hover:bg-zinc-500'
              }`}
              title={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
