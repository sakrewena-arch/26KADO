-- ============================================
-- 26KADO - Insertion des bookmakers
-- ============================================

-- Insertion des 4 bookmakers principaux
INSERT INTO bookmakers (name, slug, logo_url, color, description, bonus, promo_code, advantages, is_active, sort_order) VALUES
(
  '1xBet',
  '1xbet',
  '/images/bookmakers/1xbet.png',
  '#1a5cff',
  '1xBet est l''un des plus grands bookmakers au monde, offrant des cotes compétitives et une large gamme de sports.',
  '100% jusqu''à 200 000 FCFA',
  '26KADO',
  ARRAY['Bonus de bienvenue exclusif', 'Cotes élevées', 'Paiements rapides', 'Application mobile'],
  true,
  1
),
(
  'BetWinner',
  'betwinner',
  '/images/bookmakers/betwinner.png',
  '#ff6b00',
  'BetWinner est un bookmaker de premier plan offrant des milliers d''événements sportifs chaque jour.',
  '100% jusqu''à 150 000 FCFA',
  '26KADO',
  ARRAY['Bonus de bienvenue', 'Large choix de sports', 'Cash out', 'Live streaming'],
  true,
  2
),
(
  'MelBet',
  'melbet',
  '/images/bookmakers/melbet.png',
  '#ffd700',
  'MelBet propose une expérience de paris sportifs exceptionnelle avec des cotes avantageuses.',
  '100% jusqu''à 175 000 FCFA',
  '26KADO',
  ARRAY['Bonus généreux', 'Paris en direct', 'Application mobile', 'Support 24/7'],
  true,
  3
),
(
  'LineBet',
  'linebet',
  '/images/bookmakers/linebet.png',
  '#00e676',
  'LineBet est le nouveau venu qui révolutionne les paris sportifs en Afrique.',
  '100% jusqu''à 130 000 FCFA',
  '26KADO',
  ARRAY['Bonus de bienvenue', 'Cotes compétitives', 'Retraits rapides', 'Interface moderne'],
  true,
  4
)
ON CONFLICT (slug) DO NOTHING;

-- Insertion des liens d'affiliation pour chaque bookmaker
INSERT INTO affiliate_links (bookmaker_id, url, is_active)
SELECT b.id, 
  CASE b.slug
    WHEN '1xbet' THEN 'https://reffpa.com/L?tag=d_1813921m_97c_promotio&site=1813921&ad=97&r=live'
    WHEN 'betwinner' THEN 'https://bwredir.com/1U6o'
    WHEN 'melbet' THEN 'https://refpa3665.com/L?tag=d_2953895m_2170c_&site=2953895&ad=2170'
    WHEN 'linebet' THEN 'https://lb-aff.com/L?tag=d_5643995m_66803c_apk1&site=5643995&ad=66803'
  END,
  true
FROM bookmakers b
WHERE NOT EXISTS (
  SELECT 1 FROM affiliate_links al WHERE al.bookmaker_id = b.id
);
