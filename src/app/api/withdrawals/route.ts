import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { createTransfer, MIN_WITHDRAWAL_XOF } from "@/lib/paydunya";

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null);

  if (
    !payload ||
    typeof payload.amount !== "number" ||
    payload.amount <= 0 ||
    !payload.method ||
    !payload.account_info
  ) {
    return NextResponse.json({ error: "Paramètres de retrait invalides" }, { status: 400 });
  }

  // Vérifier le montant minimum
  if (payload.amount < MIN_WITHDRAWAL_XOF) {
    return NextResponse.json({
      error: `Le montant minimum de retrait est de ${MIN_WITHDRAWAL_XOF.toLocaleString()} FCFA`,
    }, { status: 400 });
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

  // Récupérer le profil (nom + pays)
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, phone")
    .eq("id", user.id)
    .single();

  // Récupérer le wallet
  const { data: wallet, error: walletError } = await supabase
    .from("wallets")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (walletError || !wallet) {
    return NextResponse.json({ error: "Portefeuille introuvable" }, { status: 404 });
  }

  if (Number(wallet.balance) < payload.amount) {
    return NextResponse.json({ error: "Solde insuffisant" }, { status: 400 });
  }

  // Vérifier que la méthode est un opérateur Mobile Money (pas une carte)
  const mobileOperators = ["orange_money", "mtn_money", "wave", "moov", "free_money", "djamo", "mixx"];
  const isMobile = mobileOperators.includes(payload.method);

  if (isMobile) {
    // RETRAIT AUTOMATIQUE via PayDunya Transfer
    const transfer = await createTransfer({
      amount: payload.amount,
      operator: payload.method,
      phone: payload.account_info,
      customer_name: profile?.full_name || user.email || "Client",
      user_id: user.id,
      description: `Retrait 26KADO`,
    });

    if (!transfer.success) {
      return NextResponse.json({ error: transfer.error || "Erreur de transfert PayDunya" }, { status: 500 });
    }

    // Débiter le wallet
    const { error: walletUpdateError } = await supabase
      .from("wallets")
      .update({
        balance: Number(wallet.balance) - payload.amount,
        total_withdrawn: Number(wallet.total_withdrawn) + payload.amount,
      })
      .eq("id", wallet.id);

    if (walletUpdateError) {
      return NextResponse.json({ error: "Erreur lors du débit du wallet" }, { status: 500 });
    }

    // Créer une transaction
    await supabase.from("wallet_transactions").insert({
      wallet_id: wallet.id,
      type: "debit",
      amount: payload.amount,
      source: "withdrawal",
      description: `Retrait automatique via ${payload.method}`,
    });

    return NextResponse.json({
      success: true,
      transfer_id: transfer.transfer_id,
      message: "Retrait effectué avec succès",
    });
  }

  // Pour les cartes bancaires : créer une demande en attente (pas de transfert automatique)
  const { data: withdrawal, error: withdrawalError } = await supabase
    .from("withdrawal_requests")
    .insert({
      user_id: user.id,
      amount: payload.amount,
      method: payload.method,
      account_info: payload.account_info,
      status: "pending",
    })
    .select()
    .single();

  if (withdrawalError || !withdrawal) {
    return NextResponse.json({
      error: withdrawalError?.message || "Impossible de créer la demande de retrait",
    }, { status: 500 });
  }

  return NextResponse.json({ withdrawal, message: "Demande de retrait soumise. Traitement manuel requis." });
}