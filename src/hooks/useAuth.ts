"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import type { Profile } from "@/types";

interface UseAuthReturn {
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

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
      if (!error && data) {
        setProfile(data as Profile);
        return data as Profile | null;
      }
    } catch (err: any) {
      console.warn("Profile fetch:", err?.message || err);
    }
    return null;
  }, [supabase]);

  useEffect(() => {
    let mounted = true;
    const TIMEOUT_MS = 10000;

    // Timeout de sécurité : si Supabase ne répond pas, on débloque l'UI
    const timeoutId = setTimeout(() => {
      if (mounted) {
        console.warn("Auth init timeout — forcing loading=true");
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
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

    if (data?.user) {
      const profileResult = await fetchProfile(data.user.id);
      if (profileResult && ["super_admin", "admin", "moderator"].includes((profileResult as any).role)) {
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        setProfile(null);
        const message = "Ce compte est réservé aux administrateurs. Utilisez la page d'administration.";
        setError(message);
        return { error: message };
      }
    }

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
    const { error } = await supabase
      .from("profiles")
      .update(data)
      .eq("id", user.id);
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

  return {
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
  };
}