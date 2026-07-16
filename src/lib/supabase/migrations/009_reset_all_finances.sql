-- ============================================
-- RESET COMPLET DE TOUTES LES DONNÉES FINANCIÈRES
-- ============================================
-- ATTENTION : Ce script supprime TOUTES les données financières
-- et remet tous les compteurs à zéro.
-- À exécuter UNIQUEMENT dans le SQL Editor de Supabase.
-- ============================================

BEGIN;

-- 1. VIDER LES TRANSACTIONS WALLET
DELETE FROM wallet_transactions;

-- 2. RÉINITIALISER TOUS LES WALLETS (solde à 0)
UPDATE wallets SET
  balance = 0,
  total_earned = 0,
  total_withdrawn = 0;

-- 3. VIDER LES COMMISSIONS
DELETE FROM commissions;

-- 4. VIDER LES DEMANDES DE RETRAIT
DELETE FROM withdrawal_requests;

-- 5. VIDER LES DÉPÔTS (payment_transactions)
DELETE FROM payment_transactions;

-- 6. RÉINITIALISER LES PROFILS (total_commission, total_referrals, etc.)
UPDATE profiles SET
  total_commission = 0,
  total_referrals = 0,
  total_validations = 0,
  total_clicks = 0;

-- 7. VIDER LES UPLOADS (validations)
DELETE FROM uploads;

-- 8. RÉINITIALISER LES COMPTEURS ADMIN DANS settings
DELETE FROM settings WHERE key IN (
  'total_commissions',
  'total_withdrawals',
  'total_deposits',
  'total_revenue'
);

INSERT INTO settings (key, value, type) VALUES
  ('total_commissions', '0', 'number'),
  ('total_withdrawals', '0', 'number'),
  ('total_deposits', '0', 'number'),
  ('total_revenue', '0', 'number');

-- 9. VIDER LES LOGS DE RESET
DELETE FROM settings WHERE key LIKE 'log_%';

-- 10. VIDER LES NOTIFICATIONS
DELETE FROM notifications;

-- 11. VIDER LES REFERRALS (parrainages)
DELETE FROM referrals;

COMMIT;

-- ============================================
-- VÉRIFICATION
-- ============================================
SELECT 'Résultat du reset:' as info;
SELECT COUNT(*) as wallet_transactions_restantes FROM wallet_transactions;
SELECT SUM(balance) as solde_total_wallets FROM wallets;
SELECT COUNT(*) as commissions_restantes FROM commissions;
SELECT COUNT(*) as retraits_restants FROM withdrawal_requests;
SELECT COUNT(*) as uploads_restants FROM uploads;