# 26KADO - Plateforme d'Affiliation de Bookmakers en Afrique

**26KADO** est la plateforme N°1 d'affiliation des bookmakers en Afrique. Promouvez les codes promo 1xBet, BetWinner, MelBet, LineBet et gagnez des commissions exclusives.

## 🚀 Stack Technique

| Technologie | Version |
|---|---|
| Next.js | 16.2.9 (App Router) |
| React | 19.2.4 |
| TypeScript | 5.x |
| Supabase | Auth + Database + Realtime + Storage |
| Tailwind CSS | 4.x |
| Framer Motion | 12.42.0 |
| Chart.js | 4.5.1 |
| React Hook Form | 7.80.0 |
| Zod | 4.4.3 |
| PayDunya | (Intégration paiement) |

## 📋 Fonctionnalités

### Pages Publiques
- **Landing Page** - Hero animé, statistiques, bookmakers, avantages, simulateur de gains, section WhatsApp
- **À propos** - Histoire, mission, vision, valeurs
- **FAQ** - Catégories, recherche, questions/réponses animées
- **Classement** - Top ambassadeurs (hebdomadaire/mensuel/global)
- **Support** - Page de contact
- **Ressources** - Bibliothèque marketing
- **Politique de confidentialité** & **Conditions d'utilisation**

### Authentification (Supabase Auth)
- Inscription avec code de parrainage
- Connexion email/mot de passe
- Mot de passe oublié
- Vérification email
- Middleware de protection des routes
- Callback OAuth

### Dashboard Utilisateur (8 pages)
1. **Tableau de bord** - Stats, QR code téléchargeable, transactions, notifications temps réel
2. **Commissions** - Historique complet
3. **Portefeuille** - Solde, transactions, retraits
4. **Validations** - Upload preuves d'inscription
5. **Parrainages** - Liste des filleuls
6. **Support** - Tickets
7. **Notifications** - Centre de notifications temps réel
8. **Ressources** - Ressources marketing

### Administration (17 pages)
1. **Dashboard** - Graphiques Chart.js (commissions, utilisateurs, statuts)
2. **Utilisateurs** - CRUD, rôles (super_admin, admin, moderator)
3. **Bookmakers** - CRUD avec liens d'affiliation
4. **Validations** - Validation des preuves avec commission
5. **Commissions** - Gestion complète
6. **Paiements** - Transactions PayDunya
7. **Retraits** - Gestion des demandes
8. **Tickets** - Support client
9. **FAQ** - Catégories + questions/réponses
10. **Badges** - CRUD (Bronze, Argent, Or, Platine, Diamant)
11. **Niveaux** - CRUD avec barres de progression
12. **Classement** - Filtres par période, recherche
13. **WhatsApp** - Gestion des liens
14. **Ressources** - Bannières, images, textes, pubs, vidéos
15. **Notifications** - Envoi à tous ou à un utilisateur
16. **Logs** - Historique des actions admin
17. **Paramètres** - Configuration globale

### Base de Données (22 tables)
`profiles`, `bookmakers`, `affiliate_links`, `referrals`, `commissions`, `wallets`, `wallet_transactions`, `withdrawal_requests`, `payment_transactions`, `badges`, `user_badges`, `levels`, `support_tickets`, `ticket_messages`, `notifications`, `uploads`, `faq_categories`, `faqs`, `resources`, `whatsapp_links`, `leaderboard`, `reward_programs`, `admin_logs`, `settings`

### Triggers SQL Automatiques
- Génération code de parrainage unique
- Création automatique du profil + wallet à l'inscription
- Commission 10% au parrain automatique
- Mise à jour des niveaux et badges
- Notifications automatiques
- Mise à jour du leaderboard

## 🛠️ Installation

### Prérequis
- Node.js 18+
- Compte Supabase
- Compte PayDunya (optionnel)

### Variables d'environnement
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=votre_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anon
SUPABASE_SERVICE_ROLE_KEY=votre_cle_service

# PayDunya (optionnel)
NEXT_PUBLIC_PAYDUNYA_API_KEY=votre_cle_paydunya
NEXT_PUBLIC_PAYDUNYA_API_TOKEN=votre_token_paydunya
PAYDUNYA_SECRET_KEY=votre_secret_paydunya

# Site
NEXT_PUBLIC_SITE_URL=https://26kado.com
```

### Installation
```bash
# Cloner le projet
git clone https://github.com/votre-compte/26kado.git
cd 26kado

# Installer les dépendances
npm install

# Lancer en développement
npm run dev

# Build production
npm run build
npm start
```

### Base de données
1. Créer un projet Supabase
2. Exécuter les migrations dans l'ordre :
   - `src/lib/supabase/migrations/001_initial_schema.sql`
   - `src/lib/supabase/migrations/002_fix_rls_policies.sql`
   - `src/lib/supabase/migrations/003_fix_profiles_rls_recursion.sql`
3. Activer Realtime sur la table `notifications`

## 🚀 Déploiement

### Vercel
```bash
npm i -g vercel
vercel --prod
```

### Configuration Vercel
- Framework: Next.js
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`

## 📊 Architecture

```
src/
├── app/                    # Pages (App Router)
│   ├── page.tsx           # Landing page
│   ├── layout.tsx         # Layout racine
│   ├── admin/             # 17 pages admin
│   ├── auth/              # 4 pages auth
│   ├── dashboard/         # 8 pages dashboard
│   └── ...
├── components/
│   ├── charts/            # Graphiques Chart.js
│   ├── layout/            # Layouts (Header, Footer, Sidebar)
│   └── ui/                # Composants UI (shadcn-like)
├── hooks/                 # Hooks personnalisés
├── lib/
│   ├── supabase/          # Client, Server, Queries, Migrations
│   └── utils.ts           # Utilitaires
├── config/                # Configuration site
├── types/                 # Types TypeScript
└── middleware.ts          # Protection des routes
```

## 🔒 Sécurité

- Row Level Security (RLS) sur toutes les tables
- Fonction `is_admin()` anti-récursion
- Middleware de protection des routes
- Sessions Supabase sécurisées
- Validation des entrées

## 🎨 Design

- Thème dark/clair
- Glassmorphism
- Animations Framer Motion
- Responsive (mobile, tablette, desktop)
- SEO optimisé
- QR Code téléchargeable

## 📝 Licence

Projet privé - 26KADO