"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import { Search, ScrollText } from "lucide-react";

interface AdminLog {
  id: string;
  admin_id: string;
  action: string;
  target_type: string;
  target_id: string;
  details: any;
  created_at: string;
  admin?: { id: string; full_name: string; email: string };
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  const supabase = createClient();

  const fetchLogs = async () => {
    setLoading(true);
    let query = supabase
      .from("admin_logs")
      .select("*, admin:profiles(id, full_name, email)")
      .order("created_at", { ascending: false })
      .limit(100);

    if (actionFilter) {
      query = query.eq("action", actionFilter);
    }

    const { data, error } = await query;
    if (!error && data) setLogs(data);
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, [actionFilter]);

  const filtered = logs.filter(l =>
    !search ||
    l.admin?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    l.action?.toLowerCase().includes(search.toLowerCase()) ||
    l.target_type?.toLowerCase().includes(search.toLowerCase())
  );

  const actions = [...new Set(logs.map(l => l.action))];

  const actionColors: Record<string, string> = {
    create: "bg-green-500/10 text-green-400",
    update: "bg-blue-500/10 text-blue-400",
    delete: "bg-red-500/10 text-red-400",
    validate: "bg-emerald-500/10 text-emerald-400",
    reject: "bg-orange-500/10 text-orange-400",
    pay: "bg-purple-500/10 text-purple-400",
    login: "bg-gray-500/10 text-gray-400",
  };

  return (
    <AdminLayout title="Logs d'activité">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <p className="text-gray-400">Historique des actions des administrateurs</p>
        <div className="flex items-center gap-2">
          <select
            className="h-10 rounded-xl bg-white/5 border border-white/10 text-white px-3 text-sm"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
          >
            <option value="">Toutes les actions</option>
            {actions.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      <Card className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input className="pl-10" placeholder="Rechercher dans les logs..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </Card>

      <Card>
        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4,5].map(i => <div key={i} className="h-14 animate-pulse bg-white/5 rounded-xl" />)}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((log) => (
              <div key={log.id} className="flex items-start justify-between p-3 rounded-xl bg-white/5">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center mt-0.5">
                    <ScrollText className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white font-medium">{log.admin?.full_name || "Admin"}</span>
                      <Badge variant="secondary" className={`text-xs ${actionColors[log.action] || "bg-white/5 text-gray-400"}`}>
                        {log.action}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {log.target_type} #{log.target_id.slice(0, 8)}
                      {log.details && ` - ${(() => { try { return JSON.stringify(log.details).slice(0, 100); } catch { return String(log.details).slice(0, 100); } })()}`}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">{formatDate(log.created_at)}</p>
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="text-center text-gray-500 py-8">Aucun log trouvé</p>
            )}
          </div>
        )}
      </Card>
    </AdminLayout>
  );
}