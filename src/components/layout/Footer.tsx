import Link from "next/link";
import { MessageCircle, Send } from "lucide-react";

const footerLinks = {
  quickLinks: [
    { title: "Accueil", href: "/" },
    { title: "À propos", href: "/about" },
    { title: "FAQ", href: "/faq" },
    { title: "Classement", href: "/leaderboard" },
    { title: "Contact", href: "/support" },
  ],
  bookmakers: [
    { title: "1xBet", href: "/#bookmakers" },
    { title: "BetWinner", href: "/#bookmakers" },
    { title: "MelBet", href: "/#bookmakers" },
    { title: "LineBet", href: "/#bookmakers" },
  ],
  legal: [
    { title: "Politique de confidentialité", href: "/privacy" },
    { title: "Conditions d'utilisation", href: "/terms" },
  ],
};

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-background/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="text-2xl font-bold text-gradient">
              26KADO
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed">
              Le meilleur programme d'affiliation des bookmakers en Afrique. 
              Promouvez, parrainez et gagnez des commissions.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://whatsapp.com/channel/0029Vb7OtjLBqbr4XtpvJx0n"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-green-400 transition-all"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
              <a
                href="https://t.me/+Tu64p4Waq2A0MDk0"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-blue-400 transition-all"
              >
                <Send className="w-5 h-5" />
              </a>
              <a
                href="https://x.com/26kado"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              Liens rapides
            </h3>
            <ul className="space-y-2">
              {footerLinks.quickLinks.map((link) => (
                <li key={link.title}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Bookmakers */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              Bookmakers
            </h3>
            <ul className="space-y-2">
              {footerLinks.bookmakers.map((link) => (
                <li key={link.title}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              Contact
            </h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="mailto:contact@26kado.com"
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  contact@26kado.com
                </a>
              </li>
              <li>
                <p className="text-sm text-gray-400">
                  Support disponible 7j/7
                </p>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-white/5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} 26KADO. Tous droits réservés.
            </p>
            <div className="flex items-center gap-4">
              {footerLinks.legal.map((link) => (
                <Link
                  key={link.title}
                  href={link.href}
                  className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {link.title}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}