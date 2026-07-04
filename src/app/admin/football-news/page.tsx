  "use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit2, Trash2, Newspaper, Check, X, Calendar, Clock, Upload, ZoomIn } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getAllFootballNews, createFootballNews, updateFootballNews, deleteFootballNews } from "@/lib/supabase/queries";
import { uploadFile } from "@/lib/supabase/storage";
import type { FootballNews } from "@/types";

export default function AdminFootballNewsPage() {
  const [news, setNews] = useState<FootballNews[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<FootballNews | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", image_url: "", is_published: true });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  async function loadNews() {
    try {
      const data = await getAllFootballNews();
      setNews(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadNews(); }, []);

  function resetForm() {
    setForm({ title: "", description: "", image_url: "", is_published: true });
    setImageFile(null);
    setImagePreview("");
    setEditing(null);
    setShowForm(false);
  }

  function editItem(item: FootballNews) {
    setEditing(item);
    setForm({
      title: item.title,
      description: item.description,
      image_url: item.image_url || "",
      is_published: item.is_published ?? true,
    });
    setImagePreview(item.image_url || "");
    setShowForm(true);
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  }

  async function handleSave() {
    if (!form.title.trim()) return;
    setSaving(true);
    setUploading(true);
    try {
      let imageUrl = editing ? editing.image_url : null;

      // Upload image if a new file was selected
      if (imageFile) {
        const result = await uploadFile("resources", imageFile, "football-news");
        if (result.error) {
          console.error("Upload error:", result.error);
          setUploading(false);
          setSaving(false);
          return;
        }
        imageUrl = result.url;
      }

      const data = {
        title: form.title.trim(),
        description: form.description.trim(),
        image_url: imageUrl,
        is_published: form.is_published ?? true,
      };
      if (editing) {
        await updateFootballNews(editing.id, data);
      } else {
        await createFootballNews(data);
      }
      resetForm();
      await loadNews();
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette actualité ?")) return;
    try {
      await deleteFootballNews(id);
      await loadNews();
    } catch (err) {
      console.error(err);
    }
  }

  async function togglePublished(item: FootballNews) {
    try {
      await updateFootballNews(item.id, { is_published: !item.is_published });
      await loadNews();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <AdminLayout title="Actu Foot">
      {/* Lightbox */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxImage(null)}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
          >
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors z-10"
            >
              <X className="w-6 h-6" />
            </button>
            <motion.img
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              src={lightboxImage}
              alt="Image en grand"
              className="max-w-full max-h-full object-contain rounded-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Actualités Football</h2>
            <p className="text-gray-400 text-sm mt-1">Publiez et gérez les actualités football</p>
          </div>
          <Button variant="premium" onClick={() => { resetForm(); setShowForm(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle actualité
          </Button>
        </div>

        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="p-6 space-y-4">
              <h3 className="text-lg font-semibold text-white">
                {editing ? "Modifier l'actualité" : "Nouvelle actualité"}
              </h3>
              <div className="space-y-2">
                <label className="text-sm text-gray-300">Titre *</label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Ex: CAN 2025 : Le Sénégal se qualifie"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-300">Description</label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Contenu de l'actualité..."
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-300">Image de l'actualité</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                    <Upload className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-gray-300">Choisir un fichier</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </label>
                  {imageFile && (
                    <span className="text-xs text-gray-500">{imageFile.name}</span>
                  )}
                </div>
                {imagePreview && (
                  <div className="relative w-40 h-28 rounded-xl overflow-hidden border border-white/10 mt-2">
                    <img src={imagePreview} alt="Aperçu" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => { setImageFile(null); setImagePreview(""); }}
                      className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white hover:bg-black/80"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-300">Publier l'actualité</label>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.is_published}
                    onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-700 bg-white/5 text-blue-400 focus:ring-0"
                  />
                  <span className="text-sm text-gray-300">Publié</span>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="premium" onClick={handleSave} disabled={saving || uploading || !form.title.trim()}>
                  {uploading ? "Upload en cours..." : saving ? "Enregistrement..." : editing ? "Mettre à jour" : "Créer"}
                </Button>
                <Button variant="ghost" onClick={resetForm}>Annuler</Button>
              </div>
            </Card>
          </motion.div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-56 rounded-2xl bg-white/5 animate-pulse" />)}
          </div>
        ) : news.length === 0 ? (
          <Card className="p-12 text-center">
            <Newspaper className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">Aucune actualité pour le moment</p>
            <p className="text-gray-500 text-sm mt-1">Cliquez sur "Nouvelle actualité" pour publier votre premier article.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {news.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="h-full overflow-hidden flex flex-col">
                  {item.image_url && (
                    <div
                      onClick={() => setLightboxImage(item.image_url!)}
                      className="relative h-40 -mx-6 -mt-6 mb-3 overflow-hidden group cursor-pointer bg-white/5"
                    >
                      <img src={item.image_url} alt={item.title} className="w-full h-full object-contain p-2" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-white text-sm flex-1">{item.title}</h3>
                    <button
                      onClick={() => togglePublished(item)}
                      className={`p-1 rounded-lg transition-colors flex-shrink-0 ${item.is_published ? "text-green-400 bg-green-500/10" : "text-gray-600 bg-white/5"}`}
                      title={item.is_published ? "Dépublier" : "Publier"}
                    >
                      {item.is_published ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mb-3 whitespace-pre-wrap break-words leading-relaxed flex-1">{item.description}</p>
                  <div className="flex items-center gap-3 text-[10px] text-gray-600 mb-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(item.created_at).toLocaleDateString("fr-FR")}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(item.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <Badge variant={item.is_published ? "default" : "secondary"} className="text-[10px]">
                      {item.is_published ? "Publié" : "Brouillon"}
                    </Badge>
                    <div className="flex gap-1">
                      <button onClick={() => editItem(item)} className="p-1.5 text-gray-500 hover:text-blue-400 transition-colors">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-1.5 text-gray-500 hover:text-red-400 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}