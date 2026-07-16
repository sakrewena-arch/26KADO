"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ExternalLink, Copy, Check, Gift, Star, Shield, Zap,
  Smartphone, Laptop, Globe, Users, ArrowRight, ChevronDown,
  ChevronUp, Target, Trophy, Diamond, Sparkles, Percent
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { siteConfig } from "@/config/site";

const bookmakerColors: Record<string, string> = {
  "1xBet": "from-blue-600 to-blue-400",
  "BetWinner": "from-orange-600 to-orange-400",
  "MelBet": "from-yellow-600 to-yellow-400",
  "LineBet": "from-green-600 to-green-400",
};

const bookmakerGradients: Record<string, string> = {
  "1xBet": "from-blue-600/20 via-blue-500/5 to-transparent",
  "BetWinner": "from-orange-600/20 via-orange-500/5 to-transparent",
  "MelBet": "from-yellow-600/20 via-yellow-500/5 to-transparent",
  "LineBet": "from-green-600/20 via-green-500/5 to-transparent",
};

const affiliateLinks: Record<string, string> = {
  "1xBet": "https://reffpa.com/L?tag=d_1813921m_97c_promotio&site=1813921&ad=97&r=live",
  "BetWinner": "https://bwredir.com/1U6o",
  "MelBet": "https://refpa3665.com/L?tag=d_2953895m_2170c_&site=2953895&ad=2170",
  "LineBet": "https://lb-aff.com/L?tag=d_5643995m_66803c_apk1&site=5643995&ad=66803",
};

const bookmakerDetails: Record<string, {
  description: string;
  features: string[];
  app: string;
  rating: number;
  users: string;
  cashback: string;
}> = {
  "1xBet": {
    description: "1xBet est le leader mondial des paris sportifs avec une présence massive en Afrique. Profitez de cotes élevées, de milliers d'événements quotidiens et d'un bonus de bienvenue exceptionnel.",
    features: [
      "Bonus de bienvenue 200% jusqu'à 200 000 FCFA",
      "Cashback 20% sur les pertes",
      "Plus de 1 000 événements par jour",
      "Application mobile Android & iOS",
      "Dépôt à partir de 1 000 FCFA",
      "Retraits rapides sous 24h",
    ],
    app: "Disponible sur Android et iOS",
    rating: 4.8,
    users: "10M+",
    cashback: "20% cashback",
  },
  "BetWinner": {
    description: "BetWinner est une plateforme de paris sportifs et de casino en pleine expansion en Afrique. Interface intuitive, cotes compétitives et promotions généreuses vous attendent.",
    features: [
      "Bonus de bienvenue 200% jusqu'à 150 000 FCFA",
      "Cashback 20% sur les pertes",
      "Paris en direct (Live betting)",
      "Application mobile performante",
      "Dépôt minimum 1 000 FCFA",
      "Support client 24/7",
    ],
    app: "Disponible sur Android et iOS",
    rating: 4.7,
    users: "8M+",
    cashback: "20% cashback",
  },
  "MelBet": {
    description: "MelBet offre une expérience de paris sportifs exceptionnelle avec des cotes avantageuses et une large gamme de sports. Rejoignez des millions d'utilisateurs satisfaits.",
    features: [
      "Bonus de bienvenue 200% jusqu'à 175 000 FCFA",
      "Cashback 20% sur les pertes",
      "Large choix de sports et marchés",
      "Application mobile fluide",
      "Dépôt minimum 1 000 FCFA",
      "Promotions quotidiennes",
    ],
    app: "Disponible sur Android et iOS",
    rating: 4.6,
    users: "5M+",
    cashback: "20% cashback",
  },
  "LineBet": {
    description: "LineBet est le nouveau venu qui monte en Afrique. Une plateforme moderne avec des fonctionnalités innovantes et des bonus attractifs pour les nouveaux inscrits.",
    features: [
      "Bonus de bienvenue 200% jusqu'à 130 000 FCFA",
      "Cashback 20% sur les pertes",
      "Interface moderne et intuitive",
      "Application mobile dédiée",
      "Dépôt minimum 1 000 FCFA",
      "Programme de fidélité",
    ],
    app: "Disponible sur Android et iOS",
    rating: 4.5,
    users: "3M+",
    cashback: "20% cashback",
  },
};

