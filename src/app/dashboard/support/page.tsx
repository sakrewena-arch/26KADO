"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { getTickets, createTicket } from "@/lib/supabase/queries";
import { formatDate, getStatusLabel } from "@/lib/utils";
import { Headphones, Plus, MessageSquare } from "lucide-react";
import type { SupportTicket } from "@/types";

export default function SupportPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      getTickets(user.id).then((data) => {
        setTickets(data);
        setLoading(false);
      });
    }
  }, [user]);

  const handleSubmit = async () => {
    if (!subject || !description) return;
    setIsSubmitting(true);
    try {
      await createTicket({
        user_id: user!.id,
        subject,
        description,
        category,
        status: "open",
        priority: "medium",
      });
      const updated = await getTickets(user!.id);
      setTickets(updated);
      setShowForm(false);
      setSubject("");
      setDescription("");
      setCategory("general");
    } catch (err) {
      console.error(err);
    }
    setIsSubmitting(false);
  };

  return (
    <DashboardLayout title="Support">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-400">
          {tickets.length} ticket{tickets.length > 1 ? "s" : ""}
        </p>
        <Button onClick={() => setShowForm(!showForm)} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Nouveau ticket
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Créer un ticket</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Sujet</Label>
              <Input
                placeholder="Résumé de votre demande"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Catégorie</Label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white"
              >
                <option value="general">Général</option>
                <option value="commission">Commission</option>
                <option value="payment">Paiement</option>
                <option value="technical">Technique</option>
                <option value="other">Autre</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <textarea
                className="w-full h-32 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white resize-none"
                placeholder="Décrivez votre problème en détail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Envoi..." : "Envoyer"}
              </Button>
              <Button variant="ghost" onClick={() => setShowForm(false)}>Annuler</Button>
            </div>
          </div>
        </Card>
      )}

      <Card>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />)}
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-12">
            <Headphones className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500">Aucun ticket</p>
            <p className="text-xs text-gray-600 mt-1">Créez un ticket pour contacter le support</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-sm font-medium text-white">{ticket.subject}</p>
                    <p className="text-xs text-gray-500">{ticket.category} • {formatDate(ticket.created_at)}</p>
                  </div>
                </div>
                <Badge variant={ticket.status === "open" ? "warning" : ticket.status === "resolved" ? "success" : "info"}>
                  {getStatusLabel(ticket.status)}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </DashboardLayout>
  );
}