-- ==============================================================================
-- 007_banner_title_nullable.sql
-- Allow image-only banners without a title
-- ==============================================================================

-- Make title nullable so image-only banners are valid
ALTER TABLE public.banners
  ALTER COLUMN title DROP NOT NULL;

-- Update TypeScript type to match
