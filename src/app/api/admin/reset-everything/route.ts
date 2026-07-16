import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const anonUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null);
  if (!payload || !payload.email || !payload.password) {
    return NextResponse.json({ error: "Email et mot de passe admin requis" }, { status: 400 });
  }

  if (!anonUrl || !anonKey || !serviceRoleKey) {
    return NextResponse.json({ error: "Configuration Supabase manquante" }, { status: 500 });
  }

  const authClient = createClient(anonUrl, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data: authData, error: authError } = await authClient.auth.signInWithPassword({
    email: String(payload.email).trim().toLowerCase(),
    password: String(payload.password),
  });

  if (authError || !authData?.user) {
    return NextResponse.json({ error: "Identifiants admin invalides" }, { status: 401 });
  }

  const { data: profile, error: profileError } = await authClient
    .from("profiles")
    .select("role")
    .eq("id", authData.user.id)
    .single();

  if (profileError || !profile || !["super_admin", "admin"].includes(profile.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const adminClient = createClient(anonUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const operations = [
    adminClient.from("withdrawal_requests").delete().neq("id", "0"),
    adminClient.from("commissions").delete().neq("id", "0"),
    adminClient.from("wallet_transactions").delete().neq("id", "0"),
    adminClient.from("payment_transactions").delete().neq("id", "0"),
    adminClient.from("admin_counter_logs").delete().neq("id", "0"),
    adminClient.from("wallets").update({ balance: 0, total_earned: 0, total_withdrawn: 0 }),
    adminClient.from("profiles").update({
      total_commission: 0,
      total_referrals: 0,
      total_validations: 0,
      total_clicks: 0,
    }),
  ];

  const results = [];
  for (const op of operations) {
    const result = await op;
    if (result.error) {
      results.push(result.error.message);
    }
  }

  const adminStatsResponse = await adminClient
    .from("admin_stats")
    .select("id")
    .eq("id", 1)
    .single();

  if (adminStatsResponse.error && adminStatsResponse.error.code !== "PGRST116") {
    results.push(adminStatsResponse.error.message);
  }

  if (!adminStatsResponse.data) {
    const insertStats = await adminClient
      .from("admin_stats")
      .insert({ id: 1, total_withdrawals: 0, total_deposits: 0, total_revenue: 0 });
    if (insertStats.error) results.push(insertStats.error.message);
  } else {
    const updateStats = await adminClient
      .from("admin_stats")
      .update({ total_withdrawals: 0, total_deposits: 0, total_revenue: 0 })
      .eq("id", 1);
    if (updateStats.error) results.push(updateStats.error.message);
  }

  if (results.length > 0) {
    return NextResponse.json({ error: "Erreur lors de la réinitialisation totale", details: results }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: "Réinitialisation totale effectuée : compteurs remis à zéro et données financières supprimées.",
  });
}
