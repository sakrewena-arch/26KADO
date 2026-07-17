"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import MobileNav from "./MobileNav";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { siteConfig } from "@/config/site";
import { getInitials } from "@/lib/utils";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { user, profile, loading } = useAuth();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const navigation = siteConfig.navigation;

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group shrink-0">
              <img src="/images/logo.png" alt="26KADO" className="h-7 sm:h-8 w-auto max-w-[120px] sm:max-w-[160px] object-contain" />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive(item.href)
                      ? "text-white bg-white/10"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {item.title}
                </Link>
              ))}
              {/* Guide button in nav */}
              <Link href="/guide">
                <Button variant="premium" size="sm" className="ml-2">
                  Guide
                </Button>
              </Link>
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {/* Guide button - always visible on mobile & desktop */}
              <Link href="/guide" className="lg:hidden">
                <Button variant="premium" size="sm" className="text-xs px-3 py-1.5">
                  Guide
                </Button>
              </Link>
              {loading ? (
                <div className="w-20 h-9 rounded-lg bg-white/5 animate-pulse" />
              ) : user ? (
                <Link href="/dashboard" className="flex items-center gap-2 group">
                  <Avatar size="sm">
                    {profile?.avatar_url && <AvatarImage src={profile.avatar_url} />}
                    <AvatarFallback>
                      {profile?.full_name ? getInitials(profile.full_name) : <User className="w-4 h-4" />}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden lg:block text-sm text-gray-300 group-hover:text-white transition-colors">
                    {profile?.full_name || "Dashboard"}
                  </span>
                </Link>
              ) : (
                <div className="hidden lg:flex items-center gap-2">
                  <Link href="/auth/login">
                    <Button variant="ghost" size="sm">
                      Connexion
                    </Button>
                  </Link>
                  <Link href="/auth/register">
                    <Button variant="premium" size="sm">
                      Inscription
                    </Button>
                  </Link>
                </div>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden p-2 text-gray-400 hover:text-white transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <MobileNav isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}