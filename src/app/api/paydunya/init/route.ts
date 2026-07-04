import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

type PaydunyaInitRequest = {
  amount: number;
  user_id?: string;
  type?: "manual" | "user";
};

export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => null)) as PaydunyaInitRequest | null;

  if (!payload || typeof payload.amount !== "number" || payload.amount <= 0) {
    return NextResponse.json({ error: "Montant invalide" }, { status: 400 });
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
          // No-op: this route does not require updating auth cookies.
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

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Impossible de vérifier les droits" }, { status: 403 });
  }

  const isAdmin = profile.role === "admin" || profile.role === "super_admin";

  if (payload.type === "manual" && !isAdmin) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  if (payload.user_id && payload.user_id !== user.id && !isAdmin) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const orderId = `paydunya-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  const checkoutUrl = `https://paydunya.test/checkout?amount=${payload.amount}&order_id=${orderId}`;

  return NextResponse.json({ url: checkoutUrl });
}
