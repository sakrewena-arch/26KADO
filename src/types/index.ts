// ============================================
// 26KADO - Types & Interfaces
// ============================================

export type UserRole = 'super_admin' | 'admin' | 'moderator' | 'user';

export type CommissionStatus = 'pending' | 'validated' | 'paid' | 'rejected';

export type WithdrawalStatus = 'pending' | 'validated' | 'paid' | 'rejected';

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export type NotificationType =
  | 'commission'
  | 'validation'
  | 'payment'
  | 'referral'
  | 'badge'
  | 'level'
  | 'announcement'
  | 'withdrawal'
  | 'ticket';

export type BadgeType = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  phone?: string;
  role: UserRole;
  referral_code: string;
  referred_by?: string;
  level_id?: string;
  badge_id?: string;
  total_commission: number;
  total_referrals: number;
  total_validations: number;
  total_clicks: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Bookmaker {
  id: string;
  name: string;
  slug: string;
  logo_url: string;
  color: string;
  description: string;
  bonus: string;
  promo_code: string;
  advantages: string[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface AffiliateLink {
  id: string;
  bookmaker_id: string;
  url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  bookmaker?: Bookmaker;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  commission_rate: number;
  total_commission_generated: number;
  total_commission_earned: number;
  created_at: string;
  referrer?: Profile;
  referred?: Profile;
}

export interface Commission {
  id: string;
  user_id: string;
  bookmaker_id: string;
  amount: number;
  status: CommissionStatus;
  referral_id?: string;
  validation_id?: string;
  description: string;
  created_at: string;
  updated_at: string;
  bookmaker?: Bookmaker;
  user?: Profile;
}

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  total_earned: number;
  total_withdrawn: number;
  created_at: string;
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  type: 'credit' | 'debit';
  amount: number;
  source: 'commission' | 'referral' | 'bonus' | 'withdrawal' | 'deposit' | 'payment';
  description: string;
  reference_id?: string;
  created_at: string;
}

export interface WithdrawalRequest {
  id: string;
  user_id: string;
  amount: number;
  method: string;
  account_info: string;
  status: WithdrawalStatus;
  admin_id?: string;
  admin_note?: string;
  created_at: string;
  updated_at: string;
  user?: Profile;
}

export interface PaymentTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: 'deposit' | 'withdrawal' | 'commission_payment';
  method: string;
  status: 'pending' | 'completed' | 'failed';
  paydunya_token?: string;
  paydunya_response?: any;
  created_at: string;
  updated_at: string;
  user?: Profile;
}

export interface Badge {
  id: string;
  name: string;
  type: BadgeType;
  icon: string;
  description: string;
  min_commission: number;
  color: string;
  created_at: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  awarded_at: string;
  badge?: Badge;
}

export interface Level {
  id: string;
  name: string;
  min_commission: number;
  max_commission: number;
  icon: string;
  color: string;
  created_at: string;
}

export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: 'low' | 'medium' | 'high';
  category: string;
  admin_id?: string;
  created_at: string;
  updated_at: string;
  user?: Profile;
  messages?: TicketMessage[];
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  user_id: string;
  message: string;
  attachments?: string[];
  created_at: string;
  user?: Profile;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  data?: any;
  created_at: string;
}

export interface Upload {
  id: string;
  user_id: string;
  bookmaker_id: string;
  bookmaker_user_id: string;
  deposit_amount: number;
  deposit_date: string;
  comments?: string;
  images: string[];
  status: 'pending' | 'validated' | 'rejected' | 'info_requested';
  commission_amount?: number;
  admin_id?: string;
  admin_note?: string;
  created_at: string;
  updated_at: string;
  user?: Profile;
  bookmaker?: Bookmaker;
}

export interface FaqCategory {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  created_at: string;
  faqs?: Faq[];
}

export interface Faq {
  id: string;
  category_id: string;
  question: string;
  answer: string;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  category?: FaqCategory;
}

export interface Resource {
  id: string;
  title: string;
  type: 'banner' | 'image' | 'text' | 'ad' | 'video';
  file_url?: string;
  content?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppLink {
  id: string;
  url: string;
  label: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LeaderboardEntry {
  id: string;
  user_id: string;
  period: 'weekly' | 'monthly' | 'all_time';
  total_commission: number;
  total_referrals: number;
  rank: number;
  updated_at: string;
  user?: Profile;
}

export interface RewardProgram {
  id: string;
  name: string;
  description: string;
  min_volume: number;
  max_volume: number;
  reward_type: 'bonus' | 'badge' | 'gift' | 'cash';
  reward_value: number;
  is_active: boolean;
  created_at: string;
}

export interface AdminLog {
  id: string;
  admin_id: string;
  action: string;
  target_type: string;
  target_id: string;
  details?: any;
  created_at: string;
  admin?: Profile;
}

export interface Setting {
  id: string;
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'json';
  created_at: string;
  updated_at: string;
}

export interface SiteStats {
  total_clicks: number;
  total_registrations: number;
  total_validations: number;
  total_commissions: number;
  total_paid: number;
  total_generated: number;
  conversion_rate: number;
}

// ============================================
// COUPONS & FOOTBALL NEWS
// ============================================

export interface Coupon {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FootballNews {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}
