import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { AndroidSafeView } from '../../modules/shared/AndriodSafeView';
import { useState, useEffect } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, radius, fontSize } from '../../theme';
import {
  initIAP,
  endIAP,
  getSubscriptionProducts,
  purchaseSubscription,
  restorePurchases,
  PRODUCT_IDS,
} from '../../services/iapService';

const TIERS = [
  {
    id: 'free',
    name: 'Free',
    price: '₦0',
    period: 'forever',
    color: '#6B7280',
    features: [
      'Basic calorie tracking',
      'Water logging',
      'Step tracking',
      '1 community group',
      'Workout library access',
    ],
    missing: [
      'Food scanner',
      'AI Meal Planner',
      'CalFit Coach (unlimited)',
      'Live streaming',
      'Accountability partners',
      'Referral earnings wallet',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '₦4,999',
    period: 'per month',
    color: '#0DAE6C',
    productId: PRODUCT_IDS.pro,
    features: [
      '20 AI Coach prompts per day',
      'Food scanner (barcode + AI vision)',
      'Up to 5 community groups',
      'Accountability partners (up to 3)',
      'Advanced macro tracking',
      'No ads',
      'Priority support',
    ],
    missing: [
      'AI Meal Planner',
      'Live streaming',
      'Referral earnings wallet',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '₦8,999',
    period: 'per month',
    color: '#F59E0B',
    productId: PRODUCT_IDS.premium,
    badge: 'BEST VALUE',
    features: [
      'Unlimited AI Coach prompts',
      'AI Meal Planner (full access)',
      'Food scanner (barcode + AI vision)',
      'Live streaming access',
      'Unlimited community groups',
      'Accountability partners (up to 3)',
      'Referral earnings wallet',
      'No ads',
      'Priority support',
    ],
    missing: [],
  },
];

export default function SubscriptionScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { colorScheme } = useThemeStore();
  const { user, userTier } = useAuthStore();
  const { setOnboarding } = useAuthStore(); // add this to reset onboarding state if user came from onboarding flow and hit back from subscription screen
  const theme = colors[colorScheme];

  // fromOnboarding flag — passed from paywall handleTrial/handlePayNow
  // When true, back button goes to main app instead of trying goBack()
  // which would fail because there's no screen behind it in the auth stack
  const fromOnboarding = route.params?.fromOnboarding ?? false;
  const preselectedPlan = route.params?.plan ?? null;
  const isTrial = route.params?.trial ?? false;

  const [isLoading, setIsLoading]     = useState(false);
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [iapReady, setIapReady]       = useState(false);

  useEffect(() => {
    const init = async () => {
      const ready = await initIAP();
      setIapReady(ready);
    };
    init();
    return () => { endIAP(); };
  }, []);

 const handleBack = () => {
  if (navigation.canGoBack()) {
    navigation.goBack(); // goes back to paywall inside OnboardingScreen
  }
};

  const handleSubscribe = async (tier: typeof TIERS[0]) => {
    if (tier.id === 'free' || !tier.productId) return;

    // IAP is stubbed — show clear explanation with next steps
    // When store products are created and dev build is ready,
    // replace this Alert with: await purchaseSubscription(tier.productId)
    Alert.alert(
      '🚀 Almost ready!',
      `CalFit ${tier.name} payments are being set up in the App Store and Google Play.\n\nYou'll be able to subscribe directly through your ${Platform.OS === 'ios' ? 'Apple ID' : 'Google Play'} account — no new account needed.\n\nWe'll notify you the moment it's live!`,
      [
        { text: 'Remind me later', style: 'cancel' },
        {
          text: 'Continue on Free',
        // When user taps "Continue on Free" in the alert:
         onPress: () => {
         setOnboarding(false); // NOW release to main app
},
        },
      ]
    );
  };

  const handleRestore = async () => {
    if (!user?.id) return;
    setIsRestoring(true);
    const { restored, tier } = await restorePurchases(user.id);
    if (restored) {
      Alert.alert(
        'Purchases Restored ✅',
        `Your ${tier} subscription has been restored.`,
        [{ text: 'OK', onPress: handleBack }]
      );
    } else {
      Alert.alert('Nothing to restore', 'No active subscriptions found for this account.');
    }
    setIsRestoring(false);
  };

  return (
    <AndroidSafeView backgroundColor={theme.bg} style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={26} color={theme.textPrimary} />
          <Text style={[styles.backText, { color: theme.textPrimary }]}>Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Upgrade CalFit</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Hero */}
        <View style={styles.hero}>
          <Text style={[styles.heroTitle, { color: theme.textPrimary }]}>Choose your plan</Text>
          <Text style={[styles.heroSub, { color: theme.textSecondary }]}>
            Unlock the full CalFit experience. Cancel anytime.
          </Text>
        </View>

        {/* IAP coming soon banner */}
        <View style={[styles.comingSoonBanner, { backgroundColor: theme.accentDim as string, borderColor: theme.accent }]}>
          <Ionicons name="time-outline" size={18} color={theme.accent} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.comingSoonTitle, { color: theme.accent }]}>
              In-app payments coming very soon
            </Text>
            <Text style={[styles.comingSoonSub, { color: theme.textSecondary }]}>
              You'll pay directly through your {Platform.OS === 'ios' ? 'App Store' : 'Google Play'} account — fast, secure, no new card needed.
            </Text>
          </View>
        </View>

        {/* How IAP works explainer */}
        <View style={[styles.explainerCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.explainerTitle, { color: theme.textPrimary }]}>How it works</Text>
          {[
            { icon: 'phone-portrait-outline', text: `Tap "Get Pro" or "Get Premium" below` },
            { icon: 'storefront-outline',     text: `Your ${Platform.OS === 'ios' ? 'App Store' : 'Google Play'} payment sheet opens` },
            { icon: 'card-outline',           text: `Pay with your saved card — one tap` },
            { icon: 'checkmark-circle-outline', text: `CalFit Pro/Premium unlocks instantly` },
          ].map((s) => (
            <View key={s.text} style={styles.explainerRow}>
              <View style={[styles.explainerIconWrap, { backgroundColor: theme.accentDim as string }]}>
                <Ionicons name={s.icon as any} size={16} color={theme.accent} />
              </View>
              <Text style={[styles.explainerText, { color: theme.textSecondary }]}>{s.text}</Text>
            </View>
          ))}
        </View>

        {/* Current plan */}
        <View style={[styles.currentPlanBadge, { backgroundColor: theme.accentDim as string, borderColor: theme.accent }]}>
          <Ionicons name="checkmark-circle" size={16} color={theme.accent} />
          <Text style={[styles.currentPlanText, { color: theme.accent }]}>
            Current plan: {userTier ? userTier.charAt(0).toUpperCase() + userTier.slice(1) : 'Free'}
          </Text>
        </View>

        {/* Tier cards */}
        {TIERS.map((tier) => {
          const isCurrent      = userTier === tier.id;
          const isPreselected  = preselectedPlan === tier.id;
          const isLoadingThis  = loadingTier === tier.id && isLoading;

          return (
            <View
              key={tier.id}
              style={[styles.tierCard, {
                backgroundColor: theme.card,
                borderColor: isCurrent ? tier.color : isPreselected ? tier.color + '88' : theme.border,
                borderWidth: isCurrent || isPreselected ? 2 : 1,
              }]}
            >
              {tier.badge && (
                <View style={[styles.tierBadge, { backgroundColor: tier.color }]}>
                  <Text style={styles.tierBadgeText}>{tier.badge}</Text>
                </View>
              )}
              {isCurrent && (
                <View style={[styles.currentBadge, { backgroundColor: tier.color + '22' }]}>
                  <Text style={[styles.currentBadgeText, { color: tier.color }]}>Current Plan</Text>
                </View>
              )}
              {isPreselected && !isCurrent && isTrial && (
                <View style={[styles.currentBadge, { backgroundColor: tier.color + '22' }]}>
                  <Text style={[styles.currentBadgeText, { color: tier.color }]}>3-Day Free Trial</Text>
                </View>
              )}

              <View style={styles.tierHeader}>
                <Text style={[styles.tierName, { color: tier.color }]}>{tier.name}</Text>
                <View style={styles.tierPriceRow}>
                  <Text style={[styles.tierPrice, { color: theme.textPrimary }]}>{tier.price}</Text>
                  <Text style={[styles.tierPeriod, { color: theme.textMuted }]}>/{tier.period}</Text>
                </View>
              </View>

              <View style={styles.featureList}>
                {tier.features.map((f) => (
                  <View key={f} style={styles.featureRow}>
                    <Ionicons name="checkmark-circle" size={16} color={tier.color} />
                    <Text style={[styles.featureText, { color: theme.textPrimary }]}>{f}</Text>
                  </View>
                ))}
                {tier.missing?.map((f) => (
                  <View key={f} style={styles.featureRow}>
                    <Ionicons name="close-circle" size={16} color={theme.textMuted} />
                    <Text style={[styles.featureText, { color: theme.textMuted }]}>{f}</Text>
                  </View>
                ))}
              </View>

              {/* CTA */}
              {tier.id !== 'free' && !isCurrent && (
                <TouchableOpacity
                  onPress={() => handleSubscribe(tier)}
                  disabled={isLoading}
                  style={[styles.ctaBtn, { backgroundColor: tier.color }]}
                >
                  {isLoadingThis
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={styles.ctaBtnText}>
                        {isTrial && preselectedPlan === tier.id
                          ? `Start 3-Day Free Trial`
                          : `Get ${tier.name} — ${tier.price}/mo`}
                      </Text>}
                </TouchableOpacity>
              )}

              {isCurrent && tier.id !== 'free' && (
                <View style={[styles.activeTag, { backgroundColor: tier.color + '18', borderColor: tier.color }]}>
                  <Ionicons name="checkmark-circle" size={16} color={tier.color} />
                  <Text style={[styles.activeTagText, { color: tier.color }]}>
                    Active — managed in {Platform.OS === 'ios' ? 'App Store' : 'Google Play'}
                  </Text>
                </View>
              )}
            </View>
          );
        })}
        
          {/* Skip to free — only shown when coming from onboarding paywall */}
          {fromOnboarding && (
            <TouchableOpacity
             onPress={() => setOnboarding(false)}
               style={styles.skipBtn}
     >
            <Text style={[styles.skipText, { color: theme.textMuted }]}>
              Continue with Free plan — I'll upgrade later
           </Text>
              </TouchableOpacity>
)}

