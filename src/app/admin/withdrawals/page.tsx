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
import { Check, X, ArrowUpFromLine, Loader2, Search, ChevronDown, ChevronUp, User, MessageCircle, Clock, AlertTriangle } from "lucide-react";
import type { WithdrawalRequest, Profile } from "@/types";
import { PeriodFilter, filterByPeriod, type Period } from "@/components/ui/period-filter";

export default function AdminWithdrawalsPage() {
  const supabase = createClient();
  const [withdrawals, setWithdrawals] = useState<(WithdrawalRequest & { user_profile?: Profile })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal de confirmation
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState<"validated" | "paid" | "rejected" | null>(null);
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

  const [claimableWithdrawals, setClaimableWithdrawals] = useState<(WithdrawalRequest & { user_profile?: Profile })[]>([]);
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

  useEffect(() => { loadWithdrawals(); }, [loadWithdrawals]);

  useEffect(() => {
    const now = new Date();
    setClaimableWithdrawals(withdrawals.filter((w) => {
      if (w.status !== "pending") return false;
      return (now.getTime() - new Date(w.created_at).getTime()) / (1000 * 60 * 60) >= 48;
    }));
  }, [withdrawals]);

  const openModal = (id: string, action: "validated" | "paid" | "rejected") => {
    setModalTargetId(id);
    setModalAction(action);
    setModalSuccess(null);
    setModalError(null);
    setShowModal(true);
  };

  const executeAction = async () => {
    if (!modalTargetId || !modalAction) return;
    setModalSubmitting(true);
    setModalError(null);
    try {
      const res = await fetch("/api/admin/withdrawals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ withdrawal_id: modalTargetId, status: modalAction }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setModalSuccess(
        modalAction === "paid" ? "✅ Paiement confirmé ! Statut mis à jour."
        : modalAction === "validated" ? "✅ Validation confirmée !"
        : "✅ Demande refusée."
      );
      await loadWithdrawals();
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
    validated: { title: "Confirmer la validation", msg: "Vous confirmez avoir vérifié manuellement ?", icon: <Check className="w-7 h-7 text-blue-400" />, bg: "bg-blue-500/20" },
    paid: { title: "Confirmer le paiement", msg: "Avez-vous bien envoyé l'argent manuellement ?", icon: <Check className="w-7 h-7 text-green-400" />, bg: "bg-green-500/20" },
    rejected: { title: "Confirmer le refus", msg: "Êtes-vous sûr de vouloir refuser ?", icon: <X className="w-7 h-7 text-red-400" />, bg: "bg-red-500/20" },
  };

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
                      {modalSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Traitement...</> : "Confirmer"}
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
                    <Button size="sm" variant="default" onClick={() => openModal(w.id, "validated")}><Check className="w-3 h-3 mr-1" /> Validé</Button>
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
              {depositSearching && <Loader2 className="absolute right-3 top-3 w-4 h-4 animate-spin text-gray-500" />}
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
              {depositSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Traitement...</> : <><ArrowUpFromLine className="w-4 h-4 mr-2" /> Créditer</>}
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