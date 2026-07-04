import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = "FCFA"): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ` ${currency}`;
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function generateReferralCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "26KADO-";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

export function getBadgeColor(type: string): string {
  const colors: Record<string, string> = {
    bronze: "from-amber-700 to-amber-500",
    silver: "from-gray-400 to-gray-300",
    gold: "from-yellow-600 to-yellow-400",
    platinum: "from-cyan-600 to-cyan-400",
    diamond: "from-blue-600 to-purple-500",
  };
  return colors[type] || "from-gray-600 to-gray-400";
}

export function getLevelColor(level: string): string {
  const colors: Record<string, string> = {
    bronze: "text-amber-600",
    silver: "text-gray-400",
    gold: "text-yellow-500",
    platinum: "text-cyan-400",
    diamond: "text-purple-500",
  };
  return colors[level] || "text-gray-400";
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: "text-yellow-500 bg-yellow-500/10",
    validated: "text-green-500 bg-green-500/10",
    paid: "text-blue-500 bg-blue-500/10",
    rejected: "text-red-500 bg-red-500/10",
    open: "text-yellow-500 bg-yellow-500/10",
    in_progress: "text-blue-500 bg-blue-500/10",
    resolved: "text-green-500 bg-green-500/10",
    closed: "text-gray-500 bg-gray-500/10",
    info_requested: "text-orange-500 bg-orange-500/10",
  };
  return colors[status] || "text-gray-500 bg-gray-500/10";
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: "En attente",
    validated: "Validé",
    paid: "Payé",
    rejected: "Refusé",
    open: "Ouvert",
    in_progress: "En cours",
    resolved: "Résolu",
    closed: "Fermé",
    info_requested: "Info demandée",
  };
  return labels[status] || status;
}