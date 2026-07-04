import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

type UploadUpdatePayload = {
  upload_id: string;
  status: "pending" | "validated" | "rejected" | "info_requested" | "archived";
  commission_amount?: number;
  admin_note?: string;
  comments?: string;
  new_images?: string[];
};

export async function PATCH(request: NextRequest) {
  const payload = (await request.json().catch(() => null)) as UploadUpdatePayload | null;

  if (!payload?.upload_id || !payload?.status) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
  }

  // Utiliser la clé service_role pour garantir que le trigger SQL s'exécute
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll() { /* no-op */ },
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

  const { data: profile } = await anonSupabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["super_admin", "admin", "moderator"].includes(profile.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const updates: Record<string, unknown> = {
    status: payload.status,
  };

  if (payload.commission_amount !== undefined) {
    updates.commission_amount = payload.commission_amount;
  }
  if (payload.admin_note !== undefined) {
    updates.admin_note = payload.admin_note;
  }
  if (payload.comments !== undefined) {
    updates.comments = payload.comments;
  }
  if (payload.new_images !== undefined && Array.isArray(payload.new_images)) {
    updates.images = payload.new_images;
  }

  const { error: updateError } = await supabase
    .from("uploads")
    .update(updates)
    .eq("id", payload.upload_id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Si validation, créditer le wallet directement + créer la commission
  if (payload.status === "validated" && payload.commission_amount) {
    const { data: upload } = await supabase
      .from("uploads")
      .select("user_id, bookmaker_id")
      .eq("id", payload.upload_id)
      .single();

    if (upload) {
      const userId = upload.user_id;
      const amount = payload.commission_amount;

      // 1. Créditer le wallet
      const { data: wallet } = await supabase
        .from("wallets")
        .select("id, balance, total_earned")
        .eq("user_id", userId)
        .single();

      if (wallet) {
        await supabase
          .from("wallets")
          .update({
            balance: Number(wallet.balance) + amount,
            total_earned: Number(wallet.total_earned) + amount,
          })
          .eq("id", wallet.id);

        // 2. Ajouter la transaction
        await supabase
          .from("wallet_transactions")
          .insert({
            wallet_id: wallet.id,
            type: "credit",
            amount: amount,
            source: "commission",
            description: `Commission pour validation d'inscription #${payload.upload_id.slice(0, 8)}`,
            reference_id: payload.upload_id,
          });
      }

      // 3. Mettre à jour le total_commission du profil
      const { data: profile } = await supabase
        .from("profiles")
        .select("total_commission")
        .eq("id", userId)
        .single();

      if (profile) {
        await supabase
          .from("profiles")
          .update({ total_commission: Number(profile.total_commission) + amount })
          .eq("id", userId);
      }

      // 4. Créer la commission en base (déjà validée)
      await supabase
        .from("commissions")
        .insert({
          user_id: userId,
          bookmaker_id: upload.bookmaker_id,
          amount: amount,
          status: "validated",
          description: `Commission pour validation d'inscription #${payload.upload_id.slice(0, 8)}`,
          validation_id: payload.upload_id,
        });

      // 5. Commission de parrainage (10%)
      const { data: referral } = await supabase
        .from("referrals")
        .select("referrer_id")
        .eq("referred_id", userId)
        .single();

      if (referral) {
        const referralAmount = amount * 0.10;
        const { data: refWallet } = await supabase
          .from("wallets")
          .select("id, balance, total_earned")
          .eq("user_id", referral.referrer_id)
          .single();

        if (refWallet) {
          await supabase
            .from("wallets")
            .update({
              balance: Number(refWallet.balance) + referralAmount,
              total_earned: Number(refWallet.total_earned) + referralAmount,
            })
            .eq("id", refWallet.id);

          await supabase
            .from("wallet_transactions")
            .insert({
              wallet_id: refWallet.id,
              type: "credit",
              amount: referralAmount,
              source: "referral",
              description: `Commission de parrainage (10%) pour validation #${payload.upload_id.slice(0, 8)}`,
              reference_id: payload.upload_id,
            });

          await supabase
            .from("commissions")
            .insert({
              user_id: referral.referrer_id,
              bookmaker_id: upload.bookmaker_id,
              amount: referralAmount,
              status: "validated",
              referral_id: null,
              description: "Commission de parrainage (10%)",
            });

          // Notification au parrain
          await supabase
            .from("notifications")
            .insert({
              user_id: referral.referrer_id,
              type: "referral",
              title: "Commission de parrainage !",
              message: `Vous avez reçu ${referralAmount} FCFA de commission de parrainage.`,
              data: { amount: referralAmount },
            });
        }
      }

      // 6. Notification à l'utilisateur
      await supabase
        .from("notifications")
        .insert({
          user_id: userId,
          type: "commission",
          title: "Commission validée !",
          message: `Votre commission de ${amount} FCFA a été créditée.`,
          data: { amount, upload_id: payload.upload_id },
        });
    }
  }

  return NextResponse.json({ status: payload.status });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const uploadId = searchParams.get("id");
  if (!uploadId) {
    return NextResponse.json({ error: "Paramètre id manquant" }, { status: 400 });
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["super_admin", "admin", "moderator"].includes(profile.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  // Supprimer la commission liée si elle existe
  await supabase.from("commissions").delete().eq("validation_id", uploadId);

  // Supprimer l'upload
  const { error: deleteError } = await supabase
    .from("uploads")
    .delete()
    .eq("id", uploadId);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
