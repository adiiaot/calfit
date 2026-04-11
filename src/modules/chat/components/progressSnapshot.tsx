import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius, fontSize } from '../../../theme';
import { UserAvatar } from '../../shared/UserAvatar';

interface Props {
  theme: typeof colors.dark;
  name: string;
  calfitId: string;
  goal: string;
  streakCount: number;
  avatarUrl?: string | null;
}

export function ProgressSnapshot({
  theme,
  name,
  calfitId,
  goal,
  streakCount,
  avatarUrl,
}: Props) {
  return (
    <View style={[styles.container, {
      backgroundColor: theme.card,
      borderColor: theme.border,
    }]}>
      <UserAvatar uri={avatarUrl} name={name} size={44} theme={theme} />
      <View style={styles.info}>
        <Text style={[styles.name, { color: theme.textPrimary }]}>{name}</Text>
        <Text style={[styles.id, { color: theme.textMuted }]}>@{calfitId}</Text>
      </View>
      <View style={styles.stats}>
        <View style={[styles.stat, { backgroundColor: theme.orange + '18' }]}>
          <Text style={[styles.statValue, { color: theme.orange }]}>
            {streakCount}🔥
          </Text>
          <Text style={[styles.statLabel, { color: theme.textMuted }]}>Streak</Text>
        </View>
        <View style={[styles.stat, { backgroundColor: theme.accentDim as string }]}>
          <Text
            style={[styles.statValue, { color: theme.accent }]}
            numberOfLines={1}
          >
            {goal || 'Active'}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textMuted }]}>Goal</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  info: { flex: 1 },
  name: { fontSize: fontSize.base, fontWeight: '700' },
  id: { fontSize: fontSize.xs, marginTop: 2 },
  stats: { flexDirection: 'row', gap: spacing.xs },
  stat: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    alignItems: 'center',
    minWidth: 56,
  },
  statValue: { fontSize: fontSize.sm, fontWeight: '800' },
  statLabel: { fontSize: 9, marginTop: 1 },
});