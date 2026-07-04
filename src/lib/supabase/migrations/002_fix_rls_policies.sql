-- ============================================
-- 26KADO - Correction des politiques RLS
-- Permettre la lecture publique du leaderboard
-- ============================================

-- Permettre à tout le monde de voir le classement
CREATE POLICY IF NOT EXISTS "Anyone can view leaderboard"
  ON leaderboard FOR SELECT
  USING (true);

-- Permettre à tout le monde de voir les bookmakers actifs
CREATE POLICY IF NOT EXISTS "Anyone can view profiles public"
  ON profiles FOR SELECT
  USING (true);

-- Permettre la lecture des notifications sans auth
CREATE POLICY IF NOT EXISTS "Anyone can view notifications"
  ON notifications FOR SELECT
  USING (true);

-- Permettre la lecture des settings sans auth
CREATE POLICY IF NOT EXISTS "Anyone can view settings"
  ON settings FOR SELECT
  USING (true);

-- Permettre la lecture des resources sans auth
CREATE POLICY IF NOT EXISTS "Anyone can view resources"
  ON resources FOR SELECT
  USING (true);

-- Permettre la lecture des faqs sans auth
CREATE POLICY IF NOT EXISTS "Anyone can view faqs"
  ON faqs FOR SELECT
  USING (true);

-- Permettre la lecture des faq_categories sans auth
CREATE POLICY IF NOT EXISTS "Anyone can view faq_categories"
  ON faq_categories FOR SELECT
  USING (true);