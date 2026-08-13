"use client";

import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api-client";
import type { ActiveAdDto } from "@fintrack/shared";
import { AD_BANNER_ASPECT_CLASS } from "@/lib/ad-banner-spec";
import { cn } from "@/lib/utils";

const SLIDE_MS = 9000;
const PROGRESS_DELAY_MS = 750;

function isGifUrl(url: string): boolean {
  return /\.gif($|\?)/i.test(url);
}

function parseAccent(accent: string | null): string | undefined {
  return accent && /^#[0-9A-Fa-f]{6}$/.test(accent) ? accent : undefined;
}

function AdProgressRing({ progress }: { progress: number }) {
  const radius = 5;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(Math.max(progress, 0), 1));

  return (
    <span
      className="inline-flex h-[18px] w-[18px] items-center justify-center rounded-md bg-black/35 backdrop-blur-sm ring-1 ring-white/10"
      aria-hidden
    >
      <svg className="h-3 w-3 -rotate-90" viewBox="0 0 12 12">
        <circle
          cx="6"
          cy="6"
          r={radius}
          fill="none"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
    </span>
  );
}

function AdSlide({
  ad,
  visitLabel,
  isActive,
}: {
  ad: ActiveAdDto;
  visitLabel: string;
  isActive: boolean;
}) {
  const accent = parseAccent(ad.accentColor);

  return (
    <div
      className={cn(
        "absolute inset-0 transition-opacity duration-700 ease-out",
        isActive ? "z-[1] opacity-100" : "z-0 opacity-0",
      )}
      aria-hidden={!isActive}
    >
      {ad.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={ad.imageUrl}
          alt=""
          className={cn(
            "absolute inset-0 h-full w-full object-cover object-center",
            isGifUrl(ad.imageUrl) && "bg-muted/30 object-contain",
          )}
        />
      ) : (
        <div
          className={cn("absolute inset-0", !accent && "bg-primary")}
          style={accent ? { backgroundColor: accent } : undefined}
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-black/10" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/15" />

      <div className="absolute bottom-0 left-0 right-0 z-[2] flex items-end justify-between gap-2.5 px-3 pb-2.5 pt-6">
        <div className="min-w-0 flex-1 leading-tight text-white">
          <p className="truncate text-xs font-semibold tracking-tight drop-shadow-sm">{ad.title}</p>
          {ad.subtitle ? (
            <p className="mt-0.5 truncate text-[10px] text-white/80 drop-shadow-sm">{ad.subtitle}</p>
          ) : null}
        </div>
        <a
          href={ad.targetUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          tabIndex={isActive ? 0 : -1}
          className={cn(
            "inline-flex h-7 min-w-[5.25rem] shrink-0 items-center justify-center",
            "rounded-lg bg-white px-3 text-center text-[10px] font-semibold leading-none text-primary",
            "shadow-md ring-1 ring-white/40 transition-transform active:scale-[0.98]",
          )}
        >
          {visitLabel}
        </a>
      </div>
    </div>
  );
}

export function AdBannerCarousel({ className }: { className?: string }) {
  const t = useTranslations("shell");
  const { data: ads = [], isLoading } = useQuery({
    queryKey: ["ads-active"],
    queryFn: () => api<ActiveAdDto[]>("/ads/active"),
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    setIndex(0);
    setProgress(0);
  }, [ads.length]);

  const goTo = useCallback(
    (next: number) => {
      setIndex((next + ads.length) % ads.length);
      setProgress(0);
    },
    [ads.length],
  );

  useEffect(() => {
    if (ads.length <= 1 || paused) return;

    setProgress(0);
    let frame = 0;
    let delayTimer: ReturnType<typeof setTimeout> | undefined;
    let startTime = 0;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const nextProgress = Math.min(elapsed / SLIDE_MS, 1);
      setProgress(nextProgress);

      if (nextProgress >= 1) {
        setIndex((current) => (current + 1) % ads.length);
        return;
      }

      frame = requestAnimationFrame(tick);
    };

    delayTimer = setTimeout(() => {
      startTime = performance.now();
      frame = requestAnimationFrame(tick);
    }, PROGRESS_DELAY_MS);

    return () => {
      if (delayTimer) clearTimeout(delayTimer);
      cancelAnimationFrame(frame);
    };
  }, [index, ads.length, paused]);

  if (isLoading) {
    return (
      <div
        className={cn(
          "relative w-full min-h-14 animate-pulse overflow-hidden rounded-2xl bg-muted",
          AD_BANNER_ASPECT_CLASS,
          className,
        )}
        aria-hidden
      />
    );
  }

  if (ads.length === 0) return null;

  const showControls = ads.length > 1;

  return (
    <div
      className={cn(
        "group relative w-full min-h-14 overflow-hidden rounded-2xl border border-border/60 bg-card text-card-foreground shadow-card",
        AD_BANNER_ASPECT_CLASS,
        className,
      )}
      role="region"
      aria-label="Sponsored"
      aria-live="polite"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="absolute inset-0">
        {ads.map((item, slideIndex) => (
          <AdSlide
            key={item.id}
            ad={item}
            visitLabel={t("visitNow")}
            isActive={slideIndex === index}
          />
        ))}

        <div className="pointer-events-none absolute inset-0 z-[3]">
          {showControls ? (
            <span className="absolute left-2 top-2">
              <AdProgressRing progress={progress} />
            </span>
          ) : null}

          <span className="absolute right-2 top-2 inline-flex h-[18px] items-center rounded-md bg-black/35 px-1.5 text-[8px] font-medium uppercase tracking-wider text-white/90 backdrop-blur-sm ring-1 ring-white/10">
            Ad
          </span>

          {showControls ? (
            <div className="pointer-events-auto absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1 rounded-full bg-black/30 px-1.5 py-1 backdrop-blur-sm">
              {ads.map((item, dotIndex) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => goTo(dotIndex)}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    dotIndex === index ? "w-4 bg-white" : "w-1.5 bg-white/45 hover:bg-white/70",
                  )}
                  aria-label={`Go to ad ${dotIndex + 1}`}
                  aria-current={dotIndex === index ? "true" : undefined}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
