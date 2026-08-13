"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ImagePlus, Loader2, X } from "lucide-react";
import { uploadAdBanner } from "@/lib/upload-client";
import { AD_BANNER_ASPECT_CLASS, AD_BANNER_SPEC } from "@/lib/ad-banner-spec";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

export function BannerImageUpload({
  value,
  onChange,
  fieldError,
}: {
  value?: string;
  onChange: (url: string | undefined) => void;
  fieldError?: string;
}) {
  const t = useTranslations("ads");
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(file: File | null) {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const result = await uploadAdBanner(file);
      onChange(result.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("uploadError"));
      onChange(undefined);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const displayError = fieldError || error;

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
      />

      {value ? (
        <div
          className={cn(
            "rounded-lg border bg-muted/20 p-3",
            displayError && "border-destructive",
          )}
        >
          <div
            className={cn(
              "relative w-full min-h-14 overflow-hidden rounded-md border bg-muted/30",
              AD_BANNER_ASPECT_CLASS,
              "max-h-28",
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="" className="h-full w-full object-cover object-center" />
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="absolute right-2 top-2 h-8 w-8"
              onClick={() => onChange(undefined)}
              aria-label={t("removeImage")}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex w-full min-h-28 flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed bg-muted/20 px-4 py-6 text-sm text-muted-foreground transition-colors hover:bg-muted/40",
            uploading && "pointer-events-none opacity-70",
            displayError && "border-destructive",
          )}
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <ImagePlus className="h-5 w-5" />
          )}
          <span>{uploading ? t("uploading") : t("uploadImage")}</span>
          <span className="text-xs">{t("uploadHint", { size: AD_BANNER_SPEC.sizeLabel, ratio: AD_BANNER_SPEC.ratioLabel })}</span>
        </button>
      )}

      {!value && !uploading ? (
        <Button type="button" size="sm" variant="outline" onClick={() => inputRef.current?.click()}>
          {t("chooseFile")}
        </Button>
      ) : null}

      {displayError ? <p className="text-xs text-destructive">{displayError}</p> : null}
    </div>
  );
}
