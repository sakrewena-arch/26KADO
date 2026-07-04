"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getLeaderboard } from "@/lib/supabase/queries";
import { formatCurrency, getInitials } from "@/lib/utils";
import { Trophy, Medal, Crown } from "lucide-react";
import type { LeaderboardEntry } from "@/types";

const periodLabels = { weekly: "Hebdomadaire", monthly: "Mensuel", all_time: "Global" };

const rankStyles = [
  { bg: "from-yellow-400/20 to-amber-500/20", border: "border-yellow-500/30", icon: <Crown className="w-5 h-5 text-yellow-400" /> },
  { bg: "from-gray-300/20 to-gray-400/20", border: "border-gray-400/30", icon: <Medal className="w-5 h-5 text-gray-300" /> },
  { bg: "from-amber-600/20 to-amber-700/20", border: "border-amber-600/30", icon: <Medal className="w-5 h-5 text-amber-600" /> },
];

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<"weekly" | "monthly" | "all_time">("monthly");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getLeaderboard(period)
      .then((data) => {
        setEntries(data || []);
        setLoading(false);
      })
      .catch((err: any) => {
        console.warn("Leaderboard error:", err);
        setError("Base de données non disponible. Exécutez la migration SQL dans Supabase.");
        setEntries([]);
        setLoading(false);
      });
  }, [period]);

  return (
    <main className="min-h-screen">
      <Header />
      <section className="relative pt-32 pb-16">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <Badge variant="premium" className="mb-4">Classement</Badge>
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">Top Ambassadeurs</h1>
            <p className="text-gray-400">Les meilleurs ambassadeurs 26KADO du moment</p>
          </motion.div>

          {error && (
            <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-sm text-yellow-400 text-center mb-8">
              {error}
            </div>
          )}

          <div className="flex justify-center gap-2 mb-8">
            {(Object.entries(periodLabels) as [string, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setPeriod(key as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  period === key ? "bg-blue-500/20 text-blue-400" : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {!loading && entries.length >= 3 && (
            <div className="flex items-end justify-center gap-4 mb-12">
              {[1, 0, 2].map((idx) => {
                const entry = entries[idx];
                if (!entry) return null;
                const style = rankStyles[idx];
                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.2 }}
                    className={`flex flex-col items-center ${idx === 0 ? "order-2" : idx === 1 ? "order-1" : "order-3"}`}
                  >
                    <div className={`p-4 rounded-2xl bg-gradient-to-br ${style.bg} border ${style.border}`}>
                      <Avatar size={idx === 0 ? "xl" : "lg"}>
                        {entry.user?.avatar_url && <AvatarImage src={entry.user.avatar_url} />}
                        <AvatarFallback>{entry.user?.full_name ? getInitials(entry.user.full_name) : "?"}</AvatarFallback>
                      </Avatar>
                    </div>
                    {style.icon}
                    <p className="text-sm font-medium text-white mt-1">{entry.user?.full_name || "Anonyme"}</p>
                    <p className="text-xs text-yellow-400">{formatCurrency(entry.total_commission)}</p>
                  </motion.div>
                );
              })}
            </div>
          )}

          <Card>
            {loading ? (
              <div className="space-y-2">{[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />)}</div>
            ) : entries.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500">Aucun classement pour cette période</p>
              </div>
            ) : (
              <div className="space-y-2">
                {entries.map((entry, i) => (
                  <div key={entry.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        i < 3 ? "bg-gradient-to-br " + rankStyles[i].bg + " text-white" : "text-gray-500"
                      }`}>
                        {entry.rank}
                      </span>
                      <Avatar size="sm">
                        {entry.user?.avatar_url && <AvatarImage src={entry.user.avatar_url} />}
                        <AvatarFallback>{entry.user?.full_name ? getInitials(entry.user.full_name) : "?"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-white">{entry.user?.full_name || "Anonyme"}</p>
                        <p className="text-xs text-gray-500">{entry.total_referrals} filleuls</p>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-green-400">{formatCurrency(entry.total_commission)}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </section>
      <Footer />
    </main>
  );
}