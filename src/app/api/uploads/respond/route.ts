import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(request: NextRequest) {
  const payload = await request.json().catch(() => null);

  if (!payload?.upload_id || !payload?.comments) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll() { /* no-op */ },
      },
    }
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  // Vérifier que l'upload appartient bien à l'utilisateur
  const { data: upload, error: uploadError } = await supabase
    .from("uploads")
    .select("id, user_id, status, images")
    .eq("id", payload.upload_id)
    .single();

  if (uploadError || !upload) {
    return NextResponse.json({ error: "Validation introuvable" }, { status: 404 });
  }

  if (upload.user_id !== user.id) {
    return NextResponse.json({ error: "Cette validation ne vous appartient pas" }, { status: 403 });
  }

  if (upload.status !== "info_requested") {
    return NextResponse.json({ error: "Cette validation n'est pas en attente d'informations" }, { status: 400 });
  }

  // Mettre à jour : repasser en pending, ajouter les nouveaux commentaires et images
  const updates: Record<string, unknown> = {
    status: "pending",
    comments: payload.comments,
  };

  if (payload.new_images && Array.isArray(payload.new_images) && payload.new_images.length > 0) {
    // Fusionner les anciennes et nouvelles images
    const existingImages = (upload.images as string[]) || [];
    updates.images = [...existingImages, ...payload.new_images];
  }

  const { error: updateError } = await supabase
    .from("uploads")
    .update(updates)
    .eq("id", payload.upload_id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, status: "pending" });
}