{/* Restore */}
<TouchableOpacity onPress={handleRestore} disabled={isRestoring} style={styles.restoreBtn}></TouchableOpacity>
        {/* Restore */}
        <TouchableOpacity onPress={handleRestore} disabled={isRestoring} style={styles.restoreBtn}>
          {isRestoring
            ? <ActivityIndicator size="small" color={theme.textMuted} />
            : <Text style={[styles.restoreText, { color: theme.textMuted }]}>Restore previous purchases</Text>}
        </TouchableOpacity>

        <Text style={[styles.legalNote, { color: theme.textMuted }]}>
          Subscriptions automatically renew unless cancelled at least 24 hours before the end of the current period.
          Manage or cancel in your {Platform.OS === 'ios' ? 'App Store' : 'Google Play'} account settings.
        </Text>
      </ScrollView>
    </AndroidSafeView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scrollContent: { paddingBottom: 60 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  backText: { fontSize: fontSize.lg, fontWeight: '400' },
  title: { fontSize: fontSize.lg, fontWeight: '700' },

  hero: { alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.lg, gap: spacing.xs },
  heroTitle: { fontSize: fontSize.xxl, fontWeight: '800', textAlign: 'center' },
  heroSub: { fontSize: fontSize.base, textAlign: 'center' },

  comingSoonBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm,
    marginHorizontal: spacing.lg, marginBottom: spacing.md,
    padding: spacing.md, borderRadius: radius.lg, borderWidth: 1,
  },
  comingSoonTitle: { fontSize: fontSize.sm, fontWeight: '700', marginBottom: 4 },
  comingSoonSub: { fontSize: fontSize.xs, lineHeight: 16 },

  explainerCard: {
    marginHorizontal: spacing.lg, marginBottom: spacing.md,
    padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, gap: spacing.sm,
  },
  explainerTitle: { fontSize: fontSize.base, fontWeight: '700', marginBottom: 4 },
  explainerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  explainerIconWrap: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  explainerText: { fontSize: fontSize.sm, flex: 1, lineHeight: 18 },

  currentPlanBadge: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    alignSelf: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: radius.full, borderWidth: 1, marginBottom: spacing.lg,
  },
  currentPlanText: { fontSize: fontSize.sm, fontWeight: '600' },

  tierCard: {
    marginHorizontal: spacing.lg, marginBottom: spacing.md,
    padding: spacing.lg, borderRadius: radius.xl, gap: spacing.md,
  },
  tierBadge: { alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.sm, marginBottom: -spacing.xs },
  tierBadgeText: { fontSize: fontSize.xs, fontWeight: '800', color: '#fff' },
  currentBadge: { alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.sm },
  currentBadgeText: { fontSize: fontSize.xs, fontWeight: '700' },

  tierHeader: { gap: 4 },
  tierName: { fontSize: fontSize.xl, fontWeight: '800' },
  tierPriceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  tierPrice: { fontSize: 32, fontWeight: '900' },
  tierPeriod: { fontSize: fontSize.base },

  featureList: { gap: spacing.xs },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  featureText: { fontSize: fontSize.base, flex: 1 },

  ctaBtn: { padding: spacing.lg, borderRadius: radius.lg, alignItems: 'center' },
  ctaBtnText: { fontSize: fontSize.lg, fontWeight: '700', color: '#fff' },

  activeTag: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    padding: spacing.sm, borderRadius: radius.md, borderWidth: 1,
  },
  activeTagText: { fontSize: fontSize.sm, fontWeight: '600' },

  restoreBtn: { alignItems: 'center', padding: spacing.lg, marginTop: spacing.sm },
  restoreText: { fontSize: fontSize.sm },

  skipBtn: { padding: spacing.lg, alignItems: 'center' },
skipText: { fontSize: fontSize.sm, fontWeight: '600', textDecorationLine: 'underline' },

  legalNote: { fontSize: fontSize.xs, lineHeight: 16, textAlign: 'center', paddingHorizontal: spacing.xl, paddingBottom: spacing.lg },
});