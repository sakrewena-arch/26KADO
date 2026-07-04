"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { FormField, FormError } from "@/components/ui/form";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { Plus, Trophy } from "lucide-react";

interface BadgeType {
  id: string;
  name: string;
  type: string;
  icon: string;
  description: string;
  min_commission: number;
  color: string;
}

const badgeTypes = [
  { value: "bronze", label: "Bronze" },
  { value: "silver", label: "Argent" },
  { value: "gold", label: "Or" },
  { value: "platinum", label: "Platine" },
  { value: "diamond", label: "Diamant" },
];

export default function AdminBadgesPage() {
  const [badges, setBadges] = useState<BadgeType[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<BadgeType | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const supabase = createClient();

  const [form, setForm] = useState({
    name: "", type: "bronze", icon: "trophy", description: "", min_commission: 0, color: "#B87333"
  });

  const fetchBadges = async () => {
    const { data, error } = await supabase.from("badges").select("*").order("min_commission");
    if (!error && data) setBadges(data);
    setLoading(false);
  };

  useEffect(() => { fetchBadges(); }, []);

  const handleSubmit = async () => {
    if (!form.name || !form.description) return;
    setSubmitError(null);
    try {
      if (editing) {
        await supabase.from("badges").update(form).eq("id", editing.id);
      } else {
        await supabase.from("badges").insert(form);
      }
      setShowForm(false);
      setEditing(null);
      setForm({ name: "", type: "bronze", icon: "trophy", description: "", min_commission: 0, color: "#B87333" });
      fetchBadges();
    } catch (err: any) {
      setSubmitError(err?.message || "Erreur lors de la sauvegarde");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Supprimer ce badge ?")) {
      await supabase.from("badges").delete().eq("id", id);
      fetchBadges();
    }
  };

  const editBadge = (badge: BadgeType) => {
    setEditing(badge);
    setForm({ name: badge.name, type: badge.type, icon: badge.icon, description: badge.description, min_commission: badge.min_commission, color: badge.color });
    setShowForm(true);
  };

  const typeColors: Record<string, string> = {
    bronze: "text-amber-700 bg-amber-500/10",
    silver: "text-gray-300 bg-gray-500/10",
    gold: "text-yellow-400 bg-yellow-500/10",
    platinum: "text-cyan-300 bg-cyan-500/10",
    diamond: "text-blue-300 bg-blue-500/10",
  };

  return (
    <AdminLayout title="Badges">
      <div className="flex items-center justify-between mb-6">
        <p className="text-gray-400">Gérez les badges attribués aux ambassadeurs</p>
        <Button onClick={() => { setShowForm(true); setEditing(null); setForm({ name: "", type: "bronze", icon: "trophy", description: "", min_commission: 0, color: "#B87333" }); }}>
          <Plus className="w-4 h-4 mr-2" /> Nouveau badge
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <FormField label="Nom" required>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </FormField>
            <FormField label="Type" required>
              <Select options={badgeTypes} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
            </FormField>
            <FormField label="Commission minimale (FCFA)" required>
              <Input type="number" value={form.min_commission} onChange={(e) => setForm({ ...form, min_commission: Number(e.target.value) })} />
            </FormField>
            <FormField label="Description" required>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </FormField>
            <FormField label="Couleur">
              <Input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
            </FormField>
            <div className="flex items-end gap-2">
              <Button type="submit">{editing ? "Mettre à jour" : "Créer"}</Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Annuler</Button>
            </div>
          </form>
          <FormError message={submitError} />
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? [1,2,3,4,5].map(i => (
          <Card key={i}><div className="h-24 animate-pulse bg-white/5 rounded-xl" /></Card>
        )) : badges.map((badge) => (
          <Card key={badge.id} className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-10" style={{ backgroundColor: badge.color }} />
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${typeColors[badge.type] || "bg-white/5"}`}>
                  <Trophy className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">{badge.name}</h3>
                  <p className="text-xs text-gray-500">{badge.description}</p>
                </div>
              </div>
              <Badge variant="secondary" style={{ borderColor: badge.color, color: badge.color }}>
                {formatCurrency(badge.min_commission)}
              </Badge>
            </div>
            <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-white/5">
              <button onClick={() => editBadge(badge)} className="text-blue-400 hover:text-blue-300 text-sm">Modifier</button>
              <button onClick={() => handleDelete(badge.id)} className="text-red-400 hover:text-red-300 text-sm">Supprimer</button>
            </div>
          </Card>
        ))}
      </div>
    </AdminLayout>
  );
}