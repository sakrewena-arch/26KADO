-- ============================================
-- 26KADO - Création des tables coupons & football_news
-- Exécutez ce script DANS L'ORDRE dans l'éditeur SQL Supabase
-- ============================================

-- ============================================
-- 1. TABLE COUPONS
-- ============================================
DROP TABLE IF EXISTS coupons CASCADE;

CREATE TABLE coupons (
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

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active coupons" ON coupons;
DROP POLICY IF EXISTS "Admins can manage coupons" ON coupons;

-- Tout le monde peut voir les coupons actifs
CREATE POLICY "Anyone can view active coupons"
  ON coupons FOR SELECT
  USING (is_active = true);

-- Les admins peuvent tout faire
CREATE POLICY "Admins can manage coupons"
  ON coupons FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role IN ('super_admin', 'admin', 'moderator')
    )
  );

-- ============================================
-- 2. TABLE FOOTBALL NEWS
-- ============================================
DROP TABLE IF EXISTS football_news CASCADE;

CREATE TABLE football_news (
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

ALTER TABLE football_news ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view published news" ON football_news;
DROP POLICY IF EXISTS "Admins can manage football_news" ON football_news;

-- Tout le monde peut voir les actualités publiées
CREATE POLICY "Anyone can view published news"
  ON football_news FOR SELECT
  USING (is_published = true);

-- Les admins peuvent tout faire
CREATE POLICY "Admins can manage football_news"
  ON football_news FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role IN ('super_admin', 'admin', 'moderator')
    )
  );