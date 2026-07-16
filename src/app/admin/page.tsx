"use client";

import { useEffect, useState, useCallback } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAdminStats } from "@/lib/supabase/queries";
import { formatCurrency, formatDate } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Upload, ArrowUpFromLine, Headphones, Coins, TrendingUp, Activity,
  RotateCcw, History, Trash2, RefreshCw, ChevronDown, ChevronUp, AlertTriangle,
  X, Check, DollarSign, ArrowDownToLine, BarChart3
} from "lucide-react";
import { CommissionsChart, UsersChart, StatsPieChart } from "@/components/charts/AdminCharts";
import TrafficChart from "@/components/charts/TrafficChart";

interface ResetLog {
  id: string;
  counter_type: string;
  previous_value: number;
  new_value: number;
  reset_by: string;
  created_at: string;
}

const COUNTERS = [
  { key: "total_commissions", label: "Commissions", icon: Coins, color: "from-green-500/20 to-emerald-500/20 text-green-400" },
  { key: "total_withdrawals", label: "Retraits", icon: ArrowUpFromLine, color: "from-orange-500/20 to-red-500/20 text-orange-400" },
  { key: "total_deposits", label: "Dépôts", icon: ArrowDownToLine, color: "from-blue-500/20 to-cyan-500/20 text-blue-400" },
  { key: "total_revenue", label: "Revenus", icon: DollarSign, color: "from-purple-500/20 to-pink-500/20 text-purple-400" },
];

