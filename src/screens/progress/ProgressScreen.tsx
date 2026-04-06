import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { colors, spacing, radius, fontSize } from '../../theme';

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

// ── WEIGHT CHART ─────────────────────────────────────────────
function WeightChart({ theme }: { theme: typeof colors.dark }) {
  const bars = [0.75, 0.72, 0.67, 0.63, 0.58, 0.53, 0.48];
  const labels = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7'];

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.chartHeader}>
        <View>
          <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>Weight</Text>
          <Text style={[styles.chartValue, { color: theme.textPrimary }]}>72.4 kg</Text>
          <View style={styles.changeRow}>
            <Ionicons name="arrow-down" size={14} color={theme.accent} />
            <Text style={[styles.changeText, { color: theme.accent }]}>
              2.6kg lost this month
            </Text>
          </View>
        </View>
        <Text style={[styles.chartGoal, { color: theme.textMuted }]}>Goal: 70kg</Text>
      </View>

      {/* Bar chart */}
      <View style={styles.barChart}>
        {bars.map((val, i) => (
          <View key={i} style={styles.barWrap}>
            <View style={styles.barInner}>
              <View style={[styles.bar, {
                height: `${val * 100}%` as any,
                backgroundColor: i === bars.length - 1 ? theme.accent : theme.border,
                opacity: i === bars.length - 1 ? 1 : 0.5,
              }]} />
            </View>
            <Text style={[styles.barLabel, { color: theme.textMuted }]}>
              {labels[i]}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ── STATS GRID ───────────────────────────────────────────────
function StatsGrid({ theme }: { theme: typeof colors.dark }) {
  const stats = [
    { label: 'Days Tracked', value: '28 days', color: theme.accent, icon: 'calendar-outline' },
    { label: 'Workouts Done', value: '14 sessions', color: theme.accentSecond, icon: 'barbell-outline' },
    { label: 'Avg Sleep', value: '7.1 hrs/night', color: theme.purple, icon: 'moon-outline' },
    { label: 'Water Goal Met', value: '22 of 28 days', color: theme.orange, icon: 'water-outline' },
    { label: 'Steps Avg', value: '8,240/day', color: theme.accent, icon: 'footsteps-outline' },
    { label: 'Active Days', value: '24 of 28', color: theme.gold, icon: 'flash-outline' },
  ];

  return (
    <View style={styles.statsGrid}>
      {stats.map((s) => (
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
function StreakProgress({ theme }: { theme: typeof colors.dark }) {
  const pct = 47;
  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>
        Streak Progress
      </Text>
      <Text style={[styles.chartValue, { color: theme.textPrimary }]}>
        14 day streak 🔥
      </Text>
      <Text style={[styles.streakSub, { color: theme.textSecondary }]}>
        Next milestone: 30 days — 16 days to go
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

// ── BODY MEASUREMENTS ────────────────────────────────────────
function BodyMeasurements({ theme }: { theme: typeof colors.dark }) {
  const measurements = [
    { label: 'Chest', before: '98cm', after: '96cm' },
    { label: 'Waist', before: '84cm', after: '80cm' },
    { label: 'Hips', before: '102cm', after: '100cm' },
    { label: 'Arms', before: '36cm', after: '38cm' },
    { label: 'Thighs', before: '58cm', after: '56cm' },
  ];

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.measureHeader}>
        <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>
          Body Measurements
        </Text>
        <TouchableOpacity style={[styles.addMeasureBtn, {
          borderColor: theme.accent,
        }]}>
          <Ionicons name="add" size={14} color={theme.accent} />
          <Text style={[styles.addMeasureText, { color: theme.accent }]}>Log</Text>
        </TouchableOpacity>
      </View>
      {measurements.map((m) => (
        <View key={m.label} style={[styles.measureRow, { borderBottomColor: theme.border }]}>
          <Text style={[styles.measureLabel, { color: theme.textSecondary }]}>
            {m.label}
          </Text>
          <Text style={[styles.measureBefore, { color: theme.textMuted }]}>
            {m.before}
          </Text>
          <Ionicons name="arrow-forward" size={14} color={theme.accent} />
          <Text style={[styles.measureAfter, { color: theme.accent }]}>
            {m.after}
          </Text>
        </View>
      ))}
    </View>
  );
}

// ── MAIN SCREEN ──────────────────────────────────────────────
export default function ProgressScreen() {
  const navigation = useNavigation<any>();
  const { colorScheme } = useThemeStore();
  const theme = colors[colorScheme];
  const [period, setPeriod] = useState('Month');

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
            Settings
          </Text>
        </TouchableOpacity>
        <Text style={[styles.pageTitle, { color: theme.textPrimary }]}>
          My Progress
        </Text>
        <View style={styles.backPlaceholder} />
      </View>

      <PeriodTabs theme={theme} active={period} onSelect={setPeriod} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <WeightChart theme={theme} />
        <StatsGrid theme={theme} />
        <StreakProgress theme={theme} />
        <BodyMeasurements theme={theme} />
      </ScrollView>
    </SafeAreaView>
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
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  backText: {
    fontSize: fontSize.lg,
    fontWeight: '400',
  },
  backPlaceholder: {
    width: 80,
  },
  pageTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  
  // Period tabs
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

  // Cards
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
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Weight chart
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  chartValue: { fontSize: 26, fontWeight: '800', marginTop: 4 },
  changeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  changeText: { fontSize: fontSize.sm, fontWeight: '600' },
  chartGoal: { fontSize: fontSize.sm },

  // Bar chart
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 80,
    gap: spacing.xs,
  },
  barWrap: {
    flex: 1, alignItems: 'center',
    gap: 4, height: '100%',
    justifyContent: 'flex-end',
  },
  barInner: { flex: 1, width: '100%', justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 4 },
  barLabel: { fontSize: 9 },

  // Stats grid
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

  // Streak progress
  streakSub: { fontSize: fontSize.sm, marginTop: 4, marginBottom: spacing.sm },
  progressBarBg: { height: 7, borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },
  streakPct: { fontSize: fontSize.sm, fontWeight: '700', textAlign: 'right', marginTop: 4 },

  // Measurements
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
  measureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    gap: spacing.sm,
  },
  measureLabel: { flex: 1, fontSize: fontSize.base, fontWeight: '600' },
  measureBefore: { fontSize: fontSize.base },
  measureAfter: { fontSize: fontSize.base, fontWeight: '700' },
});