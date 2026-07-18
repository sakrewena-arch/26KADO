import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Skip middleware for static files and API routes
  if (
    path === "/favicon.ico" ||
    path === "/site.webmanifest" ||
    path.startsWith("/_next") ||
    path.startsWith("/api") ||
    path.startsWith("/images") ||
    path === "/robots.txt"
  ) {
    return NextResponse.next();
  }

  // Skip middleware for auth pages (they handle their own redirects client-side)
  if (path.startsWith("/auth/")) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Récupérer la session (plus fiable que getUser côté serveur)
  const { data: { session } } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
  const user = session?.user ?? null;

  // Fonction utilitaire pour récupérer le profil sans erreur
  const getProfile = async (userId: string) => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();
      return data;
    } catch {
      return null;
    }
  };

  // Admin login page - toujours accessible
  if (path === "/admin/login") {
    if (user) {
      const profile = await getProfile(user.id);
      if (profile && ["super_admin", "admin", "moderator"].includes(profile.role)) {
        const url = request.nextUrl.clone();
        url.pathname = "/admin";
        return NextResponse.redirect(url);
      }
    }
    return supabaseResponse;
  }

  // Routes admin protégées
  if (path.startsWith("/admin")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }

    const profile = await getProfile(user.id);
    if (!profile || !["super_admin", "admin", "moderator"].includes(profile.role)) {
      try { await supabase.auth.signOut(); } catch {}
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }

    return supabaseResponse;
  }

  // Dashboard routes - pas de vérification côté serveur
  // La protection est gérée côté client par DashboardLayout
  return supabaseResponse;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/admin/login",
  ],
};
