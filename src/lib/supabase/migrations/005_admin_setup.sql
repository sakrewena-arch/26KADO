-- ============================================
-- 26KADO - Admin Setup
-- Création du compte admin via SQL
-- Executez ceci dans le SQL Editor de Supabase
-- ============================================

-- Créer l'utilisateur admin dans auth.users avec pgcrypto
-- Note: Le mot de passe sera hashé par pgcrypto
-- Email: admin@26kado.com
-- Password: Kado36912587

create extension if not exists pgcrypto;

do $$
declare
  admin_email text := 'admin@26kado.com';
  admin_password text := 'Kado36912587';
  admin_id uuid;
begin
  -- Vérifier si l'utilisateur existe déjà
  select id into admin_id
  from auth.users
  where lower(email) = lower(admin_email)
  limit 1;

  -- Créer l'utilisateur si inexistant
  if admin_id is null then
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      confirmation_sent_at, last_sign_in_at,
      raw_app_meta_data, raw_user_meta_data,
      is_super_admin, is_anonymous
    )
    values (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(), 'authenticated', 'authenticated',
      admin_email, crypt(admin_password, gen_salt('bf')),
      now(), now(), now(), now(), now(),
      '{}'::jsonb, '{"full_name":"Admin 26KADO"}'::jsonb,
      false, false
    )
    returning id into admin_id;

    raise notice '✅ Compte admin créé';
  else
    -- Mettre à jour le mot de passe si l'utilisateur existe
    update auth.users
    set encrypted_password = crypt(admin_password, gen_salt('bf')),
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        updated_at = now()
    where id = admin_id;

    raise notice '✅ Compte admin mis à jour';
  end if;

  -- Créer ou mettre à jour le profil
  insert into public.profiles (
    id, email, full_name, role, referral_code,
    total_commission, total_referrals, total_validations, total_clicks,
    is_active, created_at, updated_at
  )
  values (
    admin_id, admin_email, 'Admin 26KADO', 'super_admin',
    '26KADO-ADMIN',
    0, 0, 0, 0,
    true, now(), now()
  )
  on conflict (id) do update
  set email = excluded.email,
      full_name = excluded.full_name,
      role = excluded.role,
      is_active = excluded.is_active,
      updated_at = now();

  raise notice '✅ Profil admin créé/mis à jour';
end $$;

-- Admin RLS policies (utilisant is_admin() pour éviter la récursion)
CREATE POLICY "Admin full access profiles"
  ON profiles FOR ALL
  USING (is_admin());

CREATE POLICY "Admin view all uploads"
  ON uploads FOR SELECT
  USING (is_admin());

CREATE POLICY "Admin view all commissions"
  ON commissions FOR SELECT
  USING (is_admin());

CREATE POLICY "Admin view all withdrawals"
  ON withdrawal_requests FOR SELECT
  USING (is_admin());

CREATE POLICY "Admin view all tickets"
  ON support_tickets FOR SELECT
  USING (is_admin());

CREATE POLICY "Admin view all wallets"
  ON wallets FOR SELECT
  USING (is_admin());

CREATE POLICY "Admin view all transactions"
  ON wallet_transactions FOR SELECT
  USING (is_admin());

CREATE POLICY "Admin view all referrals"
  ON referrals FOR SELECT
  USING (is_admin());

CREATE POLICY "Admin view all notifications"
  ON notifications FOR SELECT
  USING (is_admin());

CREATE POLICY "Admin view all payments"
  ON payment_transactions FOR SELECT
  USING (is_admin());