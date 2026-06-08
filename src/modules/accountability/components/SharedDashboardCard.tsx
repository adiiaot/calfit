import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, fontSize } from '../../../theme';

interface Props {
  theme: typeof colors.dark;
  myName: string;
  myStreak: number;
  myCalories: number;
  myCalorieGoal: number;
  myWater: number;
  myWaterGoal: number;
  partnerName: string;
  partnerStreak: number;
}

export function SharedDashboardCard({
  theme,
  myName,
  myStreak,
  myCalories,
  myCalorieGoal,
  myWater,
  myWaterGoal,
  partnerName,
  partnerStreak,
}: Props) {
  const calorieProgress = Math.min(myCalories / myCalorieGoal, 1);
  const waterProgress = Math.min(myWater / myWaterGoal, 1);

  return (
    <View style={[styles.container, {
      backgroundColor: theme.card,
      borderColor: theme.border,
    }]}>
      <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
        Shared Dashboard
      </Text>

      {/* Side by side streaks */}
      <View style={styles.streakRow}>
        <View style={[styles.streakBox, { backgroundColor: theme.amber + '18' }]}>
          <Text style={[styles.streakValue, { color: theme.amber }]}>
            {myStreak}🔥
          </Text>
          <Text style={[styles.streakName, { color: theme.textMuted }]}>{myName}</Text>
        </View>

        <View style={[styles.vs, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.vsText, { color: theme.textMuted }]}>VS</Text>
        </View>

        <View style={[styles.streakBox, { backgroundColor: theme.accentDim as string }]}>
          <Text style={[styles.streakValue, { color: theme.accent }]}>
            {partnerStreak}🔥
          </Text>
          <Text style={[styles.streakName, { color: theme.textMuted }]}>{partnerName}</Text>
        </View>
      </View>

      {/* My progress today */}
      <Text style={[styles.progressTitle, { color: theme.textSecondary }]}>
        Your Progress Today
      </Text>

      <View style={styles.progressItem}>
        <View style={styles.progressLabelRow}>
          <Ionicons name="flame-outline" size={14} color={theme.accent} />
          <Text style={[styles.progressLabel, { color: theme.textPrimary }]}>
            Calories
          </Text>
          <Text style={[styles.progressValue, { color: theme.textMuted }]}>
            {myCalories} / {myCalorieGoal} kcal
          </Text>
        </View>
        <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
          <View style={[styles.progressFill, {
            backgroundColor: theme.accent,
            width: `${calorieProgress * 100}%` as any,
          }]} />
        </View>
      </View>

      <View style={styles.progressItem}>
        <View style={styles.progressLabelRow}>
          <Ionicons name="water-outline" size={14} color='#60A5FA' />
          <Text style={[styles.progressLabel, { color: theme.textPrimary }]}>
            Water
          </Text>
          <Text style={[styles.progressValue, { color: theme.textMuted }]}>
            {myWater}L / {myWaterGoal}L
          </Text>
        </View>
        <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
          <View style={[styles.progressFill, {
            backgroundColor: '#60A5FA',
            width: `${waterProgress * 100}%` as any,
          }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.md,
  },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: '700' },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  streakBox: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.lg,
    alignItems: 'center',
    gap: 4,
  },
  streakValue: { fontSize: fontSize.xxl, fontWeight: '800' },
  streakName: { fontSize: fontSize.xs },
  vs: {
    width: 36, height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  vsText: { fontSize: fontSize.xs, fontWeight: '800' },
  progressTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressItem: { gap: 6 },
  progressLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  progressLabel: { flex: 1, fontSize: fontSize.sm, fontWeight: '600' },
  progressValue: { fontSize: fontSize.xs },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 3 },
});