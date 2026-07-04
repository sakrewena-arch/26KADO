-- ============================================
-- 26KADO - Migration Initiale
-- Schema complet de la base de données
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('super_admin', 'admin', 'moderator', 'user')),
  referral_code TEXT UNIQUE NOT NULL,
  referred_by UUID REFERENCES profiles(id),
  level_id UUID,
  badge_id UUID,
  total_commission DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_referrals INTEGER NOT NULL DEFAULT 0,
  total_validations INTEGER NOT NULL DEFAULT 0,
  total_clicks INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_referral_code ON profiles(referral_code);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_referred_by ON profiles(referred_by);

-- ============================================
-- BOOKMAKERS
-- ============================================
CREATE TABLE bookmakers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT NOT NULL,
  color TEXT NOT NULL,
  description TEXT NOT NULL,
  bonus TEXT NOT NULL,
  promo_code TEXT NOT NULL DEFAULT '26KADO',
  advantages TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- AFFILIATE LINKS
-- ============================================
CREATE TABLE affiliate_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bookmaker_id UUID NOT NULL REFERENCES bookmakers(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_affiliate_links_bookmaker ON affiliate_links(bookmaker_id);

-- ============================================
-- REFERRALS
-- ============================================
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  commission_rate DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  total_commission_generated DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_commission_earned DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(referrer_id, referred_id)
);

CREATE INDEX idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX idx_referrals_referred ON referrals(referred_id);

-- ============================================
-- COMMISSIONS
-- ============================================
CREATE TABLE commissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  bookmaker_id UUID NOT NULL REFERENCES bookmakers(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'validated', 'paid', 'rejected')),
  referral_id UUID REFERENCES referrals(id),
  validation_id UUID,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_commissions_user ON commissions(user_id);
CREATE INDEX idx_commissions_status ON commissions(status);
CREATE INDEX idx_commissions_created ON commissions(created_at DESC);

-- ============================================
-- WALLETS
-- ============================================
CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  balance DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_earned DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_withdrawn DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- WALLET TRANSACTIONS
-- ============================================
CREATE TABLE wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
  amount DECIMAL(12,2) NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('commission', 'referral', 'bonus', 'withdrawal', 'deposit', 'payment')),
  description TEXT NOT NULL,
  reference_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wallet_transactions_wallet ON wallet_transactions(wallet_id);
CREATE INDEX idx_wallet_transactions_created ON wallet_transactions(created_at DESC);

-- ============================================
-- WITHDRAWAL REQUESTS
-- ============================================
CREATE TABLE withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  method TEXT NOT NULL,
  account_info TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'validated', 'paid', 'rejected')),
  admin_id UUID REFERENCES profiles(id),
  admin_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_withdrawal_requests_user ON withdrawal_requests(user_id);
CREATE INDEX idx_withdrawal_requests_status ON withdrawal_requests(status);

-- ============================================
-- PAYMENT TRANSACTIONS
-- ============================================
CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'commission_payment')),
  method TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  paydunya_token TEXT,
  paydunya_response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payment_transactions_user ON payment_transactions(user_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);

-- ============================================
-- BADGES
-- ============================================
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('bronze', 'silver', 'gold', 'platinum', 'diamond')),
  icon TEXT NOT NULL,
  description TEXT NOT NULL,
  min_commission DECIMAL(12,2) NOT NULL DEFAULT 0,
  color TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- USER BADGES
-- ============================================
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

CREATE INDEX idx_user_badges_user ON user_badges(user_id);

-- ============================================
-- LEVELS
-- ============================================
CREATE TABLE levels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  min_commission DECIMAL(12,2) NOT NULL DEFAULT 0,
  max_commission DECIMAL(12,2) NOT NULL DEFAULT 999999,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- SUPPORT TICKETS
-- ============================================
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  category TEXT NOT NULL,
  admin_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_support_tickets_user ON support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);

-- ============================================
-- TICKET MESSAGES
-- ============================================
CREATE TABLE ticket_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  attachments TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ticket_messages_ticket ON ticket_messages(ticket_id);

-- ============================================
-- NOTIFICATIONS
-- ============================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('commission', 'validation', 'payment', 'referral', 'badge', 'level', 'announcement', 'withdrawal', 'ticket')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- ============================================
-- UPLOADS (Validations)
-- ============================================
CREATE TABLE uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  bookmaker_id UUID NOT NULL REFERENCES bookmakers(id) ON DELETE CASCADE,
  bookmaker_user_id TEXT NOT NULL,
  deposit_amount DECIMAL(12,2) NOT NULL,
  deposit_date DATE NOT NULL,
  comments TEXT,
  images TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'validated', 'rejected', 'info_requested')),
  commission_amount DECIMAL(12,2),
  admin_id UUID REFERENCES profiles(id),
  admin_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_uploads_user ON uploads(user_id);