export default function AdminDashboardPage() {
  const supabase = createClient();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showTraffic, setShowTraffic] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedCounter, setSelectedCounter] = useState<string | "all">("all");
  const [resetLogs, setResetLogs] = useState<ResetLog[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"reset" | "restore" | "clear" | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAdminStats();
      setStats(data);
    } catch (err) {
      console.error("Erreur chargement stats:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadResetLogs = useCallback(async () => {
    try {
      const { data } = await supabase
        .from("admin_counter_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (data) setResetLogs(data as ResetLog[]);
    } catch (err) {
      console.error("Erreur chargement logs:", err);
    }
  }, [supabase]);

  useEffect(() => { loadStats(); loadResetLogs(); }, [loadStats, loadResetLogs]);

  const handleReset = async () => {
    if (!confirmTarget) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/reset-counters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ counter: confirmTarget }),
      });
      if (!res.ok) throw new Error("Erreur lors du reset");
      await loadStats();
      await loadResetLogs();
      setShowConfirmModal(false);
      setShowResetModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestore = async (logId: string) => {
    setActionLoading(true);
    try {
      const log = resetLogs.find(l => l.id === logId);
      if (!log) return;
      const res = await fetch("/api/admin/reset-counters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ counter: log.counter_type, restore: true, log_id: logId }),
      });
      if (!res.ok) throw new Error("Erreur lors de la restauration");
      await loadStats();
      await loadResetLogs();
      setShowConfirmModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleClearHistory = async () => {
    setActionLoading(true);
    try {
      await supabase.from("admin_counter_logs").delete().neq("id", "0");
      setResetLogs([]);
      setShowConfirmModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const openConfirm = (action: "reset" | "restore" | "clear", target: string | null = null) => {
    setConfirmAction(action);
    setConfirmTarget(target);
    setShowConfirmModal(true);
  };

  const confirmMessages: Record<string, { title: string; message: string }> = {
    reset: { title: "Confirmer la remise à zéro", message: `Êtes-vous sûr de vouloir remettre à zéro le compteur sélectionné ? Cette action est réversible via l'historique.` },
    restore: { title: "Restaurer le compteur", message: `Voulez-vous restaurer la valeur précédente de ce compteur ?` },
    clear: { title: "Vider l'historique", message: `Êtes-vous sûr de vouloir supprimer tout l'historique des remises à zéro ? Cette action est irréversible.` },
  };

  const statCards = [
    { title: "Utilisateurs", value: stats?.total_users || 0, icon: Users, color: "from-blue-500/20 to-purple-500/20 text-blue-400", noReset: true },
    { title: "Validations en attente", value: stats?.pending_uploads || 0, icon: Upload, color: "from-yellow-500/20 to-amber-500/20 text-yellow-400", noReset: true },
    { title: "Retraits en attente", value: stats?.pending_withdrawals || 0, icon: ArrowUpFromLine, color: "from-orange-500/20 to-red-500/20 text-orange-400", noReset: true },
    { title: "Tickets ouverts", value: stats?.open_tickets || 0, icon: Headphones, color: "from-cyan-500/20 to-blue-500/20 text-cyan-400", noReset: true },
  ];

  return (
    <AdminLayout title="Dashboard">
      {/* Stats principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {loading
          ? [1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <div className="h-20 animate-pulse bg-white/5 rounded-xl" />
              </Card>
            ))
          : statCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.title}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-400">{stat.title}</p>
                      <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                </Card>
              );
            })}
      </div>

      {/* Bouton Trafic */}
      <button
        onClick={() => setShowTraffic(!showTraffic)}
        className="w-full mb-6 p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 hover:from-blue-500/20 hover:to-purple-500/20 transition-all"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <BarChart3 className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-white">Trafic du site</p>
              <p className="text-xs text-gray-400">Voir les statistiques détaillées par jour, heure, semaine, mois, année</p>
            </div>
          </div>
          <ChevronDown className={`w-5 h-5 text-blue-400 transition-transform ${showTraffic ? "rotate-180" : ""}`} />
        </div>
      </button>

      {/* Graphiques trafic */}
      <AnimatePresence>
        {showTraffic && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6"
          >
            <Card className="p-6">
              <TrafficChart title="Trafic en temps réel" color1="#10b981" color2="#3b82f6" />
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compteurs monétaires avec reset */}
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Compteurs financiers</h3>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => { setSelectedCounter("all"); setShowResetModal(true); }}>
              <RotateCcw className="w-4 h-4 mr-1" /> Remettre à zéro
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowHistory(!showHistory)}>
              <History className="w-4 h-4 mr-1" />
              {showHistory ? "Masquer" : "Historique"}
              {showHistory ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {COUNTERS.map((counter) => {
            const Icon = counter.icon;
            const value = stats?.[counter.key] || 0;
            return (
              <Card key={counter.key} variant="interactive" onClick={() => { setSelectedCounter(counter.key); setShowResetModal(true); }}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-gray-400">{counter.label}</p>
                    <p className="text-xl font-bold text-white mt-1">
                      {typeof value === "number" ? formatCurrency(value) : value}
                    </p>
                  </div>
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${counter.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </Card>

      {/* Historique des remises à zéro */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6"
          >
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Historique des remises à zéro</h3>
                {resetLogs.length > 0 && (
                  <Button size="sm" variant="destructive" onClick={() => openConfirm("clear")}>
                    <Trash2 className="w-4 h-4 mr-1" /> Vider l'historique
                  </Button>
                )}
              </div>
              {resetLogs.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-6">Aucun historique</p>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {resetLogs.map((log) => {
                    const counterInfo = COUNTERS.find(c => c.key === log.counter_type);
                    const Icon = counterInfo?.icon || RotateCcw;
                    return (
                      <div key={log.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-amber-500/20">
                            <Icon className="w-4 h-4 text-amber-400" />
                          </div>
                          <div>
                            <p className="text-sm text-white font-medium">
                              {counterInfo?.label || log.counter_type}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatCurrency(log.previous_value)} → {formatCurrency(log.new_value)}
                            </p>
                            <p className="text-[10px] text-gray-600">{formatDate(log.created_at)}</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openConfirm("restore", log.id)}
                        >
                          <RefreshCw className="w-3 h-3 mr-1" /> Restaurer
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <CommissionsChart />
        <UsersChart />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <h3 className="text-lg font-semibold text-white mb-4">Aperçu rapide</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
              <span className="text-sm text-gray-400">Taux de conversion</span>
              <span className="text-sm font-medium text-green-400">~15%</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
              <span className="text-sm text-gray-400">Commission moyenne</span>
              <span className="text-sm font-medium text-white">{stats?.total_commissions ? formatCurrency(stats.total_commissions / (stats.total_users || 1)) : "0 FCFA"}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
              <span className="text-sm text-gray-400">Utilisateurs actifs</span>
              <span className="text-sm font-medium text-blue-400">{stats?.total_users || 0}</span>
            </div>
          </div>
        </Card>
        <StatsPieChart />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card>
          <h3 className="text-lg font-semibold text-white mb-4">Actions rapides</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { title: "Validations", href: "/admin/validations", icon: Upload },
              { title: "Retraits", href: "/admin/withdrawals", icon: ArrowUpFromLine },
              { title: "Tickets", href: "/admin/tickets", icon: Headphones },
              { title: "Paiements", href: "/admin/payments", icon: Coins },
            ].map((action) => {
              const Icon = action.icon;
              return (
                <a key={action.title} href={action.href}>
                  <Card variant="interactive" className="text-center p-4">
                    <Icon className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                    <p className="text-xs text-white">{action.title}</p>
                  </Card>
                </a>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Modal de sélection du compteur */}
      <AnimatePresence>
        {showResetModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowResetModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl bg-card border border-white/10 p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Remettre à zéro</h3>
                <button onClick={() => setShowResetModal(false)} className="text-gray-500 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-gray-400 mb-4">Sélectionnez le compteur à remettre à zéro :</p>
              <div className="space-y-2">
                {COUNTERS.map((counter) => {
                  const Icon = counter.icon;
                  const value = stats?.[counter.key] || 0;
                  return (
                    <button
                      key={counter.key}
                      onClick={() => openConfirm("reset", counter.key)}
                      className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-gradient-to-br ${counter.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm text-white font-medium">{counter.label}</p>
                          <p className="text-xs text-gray-500">{formatCurrency(typeof value === "number" ? value : 0)}</p>
                        </div>
                      </div>
                      <RotateCcw className="w-4 h-4 text-gray-500" />
                    </button>
                  );
                })}
                <div className="border-t border-white/10 pt-2 mt-2">
                  <button
                    onClick={() => openConfirm("reset", "all")}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-red-500/20">
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                      </div>
                      <div>
                        <p className="text-sm text-red-400 font-medium">Tout remettre à zéro</p>
                        <p className="text-xs text-gray-500">Tous les compteurs financiers</p>
                      </div>
                    </div>
                    <RotateCcw className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de confirmation */}
      <AnimatePresence>
        {showConfirmModal && confirmAction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowConfirmModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl bg-card border border-white/10 p-6 shadow-2xl"
            >
              <div className="text-center mb-6">
                <div className={`w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center ${
                  confirmAction === "clear" ? "bg-red-500/20" : "bg-amber-500/20"
                }`}>
                  {confirmAction === "clear" ? (
                    <Trash2 className="w-7 h-7 text-red-400" />
                  ) : confirmAction === "restore" ? (
                    <RefreshCw className="w-7 h-7 text-blue-400" />
                  ) : (
                    <AlertTriangle className="w-7 h-7 text-amber-400" />
                  )}
                </div>
                <h3 className="text-lg font-bold text-white">
                  {confirmMessages[confirmAction]?.title || "Confirmation"}
                </h3>
                <p className="text-sm text-gray-400 mt-2">
                  {confirmMessages[confirmAction]?.message || "Confirmez-vous cette action ?"}
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowConfirmModal(false)}
                  disabled={actionLoading}
                >
                  Annuler
                </Button>
                <Button
                  variant={confirmAction === "clear" ? "destructive" : "premium"}
                  className="flex-1"
                  onClick={() => {
                    if (confirmAction === "reset") handleReset();
                    else if (confirmAction === "restore" && confirmTarget) handleRestore(confirmTarget);
                    else if (confirmAction === "clear") handleClearHistory();
                  }}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Traitement...</>
                  ) : confirmAction === "clear" ? "Vider" : confirmAction === "restore" ? "Restaurer" : "Confirmer"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}