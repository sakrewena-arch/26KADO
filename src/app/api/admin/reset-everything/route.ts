import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null);

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

  // Vérifier l'authentification admin
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["super_admin", "admin", "moderator"].includes(profile.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  // Si email et password sont fournis, vérifier les credentials admin
  if (payload?.email && payload?.password) {
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: payload.email,
      password: payload.password,
    });
    if (signInError) {
      return NextResponse.json({ error: "Identifiants admin incorrects" }, { status: 401 });
    }
  }

  // Réinitialiser tous les compteurs à 0 dans settings
  const COUNTER_KEYS = ["total_commissions", "total_withdrawals", "total_deposits", "total_revenue"];

  // Sauvegarder les logs avant reset
  const { data: settingsData } = await supabase
    .from("settings")
    .select("*")
    .in("key", COUNTER_KEYS);

  const timestamp = Date.now();
  if (settingsData) {
    for (const s of settingsData) {
      await supabase.from("settings").upsert({
        key: `log_${timestamp}_${s.key}`,
        value: JSON.stringify({
          counter_type: s.key,
          previous_value: Number(s.value) || 0,
          new_value: 0,
          reset_by: user.id,
          timestamp,
        }),
        type: "string",
      });
    }
  }

  // Mettre tous les compteurs à 0
  for (const key of COUNTER_KEYS) {
    await supabase.from("settings").upsert({ key, value: "0", type: "number" });
  }

  return NextResponse.json({
    success: true,
    message: "Tous les compteurs ont été remis à zéro",
  });
}