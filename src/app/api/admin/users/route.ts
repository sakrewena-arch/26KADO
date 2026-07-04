import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

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

  // Ne pas pouvoir se bannir soi-même
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

  // Support: ?id=xxx (single) ou body { user_ids: [...] } (bulk)
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

  // Filtrer l'utilisateur courant
  userIds = userIds.filter(id => id !== user.id);

  if (userIds.length === 0) {
    return NextResponse.json({ error: "Aucun utilisateur à supprimer" }, { status: 400 });
  }

  // Anonymiser les profils (marquer comme supprimé)
  const prefix = `deleted-${Date.now()}`;
  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      email: `${prefix}@deleted.com`,
      full_name: "Utilisateur supprimé",
      is_active: false,
      phone: null,
      avatar_url: null,
    })
    .in("id", userIds);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, deleted: userIds.length });
}
