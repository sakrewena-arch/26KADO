"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, Gamepad2, Upload, Coins,
  CreditCard, ArrowUpFromLine, Headphones, HelpCircle,
  Award, BarChart3, Trophy, MessageCircle, BookOpen,
  Bell, ScrollText, Settings, Menu, LogOut, Ticket, Newspaper
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getInitials } from "@/lib/utils";

const adminNavigation = [
  { title: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { title: "Utilisateurs", href: "/admin/users", icon: Users },
  { title: "Bookmakers", href: "/admin/bookmakers", icon: Gamepad2 },
  { title: "Validations", href: "/admin/validations", icon: Upload },
  { title: "Commissions", href: "/admin/commissions", icon: Coins },
  { title: "Paiements", href: "/admin/payments", icon: CreditCard },
  { title: "Retraits", href: "/admin/withdrawals", icon: ArrowUpFromLine },
  { title: "Tickets", href: "/admin/tickets", icon: Headphones },
  { title: "Coupons", href: "/admin/coupons", icon: Ticket },
  { title: "Actu Foot", href: "/admin/football-news", icon: Newspaper },
  { title: "FAQ", href: "/admin/faq", icon: HelpCircle },
  { title: "Badges", href: "/admin/badges", icon: Award },
  { title: "Niveaux", href: "/admin/levels", icon: BarChart3 },
  { title: "Classement", href: "/admin/leaderboard", icon: Trophy },
  { title: "WhatsApp", href: "/admin/whatsapp", icon: MessageCircle },
  { title: "Ressources", href: "/admin/resources", icon: BookOpen },
  { title: "Notifications", href: "/admin/notifications", icon: Bell },
  { title: "Logs", href: "/admin/logs", icon: ScrollText },
  { title: "Paramètres", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, loading } = useAuth();

  const isActive = (href: string) => pathname === href;
  const isAdminRole = profile ? ["super_admin", "admin", "moderator"].includes(profile.role) : false;

  useEffect(() => {
    if (loading) return;
    if (!profile) {
      router.replace("/dashboard");
      return;
    }
    if (user && !isAdminRole) {
      router.replace("/dashboard");
    }
  }, [loading, user, profile, isAdminRole, router]);

  return (
    <div className="min-h-screen bg-background">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed top-0 left-0 z-50 h-full w-64 bg-sidebar border-r border-white/5 transform transition-transform duration-200 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-white/5">
            <Link href="/" className="text-2xl font-bold text-gradient">26KADO</Link>
            <Badge variant="premium" className="mt-2">Administration</Badge>
          </div>
          <nav className="flex-1 p-4 space-y-0.5 overflow-y-auto">
            {adminNavigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive(item.href)
                      ? "bg-blue-500/10 text-blue-400"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t border-white/5">
            <div className="flex items-center gap-3">
              <Avatar size="sm">
                {profile?.avatar_url && <AvatarImage src={profile.avatar_url} />}
                <AvatarFallback>{profile?.full_name ? getInitials(profile.full_name) : "A"}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{profile?.full_name || "Admin"}</p>
                <p className="text-xs text-blue-400 capitalize">{profile?.role?.replace("_", " ") || "admin"}</p>
              </div>
              <Link href="/dashboard" className="p-1.5 text-gray-500 hover:text-white transition-colors" title="Dashboard utilisateur">
                <LogOut className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-white/5">
          <div className="flex items-center justify-between h-16 px-4 lg:px-8">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-gray-400 hover:text-white">
                <Menu className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Link href="/admin" className="hover:text-white">Admin</Link>
                {title && (
                  <>
                    <span>/</span>
                    <span className="text-white">{title}</span>
                  </>
                )}
              </div>
            </div>
            <Avatar size="sm">
              {profile?.avatar_url && <AvatarImage src={profile.avatar_url} />}
              <AvatarFallback>{profile?.full_name ? getInitials(profile.full_name) : "A"}</AvatarFallback>
            </Avatar>
          </div>
        </header>
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}