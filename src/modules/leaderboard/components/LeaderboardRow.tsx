import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, radius, fontSize } from '../../../theme';
import { UserAvatar } from '../../shared/UserAvatar';
import { RankBadge } from './RankBadge';
import { LeaderboardEntry, LeaderboardCategory } from '../services/LeaderboardService';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
  entry: LeaderboardEntry;
  theme: typeof colors.dark;
  activeCategory: LeaderboardCategory;
  onPress?: () => void;
}

export function LeaderboardRow({ entry, theme, activeCategory, onPress }: Props) {
  // CHANGED: Added steps and calorie_consistency to the value/color maps
  const primaryValue: Record<LeaderboardCategory, string> = {
    overall:             `${entry.total_score} pts`,
    streaks:             `${entry.streak_count}🔥`,
    workouts:            `${entry.total_workouts} workouts`,
    referrals:           `${entry.referral_count} referrals`,
    steps:               `${(entry.step_count ?? entry.total_score).toLocaleString()} steps`,
    calorie_consistency: `${entry.calorie_consistency_days ?? entry.total_score} days`,
  };

  const primaryColor: Record<LeaderboardCategory, string> = {
    overall:             theme.accent,
    streaks:             (theme as any).orange,
    workouts:            theme.accentSecond,
    referrals:           (theme as any).gold,
    steps:               theme.accent,
    calorie_consistency: theme.accentSecond,
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.container, {
        backgroundColor: entry.isCurrentUser ? theme.accentDim as string : theme.card,
        borderColor: entry.isCurrentUser ? theme.accent : theme.border,
        borderWidth: entry.isCurrentUser ? 2 : 1,
      }]}
    >
      <RankBadge rank={entry.rank} theme={theme} />
      <UserAvatar uri={entry.avatar_url} name={entry.full_name} size={40} theme={theme} />
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: theme.textPrimary }]}>
            {entry.full_name}
          </Text>
          {entry.isCurrentUser && (
            <Text style={[styles.youTag, { color: theme.accent }]}> · You</Text>
          )}
        </View>
        <Text style={[styles.handle, { color: theme.textMuted }]}>@{entry.calfit_id}</Text>
        <Text style={[styles.goal, { color: theme.textMuted }]}>🎯 {entry.goal}</Text>
      </View>
      <View style={[styles.scoreWrap, { backgroundColor: primaryColor[activeCategory] + '18' }]}>
        <Text style={[styles.scoreValue, { color: primaryColor[activeCategory] }]}>
          {primaryValue[activeCategory]}
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
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  name: { fontSize: fontSize.base, fontWeight: '700' },
  youTag: { fontSize: fontSize.sm, fontWeight: '600' },
  handle: { fontSize: fontSize.xs, marginTop: 1 },
  goal: { fontSize: fontSize.xs, marginTop: 2 },
  scoreWrap: {
    padding: spacing.sm,
    borderRadius: radius.sm,
    alignItems: 'center',
    minWidth: 72,
  },
  scoreValue: { fontSize: fontSize.sm, fontWeight: '800', textAlign: 'center' },
});