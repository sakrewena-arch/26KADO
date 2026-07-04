"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, ChevronDown, HelpCircle } from "lucide-react";

const faqData = [
  {
    category: "Général",
    questions: [
      { q: "Qu'est-ce que 26KADO ?", a: "26KADO est la plateforme N°1 d'affiliation des bookmakers en Afrique. Nous vous permettons de promouvoir les codes promotionnels de 1xBet, BetWinner, MelBet et LineBet et de gagner des commissions sur chaque inscription validée." },
      { q: "Est-ce gratuit de s'inscrire ?", a: "Oui, l'inscription sur 26KADO est totalement gratuite. Vous créez votre compte, recevez votre lien d'affiliation unique et commencez à gagner des commissions." },
      { q: "Comment gagner de l'argent avec 26KADO ?", a: "Vous partagez votre lien d'affiliation unique. Quand une personne s'inscrit via votre lien et effectue un premier dépôt, vous recevez une commission. Vous gagnez aussi 10% sur les commissions de vos filleuls." },
    ],
  },
  {
    category: "Commissions",
    questions: [
      { q: "Quand sont versées les commissions ?", a: "Les commissions sont versées après validation des preuves par notre équipe. Le délai de traitement est généralement de 24 à 48 heures." },
      { q: "Quel est le montant des commissions ?", a: "Le montant varie selon le bookmaker et le montant du dépôt. Utilisez notre simulateur sur la page d'accueil pour estimer vos gains potentiels." },
      { q: "Comment sont calculées les commissions de parrainage ?", a: "Vous recevez automatiquement 10% de toutes les commissions validées de vos filleuls directs. Par exemple, si un filleul reçoit 50 000 FCFA, vous recevez 5 000 FCFA." },
    ],
  },
  {
    category: "Paiements",
    questions: [
      { q: "Quels sont les moyens de paiement disponibles ?", a: "Nous supportons Orange Money, MTN Mobile Money, Wave et PayDunya. Vous pouvez choisir votre méthode de retrait préférée." },
      { q: "Quel est le montant minimum de retrait ?", a: "Le montant minimum de retrait est de 5 000 FCFA. Le maximum est de 1 000 000 FCFA par transaction." },
      { q: "Combien de temps prend un retrait ?", a: "Les retraits sont traités sous 24 à 48 heures ouvrées après validation de la demande." },
    ],
  },
  {
    category: "Parrainage",
    questions: [
      { q: "Comment obtenir mon lien de parrainage ?", a: "Connectez-vous à votre tableau de bord. Votre code et lien de parrainage uniques y sont affichés avec votre QR Code." },
      { q: "Puis-je parrainer autant de personnes que je veux ?", a: "Oui, il n'y a aucune limite. Plus vous parrainez, plus vous gagnez !" },
    ],
  },
];

export default function FaqPage() {
  const [search, setSearch] = useState("");
  const [openCategory, setOpenCategory] = useState<string | null>("Général");
  const [openQuestion, setOpenQuestion] = useState<string | null>(null);

  const filtered = faqData
    .map((cat) => ({
      ...cat,
      questions: cat.questions.filter(
        (q) => q.q.toLowerCase().includes(search.toLowerCase()) || q.a.toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter((cat) => cat.questions.length > 0);

  return (
    <main className="min-h-screen">
      <Header />
      <section className="relative pt-32 pb-16">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <Badge variant="premium" className="mb-4">FAQ</Badge>
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">Questions fréquentes</h1>
            <p className="text-gray-400">Tout ce que vous devez savoir sur 26KADO</p>
          </motion.div>

          <div className="relative mb-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <Input
              placeholder="Rechercher une question..."
              className="pl-12 h-12"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="space-y-4">
            {filtered.map((category) => (
              <Card key={category.category}>
                <button
                  onClick={() => setOpenCategory(openCategory === category.category ? null : category.category)}
                  className="w-full flex items-center justify-between p-4"
                >
                  <h3 className="text-lg font-semibold text-white">{category.category}</h3>
                  <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${openCategory === category.category ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {openCategory === category.category && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="px-4 pb-4 space-y-2">
                        {category.questions.map((item) => (
                          <div key={item.q} className="rounded-xl bg-white/5">
                            <button
                              onClick={() => setOpenQuestion(openQuestion === item.q ? null : item.q)}
                              className="w-full flex items-center justify-between p-3 text-left"
                            >
                              <span className="text-sm text-gray-300">{item.q}</span>
                              <ChevronDown className={`w-4 h-4 text-gray-500 flex-shrink-0 transition-transform ${openQuestion === item.q ? "rotate-180" : ""}`} />
                            </button>
                            <AnimatePresence>
                              {openQuestion === item.q && (
                                <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                                  <p className="px-3 pb-3 text-sm text-gray-400">{item.a}</p>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}