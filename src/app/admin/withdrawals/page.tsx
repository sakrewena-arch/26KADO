"use client";

import { useEffect, useState, useCallback } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAllWithdrawals } from "@/lib/supabase/queries";
import { formatCurrency, formatDate, getStatusLabel } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Check, X, ArrowUpFromLine, Loader2, Search, ChevronDown, ChevronUp, Phone, User, MessageCircle, Clock, Calendar } from "lucide-react";
import type { WithdrawalRequest, Profile } from "@/types";

export default function AdminWithdrawalsPage() {
  const supabase = createClient();
  const [withdrawals, setWithdrawals] = useState<(WithdrawalRequest & { user_profile?: Profile })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Dépôt manuel
  const [depositUserId, setDepositUserId] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [depositSubmitting, setDepositSubmitting] = useState(false);
  const [depositSuccess, setDepositSuccess] = useState<string | null>(null);
  const [depositError, setDepositError] = useState<string | null>(null);

  // Réclamations
  const [showClaims, setShowClaims] = useState(false);
  const [claimableWithdrawals, setClaimableWithdrawals] = useState<(WithdrawalRequest & { user_profile?: Profile })[]>([]);
  const [expandedWithdrawal, setExpandedWithdrawal] = useState<string | null>(null);

  const loadWithdrawals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllWithdrawals();
      // Enrichir avec les profils utilisateurs
      const enriched = await Promise.all(
        data.map(async (w) => {
          if (w.user_id) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name, email, phone, referral_code, total_commission, total_referrals")
              .eq("id", w.user_id)
              .single();
            return { ...w, user_profile: profile ? (profile as unknown as Profile) : undefined };
          }
          return w;
        })
      );
      setWithdrawals(enriched);
    } catch (err) {
      setError("Erreur lors du chargement des retraits");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadWithdrawals();
  }, [loadWithdrawals]);

  // Filtrer les réclamations : retraits en attente depuis plus de 48h
  useEffect(() => {
    const now = new Date();
    const claims = withdrawals.filter((w) => {
      if (w.status !== "pending") return false;
      const createdAt = new Date(w.created_at);
      const hoursSince = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
      return hoursSince >= 48;
    });
    setClaimableWithdrawals(claims);
  }, [withdrawals]);

  const handleStatus = async (id: string, status: "pending" | "validated" | "paid" | "rejected") => {
    setActionLoading(id);
    try {
      const res = await fetch("/api/admin/withdrawals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ withdrawal_id: id, status }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de la mise à jour");
      }
      await loadWithdrawals();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la mise à jour");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeposit = async () => {
    if (!depositAmount || !depositUserId) return;
    setDepositSubmitting(true);
    setDepositError(null);
    setDepositSuccess(null);
    try {
      const res = await fetch("/api/admin/withdrawals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: depositUserId,
          amount: Number(depositAmount),
          status: "deposit",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setDepositSuccess(`Dépôt de ${formatCurrency(Number(depositAmount))} effectué`);
      setDepositAmount("");
      setDepositUserId("");
    } catch (err: any) {
      setDepositError(err.message || "Erreur lors du dépôt");
    } finally {
      setDepositSubmitting(false);
    }
  };

  const pending = withdrawals.filter((w) => w.status === "pending");

  return (
    <AdminLayout title="Gestion des retraits">
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Stats */}
        <Card className="text-center">
          <ArrowUpFromLine className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{pending.length}</p>
          <p className="text-xs text-gray-500">Demandes en attente</p>
        </Card>
        <Card className="text-center">
          <Clock className="w-6 h-6 text-amber-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{claimableWithdrawals.length}</p>
          <p className="text-xs text-gray-500">Réclamations (48h+)</p>
        </Card>
        <Card className="text-center">
          <Check className="w-6 h-6 text-green-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{withdrawals.filter((w) => w.status === "paid").length}</p>
          <p className="text-xs text-gray-500">Retraits payés</p>
        </Card>
      </div>

      {/* ===== DEMANDES EN ATTENTE ===== */}
      <Card className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Demandes en attente ({pending.length})
          {claimableWithdrawals.length > 0 && (
            <Badge variant="danger" className="ml-2 text-[10px]">
              {claimableWithdrawals.length} réclamation(s)
            </Badge>
          )}
        </h3>

        {loading ? (
          <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-24 rounded-xl bg-white/5 animate-pulse" />)}</div>
        ) : pending.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Aucune demande en attente</p>
        ) : (
          <div className="space-y-3">
            {pending.map((w) => {
              const hoursSince = (new Date().getTime() - new Date(w.created_at).getTime()) / (1000 * 60 * 60);
              const isClaimable = hoursSince >= 48;
              return (
                <div key={w.id} className="p-4 rounded-xl bg-white/5">
                  {/* En-tête */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">
                          {w.user_profile?.full_name || w.user?.full_name || "Utilisateur"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {w.user_profile?.email || w.user?.email || ""}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-yellow-400">{formatCurrency(w.amount)}</p>
                      <Badge variant="warning" className="text-[10px]">En attente</Badge>
                    </div>
                  </div>

                  {/* Infos de paiement */}
                  <div className="grid grid-cols-2 gap-2 mb-3 p-3 rounded-lg bg-white/5">
                    <div>
                      <p className="text-[10px] text-gray-500">Méthode</p>
                      <p className="text-xs text-white">{w.method}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500">Compte</p>
                      <p className="text-xs text-white font-mono">{w.account_info}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500">Date demande</p>
                      <p className="text-xs text-gray-400">{formatDate(w.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500">
                        Téléphone utilisateur
                      </p>
                      <p className="text-xs text-white">
                        {w.user_profile?.phone || "Non renseigné"}
                      </p>
                    </div>
                  </div>

                  {/* Badge réclamation si applicable */}
                  {isClaimable && (
                    <div className="mb-3 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="text-xs text-amber-400">
                        Réclamation possible - Retrait en attente depuis plus de 48h
                      </span>
                    </div>
                  )}

                  {/* Boutons d'action */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleStatus(w.id, "validated")}
                      disabled={actionLoading === w.id}
                    >
                      {actionLoading === w.id ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Check className="w-4 h-4 mr-1" />}
                      Validé
                    </Button>
                    <Button
                      size="sm"
                      variant="premium"
                      onClick={() => handleStatus(w.id, "paid")}
                      disabled={actionLoading === w.id}
                    >
                      {actionLoading === w.id ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Check className="w-4 h-4 mr-1" />}
                      Payer
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleStatus(w.id, "rejected")}
                      disabled={actionLoading === w.id}
                    >
                      <X className="w-4 h-4 mr-1" /> Refuser
                    </Button>
                    {isClaimable && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setExpandedWithdrawal(expandedWithdrawal === w.id ? null : w.id)}
                      >
                        <MessageCircle className="w-4 h-4 mr-1" />
                        Voir réclamation
                      </Button>
                    )}
                  </div>

                  {/* Détail réclamation */}
                  {expandedWithdrawal === w.id && isClaimable && (
                    <div className="mt-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
                      <p className="text-sm font-medium text-amber-400 mb-2">Détails de la réclamation</p>
                      <div className="space-y-1 text-xs text-gray-400">
                        <p>• Retrait demandé le {formatDate(w.created_at)}</p>
                        <p>• Montant : {formatCurrency(w.amount)}</p>
                        <p>• Méthode : {w.method}</p>
                        <p>• Compte : {w.account_info}</p>
                        <p>• Statut actuel : En attente (délai dépassé)</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* ===== RÉCLAMATIONS ===== */}
      {claimableWithdrawals.length > 0 && (
        <Card className="mb-6">
          <button
            onClick={() => setShowClaims(!showClaims)}
            className="w-full flex items-center justify-between"
          >
            <h3 className="text-lg font-semibold text-white">
              <MessageCircle className="w-5 h-5 inline mr-2 text-amber-400" />
              Réclamations ({claimableWithdrawals.length})
            </h3>
            {showClaims ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
          </button>

          {showClaims && (
            <div className="mt-4 space-y-3">
              {claimableWithdrawals.map((w) => (
                <div key={w.id} className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-white">
                        {w.user_profile?.full_name || w.user?.full_name || "Utilisateur"}
                      </p>
                      <p className="text-xs text-gray-500">{w.account_info}</p>
                    </div>
                    <p className="text-lg font-bold text-amber-400">{formatCurrency(w.amount)}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                      En attente depuis le {formatDate(w.created_at)}
                    </p>
                    <Button
                      size="sm"
                      variant="premium"
                      onClick={() => handleStatus(w.id, "paid")}
                      disabled={actionLoading === w.id}
                    >
                      <Check className="w-4 h-4 mr-1" /> Marquer payé
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ===== DÉPÔT MANUEL ===== */}
      <Card className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">Dépôt manuel (créditer un utilisateur)</h3>

        {depositError && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{depositError}</div>
        )}
        {depositSuccess && (
          <div className="mb-4 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">{depositSuccess}</div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>ID Utilisateur</Label>
            <div className="flex gap-2">
              <Search className="w-5 h-5 text-gray-500 mt-3 shrink-0" />
              <Input placeholder="UUID" value={depositUserId} onChange={(e) => setDepositUserId(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Montant (FCFA)</Label>
            <Input type="number" placeholder="50000" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} />
          </div>
          <div className="space-y-2 flex items-end">
            <Button
              className="w-full"
              onClick={handleDeposit}
              disabled={depositSubmitting || !depositAmount || !depositUserId}
            >
              {depositSubmitting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Traitement...</>
              ) : (
                <><ArrowUpFromLine className="w-4 h-4 mr-2" /> Créditer</>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* ===== HISTORIQUE COMPLET ===== */}
      <Card>
        <h3 className="text-lg font-semibold text-white mb-4">Tous les retraits</h3>
        {loading ? (
          <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-14 rounded-xl bg-white/5 animate-pulse" />)}</div>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {withdrawals.map((w) => (
              <div key={w.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-white">{w.user_profile?.full_name || w.user?.full_name || "N/A"}</p>
                    <p className="text-[10px] text-gray-500">{w.method} • {w.account_info}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm font-medium text-white">{formatCurrency(w.amount)}</p>
                  <Badge variant={w.status === "paid" ? "success" : w.status === "rejected" ? "danger" : "warning"} className="text-[10px]">
                    {getStatusLabel(w.status)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </AdminLayout>
  );
}