import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { MIN_WITHDRAWAL_XOF } from "@/lib/paydunya";

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
        setAll() { /* no-op - la session est déjà dans les cookies */ },
      },
    }
  );

  // Utiliser getSession() au lieu de getUser() pour éviter les problèmes de refresh token
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  if (authError || !session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const user = session.user;

  // Récupérer ou créer le wallet
  let { data: wallet, error: walletError } = await supabase
    .from("wallets")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (walletError || !wallet) {
    const { data: newWallet, error: createError } = await supabase
      .from("wallets")
      .insert({
        user_id: user.id,
        balance: 0,
        total_earned: 0,
        total_withdrawn: 0,
      })
      .select("*")
      .single();

    if (createError || !newWallet) {
      return NextResponse.json({ error: "Impossible de créer le portefeuille" }, { status: 500 });
    }
    wallet = newWallet;
  }

  if (Number(wallet.balance) < payload.amount) {
    return NextResponse.json({ error: "Solde insuffisant" }, { status: 400 });
  }

  // Créer la demande de retrait
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

  // Débiter immédiatement le wallet (le montant est réservé)
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

  // Créer une transaction de débit
  await supabase.from("wallet_transactions").insert({
    wallet_id: wallet.id,
    type: "debit",
    amount: payload.amount,
    source: "withdrawal",
    description: `Demande de retrait #${withdrawal.id.slice(0, 8)} via ${payload.method}`,
    reference_id: withdrawal.id,
  });

  return NextResponse.json({
    success: true,
    withdrawal,
    message: `Demande de retrait créée. Votre solde a été mis à jour.`,
  });
}