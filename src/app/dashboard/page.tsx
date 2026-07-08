"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useWallet } from "@/hooks/useWallet";
import { useNotifications } from "@/hooks/useNotifications";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Wallet, Coins, Users, Upload, TrendingUp,
  ArrowRight, Copy, Check, ExternalLink
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const { wallet, transactions } = useWallet();
  const { notifications } = useNotifications();
  const [copied, setCopied] = useState(false);

  // Fallback: utiliser l'ID utilisateur si le profil n'est pas encore chargé
  const displayCode = profile?.referral_code || (user ? `26KADO-${user.id.slice(0, 6).toUpperCase()}` : "");
  const referralLink = displayCode
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/auth/register?ref=${displayCode}`
    : "";

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const stats = [
    {
      title: "Solde",
      value: formatCurrency(profile?.total_commission || 0),
      icon: Wallet,
      color: "from-blue-500/20 to-purple-500/20 text-blue-400",
      href: "/dashboard/wallet",
    },
    {
      title: "Commissions",
      value: formatCurrency(profile?.total_commission || 0),
      icon: Coins,
      color: "from-green-500/20 to-emerald-500/20 text-green-400",
      href: "/dashboard/commissions",
    },
    {
      title: "Filleuls",
      value: `${profile?.total_referrals || 0}`,
      icon: Users,
      color: "from-yellow-500/20 to-amber-500/20 text-yellow-400",
      href: "/dashboard/referrals",
    },
    {
      title: "Validations",
      value: `${profile?.total_validations || 0}`,
      icon: Upload,
      color: "from-cyan-500/20 to-blue-500/20 text-cyan-400",
      href: "/dashboard/validations",
    },
  ];

  return (
    <DashboardLayout title="Tableau de bord">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.title} href={stat.href}>
              <Card className="hover:scale-[1.02] transition-all duration-300 cursor-pointer">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-400">{stat.title}</p>
                    <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Referral Link & QR Code */}
        <Card className="lg:col-span-1">
          <h3 className="text-lg font-semibold text-white mb-4">Lien de parrainage</h3>
          {displayCode ? (
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-white rounded-xl relative group">
                <QRCodeSVG value={referralLink} size={160} id="qrcode-referral" />
                <button
                  onClick={() => {
                    const canvas = document.getElementById('qrcode-referral')?.parentElement?.querySelector('canvas');
                    if (canvas) {
                      const link = document.createElement('a');
                      link.download = `26KADO-${displayCode}.png`;
                      link.href = canvas.toDataURL('image/png');
                      link.click();
                    } else {
                      // Fallback: create a temporary canvas from SVG
                      const svg = document.getElementById('qrcode-referral')?.parentElement?.querySelector('svg');
                      if (svg) {
                        const serializer = new XMLSerializer();
                        const svgStr = serializer.serializeToString(svg);
                        const canvas = document.createElement('canvas');
                        canvas.width = 160;
                        canvas.height = 160;
                        const ctx = canvas.getContext('2d');
                        const img = new Image();
                        img.onload = () => {
                          ctx?.drawImage(img, 0, 0);
                          const link = document.createElement('a');
                          link.download = `26KADO-${displayCode}.png`;
                          link.href = canvas.toDataURL('image/png');
                          link.click();
                        };
                        img.src = 'data:image/svg+xml;base64,' + btoa(svgStr);
                      }
                    }
                  }}
                  className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                >
                  Télécharger
                </button>
              </div>
              <div className="w-full space-y-2">
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                  <span className="text-sm text-yellow-400 font-bold font-mono truncate">
                    {displayCode}
                  </span>
                  <button onClick={copyLink} className="text-blue-400 hover:text-blue-300">
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 text-center break-all">{referralLink}</p>
                <Link href="/dashboard/referrals">
                  <Button variant="outline" className="w-full" size="sm">
                    Voir mes parrainages
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="w-40 h-40 rounded-xl bg-white/5 animate-pulse flex items-center justify-center">
                <Users className="w-8 h-8 text-gray-600" />
              </div>
              <p className="text-sm text-gray-500">Code de parrainage unique</p>
              <p className="text-xs text-gray-600">Connectez-vous pour générer votre code</p>
            </div>
          )}
        </Card>

        {/* Recent Transactions */}
        <Card className="lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Dernières transactions</h3>
            <Link href="/dashboard/wallet" className="text-sm text-blue-400 hover:text-blue-300">
              Voir tout
            </Link>
          </div>
          <div className="space-y-3">
            {transactions.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">Aucune transaction</p>
            ) : (
              transactions.slice(0, 5).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                  <div>
                    <p className="text-sm text-white">
                      {tx.type === "credit" ? "+" : "-"}{formatCurrency(tx.amount)}
                    </p>
                    <p className="text-xs text-gray-500">{tx.description}</p>
                  </div>
                  <Badge variant={tx.type === "credit" ? "success" : "warning"}>
                    {tx.type === "credit" ? "Crédit" : "Débit"}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Recent Notifications */}
        <Card className="lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Notifications</h3>
            <Link href="/dashboard/notifications" className="text-sm text-blue-400 hover:text-blue-300">
              Voir tout
            </Link>
          </div>
          <div className="space-y-3">
            {notifications.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">Aucune notification</p>
            ) : (
              notifications.slice(0, 5).map((notif) => (
                <div key={notif.id} className="p-3 rounded-xl bg-white/5">
                  <p className="text-sm text-white">{notif.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{notif.message}</p>
                  <p className="text-xs text-gray-600 mt-1">{formatDate(notif.created_at)}</p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-white mb-4">Actions rapides</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href="/dashboard/validations">
            <Card variant="interactive" className="text-center">
              <Upload className="w-6 h-6 text-blue-400 mx-auto mb-2" />
              <p className="text-sm text-white font-medium">Valider une inscription</p>
              <p className="text-xs text-gray-500 mt-1">Envoyer les preuves</p>
            </Card>
          </Link>
          <Link href="/dashboard/commissions">
            <Card variant="interactive" className="text-center">
              <TrendingUp className="w-6 h-6 text-green-400 mx-auto mb-2" />
              <p className="text-sm text-white font-medium">Mes commissions</p>
              <p className="text-xs text-gray-500 mt-1">Voir l'historique</p>
            </Card>
          </Link>
          <Link href="/dashboard/wallet">
            <Card variant="interactive" className="text-center">
              <Wallet className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
              <p className="text-sm text-white font-medium">Effectuer un retrait</p>
              <p className="text-xs text-gray-500 mt-1">Accéder au portefeuille</p>
            </Card>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}