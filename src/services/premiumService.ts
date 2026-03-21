import { supabase } from '../utils/supabase';

// ── Types ────────────────────────────────────────────────────────────────────

export interface PremiumStatus {
  isPremium: boolean;
  plan: 'monthly' | 'yearly' | null;
  expiresAt: Date | null;
}

// ── Constants ────────────────────────────────────────────────────────────────

export const PREMIUM_FEATURES = {
  AI_DAILY_LIMIT_FREE: 5,
  AI_DAILY_LIMIT_PREMIUM: 999,
  canAccessFeature: (feature: string, isPremium: boolean): boolean => {
    const premiumOnly = ['audio_devotionals', 'custom_themes', 'offline_access', 'advanced_ai'];
    if (premiumOnly.includes(feature)) return isPremium;
    return true;
  },
} as const;

// ── Service Functions ────────────────────────────────────────────────────────

/**
 * Check the premium status for a given user.
 * If the subscription has expired, automatically deactivates premium.
 */
export async function checkPremiumStatus(userId: string): Promise<PremiumStatus> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('is_premium, premium_plan, premium_expires_at')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return { isPremium: false, plan: null, expiresAt: null };
    }

    const expiresAt = data.premium_expires_at ? new Date(data.premium_expires_at) : null;

    // If premium has expired, deactivate and return not-premium
    if (data.is_premium && expiresAt && expiresAt < new Date()) {
      await supabase
        .from('profiles')
        .update({ is_premium: false, premium_plan: null, premium_expires_at: null })
        .eq('id', userId);

      return { isPremium: false, plan: null, expiresAt: null };
    }

    return {
      isPremium: !!data.is_premium,
      plan: (data.premium_plan as 'monthly' | 'yearly') ?? null,
      expiresAt,
    };
  } catch (err) {
    console.error('[premiumService] checkPremiumStatus error:', err);
    return { isPremium: false, plan: null, expiresAt: null };
  }
}

/**
 * Activate premium for a user with the given plan.
 * Calculates expiry based on plan duration (30 days / 365 days).
 */
export async function activatePremium(
  userId: string,
  plan: 'monthly' | 'yearly',
): Promise<boolean> {
  try {
    const now = new Date();
    const daysToAdd = plan === 'monthly' ? 30 : 365;
    const expiresAt = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);

    const { error } = await supabase
      .from('profiles')
      .update({
        is_premium: true,
        premium_plan: plan,
        premium_expires_at: expiresAt.toISOString(),
      })
      .eq('id', userId);

    if (error) {
      console.error('[premiumService] activatePremium error:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[premiumService] activatePremium error:', err);
    return false;
  }
}

/**
 * Deactivate premium for a user, clearing all premium fields.
 */
export async function deactivatePremium(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        is_premium: false,
        premium_plan: null,
        premium_expires_at: null,
      })
      .eq('id', userId);

    if (error) {
      console.error('[premiumService] deactivatePremium error:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[premiumService] deactivatePremium error:', err);
    return false;
  }
}

/**
 * Check whether a user is allowed to send another AI chat message today.
 * Free users get 5 messages/day; premium users get 999.
 */
export async function checkAIChatLimit(
  userId: string,
): Promise<{ allowed: boolean; remaining: number; isPremium: boolean }> {
  try {
    const status = await checkPremiumStatus(userId);
    const limit = status.isPremium
      ? PREMIUM_FEATURES.AI_DAILY_LIMIT_PREMIUM
      : PREMIUM_FEATURES.AI_DAILY_LIMIT_FREE;

    // Start of today in UTC
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    const { count, error } = await supabase
      .from('chat_messages')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('role', 'user')
      .gte('created_at', todayStart.toISOString());

    if (error) {
      console.error('[premiumService] checkAIChatLimit count error:', error);
      // Fail open so the user isn't blocked by a transient error
      return { allowed: true, remaining: 0, isPremium: status.isPremium };
    }

    const used = count ?? 0;
    const remaining = Math.max(limit - used, 0);

    return {
      allowed: used < limit,
      remaining,
      isPremium: status.isPremium,
    };
  } catch (err) {
    console.error('[premiumService] checkAIChatLimit error:', err);
    return { allowed: true, remaining: 0, isPremium: false };
  }
}
