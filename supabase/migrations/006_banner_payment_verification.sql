-- ==============================================================================
-- 006_banner_payment_verification.sql
-- Payment verification fields for Banner Promotions
-- ==============================================================================

-- Add payment verification tracking columns
ALTER TABLE public.banners
  ADD COLUMN IF NOT EXISTS payment_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_verified_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS payment_rejection_reason TEXT;

-- Update the default payment_status to PENDING (was APPROVED before)
-- New banner submissions should always start as PENDING until verified
ALTER TABLE public.banners
  ALTER COLUMN payment_status SET DEFAULT 'PENDING';

-- Index for filtering banners by payment status (admin panel)
CREATE INDEX IF NOT EXISTS idx_banners_payment_status ON public.banners(payment_status);
