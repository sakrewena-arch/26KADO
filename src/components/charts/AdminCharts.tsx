"use client";

import { useEffect, useRef, useState } from "react";
import { Chart, registerables } from "chart.js";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";

Chart.register(...registerables);

export function CommissionsChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("30d");

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
      const since = new Date();
      since.setDate(since.getDate() - days);

      const { data } = await supabase
        .from("commissions")
        .select("amount, created_at")
        .gte("created_at", since.toISOString())
        .eq("status", "validated")
        .order("created_at");

      if (!data || !canvasRef.current) return;

      // Group by date
      const grouped: Record<string, number> = {};
      data.forEach((c: any) => {
        const date = c.created_at.split("T")[0];
        grouped[date] = (grouped[date] || 0) + Number(c.amount);
      });

      const labels = Object.keys(grouped).sort();
      const values = labels.map((l) => grouped[l]);

      if (chartRef.current) chartRef.current.destroy();

      const ctx = canvasRef.current.getContext("2d");
      if (!ctx) return;

      chartRef.current = new Chart(ctx, {
        type: "line",
        data: {
          labels,
          datasets: [{
            label: "Commissions (FCFA)",
            data: values,
            borderColor: "#3b82f6",
            backgroundColor: "rgba(59, 130, 246, 0.1)",
            fill: true,
            tension: 0.4,
          }],
        },
        options: {
          responsive: true,
          plugins: { legend: { labels: { color: "#9ca3af" } } },
          scales: {
            x: { ticks: { color: "#6b7280" }, grid: { color: "rgba(255,255,255,0.05)" } },
            y: { ticks: { color: "#6b7280" }, grid: { color: "rgba(255,255,255,0.05)" } },
          },
        },
      });
    };

    fetchData();

    return () => { if (chartRef.current) chartRef.current.destroy(); };
  }, [period]);

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Évolution des commissions</h3>
        <div className="flex gap-2">
          {(["7d", "30d", "90d"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`text-xs px-3 py-1 rounded-lg transition-colors ${
                period === p ? "bg-blue-500/20 text-blue-400" : "text-gray-500 hover:text-white"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
      <canvas ref={canvasRef} />
    </Card>
  );
}

export function UsersChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("30d");

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
      const since = new Date();
      since.setDate(since.getDate() - days);

      const { data } = await supabase
        .from("profiles")
        .select("created_at")
        .gte("created_at", since.toISOString())
        .order("created_at");

      if (!data || !canvasRef.current) return;

      const grouped: Record<string, number> = {};
      data.forEach((p: any) => {
        const date = p.created_at.split("T")[0];
        grouped[date] = (grouped[date] || 0) + 1;
      });

      const labels = Object.keys(grouped).sort();
      const values = labels.map((l) => grouped[l]);
      const cumulative = values.reduce((acc: number[], v) => [...acc, (acc[acc.length - 1] || 0) + v], []);

      if (chartRef.current) chartRef.current.destroy();

      const ctx = canvasRef.current.getContext("2d");
      if (!ctx) return;

      chartRef.current = new Chart(ctx, {
        type: "bar",
        data: {
          labels,
          datasets: [
            {
              label: "Nouveaux utilisateurs",
              data: values,
              backgroundColor: "rgba(139, 92, 246, 0.5)",
              borderColor: "#8b5cf6",
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: { legend: { labels: { color: "#9ca3af" } } },
          scales: {
            x: { ticks: { color: "#6b7280" }, grid: { color: "rgba(255,255,255,0.05)" } },
            y: { ticks: { color: "#6b7280" }, grid: { color: "rgba(255,255,255,0.05)" } },
          },
        },
      });
    };

    fetchData();
    return () => { if (chartRef.current) chartRef.current.destroy(); };
  }, [period]);

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Nouveaux utilisateurs</h3>
        <div className="flex gap-2">
          {(["7d", "30d", "90d"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`text-xs px-3 py-1 rounded-lg transition-colors ${
                period === p ? "bg-purple-500/20 text-purple-400" : "text-gray-500 hover:text-white"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
      <canvas ref={canvasRef} />
    </Card>
  );
}

export function StatsPieChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();

      const { data: commissions } = await supabase.from("commissions").select("status");
      if (!commissions || !canvasRef.current) return;

      const counts: Record<string, number> = {};
      commissions.forEach((c: any) => {
        counts[c.status] = (counts[c.status] || 0) + 1;
      });

      const labels = Object.keys(counts);
      const values = Object.values(counts);
      const colors: Record<string, string> = {
        pending: "#f59e0b",
        validated: "#10b981",
        paid: "#3b82f6",
        rejected: "#ef4444",
      };

      if (chartRef.current) chartRef.current.destroy();

      const ctx = canvasRef.current.getContext("2d");
      if (!ctx) return;

      chartRef.current = new Chart(ctx, {
        type: "doughnut",
        data: {
          labels: labels.map((l) => l.charAt(0).toUpperCase() + l.slice(1)),
          datasets: [{
            data: values,
            backgroundColor: labels.map((l) => colors[l] || "#6b7280"),
            borderColor: "#1a1a2e",
            borderWidth: 2,
          }],
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: "bottom",
              labels: { color: "#9ca3af", padding: 12 },
            },
          },
        },
      });
    };

    fetchData();
    return () => { if (chartRef.current) chartRef.current.destroy(); };
  }, []);

  return (
    <Card>
      <h3 className="text-lg font-semibold text-white mb-4">Statut des commissions</h3>
      <canvas ref={canvasRef} />
    </Card>
  );
}