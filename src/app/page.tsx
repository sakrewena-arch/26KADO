"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useInView } from "framer-motion";
import {
  Gift, Headphones, Ticket, Users, TrendingUp, Zap,
  ChevronRight, Star, ArrowRight, Newspaper, Copy, Check,
  ExternalLink, Lock, Eye, Wallet, Coins, Calculator, UserPlus,
  Camera, FileCheck, Clock, CreditCard, Percent, Target
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { siteConfig } from "@/config/site";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useWallet } from "@/hooks/useWallet";
import { ArrowUpFromLine } from "lucide-react";

// Animated Counter
function CountUp({ end, duration = 2, suffix = "" }: { end: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    let startTime: number;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [isInView, end, duration]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

function Section({ children, className = "", id }: { children: React.ReactNode; className?: string; id?: string }) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6 }}
      className={`py-16 lg:py-24 ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
    </motion.section>
  );
}

const bookmakerColors: Record<string, string> = {
  "1xBet": "from-blue-600 to-blue-400",
  "BetWinner": "from-orange-600 to-orange-400",
  "MelBet": "from-yellow-600 to-yellow-400",
  "LineBet": "from-green-600 to-green-400",
};

const affiliateLinks: Record<string, string> = {
  "1xBet": "https://reffpa.com/L?tag=d_1813921m_97c_promotio&site=1813921&ad=97&r=live",
  "BetWinner": "https://bwredir.com/1U6o",
  "MelBet": "https://refpa3665.com/L?tag=d_2953895m_2170c_&site=2953895&ad=2170",
  "LineBet": "https://lb-aff.com/L?tag=d_5643995m_66803c_apk1&site=5643995&ad=66803",
};

// Carte "Gagner de l'argent" avec guide complet, simulateur & bookmakers
function EarnMoneyCard({ onEarnClick }: { onEarnClick: () => void }) {
  const [showDetail, setShowDetail] = useState(false);
  const [copied, setCopied] = useState(false);
  const [simPeople, setSimPeople] = useState(10);
  const [simAmount, setSimAmount] = useState(50000);
  const { user } = useAuth();

  const commission = simPeople * simAmount * 0.25;
  const bonus = commission * 0.1;

  const copyCode = () => {
    navigator.clipboard.writeText("26KADO");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDetail(true);
  };

  const steps = [
    {
      icon: UserPlus,
      title: "1. Créer un compte",
      desc: "Inscrivez-vous gratuitement sur 26KADO en quelques secondes. Remplissez le formulaire d'inscription avec vos informations.",
      color: "from-blue-500 to-blue-600",
    },
    {
      icon: Camera,
      title: "2. Faire une capture d'écran",
      desc: "Inscrivez-vous chez nos partenaires (1xBet, BetWinner, MelBet, LineBet) avec le code promo 26KADO et faites une capture d'écran de votre inscription et de votre premier dépôt.",
      color: "from-purple-500 to-purple-600",
    },
    {
      icon: FileCheck,
      title: "3. Remplir le formulaire de validation",
      desc: "Connectez-vous à votre espace 26KADO, allez dans la section Validations et téléchargez vos captures d'écran. Indiquez votre identifiant bookmaker et le montant déposé.",
      color: "from-cyan-500 to-cyan-600",
      link: "/dashboard/validations",
      linkText: "Accéder au formulaire",
    },
    {
      icon: Percent,
      title: "4. Recevoir 25% de commission",
      desc: "Chaque inscription validée vous rapporte 25% du montant déposé par la personne que vous avez recommandée. Plus vous invitez de personnes, plus vous gagnez !",
      color: "from-green-500 to-green-600",
    },
    {
      icon: Clock,
      title: "5. Validation sous 24 à 48h",
      desc: "Notre équipe vérifie vos preuves sous 24 à 48 heures maximum. Une fois validée, la commission est automatiquement créditée sur votre wallet.",
      color: "from-yellow-500 to-yellow-600",
    },
    {
      icon: CreditCard,
      title: "6. Recevoir vos gains",
      desc: "Une fois les fonds sur votre wallet, vous pouvez effectuer un retrait à tout moment. Les paiements sont traités rapidement.",
      color: "from-emerald-500 to-emerald-600",
    },
  ];

  if (!showDetail) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative cursor-pointer group"
      >
        <Card variant="premium" className="relative overflow-hidden" onClick={handleButtonClick}>
          <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500 via-orange-500 to-purple-500 rounded-2xl opacity-20 blur-xl group-hover:opacity-40 transition-opacity duration-500" />
          <div className="relative p-8 lg:p-12 text-center">
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-yellow-500/30">
                <Wallet className="w-10 h-10 text-white" />
              </div>
            </motion.div>
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">
              Gagner gratuitement de l'argent
            </h2>
            <p className="text-xl text-gray-300 mb-6 max-w-3xl mx-auto">
              Faites la promotion du site et des codes promo, gagnez 25% de commission 
              sur chaque inscription validée. Simple, rapide et gratuit.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button size="xl" variant="premium" className="animate-pulse-slow" onClick={handleButtonClick}>
                Découvrir les offres
                <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
              <Badge variant="premium" className="px-4 py-2 text-sm">
                {user ? "Code 26KADO" : "Nouveau membre"}
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-8 max-w-md mx-auto">
              {[
                { value: "50K+", label: "Membres" },
                { value: "500M+", label: "Gains distribués" },
                { value: "25%", label: "Commission" },
              ].map((s, i) => (
                <div key={i} className="text-center">
                  <div className="text-lg font-bold text-gradient">{s.value}</div>
                  <div className="text-xs text-gray-500">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card variant="premium" className="p-8 lg:p-10">
        <div className="text-center mb-8">
          <button
            onClick={() => setShowDetail(false)}
            className="text-sm text-gray-500 hover:text-gray-300 mb-4 transition-colors"
          >
            ← Retour
          </button>
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-2">Votre code promo</h2>
          <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
            Utilisez le code promo <span className="text-yellow-400 font-bold">26KADO</span> et gagnez des offres et bonus uniques. Parrainez les gens avec le code promo et gagnez gratuitement de l'argent.
          </p>
          <div className="max-w-md mx-auto mb-8">
            <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
              <div>
                <p className="text-xs text-gray-500 mb-1">Code promo</p>
                <p className="text-2xl font-bold font-mono text-yellow-400 tracking-wider">26KADO</p>
              </div>
              <button
                onClick={copyCode}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 transition-all"
              >
                {copied ? (
                  <><Check className="w-5 h-5" /> Copié</>
                ) : (
                  <><Copy className="w-5 h-5" /> Copier</>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 4 Bookmakers avec bonus attractifs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {siteConfig.bookmakers.map((bm, i) => {
            const bookmakerBonuses: Record<string, { bonus: string; cashback: string }> = {
              "1xBet": { bonus: "200% jusqu'à 200 000 FCFA", cashback: "20% cashback sur les pertes" },
              "BetWinner": { bonus: "200% jusqu'à 150 000 FCFA", cashback: "20% cashback sur les pertes" },
              "MelBet": { bonus: "200% jusqu'à 175 000 FCFA", cashback: "20% cashback sur les pertes" },
              "LineBet": { bonus: "200% jusqu'à 130 000 FCFA", cashback: "20% cashback sur les pertes" },
            };
            const b = bookmakerBonuses[bm.name];
            return (
              <motion.div
                key={bm.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="h-full flex flex-col text-center">
                  <div className={`h-2 rounded-t-xl -mx-4 -mt-4 mb-4 bg-gradient-to-r ${bookmakerColors[bm.name]}`} />
                  <div className="flex flex-col items-center gap-3 flex-1 px-2">
                    <div className="w-16 h-16 rounded-xl bg-white/10 flex items-center justify-center overflow-hidden">
                      <img
                        src={`/images/bookmakers/${bm.slug}.jfif`}
                        alt={bm.name}
                        className="w-12 h-12 object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = `<span class="text-white font-bold text-xl">${bm.name[0]}</span>`;
                          }
                        }}
                      />
                    </div>
                    <h3 className="text-lg font-semibold text-white">{bm.name}</h3>
                    <div className="space-y-1">
                      <Badge variant="premium" className="text-xs px-2 py-0.5">
                        {b.bonus}
                      </Badge>
                      <Badge variant="success" className="text-xs px-2 py-0.5 block">
                        {b.cashback}
                      </Badge>
                    </div>
                  </div>
                  <a href={affiliateLinks[bm.name]} target="_blank" rel="noopener noreferrer" className="mt-4">
                    <Button className="w-full" variant="default" size="sm">
                      S'inscrire maintenant
                      <ExternalLink className="ml-2 w-4 h-4" />
                    </Button>
                  </a>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Guide "Comment gagner de l'argent" */}
        <div className="mb-10">
          <h2 className="text-3xl lg:text-4xl font-bold text-white text-center mb-2">
            Comment gagner de l'argent ?
          </h2>
          <p className="text-gray-400 text-center mb-8">
            Suivez ce guide simple en 6 étapes pour commencer à gagner
          </p>

          <div className="space-y-6">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center shrink-0`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">{step.title}</h3>
                    <p className="text-sm text-gray-400">{step.desc}</p>
                    {step.link && (
                      <Link href={step.link}>
                        <Button variant="premium" size="sm" className="mt-2">
                          {step.linkText}
                          <ArrowRight className="ml-1 w-3 h-3" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* SIMULATEUR DE GAINS */}
        <div>
          <h3 className="text-2xl font-bold text-white text-center mb-6">
            <Calculator className="w-6 h-6 inline mr-2 text-blue-400" />
            Simulez vos gains
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <Card className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm text-gray-300">
                  Nombre de personnes invitées : <span className="text-blue-400 font-bold">{simPeople}</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={simPeople}
                  onChange={(e) => setSimPeople(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none bg-white/10 cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>1</span>
                  <span>50</span>
                  <span>100</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-300">
                  Montant moyen du dépôt : <span className="text-blue-400 font-bold">{formatCurrency(simAmount)}</span>
                </label>
                <input
                  type="range"
                  min="5000"
                  max="200000"
                  step="5000"
                  value={simAmount}
                  onChange={(e) => setSimAmount(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none bg-white/10 cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>5 000</span>
                  <span>100 000</span>
                  <span>200 000</span>
                </div>
              </div>
            </Card>
            <Card variant="premium" className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">Vos gains estimés</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white/5 text-center">
                  <p className="text-xs text-gray-400 mb-1">Commission</p>
                  <p className="text-2xl font-bold text-green-400">25%</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5 text-center">
                  <p className="text-xs text-gray-400 mb-1">Bonus parrainage</p>
                  <p className="text-2xl font-bold text-purple-400">{formatCurrency(bonus)}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { wallet } = useWallet();
  const [copied, setCopied] = useState(false);

  const handleEarnClick = () => {
    if (!user) {
      router.push("/auth/login?redirect=/dashboard");
      return;
    }
  };

  return (
    <main className="min-h-screen">
      <Header />

      {/* ===== HERO SECTION ===== */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-16">
        <div className="absolute inset-0 bg-grid opacity-20" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl sm:text-6xl lg:text-8xl font-bold mb-4">
              <span className="text-gradient glow-blue">26KADO</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-gray-300 mb-6 max-w-4xl mx-auto leading-relaxed">
              Gagnez gratuitement de l'argent en accomplissant des tâches simples, 
              retrouvez toute l'actualité foot, les meilleures offres et les codes promo exclusifs.
            </p>

            {/* Wallet + Retrait pour tous les utilisateurs */}
            {!loading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mb-8"
              >
                <div className="inline-flex items-center gap-4 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
                  <div className="text-left">
                    <p className="text-xs text-gray-400">Solde disponible</p>
                    <p className="text-2xl font-bold text-white">{formatCurrency(wallet?.balance ?? 0)}</p>
                  </div>
                  <div className="w-px h-10 bg-white/10" />
                  <Link href={user ? "/dashboard/retrait" : "/auth/register"}>
                    <Button variant="premium" size="lg">
                      <ArrowUpFromLine className="w-5 h-5 mr-2" />
                      {user ? "Retrait" : "Rejoindre"}
                    </Button>
                  </Link>
                </div>
              </motion.div>
            )}

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12 max-w-4xl mx-auto">
              {[
                { value: 50000, suffix: "+", label: "Membres actifs" },
                { value: 500, suffix: "M+", label: "FCFA distribués" },
                { value: 4, suffix: "", label: "Partenaires" },
                { value: 98, suffix: "%", label: "Satisfaction" },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="glass-card rounded-2xl p-4"
                >
                  <div className="text-2xl lg:text-3xl font-bold text-gradient">
                    <CountUp end={stat.value} />{stat.suffix}
                  </div>
                  <div className="text-sm text-gray-400 mt-1">{stat.label}</div>
                </motion.div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="xl"
                variant="premium"
                onClick={() => document.getElementById("earn")?.scrollIntoView({ behavior: "smooth" })}
              >
                Voir les offres
                <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
              {!loading && user ? (
                <Link href="/dashboard">
                  <Button size="xl" variant="default">
                    Mon espace
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              ) : !loading && !user ? (
                <Link href="/auth/register">
                  <Button size="xl" variant="default">
                    Rejoindre gratuitement
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              ) : null}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== CARTE "GAGNER DE L'ARGENT" ===== */}
      <Section id="earn">
        <EarnMoneyCard onEarnClick={handleEarnClick} />
      </Section>

      {/* ===== ACTUALITÉS FOOTBALL ===== */}
      <Section className="bg-gradient-to-b from-transparent via-blue-950/10 to-transparent">
        <div className="text-center mb-12">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center mx-auto mb-4">
            <Newspaper className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Toute l'actualité foot
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Restez informé des dernières actualités, transferts et résultats.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Link href="/football-news">
                <Card variant="interactive" className="h-full">
                  <div className="w-full h-40 rounded-xl bg-gradient-to-br from-gray-800 to-gray-700 mb-4 flex items-center justify-center">
                    <Newspaper className="w-12 h-12 text-gray-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {i === 0 ? "Mercato : Les dernières infos" : i === 1 ? "Résultats du week-end" : "Analyses et statistiques"}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {i === 0 
                      ? "Toutes les rumeurs et transferts confirmés du mercato africain et européen."
                      : i === 1
                      ? "Les scores et les temps forts des matchs de vos équipes favorites."
                      : "Analyses détaillées, classements et performances des joueurs."}
                  </p>
                  <div className="mt-4 flex items-center text-sm text-blue-400">
                    Lire l'article <ArrowRight className="ml-1 w-3 h-3" />
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link href="/football-news">
            <Button variant="outline" size="lg">
              Voir toutes les actualités
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </Section>

      {/* ===== POURQUOI NOUS REJOINDRE ===== */}
      <Section>
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Pourquoi nous rejoindre ?
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Des avantages exclusifs pour les membres de la communauté 26KADO.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {siteConfig.advantages.map((adv, i) => {
            const IconComponent = {
              Gift, Headphones, Ticket, Users, TrendingUp, Zap,
            }[adv.icon] || Gift;
            
            return (
              <motion.div
                key={adv.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card variant="interactive" className="h-full">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-4">
                    <IconComponent className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{adv.title}</h3>
                  <p className="text-sm text-gray-400">{adv.description}</p>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </Section>

      {/* ===== WHATSAPP SECTION ===== */}
      <Section>
        <Card variant="premium" className="text-center py-12 px-8 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <div className="w-16 h-16 rounded-full bg-[#25D366]/20 flex items-center justify-center mx-auto mb-6">
              <svg viewBox="0 0 24 24" className="w-8 h-8" fill="#25D366">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Recevez les offres exclusives
            </h2>
            <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
              Rejoignez notre groupe WhatsApp et recevez en avant-première toutes les offres et codes promo.
            </p>
            <a
              href="https://whatsapp.com/channel/0029Vb7OtjLBqbr4XtpvJx0n"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="xl" variant="premium">
                <svg viewBox="0 0 24 24" className="w-5 h-5 mr-2" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Rejoindre la communauté
              </Button>
            </a>
          </motion.div>
        </Card>
      </Section>

      {/* ===== CTA FINAL ===== */}
      <Section className="text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl lg:text-5xl font-bold text-white mb-4">
            Prêt à commencer ?
          </h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            Rejoignez des milliers de membres et profitez des meilleures offres.
          </p>
          {user ? (
            <Link href="/dashboard">
              <Button size="xl" variant="premium">
                Accéder à mon espace
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          ) : (
            <Link href="/auth/register">
              <Button size="xl" variant="premium">
                Créer mon compte gratuitement
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          )}
        </motion.div>
      </Section>

      <Footer />
    </main>
  );
}