CREATE INDEX idx_uploads_status ON uploads(status);
CREATE INDEX idx_uploads_created ON uploads(created_at DESC);

-- ============================================
-- FAQ CATEGORIES
-- ============================================
CREATE TABLE faq_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- FAQS
-- ============================================
CREATE TABLE faqs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES faq_categories(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_faqs_category ON faqs(category_id);

-- ============================================
-- RESOURCES
-- ============================================
CREATE TABLE resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('banner', 'image', 'text', 'ad', 'video')),
  file_url TEXT,
  content TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- WHATSAPP LINKS
-- ============================================
CREATE TABLE whatsapp_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  url TEXT NOT NULL,
  label TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- LEADERBOARD
-- ============================================
CREATE TABLE leaderboard (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  period TEXT NOT NULL CHECK (period IN ('weekly', 'monthly', 'all_time')),
  total_commission DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_referrals INTEGER NOT NULL DEFAULT 0,
  rank INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, period)
);

CREATE INDEX idx_leaderboard_period_rank ON leaderboard(period, rank);

-- ============================================
-- REWARD PROGRAMS
-- ============================================
CREATE TABLE reward_programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  min_volume DECIMAL(12,2) NOT NULL DEFAULT 0,
  max_volume DECIMAL(12,2) NOT NULL DEFAULT 999999,
  reward_type TEXT NOT NULL CHECK (reward_type IN ('bonus', 'badge', 'gift', 'cash')),
  reward_value DECIMAL(12,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- ADMIN LOGS
-- ============================================
CREATE TABLE admin_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_admin_logs_admin ON admin_logs(admin_id);
CREATE INDEX idx_admin_logs_created ON admin_logs(created_at DESC);

-- ============================================
-- SETTINGS
-- ============================================
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  type TEXT NOT NULL DEFAULT 'string' CHECK (type IN ('string', 'number', 'boolean', 'json')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- TRIGGERS & FUNCTIONS
-- ============================================

-- Function: Generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  code TEXT;
  done BOOLEAN;
BEGIN
  done := false;
  WHILE NOT done LOOP
    code := '26KADO-';
    FOR i IN 1..6 LOOP
      code := code || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE referral_code = code) THEN
      done := true;
    END IF;
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function: Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  ref_code TEXT;
  ref_by UUID;
BEGIN
  -- Generate referral code
  ref_code := generate_referral_code();

  -- Check if referred by someone
  IF NEW.raw_user_meta_data->>'referral_code' IS NOT NULL THEN
    SELECT id INTO ref_by FROM profiles WHERE referral_code = NEW.raw_user_meta_data->>'referral_code';
  END IF;

  -- Create profile
  INSERT INTO public.profiles (id, email, full_name, referral_code, referred_by, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    ref_code,
    ref_by,
    NEW.raw_user_meta_data->>'avatar_url'
  );

  -- Create wallet
  INSERT INTO public.wallets (user_id) VALUES (NEW.id);

  -- Create referral relationship
  IF ref_by IS NOT NULL THEN
    INSERT INTO public.referrals (referrer_id, referred_id)
    VALUES (ref_by, NEW.id);
    UPDATE profiles SET total_referrals = total_referrals + 1 WHERE id = ref_by;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Auto-create profile on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Function: Credit commission and handle referral bonus
CREATE OR REPLACE FUNCTION handle_commission_validated()
RETURNS TRIGGER AS $$
DECLARE
  referrer_id UUID;
  referral_commission DECIMAL(12,2);
  wallet_id UUID;
  ref_wallet_id UUID;
BEGIN
  IF NEW.status = 'validated' AND OLD.status = 'pending' THEN
    -- Credit user's wallet
    SELECT id INTO wallet_id FROM wallets WHERE user_id = NEW.user_id;
    UPDATE wallets
    SET balance = balance + NEW.amount,
        total_earned = total_earned + NEW.amount
    WHERE id = wallet_id;

    -- Add transaction
    INSERT INTO wallet_transactions (wallet_id, type, amount, source, description, reference_id)
    VALUES (wallet_id, 'credit', NEW.amount, 'commission', 'Commission validée: ' || NEW.description, NEW.id);

    -- Update profile total
    UPDATE profiles SET total_commission = total_commission + NEW.amount WHERE id = NEW.user_id;

    -- Check for referral commission (10%)
    SELECT referrer_id INTO referrer_id FROM referrals WHERE referred_id = NEW.user_id;
    IF referrer_id IS NOT NULL THEN
      referral_commission := NEW.amount * 0.10;

      -- Credit referrer's wallet
      SELECT id INTO ref_wallet_id FROM wallets WHERE user_id = referrer_id;
      UPDATE wallets
      SET balance = balance + referral_commission,
          total_earned = total_earned + referral_commission
      WHERE id = ref_wallet_id;

      -- Add transaction
      INSERT INTO wallet_transactions (wallet_id, type, amount, source, description, reference_id)
      VALUES (ref_wallet_id, 'credit', referral_commission, 'referral', 'Commission de parrainage: ' || NEW.description, NEW.id);

      -- Update referral record
      UPDATE referrals
      SET total_commission_generated = total_commission_generated + NEW.amount,
          total_commission_earned = total_commission_earned + referral_commission
      WHERE referrer_id = referrer_id AND referred_id = NEW.user_id;

      -- Create commission record for referrer
      INSERT INTO commissions (user_id, bookmaker_id, amount, status, referral_id, description)
      VALUES (referrer_id, NEW.bookmaker_id, referral_commission, 'validated', NEW.referral_id, 'Commission de parrainage (10%)');

      -- Notify referrer
      INSERT INTO notifications (user_id, type, title, message, data)
      VALUES (referrer_id, 'referral', 'Commission de parrainage !',
              'Vous avez reçu ' || referral_commission || ' FCFA de commission de parrainage.',
              jsonb_build_object('amount', referral_commission, 'commission_id', NEW.id));
    END IF;

    -- Notify user
    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES (NEW.user_id, 'commission', 'Commission validée !',
            'Votre commission de ' || NEW.amount || ' FCFA a été créditée.',
            jsonb_build_object('amount', NEW.amount, 'commission_id', NEW.id));

    -- Update levels and badges
    PERFORM update_user_level(NEW.user_id);
    PERFORM update_user_badges(NEW.user_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Handle commission validation
CREATE OR REPLACE TRIGGER on_commission_validated
  AFTER UPDATE ON commissions
  FOR EACH ROW
  WHEN (NEW.status = 'validated' AND OLD.status = 'pending')
  EXECUTE FUNCTION handle_commission_validated();

-- Function: Update user level
CREATE OR REPLACE FUNCTION update_user_level(user_id UUID)
RETURNS VOID AS $$
DECLARE
  total_comm DECIMAL(12,2);
  new_level_id UUID;
BEGIN
  SELECT total_commission INTO total_comm FROM profiles WHERE id = user_id;

  SELECT id INTO new_level_id FROM levels
  WHERE min_commission <= total_comm AND max_commission >= total_comm
  ORDER BY min_commission DESC
  LIMIT 1;

  IF new_level_id IS NOT NULL THEN
    UPDATE profiles SET level_id = new_level_id WHERE id = user_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function: Update user badges
CREATE OR REPLACE FUNCTION update_user_badges(user_id UUID)
RETURNS VOID AS $$
DECLARE
  total_comm DECIMAL(12,2);
  badge RECORD;
BEGIN
  SELECT total_commission INTO total_comm FROM profiles WHERE id = user_id;

  FOR badge IN SELECT * FROM badges WHERE min_commission <= total_comm LOOP
    INSERT INTO user_badges (user_id, badge_id)
    VALUES (user_id, badge.id)
    ON CONFLICT (user_id, badge_id) DO NOTHING;

    IF NOT FOUND THEN
      INSERT INTO notifications (user_id, type, title, message, data)
      VALUES (user_id, 'badge', 'Nouveau badge débloqué !',
              'Félicitations ! Vous avez débloqué le badge ' || badge.name || '.',
              jsonb_build_object('badge_id', badge.id, 'badge_name', badge.name));
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function: Update leaderboard
CREATE OR REPLACE FUNCTION update_leaderboard()
RETURNS VOID AS $$
BEGIN
  -- Weekly
  DELETE FROM leaderboard WHERE period = 'weekly';
  INSERT INTO leaderboard (user_id, period, total_commission, total_referrals, rank)
  SELECT
    p.id,
    'weekly',
    COALESCE(SUM(c.amount), 0),
    p.total_referrals,
    ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(c.amount), 0) DESC)
  FROM profiles p
  LEFT JOIN commissions c ON c.user_id = p.id AND c.status = 'validated'
    AND c.created_at >= NOW() - INTERVAL '7 days'
  GROUP BY p.id, p.total_referrals;

  -- Monthly
  DELETE FROM leaderboard WHERE period = 'monthly';
  INSERT INTO leaderboard (user_id, period, total_commission, total_referrals, rank)
  SELECT
    p.id,
    'monthly',
    COALESCE(SUM(c.amount), 0),
    p.total_referrals,
    ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(c.amount), 0) DESC)
  FROM profiles p
  LEFT JOIN commissions c ON c.user_id = p.id AND c.status = 'validated'
    AND c.created_at >= NOW() - INTERVAL '30 days'
  GROUP BY p.id, p.total_referrals;

  -- All time
  DELETE FROM leaderboard WHERE period = 'all_time';
  INSERT INTO leaderboard (user_id, period, total_commission, total_referrals, rank)
  SELECT
    p.id,
    'all_time',
    COALESCE(SUM(c.amount), 0),
    p.total_referrals,
    ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(c.amount), 0) DESC)
  FROM profiles p
  LEFT JOIN commissions c ON c.user_id = p.id AND c.status = 'validated'
  GROUP BY p.id, p.total_referrals;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmakers ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Public can view basic profile info"
  ON profiles FOR SELECT
  USING (true);