function BookmakerCard({ name, slug, color, bonus, promoCode }: {
  name: string; slug: string; color: string; bonus: string; promoCode: string;
}) {
  const [copied, setCopied] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const details = bookmakerDetails[name];

  const copyCode = () => {
    navigator.clipboard.writeText(promoCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <Card className="overflow-hidden">
        <div className={`h-2 bg-gradient-to-r ${bookmakerColors[name]}`} />
        <div className={`bg-gradient-to-b ${bookmakerGradients[name]} p-6 lg:p-8`}>
          {/* En-tête */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6 mb-6">
            <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center overflow-hidden shrink-0 border border-white/10">
              <img
                src={`/images/bookmakers/${slug}.jfif`}
                alt={name}
                className="w-16 h-16 object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) parent.innerHTML = `<span class="text-white font-bold text-2xl">${name[0]}</span>`;
                }}
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl lg:text-3xl font-bold text-white">{name}</h2>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < Math.floor(details.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} />
                  ))}
                  <span className="text-xs text-gray-500 ml-1">{details.rating}</span>
                </div>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">{details.description}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="p-3 rounded-xl bg-white/5 text-center">
              <Gift className="w-5 h-5 text-green-400 mx-auto mb-1" />
              <p className="text-xs text-gray-500">Bonus</p>
              <p className="text-sm font-bold text-white">{bonus}</p>
            </div>
            <div className="p-3 rounded-xl bg-white/5 text-center">
              <Percent className="w-5 h-5 text-blue-400 mx-auto mb-1" />
              <p className="text-xs text-gray-500">Cashback</p>
              <p className="text-sm font-bold text-white">{details.cashback}</p>
            </div>
            <div className="p-3 rounded-xl bg-white/5 text-center">
              <Users className="w-5 h-5 text-purple-400 mx-auto mb-1" />
              <p className="text-xs text-gray-500">Utilisateurs</p>
              <p className="text-sm font-bold text-white">{details.users}</p>
            </div>
            <div className="p-3 rounded-xl bg-white/5 text-center">
              <Smartphone className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
              <p className="text-xs text-gray-500">Application</p>
              <p className="text-sm font-bold text-white">Android/iOS</p>
            </div>
          </div>

          {/* Code promo */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-6">
            <div className="flex-1 flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
              <div>
                <p className="text-xs text-gray-500 mb-1">Code promo exclusif</p>
                <p className="text-xl font-bold font-mono text-yellow-400 tracking-wider">{promoCode}</p>
              </div>
              <button
                onClick={copyCode}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 transition-all"
              >
                {copied ? <><Check className="w-4 h-4" /> Copié</> : <><Copy className="w-4 h-4" /> Copier</>}
              </button>
            </div>
            <a href={affiliateLinks[name]} target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="premium" className="w-full sm:w-auto whitespace-nowrap">
                S'inscrire maintenant
                <ExternalLink className="ml-2 w-4 h-4" />
              </Button>
            </a>
          </div>

          {/* Fonctionnalités */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {details.features.slice(0, showMore ? 6 : 3).map((feature, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-gray-300">
                  <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${bookmakerColors[name]}`} />
                  {feature}
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowMore(!showMore)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              {showMore ? (
                <>Voir moins <ChevronUp className="w-3 h-3" /></>
              ) : (
                <>Voir plus d'avantages <ChevronDown className="w-3 h-3" /></>
              )}
            </button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export default function BookmakersPage() {
  const [copiedGlobal, setCopiedGlobal] = useState(false);

  const copyGlobalCode = () => {
    navigator.clipboard.writeText("26KADO");
    setCopiedGlobal(true);
    setTimeout(() => setCopiedGlobal(false), 2000);
  };

  return (
    <main className="min-h-screen">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-32 pb-16 lg:pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: "1s" }} />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="premium" className="mb-4 px-4 py-1.5 text-sm">
              <Trophy className="w-4 h-4 mr-1" />
              Bookmakers programmess
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold text-white mb-4">
              Inscrivez-vous avec le code <span className="text-gradient">26KADO</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              Profitez des meilleures offres de bienvenue sur les bookmakers partenaires.
              Utilisez notre code promo exclusif et recevez des bonus exceptionnels.
            </p>

            {/* Code promo global */}
            <div className="max-w-md mx-auto mb-8">
              <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
                <div className="text-left">
                  <p className="text-xs text-gray-500 mb-1">Code promo unique</p>
                  <p className="text-2xl font-bold font-mono text-yellow-400 tracking-wider">26KADO</p>
                </div>
                <button
                  onClick={copyGlobalCode}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 transition-all"
                >
                  {copiedGlobal ? <><Check className="w-5 h-5" /> Copié</> : <><Copy className="w-5 h-5" /> Copier</>}
                </button>
              </div>
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-3xl mx-auto">
              {[
                { icon: Gift, value: "200%", label: "Bonus max" },
                { icon: Shield, value: "20%", label: "Cashback" },
                { icon: Zap, value: "24h", label: "Retraits" },
                { icon: Globe, value: "Afrique", label: "Disponible" },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="glass-card rounded-2xl p-4"
                >
                  <stat.icon className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                  <div className="text-lg font-bold text-gradient">{stat.value}</div>
                  <div className="text-xs text-gray-500">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Liste des bookmakers */}
      <section className="pb-16 lg:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {siteConfig.bookmakers.map((bm) => (
            <BookmakerCard key={bm.name} {...bm} />
          ))}
        </div>
      </section>

      {/* Section Comment ça marche */}
      <section className="pb-16 lg:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Comment profiter des offres ?
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Suivez ces étapes simples pour bénéficier des meilleurs bonus.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: 1,
                icon: Copy,
                title: "Copiez le code",
                desc: "Copiez le code promo 26KADO depuis cette page.",
                color: "from-blue-500 to-blue-600",
              },
              {
                step: 2,
                icon: ExternalLink,
                title: "Choisissez un bookmaker",
                desc: "Sélectionnez le bookmaker de votre choix parmi nos partenaires.",
                color: "from-purple-500 to-purple-600",
              },
              {
                step: 3,
                icon: Gift,
                title: "Inscrivez-vous",
                desc: "Créez votre compte et entrez le code promo 26KADO.",
                color: "from-yellow-500 to-yellow-600",
              },
              {
                step: 4,
                icon: Diamond,
                title: "Recevez votre bonus",
                desc: "Validez votre inscription et profitez du bonus exclusif.",
                color: "from-green-500 to-green-600",
              },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="h-full text-center">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center mx-auto mb-4">
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-3">
                      <span className="text-sm font-bold text-blue-400">{item.step}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                    <p className="text-sm text-gray-400">{item.desc}</p>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section Pourquoi s'inscrire */}
      <section className="pb-16 lg:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card variant="premium" className="p-8 lg:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <Badge variant="premium" className="mb-4">Pourquoi choisir 26KADO ?</Badge>
                <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                  Le meilleur programme d'affiliation en Afrique
                </h2>
                <p className="text-gray-400 mb-6">
                  En vous inscrivant via nos liens, vous bénéficiez non seulement des meilleurs bonus,
                  mais vous participez aussi à notre programme d'affiliation qui vous permet de gagner
                  des commissions sur chaque inscription validée.
                </p>
                <div className="space-y-3">
                  {[
                    { icon: Sparkles, text: "Bonus exclusifs jusqu'à 200 000 FCFA" },
                    { icon: Target, text: "Cashback 20% sur vos pertes" },
                    { icon: Trophy, text: "Programme ambassadeur avec commissions" },
                    { icon: Zap, text: "Paiements rapides sous 24h" },
                  ].map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <div key={i} className="flex items-center gap-3 text-sm text-gray-300">
                        <Icon className="w-5 h-5 text-blue-400 shrink-0" />
                        {item.text}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="text-center">
                <div className="p-8 rounded-2xl bg-white/5">
                  <p className="text-sm text-gray-500 mb-2">Code promo</p>
                  <p className="text-4xl font-bold font-mono text-yellow-400 tracking-wider mb-4">26KADO</p>
                  <button
                    onClick={copyGlobalCode}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 transition-all"
                  >
                    {copiedGlobal ? <><Check className="w-5 h-5" /> Copié</> : <><Copy className="w-5 h-5" /> Copier le code</>}
                  </button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <Footer />
    </main>
  );
}