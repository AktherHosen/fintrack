-- ==============================================================================
-- 004_banners_schema.sql
-- Banner Promotions & Engagement Tracking
-- ==============================================================================

-- 1. Banners Table
CREATE TABLE IF NOT EXISTS public.banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  link_url TEXT,
  button_text TEXT DEFAULT 'Learn More',
  type TEXT NOT NULL CHECK (type IN ('PROMOTIONAL', 'ANNOUNCEMENT', 'UPGRADE', 'FEATURE')),
  position TEXT NOT NULL DEFAULT 'DASHBOARD' CHECK (position IN ('DASHBOARD', 'TRANSACTIONS', 'ALL_PAGES', 'LOGIN')),
  target_audience TEXT NOT NULL DEFAULT 'ALL' CHECK (target_audience IN ('ALL', 'FREE_USERS', 'PRO_USERS', 'NEW_USERS', 'EXPIRING_SOON')),
  priority INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  max_impressions INT,
  max_clicks INT,
  background_color TEXT DEFAULT '#1e293b',
  text_color TEXT DEFAULT '#f8fafc',
  badge_text TEXT,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Banner Events (Impression, Click, Dismiss tracking)
CREATE TABLE IF NOT EXISTS public.banner_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  banner_id UUID NOT NULL REFERENCES public.banners(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('IMPRESSION', 'CLICK', 'DISMISS')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_banners_active ON public.banners(is_active, position, priority DESC);
CREATE INDEX IF NOT EXISTS idx_banners_audience ON public.banners(target_audience, is_active);
CREATE INDEX IF NOT EXISTS idx_banner_events_banner ON public.banner_events(banner_id, event_type);
CREATE INDEX IF NOT EXISTS idx_banner_events_user ON public.banner_events(user_id, created_at DESC);

-- RLS Policies for Banners
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- Everyone (including anonymous for LOGIN position) can read active banners
CREATE POLICY "banners_select_active" ON public.banners
  FOR SELECT USING (is_active = TRUE OR public.is_admin());

CREATE POLICY "banners_admin_all" ON public.banners
  FOR ALL USING (public.is_admin());

-- RLS Policies for Banner Events
ALTER TABLE public.banner_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "banner_events_insert" ON public.banner_events
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL OR public.is_admin());

CREATE POLICY "banner_events_select_admin" ON public.banner_events
  FOR SELECT USING (public.is_admin() OR auth.uid() = user_id);
