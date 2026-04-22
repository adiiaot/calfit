import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { AndroidSafeView } from '../../modules/shared/AndriodSafeView';
import { useNavigation } from '@react-navigation/native';
import { useState, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, radius, fontSize } from '../../theme';
import { BodyMeasurements } from './BodyMeasurementScreen';



// ── TYPE DEFINITIONS ─────────────────────────────────────────
type WorkoutSession = {
  name: string;
  calories_burned: number;
  completed_at: string;
};

type ProgressStats = {
  daysTracked: number;
  workoutsDone: number;
  avgSleep: number;
  waterGoalDays: number;
  avgSteps: number;
  activeDays: number;
  totalCaloriesBurned: number;
  totalFoodLogs: number;
};

// ── PERIOD TABS ──────────────────────────────────────────────
function PeriodTabs({
  theme,
  active,
  onSelect,
}: {
  theme: typeof colors.dark;
  active: string;
  onSelect: (p: string) => void;
}) {
  const periods = ['Week', 'Month', '3 Months', 'Year'];
  return (
    <View style={[styles.periodTabs, { borderBottomColor: theme.border }]}>
      {periods.map((p) => (
        <TouchableOpacity
          key={p}
          onPress={() => onSelect(p)}
          style={[
            styles.periodTab,
            active === p && { borderBottomColor: theme.accent },
          ]}
        >
          <Text style={[
            styles.periodTabText,
            { color: active === p ? theme.textPrimary : theme.textMuted },
            active === p && { fontWeight: '700' },
          ]}>
            {p}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── WEIGHT CARD ──────────────────────────────────────────────
function WeightCard({ theme, currentWeight, targetWeight }: {
  theme: typeof colors.dark;
  currentWeight: number | null;
  targetWeight: number | null;
}) {
  if (!currentWeight) {
    return (
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>Weight</Text>
        <View style={styles.emptyState}>
          <Ionicons name="scale-outline" size={32} color={theme.textMuted} />
          <Text style={[styles.emptyStateText, { color: theme.textMuted }]}>
            No weight data yet. Update your body stats in Settings → Edit Profile.
          </Text>
        </View>
      </View>
    );
  }

  const diff = targetWeight ? currentWeight - targetWeight : null;
  const isOnTrack = diff !== null && diff <= 5;

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>Weight</Text>
      <View style={styles.weightRow}>
        <View>
          <Text style={[styles.chartValue, { color: theme.textPrimary }]}>
            {currentWeight} kg
          </Text>
          {diff !== null && (
            <View style={styles.changeRow}>
              <Ionicons
                name={diff > 0 ? 'arrow-down' : 'arrow-up'}
                size={14}
                color={theme.accent}
              />
              <Text style={[styles.changeText, { color: theme.accent }]}>
                {Math.abs(diff).toFixed(1)}kg {diff > 0 ? 'to lose' : 'to gain'} to reach goal
              </Text>
            </View>
          )}
        </View>
        {targetWeight && (
          <View style={[styles.goalBadge, {
            backgroundColor: theme.accentDim as string,
            borderColor: theme.accent,
          }]}>
            <Text style={[styles.goalBadgeLabel, { color: theme.textMuted }]}>Goal</Text>
            <Text style={[styles.goalBadgeValue, { color: theme.accent }]}>
              {targetWeight} kg
            </Text>
          </View>
        )}
      </View>
      {diff !== null && targetWeight && (
        <>
          <View style={[styles.progressBarBg, { backgroundColor: theme.border }]}>
            <View style={[styles.progressBarFill, {
              backgroundColor: theme.accent,
              width: `${Math.min(Math.max((1 - diff / (currentWeight - targetWeight + 0.01)) * 100, 0), 100)}%` as any,
            }]} />
          </View>
          <Text style={[styles.progressNote, { color: theme.textMuted }]}>
            {isOnTrack ? 'Almost there! 🎯' : `${diff.toFixed(1)}kg remaining to goal`}
          </Text>
        </>
      )}
    </View>
  );
}

// ── STATS GRID ───────────────────────────────────────────────
function StatsGrid({ theme, stats }: {
  theme: typeof colors.dark;
  stats: ProgressStats;
}) {
  const hasAnyData =
    stats.daysTracked > 0 ||
    stats.workoutsDone > 0 ||
    stats.totalFoodLogs > 0;

  if (!hasAnyData) {
    return (
      <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Ionicons name="bar-chart-outline" size={36} color={theme.textMuted} />
        <Text style={[styles.emptyCardTitle, { color: theme.textPrimary }]}>
          No activity yet
        </Text>
        <Text style={[styles.emptyCardSub, { color: theme.textMuted }]}>
          Complete workouts, log meals, and track water to see your stats here.
        </Text>
      </View>
    );
  }

  const items = [
    { label: 'Days Tracked',  value: `${stats.daysTracked}`,        icon: 'calendar-outline',   color: theme.accent },
    { label: 'Workouts Done', value: `${stats.workoutsDone}`,        icon: 'barbell-outline',    color: theme.accentSecond },
    { label: 'Avg Sleep',     value: stats.avgSleep > 0 ? `${stats.avgSleep}h` : '—', icon: 'moon-outline', color: (theme as any).purple },
    { label: 'Water Days',    value: `${stats.waterGoalDays}`,       icon: 'water-outline',      color: theme.accentSecond },
    { label: 'Cal Burned',    value: `${stats.totalCaloriesBurned}`, icon: 'flame-outline',      color: (theme as any).orange },
    { label: 'Meals Logged',  value: `${stats.totalFoodLogs}`,       icon: 'restaurant-outline', color: (theme as any).gold },
  ];

  return (
    <View style={styles.statsGrid}>
      {items.map((s) => (
        <View key={s.label} style={[styles.statCard, {
          backgroundColor: theme.card,
          borderColor: theme.border,
        }]}>
          <View style={[styles.statIconWrap, { backgroundColor: s.color + '22' }]}>
            <Ionicons name={s.icon as any} size={18} color={s.color} />
          </View>
          <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
          <Text style={[styles.statLabel, { color: theme.textMuted }]}>{s.label}</Text>
        </View>
      ))}
    </View>
  );
}

// ── STREAK PROGRESS ──────────────────────────────────────────
function StreakProgress({ theme, streakCount }: {
  theme: typeof colors.dark;
  streakCount: number;
}) {
  if (streakCount === 0) {
    return (
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>Streak Progress</Text>
        <View style={styles.emptyState}>
          <Ionicons name="flame-outline" size={32} color={theme.textMuted} />
          <Text style={[styles.emptyStateText, { color: theme.textMuted }]}>
            No streak yet. Check in daily from the Streaks screen to start your streak.
          </Text>
        </View>
      </View>
    );
  }

  const nextMilestone = [7, 14, 30, 60, 90, 180].find((m) => m > streakCount) ?? 180;
  const prevMilestone = [0, 7, 14, 30, 60, 90].reverse().find((m) => m <= streakCount) ?? 0;
  const pct = Math.round(
    ((streakCount - prevMilestone) / (nextMilestone - prevMilestone)) * 100
  );

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>Streak Progress</Text>
      <Text style={[styles.chartValue, { color: theme.textPrimary }]}>
        {streakCount} day streak 🔥
      </Text>
      <Text style={[styles.streakSub, { color: theme.textSecondary }]}>
        Next milestone: {nextMilestone} days — {nextMilestone - streakCount} days to go
      </Text>
      <View style={[styles.progressBarBg, { backgroundColor: theme.border }]}>
        <View style={[styles.progressBarFill, {
          backgroundColor: theme.accent,
          width: `${pct}%` as any,
        }]} />
      </View>
      <Text style={[styles.streakPct, { color: theme.accent }]}>{pct}%</Text>
    </View>
  );
}

// ── WORKOUT SUMMARY ───────────────────────────────────────────
function WorkoutSummary({ theme, sessions }: {
  theme: typeof colors.dark;
  sessions: WorkoutSession[];
}) {
  if (sessions.length === 0) {
    return (
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>Recent Workouts</Text>
        <View style={styles.emptyState}>
          <Ionicons name="barbell-outline" size={32} color={theme.textMuted} />
          <Text style={[styles.emptyStateText, { color: theme.textMuted }]}>
            No workouts yet. Head to the Activity tab to complete your first session.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>Recent Workouts</Text>
      {sessions.slice(0, 5).map((s, i) => (
        <View key={i} style={[styles.workoutRow, { borderBottomColor: theme.border }]}>
          <View style={[styles.workoutIcon, { backgroundColor: theme.accentDim as string }]}>
            <Ionicons name="barbell-outline" size={16} color={theme.accent} />
          </View>
          <View style={styles.workoutInfo}>
            <Text style={[styles.workoutName, { color: theme.textPrimary }]}>{s.name}</Text>
            <Text style={[styles.workoutDate, { color: theme.textMuted }]}>
              {new Date(s.completed_at).toLocaleDateString('en-GB', {
                weekday: 'short', day: 'numeric', month: 'short',
              })}
            </Text>
          </View>
          <View style={[styles.workoutCalBadge, { backgroundColor: theme.accentDim as string }]}>
            <Text style={[styles.workoutCal, { color: theme.accent }]}>
              {s.calories_burned} kcal
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

// ── BODY MEASUREMENTS ────────────────────────────────────────

// ── MAIN SCREEN ──────────────────────────────────────────────
export default function ProgressScreen() {
  const navigation = useNavigation<any>();
  const { colorScheme } = useThemeStore();
  const { user, profile } = useAuthStore();
  const theme = colors[colorScheme];

  const [period, setPeriod] = useState('Month');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [workoutSessions, setWorkoutSessions] = useState<WorkoutSession[]>([]);
  const [stats, setStats] = useState<ProgressStats>({
    daysTracked: 0,
    workoutsDone: 0,
    avgSleep: 0,
    waterGoalDays: 0,
    avgSteps: 0,
    activeDays: 0,
    totalCaloriesBurned: 0,
    totalFoodLogs: 0,
  });

  useFocusEffect(
    useCallback(() => {
      if (user?.id) loadProgressData();
    }, [user?.id, period])
  );

  const getDaysBack = () => {
    if (period === 'Week') return 7;
    if (period === 'Month') return 30;
    if (period === '3 Months') return 90;
    return 365;
  };

  const loadProgressData = async () => {
    if (!user?.id) return;
    try {
      const { supabase } = await import('../../services/supabase');
      const daysBack = getDaysBack();
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - daysBack);
      const fromISO = fromDate.toISOString();

      const [workoutsData, foodData, waterData] = await Promise.all([
        supabase
          .from('workout_sessions')
          .select('name, calories_burned, completed_at, duration_seconds')
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .gte('completed_at', fromISO)
          .order('completed_at', { ascending: false }),

        supabase
          .from('food_logs')
          .select('id, date')
          .eq('user_id', user.id)
          .gte('logged_at', fromISO),

        supabase
          .from('water_logs')
          .select('amount_ml, logged_at')
          .eq('user_id', user.id)
          .gte('logged_at', fromISO),
      ]);

      const workouts = (workoutsData.data ?? []) as WorkoutSession[];
      const foods = (foodData.data ?? []) as any[];
      const waters = (waterData.data ?? []) as any[];

      const foodDates = new Set(foods.map((f) => f.date));

      const waterByDay: Record<string, number> = {};
      waters.forEach((w) => {
        const day = w.logged_at.split('T')[0];
        waterByDay[day] = (waterByDay[day] ?? 0) + w.amount_ml;
      });
      const waterGoalDays = Object.values(waterByDay).filter((v) => v >= 1500).length;

      const totalCaloriesBurned = workouts.reduce(
        (sum, s) => sum + (s.calories_burned ?? 0), 0
      );

      setWorkoutSessions(workouts);
      setStats({
        daysTracked: foodDates.size,
        workoutsDone: workouts.length,
        avgSleep: 0,
        waterGoalDays,
        avgSteps: 0,
        activeDays: Math.max(foodDates.size, workouts.length),
        totalCaloriesBurned,
        totalFoodLogs: foods.length,
      });
    } catch (error) {
      console.error('Failed to load progress data:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadProgressData();
    setIsRefreshing(false);
  };

  return (
    <AndroidSafeView backgroundColor={theme.bg} style={styles.safe}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={26} color={theme.textPrimary} />
          <Text style={[styles.backText, { color: theme.textPrimary }]}>Back</Text>
        </TouchableOpacity>

        <Text style={[styles.pageTitle, { color: theme.textPrimary }]}>My Progress</Text>

        {/* Recap button */}
        <TouchableOpacity
          onPress={() => navigation.navigate('Recap')}
          style={[styles.recapBtn, {
            backgroundColor: theme.accentDim as string,
            borderColor: theme.accent,
          }]}
        >
          <Ionicons name="share-social-outline" size={14} color={theme.accent} />
          <Text style={[styles.recapBtnText, { color: theme.accent }]}>Recap</Text>
        </TouchableOpacity>
      </View>

      <PeriodTabs theme={theme} active={period} onSelect={setPeriod} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.accent}
            colors={[theme.accent]}
          />
        }
      >
        <WeightCard
          theme={theme}
          currentWeight={profile?.current_weight_kg ?? null}
          targetWeight={profile?.target_weight_kg ?? null}
        />

        <StatsGrid theme={theme} stats={stats} />

        <StreakProgress
          theme={theme}
          streakCount={profile?.streak_count ?? 0}
        />

        <WorkoutSummary theme={theme} sessions={workoutSessions} />

<BodyMeasurements theme={theme} userId={user?.id ?? ''} />
      </ScrollView>
    </AndroidSafeView>
  );
}

// ── STYLES ───────────────────────────────────────────────────
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
  recapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  recapBtnText: { fontSize: fontSize.sm, fontWeight: '700' },

  periodTabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: spacing.lg,
  },
  periodTab: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginBottom: -1,
  },
  periodTabText: { fontSize: fontSize.base },

  card: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  cardLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  weightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  chartValue: { fontSize: 26, fontWeight: '800', marginBottom: 4 },
  changeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  changeText: { fontSize: fontSize.sm, fontWeight: '600' },
  goalBadge: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  goalBadgeLabel: { fontSize: fontSize.xs },
  goalBadgeValue: { fontSize: fontSize.xl, fontWeight: '800', marginTop: 2 },
  progressBarBg: { height: 7, borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
  progressBarFill: { height: '100%', borderRadius: 4 },
  progressNote: { fontSize: fontSize.xs },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  statCard: {
    width: '47%',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  statIconWrap: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  statValue: { fontSize: fontSize.lg, fontWeight: '700', marginBottom: 2 },
  statLabel: { fontSize: fontSize.xs },

  streakSub: { fontSize: fontSize.sm, marginTop: 4, marginBottom: spacing.sm },
  streakPct: { fontSize: fontSize.sm, fontWeight: '700', textAlign: 'right', marginTop: 4 },

  workoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  workoutIcon: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  workoutInfo: { flex: 1 },
  workoutName: { fontSize: fontSize.base, fontWeight: '600' },
  workoutDate: { fontSize: fontSize.xs, marginTop: 2 },
  workoutCalBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  workoutCal: { fontSize: fontSize.xs, fontWeight: '700' },

  measureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  addMeasureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  addMeasureText: { fontSize: fontSize.sm, fontWeight: '600' },

  emptyState: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  emptyStateText: {
    fontSize: fontSize.sm,
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyCardTitle: { fontSize: fontSize.lg, fontWeight: '700' },
  emptyCardSub: { fontSize: fontSize.sm, textAlign: 'center', lineHeight: 18 },
});