"use client";

import { useEffect, useState, useCallback } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatDate } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, Search, Check, X, User, ArrowUpFromLine, AlertTriangle, Undo2 } from "lucide-react";
import LottieLoader from "@/components/ui/loading-animation";
import type { Profile } from "@/types";
import { PeriodFilter, filterByPeriod, type Period } from "@/components/ui/period-filter";

interface DepositRecord {
  id: string;
  user_id: string;
  amount: number;
  source: string;
  description: string;
  created_at: string;
  wallet_id: string;
  user_name?: string;
  user_email?: string;
}

export default function AdminPaymentsPage() {
  const supabase = createClient();
  const [deposits, setDeposits] = useState<DepositRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("month");

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [depositAmount, setDepositAmount] = useState("");

  const [showCreditModal, setShowCreditModal] = useState(false);
  const [creditSubmitting, setCreditSubmitting] = useState(false);
  const [creditSuccess, setCreditSuccess] = useState<string | null>(null);
  const [creditError, setCreditError] = useState<string | null>(null);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<DepositRecord | null>(null);
  const [cancelSubmitting, setCancelSubmitting] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const loadDeposits = useCallback(async () => {
    try {
      setLoading(true);
      // Récupérer d'abord tous les wallets pour avoir la correspondance wallet_id → user_id
      const { data: allWallets } = await supabase
        .from("wallets")
        .select("id, user_id");

      const walletMap = new Map<string, string>();
      if (allWallets) {
        allWallets.forEach((w: any) => walletMap.set(w.id, w.user_id));
      }

      // Récupérer les transactions de type deposit
      const { data: txs, error } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("source", "deposit")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) { console.error("Erreur chargement transactions:", error); return; }

      if (txs && txs.length > 0) {
        const enriched = await Promise.all(
          txs.map(async (tx: any) => {
            const userId = walletMap.get(tx.wallet_id);
            if (userId) {
              const { data: profile } = await supabase
                .from("profiles")
                .select("full_name, email")
                .eq("id", userId)
                .single();
              return { ...tx, user_id: userId, user_name: profile?.full_name || "N/A", user_email: profile?.email || "" } as DepositRecord;
            }
            return { ...tx, user_name: "N/A", user_email: "" } as DepositRecord;
          })
        );
        setDeposits(enriched);
      } else {
        setDeposits([]);
      }
    } catch (err) { console.error("Erreur chargement dépôts:", err); }
    finally { setLoading(false); }
  }, [supabase]);

  useEffect(() => { loadDeposits(); }, [loadDeposits]);

  useEffect(() => {
    if (searchQuery.length < 2) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await supabase.from("profiles").select("id, full_name, email").or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`).limit(10);
        if (data) setSearchResults(data as Profile[]);
      } catch {} finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, supabase]);

  const handleCredit = async () => {
    if (!selectedUser || !depositAmount) return;
    setCreditSubmitting(true); setCreditError(null); setCreditSuccess(null);
    try {
      const res = await fetch("/api/admin/withdrawals", {
        method: "PATCH", credentials: "same-origin", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: selectedUser.id, amount: Number(depositAmount), status: "deposit" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setCreditSuccess(`✅ ${formatCurrency(Number(depositAmount))} crédité sur ${selectedUser.full_name || selectedUser.email}`);
      setDepositAmount(""); setSelectedUser(null); setSearchQuery(""); setSearchResults([]);
      setShowCreditModal(false);
      setTimeout(() => loadDeposits(), 500);
    } catch (err: any) { setCreditError(err.message || "Erreur"); }
    finally { setCreditSubmitting(false); }
  };

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setCancelSubmitting(true); setCancelError(null);
    try {
      const res = await fetch("/api/admin/withdrawals", {
        method: "PATCH", credentials: "same-origin", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: cancelTarget.user_id, amount: cancelTarget.amount, status: "cancelled" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setCancelSuccess(`✅ Annulé : ${formatCurrency(cancelTarget.amount)} retiré du compte`);
      setTimeout(() => loadDeposits(), 500);
    } catch (err: any) { setCancelError(err.message || "Erreur"); }
    finally { setCancelSubmitting(false); }
  };

  const filteredDeposits = filterByPeriod(deposits, period);
  const totalDeposits = filteredDeposits.reduce((s, d) => s + Number(d.amount), 0);

  return (
    <AdminLayout title="Paiements & Dépôts">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="text-center p-4">
          <CreditCard className="w-5 h-5 text-blue-400 mx-auto mb-1" />
          <p className="text-2xl font-bold text-white">{formatCurrency(totalDeposits)}</p>
          <p className="text-xs text-gray-500">Total dépôts ({period === "month" ? "ce mois" : "période"})</p>
        </Card>
        <Card className="text-center p-4">
          <ArrowUpFromLine className="w-5 h-5 text-green-400 mx-auto mb-1" />
          <p className="text-2xl font-bold text-white">{filteredDeposits.length}</p>
          <p className="text-xs text-gray-500">Transactions</p>
        </Card>
        <Card className="text-center p-4">
          <PeriodFilter value={period} onChange={setPeriod} />
          <p className="text-xs text-gray-500 mt-2">Période d'affichage</p>
        </Card>
      </div>

      <Card className="mb-6 p-4">
        <h3 className="text-lg font-semibold text-white mb-4">Dépôt manuel</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Rechercher un utilisateur par email ou nom</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
              <Input placeholder="Email ou nom..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setSelectedUser(null); }} className="pl-10" />
              {searching && <LottieLoader size={16} />}
            </div>
            {searchResults.length > 0 && !selectedUser && (
              <div className="border border-white/10 rounded-xl overflow-hidden">
                {searchResults.map((u) => (
                  <button key={u.id} onClick={() => { setSelectedUser(u); setSearchQuery(u.email || u.full_name); setSearchResults([]); }}
                    className="w-full flex items-center gap-3 p-3 hover:bg-white/5 text-left">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center"><User className="w-4 h-4 text-white" /></div>
                    <div><p className="text-sm text-white">{u.full_name}</p><p className="text-xs text-gray-500">{u.email}</p></div>
                  </button>
                ))}
              </div>
            )}
            {selectedUser && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center"><User className="w-4 h-4 text-white" /></div>
                <div className="flex-1"><p className="text-sm text-white">{selectedUser.full_name}</p><p className="text-xs text-gray-500">{selectedUser.email}</p></div>
                <button onClick={() => { setSelectedUser(null); setSearchQuery(""); }} className="text-gray-500 hover:text-white"><X className="w-4 h-4" /></button>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label>Montant (FCFA)</Label>
            <Input type="number" placeholder="50000" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} />
          </div>
          <div className="space-y-2 flex items-end">
            <Button className="w-full" onClick={() => setShowCreditModal(true)} disabled={!depositAmount || !selectedUser}>
              <ArrowUpFromLine className="w-4 h-4 mr-2" /> Créditer
            </Button>
          </div>
        </div>
        {creditSuccess && <div className="mt-3 p-3 rounded-xl bg-green-500/10 text-green-400 text-sm">{creditSuccess}</div>}
        {creditError && <div className="mt-3 p-3 rounded-xl bg-red-500/10 text-red-400 text-sm">{creditError}</div>}
      </Card>

      <Card className="p-4">
        <h3 className="text-lg font-semibold text-white mb-4">Historique des dépôts ({filteredDeposits.length})</h3>
        {loading ? (
          <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-14 rounded-xl bg-white/5 animate-pulse" />)}</div>
        ) : filteredDeposits.length === 0 ? (
          <p className="text-gray-500 text-center py-8 text-sm">Aucun dépôt trouvé</p>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {filteredDeposits.map((dep) => (
              <div key={dep.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                    <ArrowUpFromLine className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium">{dep.user_name || "N/A"}</p>
                    <p className="text-xs text-gray-500">{dep.description} • {formatDate(dep.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm font-bold text-green-400">+{formatCurrency(dep.amount)}</p>
                  <button onClick={() => { setCancelTarget(dep); setShowCancelModal(true); }}
                    className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors" title="Annuler ce dépôt">
                    <Undo2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <AnimatePresence>
        {showCreditModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => { if (!creditSubmitting) setShowCreditModal(false); }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-2xl bg-card border border-white/10 p-6 shadow-2xl">
              {creditSuccess ? (
                <>
                  <div className="text-center mb-6">
                    <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-3"><Check className="w-7 h-7 text-green-400" /></div>
                    <h3 className="text-lg font-bold text-white mb-2">Compte crédité !</h3>
                    <p className="text-sm text-green-400">{creditSuccess}</p>
                  </div>
                  <Button className="w-full" variant="premium" onClick={() => { setShowCreditModal(false); setCreditSuccess(null); }}>Terminé</Button>
                </>
              ) : (
                <>
                  <div className="text-center mb-6">
                    <div className="w-14 h-14 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-3"><AlertTriangle className="w-7 h-7 text-amber-400" /></div>
                    <h3 className="text-lg font-bold text-white mb-2">Confirmer le crédit</h3>
                    <p className="text-sm text-gray-400">Vous allez créditer <strong className="text-white">{formatCurrency(Number(depositAmount))}</strong> sur le compte de <strong className="text-white">{selectedUser?.full_name || selectedUser?.email}</strong>.</p>
                    {creditError && <div className="mt-3 p-3 rounded-lg bg-red-500/10 text-xs text-red-400">{creditError}</div>}
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={() => setShowCreditModal(false)} disabled={creditSubmitting}>Annuler</Button>
                    <Button variant="premium" className="flex-1" onClick={handleCredit} disabled={creditSubmitting}>
                      {creditSubmitting ? <><LottieLoader size={20} /> Traitement...</> : "Confirmer le crédit"}
                    </Button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCancelModal && cancelTarget && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => { if (!cancelSubmitting) setShowCancelModal(false); }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-2xl bg-card border border-white/10 p-6 shadow-2xl">
              {cancelSuccess ? (
                <>
                  <div className="text-center mb-6">
                    <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-3"><Check className="w-7 h-7 text-green-400" /></div>
                    <h3 className="text-lg font-bold text-white mb-2">Dépôt annulé !</h3>
                    <p className="text-sm text-green-400">{cancelSuccess}</p>
                  </div>
                  <Button className="w-full" variant="premium" onClick={() => { setShowCancelModal(false); setCancelSuccess(null); }}>Terminé</Button>
                </>
              ) : (
                <>
                  <div className="text-center mb-6">
                    <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-3"><Undo2 className="w-7 h-7 text-red-400" /></div>
                    <h3 className="text-lg font-bold text-white mb-2">Annuler ce dépôt</h3>
                    <p className="text-sm text-gray-400">Vous allez retirer <strong className="text-white">{formatCurrency(cancelTarget.amount)}</strong> du compte de <strong className="text-white">{cancelTarget.user_name}</strong>.</p>
                    {cancelError && <div className="mt-3 p-3 rounded-lg bg-red-500/10 text-xs text-red-400">{cancelError}</div>}
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={() => setShowCancelModal(false)} disabled={cancelSubmitting}>Annuler</Button>
                    <Button variant="destructive" className="flex-1" onClick={handleCancel} disabled={cancelSubmitting}>
                      {cancelSubmitting ? <><LottieLoader size={20} /> Traitement...</> : "Confirmer l'annulation"}
                    </Button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}