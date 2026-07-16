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
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, ArrowUpFromLine, Loader2, Search, ChevronDown, ChevronUp, Phone, User, MessageCircle, Clock, Calendar, AlertTriangle } from "lucide-react";
import type { WithdrawalRequest, Profile } from "@/types";
import { PeriodFilter, filterByPeriod, type Period } from "@/components/ui/period-filter";

export default function AdminWithdrawalsPage() {
  const supabase = createClient();
  const [withdrawals, setWithdrawals] = useState<(WithdrawalRequest & { user_profile?: Profile })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Modal de confirmation
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"validated" | "paid" | "rejected" | null>(null);
  const [confirmTargetId, setConfirmTargetId] = useState<string | null>(null);
  const [confirmSuccess, setConfirmSuccess] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [confirmSubmitting, setConfirmSubmitting] = useState(false);

  // Recherche email pour dépôt manuel
  const [depositSearchQuery, setDepositSearchQuery] = useState("");
  const [depositSearchResults, setDepositSearchResults] = useState<Profile[]>([]);
  const [depositSearching, setDepositSearching] = useState(false);
  const [depositSelectedUser, setDepositSelectedUser] = useState<Profile | null>(null);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositSubmitting, setDepositSubmitting] = useState(false);
  const [depositSuccess, setDepositSuccess] = useState<string | null>(null);
  const [depositError, setDepositError] = useState<string | null>(null);

  // Réclamations
  const [showClaims, setShowClaims] = useState(false);
  const [claimableWithdrawals, setClaimableWithdrawals] = useState<(WithdrawalRequest & { user_profile?: Profile })[]>([]);
  const [expandedWithdrawal, setExpandedWithdrawal] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>("month");

  const loadWithdrawals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllWithdrawals();
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

  // Ouvrir le modal de confirmation
  const openConfirmModal = (id: string, action: "validated" | "paid" | "rejected") => {
    setConfirmTargetId(id);
    setConfirmAction(action);
    setConfirmSuccess(null);
    setConfirmError(null);
    setShowConfirmModal(true);
  };

  // Exécuter l'action après confirmation
  const executeAction = async () => {
    if (!confirmTargetId || !confirmAction) return;
    setConfirmSubmitting(true);
    setConfirmError(null);
    try {
      const res = await fetch("/api/admin/withdrawals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ withdrawal_id: confirmTargetId, status: confirmAction }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de la mise à jour");
      setConfirmSuccess(
        confirmAction === "paid"
          ? `✅ Paiement confirmé ! Le statut est maintenant "Payé".`
          : confirmAction === "validated"
          ? `✅ Validation confirmée ! Le statut est maintenant "Validé".`
          : `✅ Demande refusée.`
      );
      await loadWithdrawals();
    } catch (err) {
      setConfirmError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setConfirmSubmitting(false);
    }
  };

  // Recherche email pour dépôt
  useEffect(() => {
    if (depositSearchQuery.length < 2) { setDepositSearchResults([]); return; }
    const timer = setTimeout(async () => {
      setDepositSearching(true);
      try {
        const { data } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .or(`full_name.ilike.%${depositSearchQuery}%,email.ilike.%${depositSearchQuery}%`)
          .limit(10);
        if (data) setDepositSearchResults(data as Profile[]);
      } catch (err) { console.error(err); }
      finally { setDepositSearching(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [depositSearchQuery, supabase]);

  const handleDeposit = async () => {
    if (!depositSelectedUser || !depositAmount) return;
    setDepositSubmitting(true);
    setDepositError(null);
    setDepositSuccess(null);
    try {
      const res = await fetch("/api/admin/withdrawals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: depositSelectedUser.id,
          amount: Number(depositAmount),
          status: "deposit",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setDepositSuccess(`Dépôt de ${formatCurrency(Number(depositAmount))} sur ${depositSelectedUser.full_name || depositSelectedUser.email}`);
      setDepositAmount("");
      setDepositSelectedUser(null);
      setDepositSearchQuery("");
      setDepositSearchResults([]);
    } catch (err: any) {
      setDepositError(err.message || "Erreur lors du dépôt");
    } finally {
      setDepositSubmitting(false);
    }
  };

  const pending = withdrawals.filter((w) => w.status === "pending");

  const confirmMessages = {
    validated: {
      title: "Confirmer la validation",
      message: "Vous confirmez avoir vérifié manuellement le retrait ?",
      icon: <Check className="w-7 h-7 text-blue-400" />,
      bgColor: "bg-blue-500/20",
    },
    paid: {
      title: "Confirmer le paiement",
      message: "Avez-vous bien envoyé l'argent manuellement via votre opérateur téléphonique ?",
      icon: <Check className="w-7 h-7 text-green-400" />,
      bgColor: "bg-green-500/20",
    },
    rejected: {
      title: "Confirmer le refus",
      message: "Êtes-vous sûr de vouloir refuser cette demande de retrait ?",
      icon: <X className="w-7 h-7 text-red-400" />,
      bgColor: "bg-red-500/20",
    },
  };

  return (
    <AdminLayout title="Gestion des retraits">
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
      )}

      {/* Modal de confirmation */}
      <AnimatePresence>
        {showConfirmModal && confirmAction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => { if (!confirmSubmitting) setShowConfirmModal(false); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl bg-card border border-white/10 p-6 shadow-2xl"
            >
              {confirmSuccess ? (
                <>
                  <div className="text-center mb-6">
                    <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-3">
                      <Check className="w-7 h-7 text-green-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Action effectuée !</h3>
                    <p className="text-sm text-green-400">{confirmSuccess}</p>
                  </div>
                  <Button className="w-full" variant="premium" onClick={() => setShowConfirmModal(false)}>
                    Terminé
                  </Button>
                </>
              ) : (
                <>
                  <div className="text-center mb-6">
                    <div className={`w-14 h-14 rounded-full ${confirmMessages[confirmAction].bgColor} flex items-center justify-center mx-auto mb-3`}>
                      {confirmMessages[confirmAction].icon}
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">
                      {confirmMessages[confirmAction].title}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {confirmMessages[confirmAction].message}
                    </p>
                    {confirmAction === "paid" && (
                      <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        Assurez-vous d'avoir bien envoyé l'argent avant de confirmer
                      </div>
                    )}
                    {confirmError && (
                      <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                        {confirmError}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={() => setShowConfirmModal(false)} disabled={confirmSubmitting}>
                      Annuler
                    </Button>
                    <Button
                      variant={confirmAction === "rejected" ? "destructive" : "premium"}
                      className="flex-1"
                      onClick={executeAction}
                      disabled={confirmSubmitting}
                    >
                      {confirmSubmitting ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Traitement...</>
                      ) : confirmAction === "paid" ? "Confirmer le paiement" : confirmAction === "validated" ? "Confirmer" : "Confirmer le refus"}
                    </Button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
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
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">
            Demandes en attente ({pending.length})
            {claimableWithdrawals.length > 0 && (
              <Badge variant="danger" className="ml-2 text-[10px]">
                {claimableWithdrawals.length} réclamation(s)
              </Badge>
            )}
          </h3>
          <PeriodFilter value={period} onChange={setPeriod} showLabel={false} />
        </div>

        {loading ? (
          <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-24 rounded-xl bg-white/5 animate-pulse" />)}</div>
        ) : filterByPeriod(pending, period).length === 0 ? (
          <p className="text-gray-500 text-center py-8">Aucune demande en attente pour cette période</p>
        ) : (
          <div className="space-y-3">
            {filterByPeriod(pending, period).map((w) => {
              const hoursSince = (new Date().getTime() - new Date(w.created_at).getTime()) / (1000 * 60 * 60);
              const isClaimable = hoursSince >= 48;
              return (
                <div key={w.id} className="p-4 rounded-xl bg-white/5">
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
                      <p className="text-[10px] text-gray-500">Téléphone utilisateur</p>
                      <p className="text-xs text-white">{w.user_profile?.phone || "Non renseigné"}</p>
                    </div>
                  </div>

                  {isClaimable && (
                    <div className="mb-3 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="text-xs text-amber-400">
                        Réclamation possible - Retrait en attente depuis plus de 48h
                      </span>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="default" onClick={() => openConfirmModal(w.id, "validated")} disabled={actionLoading === w.id}>
                      {actionLoading === w.id ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Check className="w-4 h-4 mr-1" />}
                      Validé
                    </Button>
                    <Button size="sm" variant="premium" onClick={() => openConfirmModal(w.id, "paid")} disabled={actionLoading === w.id}>
                      {actionLoading === w.id ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Check className="w-4 h-4 mr-1" />}
                      Payer
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => openConfirmModal(w.id, "rejected")} disabled={actionLoading === w.id}>
                      <X className="w-4 h-4 mr-1" /> Refuser
                    </Button>
                    {isClaimable && (
                      <Button size="sm" variant="outline" onClick={() => setExpandedWithdrawal(expandedWithdrawal === w.id ? null : w.id)}>
                        <MessageCircle className="w-4 h-4 mr-1" /> Voir réclamation
                      </Button>
                    )}
                  </div>

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
          <button onClick={() => setShowClaims(!showClaims)} className="w-full flex items-center justify-between">
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
                      <p className="text-sm font-medium text-white">{w.user_profile?.full_name || w.user?.full_name || "Utilisateur"}</p>
                      <p className="text-xs text-gray-500">{w.account_info}</p>
                    </div>
                    <p className="text-lg font-bold text-amber-400">{formatCurrency(w.amount)}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">En attente depuis le {formatDate(w.created_at)}</p>
                    <Button size="sm" variant="premium" onClick={() => openConfirmModal(w.id, "paid")} disabled={actionLoading === w.id}>
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
            <Label>Rechercher un utilisateur par email ou nom</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
              <Input
                placeholder="Email ou nom..."
                value={depositSearchQuery}
                onChange={(e) => { setDepositSearchQuery(e.target.value); setDepositSelectedUser(null); }}
                className="pl-10"
              />
              {depositSearching && <Loader2 className="absolute right-3 top-3 w-4 h-4 animate-spin text-gray-500" />}
            </div>
            {depositSearchResults.length > 0 && !depositSelectedUser && (
              <div className="border border-white/10 rounded-xl overflow-hidden">
                {depositSearchResults.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => { setDepositSelectedUser(u); setDepositSearchQuery(u.email || u.full_name); setDepositSearchResults([]); }}
                    className="w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-white">{u.full_name}</p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {depositSelectedUser && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white">{depositSelectedUser.full_name}</p>
                  <p className="text-xs text-gray-500">{depositSelectedUser.email}</p>
                </div>
                <button onClick={() => { setDepositSelectedUser(null); setDepositSearchQuery(""); }} className="text-gray-500 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label>Montant (FCFA)</Label>
            <Input type="number" placeholder="50000" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} />
          </div>
          <div className="space-y-2 flex items-end">
            <Button className="w-full" onClick={handleDeposit} disabled={depositSubmitting || !depositAmount || !depositSelectedUser}>
              {depositSubmitting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Traitement...</>
              ) : (
                <><ArrowUpFromLine className="w-4 h-4 mr-2" /> Créditer {depositSelectedUser ? depositSelectedUser.full_name || depositSelectedUser.email : "le compte"}</>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* ===== HISTORIQUE COMPLET ===== */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Tous les retraits</h3>
          <PeriodFilter value={period} onChange={setPeriod} />
        </div>
        {loading ? (
          <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-14 rounded-xl bg-white/5 animate-pulse" />)}</div>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {filterByPeriod(withdrawals, period).map((w) => (
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