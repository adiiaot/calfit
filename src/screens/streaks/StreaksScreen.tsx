import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { colors, spacing, radius, fontSize } from '../../theme';
import { useNavigation } from '@react-navigation/native';

// ── PERSONAL STREAK HERO ─────────────────────────────────────
function PersonalStreakHero({ theme }: { theme: typeof colors.dark }) {
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const completed = 5;

  return (
    <View style={[styles.heroCard, {
      backgroundColor: theme.card,
      borderColor: theme.accent,
    }]}>
      {/* Flame watermark */}
      <Text style={styles.heroFlame}>🔥</Text>

      <View style={styles.heroTop}>
        <View>
          <Text style={[styles.heroLabel, { color: theme.textSecondary }]}>
            Personal Streak
          </Text>
          <Text style={[styles.heroNumber, { color: theme.accent }]}>14</Text>
          <Text style={[styles.heroUnit, { color: theme.textSecondary }]}>days</Text>
        </View>
        <View style={styles.heroRight}>
          <View style={[styles.goldBadge, { borderColor: theme.gold }]}>
            <Text style={[styles.goldBadgeText, { color: theme.gold }]}>Gold</Text>
          </View>
        </View>
      </View>

      {/* Day dots */}
      <View style={styles.dayDots}>
        {days.map((day, i) => (
          <View key={`${day}-${i}`} style={[styles.dayDot, {
            backgroundColor: i < completed ? theme.accent : theme.card,
            borderColor: i < completed ? theme.accent : theme.border,
          }]}>
            <Text style={[styles.dayDotText, {
              color: i < completed ? theme.bg : theme.textMuted,
            }]}>
              {day}
            </Text>
          </View>
        ))}
      </View>

      {/* Milestone pills */}
      <View style={styles.milestonePills}>
        {['7d', '14d', '30d', '60d', '90d'].map((m, i) => (
          <View key={m} style={[styles.milestonePill, {
            backgroundColor: i < 2 ? theme.accent : theme.card,
            borderColor: i < 2 ? theme.accent : theme.border,
          }]}>
            <Text style={[styles.milestonePillText, {
              color: i < 2 ? theme.bg : theme.textMuted,
            }]}>
              {m}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ── STREAK FREEZE BANNER ──────────────────────────────────────
function StreakFreezeBanner({ theme }: { theme: typeof colors.dark }) {
  return (
    <TouchableOpacity style={[styles.freezeBanner, {
      backgroundColor: theme.accentSecond + '15',
      borderColor: theme.accentSecond,
    }]}>
      <Ionicons name="snow-outline" size={18} color={theme.accentSecond} />
      <Text style={[styles.freezeText, { color: theme.accentSecond }]}>
        1 streak freeze available this week — tap to use
      </Text>
    </TouchableOpacity>
  );
}

// ── PARTNER STREAK ────────────────────────────────────────────
function PartnerStreak({ theme }: { theme: typeof colors.dark }) {
  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>
        Partner Streak
      </Text>
      <View style={styles.partnerRow}>
        <View style={[styles.partnerAvatar, {
          backgroundColor: theme.purple + '22',
          borderColor: theme.purple,
        }]}>
          <Text style={[styles.partnerAvatarText, { color: theme.purple }]}>A</Text>
        </View>
        <View style={styles.partnerInfo}>
          <Text style={[styles.partnerName, { color: theme.textPrimary }]}>
            Favour + Alex
          </Text>
          <Text style={[styles.partnerGoal, { color: theme.textSecondary }]}>
            Shared goal: Log meals daily
          </Text>
          <Text style={[styles.partnerStreak, { color: theme.accent }]}>
            🔥 9 day streak
          </Text>
        </View>
        <TouchableOpacity style={[styles.nudgeBtn, {
          backgroundColor: theme.accentDim as string,
          borderColor: theme.accent,
        }]}>
          <Text style={[styles.nudgeBtnText, { color: theme.accent }]}>Nudge →</Text>
        </TouchableOpacity>
      </View>
      <View style={[styles.graceBar, { backgroundColor: theme.border }]}>
        <Text style={[styles.graceText, { color: theme.textMuted }]}>
          5-day grace window active
        </Text>
      </View>
    </View>
  );
}

// ── GROUP STREAK ──────────────────────────────────────────────
function GroupStreak({ theme }: { theme: typeof colors.dark }) {
  const members = [
    { initial: 'F', done: true },
    { initial: 'A', done: true },
    { initial: 'M', done: true },
    { initial: 'J', done: false },
    { initial: 'S', done: false },
  ];

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>
        Group Streak
      </Text>
      <Text style={[styles.groupName, { color: theme.textPrimary }]}>
        CalFit Champions
      </Text>
      <Text style={[styles.groupSub, { color: theme.textSecondary }]}>
        5 members · Log meals daily · 🔥 22 days
      </Text>

      {/* Member completion dots */}
      <View style={styles.memberDots}>
        {members.map((m, i) => (
          <View key={i} style={[styles.memberDot, {
            backgroundColor: m.done ? theme.accent : theme.border,
          }]}>
            <Text style={[styles.memberDotText, {
              color: m.done ? theme.bg : theme.textMuted,
            }]}>
              {m.initial}
            </Text>
          </View>
        ))}
      </View>
      <Text style={[styles.groupProgress, { color: theme.textMuted }]}>
        3 of 5 logged today — 2 still needed
      </Text>
    </View>
  );
}

// ── MILESTONE BADGES ──────────────────────────────────────────
function MilestoneBadges({ theme }: { theme: typeof colors.dark }) {
  const badges = [
    { label: '7 Days', emoji: '🔥', earned: true },
    { label: '14 Days', emoji: '⚡', earned: true },
    { label: '30 Days', emoji: '💎', earned: false },
    { label: '60 Days', emoji: '👑', earned: false },
    { label: '90 Days', emoji: '🏆', earned: false },
    { label: '6 Months', emoji: '🌟', earned: false },
  ];

  return (
    <View style={styles.badgesSection}>
      <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
        Milestone Badges
      </Text>
      <View style={styles.badgeGrid}>
        {badges.map((b) => (
          <View key={b.label} style={[styles.badge, {
            backgroundColor: theme.card,
            borderColor: b.earned ? theme.accent : theme.border,
            opacity: b.earned ? 1 : 0.5,
          }]}>
            <Text style={styles.badgeEmoji}>{b.emoji}</Text>
            <Text style={[styles.badgeLabel, {
              color: b.earned ? theme.accent : theme.textMuted,
            }]}>
              {b.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ── MAIN SCREEN ──────────────────────────────────────────────
export default function StreaksScreen() {
  const navigation = useNavigation<any>();
  const { colorScheme } = useThemeStore();
  const theme = colors[colorScheme];
  
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={26} color={theme.textPrimary} />
          <Text style={[styles.backText, { color: theme.textPrimary }]}>
            Home
          </Text>
        </TouchableOpacity>
        <Text style={[styles.pageTitle, { color: theme.textPrimary }]}>Streaks</Text>
        <Text style={[styles.pageSub, { color: theme.textSecondary }]}>
          Keep your momentum going
        </Text>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <PersonalStreakHero theme={theme} />
        <StreakFreezeBanner theme={theme} />
        <PartnerStreak theme={theme} />
        <GroupStreak theme={theme} />
        <MilestoneBadges theme={theme} />

        <TouchableOpacity style={[styles.checkInBtn, { backgroundColor: theme.accent }]}>
          <Ionicons name="checkmark-circle" size={20} color={theme.bg} />
          <Text style={[styles.checkInBtnText, { color: theme.bg }]}>
            Check In Today
          </Text>
        </TouchableOpacity>
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

  // Hero card
  heroCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  heroFlame: {
    position: 'absolute',
    right: 16, top: 12,
    fontSize: 64,
    opacity: 0.15,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  heroLabel: { fontSize: fontSize.sm, fontWeight: '600', marginBottom: 4 },
  heroNumber: { fontSize: 52, fontWeight: '800', lineHeight: 56 },
  heroUnit: { fontSize: fontSize.base },
  heroRight: { alignItems: 'flex-end', gap: spacing.sm },
  goldBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  goldBadgeText: { fontSize: fontSize.sm, fontWeight: '700' },

  // Day dots
  dayDots: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  dayDot: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  dayDotText: { fontSize: fontSize.xs, fontWeight: '700' },

  // Milestone pills
  milestonePills: { flexDirection: 'row', gap: spacing.xs },
  milestonePill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  milestonePillText: { fontSize: fontSize.xs, fontWeight: '700' },

  // Freeze banner
  freezeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  freezeText: { fontSize: fontSize.sm, fontWeight: '600', flex: 1 },

  // Cards
  card: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  cardLabel: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },

  // Partner
  partnerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  partnerAvatar: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, flexShrink: 0,
  },
  partnerAvatarText: { fontSize: fontSize.xl, fontWeight: '700' },
  partnerInfo: { flex: 1 },
  partnerName: { fontSize: fontSize.base, fontWeight: '700' },
  partnerGoal: { fontSize: fontSize.sm, marginTop: 2 },
  partnerStreak: { fontSize: fontSize.sm, fontWeight: '600', marginTop: 4 },
  nudgeBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  nudgeBtnText: { fontSize: fontSize.sm, fontWeight: '600' },
  graceBar: {
    marginTop: spacing.md,
    padding: spacing.sm,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  graceText: { fontSize: fontSize.xs },

  // Group
  groupName: { fontSize: fontSize.lg, fontWeight: '700', marginBottom: 4 },
  groupSub: { fontSize: fontSize.sm, marginBottom: spacing.md },
  memberDots: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  memberDot: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  memberDotText: { fontSize: fontSize.sm, fontWeight: '700' },
  groupProgress: { fontSize: fontSize.xs },

  // Badges
  badgesSection: { marginBottom: spacing.md },
  sectionLabel: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  badge: {
    width: '30%',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  badgeEmoji: { fontSize: 28, marginBottom: spacing.xs },
  badgeLabel: { fontSize: fontSize.xs, fontWeight: '600', textAlign: 'center' },

  //Return to Home Button
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginBottom: spacing.xs,
  },
  backText: {
    fontSize: fontSize.lg,
    fontWeight: '400',
  },
  // Check in button
  checkInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.lg,
  },
  checkInBtnText: { fontSize: fontSize.lg, fontWeight: '700' },
});