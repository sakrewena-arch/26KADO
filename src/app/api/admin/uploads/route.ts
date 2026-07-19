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

  // Si validation, créer UNIQUEMENT la commission en "pending" (pas de crédit wallet)
  // Le crédit wallet se fera uniquement depuis la page Commissions (statut "paid")
  if (payload.status === "validated" && payload.commission_amount) {
    const { data: upload } = await supabase
      .from("uploads")
      .select("user_id, bookmaker_id")
      .eq("id", payload.upload_id)
      .single();

    if (upload) {
      const userId = upload.user_id;
      const amount = payload.commission_amount;

      // 1. Mettre à jour uniquement total_validations (statistique)
      // NE PAS incrémenter total_commission ici - le wallet sera crédité
      // uniquement quand l'admin clique "Payer" dans la page Commissions
      const { data: profile } = await supabase
        .from("profiles")
        .select("total_validations")
        .eq("id", userId)
        .single();

      if (profile) {
        await supabase
          .from("profiles")
          .update({
            total_validations: Number(profile.total_validations) + 1,
          })
          .eq("id", userId);
      }

      // 2. S'assurer que le wallet existe (le créer si nécessaire)
      const { data: existingWallet } = await supabase
        .from("wallets")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (!existingWallet) {
        await supabase
          .from("wallets")
          .insert({ user_id: userId, balance: 0, total_earned: 0, total_withdrawn: 0 });
      }

      // 3. Créer la commission en "pending" (en attente de paiement)
      await supabase
        .from("commissions")
        .insert({
          user_id: userId,
          bookmaker_id: upload.bookmaker_id,
          amount: amount,
          status: "pending",
          description: `Commission pour validation d'inscription #${payload.upload_id.slice(0, 8)}`,
          validation_id: payload.upload_id,
        });

      // 3. Commission de parrainage (10%) - aussi en "pending"
      const { data: referral } = await supabase
        .from("referrals")
        .select("referrer_id")
        .eq("referred_id", userId)
        .single();

      if (referral) {
        const referralAmount = amount * 0.10;
        await supabase
          .from("commissions")
          .insert({
            user_id: referral.referrer_id,
            bookmaker_id: upload.bookmaker_id,
            amount: referralAmount,
            status: "pending",
            description: "Commission de parrainage (10%)",
          });
      }

      // 4. Notification à l'utilisateur (prévenir que la validation est acceptée)
      await supabase
        .from("notifications")
        .insert({
          user_id: userId,
          type: "commission",
          title: "Validation acceptée !",
          message: `Votre inscription a été validée. Une commission de ${amount} FCFA est en attente de paiement.`,
          data: { amount, upload_id: payload.upload_id, status: "pending" },
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
