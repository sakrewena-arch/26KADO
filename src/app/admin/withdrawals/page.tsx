"use client";

import { useEffect, useState, useCallback } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAllWithdrawals, getAdminStats } from "@/lib/supabase/queries";
import { formatCurrency, formatDate, getStatusLabel } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, ArrowUpFromLine, Search, ChevronDown, ChevronUp, User, MessageCircle, Clock, AlertTriangle, RotateCcw, History, Trash2, RefreshCw } from "lucide-react";
import type { WithdrawalRequest, Profile } from "@/types";
import LottieLoader from "@/components/ui/loading-animation";
import { PeriodFilter, filterByPeriod, type Period } from "@/components/ui/period-filter";

interface ResetLog {
  id: string;
  counter_type: string;
  previous_value: number;
  new_value: number;
  reset_by: string;
  created_at: string;
}

export default function AdminWithdrawalsPage() {
  const supabase = createClient();
  const [withdrawals, setWithdrawals] = useState<(WithdrawalRequest & { user_profile?: Profile })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedCounter, setSelectedCounter] = useState<string | "all">("all");
  const [resetLogs, setResetLogs] = useState<ResetLog[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"reset" | "restore" | "clear" | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showDangerModal, setShowDangerModal] = useState(false);
  const [dangerEmail, setDangerEmail] = useState("");
  const [dangerPassword, setDangerPassword] = useState("");
  const [dangerError, setDangerError] = useState<string | null>(null);
  const [dangerSubmitting, setDangerSubmitting] = useState(false);
  const [dangerSuccess, setDangerSuccess] = useState<string | null>(null);

  // Modal de confirmation
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState<"paid" | "rejected" | null>(null);
  const [modalTargetId, setModalTargetId] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSubmitting, setModalSubmitting] = useState(false);

  // Recherche email pour dépôt manuel
  const [depositSearch, setDepositSearch] = useState("");
  const [depositResults, setDepositResults] = useState<Profile[]>([]);
  const [depositSearching, setDepositSearching] = useState(false);
  const [depositUser, setDepositUser] = useState<Profile | null>(null);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositSubmitting, setDepositSubmitting] = useState(false);
  const [depositSuccess, setDepositSuccess] = useState<string | null>(null);
  const [depositError, setDepositError] = useState<string | null>(null);

  // Sections déroulantes
  const [showPending, setShowPending] = useState(true);
  const [showValidated, setShowValidated] = useState(false);
  const [showPaid, setShowPaid] = useState(false);
  const [showRejected, setShowRejected] = useState(false);
  const [showClaims, setShowClaims] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showResetHistory, setShowResetHistory] = useState(false);

  const [claimableWithdrawals, setClaimableWithdrawals] = useState<(WithdrawalRequest & { user_profile?: Profile })[]>([]);
  const [period, setPeriod] = useState<Period>("month");

  const loadStats = useCallback(async () => {
    try {
      const data = await getAdminStats();
      setStats(data);
    } catch (err) {
      console.error("Erreur chargement stats:", err);
    }
  }, []);

  const loadResetLogs = useCallback(async () => {
    try {
      const { data } = await supabase
        .from("admin_counter_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (data) setResetLogs(data as ResetLog[]);
    } catch (err) {
      console.error("Erreur chargement logs:", err);
    }
  }, [supabase]);

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
              .select("full_name, email, phone")
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
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => { loadStats(); loadResetLogs(); loadWithdrawals(); }, [loadStats, loadResetLogs, loadWithdrawals]);

  useEffect(() => {
    const now = new Date();
    setClaimableWithdrawals(withdrawals.filter((w) => {
      if (w.status !== "pending") return false;
      return (now.getTime() - new Date(w.created_at).getTime()) / (1000 * 60 * 60) >= 48;
    }));
  }, [withdrawals]);

  const openModal = (id: string, action: "paid" | "rejected") => {
    setModalTargetId(id);
    setModalAction(action);
    setModalSuccess(null);
    setModalError(null);
    setShowModal(true);
  };

  const openConfirm = (action: "reset" | "restore" | "clear", target: string | null = null) => {
    setConfirmAction(action);
    setConfirmTarget(target);
    setShowConfirmModal(true);
  };

  const handleReset = async () => {
    if (!confirmTarget) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/reset-counters", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ counter: confirmTarget }),
      });
      if (!res.ok) throw new Error("Erreur lors du reset");
      await loadStats();
      await loadResetLogs();
      setShowConfirmModal(false);
      setShowResetModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestore = async (logId: string) => {
    setActionLoading(true);
    try {
      const log = resetLogs.find(l => l.id === logId);
      if (!log) return;
      const res = await fetch("/api/admin/reset-counters", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ counter: log.counter_type, restore: true, log_id: logId }),
      });
      if (!res.ok) throw new Error("Erreur lors de la restauration");
      await loadStats();
      await loadResetLogs();
      setShowConfirmModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleClearHistory = async () => {
    setActionLoading(true);
    try {
      await supabase.from("admin_counter_logs").delete().neq("id", "0");
      setResetLogs([]);
      setShowConfirmModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };


  const handleResetEverything = async () => {
    if (!dangerEmail || !dangerPassword) {
      setDangerError("Veuillez renseigner l'email et le mot de passe admin.");
      return;
    }
    setDangerSubmitting(true);
    setDangerError(null);
    try {
      const res = await fetch("/api/admin/reset-everything", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: dangerEmail.trim(), password: dangerPassword }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error((data && data.error) || "Erreur lors de la réinitialisation totale");
      setDangerSuccess("Réinitialisation totale appliquée avec succès.");
      setShowDangerModal(false);
      setDangerEmail("");
      setDangerPassword("");
      await loadStats();
      await loadResetLogs();
      await loadWithdrawals();
    } catch (err: any) {
      setDangerError(err.message || "Erreur lors de la réinitialisation totale");
    } finally {
      setDangerSubmitting(false);
    }
  };

  const executeAction = async () => {
    if (!modalTargetId || !modalAction) return;
    setModalSubmitting(true);
    setModalError(null);
    try {
      const res = await fetch("/api/admin/withdrawals", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ withdrawal_id: modalTargetId, status: modalAction }),
      });
      console.log("[admin/withdrawals] request sent", { withdrawal_id: modalTargetId, status: modalAction });
      console.log("[admin/withdrawals] response status", res.status, "ok:", res.ok);
      const data = await res.json().catch((e) => {
        console.error("[admin/withdrawals] failed to parse JSON", e);
        return null;
      });
      console.log("[admin/withdrawals] response body", data);
      if (!res.ok) throw new Error((data && data.error) || "Erreur");
      setModalSuccess(modalAction === "paid" ? "✅ Paiement confirmé ! Statut mis à jour." : "✅ Demande refusée.");
      // Optimistic update: update local state immediately so UI reflects change
      setWithdrawals((prev) => prev.map((w) => (w.id === modalTargetId ? { ...w, status: modalAction } : w)));
      // Refresh from server in background (non-blocking)
      loadWithdrawals().catch(() => { /* ignore background refresh errors */ });
    } catch (err: any) {
      setModalError(err.message || "Erreur");
    } finally {
      setModalSubmitting(false);
    }
  };

  // Recherche email
  useEffect(() => {
    if (depositSearch.length < 2) { setDepositResults([]); return; }
    const timer = setTimeout(async () => {
      setDepositSearching(true);
      try {
        const { data } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .or(`full_name.ilike.%${depositSearch}%,email.ilike.%${depositSearch}%`)
          .limit(10);
        if (data) setDepositResults(data as Profile[]);
      } catch {} finally { setDepositSearching(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [depositSearch, supabase]);

  const handleDeposit = async () => {
    if (!depositUser || !depositAmount) return;
    setDepositSubmitting(true);
    setDepositError(null);
    setDepositSuccess(null);
    try {
      const res = await fetch("/api/admin/withdrawals", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: depositUser.id, amount: Number(depositAmount), status: "deposit" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setDepositSuccess(`✅ ${formatCurrency(Number(depositAmount))} crédité sur ${depositUser.full_name || depositUser.email}`);
      setDepositAmount("");
      setDepositUser(null);
      setDepositSearch("");
      setDepositResults([]);
    } catch (err: any) {
      setDepositError(err.message || "Erreur");
    } finally {
      setDepositSubmitting(false);
    }
  };

  const pending = withdrawals.filter((w) => w.status === "pending");
  const validated = withdrawals.filter((w) => w.status === "validated");
  const paid = withdrawals.filter((w) => w.status === "paid");
  const rejected = withdrawals.filter((w) => w.status === "rejected");

  const SectionToggle = ({ show, setShow, title, count, children }: any) => (
    <Card className="mb-4">
      <button onClick={() => setShow(!show)} className="w-full flex items-center justify-between p-4">
        <h3 className="text-lg font-semibold text-white">{title} ({count})</h3>
        {show ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
      </button>
      <AnimatePresence>
        {show && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="px-4 pb-4">
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );

  const modalMessages: Record<string, { title: string; msg: string; icon: any; bg: string }> = {
    paid: { title: "Confirmer le paiement", msg: "Avez-vous bien envoyé l'argent manuellement ?", icon: <Check className="w-7 h-7 text-green-400" />, bg: "bg-green-500/20" },
    rejected: { title: "Confirmer le refus", msg: "Êtes-vous sûr de vouloir refuser ?", icon: <X className="w-7 h-7 text-red-400" />, bg: "bg-red-500/20" },
  };

  const confirmMessages: Record<string, { title: string; message: string }> = {
    reset: { title: "Confirmer la remise à zéro", message: `Êtes-vous sûr de vouloir remettre à zéro le compteur sélectionné ? Cette action est réversible via l'historique.` },
    restore: { title: "Restaurer le compteur", message: `Voulez-vous restaurer la valeur précédente de ce compteur ?` },
    clear: { title: "Vider l'historique", message: `Êtes-vous sûr de vouloir supprimer tout l'historique des remises à zéro ? Cette action est irréversible.` },
  };

  const counterCards = [
    { key: "total_commissions", title: "Commissions", value: stats?.total_commissions || 0, label: "Commissions", color: "from-green-500/20 to-emerald-500/20 text-green-400" },
    { key: "total_withdrawals", title: "Retraits", value: stats?.total_withdrawals || 0, label: "Retraits", color: "from-orange-500/20 to-red-500/20 text-orange-400" },
    { key: "total_deposits", title: "Dépôts", value: stats?.total_deposits || 0, label: "Dépôts", color: "from-blue-500/20 to-cyan-500/20 text-blue-400" },
    { key: "total_revenue", title: "Revenus", value: stats?.total_revenue || 0, label: "Revenus", color: "from-purple-500/20 to-pink-500/20 text-purple-400" },
  ];

  return (
    <AdminLayout title="Gestion des retraits">
      {error && <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}

      {/* Modal */}
      <AnimatePresence>
        {showModal && modalAction && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => { if (!modalSubmitting) setShowModal(false); }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl bg-card border border-white/10 p-6 shadow-2xl">
              {modalSuccess ? (
                <>
                  <div className="text-center mb-6">
                    <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-3">
                      <Check className="w-7 h-7 text-green-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Action effectuée !</h3>
                    <p className="text-sm text-green-400">{modalSuccess}</p>
                  </div>
                  <Button className="w-full" variant="premium" onClick={() => setShowModal(false)}>Terminé</Button>
                </>
              ) : (
                <>
                  <div className="text-center mb-6">
                    <div className={`w-14 h-14 rounded-full ${modalMessages[modalAction].bg} flex items-center justify-center mx-auto mb-3`}>
                      {modalMessages[modalAction].icon}
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{modalMessages[modalAction].title}</h3>
                    <p className="text-sm text-gray-400">{modalMessages[modalAction].msg}</p>
                    {modalAction === "paid" && (
                      <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        Assurez-vous d'avoir envoyé l'argent avant de confirmer
                      </div>
                    )}
                    {modalError && <div className="mt-3 p-3 rounded-lg bg-red-500/10 text-xs text-red-400">{modalError}</div>}
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)} disabled={modalSubmitting}>Annuler</Button>
                    <Button variant={modalAction === "rejected" ? "destructive" : "premium"} className="flex-1" onClick={executeAction} disabled={modalSubmitting}>
                      {modalSubmitting ? <><LottieLoader size={20} /> Traitement...</> : "Confirmer"}
                    </Button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="text-center p-4"><ArrowUpFromLine className="w-5 h-5 text-yellow-400 mx-auto mb-1" /><p className="text-2xl font-bold text-white">{pending.length}</p><p className="text-xs text-gray-500">En attente</p></Card>
        <Card className="text-center p-4"><Check className="w-5 h-5 text-green-400 mx-auto mb-1" /><p className="text-2xl font-bold text-white">{validated.length}</p><p className="text-xs text-gray-500">Validées</p></Card>
        <Card className="text-center p-4"><ArrowUpFromLine className="w-5 h-5 text-blue-400 mx-auto mb-1" /><p className="text-2xl font-bold text-white">{paid.length}</p><p className="text-xs text-gray-500">Payées</p></Card>
        <Card className="text-center p-4"><X className="w-5 h-5 text-red-400 mx-auto mb-1" /><p className="text-2xl font-bold text-white">{rejected.length}</p><p className="text-xs text-gray-500">Rejetées</p></Card>
      </div>

      <Card className="mb-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Compteurs financiers</h3>
            <p className="text-sm text-gray-400">Remise à zéro des compteurs et historique des changements.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => { setSelectedCounter("all"); setShowResetModal(true); }}>
              <RotateCcw className="w-4 h-4 mr-1" /> Remettre à zéro
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowResetHistory(!showResetHistory)}>
              <History className="w-4 h-4 mr-1" /> {showResetHistory ? "Masquer l'historique" : "Historique"}
            </Button>
            <Button size="sm" variant="destructive" onClick={() => setShowDangerModal(true)}>
              <AlertTriangle className="w-4 h-4 mr-1" /> Réinitialisation totale
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {counterCards.map((counter) => (
            <Card key={counter.key} className="cursor-pointer" onClick={() => { setSelectedCounter(counter.key); setShowResetModal(true); }}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-400">{counter.label}</p>
                  <p className="text-xl font-bold text-white mt-1">{typeof counter.value === "number" ? formatCurrency(counter.value) : counter.value}</p>
                </div>
                <div className={`p-2 rounded-lg bg-gradient-to-br ${counter.color}`}>
                  <RotateCcw className="w-4 h-4" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      <AnimatePresence>
        {showResetHistory && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-6">
            <Card>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">Historique des remises à zéro</h3>
                  <p className="text-sm text-gray-400">Restaurer ou vider l'historique des compteurs.</p>
                </div>
                {resetLogs.length > 0 && (
                  <Button size="sm" variant="destructive" onClick={() => openConfirm("clear") }>
                    <Trash2 className="w-4 h-4 mr-1" /> Vider l'historique
                  </Button>
                )}
              </div>
              {resetLogs.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-6">Aucun historique</p>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {resetLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-amber-500/20">
                          <RotateCcw className="w-4 h-4 text-amber-400" />
                        </div>
                        <div>
                          <p className="text-sm text-white font-medium">{log.counter_type}</p>
                          <p className="text-xs text-gray-500">{formatCurrency(log.previous_value)} → {formatCurrency(log.new_value)}</p>
                          <p className="text-[10px] text-gray-600">{formatDate(log.created_at)}</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => openConfirm("restore", log.id)}>
                        <RefreshCw className="w-3 h-3 mr-1" /> Restaurer
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sélecteur de remise à zéro */}
      <AnimatePresence>
        {showDangerModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => { if (!dangerSubmitting) setShowDangerModal(false); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl bg-card border border-white/10 p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">Réinitialisation totale</h3>
                  <p className="text-sm text-gray-400">Saisissez les identifiants admin pour confirmer.</p>
                </div>
                <button onClick={() => setShowDangerModal(false)} className="text-gray-500 hover:text-white" disabled={dangerSubmitting}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="mb-4 rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-200">
                Cette action supprime toutes les données financières utilisateurs et remet tous les compteurs à zéro. Elle est irréversible.
              </div>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="danger-email">Email admin</Label>
                  <Input id="danger-email" type="email" value={dangerEmail} onChange={(e) => setDangerEmail(e.target.value)} placeholder="admin@example.com" />
                </div>
                <div>
                  <Label htmlFor="danger-password">Mot de passe admin</Label>
                  <Input id="danger-password" type="password" value={dangerPassword} onChange={(e) => setDangerPassword(e.target.value)} placeholder="Mot de passe" />
                </div>
                {dangerError && <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-300">{dangerError}</div>}
              </div>
              <div className="flex gap-3 mt-5">
                <Button variant="outline" className="flex-1" onClick={() => setShowDangerModal(false)} disabled={dangerSubmitting}>Annuler</Button>
                <Button variant="destructive" className="flex-1" onClick={handleResetEverything} disabled={dangerSubmitting}>
                  {dangerSubmitting ? <><LottieLoader size={20} /> Traitement...</> : "Confirmer la réinitialisation"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showResetModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowResetModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl bg-card border border-white/10 p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Remettre à zéro un compteur</h3>
                <button onClick={() => setShowResetModal(false)} className="text-gray-500 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-gray-400 mb-4">Sélectionnez le compteur à remettre à zéro. Cette action sera enregistrée dans l'historique.</p>
              <div className="space-y-2">
                {counterCards.map((counter) => (
                  <button
                    key={counter.key}
                    onClick={() => { setShowResetModal(false); openConfirm("reset", counter.key); }}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${counter.color}`}>
                        <RotateCcw className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm text-white font-medium">{counter.label}</p>
                        <p className="text-xs text-gray-500">{formatCurrency(counter.value)}</p>
                      </div>
                    </div>
                    <RotateCcw className="w-4 h-4 text-gray-500" />
                  </button>
                ))}
                <button
                  onClick={() => { setShowResetModal(false); openConfirm("reset", "all"); }}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-red-500/20">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                    </div>
                    <div>
                      <p className="text-sm text-red-300 font-medium">Tout remettre à zéro</p>
                      <p className="text-xs text-gray-500">Toutes les valeurs financières</p>
                    </div>
                  </div>
                  <RotateCcw className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de confirmation */}
      <AnimatePresence>
        {showConfirmModal && confirmAction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => { if (!actionLoading) setShowConfirmModal(false); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl bg-card border border-white/10 p-6 shadow-2xl"
            >
              <div className="text-center mb-6">
                <div className={`w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center ${confirmAction === "clear" ? "bg-red-500/20" : "bg-amber-500/20"}`}>
                  {confirmAction === "clear" ? (
                    <Trash2 className="w-7 h-7 text-red-400" />
                  ) : confirmAction === "restore" ? (
                    <RefreshCw className="w-7 h-7 text-blue-400" />
                  ) : (
                    <AlertTriangle className="w-7 h-7 text-amber-400" />
                  )}
                </div>
                <h3 className="text-lg font-bold text-white">{confirmMessages[confirmAction]?.title || "Confirmation"}</h3>
                <p className="text-sm text-gray-400 mt-2">{confirmMessages[confirmAction]?.message || "Confirmez-vous cette action ?"}</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowConfirmModal(false)} disabled={actionLoading}>Annuler</Button>
                <Button variant={confirmAction === "clear" ? "destructive" : "premium"} className="flex-1" onClick={() => {
                  if (confirmAction === "reset" && confirmTarget) handleReset();
                  else if (confirmAction === "restore" && confirmTarget) handleRestore(confirmTarget);
                  else if (confirmAction === "clear") handleClearHistory();
                }} disabled={actionLoading}>
                  {actionLoading ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Traitement...</> : confirmAction === "clear" ? "Vider" : confirmAction === "restore" ? "Restaurer" : "Confirmer"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Demandes en attente */}
      <SectionToggle show={showPending} setShow={setShowPending} title="Demandes en attente" count={pending.length}>
        {loading ? <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-20 rounded-xl bg-white/5 animate-pulse" />)}</div>
        : filterByPeriod(pending, period).length === 0 ? <p className="text-gray-500 text-center py-4 text-sm">Aucune demande</p>
        : <div className="space-y-2">
            {filterByPeriod(pending, period).map(w => {
              const hoursSince = (new Date().getTime() - new Date(w.created_at).getTime()) / (1000 * 60 * 60);
              const isClaimable = hoursSince >= 48;
              return (
                <div key={w.id} className="p-3 rounded-xl bg-white/5">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center"><User className="w-4 h-4 text-white" /></div>
                      <div>
                        <p className="text-sm font-medium text-white">{w.user_profile?.full_name || w.user?.full_name || "Utilisateur"}</p>
                        <p className="text-xs text-gray-500">{w.user_profile?.email || w.user?.email || ""}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-yellow-400">{formatCurrency(w.amount)}</p>
                      <Badge variant="warning" className="text-[10px]">En attente</Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-1 mb-2 p-2 rounded-lg bg-white/5 text-[11px]">
                    <div><span className="text-gray-500">Méthode:</span> <span className="text-white">{w.method}</span></div>
                    <div><span className="text-gray-500">Compte:</span> <span className="text-white font-mono">{w.account_info}</span></div>
                    <div><span className="text-gray-500">Date:</span> <span className="text-gray-400">{formatDate(w.created_at)}</span></div>
                    <div><span className="text-gray-500">Tél:</span> <span className="text-white">{w.user_profile?.phone || "N/R"}</span></div>
                  </div>
                  {isClaimable && <div className="mb-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center gap-2 text-xs text-amber-400"><MessageCircle className="w-3.5 h-3.5 shrink-0" />Réclamation possible (48h+)</div>}
                  <div className="flex flex-wrap gap-1.5">
                    <Button size="sm" variant="premium" onClick={() => openModal(w.id, "paid")}><Check className="w-3 h-3 mr-1" /> Payer</Button>
                    <Button size="sm" variant="destructive" onClick={() => openModal(w.id, "rejected")}><X className="w-3 h-3 mr-1" /> Refuser</Button>
                  </div>
                </div>
              );
            })}
          </div>
        }
      </SectionToggle>

      {/* Validées */}
      <SectionToggle show={showValidated} setShow={setShowValidated} title="Demandes validées" count={validated.length}>
        {validated.length === 0 ? <p className="text-gray-500 text-center py-4 text-sm">Aucune</p>
        : validated.map(w => (
            <div key={w.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 mb-2">
              <div><p className="text-sm text-white font-medium">{w.user_profile?.full_name || w.user?.full_name || "N/A"}</p><p className="text-xs text-gray-500">{formatCurrency(w.amount)} • {formatDate(w.created_at)}</p></div>
              <Badge variant="success" className="text-[10px]">Validée</Badge>
            </div>
          ))}
      </SectionToggle>

      {/* Payées */}
      <SectionToggle show={showPaid} setShow={setShowPaid} title="Demandes payées" count={paid.length}>
        {paid.length === 0 ? <p className="text-gray-500 text-center py-4 text-sm">Aucune</p>
        : paid.map(w => (
            <div key={w.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 mb-2">
              <div><p className="text-sm text-white font-medium">{w.user_profile?.full_name || w.user?.full_name || "N/A"}</p><p className="text-xs text-gray-500">{formatCurrency(w.amount)} • {formatDate(w.created_at)}</p></div>
              <Badge variant="success" className="text-[10px]">Payée</Badge>
            </div>
          ))}
      </SectionToggle>

      {/* Rejetées */}
      <SectionToggle show={showRejected} setShow={setShowRejected} title="Demandes rejetées" count={rejected.length}>
        {rejected.length === 0 ? <p className="text-gray-500 text-center py-4 text-sm">Aucune</p>
        : rejected.map(w => (
            <div key={w.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 mb-2">
              <div><p className="text-sm text-white font-medium">{w.user_profile?.full_name || w.user?.full_name || "N/A"}</p><p className="text-xs text-gray-500">{formatCurrency(w.amount)} • {formatDate(w.created_at)}</p></div>
              <Badge variant="danger" className="text-[10px]">Rejetée</Badge>
            </div>
          ))}
      </SectionToggle>

      {/* Réclamations */}
      {claimableWithdrawals.length > 0 && (
        <SectionToggle show={showClaims} setShow={setShowClaims} title="Réclamations (48h+)" count={claimableWithdrawals.length}>
          {claimableWithdrawals.map(w => (
            <div key={w.id} className="flex items-center justify-between p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 mb-2">
              <div><p className="text-sm text-white">{w.user_profile?.full_name || w.user?.full_name || "Utilisateur"}</p><p className="text-xs text-gray-500">{formatCurrency(w.amount)} • {formatDate(w.created_at)}</p></div>
              <Button size="sm" variant="premium" onClick={() => openModal(w.id, "paid")}><Check className="w-3 h-3 mr-1" /> Payer</Button>
            </div>
          ))}
        </SectionToggle>
      )}

      {/* Dépôt manuel */}
      <Card className="mb-4 p-4">
        <h3 className="text-lg font-semibold text-white mb-4">Dépôt manuel</h3>
        {depositError && <div className="mb-3 p-3 rounded-xl bg-red-500/10 text-red-400 text-sm">{depositError}</div>}
        {depositSuccess && <div className="mb-3 p-3 rounded-xl bg-green-500/10 text-green-400 text-sm">{depositSuccess}</div>}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Rechercher par email ou nom</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
              <Input placeholder="Email..." value={depositSearch} onChange={(e) => { setDepositSearch(e.target.value); setDepositUser(null); }} className="pl-10" />
              {depositSearching && <LottieLoader size={16} />}
            </div>
            {depositResults.length > 0 && !depositUser && (
              <div className="border border-white/10 rounded-xl overflow-hidden">
                {depositResults.map(u => (
                  <button key={u.id} onClick={() => { setDepositUser(u); setDepositSearch(u.email || u.full_name); setDepositResults([]); }}
                    className="w-full flex items-center gap-3 p-3 hover:bg-white/5 text-left">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center"><User className="w-4 h-4 text-white" /></div>
                    <div><p className="text-sm text-white">{u.full_name}</p><p className="text-xs text-gray-500">{u.email}</p></div>
                  </button>
                ))}
              </div>
            )}
            {depositUser && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center"><User className="w-4 h-4 text-white" /></div>
                <div className="flex-1"><p className="text-sm text-white">{depositUser.full_name}</p><p className="text-xs text-gray-500">{depositUser.email}</p></div>
                <button onClick={() => { setDepositUser(null); setDepositSearch(""); }} className="text-gray-500 hover:text-white"><X className="w-4 h-4" /></button>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label>Montant (FCFA)</Label>
            <Input type="number" placeholder="50000" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} />
          </div>
          <div className="space-y-2 flex items-end">
            <Button className="w-full" onClick={handleDeposit} disabled={depositSubmitting || !depositAmount || !depositUser}>
              {depositSubmitting ? <><LottieLoader size={20} /> Traitement...</> : <><ArrowUpFromLine className="w-4 h-4 mr-2" /> Créditer</>}
            </Button>
          </div>
        </div>
      </Card>

      {/* Historique complet */}
      <SectionToggle show={showHistory} setShow={setShowHistory} title="Tous les retraits" count={withdrawals.length}>
        <div className="flex items-center justify-between mb-3">
          <PeriodFilter value={period} onChange={setPeriod} />
        </div>
        {loading ? <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 rounded-xl bg-white/5 animate-pulse" />)}</div>
        : filterByPeriod(withdrawals, period).length === 0 ? <p className="text-gray-500 text-center py-4 text-sm">Aucun retrait</p>
        : <div className="space-y-1 max-h-[400px] overflow-y-auto">
            {filterByPeriod(withdrawals, period).map(w => (
              <div key={w.id} className="flex items-center justify-between p-2 rounded-xl bg-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center"><User className="w-3.5 h-3.5 text-white" /></div>
                  <div><p className="text-xs text-white">{w.user_profile?.full_name || w.user?.full_name || "N/A"}</p><p className="text-[10px] text-gray-500">{w.method}</p></div>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-medium text-white">{formatCurrency(w.amount)}</p>
                  <Badge variant={w.status === "paid" ? "success" : w.status === "rejected" ? "danger" : w.status === "validated" ? "info" : "warning"} className="text-[9px] px-1.5">{getStatusLabel(w.status)}</Badge>
                </div>
              </div>
            ))}
          </div>
        }
      </SectionToggle>
    </AdminLayout>
  );
}