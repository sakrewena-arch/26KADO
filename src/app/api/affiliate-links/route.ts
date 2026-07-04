import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

type AffiliateLinkPayload = {
  bookmaker_id: string;
  url: string;
};

export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => null)) as AffiliateLinkPayload | null;

  if (!payload?.bookmaker_id || !payload?.url) {
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {
          // No-op: no auth cookie update required for this route.
        },
      },
    }
  );

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || (profile.role !== "admin" && profile.role !== "super_admin")) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("affiliate_links")
    .insert({ bookmaker_id: payload.bookmaker_id, url: payload.url, is_active: true })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
