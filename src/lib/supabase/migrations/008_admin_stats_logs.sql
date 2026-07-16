-- ============================================
-- Migration: Création des tables admin_stats et admin_counter_logs
-- ============================================

-- Table des statistiques admin (compteurs financiers)
CREATE TABLE IF NOT EXISTS admin_stats (
  id BIGINT PRIMARY KEY DEFAULT 1,
  total_commissions BIGINT DEFAULT 0,
  total_withdrawals BIGINT DEFAULT 0,
  total_deposits BIGINT DEFAULT 0,
  total_revenue BIGINT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Insérer la ligne par défaut si elle n'existe pas
INSERT INTO admin_stats (id, total_commissions, total_withdrawals, total_deposits, total_revenue)
VALUES (1, 0, 0, 0, 0)
ON CONFLICT (id) DO NOTHING;

-- Table des logs de remise à zéro
CREATE TABLE IF NOT EXISTS admin_counter_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  counter_type TEXT NOT NULL,
  previous_value BIGINT NOT NULL,
  new_value BIGINT NOT NULL,
  reset_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour le tri chronologique
CREATE INDEX IF NOT EXISTS idx_admin_counter_logs_created_at ON admin_counter_logs(created_at DESC);