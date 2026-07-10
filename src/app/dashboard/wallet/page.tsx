"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWallet } from "@/hooks/useWallet";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Wallet, Coins, ArrowUpFromLine, Plus, CreditCard, Gift, Users, Award } from "lucide-react";

const sourceIcons: Record<string, any> = {
  commission: Coins,
  referral: Users,
  withdrawal: ArrowUpFromLine,
  payment: CreditCard,
};

const sourceLabels: Record<string, string> = {
  commission: "Commission",
  referral: "Parrainage",
  withdrawal: "Retrait",
  payment: "Paiement",
};

const sourceColors: Record<string, string> = {
  commission: "text-green-400",
  referral: "text-blue-400",
  withdrawal: "text-yellow-400",
  payment: "text-orange-400",
};

export default function WalletPage() {
  const { wallet, transactions, loading } = useWallet();
  const { profile } = useAuth();
  const balance = wallet?.balance ?? profile?.total_commission ?? 0;

  return (
    <DashboardLayout title="Portefeuille">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Solde */}
        <Card>
          <div className="text-center">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 inline-flex mb-4">
              <Wallet className="w-8 h-8 text-blue-400" />
            </div>
            <p className="text-sm text-gray-400">Solde disponible</p>
            <p className="text-3xl font-bold text-white mt-1">
              {formatCurrency(balance)}
            </p>
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

        {/* Résumé des transactions */}
        <Card className="lg:col-span-2">
          <h3 className="text-lg font-semibold text-white mb-4">Résumé des transactions</h3>
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-20 rounded-xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(sourceLabels).map(([key, label]) => {
                const Icon = sourceIcons[key] || Wallet;
                const total = transactions
                  .filter((tx) => tx.source === key)
                  .reduce((sum, tx) => sum + Number(tx.amount), 0);
                const count = transactions.filter((tx) => tx.source === key).length;
                const isCredit = key !== "withdrawal" && key !== "payment";

                return (
                  <div key={key} className="p-3 rounded-xl bg-white/5 text-center">
                    <Icon className={`w-5 h-5 mx-auto mb-1 ${sourceColors[key]}`} />
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className={`text-sm font-bold ${isCredit ? "text-green-400" : "text-yellow-400"}`}>
                      {isCredit ? "+" : "-"}{formatCurrency(total)}
                    </p>
                    <p className="text-[10px] text-gray-600">{count} opération(s)</p>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Historique complet des transactions */}
      <Card className="mt-6">
        <h3 className="text-lg font-semibold text-white mb-4">Historique complet</h3>
        {loading ? (
          <div className="space-y-2">{[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-14 rounded-xl bg-white/5 animate-pulse" />)}</div>
        ) : transactions.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">Aucune transaction</p>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => {
              const Icon = sourceIcons[tx.source] || Wallet;
              const isCredit = tx.type === "credit";
              return (
                <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center ${sourceColors[tx.source]}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm text-white font-medium">
                        {sourceLabels[tx.source] || tx.source}
                      </p>
                      <p className="text-xs text-gray-500">{tx.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${isCredit ? "text-green-400" : "text-red-400"}`}>
                      {isCredit ? "+" : "-"}{formatCurrency(tx.amount)}
                    </p>
                    <p className="text-[10px] text-gray-600">{formatDate(tx.created_at)}</p>
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