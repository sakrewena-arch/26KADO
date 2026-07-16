"use client";

import { useEffect, useRef, useState } from "react";
import { Period, PERIOD_SHORT } from "@/components/ui/period-filter";

interface TrafficPoint {
  label: string;
  visits: number;
  actions: number;
}

interface TrafficChartProps {
  title?: string;
  color1?: string;
  color2?: string;
  className?: string;
}

// Génère des données de trafic simulées basées sur la période
function generateTrafficData(period: Period): TrafficPoint[] {
  const now = new Date();
  const data: TrafficPoint[] = [];

  switch (period) {
    case "today": {
      // Données par heure (24h)
      for (let h = 0; h < 24; h++) {
        const hour = h;
        // Pic le matin (9h-11h) et le soir (18h-21h)
        const base = hour >= 8 && hour <= 11 ? 80 : hour >= 17 && hour <= 21 ? 100 : 30;
        const visits = Math.floor(base + Math.random() * 40);
        const actions = Math.floor(visits * (0.3 + Math.random() * 0.4));
        data.push({ label: `${hour}h`, visits, actions });
      }
      break;
    }
    case "week": {
      // Données par jour de la semaine
      const days = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const base = d.getDay() === 0 || d.getDay() === 6 ? 50 : 120; // week-end vs semaine
        const visits = Math.floor(base + Math.random() * 60);
        const actions = Math.floor(visits * (0.3 + Math.random() * 0.4));
        data.push({ label: days[d.getDay()], visits, actions });
      }
      break;
    }
    case "month": {
      // Données par jour du mois (30 jours)
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const base = 40 + Math.sin(i * 0.5) * 30 + Math.random() * 30;
        const visits = Math.floor(base + Math.random() * 20);
        const actions = Math.floor(visits * (0.3 + Math.random() * 0.3));
        data.push({ label: `${d.getDate()}`, visits, actions });
      }
      break;
    }
    case "year": {
      // Données par mois
      const months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
      for (let i = 11; i >= 0; i--) {
        const m = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const base = 800 + Math.sin(i * 0.8) * 400 + Math.random() * 300;
        const visits = Math.floor(base);
        const actions = Math.floor(visits * (0.3 + Math.random() * 0.2));
        data.push({ label: months[m.getMonth()], visits, actions });
      }
      break;
    }
    default: {
      for (let i = 6; i >= 0; i--) {
        const visits = Math.floor(50 + Math.random() * 80);
        const actions = Math.floor(visits * 0.4);
        data.push({ label: `J${i + 1}`, visits, actions });
      }
    }
  }

  return data;
}

