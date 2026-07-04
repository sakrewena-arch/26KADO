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
import { Plus, BookOpen, ExternalLink } from "lucide-react";

interface Resource {
  id: string;
  title: string;
  type: string;
  file_url?: string;
  content?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function AdminResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Resource | null>(null);
  const [form, setForm] = useState({ title: "", type: "banner", file_url: "", content: "", is_active: true });

  const supabase = createClient();

  const fetchResources = async () => {
    const { data, error } = await supabase.from("resources").select("*").order("created_at", { ascending: false });
    if (!error && data) setResources(data);
    setLoading(false);
  };

  useEffect(() => { fetchResources(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      await supabase.from("resources").update(form).eq("id", editing.id);
    } else {
      await supabase.from("resources").insert(form);
    }
    setShowForm(false);
    setEditing(null);
    setForm({ title: "", type: "banner", file_url: "", content: "", is_active: true });
    fetchResources();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Supprimer cette ressource ?")) {
      await supabase.from("resources").delete().eq("id", id);
      fetchResources();
    }
  };

  const typeColors: Record<string, string> = {
    banner: "bg-purple-500/10 text-purple-400",
    image: "bg-green-500/10 text-green-400",
    text: "bg-blue-500/10 text-blue-400",
    ad: "bg-yellow-500/10 text-yellow-400",
    video: "bg-red-500/10 text-red-400",
  };

  return (
    <AdminLayout title="Ressources">
      <div className="flex items-center justify-between mb-6">
        <p className="text-gray-400">Gérez les ressources marketing (bannières, images, textes, pubs, vidéos)</p>
        <Button onClick={() => { setShowForm(true); setEditing(null); setForm({ title: "", type: "banner", file_url: "", content: "", is_active: true }); }}>
          <Plus className="w-4 h-4 mr-2" /> Nouvelle ressource
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Titre</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <select className="w-full h-10 rounded-xl bg-white/5 border border-white/10 text-white px-3"
                value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="banner">Bannière</option>
                <option value="image">Image</option>
                <option value="text">Texte</option>
                <option value="ad">Publicité</option>
                <option value="video">Vidéo</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>URL du fichier</Label>
              <Input value={form.file_url} onChange={(e) => setForm({ ...form, file_url: e.target.value })} placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <Label>Contenu texte</Label>
              <Input value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                Active
              </label>
            </div>
            <div className="flex items-end gap-2">
              <Button type="submit">{editing ? "Mettre à jour" : "Créer"}</Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Annuler</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? [1,2,3,4,5,6].map(i => (
          <Card key={i}><div className="h-28 animate-pulse bg-white/5 rounded-xl" /></Card>
        )) : resources.map((resource) => (
          <Card key={resource.id} className={`${!resource.is_active ? "opacity-50" : ""}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${typeColors[resource.type] || "bg-white/5"}`}>
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm">{resource.title}</h3>
                  <Badge variant="secondary" className={`text-xs ${typeColors[resource.type] || "bg-white/5"}`}>
                    {resource.type}
                  </Badge>
                </div>
              </div>
              <Badge variant={resource.is_active ? "success" : "secondary"}>
                {resource.is_active ? "Actif" : "Inactif"}
              </Badge>
            </div>
            {resource.file_url && (
              <a href={resource.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 mb-2">
                <ExternalLink className="w-3 h-3" /> Voir le fichier
              </a>
            )}
            {resource.content && (
              <p className="text-xs text-gray-500 line-clamp-2 mb-2">{resource.content}</p>
            )}
            <p className="text-xs text-gray-600">{formatDate(resource.created_at)}</p>
            <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-white/5">
              <button onClick={() => { setEditing(resource); setForm({ title: resource.title, type: resource.type, file_url: resource.file_url || "", content: resource.content || "", is_active: resource.is_active }); setShowForm(true); }} className="text-blue-400 hover:text-blue-300 text-sm">Modifier</button>
              <button onClick={() => handleDelete(resource.id)} className="text-red-400 hover:text-red-300 text-sm">Supprimer</button>
            </div>
          </Card>
        ))}
      </div>
    </AdminLayout>
  );
}