"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, getInitials } from "@/lib/utils";
import { Trophy, Search, RefreshCw } from "lucide-react";

interface LeaderboardEntry {
  id: string;
  user_id: string;
  period: string;
  total_commission: number;
  total_referrals: number;
  rank: number;
  user?: { id: string; full_name: string; avatar_url?: string; email: string };
}

export default function AdminLeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"weekly" | "monthly" | "all_time">("all_time");
  const [search, setSearch] = useState("");

  const supabase = createClient();

  const fetchLeaderboard = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("leaderboard")
      .select("*, user:profiles(id, full_name, avatar_url, email)")
      .eq("period", period)
      .order("rank")
      .limit(50);
    if (!error && data) setEntries(data);
    setLoading(false);
  };

  useEffect(() => { fetchLeaderboard(); }, [period]);

  const filtered = entries.filter(e =>
    !search || e.user?.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  const periods = [
    { value: "weekly" as const, label: "Hebdomadaire" },
    { value: "monthly" as const, label: "Mensuel" },
    { value: "all_time" as const, label: "Global" },
  ];

  const getRankBadge = (rank: number) => {
    if (rank === 1) return "bg-yellow-500/20 text-yellow-400";
    if (rank === 2) return "bg-gray-400/20 text-gray-300";
    if (rank === 3) return "bg-amber-700/20 text-amber-600";
    return "bg-white/5 text-gray-400";
  };

  return (
    <AdminLayout title="Classement">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <p className="text-gray-400">Classement des meilleurs ambassadeurs</p>
        <div className="flex items-center gap-2">
          {periods.map((p) => (
            <Button
              key={p.value}
              size="sm"
              variant={period === p.value ? "default" : "secondary"}
              onClick={() => setPeriod(p.value)}
            >
              {p.label}
            </Button>
          ))}
          <Button size="sm" variant="ghost" onClick={fetchLeaderboard}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Card className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            className="pl-10"
            placeholder="Rechercher un ambassadeur..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </Card>

      <Card>
        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4,5].map(i => <div key={i} className="h-14 animate-pulse bg-white/5 rounded-xl" />)}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((entry, index) => (
              <div key={entry.id} className={`flex items-center justify-between p-3 rounded-xl ${
                index < 3 ? "bg-gradient-to-r from-yellow-500/5 to-transparent" : "bg-white/5"
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${getRankBadge(entry.rank)}`}>
                    {entry.rank <= 3 ? <Trophy className="w-4 h-4" /> : `#${entry.rank}`}
                  </div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                    {entry.user ? getInitials(entry.user.full_name) : "?"}
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium">{entry.user?.full_name || "Utilisateur"}</p>
                    <p className="text-xs text-gray-500">{entry.user?.email || ""}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-400">{formatCurrency(entry.total_commission)}</p>
                    <p className="text-xs text-gray-500">{entry.total_referrals} filleuls</p>
                  </div>
                  <Badge variant={entry.rank <= 3 ? "premium" : "secondary"}>
                    {entry.period === "weekly" ? "7j" : entry.period === "monthly" ? "30j" : "Tout"}
                  </Badge>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="text-center text-gray-500 py-8">Aucune entrée dans le classement</p>
            )}
          </div>
        )}
      </Card>
    </AdminLayout>
  );
}