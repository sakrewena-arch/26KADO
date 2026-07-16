"use client";

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import type { Profile } from "@/types";

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (data: { email: string; password: string; fullName: string; referralCode?: string }) => Promise<{ error: string | null; user: User | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updateProfile: (data: Partial<Profile>) => Promise<{ error: string | null }>;
  getProfile: () => Promise<Profile | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);

  const fetchProfile = useCallback(
    async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .maybeSingle();

        if (!error && data) {
          setProfile(data as Profile);
          return data as Profile;
        }
      } catch (err: any) {
        console.warn("Profile fetch:", err?.message || err);
      }
      return null;
    },
    [supabase]
  );

  useEffect(() => {
    let mounted = true;
    const TIMEOUT_MS = 10000;

    const timeoutId = setTimeout(() => {
      if (mounted) {
        console.warn("Auth init timeout — forcing loading=false");
        setLoading(false);
      }
    }, TIMEOUT_MS);

    const initializeAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;
        clearTimeout(timeoutId);
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await fetchProfile(session.user.id);
        }
      } catch (err) {
        console.warn("Auth init failed", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      clearTimeout(timeoutId);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(true);

      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }

      if (mounted) setLoading(false);
    });

    return () => {
      clearTimeout(timeoutId);
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfile]);

  const signIn = async (email: string, password: string) => {
    setError(null);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      return { error: error.message };
    }

    // Ne pas bloquer les admins - ils peuvent accéder au site normal
    // (La vérification des droits se fait dans le middleware côté serveur)

    return { error: null };
  };

  const signUp = async (data: { email: string; password: string; fullName: string; referralCode?: string }) => {
    setError(null);
    const metadata: Record<string, any> = { full_name: data.fullName };
    if (data.referralCode) {
      metadata.referral_code = data.referralCode;
    }

    const { data: result, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: { data: metadata },
    });

    if (error) setError(error.message);
    return { error: error?.message || null, user: result?.user ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    window.location.href = "/";
  };

  const resetPassword = async (email: string) => {
    setError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/verify`,
    });
    if (error) setError(error.message);
    return { error: error?.message || null };
  };

  const updateProfile = async (data: Partial<Profile>) => {
    setError(null);
    if (!user) return { error: "Non connecté" };

    const { error } = await supabase.from("profiles").update(data).eq("id", user.id);
    if (!error) {
      await fetchProfile(user.id);
    }
    if (error) setError(error.message);
    return { error: error?.message || null };
  };

  const getProfile = async () => {
    if (!user) return null;
    return await fetchProfile(user.id);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        error,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updateProfile,
        getProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}