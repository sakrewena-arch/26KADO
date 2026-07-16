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

  // Vérifier que l'utilisateur est admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { counter, restore, log_id } = payload;

  // Si c'est une restauration
  if (restore && log_id) {
    const { data: log } = await supabase
      .from("admin_counter_logs")
      .select("*")
      .eq("id", log_id)
      .single();

    if (!log) {
      return NextResponse.json({ error: "Log introuvable" }, { status: 404 });
    }

    // Restaurer la valeur précédente dans admin_stats
    const { error: updateError } = await supabase
      .from("admin_stats")
      .update({ [log.counter_type]: log.previous_value })
      .eq("id", 1);

    if (updateError) {
      return NextResponse.json({ error: "Erreur lors de la restauration" }, { status: 500 });
    }

    // Supprimer le log
    await supabase.from("admin_counter_logs").delete().eq("id", log_id);

    return NextResponse.json({ success: true, message: "Compteur restauré" });
  }

  // Reset des compteurs
  const { data: currentStats } = await supabase
    .from("admin_stats")
    .select("*")
    .eq("id", 1)
    .single();

  if (!currentStats) {
    return NextResponse.json({ error: "Stats introuvables" }, { status: 404 });
  }

  const countersToReset = counter === "all"
    ? ["total_commissions", "total_withdrawals", "total_deposits", "total_revenue"]
    : [counter];

  const logs = countersToReset.map((c: string) => ({
    counter_type: c,
    previous_value: currentStats[c] || 0,
    new_value: 0,
    reset_by: user.id,
  }));

  // Créer les logs
  const { error: logError } = await supabase
    .from("admin_counter_logs")
    .insert(logs);

  if (logError) {
    return NextResponse.json({ error: "Erreur lors de la création des logs" }, { status: 500 });
  }

  // Mettre à jour les compteurs
  const updates: Record<string, number> = {};
  countersToReset.forEach((c: string) => { updates[c] = 0; });

  const { error: updateError } = await supabase
    .from("admin_stats")
    .update(updates)
    .eq("id", 1);

  if (updateError) {
    return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: counter === "all" ? "Tous les compteurs ont été remis à zéro" : `Compteur "${counter}" remis à zéro`,
  });
}