import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Webhook PayDunya - appelé automatiquement après un paiement réussi
export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    // Vérifier que le paiement est bien complété
    if (payload.status !== "completed" && payload.response_text !== "success") {
      return NextResponse.json({ error: "Paiement non complété" }, { status: 400 });
    }

    const customData = payload.custom_data || {};
    const userId = customData.user_id;
    const amount = payload.invoice?.total_amount || payload.amount;

    if (!userId || !amount) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
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

    // Récupérer le wallet de l'utilisateur
    const { data: wallet, error: walletError } = await supabase
      .from("wallets")
      .select("id, balance, total_earned")
      .eq("user_id", userId)
      .single();

    if (walletError || !wallet) {
      return NextResponse.json({ error: "Wallet introuvable" }, { status: 404 });
    }

    // Créditer le wallet
    const { error: updateError } = await supabase
      .from("wallets")
      .update({
        balance: Number(wallet.balance) + Number(amount),
        total_earned: Number(wallet.total_earned) + Number(amount),
      })
      .eq("id", wallet.id);

    if (updateError) {
      return NextResponse.json({ error: "Erreur de mise à jour du wallet" }, { status: 500 });
    }

    // Créer une transaction
    await supabase.from("wallet_transactions").insert({
      wallet_id: wallet.id,
      type: "credit",
      amount: Number(amount),
      source: "deposit",
      description: `Dépôt via PayDunya (${amount.toLocaleString()} FCFA)`,
    });

    // Enregistrer la transaction PayDunya
    await supabase.from("payment_transactions").insert({
      user_id: userId,
      amount: Number(amount),
      type: "deposit",
      method: "paydunya",
      status: "completed",
      paydunya_token: payload.token || payload.invoice?.token,
      paydunya_response: payload,
    });

    // Créer une notification
    await supabase.from("notifications").insert({
      user_id: userId,
      type: "payment",
      title: "Dépôt confirmé",
      message: `Votre dépôt de ${Number(amount).toLocaleString()} FCFA a été crédité sur votre wallet.`,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("PayDunya webhook error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}