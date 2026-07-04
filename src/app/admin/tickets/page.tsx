"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getAllTickets } from "@/lib/supabase/queries";
import { formatDate, getStatusLabel } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Headphones, MessageSquare, Send } from "lucide-react";
import type { SupportTicket } from "@/types";

export default function AdminTicketsPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [reply, setReply] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    getAllTickets()
      .then((data) => {
        setTickets(data || []);
        setLoading(false);
      })
      .catch((err: unknown) => {
        console.error("Failed to load tickets", err);
        const message = err instanceof Error ? err.message : String(err);
        setError(message || "Erreur de chargement des tickets.");
        setLoading(false);
      });
  }, []);

  const refreshTickets = async () => {
    try {
      const updated = await getAllTickets();
      setTickets(updated || []);
      return updated || [];
    } catch (err: unknown) {
      console.error("Failed to refresh tickets", err);
      const message = err instanceof Error ? err.message : String(err);
      setError(message || "Erreur de rafraÃ®chissement des tickets.");
      return tickets;
    }
  };

  const handleStatus = async (id: string, status: "open" | "in_progress" | "resolved" | "closed") => {
    try {
      setError(null);
      await fetch("/api/admin/tickets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticket_id: id, status }),
      });
      const updated = await refreshTickets();
      if (selectedTicket?.id === id) {
        setSelectedTicket(updated.find((t) => t.id === id) || null);
      }
    } catch (err: any) {
      console.error("Failed to update ticket status", err);
      setError(err?.message || "Erreur lors de la mise Ã  jour du ticket.");
    }
  };

  const handleReply = async () => {
    if (!reply || !selectedTicket) return;

    try {
      setError(null);
      await fetch("/api/ticket-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticket_id: selectedTicket.id, message: reply, admin_id: user?.id }),
      });
      setReply("");
      const updated = await refreshTickets();
      setSelectedTicket(updated.find((t) => t.id === selectedTicket.id) || null);
    } catch (err: any) {
      console.error("Failed to send ticket reply", err);
      setError(err?.message || "Erreur lors de lâ€™envoi de la rÃ©ponse.");
    }
  };

  const openTickets = tickets.filter((t) => t.status === "open" || t.status === "in_progress");

  return (
    <AdminLayout title="Tickets Support">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <h3 className="text-lg font-semibold text-white mb-4">Tickets ({openTickets.length} ouverts)</h3>
          {loading ? (
            <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />)}</div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className={`p-3 rounded-xl cursor-pointer transition-colors ${
                    selectedTicket?.id === ticket.id ? "bg-blue-500/10 border border-blue-500/20" : "bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-medium text-white truncate">{ticket.subject}</p>
                    <Badge variant={ticket.status === "open" ? "warning" : ticket.status === "resolved" ? "success" : "info"} className="text-[10px]">
                      {getStatusLabel(ticket.status)}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-gray-500">{ticket.user?.full_name} â€¢ {formatDate(ticket.created_at)}</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="lg:col-span-2">
          {selectedTicket ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">{selectedTicket.subject}</h3>
                  <p className="text-xs text-gray-500">{selectedTicket.user?.full_name} â€¢ {selectedTicket.category} â€¢ {formatDate(selectedTicket.created_at)}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="default" onClick={() => handleStatus(selectedTicket.id, "resolved")}>RÃ©soudre</Button>
                  <Button size="sm" variant="destructive" onClick={() => handleStatus(selectedTicket.id, "closed")}>Fermer</Button>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-white/5 mb-4">
                <p className="text-sm text-gray-300">{selectedTicket.description}</p>
              </div>
              {selectedTicket.messages?.map((msg) => (
                <div key={msg.id} className="p-3 rounded-xl bg-white/5 mb-2">
                  <p className="text-xs text-gray-500 mb-1">{msg.user?.full_name || "Admin"}</p>
                  <p className="text-sm text-gray-300">{msg.message}</p>
                </div>
              ))}
              <div className="flex gap-2 mt-4">
                <Input placeholder="Votre rÃ©ponse..." value={reply} onChange={(e) => setReply(e.target.value)} />
                <Button size="sm" onClick={handleReply} disabled={!reply}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <Headphones className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500">SÃ©lectionnez un ticket</p>
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
}
