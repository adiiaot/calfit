import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, radius, fontSize } from '../../../theme';
import { UserAvatar } from '../../shared/UserAvatar';
import { RankBadge } from './RankBadge';
import { LeaderboardEntry, LeaderboardCategory } from '../services/LeaderboardService';

interface Props {
  entry: LeaderboardEntry;
  theme: typeof colors.dark;
  activeCategory: LeaderboardCategory;
  onPress?: () => void;
}

export function LeaderboardRow({
  entry,
  theme,
  activeCategory,
  onPress,
}: Props) {
  const primaryValue = {
    overall:   `${entry.total_score} pts`,
    streaks:   `${entry.streak_count}🔥`,
    workouts:  `${entry.total_workouts} workouts`,
    referrals: `${entry.referral_count} referrals`,
  }[activeCategory];

  const primaryColor = {
    overall:   theme.accent,
    streaks:   theme.orange,
    workouts:  theme.accentSecond,
    referrals: theme.gold,
  }[activeCategory];

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.container, {
        backgroundColor: entry.isCurrentUser
          ? theme.accentDim as string
          : theme.card,
        borderColor: entry.isCurrentUser ? theme.accent : theme.border,
        borderWidth: entry.isCurrentUser ? 2 : 1,
      }]}
    >
      <RankBadge rank={entry.rank} theme={theme} size="md" />

      <UserAvatar
        uri={entry.avatar_url}
        name={entry.full_name}
        size={40}
        theme={theme}
      />

      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: theme.textPrimary }]}>
            {entry.full_name}
          </Text>
          {entry.isCurrentUser && (
            <View style={[styles.youBadge, { backgroundColor: theme.accent + '22' }]}>
              <Text style={[styles.youText, { color: theme.accent }]}>You</Text>
            </View>
          )}
        </View>
        <Text style={[styles.handle, { color: theme.textMuted }]}>
          @{entry.calfit_id}
        </Text>
        <Text style={[styles.goal, { color: theme.textMuted }]}>
          🎯 {entry.goal}
        </Text>
      </View>

      <View style={[styles.scoreWrap, { backgroundColor: primaryColor + '18' }]}>
        <Text style={[styles.scoreValue, { color: primaryColor }]}>
          {primaryValue}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
  },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  name: { fontSize: fontSize.base, fontWeight: '700' },
  youBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  youText: { fontSize: 9, fontWeight: '700' },
  handle: { fontSize: fontSize.xs, marginTop: 1 },
  goal: { fontSize: fontSize.xs, marginTop: 2 },
  scoreWrap: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    alignItems: 'center',
    flexShrink: 0,
  },
  scoreValue: { fontSize: fontSize.xs, fontWeight: '800' },
});