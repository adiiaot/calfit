import { Platform } from 'react-native';
import { supabase } from './supabase';

// ── PRODUCT IDS ───────────────────────────────────────────────
export const PRODUCT_IDS = {
  pro: Platform.select({
    ios:     'com.fabsdevelopment.calfit.pro.monthly',
    android: 'com.fabsdevelopment.calfit.pro.monthly',
  }) ?? 'com.fabsdevelopment.calfit.pro.monthly',

  premium: Platform.select({
    ios:     'com.fabsdevelopment.calfit.premium.monthly',
    android: 'com.fabsdevelopment.calfit.premium.monthly',
  }) ?? 'com.fabsdevelopment.calfit.premium.monthly',
};

export const ALL_PRODUCT_IDS = [PRODUCT_IDS.pro, PRODUCT_IDS.premium];

// ── NOTE ──────────────────────────────────────────────────────
// IAP is stubbed out until FABS Development creates:
// 1. Apple Developer account ($99/yr) + App Store Connect products
// 2. Google Play developer account ($25) + Play Console products
//
// Full implementation is documented in:
// CalFit_Payment_Setup_README.md
//
// When accounts are ready, replace this file with the full
// react-native-iap implementation from the README.
// ─────────────────────────────────────────────────────────────

export const initIAP = async (): Promise<boolean> => {
  // Stub — returns true so App.tsx doesn't crash
  return true;
};

export const endIAP = async (): Promise<void> => {
  // Stub — no-op
};

export const getSubscriptionProducts = async () => {
  // Stub — returns empty until store products are created
  return [];
};

export const purchaseSubscription = async (
  productId: string
): Promise<boolean> => {
  // Stub — shows alert until store accounts are ready
  console.log('IAP not yet configured. Product ID:', productId);
  return false;
};

export const restorePurchases = async (
  userId: string
): Promise<{ restored: boolean; tier: string }> => {
  // Stub
  return { restored: false, tier: 'free' };
};

export const updateUserTierInDB = async (
  userId: string,
  tier: 'free' | 'pro' | 'premium'
): Promise<void> => {
  // This one is real — updates Supabase directly
  // Used by admin/manual tier updates until IAP is live
  await supabase
    .from('subscriptions')
    .upsert(
      {
        user_id: userId,
        tier,
        status: 'active',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );
};

export const setupPurchaseListeners = (userId: string): (() => void) => {
  // Stub — returns empty cleanup function
  // Real listeners activate when react-native-iap is fully configured
  return () => {};
};