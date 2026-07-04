"use client";

import { useEffect, useState, useCallback } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { getAllBookmakers } from "@/lib/supabase/queries";
import { Plus, Edit2, ExternalLink, Trash2 } from "lucide-react";
import type { Bookmaker } from "@/types";

type BookmakerForm = {
  name: string;
  slug: string;
  logo_url: string;
  color: string;
  description: string;
  bonus: string;
  promo_code: string;
  advantages: string;
  affiliate_url: string;
  is_active: boolean;
  sort_order: number;
};

const emptyForm: BookmakerForm = {
  name: "", slug: "", logo_url: "", color: "#3b82f6", description: "", bonus: "",
  promo_code: "26KADO", advantages: "", affiliate_url: "", is_active: true, sort_order: 0,
};

export default function AdminBookmakersPage() {
  const [bookmakers, setBookmakers] = useState<Bookmaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BookmakerForm>({ ...emptyForm });
  const [submitting, setSubmitting] = useState(false);

  const loadBookmakers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllBookmakers();
      setBookmakers(data);
    } catch (err) {
      setError("Erreur lors du chargement des bookmakers");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadBookmakers(); }, [loadBookmakers]);

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const advantages = form.advantages.split(",").map((a) => a.trim()).filter(Boolean);
      const payload = {
        name: form.name,
        slug: form.slug,
        logo_url: form.logo_url,
        color: form.color,
        description: form.description,
        bonus: form.bonus,
        promo_code: form.promo_code,
        advantages,
        is_active: form.is_active,
        sort_order: form.sort_order,
      };

      if (editingId) {
        const res = await fetch("/api/bookmakers", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingId, ...payload }),
        });
        if (!res.ok) throw new Error("Erreur lors de la modification");

        // Mettre à jour le lien d'affiliation si fourni
        if (form.affiliate_url) {
          const bm = bookmakers.find(b => b.id === editingId);
          const existingLink = (bm as any)?.affiliate_links?.[0];
          if (existingLink) {
            await fetch("/api/affiliate-links", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: existingLink.id, url: form.affiliate_url }),
            });
          } else {
            await fetch("/api/affiliate-links", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ bookmaker_id: editingId, url: form.affiliate_url }),
            });
          }
        }
      } else {
        const res = await fetch("/api/bookmakers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Erreur lors de la création");
        const bm = await res.json();
        if (form.affiliate_url && bm?.id) {
          await fetch("/api/affiliate-links", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bookmaker_id: bm.id, url: form.affiliate_url }),
          });
        }
      }

      setShowForm(false);
      setEditingId(null);
      setForm({ ...emptyForm });
      await loadBookmakers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la sauvegarde");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce bookmaker ?")) return;
    try {
      const res = await fetch(`/api/bookmakers?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erreur lors de la suppression");
      await loadBookmakers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la suppression");
    }
  };

  const handleEdit = (bm: Bookmaker) => {
    setEditingId(bm.id);
    setForm({
      name: bm.name,
      slug: bm.slug,
      logo_url: bm.logo_url || "",
      color: bm.color,
      description: bm.description,
      bonus: bm.bonus,
      promo_code: bm.promo_code,
      advantages: (bm.advantages || []).join(", "),
      affiliate_url: (bm as any).affiliate_links?.[0]?.url || "",
      is_active: bm.is_active,
      sort_order: bm.sort_order,
    });
    setShowForm(true);
  };

  return (
    <AdminLayout title="Bookmakers">
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
      )}

      <div className="flex justify-between items-center mb-6">
        <p className="text-sm text-gray-400">{bookmakers.length} bookmaker(s)</p>
        <Button size="sm" onClick={() => { setShowForm(true); setEditingId(null); setForm({ ...emptyForm }); }}>
          <Plus className="w-4 h-4 mr-2" /> Ajouter
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">{editingId ? "Modifier" : "Ajouter"} un bookmaker</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nom</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>URL du logo</Label>
              <Input value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Couleur</Label>
              <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="w-full h-11 rounded-xl bg-white/5 cursor-pointer" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Description</Label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full h-20 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white resize-none" />
            </div>
            <div className="space-y-2">
              <Label>Bonus</Label>
              <Input value={form.bonus} onChange={(e) => setForm({ ...form, bonus: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Code promo</Label>
              <Input value={form.promo_code} onChange={(e) => setForm({ ...form, promo_code: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Avantages (séparés par des virgules)</Label>
              <Input value={form.advantages} onChange={(e) => setForm({ ...form, advantages: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Lien d'affiliation</Label>
              <Input value={form.affiliate_url} onChange={(e) => setForm({ ...form, affiliate_url: e.target.value })} placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <Label>Ordre d'affichage</Label>
              <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input type="checkbox" id="is_active" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4 rounded bg-white/5" />
              <Label htmlFor="is_active">Actif</Label>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleSubmit} disabled={submitting}>{editingId ? "Modifier" : "Créer"}</Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>Annuler</Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? [1, 2, 3, 4].map((i) => <div key={i} className="h-32 rounded-2xl bg-white/5 animate-pulse" />)
        : bookmakers.map((bm) => (
          <Card key={bm.id} variant="interactive">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold" style={{ backgroundColor: bm.color }}>
                  {bm.name[0]}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">{bm.name}</h3>
                  <p className="text-xs text-gray-500">{bm.bonus}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {!bm.is_active && <Badge variant="secondary" className="text-[10px]">Inactif</Badge>}
                <button onClick={() => handleEdit(bm)} className="p-1.5 text-gray-500 hover:text-blue-400">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(bm.id)} className="p-1.5 text-gray-500 hover:text-red-400">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-400 line-clamp-2 mb-2">{bm.description}</p>
            <div className="flex items-center justify-between">
              <Badge variant="premium">{bm.promo_code}</Badge>
              {(bm as any).affiliate_links?.[0]?.url && (
                <a href={(bm as any).affiliate_links[0].url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                  <ExternalLink className="w-3 h-3" /> Lien
                </a>
              )}
            </div>
          </Card>
        ))}
      </div>
    </AdminLayout>
  );
}