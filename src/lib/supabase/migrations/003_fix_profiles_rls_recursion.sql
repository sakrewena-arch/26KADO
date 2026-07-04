-- ============================================
-- 26KADO - Correction de la récursion RLS sur profiles
-- ============================================

-- Supprimer les politiques problématiques qui déclenchent la récursion
DROP POLICY IF EXISTS "Anyone can view profiles public" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can do everything" ON profiles;
DROP POLICY IF EXISTS "Admins can do everything bookmakers" ON bookmakers;
DROP POLICY IF EXISTS "Admins can do everything affiliate_links" ON affiliate_links;
DROP POLICY IF EXISTS "Admins can do everything referrals" ON referrals;
DROP POLICY IF EXISTS "Admins can do everything commissions" ON commissions;
DROP POLICY IF EXISTS "Admins can do everything wallets" ON wallets;
DROP POLICY IF EXISTS "Admins can do everything uploads" ON uploads;
DROP POLICY IF EXISTS "Admins can do everything tickets" ON support_tickets;
DROP POLICY IF EXISTS "Admins can do everything settings" ON settings;

-- Fonction helper pour vérifier les droits admin sans déclencher la récursion RLS
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
      AND role IN ('super_admin', 'admin', 'moderator')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recréer les politiques de manière sûre
CREATE POLICY "Anyone can view profiles public"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can do everything"
  ON profiles FOR ALL
  USING (is_admin());

CREATE POLICY "Admins can do everything bookmakers"
  ON bookmakers FOR ALL
  USING (is_admin());

CREATE POLICY "Admins can do everything affiliate_links"
  ON affiliate_links FOR ALL
  USING (is_admin());

CREATE POLICY "Admins can do everything referrals"
  ON referrals FOR ALL
  USING (is_admin());

CREATE POLICY "Admins can do everything commissions"
  ON commissions FOR ALL
  USING (is_admin());

CREATE POLICY "Admins can do everything wallets"
  ON wallets FOR ALL
  USING (is_admin());

CREATE POLICY "Admins can do everything uploads"
  ON uploads FOR ALL
  USING (is_admin());

CREATE POLICY "Admins can do everything tickets"
  ON support_tickets FOR ALL
  USING (is_admin());

CREATE POLICY "Admins can do everything settings"
  ON settings FOR ALL
  USING (is_admin());
