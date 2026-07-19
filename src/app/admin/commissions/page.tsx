"use client";

import { useEffect, useState, useCallback } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAllCommissions } from "@/lib/supabase/queries";
import { formatCurrency, formatDate, getStatusLabel } from "@/lib/utils";
import { Coins, Filter, Check, X, DollarSign, UserCheck, Users, ChevronDown, ChevronUp } from "lucide-react";
import type { Commission, Profile } from "@/types";
import { PeriodFilter, filterByPeriod, type Period } from "@/components/ui/period-filter";

// Étendre le type Commission pour inclure le parrain
type CommissionWithReferrer = Commission & {
  referrer?: Profile | null;
};

export default function AdminCommissionsPage() {
  const [commissions, setCommissions] = useState<CommissionWithReferrer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [period, setPeriod] = useState<Period>("month");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [referrersMap, setReferrersMap] = useState<Record<string, Profile | null>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadCommissions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllCommissions();
      setCommissions(data as CommissionWithReferrer[]);

      // Récupérer les parrains pour chaque commission
      const userIds = [...new Set(data.map(c => c.user_id))];
      const refMap: Record<string, Profile | null> = {};

      // Pour chaque utilisateur, chercher son parrain via la table referrals
      for (const userId of userIds) {
        try {
          const res = await fetch(`/api/admin/users?userId=${userId}&includeReferrer=true`);
          if (res.ok) {
            const userData = await res.json();
            if (userData.referrer) {
              refMap[userId] = userData.referrer;
            } else {
              refMap[userId] = null;
            }
          } else {
            refMap[userId] = null;
          }
        } catch {
          refMap[userId] = null;
        }
      }
      setReferrersMap(refMap);
    } catch (err) {
      setError("Erreur lors du chargement des commissions");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCommissions();
  }, [loadCommissions]);

  const handleStatusChange = async (commission: CommissionWithReferrer, newStatus: string) => {
    setActionLoading(commission.id);
    try {
      const body: Record<string, any> = {
        commission_id: commission.id,
        status: newStatus,
      };

      // Si on passe à "paid", on inclut aussi la commission du parrain si elle existe
      if (newStatus === "paid") {
        const referrer = referrersMap[commission.user_id];
        if (referrer) {
          // Chercher la commission de parrainage correspondante
          const referrerCommission = commissions.find(
            c => c.user_id === referrer.id && 
                 c.description?.includes("Commission de parrainage") &&
                 c.status === "validated"
          );
          if (referrerCommission) {
            body.referrer_commission_id = referrerCommission.id;
          }
        }
      }

      const res = await fetch("/api/admin/commissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de la mise à jour");
      }
      await loadCommissions();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Erreur lors de la mise à jour");
    } finally {
      setActionLoading(null);
    }
  };

  const statusFiltered = filter === "all" ? commissions : commissions.filter((c) => c.status === filter);
  const filtered = filterByPeriod(statusFiltered, period);
  const total = commissions.reduce((sum, c) => sum + Number(c.amount), 0);

  return (
    <AdminLayout title="Commissions">
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <Card><p className="text-sm text-gray-400">Total</p><p className="text-2xl font-bold text-white mt-1">{formatCurrency(total)}</p></Card>
        <Card><p className="text-sm text-gray-400">En attente</p><p className="text-2xl font-bold text-yellow-400 mt-1">{formatCurrency(commissions.filter(c => c.status === "pending").reduce((s, c) => s + Number(c.amount), 0))}</p></Card>
        <Card><p className="text-sm text-gray-400">Validées</p><p className="text-2xl font-bold text-green-400 mt-1">{formatCurrency(commissions.filter(c => c.status === "validated").reduce((s, c) => s + Number(c.amount), 0))}</p></Card>
        <Card><p className="text-sm text-gray-400">Payées</p><p className="text-2xl font-bold text-blue-400 mt-1">{formatCurrency(commissions.filter(c => c.status === "paid").reduce((s, c) => s + Number(c.amount), 0))}</p></Card>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            {["all", "pending", "validated", "paid", "rejected"].map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === s ? "bg-blue-500/20 text-blue-400" : "text-gray-400 hover:text-white hover:bg-white/5"}`}>
              {getStatusLabel(s)}
            </button>
          ))}
          </div>
          <PeriodFilter value={period} onChange={setPeriod} showLabel={false} />
        </div>
        {loading ? (
          <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />)}</div>
        ) : (
          <div className="space-y-2">
            {filtered.map((c) => {
              const referrer = referrersMap[c.user_id];
              const isReferralCommission = c.description?.includes("Commission de parrainage");
              const isExpanded = expandedId === c.id;

              return (
                <div key={c.id}>
                  <div className={`flex items-center justify-between p-4 rounded-xl transition-colors ${
                    isReferralCommission ? "bg-purple-500/5 border border-purple-500/10" : "bg-white/5"
                  }`}>
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Coins className={`w-5 h-5 ${isReferralCommission ? "text-purple-400" : "text-blue-400"}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-white">{formatCurrency(c.amount)}</p>
                          {isReferralCommission && (
                            <Badge variant="info" className="text-[10px]">Parrainage</Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate">
                          {c.user?.full_name || "N/A"} • {c.bookmaker?.name} • {formatDate(c.created_at)}
                        </p>
                        {/* Afficher le parrain si c'est un sous-affilié */}
                        {referrer && !isReferralCommission && (
                          <div className="flex items-center gap-1.5 mt-1">
                            <Users className="w-3 h-3 text-purple-400" />
                            <span className="text-[11px] text-purple-300">
                              Parrain: <strong>{referrer.full_name}</strong>
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant={c.status === "validated" ? "success" : c.status === "paid" ? "info" : c.status === "rejected" ? "danger" : "warning"}>
                        {getStatusLabel(c.status)}
                      </Badge>
                      {c.status === "pending" && (
                        <>
                          <Button size="sm" variant="default" onClick={() => handleStatusChange(c, "validated")} disabled={actionLoading === c.id}>
                            <Check className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleStatusChange(c, "rejected")} disabled={actionLoading === c.id}>
                            <X className="w-3 h-3" />
                          </Button>
                        </>
                      )}
                      {c.status === "validated" && (
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="default" onClick={() => handleStatusChange(c, "paid")} disabled={actionLoading === c.id}>
                            <DollarSign className="w-3 h-3 mr-1" /> Payer
                          </Button>
                          {referrer && (
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : c.id)}
                              className="p-1.5 text-gray-500 hover:text-white transition-colors"
                              title="Voir détails parrain"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Détails du parrain déplié */}
                  {isExpanded && referrer && (
                    <div className="ml-8 mr-4 mb-2 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 space-y-2">
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-purple-400" />
                        <span className="text-sm text-purple-200 font-medium">Ambassadeur parrain</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-500">Nom:</span>
                          <span className="text-white ml-1">{referrer.full_name}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Email:</span>
                          <span className="text-white ml-1">{referrer.email}</span>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-purple-500/20">
                        <p className="text-xs text-gray-400 mb-2">
                          En payant cette commission, la commission de parrainage (10%) sera également payée automatiquement à <strong className="text-purple-300">{referrer.full_name}</strong>.
                        </p>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleStatusChange(c, "paid")}
                          disabled={actionLoading === c.id}
                          className="w-full"
                        >
                          <DollarSign className="w-3 h-3 mr-1" /> Payer les deux commissions
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </AdminLayout>
  );
}