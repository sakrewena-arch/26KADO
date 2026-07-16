"use client";

import { useEffect, useState, useCallback } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAllUsers } from "@/lib/supabase/queries";
import { formatCurrency, formatDate, getInitials } from "@/lib/utils";
import { Search, Users, Shield, ShieldAlert, ShieldCheck, Ban, Trash2, AlertTriangle, CheckSquare, Square, Trash } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { Profile } from "@/types";

export default function AdminUsersPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllUsers();
      setUsers(data || []);
    } catch (err) {
      setError("Erreur de chargement des utilisateurs");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setError("Utilisateur non authentifié."); return; }
    if (!profile) return;
    if (!["super_admin", "admin", "moderator"].includes(profile.role)) {
      setError("Accès refusé.");
      return;
    }
    loadUsers();
  }, [authLoading, user, profile, loadUsers]);

  const handleBan = async (userId: string, isActive: boolean) => {
    setActionLoading(userId);
    setError(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, action: isActive ? "ban" : "unban" }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur");
      }
      setSuccess(isActive ? "Utilisateur banni" : "Utilisateur réactivé");
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer définitivement cet utilisateur ?")) return;
    setActionLoading(userId);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users?id=${userId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur");
      }
      setSuccess("Utilisateur supprimé");
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = users.filter((u) => {
    const matchesSearch = u.full_name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
    setSelectAll(false);
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedIds(new Set());
      setSelectAll(false);
    } else {
      setSelectedIds(new Set(filtered.map(u => u.id)));
      setSelectAll(true);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Supprimer définitivement ${selectedIds.size} utilisateur(s) ? Cette action est irréversible.`)) return;
    setActionLoading("bulk");
    setError(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_ids: Array.from(selectedIds) }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur");
      }
      setSuccess(`${selectedIds.size} utilisateur(s) supprimé(s)`);
      setSelectedIds(new Set());
      setSelectAll(false);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkBan = async (ban: boolean) => {
    if (selectedIds.size === 0) return;
    if (!confirm(`${ban ? "Bannir" : "Réactiver"} ${selectedIds.size} utilisateur(s) ?`)) return;
    setActionLoading("bulk");
    setError(null);
    try {
      const results = await Promise.allSettled(
        Array.from(selectedIds).map(id =>
          fetch("/api/admin/users", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: id, action: ban ? "ban" : "unban" }),
          })
        )
      );
      const ok = results.filter(r => r.status === "fulfilled" && (r.value as Response).ok).length;
      setSuccess(`${ok}/${selectedIds.size} utilisateur(s) ${ban ? "bannis" : "réactivés"}`);
      setSelectedIds(new Set());
      setSelectAll(false);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setActionLoading(null);
    }
  };

  const roleIcons: Record<string, React.ReactNode> = {
    super_admin: <ShieldAlert className="w-4 h-4 text-red-400" />,
    admin: <ShieldCheck className="w-4 h-4 text-blue-400" />,
    moderator: <Shield className="w-4 h-4 text-yellow-400" />,
    user: <Users className="w-4 h-4 text-gray-400" />,
  };

  return (
    <AdminLayout title="Utilisateurs">
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input className="pl-10" placeholder="Rechercher un utilisateur..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          {["all", "user", "moderator", "admin", "super_admin"].map((role) => (
            <button key={role} onClick={() => setRoleFilter(role)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${roleFilter === role ? "bg-blue-500/20 text-blue-400" : "text-gray-400 hover:text-white hover:bg-white/5"}`}>
              {role === "all" ? "Tous" : role.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-400">
          ✅ {success}
        </div>
      )}

      {/* Barre d'actions groupées */}
      {selectedIds.size > 0 && (
        <div className="mb-4 flex items-center gap-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <span className="text-sm text-blue-400 font-medium">{selectedIds.size} sélectionné(s)</span>
          <div className="flex gap-2 ml-auto">
            <Button size="sm" variant="destructive" onClick={handleBulkDelete} disabled={actionLoading === "bulk"}>
              <Trash className="w-3 h-3 mr-1" /> Supprimer
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleBulkBan(true)} disabled={actionLoading === "bulk"}>
              <Ban className="w-3 h-3 mr-1" /> Bannir
            </Button>
            <Button size="sm" variant="default" onClick={() => handleBulkBan(false)} disabled={actionLoading === "bulk"}>
              <CheckSquare className="w-3 h-3 mr-1" /> Réactiver
            </Button>
          </div>
        </div>
      )}

      <Card>
        {loading ? (
          <div className="space-y-3">{[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />)}</div>
        ) : (
          <div className="space-y-2">
            {/* En-tête avec checkbox "Tout sélectionner" */}
            <div className="flex items-center gap-3 px-4 py-2 text-xs text-gray-500 border-b border-white/5">
              <button onClick={toggleSelectAll} className="flex items-center gap-2 hover:text-white transition-colors">
                {selectAll ? <CheckSquare className="w-4 h-4 text-blue-400" /> : <Square className="w-4 h-4" />}
                <span>Tout sélectionner ({filtered.length})</span>
              </button>
            </div>
            {filtered.map((u) => (
              <div key={u.id} className={`flex items-center justify-between p-4 rounded-xl transition-colors ${selectedIds.has(u.id) ? "bg-blue-500/10 border border-blue-500/20" : "bg-white/5 hover:bg-white/10"}`}>
                <div className="flex items-center gap-3">
                  <button onClick={() => toggleSelect(u.id)} className="flex-shrink-0">
                    {selectedIds.has(u.id) ? <CheckSquare className="w-5 h-5 text-blue-400" /> : <Square className="w-5 h-5 text-gray-500 hover:text-white" />}
                  </button>
                  <Avatar size="sm">
                    {u.avatar_url && <AvatarImage src={u.avatar_url} />}
                    <AvatarFallback>{getInitials(u.full_name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-medium ${u.is_active ? "text-white" : "text-gray-500 line-through"}`}>{u.full_name}</p>
                      {roleIcons[u.role]}
                    </div>
                    <p className="text-xs text-gray-500">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-2 text-[10px] text-gray-400">
                    <span className="hidden sm:inline">Com:</span><span className="sm:hidden">C:</span>{formatCurrency(u.total_commission)}
                    <span className="hidden sm:inline">• Filleuls:</span><span className="sm:hidden">• F:</span>{u.total_referrals}
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge variant={u.is_active ? "success" : "danger"} className="text-[9px] px-1.5 py-0.5 whitespace-nowrap">
                      {u.is_active ? "Actif" : "Banni"}
                    </Badge>
                    {u.role !== "super_admin" && (
                      <>
                        {u.is_active ? (
                          <button onClick={() => handleBan(u.id, u.is_active)} disabled={actionLoading === u.id}
                            className="p-1 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors" title="Bannir">
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button onClick={() => handleBan(u.id, u.is_active)} disabled={actionLoading === u.id}
                            className="p-1 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors" title="Réactiver">
                            <CheckSquare className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {profile?.role === "super_admin" && (
                          <button onClick={() => handleDelete(u.id)} disabled={actionLoading === u.id}
                            className="p-1 rounded-lg bg-gray-500/20 text-gray-400 hover:bg-red-500/30 hover:text-red-400 transition-colors" title="Supprimer">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="text-center text-gray-500 py-8">Aucun utilisateur trouvé</p>
            )}
          </div>
        )}
      </Card>
    </AdminLayout>
  );
}