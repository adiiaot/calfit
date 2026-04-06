import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { colors, spacing, radius, fontSize } from '../../theme';

// ── WALLET HERO ──────────────────────────────────────────────
function WalletHero({ theme }: { theme: typeof colors.dark }) {
  return (
    <View style={[styles.walletHero, {
      backgroundColor: theme.card,
      borderColor: theme.accent,
    }]}>
      <View style={styles.walletTop}>
        <View>
          <Text style={[styles.walletLabel, { color: theme.textSecondary }]}>
            CalFit Points Balance
          </Text>
          <View style={styles.walletBalanceRow}>
            <Text style={styles.pointsStar}>✦</Text>
            <Text style={[styles.walletBalance, { color: theme.gold }]}>
              1,240
            </Text>
            <Text style={[styles.walletBalanceSub, { color: theme.textSecondary }]}>
              {' '}pts
            </Text>
          </View>
        </View>
        <TouchableOpacity style={[styles.earnMoreBtn, {
          backgroundColor: theme.gold + '22',
          borderColor: theme.gold,
        }]}>
          <Text style={[styles.earnMoreText, { color: theme.gold }]}>
            + Earn More
          </Text>
        </TouchableOpacity>
      </View>
      <View style={[styles.walletDivider, { backgroundColor: theme.border }]} />
      <View style={styles.walletStats}>
        {[
          { label: 'Earned Today', value: '+50' },
          { label: 'Spent This Week', value: '80' },
          { label: 'Lifetime Earned', value: '4,820' },
        ].map((s) => (
          <View key={s.label} style={styles.walletStat}>
            <Text style={[styles.walletStatValue, { color: theme.textPrimary }]}>
              {s.value}
            </Text>
            <Text style={[styles.walletStatLabel, { color: theme.textMuted }]}>
              {s.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ── HOW TO EARN ──────────────────────────────────────────────
function HowToEarn({ theme }: { theme: typeof colors.dark }) {
  const ways = [
    { icon: 'play-circle-outline', label: 'Watch an ad', points: '+10 pts', color: theme.accent },
    { icon: 'calendar-outline', label: 'Daily login', points: '+5 pts', color: theme.accentSecond },
    { icon: 'checkmark-circle-outline', label: 'Hit daily goal', points: '+5 pts', color: theme.purple },
    { icon: 'person-add-outline', label: 'Invite a friend', points: '+50 pts', color: theme.gold },
    { icon: 'trophy-outline', label: 'Milestone badge', points: '+20–100 pts', color: theme.orange },
  ];

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
        How to Earn Points
      </Text>
      {ways.map((w) => (
        <View key={w.label} style={styles.earnRow}>
          <View style={[styles.earnIconWrap, {
            backgroundColor: w.color + '22',
          }]}>
            <Ionicons name={w.icon as any} size={20} color={w.color} />
          </View>
          <Text style={[styles.earnLabel, { color: theme.textPrimary }]}>
            {w.label}
          </Text>
          <Text style={[styles.earnPoints, { color: theme.gold }]}>
            {w.points}
          </Text>
        </View>
      ))}

      {/* Watch ad button */}
      <TouchableOpacity style={[styles.watchAdBtn, {
        backgroundColor: theme.accent,
      }]}>
        <Ionicons name="play-circle" size={20} color={theme.bg} />
        <Text style={[styles.watchAdText, { color: theme.bg }]}>
          Watch Ad — Earn 10 Points
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ── SPEND POINTS STORE ───────────────────────────────────────
function PointsStore({ theme }: { theme: typeof colors.dark }) {
  const items = [
    {
      icon: 'videocam-outline',
      title: 'Watch a Live Stream',
      desc: 'Access 1 live session',
      cost: 30,
      color: theme.accent,
    },
    {
      icon: 'chatbubble-ellipses-outline',
      title: 'Extra Coach Prompts',
      desc: '5 bonus prompts today',
      cost: 20,
      color: theme.accentSecond,
    },
    {
      icon: 'flame-outline',
      title: 'Streak Freeze',
      desc: 'Protect your streak for 1 day',
      cost: 40,
      color: theme.orange,
    },
    {
      icon: 'star-outline',
      title: 'Premium Feature — 24hrs',
      desc: 'Unlock any premium feature for a day',
      cost: 80,
      color: theme.purple,
    },
    {
      icon: 'people-outline',
      title: 'Join Premium Group',
      desc: 'Access a premium community group',
      cost: 50,
      color: theme.gold,
    },
  ];

  return (
    <View style={styles.storeSection}>
      <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
        Spend Points
      </Text>
      {items.map((item) => (
        <View key={item.title} style={[styles.storeItem, {
          backgroundColor: theme.card,
          borderColor: theme.border,
        }]}>
          <View style={[styles.storeIconWrap, {
            backgroundColor: item.color + '22',
          }]}>
            <Ionicons name={item.icon as any} size={22} color={item.color} />
          </View>
          <View style={styles.storeInfo}>
            <Text style={[styles.storeTitle, { color: theme.textPrimary }]}>
              {item.title}
            </Text>
            <Text style={[styles.storeDesc, { color: theme.textMuted }]}>
              {item.desc}
            </Text>
          </View>
          <TouchableOpacity style={[styles.spendBtn, {
            backgroundColor: item.color + '22',
            borderColor: item.color,
          }]}>
            <Text style={styles.pointsStar}>✦</Text>
            <Text style={[styles.spendBtnText, { color: item.color }]}>
              {item.cost}
            </Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}

// ── REFERRAL SECTION ─────────────────────────────────────────
function ReferralSection({ theme }: { theme: typeof colors.dark }) {
  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
        Referral Earnings
      </Text>
      <Text style={[styles.referralSub, { color: theme.textSecondary }]}>
        Earn 15% of every referred user's subscription for 5 years
      </Text>

      {/* Invite link */}
      <View style={[styles.inviteLink, {
        backgroundColor: theme.bg,
        borderColor: theme.border,
      }]}>
        <Text style={[styles.inviteLinkText, { color: theme.textPrimary }]}>
          calfit.app/ref/favour
        </Text>
        <TouchableOpacity>
          <Ionicons name="copy-outline" size={18} color={theme.accent} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={[styles.shareBtn, { borderColor: theme.accent }]}>
        <Ionicons name="share-social-outline" size={18} color={theme.accent} />
        <Text style={[styles.shareBtnText, { color: theme.accent }]}>
          Share Invite Link
        </Text>
      </TouchableOpacity>

      {/* Referral stats */}
      <View style={styles.refStats}>
        {[
          { label: 'Total Invited', value: '38', color: theme.textPrimary },
          { label: 'On Paid Plan', value: '14', color: theme.accent },
          { label: 'On Free Plan', value: '24', color: theme.accentSecond },
        ].map((s) => (
          <View key={s.label} style={[styles.refStat, {
            backgroundColor: theme.bg,
            borderColor: theme.border,
          }]}>
            <Text style={[styles.refStatValue, { color: s.color }]}>
              {s.value}
            </Text>
            <Text style={[styles.refStatLabel, { color: theme.textMuted }]}>
              {s.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Wallet balance */}
      <View style={[styles.walletBalance2, {
        backgroundColor: theme.bg,
        borderColor: theme.border,
      }]}>
        <View>
          <Text style={[styles.walletLabel, { color: theme.textSecondary }]}>
            Withdrawal Balance
          </Text>
          <Text style={[styles.walletCash, { color: theme.accent }]}>$124.50</Text>
        </View>
        <TouchableOpacity style={[styles.withdrawBtn, { backgroundColor: theme.accent }]}>
          <Text style={[styles.withdrawBtnText, { color: theme.bg }]}>
            Withdraw →
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── MAIN SCREEN ──────────────────────────────────────────────
export default function CreditsScreen() {
  const { colorScheme } = useThemeStore();
  const theme = colors[colorScheme];
  const [activeTab, setActiveTab] = useState<'Points' | 'Referrals'>('Points');

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.pageTitle, { color: theme.textPrimary }]}>
          Credits & Earnings
        </Text>
        <Text style={[styles.pageSub, { color: theme.textSecondary }]}>
          Earn points, unlock features, refer friends
        </Text>
      </View>

      {/* Tab toggle */}
      <View style={[styles.tabToggle, {
        backgroundColor: theme.card,
        borderColor: theme.border,
      }]}>
        {(['Points', 'Referrals'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[
              styles.tabToggleBtn,
              activeTab === tab && {
                backgroundColor: theme.accent,
              },
            ]}
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

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <WalletHero theme={theme} />

        {activeTab === 'Points' ? (
          <>
            <HowToEarn theme={theme} />
            <PointsStore theme={theme} />
          </>
        ) : (
          <ReferralSection theme={theme} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── STYLES ───────────────────────────────────────────────────
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

  // Tab toggle
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
    flex: 1, paddingVertical: spacing.sm,
    borderRadius: radius.sm, alignItems: 'center',
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
  pointsStar: { fontSize: fontSize.base, color: '#FFD133' },
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
  walletStats: { flexDirection: 'row', justifyContent: 'space-between' },
  walletStat: { alignItems: 'center' },
  walletStatValue: { fontSize: fontSize.lg, fontWeight: '700' },
  walletStatLabel: { fontSize: fontSize.xs, marginTop: 2 },

  // Cards
  card: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  cardTitle: { fontSize: fontSize.lg, fontWeight: '700', marginBottom: spacing.md },

  // Earn rows
  earnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  earnIconWrap: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  earnLabel: { flex: 1, fontSize: fontSize.base },
  earnPoints: { fontSize: fontSize.base, fontWeight: '700' },

  // Watch ad button
  watchAdBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.sm,
  },
  watchAdText: { fontSize: fontSize.base, fontWeight: '700' },

  // Store
  storeSection: { marginBottom: spacing.md },
  sectionLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  storeInfo: { flex: 1 },
  storeTitle: { fontSize: fontSize.base, fontWeight: '600' },
  storeDesc: { fontSize: fontSize.sm, marginTop: 2 },
  spendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  spendBtnText: { fontSize: fontSize.sm, fontWeight: '700' },

  // Referral
  referralSub: { fontSize: fontSize.sm, marginBottom: spacing.md, lineHeight: 20 },
  inviteLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  inviteLinkText: { fontSize: fontSize.base, fontWeight: '600' },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  shareBtnText: { fontSize: fontSize.base, fontWeight: '600' },
  refStats: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  refStat: {
    flex: 1, padding: spacing.md,
    borderRadius: radius.md, borderWidth: 1,
    alignItems: 'center',
  },
  refStatValue: { fontSize: fontSize.xxl, fontWeight: '800' },
  refStatLabel: { fontSize: fontSize.xs, marginTop: 2, textAlign: 'center' },
  walletBalance2: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  walletCash: { fontSize: 24, fontWeight: '800', marginTop: 4 },
  withdrawBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  withdrawBtnText: { fontSize: fontSize.base, fontWeight: '700' },
});