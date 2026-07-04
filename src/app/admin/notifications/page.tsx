"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import { Plus, Bell, Send } from "lucide-react";

interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [users, setUsers] = useState<{ id: string; full_name: string; email: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({
    title: "",
    message: "",
    type: "announcement",
    user_id: "",
    sendToAll: true,
  });

  const supabase = createClient();

  const fetchData = async () => {
    const [notifRes, usersRes] = await Promise.all([
      supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("profiles").select("id, full_name, email").order("full_name"),
    ]);
    if (!notifRes.error && notifRes.data) setNotifications(notifRes.data);
    if (!usersRes.error && usersRes.data) setUsers(usersRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);

    const notifData = {
      title: form.title,
      message: form.message,
      type: form.type,
      is_read: false,
    };

    if (form.sendToAll) {
      // Send to all users - single bulk insert
      const bulkData = users.map(u => ({ ...notifData, user_id: u.id }));
      const { error } = await supabase.from("notifications").insert(bulkData);
      if (error) throw error;
    } else if (form.user_id) {
      await supabase.from("notifications").insert({ ...notifData, user_id: form.user_id });
    }

    setSending(false);
    setShowForm(false);
    setForm({ title: "", message: "", type: "announcement", user_id: "", sendToAll: true });
    fetchData();
  };

  const typeColors: Record<string, string> = {
    commission: "bg-green-500/10 text-green-400",
    validation: "bg-blue-500/10 text-blue-400",
    payment: "bg-purple-500/10 text-purple-400",
    referral: "bg-yellow-500/10 text-yellow-400",
    badge: "bg-amber-500/10 text-amber-400",
    level: "bg-cyan-500/10 text-cyan-400",
    announcement: "bg-pink-500/10 text-pink-400",
    withdrawal: "bg-orange-500/10 text-orange-400",
    ticket: "bg-red-500/10 text-red-400",
  };

  return (
    <AdminLayout title="Notifications">
      <div className="flex items-center justify-between mb-6">
        <p className="text-gray-400">GÃ©rez les notifications envoyÃ©es aux utilisateurs</p>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" /> Envoyer une notification
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Titre</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <select className="w-full h-10 rounded-xl bg-white/5 border border-white/10 text-white px-3"
                  value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option value="announcement">Annonce</option>
                  <option value="commission">Commission</option>
                  <option value="validation">Validation</option>
                  <option value="payment">Paiement</option>
                  <option value="referral">Parrainage</option>
                  <option value="badge">Badge</option>
                  <option value="level">Niveau</option>
                  <option value="withdrawal">Retrait</option>
                  <option value="ticket">Ticket</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <textarea className="w-full min-h-[100px] rounded-xl bg-white/5 border border-white/10 text-white px-3 py-2"
                value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input type="checkbox" checked={form.sendToAll} onChange={(e) => setForm({ ...form, sendToAll: e.target.checked })} />
                Envoyer Ã  tous les utilisateurs
              </label>
            </div>
            {!form.sendToAll && (
              <div className="space-y-2">
                <Label>Utilisateur</Label>
                <select className="w-full h-10 rounded-xl bg-white/5 border border-white/10 text-white px-3"
                  value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })} required>
                  <option value="">SÃ©lectionner un utilisateur</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>)}
                </select>
              </div>
            )}
            <div className="flex gap-2">
              <Button type="submit" disabled={sending}>
                <Send className="w-4 h-4 mr-2" />
                {sending ? "Envoi en cours..." : `Envoyer${form.sendToAll ? ` Ã  ${users.length} utilisateurs` : ""}`}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Annuler</Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4,5].map(i => <div key={i} className="h-16 animate-pulse bg-white/5 rounded-xl" />)}
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notif) => (
              <div key={notif.id} className="flex items-start gap-3 p-3 rounded-xl bg-white/5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center mt-0.5">
                  <Bell className="w-4 h-4 text-blue-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white font-medium">{notif.title}</span>
                    <Badge variant="secondary" className={`text-xs ${typeColors[notif.type] || "bg-white/5"}`}>
                      {notif.type}
                    </Badge>
                    {!notif.is_read && <span className="w-2 h-2 rounded-full bg-blue-400" />}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{notif.message}</p>
                  <p className="text-xs text-gray-600 mt-1">{formatDate(notif.created_at)}</p>
                </div>
              </div>
            ))}
            {notifications.length === 0 && (
              <p className="text-center text-gray-500 py-8">Aucune notification envoyÃ©e</p>
            )}
          </div>
        )}
      </Card>
    </AdminLayout>
  );
}
