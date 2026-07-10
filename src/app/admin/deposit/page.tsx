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
import { Wallet, ArrowDownToLine, Loader2, Check, X, Smartphone, Building2, CreditCard } from "lucide-react";

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

interface AdminWallet {
  balance: number;
  total_deposited: number;
}

export default function AdminDepositPage() {
  const supabase = createClient();
  const [adminWallet, setAdminWallet] = useState<AdminWallet>({ balance: 0, total_deposited: 0 });
  const [walletLoading, setWalletLoading] = useState(true);
  const [depositHistory, setDepositHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const [amount, setAmount] = useState("");
  const [paymentType, setPaymentType] = useState<"mobile" | "card">("mobile");
  const [selectedOperator, setSelectedOperator] = useState("");
  const [selectedCard, setSelectedCard] = useState("visa");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [countryInfo, setCountryInfo] = useState<CountryInfo | null>(null);
  const [geoLoading, setGeoLoading] = useState(true);

  useEffect(() => {
    const detectCountry = async () => {
      try {
        const res = await fetch("/api/geo/detect");
        const data = await res.json();
        setCountryInfo(data);
        if (data.mobileOperators?.length > 0) {
          setSelectedOperator(data.mobileOperators[0].code);
        }
      } catch (err) {
        console.error("Geo detection failed", err);
      } finally {
        setGeoLoading(false);
      }
    };
    detectCountry();
  }, []);

  // Charger le wallet admin
  const loadAdminWallet = useCallback(async () => {
    try {
      const { data } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "admin_wallet")
        .maybeSingle();
      if (data?.value) {
        setAdminWallet(data.value as AdminWallet);
      }
    } catch (err) {
      console.error("Erreur chargement wallet admin:", err);
    } finally {
      setWalletLoading(false);
    }
  }, [supabase]);

  // Charger l'historique des dépôts admin
  const loadHistory = useCallback(async () => {
    try {
      // On cherche les transactions de type deposit avec "admin" dans la description
      const { data } = await supabase
        .from("payment_transactions")
        .select("*")
        .eq("type", "deposit")
        .order("created_at", { ascending: false })
        .limit(50);
      if (data) setDepositHistory(data);
    } catch (err) {
      console.error("Erreur chargement historique:", err);
    } finally {
      setHistoryLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadAdminWallet();
    loadHistory();
  }, [loadAdminWallet, loadHistory]);

  const handleDeposit = async () => {
    if (!amount || Number(amount) <= 0) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const method = paymentType === "mobile" ? selectedOperator : selectedCard;

      // Rediriger vers PayDunya pour le paiement
      const payRes = await fetch("/api/paydunya/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(amount) }),
      });
      const payData = await payRes.json();

      if (!payRes.ok) {
        throw new Error(payData?.error || "Erreur PayDunya");
      }

      if (payData.url) {
        // Ouvrir la page PayDunya dans un nouvel onglet
        window.open(payData.url, "_blank");
        setSuccessMessage(`Paiement de ${formatCurrency(Number(amount))} initié. Après confirmation, le wallet sera crédité automatiquement.`);
        setAmount("");

        // Créditer immédiatement le wallet admin en attendant le webhook
        const newBalance = adminWallet.balance + Number(amount);
        const newTotal = adminWallet.total_deposited + Number(amount);
        const walletUpdate: AdminWallet = { balance: newBalance, total_deposited: newTotal };

        await supabase
          .from("settings")
          .upsert({ key: "admin_wallet", value: walletUpdate, type: "json" }, { onConflict: "key" });

        setAdminWallet(walletUpdate);
        loadHistory();
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Erreur lors du dépôt");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout title="Dépôt - Recharger le Wallet Admin">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Wallet Admin */}
        <Card>
          <div className="text-center">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 inline-flex mb-4">
              <Wallet className="w-8 h-8 text-green-400" />
            </div>
            <p className="text-sm text-gray-400">Wallet Admin</p>
            {walletLoading ? (
              <div className="h-8 w-24 mx-auto rounded bg-white/5 animate-pulse mt-1" />
            ) : (
              <p className="text-3xl font-bold text-white mt-1">
                {formatCurrency(adminWallet.balance)}
              </p>
            )}
            <div className="mt-4 p-3 rounded-xl bg-white/5">
              <p className="text-xs text-gray-400">Total approvisionné</p>
              <p className="text-lg font-bold text-yellow-400">{formatCurrency(adminWallet.total_deposited)}</p>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Ce wallet sert à suivre les fonds disponibles pour les paiements utilisateurs.
            </p>
          </div>
        </Card>

        {/* Formulaire pour recharger le wallet admin */}
        <Card className="lg:col-span-2">
          <h3 className="text-lg font-semibold text-white mb-4">
            <CreditCard className="w-5 h-5 inline mr-2" />
            Recharger le Wallet Admin
          </h3>

          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
              <X className="w-4 h-4" /> {errorMessage}
            </div>
          )}
          {successMessage && (
            <div className="mb-4 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm flex items-center gap-2">
              <Check className="w-4 h-4" /> {successMessage}
            </div>
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
            {/* Type de paiement */}
            <div className="flex gap-2">
              <Button
                variant={paymentType === "mobile" ? "premium" : "outline"}
                size="sm"
                onClick={() => setPaymentType("mobile")}
              >
                <Smartphone className="w-4 h-4 mr-1" /> Mobile Money
              </Button>
              <Button
                variant={paymentType === "card" ? "premium" : "outline"}
                size="sm"
                onClick={() => setPaymentType("card")}
              >
                <Building2 className="w-4 h-4 mr-1" /> Carte Bancaire
              </Button>
            </div>

            {/* Montant */}
            <div className="space-y-2">
              <Label>Montant à déposer (FCFA)</Label>
              <Input
                type="number"
                placeholder="50000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Ce montant sera ajouté à votre wallet admin via PayDunya
              </p>
            </div>

            {/* Opérateurs Mobile Money */}
            {paymentType === "mobile" && countryInfo && (
              <div className="space-y-2">
                <Label>Opérateur mobile</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {countryInfo.mobileOperators.map((op) => (
                    <button
                      key={op.code}
                      onClick={() => setSelectedOperator(op.code)}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        selectedOperator === op.code
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
            {paymentType === "card" && (
              <div className="space-y-2">
                <Label>Carte bancaire</Label>
                <div className="grid grid-cols-3 gap-2">
                  {cardTypes.map((card) => (
                    <button
                      key={card.code}
                      onClick={() => setSelectedCard(card.code)}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        selectedCard === card.code
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

            <Button
              className="w-full"
              onClick={handleDeposit}
              disabled={isSubmitting || !amount}
              size="lg"
            >
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Ouverture du paiement...</>
              ) : (
                <><ArrowDownToLine className="mr-2 w-4 h-4" /> Recharger avec PayDunya</>
              )}
            </Button>

            <p className="text-xs text-gray-500 text-center">
              Paiement sécurisé via PayDunya - Mobile Money ou Carte Bancaire
            </p>
          </div>
        </Card>
      </div>

      {/* Historique des dépôts admin */}
      <Card className="mt-6">
        <h3 className="text-lg font-semibold text-white mb-4">Historique des approvisionnements</h3>
        {historyLoading ? (
          <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-14 rounded-xl bg-white/5 animate-pulse" />)}</div>
        ) : depositHistory.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">Aucun approvisionnement</p>
        ) : (
          <div className="space-y-2">
            {depositHistory.map((dep) => (
              <div key={dep.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                    <ArrowDownToLine className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium">{formatCurrency(dep.amount)}</p>
                    <p className="text-xs text-gray-500">{dep.method || "PayDunya"}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="success" className="text-[10px]">Payé</Badge>
                  <p className="text-xs text-gray-600 mt-1">{formatDate(dep.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </AdminLayout>
  );
}