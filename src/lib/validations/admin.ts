import { z } from "zod";

// Schemas using z.coerce for HTML form compatibility
export const badgeSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  type: z.enum(["bronze", "silver", "gold", "platinum", "diamond"]),
  icon: z.string().min(1, "L'icône est requise"),
  description: z.string().min(5, "La description doit contenir au moins 5 caractères"),
  min_commission: z.coerce.number().min(0, "La commission minimale doit être positive"),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Couleur invalide"),
});

export const levelSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  min_commission: z.coerce.number().min(0, "La commission min doit être positive"),
  max_commission: z.coerce.number().min(0, "La commission max doit être positive"),
  icon: z.string().min(1, "L'icône est requise"),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Couleur invalide"),
});

export const faqCategorySchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  slug: z.string().min(2, "Le slug doit contenir au moins 2 caractères").regex(/^[a-z0-9-]+$/, "Slug invalide"),
  sort_order: z.coerce.number(),
});

export const faqSchema = z.object({
  category_id: z.string().uuid("Catégorie invalide"),
  question: z.string().min(5, "La question doit contenir au moins 5 caractères"),
  answer: z.string().min(10, "La réponse doit contenir au moins 10 caractères"),
  is_published: z.coerce.boolean(),
  sort_order: z.coerce.number(),
});

export const resourceSchema = z.object({
  title: z.string().min(2, "Le titre doit contenir au moins 2 caractères"),
  type: z.enum(["banner", "image", "text", "ad", "video"]),
  file_url: z.string().optional().or(z.literal("")),
  content: z.string().optional(),
  is_active: z.coerce.boolean(),
});

export const whatsappSchema = z.object({
  url: z.string().url("URL WhatsApp invalide"),
  label: z.string().min(2, "Le libellé doit contenir au moins 2 caractères"),
  is_active: z.coerce.boolean(),
});

export const notificationSchema = z.object({
  title: z.string().min(2, "Le titre doit contenir au moins 2 caractères"),
  message: z.string().min(5, "Le message doit contenir au moins 5 caractères"),
  type: z.enum(["commission", "validation", "payment", "referral", "badge", "level", "announcement", "withdrawal", "ticket"]),
  user_id: z.string().optional(),
  sendToAll: z.coerce.boolean(),
});

export const bookmakerSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  slug: z.string().min(2, "Le slug doit contenir au moins 2 caractères"),
  logo_url: z.string().optional().or(z.literal("")),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Couleur invalide"),
  description: z.string().min(10, "La description doit contenir au moins 10 caractères"),
  bonus: z.string().min(2, "Le bonus doit contenir au moins 2 caractères"),
  promo_code: z.string().min(1, "Le code promo est requis"),
  is_active: z.coerce.boolean(),
  sort_order: z.coerce.number(),
});

export const settingSchema = z.object({
  key: z.string().min(2, "La clé doit contenir au moins 2 caractères"),
  value: z.any(),
  type: z.enum(["string", "number", "boolean", "json"]),
});

export type BadgeInput = z.infer<typeof badgeSchema>;
export type LevelInput = z.infer<typeof levelSchema>;
export type FaqCategoryInput = z.infer<typeof faqCategorySchema>;
export type FaqInput = z.infer<typeof faqSchema>;
export type ResourceInput = z.infer<typeof resourceSchema>;
export type WhatsAppInput = z.infer<typeof whatsappSchema>;
export type NotificationInput = z.infer<typeof notificationSchema>;
export type BookmakerInput = z.infer<typeof bookmakerSchema>;
export type SettingInput = z.infer<typeof settingSchema>;