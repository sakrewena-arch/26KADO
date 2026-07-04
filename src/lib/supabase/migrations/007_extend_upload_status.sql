-- ============================================
-- 26KADO - Étendre les statuts des uploads
-- Ajout de "info_requested" et "archived"
-- ============================================

-- Récupérer la contrainte CHECK existante et la remplacer
ALTER TABLE uploads DROP CONSTRAINT IF EXISTS uploads_status_check;

ALTER TABLE uploads ADD CONSTRAINT uploads_status_check 
  CHECK (status IN ('pending', 'validated', 'rejected', 'info_requested', 'archived'));