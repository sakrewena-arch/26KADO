DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view leaderboard') THEN
    CREATE POLICY "Anyone can view leaderboard" ON leaderboard FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view profiles public') THEN
    CREATE POLICY "Anyone can view profiles public" ON profiles FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view settings') THEN
    CREATE POLICY "Anyone can view settings" ON settings FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view resources') THEN
    CREATE POLICY "Anyone can view resources" ON resources FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view faqs') THEN
    CREATE POLICY "Anyone can view faqs" ON faqs FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view faq_categories') THEN
    CREATE POLICY "Anyone can view faq_categories" ON faq_categories FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view notifications') THEN
    CREATE POLICY "Anyone can view notifications" ON notifications FOR SELECT USING (true);
  END IF;
END;
$$;