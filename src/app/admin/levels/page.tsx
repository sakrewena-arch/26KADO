"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { Plus, Shield } from "lucide-react";

interface Level {
  id: string;
  name: string;
  min_commission: number;
  max_commission: number;
  icon: string;
  color: string;
}

export default function AdminLevelsPage() {
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Level | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", min_commission: 0, max_commission: 999999, icon: "shield", color: "#B87333" });

  const supabase = createClient();

  const fetchLevels = async () => {
    const { data, error } = await supabase.from("levels").select("*").order("min_commission");
    if (!error && data) setLevels(data);
    setLoading(false);
  };

  useEffect(() => { fetchLevels(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      await supabase.from("levels").update(form).eq("id", editing.id);
    } else {
      await supabase.from("levels").insert(form);
    }
    setShowForm(false);
    setEditing(null);
    setForm({ name: "", min_commission: 0, max_commission: 999999, icon: "shield", color: "#B87333" });
    fetchLevels();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Supprimer ce niveau ?")) {
      await supabase.from("levels").delete().eq("id", id);
      fetchLevels();
    }
  };

  return (
    <AdminLayout title="Niveaux">
      <div className="flex items-center justify-between mb-6">
        <p className="text-gray-400">Gérez les niveaux des ambassadeurs</p>
        <Button onClick={() => { setShowForm(true); setEditing(null); setForm({ name: "", min_commission: 0, max_commission: 999999, icon: "shield", color: "#B87333" }); }}>
          <Plus className="w-4 h-4 mr-2" /> Nouveau niveau
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Nom</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Commission min (FCFA)</Label>
              <Input type="number" value={form.min_commission} onChange={(e) => setForm({ ...form, min_commission: Number(e.target.value) })} required />
            </div>
            <div className="space-y-2">
              <Label>Commission max (FCFA)</Label>
              <Input type="number" value={form.max_commission} onChange={(e) => setForm({ ...form, max_commission: Number(e.target.value) })} required />
            </div>
            <div className="space-y-2">
              <Label>Couleur</Label>
              <Input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
            </div>
            <div className="flex items-end gap-2">
              <Button type="submit">{editing ? "Mettre à jour" : "Créer"}</Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Annuler</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? [1,2,3,4,5].map(i => (
          <Card key={i}><div className="h-28 animate-pulse bg-white/5 rounded-xl" /></Card>
        )) : levels.map((level) => (
          <Card key={level.id} className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 -mr-10 -mt-10 rounded-full opacity-10" style={{ backgroundColor: level.color }} />
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${level.color}20` }}>
                <Shield className="w-6 h-6" style={{ color: level.color }} />
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">{level.name}</h3>
                <p className="text-xs text-gray-500">{formatCurrency(level.min_commission)} - {formatCurrency(level.max_commission)} FCFA</p>
              </div>
            </div>
            <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: "60%", backgroundColor: level.color }} />
            </div>
            <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-white/5">
              <button onClick={() => { setEditing(level); setForm({ name: level.name, min_commission: level.min_commission, max_commission: level.max_commission, icon: level.icon, color: level.color }); setShowForm(true); }} className="text-blue-400 hover:text-blue-300 text-sm">Modifier</button>
              <button onClick={() => handleDelete(level.id)} className="text-red-400 hover:text-red-300 text-sm">Supprimer</button>
            </div>
          </Card>
        ))}
      </div>
    </AdminLayout>
  );
}