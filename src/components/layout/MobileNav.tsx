"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigation = [
  { title: "Accueil", href: "/" },
  { title: "Bookmakers", href: "/#bookmakers" },
  { title: "Coupons", href: "/coupons" },
  { title: "Actu Foot", href: "/football-news" },
  { title: "À propos", href: "/about" },
  { title: "FAQ", href: "/faq" },
  { title: "Classement", href: "/leaderboard" },
  { title: "Contact", href: "/support" },
];

export default function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const { user } = useAuth();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-card border-l border-white/10 z-50 p-6"
          >
            <div className="flex items-center justify-between mb-8">
              <Link href="/" onClick={onClose} className="text-xl font-bold text-gradient">
                26KADO
              </Link>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex flex-col gap-1">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className="px-4 py-3 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                >
                  {item.title}
                </Link>
              ))}
            </nav>

            <div className="mt-8 pt-8 border-t border-white/10 space-y-3">
              {user ? (
                <Link href="/dashboard" onClick={onClose}>
                  <Button className="w-full" variant="default">
                    Tableau de bord
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/auth/login" onClick={onClose}>
                    <Button className="w-full" variant="secondary">
                      Connexion
                    </Button>
                  </Link>
                  <Link href="/auth/register" onClick={onClose}>
                    <Button className="w-full" variant="premium">
                      Inscription
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}