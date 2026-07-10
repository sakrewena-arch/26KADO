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
import { Check, X, ArrowUpFromLine, ArrowDownToLine, Smartphone, Building2, Loader2, Wallet, Search } from "lucide-react";
import type { WithdrawalRequest } from "@/types";

const operatorImageMap: Record<string, string> = {
  "orange_money": "orange",
  "mtn_money": "mtn",
  "wave": "wave",
  "moov": "moov",
  "free_money": "free",
  "djamo": "djamo",
  "mixx": "mixx",
};

interface MobileOperator {
  code: string;
  name: string;
}

interface CountryInfo {
  country: string;
  countryCode: string;
  flag: string;
  dialCode: string;
  countryDir?: string;
  mobileOperators: MobileOperator[];
}

const cardTypes = [
  { code: "visa", name: "Visa" },
  { code: "mastercard", name: "Mastercard" },
  { code: "amex", name: "American Express" },
];

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"retraits" | "depot">("retraits");

  // État pour le dépôt
  const [countryInfo, setCountryInfo] = useState<CountryInfo | null>(null);
  const [geoLoading, setGeoLoading] = useState(true);
  const [depositUserId, setDepositUserId] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [depositPaymentType, setDepositPaymentType] = useState<"mobile" | "card">("mobile");
  const [depositOperator, setDepositOperator] = useState("");
  const [depositCard, setDepositCard] = useState("visa");
  const [depositAccount, setDepositAccount] = useState("");
  const [depositSubmitting, setDepositSubmitting] = useState(false);
  const [depositSuccess, setDepositSuccess] = useState<string | null>(null);
  const [depositError, setDepositError] = useState<string | null>(null);

  // Détection de pays
  useEffect(() => {
    const detectCountry = async () => {
      try {
        const res = await fetch("/api/geo/detect");
        const data = await res.json();
        setCountryInfo(data);
        if (data.mobileOperators?.length > 0) {
          setDepositOperator(data.mobileOperators[0].code);
        }
      } catch (err) {
        console.error("Geo detection failed", err);
      } finally {
        setGeoLoading(false);
      }
    };
    detectCountry();
  }, []);

  const loadWithdrawals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllWithdrawals();
      setWithdrawals(data);
    } catch (err) {
      setError("Erreur lors du chargement des retraits");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWithdrawals();
  }, [loadWithdrawals]);

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
      const method = depositPaymentType === "mobile" ? depositOperator : depositCard;
      const res = await fetch("/api/admin/withdrawals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: depositUserId,
          amount: Number(depositAmount),
          status: "deposit",
          method,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setDepositSuccess(`Dépôt de ${formatCurrency(Number(depositAmount))} effectué avec succès`);
      setDepositAmount("");
      setDepositUserId("");
      setDepositAccount("");
    } catch (err: any) {
      setDepositError(err.message || "Erreur lors du dépôt");
    } finally {
      setDepositSubmitting(false);
    }
  };

  const pending = withdrawals.filter((w) => w.status === "pending");

  return (
    <AdminLayout title="Retraits & Dépôts">
      {/* Onglets */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={activeTab === "retraits" ? "premium" : "outline"}
          onClick={() => setActiveTab("retraits")}
        >
          <ArrowUpFromLine className="w-4 h-4 mr-2" />
          Retraits ({pending.length})
        </Button>
        <Button
          variant={activeTab === "depot" ? "premium" : "outline"}
          onClick={() => setActiveTab("depot")}
        >
          <ArrowDownToLine className="w-4 h-4 mr-2" />
          Dépôt manuel
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {activeTab === "retraits" ? (
        /* ===== ONGLET RETRAITS ===== */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <h3 className="text-lg font-semibold text-white mb-4">Demandes en attente ({pending.length})</h3>
            {loading ? (
              <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-xl bg-white/5 animate-pulse" />)}</div>
            ) : pending.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Aucune demande en attente</p>
            ) : (
              <div className="space-y-3">
                {pending.map((w) => (
                  <div key={w.id} className="p-4 rounded-xl bg-white/5">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium text-white">{w.user?.full_name || "Utilisateur"}</p>
                        <p className="text-xs text-gray-500">{w.method} • {w.account_info}</p>
                      </div>
                      <p className="text-lg font-bold text-yellow-400">{formatCurrency(w.amount)}</p>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">{formatDate(w.created_at)}</p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="default" onClick={() => handleStatus(w.id, "paid")} disabled={actionLoading === w.id}>
                        {actionLoading === w.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
                        Payer
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleStatus(w.id, "rejected")} disabled={actionLoading === w.id}>
                        <X className="w-4 h-4 mr-1" /> Refuser
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-white mb-4">Tous les retraits</h3>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {withdrawals.map((w) => (
                <div key={w.id} className="p-3 rounded-xl bg-white/5">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-white">{w.user?.full_name || "N/A"}</p>
                    <Badge variant={w.status === "paid" ? "success" : w.status === "rejected" ? "danger" : "warning"} className="text-[10px]">
                      {getStatusLabel(w.status)}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-gray-500">{formatCurrency(w.amount)} • {w.method}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      ) : (
        /* ===== ONGLET DÉPÔT MANUEL ===== */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <h3 className="text-lg font-semibold text-white mb-4">Effectuer un dépôt manuel</h3>

            {depositError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{depositError}</div>
            )}
            {depositSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">{depositSuccess}</div>
            )}

            {/* Détection du pays */}
            {geoLoading ? (
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                <Loader2 className="w-4 h-4 animate-spin" />
                Détection de votre pays...
              </div>
            ) : countryInfo ? (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-white/5 mb-4">
                <span className="text-2xl">{countryInfo.flag}</span>
                <div>
                  <p className="text-sm text-white font-medium">{countryInfo.country}</p>
                  <p className="text-xs text-gray-500">{countryInfo.dialCode} • {countryInfo.countryCode}</p>
                </div>
              </div>
            ) : null}

            <div className="space-y-4">
              {/* ID Utilisateur */}
              <div className="space-y-2">
                <Label>ID Utilisateur</Label>
                <div className="flex gap-2">
                  <Search className="w-5 h-5 text-gray-500 mt-3" />
                  <Input
                    placeholder="UUID de l'utilisateur à créditer"
                    value={depositUserId}
                    onChange={(e) => setDepositUserId(e.target.value)}
                  />
                </div>
                <p className="text-xs text-gray-500">Entrez l'UUID de l'utilisateur qui recevra le dépôt</p>
              </div>

              {/* Type de paiement */}
              <div className="flex gap-2">
                <Button
                  variant={depositPaymentType === "mobile" ? "premium" : "outline"}
                  size="sm"
                  onClick={() => setDepositPaymentType("mobile")}
                >
                  <Smartphone className="w-4 h-4 mr-1" /> Mobile Money
                </Button>
                <Button
                  variant={depositPaymentType === "card" ? "premium" : "outline"}
                  size="sm"
                  onClick={() => setDepositPaymentType("card")}
                >
                  <Building2 className="w-4 h-4 mr-1" /> Carte Bancaire
                </Button>
              </div>

              {/* Montant */}
              <div className="space-y-2">
                <Label>Montant (FCFA)</Label>
                <Input
                  type="number"
                  placeholder="50000"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                />
              </div>

              {/* Opérateurs Mobile Money */}
              {depositPaymentType === "mobile" && countryInfo && (
                <div className="space-y-2">
                  <Label>Opérateur mobile</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {countryInfo.mobileOperators.map((op) => (
                      <button
                        key={op.code}
                        onClick={() => setDepositOperator(op.code)}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          depositOperator === op.code
                            ? "border-blue-500 bg-blue-500/10"
                            : "border-white/10 bg-white/5 hover:bg-white/10"
                        }`}
                      >
                        <div className="w-8 h-8 mx-auto mb-1 rounded-lg bg-white/10 flex items-center justify-center overflow-hidden">
                          <img
                            src={`/images/payments/${countryInfo.countryDir}/${operatorImageMap[op.code] || op.code}.jfif`}
                            alt={op.name}
                            className="w-7 h-7 object-contain"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) parent.innerHTML = `<span class="text-white font-bold text-xs">${op.name[0]}</span>`;
                            }}
                          />
                        </div>
                        <p className="text-xs text-white">{op.name}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Cartes bancaires */}
              {depositPaymentType === "card" && (
                <div className="space-y-2">
                  <Label>Carte bancaire</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {cardTypes.map((card) => (
                      <button
                        key={card.code}
                        onClick={() => setDepositCard(card.code)}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          depositCard === card.code
                            ? "border-blue-500 bg-blue-500/10"
                            : "border-white/10 bg-white/5 hover:bg-white/10"
                        }`}
                      >
                        <div className="w-10 h-8 mx-auto mb-1 rounded-lg bg-white/10 flex items-center justify-center overflow-hidden p-1">
                          <img
                            src={`/images/cards/${card.code}.jfif`}
                            alt={card.name}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) parent.innerHTML = `<span class="text-white font-bold text-xs">${card.name[0]}</span>`;
                            }}
                          />
                        </div>
                        <p className="text-xs text-white">{card.name}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Numéro de compte */}
              <div className="space-y-2">
                <Label>Numéro de téléphone / compte</Label>
                <div className="flex gap-2">
                  {countryInfo && (
                    <div className="flex items-center gap-1 px-3 rounded-xl bg-white/10 text-sm text-white shrink-0">
                      <span>{countryInfo.flag}</span>
                      <span>{countryInfo.dialCode}</span>
                    </div>
                  )}
                  <Input
                    placeholder="XX XX XX XX"
                    value={depositAccount}
                    onChange={(e) => setDepositAccount(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>

              <Button
                className="w-full"
                onClick={handleDeposit}
                disabled={depositSubmitting || !depositAmount || !depositUserId}
                size="lg"
              >
                {depositSubmitting ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Traitement...</>
                ) : (
                  <><ArrowDownToLine className="mr-2 w-4 h-4" /> Créditer le compte</>
                )}
              </Button>
            </div>
          </Card>

          {/* Info */}
          <Card>
            <div className="text-center">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 inline-flex mb-4">
                <Wallet className="w-8 h-8 text-green-400" />
              </div>
              <p className="text-sm text-gray-400 mb-1">Dépôt manuel</p>
              <p className="text-xs text-gray-500 mt-4">
                Créditez directement le wallet d'un utilisateur. 
                Le montant sera ajouté à son solde disponible et une transaction sera créée.
              </p>
            </div>
          </Card>
        </div>
      )}
    </AdminLayout>
  );
}