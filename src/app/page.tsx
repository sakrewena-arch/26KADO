"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import {
  Gift, Headphones, Ticket, Users, TrendingUp, Zap,
  ChevronRight, Star, ArrowRight,
  ExternalLink, Copy, Check
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { siteConfig } from "@/config/site";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

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

// Section wrapper with animation
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </motion.section>
  );
}

export default function HomePage() {
  const { user, loading } = useAuth();
  const [copied, setCopied] = useState(false);
  const [simPeople, setSimPeople] = useState(10);
  const [simAmount, setSimAmount] = useState(50000);

  const commission = simPeople * simAmount * 0.25;
  const bonus = commission * 0.1;
  const level = commission >= 500000 ? "Diamant" : commission >= 100000 ? "Platine" : commission >= 50000 ? "Or" : commission >= 10000 ? "Argent" : "Bronze";
  const reward = commission >= 500000 ? "iPhone 15 Pro" : commission >= 100000 ? "AirPods Pro" : commission >= 50000 ? "Bonus 10 000 FCFA" : commission >= 10000 ? "Bonus 5 000 FCFA" : "Bonus 1 000 FCFA";

  const copyCode = () => {
    navigator.clipboard.writeText("26KADO");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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

  return (
    <main className="min-h-screen">
      <Header />

      {/* ===== HERO SECTION ===== */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: "1s" }} />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Badge variant="premium" className="mb-6 px-4 py-1.5 text-sm">
              Programme d'affiliation N°1 en Afrique
            </Badge>
            
            <h1 className="text-5xl sm:text-6xl lg:text-8xl font-bold mb-6">
              <span className="text-gradient glow-blue">26KADO</span>
            </h1>
            
            <p className="text-xl sm:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              {siteConfig.slogan}
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12 max-w-4xl mx-auto">
              {[
                { value: 50000, suffix: "+", label: "Utilisateurs" },
                { value: 500, suffix: "M+", label: "FCFA Commissions", isCurrency: true },
                { value: 4, suffix: "", label: "Bookmakers" },
                { value: 98, suffix: "%", label: "Satisfaction" },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="glass-card rounded-2xl p-4"
                >
                  <div className="text-2xl lg:text-3xl font-bold text-gradient">
                    {stat.isCurrency ? (
                      <><CountUp end={stat.value} />{stat.suffix}</>
                    ) : (
                      <><CountUp end={stat.value} />{stat.suffix}</>
                    )}
                  </div>
                  <div className="text-sm text-gray-400 mt-1">{stat.label}</div>
                </motion.div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="xl"
                variant="premium"
                onClick={() => document.getElementById("bookmakers")?.scrollIntoView({ behavior: "smooth" })}
              >
                Utiliser le Code 26KADO
                <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
              {!loading && user ? (
                <Link href="/dashboard">
                  <Button size="xl" variant="default">
                    Voir le dashboard
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              ) : !loading && !user ? (
                <Link href="/auth/register">
                  <Button size="xl" variant="default">
                    Créer un compte
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              ) : null}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== BOOKMAKERS SECTION ===== */}
      <Section id="bookmakers">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Nos Bookmakers Partenaires
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Choisissez parmi les meilleurs bookmakers africains et profitez de bonus exclusifs avec notre code promo.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {siteConfig.bookmakers.map((bm, i) => (
            <motion.div
              key={bm.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Card variant="premium" className="h-full flex flex-col">
                <div className={`h-3 rounded-t-2xl -mx-6 -mt-6 mb-4 bg-gradient-to-r ${bookmakerColors[bm.name]}`} />
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center overflow-hidden">
                    <img
                      src={`/images/bookmakers/${bm.slug}.jfif`}
                      alt={bm.name}
                      className="w-10 h-10 object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = `<span class="text-white font-bold text-lg">${bm.name[0]}</span>`;
                        }
                      }}
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{bm.name}</h3>
                    <p className="text-sm text-gray-400">{bm.bonus}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-400 mb-4 flex-1">
                  Profitez du bonus de bienvenue exclusif avec notre code promo.
                </p>
                <div className="space-y-3 mt-auto">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                    <span className="text-sm text-gray-400">Code promo</span>
                    <button
                      onClick={copyCode}
                      className="flex items-center gap-1 text-sm font-mono text-yellow-400 hover:text-yellow-300 transition-colors"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      26KADO
                    </button>
                  </div>
                  <a href={affiliateLinks[bm.name]} target="_blank" rel="noopener noreferrer">
                    <Button className="w-full" variant="default" size="sm">
                      S'inscrire maintenant
                      <ExternalLink className="ml-2 w-4 h-4" />
                    </Button>
                  </a>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ===== ADVANTAGES SECTION ===== */}
      <Section className="bg-gradient-to-b from-transparent via-blue-950/10 to-transparent">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Pourquoi utiliser notre code ?
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Des avantages exclusifs réservés aux ambassadeurs 26KADO.
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

      {/* ===== HOW IT WORKS ===== */}
      <Section>
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Comment ça fonctionne ?
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Rejoignez le programme en 6 étapes simples et commencez à gagner des commissions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {siteConfig.steps.map((step, i) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative"
            >
              <Card className="h-full text-center">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mx-auto mb-4 text-xl font-bold text-white">
                  {step.step}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-gray-400">{step.description}</p>
              </Card>
              {i < siteConfig.steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-3 text-gray-600">
                  <ChevronRight className="w-6 h-6" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ===== SIMULATOR ===== */}
      <Section className="bg-gradient-to-b from-transparent via-purple-950/10 to-transparent">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Simulateur de gains
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Estimez vos commissions potentielles selon votre nombre de filleuls.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
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
              <div className="p-3 rounded-xl bg-white/5">
                <p className="text-xs text-gray-400 mb-1">Commission</p>
                <p className="text-xl font-bold text-green-400">{formatCurrency(commission)}</p>
              </div>
              <div className="p-3 rounded-xl bg-white/5">
                <p className="text-xs text-gray-400 mb-1">Bonus</p>
                <p className="text-xl font-bold text-yellow-400">{formatCurrency(bonus)}</p>
              </div>
              <div className="p-3 rounded-xl bg-white/5">
                <p className="text-xs text-gray-400 mb-1">Niveau</p>
                <p className="text-xl font-bold text-gradient">{level}</p>
              </div>
              <div className="p-3 rounded-xl bg-white/5">
                <p className="text-xs text-gray-400 mb-1">Récompense</p>
                <p className="text-sm font-bold text-purple-400">{reward}</p>
              </div>
            </div>
          </Card>
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
              Recevez gratuitement des coupons chaque jour
            </h2>
            <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
              Rejoignez notre groupe WhatsApp et recevez des coupons exclusifs pour maximiser vos gains sur tous les bookmakers.
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
                Accéder aux coupons WhatsApp
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
            Rejoignez des milliers d'ambassadeurs et commencez à gagner des commissions dès aujourd'hui.
          </p>
          {user ? (
            <Link href="/dashboard">
              <Button size="xl" variant="premium">
                Accéder au dashboard
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          ) : (
            <Link href="/auth/register">
              <Button size="xl" variant="premium">
                Créer votre compte maintenant
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