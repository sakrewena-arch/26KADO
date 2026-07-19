"use client";

import { useEffect, useState, useCallback } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAllCommissions } from "@/lib/supabase/queries";
import { formatCurrency, formatDate, getStatusLabel } from "@/lib/utils";
import { Coins, Filter } from "lucide-react";
import type { Commission } from "@/types";
import { PeriodFilter, filterByPeriod, type Period } from "@/components/ui/period-filter";

export default function AdminCommissionsPage() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [period, setPeriod] = useState<Period>("month");

  const loadCommissions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllCommissions();
      setCommissions(data);
    } catch (err) {
      setError("Erreur lors du chargement des commissions");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCommissions();
  }, [loadCommissions]);

  const statusFiltered = filter === "all" ? commissions : commissions.filter((c) => c.status === filter);
  const filtered = filterByPeriod(statusFiltered, period);
  const total = commissions.reduce((sum, c) => sum + Number(c.amount), 0);

  return (
    <AdminLayout title="Commissions">
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <Card><p className="text-sm text-gray-400">Total</p><p className="text-2xl font-bold text-white mt-1">{formatCurrency(total)}</p></Card>
        <Card><p className="text-sm text-gray-400">Payées</p><p className="text-2xl font-bold text-green-400 mt-1">{formatCurrency(commissions.filter(c => c.status === "paid").reduce((s, c) => s + Number(c.amount), 0))}</p></Card>
        <Card><p className="text-sm text-gray-400">En attente</p><p className="text-2xl font-bold text-yellow-400 mt-1">{formatCurrency(commissions.filter(c => c.status === "pending").reduce((s, c) => s + Number(c.amount), 0))}</p></Card>
        <Card><p className="text-sm text-gray-400">Rejetées</p><p className="text-2xl font-bold text-red-400 mt-1">{formatCurrency(commissions.filter(c => c.status === "rejected").reduce((s, c) => s + Number(c.amount), 0))}</p></Card>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            {["all", "paid", "pending", "rejected"].map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === s ? "bg-blue-500/20 text-blue-400" : "text-gray-400 hover:text-white hover:bg-white/5"}`}>
              {getStatusLabel(s)}
            </button>
          ))}
          </div>
          <PeriodFilter value={period} onChange={setPeriod} showLabel={false} />
        </div>
        {loading ? (
          <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />)}</div>
        ) : (
          <div className="space-y-2">
            {filtered.map((c) => (
              <div key={c.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                <div className="flex items-center gap-3">
                  <Coins className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-sm font-medium text-white">{formatCurrency(c.amount)}</p>
                    <p className="text-xs text-gray-500">{c.user?.full_name || "N/A"} • {c.bookmaker?.name} • {formatDate(c.created_at)}</p>
                  </div>
                </div>
                <Badge variant={c.status === "paid" ? "success" : c.status === "rejected" ? "danger" : "warning"}>
                  {getStatusLabel(c.status)}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </AdminLayout>
  );
}