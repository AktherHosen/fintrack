"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { api } from "@/lib/api-client";
import type { ActiveAdDto } from "@fintrack/shared";
import { cn } from "@/lib/utils";

const SLIDE_MS = 6000;

function linkLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Visit";
  }
}

export function AdBannerCarousel() {
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
    <div className="relative w-full border-b" role="region" aria-label="Sponsored">
      <a
        href={ad.targetUrl}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="relative block h-16 w-full overflow-hidden sm:h-[4.5rem]"
      >
        {ad.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={ad.imageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
        ) : (
          <div
            className={cn("absolute inset-0", !accent && "bg-primary")}
            style={accent ? { backgroundColor: accent } : undefined}
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

        <div className="absolute bottom-0 right-0 z-[1] max-w-[78%] p-1.5 pl-10 text-right text-white">
          <div className="flex flex-col items-end gap-0.5 leading-none">
            <p className="truncate text-[11px] font-semibold sm:text-xs">{ad.title}</p>
            {ad.subtitle ? (
              <p className="truncate text-[10px] text-white/90">{ad.subtitle}</p>
            ) : null}
            <span className="inline-flex items-center gap-0.5 text-[10px] text-white/85">
              {linkLabel(ad.targetUrl)}
              <ExternalLink className="h-2.5 w-2.5 shrink-0" aria-hidden />
            </span>
          </div>
        </div>
      </a>

      {ads.length > 1 ? (
        <>
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              goTo(index - 1);
            }}
            className="absolute left-1 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/40 p-1.5 text-white opacity-80 backdrop-blur-sm hover:opacity-100"
            aria-label="Previous ad"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              goTo(index + 1);
            }}
            className="absolute right-1 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/40 p-1.5 text-white opacity-80 backdrop-blur-sm hover:opacity-100"
            aria-label="Next ad"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="absolute bottom-1 left-1/2 z-10 flex -translate-x-1/2 gap-1">
            {ads.map((item, dotIndex) => (
              <button
                key={item.id}
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setIndex(dotIndex);
                }}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  dotIndex === index ? "w-4 bg-white" : "w-1.5 bg-white/50",
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
