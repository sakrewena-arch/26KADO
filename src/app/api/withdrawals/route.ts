import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

type WithdrawalPayload = {
  amount: number;
  method: string;
  account_info: string;
};

export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => null)) as WithdrawalPayload | null;

  if (
    !payload ||
    typeof payload.amount !== "number" ||
    payload.amount <= 0 ||
    !payload.method ||
    !payload.account_info
  ) {
    return NextResponse.json({ error: "Paramètres de retrait invalides" }, { status: 400 });
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

  const { data: wallet, error: walletError } = await supabase
    .from("wallets")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (walletError || !wallet) {
    return NextResponse.json({ error: "Portefeuille introuvable" }, { status: 404 });
  }

  if (wallet.balance < payload.amount) {
    return NextResponse.json({ error: "Solde insuffisant" }, { status: 400 });
  }

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
    return NextResponse.json({ error: withdrawalError?.message || "Impossible de créer la demande de retrait" }, { status: 500 });
  }

  const { error: walletUpdateError } = await supabase
    .from("wallets")
    .update({
      balance: wallet.balance - payload.amount,
      total_withdrawn: wallet.total_withdrawn + payload.amount,
    })
    .eq("id", wallet.id);

  const { error: txError } = await supabase.from("wallet_transactions").insert({
    wallet_id: wallet.id,
    type: "debit",
    amount: payload.amount,
    source: "withdrawal",
    description: "Demande de retrait",
  });

  if (walletUpdateError || txError) {
    return NextResponse.json({ error: "Impossible de finaliser le retrait" }, { status: 500 });
  }

  return NextResponse.json({ withdrawal });
}
