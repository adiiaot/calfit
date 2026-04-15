import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, fontSize } from '../../../theme';
import { LeaderboardCategory } from '../services/LeaderboardService';

interface Props {
  theme: typeof colors.dark;
  rank: number;
  totalScore: number;
  streakCount: number;
  totalWorkouts: number;
  referralCount: number;
  activeCategory: LeaderboardCategory;
  onRefresh: () => void;
}

export function MyRankCard({
  theme,
  rank,
  totalScore,
  streakCount,
  totalWorkouts,
  referralCount,
  activeCategory,
  onRefresh,
}: Props) {
  const primaryValue = {
    overall:   `#${rank}`,
    streaks:   `${streakCount}🔥`,
    workouts:  `${totalWorkouts}`,
    referrals: `${referralCount}`,
  }[activeCategory];

  const primaryLabel = {
    overall:   'Your Rank',
    streaks:   'Your Streak',
    workouts:  'Your Workouts',
    referrals: 'Your Referrals',
  }[activeCategory];

  return (
    <View style={[styles.container, {
      backgroundColor: theme.accentDim as string,
      borderColor: theme.accent,
    }]}>
      <View style={styles.left}>
        <Text style={[styles.label, { color: theme.accent }]}>Your Position</Text>
        <Text style={[styles.rank, { color: theme.textPrimary }]}>{primaryValue}</Text>
        <Text style={[styles.sublabel, { color: theme.textMuted }]}>{primaryLabel}</Text>
      </View>

      <View style={styles.stats}>
        {[
          { icon: 'flame-outline',    value: streakCount,    label: 'Streak',   color: theme.orange },
          { icon: 'barbell-outline',  value: totalWorkouts,  label: 'Workouts', color: theme.accentSecond },
          { icon: 'people-outline',   value: referralCount,  label: 'Referrals',color: theme.gold },
        ].map((s) => (
          <View key={s.label} style={styles.statItem}>
            <Ionicons name={s.icon as any} size={14} color={s.color} />
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>{s.label}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        onPress={onRefresh}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="refresh-outline" size={20} color={theme.accent} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 2,
    gap: spacing.md,
  },
  left: { alignItems: 'center', minWidth: 60 },
  label: { fontSize: fontSize.xs, fontWeight: '700', textTransform: 'uppercase' },
  rank: { fontSize: 28, fontWeight: '900', marginTop: 2 },
  sublabel: { fontSize: 9, marginTop: 2 },
  stats: { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center', gap: 2 },
  statValue: { fontSize: fontSize.base, fontWeight: '800' },
  statLabel: { fontSize: 9 },
});