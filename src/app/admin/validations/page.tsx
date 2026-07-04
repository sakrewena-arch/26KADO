"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getAllUploads } from "@/lib/supabase/queries";
import { formatCurrency, formatDate, getStatusLabel } from "@/lib/utils";
import { Check, X, Info, Eye, ExternalLink, FileImage, MessageSquare, User, Calendar, DollarSign, Hash, XCircle, CheckSquare, Square, Trash, Trash2 } from "lucide-react";
import type { Upload } from "@/types";

export default function AdminValidationsPage() {
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUpload, setSelectedUpload] = useState<Upload | null>(null);
  const [detailUpload, setDetailUpload] = useState<Upload | null>(null);
  const [commissionAmount, setCommissionAmount] = useState("");
  const [infoNote, setInfoNote] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadUploads = async () => {
    const data = await getAllUploads();
    setUploads(data);
    setLoading(false);
  };

  useEffect(() => {
    loadUploads();
  }, []);

  const handleValidate = async (upload: Upload) => {
    if (!commissionAmount) return;
    await fetch("/api/admin/uploads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        upload_id: upload.id,
        status: "validated",
        commission_amount: Number(commissionAmount),
        admin_note: "Validé par l'administrateur",
      }),
    });
    setCommissionAmount("");
    setSelectedUpload(null);
    await loadUploads();
  };

  const handleReject = async (upload: Upload) => {
    await fetch("/api/admin/uploads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        upload_id: upload.id,
        status: "rejected",
        admin_note: "Refusé",
      }),
    });
    await loadUploads();
    setDetailUpload(null);
  };

  const handleInfoRequest = async (upload: Upload) => {
    await fetch("/api/admin/uploads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        upload_id: upload.id,
        status: "info_requested",
        admin_note: infoNote || "Informations supplémentaires requises",
      }),
    });
    setInfoNote("");
    await loadUploads();
    setDetailUpload(null);
  };

  // Suppression "pour moi" (soft delete : on cache juste de la liste admin)
  const handleSoftDelete = async (id: string) => {
    setActionLoading(id);
    await fetch("/api/admin/uploads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        upload_id: id,
        status: "archived",
        admin_note: "Archivé par l'administrateur",
      }),
    });
    await loadUploads();
    setActionLoading(null);
  };

  // Suppression définitive (hard delete)
  const handleHardDelete = async (id: string) => {
    if (!confirm("Supprimer définitivement cette validation ? Cette action est irréversible.")) return;
    setActionLoading(id);
    await fetch(`/api/admin/uploads?id=${id}`, { method: "DELETE" });
    await loadUploads();
    setActionLoading(null);
  };

  // Actions groupées
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
      setSelectedIds(new Set(uploads.map(u => u.id)));
      setSelectAll(true);
    }
  };

  const handleBulkSoftDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Archiver ${selectedIds.size} validation(s) ? Elles seront masquées de la liste.`)) return;
    setActionLoading("bulk");
    await Promise.all(
      Array.from(selectedIds).map(id =>
        fetch("/api/admin/uploads", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ upload_id: id, status: "archived", admin_note: "Archivé" }),
        })
      )
    );
    setSelectedIds(new Set());
    setSelectAll(false);
    await loadUploads();
    setActionLoading(null);
  };

  const handleBulkHardDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Supprimer définitivement ${selectedIds.size} validation(s) ? Action irréversible.`)) return;
    setActionLoading("bulk");
    await Promise.all(
      Array.from(selectedIds).map(id =>
        fetch(`/api/admin/uploads?id=${id}`, { method: "DELETE" })
      )
    );
    setSelectedIds(new Set());
    setSelectAll(false);
    await loadUploads();
    setActionLoading(null);
  };

  // Filtrer les archivés de la liste principale
  const activeUploads = uploads.filter(u => (u.status as string) !== "archived");
  const pending = activeUploads.filter((u) => u.status === "pending");

  return (
    <AdminLayout title="Validations">
      {/* Barre d'actions groupées */}
      {selectedIds.size > 0 && (
        <div className="mb-4 flex items-center gap-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <span className="text-sm text-blue-400 font-medium">{selectedIds.size} sélectionné(s)</span>
          <div className="flex gap-2 ml-auto">
            <Button size="sm" variant="outline" onClick={handleBulkSoftDelete} disabled={actionLoading === "bulk"}>
              <Trash2 className="w-3 h-3 mr-1" /> Archiver (pour moi)
            </Button>
            <Button size="sm" variant="destructive" onClick={handleBulkHardDelete} disabled={actionLoading === "bulk"}>
              <Trash className="w-3 h-3 mr-1" /> Supprimer définitivement
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending List */}
        <Card className="lg:col-span-2">
          <h3 className="text-lg font-semibold text-white mb-4">
            Demandes en attente ({pending.length})
          </h3>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-xl bg-white/5 animate-pulse" />)}
            </div>
          ) : pending.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Aucune demande en attente</p>
          ) : (
            <div className="space-y-3">
              {pending.map((upload) => (
                <div key={upload.id} className="p-4 rounded-xl bg-white/5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-medium text-white">{upload.user?.full_name || "Utilisateur"}</p>
                      <p className="text-xs text-gray-500">{upload.bookmaker?.name} • ID: {upload.bookmaker_user_id}</p>
                    </div>
                    <Badge variant="warning">En attente</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs text-gray-400 mb-3">
                    <span>Montant: {formatCurrency(upload.deposit_amount)}</span>
                    <span>Date: {formatDate(upload.deposit_date)}</span>
                    <span>Créé: {formatDate(upload.created_at)}</span>
                  </div>
                  {upload.comments && (
                    <p className="text-xs text-gray-400 mb-3 italic">"{upload.comments}"</p>
                  )}
                  <div className="flex gap-2 flex-wrap">
                    <Button size="sm" variant="default" onClick={() => { setSelectedUpload(upload); setCommissionAmount(""); }}>
                      <Check className="w-4 h-4 mr-1" /> Valider
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleReject(upload)}>
                      <X className="w-4 h-4 mr-1" /> Refuser
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setDetailUpload(upload)}>
                      <Eye className="w-4 h-4 mr-1" /> Détails
                    </Button>
                  </div>
                  {selectedUpload?.id === upload.id && (
                    <div className="mt-3 p-3 rounded-xl bg-blue-500/10 space-y-2">
                      <p className="text-sm text-blue-400">Montant de la commission</p>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="50000"
                          value={commissionAmount}
                          onChange={(e) => setCommissionAmount(e.target.value)}
                        />
                        <Button size="sm" onClick={() => handleValidate(upload)} disabled={!commissionAmount}>
                          Confirmer
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* All Uploads */}
        <Card>
          <h3 className="text-lg font-semibold text-white mb-4">Toutes les validations</h3>
          <div className="flex items-center gap-3 px-1 py-2 text-xs text-gray-500 border-b border-white/5 mb-2">
            <button onClick={toggleSelectAll} className="flex items-center gap-2 hover:text-white transition-colors">
              {selectAll ? <CheckSquare className="w-4 h-4 text-blue-400" /> : <Square className="w-4 h-4" />}
              <span>Tout ({activeUploads.length})</span>
            </button>
          </div>
          <div className="space-y-2 max-h-[550px] overflow-y-auto">
            {activeUploads.map((upload) => (
              <div
                key={upload.id}
                className={`flex items-center gap-2 p-3 rounded-xl transition-colors ${
                  selectedIds.has(upload.id) ? "bg-blue-500/10 border border-blue-500/20" : "bg-white/5 hover:bg-white/10"
                }`}
              >
                <button onClick={() => toggleSelect(upload.id)} className="flex-shrink-0">
                  {selectedIds.has(upload.id) ? <CheckSquare className="w-4 h-4 text-blue-400" /> : <Square className="w-4 h-4 text-gray-500 hover:text-white" />}
                </button>
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setDetailUpload(upload)}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-white truncate">{upload.user?.full_name || "N/A"}</p>
                    <Badge variant={upload.status === "validated" ? "success" : upload.status === "rejected" ? "danger" : "warning"} className="text-[10px] flex-shrink-0 ml-1">
                      {getStatusLabel(upload.status)}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-gray-500 truncate">{upload.bookmaker?.name} • {formatCurrency(upload.deposit_amount)}</p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleSoftDelete(upload.id); }}
                    className="p-1 text-gray-500 hover:text-yellow-400 transition-colors"
                    title="Archiver (pour moi)"
                    disabled={actionLoading === upload.id}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleHardDelete(upload.id); }}
                    className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                    title="Supprimer définitivement"
                    disabled={actionLoading === upload.id}
                  >
                    <Trash className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
            {activeUploads.length === 0 && (
              <p className="text-center text-gray-500 py-8">Aucune validation</p>
            )}
          </div>
        </Card>
      </div>

      {/* Modal Détails */}
      {detailUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDetailUpload(null)} />
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-gray-900 border border-white/10 p-6 space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-bold text-white">Détails de la validation</h3>
              <button onClick={() => setDetailUpload(null)} className="p-2 text-gray-400 hover:text-white transition-colors">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Infos utilisateur */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-white/5 space-y-3">
                <h4 className="text-sm font-semibold text-blue-400 flex items-center gap-2">
                  <User className="w-4 h-4" /> Utilisateur
                </h4>
                <p className="text-sm text-white">{detailUpload.user?.full_name || "N/A"}</p>
                <p className="text-xs text-gray-500">{detailUpload.user?.email || ""}</p>
              </div>

              <div className="p-4 rounded-xl bg-white/5 space-y-3">
                <h4 className="text-sm font-semibold text-yellow-400 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" /> Dépôt
                </h4>
                <p className="text-sm text-white">{formatCurrency(detailUpload.deposit_amount)}</p>
                <p className="text-xs text-gray-500">Date: {formatDate(detailUpload.deposit_date)}</p>
              </div>

              <div className="p-4 rounded-xl bg-white/5 space-y-3">
                <h4 className="text-sm font-semibold text-green-400 flex items-center gap-2">
                  <Hash className="w-4 h-4" /> Bookmaker
                </h4>
                <p className="text-sm text-white">{detailUpload.bookmaker?.name || "N/A"}</p>
                <p className="text-xs text-gray-500">ID: {detailUpload.bookmaker_user_id}</p>
              </div>

              <div className="p-4 rounded-xl bg-white/5 space-y-3">
                <h4 className="text-sm font-semibold text-purple-400 flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Statut
                </h4>
                <Badge variant={detailUpload.status === "validated" ? "success" : detailUpload.status === "rejected" ? "danger" : "warning"}>
                  {getStatusLabel(detailUpload.status)}
                </Badge>
                <p className="text-xs text-gray-500">Créé le {formatDate(detailUpload.created_at)}</p>
              </div>
            </div>

            {/* Commentaires */}
            {detailUpload.comments && (
              <div className="p-4 rounded-xl bg-white/5 space-y-2">
                <h4 className="text-sm font-semibold text-gray-400 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" /> Commentaire de l'utilisateur
                </h4>
                <p className="text-sm text-white italic">"{detailUpload.comments}"</p>
              </div>
            )}

            {/* Images */}
            {detailUpload.images && detailUpload.images.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-400 flex items-center gap-2">
                  <FileImage className="w-4 h-4" /> Captures d'écran ({detailUpload.images.length})
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {detailUpload.images.map((img, i) => (
                    <a key={i} href={img} target="_blank" rel="noopener noreferrer" className="group relative">
                      <img
                        src={img}
                        alt={`Capture ${i + 1}`}
                        className="w-full h-32 object-cover rounded-xl border border-white/10 group-hover:border-blue-500/50 transition-colors"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.parentElement!.innerHTML = '<div class="w-full h-32 rounded-xl bg-white/5 flex items-center justify-center text-gray-500 text-xs">Image non disponible</div>';
                        }}
                      />
                      <div className="absolute inset-0 rounded-xl bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <ExternalLink className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            {detailUpload.status === "pending" && (
              <div className="p-4 rounded-xl bg-white/5 space-y-3">
                <h4 className="text-sm font-semibold text-gray-400">Actions</h4>
                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" variant="default" onClick={() => { setDetailUpload(null); setSelectedUpload(detailUpload); setCommissionAmount(""); }}>
                    <Check className="w-4 h-4 mr-1" /> Valider
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleReject(detailUpload)}>
                    <X className="w-4 h-4 mr-1" /> Refuser
                  </Button>
                </div>
                <div className="pt-2 border-t border-white/10 space-y-2">
                  <p className="text-xs text-gray-500">Demander des informations supplémentaires à l'utilisateur :</p>
                  <textarea
                    className="w-full h-20 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white resize-none"
                    placeholder="Expliquez ce qui manque..."
                    value={infoNote}
                    onChange={(e) => setInfoNote(e.target.value)}
                  />
                  <Button size="sm" variant="outline" onClick={() => handleInfoRequest(detailUpload)} disabled={!infoNote}>
                    <Info className="w-4 h-4 mr-1" /> Envoyer la demande d'infos
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}