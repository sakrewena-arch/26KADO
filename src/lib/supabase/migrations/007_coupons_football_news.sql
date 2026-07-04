-- ============================================
-- 26KADO - Migration: Coupons & Football News
-- ============================================

-- ============================================
-- COUPONS
-- ============================================
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_coupons_created ON coupons(created_at DESC);

-- ============================================
-- FOOTBALL NEWS
-- ============================================
CREATE TABLE IF NOT EXISTS football_news (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_football_news_published ON football_news(is_published);
CREATE INDEX IF NOT EXISTS idx_football_news_created ON football_news(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE football_news ENABLE ROW LEVEL SECURITY;

-- Public can view active coupons
DROP POLICY IF EXISTS "Anyone can view active coupons" ON coupons;
CREATE POLICY "Anyone can view active coupons"
  ON coupons FOR SELECT
  USING (is_active = true OR is_admin());

-- Public can view published news
DROP POLICY IF EXISTS "Anyone can view published news" ON football_news;
CREATE POLICY "Anyone can view published news"
  ON football_news FOR SELECT
  USING (is_published = true OR is_admin());

-- Admins can do everything
DROP POLICY IF EXISTS "Admins can manage coupons" ON coupons;
CREATE POLICY "Admins can manage coupons"
  ON coupons FOR ALL
  USING (is_admin());

DROP POLICY IF EXISTS "Admins can manage football_news" ON football_news;
CREATE POLICY "Admins can manage football_news"
  ON football_news FOR ALL
  USING (is_admin());
