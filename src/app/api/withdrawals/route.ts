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
        setAll() { /* no-op */ },
      },
    }
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  // Créer la demande de retrait en statut "pending" (sans débiter le wallet)
  // Le débit sera effectué par l'admin quand il marquera "paid"
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

  return NextResponse.json({
    success: true,
    withdrawal,
    message: `Demande de retrait créée. En attente de traitement par l'administrateur.`,
  });
}