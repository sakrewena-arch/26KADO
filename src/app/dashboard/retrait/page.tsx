"use client";

import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useWallet } from "@/hooks/useWallet";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency, formatDate } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Wallet, ArrowUpFromLine, Smartphone, Building2, Loader2, Check, X, Clock, Calendar, MessageCircle } from "lucide-react";
import type { WithdrawalRequest } from "@/types";
import WithdrawalNotice from "@/components/WithdrawalNotice";
import { motion, AnimatePresence } from "framer-motion";

const DAYS_FR = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

function getNextTuesdayInfo(): { daysLeft: number; hoursLeft: number; minutesLeft: number; isTuesday: boolean; dayName: string } {
  const now = new Date();
  const currentDay = now.getDay();

  if (currentDay === 2) {
    return {
      daysLeft: 0,
      hoursLeft: 23 - now.getHours(),
      minutesLeft: 59 - now.getMinutes(),
      isTuesday: true,
      dayName: "Mardi",
    };
  }

  let daysUntilTuesday = (2 - currentDay + 7) % 7;
  if (daysUntilTuesday === 0) daysUntilTuesday = 7;

  const nextTuesday = new Date(now);
  nextTuesday.setDate(now.getDate() + daysUntilTuesday);
  nextTuesday.setHours(0, 0, 0, 0);

  const diffMs = nextTuesday.getTime() - now.getTime();
  const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
  const daysLeft = Math.floor(totalHours / 24);
  const hoursLeft = totalHours % 24;
  const minutesLeft = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  return { daysLeft, hoursLeft, minutesLeft, isTuesday: false, dayName: DAYS_FR[2] };
}

const operatorImageMap: Record<string, string> = {
  "orange_money": "orange",
  "mtn_money": "mtn",
  "wave": "wave",
  "moov": "moov",
  "free_money": "free",
  "djamo": "djamo",
  "mixx": "mixx",
};

interface MobileOperator { code: string; name: string; }

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

