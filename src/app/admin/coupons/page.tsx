"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Edit2, Trash2, Image, Check, X, Upload, ZoomIn } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getAllCoupons, createCoupon, updateCoupon, deleteCoupon } from "@/lib/supabase/queries";
import { uploadFile } from "@/lib/supabase/storage";
import type { Coupon } from "@/types";

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", image_url: "" });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  async function loadCoupons() {
    try {
      const data = await getAllCoupons();
      setCoupons(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadCoupons(); }, []);

  function resetForm() {
    setForm({ title: "", description: "", image_url: "" });
    setImageFile(null);
    setImagePreview("");
    setEditing(null);
    setShowForm(false);
  }

  function editCoupon(c: Coupon) {
    setEditing(c);
    setForm({ title: c.title, description: c.description, image_url: c.image_url || "" });
    setImagePreview(c.image_url || "");
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
        const result = await uploadFile("resources", imageFile, "coupons");
        if (result.error) {
          console.error("Upload error:", result.error);
          setUploading(false);
          setSaving(false);
          return;
        }
        imageUrl = result.url;
      }

      const data = { title: form.title.trim(), description: form.description.trim(), image_url: imageUrl };
      if (editing) {
        await updateCoupon(editing.id, data);
      } else {
        await createCoupon(data);
      }
      resetForm();
      await loadCoupons();
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce coupon ?")) return;
    try {
      await deleteCoupon(id);
      await loadCoupons();
    } catch (err) {
      console.error(err);
    }
  }

  async function toggleActive(c: Coupon) {
    try {
      await updateCoupon(c.id, { is_active: !c.is_active });
      await loadCoupons();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <AdminLayout title="Coupons">
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
            <h2 className="text-2xl font-bold text-white">Gestion des Coupons</h2>
            <p className="text-gray-400 text-sm mt-1">Publiez et gérez vos coupons promotionnels</p>
          </div>
          <Button variant="premium" onClick={() => { resetForm(); setShowForm(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Nouveau coupon
          </Button>
        </div>

        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="p-6 space-y-4">
              <h3 className="text-lg font-semibold text-white">
                {editing ? "Modifier le coupon" : "Nouveau coupon"}
              </h3>
              <div className="space-y-2">
                <label className="text-sm text-gray-300">Titre *</label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Ex: Bonus 1xBet 100%"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-300">Description</label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Description du coupon..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-300">Image du coupon</label>
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
            {[1, 2, 3].map((i) => <div key={i} className="h-48 rounded-2xl bg-white/5 animate-pulse" />)}
          </div>
        ) : coupons.length === 0 ? (
          <Card className="p-12 text-center">
            <Image className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">Aucun coupon pour le moment</p>
            <p className="text-gray-500 text-sm mt-1">Cliquez sur "Nouveau coupon" pour publier votre premier coupon.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {coupons.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="h-full overflow-hidden">
                  {c.image_url && (
                    <div
                      onClick={() => setLightboxImage(c.image_url!)}
                      className="relative h-36 -mx-6 -mt-6 mb-3 overflow-hidden group cursor-pointer bg-white/5"
                    >
                      <img src={c.image_url} alt={c.title} className="w-full h-full object-contain p-2" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-white text-sm">{c.title}</h3>
                    <button
                      onClick={() => toggleActive(c)}
                      className={`p-1 rounded-lg transition-colors ${c.is_active ? "text-green-400 bg-green-500/10" : "text-gray-600 bg-white/5"}`}
                      title={c.is_active ? "Désactiver" : "Activer"}
                    >
                      {c.is_active ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mb-2 whitespace-pre-wrap break-words leading-relaxed">{c.description}</p>
                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <span className="text-xs text-gray-600">
                      {new Date(c.created_at).toLocaleDateString("fr-FR")}
                    </span>
                    <div className="flex gap-1">
                      <button onClick={() => editCoupon(c)} className="p-1.5 text-gray-500 hover:text-blue-400 transition-colors">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(c.id)} className="p-1.5 text-gray-500 hover:text-red-400 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <Badge variant={c.is_active ? "default" : "secondary"} className="mt-2 text-[10px]">
                    {c.is_active ? "Actif" : "Inactif"}
                  </Badge>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}