-- Bookmakers policies
CREATE POLICY "Anyone can view active bookmakers"
  ON bookmakers FOR SELECT
  USING (is_active = true OR auth.uid() IN (SELECT id FROM profiles WHERE role IN ('super_admin', 'admin', 'moderator')));

-- Affiliate links policies
CREATE POLICY "Anyone can view active affiliate links"
  ON affiliate_links FOR SELECT
  USING (is_active = true OR auth.uid() IN (SELECT id FROM profiles WHERE role IN ('super_admin', 'admin', 'moderator')));

-- Referrals policies
CREATE POLICY "Users can view own referrals"
  ON referrals FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- Commissions policies
CREATE POLICY "Users can view own commissions"
  ON commissions FOR SELECT
  USING (auth.uid() = user_id);

-- Wallets policies
CREATE POLICY "Users can view own wallet"
  ON wallets FOR SELECT
  USING (auth.uid() = user_id);

-- Wallet transactions policies
CREATE POLICY "Users can view own transactions"
  ON wallet_transactions FOR SELECT
  USING (wallet_id IN (SELECT id FROM wallets WHERE user_id = auth.uid()));

-- Withdrawal requests policies
CREATE POLICY "Users can view own withdrawal requests"
  ON withdrawal_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create withdrawal requests"
  ON withdrawal_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Uploads policies