export default function RetraitPage() {
  const { wallet, createWithdrawal, loading } = useWallet();
  const { user, profile } = useAuth();
  const supabase = createClient();
  // Utiliser le wallet si disponible, sinon le total_commission du profil
  const balance = wallet?.balance ?? profile?.total_commission ?? 0;
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(true);
  const [countryInfo, setCountryInfo] = useState<CountryInfo | null>(null);
  const [geoLoading, setGeoLoading] = useState(true);
  const [amount, setAmount] = useState("");
  const [accountInfo, setAccountInfo] = useState("");
  const [paymentType, setPaymentType] = useState<"mobile" | "card">("mobile");
  const [selectedOperator, setSelectedOperator] = useState("");
  const [selectedCard, setSelectedCard] = useState("visa");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [withdrawalSuccess, setWithdrawalSuccess] = useState(false);

  const loadWithdrawals = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from("withdrawal_requests")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (data) setWithdrawals(data as WithdrawalRequest[]);
    } catch (err) {
      console.error("Erreur chargement retraits:", err);
    } finally {
      setWithdrawalsLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => { loadWithdrawals(); }, [loadWithdrawals]);

  useEffect(() => {
    const detectCountry = async () => {
      try {
        const res = await fetch("/api/geo/detect");
        const data = await res.json();
        setCountryInfo(data);
        if (data.mobileOperators?.length > 0) setSelectedOperator(data.mobileOperators[0].code);
      } catch (err) {
        console.error("Geo detection failed", err);
      } finally {
        setGeoLoading(false);
      }
    };
    detectCountry();
  }, []);

  const handleWithdrawal = async () => {
    const finalMethod = paymentType === "mobile" ? selectedOperator : selectedCard;
    const fullAccount = countryInfo ? `${countryInfo.dialCode} ${accountInfo}` : accountInfo;
    if (!amount || !fullAccount || !finalMethod) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    const result = await createWithdrawal(Number(amount), finalMethod, fullAccount);
    if (!result.error) {
      setWithdrawalSuccess(true);
      setShowModal(true);
      setAmount("");
      setAccountInfo("");
      loadWithdrawals();
    } else {
      setWithdrawalSuccess(false);
      setErrorMessage(result.error || "Erreur lors du retrait");
      setShowModal(true);
    }
    setIsSubmitting(false);
  };

  const tuesdayInfo = getNextTuesdayInfo();

  const statusBadge = (status: string) => {
    const variants: Record<string, "success" | "danger" | "warning" | "default"> = {
      paid: "success", validated: "success", rejected: "danger", pending: "warning",
    };
    return variants[status] || "default";
  };

  const statusLabel = (status: string) => {
    const labels: Record<string, string> = {
      paid: "Payé", validated: "Validé", rejected: "Refusé", pending: "En attente",
    };
    return labels[status] || status;
  };

  return (
    <DashboardLayout title="Retrait">
      <WithdrawalNotice />

      {/* Modal de confirmation */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl bg-card border border-white/10 p-8 shadow-2xl"
            >
              {withdrawalSuccess ? (
                <>
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                      <Check className="w-8 h-8 text-green-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Retrait confirmé !</h3>
                    <p className="text-sm text-gray-400">
                      Votre demande de retrait a été soumise avec succès.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-white/5 mb-6">
                    <div className="flex items-center gap-3 mb-3">
                      <Clock className="w-5 h-5 text-amber-400" />
                      <p className="text-sm text-white font-medium">
                        {tuesdayInfo.isTuesday
                          ? "Paiement sous 24h"
                          : "Prochain paiement :"}
                      </p>
                    </div>

                    {tuesdayInfo.isTuesday ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-amber-400">
                          <Calendar className="w-4 h-4" />
                          <span>Aujourd'hui (Mardi)</span>
                        </div>
                        <p className="text-xs text-gray-400">
                          Votre compte sera crédité d'ici <strong className="text-white">24 heures</strong>.
                          Vous recevrez votre paiement au plus tard mercredi.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-amber-400">
                          <Calendar className="w-4 h-4" />
                          <span>Prochain retrait : {tuesdayInfo.dayName}</span>
                        </div>
                        <p className="text-xs text-gray-400">
                          Votre compte sera crédité le&nbsp;
                          <strong className="text-white">
                            {(() => {
                              const d = new Date();
                              d.setDate(d.getDate() + ((2 - d.getDay() + 7) % 7 || 7));
                              return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
                            })()}
                          </strong>
                          , soit dans&nbsp;
                          <strong className="text-white">
                            {tuesdayInfo.daysLeft > 0 ? `${tuesdayInfo.daysLeft}j ` : ""}
                            {tuesdayInfo.hoursLeft}h {tuesdayInfo.minutesLeft}min
                          </strong>.
                        </p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                      <X className="w-8 h-8 text-red-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Échec du retrait</h3>
                    <p className="text-sm text-red-400">{errorMessage}</p>
                  </div>
                </>
              )}

              <Button
                className="w-full"
                variant="premium"
                onClick={() => setShowModal(false)}
              >
                {withdrawalSuccess ? "Terminé" : "Fermer"}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-400">Solde disponible</p>
            <p className="text-3xl font-bold text-white mt-1">{formatCurrency(balance)}</p>
            <div className="mt-4 space-y-2">
              <div className="p-3 rounded-xl bg-white/5">
                <p className="text-xs text-gray-400">Total gagné</p>
                <p className="text-lg font-bold text-green-400">{formatCurrency(wallet?.total_earned ?? 0)}</p>
              </div>
              <div className="p-3 rounded-xl bg-white/5">
                <p className="text-xs text-gray-400">Total retiré</p>
                <p className="text-lg font-bold text-yellow-400">{formatCurrency(wallet?.total_withdrawn ?? 0)}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <h3 className="text-lg font-semibold text-white mb-2">Effectuer un retrait</h3>

          {errorMessage && !showModal && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
              <X className="w-4 h-4" /> {errorMessage}
            </div>
          )}

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
            <div className="flex gap-2">
              <Button variant={paymentType === "mobile" ? "premium" : "outline"} size="sm" onClick={() => setPaymentType("mobile")}>
                <Smartphone className="w-4 h-4 mr-1" /> Mobile Money
              </Button>
              <Button variant={paymentType === "card" ? "premium" : "outline"} size="sm" onClick={() => setPaymentType("card")}>
                <Building2 className="w-4 h-4 mr-1" /> Carte Bancaire
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Montant (FCFA)</Label>
              <Input type="number" placeholder="5000" value={amount} onChange={(e) => setAmount(e.target.value)} />
              <p className="text-xs text-gray-500">Minimum 5 000 FCFA</p>
            </div>

            {paymentType === "mobile" && countryInfo && (
              <div className="space-y-2">
                <Label>Opérateur mobile</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {countryInfo.mobileOperators.map((op) => (
                    <button
                      key={op.code}
                      onClick={() => setSelectedOperator(op.code)}
                      className={`p-3 rounded-xl border text-center transition-all ${selectedOperator === op.code ? "border-blue-500 bg-blue-500/10" : "border-white/10 bg-white/5 hover:bg-white/10"}`}
                    >
                      <div className="w-8 h-8 mx-auto mb-1 rounded-lg bg-white/10 flex items-center justify-center overflow-hidden">
                        <img src={`/images/payments/${countryInfo.countryDir}/${operatorImageMap[op.code] || op.code}.jfif`} alt={op.name} className="w-7 h-7 object-contain"
                          onError={(e) => { const t = e.target as HTMLImageElement; t.style.display = 'none'; const p = t.parentElement; if (p) p.innerHTML = `<span class="text-white font-bold text-xs">${op.name[0]}</span>`; }} />
                      </div>
                      <p className="text-xs text-white">{op.name}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {paymentType === "card" && (
              <div className="space-y-2">
                <Label>Carte bancaire</Label>
                <div className="grid grid-cols-3 gap-2">
                  {cardTypes.map((card) => (
                    <button
                      key={card.code}
                      onClick={() => setSelectedCard(card.code)}
                      className={`p-3 rounded-xl border text-center transition-all ${selectedCard === card.code ? "border-blue-500 bg-blue-500/10" : "border-white/10 bg-white/5 hover:bg-white/10"}`}
                    >
                      <div className="w-10 h-8 mx-auto mb-1 rounded-lg bg-white/10 flex items-center justify-center overflow-hidden p-1">
                        <img src={`/images/cards/${card.code}.jfif`} alt={card.name} className="w-full h-full object-contain"
                          onError={(e) => { const t = e.target as HTMLImageElement; t.style.display = 'none'; const p = t.parentElement; if (p) p.innerHTML = `<span class="text-white font-bold text-xs">${card.name[0]}</span>`; }} />
                      </div>
                      <p className="text-xs text-white">{card.name}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>{paymentType === "mobile" ? "Numéro de téléphone" : "Numéro de carte"}</Label>
              <div className="flex gap-2">
                {countryInfo && (
                  <div className="flex items-center gap-1 px-3 rounded-xl bg-white/10 text-sm text-white shrink-0">
                    <span>{countryInfo.flag}</span>
                    <span>{countryInfo.dialCode}</span>
                  </div>
                )}
                <Input placeholder={paymentType === "mobile" ? "XX XX XX XX" : "XXXX XXXX XXXX XXXX"} value={accountInfo} onChange={(e) => setAccountInfo(e.target.value)} className="flex-1" />
              </div>
            </div>

            <Button className="w-full" onClick={handleWithdrawal} disabled={isSubmitting || !amount || !accountInfo} size="lg">
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Traitement...</>
              ) : (
                <><ArrowUpFromLine className="mr-2 w-4 h-4" /> Retirer</>
              )}
            </Button>
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <h3 className="text-lg font-semibold text-white mb-4">Historique des retraits</h3>
        {withdrawalsLoading ? (
          <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-14 rounded-xl bg-white/5 animate-pulse" />)}</div>
        ) : withdrawals.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">Aucun retrait effectué</p>
        ) : (
          <div className="space-y-3">
            {withdrawals.map((w) => {
              const createdAt = new Date(w.created_at);
              const now = new Date();
              const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
              const canClaim = w.status === "pending" && hoursSinceCreation >= 48;

              return (
                <div key={w.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                  <div>
                    <p className="text-sm text-white font-medium">{formatCurrency(w.amount)}</p>
                    <p className="text-xs text-gray-500">{w.method} • {w.account_info}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <Badge variant={statusBadge(w.status)} className="text-[10px]">{statusLabel(w.status)}</Badge>
                      <p className="text-xs text-gray-600 mt-1">{formatDate(w.created_at)}</p>
                    </div>
                    {w.status === "pending" && (
                      <button
                        onClick={() => {
                          if (canClaim) {
                            // TODO: ouvrir un ticket de réclamation
                            window.location.href = "/dashboard/support";
                          }
                        }}
                        disabled={!canClaim}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          canClaim
                            ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 cursor-pointer"
                            : "bg-white/5 text-gray-600 cursor-not-allowed"
                        }`}
                        title={canClaim ? "Réclamer votre paiement" : "Bouton disponible 48h après la demande"}
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        Réclamation
                        {!canClaim && (
                          <span className="text-[9px] text-gray-600">
                            ({Math.max(0, Math.ceil(48 - hoursSinceCreation))}h)
                          </span>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </DashboardLayout>
  );
}