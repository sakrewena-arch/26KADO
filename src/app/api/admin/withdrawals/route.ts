import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

type Payload = {
  withdrawal_id?: string;
  user_id?: string;
  status: "pending" | "validated" | "paid" | "rejected" | "deposit";
  amount?: number;
  method?: string;
  admin_note?: string;
};

export async function PATCH(request: NextRequest) {
  const payload = (await request.json().catch(() => null)) as Payload | null;
  if (!payload || !payload.status) {
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

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || (profile.role !== "admin" && profile.role !== "super_admin")) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  // ==========================================
  // CAS DÉPÔT : Admin crédite un utilisateur
  // ==========================================
  if (payload.status === "deposit") {
    if (!payload.user_id || !payload.amount || payload.amount <= 0) {
      return NextResponse.json({ error: "Paramètres de dépôt invalides" }, { status: 400 });
    }

    // 1. Récupérer ou créer le wallet de l'utilisateur cible
    let { data: userWallet, error: walletError } = await supabase
      .from("wallets")
      .select("id, balance, total_earned")
      .eq("user_id", payload.user_id)
      .single();

    if (walletError || !userWallet) {
      // Créer le wallet automatiquement
      const { data: newWallet, error: createError } = await supabase
        .from("wallets")
        .insert({
          user_id: payload.user_id,
          balance: 0,
          total_earned: 0,
          total_withdrawn: 0,
        })
        .select("id, balance, total_earned")
        .single();

      if (createError || !newWallet) {
        return NextResponse.json({ error: "Impossible de créer le portefeuille" }, { status: 500 });
      }
      userWallet = newWallet;
    }

    // 2. Créditer le wallet de l'utilisateur
    const { error: creditError } = await supabase
      .from("wallets")
      .update({
        balance: Number(userWallet.balance) + Number(payload.amount),
        total_earned: Number(userWallet.total_earned) + Number(payload.amount),
      })
      .eq("id", userWallet.id);

    if (creditError) {
      return NextResponse.json({ error: "Erreur lors du crédit" }, { status: 500 });
    }

    // 3. Créer une transaction de crédit pour l'utilisateur
    await supabase.from("wallet_transactions").insert({
      wallet_id: userWallet.id,
      type: "credit",
      amount: Number(payload.amount),
      source: "deposit",
      description: `Crédit manuel par l'admin${payload.method ? ` (${payload.method})` : ""}`,
    });

    // 4. Notification à l'utilisateur
    await supabase.from("notifications").insert({
      user_id: payload.user_id,
      type: "payment",
      title: "Compte crédité",
      message: `Votre compte a été crédité de ${Number(payload.amount).toLocaleString()} FCFA.`,
    });

    return NextResponse.json({
      status: "deposit",
      message: `Dépôt de ${Number(payload.amount).toLocaleString()} FCFA effectué`,
    });
  }

  // ==========================================
  // CAS RETRAIT (paid / validated / rejected)
  // ==========================================
  if (!payload.withdrawal_id) {
    return NextResponse.json({ error: "withdrawal_id requis" }, { status: 400 });
  }

  const { data: withdrawal, error: fetchError } = await supabase
    .from("withdrawal_requests")
    .select("user_id, amount, status")
    .eq("id", payload.withdrawal_id)
    .single();

  if (fetchError || !withdrawal) {
    return NextResponse.json({ error: "Demande de retrait introuvable" }, { status: 404 });
  }

  // Si le statut passe à "paid", on débite le wallet de l'utilisateur
  if (payload.status === "paid" && withdrawal.status !== "paid") {
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

    const { error: walletUpdateError } = await supabase
      .from("wallets")
      .update({
        balance: Number(wallet.balance) - Number(withdrawal.amount),
        total_withdrawn: Number(wallet.total_withdrawn) + Number(withdrawal.amount),
      })
      .eq("id", wallet.id);

    if (walletUpdateError) {
      return NextResponse.json({ error: "Erreur de mise à jour du wallet" }, { status: 500 });
    }

    await supabase.from("wallet_transactions").insert({
      wallet_id: wallet.id,
      type: "debit",
      amount: Number(withdrawal.amount),
      source: "withdrawal",
      description: `Retrait #${payload.withdrawal_id.slice(0, 8)}`,
      reference_id: payload.withdrawal_id,
    });
  }

  // Mettre à jour le statut
  const { error } = await supabase
    .from("withdrawal_requests")
    .update({
      status: payload.status,
      admin_note: payload.admin_note,
      updated_at: new Date().toISOString(),
    })
    .eq("id", payload.withdrawal_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ status: payload.status });
}