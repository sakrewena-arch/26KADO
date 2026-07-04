import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

type WithdrawalUpdatePayload = {
  withdrawal_id: string;
  status: "pending" | "validated" | "paid" | "rejected";
  admin_note?: string;
};

export async function PATCH(request: NextRequest) {
  const payload = (await request.json().catch(() => null)) as WithdrawalUpdatePayload | null;

  if (!payload?.withdrawal_id || !payload?.status) {
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

  if (profileError || !profile || (profile.role !== "admin" && profile.role !== "super_admin")) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  // Récupérer la demande de retrait
  const { data: withdrawal, error: fetchError } = await supabase
    .from("withdrawal_requests")
    .select("user_id, amount, status")
    .eq("id", payload.withdrawal_id)
    .single();

  if (fetchError || !withdrawal) {
    return NextResponse.json({ error: "Demande de retrait introuvable" }, { status: 404 });
  }

  // Si le statut passe à "paid", mettre à jour le wallet
  if (payload.status === "paid" && withdrawal.status !== "paid") {
    // Récupérer le wallet
    const { data: wallet, error: walletError } = await supabase
      .from("wallets")
      .select("id, balance, total_withdrawn")
      .eq("user_id", withdrawal.user_id)
      .single();

    if (walletError || !wallet) {
      return NextResponse.json({ error: "Portefeuille introuvable" }, { status: 404 });
    }

    if (Number(wallet.balance) < Number(withdrawal.amount)) {
      return NextResponse.json({ error: "Solde insuffisant" }, { status: 400 });
    }

    // Mettre à jour le wallet
    const { error: walletUpdateError } = await supabase
      .from("wallets")
      .update({
        balance: Number(wallet.balance) - Number(withdrawal.amount),
        total_withdrawn: Number(wallet.total_withdrawn) + Number(withdrawal.amount),
      })
      .eq("id", wallet.id);

    if (walletUpdateError) {
      return NextResponse.json({ error: "Erreur lors de la mise à jour du portefeuille" }, { status: 500 });
    }

    // Créer une transaction de débit
    const { error: txError } = await supabase
      .from("wallet_transactions")
      .insert({
        wallet_id: wallet.id,
        type: "debit",
        amount: Number(withdrawal.amount),
        source: "withdrawal",
        description: `Retrait #${payload.withdrawal_id.slice(0, 8)}`,
        reference_id: payload.withdrawal_id,
      });

    if (txError) {
      return NextResponse.json({ error: txError.message }, { status: 500 });
    }
  }

  // Mettre à jour le statut de la demande
  const { error } = await supabase
    .from("withdrawal_requests")
    .update({ status: payload.status, admin_note: payload.admin_note, updated_at: new Date().toISOString() })
    .eq("id", payload.withdrawal_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ status: payload.status });
}