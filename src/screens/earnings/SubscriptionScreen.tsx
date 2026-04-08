import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, radius, fontSize } from '../../theme';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    color: '#6B7280',
    description: 'Get started with the basics',
    features: [
      '5 AI Coach prompts per day',
      'Basic calorie tracking',
      'Manual food logging',
      'Step tracking',
      'Ads shown',
    ],
    missing: [
      'Food scanner (Claude Vision)',
      'AI meal plans',
      'Live streaming',
      'Earnings wallet',
      'Unlimited Coach prompts',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$9.99',
    period: 'per month',
    color: '#F59E0B',
    description: 'For serious fitness enthusiasts',
    popular: true,
    features: [
      '20 AI Coach prompts per day',
      'Food scanner (Claude Vision)',
      'Manual meal planner',
      'No ads',
      'Accountability partner',
      'Community groups',
      'Advanced analytics',
      'Priority support',
    ],
    missing: [
      'Live streaming',
      'Earnings wallet',
      'Unlimited Coach prompts',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '$19.99',
    period: 'per month',
    color: '#0DAE6C',
    description: 'The full CalFit experience',
    features: [
      'Unlimited AI Coach prompts',
      'Food scanner (Claude Vision)',
      'AI-generated meal plans',
      'Live streaming access',
      'Earnings & referral wallet',
      'No ads ever',
      'All Pro features included',
      'Early access to new features',
      'Priority 1-on-1 support',
    ],
    missing: [],
  },
];

function PlanCard({
  plan,
  theme,
  isCurrent,
  onSelect,
}: {
  plan: typeof PLANS[0];
  theme: typeof colors.dark;
  isCurrent: boolean;
  onSelect: () => void;
}) {
  return (
    <View style={[styles.planCard, {
      backgroundColor: theme.card,
      borderColor: isCurrent ? plan.color : theme.border,
      borderWidth: isCurrent ? 2 : 1,
    }]}>
      {/* Popular badge */}
      {plan.popular && (
        <View style={[styles.popularBadge, { backgroundColor: plan.color }]}>
          <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
        </View>
      )}

      {/* Plan header */}
      <View style={styles.planHeader}>
        <View>
          <Text style={[styles.planName, { color: plan.color }]}>{plan.name}</Text>
          <Text style={[styles.planDescription, { color: theme.textSecondary }]}>
            {plan.description}
          </Text>
        </View>
        <View style={styles.planPriceWrap}>
          <Text style={[styles.planPrice, { color: theme.textPrimary }]}>{plan.price}</Text>
          <Text style={[styles.planPeriod, { color: theme.textMuted }]}>{plan.period}</Text>
        </View>
      </View>

      {/* Features */}
      <View style={styles.featuresList}>
        {plan.features.map((f) => (
          <View key={f} style={styles.featureRow}>
            <Ionicons name="checkmark-circle" size={16} color={plan.color} />
            <Text style={[styles.featureText, { color: theme.textPrimary }]}>{f}</Text>
          </View>
        ))}
        {plan.missing.map((f) => (
          <View key={f} style={styles.featureRow}>
            <Ionicons name="close-circle" size={16} color={theme.textMuted} />
            <Text style={[styles.featureTextMissing, { color: theme.textMuted }]}>{f}</Text>
          </View>
        ))}
      </View>

      {/* CTA */}
      {isCurrent ? (
        <View style={[styles.currentPlanBtn, {
          backgroundColor: plan.color + '22',
          borderColor: plan.color,
        }]}>
          <Ionicons name="checkmark-circle" size={16} color={plan.color} />
          <Text style={[styles.currentPlanBtnText, { color: plan.color }]}>
            Current Plan
          </Text>
        </View>
      ) : (
        <TouchableOpacity
          onPress={onSelect}
          style={[styles.selectPlanBtn, { backgroundColor: plan.color }]}
        >
          <Text style={[styles.selectPlanBtnText, { color: plan.id === 'free' ? '#fff' : '#0C0D10' }]}>
            {plan.id === 'free' ? 'Downgrade to Free' : `Upgrade to ${plan.name}`}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function SubscriptionScreen() {
  const navigation = useNavigation<any>();
  const { colorScheme } = useThemeStore();
  const { userTier } = useAuthStore();
  const theme = colors[colorScheme];

  const handleSelectPlan = (planId: string) => {
    if (planId === 'free') {
      Alert.alert(
        'Downgrade to Free',
        'You will lose access to all Pro/Premium features at the end of your billing cycle.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Downgrade', style: 'destructive', onPress: () => {} },
        ]
      );
      return;
    }
    Alert.alert(
      'Payment Coming Soon',
      'Stripe payment integration will be connected once the Stripe account is set up. You will be able to subscribe directly from here.',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={26} color={theme.textPrimary} />
          <Text style={[styles.backText, { color: theme.textPrimary }]}>Credits</Text>
        </TouchableOpacity>
        <Text style={[styles.pageTitle, { color: theme.textPrimary }]}>Choose a Plan</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Unlock the full power of CalFit with a Pro or Premium subscription.
        </Text>

        {PLANS.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            theme={theme}
            isCurrent={userTier === plan.id}
            onSelect={() => handleSelectPlan(plan.id)}
          />
        ))}

        <Text style={[styles.disclaimer, { color: theme.textMuted }]}>
          Payments are processed securely via Stripe. Cancel anytime from your account settings. No hidden fees.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scrollContent: { paddingBottom: 100, paddingTop: spacing.sm },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  backText: { fontSize: fontSize.lg, fontWeight: '400' },
  pageTitle: { fontSize: fontSize.lg, fontWeight: '700' },

  subtitle: {
    fontSize: fontSize.base,
    textAlign: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },

  planCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  popularBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
    marginBottom: spacing.sm,
  },
  popularBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0C0D10',
    letterSpacing: 0.5,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  planName: { fontSize: fontSize.xxl, fontWeight: '800' },
  planDescription: { fontSize: fontSize.sm, marginTop: 2 },
  planPriceWrap: { alignItems: 'flex-end' },
  planPrice: { fontSize: fontSize.xxl, fontWeight: '800' },
  planPeriod: { fontSize: fontSize.xs },

  featuresList: { gap: spacing.sm, marginBottom: spacing.lg },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  featureText: { fontSize: fontSize.base, flex: 1 },
  featureTextMissing: { fontSize: fontSize.base, flex: 1 },

  currentPlanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  currentPlanBtnText: { fontSize: fontSize.base, fontWeight: '700' },
  selectPlanBtn: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  selectPlanBtnText: { fontSize: fontSize.lg, fontWeight: '700' },

  disclaimer: {
    fontSize: fontSize.xs,
    textAlign: 'center',
    marginHorizontal: spacing.xl,
    marginTop: spacing.sm,
    lineHeight: 18,
  },
});