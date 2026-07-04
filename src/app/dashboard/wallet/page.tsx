"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useWallet } from "@/hooks/useWallet";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Wallet, ArrowUpFromLine, Plus, CreditCard } from "lucide-react";

export default function WalletPage() {
  const { wallet, transactions, createWithdrawal, loading } = useWallet();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("orange_money");
  const [accountInfo, setAccountInfo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleWithdrawal = async () => {
    if (!amount || !accountInfo) return;
    setIsSubmitting(true);
    await createWithdrawal(Number(amount), method, accountInfo);
    setAmount("");
    setAccountInfo("");
    setIsSubmitting(false);
  };

  return (
    <DashboardLayout title="Portefeuille">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Balance */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm text-gray-400">Solde disponible</p>
              <p className="text-4xl font-bold text-white mt-1">
                {formatCurrency(wallet?.balance || 0)}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20">
              <Wallet className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-xl bg-white/5">
              <p className="text-xs text-gray-400">Total gagné</p>
              <p className="text-lg font-bold text-green-400">{formatCurrency(wallet?.total_earned || 0)}</p>
            </div>
            <div className="p-3 rounded-xl bg-white/5">
              <p className="text-xs text-gray-400">Total retiré</p>
              <p className="text-lg font-bold text-yellow-400">{formatCurrency(wallet?.total_withdrawn || 0)}</p>
            </div>
          </div>
        </Card>

        {/* Withdrawal Form */}
        <Card>
          <h3 className="text-lg font-semibold text-white mb-4">Effectuer un retrait</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Montant</Label>
              <Input
                type="number"
                placeholder="5000"
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
                <option value="orange_money">Orange Money</option>
                <option value="mtn_money">MTN Mobile Money</option>
                <option value="wave">Wave</option>
                <option value="paydunya">PayDunya</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Numéro de compte</Label>
              <Input
                placeholder="+226 XX XX XX XX"
                value={accountInfo}
                onChange={(e) => setAccountInfo(e.target.value)}
              />
            </div>
            <Button
              className="w-full"
              onClick={handleWithdrawal}
              disabled={isSubmitting || !amount || !accountInfo}
            >
              {isSubmitting ? "Traitement..." : "Retirer"}
              <ArrowUpFromLine className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </Card>
      </div>

      {/* Transactions */}
      <Card className="mt-6">
        <h3 className="text-lg font-semibold text-white mb-4">Historique des transactions</h3>
        {transactions.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">Aucune transaction</p>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                <div>
                  <p className="text-sm text-white">
                    {tx.type === "credit" ? "+" : "-"}{formatCurrency(tx.amount)}
                  </p>
                  <p className="text-xs text-gray-500">{tx.description}</p>
                </div>
                <div className="text-right">
                  <Badge variant={tx.type === "credit" ? "success" : "warning"}>
                    {tx.type === "credit" ? "Crédit" : "Débit"}
                  </Badge>
                  <p className="text-xs text-gray-600 mt-1">{formatDate(tx.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </DashboardLayout>
  );
}