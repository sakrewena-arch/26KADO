import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

type TicketMessagePayload = {
  ticket_id: string;
  message: string;
};

export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => null)) as TicketMessagePayload | null;

  if (!payload?.ticket_id || !payload?.message?.trim()) {
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

  if (
    profileError ||
    !profile ||
    (profile.role !== "admin" && profile.role !== "super_admin" && profile.role !== "moderator")
  ) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { data: ticket, error: ticketError } = await supabase
    .from("support_tickets")
    .select("status")
    .eq("id", payload.ticket_id)
    .single();

  if (ticketError || !ticket) {
    return NextResponse.json({ error: "Ticket introuvable" }, { status: 404 });
  }

  const { data: message, error: messageError } = await supabase
    .from("ticket_messages")
    .insert({
      ticket_id: payload.ticket_id,
      user_id: user.id,
      message: payload.message.trim(),
    })
    .select()
    .single();

  if (messageError || !message) {
    return NextResponse.json({ error: messageError?.message || "Impossible d'envoyer le message" }, { status: 500 });
  }

  if (ticket.status === "open") {
    await supabase
      .from("support_tickets")
      .update({ status: "in_progress" })
      .eq("id", payload.ticket_id);
  }

  return NextResponse.json(message);
}
