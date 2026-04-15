import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { AndroidSafeView } from '../../modules/shared/AndriodSafeView';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { colors, spacing, radius, fontSize } from '../../theme';

const CREDIT_PACKAGES = [
  {
    id: 'starter',
    points: 100,
    price: '$0.99',
    label: 'Starter Pack',
    bonus: null,
    color: '#6B7280',
  },
  {
    id: 'popular',
    points: 500,
    price: '$3.99',
    label: 'Popular Pack',
    bonus: '+50 bonus',
    popular: true,
    color: '#F59E0B',
  },
  {
    id: 'value',
    points: 1200,
    price: '$7.99',
    label: 'Value Pack',
    bonus: '+200 bonus',
    color: '#0DAE6C',
  },
  {
    id: 'mega',
    points: 3000,
    price: '$14.99',
    label: 'Mega Pack',
    bonus: '+500 bonus',
    color: '#B280FF',
  },
];

const WHAT_YOU_CAN_DO = [
  { icon: 'videocam-outline', label: 'Watch a live stream', cost: '30 pts', color: '#0DAE6C' },
  { icon: 'chatbubble-ellipses-outline', label: '5 bonus Coach prompts', cost: '20 pts', color: '#6699FF' },
  { icon: 'flame-outline', label: 'Streak freeze (1 day)', cost: '40 pts', color: '#F59E0B' },
  { icon: 'star-outline', label: 'Premium feature for 24hrs', cost: '80 pts', color: '#B280FF' },
  { icon: 'people-outline', label: 'Join premium group', cost: '50 pts', color: '#FFD133' },
];

export default function PurchaseCreditsScreen() {
  const navigation = useNavigation<any>();
  const { colorScheme } = useThemeStore();
  const theme = colors[colorScheme];

  const handlePurchase = (pack: typeof CREDIT_PACKAGES[0]) => {
    Alert.alert(
      'Payment Coming Soon',
      `${pack.label} — ${pack.points} CalFit Points for ${pack.price}. In-app purchases will be enabled once the App Store and Play Store developer accounts are set up.`,
      [{ text: 'OK' }]
    );
  };

  return (

    <AndroidSafeView backgroundColor={theme.bg} style={styles.safe}>
        <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={26} color={theme.textPrimary} />
          <Text style={[styles.backText, { color: theme.textPrimary }]}>Credits</Text>
        </TouchableOpacity>
        <Text style={[styles.pageTitle, { color: theme.textPrimary }]}>Buy Points</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Purchase CalFit Points to unlock features instantly without a subscription.
        </Text>

        {/* Packages */}
        {CREDIT_PACKAGES.map((pack) => (
          <TouchableOpacity
            key={pack.id}
            onPress={() => handlePurchase(pack)}
            style={[styles.packCard, {
              backgroundColor: theme.card,
              borderColor: pack.popular ? pack.color : theme.border,
              borderWidth: pack.popular ? 2 : 1,
            }]}
          >
            {pack.popular && (
              <View style={[styles.popularBadge, { backgroundColor: pack.color }]}>
                <Text style={styles.popularBadgeText}>BEST VALUE</Text>
              </View>
            )}
            <View style={styles.packLeft}>
              <View style={[styles.packIconWrap, { backgroundColor: pack.color + '22' }]}>
                <Text style={styles.pointsStar}>✦</Text>
              </View>
              <View>
                <Text style={[styles.packLabel, { color: theme.textPrimary }]}>{pack.label}</Text>
                <Text style={[styles.packPoints, { color: pack.color }]}>
                  {pack.points.toLocaleString()} points
                  {pack.bonus && (
                    <Text style={[styles.packBonus, { color: pack.color }]}> {pack.bonus}</Text>
                  )}
                </Text>
              </View>
            </View>
            <View style={[styles.packPriceBtn, { backgroundColor: pack.color }]}>
              <Text style={styles.packPrice}>{pack.price}</Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* What can you do */}
        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
          What You Can Unlock
        </Text>
        <View style={[styles.usageCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {WHAT_YOU_CAN_DO.map((item) => (
            <View key={item.label} style={styles.usageRow}>
              <View style={[styles.usageIcon, { backgroundColor: item.color + '22' }]}>
                <Ionicons name={item.icon as any} size={18} color={item.color} />
              </View>
              <Text style={[styles.usageLabel, { color: theme.textPrimary }]}>{item.label}</Text>
              <Text style={[styles.usageCost, { color: item.color }]}>{item.cost}</Text>
            </View>
          ))}
        </View>

        <Text style={[styles.disclaimer, { color: theme.textMuted }]}>
          Points never expire. Purchases are non-refundable. Processed via App Store / Google Play.
        </Text>
      </ScrollView>
    </AndroidSafeView>
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
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },

  packCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  popularBadge: {
    position: 'absolute',
    top: 0, right: 0,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderBottomLeftRadius: radius.sm,
  },
  popularBadgeText: { fontSize: 8, fontWeight: '800', color: '#0C0D10', letterSpacing: 0.5 },
  packLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  packIconWrap: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  pointsStar: { fontSize: fontSize.lg, color: '#FFD133', fontWeight: '700' },
  packLabel: { fontSize: fontSize.base, fontWeight: '700' },
  packPoints: { fontSize: fontSize.sm, fontWeight: '600', marginTop: 2 },
  packBonus: { fontSize: fontSize.xs, fontWeight: '700', opacity: 0.8 },
  packPriceBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  packPrice: { fontSize: fontSize.base, fontWeight: '800', color: '#0C0D10' },

  sectionLabel: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },

  usageCard: {
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
  },
  usageRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  usageIcon: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  usageLabel: { flex: 1, fontSize: fontSize.base },
  usageCost: { fontSize: fontSize.sm, fontWeight: '700' },

  disclaimer: {
    fontSize: fontSize.xs,
    textAlign: 'center',
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
    lineHeight: 18,
  },
});