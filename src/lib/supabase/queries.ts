import { createClient } from "./client";
import type {
  Bookmaker,
  AffiliateLink,
  Commission,
  Wallet,
  WalletTransaction,
  Referral,
  Upload,
  SupportTicket,
  Notification,
  LeaderboardEntry,
  FaqCategory,
  Faq,
  Resource,
  Setting,
  Profile,
  WithdrawalRequest,
  PaymentTransaction,
  SiteStats,
  Coupon,
  FootballNews,
} from "@/types";

const supabase = createClient();

// ============================================
// BOOKMAKERS
// ============================================
export async function getBookmakers() {
  const { data, error } = await supabase
    .from("bookmakers")
    .select("*, affiliate_links(*)")
    .eq("is_active", true)
    .order("sort_order");
  if (error) throw error;
  return data as (Bookmaker & { affiliate_links: AffiliateLink[] })[];
}

export async function getAllBookmakers() {
  const { data, error } = await supabase
    .from("bookmakers")
    .select("*, affiliate_links(*)")
    .order("sort_order");
  if (error) throw error;
  return data as (Bookmaker & { affiliate_links: AffiliateLink[] })[];
}

export async function getAffiliateLinks(bookmakerId: string) {
  const { data, error } = await supabase
    .from("affiliate_links")
    .select("*")
    .eq("bookmaker_id", bookmakerId)
    .eq("is_active", true);
  if (error) throw error;
  return data as AffiliateLink[];
}