export default function TrafficChart({ title = "Trafic", color1 = "#10b981", color2 = "#3b82f6", className = "" }: TrafficChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [period, setPeriod] = useState<Period>("month");
  const [data, setData] = useState<TrafficPoint[]>([]);
  const [totals, setTotals] = useState({ visits: 0, actions: 0 });

  useEffect(() => {
    const newData = generateTrafficData(period);
    setData(newData);
    setTotals({
      visits: newData.reduce((s, p) => s + p.visits, 0),
      actions: newData.reduce((s, p) => s + p.actions, 0),
    });
  }, [period]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const padding = { top: 20, bottom: 25, left: 10, right: 10 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    const maxVal = Math.max(...data.map((d) => Math.max(d.visits, d.actions)), 1);

    const drawCurve = (points: number[], color: string, offset: number) => {
      const stepX = chartW / (points.length - 1);

      ctx.beginPath();
      ctx.moveTo(padding.left, padding.top + chartH - (points[0] / maxVal) * chartH);

      for (let i = 1; i < points.length; i++) {
        const x = padding.left + i * stepX;
        const y = padding.top + chartH - (points[i] / maxVal) * chartH;

        // Cubic bezier pour des courbes ondulantes
        const prevX = padding.left + (i - 1) * stepX;
        const prevY = padding.top + chartH - (points[i - 1] / maxVal) * chartH;
        const cp1x = prevX + stepX * 0.4;
        const cp2x = x - stepX * 0.4;

        ctx.bezierCurveTo(cp1x, prevY, cp2x, y, x, y);
      }

      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.stroke();

      // Fill sous la courbe (gradient)
      const lastX = padding.left + (points.length - 1) * stepX;
      const lastY = padding.top + chartH - (points[points.length - 1] / maxVal) * chartH;
      ctx.lineTo(lastX, padding.top + chartH);
      ctx.lineTo(padding.left, padding.top + chartH);
      ctx.closePath();

      const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
      gradient.addColorStop(0, color + "40");
      gradient.addColorStop(1, color + "05");
      ctx.fillStyle = gradient;
      ctx.fill();
    };

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Grille horizontale
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(w - padding.right, y);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Courbes
    drawCurve(
      data.map((d) => d.visits),
      color1,
      0
    );
    drawCurve(
      data.map((d) => d.actions),
      color2,
      0
    );

    // Labels en bas (toutes les N entrées)
    const labelStep = Math.max(1, Math.floor(data.length / 8));
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "center";
    const stepX = chartW / (data.length - 1);

    data.forEach((point, i) => {
      if (i % labelStep === 0 || i === data.length - 1) {
        const x = padding.left + i * stepX;
        ctx.fillText(point.label, x, h - 5);
      }
    });

    // Légende
    const legendY = 12;
    ctx.fillStyle = color1;
    ctx.fillRect(w - 140, legendY - 6, 10, 10);
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("Visites", w - 125, legendY + 3);

    ctx.fillStyle = color2;
    ctx.fillRect(w - 70, legendY - 6, 10, 10);
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.fillText("Actions", w - 55, legendY + 3);
  }, [data, color1, color2]);

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <div className="flex items-center gap-4 mt-1">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color1 }} />
              <span className="text-xs text-gray-400">Visites: <strong className="text-white">{totals.visits.toLocaleString()}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color2 }} />
              <span className="text-xs text-gray-400">Actions: <strong className="text-white">{totals.actions.toLocaleString()}</strong></span>
            </div>
          </div>
        </div>
        <div className="flex gap-1">
          {(["today", "week", "month", "year"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                period === p
                  ? "bg-blue-500/20 text-blue-400 shadow-sm"
                  : "text-gray-500 hover:text-white hover:bg-white/5"
              }`}
            >
              {PERIOD_SHORT[p]}
            </button>
          ))}
        </div>
      </div>

      <div className="relative w-full h-48 sm:h-64 rounded-xl bg-white/[0.02] border border-white/5 overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-white/5 text-center">
          <p className="text-[10px] text-gray-500">Par jour</p>
          <p className="text-sm font-bold text-white">
            {period === "today"
              ? Math.floor(totals.visits / 24).toLocaleString()
              : period === "year"
              ? Math.floor(totals.visits / 365).toLocaleString()
              : Math.floor(totals.visits / (data.length || 1)).toLocaleString()}
          </p>
        </div>
        <div className="p-3 rounded-xl bg-white/5 text-center">
          <p className="text-[10px] text-gray-500">Par heure</p>
          <p className="text-sm font-bold text-white">
            {period === "today"
              ? Math.floor(totals.visits / 24).toLocaleString()
              : Math.floor(totals.visits / (data.length * 24 || 1)).toLocaleString()}
          </p>
        </div>
        <div className="p-3 rounded-xl bg-white/5 text-center">
          <p className="text-[10px] text-gray-500">Pic visites</p>
          <p className="text-sm font-bold text-green-400">{Math.max(...data.map((d) => d.visits), 0).toLocaleString()}</p>
        </div>
        <div className="p-3 rounded-xl bg-white/5 text-center">
          <p className="text-[10px] text-gray-500">Pic actions</p>
          <p className="text-sm font-bold text-blue-400">{Math.max(...data.map((d) => d.actions), 0).toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}