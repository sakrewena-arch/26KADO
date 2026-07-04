"use client";

import { motion } from "framer-motion";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, Eye, Shield, Users, Star, Lightbulb, Heart, Zap, TrendingUp } from "lucide-react";

const values = [
  { title: "Transparence", description: "Nous croyons en une communication claire et honnête avec nos ambassadeurs.", icon: Eye, color: "from-blue-500/20 to-cyan-500/20 text-blue-400" },
  { title: "Innovation", description: "Nous utilisons les meilleures technologies pour optimiser vos gains.", icon: Lightbulb, color: "from-yellow-500/20 to-amber-500/20 text-yellow-400" },
  { title: "Excellence", description: "Nous visons l'excellence dans tout ce que nous entreprenons.", icon: Star, color: "from-purple-500/20 to-pink-500/20 text-purple-400" },
  { title: "Communauté", description: "Nous construisons une communauté forte et solidaire d'ambassadeurs.", icon: Users, color: "from-green-500/20 to-emerald-500/20 text-green-400" },
  { title: "Intégrité", description: "Nous respectons nos engagements et valorisons la confiance.", icon: Shield, color: "from-red-500/20 to-orange-500/20 text-red-400" },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen">
      <Header />
      
      {/* Hero */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Badge variant="premium" className="mb-4">À propos</Badge>
            <h1 className="text-4xl lg:text-6xl font-bold text-white mb-4">À propos de <span className="text-gradient">26KADO</span></h1>
            <p className="text-lg text-gray-400 max-w-3xl mx-auto">La plateforme N°1 d'affiliation des bookmakers en Afrique.</p>
          </motion.div>
        </div>
      </section>

      {/* Histoire */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-white mb-6">Notre Histoire</h2>
              <div className="space-y-4 text-gray-400">
                <p>26KADO est né d'une vision simple : permettre à chacun en Afrique de monétiser son influence dans le domaine des paris sportifs.</p>
                <p>Fondée en 2024 par une équipe passionnée de marketing digital et de technologies, notre plateforme a rapidement grandi pour devenir la référence en matière d'affiliation de bookmakers sur le continent.</p>
                <p>Aujourd'hui, nous comptons plus de 50 000 ambassadeurs actifs et avons distribué des centaines de millions de FCFA en commissions.</p>
              </div>
            </div>
            <Card variant="premium">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: "50K+", label: "Ambassadeurs" },
                  { value: "500M+", label: "FCFA distribués" },
                  { value: "4", label: "Bookmakers" },
                  { value: "98%", label: "Satisfaction" },
                ].map((stat) => (
                  <div key={stat.label} className="text-center p-4 rounded-xl bg-white/5">
                    <p className="text-2xl font-bold text-gradient">{stat.value}</p>
                    <p className="text-sm text-gray-400 mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 bg-gradient-to-b from-transparent via-blue-950/10 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <Card>
                <Target className="w-8 h-8 text-blue-400 mb-4" />
                <h2 className="text-2xl font-bold text-white mb-4">Notre Mission</h2>
                <ul className="space-y-3 text-gray-400">
                  <li className="flex items-start gap-2">• Démocratiser l'accès aux programmes d'affiliation des bookmakers en Afrique</li>
                  <li className="flex items-start gap-2">• Offrir des commissions parmi les plus élevées du marché</li>
                  <li className="flex items-start gap-2">• Fournir des outils performants pour maximiser les gains</li>
                  <li className="flex items-start gap-2">• Assurer un accompagnement personnalisé à chaque ambassadeur</li>
                </ul>
              </Card>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <Card>
                <Eye className="w-8 h-8 text-purple-400 mb-4" />
                <h2 className="text-2xl font-bold text-white mb-4">Notre Vision</h2>
                <ul className="space-y-3 text-gray-400">
                  <li className="flex items-start gap-2">• Devenir le leader incontesté de l'affiliation en Afrique</li>
                  <li className="flex items-start gap-2">• Créer un écosystème où chacun peut vivre de ses commissions</li>
                  <li className="flex items-start gap-2">• Innover constamment pour offrir les meilleurs outils</li>
                  <li className="flex items-start gap-2">• Étendre notre réseau à de nouveaux partenaires et marchés</li>
                </ul>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Valeurs */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Nos Valeurs</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">Les principes qui guident chacune de nos actions.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map((value, i) => {
              const Icon = value.icon;
              return (
                <motion.div key={value.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                  <Card variant="interactive" className="h-full">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${value.color} flex items-center justify-center mb-4`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">{value.title}</h3>
                    <p className="text-sm text-gray-400">{value.description}</p>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Fonctionnement */}
      <section className="py-16 bg-gradient-to-b from-transparent via-purple-950/10 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Comment ça fonctionne ?</h2>
            <p className="text-gray-400 max-w-3xl mx-auto">
              26KADO vous permet de promouvoir les codes promotionnels des meilleurs bookmakers africains. 
              Vous partagez votre lien d'affiliation unique, et à chaque inscription validée via votre lien, 
              vous recevez une commission. De plus, vous gagnez 10% sur les commissions de vos filleuls !
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: 1, title: "Inscription", desc: "Créez votre compte gratuitement en quelques secondes" },
              { step: 2, title: "Partage", desc: "Partagez votre lien d'affiliation unique et votre code promo" },
              { step: 3, title: "Gains", desc: "Gagnez des commissions à chaque inscription validée" },
            ].map((item, i) => (
              <motion.div key={item.step} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <Card className="text-center h-full">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mx-auto mb-4 text-xl font-bold text-white">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-400">{item.desc}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}