"use client";

import { useEffect, useState, useCallback } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAllWithdrawals } from "@/lib/supabase/queries";
import { formatCurrency, formatDate, getStatusLabel } from "@/lib/utils";
import { Check, X, ArrowUpFromLine } from "lucide-react";
import type { WithdrawalRequest } from "@/types";

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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

  const pending = withdrawals.filter((w) => w.status === "pending");

  return (
    <AdminLayout title="Retraits">
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

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
                      <Check className="w-4 h-4 mr-1" /> Payer
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
    </AdminLayout>
  );
}