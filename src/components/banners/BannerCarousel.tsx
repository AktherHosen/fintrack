import React, { useState, useEffect } from 'react';
import { useBanners } from '../../hooks/useBanners';
import { BannerCard } from './BannerCard';
import { BannerPosition } from '../../types/database';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface BannerCarouselProps {
  position?: BannerPosition;
}

export function BannerCarousel({ position = 'DASHBOARD' }: BannerCarouselProps) {
  const { banners, isLoading } = useBanners(position);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-rotate every 7 seconds
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [banners.length]);

  if (isLoading || banners.length === 0) return null;

  const currentBanner = banners[currentIndex % banners.length];

  return (
    <div className="relative mb-6">
      <div className="relative overflow-hidden rounded-2xl">
        <BannerCard
          key={currentBanner.id}
          banner={currentBanner}
          onDismiss={() => {
            setCurrentIndex((prev) => (prev >= banners.length - 1 ? 0 : prev));
          }}
        />
      </div>

      {/* Dot Indicators */}
      {banners.length > 1 && (
        <div className="flex items-center justify-center space-x-1.5 mt-2.5">
          {banners.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentIndex ? 'w-6 bg-emerald-400' : 'w-1.5 bg-slate-700 hover:bg-slate-500'
              }`}
              title={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
