"use client";

import { motion } from "framer-motion";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Shield } from "lucide-react";

const sections = [
  {
    title: "1. Collecte des informations",
    content: `Nous collectons les informations suivantes lorsque vous utilisez 26KADO :

• Informations d'inscription : nom, prénom, adresse email, numéro de téléphone
• Informations de profil : photo de profil, code de parrainage
• Données de transaction : historiques des commissions, retraits et dépôts
• Données d'utilisation : pages visitées, interactions avec la plateforme
• Informations techniques : adresse IP, type de navigateur, système d'exploitation`,
  },
  {
    title: "2. Utilisation des informations",
    content: `Les informations collectées sont utilisées pour :

• Créer et gérer votre compte utilisateur
• Traiter vos commissions et retraits
• Calculer et créditer les commissions de parrainage
• Vous envoyer des notifications concernant votre activité
• Améliorer nos services et l'expérience utilisateur
• Assurer la sécurité de la plateforme et prévenir la fraude
• Vous informer des promotions et offres spéciales (avec votre consentement)`,
  },
  {
    title: "3. Partage des informations",
    content: `Nous ne partageons pas vos informations personnelles avec des tiers, sauf dans les cas suivants :

• Avec votre consentement explicite
• Pour traiter les paiements via nos partenaires (PayDunya, opérateurs mobile money)
• Pour se conformer à une obligation légale ou réglementaire
• Pour protéger nos droits, notre propriété ou notre sécurité
• Avec des prestataires de services qui nous aident à exploiter la plateforme (hébergement, analyse)`,
  },
  {
    title: "4. Protection des données",
    content: `Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles pour protéger vos données :

• Chiffrement des données en transit (SSL/TLS)
• Accès restreint aux données sensibles
• Sauvegardes régulières de la base de données
• Surveillance continue des accès et activités suspectes
• Politiques de sécurité strictes pour notre personnel
• Conformité aux normes de sécurité en vigueur`,
  },
  {
    title: "5. Vos droits",
    content: `Conformément à la réglementation sur la protection des données, vous disposez des droits suivants :

• Droit d'accès : consulter l'ensemble de vos données personnelles
• Droit de rectification : modifier vos informations inexactes
• Droit à l'effacement : demander la suppression de votre compte et de vos données
• Droit à la limitation du traitement : restreindre l'utilisation de vos données
• Droit à la portabilité : récupérer vos données dans un format structuré
• Droit d'opposition : vous opposer au traitement de vos données

Pour exercer ces droits, contactez-nous à : contact@26kado.com`,
  },
  {
    title: "6. Cookies",
    content: `26KADO utilise des cookies pour améliorer votre expérience :

• Cookies essentiels : nécessaires au fonctionnement de la plateforme (authentification, session)
• Cookies fonctionnels : mémorisent vos préférences (thème, langue)
• Cookies d'analyse : nous aident à comprendre comment vous utilisez la plateforme

Vous pouvez contrôler l'utilisation des cookies via les paramètres de votre navigateur.`,
  },
  {
    title: "7. Durée de conservation",
    content: `Nous conservons vos données personnelles aussi longtemps que votre compte est actif. En cas de suppression de compte, vos données sont anonymisées ou supprimées dans un délai de 90 jours, sauf obligation légale de conservation plus longue.

Les données de transaction sont conservées à des fins comptables et fiscales pendant la durée requise par la loi.`,
  },
  {
    title: "8. Contact",
    content: `Pour toute question concernant cette politique de confidentialité ou pour exercer vos droits, vous pouvez nous contacter :

• Email : contact@26kado.com
• Support : via la page Contact de la plateforme
• WhatsApp : via notre groupe officiel

Nous nous engageons à répondre à toutes vos demandes dans un délai maximum de 48 heures.`,
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen">
      <Header />

      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-sm text-blue-400 mb-6">
              <Shield className="w-4 h-4" /> Confidentialité
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
              Politique de <span className="text-gradient">confidentialité</span>
            </h1>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Dernière mise à jour : Juillet 2026
            </p>
          </motion.div>
        </div>
      </section>

      <section className="pb-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="p-6 rounded-2xl bg-blue-500/5 border border-blue-500/10 mb-8"
          >
            <p className="text-sm text-gray-300 leading-relaxed">
              Chez <strong className="text-white">26KADO</strong>, nous accordons une grande importance à la protection de vos données personnelles. Cette politique de confidentialité explique comment nous collectons, utilisons et protégeons vos informations lorsque vous utilisez notre plateforme d'affiliation de bookmakers.
            </p>
          </motion.div>

          <div className="space-y-8">
            {sections.map((section, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-blue-500/20 transition-colors"
              >
                <h2 className="text-xl font-bold text-white mb-4">{section.title}</h2>
                <div className="text-sm text-gray-400 leading-relaxed whitespace-pre-line">
                  {section.content}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}