"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { getUploads, createUpload, getBookmakers } from "@/lib/supabase/queries";
import { formatCurrency, formatDate, getStatusLabel } from "@/lib/utils";
import { Upload, ImagePlus, X, RefreshCw, AlertCircle } from "lucide-react";
import { uploadProofImages } from "@/lib/supabase/storage";
import type { Upload as UploadType, Bookmaker } from "@/types";

export default function ValidationsPage() {
  const { user } = useAuth();
  const [uploads, setUploads] = useState<UploadType[]>([]);
  const [bookmakers, setBookmakers] = useState<Bookmaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookmakerId, setBookmakerId] = useState("");
  const [bookmakerUserId, setBookmakerUserId] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [depositDate, setDepositDate] = useState("");
  const [comments, setComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [resubmitUpload, setResubmitUpload] = useState<UploadType | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles((prev) => [...prev, ...files]);
    const newPreviews = files.map((f) => URL.createObjectURL(f));
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  useEffect(() => {
    if (user) {
      Promise.all([
        getUploads(user.id),
        getBookmakers(),
      ]).then(([u, b]) => {
        setUploads(u);
        setBookmakers(b);
        setLoading(false);
      });
    }
  }, [user]);

  const resetForm = () => {
    setBookmakerId("");
    setBookmakerUserId("");
    setDepositAmount("");
    setDepositDate("");
    setComments("");
    setSelectedFiles([]);
    setPreviews([]);
    setResubmitUpload(null);
  };

  const handleSubmit = async (existingId?: string) => {
    if (!bookmakerId || !bookmakerUserId || !depositAmount || !depositDate) return;
    if (!existingId && selectedFiles.length === 0) return; // Images obligatoires pour une nouvelle soumission
    setIsSubmitting(true);
    try {
      let imageUrls: string[] = [];
      if (selectedFiles.length > 0) {
        const result = await uploadProofImages(user!.id, bookmakerId, selectedFiles);
        imageUrls = result.urls;
        if (result.errors.length > 0) {
          console.error("Upload errors:", result.errors);
        }
      }

      if (existingId) {
        // Réponse à une demande d'infos via API publique (pas admin)
        const res = await fetch("/api/uploads/respond", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            upload_id: existingId,
            comments: comments || "",
            new_images: imageUrls.length > 0 ? imageUrls : undefined,
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Erreur lors de l'envoi");
        }
      } else {
        await createUpload({
          user_id: user!.id,
          bookmaker_id: bookmakerId,
          bookmaker_user_id: bookmakerUserId,
          deposit_amount: Number(depositAmount),
          deposit_date: depositDate,
          comments,
          images: imageUrls,
          status: "pending",
        });
      }

      const updated = await getUploads(user!.id);
      setUploads(updated);
      resetForm();
    } catch (err) {
      console.error(err);
    }
    setIsSubmitting(false);
  };

  const handleResubmit = (upload: UploadType) => {
    setResubmitUpload(upload);
    setBookmakerId(upload.bookmaker_id || "");
    setBookmakerUserId(upload.bookmaker_user_id);
    setDepositAmount(String(upload.deposit_amount));
    setDepositDate(upload.deposit_date);
    setComments("");
    setSelectedFiles([]);
    setPreviews([]);
  };

  return (
    <DashboardLayout title="Validations">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Submit Form */}
        <Card>
          <h3 className="text-lg font-semibold text-white mb-4">
            {resubmitUpload ? "Répondre à la demande d'infos" : "Soumettre une validation"}
          </h3>
          {resubmitUpload && (
            <div className="mb-4 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-sm text-orange-400 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Demande d'informations supplémentaires</p>
                <p className="text-xs text-orange-300 mt-1">
                  L'administrateur a demandé des infos pour votre validation chez <strong>{resubmitUpload.bookmaker?.name}</strong>.
                  Veuillez ajouter les informations demandées et soumettre à nouveau.
                </p>
              </div>
            </div>
          )}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Bookmaker</Label>
              <select
                value={bookmakerId}
                onChange={(e) => setBookmakerId(e.target.value)}
                className="w-full h-11 rounded-xl border border-white/10 bg-gray-800 px-4 text-sm text-white [&>option]:bg-gray-800 [&>option]:text-white"
                style={{ colorScheme: 'dark' }}
                disabled={!!resubmitUpload}
              >
                <option value="" className="bg-gray-800 text-white">Sélectionner un bookmaker</option>
                {bookmakers.length === 0 && (
                  <option value="" className="bg-gray-800 text-gray-400" disabled>Aucun bookmaker disponible</option>
                )}
                {bookmakers.map((bm) => (
                  <option key={bm.id} value={bm.id} className="bg-gray-800 text-white">{bm.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>4 derniers chiffres ID bookmaker</Label>
              <Input
                placeholder="1234"
                value={bookmakerUserId}
                onChange={(e) => setBookmakerUserId(e.target.value)}
                disabled={!!resubmitUpload}
              />
            </div>
            <div className="space-y-2">
              <Label>Montant du premier dépôt</Label>
              <Input
                type="number"
                placeholder="50000"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                disabled={!!resubmitUpload}
              />
            </div>
            <div className="space-y-2">
              <Label>Date du dépôt</Label>
              <Input
                type="date"
                value={depositDate}
                onChange={(e) => setDepositDate(e.target.value)}
                disabled={!!resubmitUpload}
              />
            </div>
            <div className="space-y-2">
              <Label>Commentaires {resubmitUpload ? "(obligatoire)" : "(facultatif)"}</Label>
              <textarea
                className="w-full h-20 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white resize-none"
                placeholder={resubmitUpload ? "Répondez aux questions de l'administrateur..." : "Ajoutez un commentaire..."}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Captures d'écran</Label>
              <label className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center hover:border-blue-500/50 transition-colors cursor-pointer block">
                <ImagePlus className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Cliquez pour ajouter des images</p>
                <p className="text-xs text-gray-600 mt-1">PNG, JPG, WebP (max 5 Mo)</p>
                <input type="file" multiple accept="image/*" onChange={handleFileSelect} className="hidden" />
              </label>
              {previews.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {previews.map((preview, i) => (
                    <div key={i} className="relative group">
                      <img src={preview} alt={`Preview ${i}`} className="w-full h-20 object-cover rounded-lg" />
                      <button
                        onClick={() => removeFile(i)}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-500/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2">
            <Button className="flex-1" onClick={() => handleSubmit(resubmitUpload?.id)}
              disabled={isSubmitting || !bookmakerId || !bookmakerUserId || !depositAmount || !depositDate || (!resubmitUpload && selectedFiles.length === 0) || Boolean(resubmitUpload && !comments)}>
                {isSubmitting ? "Envoi..." : resubmitUpload ? "Envoyer les modifications" : "Envoyer la validation"}
                <Upload className="ml-2 w-4 h-4" />
              </Button>
              {resubmitUpload && (
                <Button variant="ghost" onClick={resetForm}>
                  Annuler
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* History */}
        <Card>
          <h3 className="text-lg font-semibold text-white mb-4">Historique</h3>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />)}
            </div>
          ) : uploads.length === 0 ? (
            <div className="text-center py-8">
              <Upload className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500">Aucune validation</p>
            </div>
          ) : (
            <div className="space-y-3">
              {uploads.map((upload) => (
                <div key={upload.id} className="p-3 rounded-xl bg-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-white">{upload.bookmaker?.name}</p>
                    <Badge variant={upload.status === "validated" ? "success" : upload.status === "rejected" ? "danger" : upload.status === "info_requested" ? "warning" : "warning"}>
                      {getStatusLabel(upload.status)}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500">
                    ID: {upload.bookmaker_user_id} • {formatCurrency(upload.deposit_amount)} • {formatDate(upload.deposit_date)}
                  </p>
                  {upload.commission_amount && (
                    <p className="text-xs text-green-400 mt-1">Commission: {formatCurrency(upload.commission_amount)}</p>
                  )}
                  {upload.status === "info_requested" && (
                    <div className="mt-2">
                      <Button size="sm" variant="outline" onClick={() => handleResubmit(upload)} className="w-full">
                        <RefreshCw className="w-4 h-4 mr-1" /> Envoyer les infos demandées
                      </Button>
                      <p className="text-xs text-orange-400 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> L'administrateur a demandé des informations supplémentaires
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}