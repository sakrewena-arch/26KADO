import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { createDepositInvoice } from "@/lib/paydunya";

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null);

  if (!payload || !payload.amount || payload.amount <= 0) {
    return NextResponse.json({ error: "Montant invalide" }, { status: 400 });
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
    .select("full_name, email, phone")
    .eq("id", user.id)
    .single();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const result = await createDepositInvoice({
    amount: payload.amount,
    customer_name: profile?.full_name || user.email || "Client",
    customer_email: profile?.email || user.email || "",
    customer_phone: payload.phone || profile?.phone || "",
    description: `Dépôt de ${payload.amount.toLocaleString()} FCFA sur 26KADO`,
    user_id: user.id,
    return_url: `${siteUrl}/dashboard/wallet?deposit=success`,
    cancel_url: `${siteUrl}/dashboard/wallet?deposit=cancel`,
    notify_url: `${siteUrl}/api/paydunya/notify`,
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error || "Erreur PayDunya" }, { status: 500 });
  }

  return NextResponse.json({ url: result.invoice_url, token: result.invoice_token });
}