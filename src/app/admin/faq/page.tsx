

"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { Plus, Edit2, Trash2, ChevronDown, ChevronRight } from "lucide-react";

interface FaqCategory {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  faqs?: FaqItem[];
}

interface FaqItem {
  id: string;
  category_id: string;
  question: string;
  answer: string;
  is_published: boolean;
  sort_order: number;
}

export default function AdminFaqPage() {
  const [categories, setCategories] = useState<FaqCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [showCatForm, setShowCatForm] = useState(false);
  const [showFaqForm, setShowFaqForm] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FaqItem | null>(null);
  const [selectedCatId, setSelectedCatId] = useState<string>("");
  const [catForm, setCatForm] = useState({ name: "", slug: "", sort_order: 0 });
  const [faqForm, setFaqForm] = useState({ category_id: "", question: "", answer: "", is_published: true, sort_order: 0 });

  const supabase = createClient();

  const fetchData = async () => {
    const { data, error } = await supabase
      .from("faq_categories")
      .select("*, faqs(*)")
      .order("sort_order");
    if (!error && data) setCategories(data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const addCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from("faq_categories").insert(catForm);
    setShowCatForm(false);
    setCatForm({ name: "", slug: "", sort_order: 0 });
    fetchData();
  };

  const deleteCategory = async (id: string) => {
    if (confirm("Supprimer cette catégorie et ses FAQ ?")) {
      await supabase.from("faq_categories").delete().eq("id", id);
      fetchData();
    }
  };

  const saveFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingFaq) {
      await supabase.from("faqs").update(faqForm).eq("id", editingFaq.id);
    } else {
      await supabase.from("faqs").insert(faqForm);
    }
    setShowFaqForm(false);
    setEditingFaq(null);
    setFaqForm({ category_id: selectedCatId, question: "", answer: "", is_published: true, sort_order: 0 });
    fetchData();
  };

  const deleteFaq = async (id: string) => {
    if (confirm("Supprimer cette FAQ ?")) {
      await supabase.from("faqs").delete().eq("id", id);
      fetchData();
    }
  };

  return (
    <AdminLayout title="FAQ">
      <div className="flex items-center justify-between mb-6">
        <p className="text-gray-400">Gérez les questions fréquentes</p>
        <Button onClick={() => setShowCatForm(true)}><Plus className="w-4 h-4 mr-2" /> Nouvelle catégorie</Button>
      </div>

      {showCatForm && (
        <Card className="mb-6">
          <form onSubmit={addCategory} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Nom</Label>
              <Input value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input value={catForm.slug} onChange={(e) => setCatForm({ ...catForm, slug: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Ordre</Label>
              <Input type="number" value={catForm.sort_order} onChange={(e) => setCatForm({ ...catForm, sort_order: Number(e.target.value) })} />
            </div>
            <div className="flex gap-2 col-span-full">
              <Button type="submit">Créer</Button>
              <Button type="button" variant="secondary" onClick={() => setShowCatForm(false)}>Annuler</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="space-y-4">
        {loading ? (
          <Card><div className="h-20 animate-pulse bg-white/5 rounded-xl" /></Card>
        ) : categories.map((cat) => (
          <Card key={cat.id}>
            <div className="flex items-center justify-between">
              <button onClick={() => setExpandedCat(expandedCat === cat.id ? null : cat.id)} className="flex items-center gap-2 text-white font-semibold">
                {expandedCat === cat.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                {cat.name}
                <span className="text-xs text-gray-500">({cat.faqs?.length || 0} FAQ)</span>
              </button>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => { setSelectedCatId(cat.id); setFaqForm({ ...faqForm, category_id: cat.id }); setShowFaqForm(true); setEditingFaq(null); }}>
                  <Plus className="w-3 h-3 mr-1" /> Ajouter FAQ
                </Button>
                <button onClick={() => deleteCategory(cat.id)} className="text-red-400 hover:text-red-300 text-sm">Supprimer</button>
              </div>
            </div>
            {expandedCat === cat.id && cat.faqs && (
              <div className="mt-4 space-y-2">
                {cat.faqs.map((faq) => (
                  <div key={faq.id} className="p-3 rounded-xl bg-white/5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-white font-medium">{faq.question}</p>
                        <p className="text-xs text-gray-500 mt-1">{faq.answer}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button onClick={() => { setEditingFaq(faq); setFaqForm(faq); setShowFaqForm(true); }} className="text-blue-400 hover:text-blue-300 text-xs">Modifier</button>
                        <button onClick={() => deleteFaq(faq.id)} className="text-red-400 hover:text-red-300 text-xs">Supprimer</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>

      {showFaqForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowFaqForm(false)}>
          <Card className="max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-white mb-4">{editingFaq ? "Modifier" : "Ajouter"} une FAQ</h3>
            <form onSubmit={saveFaq} className="space-y-4">
              <div className="space-y-2">
                <Label>Question</Label>
                <Input value={faqForm.question} onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Réponse</Label>
                <textarea className="w-full min-h-[120px] rounded-xl bg-white/5 border border-white/10 text-white px-3 py-2"
                  value={faqForm.answer} onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })} required />
              </div>
              <div className="flex gap-2">
                <Button type="submit">{editingFaq ? "Mettre à jour" : "Ajouter"}</Button>
                <Button type="button" variant="secondary" onClick={() => setShowFaqForm(false)}>Annuler</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </AdminLayout>
  );
}