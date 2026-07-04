-- ============================================
-- 26KADO - SOLUTION FINALE ADMIN
-- Exécute TOUT ce bloc dans SQL Editor
-- ============================================

-- ÉTAPE 1 : Désactiver RLS sur profiles temporairement
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- ÉTAPE 2 : Supprimer les politiques récursives
DROP POLICY IF EXISTS "Admin full access profiles" ON profiles;
DROP POLICY IF EXISTS "Admin view all uploads" ON uploads;
DROP POLICY IF EXISTS "Admin view all commissions" ON commissions;
DROP POLICY IF EXISTS "Admin view all withdrawals" ON withdrawal_requests;
DROP POLICY IF EXISTS "Admin view all tickets" ON support_tickets;
DROP POLICY IF EXISTS "Admin view all wallets" ON wallets;
DROP POLICY IF EXISTS "Admin view all transactions" ON wallet_transactions;
DROP POLICY IF EXISTS "Admin view all referrals" ON referrals;
DROP POLICY IF EXISTS "Admin view all notifications" ON notifications;
DROP POLICY IF EXISTS "Admin view all payments" ON payment_transactions;

-- ÉTAPE 3 : Créer la fonction is_admin() avec SECURITY DEFINER
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('super_admin', 'admin', 'moderator')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ÉTAPE 4 : Supprimer l'ancien profil s'il existe (pour repartir à zéro)
DELETE FROM public.wallets WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'wlagbema@gmail.com');
DELETE FROM public.profiles WHERE email = 'wlagbema@gmail.com';

-- ÉTAPE 5 : Créer le profil admin (RLS désactivé donc pas de blocage)
INSERT INTO public.profiles (
  id, email, full_name, role, referral_code,
  total_commission, total_referrals, total_validations, total_clicks,
  is_active, created_at, updated_at
)
SELECT 
  id, 'wlagbema@gmail.com', 'Administrateur 26KADO', 'super_admin',
  '26KADO-ADMIN', 0, 0, 0, 0, true, now(), now()
FROM auth.users 
WHERE email = 'wlagbema@gmail.com';

-- ÉTAPE 6 : Créer le wallet
INSERT INTO public.wallets (user_id)
SELECT id FROM auth.users WHERE email = 'wlagbema@gmail.com'
ON CONFLICT (user_id) DO NOTHING;

-- ÉTAPE 7 : Réactiver RLS sur profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ÉTAPE 8 : Recréer les politiques (avec is_admin() qui fonctionne maintenant)
CREATE POLICY "Admin full access profiles" ON profiles FOR ALL USING (is_admin());
CREATE POLICY "Admin view all uploads" ON uploads FOR SELECT USING (is_admin());
CREATE POLICY "Admin view all commissions" ON commissions FOR SELECT USING (is_admin());
CREATE POLICY "Admin view all withdrawals" ON withdrawal_requests FOR SELECT USING (is_admin());
CREATE POLICY "Admin view all tickets" ON support_tickets FOR SELECT USING (is_admin());
CREATE POLICY "Admin view all wallets" ON wallets FOR SELECT USING (is_admin());
CREATE POLICY "Admin view all transactions" ON wallet_transactions FOR SELECT USING (is_admin());
CREATE POLICY "Admin view all referrals" ON referrals FOR SELECT USING (is_admin());
CREATE POLICY "Admin view all notifications" ON notifications FOR SELECT USING (is_admin());
CREATE POLICY "Admin view all payments" ON payment_transactions FOR SELECT USING (is_admin());

-- VÉRIFICATION FINALE
SELECT p.email, p.role, p.full_name, p.is_active 
FROM public.profiles p 
WHERE p.email = 'wlagbema@gmail.com';