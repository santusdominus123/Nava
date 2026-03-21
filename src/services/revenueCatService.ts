import { Platform } from 'react-native';
import { supabase } from '../utils/supabase';

// RevenueCat API keys (set these when you create your RevenueCat project)
const REVENUECAT_API_KEY_IOS = ''; // appl_xxxxx
const REVENUECAT_API_KEY_ANDROID = ''; // goog_xxxxx

// Product identifiers (set these in App Store Connect / Google Play Console)
export const PRODUCT_IDS = {
  MONTHLY: 'bibleguide_pro_monthly',
  YEARLY: 'bibleguide_pro_yearly',
} as const;

export interface Product {
  identifier: string;
  title: string;
  description: string;
  priceString: string;
  price: number;
  currencyCode: string;
}

export interface PurchaseResult {
  success: boolean;
  productId?: string;
  error?: string;
}

// Initialize RevenueCat
// Call this in App.tsx after auth
export async function initRevenueCat(userId: string): Promise<void> {
  try {
    // When RevenueCat SDK is installed:
    // const apiKey = Platform.OS === 'ios' ? REVENUECAT_API_KEY_IOS : REVENUECAT_API_KEY_ANDROID;
    // await Purchases.configure({ apiKey });
    // await Purchases.logIn(userId);
    console.log('[RevenueCat] Would initialize with userId:', userId);
  } catch (error) {
    console.error('[RevenueCat] Init error:', error);
  }
}

// Get available products
export async function getProducts(): Promise<Product[]> {
  try {
    // When RevenueCat SDK is installed:
    // const offerings = await Purchases.getOfferings();
    // return offerings.current?.availablePackages.map(pkg => ({
    //   identifier: pkg.identifier,
    //   title: pkg.product.title,
    //   description: pkg.product.description,
    //   priceString: pkg.product.priceString,
    //   price: pkg.product.price,
    //   currencyCode: pkg.product.currencyCode,
    // })) || [];

    // Mock products for development
    return [
      {
        identifier: PRODUCT_IDS.MONTHLY,
        title: 'Bible Guide Pro Monthly',
        description: 'Unlimited AI chats, audio devotionals, and more',
        priceString: '$4.99',
        price: 4.99,
        currencyCode: 'USD',
      },
      {
        identifier: PRODUCT_IDS.YEARLY,
        title: 'Bible Guide Pro Yearly',
        description: 'Save 33% with annual billing',
        priceString: '$39.99',
        price: 39.99,
        currencyCode: 'USD',
      },
    ];
  } catch (error) {
    console.error('[RevenueCat] Get products error:', error);
    return [];
  }
}

// Purchase a product
export async function purchaseProduct(productId: string, userId: string): Promise<PurchaseResult> {
  try {
    // When RevenueCat SDK is installed:
    // const { customerInfo } = await Purchases.purchaseProduct(productId);
    // const isActive = customerInfo.entitlements.active['pro'] !== undefined;

    // For now, activate premium directly via Supabase
    const plan = productId === PRODUCT_IDS.YEARLY ? 'yearly' : 'monthly';
    const daysToAdd = plan === 'yearly' ? 365 : 30;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + daysToAdd);

    const { error } = await supabase
      .from('profiles')
      .update({
        is_premium: true,
        premium_plan: plan,
        premium_expires_at: expiresAt.toISOString(),
      })
      .eq('id', userId);

    if (error) throw error;

    return { success: true, productId };
  } catch (error: any) {
    console.error('[RevenueCat] Purchase error:', error);
    return { success: false, error: error.message || 'Purchase failed' };
  }
}

// Restore purchases
export async function restorePurchases(userId: string): Promise<PurchaseResult> {
  try {
    // When RevenueCat SDK is installed:
    // const { customerInfo } = await Purchases.restorePurchases();
    // Check customerInfo.entitlements.active

    // For now, check Supabase profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_premium, premium_plan, premium_expires_at')
      .eq('id', userId)
      .single();

    if (profile?.is_premium) {
      return { success: true, productId: profile.premium_plan };
    }

    return { success: false, error: 'No active subscription found' };
  } catch (error: any) {
    return { success: false, error: error.message || 'Restore failed' };
  }
}

// Check subscription status
export async function checkSubscriptionStatus(userId: string): Promise<{
  isActive: boolean;
  expiresAt: Date | null;
  plan: string | null;
}> {
  try {
    // When RevenueCat SDK is installed:
    // const customerInfo = await Purchases.getCustomerInfo();
    // const entitlement = customerInfo.entitlements.active['pro'];

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_premium, premium_plan, premium_expires_at')
      .eq('id', userId)
      .single();

    if (!profile) return { isActive: false, expiresAt: null, plan: null };

    const isExpired = profile.premium_expires_at && new Date(profile.premium_expires_at) < new Date();

    if (isExpired) {
      // Auto-deactivate expired subscription
      await supabase
        .from('profiles')
        .update({ is_premium: false, premium_plan: null, premium_expires_at: null })
        .eq('id', userId);
      return { isActive: false, expiresAt: null, plan: null };
    }

    return {
      isActive: profile.is_premium,
      expiresAt: profile.premium_expires_at ? new Date(profile.premium_expires_at) : null,
      plan: profile.premium_plan,
    };
  } catch {
    return { isActive: false, expiresAt: null, plan: null };
  }
}
