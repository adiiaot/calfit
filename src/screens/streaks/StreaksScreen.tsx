import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { AndroidSafeView } from '../../modules/shared/AndriodSafeView';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, radius, fontSize } from '../../theme';

// ── PERSONAL STREAK HERO ─────────────────────────────────────
function PersonalStreakHero({ theme, streakCount }: {
  theme: typeof colors.dark;
  streakCount: number;
}) {
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const today = new Date().getDay();
  const todayIndex = today === 0 ? 6 : today - 1;

  const badgeLabel =
    streakCount >= 30 ? 'Gold' :
    streakCount >= 7 ? 'Silver' : 'Bronze';

  return (
    <View style={[styles.heroCard, {
      backgroundColor: theme.card,
      borderColor: theme.accent,
    }]}>
      <Text style={styles.heroFlame}>🔥</Text>
      <View style={styles.heroTop}>
        <View>
          <Text style={[styles.heroLabel, { color: theme.textSecondary }]}>
            Personal Streak
          </Text>
          <Text style={[styles.heroNumber, { color: theme.accent }]}>
            {streakCount}
          </Text>
          <Text style={[styles.heroUnit, { color: theme.textSecondary }]}>days</Text>
        </View>
        <View style={styles.heroRight}>
          <View style={[styles.goldBadge, { borderColor: theme.gold }]}>
            <Text style={[styles.goldBadgeText, { color: theme.gold }]}>{badgeLabel}</Text>
          </View>
        </View>
      </View>

      <View style={styles.dayDots}>
        {days.map((day, i) => (
          <View key={`${day}-${i}`} style={[styles.dayDot, {
            backgroundColor: i <= todayIndex ? theme.accent : theme.card,
            borderColor: i <= todayIndex ? theme.accent : theme.border,
          }]}>
            <Text style={[styles.dayDotText, {
              color: i <= todayIndex ? theme.bg : theme.textMuted,
            }]}>
              {day}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.milestonePills}>
        {[7, 14, 30, 60, 90].map((milestone) => (
          <View key={milestone} style={[styles.milestonePill, {
            backgroundColor: streakCount >= milestone ? theme.accent : theme.card,
            borderColor: streakCount >= milestone ? theme.accent : theme.border,
          }]}>
            <Text style={[styles.milestonePillText, {
              color: streakCount >= milestone ? theme.bg : theme.textMuted,
            }]}>
              {milestone}d
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ── PARTNER STREAK ────────────────────────────────────────────
function PartnerStreak({ theme, navigation }: {
  theme: typeof colors.dark;
  navigation: any;
}) {
  const hasFriends = false;

  if (!hasFriends) {
    return (
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>
          Partner Streak
        </Text>
        <View style={styles.emptySection}>
          <Ionicons name="people-outline" size={36} color={theme.textMuted} />
          <Text style={[styles.emptySectionTitle, { color: theme.textPrimary }]}>
            No accountability partner yet
          </Text>
          <Text style={[styles.emptySectionSub, { color: theme.textMuted }]}>
            Invite a friend to CalFit and share a streak together. You keep each other accountable.
          </Text>
          <TouchableOpacity
            onPress={() => {
  navigation.navigate('Main' as never, {
    screen: 'Credits',
  } as never);
}}
            style={[styles.emptySectionBtn, { backgroundColor: theme.accent }]}
          >
            
            <Ionicons name="person-add-outline" size={16} color={theme.bg} />
            <Text style={[styles.emptySectionBtnText, { color: theme.bg }]}>
              Invite a Friend
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>Partner Streak</Text>
      <View style={styles.partnerRow}>
        <View style={[styles.partnerAvatar, {
          backgroundColor: theme.purple + '22',
          borderColor: theme.purple,
        }]}>
          <Text style={[styles.partnerAvatarText, { color: theme.purple }]}>A</Text>
        </View>
        <View style={styles.partnerInfo}>
          <Text style={[styles.partnerName, { color: theme.textPrimary }]}>Favour + Alex</Text>
          <Text style={[styles.partnerGoal, { color: theme.textSecondary }]}>
            Shared goal: Log meals daily
          </Text>
          <Text style={[styles.partnerStreak, { color: theme.accent }]}>🔥 9 day streak</Text>
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
function GroupStreak({ theme, navigation }: {
  theme: typeof colors.dark;
  navigation: any;
}) {
  const hasGroups = false;

  if (!hasGroups) {
    return (
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>Group Streak</Text>
        <View style={styles.emptySection}>
          <Ionicons name="fitness-outline" size={36} color={theme.textMuted} />
          <Text style={[styles.emptySectionTitle, { color: theme.textPrimary }]}>
            Not in any group yet
          </Text>
          <Text style={[styles.emptySectionSub, { color: theme.textMuted }]}>
            Join or create a group to build a shared streak with other CalFit members.
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Community' as never)}
            style={[styles.emptySectionBtn, { backgroundColor: theme.accent }]}
          >
            <Ionicons name="compass-outline" size={16} color={theme.bg} />
            <Text style={[styles.emptySectionBtnText, { color: theme.bg }]}>
              Browse Communities
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const members = [
    { initial: 'F', done: true },
    { initial: 'A', done: true },
    { initial: 'M', done: true },
    { initial: 'J', done: false },
    { initial: 'S', done: false },
  ];

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>Group Streak</Text>
      <Text style={[styles.groupName, { color: theme.textPrimary }]}>CalFit Champions</Text>
      <Text style={[styles.groupSub, { color: theme.textSecondary }]}>
        5 members · Log meals daily · 🔥 22 days
      </Text>
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
function MilestoneBadges({ theme, streakCount }: {
  theme: typeof colors.dark;
  streakCount: number;
}) {
  const badges = [
    { label: '7 Days',   emoji: '🔥', milestone: 7 },
    { label: '14 Days',  emoji: '⚡', milestone: 14 },
    { label: '30 Days',  emoji: '💎', milestone: 30 },
    { label: '60 Days',  emoji: '👑', milestone: 60 },
    { label: '90 Days',  emoji: '🏆', milestone: 90 },
    { label: '6 Months', emoji: '🌟', milestone: 180 },
  ];

  const handleClaimBadge = (badge: typeof badges[0], earned: boolean) => {
    if (!earned) {
      const remaining = badge.milestone - streakCount;
      Alert.alert(
        `${badge.emoji} ${badge.label}`,
        `You need ${remaining} more day${remaining === 1 ? '' : 's'} to unlock this badge. Keep checking in!`,
        [{ text: 'Keep Going!' }]
      );
      return;
    }
    Alert.alert(
      `${badge.emoji} Badge Unlocked!`,
      `Congratulations! You have earned the ${badge.label} streak badge. Amazing consistency!`,
      [{ text: 'Claim it! 🎉' }]
    );
  };

  return (
    <View style={styles.badgesSection}>
      <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
        Milestone Badges
      </Text>
      <Text style={[styles.badgesHint, { color: theme.textMuted }]}>
        Tap a badge to claim it once unlocked
      </Text>
      <View style={styles.badgeGrid}>
        {badges.map((b) => {
          const earned = streakCount >= b.milestone;
          return (
            <TouchableOpacity
              key={b.label}
              onPress={() => handleClaimBadge(b, earned)}
              style={[styles.badge, {
                backgroundColor: theme.card,
                borderColor: earned ? theme.accent : theme.border,
                opacity: earned ? 1 : 0.45,
              }]}
            >
              <Text style={styles.badgeEmoji}>{b.emoji}</Text>
              <Text style={[styles.badgeLabel, {
                color: earned ? theme.accent : theme.textMuted,
              }]}>
                {b.label}
              </Text>
              {earned ? (
                <View style={[styles.badgeEarned, { backgroundColor: theme.accent }]}>
                  <Text style={[styles.badgeEarnedText, { color: theme.bg }]}>✓ Earned</Text>
                </View>
              ) : (
                <Text style={[styles.badgeRemaining, { color: theme.textMuted }]}>
                  {b.milestone - streakCount}d left
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ── MAIN SCREEN ───────────────────────────────────────────────
export default function StreaksScreen() {
  const navigation = useNavigation<any>();
  const { colorScheme } = useThemeStore();
  const { user, profile, updateProfile } = useAuthStore();
  const theme = colors[colorScheme];

  const streakCount = profile?.streak_count ?? 0;
  const today = new Date().toISOString().split('T')[0];
  const alreadyCheckedIn = profile?.last_active_date === today;

  const handleCheckIn = async () => {
    if (!user?.id) return;

    if (alreadyCheckedIn) {
      Alert.alert(
        'Already Checked In ✓',
        'You have already checked in today. Come back tomorrow to keep your streak going!',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      const { supabase } = await import('../../services/supabase');
      const newCount = streakCount + 1;

      await supabase
        .from('profiles')
        .update({
          streak_count: newCount,
          last_active_date: today,
        })
        .eq('id', user.id);

      updateProfile({
        streak_count: newCount,
        last_active_date: today,
      });

      const { notifyStreakCheckIn } = await import('../../services/notificationService');
      await notifyStreakCheckIn(user.id, newCount);

      Alert.alert(
        'Checked In! 🔥',
        `Day ${newCount} streak recorded. Come back tomorrow to keep it going!`,
        [{ text: "Let's Go!" }]
      );
    } catch (error) {
      console.error('Check in failed:', error);
      Alert.alert('Error', 'Could not record your check-in. Please try again.');
    }
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
          <Text style={[styles.backText, { color: theme.textPrimary }]}>Home</Text>
        </TouchableOpacity>
        <Text style={[styles.pageTitle, { color: theme.textPrimary }]}>Streaks</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <PersonalStreakHero theme={theme} streakCount={streakCount} />
        <PartnerStreak theme={theme} navigation={navigation} />
        <GroupStreak theme={theme} navigation={navigation} />
        <MilestoneBadges theme={theme} streakCount={streakCount} />

        <TouchableOpacity
          onPress={handleCheckIn}
          style={[styles.checkInBtn, {
            backgroundColor: alreadyCheckedIn ? theme.border : theme.accent,
          }]}
        >
          <Ionicons
            name={alreadyCheckedIn ? 'checkmark-circle' : 'add-circle'}
            size={20}
            color={alreadyCheckedIn ? theme.textMuted : theme.bg}
          />
          <Text style={[styles.checkInBtnText, {
            color: alreadyCheckedIn ? theme.textMuted : theme.bg,
          }]}>
            {alreadyCheckedIn ? 'Checked In Today ✓' : 'Check In Today'}
          </Text>
        </TouchableOpacity>

        {alreadyCheckedIn && (
          <Text style={[styles.nextCheckIn, { color: theme.textMuted }]}>
            Next check-in available tomorrow 🕛
          </Text>
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

  dayDots: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.md },
  dayDot: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  dayDotText: { fontSize: fontSize.xs, fontWeight: '700' },

  milestonePills: { flexDirection: 'row', gap: spacing.xs },
  milestonePill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  milestonePillText: { fontSize: fontSize.xs, fontWeight: '700' },

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

  emptySection: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  emptySectionTitle: { fontSize: fontSize.lg, fontWeight: '700', textAlign: 'center' },
  emptySectionSub: { fontSize: fontSize.sm, textAlign: 'center', lineHeight: 18 },
  emptySectionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    marginTop: spacing.xs,
  },
  emptySectionBtnText: { fontSize: fontSize.base, fontWeight: '700' },

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

  groupName: { fontSize: fontSize.lg, fontWeight: '700', marginBottom: 4 },
  groupSub: { fontSize: fontSize.sm, marginBottom: spacing.md },
  memberDots: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  memberDot: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  memberDotText: { fontSize: fontSize.sm, fontWeight: '700' },
  groupProgress: { fontSize: fontSize.xs },

  badgesSection: { marginBottom: spacing.md },
  sectionLabel: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xs,
  },
  badgesHint: {
    fontSize: fontSize.xs,
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
    gap: 4,
  },
  badgeEmoji: { fontSize: 28 },
  badgeLabel: { fontSize: fontSize.xs, fontWeight: '600', textAlign: 'center' },
  badgeEarned: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
    marginTop: 2,
  },
  badgeEarnedText: { fontSize: 8, fontWeight: '700' },
  badgeRemaining: { fontSize: 9, marginTop: 2 },

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
  nextCheckIn: {
    textAlign: 'center',
    fontSize: fontSize.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
});