import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

type TicketUpdatePayload = {
  ticket_id: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  admin_note?: string;
};

export async function PATCH(request: NextRequest) {
  const payload = (await request.json().catch(() => null)) as TicketUpdatePayload | null;

  if (!payload?.ticket_id || !payload?.status) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
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
          // no-op
        },
      },
    }
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || (profile.role !== "admin" && profile.role !== "super_admin" && profile.role !== "moderator")) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { error } = await supabase
    .from("support_tickets")
    .update({ status: payload.status, admin_note: payload.admin_note })
    .eq("id", payload.ticket_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ status: payload.status });
}
