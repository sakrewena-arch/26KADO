// ============================================
// 26KADO - Supabase Storage Helpers
// ============================================

import { createClient } from "./client";

const BUCKETS = {
  UPLOADS: "uploads",
  AVATARS: "avatars",
  RESOURCES: "resources",
} as const;

export type BucketName = (typeof BUCKETS)[keyof typeof BUCKETS];

/**
 * Upload a file to Supabase Storage
 */
export async function uploadFile(
  bucket: BucketName,
  file: File,
  path?: string
): Promise<{ url: string; error: string | null }> {
  const supabase = createClient();
  const timestamp = Date.now();
  // Nettoyer le nom du fichier : supprimer espaces, accents, caractères spéciaux
  const safeName = file.name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // supprime les accents
    .replace(/[^a-zA-Z0-9._-]/g, "_") // remplace tout caractère non sûr par _
    .replace(/_+/g, "_"); // évite les underscores multiples
  const filePath = path
    ? `${path}/${timestamp}_${safeName}`
    : `${timestamp}_${safeName}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    return { url: "", error: error.message };
  }

  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return { url: urlData.publicUrl, error: null };
}

/**
 * Upload multiple files to Supabase Storage
 */
export async function uploadFiles(
  bucket: BucketName,
  files: File[],
  path?: string
): Promise<{ urls: string[]; errors: string[] }> {
  const results = await Promise.all(
    files.map((file) => uploadFile(bucket, file, path))
  );

  return {
    urls: results.filter((r) => !r.error).map((r) => r.url as string),
    errors: results.filter((r) => r.error).map((r) => r.error as string),
  };
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteFile(
  bucket: BucketName,
  filePath: string
): Promise<{ error: string | null }> {
  const supabase = createClient();

  const { error } = await supabase.storage.from(bucket).remove([filePath]);

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

/**
 * Get public URL for a file
 */
export function getPublicUrl(bucket: BucketName, filePath: string): string {
  const supabase = createClient();
  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return data.publicUrl;
}

/**
 * List all files in a bucket path
 */
export async function listFiles(
  bucket: BucketName,
  path?: string
): Promise<{ files: { name: string; url: string }[]; error: string | null }> {
  const supabase = createClient();

  const { data, error } = await supabase.storage
    .from(bucket)
    .list(path || "", { sortBy: { column: "created_at", order: "desc" } });

  if (error) {
    return { files: [], error: error.message };
  }

  const files = data
    .filter((f) => f.id && !f.id.endsWith("/")) // Filter out folders
    .map((f) => ({
      name: f.name,
      url: getPublicUrl(bucket, path ? `${path}/${f.name}` : f.name),
    }));

  return { files, error: null };
}

/**
 * Upload user avatar
 */
export async function uploadAvatar(
  userId: string,
  file: File
): Promise<{ url: string; error: string | null }> {
  return uploadFile("avatars", file, `user_${userId}`);
}

/**
 * Upload validation proof images
 */
export async function uploadProofImages(
  userId: string,
  bookmakerId: string,
  files: File[]
): Promise<{ urls: string[]; errors: string[] }> {
  return uploadFiles("uploads", files, `proofs/${userId}/${bookmakerId}`);
}

/**
 * Upload resource file (admin only)
 */
export async function uploadResource(
  file: File
): Promise<{ url: string; error: string | null }> {
  return uploadFile("resources", file, "resources");
}