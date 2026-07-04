"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAdminStats } from "@/lib/supabase/queries";
import { formatCurrency } from "@/lib/utils";
import { Users, Upload, ArrowUpFromLine, Headphones, Coins, TrendingUp, Activity } from "lucide-react";
import { CommissionsChart, UsersChart, StatsPieChart } from "@/components/charts/AdminCharts";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminStats().then((data) => {
      setStats(data);
      setLoading(false);
    });
  }, []);

  const statCards = [
    { title: "Utilisateurs", value: stats?.total_users || 0, icon: Users, color: "from-blue-500/20 to-purple-500/20 text-blue-400" },
    { title: "Validations en attente", value: stats?.pending_uploads || 0, icon: Upload, color: "from-yellow-500/20 to-amber-500/20 text-yellow-400" },
    { title: "Retraits en attente", value: stats?.pending_withdrawals || 0, icon: ArrowUpFromLine, color: "from-orange-500/20 to-red-500/20 text-orange-400" },
    { title: "Tickets ouverts", value: stats?.open_tickets || 0, icon: Headphones, color: "from-cyan-500/20 to-blue-500/20 text-cyan-400" },
    { title: "Commissions totales", value: formatCurrency(stats?.total_commissions || 0), icon: Coins, color: "from-green-500/20 to-emerald-500/20 text-green-400" },
  ];

  return (
    <AdminLayout title="Dashboard">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        {loading
          ? [1, 2, 3, 4, 5].map((i) => (
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
    </AdminLayout>
  );
}