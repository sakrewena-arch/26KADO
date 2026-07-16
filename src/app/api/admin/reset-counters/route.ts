import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null);
  if (!payload || !payload.counter) {
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["super_admin", "admin", "moderator"].includes(profile.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { counter, restore, log_id } = payload;

  // ====== UTILISATION DE LA TABLE settings (déjà existante) ======
  // Les compteurs sont stockés dans settings avec les clés :
  // total_commissions, total_withdrawals, total_deposits, total_revenue

  const COUNTER_KEYS = ["total_commissions", "total_withdrawals", "total_deposits", "total_revenue"];

  // Restauration
  if (restore && log_id) {
    // Récupérer la valeur sauvegardée dans un log (stocké dans settings aussi)
    const { data: logData } = await supabase
      .from("settings")
      .select("*")
      .eq("key", `log_${log_id}`)
      .single();

    if (!logData) {
      return NextResponse.json({ error: "Log introuvable" }, { status: 404 });
    }

    const logEntry = JSON.parse(logData.value);
    await supabase.from("settings").upsert({
      key: logEntry.counter_type,
      value: String(logEntry.previous_value),
      type: "number",
    });

    await supabase.from("settings").delete().eq("key", `log_${log_id}`);

    return NextResponse.json({ success: true, message: "Compteur restauré" });
  }

  // Récupérer les valeurs actuelles
  const { data: settingsData } = await supabase
    .from("settings")
    .select("*")
    .in("key", COUNTER_KEYS);

  const currentValues: Record<string, number> = {};
  if (settingsData) {
    settingsData.forEach((s: any) => {
      currentValues[s.key] = Number(s.value) || 0;
    });
  }

  // S'assurer que toutes les clés existent
  for (const key of COUNTER_KEYS) {
    if (!(key in currentValues)) {
      currentValues[key] = 0;
      await supabase.from("settings").upsert({ key, value: "0", type: "number" });
    }
  }

  const countersToReset = counter === "all" ? COUNTER_KEYS : [counter];

  // Sauvegarder les logs (dans settings avec préfixe log_)
  const timestamp = Date.now();
  for (const c of countersToReset) {
    const logEntry = {
      counter_type: c,
      previous_value: currentValues[c] || 0,
      new_value: 0,
      reset_by: user.id,
      timestamp,
    };
    await supabase.from("settings").upsert({
      key: `log_${timestamp}_${c}`,
      value: JSON.stringify(logEntry),
      type: "string",
    });
  }

  // Mettre à jour les compteurs à 0
  for (const c of countersToReset) {
    await supabase.from("settings").upsert({ key: c, value: "0", type: "number" });
  }

  return NextResponse.json({
    success: true,
    message: counter === "all" ? "Tous les compteurs ont été remis à zéro" : `Compteur "${counter}" remis à zéro`,
  });
}