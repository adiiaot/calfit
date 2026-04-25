import { Platform } from 'react-native';
import { supabase } from './supabase';

// ── PRODUCT IDS ───────────────────────────────────────────────
// Bundle ID updated to com.bigcutstore.calfit (was com.fabsdevelopment.calfit)
// These must match EXACTLY what you create in:
// - Google Play Console → Subscriptions
// - App Store Connect → In-App Purchases
export const PRODUCT_IDS = {
  pro: Platform.select({
    ios:     'com.bigcutstore.calfit.pro.monthly',
    android: 'com.bigcutstore.calfit.pro.monthly',
  }) ?? 'com.bigcutstore.calfit.pro.monthly',

  premium: Platform.select({
    ios:     'com.bigcutstore.calfit.premium.monthly',
    android: 'com.bigcutstore.calfit.premium.monthly',
  }) ?? 'com.bigcutstore.calfit.premium.monthly',
};

export const ALL_PRODUCT_IDS = [PRODUCT_IDS.pro, PRODUCT_IDS.premium];

// ── IAP STATUS ────────────────────────────────────────────────
// IAP is STUBBED until store accounts and products are created.
//
// To activate full IAP:
// 1. Create Google Play developer account ($25 one-time)
//    → Play Console → CalFit app → Monetize → Subscriptions
//    → Create: com.bigcutstore.calfit.pro.monthly
//    → Create: com.bigcutstore.calfit.premium.monthly
//
// 2. Create Apple Developer account ($99/yr)
//    → App Store Connect → CalFit → In-App Purchases
//    → Create auto-renewable subscriptions with same product IDs
//
// 3. Run: expo prebuild (generates android/ and ios/ folders)
//    Then: eas build --profile development
//    (react-native-iap needs a dev build — won't work in Expo Go)
//
// 4. Replace the stub functions below with the real implementations
//    in the ACTIVATION BLOCK at the bottom of this file.
// ─────────────────────────────────────────────────────────────

export const initIAP = async (): Promise<boolean> => {
  // Stub — returns true so app doesn't crash before IAP is configured
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
  // Stub — IAP not yet configured
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
  // REAL — updates Supabase. Used for manual tier updates and
  // will be called by purchase listeners when IAP is live.
  await supabase
    .from('subscriptions')
    .upsert(
      {
        user_id: userId,
        plan: tier,
        status: 'active',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

  // Also update profiles.subscription_tier for quick reads
  await supabase
    .from('profiles')
    .update({ subscription_tier: tier })
    .eq('id', userId);
};

export const setupPurchaseListeners = (userId: string): (() => void) => {
  // Stub — real listeners activate when IAP is configured
  // When live: listen for purchaseUpdatedListener and purchaseErrorListener
  // from react-native-iap, call updateUserTierInDB on success,
  // then call finishTransaction to acknowledge the purchase.
  return () => {};
};

// ── ACTIVATION BLOCK ──────────────────────────────────────────
// When store products are ready, replace the stubs above with:
//
// import {
//   initConnection,
//   endConnection,
//   getSubscriptions,
//   requestSubscription,
//   purchaseUpdatedListener,
//   purchaseErrorListener,
//   finishTransaction,
//   getAvailablePurchases,
// } from 'react-native-iap';
//
// export const initIAP = async (): Promise<boolean> => {
//   try {
//     await initConnection();
//     return true;
//   } catch (e) {
//     console.error('IAP init failed:', e);
//     return false;
//   }
// };
//
// export const endIAP = async () => {
//   try { await endConnection(); } catch {}
// };
//
// export const getSubscriptionProducts = async () => {
//   try {
//     return await getSubscriptions({ skus: ALL_PRODUCT_IDS });
//   } catch (e) {
//     console.error('getSubscriptions failed:', e);
//     return [];
//   }
// };
//
// export const purchaseSubscription = async (productId: string): Promise<boolean> => {
//   try {
//     await requestSubscription({ sku: productId });
//     return true;
//   } catch (e: any) {
//     if (e.code !== 'E_USER_CANCELLED') {
//       console.error('Purchase failed:', e);
//     }
//     return false;
//   }
// };
//
// export const restorePurchases = async (userId: string) => {
//   try {
//     const purchases = await getAvailablePurchases();
//     const premiumPurchase = purchases.find(p => p.productId === PRODUCT_IDS.premium);
//     const proPurchase = purchases.find(p => p.productId === PRODUCT_IDS.pro);
//     const tier = premiumPurchase ? 'premium' : proPurchase ? 'pro' : 'free';
//     if (tier !== 'free') {
//       await updateUserTierInDB(userId, tier);
//       return { restored: true, tier };
//     }
//     return { restored: false, tier: 'free' };
//   } catch (e) {
//     console.error('Restore failed:', e);
//     return { restored: false, tier: 'free' };
//   }
// };
//
// export const setupPurchaseListeners = (userId: string): (() => void) => {
//   const purchaseUpdate = purchaseUpdatedListener(async (purchase) => {
//     const receipt = purchase.transactionReceipt;
//     if (receipt) {
//       const tier = purchase.productId === PRODUCT_IDS.premium ? 'premium' : 'pro';
//       await updateUserTierInDB(userId, tier);
//       await finishTransaction({ purchase, isConsumable: false });
//     }
//   });
//   const purchaseError = purchaseErrorListener((error) => {
//     if (error.code !== 'E_USER_CANCELLED') {
//       console.error('Purchase error:', error);
//     }
//   });
//   return () => {
//     purchaseUpdate.remove();
//     purchaseError.remove();
//   };
// };