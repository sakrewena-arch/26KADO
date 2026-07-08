"use client";

import { useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Wallet, ArrowDownToLine, Loader2, Check, X } from "lucide-react";

export default function AdminDepositPage() {
  const { profile } = useAuth();
  const [userId, setUserId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("paydunya");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDeposit = async () => {
    if (!amount || !userId) return;
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/admin/withdrawals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, amount: Number(amount), status: "deposit", method }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setSuccess(`Dépôt de ${formatCurrency(Number(amount))} effectué avec succès`);
      setAmount("");
      setUserId("");
    } catch (err: any) {
      setError(err.message || "Erreur lors du dépôt");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout title="Dépôt">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulaire de dépôt */}
        <Card className="lg:col-span-2">
          <h3 className="text-lg font-semibold text-white mb-4">Effectuer un dépôt manuel</h3>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
              <X className="w-4 h-4" /> {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm flex items-center gap-2">
              <Check className="w-4 h-4" /> {success}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>ID Utilisateur</Label>
              <Input
                placeholder="UUID de l'utilisateur"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              />
              <p className="text-xs text-gray-500">Entrez l'UUID de l'utilisateur qui recevra le dépôt</p>
            </div>

            <div className="space-y-2">
              <Label>Montant (FCFA)</Label>
              <Input
                type="number"
                placeholder="50000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Méthode</Label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white"
              >
                <option value="paydunya">PayDunya</option>
                <option value="orange_money">Orange Money</option>
                <option value="mtn_money">MTN Mobile Money</option>
                <option value="wave">Wave</option>
                <option value="bank_transfer">Virement bancaire</option>
              </select>
            </div>

            <Button
              className="w-full"
              onClick={handleDeposit}
              disabled={isSubmitting || !amount || !userId}
              size="lg"
            >
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Traitement...</>
              ) : (
                <><ArrowDownToLine className="mr-2 w-4 h-4" /> Créditer le compte</>
              )}
            </Button>
          </div>
        </Card>

        {/* Info solde admin */}
        <Card>
          <div className="text-center">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 inline-flex mb-4">
              <Wallet className="w-8 h-8 text-green-400" />
            </div>
            <p className="text-sm text-gray-400 mb-1">Votre solde</p>
            <p className="text-3xl font-bold text-white">{formatCurrency(profile?.total_commission || 0)}</p>
            <p className="text-xs text-gray-500 mt-4">
              Utilisez cette page pour créditer manuellement le compte d'un utilisateur.
            </p>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}