import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(request: NextRequest) {
  const payload = await request.json().catch(() => null);

  if (!payload?.commission_id || !payload?.status) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
  }

  const validStatuses = ["pending", "validated", "paid", "rejected"];
  if (!validStatuses.includes(payload.status)) {
    return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
  }

  // Utiliser le service_role key pour éviter les ambiguïtés de jointure RLS
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
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

  // Vérifier l'auth avec le client anon d'abord
  const anonSupabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll() { /* no-op */ },
      },
    }
  );

  const { data: { user }, error: authError } = await anonSupabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { data: profile, error: profileError } = await anonSupabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || !["admin", "super_admin", "moderator"].includes(profile.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  // Récupérer la commission avec le client service_role (évite les ambiguïtés RLS)
  const { data: commission, error: fetchError } = await supabase
    .from("commissions")
    .select("user_id, amount, status, bookmaker_id")
    .eq("id", payload.commission_id)
    .single();

  if (fetchError || !commission) {
    return NextResponse.json({ error: "Commission introuvable" }, { status: 404 });
  }

  // Mettre à jour le statut avec le client service_role
  const { error } = await supabase
    .from("commissions")
    .update({ status: payload.status, updated_at: new Date().toISOString() })
    .eq("id", payload.commission_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Si le statut passe à "paid" uniquement, créditer le wallet
  // "validated" ne fait que confirmer la validation, ne crédite pas
  if (payload.status === "paid" && commission.status !== "paid") {
    const { data: wallet } = await supabase
      .from("wallets")
      .select("id, balance, total_earned")
      .eq("user_id", commission.user_id)
      .single();

    if (wallet) {
      const amount = Number(commission.amount);
      await supabase
        .from("wallets")
        .update({
          balance: Number(wallet.balance) + amount,
          total_earned: Number(wallet.total_earned) + amount,
        })
        .eq("id", wallet.id);

      await supabase.from("wallet_transactions").insert({
        wallet_id: wallet.id,
        type: "credit",
        amount: amount,
        source: "commission",
        description: `Commission validée pour la validation`,
        reference_id: payload.commission_id,
      });

      await supabase.from("notifications").insert({
        user_id: commission.user_id,
        type: "commission",
        title: "Commission créditée",
        message: `Votre commission de ${amount.toLocaleString()} FCFA a été créditée sur votre wallet.`,
      });
    }

    // Payer aussi la commission du parrain si spécifiée
    if (payload.referrer_commission_id) {
      const { data: refCommission } = await supabase
        .from("commissions")
        .select("user_id, amount, status")
        .eq("id", payload.referrer_commission_id)
        .single();

      if (refCommission && refCommission.status !== "paid") {
        // Marquer la commission du parrain comme payée
        await supabase
          .from("commissions")
          .update({ status: "paid", updated_at: new Date().toISOString() })
          .eq("id", payload.referrer_commission_id);

        // Créditer le wallet du parrain
        const { data: refWallet } = await supabase
          .from("wallets")
          .select("id, balance, total_earned")
          .eq("user_id", refCommission.user_id)
          .single();

        if (refWallet) {
          const refAmount = Number(refCommission.amount);
          await supabase
            .from("wallets")
            .update({
              balance: Number(refWallet.balance) + refAmount,
              total_earned: Number(refWallet.total_earned) + refAmount,
            })
            .eq("id", refWallet.id);

          await supabase.from("wallet_transactions").insert({
            wallet_id: refWallet.id,
            type: "credit",
            amount: refAmount,
            source: "referral",
            description: `Commission de parrainage payée`,
            reference_id: payload.referrer_commission_id,
          });

          await supabase.from("notifications").insert({
            user_id: refCommission.user_id,
            type: "commission",
            title: "Commission de parrainage créditée",
            message: `Votre commission de parrainage de ${refAmount.toLocaleString()} FCFA a été créditée sur votre wallet.`,
          });
        }
      }
    }
  }

  // Si le statut passe à "rejected", aucune action wallet
  return NextResponse.json({ success: true, status: payload.status });
}