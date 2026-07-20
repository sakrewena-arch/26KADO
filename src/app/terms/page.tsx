"use client";

import { motion } from "framer-motion";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Scale } from "lucide-react";

const sections = [
  {
    title: "1. Acceptation des conditions",
    content: `En accédant et en utilisant la plateforme 26KADO, vous acceptez d'être lié par les présentes conditions d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser nos services.

Nous nous réservons le droit de modifier ces conditions à tout moment. Les modifications entrent en vigueur dès leur publication sur la plateforme. Il est de votre responsabilité de consulter régulièrement cette page.`,
  },
  {
    title: "2. Description du service",
    content: `26KADO est une plateforme d'affiliation qui permet aux utilisateurs (les "affiliés") de :

• Promouvoir les codes promo et liens d'affiliation des bookmakers partenaires (1xBet, BetWinner, MelBet, LineBet)
• Gagner des commissions sur les inscriptions validées via leurs liens de parrainage
• Bénéficier d'un programme de parrainage avec commission sur les filleuls
• Accéder à des ressources marketing et des outils de suivi

La plateforme agit comme intermédiaire entre les affiliés et les bookmakers.`,
  },
  {
    title: "3. Inscription et compte",
    content: `Pour utiliser nos services, vous devez créer un compte en fournissant des informations exactes et complètes :

• Vous devez être âgé d'au moins 18 ans
• Chaque utilisateur ne peut créer qu'un seul compte
• Vous êtes responsable de la confidentialité de vos identifiants
• Vous devez fournir une adresse email valide
• Le code de parrainage est généré automatiquement et ne peut être modifié

Nous nous réservons le droit de suspendre ou supprimer tout compte en cas de non-respect de ces conditions.`,
  },
  {
    title: "4. Commissions et paiements",
    content: `Les commissions sont calculées selon les modalités suivantes :

• Taux de commission : 25% du montant du premier dépôt validé
• Commission de parrainage : 10% des commissions générées par vos filleuls
• Les commissions sont créditées après validation des preuves d'inscription et de dépôt
• Le montant minimum de retrait est de 5 000 FCFA
• Les paiements sont effectués via Mobile Money ou carte bancaire
• Les délais de traitement peuvent varier selon le mode de paiement choisi

26KADO se réserve le droit de modifier les taux de commission avec préavis.`,
  },
  {
    title: "5. Validation des inscriptions",
    content: `Pour qu'une inscription soit validée et donne droit à une commission, l'utilisateur doit :

• S'inscrire via le lien d'affiliation ou le code promo 26KADO
• Effectuer un premier dépôt chez le bookmaker partenaire
• Fournir des preuves claires (captures d'écran) de l'inscription et du dépôt
• Respecter les conditions générales du bookmaker partenaire

Toute tentative de fraude ou de manipulation entraînera le rejet de la commission et la suspension du compte.`,
  },
  {
    title: "6. Programme de parrainage",
    content: `Le programme de parrainage fonctionne comme suit :

• Chaque membre reçoit un code de parrainage unique
• Vous pouvez inviter de nouveaux membres à rejoindre 26KADO via votre code
• Vous gagnez 10% des commissions générées par vos filleuls directs
• Les filleuls sont suivis via leur code de parrainage
• Les commissions de parrainage sont créditées en même temps que la commission du filleul

Le parrainage multiple (création de comptes multiples) est strictement interdit.`,
  },
  {
    title: "7. Utilisation autorisée",
    content: `En tant qu'utilisateur de 26KADO, vous vous engagez à :

• Utiliser la plateforme conformément à ces conditions
• Ne pas créer de comptes multiples ou falsifiés
• Ne pas tenter de manipuler le système de commissions
• Ne pas utiliser de méthodes frauduleuses pour générer des inscriptions
• Ne pas diffuser de contenu inapproprié ou illégal
• Respecter les droits de propriété intellectuelle de 26KADO et de ses partenaires
• Fournir des informations exactes lors de votre inscription`,
  },
  {
    title: "8. Propriété intellectuelle",
    content: `Tous les contenus présents sur 26KADO (logos, textes, graphiques, images, logiciels) sont la propriété exclusive de 26KADO ou de ses partenaires. Vous n'êtes pas autorisé à :

• Reproduire, distribuer ou modifier ces contenus sans autorisation
• Utiliser les marques et logos de 26KADO à des fins commerciales
• Copier ou imiter la structure de la plateforme

Les marques des bookmakers partenaires restent la propriété de leurs détenteurs respectifs.`,
  },
  {
    title: "9. Limitation de responsabilité",
    content: `26KADO ne saurait être tenu responsable pour :

• Les dommages directs ou indirects résultant de l'utilisation de la plateforme
• Les interruptions de service ou pertes de données
• Les actions des bookmakers partenaires
• Les pertes financières liées aux activités de paris sportifs
• Les problèmes techniques indépendants de notre volonté

La plateforme est fournie "telle quelle" sans garantie expresse ou implicite.`,
  },
  {
    title: "10. Résiliation",
    content: `26KADO se réserve le droit de résilier ou suspendre un compte pour :

• Non-respect des présentes conditions d'utilisation
• Activité frauduleuse ou suspecte
• Inactivité prolongée du compte
• Demande de l'utilisateur
• Manquement aux obligations légales ou réglementaires

En cas de résiliation, les commissions en attente pourront être annulées si elles résultent d'activités frauduleuses.`,
  },
  {
    title: "11. Modification des services",
    content: `26KADO se réserve le droit de modifier, suspendre ou interrompre ses services à tout moment, notamment pour :

• Améliorer ou mettre à jour la plateforme
• Se conformer aux exigences légales ou réglementaires
• Modifier les conditions commerciales avec les partenaires
• Assurer la sécurité et l'intégrité de la plateforme

Les utilisateurs seront informés des modifications importantes via les notifications de la plateforme.`,
  },
  {
    title: "12. Contact et support",
    content: `Pour toute question relative à ces conditions d'utilisation, vous pouvez nous contacter :

• Email : contact@26kado.com
• Support : via la page Contact de la plateforme
• WhatsApp : via notre groupe officiel

Nous nous engageons à répondre à toutes vos demandes dans un délai maximum de 48 heures ouvrées.`,
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen">
      <Header />

      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-sm text-purple-400 mb-6">
              <Scale className="w-4 h-4" /> Conditions légales
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
              Conditions d'<span className="text-gradient">utilisation</span>
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
            className="p-6 rounded-2xl bg-purple-500/5 border border-purple-500/10 mb-8"
          >
            <p className="text-sm text-gray-300 leading-relaxed">
              Bienvenue sur <strong className="text-white">26KADO</strong>. En utilisant notre plateforme, vous acceptez les présentes conditions d'utilisation. Nous vous invitons à les lire attentivement avant de créer un compte ou d'utiliser nos services d'affiliation.
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
                className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/20 transition-colors"
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