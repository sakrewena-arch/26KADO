"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, CheckCircle } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Créer un compte",
    description: "Inscrivez-vous gratuitement sur 26KADO en quelques secondes.",
    image: "/images/1.png",
    color: "from-blue-500 to-blue-600",
  },
  {
    number: "02",
    title: "Faire une capture d'écran",
    description: "Inscrivez-vous chez nos partenaires avec le code promo 26KADO et faites une capture de votre inscription et dépôt.",
    image: "/images/2.png",
    color: "from-purple-500 to-purple-600",
  },
  {
    number: "03",
    title: "Remplir le formulaire de validation",
    description: "Connectez-vous à votre espace 26KADO et téléchargez vos captures.",
    image: "/images/3.png",
    color: "from-cyan-500 to-cyan-600",
  },
  {
    number: "04",
    title: "Recevoir 25% de commission",
    description: "Chaque inscription validée vous rapporte 25% du montant déposé.",
    image: "/images/4.png",
    color: "from-green-500 to-green-600",
  },
  {
    number: "05",
    title: "Validation sous 24 à 48h",
    description: "Notre équipe vérifie vos preuves sous 24 à 48h.",
    image: "/images/1.png",
    color: "from-yellow-500 to-yellow-600",
  },
  {
    number: "06",
    title: "Recevoir vos gains",
    description: "Les fonds sont crédités sur votre wallet, retirez à tout moment.",
    image: "/images/2.png",
    color: "from-emerald-500 to-emerald-600",
  },
];

export default function GuidePage() {
  return (
    <main className="min-h-screen">
      <Header />

      {/* Hero */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-sm text-blue-400 mb-6">
              <CheckCircle className="w-4 h-4" /> Guide complet
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
              Comment gagner de l'argent avec <span className="text-gradient">26KADO</span>
            </h1>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Suivez ce guide simple en 6 étapes pour commencer à gagner des commissions dès aujourd'hui.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Steps */}
      <section className="pb-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-12">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Card className={`overflow-hidden ${i % 2 === 0 ? "" : "lg:direction-rtl"}`}>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                    {/* Image */}
                    <div className={`relative h-64 lg:h-full min-h-[250px] bg-gradient-to-br ${step.color} ${i % 2 === 0 ? "lg:order-1" : "lg:order-2"}`}>
                      <img
                        src={step.image}
                        alt={step.title}
                        className="w-full h-full object-cover opacity-80"
                        onError={(e) => {
                          const t = e.target as HTMLImageElement;
                          t.style.display = "none";
                          const p = t.parentElement;
                          if (p) {
                            p.innerHTML = `<div class="flex items-center justify-center h-full"><span class="text-8xl font-bold text-white/30">${step.number}</span></div>`;
                          }
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      <div className="absolute bottom-4 left-4 text-6xl font-bold text-white/20">
                        {step.number}
                      </div>
                    </div>

                    {/* Content */}
                    <div className={`p-8 lg:p-12 flex flex-col justify-center ${i % 2 === 0 ? "lg:order-2" : "lg:order-1"}`}>
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-6 shadow-lg`}>
                        <span className="text-2xl font-bold text-white">{step.number}</span>
                      </div>
                      <h2 className="text-2xl lg:text-3xl font-bold text-white mb-4">{step.title}</h2>
                      <p className="text-gray-400 text-lg leading-relaxed">{step.description}</p>

                      {step.number === "01" && (
                        <div className="mt-6">
                          <Link href="/auth/register">
                            <Button variant="premium" size="lg">
                              Créer mon compte <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                          </Link>
                        </div>
                      )}
                      {step.number === "03" && (
                        <div className="mt-6">
                          <Link href="/dashboard/validations">
                            <Button variant="premium" size="lg">
                              Accéder au formulaire <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                          </Link>
                        </div>
                      )}
                      {step.number === "06" && (
                        <div className="mt-6">
                          <Link href="/auth/register">
                            <Button variant="premium" size="lg">
                              Commencer maintenant <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Card variant="premium" className="p-10">
            <h2 className="text-3xl font-bold text-white mb-4">Prêt à commencer ?</h2>
            <p className="text-gray-400 mb-8 max-w-lg mx-auto">
              Rejoignez des milliers de membres et commencez à gagner des commissions dès aujourd'hui.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth/register">
                <Button size="xl" variant="premium">
                  Créer mon compte gratuitement <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/bookmakers">
                <Button size="xl" variant="outline">
                  Voir les bookmakers
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>

      <Footer />
    </main>
  );
}