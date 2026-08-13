"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "@/lib/api-client";
import type { ActiveAdDto } from "@fintrack/shared";
import { cn } from "@/lib/utils";

const SLIDE_MS = 6000;

function isGifUrl(url: string): boolean {
  return /\.gif($|\?)/i.test(url);
}

export function AdBannerCarousel({ className }: { className?: string }) {
  const t = useTranslations("shell");
  const { data: ads = [] } = useQuery({
    queryKey: ["ads-active"],
    queryFn: () => api<ActiveAdDto[]>("/ads/active"),
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [ads.length]);

  useEffect(() => {
    if (ads.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % ads.length);
    }, SLIDE_MS);
    return () => clearInterval(timer);
  }, [ads.length]);

  if (ads.length === 0) return null;

  const ad = ads[index];
  const accent = ad.accentColor && /^#[0-9A-Fa-f]{6}$/.test(ad.accentColor) ? ad.accentColor : undefined;

  function goTo(next: number) {
    setIndex((next + ads.length) % ads.length);
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-card",
        className,
      )}
      role="region"
      aria-label="Sponsored"
    >
      <div className="relative h-14 w-full">
        {ad.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={ad.imageUrl}
            alt=""
            className={cn(
              "absolute inset-0 h-full w-full object-cover object-center",
              isGifUrl(ad.imageUrl) && "object-contain bg-muted/30",
            )}
          />
        ) : (
          <div
            className={cn("absolute inset-0", !accent && "bg-primary")}
            style={accent ? { backgroundColor: accent } : undefined}
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/10 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 z-[1] flex items-end justify-between gap-2 px-2 pb-1.5 pt-1">
          <div className="min-w-0 flex-1 leading-none text-white">
            <p className="truncate text-[11px] font-semibold">{ad.title}</p>
            {ad.subtitle ? (
              <p className="mt-0.5 truncate text-[9px] text-white/85">{ad.subtitle}</p>
            ) : null}
          </div>
          <a
            href={ad.targetUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="inline-flex h-[18px] shrink-0 items-center rounded-md bg-white px-1.5 text-[8px] font-semibold text-primary shadow-sm"
          >
            {t("visitNow")}
          </a>
        </div>
      </div>

      {ads.length > 1 ? (
        <>
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            className="absolute left-1.5 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/35 p-0.5 text-white backdrop-blur-sm"
            aria-label="Previous ad"
          >
            <ChevronLeft className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={() => goTo(index + 1)}
            className="absolute right-1.5 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/35 p-0.5 text-white backdrop-blur-sm"
            aria-label="Next ad"
          >
            <ChevronRight className="h-3 w-3" />
          </button>
          <div className="absolute right-2 top-1.5 z-10 flex gap-0.5">
            {ads.map((item, dotIndex) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setIndex(dotIndex)}
                className={cn(
                  "h-1 rounded-full transition-all",
                  dotIndex === index ? "w-2.5 bg-white" : "w-1 bg-white/50",
                )}
                aria-label={`Go to ad ${dotIndex + 1}`}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