// ============================================
// COMMISSIONS
// ============================================
export async function getCommissions(userId: string) {
  const { data, error } = await supabase
    .from("commissions")
    .select("*, bookmaker:bookmakers(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as Commission[];
}

// ============================================
// WALLET
// ============================================
export async function getWallet(userId: string) {
  const { data, error } = await supabase
    .from("wallets")
    .select("*")
    .eq("user_id", userId)
    .single();
  if (error) throw error;
  return data as Wallet;
}

export async function getTransactions(walletId: string) {
  const { data, error } = await supabase
    .from("wallet_transactions")
    .select("*")
    .eq("wallet_id", walletId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as WalletTransaction[];
}

// ============================================
// REFERRALS
// ============================================
export async function getReferrals(userId: string) {
  const { data, error } = await supabase
    .from("referrals")
    .select("*, referred:profiles!referred_id(*)")
    .eq("referrer_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as Referral[];
}

// ============================================
// UPLOADS
// ============================================
export async function getUploads(userId: string) {
  const { data, error } = await supabase
    .from("uploads")
    .select("*, bookmaker:bookmakers(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as Upload[];
}

export async function createUpload(data: Partial<Upload>) {
  const { data: result, error } = await supabase
    .from("uploads")
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return result as Upload;
}

// ============================================
// TICKETS
// ============================================
export async function getTickets(userId: string) {
  const { data, error } = await supabase
    .from("support_tickets")
    .select("*, messages:ticket_messages(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as SupportTicket[];
}

export async function createTicket(data: Partial<SupportTicket>) {
  const { data: result, error } = await supabase
    .from("support_tickets")
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return result as SupportTicket;
}

// ============================================
// NOTIFICATIONS
// ============================================
export async function getNotifications(userId: string) {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data as Notification[];
}

// ============================================
// LEADERBOARD
// ============================================
export async function getLeaderboard(period: "weekly" | "monthly" | "all_time") {
  const { data, error } = await supabase
    .from("leaderboard")
    .select("*, user:profiles(*)")
    .eq("period", period)
    .order("rank")
    .limit(20);
  if (error) throw error;
  return data as LeaderboardEntry[];
}

// ============================================
// FAQ
// ============================================
export async function getFaqs() {
  const { data, error } = await supabase
    .from("faq_categories")
    .select("*, faqs(*)")
    .order("sort_order");
  if (error) throw error;
  return data as FaqCategory[];
}

// ============================================
// RESOURCES
// ============================================
export async function getResources() {
  const { data, error } = await supabase
    .from("resources")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as Resource[];
}

// ============================================
// SETTINGS
// ============================================
export async function getSettings() {
  const { data, error } = await supabase
    .from("settings")
    .select("*");
  if (error) throw error;
  return data as Setting[];
}

// ============================================
// PROFILE
// ============================================
export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*, level:levels(*), badge:badges(*)")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data as Profile;
}

// ============================================
// WITHDRAWAL
// ============================================
export async function createWithdrawalRequest(data: Partial<WithdrawalRequest>) {
  const { data: result, error } = await supabase
    .from("withdrawal_requests")
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return result as WithdrawalRequest;
}

// ============================================
// STATS
// ============================================
export async function getStats(): Promise<SiteStats> {
  const { data: profiles } = await supabase.from("profiles").select("id", { count: "exact", head: true });
  const { data: commissions } = await supabase.from("commissions").select("amount").eq("status", "validated");
  const totalCommissions = (commissions || []).reduce((sum, c) => sum + Number(c.amount), 0);
  const { count: validations } = await supabase.from("uploads").select("id", { count: "exact", head: true }).eq("status", "validated");
  const { count: clicks } = await supabase.from("profiles").select("id", { count: "exact", head: true });

  return {
    total_clicks: clicks || 0,
    total_registrations: profiles?.length || 0,
    total_validations: validations || 0,
    total_commissions: totalCommissions,
    total_paid: totalCommissions * 0.8,
    total_generated: totalCommissions,
    conversion_rate: profiles?.length ? ((validations || 0) / profiles.length) * 100 : 0,
  };
}

// ============================================
// ADMIN QUERIES
// ============================================
export async function getAdminStats() {
  // Compter les utilisateurs
  const { count: totalUsers } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });

  // Compter les validations en attente
  const { count: pendingUploads } = await supabase
    .from("uploads")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  // Compter les retraits en attente
  const { count: pendingWithdrawals } = await supabase
    .from("withdrawal_requests")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  // Compter les tickets ouverts
  const { count: openTickets } = await supabase
    .from("support_tickets")
    .select("*", { count: "exact", head: true })
    .eq("status", "open");

  // Commissions totales
  const { data: commissions } = await supabase
    .from("commissions")
    .select("amount");
  const totalCommissions = (commissions || []).reduce((sum, c) => sum + Number(c.amount), 0);

  // Stats financières depuis la table settings
  const COUNTER_KEYS = ["total_commissions", "total_withdrawals", "total_deposits", "total_revenue"];
  const { data: settingsData } = await supabase
    .from("settings")
    .select("*")
    .in("key", COUNTER_KEYS);

  const counters: Record<string, number> = {
    total_commissions: 0,
    total_withdrawals: 0,
    total_deposits: 0,
    total_revenue: 0,
  };

  if (settingsData) {
    settingsData.forEach((s: any) => {
      if (s.key in counters) {
        counters[s.key] = Number(s.value) || 0;
      }
    });
  }

  return {
    total_users: totalUsers || 0,
    pending_uploads: pendingUploads || 0,
    pending_withdrawals: pendingWithdrawals || 0,
    open_tickets: openTickets || 0,
    total_commissions: totalCommissions,
    total_withdrawals: counters.total_withdrawals,
    total_deposits: counters.total_deposits,
    total_revenue: counters.total_revenue,
  };
}

export async function getAllUsers() {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as Profile[];
}

export async function getAllCommissions() {
  const { data, error } = await supabase
    .from("commissions")
    .select("*, user:profiles!commissions_user_id_fkey(id, full_name, email, referral_code, total_commission, total_referrals, total_validations, total_clicks, is_active, role, created_at, updated_at, avatar_url, phone, level_id, badge_id, referred_by), bookmaker:bookmakers(*)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as (Commission & { user_referrer?: Profile | null })[];
}

export async function getAllUploads() {
  const { data, error } = await supabase
    .from("uploads")
    .select("*, user:profiles!uploads_user_id_fkey(*), bookmaker:bookmakers(*)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as Upload[];
}

export async function getAllTickets() {
  const { data, error } = await supabase
    .from("support_tickets")
    .select("*, user:profiles(*), messages:ticket_messages(*)")
    .order("created_at", { ascending: false });
  if (error) {
    throw new Error(error.message || JSON.stringify(error));
  }
  return data as SupportTicket[];
}

export async function getAllWithdrawals() {
  const { data, error } = await supabase
    .from("withdrawal_requests")
    .select("*, user:profiles!withdrawal_requests_user_id_fkey(*)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as WithdrawalRequest[];
}

// ============================================
// ADMIN UPDATES
// ============================================
export async function updateCommission(id: string, data: Partial<Commission>) {
  const { error } = await supabase.from("commissions").update(data).eq("id", id);
  if (error) throw error;
}

export async function updateUpload(id: string, data: Partial<Upload>) {
  const { error } = await supabase.from("uploads").update(data).eq("id", id);
  if (error) throw error;
}

export async function updateTicket(id: string, data: Partial<SupportTicket>) {
  const { error } = await supabase.from("support_tickets").update(data).eq("id", id);
  if (error) throw error;
}

export async function updateWithdrawal(id: string, data: Partial<WithdrawalRequest>) {
  const { error } = await supabase.from("withdrawal_requests").update(data).eq("id", id);
  if (error) throw error;
}

export async function updateBookmaker(id: string, data: Partial<Bookmaker>) {
  const { error } = await supabase.from("bookmakers").update(data).eq("id", id);
  if (error) throw error;
}

export async function createBookmaker(data: Partial<Bookmaker>) {
  const { data: result, error } = await supabase.from("bookmakers").insert(data).select().single();
  if (error) throw error;
  return result as Bookmaker;
}

export async function updateSettings(settings: { key: string; value: any }[]) {
  const records = settings.map(s => ({
    key: s.key,
    value: s.value,
    type: typeof s.value === "boolean" ? "boolean" : typeof s.value === "number" ? "number" : "string",
  }));
  const { error } = await supabase
    .from("settings")
    .upsert(records, { onConflict: "key" });
  if (error) throw error;
}

// ============================================
// COUPONS
// ============================================
export async function getCoupons() {
  const { data, error } = await supabase
    .from("coupons")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as Coupon[];
}

export async function getAllCoupons() {
  const { data, error } = await supabase
    .from("coupons")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as Coupon[];
}

export async function createCoupon(data: Partial<Coupon>) {
  const { data: result, error } = await supabase
    .from("coupons")
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return result as Coupon;
}

export async function updateCoupon(id: string, data: Partial<Coupon>) {
  const { error } = await supabase.from("coupons").update(data).eq("id", id);
  if (error) throw error;
}

export async function deleteCoupon(id: string) {
  const { error } = await supabase.from("coupons").delete().eq("id", id);
  if (error) throw error;
}

// ============================================
// FOOTBALL NEWS
// ============================================
export async function getFootballNews() {
  const { data, error } = await supabase
    .from("football_news")
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as FootballNews[];
}

export async function getAllFootballNews() {
  const { data, error } = await supabase
    .from("football_news")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as FootballNews[];
}

export async function createFootballNews(data: Partial<FootballNews>) {
  const { data: result, error } = await supabase
    .from("football_news")
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return result as FootballNews;
}

export async function updateFootballNews(id: string, data: Partial<FootballNews>) {
  const { error } = await supabase.from("football_news").update(data).eq("id", id);
  if (error) throw error;
}

export async function deleteFootballNews(id: string) {
  const { error } = await supabase.from("football_news").delete().eq("id", id);
  if (error) throw error;
}
