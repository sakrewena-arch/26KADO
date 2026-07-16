"use client";

import { Filter } from "lucide-react";

export type Period = "today" | "week" | "month" | "year" | "all";

export const PERIOD_LABELS: Record<Period, string> = {
  today: "Aujourd'hui",
  week: "Cette semaine",
  month: "Ce mois",
  year: "Cette année",
  all: "Tout",
};

export const PERIOD_SHORT: Record<Period, string> = {
  today: "Jour",
  week: "Semaine",
  month: "Mois",
  year: "Année",
  all: "Tout",
};

export function isToday(dateStr: string) {
  const d = new Date(dateStr);
  const t = new Date();
  return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear();
}

export function isThisWeek(dateStr: string) {
  const d = new Date(dateStr);
  const t = new Date();
  const weekAgo = new Date(t);
  weekAgo.setDate(t.getDate() - t.getDay()); // dimanche de cette semaine
  return d >= weekAgo;
}

export function isThisMonth(dateStr: string) {
  const d = new Date(dateStr);
  const t = new Date();
  return d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear();
}

export function isThisYear(dateStr: string) {
  const d = new Date(dateStr);
  const t = new Date();
  return d.getFullYear() === t.getFullYear();
}

export function filterByPeriod<T extends { created_at: string }>(
  items: T[],
  period: Period
): T[] {
  switch (period) {
    case "today": return items.filter((item) => isToday(item.created_at));
    case "week": return items.filter((item) => isThisWeek(item.created_at));
    case "month": return items.filter((item) => isThisMonth(item.created_at));
    case "year": return items.filter((item) => isThisYear(item.created_at));
    default: return items;
  }
}

interface PeriodFilterProps {
  value: Period;
  onChange: (period: Period) => void;
  showLabel?: boolean;
}

export function PeriodFilter({ value, onChange, showLabel = true }: PeriodFilterProps) {
  const periods: Period[] = ["today", "week", "month", "year", "all"];

  return (
    <div className="flex items-center gap-1.5">
      {showLabel && <Filter className="w-4 h-4 text-gray-500" />}
      <div className="flex gap-1">
        {periods.map((p) => (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
              value === p
                ? "bg-blue-500/20 text-blue-400 shadow-sm"
                : "text-gray-500 hover:text-white hover:bg-white/5"
            }`}
          >
            {PERIOD_SHORT[p]}
          </button>
        ))}
      </div>
    </div>
  );
}