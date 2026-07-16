"use client";

import { useEffect, useState, useCallback } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { CreditCard, Search, Loader2, Check, X, User } from "lucide-react";
import type { PaymentTransaction, Profile } from "@/types";
import { PeriodFilter, filterByPeriod, type Period } from "@/components/ui/period-filter";

// Les fonctions isToday, isThisWeek, isThisMonth sont importées depuis period-filter

export default function AdminPaymentsPage() {
  const supabase = createClient();
  const [transactions, setTransactions] = useState<(PaymentTransaction & { user_profile?: Partial<Profile> })[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("month");

  // Recherche utilisateur pour dépôt manuel
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositSubmitting, setDepositSubmitting] = useState(false);
  const [depositSuccess, setDepositSuccess] = useState<string | null>(null);
  const [depositError, setDepositError] = useState<string | null>(null);

  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await supabase
        .from("payment_transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (data) setTransactions(data as any);
    } catch (err) {
      console.error("Erreur chargement transactions:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // Recherche utilisateur
  useEffect(() => {
    if (searchQuery.length < 2) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
          .limit(10);
        if (data) setSearchResults(data as Profile[]);
      } catch (err) { console.error(err); }
      finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, supabase]);

  const handleDeposit = async () => {
    if (!selectedUser || !depositAmount) return;
    setDepositSubmitting(true);
    setDepositError(null);
    setDepositSuccess(null);
    try {
      const res = await fetch("/api/admin/withdrawals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: selectedUser.id, amount: Number(depositAmount), status: "deposit" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setDepositSuccess(`Dépôt de ${formatCurrency(Number(depositAmount))} sur ${selectedUser.full_name || selectedUser.email}`);
      setDepositAmount("");
      setSelectedUser(null);
      setSearchQuery("");
      setSearchResults([]);
      loadTransactions();
    } catch (err: any) {
      setDepositError(err.message || "Erreur lors du dépôt");
    } finally {
      setDepositSubmitting(false);
    }
  };

  const filteredTransactions = filterByPeriod(transactions, period);

  return (
    <AdminLayout title="Paiements & Dépôts">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Stats */}
        <Card className="text-center">
          <CreditCard className="w-6 h-6 text-blue-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">
            {formatCurrency(filteredTransactions.reduce((s, tx) => s + Number(tx.amount), 0))}
          </p>
          <p className="text-xs text-gray-500">Total transactions</p>
        </Card>
        <Card className="text-center">
          <Check className="w-6 h-6 text-green-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">
            {filteredTransactions.filter((tx) => tx.status === "completed").length}
          </p>
          <p className="text-xs text-gray-500">Complétées</p>
        </Card>
        <Card className="text-center">
          <X className="w-6 h-6 text-red-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">
            {filteredTransactions.filter((tx) => tx.status === "failed").length}
          </p>
          <p className="text-xs text-gray-500">Échouées</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dépôt manuel avec recherche email */}
        <Card>
          <h3 className="text-lg font-semibold text-white mb-4">Dépôt manuel</h3>

          {depositError && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{depositError}</div>
          )}
          {depositSuccess && (
            <div className="mb-4 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">{depositSuccess}</div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Rechercher un utilisateur par email ou nom</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                <Input
                  placeholder="Email ou nom..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setSelectedUser(null); }}
                  className="pl-10"
                />
                {searching && <Loader2 className="absolute right-3 top-3 w-4 h-4 animate-spin text-gray-500" />}
              </div>

              {searchResults.length > 0 && !selectedUser && (
                <div className="border border-white/10 rounded-xl overflow-hidden">
                  {searchResults.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => { setSelectedUser(u); setSearchQuery(u.email || u.full_name); setSearchResults([]); }}
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

              {selectedUser && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-white">{selectedUser.full_name}</p>
                    <p className="text-xs text-gray-500">{selectedUser.email}</p>
                  </div>
                  <button onClick={() => { setSelectedUser(null); setSearchQuery(""); }} className="text-gray-500 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Montant (FCFA)</Label>
              <Input type="number" placeholder="50000" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} />
            </div>

            <Button
              className="w-full"
              onClick={handleDeposit}
              disabled={depositSubmitting || !depositAmount || !selectedUser}
            >
              {depositSubmitting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Traitement...</>
              ) : (
                <><CreditCard className="w-4 h-4 mr-2" /> Créditer {selectedUser ? selectedUser.full_name || selectedUser.email : "le compte"}</>
              )}
            </Button>
          </div>
        </Card>

        {/* Transactions avec filtres */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Transactions</h3>
            <PeriodFilter value={period} onChange={setPeriod} />
          </div>

          {loading ? (
            <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-14 rounded-xl bg-white/5 animate-pulse" />)}</div>
          ) : filteredTransactions.length === 0 ? (
            <p className="text-gray-500 text-center py-8 text-sm">Aucune transaction trouvée</p>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {filteredTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                  <div className="flex items-center gap-2">
                    <CreditCard className={`w-4 h-4 ${tx.status === "completed" ? "text-green-400" : tx.status === "failed" ? "text-red-400" : "text-yellow-400"}`} />
                    <div>
                      <p className="text-xs text-white">{formatCurrency(tx.amount)}</p>
                      <p className="text-[10px] text-gray-500">{tx.method || "PayDunya"}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={tx.status === "completed" ? "success" : tx.status === "failed" ? "danger" : "warning"} className="text-[10px]">
                      {tx.status === "completed" ? "Complété" : tx.status === "failed" ? "Échoué" : "En attente"}
                    </Badge>
                    <p className="text-[10px] text-gray-600 mt-0.5">{formatDate(tx.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
}