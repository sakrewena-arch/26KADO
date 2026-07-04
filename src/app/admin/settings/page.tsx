"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSettings, updateSettings } from "@/lib/supabase/queries";
import { Settings, Save } from "lucide-react";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSettings().then((data) => {
      const map: Record<string, any> = {};
      data.forEach((s) => { map[s.key] = s.value; });
      setSettings(map);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    const entries = Object.entries(settings).map(([key, value]) => ({ key, value }));
    await updateSettings(entries);
  };

  const fields = [
    { key: "site_name", label: "Nom du site", type: "text" },
    { key: "site_description", label: "Description", type: "text" },
    { key: "referral_commission_rate", label: "Taux commission parrainage (%)", type: "number" },
    { key: "min_withdrawal", label: "Retrait minimum (FCFA)", type: "number" },
    { key: "max_withdrawal", label: "Retrait maximum (FCFA)", type: "number" },
    { key: "currency", label: "Devise", type: "text" },
    { key: "whatsapp_group_url", label: "Lien groupe WhatsApp", type: "text" },
    { key: "contact_email", label: "Email de contact", type: "email" },
  ];

  return (
    <AdminLayout title="Paramètres">
      <Card>
        <h3 className="text-lg font-semibold text-white mb-6">Configuration du site</h3>
        {loading ? (
          <div className="space-y-4">{[1, 2, 3, 4].map((i) => <div key={i} className="h-12 rounded-xl bg-white/5 animate-pulse" />)}</div>
        ) : (
          <div className="space-y-4">
            {fields.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label>{field.label}</Label>
                <Input
                  type={field.type}
                  value={settings[field.key] || ""}
                  onChange={(e) => setSettings({ ...settings, [field.key]: e.target.value })}
                />
              </div>
            ))}
            <Button onClick={handleSave} className="mt-4">
              <Save className="w-4 h-4 mr-2" /> Enregistrer
            </Button>
          </div>
        )}
      </Card>
    </AdminLayout>
  );
}