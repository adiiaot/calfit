import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ToastAndroid,
  Platform,
} from 'react-native';
import { AndroidSafeView } from '../../modules/shared/AndriodSafeView';
import { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, radius, fontSize } from '../../theme';

// ── WALLET HERO ───────────────────────────────────────────────
function WalletHero({
  theme,
  balance,
  lifetimeEarned,
  earnedToday,
  onEarnMore,
}: {
  theme: typeof colors.dark;
  balance: number;
  lifetimeEarned: number;
  earnedToday: number;
  onEarnMore: () => void;
}) {
  return (
    <View style={[styles.walletHero, {
      backgroundColor: theme.card,
      borderColor: balance > 0 ? theme.gold : theme.border,
    }]}>
      <View style={styles.walletTop}>
        <View>
          <Text style={[styles.walletLabel, { color: theme.textSecondary }]}>
            CalFit Points Balance
          </Text>
          <View style={styles.walletBalanceRow}>
            <Text style={[styles.pointsStar, { color: theme.gold }]}>✦</Text>
            <Text style={[styles.walletBalance, { color: balance > 0 ? theme.gold : theme.textMuted }]}>
              {balance.toLocaleString()}
            </Text>
            <Text style={[styles.walletBalanceSub, { color: theme.textSecondary }]}> pts</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={onEarnMore}
          style={[styles.earnMoreBtn, {
            backgroundColor: theme.gold + '22',
            borderColor: theme.gold,
          }]}
        >
          <Text style={[styles.earnMoreText, { color: theme.gold }]}>+ Earn More</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.walletDivider, { backgroundColor: theme.border }]} />

      <View style={styles.walletStats}>
        {[
          { label: 'Earned Today', value: `+${earnedToday}` },
          { label: 'Lifetime Earned', value: lifetimeEarned.toLocaleString() },
        ].map((s) => (
          <View key={s.label} style={styles.walletStat}>
            <Text style={[styles.walletStatValue, { color: theme.textPrimary }]}>{s.value}</Text>
            <Text style={[styles.walletStatLabel, { color: theme.textMuted }]}>{s.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ── EMPTY STATE ───────────────────────────────────────────────
function EmptyState({
  theme,
  onUpgrade,
  onWatchAd,
}: {
  theme: typeof colors.dark;
  onUpgrade: () => void;
  onWatchAd: () => void;
}) {
  return (
    <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text style={styles.emptyEmoji}>✦</Text>
      <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
        No Points Yet
      </Text>
      <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
        Watch an ad to earn your first 10 points, or upgrade to Pro/Premium for exclusive access to all features.
      </Text>
      <TouchableOpacity
        onPress={onWatchAd}
        style={[styles.watchAdBtn, { backgroundColor: theme.accent }]}
      >
        <Ionicons name="play-circle" size={20} color={theme.bg} />
        <Text style={[styles.watchAdBtnText, { color: theme.bg }]}>
          Watch Ad — Earn 10 Points
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onUpgrade}
        style={[styles.upgradeBtn, { borderColor: theme.gold }]}
      >
        <Ionicons name="star" size={16} color={theme.gold} />
        <Text style={[styles.upgradeBtnText, { color: theme.gold }]}>
          Upgrade to Pro or Premium
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ── HOW TO EARN ───────────────────────────────────────────────
function HowToEarn({
  theme,
  onWatchAd,
}: {
  theme: typeof colors.dark;
  onWatchAd: () => void;
}) {
  const ways = [
    { icon: 'play-circle-outline', label: 'Watch an ad', points: '+10 pts', color: theme.accent },
    { icon: 'calendar-outline', label: 'Daily login', points: '+5 pts', color: theme.accentSecond },
    { icon: 'checkmark-circle-outline', label: 'Hit daily goal', points: '+5 pts', color: theme.purple },
    { icon: 'person-add-outline', label: 'Invite a friend', points: '+50 pts', color: theme.gold },
    { icon: 'trophy-outline', label: 'Milestone badge', points: '+20–100 pts', color: theme.orange },
  ];

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>How to Earn Points</Text>
      {ways.map((w) => (
        <View key={w.label} style={styles.earnRow}>
          <View style={[styles.earnIconWrap, { backgroundColor: w.color + '22' }]}>
            <Ionicons name={w.icon as any} size={20} color={w.color} />
          </View>
          <Text style={[styles.earnLabel, { color: theme.textPrimary }]}>{w.label}</Text>
          <Text style={[styles.earnPoints, { color: theme.gold }]}>{w.points}</Text>
        </View>
      ))}
      <TouchableOpacity
        onPress={onWatchAd}
        style={[styles.watchAdBtn, { backgroundColor: theme.accent }]}
      >
        <Ionicons name="play-circle" size={20} color={theme.bg} />
        <Text style={[styles.watchAdBtnText, { color: theme.bg }]}>
          Watch Ad — Earn 10 Points
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ── SPEND STORE ───────────────────────────────────────────────
function SpendStore({ theme, balance }: { theme: typeof colors.dark; balance: number }) {
  const navigation = useNavigation<any>();

  const items = [
    { icon: 'videocam-outline', title: 'Watch a Live Stream', desc: 'Access 1 live session', cost: 30, color: theme.accent },
    { icon: 'chatbubble-ellipses-outline', title: 'Extra Coach Prompts', desc: '5 bonus prompts today', cost: 20, color: theme.accentSecond },
    { icon: 'flame-outline', title: 'Streak Freeze', desc: 'Protect streak for 1 day', cost: 40, color: theme.orange },
    { icon: 'star-outline', title: 'Premium Feature — 24hrs', desc: 'Unlock any premium feature', cost: 80, color: theme.purple },
    { icon: 'people-outline', title: 'Join Premium Group', desc: 'Access a premium group', cost: 50, color: theme.gold },
  ];

  const handleSpend = (item: typeof items[0]) => {
    if (balance < item.cost) {
      Alert.alert(
        'Not enough points',
        `You need ${item.cost} points but only have ${balance}. Earn more by watching ads or invite friends.`,
        [{ text: 'OK' }]
      );
      return;
    }
    Alert.alert(
      `Unlock ${item.title}?`,
      `This will use ${item.cost} CalFit Points from your balance.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => {} },
      ]
    );
  };

  return (
    <>
      <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Spend Points</Text>
      {items.map((item) => (
        <View key={item.title} style={[styles.storeItem, {
          backgroundColor: theme.card,
          borderColor: theme.border,
        }]}>
          <View style={[styles.storeIconWrap, { backgroundColor: item.color + '22' }]}>
            <Ionicons name={item.icon as any} size={22} color={item.color} />
          </View>
          <View style={styles.storeInfo}>
            <Text style={[styles.storeTitle, { color: theme.textPrimary }]}>{item.title}</Text>
            <Text style={[styles.storeDesc, { color: theme.textMuted }]}>{item.desc}</Text>
          </View>
          <TouchableOpacity
            onPress={() => handleSpend(item)}
            style={[styles.spendBtn, {
              backgroundColor: item.color + '22',
              borderColor: item.color,
              opacity: balance < item.cost ? 0.5 : 1,
            }]}
          >
            <Text style={[styles.spendBtnText, { color: item.color }]}>✦ {item.cost}</Text>
          </TouchableOpacity>
        </View>
      ))}

      {/* Buy more credits */}
      <TouchableOpacity
        onPress={() => navigation.navigate('PurchaseCredits' as never)}
        style={[styles.buyMoreBtn, {
          backgroundColor: theme.gold + '15',
          borderColor: theme.gold,
        }]}
      >
        <Text style={styles.pointsStar}>✦</Text>
        <Text style={[styles.buyMoreText, { color: theme.gold }]}>Buy More Points</Text>
        <Ionicons name="chevron-forward" size={16} color={theme.gold} />
      </TouchableOpacity>
    </>
  );
}

// ── REFERRAL SECTION ──────────────────────────────────────────
function ReferralSection({
  theme,
  referralCode,
  referralStats,
  walletBalance,
}: {
  theme: typeof colors.dark;
  referralCode: string;
  referralStats: { total: number; paid: number; free: number };
  walletBalance: number;
}) {
  const [copied, setCopied] = useState(false);
  const inviteLink = `https://calfit.app/ref/${referralCode}`;

  const handleCopy = async () => {
    await Clipboard.setStringAsync(inviteLink);
    setCopied(true);

    // Show platform-appropriate toast
    if (Platform.OS === 'android') {
      ToastAndroid.show('Referral link copied! 🎉', ToastAndroid.SHORT);
    }

    setTimeout(() => setCopied(false), 3000);
  };

  const handleShare = async () => {
    Alert.alert(
      'Share Your Link',
      `Share this link with friends:\n\n${inviteLink}\n\nYou earn 15% of their subscription for 5 years!`,
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Referral Earnings</Text>
      <Text style={[styles.referralSub, { color: theme.textSecondary }]}>
        Earn 15% of every referred user's subscription for 5 years automatically.
      </Text>

      {/* Invite link */}
      <Text style={[styles.linkLabel, { color: theme.textMuted }]}>Your invite link</Text>
      <View style={[styles.inviteLink, { backgroundColor: theme.bg, borderColor: theme.border }]}>
        <Text style={[styles.inviteLinkText, { color: theme.textPrimary }]} numberOfLines={1}>
          {inviteLink}
        </Text>
        <TouchableOpacity onPress={handleCopy} style={styles.copyBtn}>
          {copied ? (
            <Ionicons name="checkmark-circle" size={22} color={theme.accent} />
          ) : (
            <Ionicons name="copy-outline" size={20} color={theme.accent} />
          )}
        </TouchableOpacity>
      </View>

      {/* Copy confirmation banner */}
      {copied && (
        <View style={[styles.copiedBanner, {
          backgroundColor: theme.accent + '22',
          borderColor: theme.accent,
        }]}>
          <Ionicons name="checkmark-circle" size={16} color={theme.accent} />
          <Text style={[styles.copiedBannerText, { color: theme.accent }]}>
            Referral link copied! Share it anywhere 🎉
          </Text>
        </View>
      )}

      <TouchableOpacity
        onPress={handleShare}
        style={[styles.shareBtn, { borderColor: theme.accent }]}
      >
        <Ionicons name="share-social-outline" size={18} color={theme.accent} />
        <Text style={[styles.shareBtnText, { color: theme.accent }]}>Share Invite Link</Text>
      </TouchableOpacity>

      {/* Referral stats */}
      <View style={styles.refStats}>
        {[
          { label: 'Total Invited', value: referralStats.total.toString(), color: theme.textPrimary },
          { label: 'On Paid Plan', value: referralStats.paid.toString(), color: theme.accent },
          { label: 'On Free Plan', value: referralStats.free.toString(), color: theme.accentSecond },
        ].map((s) => (
          <View key={s.label} style={[styles.refStat, {
            backgroundColor: theme.bg,
            borderColor: theme.border,
          }]}>
            <Text style={[styles.refStatValue, { color: s.color }]}>{s.value}</Text>
            <Text style={[styles.refStatLabel, { color: theme.textMuted }]}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Withdrawal balance */}
      <View style={[styles.withdrawCard, { backgroundColor: theme.bg, borderColor: theme.border }]}>
        <View>
          <Text style={[styles.withdrawLabel, { color: theme.textSecondary }]}>
            Withdrawal Balance
          </Text>
          <Text style={[styles.withdrawAmount, { color: theme.accent }]}>
            ${walletBalance.toFixed(2)}
          </Text>
          <Text style={[styles.withdrawHint, { color: theme.textMuted }]}>
            {walletBalance < 10
              ? `$${(10 - walletBalance).toFixed(2)} more needed to withdraw`
              : 'Available for withdrawal'}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.withdrawBtn, {
            backgroundColor: walletBalance >= 10 ? theme.accent : theme.border,
          }]}
          onPress={() => {
            if (walletBalance < 10) {
              Alert.alert('Minimum not reached', 'You need at least $10 to withdraw.');
              return;
            }
            Alert.alert('Withdrawal', 'Withdrawal via PayPal, Stripe or Bank Transfer will be enabled once payment accounts are connected.');
          }}
        >
          <Text style={[styles.withdrawBtnText, {
            color: walletBalance >= 10 ? theme.bg : theme.textMuted,
          }]}>
            Withdraw →
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── MAIN SCREEN ───────────────────────────────────────────────
export default function CreditsScreen() {
  const navigation = useNavigation<any>();
  const { colorScheme } = useThemeStore();
  const { user, profile, userTier } = useAuthStore();
  const theme = colors[colorScheme];

  const [activeTab, setActiveTab] = useState<'Points' | 'Referrals'>('Points');
  const [balance, setBalance] = useState(0);
  const [lifetimeEarned, setLifetimeEarned] = useState(0);
  const [walletBalance, setWalletBalance] = useState(0);
  const [referralStats, setReferralStats] = useState({ total: 0, paid: 0, free: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.id) loadData();
  }, [user?.id]);

  const loadData = async () => {
    if (!user?.id) return;
    try {
      const { supabase } = await import('../../services/supabase');
      const [pointsData, walletData, referralsData] = await Promise.all([
        supabase.from('calfit_points').select('*').eq('user_id', user.id).single(),
        supabase.from('earnings_wallet').select('*').eq('user_id', user.id).single(),
        supabase.from('referrals').select('*').eq('referrer_id', user.id),
      ]);

      if (pointsData.data) {
        setBalance(pointsData.data.balance ?? 0);
        setLifetimeEarned(pointsData.data.lifetime_earned ?? 0);
      }
      if (walletData.data) {
        setWalletBalance(walletData.data.balance ?? 0);
      }
      if (referralsData.data) {
        setReferralStats({
          total: referralsData.data.length,
          paid: referralsData.data.filter((r: any) => r.status === 'active').length,
          free: referralsData.data.filter((r: any) => r.status !== 'active').length,
        });
      }
    } catch (error) {
      console.error('Failed to load credits data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWatchAd = () => {
    Alert.alert(
      'Watch Ad',
      'AdMob rewarded ads will be integrated in Phase 5. You will earn 10 points per ad watched.',
      [{ text: 'OK' }]
    );
  };

  const handleUpgrade = () => {
    navigation.navigate('Subscription' as never);
  };

  const referralCode = profile?.referral_code ?? user?.id?.slice(0, 8) ?? 'calfit';

  return (

    <AndroidSafeView backgroundColor={theme.bg} style={styles.safe}>
        <View style={styles.header}>
        <Text style={[styles.pageTitle, { color: theme.textPrimary }]}>Credits & Earnings</Text>
        <Text style={[styles.pageSub, { color: theme.textSecondary }]}>
          Earn points, unlock features, refer friends
        </Text>
      </View>

      {/* Tab toggle */}
      <View style={[styles.tabToggle, { backgroundColor: theme.card, borderColor: theme.border }]}>
        {(['Points', 'Referrals'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tabToggleBtn, activeTab === tab && { backgroundColor: theme.accent }]}
          >
            <Text style={[
              styles.tabToggleText,
              { color: activeTab === tab ? theme.bg : theme.textMuted },
              activeTab === tab && { fontWeight: '700' },
            ]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Wallet hero — always shown */}
        <WalletHero
          theme={theme}
          balance={balance}
          lifetimeEarned={lifetimeEarned}
          earnedToday={0}
          onEarnMore={handleWatchAd}
        />

        {activeTab === 'Points' ? (
          <>
            {/* Upgrade banner for free users */}
            {userTier === 'free' && (
              <TouchableOpacity
                onPress={handleUpgrade}
                style={[styles.upgradeBanner, { backgroundColor: theme.gold + '15', borderColor: theme.gold }]}
              >
                <View>
                  <Text style={[styles.upgradeBannerTitle, { color: theme.gold }]}>
                    Upgrade to Pro or Premium
                  </Text>
                  <Text style={[styles.upgradeBannerSub, { color: theme.textSecondary }]}>
                    Unlock unlimited Coach, food scanner, live streaming and more
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.gold} />
              </TouchableOpacity>
            )}

            {/* Empty state or earn section */}
            {balance === 0 ? (
              <EmptyState
                theme={theme}
                onUpgrade={handleUpgrade}
                onWatchAd={handleWatchAd}
              />
            ) : (
              <HowToEarn theme={theme} onWatchAd={handleWatchAd} />
            )}

            {/* Spend store — always visible */}
            <SpendStore theme={theme} balance={balance} />
          </>
        ) : (
          <ReferralSection
            theme={theme}
            referralCode={referralCode}
            referralStats={referralStats}
            walletBalance={walletBalance}
          />
        )}
      </ScrollView>

    </AndroidSafeView>
  );
}

// ── STYLES ────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1 },
  scrollContent: { paddingBottom: 100 },

  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  pageTitle: { fontSize: fontSize.xxl, fontWeight: '800' },
  pageSub: { fontSize: fontSize.md, marginTop: 2 },

  tabToggle: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  tabToggleBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  tabToggleText: { fontSize: fontSize.base },

  // Wallet hero
  walletHero: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
  },
  walletTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  walletLabel: { fontSize: fontSize.sm, marginBottom: 4 },
  walletBalanceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  pointsStar: { fontSize: fontSize.base, fontWeight: '700' },
  walletBalance: { fontSize: 36, fontWeight: '800' },
  walletBalanceSub: { fontSize: fontSize.lg },
  earnMoreBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  earnMoreText: { fontSize: fontSize.sm, fontWeight: '600' },
  walletDivider: { height: 1, marginVertical: spacing.md },
  walletStats: { flexDirection: 'row', justifyContent: 'space-around' },
  walletStat: { alignItems: 'center' },
  walletStatValue: { fontSize: fontSize.lg, fontWeight: '700' },
  walletStatLabel: { fontSize: fontSize.xs, marginTop: 2 },

  // Empty state
  emptyCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.xl,
    borderRadius: radius.xl,
    borderWidth: 1,
    alignItems: 'center',
    gap: spacing.md,
  },
  emptyEmoji: { fontSize: 44, color: '#FFD133' },
  emptyTitle: { fontSize: fontSize.xl, fontWeight: '700' },
  emptySub: { fontSize: fontSize.base, textAlign: 'center', lineHeight: 20 },

  // Upgrade banner
  upgradeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  upgradeBannerTitle: { fontSize: fontSize.base, fontWeight: '700', marginBottom: 2 },
  upgradeBannerSub: { fontSize: fontSize.sm },

  // Buttons
  watchAdBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    width: '100%',
  },
  watchAdBtnText: { fontSize: fontSize.base, fontWeight: '700' },
  upgradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    width: '100%',
  },
  upgradeBtnText: { fontSize: fontSize.base, fontWeight: '600' },

  // Cards
  card: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
  },
  cardTitle: { fontSize: fontSize.lg, fontWeight: '700' },

  // Earn rows
  earnRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  earnIconWrap: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  earnLabel: { flex: 1, fontSize: fontSize.base },
  earnPoints: { fontSize: fontSize.base, fontWeight: '700' },

  // Spend store
  sectionLabel: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  storeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  storeIconWrap: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  storeInfo: { flex: 1 },
  storeTitle: { fontSize: fontSize.base, fontWeight: '600' },
  storeDesc: { fontSize: fontSize.sm, marginTop: 2 },
  spendBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  spendBtnText: { fontSize: fontSize.sm, fontWeight: '700' },

  buyMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  buyMoreText: { fontSize: fontSize.base, fontWeight: '700', flex: 1, textAlign: 'center' },

  // Referral
  referralSub: { fontSize: fontSize.sm, lineHeight: 20, marginTop: -spacing.xs },
  linkLabel: { fontSize: fontSize.xs, fontWeight: '600', marginBottom: 4 },
  inviteLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  inviteLinkText: { fontSize: fontSize.base, fontWeight: '600', flex: 1 },
  copyBtn: { padding: 4 },

  copiedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  copiedBannerText: { fontSize: fontSize.sm, fontWeight: '600' },

  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  shareBtnText: { fontSize: fontSize.base, fontWeight: '600' },

  refStats: { flexDirection: 'row', gap: spacing.sm },
  refStat: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  refStatValue: { fontSize: fontSize.xxl, fontWeight: '800' },
  refStatLabel: { fontSize: fontSize.xs, marginTop: 2, textAlign: 'center' },

  withdrawCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  withdrawLabel: { fontSize: fontSize.sm },
  withdrawAmount: { fontSize: 24, fontWeight: '800', marginTop: 2 },
  withdrawHint: { fontSize: fontSize.xs, marginTop: 2 },
  withdrawBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  withdrawBtnText: { fontSize: fontSize.base, fontWeight: '700' },
});