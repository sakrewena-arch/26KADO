"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useWallet } from "@/hooks/useWallet";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency } from "@/lib/utils";
import { Wallet, ArrowUpFromLine, Smartphone, Building2, Loader2 } from "lucide-react";

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

interface Bank {
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
  banks: Bank[];
}

export default function RetraitPage() {
  const { wallet, createWithdrawal, loading } = useWallet();
  const { profile } = useAuth();
  const [countryInfo, setCountryInfo] = useState<CountryInfo | null>(null);
  const [geoLoading, setGeoLoading] = useState(true);
  const [amount, setAmount] = useState("");
  const [accountInfo, setAccountInfo] = useState("");
  const [paymentType, setPaymentType] = useState<"mobile" | "bank">("mobile");
  const [selectedOperator, setSelectedOperator] = useState("");
  const [selectedBank, setSelectedBank] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const detectCountry = async () => {
      try {
        const res = await fetch("/api/geo/detect");
        const data = await res.json();
        setCountryInfo(data);
        if (data.mobileOperators?.length > 0) {
          setSelectedOperator(data.mobileOperators[0].code);
        }
        if (data.banks?.length > 0) {
          setSelectedBank(data.banks[0].code);
        }
      } catch (err) {
        console.error("Geo detection failed", err);
      } finally {
        setGeoLoading(false);
      }
    };
    detectCountry();
  }, []);

  const handleWithdrawal = async () => {
    const finalMethod = paymentType === "mobile" ? selectedOperator : selectedBank;
    const fullAccount = countryInfo ? `${countryInfo.dialCode} ${accountInfo}` : accountInfo;
    if (!amount || !fullAccount || !finalMethod) return;
    setIsSubmitting(true);
    await createWithdrawal(Number(amount), finalMethod, fullAccount);
    setAmount("");
    setAccountInfo("");
    setIsSubmitting(false);
  };

  return (
    <DashboardLayout title="Retrait">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Solde */}
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-400">Solde disponible</p>
            <p className="text-3xl font-bold text-white mt-1">
              {formatCurrency(profile?.total_commission || 0)}
            </p>
            <div className="mt-4 p-3 rounded-xl bg-white/5">
              <p className="text-xs text-gray-400 mb-1">Total gagné</p>
              <p className="text-lg font-bold text-green-400">{formatCurrency(profile?.total_commission || 0)}</p>
            </div>
          </div>
        </Card>

        {/* Formulaire de retrait */}
        <Card className="lg:col-span-2">
          <h3 className="text-lg font-semibold text-white mb-2">Effectuer un retrait</h3>

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
                variant={paymentType === "bank" ? "premium" : "outline"}
                size="sm"
                onClick={() => setPaymentType("bank")}
              >
                <Building2 className="w-4 h-4 mr-1" /> Carte Bancaire
              </Button>
            </div>

            {/* Montant */}
            <div className="space-y-2">
              <Label>Montant (FCFA)</Label>
              <Input
                type="number"
                placeholder="5000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
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

            {/* Banques */}
            {paymentType === "bank" && countryInfo && (
              <div className="space-y-2">
                <Label>Banque</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {countryInfo.banks.map((bank) => (
                    <button
                      key={bank.code}
                      onClick={() => setSelectedBank(bank.code)}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        selectedBank === bank.code
                          ? "border-blue-500 bg-blue-500/10"
                          : "border-white/10 bg-white/5 hover:bg-white/10"
                      }`}
                    >
                      <div className="w-8 h-8 mx-auto mb-1 rounded-lg bg-white/10 flex items-center justify-center overflow-hidden">
                        <img
                          src={`/images/card/${bank.code}.jfif`}
                          alt={bank.name}
                          className="w-7 h-7 object-contain"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) parent.innerHTML = `<span class="text-white font-bold text-xs">${bank.name[0]}</span>`;
                          }}
                        />
                      </div>
                      <p className="text-xs text-white">{bank.name}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Numéro de compte */}
            <div className="space-y-2">
              <Label>
                {paymentType === "mobile" ? "Numéro de téléphone" : "Numéro de carte / compte"}
              </Label>
              <div className="flex gap-2">
                {countryInfo && (
                  <div className="flex items-center gap-1 px-3 rounded-xl bg-white/10 text-sm text-white shrink-0">
                    <span>{countryInfo.flag}</span>
                    <span>{countryInfo.dialCode}</span>
                  </div>
                )}
                <Input
                  placeholder={paymentType === "mobile" ? "XX XX XX XX" : "XXXX XXXX XXXX XXXX"}
                  value={accountInfo}
                  onChange={(e) => setAccountInfo(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>

            <Button
              className="w-full"
              onClick={handleWithdrawal}
              disabled={isSubmitting || !amount || !accountInfo}
              size="lg"
            >
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Traitement...</>
              ) : (
                <><ArrowUpFromLine className="mr-2 w-4 h-4" /> Retirer</>
              )}
            </Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}