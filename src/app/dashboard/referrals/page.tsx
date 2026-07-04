"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { getReferrals } from "@/lib/supabase/queries";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Users, Copy, Check, ExternalLink, Gift } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import type { Referral } from "@/types";

export default function ReferralsPage() {
  const { user, profile } = useAuth();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  const referralLink = profile?.referral_code
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/auth/register?ref=${profile.referral_code}`
    : "";

  useEffect(() => {
    if (user) {
      getReferrals(user.id).then((data) => {
        setReferrals(data);
        setLoading(false);
      });
    }
  }, [user]);

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalEarned = referrals.reduce((sum, r) => sum + Number(r.total_commission_earned), 0);

  return (
    <DashboardLayout title="Parrainages">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Referral Info */}
        <Card className="lg:col-span-1">
          <h3 className="text-lg font-semibold text-white mb-4">Votre lien de parrainage</h3>
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-white rounded-xl">
              <QRCodeSVG value={referralLink} size={180} />
            </div>
            <div className="w-full space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                <span className="text-sm font-mono text-yellow-400">{profile?.referral_code}</span>
                <button onClick={copyLink} className="text-blue-400 hover:text-blue-300">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <div className="p-3 rounded-xl bg-white/5 text-xs text-gray-400 break-all">
                {referralLink}
              </div>
              <Button className="w-full" variant="outline" size="sm" onClick={copyLink}>
                {copied ? "Copié !" : "Copier le lien"}
                <Copy className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Stats */}
        <Card className="lg:col-span-2">
          <h3 className="text-lg font-semibold text-white mb-4">Statistiques</h3>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-white/5 text-center">
              <p className="text-2xl font-bold text-blue-400">{profile?.total_referrals || 0}</p>
              <p className="text-xs text-gray-400 mt-1">Filleuls</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 text-center">
              <p className="text-2xl font-bold text-green-400">{formatCurrency(totalEarned)}</p>
              <p className="text-xs text-gray-400 mt-1">Gagné</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 text-center">
              <p className="text-2xl font-bold text-yellow-400">10%</p>
              <p className="text-xs text-gray-400 mt-1">Commission</p>
            </div>
          </div>

          <h4 className="text-sm font-medium text-white mb-3">Mes filleuls</h4>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <div key={i} className="h-14 rounded-xl bg-white/5 animate-pulse" />)}
            </div>
          ) : referrals.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500">Aucun filleul pour le moment</p>
              <p className="text-xs text-gray-600 mt-1">Partagez votre lien pour commencer</p>
            </div>
          ) : (
            <div className="space-y-2">
              {referrals.map((ref) => (
                <div key={ref.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                  <div className="flex items-center gap-3">
                    <Gift className="w-4 h-4 text-blue-400" />
                    <div>
                      <p className="text-sm text-white">{ref.referred?.full_name || "Inconnu"}</p>
                      <p className="text-xs text-gray-500">{formatDate(ref.created_at)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-green-400">{formatCurrency(Number(ref.total_commission_earned))}</p>
                    <p className="text-xs text-gray-500">gagné</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}