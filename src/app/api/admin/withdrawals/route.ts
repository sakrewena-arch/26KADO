import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

type Payload = {
  withdrawal_id?: string;
  user_id?: string;
  status: string;
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

  // Vérifier que l'utilisateur est admin (super_admin ou admin)
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role === "user") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  // ====== CAS DÉPÔT : Admin crédite un utilisateur ======
  if (payload.status === "deposit") {
    if (!payload.user_id || !payload.amount || payload.amount <= 0) {
      return NextResponse.json({ error: "Paramètres de dépôt invalides" }, { status: 400 });
    }

    let { data: userWallet, error: walletError } = await supabase
      .from("wallets")
      .select("id, balance, total_earned")
      .eq("user_id", payload.user_id)
      .single();

    if (walletError || !userWallet) {
      const { data: newWallet, error: createError } = await supabase
        .from("wallets")
        .insert({ user_id: payload.user_id, balance: 0, total_earned: 0, total_withdrawn: 0 })
        .select("id, balance, total_earned")
        .single();
      if (createError || !newWallet) return NextResponse.json({ error: "Impossible de créer le portefeuille" }, { status: 500 });
      userWallet = newWallet;
    }

    const { error: creditError } = await supabase
      .from("wallets")
      .update({ balance: Number(userWallet.balance) + Number(payload.amount), total_earned: Number(userWallet.total_earned) + Number(payload.amount) })
      .eq("id", userWallet.id);
    if (creditError) return NextResponse.json({ error: "Erreur lors du crédit" }, { status: 500 });

    await supabase.from("wallet_transactions").insert({
      wallet_id: userWallet.id, type: "credit", amount: Number(payload.amount),
      source: "deposit", description: `Crédit manuel par l'admin${payload.method ? ` (${payload.method})` : ""}`,
    });

    await supabase.from("notifications").insert({
      user_id: payload.user_id, type: "payment", title: "Compte crédité",
      message: `Votre compte a été crédité de ${Number(payload.amount).toLocaleString()} FCFA.`,
    });

    return NextResponse.json({ success: true, status: "deposit", message: `Dépôt de ${Number(payload.amount).toLocaleString()} FCFA effectué` });
  }

  // ====== CAS ANNULATION DE DÉPÔT ======
  if (payload.status === "cancelled") {
    if (!payload.user_id || !payload.amount || payload.amount <= 0) {
      return NextResponse.json({ error: "Paramètres d'annulation invalides" }, { status: 400 });
    }
    const { data: userWallet, error: walletError } = await supabase
      .from("wallets")
      .select("id, balance, total_earned")
      .eq("user_id", payload.user_id)
      .single();
    if (walletError || !userWallet) return NextResponse.json({ error: "Portefeuille introuvable" }, { status: 404 });
    if (Number(userWallet.balance) < Number(payload.amount)) return NextResponse.json({ error: "Solde insuffisant pour annuler" }, { status: 400 });

    const { error: debitError } = await supabase
      .from("wallets")
      .update({ balance: Number(userWallet.balance) - Number(payload.amount), total_earned: Number(userWallet.total_earned) - Number(payload.amount) })
      .eq("id", userWallet.id);
    if (debitError) return NextResponse.json({ error: "Erreur lors de l'annulation" }, { status: 500 });

    await supabase.from("wallet_transactions").insert({
      wallet_id: userWallet.id, type: "debit", amount: Number(payload.amount),
      source: "cancelled", description: `Annulation de dépôt par l'admin`,
    });
    return NextResponse.json({ success: true, message: `Dépôt de ${Number(payload.amount).toLocaleString()} FCFA annulé` });
  }

  // ====== CAS RETRAIT ======
  if (!payload.withdrawal_id) {
    return NextResponse.json({ error: "withdrawal_id requis" }, { status: 400 });
  }

  // Récupérer la demande
  const { data: withdrawal } = await supabase
    .from("withdrawal_requests")
    .select("user_id, amount, status")
    .eq("id", payload.withdrawal_id)
    .single();

  if (!withdrawal) {
    return NextResponse.json({ error: "Demande de retrait introuvable" }, { status: 404 });
  }

  // Debug logs: afficher payload, utilisateur et demande récupérée
  try {
    console.log("[api/admin/withdrawals] payload:", JSON.stringify(payload));
    console.log("[api/admin/withdrawals] acting user:", user.id, "profile role:", profile?.role);
    console.log("[api/admin/withdrawals] withdrawal fetched:", JSON.stringify(withdrawal));
  } catch (e) {
    console.error("[api/admin/withdrawals] log error", e);
  }

  // Autoriser uniquement ces statuts pour les retraits
  const allowedWithdrawalStatuses = ["paid", "rejected"];
  if (!allowedWithdrawalStatuses.includes(payload.status)) {
    return NextResponse.json({ error: "Statut non autorisé pour les retraits" }, { status: 400 });
  }

  // Si le statut passe à "paid", débiter le wallet (le montant avait été réservé au moment de la demande)
  if (payload.status === "paid") {
    const { data: wallet } = await supabase
      .from("wallets")
      .select("id, balance, total_withdrawn")
      .eq("user_id", withdrawal.user_id)
      .single();

    if (wallet) {
      const amount = Number(withdrawal.amount);
      // S'assurer que le solde est suffisant (normalement oui car débité à la création)
      if (Number(wallet.balance) >= amount) {
        await supabase
          .from("wallets")
          .update({
            balance: Number(wallet.balance) - amount,
            total_withdrawn: Number(wallet.total_withdrawn) + amount,
          })
          .eq("id", wallet.id);

        await supabase.from("wallet_transactions").insert({
          wallet_id: wallet.id,
          type: "debit",
          amount: amount,
          source: "withdrawal",
          description: `Retrait payé #${payload.withdrawal_id.slice(0, 8)}`,
          reference_id: payload.withdrawal_id,
        });
      }
    }
  }

  // Mettre à jour le statut et renvoyer la ligne mise à jour
  const { data: updatedWithdrawal, error: updateErr } = await supabase
    .from("withdrawal_requests")
    .update({ status: payload.status, admin_note: payload.admin_note || null, updated_at: new Date().toISOString() })
    .eq("id", payload.withdrawal_id)
    .select()
    .maybeSingle();

  // Log update result for debugging
  try {
    console.log("[api/admin/withdrawals] updateErr:", updateErr ? JSON.stringify(updateErr) : null);
    console.log("[api/admin/withdrawals] updatedWithdrawal:", JSON.stringify(updatedWithdrawal));
  } catch (e) { console.error("[api/admin/withdrawals] log error", e); }

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message || "Impossible de mettre à jour la demande" }, { status: 500 });
  }

  // Même si updatedWithdrawal est null (p. ex. RLS empêchant la lecture),
  // considérer l'opération comme réussie si aucune erreur n'a été retournée.
  return NextResponse.json({ success: true, status: payload.status, withdrawal: updatedWithdrawal || null });
}