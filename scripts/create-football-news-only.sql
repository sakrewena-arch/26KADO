-- ============================================
-- 26KADO - Création UNIQUEMENT de football_news
-- Exécutez ceci dans Supabase SQL Editor
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

-- Politique : tout le monde peut voir les actualités publiées (même sans auth)
CREATE POLICY "Anyone can view published news"
  ON football_news FOR SELECT
  USING (is_published = true);

-- Politique : les admins peuvent tout faire
CREATE POLICY "Admins can manage football_news"
  ON football_news FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role IN ('super_admin', 'admin', 'moderator')
    )
  );