"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Wallet, WalletTransaction } from "@/types";

interface UseWalletReturn {
  wallet: Wallet | null;
  transactions: WalletTransaction[];
  loading: boolean;
  createWithdrawal: (amount: number, method: string, accountInfo: string) => Promise<{ error: string | null }>;
  rechargePayDunya: (amount: number) => Promise<{ error: string | null; url?: string }>;
  refresh: () => Promise<void>;
}

export function useWallet(): UseWalletReturn {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const supabase = createClient();

  const fetchWallet = useCallback(async () => {
    if (!user) {
      setWallet(null);
      setTransactions([]);
      setLoading(false);
      return;
    }

    // Ne PAS créer le wallet ici - la création se fait via les API admin
    // Si le wallet n'existe pas, on utilise le profile.total_commission comme fallback
    const { data: walletData, error: walletError } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (walletError || !walletData) {
      // Wallet inexistant → on ne crée PAS, on laisse wallet à null
      // Le dashboard utilisera profile?.total_commission en fallback
      setWallet(null);
      setTransactions([]);
      setLoading(false);
      return;
    }

    setWallet(walletData as Wallet);
    const { data: txData } = await supabase
      .from("wallet_transactions")
      .select("*")
      .eq("wallet_id", walletData.id)
      .order("created_at", { ascending: false })
      .limit(20);
    if (txData) setTransactions(txData as WalletTransaction[]);
    setLoading(false);
  }, [user, supabase]);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  const createWithdrawal = async (amount: number, method: string, accountInfo: string) => {
    if (!user) return { error: "Non connecté" };

    const response = await fetch("/api/withdrawals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, method, account_info: accountInfo }),
    });

    const data = await response.json();
    if (!response.ok) {
      return { error: data?.error || "Erreur de retrait" };
    }

    await fetchWallet();
    return { error: null };
  };

  const rechargePayDunya = async (amount: number) => {
    try {
      const response = await fetch("/api/paydunya/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, user_id: user?.id }),
      });
      const data = await response.json();
      if (!response.ok) {
        return { error: data?.error || "Erreur de paiement" };
      }
      if (data.url) {
        return { error: null, url: data.url };
      }
      return { error: "Erreur de paiement" };
    } catch {
      return { error: "Erreur de connexion à PayDunya" };
    }
  };

  return { wallet, transactions, loading, createWithdrawal, rechargePayDunya, refresh: fetchWallet };
}