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
import { Plus, MessageCircle, ExternalLink } from "lucide-react";

interface WhatsAppLink {
  id: string;
  url: string;
  label: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function AdminWhatsAppPage() {
  const [links, setLinks] = useState<WhatsAppLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<WhatsAppLink | null>(null);
  const [form, setForm] = useState({ url: "", label: "", is_active: true });

  const supabase = createClient();

  const fetchLinks = async () => {
    const { data, error } = await supabase.from("whatsapp_links").select("*").order("created_at", { ascending: false });
    if (!error && data) setLinks(data);
    setLoading(false);
  };

  useEffect(() => { fetchLinks(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      await supabase.from("whatsapp_links").update(form).eq("id", editing.id);
    } else {
      await supabase.from("whatsapp_links").insert(form);
    }
    setShowForm(false);
    setEditing(null);
    setForm({ url: "", label: "", is_active: true });
    fetchLinks();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Supprimer ce lien WhatsApp ?")) {
      await supabase.from("whatsapp_links").delete().eq("id", id);
      fetchLinks();
    }
  };

  return (
    <AdminLayout title="Liens WhatsApp">
      <div className="flex items-center justify-between mb-6">
        <p className="text-gray-400">Gérez les liens WhatsApp (groupes, canaux, contacts)</p>
        <Button onClick={() => { setShowForm(true); setEditing(null); setForm({ url: "", label: "", is_active: true }); }}>
          <Plus className="w-4 h-4 mr-2" /> Nouveau lien
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>URL WhatsApp</Label>
              <Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://chat.whatsapp.com/..." required />
            </div>
            <div className="space-y-2">
              <Label>Libellé</Label>
              <Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Groupe Coupons 26KADO" required />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                Actif
              </label>
            </div>
            <div className="flex items-end gap-2">
              <Button type="submit">{editing ? "Mettre à jour" : "Créer"}</Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Annuler</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? [1,2,3].map(i => (
          <Card key={i}><div className="h-24 animate-pulse bg-white/5 rounded-xl" /></Card>
        )) : links.map((link) => (
          <Card key={link.id} className={`${!link.is_active ? "opacity-50" : ""}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">{link.label}</h3>
                  <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300 mt-0.5">
                    <ExternalLink className="w-3 h-3" /> {link.url.slice(0, 40)}...
                  </a>
                  <p className="text-xs text-gray-600 mt-1">{formatDate(link.created_at)}</p>
                </div>
              </div>
              <Badge variant={link.is_active ? "success" : "secondary"}>
                {link.is_active ? "Actif" : "Inactif"}
              </Badge>
            </div>
            <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-white/5">
              <button onClick={() => { setEditing(link); setForm({ url: link.url, label: link.label, is_active: link.is_active }); setShowForm(true); }} className="text-blue-400 hover:text-blue-300 text-sm">Modifier</button>
              <button onClick={() => handleDelete(link.id)} className="text-red-400 hover:text-red-300 text-sm">Supprimer</button>
            </div>
          </Card>
        ))}
        {!loading && links.length === 0 && (
          <Card className="md:col-span-2">
            <p className="text-center text-gray-500 py-8">Aucun lien WhatsApp configuré</p>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}