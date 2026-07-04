"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { getCommissions } from "@/lib/supabase/queries";
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from "@/lib/utils";
import type { Commission } from "@/types";
import { Coins, Filter } from "lucide-react";

export default function CommissionsPage() {
  const { user } = useAuth();
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      getCommissions(user.id).then((data) => {
        setCommissions(data);
        setLoading(false);
      });
    }
  }, [user]);

  const filtered = filter === "all" ? commissions : commissions.filter((c) => c.status === filter);

  const totalCommission = commissions
    .filter((c) => c.status === "validated" || c.status === "paid")
    .reduce((sum, c) => sum + Number(c.amount), 0);

  return (
    <DashboardLayout title="Commissions">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <p className="text-sm text-gray-400">Total gagné</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{formatCurrency(totalCommission)}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-400">En attente</p>
          <p className="text-2xl font-bold text-yellow-400 mt-1">
            {formatCurrency(commissions.filter((c) => c.status === "pending").reduce((sum, c) => sum + Number(c.amount), 0))}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-gray-400">Validées</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">
            {formatCurrency(commissions.filter((c) => c.status === "validated").reduce((sum, c) => sum + Number(c.amount), 0))}
          </p>
        </Card>
      </div>

      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-gray-400" />
          {["all", "pending", "validated", "paid", "rejected"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === s ? "bg-blue-500/20 text-blue-400" : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {getStatusLabel(s)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <Coins className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500">Aucune commission trouvée</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((commission) => (
              <div key={commission.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                    <Coins className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{formatCurrency(commission.amount)}</p>
                    <p className="text-xs text-gray-500">{commission.bookmaker?.name || "Bookmaker"} • {formatDate(commission.created_at)}</p>
                  </div>
                </div>
                <Badge variant={commission.status === "validated" ? "success" : commission.status === "paid" ? "info" : commission.status === "rejected" ? "danger" : "warning"}>
                  {getStatusLabel(commission.status)}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </DashboardLayout>
  );
}