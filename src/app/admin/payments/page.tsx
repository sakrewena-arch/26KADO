"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { getAllUsers } from "@/lib/supabase/queries";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CreditCard, Send } from "lucide-react";
import type { Profile } from "@/types";

export default function AdminPaymentsPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [amount, setAmount] = useState("");

  useEffect(() => {
    getAllUsers().then(setUsers);
  }, []);

  const handleManualPayment = async () => {
    if (!selectedUserId || !amount) return;
    // Simulation d'un paiement manuel PayDunya
    await fetch("/api/paydunya/init", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: Number(amount), user_id: selectedUserId, type: "manual" }),
    });
    setAmount("");
    setSelectedUserId("");
  };

  return (
    <AdminLayout title="Paiements">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-white mb-4">Paiement manuel</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Utilisateur</Label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white"
              >
                <option value="">Sélectionner</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Montant (FCFA)</Label>
              <Input type="number" placeholder="50000" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <Button className="w-full" onClick={handleManualPayment} disabled={!selectedUserId || !amount}>
              <Send className="w-4 h-4 mr-2" /> Payer via PayDunya
            </Button>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-white mb-4">Transactions récentes</h3>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-400" />
                  <div>
                    <p className="text-xs text-white">Paiement #{i}</p>
                    <p className="text-[10px] text-gray-500">Utilisateur #{i}</p>
                  </div>
                </div>
                <Badge variant="success" className="text-[10px]">Complété</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}