CREATE POLICY "Users can view own uploads"
  ON uploads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create uploads"
  ON uploads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Support tickets policies
CREATE POLICY "Users can view own tickets"
  ON support_tickets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create tickets"
  ON support_tickets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Ticket messages policies
CREATE POLICY "Users can view own ticket messages"
  ON ticket_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create ticket messages"
  ON ticket_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Helper function to avoid RLS recursion when checking admin rights
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

-- Admin policies (full access for admin roles)
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

-- ============================================
-- SEED DATA
-- ============================================

-- Insert default badges
INSERT INTO badges (name, type, icon, description, min_commission, color) VALUES
  ('Bronze', 'bronze', 'trophy', 'Premier palier - Commencez votre aventure', 0, '#B87333'),
  ('Argent', 'silver', 'trophy', 'Atteignez 100€ de commissions', 100, '#C0C0C0'),
  ('Or', 'gold', 'trophy', 'Atteignez 500€ de commissions', 500, '#FFD700'),
  ('Platine', 'platinum', 'crown', 'Atteignez 1000€ de commissions', 1000, '#E5E4E2'),
  ('Diamant', 'diamond', 'gem', 'Atteignez 5000€ de commissions', 5000, '#B9F2FF');

-- Insert default levels
INSERT INTO levels (name, min_commission, max_commission, icon, color) VALUES
  ('Bronze', 0, 99.99, 'shield', '#B87333'),
  ('Argent', 100, 499.99, 'shield', '#C0C0C0'),
  ('Or', 500, 999.99, 'shield', '#FFD700'),
  ('Platine', 1000, 4999.99, 'shield', '#E5E4E2'),
  ('Diamant', 5000, 999999, 'crown', '#B9F2FF');

-- Insert default settings
INSERT INTO settings (key, value, type) VALUES
  ('site_name', '"26KADO"', 'string'),
  ('site_description', '"Le meilleur programme d''affiliation des bookmakers en Afrique"', 'string'),
  ('referral_commission_rate', '10', 'number'),
  ('min_withdrawal', '5000', 'number'),
  ('max_withdrawal', '1000000', 'number'),
  ('currency', '"FCFA"', 'string'),
  ('whatsapp_group_url', '"https://chat.whatsapp.com/26kado"', 'string'),
  ('contact_email', '"contact@26kado.com"', 'string'),
  ('maintenance_mode', 'false', 'boolean');