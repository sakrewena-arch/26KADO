import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ============================================
// FORMATAGE MONÉTAIRE
// ============================================
export function formatCurrency(amount: number): string {
  if (!amount && amount !== 0) return "0 FCFA"
  return `${amount.toLocaleString()} FCFA`
}

// ============================================
// FORMATAGE DATE
// ============================================
export function formatDate(dateStr: string): string {
  if (!dateStr) return ""
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// ============================================
// STATUT LABEL
// ============================================
const statusLabels: Record<string, string> = {
  pending: "En attente",
  validated: "Validé",
  paid: "Payé",
  rejected: "Refusé",
  open: "Ouvert",
  in_progress: "En cours",
  resolved: "Résolu",
  closed: "Fermé",
  active: "Actif",
  inactive: "Inactif",
}

export function getStatusLabel(status: string): string {
  return statusLabels[status] || status
}

// ============================================
// INITIALES
// ============================================
export function getInitials(name: string): string {
  if (!name) return "?"
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}