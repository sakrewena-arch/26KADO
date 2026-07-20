"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import {
  Mail, Phone, MapPin, MessageCircle, Send, Clock,
  ChevronRight, Check, Loader2
} from "lucide-react";

const contactMethods = [
  {
    icon: Mail,
    title: "Email",
    value: "contact@26kado.com",
    href: "mailto:contact@26kado.com",
    color: "from-blue-500/20 to-cyan-500/20 text-blue-400",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp",
    value: "Rejoindre le canal WhatsApp",
    href: "https://whatsapp.com/channel/0029Vb7OtjLBqbr4XtpvJx0n",
    color: "from-green-500/20 to-emerald-500/20 text-green-400",
  },
  {
    icon: Send,
    title: "Telegram",
    value: "Rejoindre le groupe Telegram",
    href: "https://t.me/+Tu64p4Waq2A0MDk0",
    color: "from-blue-400/20 to-indigo-500/20 text-blue-400",
  },
  {
    icon: Clock,
    title: "Disponibilité",
    value: "Support 7j/7 - 24h/24",
    color: "from-purple-500/20 to-pink-500/20 text-purple-400",
  },
];

const faqQuestions = [
  {
    q: "Comment sont calculées mes commissions ?",
    a: "Vous recevez 25% du montant du premier dépôt de chaque filleul, plus 10% des commissions de vos filleuls directs.",
  },
  {
    q: "Quand est-ce que je reçois mes commissions ?",
    a: "Les commissions sont créditées sur votre wallet dans les 24h suivant la validation du dépôt de votre filleul.",
  },
  {
    q: "Quels sont les moyens de retrait disponibles ?",
    a: "Nous supportons Orange Money, MTN Mobile Money, Wave et PayDunya pour vos retraits.",
  },
  {
    q: "Y a-t-il un montant minimum de retrait ?",
    a: "Le montant minimum de retrait est de 5 000 FCFA. Le maximum est de 1 000 000 FCFA par transaction.",
  },
];

export default function SupportPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate sending
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <main className="min-h-screen">
      <Header />

      {/* Hero */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute top-1/3 left-1/3 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: "1s" }} />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="premium" className="mb-4">Contact</Badge>
            <h1 className="text-4xl lg:text-6xl font-bold text-white mb-4">
              Contactez-<span className="text-gradient">nous</span>
            </h1>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Une question, une suggestion ou besoin d'aide ? Notre équipe est là pour vous répondre 7j/7.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactMethods.map((method, i) => {
              const Icon = method.icon;
              return (
                <motion.div
                  key={method.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                >
                  <Card variant="interactive" className="h-full">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${method.color} flex items-center justify-center mb-4`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-1">{method.title}</h3>
                    {method.href ? (
                      <a
                        href={method.href}
                        target={method.href.startsWith("http") ? "_blank" : undefined}
                        rel={method.href.startsWith("http") ? "noopener noreferrer" : undefined}
                        className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        {method.value}
                      </a>
                    ) : (
                      <p className="text-sm text-gray-400">{method.value}</p>
                    )}
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact Form + Info */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Form */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card className="p-6 lg:p-8">
                <h2 className="text-2xl font-bold text-white mb-6">Envoyez-nous un message</h2>
                {submitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12"
                  >
                    <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                      <Check className="w-8 h-8 text-green-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Message envoyé !</h3>
                    <p className="text-gray-400 mb-6">
                      Merci de nous avoir contactés. Nous vous répondrons dans les plus brefs délais.
                    </p>
                    <Button
                      variant="default"
                      onClick={() => {
                        setSubmitted(false);
                        setFormData({ name: "", email: "", subject: "", message: "" });
                      }}
                    >
                      Envoyer un autre message
                    </Button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-gray-300">Nom complet</Label>
                        <Input
                          id="name"
                          placeholder="Votre nom"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-gray-300">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="votre@email.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject" className="text-gray-300">Sujet</Label>
                      <Input
                        id="subject"
                        placeholder="Objet de votre message"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        required
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-gray-300">Message</Label>
                      <Textarea
                        id="message"
                        placeholder="Décrivez votre demande en détail..."
                        rows={6}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        required
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 resize-none"
                      />
                    </div>
                    <Button type="submit" variant="premium" className="w-full" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Envoi en cours...
                        </>
                      ) : (
                        <>
                          Envoyer le message
                          <ChevronRight className="ml-2 w-5 h-5" />
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </Card>
            </motion.div>

            {/* Info */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <Card variant="premium" className="p-6 lg:p-8">
                <h2 className="text-2xl font-bold text-white mb-4">Informations</h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Email</p>
                      <a href="mailto:contact@26kado.com" className="text-white hover:text-blue-400 transition-colors">
                        contact@26kado.com
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <MessageCircle className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">WhatsApp</p>
                      <a href="https://whatsapp.com/channel/0029Vb7OtjLBqbr4XtpvJx0n" target="_blank" rel="noopener noreferrer" className="text-white hover:text-green-400 transition-colors">
                        Rejoindre le canal WhatsApp
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Disponibilité</p>
                      <p className="text-white">Support 7j/7 - 24h/24</p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6 lg:p-8">
                <h2 className="text-xl font-bold text-white mb-4">Questions fréquentes</h2>
                <div className="space-y-4">
                  {faqQuestions.map((item, i) => (
                    <details key={i} className="group">
                      <summary className="flex items-center justify-between cursor-pointer text-sm text-gray-300 hover:text-white transition-colors list-none">
                        {item.q}
                        <ChevronRight className="w-4 h-4 text-gray-500 group-open:rotate-90 transition-transform flex-shrink-0 ml-2" />
                      </summary>
                      <p className="mt-2 text-sm text-gray-400 leading-relaxed">
                        {item.a}
                      </p>
                    </details>
                  ))}
                </div>
                <div className="mt-6 pt-4 border-t border-white/5">
                  <Link href="/faq" className="text-sm text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center gap-1">
                    Voir toutes les FAQ
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 text-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Card variant="premium" className="py-12 px-8 max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-white mb-4">
                Rejoignez la communauté 26KADO
              </h2>
              <p className="text-gray-400 mb-8 max-w-xl mx-auto">
                Suivez-nous sur les réseaux sociaux pour ne rien manquer des dernières offres et actualités.
              </p>
              <div className="flex items-center justify-center gap-4">
                <a
                  href="https://whatsapp.com/channel/0029Vb7OtjLBqbr4XtpvJx0n"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl bg-green-500/20 hover:bg-green-500/30 text-green-400 transition-all"
                >
                  <MessageCircle className="w-6 h-6" />
                </a>
                <a
                  href="https://t.me/+Tu64p4Waq2A0MDk0"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 transition-all"
                >
                  <Send className="w-6 h-6" />
                </a>
                <a
                  href="https://x.com/26kado"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
}