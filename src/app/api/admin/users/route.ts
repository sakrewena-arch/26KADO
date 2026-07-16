import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Service role client pour les opérations admin (suppression auth.users)
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

export async function PATCH(request: NextRequest) {
  const payload = await request.json().catch(() => null);

  if (!payload?.user_id || !payload?.action) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
  }

  if (!["ban", "unban"].includes(payload.action)) {
    return NextResponse.json({ error: "Action invalide" }, { status: 400 });
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["super_admin", "admin"].includes(profile.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  if (payload.user_id === user.id) {
    return NextResponse.json({ error: "Vous ne pouvez pas vous bannir vous-même" }, { status: 400 });
  }

  const isActive = payload.action === "unban";

  const { error } = await supabase
    .from("profiles")
    .update({ is_active: isActive })
    .eq("id", payload.user_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, is_active: isActive });
}

export async function DELETE(request: NextRequest) {
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["super_admin", "admin"].includes(profile.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const singleId = searchParams.get("id");

  let userIds: string[];
  if (singleId) {
    userIds = [singleId];
  } else {
    const payload = await request.json().catch(() => null);
    if (!payload?.user_ids || !Array.isArray(payload.user_ids) || payload.user_ids.length === 0) {
      return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
    }
    userIds = payload.user_ids;
  }

  userIds = userIds.filter(id => id !== user.id);

  if (userIds.length === 0) {
    return NextResponse.json({ error: "Aucun utilisateur à supprimer" }, { status: 400 });
  }

  // Utiliser le Service Role Key pour supprimer les utilisateurs de auth.users
  const adminClient = getAdminClient();
  const deleted = [];
  const errors = [];

  for (const uid of userIds) {
    // 1. Anonymiser le profil d'abord
    await supabase
      .from("profiles")
      .update({
        full_name: "Utilisateur supprimé",
        is_active: false,
        phone: null,
        avatar_url: null,
      })
      .eq("id", uid);

    // 2. Supprimer de auth.users (nécessite Service Role Key)
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(uid);
    if (deleteError) {
      errors.push({ uid, error: deleteError.message });
      console.error("Erreur suppression auth user:", uid, deleteError);
    } else {
      deleted.push(uid);
    }
  }

  return NextResponse.json({
    success: true,
    deleted: deleted.length,
    errors: errors.length > 0 ? errors : undefined,
    message: errors.length > 0
      ? `${deleted.length} supprimé(s), ${errors.length} erreur(s)`
      : `${deleted.length} utilisateur(s) définitivement supprimé(s)`,
  });
}