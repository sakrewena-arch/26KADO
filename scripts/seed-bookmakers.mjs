// Script pour insérer les bookmakers dans Supabase
const SUPABASE_URL = 'https://histmxbmlretygakfydi.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhpc3RteGJtbHJldHlnYWtmeWRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY2OTk5NCwiZXhwIjoyMDk4MjQ1OTk0fQ.g10zDRrcBdxUtt-Vdqs8UEmkhfzB26XzwJ71bDRVEp8';

// Utiliser la clé service_role pour contourner RLS
const HEADERS = {
  'Content-Type': 'application/json',
  'apikey': SUPABASE_SERVICE_KEY,
  'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
  'Prefer': 'resolution=merge-duplicates'
};

const bookmakers = [
  {
    name: '1xBet',
    slug: '1xbet',
    logo_url: '/images/bookmakers/1xbet.png',
    color: '#1a5cff',
    description: "1xBet est l'un des plus grands bookmakers au monde, offrant des cotes compétitives et une large gamme de sports.",
    bonus: "100% jusqu'à 200 000 FCFA",
    promo_code: '26KADO',
    advantages: ['Bonus de bienvenue exclusif', 'Cotes élevées', 'Paiements rapides', 'Application mobile'],
    is_active: true,
    sort_order: 1
  },
  {
    name: 'BetWinner',
    slug: 'betwinner',
    logo_url: '/images/bookmakers/betwinner.png',
    color: '#ff6b00',
    description: 'BetWinner est un bookmaker de premier plan offrant des milliers d\'événements sportifs chaque jour.',
    bonus: "100% jusqu'à 150 000 FCFA",
    promo_code: '26KADO',
    advantages: ['Bonus de bienvenue', 'Large choix de sports', 'Cash out', 'Live streaming'],
    is_active: true,
    sort_order: 2
  },
  {
    name: 'MelBet',
    slug: 'melbet',
    logo_url: '/images/bookmakers/melbet.png',
    color: '#ffd700',
    description: 'MelBet propose une expérience de paris sportifs exceptionnelle avec des cotes avantageuses.',
    bonus: "100% jusqu'à 175 000 FCFA",
    promo_code: '26KADO',
    advantages: ['Bonus généreux', 'Paris en direct', 'Application mobile', 'Support 24/7'],
    is_active: true,
    sort_order: 3
  },
  {
    name: 'LineBet',
    slug: 'linebet',
    logo_url: '/images/bookmakers/linebet.png',
    color: '#00e676',
    description: 'LineBet est le nouveau venu qui révolutionne les paris sportifs en Afrique.',
    bonus: "100% jusqu'à 130 000 FCFA",
    promo_code: '26KADO',
    advantages: ['Bonus de bienvenue', 'Cotes compétitives', 'Retraits rapides', 'Interface moderne'],
    is_active: true,
    sort_order: 4
  }
];

const affiliateLinks = [
  { slug: '1xbet', url: 'https://1xbet.com/fr?tag=26kado' },
  { slug: 'betwinner', url: 'https://betwinner.com/fr?tag=26kado' },
  { slug: 'melbet', url: 'https://melbet.com/fr?tag=26kado' },
  { slug: 'linebet', url: 'https://linebet.com/fr?tag=26kado' },
];

async function seed() {
  console.log('🚀 Insertion des bookmakers...\n');

  // 1. Insérer les bookmakers
  const res = await fetch(`${SUPABASE_URL}/rest/v1/bookmakers`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(bookmakers)
  });

  if (!res.ok) {
    const err = await res.json();
    console.error('❌ Erreur insertion bookmakers:', err.message || JSON.stringify(err));
    return;
  }

  console.log('✅ 4 bookmakers insérés avec succès');

  // 2. Récupérer les IDs des bookmakers
  const { data: bms } = await (await fetch(`${SUPABASE_URL}/rest/v1/bookmakers?select=id,slug`, {
    headers: HEADERS
  })).json();

  if (!bms || bms.length === 0) {
    console.error('❌ Impossible de récupérer les bookmakers');
    return;
  }

  // 3. Insérer les liens d'affiliation
  const links = bms.map(bm => {
    const link = affiliateLinks.find(l => l.slug === bm.slug);
    return {
      bookmaker_id: bm.id,
      url: link?.url || '',
      is_active: true
    };
  });

  const res2 = await fetch(`${SUPABASE_URL}/rest/v1/affiliate_links`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(links)
  });

  if (!res2.ok) {
    const err2 = await res2.json();
    console.error('❌ Erreur insertion liens:', err2.message || JSON.stringify(err2));
    return;
  }

  console.log('✅ Liens d\'affiliation insérés');
  console.log('\n🎉 Terminé ! Les bookmakers sont disponibles dans la base de données.');
}

seed().catch(console.error);