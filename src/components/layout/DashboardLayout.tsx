"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Coins, Wallet, Upload, Users,
  Headphones, BookOpen, Bell, Menu, X, LogOut,
  ChevronRight, ArrowUpFromLine
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getInitials } from "@/lib/utils";

const navigation = [
  { title: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard },
  { title: "Commissions", href: "/dashboard/commissions", icon: Coins },
  { title: "Portefeuille", href: "/dashboard/wallet", icon: Wallet },
  { title: "Retrait", href: "/dashboard/retrait", icon: ArrowUpFromLine },
  { title: "Validations", href: "/dashboard/validations", icon: Upload },
  { title: "Parrainages", href: "/dashboard/referrals", icon: Users },
  { title: "Support", href: "/dashboard/support", icon: Headphones },
  { title: "Ressources", href: "/dashboard/resources", icon: BookOpen },
  { title: "Notifications", href: "/dashboard/notifications", icon: Bell },
];

export default function DashboardLayout({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { user, profile, signOut, loading: authLoading } = useAuth();
  const { unreadCount, loading: notifLoading } = useNotifications();

  const isActive = (href: string) => pathname === href;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-sidebar border-r border-white/5 transform transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-white/5">
            <Link href="/" className="text-2xl font-bold text-gradient">
              26KADO
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive(item.href)
                      ? "bg-blue-500/10 text-blue-400"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span>{item.title}</span>
                  {item.href === "/dashboard/notifications" && unreadCount > 0 && (
                    <Badge variant="danger" className="ml-auto text-xs px-1.5 py-0.5">
                      {unreadCount}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User info */}
          <div className="p-4 border-t border-white/5">
            <div className="flex items-center gap-3">
              <Avatar size="sm">
                {profile?.avatar_url && <AvatarImage src={profile.avatar_url} />}
                <AvatarFallback>
                  {profile?.full_name ? getInitials(profile.full_name) : "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {profile?.full_name || "Utilisateur"}
                </p>
                <p className="text-xs text-gray-500 truncate">{profile?.email}</p>
              </div>
              <button
                onClick={signOut}
                className="p-1.5 text-gray-500 hover:text-red-400 transition-colors"
                title="Déconnexion"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-white/5">
          <div className="flex items-center justify-between h-16 px-4 lg:px-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 text-gray-400 hover:text-white"
              >
                <Menu className="w-5 h-5" />
              </button>
              {title && (
                <h1 className="text-lg font-semibold text-white">{title}</h1>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/notifications"
                className="relative p-2 text-gray-400 hover:text-white transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
              <Link href="/dashboard">
                <Avatar size="sm">
                  {profile?.avatar_url && <AvatarImage src={profile.avatar_url} />}
                  <AvatarFallback>
                    {profile?.full_name ? getInitials(profile.full_name) : "U"}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}