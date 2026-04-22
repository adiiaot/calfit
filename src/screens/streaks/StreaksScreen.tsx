import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { AndroidSafeView } from '../../modules/shared/AndriodSafeView';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback } from 'react';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, radius, fontSize } from '../../theme';
import { supabase } from '../../services/supabase';

interface PartnerInfo {
  partner_id: string;
  full_name: string;
  calfit_id: string;
  avatar_url: string | null;
  streak_count: number;
}

interface GroupInfo {
  id: string;
  name: string;
  member_count: number;
  streak: number;
  emoji: string;
}

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
    streakCount >= 7  ? 'Silver' : 'Bronze';

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
          <View style={[styles.goldBadge, { borderColor: (theme as any).gold }]}>
            <Text style={[styles.goldBadgeText, { color: (theme as any).gold }]}>
              {badgeLabel}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.dayDots}>
        {days.map((day, i) => (
          <View key={`${day}-${i}`} style={[styles.dayDot, {
            backgroundColor: i <= todayIndex ? theme.accent : theme.card,
            borderColor:     i <= todayIndex ? theme.accent : theme.border,
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
            borderColor:     streakCount >= milestone ? theme.accent : theme.border,
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
function PartnerStreak({
  theme,
  navigation,
  partners,
  myStreakCount,
  loading,
}: {
  theme: typeof colors.dark;
  navigation: any;
  partners: PartnerInfo[];
  myStreakCount: number;
  loading: boolean;
}) {
  if (loading) {
    return (
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>Partner Streak</Text>
        <ActivityIndicator color={theme.accent} style={{ marginVertical: spacing.md }} />
      </View>
    );
  }

  // No partners — CTA goes to Accountability screen, not Credits
  if (partners.length === 0) {
    return (
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>Partner Streak</Text>
        <View style={styles.emptySection}>
          <Ionicons name="people-outline" size={36} color={theme.textMuted} />
          <Text style={[styles.emptySectionTitle, { color: theme.textPrimary }]}>
            No accountability partner yet
          </Text>
          <Text style={[styles.emptySectionSub, { color: theme.textMuted }]}>
            Add a partner by their CalFit ID to share a streak and keep each other accountable.
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Accountability')}
            style={[styles.emptySectionBtn, { backgroundColor: theme.accent }]}
          >
            <Ionicons name="person-add-outline" size={16} color={theme.bg} />
            <Text style={[styles.emptySectionBtnText, { color: theme.bg }]}>
              Add a Partner
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Has partners — show real data
  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>Partner Streak</Text>
      {partners.map((partner) => {
        const initial = (partner.full_name || 'P').charAt(0).toUpperCase();
        return (
          <View key={partner.partner_id} style={[styles.partnerRow, { marginBottom: spacing.sm }]}>
            <View style={[styles.partnerAvatar, {
              backgroundColor: (theme as any).purple + '22',
              borderColor: (theme as any).purple,
            }]}>
              <Text style={[styles.partnerAvatarText, { color: (theme as any).purple }]}>
                {initial}
              </Text>
            </View>
            <View style={styles.partnerInfo}>
              <Text style={[styles.partnerName, { color: theme.textPrimary }]}>
                {partner.full_name}
              </Text>
              <Text style={[styles.partnerGoal, { color: theme.textSecondary }]}>
                @{partner.calfit_id}
              </Text>
              <View style={styles.streakCompareRow}>
                <Text style={[styles.partnerStreak, { color: theme.accent }]}>
                  🔥 Your streak: {myStreakCount}d
                </Text>
                <Text style={[styles.partnerStreak, { color: (theme as any).purple }]}>
                  · Their streak: {partner.streak_count}d
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('Accountability')}
              style={[styles.nudgeBtn, {
                backgroundColor: theme.accentDim as string,
                borderColor: theme.accent,
              }]}
            >
              <Text style={[styles.nudgeBtnText, { color: theme.accent }]}>View →</Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
}

// ── GROUP STREAK ──────────────────────────────────────────────
function GroupStreak({
  theme,
  navigation,
  groups,
  loading,
}: {
  theme: typeof colors.dark;
  navigation: any;
  groups: GroupInfo[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>Group Streak</Text>
        <ActivityIndicator color={theme.accent} style={{ marginVertical: spacing.md }} />
      </View>
    );
  }

  // No groups — CTA goes to Community screen
  if (groups.length === 0) {
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
            onPress={() => navigation.navigate('Community')}
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

  // Has groups — show real group streak data
  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>Group Streak</Text>
      {groups.map((group) => (
        <View key={group.id} style={styles.groupItem}>
          <View style={styles.groupRow}>
            <Text style={styles.groupEmoji}>{group.emoji}</Text>
            <View style={styles.groupInfo}>
              <Text style={[styles.groupName, { color: theme.textPrimary }]}>
                {group.name}
              </Text>
              <Text style={[styles.groupSub, { color: theme.textSecondary }]}>
                {group.member_count} member{group.member_count !== 1 ? 's' : ''}
                {group.streak > 0 ? ` · 🔥 ${group.streak}d streak` : ''}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('Community')}
              style={[styles.nudgeBtn, {
                backgroundColor: theme.accentDim as string,
                borderColor: theme.accent,
              }]}
            >
              <Text style={[styles.nudgeBtnText, { color: theme.accent }]}>View →</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
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
      `Congratulations! You've earned the ${badge.label} streak badge. Amazing consistency!`,
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

  const streakCount = (profile as any)?.streak_count ?? 0;
  const today = new Date().toISOString().split('T')[0];
  const alreadyCheckedIn = (profile as any)?.last_active_date === today;

  const [partners, setPartners] = useState<PartnerInfo[]>([]);
  const [groups, setGroups] = useState<GroupInfo[]>([]);
  const [loadingPartners, setLoadingPartners] = useState(true);
  const [loadingGroups, setLoadingGroups] = useState(true);

  // Reload on every focus so partners and groups reflect the latest state
  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        loadPartners();
        loadGroups();
      }
    }, [user?.id])
  );

  const loadPartners = async () => {
    if (!user?.id) return;
    setLoadingPartners(true);
    try {
      const { data } = await supabase
        .from('partners')
        .select(`
          partner_id,
          partner_profile:partner_id (
            full_name, calfit_id, avatar_url, streak_count
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (data) {
        setPartners(
          (data as any[]).map((p) => ({
            partner_id:   p.partner_id,
            full_name:    p.partner_profile?.full_name    ?? 'Partner',
            calfit_id:    p.partner_profile?.calfit_id    ?? '',
            avatar_url:   p.partner_profile?.avatar_url   ?? null,
            streak_count: p.partner_profile?.streak_count ?? 0,
          }))
        );
      }
    } catch (e) {
      console.error('loadPartners error:', e);
    }
    setLoadingPartners(false);
  };

  const loadGroups = async () => {
    if (!user?.id) return;
    setLoadingGroups(true);
    try {
      const { data } = await supabase
        .from('group_members')
        .select(`
          group_id,
          groups:group_id (
            id, name, member_count, streak, category
          )
        `)
        .eq('user_id', user.id);

      if (data) {
        const emojiMap: Record<string, string> = {
          Fitness: '💪', Nutrition: '🥗', 'Weight Loss': '⚡',
          'Muscle Gain': '🏋️', Running: '🏃', 'Mental Health': '🧘',
          Yoga: '🌿', Sports: '⚽',
        };
        setGroups(
          (data as any[])
            .filter((m) => m.groups !== null)
            .map((m) => ({
              id:           m.groups.id,
              name:         m.groups.name,
              member_count: m.groups.member_count ?? 0,
              streak:       m.groups.streak       ?? 0,
              emoji:        emojiMap[m.groups.category] ?? '✨',
            }))
        );
      }
    } catch (e) {
      console.error('loadGroups error:', e);
    }
    setLoadingGroups(false);
  };

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
      const newCount = streakCount + 1;

      await supabase
        .from('profiles')
        .update({ streak_count: newCount, last_active_date: today })
        .eq('id', user.id);

      updateProfile({ streak_count: newCount, last_active_date: today });

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

        <PartnerStreak
          theme={theme}
          navigation={navigation}
          partners={partners}
          myStreakCount={streakCount}
          loading={loadingPartners}
        />

        <GroupStreak
          theme={theme}
          navigation={navigation}
          groups={groups}
          loading={loadingGroups}
        />

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
    position: 'absolute', right: 16, top: 12,
    fontSize: 64, opacity: 0.15,
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
    paddingHorizontal: spacing.md, paddingVertical: 4,
    borderRadius: radius.full, borderWidth: 1,
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
    paddingHorizontal: spacing.sm, paddingVertical: 4,
    borderRadius: radius.sm, borderWidth: 1,
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
    fontSize: fontSize.xs, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginBottom: spacing.md,
  },

  emptySection: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  emptySectionTitle: { fontSize: fontSize.lg, fontWeight: '700', textAlign: 'center' },
  emptySectionSub: { fontSize: fontSize.sm, textAlign: 'center', lineHeight: 18 },
  emptySectionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
    borderRadius: radius.lg, marginTop: spacing.xs,
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
  streakCompareRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: 4 },
  partnerStreak: { fontSize: fontSize.xs, fontWeight: '600' },
  nudgeBtn: {
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
    borderRadius: radius.sm, borderWidth: 1,
  },
  nudgeBtnText: { fontSize: fontSize.sm, fontWeight: '600' },

  groupItem: { marginBottom: spacing.sm },
  groupRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  groupEmoji: { fontSize: 28, flexShrink: 0 },
  groupInfo: { flex: 1 },
  groupName: { fontSize: fontSize.base, fontWeight: '700' },
  groupSub: { fontSize: fontSize.sm, marginTop: 2 },

  badgesSection: { marginBottom: spacing.md },
  sectionLabel: {
    fontSize: fontSize.xs, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginHorizontal: spacing.lg, marginBottom: spacing.xs,
  },
  badgesHint: { fontSize: fontSize.xs, marginHorizontal: spacing.lg, marginBottom: spacing.sm },
  badgeGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: spacing.sm, paddingHorizontal: spacing.lg,
  },
  badge: {
    width: '30%', padding: spacing.md,
    borderRadius: radius.md, borderWidth: 1,
    alignItems: 'center', gap: 4,
  },
  badgeEmoji: { fontSize: 28 },
  badgeLabel: { fontSize: fontSize.xs, fontWeight: '600', textAlign: 'center' },
  badgeEarned: {
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: radius.sm, marginTop: 2,
  },
  badgeEarnedText: { fontSize: 8, fontWeight: '700' },
  badgeRemaining: { fontSize: 9, marginTop: 2 },

  checkInBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, marginHorizontal: spacing.lg,
    marginTop: spacing.sm, padding: spacing.lg, borderRadius: radius.lg,
  },
  checkInBtnText: { fontSize: fontSize.lg, fontWeight: '700' },
  nextCheckIn: {
    textAlign: 'center', fontSize: fontSize.sm,
    marginTop: spacing.sm, marginBottom: spacing.md,
  },
  graceBar: {
    marginTop: spacing.md, padding: spacing.sm,
    borderRadius: radius.sm, alignItems: 'center',
  },
  graceText: { fontSize: fontSize.xs },
});